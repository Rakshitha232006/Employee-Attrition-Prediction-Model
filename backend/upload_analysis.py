"""
Automatic analysis for an uploaded HR-style CSV (pandas groupby, correlations, insights).
"""
from __future__ import annotations

import warnings
import math
from typing import Any

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore", category=UserWarning)

ATTRITION_NAMES = frozenset({"attrition", "attrition_flag", "left", "churn"})


def _sanitize_for_json(value: Any) -> Any:
    """Convert non-JSON-safe numeric values (NaN/Inf) to None recursively."""
    if isinstance(value, dict):
        return {k: _sanitize_for_json(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_sanitize_for_json(v) for v in value]
    if isinstance(value, tuple):
        return [_sanitize_for_json(v) for v in value]
    if isinstance(value, (np.floating, float)):
        f = float(value)
        return f if math.isfinite(f) else None
    if isinstance(value, (np.integer, int)):
        return int(value)
    return value


def find_attrition_column(df: pd.DataFrame) -> str | None:
    for c in df.columns:
        if str(c).strip().lower() in ATTRITION_NAMES:
            return c
    return None


def series_to_binary_y(s: pd.Series) -> pd.Series:
    if pd.api.types.is_bool_dtype(s):
        return s.astype(int)
    if pd.api.types.is_numeric_dtype(s):
        return (pd.to_numeric(s, errors="coerce").fillna(0) > 0).astype(int)
    u = s.astype(str).str.strip().str.upper()
    return u.isin(["YES", "Y", "TRUE", "1", "T"]).astype(int)


def detect_schema(df: pd.DataFrame) -> dict[str, Any]:
    num_cols: list[str] = []
    cat_cols: list[str] = []
    for c in df.columns:
        if pd.api.types.is_numeric_dtype(df[c]) and df[c].nunique(dropna=True) > 1:
            num_cols.append(str(c))
        else:
            cat_cols.append(str(c))
    target = find_attrition_column(df)
    return {
        "numeric_columns": num_cols,
        "categorical_columns": cat_cols,
        "target_column": target,
        "all_columns": [str(c) for c in df.columns],
    }


def _attrition_by_group(df: pd.DataFrame, group_col: str) -> list[dict[str, Any]]:
    g = df.groupby(group_col, observed=True, dropna=False)["_y"].agg(["mean", "count"])
    g = g.reset_index()
    g.columns = ["group", "attrition_rate", "count"]
    total = len(df)
    out = []
    for _, row in g.iterrows():
        lbl = str(row["group"])
        out.append(
            {
                "label": lbl,
                "attrition_rate_pct": round(float(row["attrition_rate"]) * 100, 2),
                "count": int(row["count"]),
                "pct_of_employees": round(float(row["count"] / total * 100), 2),
            }
        )
    return out


def _numeric_binned(df: pd.DataFrame) -> dict[str, list[dict[str, Any]]]:
    out: dict[str, list[dict[str, Any]]] = {}
    specs = [
        ("Age", 5, "Age"),
        ("MonthlyIncome", 5, "MonthlyIncome"),
        ("DistanceFromHome", 5, "DistanceFromHome"),
        ("YearsAtCompany", 5, "YearsAtCompany"),
        ("JobSatisfaction", None, "JobSatisfaction"),
        ("WorkLifeBalance", None, "WorkLifeBalance"),
        ("EnvironmentSatisfaction", None, "EnvironmentSatisfaction"),
    ]
    for col, bins, key in specs:
        if col not in df.columns:
            continue
        if bins is None:
            sub = df[[col, "_y"]].dropna()
            g = sub.groupby(col, observed=True)["_y"].agg(["mean", "count"])
            g = g.reset_index()
            rows = []
            total = len(df)
            for _, row in g.iterrows():
                rows.append(
                    {
                        "label": f"{col}={int(row[col])}",
                        "attrition_rate_pct": round(float(row["mean"]) * 100, 2),
                        "count": int(row["count"]),
                        "pct_of_employees": round(float(row["count"] / total * 100), 2),
                    }
                )
            out[key] = rows
        else:
            try:
                s = pd.to_numeric(df[col], errors="coerce")
                cut = pd.cut(s, bins=bins, duplicates="drop")
                sub = df.assign(_bin=cut)
                g = sub.groupby("_bin", observed=True)["_y"].agg(["mean", "count"])
                g = g.reset_index()
                rows = []
                total = len(df)
                for _, row in g.iterrows():
                    b = row["_bin"]
                    lab = (
                        f"{b.left:.0f}-{b.right:.0f}"
                        if hasattr(b, "left")
                        else str(b)
                    )
                    rows.append(
                        {
                            "label": lab,
                            "attrition_rate_pct": round(float(row["mean"]) * 100, 2),
                            "count": int(row["count"]),
                            "pct_of_employees": round(float(row["count"] / total * 100), 2),
                        }
                    )
                out[key] = rows
            except Exception:
                continue
    return out


def _categorical(df: pd.DataFrame) -> dict[str, list[dict[str, Any]]]:
    cats = [
        "Department",
        "Gender",
        "JobRole",
        "MaritalStatus",
        "OverTime",
        "BusinessTravel",
        "EducationField",
    ]
    result: dict[str, list[dict[str, Any]]] = {}
    for c in cats:
        if c not in df.columns:
            continue
        result[c] = _attrition_by_group(df, c)
    return result


def _cross(df: pd.DataFrame) -> list[dict[str, Any]]:
    blocks: list[dict[str, Any]] = []

    def add(name: str, g1: str, g2: str, *, top: int | None = 30):
        if g1 not in df.columns or g2 not in df.columns:
            return
        sub = df[[g1, g2, "_y"]].dropna()
        g = sub.groupby([g1, g2], observed=True)["_y"].agg(["mean", "count"])
        g = g.reset_index().sort_values("count", ascending=False)
        if top:
            g = g.head(top)
        rows = []
        for _, row in g.iterrows():
            rows.append(
                {
                    "dim1": str(row[g1]),
                    "dim2": str(row[g2]),
                    "attrition_rate_pct": round(float(row["mean"]) * 100, 2),
                    "count": int(row["count"]),
                }
            )
        blocks.append({"name": name, "keys": [g1, g2], "rows": rows})

    add("Department × Gender", "Department", "Gender")
    add("Department × JobRole", "Department", "JobRole", top=25)
    add("Gender × OverTime", "Gender", "OverTime")

    try:
        d2 = df.copy()
        d2["_salary_q"] = pd.qcut(
            d2["MonthlyIncome"].rank(method="first"),
            q=4,
            labels=["Q1 (low)", "Q2", "Q3", "Q4 (high)"],
            duplicates="drop",
        )
        g = (
            d2.groupby(["JobRole", "_salary_q"], observed=True)["_y"]
            .agg(["mean", "count"])
            .reset_index()
            .sort_values("count", ascending=False)
            .head(25)
        )
        rows = []
        for _, row in g.iterrows():
            rows.append(
                {
                    "dim1": str(row["JobRole"]),
                    "dim2": str(row["_salary_q"]),
                    "attrition_rate_pct": round(float(row["mean"]) * 100, 2),
                    "count": int(row["count"]),
                }
            )
        blocks.append(
            {
                "name": "JobRole × Salary quartile",
                "keys": ["JobRole", "MonthlyIncome quartile"],
                "rows": rows,
            }
        )
    except Exception:
        pass

    try:
        d2 = df.copy()
        d2["_age_bin"] = pd.cut(d2["Age"], bins=5)
        sub = d2[["_age_bin", "WorkLifeBalance", "_y"]].dropna()
        g = (
            sub.groupby(["_age_bin", "WorkLifeBalance"], observed=True)["_y"]
            .agg(["mean", "count"])
            .reset_index()
            .sort_values("count", ascending=False)
            .head(24)
        )
        rows = []
        for _, row in g.iterrows():
            b = row["_age_bin"]
            lab = f"{b.left:.0f}-{b.right:.0f}" if hasattr(b, "left") else str(b)
            rows.append(
                {
                    "dim1": lab,
                    "dim2": str(int(row["WorkLifeBalance"])),
                    "attrition_rate_pct": round(float(row["mean"]) * 100, 2),
                    "count": int(row["count"]),
                }
            )
        blocks.append(
            {
                "name": "Age range × WorkLifeBalance",
                "keys": ["Age bin", "WorkLifeBalance"],
                "rows": rows,
            }
        )
    except Exception:
        pass

    return blocks


def _correlation_matrix(df: pd.DataFrame) -> dict[str, Any]:
    num_cols = [
        c
        for c in df.select_dtypes(include=[np.number]).columns
        if c not in ("_y", "EmployeeNumber", "EmployeeCount")
    ]
    if "EmployeeNumber" in df.columns:
        num_cols = [c for c in num_cols if c != "EmployeeNumber"]
    sub = df[num_cols + ["_y"]].copy()
    corr = sub.corr()
    labels = [str(c) for c in corr.columns]
    mat = [
        [round(float(corr.iloc[i, j]), 4) for j in range(len(labels))]
        for i in range(len(labels))
    ]
    return {"labels": labels, "matrix": mat}


def _scatter_pairs(df: pd.DataFrame, max_points: int = 450) -> list[dict[str, Any]]:
    pairs = [
        ("MonthlyIncome", "JobSatisfaction", "Salary vs Job satisfaction"),
        ("DistanceFromHome", "WorkLifeBalance", "Distance vs Work-life balance"),
        ("YearsAtCompany", "YearsSinceLastPromotion", "Tenure vs years since promotion"),
        ("OverTime", "JobSatisfaction", "Overtime (encoded) vs satisfaction"),
    ]
    out = []
    for x, y, title in pairs:
        if x not in df.columns or y not in df.columns:
            continue
        if df[x].dtype == object and x == "OverTime":
            xx = (df[x].astype(str).str.upper() == "YES").astype(float)
        else:
            xx = pd.to_numeric(df[x], errors="coerce")
        yy = pd.to_numeric(df[y], errors="coerce")
        m = pd.DataFrame({"x": xx, "y": yy, "_y": df["_y"]}).dropna()
        if len(m) > max_points:
            m = m.sample(max_points, random_state=42)
        pts = [
            {
                "x": float(r["x"]),
                "y": float(r["y"]),
                "attrition": int(r["_y"]),
            }
            for _, r in m.iterrows()
        ]
        out.append(
            {"id": f"{x}_{y}", "title": title, "xLabel": x, "yLabel": y, "points": pts}
        )
    return out


def _insights(df: pd.DataFrame) -> list[str]:
    lines: list[str] = []
    if "Department" in df.columns:
        d = df.groupby("Department", observed=True)["_y"].mean() * 100
        if len(d):
            worst = d.idxmax()
            best = d.idxmin()
            lines.append(
                f"{worst} shows the highest attrition rate ({d[worst]:.1f}%); "
                f"{best} is lowest among departments ({d[best]:.1f}%)."
            )
    if "OverTime" in df.columns:
        ot = df.groupby("OverTime", observed=True)["_y"].mean() * 100
        if "Yes" in ot.index and "No" in ot.index:
            lines.append(
                f"Overtime Yes: {ot['Yes']:.1f}% attrition vs No: {ot['No']:.1f}%."
            )
    try:
        if "MonthlyIncome" in df.columns:
            d2 = df.copy()
            d2["_inc_q"] = pd.qcut(
                d2["MonthlyIncome"], q=4, labels=["Q1", "Q2", "Q3", "Q4"], duplicates="drop"
            )
            iq = d2.groupby("_inc_q", observed=True)["_y"].mean() * 100
            if len(iq) >= 2:
                lines.append(
                    f"Lowest salary quartile attrition: {iq.iloc[0]:.1f}% vs highest: {iq.iloc[-1]:.1f}%."
                )
    except Exception:
        pass
    if "WorkLifeBalance" in df.columns:
        w = df.groupby("WorkLifeBalance", observed=True)["_y"].mean() * 100
        if len(w) >= 2:
            lines.append(
                "Lower work-life balance scores align with higher attrition in grouped averages."
            )
    for c in ["JobSatisfaction", "EnvironmentSatisfaction", "MonthlyIncome"]:
        if c in df.columns:
            r = df[c].corr(df["_y"])
            if pd.notna(r):
                lines.append(f"Correlation Attrition vs {c}: {r:.3f}.")
                break
    try:
        low = df["MonthlyIncome"] <= df["MonthlyIncome"].quantile(0.25)
        ot = df["OverTime"].astype(str).str.upper() == "YES"
        seg = df[low & ot]["_y"].mean() * 100
        rest = df[~(low & ot)]["_y"].mean() * 100
        lines.append(
            f"Bottom salary quartile + overtime: ~{seg:.1f}% attrition vs others ~{rest:.1f}%."
        )
    except Exception:
        pass
    seen: set[str] = set()
    out: list[str] = []
    for L in lines:
        if L not in seen:
            seen.add(L)
            out.append(L)
    return out[:15]


def dataset_overview(df: pd.DataFrame) -> dict[str, Any]:
    missing = {str(c): int(df[c].isna().sum()) for c in df.columns}
    return {
        "num_rows": len(df),
        "num_columns": len(df.columns),
        "missing_per_column": missing,
        "dtypes": {str(c): str(df[c].dtype) for c in df.columns},
    }


def analyze_uploaded_dataframe(df: pd.DataFrame) -> dict[str, Any]:
    schema = detect_schema(df)
    overview = dataset_overview(df)
    target = schema["target_column"]
    if not target:
        return _sanitize_for_json({
            "schema": schema,
            "overview": overview,
            "error": "No Attrition column found. Add a column named Attrition (Yes/No or 0/1).",
            "numeric_bins": {},
            "categorical": {},
            "cross": [],
            "correlations": {"labels": [], "matrix": []},
            "scatter_pairs": [],
            "insights": [],
        })

    work = df.copy()
    work["_y"] = series_to_binary_y(work[target])
    summary = {
        "total_employees": len(work),
        "attrition_rate_pct": round(float(work["_y"].mean() * 100), 2),
        "avg_monthly_income": round(float(work["MonthlyIncome"].mean()), 2)
        if "MonthlyIncome" in work.columns
        else None,
        "avg_job_satisfaction": round(float(work["JobSatisfaction"].mean()), 3)
        if "JobSatisfaction" in work.columns
        else None,
    }

    return _sanitize_for_json({
        "schema": schema,
        "overview": overview,
        "summary": summary,
        "numeric_bins": _numeric_binned(work),
        "categorical": _categorical(work),
        "cross": _cross(work),
        "correlations": _correlation_matrix(work),
        "scatter_pairs": _scatter_pairs(work),
        "insights": _insights(work),
    })
