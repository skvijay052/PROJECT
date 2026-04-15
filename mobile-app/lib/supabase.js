import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoTrueClient, processLock } from '@supabase/auth-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
export const authRedirectUrl =
  process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim() || 'bandhanaa://auth/callback';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
const AUTH_STORAGE_KEY = 'bandhanaa-auth';

let supabaseClient = null;
let autoRefreshRegistered = false;

function registerAutoRefresh(client) {
  if (Platform.OS === 'web' || autoRefreshRegistered) return;

  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void syncAutoRefresh(client).catch(() => {
        client.auth.stopAutoRefresh();
      });
      return;
    }

    client.auth.stopAutoRefresh();
  });

  autoRefreshRegistered = true;
}

function getErrorMessage(error) {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (typeof error.message === 'string') return error.message;
  return String(error);
}

function isInvalidRefreshTokenError(error) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('invalid refresh token') ||
    message.includes('refresh token not found') ||
    message.includes('refresh_token_not_found') ||
    message.includes('invalid_grant')
  );
}

async function clearPersistedSession(client) {
  const authClient = client?.auth;

  try {
    if (authClient?.signOut) {
      await authClient.signOut({ scope: 'local' });
    }
  } catch (_) {
    // Fall through to storage cleanup below.
  }

  if (Platform.OS !== 'web') {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (_) {
      // Ignore storage cleanup failures and continue with a best-effort reset.
    }
  }
}

async function readSessionWithRecovery(client) {
  const { data, error } = await client.auth.getSession();
  if (!error) {
    return data?.session ?? null;
  }

  if (isInvalidRefreshTokenError(error)) {
    await clearPersistedSession(client);
    return null;
  }

  throw error;
}

async function syncAutoRefresh(client) {
  if (Platform.OS === 'web') return null;

  const session = await readSessionWithRecovery(client);
  if (session) {
    client.auth.startAutoRefresh();
  } else {
    client.auth.stopAutoRefresh();
  }

  return session;
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Set them in mobile-app/.env for local development or in EAS environment variables for cloud builds.'
    );
  }

  if (!supabaseClient) {
    supabaseClient = {
      auth: new GoTrueClient({
        url: `${supabaseUrl}/auth/v1`,
        headers: {
          apikey: supabaseAnonKey,
        },
        storageKey: AUTH_STORAGE_KEY,
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      }),
    };

    registerAutoRefresh(supabaseClient);
  }

  return supabaseClient;
}

export async function getSupabaseSession() {
  const client = getSupabaseClient();

  if (Platform.OS !== 'web') {
    return syncAutoRefresh(client);
  }

  return readSessionWithRecovery(client);
}

export async function signOutSupabaseSession() {
  const client = getSupabaseClient();

  try {
    const { error } = await client.auth.signOut();
    if (error && !isInvalidRefreshTokenError(error)) {
      throw error;
    }
  } finally {
    await clearPersistedSession(client);
    client.auth.stopAutoRefresh();
  }
}
