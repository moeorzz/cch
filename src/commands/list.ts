import { loadSessions } from "../services/history.js";
import { formatSessionTable } from "../utils/display.js";

export function listCommand(n: number): void {
  const sessions = loadSessions(n);
  if (!sessions.length) {
    console.log("No Claude Code history found in ~/.claude/projects/");
    return;
  }
  console.log(formatSessionTable(sessions));
  console.log(`\n${sessions.length} sessions total.\n`);
}
