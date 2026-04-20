import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const agentsApi = {
  search: (q: string, limit = 10) => api.get(`/api/v1/agents/search`, { params: { q, limit } }),
  browse: (category?: string, limit = 20) => api.get(`/api/v1/agents/browse`, { params: { category, limit } }),
  featured: () => api.get(`/api/v1/agents/featured`),
  get: (id: string) => api.get(`/api/v1/agents/${id}`),
  getCard: (id: string) => api.get(`/api/v1/agents/${id}/agent-card`),
  create: (data: object) => api.post(`/api/v1/agents`, data),
  update: (id: string, data: object) => api.put(`/api/v1/agents/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/agents/${id}`),
  stats: (id: string) => api.get(`/api/v1/agents/${id}/stats`),
};

export const providersApi = {
  register: (data: object) => api.post(`/api/v1/providers/register`, data),
  login: (data: object) => api.post(`/api/v1/providers/login`, data),
};

export const consumersApi = {
  register: (data: object) => api.post(`/api/v1/consumers/register`, data),
  login: (data: object) => api.post(`/api/v1/consumers/login`, data),
  createApiKey: (data: object) => api.post(`/api/v1/consumers/api-keys`, data),
  listApiKeys: () => api.get(`/api/v1/consumers/api-keys`),
  revokeApiKey: (id: string) => api.delete(`/api/v1/consumers/api-keys/${id}`),
  usage: () => api.get(`/api/v1/consumers/usage`),
};

export const gatewayApi = {
  call: (agentId: string, message: string, apiKey: string) =>
    api.post(
      `/api/v1/agents/${agentId}/a2a`,
      {
        jsonrpc: "2.0",
        method: "tasks/send",
        params: { message: { parts: [{ type: "text", text: message }] } },
        id: Date.now(),
      },
      { headers: { Authorization: `Bearer ${apiKey}` } }
    ),
};
