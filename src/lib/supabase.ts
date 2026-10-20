import { createClient } from '@supabase/supabase-js';

/**
 * TindaMate Supabase Client Configuration
 *
 * Reads public environment variables injected by Expo at build/runtime.
 * Uses the EXPO_PUBLIC_ prefix so Expo bundles them into the client application.
 */
const rawUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://dkzkajepfptysowwohrd.supabase.co';

// Sanitize URL: fix any accidental typos like trailing 'ww' or accidentally swapped 'ftp'
const supabaseUrl = rawUrl
  .trim()
  .replace(/\.coww$/i, '.co')
  .replace('dkzkajepftpysowwohrd', 'dkzkajepfptysowwohrd');

const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRremthamVwZnB0eXNvd3dvaHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTY3MjQsImV4cCI6MjEwNzk3MjcyNH0.pqnlMGHQ9xaInzL1MvQOHH2H5Bxe_tJjXzj9LED91yA';

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
 * Singleton Supabase client instance for the TindaMate mobile app.
 * Used for database queries, real-time subscriptions, and authentication.
 *
 * Note: persistSession is set to false for now until AsyncStorage/SecureStore
 * is configured in an upcoming batch, preventing localStorage crashes on React Native.
 */
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

