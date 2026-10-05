#!/usr/bin/env python3
"""
Motion Graphics Showreel for Event App
Created with MoviePy - 15 seconds, 16:9 aspect ratio
"""

from moviepy import VideoClip, ColorClip, TextClip, CompositeVideoClip
import numpy as np

# Configuration
WIDTH, HEIGHT = 1920, 1080  # 16:9
DURATION = 15.0  # seconds
FPS = 30

# Color palette from the app's CSS
COLORS = {
    'primary': np.array([135, 77, 61]) / 255.0,  # #874d3d (brand-700)
    'primary_dark': np.array([77, 44, 38]) / 255.0,  # #4d2c26 (brand-800)
    'accent': np.array([77, 68, 52]) / 255.0,  # #4d4434 (gold-700)
    'stone_light': np.array([123, 110, 98]) / 255.0,  # #7b6e62 (stone-500)
    'stone_dark': np.array([33, 31, 29]) / 255.0,  # #211f1d (stone-900)
    'bg': np.array([228, 221, 209]) / 255.0,  # #e4ddd1 (bg)
}

def create_logo_mark():
    """Create the logo mark (two arcs and a square) as a video clip"""
    def make_frame(t):
        # Create a black background (will be made transparent later)
        frame = np.zeros((HEIGHT, WIDTH, 4), dtype=np.uint8)

        # Center coordinates
        cx, cy = WIDTH // 2, HEIGHT // 2

        # Pulsating effect
        pulse = 0.5 + 0.5 * np.sin(2 * np.pi * t * 0.5)  # 0.5 Hz pulse
        base_radius = 100
        radius = int(base_radius * (0.8 + 0.2 * pulse))

        # Draw two arcs (simplified as ellipses)
        # Left arc
        left_center = (cx - 80, cy)
        # Right arc
        right_center = (cx + 80, cy)

        # For simplicity, we'll draw circles that represent the logo concept
        # In a full implementation, we'd use proper path drawing

        # Draw background circle (this would be transparent in final)
        # For now, let's create a visual representation

        # Convert to RGB for display (ignoring alpha for now)
        rgb_frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)

        # Draw two arcs as colored shapes
        color_rgb = (COLORS['primary'] * 255).astype(int)

        # Simple representation: two rectangles and a square
        # Left arc approximation
        left_rect_width, left_rect_height = 20, 120
        left_x1 = cx - 80 - left_rect_width//2
        left_y1 = cy - left_rect_height//2
        left_x2 = left_x1 + left_rect_width
        left_y2 = left_y1 + left_rect_height

        # Right arc approximation
        right_x1 = cx + 80 - left_rect_width//2
        right_y1 = cy - left_rect_height//2
        right_x2 = right_x1 + left_rect_width
        right_y2 = right_y1 + left_rect_height

        # Square in middle
        square_size = 80
        square_x1 = cx - square_size//2
        square_y1 = cy - square_size//2
        square_x2 = square_x1 + square_size
        square_y2 = square_y1 + square_size

        # Draw the shapes
        if left_y1 >= 0 and left_y2 < HEIGHT and left_x1 >= 0 and left_x2 < WIDTH:
            rgb_frame[left_y1:left_y2, left_x1:left_x2] = color_rgb

        if right_y1 >= 0 and right_y2 < HEIGHT and right_x1 >= 0 and right_x2 < WIDTH:
            rgb_frame[right_y1:right_y2, right_x1:right_x2] = color_rgb

        if square_y1 >= 0 and square_y2 < HEIGHT and square_x1 >= 0 and square_x2 < WIDTH:
            rgb_frame[square_y1:square_y2, square_x1:square_x2] = color_rgb

        # Apply pulse to intensity
        frame_rgb = (rgb_frame * pulse).astype(np.uint8)

        # Add alpha channel (fully opaque for now)
        alpha = np.full((HEIGHT, WIDTH), 255, dtype=np.uint8)
        frame = np.dstack((frame_rgb, alpha))

        return frame

    return VideoClip(make_frame, duration=DURATION, is_mask=True)

def create_background():
    """Create animated background"""
    def make_frame(t):
        # Create gradient background
        frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)

        # Animate background color slowly
        phase = t * 0.1  # Slow color shift

        for y in range(HEIGHT):
            # Vertical gradient from bg to slightly darker
            ratio = y / HEIGHT
            base_color = COLORS['bg']
            # Add subtle animation
            wave = 0.02 * np.sin(2 * np.pi * (ratio + phase))
            color = base_color * (0.9 + wave)
            frame[y, :] = (color * 255).astype(np.uint8)

        return frame

    return VideoClip(make_frame, duration=DURATION)

