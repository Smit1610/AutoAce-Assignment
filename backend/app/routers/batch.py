"""
AutoAce AI Batch Evaluation & Processing Router
Supports ZIP archives and folder uploads, CSV manifest validation, missing file reporting,
resilient batch processing, and downloadable structured CSV/JSON results.
"""

import io
import os
import csv
import json
import uuid
import zipfile
import time
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from ..models.schema import (
    BatchEvaluationResponse,
    BatchValidationReport,
    BatchItemResult,
    AudioAnalysisResult,
    EvaluationMetricsReport,
)
from ..audio_engine.engine import AudioEngine
from ..audio_engine.evaluator import Evaluator

router = APIRouter(prefix="/api/batch", tags=["Batch Evaluation"])

# In-memory batch store for fast access
BATCH_STORAGE: Dict[str, BatchEvaluationResponse] = {}
RAW_BATCH_FILES: Dict[str, Dict[str, bytes]] = {}


@router.post("/upload-zip", response_model=BatchEvaluationResponse)
async def upload_batch_zip(
    file: UploadFile = File(...),
    batch_name: Optional[str] = Form(None)
):
    """
    Accepts a ZIP archive containing audio files and a CSV manifest.
    Validates manifest alignment, processes each valid audio file, and stores results.
    """
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a .zip archive.")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded ZIP file is empty.")

    batch_id = str(uuid.uuid4())[:8]
    b_name = batch_name or file.filename.replace(".zip", "") or f"Batch_{batch_id}"

    try:
        with zipfile.ZipFile(io.BytesIO(content), "r") as zf:
            namelist = zf.namelist()
            
            # Find audio files and manifest
            audio_files: Dict[str, bytes] = {}
            manifest_content: Optional[str] = None
            manifest_filename: str = ""

            for name in namelist:
                # Ignore system files and directory entries
                if name.startswith("__MACOSX") or name.endswith("/"):
                    continue
                
                base_name = os.path.basename(name)
                if not base_name:
                    continue

                if base_name.lower().endswith(".csv"):
                    manifest_content = zf.read(name).decode("utf-8-sig", errors="ignore")
                    manifest_filename = base_name
                elif any(base_name.lower().endswith(ext) for ext in [".wav", ".mp3", ".ogg", ".flac", ".m4a"]):
                    audio_files[base_name] = zf.read(name)

            # Process manifest and validate
            manifest_rows: Dict[str, Optional[AudioAnalysisResult]] = {}
            if manifest_content:
                manifest_rows = parse_csv_manifest(manifest_content)

            # Batch Validation
            manifest_file_keys = set(manifest_rows.keys())
            audio_file_keys = set(audio_files.keys())

            missing_in_files = list(manifest_file_keys - audio_file_keys)
            missing_in_manifest = list(audio_file_keys - manifest_file_keys)
            matched_files = list(audio_file_keys & manifest_file_keys)

            has_labels = any(gt is not None for gt in manifest_rows.values())

            val_report = BatchValidationReport(
                total_manifest_rows=len(manifest_rows),
                total_audio_files_found=len(audio_files),
                matched_files_count=len(matched_files) if manifest_rows else len(audio_files),
                missing_in_manifest=missing_in_manifest,
                missing_in_files=missing_in_files,
                has_labels=has_labels,
                valid=True
            )

            # Files to process: prioritize manifest order or all discovered audio files
            target_files = list(manifest_rows.keys()) if manifest_rows else list(audio_files.keys())
            # Also add audio files missing in manifest
            for af in audio_files:
                if af not in target_files:
                    target_files.append(af)

            # Store raw audio bytes for preview playback
            RAW_BATCH_FILES[batch_id] = audio_files

            # Process Batch
            items: List[BatchItemResult] = []
            total_duration = 0.0
            total_proc_time = 0.0
            total_cost = 0.0
            failed_count = 0
            processed_count = 0

            start_batch_time = time.perf_counter()

            for fname in target_files:
                if fname not in audio_files:
                    items.append(BatchItemResult(
                        filename=fname,
                        status="error",
                        error=f"File '{fname}' listed in manifest was missing in the ZIP archive.",
                        result=None,
                        ground_truth=manifest_rows.get(fname),
                        processing_time_ms=0.0,
                        audio_duration_s=0.0,
                        cost_usd=0.0
                    ))
                    failed_count += 1
                    continue

                raw_bytes = audio_files[fname]
                try:
                    analysis = AudioEngine.analyze_audio_bytes(raw_bytes, fname)
                    if analysis.success:
                        dur = analysis.diagnostics.duration_seconds if analysis.diagnostics else 4.0
                        proc_ms = analysis.diagnostics.processing_time_ms if analysis.diagnostics else 25.0
                        cost = analysis.diagnostics.cost_usd if analysis.diagnostics else 0.000015

                        total_duration += dur
                        total_proc_time += proc_ms
                        total_cost += cost
                        processed_count += 1

                        items.append(BatchItemResult(
                            filename=fname,
                            status="completed",
                            error=None,
                            result=analysis.result,
                            ground_truth=manifest_rows.get(fname),
                            processing_time_ms=proc_ms,
                            audio_duration_s=dur,
                            cost_usd=cost
                        ))
                    else:
                        failed_count += 1
                        items.append(BatchItemResult(
                            filename=fname,
                            status="error",
                            error=analysis.error_message or "Unsupported or corrupt audio format.",
                            result=analysis.result,
                            ground_truth=manifest_rows.get(fname),
                            processing_time_ms=0.0,
                            audio_duration_s=0.0,
                            cost_usd=0.0
                        ))
                except Exception as e:
                    failed_count += 1
                    items.append(BatchItemResult(
                        filename=fname,
                        status="error",
                        error=f"Processing exception: {str(e)}",
                        result=None,
                        ground_truth=manifest_rows.get(fname),
                        processing_time_ms=0.0,
                        audio_duration_s=0.0,
                        cost_usd=0.0
                    ))

            total_audio_mins = max(0.01, total_duration / 60.0)
            avg_latency_per_min = round(total_proc_time / total_audio_mins, 2)
            cost_per_min = round(total_cost / total_audio_mins, 6) if total_audio_mins > 0 else 0.00018

            response_obj = BatchEvaluationResponse(
                batch_id=batch_id,
                batch_name=b_name,
                status="completed",
                total_files=len(target_files),
                processed_files=processed_count,
                failed_files=failed_count,
                validation_report=val_report,
                items=items,
                total_duration_seconds=round(total_duration, 2),
                total_processing_time_ms=round(total_proc_time, 2),
                total_cost_usd=round(total_cost, 6),
                average_latency_per_minute_ms=avg_latency_per_min,
                cost_per_audio_minute_usd=cost_per_min
            )

            BATCH_STORAGE[batch_id] = response_obj
            return response_obj

    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Malformed ZIP file.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch execution failed: {str(e)}")


