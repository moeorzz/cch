import { loadSessions } from "../services/history.js";
import { formatSessionTable } from "../utils/display.js";
import { resumeInSession } from "../services/session.js";
import { createInterface } from "node:readline";

export async function listCommand(n: number): Promise<void> {
  const sessions = loadSessions(n);
  if (!sessions.length) {
    console.log("No Claude Code history found in ~/.claude/projects/");
    return;
  }
  console.log(formatSessionTable(sessions));
  console.log(`\n${sessions.length} sessions total.\n`);

  if (process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise<string>((resolve) => {
      rl.question("Enter number to resume (Enter to exit): ", resolve);
    });
    rl.close();
    const idx = parseInt(answer, 10);
    if (idx >= 1 && idx <= sessions.length) {
      const s = sessions[idx - 1];
      await resumeInSession(s.sessionId, s.cwd);
    }
  }
}
