/**
 * Interactive arrow-key selector for terminal.
 * Zero dependencies — uses raw stdin mode.
 */

const ESC = "\x1b";
const CLEAR_LINE = `${ESC}[2K\r`;
const CURSOR_HIDE = `${ESC}[?25l`;
const CURSOR_SHOW = `${ESC}[?25h`;
const DIM = `${ESC}[2m`;
const RESET = `${ESC}[0m`;
const CYAN_BG = `${ESC}[46m${ESC}[30m`;

export interface SelectItem {
  label: string;
  value: number;
}

/** Truncate string to fit terminal width, accounting for wide (CJK) chars */
function truncate(str: string, maxWidth: number): string {
  let width = 0;
  let i = 0;
  for (; i < str.length; i++) {
    const code = str.codePointAt(i)!;
    // CJK characters take 2 columns
    const charWidth = (code >= 0x1100 && (
      (code <= 0x115f) || // Hangul Jamo
      (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f) || // CJK
      (code >= 0xac00 && code <= 0xd7a3) || // Hangul Syllables
      (code >= 0xf900 && code <= 0xfaff) || // CJK Compatibility
      (code >= 0xfe10 && code <= 0xfe6f) || // CJK Forms
      (code >= 0xff01 && code <= 0xff60) || // Fullwidth Forms
      (code >= 0xffe0 && code <= 0xffe6) ||
      (code >= 0x20000 && code <= 0x2fffd) ||
      (code >= 0x30000 && code <= 0x3fffd)
    )) ? 2 : 1;
    if (width + charWidth > maxWidth) break;
    width += charWidth;
    if (code > 0xffff) i++; // surrogate pair
  }
  return str.slice(0, i);
}

/** Strip ANSI escape codes for width calculation */
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

export function interactiveSelect(items: SelectItem[], hint = "Up/Down to navigate, Enter to select, Esc to cancel"): Promise<number> {
  if (!process.stdin.isTTY) return Promise.resolve(-1);

  return new Promise((resolve) => {
    let cursor = 0;
    const cols = process.stdout.columns || 80;
    const rows = process.stdout.rows || 24;
    const pageSize = Math.min(items.length, rows - 4);

    function getWindow(): { start: number; end: number } {
      let start = 0;
      if (cursor >= pageSize) {
        start = cursor - pageSize + 1;
      }
      return { start, end: Math.min(start + pageSize, items.length) };
    }

    function renderLines(): string[] {
      const { start, end } = getWindow();
      const lines: string[] = [];
      lines.push(truncate(`${DIM}${hint}${RESET}`, cols));

      for (let i = start; i < end; i++) {
        const raw = items[i].label;
        if (i === cursor) {
          const label = truncate(raw, cols - 4);
          lines.push(`${CYAN_BG} > ${label} ${RESET}`);
        } else {
          const label = truncate(raw, cols - 3);
          lines.push(`   ${label}`);
        }
      }

      if (end < items.length) {
        lines.push(`${DIM}  ... ${items.length - end} more below${RESET}`);
      }
      return lines;
    }

    let drawnLines = 0;

    function draw() {
      // Move to top of previously drawn area and clear
      for (let i = 0; i < drawnLines; i++) {
        process.stdout.write(`${ESC}[A`); // up one line
      }

      const lines = renderLines();
      for (let i = 0; i < lines.length; i++) {
        process.stdout.write(`${CLEAR_LINE}${lines[i]}\n`);
      }
      // Clear any leftover lines from previous render
      for (let i = lines.length; i < drawnLines; i++) {
        process.stdout.write(`${CLEAR_LINE}\n`);
      }
      // Move back up for leftover cleared lines
      const extra = Math.max(0, drawnLines - lines.length);
      for (let i = 0; i < extra; i++) {
        process.stdout.write(`${ESC}[A`);
      }

      drawnLines = lines.length;
    }

    // Number input buffer: collects digits, applies after 600ms pause
    let numBuf = "";
    let numTimer: ReturnType<typeof setTimeout> | null = null;

    function applyNumBuf() {
      const num = parseInt(numBuf, 10);
      numBuf = "";
      if (!isNaN(num) && num >= 1 && num <= items.length) {
        cursor = num - 1;
        draw();
      }
    }

    function cleanup() {
      if (numTimer) clearTimeout(numTimer);
      process.stdin.setRawMode(false);
      process.stdin.removeListener("data", onData);
      process.stdin.pause();
      process.stdout.write(CURSOR_SHOW);
    }

    function onData(buf: Buffer) {
      const key = buf.toString();

      if (key === `${ESC}[A` || key === "k") {
        if (cursor > 0) cursor--;
        draw();
      } else if (key === `${ESC}[B` || key === "j") {
        if (cursor < items.length - 1) cursor++;
        draw();
      } else if (key === "\r" || key === "\n") {
        cleanup();
        resolve(items[cursor].value);
      } else if (key === ESC || key === "q" || key === "\x03") {
        cleanup();
        resolve(-1);
      } else if (/^[0-9]$/.test(key)) {
        // Accumulate digits, apply after short pause
        numBuf += key;
        if (numTimer) clearTimeout(numTimer);
        // If the number is already larger than max, apply immediately
        if (parseInt(numBuf, 10) > items.length) {
          applyNumBuf();
        } else {
          numTimer = setTimeout(applyNumBuf, 600);
        }
      }
    }

    process.stdout.write(CURSOR_HIDE);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
    draw();
  });
}