@router.post("/upload-files", response_model=BatchEvaluationResponse)
async def upload_batch_files(
    files: List[UploadFile] = File(...),
    manifest: Optional[UploadFile] = File(None),
    batch_name: Optional[str] = Form(None)
):
    """
    Accepts individual audio files and an optional CSV manifest uploaded as multipart form.
    """
    batch_id = str(uuid.uuid4())[:8]
    b_name = batch_name or f"Batch_{batch_id}"

    audio_files: Dict[str, bytes] = {}
    manifest_content = ""

    for f in files:
        fname = f.filename
        content = await f.read()
        if fname.lower().endswith(".csv") and not manifest:
            manifest_content = content.decode("utf-8-sig", errors="ignore")
        elif any(fname.lower().endswith(ext) for ext in [".wav", ".mp3", ".ogg", ".flac", ".m4a"]):
            audio_files[fname] = content

    if manifest:
        m_bytes = await manifest.read()
        manifest_content = m_bytes.decode("utf-8-sig", errors="ignore")

    manifest_rows = parse_csv_manifest(manifest_content) if manifest_content else {}

    manifest_file_keys = set(manifest_rows.keys())
    audio_file_keys = set(audio_files.keys())

    missing_in_files = list(manifest_file_keys - audio_file_keys)
    missing_in_manifest = list(audio_file_keys - manifest_file_keys)
    matched_files = list(audio_file_keys & manifest_file_keys)
    has_labels = any(gt is not None for gt in manifest_rows.values())

    val_report = BatchValidationReport(
        total_manifest_rows=len(manifest_rows),
        total_audio_files_found=len(audio_files),
        matched_files_count=len(matched_files) if manifest_rows else len(audio_files),
        missing_in_manifest=missing_in_manifest,
        missing_in_files=missing_in_files,
        has_labels=has_labels,
        valid=True
    )

    target_files = list(manifest_rows.keys()) if manifest_rows else list(audio_files.keys())
    for af in audio_files:
        if af not in target_files:
            target_files.append(af)

    RAW_BATCH_FILES[batch_id] = audio_files

    items: List[BatchItemResult] = []
    total_duration = 0.0
    total_proc_time = 0.0
    total_cost = 0.0
    failed_count = 0
    processed_count = 0

    for fname in target_files:
        if fname not in audio_files:
            items.append(BatchItemResult(
                filename=fname,
                status="error",
                error=f"File '{fname}' missing from upload payload.",
                ground_truth=manifest_rows.get(fname)
            ))
            failed_count += 1
            continue

        raw_bytes = audio_files[fname]
        analysis = AudioEngine.analyze_audio_bytes(raw_bytes, fname)
        if analysis.success:
            dur = analysis.diagnostics.duration_seconds if analysis.diagnostics else 4.0
            proc_ms = analysis.diagnostics.processing_time_ms if analysis.diagnostics else 25.0
            cost = analysis.diagnostics.cost_usd if analysis.diagnostics else 0.000015

            total_duration += dur
            total_proc_time += proc_ms
            total_cost += cost
            processed_count += 1

            items.append(BatchItemResult(
                filename=fname,
                status="completed",
                result=analysis.result,
                ground_truth=manifest_rows.get(fname),
                processing_time_ms=proc_ms,
                audio_duration_s=dur,
                cost_usd=cost
            ))
        else:
            failed_count += 1
            items.append(BatchItemResult(
                filename=fname,
                status="error",
                error=analysis.error_message or "Unsupported audio.",
                result=analysis.result,
                ground_truth=manifest_rows.get(fname)
            ))

    total_audio_mins = max(0.01, total_duration / 60.0)
    avg_latency_per_min = round(total_proc_time / total_audio_mins, 2)
    cost_per_min = round(total_cost / total_audio_mins, 6) if total_audio_mins > 0 else 0.00018

    response_obj = BatchEvaluationResponse(
        batch_id=batch_id,
        batch_name=b_name,
        status="completed",
        total_files=len(target_files),
        processed_files=processed_count,
        failed_files=failed_count,
        validation_report=val_report,
        items=items,
        total_duration_seconds=round(total_duration, 2),
        total_processing_time_ms=round(total_proc_time, 2),
        total_cost_usd=round(total_cost, 6),
        average_latency_per_minute_ms=avg_latency_per_min,
        cost_per_audio_minute_usd=cost_per_min
    )

    BATCH_STORAGE[batch_id] = response_obj
    return response_obj


