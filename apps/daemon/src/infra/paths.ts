import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE_DIR = path.join(os.homedir(), ".agent-console");

const SUB_DIRS = ["data", "config", "logs", "cache"];

export function getDataDir(): string {
  return path.join(BASE_DIR, "data");
}

export function getDbPath(): string {
  return path.join(getDataDir(), "remotecc.db");
}

export function ensureDataDirs(): void {
  if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR, { recursive: true });
  }
  for (const sub of SUB_DIRS) {
    const dir = path.join(BASE_DIR, sub);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
