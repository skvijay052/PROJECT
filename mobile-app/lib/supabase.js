import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoTrueClient, processLock } from '@supabase/auth-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
export const authRedirectUrl =
  process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim() || 'bandhanaa://auth/callback';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseClient = null;
let autoRefreshRegistered = false;

function registerAutoRefresh(client) {
  if (Platform.OS === 'web' || autoRefreshRegistered) return;

  AppState.addEventListener('change', (state) => {
    if (state === 'active') client.auth.startAutoRefresh();
    else client.auth.stopAutoRefresh();
  });

  autoRefreshRegistered = true;
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile-app/.env'
    );
  }

  if (!supabaseClient) {
    supabaseClient = {
      auth: new GoTrueClient({
        url: `${supabaseUrl}/auth/v1`,
        headers: {
          apikey: supabaseAnonKey,
        },
        storageKey: 'bandhanaa-auth',
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      }),
    };

    if (Platform.OS !== 'web') {
      supabaseClient.auth.startAutoRefresh();
    }

    registerAutoRefresh(supabaseClient);
  }

  return supabaseClient;
}