@router.get("/{batch_id}", response_model=BatchEvaluationResponse)
def get_batch_results(batch_id: str):
    if batch_id not in BATCH_STORAGE:
        raise HTTPException(status_code=404, detail="Batch not found.")
    return BATCH_STORAGE[batch_id]


@router.get("/{batch_id}/metrics", response_model=EvaluationMetricsReport)
def get_batch_metrics(batch_id: str):
    if batch_id not in BATCH_STORAGE:
        raise HTTPException(status_code=404, detail="Batch not found.")
    
    batch = BATCH_STORAGE[batch_id]
    preds = []
    gts = []
    for item in batch.items:
        if item.result and item.ground_truth:
            preds.append(item.result)
            gts.append(item.ground_truth)

    return Evaluator.evaluate_batch(preds, gts)


@router.get("/{batch_id}/export/csv")
def export_batch_csv(batch_id: str):
    """
    Exports structured batch predictions in the exact CSV schema format requested by AutoAce:
    name,result_json (preserving exact filenames).
    """
    if batch_id not in BATCH_STORAGE:
        raise HTTPException(status_code=404, detail="Batch not found.")

    batch = BATCH_STORAGE[batch_id]
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["name", "result_json"])

    for item in batch.items:
        if item.result:
            json_str = item.result.model_dump_json()
            writer.writerow([item.filename, json_str])
        else:
            writer.writerow([item.filename, "{}"])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=autoace_predictions_{batch_id}.csv"}
    )


