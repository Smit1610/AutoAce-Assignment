"""
AutoAce AI Evaluation Metrics & Benchmarking Router
Provides baseline vs hybrid comparison metrics, confusion matrices, and validation reports.
"""

from fastapi import APIRouter
from ..models.schema import EvaluationMetricsReport, ConfusionMatrixData
from ..audio_engine.reference_data import create_reference_dataset_files
from ..audio_engine.engine import AudioEngine
from ..audio_engine.evaluator import Evaluator
import os

router = APIRouter(prefix="/api/evaluation", tags=["Evaluation Metrics"])


@router.get("/reference-benchmark", response_model=EvaluationMetricsReport)
def get_reference_benchmark_metrics():
    """
    Computes validation metrics across the standardized production test set.
    """
    # Sample test set predictions vs ground truths
    output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "sample_data")
    batch_dir, _ = create_reference_dataset_files(output_dir)

    preds = []
    gts = []

    # Run analysis on all sample files
    from ..routers.batch import parse_csv_manifest
    csv_path = os.path.join(batch_dir, "labels.csv")
    if os.path.exists(csv_path):
        with open(csv_path, "r", encoding="utf-8") as f:
            manifest_rows = parse_csv_manifest(f.read())
        
        for fname, gt in manifest_rows.items():
            fpath = os.path.join(batch_dir, fname)
            if os.path.exists(fpath) and gt:
                with open(fpath, "rb") as af:
                    analysis = AudioEngine.analyze_audio_bytes(af.read(), fname)
                    if analysis.success and analysis.result:
                        preds.append(analysis.result)
                        gts.append(gt)

    return Evaluator.evaluate_batch(preds, gts)
