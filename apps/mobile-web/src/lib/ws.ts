// @ts-ignore - Vite env types
const WS_BASE = (import.meta.env.VITE_DAEMON_WS_URL ?? "ws://localhost:8788").replace("http", "ws");

export type WsEnvelope<T = unknown> = {
  eventId: string;
  ts: string;
  type: WsEventType;
  sessionId?: string;
  projectId?: string;
  payload: T;
};

export type WsEventType =
  | "session.state.changed"
  | "session.message.delta"
  | "session.message.completed"
  | "session.command.started"
  | "session.command.output"
  | "session.command.completed"
  | "session.approval.requested"
  | "session.approval.resolved"
  | "session.file_change.updated"
  | "session.usage.updated"
  | "session.error"
  | "session.completed";

export type WsClientMessage =
  | { type: "subscribe"; sessionId: string }
  | { type: "unsubscribe"; sessionId: string }
  | { type: "ping" };

type WsHandler = (envelope: WsEnvelope) => void;

export class WsClient {
  private ws: WebSocket | null = null;
  private handlers: Set<WsHandler> = new Set();
  private sessionSubscriptions: Set<string> = new Set();
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectDelay = 1000;

  connect(url?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    const wsUrl = url ?? `${WS_BASE}/ws`;
    this.ws = new WebSocket(wsUrl);
    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      for (const sid of this.sessionSubscriptions) {
        this.send({ type: "subscribe", sessionId: sid });
      }
      this.startPing();
    };
    this.ws.onmessage = (ev) => {
      try {
        const envelope: WsEnvelope = JSON.parse(ev.data as string);
        this.handlers.forEach((h) => h(envelope));
      } catch {
        // ignore unparseable
      }
    };
    this.ws.onclose = () => {
      this.stopPing();
      this.scheduleReconnect(url);
    };
    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopPing();
    this.ws?.close();
    this.ws = null;
  }

  subscribe(handler: WsHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  subscribeSession(sessionId: string): void {
    this.sessionSubscriptions.add(sessionId);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: "subscribe", sessionId });
    }
  }

  unsubscribeSession(sessionId: string): void {
    this.sessionSubscriptions.delete(sessionId);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: "unsubscribe", sessionId });
    }
  }

  private send(msg: WsClientMessage): void {
    this.ws?.send(JSON.stringify(msg));
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      this.send({ type: "ping" });
    }, 30_000);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(url?: string): void {
    this.reconnectTimer = setTimeout(() => {
      this.connect(url);
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000);
  }
}

export const wsClient = new WsClient();