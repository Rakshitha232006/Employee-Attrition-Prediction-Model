"""Upload CSV and return automatic HR analytics (pandas)."""
from __future__ import annotations

import io
import json
import math
from typing import Any

import numpy as np
import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from upload_analysis import analyze_uploaded_dataframe

router = APIRouter(prefix="/api/upload", tags=["upload"])

MAX_BYTES = 12 * 1024 * 1024


def _json_safe(value: Any) -> Any:
    """Recursively convert values into strict-JSON-safe types."""
    if isinstance(value, dict):
        return {str(k): _json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_safe(v) for v in value]
    if isinstance(value, np.ndarray):
        return [_json_safe(v) for v in value.tolist()]
    if isinstance(value, np.generic):
        return _json_safe(value.item())
    if isinstance(value, float):
        return value if math.isfinite(value) else None
    if pd.isna(value):
        return None
    return value


@router.post("/analyze")
async def analyze_csv(file: UploadFile = File(...)):
    """
    Upload a CSV with HR columns and optional Attrition target.
    Returns schema detection, overview, binned/categorical/cross analysis, correlations, scatters, insights.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a .csv file.")
    raw = await file.read()
    if len(raw) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 12 MB).")
    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}") from e
    if df.empty or len(df.columns) < 2:
        raise HTTPException(status_code=400, detail="CSV must have at least 2 columns and 1 row.")
    result = analyze_uploaded_dataframe(df)
    result["filename"] = file.filename
    safe_result = _json_safe(result)
    try:
        json.dumps(safe_result, allow_nan=False)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Upload analysis serialization error: {e}") from e
    return safe_result
