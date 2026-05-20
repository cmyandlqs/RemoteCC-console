import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
import { wsClient, type WsEnvelope } from "../lib/ws";
import { useSessionStore, type SessionStatus } from "../stores/session-store";

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState("");

  const {
    sessionStatus,
    outputChunks,
    pendingApprovals,
    currentModel,
    inputTokens,
    outputTokens,
    totalCostUsd,
    contextWindow,
    setSessionStatus,
    appendOutput,
    addApproval,
    removeApproval,
    updateUsage,
    clearOutput,
  } = useSessionStore();

  const { data: sessionData, refetch: refetchSession } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => apiClient.getSession(sessionId!),
    enabled: !!sessionId,
  });

  const session = sessionData?.data;

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

  const respondApproval = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "rejected" | "dismissed" }) =>
      apiClient.respondApproval(id, action),
    onSuccess: () => {
      void stopSession.mutate();
    },
  });

  useEffect(() => {
    if (!sessionId) return;
    clearOutput();
    wsClient.subscribeSession(sessionId);
    return () => {
      wsClient.unsubscribeSession(sessionId!);
    };
  }, [sessionId]);

  useEffect(() => {
    const unsub = wsClient.subscribe(handleWsEvent);
    return unsub;
  }, []);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [outputChunks]);

  function handleWsEvent(envelope: WsEnvelope) {
    if (envelope.sessionId !== sessionId) return;

    switch (envelope.type) {
      case "session.state.changed": {
        const payload = envelope.payload as { status: string };
        setSessionStatus(payload.status as SessionStatus);
        break;
      }
      case "session.message.delta": {
        const p = envelope.payload as { text: string; kind?: string };
        appendOutput({
          eventId: envelope.eventId,
          text: p.text,
          kind: p.kind === "thinking" || p.kind === "text"
            ? (p.kind as "thinking" | "text")
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
        updateUsage({
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
        addApproval({
          approvalId: p.approvalId,
          sessionId: sessionId!,
          toolUseId: p.toolUseId,
          toolName: p.toolName,
          description: p.description,
          payload: p.payload,
        });
        break;
      }
      case "session.approval.resolved": {
        const p = envelope.payload as { approvalId: string };
        removeApproval(p.approvalId);
        refetchSession();
        break;
      }
      case "session.completed":
        setSessionStatus("completed");
        refetchSession();
        break;
      case "session.error":
        setSessionStatus("error");
        refetchSession();
        break;
    }
  }

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    sendMessage.mutate(text);
    setInputText("");
  };

  const costDisplay =
    totalCostUsd !== null
      ? `$${(parseFloat(totalCostUsd) * 100).toFixed(2)}`
      : null;

  return (
    <section className="session-shell">
      <header className="session-header">
        <div>
          <button type="button" className="btn-back" onClick={() => navigate(-1)}>
            ← 返回
          </button>
          <h2>{session?.name ?? "会话"}</h2>
          <p>{session?.projectId ?? ""}</p>
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
                    : "离线"}
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
            等待输出...
          </div>
        )}
        {outputChunks.map((chunk, i) => (
          <div
            key={`${chunk.eventId}-${i}`}
            className={`bubble ${chunk.kind === "thinking" ? "bubble--thinking" : ""}`}
          >
            {chunk.text}
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
              ? "输入要发送给 Claude Code 的内容"
              : "会话未在运行"
          }
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={sessionStatus === "running" ? false : true}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!inputText.trim() || sessionStatus !== "running"}
        >
          发送
        </button>
      </footer>
    </section>
  );
}