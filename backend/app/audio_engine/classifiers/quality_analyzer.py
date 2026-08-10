"""
AutoAce AI Technical Audio Quality Analyzer
Evaluates audio_quality independently of emotional tone.
Detects clipping, distortion, robotic audio, packet dropouts, low volume, and severe static.
"""

from typing import Dict, Any
from ...models.schema import AudioQualityEnum


class QualityAnalyzer:
    """
    Evaluates physical signal integrity: clipping, packet dropouts, static SNR, and robotic phase artifacts.
    """

    @classmethod
    def evaluate(cls, features: Dict[str, Any]) -> AudioQualityEnum:
        """
        Returns AudioQualityEnum (clear | slightly_impaired | severely_impaired).
        """
        snr_db = features.get("snr_db", 25.0)
        clipping_ratio = features.get("clipping_ratio", 0.0)
        dropout_ratio = features.get("dropout_ratio", 0.0)
        rms_mean = features.get("rms_energy_mean", 0.05)
        centroid = features.get("spectral_centroid_hz", 1500.0)
        flatness = features.get("spectral_flatness", 0.05)

        # 1. Severe impairment check:
        # Extreme clipping (> 2.5%), heavy packet loss (> 40% zero dropouts), very low SNR (< 4 dB), or near total silence (< 0.002 RMS)
        if clipping_ratio > 0.025 or dropout_ratio > 0.35 or snr_db < 4.0 or (rms_mean < 0.002 and dropout_ratio > 0.20):
            return AudioQualityEnum.severely_impaired

        # Muffled telephone cutoff + heavy static
        if centroid < 550.0 and flatness > 0.30:
            return AudioQualityEnum.severely_impaired

        # 2. Slight impairment check:
        # Moderate clipping, noticeable static (SNR 4-14 dB), muffled audio, or slight dropout
        if clipping_ratio > 0.004 or (4.0 <= snr_db < 14.0) or dropout_ratio > 0.15 or rms_mean < 0.008 or centroid < 750.0:
            return AudioQualityEnum.slightly_impaired

        # 3. Clear audio
        return AudioQualityEnum.clear
