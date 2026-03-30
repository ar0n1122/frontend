/* =========================================================
   DOCUMENTS
   ========================================================= */
export type DocumentStatus =
  | "indexed"
  | "processing"
  | "failed"
  | "queued"
  | "uploaded";

export interface DocumentItem {
  id: string;
  title: string;
  filename: string;
  status: DocumentStatus;
  pages: number;
  chunks: number;
  images: number;
  size_bytes: number;
  indexed_at: string | null;
  processing_duration_s: number | null;
  progress?: number; // 0-100 for 'processing'
  processing_stage?: string | null;
  error?: string | null;
}

export interface IngestResponse {
  document_id: string;
  status: DocumentStatus;
  message: string;
  filename: string;
  total_chunks: number;
  total_pages: number;
  tables_found: number;
  processing_time_s: number;
}

export interface BatchIngestResponse {
  documents: IngestResponse[];
  total_files: number;
  skipped_files: string[];
  message: string;
}

/* =========================================================
   CHAT / QUERY
   ========================================================= */
export interface SourceChunk {
  document_id: string;
  document_title: string;
  filename: string;
  page: number;
  section: string;
  text_preview: string;
  score: number;
  modality: "text" | "image" | "table";
}

export interface RagasScores {
  faithfulness: number;
  answer_relevancy: number;
  context_precision: number;
}

export interface QueryResponse {
  answer: string;
  sources: SourceChunk[];
  latency: {
    dense_ms: number;
    sparse_ms: number;
    fusion_ms: number;
    rerank_ms: number;
    llm_ms: number;
    total_ms: number;
  };
  ragas?: RagasScores;
  model: string;
}

export interface DocumentMeta {
  id: string;
  title?: string;
  filename?: string;
  status?: string;
}

export interface QueryRequest {
  question: string;
  top_k: number;
  modalities: ("text" | "image" | "table")[];
  document_ids?: string[];
  document_metadata?: DocumentMeta[];
  include_ragas: boolean;
  llm_provider: "ollama" | "openai";
  session_id?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
  latency?: QueryResponse["latency"];
  ragas?: RagasScores;
  model?: string;
  timestamp: Date;
  isError?: boolean;
}

/* =========================================================
   EVALUATION
   ========================================================= */
export interface EvalMetrics {
  hit_at_k: number;
  mrr: number;
  recall_at_k: number;
  precision_at_k: number;
  faithfulness: number;
  answer_relevancy: number;
  context_precision: number;
  hallucination_rate: number;
  avg_latency_ms: number;
  total_questions: number;
}

export interface EvalQuestionResult {
  id: string;
  question: string;
  category: "financial" | "visual" | "tabular" | "strategic" | "general";
  hit_at_k: boolean;
  faithfulness: number;
  answer_relevancy: number;
  context_precision: number;
  latency_ms: number;
  answer: string;
  ground_truth: string;
}

export interface EvalReport {
  id: string;
  run_at: string;
  llm_provider: string;
  top_k: number;
  metrics: EvalMetrics;
  questions: EvalQuestionResult[];
}

export interface LLMComparison {
  metric: string;
  ollama: number | string;
  openai: number | string;
  delta_type: "up" | "down" | "neutral";
  delta: string;
}

/* =========================================================
   HEALTH
   ========================================================= */
export type ServiceStatus = "healthy" | "unhealthy" | "degraded" | "unknown";

export interface ServiceHealth {
  name: string;
  url: string;
  status: ServiceStatus;
  latency_ms: number;
  uptime_s: number;
  version?: string;
  extra: Record<string, string | number>;
}

export interface HealthReport {
  overall: ServiceStatus;
  checked_at: string;
  services: ServiceHealth[];
  pipeline: {
    dense_ms: number;
    sparse_ms: number;
    fusion_ms: number;
    rerank_ms: number;
    llm_ms: number;
  };
}

/* =========================================================
   SETTINGS
   ========================================================= */
export interface AppSettings {
  api_url: string;
  api_key: string;
  default_llm: "ollama" | "openai";
  openai_api_key: string;
  default_top_k: number;
  include_images: boolean;
  auto_ragas: boolean;
}

/* =========================================================
   AUTH
   ========================================================= */
export interface AuthUser {
  user_id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

/* =========================================================
   CHAT SESSIONS
   ========================================================= */
export interface ChatSessionSummary {
  id: string;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}
