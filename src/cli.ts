import { Command } from "commander";

const program = new Command();

program
  .name("ch")
  .description("Claude Code History — manage conversation history across projects")
  .version("0.1.0");

program.parse();
