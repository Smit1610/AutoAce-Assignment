"""
AutoAce AI Master Application Entrypoint
FastAPI Backend serving REST APIs, Batch Upload, Audio Engine, and Static Web Dashboard.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .routers import auth, analyze, batch, evaluation, benchmarks, memo
from .audio_engine.reference_data import create_reference_dataset_files

app = FastAPI(
    title="AutoAce AI Voice Tone & Background Noise System",
    description="High-accuracy, sub-$0.0002/min audio intelligence API for production contact center calls.",
    version="1.0.0"
)

# Enable CORS for local and hosted web dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router)
app.include_router(analyze.router)
app.include_router(batch.router)
app.include_router(evaluation.router)
app.include_router(benchmarks.router)
app.include_router(memo.router)


@app.on_event("startup")
def startup_event():
    """
    Initializes sample reference calls and evaluation batch archives on startup.
    """
    sample_dir = os.path.join(os.path.dirname(__file__), "..", "..", "sample_data")
    try:
        create_reference_dataset_files(sample_dir)
        print(f"[AutoAce Engine] Sample reference datasets initialized at {sample_dir}")
    except Exception as e:
        print(f"[AutoAce Engine] Warning generating sample data: {e}")


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AutoAce Audio Intelligence Engine",
        "version": "1.0.0",
        "cost_compliance": "< $0.0002/min (Ceiling: $0.003/min)",
        "supported_formats": ["wav", "mp3", "flac", "ogg", "m4a", "zip"]
    }


# Static Frontend mounting (if built in frontend/dist or frontend build)
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
