import { createNewSession, forceNewSession } from "../services/session.js";

export async function newCommand(description: string | undefined, force: boolean): Promise<void> {
  const cwd = process.cwd();
  if (force) {
    await forceNewSession(cwd, description);
  } else {
    await createNewSession(cwd, description);
  }
}
