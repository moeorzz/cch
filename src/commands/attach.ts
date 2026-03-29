import { attachToSession } from "../services/session.js";

export async function attachCommand(name: string): Promise<void> {
  await attachToSession(name);
}
