"""Analytics API — groupby, correlations, SHAP, insights."""

import math

import numpy as np
from fastapi import APIRouter, HTTPException

import analytics_engine as ae

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _json_safe(value):
    """Recursively convert values to JSON-safe native Python types."""
    if value is None:
        return None

    if isinstance(value, np.generic):
        value = value.item()

    if isinstance(value, float):
        return value if math.isfinite(value) else None

    if isinstance(value, dict):
        return {k: _json_safe(v) for k, v in value.items()}

    if isinstance(value, (list, tuple)):
        return [_json_safe(v) for v in value]

    return value


@router.get("/summary")
async def analytics_summary():
    try:
        return _json_safe(ae.summary())
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


@router.get("/numeric-bins")
async def numeric_bins():
    try:
        return _json_safe(ae.numeric_binned_analysis())
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


@router.get("/categorical")
async def categorical():
    try:
        return _json_safe(ae.categorical_analysis())
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


@router.get("/cross")
async def cross():
    try:
        return _json_safe(ae.cross_analysis())
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


@router.get("/correlations")
async def correlations():
    try:
        return _json_safe(ae.correlation_matrix())
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


@router.get("/scatter-pairs")
async def scatter_pairs():
    try:
        return _json_safe(ae.scatter_pairs())
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


@router.get("/shap")
async def shap_global():
    try:
        return _json_safe(ae.shap_global_analysis())
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


@router.get("/insights")
async def insights():
    try:
        return _json_safe({"insights": ae.generate_insights()})
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


@router.get("/all")
async def analytics_all():
    """Core analytics in one round trip. SHAP is heavy — load via GET /api/analytics/shap."""
    try:
        return _json_safe(
            {
                "summary": ae.summary(),
                "numeric_bins": ae.numeric_binned_analysis(),
                "categorical": ae.categorical_analysis(),
                "cross": ae.cross_analysis(),
                "correlations": ae.correlation_matrix(),
                "scatter_pairs": ae.scatter_pairs(),
                "insights": ae.generate_insights(),
            }
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
