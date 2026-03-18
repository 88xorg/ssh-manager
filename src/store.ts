import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { SSHCredential, CredentialStore } from "./types";

const STORE_DIR = join(homedir(), ".ssh_manager");
const STORE_FILE = join(STORE_DIR, "credentials.json");

function ensureStore(): void {
  if (!existsSync(STORE_DIR)) {
    mkdirSync(STORE_DIR, { mode: 0o700 });
  }
  if (!existsSync(STORE_FILE)) {
    writeFileSync(STORE_FILE, JSON.stringify({ credentials: [] }, null, 2), {
      mode: 0o600,
    });
  }
}

export function loadCredentials(): SSHCredential[] {
  ensureStore();
  const data = readFileSync(STORE_FILE, "utf-8");
  const store: CredentialStore = JSON.parse(data);
  return store.credentials;
}

export function saveCredentials(credentials: SSHCredential[]): void {
  ensureStore();
  const store: CredentialStore = { credentials };
  writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), { mode: 0o600 });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
