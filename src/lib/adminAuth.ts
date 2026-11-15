import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getRandomBytesAsync } from 'expo-crypto';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import { ADMIN_ACTIVATION_HASH } from './adminEnrollment';

const KEY = 'engineer-academy.admin.auth.v1';
const PREVIEW_CODE = 'review-preview-token';
const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
// Hermes runs this key derivation in plain JavaScript: 600 000 rounds took about 50 s on Android.
// The verifier never leaves the device keystore, so the count is sized for a sign-in of about a second.
const ITERATIONS = 20_000;
const LEGACY_ITERATIONS = 600_000;
const LOCKOUT_MS = 30_000;
type Credentials = { salt: string; hash: string; iterations?: number; normalization?: 'NFC' };
type AuthData = { credentials?: Credentials; failures: number; retryAfter: number };

export const adminSupported = Platform.OS !== 'web' || __DEV__;

async function read(): Promise<AuthData> {
  if (!adminSupported) throw new Error('A administração está disponível no aplicativo instalado.');
  const raw = Platform.OS === 'web' ? sessionStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY, options);
  return parseAdminAuth(raw);
}

function validCredentials(value: unknown): value is Credentials {
  if (!value || typeof value !== 'object') return false;
  const c = value as Credentials;
  return typeof c.salt === 'string' && /^[a-f0-9]{32}$/.test(c.salt)
    && typeof c.hash === 'string' && /^[a-f0-9]{64}$/.test(c.hash)
    && (c.iterations === undefined || c.iterations === ITERATIONS || c.iterations === LEGACY_ITERATIONS)
    && (c.normalization === undefined || c.normalization === 'NFC');
}

export function parseAdminAuth(raw: string | null, now = Date.now()): AuthData {
  if (raw === null) return { failures: 0, retryAfter: 0 };
  const data = JSON.parse(raw) as AuthData | null;
  if (!data || typeof data !== 'object' || Array.isArray(data)
    || !Number.isSafeInteger(data.failures) || data.failures < 0
    || !Number.isSafeInteger(data.retryAfter) || data.retryAfter < 0
    || (data.credentials !== undefined && !validCredentials(data.credentials))) {
    throw new Error('O acesso salvo neste aparelho está corrompido. Use o código de ativação para criar uma nova senha.');
  }
  // A wait that outlasts the 30 s lockout can only come from a clock that was set back.
  return { ...data, retryAfter: data.retryAfter > now + LOCKOUT_MS ? 0 : data.retryAfter };
}

async function write(data: AuthData) {
  const raw = JSON.stringify(data);
  if (Platform.OS === 'web') sessionStorage.setItem(KEY, raw);
  else await SecureStore.setItemAsync(KEY, raw, options);
}

export function equalAdminHash(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function deriveAdminPassword(password: string, salt: string, iterations = ITERATIONS, normalize = true) {
  if (typeof password !== 'string' || !password.length || password.length > 128
    || typeof salt !== 'string' || !/^[a-f0-9]{32}$/.test(salt)
    || (iterations !== ITERATIONS && iterations !== LEGACY_ITERATIONS)) {
    throw new Error('Parâmetros de senha inválidos.');
  }
  // Keep the hex salt as UTF-8, as in the original verifier, for legacy compatibility.
  return bytesToHex(await pbkdf2Async(sha256, normalize ? password.normalize('NFC') : password, salt,
    { c: iterations, dkLen: 32, asyncTick: 50 }));
}

/** Returns the current verifier after a match, migrating old rounds/Unicode encoding only on success. */
export async function verifyAdminPassword(password: string, credentials: Credentials): Promise<Credentials | null> {
  if (!validCredentials(credentials) || typeof password !== 'string' || !password.length || password.length > 128) return null;
  const { salt, hash, iterations = LEGACY_ITERATIONS, normalization } = credentials;
  if (!equalAdminHash(await deriveAdminPassword(password, salt, iterations, normalization === 'NFC'), hash)) return null;
  if (iterations === ITERATIONS && normalization === 'NFC') return credentials;
  return { salt, hash: await deriveAdminPassword(password, salt), iterations: ITERATIONS, normalization: 'NFC' };
}

export const adminConfigured = async () => Boolean((await read()).credentials);

export async function activateAdmin(code: string, password: string) {
  if (!adminSupported) throw new Error('Abra o aplicativo instalado para configurar a administração.');
  const normalized = typeof code === 'string' ? code.trim().toLowerCase() : '';
  const preview = __DEV__ && Platform.OS === 'web' && normalized === PREVIEW_CODE;
  if (!preview && !equalAdminHash(bytesToHex(sha256(utf8ToBytes(normalized.replace(/[\s-]/g, '')))), ADMIN_ACTIVATION_HASH)) {
    throw new Error('Código de ativação inválido.');
  }
  if (typeof password !== 'string' || password.length > 128 || password.normalize('NFC').trim().length < 10) {
    throw new Error('Escolha uma senha com 10 a 128 caracteres.');
  }
  const salt = bytesToHex(await getRandomBytesAsync(16));
  await write({ credentials: { salt, hash: await deriveAdminPassword(password, salt), iterations: ITERATIONS, normalization: 'NFC' }, failures: 0, retryAfter: 0 });
}

export async function signInAdmin(password: string) {
  const data = await read();
  if (!data.credentials) throw new Error('Ative a conta de administrador neste aparelho.');
  if (data.retryAfter > Date.now()) {
    const seconds = Math.ceil((data.retryAfter - Date.now()) / 1000);
    throw new Error('Tente novamente em ' + seconds + ' s.');
  }
  const credentials = await verifyAdminPassword(password, data.credentials);
  if (credentials) {
    if (data.failures || data.retryAfter || credentials !== data.credentials) await write({ credentials, failures: 0, retryAfter: 0 });
    return;
  }
  const failures = data.retryAfter ? 1 : data.failures + 1;
  await write({ ...data, failures, retryAfter: failures >= 5 ? Date.now() + LOCKOUT_MS : 0 });
  throw new Error(failures >= 5 ? 'Muitas tentativas. Aguarde 30 s.' : 'Senha incorreta.');
}

/** Invalidates pending logins on background/navigation; an open desk retains its two-minute grace period. */
export function createAdminSession() {
  let generation = 0;
  let backgroundAt: number | undefined;
  return {
    begin: () => generation,
    invalidate: () => { generation++; },
    canUnlock: (attempt: number, state: string | null | undefined) => attempt === generation && state === 'active',
    change(state: string, now = Date.now()): boolean {
      if (state === 'background' && backgroundAt === undefined) {
        backgroundAt = now;
        generation++;
      }
      if (state !== 'active') return false;
      const expired = backgroundAt !== undefined && now - backgroundAt >= 120_000;
      backgroundAt = undefined;
      return expired;
    },
  };
}
