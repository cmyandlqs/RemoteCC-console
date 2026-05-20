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
