/**
 * Interactive arrow-key selector for terminal.
 * Zero dependencies — uses raw stdin mode.
 */

const ESC = "\x1b";
const CLEAR_LINE = `${ESC}[2K`;
const CURSOR_UP = (n: number) => `${ESC}[${n}A`;
const CURSOR_HIDE = `${ESC}[?25l`;
const CURSOR_SHOW = `${ESC}[?25h`;
const DIM = `${ESC}[2m`;
const RESET = `${ESC}[0m`;
const BOLD = `${ESC}[1m`;
const CYAN_BG = `${ESC}[46m${ESC}[30m`;

export interface SelectItem {
  label: string;
  value: number;
}

/**
 * Show an interactive list. User navigates with arrow keys, Enter to select, Esc/q to cancel.
 * Returns the selected item's value, or -1 if cancelled.
 */
export function interactiveSelect(items: SelectItem[], hint = "Arrow keys to navigate, Enter to select, Esc to cancel"): Promise<number> {
  if (!process.stdin.isTTY) return Promise.resolve(-1);

  return new Promise((resolve) => {
    let cursor = 0;
    const pageSize = Math.min(items.length, process.stdout.rows ? process.stdout.rows - 4 : 20);

    function render() {
      // Calculate visible window
      let start = 0;
      if (cursor >= pageSize) {
        start = cursor - pageSize + 1;
      }
      const end = Math.min(start + pageSize, items.length);

      const lines: string[] = [];
      lines.push(`${DIM}${hint}${RESET}`);
      for (let i = start; i < end; i++) {
        if (i === cursor) {
          lines.push(`${CYAN_BG} > ${items[i].label} ${RESET}`);
        } else {
          lines.push(`   ${items[i].label}`);
        }
      }
      if (end < items.length) {
        lines.push(`${DIM}  ... ${items.length - end} more below${RESET}`);
      }
      return lines;
    }

    let prevLineCount = 0;

    function draw() {
      // Clear previous output
      if (prevLineCount > 0) {
        process.stdout.write(CURSOR_UP(prevLineCount));
        for (let i = 0; i < prevLineCount; i++) {
          process.stdout.write(`${CLEAR_LINE}\n`);
        }
        process.stdout.write(CURSOR_UP(prevLineCount));
      }

      const lines = render();
      process.stdout.write(lines.join("\n") + "\n");
      prevLineCount = lines.length;
    }

    function cleanup() {
      process.stdin.setRawMode(false);
      process.stdin.removeListener("data", onData);
      process.stdin.pause();
      process.stdout.write(CURSOR_SHOW);
    }

    function onData(buf: Buffer) {
      const key = buf.toString();

      // Arrow up or k
      if (key === `${ESC}[A` || key === "k") {
        if (cursor > 0) cursor--;
        draw();
        return;
      }
      // Arrow down or j
      if (key === `${ESC}[B` || key === "j") {
        if (cursor < items.length - 1) cursor++;
        draw();
        return;
      }
      // Enter
      if (key === "\r" || key === "\n") {
        cleanup();
        resolve(items[cursor].value);
        return;
      }
      // Escape, q, Ctrl+C
      if (key === ESC || key === "q" || key === "\x03") {
        cleanup();
        resolve(-1);
        return;
      }
      // Number input: jump to that item
      const num = parseInt(key, 10);
      if (!isNaN(num) && num >= 1 && num <= items.length) {
        cursor = num - 1;
        draw();
        return;
      }
    }

    process.stdout.write(CURSOR_HIDE);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
    draw();
  });
}
