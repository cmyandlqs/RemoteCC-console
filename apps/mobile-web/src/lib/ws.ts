// @ts-ignore - Vite env types
const WS_BASE = (import.meta.env.VITE_DAEMON_WS_URL ?? "ws://localhost:8787").replace("http", "ws");

export type { WsEnvelope, WsEventType, WsClientMessage } from "@agent-console/shared-types";

import type { WsEnvelope, WsClientMessage } from "@agent-console/shared-types";

type WsHandler = (envelope: WsEnvelope) => void;

export class WsClient {
  private ws: WebSocket | null = null;
  private handlers: Set<WsHandler> = new Set();
  private sessionSubscriptions: Set<string> = new Set();
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectDelay = 1000;
  private token: string | null = null;

  setToken(token: string): void {
    this.token = token;
  }

  connect(url?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    const base = url ?? `${WS_BASE}/ws`;
    const wsUrl = this.token ? `${base}?token=${encodeURIComponent(this.token)}` : base;
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