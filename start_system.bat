@echo off
echo =========================================================================
echo Starting AutoAce AI Voice Tone and Background Noise Evaluation System
echo =========================================================================

echo [1/2] Starting Python FastAPI Backend on http://localhost:8000 ...
start /b .\venv\Scripts\python -m uvicorn backend.app.main:app --port 8000 --reload

echo [2/2] Starting React Web Dashboard on http://localhost:3000 ...
cd frontend
npm run dev

pause
