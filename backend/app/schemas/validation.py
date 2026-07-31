"""Pydantic schemas for Vision Performance Validation module."""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class GRRInput(BaseModel):
    values: list[list[list[float]]]  # [operator][part][replicate]
    n_operators: int = 2
    n_parts: int = 10
    n_replicates: int = 2
    tolerance: Optional[float] = None


class ValidationRequest(BaseModel):
    system_name: str = "Vision System"
    # Repeatability / Measurement
    measurements: Optional[list[float]] = None
    reference_value: Optional[float] = None
    usl: Optional[float] = None
    lsl: Optional[float] = None
    reference_values: Optional[list[float]] = None   # for accuracy (paired)
    # AI Performance
    predictions: Optional[list[int]] = None
    ground_truth: Optional[list[int]] = None
    scores: Optional[list[float]] = None             # probability scores for ROC
    class_names: Optional[list[str]] = None
    # OCR
    ocr_predicted: Optional[list[str]] = None
    ocr_ground_truth: Optional[list[str]] = None
    ocr_confidences: Optional[list[float]] = None
    # Runtime
    inference_times_ms: Optional[list[float]] = None
    target_fps: Optional[float] = None
    # Stability
    stability_results: Optional[list[bool]] = None
    # GR&R
    grr: Optional[GRRInput] = None


# ── Result schemas ─────────────────────────────────────────────────────────────

class RepeatabilityResult(BaseModel):
    n: int
    mean: float
    std: float
    min_val: float
    max_val: float
    range_val: float
    cp: Optional[float]
    cpk: Optional[float]
    cv_pct: float
    usl: Optional[float]
    lsl: Optional[float]
    histogram: list[float]
    histogram_edges: list[float]
    status: str   # capable / marginal / incapable


class AccuracyResult(BaseModel):
    n: int
    mae: float
    mape_pct: float
    bias: float
    rmse: float
    max_error: float
    errors: list[float]
    status: str


class GRRResult(BaseModel):
    n_operators: int
    n_parts: int
    n_replicates: int
    ev_pct: float
    av_pct: float
    grr_pct: float
    pv_pct: float
    ndc: int
    var_repeatability: float
    var_reproducibility: float
    var_parts: float
    status: str   # acceptable / marginal / unacceptable


class AIResult(BaseModel):
    n_samples: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: list[list[int]]
    class_names: list[str]
    per_class_precision: list[float]
    per_class_recall: list[float]
    per_class_f1: list[float]
    roc_auc: Optional[float]
    pr_auc: Optional[float]
    roc_fpr: Optional[list[float]]
    roc_tpr: Optional[list[float]]
    pr_precision: Optional[list[float]]
    pr_recall_pts: Optional[list[float]]
    status: str


class OCRResult(BaseModel):
    n_samples: int
    char_accuracy_pct: float
    word_accuracy_pct: float
    cer_pct: float
    wer_pct: float
    mean_confidence_pct: Optional[float]
    confidence_hist: Optional[list[float]]
    status: str


class RuntimeResult(BaseModel):
    n_samples: int
    mean_ms: float
    std_ms: float
    min_ms: float
    max_ms: float
    p50_ms: float
    p95_ms: float
    p99_ms: float
    fps: float
    target_fps: Optional[float]
    histogram: list[float]
    histogram_edges: list[float]
    status: str


class StabilityResult(BaseModel):
    n_runs: int
    pass_count: int
    fail_count: int
    pass_rate_pct: float
    failure_rate_pct: float
    first_failure_at: Optional[int]
    max_consecutive_failures: int
    fail_positions: list[int]
    trend: list[float]          # rolling pass rate (window=50)
    status: str


class ComponentScore(BaseModel):
    score: float
    weight: float
    label: str
    available: bool


class FinalScore(BaseModel):
    overall_score: float
    verdict: str                # PASS / CONDITIONAL PASS / FAIL
    component_scores: dict[str, ComponentScore]
    radar_labels: list[str]
    radar_values: list[float]
    recommendations: list[str]


class ValidationResult(BaseModel):
    system_name: str
    repeatability: Optional[RepeatabilityResult]
    accuracy: Optional[AccuracyResult]
    grr: Optional[GRRResult]
    ai: Optional[AIResult]
    ocr: Optional[OCRResult]
    runtime: Optional[RuntimeResult]
    stability: Optional[StabilityResult]
    final_score: FinalScore
    export_json: str
    export_csv: str
