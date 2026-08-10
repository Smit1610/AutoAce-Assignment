"""
AutoAce AI Pipeline & Schema Verification Test Suite
Runs unit tests for acoustic feature extraction, classification, schema compliance,
batch parsing, and reference calls.
"""

import os
import sys
import json

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.models.schema import (
    AudioAnalysisResult,
    EmotionalToneEnum,
    EmotionalIntensityEnum,
    BackgroundNoiseSeverityEnum,
    AudioQualityEnum,
)
from backend.app.audio_engine.preprocessor import AudioPreprocessor
from backend.app.audio_engine.feature_extractor import FeatureExtractor
from backend.app.audio_engine.engine import AudioEngine
from backend.app.audio_engine.reference_data import (
    generate_synthetic_call_audio,
    create_reference_dataset_files,
)
from backend.app.audio_engine.evaluator import Evaluator


def test_schema_types():
    print("[1/5] Testing Schema and Enum Validation...")
    # Validate example output from PDF exactly
    sample_json = {
        "emotional_tone": "frustrated",
        "emotional_intensity": "medium",
        "background_noise_present": True,
        "background_noise_type": "office chatter",
        "background_noise_severity": "low",
        "audio_quality": "clear",
        "speaker_overlap_present": False,
        "long_silence_present": False,
        "confidence": 0.82
    }
    result = AudioAnalysisResult(**sample_json)
    assert result.emotional_tone == EmotionalToneEnum.frustrated
    assert result.emotional_intensity == EmotionalIntensityEnum.medium
    assert result.background_noise_present is True
    assert result.background_noise_type == "office chatter"
    assert result.background_noise_severity == BackgroundNoiseSeverityEnum.low
    assert result.audio_quality == AudioQualityEnum.clear
    assert result.speaker_overlap_present is False
    assert result.long_silence_present is False
    assert result.confidence == 0.82
    print("  -> Schema validation passed with 100% precision.")


def test_acoustic_feature_extraction():
    print("[2/5] Testing DSP Feature Extraction...")
    audio_bytes = generate_synthetic_call_audio(
        duration=3.0,
        tone="upset",
        intensity="high",
        noise_type="mechanical noise",
        noise_level=0.20
    )
    samples, sr, dur = AudioPreprocessor.load_audio(audio_bytes, "test.wav")
    assert len(samples) > 0
    assert sr == 16000
    assert abs(dur - 3.0) < 0.1

    features = FeatureExtractor.extract_all_features(samples, sr)
    assert "pitch_f0_mean_hz" in features
    assert "spectral_centroid_hz" in features
    assert "snr_db" in features
    assert "overlap_score" in features
    assert features["pitch_f0_mean_hz"] > 0
    print(f"  -> Extracted features: F0={features['pitch_f0_mean_hz']} Hz, Centroid={features['spectral_centroid_hz']} Hz, SNR={features['snr_db']} dB")


def test_reference_calls():
    print("[3/5] Testing 3 Reference Production Calls...")
    # Call 1: frustrated / medium / office chatter
    c1_bytes = generate_synthetic_call_audio(duration=4.5, tone="frustrated", intensity="medium", noise_type="office chatter", noise_level=0.15)
    r1 = AudioEngine.analyze_audio_bytes(c1_bytes, "call_001.wav")
    assert r1.success
    print(f"  -> Call 1: Tone={r1.result.emotional_tone.value}, Noise={r1.result.background_noise_present} ({r1.result.background_noise_type}), Conf={r1.result.confidence}")

    # Call 2: neutral / low / no noise
    c2_bytes = generate_synthetic_call_audio(duration=4.0, tone="neutral", intensity="low", noise_type="", noise_level=0.0)
    r2 = AudioEngine.analyze_audio_bytes(c2_bytes, "call_002.mp3")
    assert r2.success
    print(f"  -> Call 2: Tone={r2.result.emotional_tone.value}, Noise={r2.result.background_noise_present}, Conf={r2.result.confidence}")

    # Call 3: satisfied / medium / mechanical noise
    c3_bytes = generate_synthetic_call_audio(duration=5.0, tone="satisfied", intensity="medium", noise_type="mechanical noise", noise_level=0.18)
    r3 = AudioEngine.analyze_audio_bytes(c3_bytes, "call_003.wav")
    assert r3.success
    print(f"  -> Call 3: Tone={r3.result.emotional_tone.value}, Noise={r3.result.background_noise_present} ({r3.result.background_noise_type}), Conf={r3.result.confidence}")


def test_reference_dataset_generation():
    print("[4/5] Testing Sample Batch and ZIP Generation...")
    sample_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_data"))
    batch_dir, zip_path = create_reference_dataset_files(sample_dir)
    assert os.path.exists(zip_path)
    assert os.path.exists(os.path.join(batch_dir, "labels.csv"))
    assert os.path.exists(os.path.join(batch_dir, "call_001.wav"))
    print(f"  -> Successfully generated test batch at: {zip_path}")


def test_evaluator_metrics():
    print("[5/5] Testing Confusion Matrix & Macro F1 Metrics...")
    r1 = AudioAnalysisResult(
        emotional_tone=EmotionalToneEnum.frustrated,
        emotional_intensity=EmotionalIntensityEnum.medium,
        background_noise_present=True,
        background_noise_type="office chatter",
        background_noise_severity=BackgroundNoiseSeverityEnum.low,
        audio_quality=AudioQualityEnum.clear,
        speaker_overlap_present=False,
        long_silence_present=False,
        confidence=0.82
    )
    report = Evaluator.evaluate_batch([r1], [r1])
    assert report.total_evaluated == 1
    assert report.overall_accuracy == 1.0
    assert report.overall_macro_f1 == 1.0
    print(f"  -> Overall Accuracy: {report.overall_accuracy * 100}%, Macro F1: {report.overall_macro_f1}")


if __name__ == "__main__":
    print("==================================================")
    print("AutoAce AI Audio System Verification Suite")
    print("==================================================")
    test_schema_types()
    test_acoustic_feature_extraction()
    test_reference_calls()
    test_reference_dataset_generation()
    test_evaluator_metrics()
    print("==================================================")
    print("All tests PASSED successfully!")
    print("==================================================")
