import { existsSync } from "fs";
import { resolve } from "path";
import { loadCredentials, saveCredentials, generateId } from "./store";
import { select, prompt, promptPassword, confirm, printSuccess, printError, c } from "./ui";
import type { SSHCredential } from "./types";

function formatCredential(cred: SSHCredential): string {
  const auth = cred.identityFile ? " 🔑" : cred.password ? " 🔒" : "";
  return `${cred.name} ${c.dim(`(${cred.user}@${cred.host}:${cred.port}${auth})`)}`;
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
  const usePassword = !!cred.password && !cred.identityFile;

  // Check sshpass availability when password auth is needed
  if (usePassword) {
    const check = Bun.spawnSync(["which", "sshpass"]);
    if (check.exitCode !== 0) {
      printError("sshpass is required for password auth but not installed.");
      console.log(`  ${c.dim("Install with:")} ${c.accent("brew install hudochenkov/sshpass/sshpass")}`);
      return;
    }
  }

  const sshArgs = ["ssh"];

  if (cred.port !== 22) {
    sshArgs.push("-p", String(cred.port));
  }

  if (cred.identityFile) {
    sshArgs.push("-i", cred.identityFile);
  }

  sshArgs.push(`${cred.user}@${cred.host}`);

  // Wrap with sshpass if password is set and no key is used
  const args = usePassword ? ["sshpass", "-e", ...sshArgs] : sshArgs;
  const env = usePassword ? { ...process.env, SSHPASS: cred.password! } : undefined;

  console.log();
  console.log(`  ${c.dim("$")} ${c.cyan(sshArgs.join(" "))}${usePassword ? c.dim(" (with password)") : ""}`);
  console.log();

  const proc = Bun.spawn(args, {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
    env,
  });

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    printError(`SSH exited with code ${exitCode}`);
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

  const password = await promptPassword("Password (optional)");

  const cred: SSHCredential = {
    id: generateId(),
    name,
    host,
    user,
    port,
    ...(resolvedKey && { identityFile: resolvedKey }),
    ...(password && { password }),
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

  const passwordInput = await promptPassword("Password", !!cred.password);
  let password: string | undefined;
  if (passwordInput === "clear") {
    password = undefined;
  } else if (passwordInput === "") {
    password = cred.password; // keep current
  } else {
    password = passwordInput;
  }

  credentials[idx] = {
    ...cred,
    name,
    host,
    user,
    port,
    identityFile: resolvedKey,
    password,
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
