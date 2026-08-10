"""
AutoAce AI Temporal & Conversation Flow Analyzer
Detects speaker_overlap_present and long_silence_present (>3.0s dead air).
"""

from typing import Dict, Any, Tuple


class TemporalAnalyzer:
    """
    Evaluates conversational overlap and call-flow dead air / silence issues.
    """

    @classmethod
    def analyze(cls, features: Dict[str, Any]) -> Tuple[bool, bool]:
        """
        Returns (speaker_overlap_present, long_silence_present).
        """
        max_silence = features.get("max_silence_duration_seconds", 0.0)
        silence_ratio = features.get("silence_ratio", 0.3)
        duration = features.get("duration_seconds", 5.0)
        overlap_score = features.get("overlap_score", 0.0)

        # 1. Long Silence / Dead Air:
        # Standard contact center dead air threshold is > 3.0 seconds continuous silence
        # or excessive total silence ratio (> 65% on calls longer than 4 seconds)
        long_silence = False
        if max_silence >= 3.0 or (silence_ratio >= 0.65 and duration >= 4.0):
            long_silence = True

        # 2. Speaker Overlap:
        # Detected when competing harmonic voice components cross the threshold (> 0.38)
        speaker_overlap = False
        if overlap_score >= 0.38:
            speaker_overlap = True

        return speaker_overlap, long_silence
