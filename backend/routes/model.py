"""Trained model metadata and global feature importance."""
from fastapi import APIRouter, HTTPException

from ml_service import feature_importance_list, load_bundle

router = APIRouter(prefix="/api/model", tags=["model"])


@router.get("/feature-importance")
async def global_feature_importance():
    try:
        bundle = load_bundle()
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail="Trained model missing. Run: python model/train_model.py",
        ) from e
    pipeline = bundle["pipeline"]
    feats = feature_importance_list(bundle, pipeline)
    return {"features": feats[:30]}
