import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

// Complete any pending browser sessions on web
WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'facebook';

export interface OAuthResult {
  success: boolean;
  error?: string;
}

/**
 * Extracts session tokens from a returned redirect URL (supports both PKCE code and Implicit access_token)
 */
export async function parseAndApplyOAuthTokens(url: string): Promise<OAuthResult> {
  try {
    // 1. Check for error parameters
    if (url.includes('error=')) {
      const match = url.match(/[?&#]error_description=([^&#]*)/);
      const description = match
        ? decodeURIComponent(match[1].replace(/\+/g, ' '))
        : 'Sign in was cancelled or failed.';
      return { success: false, error: description };
    }

    // 2. PKCE code exchange flow
    const codeMatch = url.match(/[?&]code=([^&#]*)/);
    if (codeMatch) {
      const code = decodeURIComponent(codeMatch[1]);
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.session) {
        return { success: true };
      }
    }

    // 3. Implicit token flow (hash parameters: #access_token=...&refresh_token=...)
    const hashIndex = url.indexOf('#');
    const queryIndex = url.indexOf('?');
    const tokenSource =
      hashIndex !== -1
        ? url.substring(hashIndex + 1)
        : queryIndex !== -1
        ? url.substring(queryIndex + 1)
        : '';

    if (tokenSource) {
      const params = new URLSearchParams(tokenSource);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          return { success: false, error: error.message };
        }
        if (data.session) {
          return { success: true };
        }
      }
    }

    // Check if session was already picked up
    const { data: currentSession } = await supabase.auth.getSession();
    if (currentSession?.session) {
      return { success: true };
    }

    return {
      success: false,
      error: 'Unable to establish session from login callback.',
    };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : 'Failed to parse authentication result.';
    return { success: false, error: msg };
  }
}

/**
 * Main OAuth entry point for Google and Facebook login/registration
 */
export async function performOAuthSignIn(
  provider: OAuthProvider
): Promise<OAuthResult> {
  try {
    // In Expo, use clean route path without leading double-slash
    const redirectUrl = Linking.createURL('home');

    const options: {
      redirectTo: string;
      skipBrowserRedirect: boolean;
      queryParams?: Record<string, string>;
    } = {
      redirectTo: redirectUrl,
      skipBrowserRedirect: Platform.OS !== 'web',
    };

    // Force Google to show the account picker instead of auto-failing with cached browser credentials
    if (provider === 'google') {
      options.queryParams = {
        prompt: 'select_account',
        access_type: 'offline',
      };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Web handles redirect automatically
    if (Platform.OS === 'web') {
      return { success: true };
    }

    // Native mobile app: open in-app browser session
    if (!data?.url) {
      return {
        success: false,
        error: 'No authorization URL returned from Supabase.',
      };
    }

    const browserResult = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    );

    if (browserResult.type === 'success' && browserResult.url) {
      return await parseAndApplyOAuthTokens(browserResult.url);
    }

    if (browserResult.type === 'cancel' || browserResult.type === 'dismiss') {
      // User cancelled
      return { success: false };
    }

    return {
      success: false,
      error: 'Authentication was interrupted. Please try again.',
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'An unexpected error occurred during third-party sign in.';
    return { success: false, error: message };
  }
}

