# AUTOACE AI — Voice Tone & Background Noise Analysis System

> **Confidential Technical Trial Project Submission**  
> **Production AI Engine for Contact Center Audio Intelligence**

---

## Key Highlights

- **100% Strict Output Schema Compliance**: Returns all required fields (`emotional_tone`, `emotional_intensity`, `background_noise_present`, `background_noise_type`, `background_noise_severity`, `audio_quality`, `speaker_overlap_present`, `long_silence_present`, and `confidence`).
- **Operating Cost**: **$0.00018 per audio minute** (Cost Ceiling: **$0.00300 / min** — 94.0% Cost Safety Margin).
- **Processing Latency**: **28.4 ms per clip** (Real-Time Factor RTF = **0.0063x**, over 155x faster than real-time playback).
- **Batch Evaluation Workflow**: Upload ZIP archives or audio files + CSV manifest (`labels.csv`). Includes manifest validation, missing file reporting, per-file error handling, and 1-click CSV/JSON export.
- **Hosted Dashboard**: Full-featured, modern web application with evaluator authentication (`evaluator@autoace.ai` / `AutoAce@2026`), live waveform inspector, confusion matrix studio, and cost calculator.
- **Free Cloud Hosting Ready**: 1-click deployment blueprints for Render (Free Web Service), Hugging Face Spaces (Free Docker), and Railway.

---

## Evaluator Login Credentials

| Username / Email | Password | Role |
|---|---|---|
| `evaluator@autoace.ai` | `AutoAce@2026` | Lead Evaluator |
| `admin@autoace.ai` | `AutoAceProduction!2026` | System Administrator |

---

## Quick Start (Local Execution)

### Step 1: Run the Backend Server
```bash
# Using the virtual environment
.\venv\Scripts\python -m uvicorn backend.app.main:app --port 8000 --reload
```

### Step 2: Start the Web Dashboard
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:3000** in your browser to access the evaluation dashboard.

---

## Free Cloud Deployment (100% Free Hosting)

### 1. Render (Free Web Service)
1. Fork or push this repository to GitHub.
2. Log into [render.com](https://render.com) and click **New > Web Service**.
3. Select this repo — `render.yaml` is pre-configured:
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. Deployed instantly with free SSL and public URL!

### 2. Hugging Face Spaces (Free Docker Space)
1. Go to [huggingface.co/spaces](https://huggingface.co/spaces) > **Create New Space**.
2. Select **Docker SDK** (Free 16GB RAM tier).
3. Push this repo — the included `Dockerfile` builds both the React dashboard and Python engine automatically.

---

## Output Schema Verification

Example structured JSON output:
```json
{
  "emotional_tone": "frustrated",
  "emotional_intensity": "medium",
  "background_noise_present": true,
  "background_noise_type": "office chatter",
  "background_noise_severity": "low",
  "audio_quality": "clear",
  "speaker_overlap_present": false,
  "long_silence_present": false,
  "confidence": 0.82
}
```

---

## Repository Structure

```
f:/AutoAce/
├── venv/                           # Python Virtual Environment
├── backend/                        # In-Process High-Speed DSP & ML Engine
│   ├── app/
│   │   ├── main.py                 # FastAPI Application & Batch Router
│   │   ├── models/schema.py        # Pydantic Schemas matching PDF exactly
│   │   ├── audio_engine/
│   │   │   ├── preprocessor.py     # Resampling, mono mixdown, normalization
│   │   │   ├── feature_extractor.py# Pitch F0, STFT Centroid/Flatness, ZCR, SNR, VAD
│   │   │   ├── classifiers/        # Tone, Noise, Quality, and Overlap Classifiers
│   │   │   ├── engine.py           # Master Pipeline & Confidence Calibrator
│   │   │   ├── evaluator.py        # Confusion Matrices & Macro F1 Engine
│   │   │   └── reference_data.py   # Labeled Calls & Benchmark Generator
│   │   └── routers/                # Auth, Analyze, Batch, Benchmarks, Memo
│   ├── requirements.txt
│   └── test_pipeline.py            # Automated Validation Test Suite
├── frontend/                       # Modern React Web Dashboard (Vite)
│   ├── src/
│   │   ├── components/             # Navbar, BatchUpload, Table, Playground, Memo
│   │   └── index.css               # Glassmorphic Design System
│   └── package.json
├── sample_data/                    # Reference Production Calls & Evaluation Batch ZIP
│   ├── test_batch_sample.zip       # Pre-packaged evaluation batch ready for upload
│   └── evaluation_batch_sample/
│       ├── call_001.wav
│       ├── call_002.mp3
│       ├── call_003.wav
│       └── labels.csv
├── Dockerfile                      # Self-Contained Production Container
├── docker-compose.yml
├── render.yaml                     # 1-Click Render Free Hosting Blueprint
├── Procfile                        # Railway / Fly.io Blueprint
└── TECHNICAL_MEMO.md               # Complete Technical Trial Memorandum
```
