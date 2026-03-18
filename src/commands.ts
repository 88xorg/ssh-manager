import { existsSync } from "fs";
import { resolve } from "path";
import { loadCredentials, saveCredentials, generateId } from "./store";
import { select, prompt, confirm, printSuccess, printError, c } from "./ui";
import type { SSHCredential } from "./types";

function formatCredential(cred: SSHCredential): string {
  const key = cred.identityFile ? ` 🔑` : "";
  return `${cred.name} ${c.dim(`(${cred.user}@${cred.host}:${cred.port}${key})`)}`;
}

export async function connectToServer(): Promise<void> {
  const credentials = loadCredentials();
  if (credentials.length === 0) {
    printError("No saved credentials. Add one first.");
    return;
  }

  const items = credentials.map(formatCredential);
  const idx = await select("Select a server to connect:", items);
  if (idx === -1) return;

  const cred = credentials[idx];
  const args = ["ssh"];

  if (cred.port !== 22) {
    args.push("-p", String(cred.port));
  }

  if (cred.identityFile) {
    args.push("-i", cred.identityFile);
  }

  args.push(`${cred.user}@${cred.host}`);

  console.log();
  console.log(`  ${c.dim("$")} ${c.cyan(args.join(" "))}`);
  console.log();

  // Replace the current process with ssh
  const proc = Bun.spawnSync(args, {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  // If spawnSync returns, ssh has exited
  if (proc.exitCode !== 0) {
    printError(`SSH exited with code ${proc.exitCode}`);
  }
}

export async function addCredential(): Promise<void> {
  console.log();
  console.log(`  ${c.bold("Add New Credential")}`);
  console.log();

  const name = await prompt("Name (alias)");
  if (!name) {
    printError("Name is required.");
    return;
  }

  const credentials = loadCredentials();
  if (credentials.some((c) => c.name === name)) {
    printError(`A credential named "${name}" already exists.`);
    return;
  }

  const host = await prompt("Host");
  if (!host) {
    printError("Host is required.");
    return;
  }

  const user = await prompt("User", "root");
  const portStr = await prompt("Port", "22");
  const port = parseInt(portStr, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    printError("Invalid port number.");
    return;
  }

  const identityFile = await prompt("Identity file path (optional)");
  let resolvedKey: string | undefined;
  if (identityFile) {
    const expanded = identityFile.replace(/^~/, process.env.HOME || "~");
    resolvedKey = resolve(expanded);
    if (!existsSync(resolvedKey)) {
      printError(`File not found: ${resolvedKey}`);
      return;
    }
  }

  const cred: SSHCredential = {
    id: generateId(),
    name,
    host,
    user,
    port,
    ...(resolvedKey && { identityFile: resolvedKey }),
  };

  credentials.push(cred);
  saveCredentials(credentials);
  printSuccess(`Added "${name}" (${user}@${host}:${port})`);
}

export async function editCredential(): Promise<void> {
  const credentials = loadCredentials();
  if (credentials.length === 0) {
    printError("No saved credentials.");
    return;
  }

  const items = credentials.map(formatCredential);
  const idx = await select("Select a credential to edit:", items);
  if (idx === -1) return;

  const cred = credentials[idx];
  console.log();
  console.log(`  ${c.bold(`Editing: ${cred.name}`)}`);
  console.log(`  ${c.dim("Press Enter to keep current value")}`);
  console.log();

  const name = await prompt("Name", cred.name);
  if (name !== cred.name && credentials.some((c) => c.name === name)) {
    printError(`A credential named "${name}" already exists.`);
    return;
  }

  const host = await prompt("Host", cred.host);
  const user = await prompt("User", cred.user);
  const portStr = await prompt("Port", String(cred.port));
  const port = parseInt(portStr, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    printError("Invalid port number.");
    return;
  }

  const identityFile = await prompt("Identity file path", cred.identityFile || "");
  let resolvedKey: string | undefined;
  if (identityFile) {
    const expanded = identityFile.replace(/^~/, process.env.HOME || "~");
    resolvedKey = resolve(expanded);
    if (!existsSync(resolvedKey)) {
      printError(`File not found: ${resolvedKey}`);
      return;
    }
  }

  credentials[idx] = {
    ...cred,
    name,
    host,
    user,
    port,
    identityFile: resolvedKey,
  };

  saveCredentials(credentials);
  printSuccess(`Updated "${name}"`);
}

export async function removeCredential(): Promise<void> {
  const credentials = loadCredentials();
  if (credentials.length === 0) {
    printError("No saved credentials.");
    return;
  }

  const items = credentials.map(formatCredential);
  const idx = await select("Select a credential to remove:", items);
  if (idx === -1) return;

  const cred = credentials[idx];
  const yes = await confirm(`Remove "${cred.name}" (${cred.user}@${cred.host})?`);
  if (!yes) return;

  credentials.splice(idx, 1);
  saveCredentials(credentials);
  printSuccess(`Removed "${cred.name}"`);
}
