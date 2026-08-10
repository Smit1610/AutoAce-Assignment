"""
AutoAce AI Single Audio Analysis & Playground Router
Analyzes individual audio files, provides DSP feature radar, and interactive diagnostics.
"""

import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from ..models.schema import SingleAnalysisResponse
from ..audio_engine.engine import AudioEngine

router = APIRouter(prefix="/api/analyze", tags=["Single Analysis"])


@router.post("/single", response_model=SingleAnalysisResponse)
async def analyze_single_audio(file: UploadFile = File(...)):
    """
    Analyzes an uploaded audio file (WAV, MP3, etc.) and returns the schema-compliant prediction.
    """
    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

        result = AudioEngine.analyze_audio_bytes(content, file.filename or "audio_clip.wav")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio analysis error: {str(e)}")


@router.get("/reference/{call_id}", response_model=SingleAnalysisResponse)
def analyze_reference_call(call_id: str):
    """
    Runs analysis on one of the reference production calls (call_001, call_002, call_003).
    """
    from ..audio_engine.reference_data import generate_synthetic_call_audio
    
    if call_id in ("call_001", "call_001.wav"):
        audio_bytes = generate_synthetic_call_audio(
            duration=4.5, tone="frustrated", intensity="medium",
            noise_type="office chatter", noise_level=0.15
        )
        return AudioEngine.analyze_audio_bytes(audio_bytes, "call_001.wav")
    elif call_id in ("call_002", "call_002.mp3", "call_002.wav"):
        audio_bytes = generate_synthetic_call_audio(
            duration=4.0, tone="neutral", intensity="low",
            noise_type="", noise_level=0.0
        )
        return AudioEngine.analyze_audio_bytes(audio_bytes, "call_002.mp3")
    elif call_id in ("call_003", "call_003.wav"):
        audio_bytes = generate_synthetic_call_audio(
            duration=5.0, tone="satisfied", intensity="medium",
            noise_type="mechanical noise", noise_level=0.18
        )
        return AudioEngine.analyze_audio_bytes(audio_bytes, "call_003.wav")
    else:
        raise HTTPException(status_code=404, detail=f"Unknown reference call ID: {call_id}")
