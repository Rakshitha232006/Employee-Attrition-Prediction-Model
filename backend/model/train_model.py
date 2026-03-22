"""
Train RandomForest on IBM HR Employee Attrition CSV only (no synthetic data).

Default dataset path:
  D:\\Employee_Attrition\\WA_Fn-UseC_-HR-Employee-Attrition.csv
Override with env: ATTRITION_DATASET_PATH

Run from backend folder: python model/train_model.py
"""
from __future__ import annotations

import json
import os
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

ROOT = Path(__file__).resolve().parent
BACKEND_ROOT = ROOT.parent
PROJECT_ROOT = BACKEND_ROOT.parent
OUT = ROOT / "model.pkl"
ANALYSIS_JSON = ROOT / "analysis_summary.json"

from dataset_config import resolve_csv_path  # noqa: E402


def load_xy(path: Path) -> tuple[pd.DataFrame, np.ndarray]:
    df = pd.read_csv(path)
    if "Attrition" not in df.columns:
        raise ValueError("CSV must contain an 'Attrition' column.")

    y = (df["Attrition"].astype(str).str.strip().str.upper() == "YES").astype(int)
    X = df.drop(columns=["Attrition"])

    # Drop identifiers / near-constants that do not generalize
    drop_always = ["EmployeeNumber"]
    for c in drop_always:
        if c in X.columns:
            X = X.drop(columns=[c])

    for c in ["EmployeeCount", "Over18", "StandardHours"]:
        if c in X.columns and X[c].nunique() <= 1:
            X = X.drop(columns=[c])

    return X, y.values


def build_preprocessors(X: pd.DataFrame) -> tuple[list[str], list[str]]:
    cat_cols: list[str] = []
    num_cols: list[str] = []
    for c in X.columns:
        if X[c].dtype == object or str(X[c].dtype) == "bool":
            cat_cols.append(c)
        else:
            num_cols.append(c)
    return num_cols, cat_cols


def main():
    csv_path = resolve_csv_path()
    print(f"Loading: {csv_path}")

    X, y = load_xy(csv_path)
    print(f"Samples: {len(X)}, features (raw): {X.shape[1]}, positive rate: {y.mean():.3f}")

    num_cols, cat_cols = build_preprocessors(X)

    # Impute + encode
    numeric_pipe = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
        ]
    )
    categorical_pipe = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="most_frequent")),
            (
                "onehot",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
            ),
        ]
    )

    preprocessor = ColumnTransformer(
        [
            ("num", numeric_pipe, num_cols),
            ("cat", categorical_pipe, cat_cols),
        ],
        remainder="drop",
    )

    clf = RandomForestClassifier(
        n_estimators=250,
        max_depth=16,
        min_samples_leaf=3,
        class_weight="balanced_subsample",
        random_state=42,
        n_jobs=-1,
    )

    pipeline = Pipeline([("prep", preprocessor), ("clf", clf)])

    strat = y if len(np.unique(y)) > 1 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=strat
    )

    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc = float((y_pred == y_test).mean())
    print(f"Holdout accuracy: {acc:.4f}")
    print(classification_report(y_test, y_pred, digits=3))

    # Defaults for API (median / mode on full training X)
    defaults: dict = {}
    for c in num_cols:
        defaults[c] = float(X[c].median())
    for c in cat_cols:
        mode = X[c].mode()
        defaults[c] = mode.iloc[0] if len(mode) else X[c].iloc[0]

    feature_names_out = pipeline.named_steps["prep"].get_feature_names_out()
    importances = pipeline.named_steps["clf"].feature_importances_
    top_idx = np.argsort(importances)[::-1][:20]
    top_features = [
        {"feature": str(feature_names_out[i]), "value": float(importances[i])}
        for i in top_idx
    ]

    job_roles = sorted(X["JobRole"].dropna().astype(str).unique().tolist())

    bundle = {
        "pipeline": pipeline,
        "num_cols": num_cols,
        "cat_cols": cat_cols,
        "column_order": list(X.columns),
        "defaults": defaults,
        "job_roles": job_roles,
        "trained_on": str(csv_path),
        "n_samples": int(len(X)),
        "attrition_rate": float(y.mean()),
        "holdout_accuracy": acc,
    }

    with open(OUT, "wb") as f:
        pickle.dump(bundle, f)
    print(f"Saved model bundle: {OUT}")

    analysis = {
        "dataset_path": str(csv_path),
        "n_samples": len(X),
        "n_features_raw": X.shape[1],
        "numeric_columns": num_cols,
        "categorical_columns": cat_cols,
        "attrition_rate": float(y.mean()),
        "holdout_accuracy": acc,
        "top_feature_importance": top_features,
    }
    with open(ANALYSIS_JSON, "w", encoding="utf-8") as f:
        json.dump(analysis, f, indent=2)
    print(f"Wrote analysis: {ANALYSIS_JSON}")


if __name__ == "__main__":
    main()
