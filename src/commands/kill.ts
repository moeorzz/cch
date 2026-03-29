import { killSession } from "../services/session.js";

export async function killCommand(name: string): Promise<void> {
  await killSession(name);
  console.log(`Killed session: ${name}`);
}
