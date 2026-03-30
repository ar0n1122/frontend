import { useCallback, useEffect, useRef, useState } from "react";
import { chatsApi, queryApi } from "@/services/api";
import type { ChatMessage, ChatSessionSummary, DocumentMeta } from "@/types";

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export interface UseChatOptions {
  top_k: number;
  modalities: ("text" | "image" | "table")[];
  document_ids?: string[];
  include_ragas: boolean;
  llm_provider: "ollama" | "openai";
}

/** Serialize ChatMessage[] for the API (Date → ISO string). */
function serializeMessages(msgs: ChatMessage[]) {
  return msgs.map((m) => ({
    ...m,
    timestamp:
      m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
  }));
}

export function useChat(opts: UseChatOptions) {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<{ sid: string; msgs: ChatMessage[] } | null>(null);

  // Document scoping state (undefined means use backend default => all documents)
  const [documentIds, setDocumentIds] = useState<string[] | undefined>(
    opts.document_ids,
  );

  // ── Load session list on mount ──
  const refreshSessions = useCallback(async () => {
    try {
      const list = await chatsApi.list();
      setSessions(list);
    } catch {
      /* offline / unauthenticated — silently ignore */
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

  // ── Persist messages to Firestore (debounced) ──
  const scheduleSave = useCallback((sessionId: string, msgs: ChatMessage[]) => {
    pendingSave.current = { sid: sessionId, msgs };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const pending = pendingSave.current;
      if (!pending) return;
      pendingSave.current = null;
      void chatsApi
        .update(pending.sid, {
          messages: serializeMessages(pending.msgs),
        })
        .catch(() => {});
    }, 800);
  }, []);

  // ── Select / load a session ──
  const selectSession = useCallback(async (sessionId: string) => {
    try {
      const session = await chatsApi.get(sessionId);
      const msgs = session.messages.map((m) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
      setActiveSessionId(session.id);
      setMessages(msgs);
    } catch {
      /* session may have been deleted */
    }
  }, []);

  // ── Create a new session ──
  const newSession = useCallback(
    async (title?: string) => {
      try {
        const session = await chatsApi.create(title);
        setActiveSessionId(session.id);
        setMessages([]);
        await refreshSessions();
        return session.id;
      } catch {
        // Offline fallback — in-memory only
        setActiveSessionId(null);
        setMessages([]);
        return null;
      }
    },
    [refreshSessions],
  );

  // ── Delete a session ──
  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await chatsApi.delete(sessionId);
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          setMessages([]);
        }
        await refreshSessions();
      } catch {
        /* ignore */
      }
    },
    [activeSessionId, refreshSessions],
  );

  // ── Send message ──
  const sendMessage = useCallback(
    async (
      question: string,
      overrides?: {
        document_ids?: string[] | undefined;
        document_metadata?: DocumentMeta[];
      },
    ) => {
      if (!question.trim()) return;

      // Auto-create a session if none is active
      let sid = activeSessionId;
      if (!sid) {
        const firstWords =
          question.length > 40 ? question.slice(0, 40) + "…" : question;
        sid = (await newSession(firstWords)) ?? null;
      }

      const userMsg: ChatMessage = {
        id: makeId(),
        role: "user",
        content: question,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const next = [...prev, userMsg];
        if (sid) scheduleSave(sid, next);
        return next;
      });

      setIsLoading(true);

      try {
        const effectiveIds =
          overrides?.document_ids ?? documentIds ?? opts.document_ids;
        const result = await queryApi.ask({
          question,
          top_k: opts.top_k,
          modalities: opts.modalities,
          document_ids: effectiveIds,
          document_metadata: overrides?.document_metadata,
          include_ragas: opts.include_ragas,
          llm_provider: opts.llm_provider,
          session_id: sid,
        });

        const botMsg: ChatMessage = {
          id: makeId(),
          role: "assistant",
          content: result.answer,
          sources: result.sources,
          latency: result.latency,
          ragas: result.ragas,
          model: result.model,
          timestamp: new Date(),
        };

        setMessages((prev) => {
          const next = [...prev, botMsg];
          if (sid) scheduleSave(sid, next);
          return next;
        });
      } catch {
        const errMsg: ChatMessage = {
          id: makeId(),
          role: "assistant",
          content:
            "⚠️ Failed to get a response. Please check the backend is running on `localhost:8000`.",
          timestamp: new Date(),
          isError: true,
        };
        setMessages((prev) => [...prev, errMsg]);
        // Don't persist error messages to Firestore
      } finally {
        setIsLoading(false);
        void refreshSessions();
      }
    },
    [
      activeSessionId,
      newSession,
      opts,
      scheduleSave,
      refreshSessions,
      documentIds,
    ],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setActiveSessionId(null);
  }, []);

  const retryMessage = useCallback(
    async (messageId: string) => {
      // Remove any existing error reply following the user message and then resend
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === messageId);
        if (idx === -1) return prev;
        const next = prev[idx + 1];
        if (next?.isError) {
          return [...prev.slice(0, idx + 1), ...prev.slice(idx + 2)];
        }
        return prev;
      });

      const userMsg = messages.find((m) => m.id === messageId);
      if (!userMsg) return;
      const question = userMsg.content;

      let sid = activeSessionId;
      setIsLoading(true);
      try {
        const result = await queryApi.ask({
          question,
          top_k: opts.top_k,
          modalities: opts.modalities,
          document_ids: documentIds ?? opts.document_ids,
          include_ragas: opts.include_ragas,
          llm_provider: opts.llm_provider,
          session_id: sid,
        });
        const botMsg: ChatMessage = {
          id: makeId(),
          role: "assistant",
          content: result.answer,
          sources: result.sources,
          latency: result.latency,
          ragas: result.ragas,
          model: result.model,
          timestamp: new Date(),
        };

        setMessages((prev) => {
          const next = [...prev, botMsg];
          if (sid) scheduleSave(sid, next);
          return next;
        });
      } catch {
        const errMsg: ChatMessage = {
          id: makeId(),
          role: "assistant",
          content:
            "⚠️ Failed to get a response. Please check the backend is running on `localhost:8000`.",
          timestamp: new Date(),
          isError: true,
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsLoading(false);
        void refreshSessions();
      }
    },
    [
      messages,
      activeSessionId,
      opts,
      scheduleSave,
      refreshSessions,
      documentIds,
    ],
  );

  return {
    messages,
    sessions,
    sessionsLoading,
    activeSessionId,
    sendMessage,
    clearMessages,
    selectSession,
    newSession,
    deleteSession,
    retryMessage,
    isLoading,
    abortRef,
    // document scoping
    documentIds: documentIds,
    setDocumentIds,
  };
}
