import { loadSessions } from "../services/history.js";
import { resumeInSession } from "../services/session.js";
import { shortenPath, decodePath } from "../utils/jsonl.js";
import { interactiveSelect } from "../utils/select.js";

export async function listCommand(n: number): Promise<void> {
  const sessions = loadSessions(n);
  if (!sessions.length) {
    console.log("No Claude Code history found in ~/.claude/projects/");
    return;
  }

  const items = sessions.map((s, i) => {
    const num = String(i + 1).padStart(3);
    const ts = s.timestamp.slice(0, 16).replace("T", " ");
    const project = shortenPath(s.cwd || decodePath(s.filePath.split("/").slice(-2, -1)[0])).padEnd(28);
    const branch = (s.gitBranch || "-").slice(0, 12).padEnd(13);
    const msg = s.firstMsg.replace(/\n/g, " ").slice(0, 45);
    return { label: `${num}  ${ts}  ${project} ${branch} ${msg}`, value: i };
  });

  const selected = await interactiveSelect(items);
  if (selected >= 0) {
    const s = sessions[selected];
    await resumeInSession(s.sessionId, s.cwd);
  }
}
