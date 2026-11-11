import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

/**
 * TindaMate Supabase Client Configuration
 *
 * Reads public environment variables injected by Expo at build/runtime.
 * Uses the EXPO_PUBLIC_ prefix so Expo bundles them into the client application.
 */
const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

// Sanitize URL: fix any accidental typos like trailing 'ww' or accidentally swapped 'ftp'
const supabaseUrl = rawUrl
  .trim()
  .replace(/\.coww$/i, '.co')
  .replace('dkzkajepftpysowwohrd', 'dkzkajepfptysowwohrd');

const supabasePublishableKey = (
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  ''
).trim();

// Runtime validation: alert developer if required environment variables are missing
if (!supabaseUrl) {
  throw new Error(
    'Missing environment variable: EXPO_PUBLIC_SUPABASE_URL. ' +
    'Please add your Supabase project URL to your .env.local file.'
  );
}

if (!supabasePublishableKey) {
  throw new Error(
    'Missing environment variable: EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. ' +
    'Please add your Supabase anon/publishable key to your .env.local file.'
  );
}

/**
 * Safe storage adapter that prevents "ReferenceError: window is not defined"
 * during Expo Router static rendering / Node.js SSR.
 */
const isServer = typeof window === 'undefined';

const ssrSafeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isServer) {
      return null;
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isServer) {
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (isServer) {
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};

/**
 * Singleton Supabase client instance for the TindaMate mobile app.
 * Configured with AsyncStorage for robust session persistence across app launches,
 * OAuth PKCE callbacks, and deep linking navigation, while remaining safe for SSR.
 */
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: ssrSafeStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: !isServer && Platform.OS === 'web',
  },
});

