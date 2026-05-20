import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type GitStatus = {
  branch: string | null;
  staged: number;
  unstaged: number;
  untracked: number;
  summary: string;
};

export type FileChangeEntry = {
  path: string;
  changeType: "added" | "modified" | "deleted" | "renamed";
  staged: boolean;
};

export class GitService {
  async getStatus(projectPath: string): Promise<GitStatus> {
    try {
      const { stdout } = await execFileAsync(
        "git",
        ["status", "--porcelain=v2", "--branch"],
        { cwd: projectPath, timeout: 10_000 },
      );

      let branch: string | null = null;
      let staged = 0;
      let unstaged = 0;
      let untracked = 0;

      for (const line of stdout.split("\n")) {
        if (!line) continue;

        if (line.startsWith("# branch.head")) {
          branch = line.slice("# branch.head ".length);
          if (branch === "(detached)") branch = null;
        } else if (line.startsWith("1 ")) {
          const xy = line.slice(2, 4);
          if (xy[0] !== "." && xy[0] !== "?") staged++;
          if (xy[1] !== "." && xy[1] !== "?") unstaged++;
        } else if (line.startsWith("2 ")) {
          staged++;
        } else if (line.startsWith("u ")) {
          staged++;
          unstaged++;
        } else if (line.startsWith("? ")) {
          untracked++;
        }
      }

      const total = staged + unstaged + untracked;
      const parts: string[] = [];
      if (staged > 0) parts.push(`${staged} staged`);
      if (unstaged > 0) parts.push(`${unstaged} unstaged`);
      if (untracked > 0) parts.push(`${untracked} untracked`);

      return {
        branch,
        staged,
        unstaged,
        untracked,
        summary: parts.length > 0 ? parts.join(", ") : "clean",
      };
    } catch {
      return {
        branch: null,
        staged: 0,
        unstaged: 0,
        untracked: 0,
        summary: "not a git repo",
      };
    }
  }

  async getDiff(projectPath: string): Promise<string> {
    try {
      const { stdout } = await execFileAsync(
        "git",
        ["diff", "--stat"],
        { cwd: projectPath, timeout: 10_000 },
      );
      return stdout;
    } catch {
      return "";
    }
  }

  async listChanges(projectPath: string): Promise<FileChangeEntry[]> {
    try {
      const { stdout } = await execFileAsync(
        "git",
        ["status", "--porcelain=v1"],
        { cwd: projectPath, timeout: 10_000 },
      );

      const changes: FileChangeEntry[] = [];
      for (const line of stdout.split("\n")) {
        if (!line) continue;
        const xy = line.slice(0, 2);
        const filePath = line.slice(3);

        const changeType: FileChangeEntry["changeType"] =
          xy.includes("D") ? "deleted" :
          xy.includes("R") ? "renamed" :
          xy.includes("A") ? "added" :
          "modified";

        changes.push({
          path: filePath,
          changeType,
          staged: xy[0] !== " " && xy[0] !== "?",
        });
      }

      return changes;
    } catch {
      return [];
    }
  }
}
