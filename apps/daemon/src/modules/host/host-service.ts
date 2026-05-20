import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";

import type { SessionService } from "../sessions/session-service.js";

const execFileAsync = promisify(execFile);

export type ClaudeAuthState = "available" | "unavailable" | "error";
export type TailscaleState = "online" | "offline" | "not_installed";

export type HostSummary = {
  name: string;
  os: string;
  daemonVersion: string;
  status: "online";
  activeSessionCount: number;
  claudeAuthState: ClaudeAuthState;
  tailscaleState: TailscaleState;
};

export type HealthCheck = {
  status: "ok";
  uptime: number;
  timestamp: string;
};

function readDaemonVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(new URL("../../../package.json", import.meta.url), "utf-8"),
    );
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

async function checkClaudeAuth(): Promise<ClaudeAuthState> {
  try {
    const { stdout } = await execFileAsync("claude", ["auth", "status"], {
      timeout: 10_000,
    });
    if (stdout.includes("loggedIn") && stdout.includes("true")) {
      return "available";
    }
    return "unavailable";
  } catch {
    return "error";
  }
}

async function checkTailscale(): Promise<TailscaleState> {
  try {
    const { stdout } = await execFileAsync("tailscale", ["status", "--json"], {
      timeout: 10_000,
    });
    const data = JSON.parse(stdout) as { BackendState?: string };
    if (data.BackendState === "Running") {
      return "online";
    }
    return "offline";
  } catch {
    return "not_installed";
  }
}

export class HostService {
  private readonly startedAt = Date.now();
  private readonly version = readDaemonVersion();
  private cachedClaudeAuth: ClaudeAuthState = "error";
  private cachedTailscale: TailscaleState = "not_installed";
  private lastCheckedAt = 0;
  private readonly cacheTtlMs = 60_000;

  constructor(private readonly sessionService: SessionService) {}

  getSummary(): HostSummary {
    const allSessions = this.sessionService.list();
    const activeCount = allSessions.filter(
      (s) => s.status === "running" || s.status === "idle",
    ).length;

    return {
      name: os.hostname(),
      os: `${process.platform} ${os.release()}`,
      daemonVersion: this.version,
      status: "online",
      activeSessionCount: activeCount,
      claudeAuthState: this.cachedClaudeAuth,
      tailscaleState: this.cachedTailscale,
    };
  }

  getHealth(): HealthCheck {
    return {
      status: "ok",
      uptime: Date.now() - this.startedAt,
      timestamp: new Date().toISOString(),
    };
  }

  async refreshExternalStates(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCheckedAt < this.cacheTtlMs) return;
    this.lastCheckedAt = now;

    const [claudeAuth, tailscale] = await Promise.allSettled([
      checkClaudeAuth(),
      checkTailscale(),
    ]);

    if (claudeAuth.status === "fulfilled") {
      this.cachedClaudeAuth = claudeAuth.value;
    }
    if (tailscale.status === "fulfilled") {
      this.cachedTailscale = tailscale.value;
    }
  }

  async runStartupCheck(log: (msg: string) => void): Promise<void> {
    log("Running startup environment check...");

    const [claudeAuth, tailscale] = await Promise.allSettled([
      checkClaudeAuth(),
      checkTailscale(),
    ]);

    if (claudeAuth.status === "fulfilled") {
      this.cachedClaudeAuth = claudeAuth.value;
      if (claudeAuth.value === "available") {
        log("Claude auth: available");
      } else {
        log("Claude auth: unavailable — sessions will not work");
      }
    } else {
      this.cachedClaudeAuth = "error";
      log("Claude auth: check failed — claude CLI may not be installed");
    }

    if (tailscale.status === "fulfilled") {
      this.cachedTailscale = tailscale.value;
      if (tailscale.value === "online") {
        log("Tailscale: online");
      } else if (tailscale.value === "offline") {
        log("Tailscale: offline — remote access will not work");
      } else {
        log("Tailscale: not installed");
      }
    } else {
      this.cachedTailscale = "not_installed";
      log("Tailscale: not found");
    }

    log("Startup check complete");
  }
}
