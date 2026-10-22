import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AuthDivider } from '@/components/ui/AuthDivider';
import { AuthErrorBanner } from '@/components/ui/AuthErrorBanner';
import { AuthHeader } from '@/components/ui/AuthHeader';
import { CheckIcon, LockIcon, MailIcon } from '@/components/ui/AuthIcons';
import { AuthSuccessModal } from '@/components/ui/AuthSuccessModal';
import { FacebookSignInButton } from '@/components/ui/FacebookSignInButton';
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import { TindaMateInput } from '@/components/ui/TindaMateInput';
import {
  AuthMaxContentWidth,
  BorderRadius,
  Colors,
  IconSizes,
  Spacing,
  Typography,
} from '@/constants/theme';
import { performOAuthSignIn } from '@/lib/oauth';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Submission & Error State
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<'google' | 'facebook' | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Field-level Validation Error State
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  /**
   * Basic client-side validation for Login
   */
  const validateForm = (): boolean => {
    const nextErrors: { email?: string; password?: string } = {};

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      nextErrors.email = 'Email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        nextErrors.email = 'Please enter a valid email address.';
      }
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /**
   * Helper to map Supabase Auth errors to user-friendly messages
   */
  const mapAuthError = (rawMessage: string): string => {
    const lower = rawMessage.toLowerCase();
    if (
      lower.includes('invalid login credentials') ||
      lower.includes('invalid_grant') ||
      lower.includes('invalid_credentials')
    ) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Please confirm your email address before logging in. Check your inbox for the confirmation link.';
    }
    if (lower.includes('network') || lower.includes('fetch') || lower.includes('connection')) {
      return 'Unable to connect to TindaMate servers. Please check your internet connection and try again.';
    }
    return rawMessage;
  };

  /**
   * Handle Login submission with Supabase Auth
   */
  const handleLogin = async () => {
    if (isLoading) return;

    // Reset previous general auth error
    setAuthError(null);

    const isValid = validateForm();
    if (!isValid) return;

    const trimmedEmail = email.trim();

    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password,
      });

      if (error) {
        console.warn('[Supabase SignIn Error]:', error.message);
        const friendlyMessage = mapAuthError(error.message);
        setAuthError(friendlyMessage);
        if (Platform.OS === 'web') {
          window.alert(`Login Failed: ${friendlyMessage}`);
        } else {
          Alert.alert('Login Failed', friendlyMessage, [{ text: 'OK' }]);
        }
        return;
      }

      if (data.session) {
        // Successful login: directly navigate to dashboard screen
        router.replace('/home');
      } else {
        const unconfirmedMsg =
          'Please confirm your email address before logging in, or check your credentials.';
        setAuthError(unconfirmedMsg);
        if (Platform.OS === 'web') {
          window.alert(unconfirmedMsg);
        } else {
          Alert.alert('Sign In Needed', unconfirmedMsg, [{ text: 'OK' }]);
        }
      }
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : String(err);
      console.warn('[Supabase SignIn Exception]:', rawMsg);
      const friendlyMsg = mapAuthError(rawMsg);
      setAuthError(friendlyMsg);
      if (Platform.OS === 'web') {
        window.alert(`Login Error: ${friendlyMsg}`);
      } else {
        Alert.alert('Login Error', friendlyMsg, [{ text: 'OK' }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Forgot Password click (Preview placeholder until Batch 6)
   */
  const handleForgotPassword = () => {
    const message =
      'Password recovery will be implemented with Supabase Auth in an upcoming batch.';

    if (Platform.OS === 'web') {
      window.alert(`Forgot Password\n\n${message}`);
    } else {
      Alert.alert('Forgot Password', message, [{ text: 'OK' }]);
    }
  };

  /**
   * Handle OAuth Sign In (Google & Facebook)
   */
  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    if (isLoading || oauthLoadingProvider) return;
    setAuthError(null);
    setOauthLoadingProvider(provider);

    try {
      const result = await performOAuthSignIn(provider);
      if (result.success) {
        // Successful OAuth login: directly navigate to dashboard screen
        router.replace('/home');
      } else if (result.error) {
        setAuthError(mapAuthError(result.error));
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Social sign-in failed. Please try again.';
      setAuthError(msg);
    } finally {
      setOauthLoadingProvider(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Unified Top Header with Back Button and Official TindaMate Emblem */}
        <AuthHeader />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            {/* Screen Heading & Supporting Text */}
            <View style={styles.headingBlock}>
              <Text style={styles.heading} accessibilityRole="header">
                Welcome Back!
              </Text>
              <Text style={styles.supportingText}>
                Log in to your TindaMate store account to continue.
              </Text>
            </View>

            {/* Reusable Auth Error Banner */}
            <AuthErrorBanner message={authError} />

            {/* Email Field */}
            <TindaMateInput
              label="Email address"
              placeholder="juan@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (authError) setAuthError(null);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              leftIcon={<MailIcon size={IconSizes.md} />}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              errorMessage={errors.email}
              accessibilityLabel="Email address"
            />

            {/* Password Field */}
            <TindaMateInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (authError) setAuthError(null);
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              leftIcon={<LockIcon size={IconSizes.md} variant="green" />}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              errorMessage={errors.password}
              accessibilityLabel="Password"
            />

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.optionsRow}>
              {/* Remember Me Checkbox */}
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberMe }}
                accessibilityLabel="Remember me"
                onPress={() => setRememberMe((prev) => !prev)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.checkboxContainer}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <CheckIcon size={10} color={Colors.textInverse} />}
                </View>
                <Text style={styles.rememberMeText}>Remember me</Text>
              </Pressable>

              {/* Forgot Password Link */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Forgot password"
                onPress={handleForgotPassword}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={({ pressed }) => pressed && styles.linkPressed}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </Pressable>
            </View>

            {/* Primary CTA: Login Button */}
            <View style={styles.ctaContainer}>
              <TindaMateButton
                title={isLoading ? 'Signing In...' : 'Log In'}
                loading={isLoading}
                onPress={handleLogin}
                disabled={isLoading}
                accessibilityLabel="Log in to your account"
              />
            </View>

            {/* Divider: OR */}
            <AuthDivider label="OR" />

            {/* Social Logins: Google & Facebook */}
            <View style={styles.socialButtonsContainer}>
              <GoogleSignInButton
                onPress={() => handleOAuthSignIn('google')}
                loading={oauthLoadingProvider === 'google'}
                disabled={isLoading || Boolean(oauthLoadingProvider)}
              />

              <FacebookSignInButton
                onPress={() => handleOAuthSignIn('facebook')}
                loading={oauthLoadingProvider === 'facebook'}
                disabled={isLoading || Boolean(oauthLoadingProvider)}
              />
            </View>

            {/* Bottom Navigation: Don't have an account? Register */}
            <View style={styles.bottomNavContainer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Don't have an account? Go to Register"
                onPress={() => router.push('/register')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={({ pressed }) => [
                  styles.bottomNavPressable,
                  pressed && styles.linkPressed,
                ]}>
                <Text style={styles.bottomNavText}>
                  Don&apos;t have an account?{' '}
                  <Text style={styles.bottomNavAction}>Register</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Smooth Direct Redirect Modal */}
      <AuthSuccessModal
        visible={showSuccessModal}
        title="Login Successful!"
        message="Welcome back to TindaMate! Taking you directly to your dashboard..."
        onAutoRedirect={() => router.replace('/home')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
  },
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  contentContainer: {
    width: '100%',
    maxWidth: AuthMaxContentWidth,
    alignSelf: 'center',
    paddingTop: Spacing.four,
  },
  headingBlock: {
    marginBottom: Spacing.four,
  },
  heading: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textBrand,
    letterSpacing: -0.3,
    marginBottom: Spacing.one,
  },
  supportingText: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.normal,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xxs,
    marginBottom: Spacing.four,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.xs,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  rememberMeText: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  forgotPasswordText: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
  },
  linkPressed: {
    opacity: 0.65,
  },
  ctaContainer: {
    width: '100%',
    marginTop: Spacing.one,
  },
  bottomNavContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
    paddingVertical: Spacing.two,
  },
  bottomNavPressable: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  bottomNavText: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
  },
  bottomNavAction: {
    color: Colors.primary,
    fontWeight: Typography.weights.extraBold,
  },
  socialButtonsContainer: {
    width: '100%',
    gap: Spacing.twoHalf,
  },
});


