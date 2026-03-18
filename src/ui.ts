import * as readline from "readline";

// ANSI escape codes
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";
const CLEAR_LINE = "\x1b[2K";
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";

// #AEFF00 as 24-bit ANSI color
const ACCENT_FG = "\x1b[38;2;174;255;0m";
const ACCENT_DIM = "\x1b[38;2;100;148;0m";
const SHADOW = "\x1b[38;2;50;74;0m";

export const c = {
  bold: (s: string) => `${BOLD}${s}${RESET}`,
  dim: (s: string) => `${DIM}${s}${RESET}`,
  red: (s: string) => `${RED}${s}${RESET}`,
  green: (s: string) => `${GREEN}${s}${RESET}`,
  cyan: (s: string) => `${CYAN}${s}${RESET}`,
  yellow: (s: string) => `${YELLOW}${s}${RESET}`,
  accent: (s: string) => `${ACCENT_FG}${s}${RESET}`,
  accentBold: (s: string) => `${BOLD}${ACCENT_FG}${s}${RESET}`,
  accentDim: (s: string) => `${ACCENT_DIM}${s}${RESET}`,
  shadow: (s: string) => `${SHADOW}${s}${RESET}`,
};

// Bright accent for primary geometry, dim for mid-tones, shadow for depth
const A = `${ACCENT_FG}${BOLD}`;   // bright face
const D = `${ACCENT_DIM}`;         // mid-tone details
const S = `${SHADOW}`;             // dark shadow / depth
const R = RESET;

