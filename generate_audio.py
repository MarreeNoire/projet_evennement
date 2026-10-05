import numpy as np
import wave

sample_rate = 44100
duration = 15.0  # seconds
total_samples = int(sample_rate * duration)

audio = np.zeros(total_samples, dtype=np.float32)

def add_kick(start_time, decay=0.28, freq=150):
    idx_start = int(start_time * sample_rate)
    length = int(decay * sample_rate)
    if idx_start >= total_samples:
        return
    idx_end = min(idx_start + length, total_samples)
    l = idx_end - idx_start
    t_local = np.linspace(0, l / sample_rate, l, endpoint=False)
    f_env = freq * np.exp(-t_local * 28) + 42
    phase = 2 * np.pi * np.cumsum(f_env) / sample_rate
    env = np.exp(-t_local * (1.0 / decay) * 4.2)
    kick = np.sin(phase) * env * 0.8
    audio[idx_start:idx_end] += kick

def add_snare(start_time, decay=0.22):
    idx_start = int(start_time * sample_rate)
    length = int(decay * sample_rate)
    if idx_start >= total_samples:
        return
    idx_end = min(idx_start + length, total_samples)
    l = idx_end - idx_start
    t_local = np.linspace(0, l / sample_rate, l, endpoint=False)
    noise = np.random.uniform(-1, 1, l) * np.exp(-t_local * 20)
    tone = np.sin(2 * np.pi * 210 * t_local) * np.exp(-t_local * 30)
    snare = (noise * 0.6 + tone * 0.35) * 0.55
    audio[idx_start:idx_end] += snare

def add_hihat(start_time, decay=0.045):
    idx_start = int(start_time * sample_rate)
    length = int(decay * sample_rate)
    if idx_start >= total_samples:
        return
    idx_end = min(idx_start + length, total_samples)
    l = idx_end - idx_start
    t_local = np.linspace(0, l / sample_rate, l, endpoint=False)
    noise = np.random.uniform(-1, 1, l) * np.exp(-t_local * 85)
    audio[idx_start:idx_end] += noise * 0.18

def add_riser(start_time, length_sec=1.2, f_start=80, f_end=900):
    idx_start = int(start_time * sample_rate)
    length = int(length_sec * sample_rate)
    if idx_start >= total_samples:
        return
    idx_end = min(idx_start + length, total_samples)
    l = idx_end - idx_start
    t_local = np.linspace(0, l / sample_rate, l, endpoint=False)
    f_env = np.geomspace(max(10, f_start), f_end, l)
    phase = 2 * np.pi * np.cumsum(f_env) / sample_rate
    env = np.linspace(0.01, 0.45, l) ** 2
    audio[idx_start:idx_end] += np.sin(phase) * env

def add_impact(start_time, length_sec=1.4, amp=0.7):
    idx_start = int(start_time * sample_rate)
    length = int(length_sec * sample_rate)
    if idx_start >= total_samples:
        return
    idx_end = min(idx_start + length, total_samples)
    l = idx_end - idx_start
    t_local = np.linspace(0, l / sample_rate, l, endpoint=False)
    sub = np.sin(2 * np.pi * 50 * t_local) * np.exp(-t_local * 2.8)
    noise = np.random.uniform(-1, 1, l) * np.exp(-t_local * 14) * 0.35
    audio[idx_start:idx_end] += (sub * 0.75 + noise) * amp

def add_synth_chord(start_time, duration_sec, freqs, amp=0.2):
    idx_start = int(start_time * sample_rate)
    length = int(duration_sec * sample_rate)
    if idx_start >= total_samples:
        return
    idx_end = min(idx_start + length, total_samples)
    l = idx_end - idx_start
    t_local = np.linspace(0, l / sample_rate, l, endpoint=False)
    chord = np.zeros(l)
    for f in freqs:
        chord += np.sin(2 * np.pi * f * t_local)
        chord += 0.35 * np.sin(2 * np.pi * f * 2 * t_local)
    env = np.minimum(t_local * 12, 1.0) * np.exp(-t_local * (2.2 / duration_sec))
    audio[idx_start:idx_end] += chord * env * amp

