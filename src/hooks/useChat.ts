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

/** Serialize ChatMessage[] for the API (Date → ISO string, strip transient fields). */
function serializeMessages(msgs: ChatMessage[]) {
  return msgs.map(({ _pendingReplyId, ...m }) => ({
    ...m,
    timestamp:
      m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
  }));
}

export function useChat(opts: UseChatOptions) {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<{ sid: string; msgs: ChatMessage[] } | null>(null);
  // Track the session being created to avoid racing auto-creates
  const creatingSessionRef = useRef<Promise<string | null> | null>(null);

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

  // ── Send message (truly async — multiple can be in-flight) ──
  const sendMessage = useCallback(
    async (
      question: string,
      overrides?: {
        document_ids?: string[] | undefined;
        document_metadata?: DocumentMeta[];
      },
    ) => {
      if (!question.trim()) return;

      // Auto-create a session if none is active (deduplicated via ref)
      let sid = activeSessionId;
      if (!sid) {
        if (!creatingSessionRef.current) {
          const firstWords =
            question.length > 40 ? question.slice(0, 40) + "…" : question;
          creatingSessionRef.current = newSession(firstWords);
        }
        sid = (await creatingSessionRef.current) ?? null;
        creatingSessionRef.current = null;
      }

      // Resolve effective document IDs: explicit overrides > last user message's docs > sidebar > opts
      const effectiveIds =
        overrides?.document_ids ?? documentIds ?? opts.document_ids;

      const userMsgId = makeId();
      const botMsgId = makeId();

      const userMsg: ChatMessage = {
        id: userMsgId,
        role: "user",
        content: question,
        timestamp: new Date(),
        document_ids: effectiveIds,
        document_metadata: overrides?.document_metadata,
        _pendingReplyId: botMsgId,
      };

      // Optimistically add user message
      setMessages((prev) => {
        const next = [...prev, userMsg];
        if (sid) scheduleSave(sid, next);
        return next;
      });

      // Track this reply as in-flight
      setPendingIds((prev) => new Set(prev).add(botMsgId));

      try {
        const result = await queryApi.ask({
          question,
          top_k: opts.top_k,
          modalities: opts.modalities,
          document_ids: effectiveIds,
          document_metadata: overrides?.document_metadata,
          include_ragas: opts.include_ragas,
          llm_provider: opts.llm_provider,
          session_id: sid ?? undefined,
        });

        const botMsg: ChatMessage = {
          id: botMsgId,
          role: "assistant",
          content: result.answer,
          sources: result.sources,
          latency: result.latency,
          ragas: result.ragas,
          model: result.model,
          cost: result.cost,
          timestamp: new Date(),
        };

        setMessages((prev) => {
          // Clear _pendingReplyId from the user message and append the bot reply
          const next = prev.map((m) =>
            m.id === userMsgId ? { ...m, _pendingReplyId: undefined } : m,
          );
          next.push(botMsg);
          if (sid) scheduleSave(sid, next);
          return next;
        });
      } catch (err) {
        const errMsg: ChatMessage = {
          id: botMsgId,
          role: "assistant",
          content: "⚠️ Something went wrong. Please try again in a moment.",
          timestamp: new Date(),
          isError: true,
        };
        setMessages((prev) => {
          const next = prev.map((m) =>
            m.id === userMsgId ? { ...m, _pendingReplyId: undefined } : m,
          );
          next.push(errMsg);
          return next;
        });
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(botMsgId);
          return next;
        });
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
      const userMsg = messages.find((m) => m.id === messageId);
      if (!userMsg) return;

      // Remove any existing error reply following the user message
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === messageId);
        if (idx === -1) return prev;
        const next_msg = prev[idx + 1];
        if (next_msg?.isError) {
          return [...prev.slice(0, idx + 1), ...prev.slice(idx + 2)];
        }
        return prev;
      });

      const question = userMsg.content;
      // Reuse the document_ids from the original user message for the retry
      const retryDocIds =
        userMsg.document_ids ?? documentIds ?? opts.document_ids;

      let sid = activeSessionId;
      const botMsgId = makeId();

      // Mark the user message as having a pending reply
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, _pendingReplyId: botMsgId } : m,
        ),
      );
      setPendingIds((prev) => new Set(prev).add(botMsgId));

      try {
        const result = await queryApi.ask({
          question,
          top_k: opts.top_k,
          modalities: opts.modalities,
          document_ids: retryDocIds,
          include_ragas: opts.include_ragas,
          llm_provider: opts.llm_provider,
          session_id: sid ?? undefined,
        });
        const botMsg: ChatMessage = {
          id: botMsgId,
          role: "assistant",
          content: result.answer,
          sources: result.sources,
          latency: result.latency,
          ragas: result.ragas,
          model: result.model,
          cost: result.cost,
          timestamp: new Date(),
        };

        setMessages((prev) => {
          const next = prev.map((m) =>
            m.id === messageId ? { ...m, _pendingReplyId: undefined } : m,
          );
          next.push(botMsg);
          if (sid) scheduleSave(sid, next);
          return next;
        });
      } catch (err) {
        const errMsg: ChatMessage = {
          id: botMsgId,
          role: "assistant",
          content: "⚠️ Something went wrong. Please try again in a moment.",
          timestamp: new Date(),
          isError: true,
        };
        setMessages((prev) => {
          const next = prev.map((m) =>
            m.id === messageId ? { ...m, _pendingReplyId: undefined } : m,
          );
          next.push(errMsg);
          return next;
        });
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(botMsgId);
          return next;
        });
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

  // Derived: true when any query is in-flight (backwards-compat)
  const isLoading = pendingIds.size > 0;

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
    pendingIds,
    abortRef,
    // document scoping
    documentIds: documentIds,
    setDocumentIds,
  };
}
