import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const ALIASES = `
# cch — Claude Code History (https://github.com/user/cch)
alias cn="ch new"
alias cnf="ch new -f"
alias cls="ch ls"
alias cps="ch ps"
alias chs="ch search"
`;

const MARKER = "# cch — Claude Code History";

function detectShellRc(): string {
  const shell = process.env.SHELL || "";
  if (shell.includes("zsh")) return join(homedir(), ".zshrc");
  if (shell.includes("bash")) {
    const bashProfile = join(homedir(), ".bash_profile");
    if (existsSync(bashProfile)) return bashProfile;
    return join(homedir(), ".bashrc");
  }
  return join(homedir(), ".bashrc");
}

export function setupCommand(): void {
  const rcFile = detectShellRc();
  const rcName = rcFile.split("/").pop();

  // Check if already installed
  if (existsSync(rcFile)) {
    const content = readFileSync(rcFile, "utf-8");
    if (content.includes(MARKER)) {
      console.log(`Aliases already installed in ~/${rcName}`);
      console.log("Available aliases: cn, cnf, cls, cps, chs");
      return;
    }
  }

  appendFileSync(rcFile, ALIASES);
  console.log(`Aliases added to ~/${rcName}:\n`);
  console.log("  cn   → ch new            Create new session");
  console.log("  cnf  → ch new -f         Force new session");
  console.log("  cls  → ch ls             Browse history");
  console.log("  cps  → ch ps             Active sessions");
  console.log("  chs  → ch search         Keyword search");
  console.log(`\nRun: source ~/${rcName}`);
}
