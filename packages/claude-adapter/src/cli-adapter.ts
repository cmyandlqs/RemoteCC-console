import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import type {
  AdapterEvent,
  AdapterSessionInfo,
  AdapterMessage,
  ClaudeAdapter,
} from "./types.js";

type ContentBlockDelta =
  | { type: "text_delta"; text: string }
  | { type: "thinking_delta"; thinking: string }
  | { type: "signature_delta"; signature: string }
  | { type: "input_json_delta"; partial_json: string };

type StreamEvent = {
  type: "message_start" | "message_stop" | "message_delta" | "content_block_start" | "content_block_stop" | "content_block_delta";
  index?: number;
  delta?: ContentBlockDelta;
  content_block?: {
    type: string;
    text?: string;
    thinking?: string;
    id?: string;
    name?: string;
    input?: unknown;
  };
};

type CliEvent = {
  type: string;
  subtype?: string;
  session_id?: string;
  cwd?: string;
  model?: string;
  event?: StreamEvent;
  message?: {
    content?: Array<{
      type: string;
      text?: string;
      thinking?: string;
      id?: string;
      name?: string;
      input?: unknown;
    }>;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
    };
    model?: string;
    stop_reason?: string | null;
  };
  result?: string;
  total_cost_usd?: number;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  modelUsage?: Record<
    string,
    {
      inputTokens?: number;
      outputTokens?: number;
      costUSD?: number;
      contextWindow?: number;
    }
  >;
  is_error?: boolean;
  parent_tool_use_id?: string | null;
};

function getClaudeBin(): string {
  const home = os.homedir();
  return path.join(home, ".local", "bin", "claude");
}

function stripAnsi(line: string): string {
  return line.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
}

function parseCliEvent(raw: CliEvent): AdapterEvent[] {
  const events: AdapterEvent[] = [];

  if (raw.type === "system" && raw.subtype === "init") {
    events.push({
      type: "session.started",
      sessionId: raw.session_id ?? "",
      model: raw.model ?? "unknown",
      cwd: raw.cwd ?? "",
    });
    return events;
  }

  if (raw.type === "stream_event" && raw.event) {
    const se = raw.event;
    if (se.type === "content_block_delta" && se.delta) {
      if (se.delta.type === "text_delta") {
        events.push({ type: "text_delta", text: se.delta.text });
      } else if (se.delta.type === "thinking_delta") {
        events.push({ type: "thinking_delta", text: se.delta.thinking });
      }
    }
    return events;
  }

  if (raw.type === "assistant" && raw.message?.content) {
    for (const block of raw.message.content) {
      if (block.type === "tool_use" && block.id && block.name) {
        events.push({
          type: "tool_use",
          toolUseId: block.id,
          toolName: block.name,
          input: block.input,
        });
      }
    }
    return events;
  }

  if (raw.type === "tool_result") {
    const toolUseId = raw.parent_tool_use_id ?? "";
    const resultText =
      typeof raw.result === "string" ? raw.result : JSON.stringify(raw.result);
    if (raw.subtype === "approval_requested" || raw.is_error === true) {
      events.push({
        type: "approval_requested",
        toolUseId,
        toolName: "",
        description: resultText,
        payload: raw,
      });
    } else {
      events.push({
        type: "tool_result",
        toolUseId,
        output: resultText,
        isError: raw.is_error ?? false,
      });
    }
    return events;
  }

  if (raw.type === "result") {
    if (raw.modelUsage) {
      for (const [model, usage] of Object.entries(raw.modelUsage)) {
        events.push({
          type: "usage_updated",
          model,
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
          costUsd: usage.costUSD ?? 0,
          contextWindow: usage.contextWindow,
        });
      }
    }

    events.push({
      type: "session.completed",
      result: raw.result ?? "",
      costUsd: raw.total_cost_usd ?? 0,
    });
    return events;
  }

  return events;
}

