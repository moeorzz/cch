import { loadSessions } from "../services/history.js";
import { resumeInSession } from "../services/session.js";

export async function resumeCommand(sessionId: string): Promise<void> {
  const sessions = loadSessions();
  const match = sessions.find((s) => s.sessionId === sessionId);

  if (match) {
    await resumeInSession(match.sessionId, match.cwd);
  } else {
    console.error(`Session not found: ${sessionId}`);
    console.error("Try `ch list` to see available sessions.");
  }
}