@router.get("/{batch_id}/export/json")
def export_batch_json(batch_id: str):
    """
    Exports structured batch predictions as downloadable JSON preserving original filenames.
    """
    if batch_id not in BATCH_STORAGE:
        raise HTTPException(status_code=404, detail="Batch not found.")

    batch = BATCH_STORAGE[batch_id]
    export_data = []
    for item in batch.items:
        export_data.append({
            "name": item.filename,
            "status": item.status,
            "error": item.error,
            "prediction": item.result.model_dump() if item.result else None,
            "ground_truth": item.ground_truth.model_dump() if item.ground_truth else None,
            "duration_seconds": item.audio_duration_s,
            "processing_time_ms": item.processing_time_ms
        })

    json_str = json.dumps(export_data, indent=2)
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=autoace_predictions_{batch_id}.json"}
    )


@router.get("/{batch_id}/audio/{filename}")
def get_batch_audio_file(batch_id: str, filename: str):
    """
    Streams raw audio bytes for in-browser playback & waveform inspection.
    """
    if batch_id not in RAW_BATCH_FILES or filename not in RAW_BATCH_FILES[batch_id]:
        raise HTTPException(status_code=404, detail="Audio file not found in batch.")
    
    raw = RAW_BATCH_FILES[batch_id][filename]
    media_type = "audio/wav" if filename.lower().endswith(".wav") else "audio/mpeg"
    return Response(content=raw, media_type=media_type)


def parse_csv_manifest(csv_text: str) -> Dict[str, Optional[AudioAnalysisResult]]:
    """
    Parses AutoAce CSV manifest with columns: name, result_json.
    """
    rows: Dict[str, Optional[AudioAnalysisResult]] = {}
    f = io.StringIO(csv_text.strip())
    reader = csv.reader(f)
    header = next(reader, None)
    if not header:
        return rows

    name_idx = 0
    result_idx = 1 if len(header) > 1 else None

    # Check header names
    for i, col in enumerate(header):
        c_clean = col.strip().lower()
        if c_clean == "name":
            name_idx = i
        elif "result" in c_clean or "json" in c_clean or "label" in c_clean:
            result_idx = i

    for row in reader:
        if not row or len(row) <= name_idx:
            continue
        fname = row[name_idx].strip()
        if not fname:
            continue

        gt_result: Optional[AudioAnalysisResult] = None
        if result_idx is not None and len(row) > result_idx:
            raw_json = row[result_idx].strip()
            if raw_json and raw_json != "{}":
                try:
                    parsed = json.loads(raw_json)
                    gt_result = AudioAnalysisResult(**parsed)
                except Exception:
                    pass

        rows[fname] = gt_result

    return rows
