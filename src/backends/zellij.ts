import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { SessionBackend, ActiveSession, CreateSessionOpts } from "./interface.js";

/** Escape a string for embedding inside KDL double-quoted values */
function escapeKdl(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export class ZellijBackend implements SessionBackend {
  name = "zellij";

  isAvailable(): boolean {
    try {
      execFileSync("which", ["zellij"], { stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  }

  listSessions(): ActiveSession[] {
    try {
      const raw = execFileSync("zellij", ["ls"], {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      return raw
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const clean = line.replace(/\x1b\[[0-9;]*m/g, "");
          const name = clean.split(/\s+/)[0];
          const hasExited = clean.includes("EXITED");
          const createdMatch = clean.match(/Created\s+(.+?)\s*ago/);
          const created = createdMatch ? createdMatch[1] + " ago" : "";
          return {
            name,
            created,
            status: hasExited ? "exited" as const : "running" as const,
          };
        })
        .filter((s) => s.name);
    } catch {
      return [];
    }
  }

  createSession(opts: CreateSessionOpts): void {
    const dir = join(tmpdir(), "cch-zellij");
    mkdirSync(dir, { recursive: true });

    const fullCmd = [opts.command, ...opts.args].map((a) => a.includes(" ") ? `'${a}'` : a).join(" ");
    const layoutPath = join(dir, `${opts.name}-layout.kdl`);
    const configPath = join(dir, `${opts.name}-config.kdl`);

    const tabName = escapeKdl(opts.description || opts.name);
    writeFileSync(
      layoutPath,
      `layout {\n    tab name="${tabName}" {\n        pane command="zsh" cwd="${escapeKdl(opts.cwd)}" {\n            args "-lc" "${escapeKdl(fullCmd)}"\n        }\n    }\n}\n`,
    );

    writeFileSync(
      configPath,
      `session_name "${escapeKdl(opts.name)}"\nattach_to_session true\ndefault_layout "${escapeKdl(layoutPath)}"\n`,
    );

    execFileSync("zellij", ["--config", configPath], { stdio: "inherit" });
  }

  attachSession(name: string): void {
    execFileSync("zellij", ["attach", name], { stdio: "inherit" });
  }

  killSession(name: string): void {
    // Try kill first (running sessions), then delete (exited sessions)
    try {
      execFileSync("zellij", ["kill-session", name], { stdio: "pipe" });
    } catch {
      try {
        execFileSync("zellij", ["delete-session", name], { stdio: "pipe" });
      } catch {
        // session might not exist
      }
    }
  }
}
