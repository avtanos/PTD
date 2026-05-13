import type { ClientRecord } from '../components/ProjectBlocksTab';

export type CabinetCredential = {
  login: string;
  password: string;
};

export type CabinetCredentialsMap = Record<string, CabinetCredential>;

export function generateCabinetPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/** Логин по умолчанию из email или от id (демо). */
export function suggestCabinetLogin(c: ClientRecord): string {
  const email = c.email.trim().toLowerCase();
  if (email.includes('@')) {
    const local = email.split('@')[0].replace(/[^a-z0-9._-]/gi, '');
    if (local.length >= 3) return local;
  }
  const compact = c.id.replace(/[^a-zA-Z0-9]/g, '');
  return compact.length >= 4 ? `client_${compact.slice(0, 14)}` : `user_${c.id.slice(-8)}`;
}

export function findClientIdByCabinetLogin(
  login: string,
  password: string,
  creds: CabinetCredentialsMap,
): string | null {
  const ln = login.trim().toLowerCase();
  const pw = password;
  for (const [clientId, c] of Object.entries(creds)) {
    if (c.login.trim().toLowerCase() === ln && c.password === pw) return clientId;
  }
  return null;
}
