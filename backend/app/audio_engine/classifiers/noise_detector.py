"""
AutoAce AI Background Noise Detector
Identifies background_noise_present, background_noise_type, and background_noise_severity.
Analyzes spectral flatness, noise floor energy, high-frequency transients (typing),
stationary hum (mechanical/road), and diffuse speech harmonics (office chatter/television).
"""

from typing import Dict, Any, Tuple
from ...models.schema import BackgroundNoiseSeverityEnum


class NoiseDetector:
    """
    Classifies presence, type, and severity of non-speech background acoustic events.
    """

    @classmethod
    def detect(cls, features: Dict[str, Any]) -> Tuple[bool, str, BackgroundNoiseSeverityEnum]:
        """
        Returns (background_noise_present, background_noise_type, background_noise_severity).
        """
        snr_db = features.get("snr_db", 25.0)
        flatness = features.get("spectral_flatness", 0.05)
        centroid = features.get("spectral_centroid_hz", 1500.0)
        zcr = features.get("zero_crossing_rate", 0.08)
        noise_floor_rms = features.get("noise_floor_rms", 0.002)
        rolloff = features.get("spectral_rolloff_hz", 3000.0)

        # Baseline threshold for meaningful background noise
        # Low SNR or elevated noise floor or high non-vocal spectral flatness indicates presence
        has_noise = False
        noise_type = ""
        severity = BackgroundNoiseSeverityEnum.none

        # Check for noise presence
        if snr_db < 18.0 or noise_floor_rms > 0.006 or (flatness > 0.18 and snr_db < 22.0):
            has_noise = True

        if not has_noise:
            return False, "", BackgroundNoiseSeverityEnum.none

        # Determine Background Noise Type based on acoustic signatures
        # 1. Keyboard typing: high ZCR + high frequency bursts (> 3500 Hz rolloff) with moderate flatness
        if zcr > 0.14 and rolloff > 4000.0 and noise_floor_rms < 0.02:
            noise_type = "keyboard typing"
        # 2. Road noise: low frequency dominance (centroid < 850 Hz, high flatness, steady hum)
        elif centroid < 900.0 and flatness > 0.12:
            noise_type = "road noise"
        # 3. Mechanical noise / HVAC: steady mid-frequency hum, high flatness (0.25+), low ZCR
        elif flatness > 0.22 and 800.0 <= centroid <= 1800.0 and zcr < 0.10:
            noise_type = "mechanical noise"
        # 4. Wind noise: heavy low-end turbulence, elevated RMS variance in non-speech frames
        elif centroid < 650.0 and noise_floor_rms > 0.015:
            noise_type = "wind"
        # 5. Music: high harmonic density, rich spectral rolloff, warm centroid with rhythm
        elif 1400.0 <= centroid <= 2600.0 and flatness < 0.08 and snr_db < 16.0:
            noise_type = "music"
        # 6. Television: diffuse vocal harmonics + background music elements
        elif 1200.0 <= centroid <= 2200.0 and 12.0 <= snr_db <= 17.0:
            noise_type = "television"
        # 7. Office chatter: diffuse secondary conversational murmur (default for contact center calls)
        else:
            noise_type = "office chatter"

        # Determine Severity (none | low | medium | high)
        if snr_db >= 16.0 and noise_floor_rms <= 0.009:
            severity = BackgroundNoiseSeverityEnum.low
        elif 8.0 <= snr_db < 16.0 or (0.009 < noise_floor_rms <= 0.035):
            severity = BackgroundNoiseSeverityEnum.medium
        else:
            severity = BackgroundNoiseSeverityEnum.high

        return True, noise_type, severity
