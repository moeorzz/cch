import { listActiveSessions } from "../services/session.js";
import { formatActiveSessions } from "../utils/display.js";

export async function lsCommand(): Promise<void> {
  const sessions = await listActiveSessions();
  if (!sessions.length) {
    console.log("No active multiplexer sessions.");
    return;
  }
  console.log(formatActiveSessions(sessions));
}
