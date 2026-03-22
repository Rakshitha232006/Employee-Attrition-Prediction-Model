"""Shared CSV path resolution for training and analytics."""
from __future__ import annotations

import os
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_ROOT.parent
DEFAULT_CSV = Path(r"D:\Employee_Attrition\WA_Fn-UseC_-HR-Employee-Attrition.csv")


def resolve_csv_path() -> Path:
    env = os.environ.get("ATTRITION_DATASET_PATH")
    if env:
        p = Path(env)
        if p.exists():
            return p
    if DEFAULT_CSV.exists():
        return DEFAULT_CSV
    for base in (PROJECT_ROOT, BACKEND_ROOT):
        cand = base / "WA_Fn-UseC_-HR-Employee-Attrition.csv"
        if cand.exists():
            return cand
    raise FileNotFoundError(
        f"Dataset not found. Set ATTRITION_DATASET_PATH or place "
        f"WA_Fn-UseC_-HR-Employee-Attrition.csv under {PROJECT_ROOT}."
    )
