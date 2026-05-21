import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiClient } from "../lib/api.js";
import { wsClient, type WsEnvelope } from "../lib/ws.js";
import { useSessionStore, type SessionStatus, type OutputChunk } from "../stores/session-store.js";
import {
  Button,
  Input,
  StatusDot,
  RuntimeBar,
  TimelineItem,
  ToolCallCard,
  ApprovalCard,
  EmptyState,
} from "@agent-console/shared-ui";

const VALID_SESSION_STATUSES: Set<string> = new Set([
  "idle", "running", "waiting_approval", "completed", "stopped", "error",
]);

const TERMINAL_STATES: Set<string> = new Set(["completed", "error"]);

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const timelineRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputText, setInputText] = useState("");

  const store = useSessionStore();
  const sessionStatus = sessionId ? store.getStatus(sessionId) : "idle";
  const outputChunks: OutputChunk[] = sessionId ? store.getChunks(sessionId) : [];
  const pendingApprovals = sessionId ? store.getApprovals(sessionId) : [];
  const toolCalls = sessionId ? store.getToolCalls(sessionId) : [];
  const sessionData_ = sessionId ? store.getSessionData(sessionId) : null;

  const currentModel = sessionData_?.model ?? null;
  const inputTokens = sessionData_?.inputTokens ?? null;
  const outputTokens = sessionData_?.outputTokens ?? null;
  const totalCostUsd = sessionData_?.totalCostUsd ?? null;
  const contextWindow = sessionData_?.contextWindow ?? null;

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
    if (sessionId) {
      store.updateUsage(sessionId, {
        model: session.model ?? null,
        inputTokens: session.inputTokens ?? null,
        outputTokens: session.outputTokens ?? null,
        totalCostUsd: session.totalCostUsd ?? null,
        contextWindow: session.contextWindow ?? null,
      });
    }
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
    onSuccess: () => refetchSession(),
  });

  const stopSession = useMutation({
    mutationFn: () => apiClient.stopSession(sessionId!),
    onSuccess: () => refetchSession(),
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
      refetchSession();
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
            const current = store.getStatus(sessionId);
            if (TERMINAL_STATES.has(current)) break;
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
        case "session.command.started": {
          const p = envelope.payload as { toolUseId?: string; toolName?: string; input?: unknown };
          if (p.toolUseId && p.toolName) {
            store.addToolCall(sessionId, {
              toolUseId: p.toolUseId,
              toolName: p.toolName,
              state: "running",
              input: typeof p.input === "string" ? p.input : JSON.stringify(p.input, null, 2),
              timestamp: envelope.ts,
            });
          }
          break;
        }
        case "session.command.completed": {
          const p = envelope.payload as { toolUseId?: string; output?: unknown; isError?: boolean };
          if (p.toolUseId) {
            store.updateToolCall(sessionId, p.toolUseId, {
              state: p.isError ? "error" : "completed",
              output: typeof p.output === "string" ? p.output : JSON.stringify(p.output, null, 2),
            });
          }
          break;
        }
        case "session.usage.updated": {
          const p = envelope.payload as {
            model?: string; inputTokens?: number; outputTokens?: number;
            costUsd?: number; contextWindow?: number;
          };
          store.updateUsage(sessionId, {
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
            approvalId: string; toolUseId: string; toolName: string;
            description: string; payload: unknown;
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
  }, [outputChunks, pendingApprovals, toolCalls]);

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
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  };

  const handleTextareaInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const el = e.target;
    el.style.height = "44px";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  const canSend = sessionStatus === "running" || sessionStatus === "idle" || sessionStatus === "completed" || sessionStatus === "error";

  const statusLabelMap: Record<string, string> = {
    running: "运行中",
    idle: "空闲",
    waiting_approval: "待审批",
    completed: "已完成",
    stopped: "已停止",
    error: "出错",
  };

  const statusVariantMap: Record<string, "online" | "idle" | "warning" | "info" | "neutral" | "error"> = {
    running: "online",
    idle: "idle",
    waiting_approval: "warning",
    completed: "info",
    stopped: "neutral",
    error: "error",
  };

  return (
    <section className="h-screen flex flex-col overflow-hidden bg-[var(--color-bg-base)]">
      <header className="flex-shrink-0 flex items-center justify-between gap-3 px-4 h-12 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] z-[var(--z-sticky)]">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center w-8 h-8 -ml-1 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ChevronLeftIcon />
          </button>

          {editingName ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Input
                size="sm"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && nameInput.trim()) {
                    renameSession.mutate(nameInput.trim());
                  }
                  if (e.key === "Escape") setEditingName(false);
                }}
                placeholder="会话名称"
                className="flex-1 text-sm"
                autoFocus
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => nameInput.trim() && renameSession.mutate(nameInput.trim())}
                disabled={!nameInput.trim() || renameSession.isPending}
              >
                保存
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditingName(false)}>
                取消
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {session?.name ?? "会话"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setNameInput(session?.name ?? "");
                  setEditingName(true);
                }}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors opacity-50 hover:opacity-100"
              >
                <EditIcon />
              </button>
            </div>
          )}
        </div>

        <StatusDot
          variant={statusVariantMap[sessionStatus] ?? "neutral"}
          label={statusLabelMap[sessionStatus] ?? "—"}
          size="sm"
          pulse={sessionStatus === "running"}
        />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3 pb-[140px]" ref={timelineRef}>
        {outputChunks.length === 0 && pendingApprovals.length === 0 && toolCalls.length === 0 && (
          <EmptyState
            title={
              sessionStatus === "running"
                ? "等待输出..."
                : sessionStatus === "idle" || sessionStatus === "completed"
                ? "会话已就绪"
                : sessionStatus === "error"
                ? "会话出错"
                : "等待输出..."
            }
            description="Claude 的输出将在这里实时显示"
          />
        )}

        {renderTimeline(outputChunks, toolCalls, pendingApprovals, respondApproval, stopSession, sessionStatus)}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-[var(--z-fixed)] bg-[var(--color-bg-surface)]/95 backdrop-blur-md border-t border-[var(--color-border-subtle)] safe-bottom">
        <RuntimeBar
          model={currentModel}
          inputTokens={inputTokens}
          outputTokens={outputTokens}
          costUsd={totalCostUsd}
          contextWindow={contextWindow}
          state={sessionStatus as any}
        />
        <div className="flex items-end gap-2 px-3 py-2">
          <textarea
            ref={textareaRef}
            placeholder={
              sessionStatus === "running"
                ? "Claude 正在思考..."
                : "输入消息..."
            }
            value={inputText}
            onChange={handleTextareaInput}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={!canSend}
            rows={1}
            className={[
              "flex-1 resize-none rounded-xl border border-[var(--color-border-subtle)]",
              "bg-[var(--color-bg-inset)] px-3 py-2.5 text-sm",
              "text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
              "focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30",
              "transition-colors duration-[var(--duration-fast)]",
              "min-h-[44px] max-h-[120px]",
              "leading-[20px]",
            ].join(" ")}
          />
          {sessionStatus === "running" ? (
            <Button
              variant="danger"
              size="md"
              onClick={() => stopSession.mutate()}
              disabled={stopSession.isPending}
              className="flex-shrink-0 h-[44px]"
            >
              停止
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={handleSend}
              disabled={!inputText.trim() || !canSend}
              className="flex-shrink-0 h-[44px]"
            >
              发送
            </Button>
          )}
        </div>
      </footer>
    </section>
  );
}

