import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export async function login(email, password) {
  const { data } = await api.post("/api/auth/login", { email, password });
  return data;
}

export async function register(email, password, name) {
  const { data } = await api.post("/api/auth/register", {
    email,
    password,
    name,
  });
  return data;
}

export async function predict(payload) {
  const { data } = await api.post("/predict", payload);
  return data;
}

export async function fetchDashboardStats() {
  const { data } = await api.get("/api/dashboard/stats");
  return data;
}

export async function fetchTrends() {
  const { data } = await api.get("/api/dashboard/trends");
  return data;
}

export async function fetchDepartments() {
  const { data } = await api.get("/api/dashboard/departments");
  return data;
}

export async function fetchScatter() {
  const { data } = await api.get("/api/dashboard/scatter");
  return data;
}

export async function fetchJobRoles() {
  const { data } = await api.get("/api/job-roles");
  return data.job_roles;
}

export async function fetchEmployees(q, risk) {
  const params = {};
  if (q) params.q = q;
  if (risk) params.risk = risk;
  const { data } = await api.get("/api/employees", { params });
  return data;
}

export async function sendChatMessage(message) {
  const { data } = await api.post("/api/chat", { message });
  return data;
}

export async function fetchAnalyticsAll() {
  const { data } = await api.get("/api/analytics/all", { timeout: 120000 });
  return data;
}

export async function fetchAnalyticsShap() {
  const { data } = await api.get("/api/analytics/shap", { timeout: 180000 });
  return data;
}

export async function fetchMetaOptions() {
  const { data } = await api.get("/api/meta/options");
  return data;
}

export async function uploadAnalyzeCsv(file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/api/upload/analyze", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
  return data;
}

export async function fetchPredictionHistory(limit = 100) {
  const { data } = await api.get("/api/history/predictions", {
    params: { limit },
  });
  return data;
}

export async function fetchHistoryAnalytics() {
  const { data } = await api.get("/api/history/analytics");
  return data;
}

export async function fetchModelFeatureImportance() {
  const { data } = await api.get("/api/model/feature-importance");
  return data;
}

export default api;
