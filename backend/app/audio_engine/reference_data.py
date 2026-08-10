"""
AutoAce AI Reference Data & Synthetic Production Audio Generator
Generates PCM WAV files with realistic voice prosody, background noise, speech harmonics,
and ground-truth labels for the 3 production calls and full benchmark evaluation batches.
"""

import os
import io
import wave
import json
import zipfile
import numpy as np
from typing import Dict, List, Tuple


def generate_synthetic_call_audio(
    duration: float = 4.0,
    sr: int = 16000,
    tone: str = "neutral",
    intensity: str = "low",
    noise_type: str = "",
    noise_level: float = 0.0,
    has_overlap: bool = False,
    has_long_silence: bool = False,
    is_impaired: bool = False
) -> bytes:
    """
    Synthesizes realistic human speech prosody with harmonic formants, pitch contours,
    inflections, background noise signatures, and temporal characteristics.
    """
    num_samples = int(duration * sr)
    t = np.linspace(0, duration, num_samples, endpoint=False)

    # 1. Base fundamental frequency (F0) & pitch contour
    if tone == "distressed":
        f0_base = 240.0
        pitch_contour = f0_base + 35.0 * np.sin(2 * np.pi * 3.5 * t) + 20.0 * np.sin(2 * np.pi * 7.0 * t)  # vocal tremor
    elif tone == "upset":
        f0_base = 220.0
        pitch_contour = f0_base + 45.0 * np.sin(2 * np.pi * 1.5 * t)  # elevated sharp pitch
    elif tone == "frustrated":
        f0_base = 190.0
        pitch_contour = f0_base + 28.0 * np.sin(2 * np.pi * 2.2 * t)  # tense spiky contour
    elif tone == "satisfied":
        f0_base = 165.0
        pitch_contour = f0_base + 15.0 * np.sin(2 * np.pi * 0.8 * t)  # gentle melodic contour
    else:  # neutral
        f0_base = 150.0
        pitch_contour = f0_base + 6.0 * np.sin(2 * np.pi * 0.5 * t)   # steady low-variance pitch

    # 2. Synthesize speech harmonics (Formants F1, F2, F3)
    phase = 2 * np.pi * np.cumsum(pitch_contour) / sr
    speech = 0.5 * np.sin(phase) + 0.25 * np.sin(2 * phase) + 0.15 * np.sin(3 * phase) + 0.10 * np.sin(4 * phase)

    # Apply syllabic cadence / amplitude envelope (speech rhythm: ~4-5 syllables per sec)
    syllable_rate = 4.5 if tone in ("frustrated", "upset") else 3.5
    syllable_env = np.clip(np.sin(2 * np.pi * syllable_rate * t) ** 2, 0.05, 1.0)
    speech = speech * syllable_env

    # 3. Handle Long Silence (> 3.0s dead air)
    if has_long_silence:
        # Mute speech from t=0.5 to t=3.8
        silence_mask = (t >= 0.5) & (t <= 3.8)
        speech[silence_mask] = 0.0

    # 4. Handle Speaker Overlap (Secondary speaker talking simultaneously)
    if has_overlap:
        second_f0 = 130.0 + 10.0 * np.sin(2 * np.pi * 1.2 * t)
        second_phase = 2 * np.pi * np.cumsum(second_f0) / sr
        second_speech = 0.35 * (0.6 * np.sin(second_phase) + 0.3 * np.sin(2 * second_phase))
        speech = speech + second_speech

    # 5. Add Background Noise
    noise = np.zeros(num_samples, dtype=np.float32)
    if noise_level > 0.0:
        if noise_type == "office chatter":
            # Diffuse secondary modulated speech & low murmur
            murmur = 0.08 * np.sin(2 * np.pi * 320.0 * t) * np.sin(2 * np.pi * 6.0 * t)
            rand_murmur = np.random.normal(0, 0.04, num_samples)
            noise = murmur + rand_murmur
        elif noise_type == "mechanical noise":
            # 60 Hz hum + harmonic 120 Hz + steady broadband hiss
            hum = 0.12 * np.sin(2 * np.pi * 60.0 * t) + 0.06 * np.sin(2 * np.pi * 120.0 * t)
            noise = hum + np.random.normal(0, 0.03, num_samples)
        elif noise_type == "keyboard typing":
            # Transient sharp bursts
            clicks = np.zeros(num_samples)
            click_times = np.arange(int(0.3 * sr), num_samples, int(0.4 * sr))
            for ct in click_times:
                if ct + 500 < num_samples:
                    clicks[ct:ct + 500] = np.random.normal(0, 0.25, 500) * np.exp(-np.linspace(0, 5, 500))
            noise = clicks
        elif noise_type == "road noise":
            # Low rumble (< 300 Hz)
            rumble = 0.15 * np.sin(2 * np.pi * 80.0 * t) + np.random.normal(0, 0.05, num_samples)
            noise = rumble
        else:
            noise = np.random.normal(0, 0.04, num_samples)

        noise = noise * noise_level

    # 6. Combined audio signal
    audio = speech + noise

    # 7. Apply Audio Impairment (if testing slightly/severely impaired)
    if is_impaired:
        # Clipping distortion + packet dropouts
        audio = np.clip(audio * 3.0, -0.98, 0.98)
        # Dropouts
        for d_start in range(int(1.0 * sr), int(1.2 * sr)):
            if d_start < num_samples:
                audio[d_start] = 0.0

    # Normalize to [-0.95, 0.95]
    max_val = np.max(np.abs(audio))
    if max_val > 1e-6:
        audio = (audio / max_val) * 0.92

    # Encode as 16-bit PCM WAV in-memory
    pcm16 = (audio * 32767).astype(np.int16)
    bio = io.BytesIO()
    with wave.open(bio, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm16.tobytes())

    return bio.getvalue()


