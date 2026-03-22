# Employee Attrition Prediction System

Full-stack demo: **FastAPI** + **scikit-learn** backend with **SQLite**, and a **React (Vite)** dashboard (Tailwind CSS, Framer Motion, Recharts, Axios) with a dark, glassmorphism-style UI.

## Prerequisites

- Python 3.10+
- Node.js 18+

## 1. Backend (FastAPI)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python model\train_model.py
uvicorn app:app --reload --host 127.0.0.1 --port 8001
```

- Trains a **Random Forest pipeline** (numeric + one-hot categoricals) on **`WA_Fn-UseC_-HR-Employee-Attrition.csv`** only — default path `D:\Employee_Attrition\WA_Fn-UseC_-HR-Employee-Attrition.csv`, or the project root copy, or set **`ATTRITION_DATASET_PATH`**. No synthetic data.
- After training: **`GET /api/analysis-summary`** returns `model/analysis_summary.json` (columns, accuracy, top importances).
- API: `http://127.0.0.1:8001`  
  On Windows, **`WinError 10013`** often means the port is blocked or in an exclusion range (common for **8000** and sometimes **8080**). This project defaults the Vite proxy to **8001** — keep the backend on the same port, or change both `vite.config.js` and the `uvicorn` command to match.
- **POST** `http://127.0.0.1:8001/predict` — JSON body: `age`, `job_role`, `income`, `years_at_company`, `satisfaction`, `work_life_balance`, `overtime`.
- **GET** `http://127.0.0.1:8001/docs` — OpenAPI UI.
- CORS is enabled for local development.

## 2. Frontend (Vite + React)

```powershell
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. The dev server proxies `/api`, `/predict`, and `/health` to the backend on port **8001** (see `frontend/vite.config.js`).

Production build:

```powershell
npm run build
npm run preview
```

## Features

- **Dashboard**: KPIs, attrition trend line chart, department bar chart, satisfaction vs work-life scatter (risk-colored).
- **Predict**: Styled form → probability, risk band (Low / Medium / High), confidence, SHAP-like contributions + feature importance, recommendations.
- **Workforce table**: Search, risk filter, highlighted high-risk rows.
- **AI assistant**: Rule-based chat via `POST /api/chat`.
- **Auth (optional)**: `POST /api/auth/register` and `POST /api/auth/login` (JWT in response). The UI stores the token for authenticated requests; you can still open the dashboard via “Continue without auth” on the login page.

## Project layout

```
Employee_Attrition/
├── backend/
│   ├── app.py
│   ├── ml_service.py
│   ├── database.py
│   ├── data/attrition.db   (created on first run)
│   ├── model/
│   │   ├── train_model.py
│   │   └── model.pkl       (created by training script)
│   └── routes/
└── frontend/
    └── src/
        ├── components/
        ├── pages/
        ├── layouts/
        ├── services/
        └── App.jsx
```

## Notes

- Delete `backend/data/attrition.db` if you need a fresh employee seed after changing the model.
- Change `SECRET` in `backend/routes/auth.py` before any production deployment.
