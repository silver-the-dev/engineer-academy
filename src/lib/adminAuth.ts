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
type Credentials = { salt: string; hash: string; iterations?: number };
type AuthData = { credentials?: Credentials; failures: number; retryAfter: number };

export const adminSupported = Platform.OS !== 'web' || __DEV__;

async function read(): Promise<AuthData> {
  if (!adminSupported) throw new Error('A administração está disponível no aplicativo instalado.');
  const raw = Platform.OS === 'web' ? sessionStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY, options);
  if (!raw) return { failures: 0, retryAfter: 0 };
  const data = JSON.parse(raw) as AuthData;
  // A wait that outlasts the 30 s lockout can only come from a clock that was set back.
  return { ...data, retryAfter: data.retryAfter > Date.now() + LOCKOUT_MS ? 0 : data.retryAfter };
}

async function write(data: AuthData) {
  const raw = JSON.stringify(data);
  if (Platform.OS === 'web') sessionStorage.setItem(KEY, raw);
  else await SecureStore.setItemAsync(KEY, raw, options);
}

function equal(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function derive(password: string, salt: string, iterations: number) {
  return bytesToHex(await pbkdf2Async(sha256, password, salt, { c: iterations, dkLen: 32, asyncTick: 50 }));
}

export const adminConfigured = async () => Boolean((await read()).credentials);

export async function activateAdmin(code: string, password: string) {
  if (!adminSupported) throw new Error('Abra o aplicativo instalado para configurar a administração.');
  const normalized = code.trim().toLowerCase();
  const preview = __DEV__ && Platform.OS === 'web' && normalized === PREVIEW_CODE;
  if (!preview && !equal(bytesToHex(sha256(utf8ToBytes(normalized.replace(/[\s-]/g, '')))), ADMIN_ACTIVATION_HASH)) {
    throw new Error('Código de ativação inválido.');
  }
  if (password.length < 10 || password.length > 128 || password.trim().length < 10) {
    throw new Error('Escolha uma senha com 10 a 128 caracteres.');
  }
  const salt = bytesToHex(await getRandomBytesAsync(16));
  await write({ credentials: { salt, hash: await derive(password, salt, ITERATIONS), iterations: ITERATIONS }, failures: 0, retryAfter: 0 });
}

export async function signInAdmin(password: string) {
  const data = await read();
  if (!data.credentials) throw new Error('Ative a conta de administrador neste aparelho.');
  if (data.retryAfter > Date.now()) {
    const seconds = Math.ceil((data.retryAfter - Date.now()) / 1000);
    throw new Error('Tente novamente em ' + seconds + ' s.');
  }
  const { salt, hash, iterations = LEGACY_ITERATIONS } = data.credentials;
  if (password.length <= 128 && equal(await derive(password, salt, iterations), hash)) {
    const credentials = iterations === ITERATIONS ? data.credentials
      : { salt, hash: await derive(password, salt, ITERATIONS), iterations: ITERATIONS };
    if (data.failures || credentials !== data.credentials) await write({ credentials, failures: 0, retryAfter: 0 });
    return;
  }
  const failures = data.retryAfter ? 1 : data.failures + 1;
  await write({ ...data, failures, retryAfter: failures >= 5 ? Date.now() + LOCKOUT_MS : 0 });
  throw new Error(failures >= 5 ? 'Muitas tentativas. Aguarde 30 s.' : 'Senha incorreta.');
}
