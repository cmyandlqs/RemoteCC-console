import { EventEmitter } from "node:events";
import { v7 as uuidv7 } from "uuid";

import type { WsEnvelope, WsEventType } from "@agent-console/shared-types";

type EventPayload = Record<string, unknown>;

export class EventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  publish(
    type: WsEventType,
    payload: EventPayload,
    meta?: { sessionId?: string; projectId?: string },
  ): void {
    const envelope: WsEnvelope<EventPayload> = {
      eventId: uuidv7(),
      ts: new Date().toISOString(),
      type,
      payload,
    };
    if (meta?.sessionId !== undefined) {
      (envelope as Record<string, unknown>).sessionId = meta.sessionId;
    }
    if (meta?.projectId !== undefined) {
      (envelope as Record<string, unknown>).projectId = meta.projectId;
    }
    this.emitter.emit("event", envelope);
  }

  subscribe(handler: (event: WsEnvelope) => void): () => void {
    this.emitter.on("event", handler);
    return () => {
      this.emitter.off("event", handler);
    };
  }
}
