import { createClient } from '@supabase/supabase-js';

/**
 * TindaMate Supabase Client Configuration
 *
 * Reads public environment variables injected by Expo at build/runtime.
 * Uses the EXPO_PUBLIC_ prefix so Expo bundles them into the client application.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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
 */
export const supabase = createClient(supabaseUrl, supabasePublishableKey);