export class CliClaudeAdapter implements ClaudeAdapter {
  async *sendMessage(
    cwd: string,
    prompt: string,
    sessionId?: string,
    signal?: AbortSignal,
  ): AsyncIterable<AdapterEvent> {
    const args = [
      "-p",
      "--output-format",
      "stream-json",
      "--include-partial-messages",
      "--verbose",
      "--permission-mode",
      "dontAsk",
    ];

    if (sessionId) {
      args.push("--resume", sessionId);
    }

    args.push(prompt);

    const child = spawn(getClaudeBin(), args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    });

    const rl = createInterface({ input: child.stdout });
    const stderrChunks: string[] = [];

    child.stderr.on("data", (chunk: Buffer) => {
      stderrChunks.push(chunk.toString());
    });

    const eventQueue: AdapterEvent[] = [];
    let resolveNext: (() => void) | null = null;
    let done = false;

    const cleanup = () => {
      if (!child.killed) {
        child.kill("SIGTERM");
      }
    };

    if (signal) {
      signal.addEventListener("abort", cleanup, { once: true });
    }

    rl.on("line", (line: string) => {
      const clean = stripAnsi(line);
      if (!clean.trim()) return;
      try {
        const raw = JSON.parse(clean) as CliEvent;
        const parsed = parseCliEvent(raw);
        for (const event of parsed) {
          eventQueue.push(event);
          if (resolveNext) {
            resolveNext();
            resolveNext = null;
          }
        }
      } catch {
        if (clean.trim() && !clean.startsWith("{")) {
          console.warn("[CliClaudeAdapter] unparseable line:", clean.substring(0, 200));
        }
      }
    });

    rl.on("close", () => {
      done = true;
      if (resolveNext) {
        resolveNext();
        resolveNext = null;
      }
    });

    child.on("error", (err) => {
      eventQueue.push({ type: "error", message: err.message });
      done = true;
      if (resolveNext) {
        resolveNext();
        resolveNext = null;
      }
    });

    try {
      while (true) {
        if (eventQueue.length > 0) {
          yield eventQueue.shift()!;
          continue;
        }
        if (done) break;

        yield new Promise<AdapterEvent>((resolve) => {
          resolveNext = () => {
            if (eventQueue.length > 0) {
              resolve(eventQueue.shift()!);
            } else if (done) {
              resolve({ type: "error", message: "Process ended unexpectedly" });
            }
          };
        });
      }
    } finally {
      cleanup();
      if (signal) {
        signal.removeEventListener("abort", cleanup);
      }
    }

    if (stderrChunks.length > 0) {
      const stderr = stderrChunks.join("");
      if (stderr.trim()) {
        yield { type: "error", message: stderr.trim() };
      }
    }
  }

  async listSessions(cwd: string): Promise<AdapterSessionInfo[]> {
    const sessionsDir = this.getSessionsDir(cwd);
    try {
      const files = await readdir(sessionsDir);
      const results: AdapterSessionInfo[] = [];

      for (const file of files) {
        if (!file.endsWith(".jsonl")) continue;
        const sessionId = file.replace(".jsonl", "");
        const filePath = path.join(sessionsDir, file);
        try {
          const content = await readFile(filePath, "utf-8");
          const firstLine = content.split("\n")[0];
          if (!firstLine) continue;
          const header = JSON.parse(firstLine) as {
            title?: string;
            model?: string;
          };
          results.push({
            sessionId,
            title: header.title ?? null,
            model: header.model ?? null,
          });
        } catch {
          results.push({ sessionId, title: null, model: null });
        }
      }

      return results;
    } catch {
      return [];
    }
  }

  async renameSession(
    _sessionId: string,
    _name: string,
  ): Promise<void> {
  }

  async getSessionMessages(
    _sessionId: string,
  ): Promise<AdapterMessage[]> {
    return [];
  }

  private getSessionsDir(cwd: string): string {
    const home = os.homedir();
    const safePath = cwd.replace(/\//g, "-");
    return path.join(home, ".claude", "projects", safePath);
  }
}