def create_text_clip(text, fontsize, color, position, duration, start_time=0):
    """Create a text clip with fade in/out"""
    # Convert color to string if it's an array
    if isinstance(color, np.ndarray):
        color = "#{:02x}{:02x}{:02x}".format(
            int(color[0]*255), int(color[1]*255), int(color[2]*255)
        )

    txt_clip = TextClip(text=text, font_size=fontsize, color=color, font='Arial-Bold')
    txt_clip = txt_clip.with_position(position).with_duration(duration).with_start(start_time)

    # Add fade in and out using crossfadein/out if available, otherwise just use the clip
    try:
        from moviepy.video.fx import FadeIn, FadeOut
        txt_clip = txt_clip.with_effects([FadeIn(0.5), FadeOut(0.5)])
    except:
        # If effects don't work, just use the clip as is
        pass

    return txt_clip

def main():
    print("Creating motion graphics showreel...")

    # Create background
    bg = create_background()

    # Create animated elements
    clips = [bg]

    # Add title
    title = create_text_clip(
        "Event App",
        fontsize=120,
        color='white',
        position=('center', HEIGHT//3),
        duration=DURATION,
        start_time=0
    )
    clips.append(title)

    # Add subtitle
    subtitle = create_text_clip(
        "Motion Graphics Showreel",
        fontsize=60,
        color='#cccccc',
        position=('center', HEIGHT//2),
        duration=DURATION,
        start_time=0
    )
    clips.append(subtitle)

    # Add some animated shapes to demonstrate motion skills
    # Creating moving colored bars
    for i in range(3):
        bar_color = [
            [255, 100, 100],  # Reddish
            [100, 255, 100],  # Greenish
            [100, 100, 255]   # Bluish
        ][i]

        def make_bar_frame(t, bar_idx=i, color=bar_color):
            frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)

            # Moving bar
            bar_width = 20
            bar_height = HEIGHT // 2
            x_pos = int((t * 100 + bar_idx * 200) % (WIDTH + 200)) - 100
            y_pos = HEIGHT // 4

            if x_pos + bar_width > 0 and x_pos < WIDTH:
                x1 = max(0, x_pos)
                x2 = min(WIDTH, x_pos + bar_width)
                y1 = max(0, y_pos)
                y2 = min(HEIGHT, y_pos + bar_height)

                if x2 > x1 and y2 > y1:
                    frame[y1:y2, x1:x2] = color

            return frame

        bar_clip = VideoClip(lambda t, i=i: make_bar_frame(t, i), duration=DURATION)
        bar_clip = bar_clip.with_opacity(0.7)
        clips.append(bar_clip)

    # Add timeline indicator
    def make_timeline_frame(t):
        frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)

        # Progress bar at bottom
        progress = t / DURATION
        bar_width = int(WIDTH * progress)
        bar_height = 20
        y_pos = HEIGHT - bar_height - 20

        if bar_width > 0:
            frame[y_pos:y_pos+bar_height, 0:bar_width] = [255, 255, 255]

        return frame

    timeline = VideoClip(make_timeline_frame, duration=DURATION)
    clips.append(timeline)

    # Add footer text
    footer = create_text_clip(
        "Designed with Motion Graphics Principles • 15 Second Showreel",
        fontsize=30,
        color='#888888',
        position=('center', HEIGHT - 50),
        duration=DURATION,
        start_time=0
    )
    clips.append(footer)

    # Composite all clips
    final = CompositeVideoClip(clips, size=(WIDTH, HEIGHT))

    # Add a subtle vignette effect
    def vignette_effect(get_frame, t):
        frame = get_frame(t)
        # Create vignette mask
        y, x = np.ogrid[0:HEIGHT, 0:WIDTH]
        center_x, center_y = WIDTH//2, HEIGHT//2
        dist_from_center = np.sqrt((x - center_x)**2 + (y - center_y)**2)
        max_dist = np.sqrt(WIDTH**2 + HEIGHT**2) / 2
        mask = dist_from_center / max_dist
        vignette = 1.0 - 0.5 * (mask ** 1.5)  # Darken corners
        vignette = np.clip(vignette, 0.5, 1.0)
        vignette = np.stack([vignette, vignette, vignette], axis=2)
        return (frame * vignette).astype(np.uint8)

    final = final.image_transform(vignette_effect)

    # Write the result
    print("Rendering video...")
    final.write_videofile(
        "event_app_showreel.mp4",
        fps=FPS,
        codec='libx264',
        audio_codec='aac',
        temp_audiofile='temp-audio.m4a',
        remove_temp=True,
        preset='medium',
        ffmpeg_params=['-crf', '18']  # High quality
    )

    print("Video rendered successfully: event_app_showreel.mp4")

    # Clean up
    final.close()
    bg.close()
    for clip in clips[1:]:  # Skip bg as we already closed it
        if hasattr(clip, 'close'):
            clip.close()

if __name__ == "__main__":
    main()