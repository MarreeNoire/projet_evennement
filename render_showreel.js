const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium } = require('@playwright/test');

(async () => {
  console.log('--- STARTING EVENT MOTION GRAPHICS SHOWREEL RENDER ---');
  const tStart = Date.now();

  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, 'event_motion_showreel.mp4');
  const audioFile = path.join(__dirname, 'audio_track.wav');
  const htmlPath = 'file:///' + path.join(__dirname, 'motion_showreel.html').replace(/\\/g, '/');

  console.log(`Loading HTML engine from: ${htmlPath}`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  await page.goto(htmlPath, { waitUntil: 'networkidle' });
  console.log('Motion graphics engine loaded in headless Chrome.');

  // Test sample frames for quick inspection
  const testFrames = [30, 150, 260, 360, 420];
  for (const f of testFrames) {
    const dataUrl = await page.evaluate((idx) => window.getFrameJPEG(idx), f);
    const buf = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
    fs.writeFileSync(path.join(outputDir, `preview_frame_${f}.jpg`), buf);
  }
  console.log('Saved preview keyframes to output/ directory.');

  // Set up FFmpeg with audio muxing
  const ffmpegArgs = [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', '30',
    '-i', '-',
    '-i', audioFile,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '17',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    '-movflags', '+faststart',
    outputFile
  ];

  console.log(`Spawning FFmpeg to encode 450 frames @ 30fps (15.0s)...`);
  const ffmpeg = spawn('ffmpeg', ffmpegArgs);

  ffmpeg.stderr.on('data', (data) => {
    // console.log(`ffmpeg: ${data}`);
  });

  const TOTAL_FRAMES = 450;
  let lastProgress = 0;

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const dataUrl = await page.evaluate((idx) => window.getFrameJPEG(idx), i);
    const buf = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
    
    // Write JPEG buffer to ffmpeg stdin
    const canContinue = ffmpeg.stdin.write(buf);
    if (!canContinue) {
      await new Promise((resolve) => ffmpeg.stdin.once('drain', resolve));
    }

    const progress = Math.floor((i / TOTAL_FRAMES) * 100);
    if (progress >= lastProgress + 10) {
      lastProgress = progress;
      const elapsed = ((Date.now() - tStart) / 1000).toFixed(1);
      console.log(`Render progress: ${progress}% (frame ${i}/${TOTAL_FRAMES}, ${elapsed}s elapsed)`);
    }
  }

  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
    ffmpeg.on('error', reject);
  });

  await browser.close();

  const totalTime = ((Date.now() - tStart) / 1000).toFixed(1);
  const stats = fs.statSync(outputFile);
  const mbSize = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`\n========================================`);
  console.log(`✓ RENDER COMPLETE!`);
  console.log(`File: ${outputFile}`);
  console.log(`Size: ${mbSize} MB`);
  console.log(`Time: ${totalTime}s`);
  console.log(`========================================\n`);
})();