type RespondApprovalFn = {
  mutate: (vars: { id: string; action: "rejected" | "dismissed" }) => void;
  isPending: boolean;
};
type StopSessionFn = {
  mutate: () => void;
  isPending: boolean;
};

function mergeThinkingChunks(chunks: OutputChunk[]): Array<OutputChunk | { kind: "thinking"; text: string; eventId: string; timestamp: string; merged: true }> {
  const result: Array<OutputChunk | { kind: "thinking"; text: string; eventId: string; timestamp: string; merged: true }> = [];
  let thinkingBuf: string[] = [];
  let thinkingTs = "";

  const flushThinking = () => {
    if (thinkingBuf.length === 0) return;
    result.push({
      kind: "thinking",
      text: thinkingBuf.join("\n"),
      eventId: `merged-thinking-${result.length}`,
      timestamp: thinkingTs,
      merged: true,
    });
    thinkingBuf = [];
    thinkingTs = "";
  };

  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i]!;
    if (c.kind === "thinking") {
      if (thinkingBuf.length === 0) thinkingTs = c.timestamp;
      thinkingBuf.push(c.text);
    } else {
      flushThinking();
      result.push(c);
    }
  }
  flushThinking();

  return result;
}

function renderTimeline(
  chunks: OutputChunk[],
  toolCalls: any[],
  approvals: any[],
  respondApproval: RespondApprovalFn,
  stopSession: StopSessionFn,
  sessionStatus: string,
) {
  const mergedChunks = mergeThinkingChunks(chunks);

  const items: Array<{ type: "chunk" | "tool" | "approval"; ts: string; data: any }> = [];

  for (const c of mergedChunks) {
    items.push({ type: "chunk", ts: c.timestamp, data: c });
  }
  for (const t of toolCalls) {
    items.push({ type: "tool", ts: t.timestamp, data: t });
  }
  for (const a of approvals) {
    items.push({ type: "approval", ts: new Date().toISOString(), data: a });
  }

  items.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  const isRunningThinking = sessionStatus === "running" && mergedChunks.length > 0 && mergedChunks[mergedChunks.length - 1]?.kind === "thinking";

  return items.map((item, i) => {
    if (item.type === "chunk") {
      const chunk = item.data;
      if (chunk.kind === "user") {
        return (
          <TimelineItem key={`${chunk.eventId}-${i}`} kind="user">
            <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">{chunk.text}</p>
          </TimelineItem>
        );
      }
      if (chunk.kind === "thinking") {
        const isLast = i === items.length - 1;
        const showThinkingAnimation = isLast && isRunningThinking;
        return (
          <TimelineItem key={`${chunk.eventId}-${i}`} kind="thinking">
            <details className="text-xs" open={showThinkingAnimation ? undefined : undefined}>
              <summary className="cursor-pointer text-[var(--color-text-tertiary)] select-none inline-flex items-center gap-1.5">
                {showThinkingAnimation ? (
                  <>
                    <span className="thinking-dots">
                      <span>.</span><span>.</span><span>.</span>
                    </span>
                    Thinking
                  </>
                ) : (
                  "Thinking..."
                )}
              </summary>
              <p className="mt-1 pl-2 border-l-2 border-[var(--color-border-default)] text-[var(--color-text-muted)] whitespace-pre-wrap break-words">
                {chunk.text}
              </p>
            </details>
          </TimelineItem>
        );
      }
      return (
        <TimelineItem key={`${chunk.eventId}-${i}`} kind="agent">
          <div className="overflow-x-auto max-w-full">
            <div className="text-sm text-[var(--color-text-primary)] leading-relaxed prose prose-sm max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>{chunk.text}</Markdown>
            </div>
          </div>
        </TimelineItem>
      );
    }

    if (item.type === "tool") {
      const tc = item.data;
      return (
        <TimelineItem key={`tool-${tc.toolUseId}-${i}`} kind="tool">
          <ToolCallCard
            toolName={tc.toolName}
            state={tc.state}
            input={tc.input}
            output={tc.output}
          />
        </TimelineItem>
      );
    }

    if (item.type === "approval") {
      const a = item.data;
      return (
        <TimelineItem key={`approval-${a.approvalId}-${i}`} kind="system">
          <ApprovalCard
            toolName={a.toolName}
            description={a.description}
            commandPreview={typeof a.payload === "string" ? a.payload : JSON.stringify(a.payload, null, 2)}
            riskLevel="high"
            onStop={() => stopSession.mutate()}
            isLoading={stopSession.isPending}
          />
        </TimelineItem>
      );
    }

    return null;
  });
}

function ChevronLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
