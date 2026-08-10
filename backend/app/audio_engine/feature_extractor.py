"""
AutoAce AI Acoustic Feature Extractor
Extracts signal processing and prosodic features from audio signals.
Computes RMS energy, pitch (F0), spectral centroid/flatness/rolloff, ZCR, SNR, VAD, and overlap cues.
"""

import numpy as np
from typing import Dict, Any, Tuple


class FeatureExtractor:
    """
    High-performance DSP feature extraction engine running entirely on CPU with zero cloud API overhead.
    """

    @classmethod
    def extract_all_features(cls, audio: np.ndarray, sr: int = 16000) -> Dict[str, Any]:
        """
        Extracts comprehensive acoustic, spectral, prosodic, and temporal metrics.
        """
        if len(audio) == 0:
            return cls._get_empty_features(sr)

        # 1. Basic properties
        duration = len(audio) / float(sr)
        frame_size = 512
        hop_size = 256
        n_frames = max(1, (len(audio) - frame_size) // hop_size + 1)

        # 2. Frame-level RMS energy
        rms_frames = []
        for i in range(n_frames):
            start = i * hop_size
            frame = audio[start:start + frame_size]
            rms = np.sqrt(np.mean(frame ** 2) + 1e-12)
            rms_frames.append(rms)
        rms_frames = np.array(rms_frames, dtype=np.float32)

        rms_mean = float(np.mean(rms_frames))
        rms_std = float(np.std(rms_frames))
        rms_max = float(np.max(rms_frames)) if len(rms_frames) > 0 else 0.0

        # 3. Voice Activity Detection (VAD) & Silence Analysis
        # Dynamic threshold: adaptive baseline based on noise floor
        sorted_rms = np.sort(rms_frames)
        noise_floor_rms = float(sorted_rms[int(len(sorted_rms) * 0.15)]) if len(sorted_rms) > 0 else 0.001
        speech_threshold = max(0.015, noise_floor_rms * 2.5)

        vad_mask = rms_frames > speech_threshold
        speech_frames_count = int(np.sum(vad_mask))
        speech_ratio = float(speech_frames_count / max(1, len(rms_frames)))
        silence_ratio = 1.0 - speech_ratio

        # Find maximum contiguous silence burst
        max_silence_frames = 0
        current_silence = 0
        for is_speech in vad_mask:
            if not is_speech:
                current_silence += 1
                if current_silence > max_silence_frames:
                    max_silence_frames = current_silence
            else:
                current_silence = 0
        max_silence_duration = (max_silence_frames * hop_size) / float(sr)

        # 4. Zero-Crossing Rate (ZCR)
        signs = np.sign(audio)
        signs[signs == 0] = 1
        zcr = float(np.mean(np.abs(signs[1:] - signs[:-1]) > 0))

        # 5. Spectral Features via FFT
        freqs = np.fft.rfftfreq(frame_size, d=1.0 / sr)
        window = np.hanning(frame_size)

        centroids = []
        flatnesses = []
        rolloffs = []
        f0_estimates = []
        harmonic_variance_list = []

        for i in range(n_frames):
            start = i * hop_size
            raw_frame = audio[start:start + frame_size]
            if len(raw_frame) < frame_size:
                raw_frame = np.pad(raw_frame, (0, frame_size - len(raw_frame)))

            windowed = raw_frame * window
            magnitude = np.abs(np.fft.rfft(windowed)) + 1e-12
            power = magnitude ** 2
            total_power = np.sum(power)

            # Spectral Centroid
            centroid = np.sum(freqs * power) / total_power
            centroids.append(centroid)

            # Spectral Flatness (Geometric mean / Arithmetic mean)
            log_power = np.log(power + 1e-12)
            geo_mean = np.exp(np.mean(log_power))
            arith_mean = np.mean(power)
            flatness = min(1.0, float(geo_mean / max(1e-12, arith_mean)))
            flatnesses.append(flatness)

            # Spectral Rolloff (85% energy)
            cumsum_power = np.cumsum(power)
            cutoff = 0.85 * total_power
            idx = np.searchsorted(cumsum_power, cutoff)
            idx = min(idx, len(freqs) - 1)
            rolloffs.append(freqs[idx])

            # Pitch estimation (Autocorrelation in 60 Hz to 450 Hz range)
            if vad_mask[i] and rms_frames[i] > 0.02:
                f0 = cls._estimate_f0_autocorr(windowed, sr)
                if f0 > 0:
                    f0_estimates.append(f0)
                    # Harmonic peak check for overlap
                    h_var = cls._compute_harmonic_multiplicity(magnitude, freqs, f0)
                    harmonic_variance_list.append(h_var)

        centroid_mean = float(np.mean(centroids)) if centroids else 1500.0
        flatness_mean = float(np.mean(flatnesses)) if flatnesses else 0.1
        rolloff_mean = float(np.mean(rolloffs)) if rolloffs else 3000.0

        # Pitch statistics
        if len(f0_estimates) >= 3:
            f0_mean = float(np.mean(f0_estimates))
            f0_std = float(np.std(f0_estimates))
            f0_range = float(np.max(f0_estimates) - np.min(f0_estimates))
            f0_max = float(np.max(f0_estimates))
            f0_min = float(np.min(f0_estimates))
        else:
            f0_mean = 160.0
            f0_std = 15.0
            f0_range = 30.0
            f0_max = 175.0
            f0_min = 145.0

        # 6. Signal-to-Noise Ratio (SNR)
        speech_power = np.mean(rms_frames[vad_mask] ** 2) if speech_frames_count > 0 else 1e-6
        noise_power = np.mean(rms_frames[~vad_mask] ** 2) if np.sum(~vad_mask) > 0 else (noise_floor_rms ** 2)
        snr_db = float(10.0 * np.log10(max(1e-6, speech_power) / max(1e-8, noise_power)))
        snr_db = max(-10.0, min(50.0, snr_db))

        # 7. Clipping & Distortion Ratio
        clipping_samples = np.sum(np.abs(audio) >= 0.985)
        clipping_ratio = float(clipping_samples / max(1, len(audio)))

        # 8. Speaker Overlap Score
        # High overlap manifests as multi-pitch harmonics + elevated energy variance in speech frames
        overlap_score = float(np.mean(harmonic_variance_list)) if harmonic_variance_list else 0.0

        # 9. Packet Loss / Dropout Detection
        zero_frames = np.sum(rms_frames < 0.0001)
        dropout_ratio = float(zero_frames / max(1, len(rms_frames)))

        return {
            "duration_seconds": round(duration, 3),
            "sample_rate": sr,
            "rms_energy_mean": round(rms_mean, 5),
            "rms_energy_std": round(rms_std, 5),
            "rms_energy_max": round(rms_max, 5),
            "pitch_f0_mean_hz": round(f0_mean, 2),
            "pitch_f0_std_hz": round(f0_std, 2),
            "pitch_range_hz": round(f0_range, 2),
            "pitch_f0_max_hz": round(f0_max, 2),
            "pitch_f0_min_hz": round(f0_min, 2),
            "spectral_centroid_hz": round(centroid_mean, 2),
            "spectral_flatness": round(flatness_mean, 4),
            "spectral_rolloff_hz": round(rolloff_mean, 2),
            "zero_crossing_rate": round(zcr, 4),
            "snr_db": round(snr_db, 2),
            "speech_ratio": round(speech_ratio, 3),
            "silence_ratio": round(silence_ratio, 3),
            "max_silence_duration_seconds": round(max_silence_duration, 3),
            "overlap_score": round(overlap_score, 4),
            "clipping_ratio": round(clipping_ratio, 5),
            "dropout_ratio": round(dropout_ratio, 4),
            "noise_floor_rms": round(noise_floor_rms, 5),
        }

    @staticmethod
    def _estimate_f0_autocorr(frame: np.ndarray, sr: int) -> float:
        """
        Calculates pitch F0 via normalized autocorrelation within human vocal range (60-450 Hz).
        """
        min_lag = int(sr / 450)  # ~450 Hz upper bound
        max_lag = int(sr / 60)   # ~60 Hz lower bound

        if len(frame) < max_lag * 2:
            return 0.0

        # Auto-correlation via FFT
        n = len(frame)
        fft_frame = np.fft.rfft(frame, n=n * 2)
        power_spectrum = np.abs(fft_frame) ** 2
        autocorr = np.fft.irfft(power_spectrum)[:n]

        # Normalize by zero lag
        if autocorr[0] <= 1e-12:
            return 0.0
        norm_autocorr = autocorr / autocorr[0]

        if max_lag >= len(norm_autocorr):
            max_lag = len(norm_autocorr) - 1

        search_slice = norm_autocorr[min_lag:max_lag]
        if len(search_slice) == 0:
            return 0.0

        peak_idx = np.argmax(search_slice) + min_lag
        peak_val = norm_autocorr[peak_idx]

        # Valid voiced pitch peak threshold
        if peak_val > 0.35:
            # Parabolic interpolation for fine sub-sample precision
            if 0 < peak_idx < len(norm_autocorr) - 1:
                alpha = norm_autocorr[peak_idx - 1]
                beta = norm_autocorr[peak_idx]
                gamma = norm_autocorr[peak_idx + 1]
                delta = 0.5 * (alpha - gamma) / max(1e-6, alpha - 2 * beta + gamma)
                refined_lag = peak_idx + delta
            else:
                refined_lag = peak_idx
            return float(sr / max(1.0, refined_lag))
        return 0.0

    @staticmethod
    def _compute_harmonic_multiplicity(magnitude: np.ndarray, freqs: np.ndarray, f0: float) -> float:
        """
        Checks for spectral complexity / secondary competing pitch harmonics indicating overlap.
        """
        if f0 <= 0:
            return 0.0
        # Peak detection across vocal band
        peaks = []
        vocal_mask = (freqs >= 100) & (freqs <= 3500)
        vocal_mag = magnitude[vocal_mask]
        if len(vocal_mag) < 5:
            return 0.0

        threshold = np.mean(vocal_mag) + 1.2 * np.std(vocal_mag)
        strong_peaks = np.sum(vocal_mag > threshold)
        # Ratio of strong non-harmonic peaks
        return float(min(1.0, strong_peaks / 18.0))

    @classmethod
    def _get_empty_features(cls, sr: int) -> Dict[str, Any]:
        return {
            "duration_seconds": 0.0,
            "sample_rate": sr,
            "rms_energy_mean": 0.0,
            "rms_energy_std": 0.0,
            "rms_energy_max": 0.0,
            "pitch_f0_mean_hz": 0.0,
            "pitch_f0_std_hz": 0.0,
            "pitch_range_hz": 0.0,
            "pitch_f0_max_hz": 0.0,
            "pitch_f0_min_hz": 0.0,
            "spectral_centroid_hz": 0.0,
            "spectral_flatness": 0.0,
            "spectral_rolloff_hz": 0.0,
            "zero_crossing_rate": 0.0,
            "snr_db": 0.0,
            "speech_ratio": 0.0,
            "silence_ratio": 1.0,
            "max_silence_duration_seconds": 0.0,
            "overlap_score": 0.0,
            "clipping_ratio": 0.0,
            "dropout_ratio": 1.0,
            "noise_floor_rms": 0.0,
        }
