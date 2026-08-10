"""
AutoAce AI Voice Tone & Background Noise Analysis System
Pydantic Data Models & Output Schemas strictly adhering to the technical trial requirements.
"""

from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field


class EmotionalToneEnum(str, Enum):
    neutral = "neutral"
    satisfied = "satisfied"
    frustrated = "frustrated"
    upset = "upset"
    distressed = "distressed"


class EmotionalIntensityEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class BackgroundNoiseSeverityEnum(str, Enum):
    none = "none"
    low = "low"
    medium = "medium"
    high = "high"


class AudioQualityEnum(str, Enum):
    clear = "clear"
    slightly_impaired = "slightly_impaired"
    severely_impaired = "severely_impaired"


class AudioAnalysisResult(BaseModel):
    """
    Required Output Schema for each audio clip.
    Strictly follows Section 2 of the AutoAce AI Technical Specification.
    """
    emotional_tone: EmotionalToneEnum = Field(
        ...,
        description="The primary emotional tone expressed by the customer: neutral | satisfied | frustrated | upset | distressed"
    )
    emotional_intensity: EmotionalIntensityEnum = Field(
        ...,
        description="The strength of the detected emotional tone: low | medium | high"
    )
    background_noise_present: bool = Field(
        ...,
        description="Whether meaningful non-speech sound is audible in the background: true | false"
    )
    background_noise_type: str = Field(
        default="",
        description="Open text concise description of dominant background noise, or empty string when no noise is present"
    )
    background_noise_severity: BackgroundNoiseSeverityEnum = Field(
        ...,
        description="How much the noise affects the call: none | low | medium | high"
    )
    audio_quality: AudioQualityEnum = Field(
        ...,
        description="The overall technical quality of the audio: clear | slightly_impaired | severely_impaired"
    )
    speaker_overlap_present: bool = Field(
        ...,
        description="Whether two or more speakers talk at the same time enough to affect understanding or analysis"
    )
    long_silence_present: bool = Field(
        ...,
        description="Whether the clip contains an unusually long period of silence or dead air (> 3.0s)"
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="The model's confidence in the overall result (0.0 to 1.0)"
    )


class AcousticDiagnostics(BaseModel):
    """
    Detailed acoustic DSP features extracted during analysis for the Playground and Explainability views.
    """
    duration_seconds: float
    sample_rate: int
    rms_energy_mean: float
    rms_energy_std: float
    pitch_f0_mean_hz: float
    pitch_f0_std_hz: float
    pitch_range_hz: float
    spectral_centroid_hz: float
    spectral_flatness: float
    spectral_rolloff_hz: float
    zero_crossing_rate: float
    snr_db: float
    speech_ratio: float
    silence_ratio: float
    max_silence_duration_seconds: float
    overlap_score: float
    clipping_ratio: float
    processing_time_ms: float
    cost_usd: float


class SingleAnalysisResponse(BaseModel):
    filename: str
    result: AudioAnalysisResult
    diagnostics: Optional[AcousticDiagnostics] = None
    success: bool = True
    error_message: Optional[str] = None


class BatchItemResult(BaseModel):
    filename: str
    status: str = "completed"  # completed | error | skipped
    error: Optional[str] = None
    result: Optional[AudioAnalysisResult] = None
    ground_truth: Optional[AudioAnalysisResult] = None
    processing_time_ms: float = 0.0
    audio_duration_s: float = 0.0
    cost_usd: float = 0.0


class BatchValidationReport(BaseModel):
    total_manifest_rows: int
    total_audio_files_found: int
    matched_files_count: int
    missing_in_manifest: List[str] = []
    missing_in_files: List[str] = []
    has_labels: bool = False
    valid: bool = True


class BatchEvaluationResponse(BaseModel):
    batch_id: str
    batch_name: str
    status: str  # processing | completed | failed
    total_files: int
    processed_files: int
    failed_files: int
    validation_report: BatchValidationReport
    items: List[BatchItemResult] = []
    total_duration_seconds: float = 0.0
    total_processing_time_ms: float = 0.0
    total_cost_usd: float = 0.0
    average_latency_per_minute_ms: float = 0.0
    cost_per_audio_minute_usd: float = 0.0


class ConfusionMatrixData(BaseModel):
    classes: List[str]
    matrix: List[List[int]]  # row = true class, col = predicted class
    accuracy: float
    macro_f1: float
    macro_precision: float
    macro_recall: float
    per_class_metrics: Dict[str, Dict[str, float]]


class EvaluationMetricsReport(BaseModel):
    total_evaluated: int
    emotional_tone_metrics: ConfusionMatrixData
    emotional_intensity_metrics: ConfusionMatrixData
    background_noise_present_metrics: ConfusionMatrixData
    audio_quality_metrics: ConfusionMatrixData
    speaker_overlap_metrics: ConfusionMatrixData
    long_silence_metrics: ConfusionMatrixData
    overall_accuracy: float
    overall_macro_f1: float


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str
    role: str
    expires_in_hours: int