def add_laser_sweep(start_time, length_sec=0.35):
    idx_start = int(start_time * sample_rate)
    length = int(length_sec * sample_rate)
    if idx_start >= total_samples:
        return
    idx_end = min(idx_start + length, total_samples)
    l = idx_end - idx_start
    t_local = np.linspace(0, l / sample_rate, l, endpoint=False)
    f_env = 2400 * np.exp(-t_local * 12) + 400
    phase = 2 * np.pi * np.cumsum(f_env) / sample_rate
    env = np.sin(np.pi * (t_local / length_sec))
    audio[idx_start:idx_end] += np.sin(phase) * env * 0.3

# --- SEQUENCE DESIGN ---
# 0.0s: Ambient opening impact
add_impact(0.0, 1.2, 0.6)
add_riser(0.6, 1.3, 70, 500)

# 2.0s: Logo Lock & shockwave
add_impact(2.0, 1.4, 0.85)
add_synth_chord(2.0, 1.4, [220, 277.18, 329.63, 440]) # A major

# 3.2s: Ticket Swoosh
add_riser(2.6, 0.6, 120, 650)
add_impact(3.2, 1.2, 0.7)
add_synth_chord(3.2, 1.5, [196, 246.94, 293.66, 392]) # G major

# 4.8s - 5.4s: Laser scanner sweep sound
add_laser_sweep(4.8)
add_laser_sweep(5.2)

# 6.0s: Ticket Stamp & Tear impact
add_impact(6.0, 1.0, 0.8)
add_snare(6.0, 0.3)

# 6.8s: Scene 3 (App & Salons)
add_riser(6.3, 0.5, 100, 750)
add_impact(6.8, 1.4, 0.8)
add_synth_chord(6.8, 1.8, [220, 261.63, 329.63, 440]) # A minor

# Rhythmic drive from 2.0s to 13.0s
bpm = 124
beat_len = 60.0 / bpm
for b in range(4, 27):
    cur_t = b * beat_len
    add_kick(cur_t)
    add_hihat(cur_t + beat_len * 0.25)
    add_hihat(cur_t + beat_len * 0.5)
    add_hihat(cur_t + beat_len * 0.75)
    if b % 2 == 1:
        add_snare(cur_t)

# 11.0s: Kinetic cuts sequence (Strobes)
add_impact(11.0, 0.8, 0.75)
add_synth_chord(11.0, 0.7, [246.94, 311.13, 370.0])
add_impact(11.7, 0.8, 0.75)
add_synth_chord(11.7, 0.7, [220, 277.18, 329.63])
add_impact(12.4, 0.8, 0.75)
add_synth_chord(12.4, 0.8, [261.63, 329.63, 392.0])

# 13.2s: Finale Climax
add_riser(12.6, 0.6, 90, 1100)
add_impact(13.2, 1.8, 0.9)
add_synth_chord(13.2, 1.8, [164.81, 220, 277.18, 329.63, 440], amp=0.3)

# Final normalization
max_val = np.max(np.abs(audio))
if max_val > 0.95:
    audio = audio / max_val * 0.95

# Fade out last 0.3s
fade_len = int(0.3 * sample_rate)
fade_env = np.linspace(1.0, 0.0, fade_len)
audio[-fade_len:] *= fade_env

audio_int16 = (audio * 32767).astype(np.int16)
with wave.open("audio_track.wav", "w") as wav_file:
    wav_file.setnchannels(1)
    wav_file.setsampwidth(2)
    wav_file.setframerate(sample_rate)
    wav_file.writeframes(audio_int16.tobytes())

print("Audio track re-generated with laser & stamp SFX!")
