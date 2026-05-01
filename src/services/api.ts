import axios from "axios";
import type {
  AuthResponse,
  BatchIngestResponse,
  ChatSession,
  ChatSessionSummary,
  DocumentItem,
  EvalReport,
  HealthReport,
  IngestResponse,
  QueryRequest,
  QueryResponse,
  UsageRecord,
  UsageSummary,
} from "@/types";

// ===== AXIOS INSTANCE =====
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 60_000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("rag-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const key = localStorage.getItem("rag-api-key");
  if (key) config.headers["X-API-Key"] = key;
  return config;
});

http.interceptors.response.use(
  (r) => r,
  (err) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const requestUrl: string = err?.config?.url ?? "";
    // Only dispatch session-expired for protected endpoints, not the auth flow itself
    if (err?.response?.status === 401 && !requestUrl.startsWith("/auth")) {
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    // Rate limit exhausted — dispatch a global event so the UI can react
    if (err?.response?.status === 429) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const rateLimitMsg: string =
        err?.response?.data?.error ??
        "You have exhausted your free use limit. Contact Admin";
      window.dispatchEvent(
        new CustomEvent("rate-limit:exceeded", { detail: { message: rateLimitMsg } }),
      );
    }
    // RAGExceptions use "error" key; standard FastAPI validation uses "detail"
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const msg: string =
      err?.response?.data?.detail ??
      err?.response?.data?.error ??
      err.message ??
      "Unknown error";
    return Promise.reject(new Error(msg));
  },
);

// ===== DOCUMENTS =====
export const documentsApi = {
  list: (): Promise<DocumentItem[]> =>
    http.get<DocumentItem[]>("/documents").then((r) => r.data),

  get: (id: string): Promise<DocumentItem> =>
    http.get<DocumentItem>(`/documents/${id}`).then((r) => r.data),

  upload: (
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<IngestResponse> => {
    const form = new FormData();
    form.append("file", file);
    return http
      .post<IngestResponse>("/ingest", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
        onUploadProgress: (e) => {
          if (onProgress && e.total)
            onProgress(Math.round((e.loaded / e.total) * 100));
        },
      })
      .then((r) => r.data);
  },

  delete: (id: string): Promise<void> =>
    http.delete(`/documents/${id}`).then(() => undefined),

  reindex: (id: string): Promise<IngestResponse> =>
    http.post<IngestResponse>(`/documents/${id}/reindex`).then((r) => r.data),

  uploadZip: (
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<BatchIngestResponse> => {
    const form = new FormData();
    form.append("file", file);
    return http
      .post<BatchIngestResponse>("/ingest/zip", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
        onUploadProgress: (e) => {
          if (onProgress && e.total)
            onProgress(Math.round((e.loaded / e.total) * 100));
        },
      })
      .then((r) => r.data);
  },

  uploadBatch: (
    files: File[],
    onProgress?: (pct: number) => void,
  ): Promise<BatchIngestResponse> => {
    const form = new FormData();
    for (const f of files) form.append("files", f);
    return http
      .post<BatchIngestResponse>("/ingest/batch", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
        onUploadProgress: (e) => {
          if (onProgress && e.total)
            onProgress(Math.round((e.loaded / e.total) * 100));
        },
      })
      .then((r) => r.data);
  },
};

// ===== QUERY =====
export const queryApi = {
  ask: (req: QueryRequest): Promise<QueryResponse> =>
    http
      .post<QueryResponse>("/query", req, { timeout: 300_000 })
      .then((r) => r.data),
};

// ===== EVALUATION =====
export const evalApi = {
  run: (top_k = 5, llm_provider = "ollama"): Promise<EvalReport> =>
    http
      .post<EvalReport>("/evaluate", { top_k, llm_provider })
      .then((r) => r.data),

  latest: (): Promise<EvalReport> =>
    http.get<EvalReport>("/evaluate/results").then((r) => r.data),
};

// ===== HEALTH =====
export const healthApi = {
  check: (): Promise<HealthReport> =>
    http.get<HealthReport>("/health").then((r) => r.data),
};

// ===== AUTH =====
export const authApi = {
  googleSignIn: (idToken: string): Promise<AuthResponse> =>
    http
      .post<AuthResponse>("/auth/google", { id_token: idToken })
      .then((r) => r.data),
};

// ===== CHAT SESSIONS =====
export const chatsApi = {
  list: (): Promise<ChatSessionSummary[]> =>
    http.get<ChatSessionSummary[]>("/chats").then((r) => r.data),

  get: (id: string): Promise<ChatSession> =>
    http.get<ChatSession>(`/chats/${id}`).then((r) => r.data),

  create: (title?: string): Promise<ChatSession> =>
    http
      .post<ChatSession>("/chats", { title: title ?? "New Chat" })
      .then((r) => r.data),

  update: (
    id: string,
    data: { title?: string; messages?: Record<string, unknown>[] },
  ): Promise<ChatSession> =>
    http.put<ChatSession>(`/chats/${id}`, data).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    http.delete(`/chats/${id}`).then(() => undefined),
};

// ===== USAGE / COST =====
export const usageApi = {
  summary: (): Promise<UsageSummary> =>
    http.get<UsageSummary>("/usage/summary").then((r) => r.data),

  history: (params?: {
    limit?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<UsageRecord[]> =>
    http.get<UsageRecord[]>("/usage/history", { params }).then((r) => r.data),
};

export default http;
