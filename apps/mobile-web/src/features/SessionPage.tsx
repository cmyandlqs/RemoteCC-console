import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiClient } from "../lib/api.js";
import { wsClient, type WsEnvelope } from "../lib/ws.js";
import { useSessionStore, type SessionStatus, type OutputChunk } from "../stores/session-store.js";

const VALID_SESSION_STATUSES: Set<string> = new Set([
  "idle",
  "running",
  "waiting_approval",
  "completed",
  "stopped",
  "error",
]);

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState("");

  const store = useSessionStore();
  const sessionStatus = sessionId ? store.getStatus(sessionId) : "idle";
  const outputChunks: OutputChunk[] = sessionId ? store.getChunks(sessionId) : [];
  const pendingApprovals = sessionId ? store.getApprovals(sessionId) : [];

  const { currentModel, inputTokens, outputTokens, totalCostUsd, contextWindow } = store;

  const { data: sessionData, refetch: refetchSession } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => apiClient.getSession(sessionId!),
    enabled: !!sessionId,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      return status === "running" ? 3000 : false;
    },
  });

  const session = sessionData?.data;

  const { data: messagesData } = useQuery({
    queryKey: ["session-messages", sessionId],
    queryFn: () => apiClient.getMessages(sessionId!),
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (!messagesData?.data || !sessionId) return;
    const existing = store.getChunks(sessionId);
    if (existing.length > 0) return;
    const loadedSeqs = new Set<string>();
    for (const msg of messagesData.data) {
      const key = `${msg.seq}`;
      if (loadedSeqs.has(key)) continue;
      loadedSeqs.add(key);
      store.appendChunk(sessionId, {
        eventId: msg.id,
        text: msg.content,
        kind: msg.kind as "text" | "thinking" | "user",
        timestamp: msg.createdAt,
      });
    }
  }, [messagesData, sessionId]);

  useEffect(() => {
    if (!session) return;
    if (VALID_SESSION_STATUSES.has(session.status) && sessionId) {
      store.setSessionStatus(sessionId, session.status as SessionStatus);
    }
    store.updateUsage({
      model: session.model,
      inputTokens: session.inputTokens,
      outputTokens: session.outputTokens,
      totalCostUsd: session.totalCostUsd,
      contextWindow: session.contextWindow,
    });
  }, [session?.status, session?.model, session?.inputTokens, session?.outputTokens, session?.totalCostUsd, session?.contextWindow]);

  const initialPromptWritten = useRef(false);

  useEffect(() => {
    if (initialPromptWritten.current) return;
    if (!location.state?.prompt || !sessionId) return;
    const existing = store.getChunks(sessionId);
    if (existing.some((c) => c.kind === "user")) return;
    initialPromptWritten.current = true;
    store.appendChunk(sessionId, {
      eventId: `local-${Date.now()}`,
      text: location.state.prompt as string,
      kind: "user",
      timestamp: new Date().toISOString(),
    });
    window.history.replaceState({}, "");
  }, [location.state, sessionId]);

  const sendMessage = useMutation({
    mutationFn: (text: string) => apiClient.sendMessage(sessionId!, text),
    onSuccess: () => {
      refetchSession();
    },
  });

  const stopSession = useMutation({
    mutationFn: () => apiClient.stopSession(sessionId!),
    onSuccess: () => {
      refetchSession();
    },
  });

  const renameSession = useMutation({
    mutationFn: (name: string) => apiClient.renameSession(sessionId!, name),
    onSuccess: () => {
      refetchSession();
      setEditingName(false);
    },
  });

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const respondApproval = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "rejected" | "dismissed" }) =>
      apiClient.respondApproval(id, action),
    onSuccess: () => {
      void stopSession.mutate();
    },
  });

  useEffect(() => {
    if (!sessionId) return;

    const unsub = wsClient.subscribe((envelope: WsEnvelope) => {
      if (envelope.sessionId && envelope.sessionId !== sessionId) return;

      switch (envelope.type) {
        case "session.state.changed": {
          const payload = envelope.payload as { status: string };
          if (VALID_SESSION_STATUSES.has(payload.status)) {
            store.setSessionStatus(sessionId, payload.status as SessionStatus);
          }
          break;
        }
        case "session.message.delta": {
          const p = envelope.payload as { text: string; kind?: string };
          store.appendChunk(sessionId, {
            eventId: envelope.eventId,
            text: p.text,
            kind: p.kind === "thinking" || p.kind === "text" || p.kind === "user"
              ? (p.kind as "thinking" | "text" | "user")
              : ("text" as const),
            timestamp: envelope.ts,
          });
          break;
        }
        case "session.usage.updated": {
          const p = envelope.payload as {
            model?: string;
            inputTokens?: number;
            outputTokens?: number;
            costUsd?: number;
            contextWindow?: number;
          };
          store.updateUsage({
            model: p.model ?? null,
            inputTokens: p.inputTokens ?? null,
            outputTokens: p.outputTokens ?? null,
            totalCostUsd: p.costUsd !== undefined ? String(p.costUsd) : null,
            contextWindow: p.contextWindow ?? null,
          });
          break;
        }
        case "session.approval.requested": {
          const p = envelope.payload as {
            approvalId: string;
            toolUseId: string;
            toolName: string;
            description: string;
            payload: unknown;
          };
          store.addApproval({
            approvalId: p.approvalId,
            sessionId,
            toolUseId: p.toolUseId,
            toolName: p.toolName,
            description: p.description,
            payload: p.payload,
          });
          break;
        }
        case "session.approval.resolved": {
          const p = envelope.payload as { approvalId: string };
          store.removeApproval(p.approvalId);
          refetchSession();
          break;
        }
        case "session.completed":
          store.setSessionStatus(sessionId, "completed");
          refetchSession();
          break;
        case "session.error":
          store.setSessionStatus(sessionId, "error");
          refetchSession();
          break;
      }
    });

    wsClient.connect();
    wsClient.subscribeSession(sessionId);

    return () => {
      unsub();
      wsClient.unsubscribeSession(sessionId);
    };
  }, [sessionId]);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [outputChunks]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || !sessionId) return;
    store.appendChunk(sessionId, {
      eventId: `local-${Date.now()}`,
      text,
      kind: "user",
      timestamp: new Date().toISOString(),
    });
    sendMessage.mutate(text);
    setInputText("");
  };

  const costDisplay =
    totalCostUsd !== null
      ? `$${parseFloat(totalCostUsd).toFixed(4)}`
      : null;

  const canSend = sessionStatus === "running" || sessionStatus === "idle" || sessionStatus === "completed" || sessionStatus === "error";

  return (
    <section className="session-shell">
      <header className="session-header">
        <div>
          <button type="button" className="btn-back" onClick={() => navigate(-1)}>
            ← 返回
          </button>
          {editingName ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && nameInput.trim()) {
                    renameSession.mutate(nameInput.trim());
                  }
                  if (e.key === "Escape") setEditingName(false);
                }}
                placeholder="输入会话名称"
                style={{ fontSize: 16, padding: "4px 8px", flex: 1 }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => nameInput.trim() && renameSession.mutate(nameInput.trim())}
                disabled={!nameInput.trim() || renameSession.isPending}
                style={{ fontSize: 13, padding: "4px 10px" }}
              >
                保存
              </button>
              <button
                type="button"
                onClick={() => setEditingName(false)}
                style={{ fontSize: 13, padding: "4px 10px" }}
              >
                取消
              </button>
            </div>
          ) : (
            <h2 style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {session?.name ?? "会话"}
              <button
                type="button"
                className="btn-rename"
                onClick={() => {
                  setNameInput(session?.name ?? "");
                  setEditingName(true);
                }}
              >
                ✏️
              </button>
            </h2>
          )}
        </div>
        <span className={`status-dot ${sessionStatus === "running" ? "online" : "offline"}`}>
          {sessionStatus === "running"
            ? "运行中"
            : sessionStatus === "idle"
              ? "空闲"
              : sessionStatus === "waiting_approval"
                ? "待审批"
                : sessionStatus === "completed"
                  ? "已完成"
                  : sessionStatus === "stopped"
                    ? "已停止"
                    : sessionStatus === "error"
                      ? "出错"
                      : "—"}
        </span>
      </header>

      <div className="metric-strip">
        <span>{currentModel ?? "—"}</span>
        {inputTokens !== null && outputTokens !== null && (
          <>
            <span>Token: {inputTokens + outputTokens}</span>
          </>
        )}
        {costDisplay && <span>Cost: {costDisplay}</span>}
        {contextWindow && <span>Context: {contextWindow}</span>}
      </div>

      <div className="timeline" ref={timelineRef}>
        {outputChunks.length === 0 && (
          <div className="empty-timeline">
            {sessionStatus === "running"
              ? "等待输出..."
              : sessionStatus === "idle" || sessionStatus === "completed"
                ? "会话已结束"
                : sessionStatus === "error"
                  ? "会话出错"
                  : "等待输出..."}
          </div>
        )}
        {outputChunks.map((chunk, i) => (
          <div
            key={`${chunk.eventId}-${i}`}
            className={`bubble ${chunk.kind === "thinking" ? "bubble--thinking" : ""} ${chunk.kind === "user" ? "bubble--user" : ""}`}
          >
            {chunk.kind === "user" ? chunk.text : (
              <Markdown remarkPlugins={[remarkGfm]}>{chunk.text}</Markdown>
            )}
          </div>
        ))}

        {pendingApprovals.map((a) => (
          <div key={a.approvalId} className="approval-card">
            <strong>⚠ 审批请求</strong>
            <p className="approval-tool">{a.toolName}</p>
            <p className="approval-desc">{a.description}</p>
            <div className="actions">
              <button
                type="button"
                className="btn-danger"
                onClick={() =>
                  respondApproval.mutate({ id: a.approvalId, action: "rejected" })
                }
                disabled={respondApproval.isPending}
              >
                停止 session
              </button>
            </div>
          </div>
        ))}
      </div>

      <footer className="composer">
        <input
          type="text"
          placeholder={
            sessionStatus === "running"
              ? "Claude 正在思考..."
              : "输入消息发送给 Claude..."
          }
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={!canSend}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!inputText.trim() || !canSend}
        >
          发送
        </button>
        {sessionStatus === "running" && (
          <button
            type="button"
            className="btn-danger"
            onClick={() => stopSession.mutate()}
            disabled={stopSession.isPending}
          >
            停止
          </button>
        )}
      </footer>
    </section>
  );
}