"""
AutoAce AI Emotional Tone & Intensity Classifier
Classifies emotional_tone and emotional_intensity based on acoustic prosody,
pitch dynamics, vocal tension, spectral characteristics, and speech rate.
"""

from typing import Dict, Any, Tuple
from ...models.schema import EmotionalToneEnum, EmotionalIntensityEnum


class ToneClassifier:
    """
    Acoustic & Prosodic Emotion Classification Engine.
    Combines pitch dynamics (F0 variance/range), vocal tension (ZCR/spectral centroid),
    speech rate & energy spikes to classify customer emotional state.
    """

    @classmethod
    def classify(cls, features: Dict[str, Any]) -> Tuple[EmotionalToneEnum, EmotionalIntensityEnum, float]:
        """
        Returns (emotional_tone, emotional_intensity, confidence_score).
        """
        f0_mean = features.get("pitch_f0_mean_hz", 160.0)
        f0_std = features.get("pitch_f0_std_hz", 20.0)
        f0_range = features.get("pitch_range_hz", 40.0)
        f0_max = features.get("pitch_f0_max_hz", 180.0)

        rms_mean = features.get("rms_energy_mean", 0.05)
        rms_std = features.get("rms_energy_std", 0.02)
        rms_max = features.get("rms_energy_max", 0.15)

        centroid = features.get("spectral_centroid_hz", 1500.0)
        zcr = features.get("zero_crossing_rate", 0.08)
        speech_ratio = features.get("speech_ratio", 0.7)
        overlap = features.get("overlap_score", 0.0)

        # Baseline normalized indices
        # Vocal pitch elevation ratio above standard speaking register (~160 Hz baseline)
        pitch_elevation = max(0.0, (f0_mean - 150.0) / 100.0)
        pitch_instability = min(1.0, f0_std / 55.0)
        pitch_excursion = min(1.0, f0_range / 120.0)

        # Vocal energy dynamics (tension & loudness bursts)
        energy_dynamics = min(1.0, (rms_std / max(1e-4, rms_mean)) * 0.8)
        energy_burst = min(1.0, (rms_max / 0.35))

        # High frequency voice tension (ZCR + spectral brightness)
        vocal_tension = min(1.0, ((centroid - 1200.0) / 1500.0) * 0.6 + (zcr / 0.18) * 0.4)

        # Scoring weights for each emotional tone
        # 1. Distressed: Extreme pitch instability, tremor, breathless bursts, high pitch excursion, crying/panicked dynamics
        distressed_score = (
            pitch_instability * 0.35 +
            pitch_excursion * 0.25 +
            (1.0 - speech_ratio) * 0.15 +  # pauses / gasps
            energy_dynamics * 0.25
        )
        if f0_std > 50.0 and f0_range > 110.0 and rms_std > 0.045:
            distressed_score += 0.35

        # 2. Upset: Clearly angry, agitated, sustained loud energy, high pitch elevation, high centroid (harsh/shouting)
        upset_score = (
            pitch_elevation * 0.30 +
            energy_burst * 0.30 +
            vocal_tension * 0.25 +
            (f0_max > 260.0) * 0.15
        )
        if rms_mean > 0.10 and centroid > 2100.0:
            upset_score += 0.25

        # 3. Frustrated: Annoyed, impatient, spiky energy variance, moderate pitch tension without full rage/distress
        frustrated_score = (
            energy_dynamics * 0.35 +
            vocal_tension * 0.30 +
            (pitch_instability > 0.3) * 0.20 +
            (speech_ratio > 0.75) * 0.15  # rapid clipped talking
        )
        if 1300.0 < centroid < 2200.0 and 0.20 < energy_dynamics < 0.85:
            frustrated_score += 0.15

        # 4. Satisfied: Gentle upward pitch contour, warm spectral centroid (1200-1800 Hz), moderate relaxed energy, steady cadence
        satisfied_score = 0.0
        if 1200.0 <= centroid <= 1850.0 and f0_std < 35.0 and energy_dynamics < 0.65:
            satisfied_score = (
                (1.0 - vocal_tension) * 0.35 +
                (1.0 - pitch_instability) * 0.30 +
                0.25
            )

        # 5. Neutral: Low pitch deviation, steady energy, balanced centroid, standard speaking rate
        neutral_score = (
            (1.0 - pitch_instability) * 0.40 +
            (1.0 - energy_dynamics) * 0.30 +
            (1.0 - abs(centroid - 1450.0) / 1450.0) * 0.30
        )

        scores = {
            EmotionalToneEnum.distressed: max(0.0, distressed_score),
            EmotionalToneEnum.upset: max(0.0, upset_score),
            EmotionalToneEnum.frustrated: max(0.0, frustrated_score),
            EmotionalToneEnum.satisfied: max(0.0, satisfied_score),
            EmotionalToneEnum.neutral: max(0.0, neutral_score),
        }

        # Select highest scoring emotional tone
        best_tone = max(scores, key=scores.get)
        highest_score = scores[best_tone]

        # Calculate Intensity (low | medium | high)
        if best_tone == EmotionalToneEnum.neutral:
            intensity = EmotionalIntensityEnum.low
            if scores[EmotionalToneEnum.frustrated] > 0.3:
                intensity = EmotionalIntensityEnum.low
        elif best_tone in (EmotionalToneEnum.upset, EmotionalToneEnum.distressed):
            if highest_score > 0.75 or energy_burst > 0.7:
                intensity = EmotionalIntensityEnum.high
            else:
                intensity = EmotionalIntensityEnum.medium
        elif best_tone == EmotionalToneEnum.frustrated:
            if highest_score > 0.70 or energy_dynamics > 0.75:
                intensity = EmotionalIntensityEnum.high
            elif highest_score > 0.45:
                intensity = EmotionalIntensityEnum.medium
            else:
                intensity = EmotionalIntensityEnum.low
        elif best_tone == EmotionalToneEnum.satisfied:
            if highest_score > 0.65:
                intensity = EmotionalIntensityEnum.medium
            else:
                intensity = EmotionalIntensityEnum.low
        else:
            intensity = EmotionalIntensityEnum.medium

        # Compute confidence (calibrated 0.0 to 1.0)
        sorted_scores = sorted(scores.values(), reverse=True)
        margin = sorted_scores[0] - sorted_scores[1] if len(sorted_scores) > 1 else sorted_scores[0]
        base_conf = 0.65 + min(0.30, margin * 0.5)
        
        # Audio length / SNR quality modifier for confidence
        duration = features.get("duration_seconds", 5.0)
        snr = features.get("snr_db", 20.0)
        if duration < 1.5:
            base_conf *= 0.85
        if snr < 6.0:
            base_conf *= 0.88

        confidence = round(max(0.40, min(0.98, base_conf)), 2)

        return best_tone, intensity, confidence
