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
- Set `APP_SECRET` in your deployment environment before any production deployment.

## Deploy (Vercel + Render)

This project is best deployed as 2 services:

- **Frontend (Vercel)** from `frontend/`
- **Backend API (Render)** from `backend/`

### A. Deploy backend on Render

1. Push your repo to GitHub.
2. In Render, create a new **Web Service** from the repo.
3. Set **Root Directory** to `backend`.
4. Render can auto-detect from `backend/render.yaml`, or configure manually:
  - Build command: `pip install -r requirements.txt`
  - Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
5. Keep/add env var:
  - `APP_SECRET` (strong random value)
6. Optional but recommended for SQLite persistence:
  - Attach a persistent disk mounted at `/opt/render/project/src/backend/data`

After deploy, copy your backend URL, for example:

`https://employee-attrition-api.onrender.com`

### B. Deploy frontend on Vercel

1. In Vercel, import the same repo.
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Vite**.
4. Add environment variable in Vercel project settings:
  - `VITE_API_BASE_URL=https://employee-attrition-api.onrender.com`
5. Deploy.

`frontend/vercel.json` includes SPA rewrites so routes like `/dashboard` and `/analytics` work on refresh.

### C. Post-deploy check

- Frontend loads from Vercel URL.
- `GET /health` on Render returns `{ "status": "ok" }`.
- Login/register, prediction, analytics, upload flow all work from the Vercel UI.
