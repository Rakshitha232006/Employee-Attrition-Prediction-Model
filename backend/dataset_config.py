"""Shared CSV path resolution for training and analytics."""

from __future__ import annotations

import os
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_ROOT.parent
DATASET_NAME = "WA_Fn-UseC_-HR-Employee-Attrition.csv"


def resolve_csv_path() -> Path:
    env = os.environ.get("ATTRITION_DATASET_PATH")
    if env:
        p = Path(env)
        if p.exists():
            return p
    for base in (BACKEND_ROOT, PROJECT_ROOT):
        cand = base / DATASET_NAME
        if cand.exists():
            return cand
    raise FileNotFoundError(
        f"Dataset not found. Set ATTRITION_DATASET_PATH or place "
        f"{DATASET_NAME} under {BACKEND_ROOT} or {PROJECT_ROOT}."
    )
