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

export const c = {
  bold: (s: string) => `${BOLD}${s}${RESET}`,
  dim: (s: string) => `${DIM}${s}${RESET}`,
  red: (s: string) => `${RED}${s}${RESET}`,
  green: (s: string) => `${GREEN}${s}${RESET}`,
  cyan: (s: string) => `${CYAN}${s}${RESET}`,
  yellow: (s: string) => `${YELLOW}${s}${RESET}`,
};

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
        const prefix = i === cursor ? `${CYAN}❯${RESET} ` : "  ";
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
      const prefix = i === cursor ? `${CYAN}❯${RESET} ` : "  ";
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
  console.log(`  ${c.bold(c.cyan("SSH Manager"))}`);
  console.log(`  ${c.dim("─".repeat(40))}`);
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
