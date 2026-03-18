export interface SSHCredential {
  id: string;
  name: string;
  host: string;
  user: string;
  port: number;
  identityFile?: string;
}

export interface CredentialStore {
  credentials: SSHCredential[];
}
