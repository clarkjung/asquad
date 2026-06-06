import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const publicApi = axios.create({ baseURL: BASE_URL, headers: { "Content-Type": "application/json" } });

const providerApi = axios.create({ baseURL: BASE_URL, headers: { "Content-Type": "application/json" } });
providerApi.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("provider_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const consumerApi = axios.create({ baseURL: BASE_URL, headers: { "Content-Type": "application/json" } });
consumerApi.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("consumer_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const agentsApi = {
  search: (q: string, limit = 10) => publicApi.get(`/api/v1/agents/search`, { params: { q, limit } }),
  browse: (category?: string, limit = 20) => publicApi.get(`/api/v1/agents/browse`, { params: { category, limit } }),
  featured: () => publicApi.get(`/api/v1/agents/featured`),
  get: (id: string) => publicApi.get(`/api/v1/agents/${id}`),
  getCard: (id: string) => publicApi.get(`/api/v1/agents/${id}/agent-card`),
  create: (data: object) => providerApi.post(`/api/v1/agents`, data),
  update: (id: string, data: object) => providerApi.put(`/api/v1/agents/${id}`, data),
  delete: (id: string) => providerApi.delete(`/api/v1/agents/${id}`),
  stats: (id: string) => providerApi.get(`/api/v1/agents/${id}/stats`),
  validateEndpoint: (url: string) => publicApi.post(`/api/v1/agents/validate-endpoint`, { url }),
};

export const providersApi = {
  register: (data: object) => publicApi.post(`/api/v1/providers/register`, data),
  login: (data: object) => publicApi.post(`/api/v1/providers/login`, data),
  me: () => providerApi.get(`/api/v1/providers/me`),
  myAgents: () => providerApi.get(`/api/v1/providers/my-agents`),
};

export const consumersApi = {
  register: (data: object) => publicApi.post(`/api/v1/consumers/register`, data),
  login: (data: object) => publicApi.post(`/api/v1/consumers/login`, data),
  createApiKey: (data: object) => consumerApi.post(`/api/v1/consumers/api-keys`, data),
  listApiKeys: () => consumerApi.get(`/api/v1/consumers/api-keys`),
  revokeApiKey: (id: string) => consumerApi.delete(`/api/v1/consumers/api-keys/${id}`),
  usage: () => consumerApi.get(`/api/v1/consumers/usage`),
};

export const gatewayApi = {
  call: (agentId: string, message: string, apiKey: string) =>
    publicApi.post(
      `/api/v1/agents/${agentId}/a2a`,
      {
        jsonrpc: "2.0",
        method: "tasks/send",
        params: { message: { parts: [{ type: "text", text: message }] } },
        id: Date.now(),
      },
      { headers: { Authorization: `Bearer ${apiKey}` } }
    ),
  demo: (agentId: string, message: string) =>
    publicApi.post(`/v1/demo/agents/${agentId}`, {
      jsonrpc: "2.0",
      method: "tasks/send",
      params: { message: { parts: [{ type: "text", text: message }] } },
      id: Date.now(),
    }),
};
