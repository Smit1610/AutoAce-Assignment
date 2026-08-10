"""
AutoAce AI Model Evaluation & Statistical Validation Engine
Computes Confusion Matrices, Macro F1, Per-Class Precision & Recall,
and Error Analysis against ground-truth labels.
"""

from typing import List, Dict, Any, Tuple
import numpy as np
from ..models.schema import (
    AudioAnalysisResult,
    EvaluationMetricsReport,
    ConfusionMatrixData,
)


class Evaluator:
    """
    Computes rigorous classification metrics for emotional tone, noise detection,
    and quality metrics across evaluation batches.
    """

    @classmethod
    def evaluate_batch(
        cls,
        predictions: List[AudioAnalysisResult],
        ground_truths: List[AudioAnalysisResult]
    ) -> EvaluationMetricsReport:
        """
        Calculates all confusion matrices and macro F1 scores for the batch.
        """
        n = min(len(predictions), len(ground_truths))
        if n == 0:
            return cls._empty_report()

        # 1. Emotional Tone Metrics
        tone_classes = ["neutral", "satisfied", "frustrated", "upset", "distressed"]
        y_true_tone = [gt.emotional_tone.value for gt in ground_truths[:n]]
        y_pred_tone = [pred.emotional_tone.value for pred in predictions[:n]]
        tone_cm = cls._compute_cm_and_metrics(y_true_tone, y_pred_tone, tone_classes)

        # 2. Emotional Intensity Metrics
        intensity_classes = ["low", "medium", "high"]
        y_true_int = [gt.emotional_intensity.value for gt in ground_truths[:n]]
        y_pred_int = [pred.emotional_intensity.value for pred in predictions[:n]]
        int_cm = cls._compute_cm_and_metrics(y_true_int, y_pred_int, intensity_classes)

        # 3. Background Noise Present Metrics
        bool_classes = ["false", "true"]
        y_true_noise = [str(gt.background_noise_present).lower() for gt in ground_truths[:n]]
        y_pred_noise = [str(pred.background_noise_present).lower() for pred in predictions[:n]]
        noise_cm = cls._compute_cm_and_metrics(y_true_noise, y_pred_noise, bool_classes)

        # 4. Audio Quality Metrics
        quality_classes = ["clear", "slightly_impaired", "severely_impaired"]
        y_true_qual = [gt.audio_quality.value for gt in ground_truths[:n]]
        y_pred_qual = [pred.audio_quality.value for pred in predictions[:n]]
        qual_cm = cls._compute_cm_and_metrics(y_true_qual, y_pred_qual, quality_classes)

        # 5. Speaker Overlap Metrics
        y_true_ov = [str(gt.speaker_overlap_present).lower() for gt in ground_truths[:n]]
        y_pred_ov = [str(pred.speaker_overlap_present).lower() for pred in predictions[:n]]
        ov_cm = cls._compute_cm_and_metrics(y_true_ov, y_pred_ov, bool_classes)

        # 6. Long Silence Metrics
        y_true_sil = [str(gt.long_silence_present).lower() for gt in ground_truths[:n]]
        y_pred_sil = [str(pred.long_silence_present).lower() for pred in predictions[:n]]
        sil_cm = cls._compute_cm_and_metrics(y_true_sil, y_pred_sil, bool_classes)

        # Weighted overall composite metric
        overall_acc = round(
            0.45 * tone_cm.accuracy +
            0.15 * noise_cm.accuracy +
            0.15 * qual_cm.accuracy +
            0.10 * int_cm.accuracy +
            0.15 * (0.5 * ov_cm.accuracy + 0.5 * sil_cm.accuracy),
            4
        )
        overall_f1 = round(
            0.45 * tone_cm.macro_f1 +
            0.15 * noise_cm.macro_f1 +
            0.15 * qual_cm.macro_f1 +
            0.10 * int_cm.macro_f1 +
            0.15 * (0.5 * ov_cm.macro_f1 + 0.5 * sil_cm.macro_f1),
            4
        )

        return EvaluationMetricsReport(
            total_evaluated=n,
            emotional_tone_metrics=tone_cm,
            emotional_intensity_metrics=int_cm,
            background_noise_present_metrics=noise_cm,
            audio_quality_metrics=qual_cm,
            speaker_overlap_metrics=ov_cm,
            long_silence_metrics=sil_cm,
            overall_accuracy=overall_acc,
            overall_macro_f1=overall_f1,
        )

    @classmethod
    def _compute_cm_and_metrics(
        cls,
        y_true: List[str],
        y_pred: List[str],
        classes: List[str]
    ) -> ConfusionMatrixData:
        k = len(classes)
        class_to_idx = {c: i for i, c in enumerate(classes)}
        matrix = [[0 for _ in range(k)] for _ in range(k)]

        correct = 0
        total = len(y_true)

        for true_val, pred_val in zip(y_true, y_pred):
            ti = class_to_idx.get(true_val)
            pi = class_to_idx.get(pred_val)
            if ti is not None and pi is not None:
                matrix[ti][pi] += 1
                if ti == pi:
                    correct += 1

        accuracy = round(correct / max(1, total), 4)

        # Compute per-class precision, recall, and F1
        per_class = {}
        f1_list = []
        precision_list = []
        recall_list = []

        for i, c in enumerate(classes):
            tp = matrix[i][i]
            fp = sum(matrix[r][i] for r in range(k)) - tp
            fn = sum(matrix[i][col] for col in range(k)) - tp

            prec = round(tp / max(1e-9, (tp + fp)), 4) if (tp + fp) > 0 else 1.0
            rec = round(tp / max(1e-9, (tp + fn)), 4) if (tp + fn) > 0 else 1.0
            f1 = round(2.0 * (prec * rec) / max(1e-9, (prec + rec)), 4) if (prec + rec) > 0 else 0.0

            per_class[c] = {
                "precision": prec,
                "recall": rec,
                "f1": f1,
                "support": tp + fn
            }
            f1_list.append(f1)
            precision_list.append(prec)
            recall_list.append(rec)

        macro_f1 = round(float(np.mean(f1_list)), 4)
        macro_prec = round(float(np.mean(precision_list)), 4)
        macro_rec = round(float(np.mean(recall_list)), 4)

        return ConfusionMatrixData(
            classes=classes,
            matrix=matrix,
            accuracy=accuracy,
            macro_f1=macro_f1,
            macro_precision=macro_prec,
            macro_recall=macro_rec,
            per_class_metrics=per_class,
        )

    @classmethod
    def _empty_report(cls) -> EvaluationMetricsReport:
        dummy_cm = ConfusionMatrixData(
            classes=[],
            matrix=[],
            accuracy=0.0,
            macro_f1=0.0,
            macro_precision=0.0,
            macro_recall=0.0,
            per_class_metrics={}
        )
        return EvaluationMetricsReport(
            total_evaluated=0,
            emotional_tone_metrics=dummy_cm,
            emotional_intensity_metrics=dummy_cm,
            background_noise_present_metrics=dummy_cm,
            audio_quality_metrics=dummy_cm,
            speaker_overlap_metrics=dummy_cm,
            long_silence_metrics=dummy_cm,
            overall_accuracy=0.0,
            overall_macro_f1=0.0,
        )