def create_reference_dataset_files(output_dir: str):
    """
    Creates reference directory containing the 3 production calls, a comprehensive
    10-call evaluation batch, manifest labels.csv, and pre-built evaluation_batch.zip.
    """
    os.makedirs(output_dir, exist_ok=True)
    batch_dir = os.path.join(output_dir, "evaluation_batch_sample")
    os.makedirs(batch_dir, exist_ok=True)

    # 1. The 3 Primary Labeled Production Calls from PDF
    calls = [
        {
            "name": "call_001.wav",
            "tone": "frustrated",
            "intensity": "medium",
            "noise_present": True,
            "noise_type": "office chatter",
            "noise_severity": "low",
            "noise_level": 0.15,
            "audio_quality": "clear",
            "overlap": False,
            "silence": False,
            "confidence": 0.82,
            "duration": 4.5
        },
        {
            "name": "call_002.mp3",
            "wav_name": "call_002.wav",
            "tone": "neutral",
            "intensity": "low",
            "noise_present": False,
            "noise_type": "",
            "noise_severity": "none",
            "noise_level": 0.0,
            "audio_quality": "clear",
            "overlap": False,
            "silence": False,
            "confidence": 0.91,
            "duration": 4.0
        },
        {
            "name": "call_003.wav",
            "tone": "satisfied",
            "intensity": "medium",
            "noise_present": True,
            "noise_type": "mechanical noise",
            "noise_severity": "low",
            "noise_level": 0.18,
            "audio_quality": "clear",
            "overlap": False,
            "silence": False,
            "confidence": 0.88,
            "duration": 5.0
        },
        # Additional benchmark samples for complete coverage
        {
            "name": "call_004.wav",
            "tone": "upset",
            "intensity": "high",
            "noise_present": False,
            "noise_type": "",
            "noise_severity": "none",
            "noise_level": 0.0,
            "audio_quality": "clear",
            "overlap": False,
            "silence": False,
            "confidence": 0.89,
            "duration": 4.0
        },
        {
            "name": "call_005.wav",
            "tone": "distressed",
            "intensity": "high",
            "noise_present": True,
            "noise_type": "road noise",
            "noise_severity": "medium",
            "noise_level": 0.35,
            "audio_quality": "clear",
            "overlap": False,
            "silence": False,
            "confidence": 0.86,
            "duration": 5.5
        },
        {
            "name": "call_006.wav",
            "tone": "neutral",
            "intensity": "low",
            "noise_present": True,
            "noise_type": "keyboard typing",
            "noise_severity": "low",
            "noise_level": 0.12,
            "audio_quality": "clear",
            "overlap": True,
            "silence": False,
            "confidence": 0.84,
            "duration": 4.2
        },
        {
            "name": "call_007.wav",
            "tone": "frustrated",
            "intensity": "high",
            "noise_present": False,
            "noise_type": "",
            "noise_severity": "none",
            "noise_level": 0.0,
            "audio_quality": "clear",
            "overlap": False,
            "silence": True,
            "confidence": 0.83,
            "duration": 6.0
        },
        {
            "name": "call_008.wav",
            "tone": "neutral",
            "intensity": "low",
            "noise_present": False,
            "noise_type": "",
            "noise_severity": "none",
            "noise_level": 0.0,
            "audio_quality": "slightly_impaired",
            "overlap": False,
            "silence": False,
            "confidence": 0.76,
            "duration": 3.8,
            "is_impaired": True
        }
    ]

    csv_rows = ["name,result_json"]

    for call in calls:
        target_name = call.get("wav_name", call["name"])
        file_path = os.path.join(batch_dir, target_name)
        
        audio_bytes = generate_synthetic_call_audio(
            duration=call["duration"],
            tone=call["tone"],
            intensity=call["intensity"],
            noise_type=call["noise_type"],
            noise_level=call["noise_level"],
            has_overlap=call["overlap"],
            has_long_silence=call["silence"],
            is_impaired=call.get("is_impaired", False)
        )
        with open(file_path, "wb") as f:
            f.write(audio_bytes)

        # Ground truth result_json
        gt_obj = {
            "emotional_tone": call["tone"],
            "emotional_intensity": call["intensity"],
            "background_noise_present": call["noise_present"],
            "background_noise_type": call["noise_type"],
            "background_noise_severity": call["noise_severity"],
            "audio_quality": call["audio_quality"],
            "speaker_overlap_present": call["overlap"],
            "long_silence_present": call["silence"],
            "confidence": call["confidence"]
        }
        json_str = json.dumps(gt_obj).replace('"', '""')
        csv_rows.append(f'{call["name"]},"{json_str}"')

    # Write labels.csv
    labels_csv_path = os.path.join(batch_dir, "labels.csv")
    with open(labels_csv_path, "w", encoding="utf-8") as f:
        f.write("\n".join(csv_rows) + "\n")

    # Create pre-packaged test_batch_sample.zip
    zip_path = os.path.join(output_dir, "test_batch_sample.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(batch_dir):
            for file in files:
                abs_f = os.path.join(root, file)
                rel_f = os.path.relpath(abs_f, batch_dir)
                zf.write(abs_f, rel_f)

    return batch_dir, zip_path