// Strip ANSI codes to measure visible character width
function visLen(s: string): number {
  return s.replace(/\x1b\[[0-9;]*m/g, "").length;
}

// Pad a content line and wrap it in the frame border
function row(content: string): string {
  const W = 68; // inner width between │ and │
  const pad = Math.max(0, W - visLen(content));
  return `${D}  │${R}${content}${" ".repeat(pad)}${D}│${R}`;
}

const BANNER = [
  `${D}  ┌${"─".repeat(68)}┐${R}`,
  row(""),
  row(`   ${A}███████╗███████╗██╗  ██╗${R}`),
  row(`   ${A}██╔════╝██╔════╝██║  ██║${R}`),
  row(`   ${A}███████╗███████╗███████║${R}`),
  row(`   ${A}╚════██║╚════██║██╔══██║${R}`),
  row(`   ${A}███████║███████║██║  ██║${R}`),
  row(`   ${S}╚══════╝╚══════╝╚═╝  ╚═╝${R}`),
  row(`   ${A}███╗   ███╗ █████╗ ███╗   ██╗ █████╗  ██████╗ ███████╗██████╗ ${R}`),
  row(`   ${A}████╗ ████║██╔══██╗████╗  ██║██╔══██╗██╔════╝ ██╔════╝██╔══██╗${R}`),
  row(`   ${A}██╔████╔██║███████║██╔██╗ ██║███████║██║  ███╗█████╗  ██████╔╝${R}`),
  row(`   ${A}██║╚██╔╝██║██╔══██║██║╚██╗██║██╔══██║██║   ██║██╔══╝  ██╔══██╗${R}`),
  row(`   ${A}██║ ╚═╝ ██║██║  ██║██║ ╚████║██║  ██║╚██████╔╝███████╗██║  ██║${R}`),
  row(`   ${S}╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝${R}`),
  row(""),
  row(`   ${S}${"░".repeat(62)}${R}`),
  row(`   ${A}▸${R} ${D}SECURE SHELL INTERFACE v1.0${R}                   ${D}STATUS: ${A}ONLINE${R}`),
  `${D}  └${"─".repeat(68)}┘${R}`,
];

export function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const suffix = defaultValue ? ` ${c.dim(`(${defaultValue})`)}` : "";

  return new Promise((resolve) => {
    rl.question(`  ${question}${suffix}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || "");
    });
  });
}

export function promptPassword(question: string, currentlySet = false): Promise<string> {
  const hint = currentlySet ? ` ${c.dim("(Enter to keep current, 'clear' to remove)")}` : "";
  process.stdout.write(`  ${question}${hint}: `);

  return new Promise((resolve) => {
    let buf = "";
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const onData = (key: Buffer) => {
      // Strip bracketed paste markers, keep the content between them
      const str = key.toString().replace(/\x1b\[200~/g, "").replace(/\x1b\[201~/g, "");

      for (let i = 0; i < str.length; i++) {
        const ch = str[i];

        // Ctrl+C
        if (ch === "\x03") {
          cleanup();
          process.stdout.write("\n");
          resolve("");
          return;
        }

        // Enter
        if (ch === "\r" || ch === "\n") {
          cleanup();
          process.stdout.write("\n");
          resolve(buf);
          return;
        }

        // Backspace
        if (ch === "\x7f" || ch === "\b") {
          if (buf.length > 0) {
            buf = buf.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }

        // Other escape sequences (arrow keys etc) — skip CSI sequence
        if (ch === "\x1b" && i + 1 < str.length && str[i + 1] === "[") {
          i += 2; // skip ESC and [
          while (i < str.length && str[i] >= "\x20" && str[i] <= "\x3f") i++; // skip params
          continue; // skip final byte
        }

        // Lone escape — ignore
        if (ch === "\x1b") continue;

        // Printable characters
        if (ch.charCodeAt(0) >= 32) {
          buf += ch;
          process.stdout.write("*");
        }
      }
    };

    const cleanup = () => {
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };

    process.stdin.on("data", onData);
  });
}

export function confirm(question: string): Promise<boolean> {
  return new Promise(async (resolve) => {
    const answer = await prompt(`${question} ${c.dim("[y/N]")}`);
    resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
  });
}

/**
 * Interactive arrow-key selector. Returns the index of the chosen item, or -1 if escaped.
 */
export function select(title: string, items: string[]): Promise<number> {
  if (items.length === 0) return Promise.resolve(-1);

  return new Promise((resolve) => {
    let cursor = 0;

    const render = () => {
      // Move cursor up to redraw (after first render)
      process.stdout.write(`\x1b[${items.length}A`);
      for (let i = 0; i < items.length; i++) {
        const prefix = i === cursor ? `${ACCENT_FG}❯${RESET} ` : "  ";
        const label = i === cursor ? `${BOLD}${items[i]}${RESET}` : `${DIM}${items[i]}${RESET}`;
        process.stdout.write(`${CLEAR_LINE}${prefix}${label}\n`);
      }
    };

    // Initial render
    console.log();
    console.log(`  ${c.bold(title)}`);
    console.log(`  ${c.dim("↑/↓ to move, Enter to select, Esc to cancel")}`);
    console.log();
    for (let i = 0; i < items.length; i++) {
      const prefix = i === cursor ? `${ACCENT_FG}❯${RESET} ` : "  ";
      const label = i === cursor ? `${BOLD}${items[i]}${RESET}` : `${DIM}${items[i]}${RESET}`;
      process.stdout.write(`${prefix}${label}\n`);
    }

    process.stdout.write(HIDE_CURSOR);
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const onData = (key: Buffer) => {
      const str = key.toString();

      // Escape
      if (str === "\x1b" || str === "\x03") {
        cleanup();
        resolve(-1);
        return;
      }

      // Enter
      if (str === "\r" || str === "\n") {
        cleanup();
        resolve(cursor);
        return;
      }

      // Arrow up
      if (str === "\x1b[A" || str === "k") {
        cursor = (cursor - 1 + items.length) % items.length;
        render();
        return;
      }

      // Arrow down
      if (str === "\x1b[B" || str === "j") {
        cursor = (cursor + 1) % items.length;
        render();
        return;
      }
    };

    const cleanup = () => {
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write(SHOW_CURSOR);
    };

    process.stdin.on("data", onData);
  });
}

export function printHeader(): void {
  console.clear();
  console.log();
  for (const line of BANNER) {
    console.log(line);
  }
  console.log();
}

export function printSuccess(msg: string): void {
  console.log(`  ${c.green("✓")} ${msg}`);
}

export function printError(msg: string): void {
  console.log(`  ${c.red("✗")} ${msg}`);
}

export async function pressEnterToContinue(): Promise<void> {
  await prompt(c.dim("Press Enter to continue..."));
}
