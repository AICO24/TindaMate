import { router } from 'expo-router';
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

import { AuthDivider } from '@/components/ui/AuthDivider';
import { AuthErrorBanner } from '@/components/ui/AuthErrorBanner';
import { AuthHeader } from '@/components/ui/AuthHeader';
import { LockIcon, MailIcon, UserIcon } from '@/components/ui/AuthIcons';
import { FacebookSignInButton } from '@/components/ui/FacebookSignInButton';
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import { TindaMateInput } from '@/components/ui/TindaMateInput';
import {
  AuthMaxContentWidth,
  Colors,
  IconSizes,
  Spacing,
  Typography,
} from '@/constants/theme';
import { performOAuthSignIn } from '@/lib/oauth';
import { supabase } from '@/lib/supabase';

export default function RegisterScreen() {
  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Submission & Error State
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<'google' | 'facebook' | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Field-level Validation Error State
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  /**
   * Basic client-side validation for Registration
   */
  const validateForm = (): boolean => {
    const nextErrors: {
      fullName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      nextErrors.fullName = 'Full Name is required.';
    } else if (trimmedName.length < 2) {
      nextErrors.fullName = 'Please enter your complete name.';
    }

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
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirm Password is required.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /**
   * Helper to map Supabase Auth errors to user-friendly messages
   */
  const mapAuthError = (rawMessage: string): string => {
    const lower = rawMessage.toLowerCase();
    if (lower.includes('already registered') || lower.includes('user already exists')) {
      return 'This email address is already registered. Please log in instead or use another email.';
    }
    if (lower.includes('password') && (lower.includes('short') || lower.includes('weak') || lower.includes('least'))) {
      return 'Password is too weak. Please use at least 6 characters with letters and numbers.';
    }
    if (lower.includes('valid email') || lower.includes('invalid email')) {
      return 'Please enter a valid email address.';
    }
    if (lower.includes('network') || lower.includes('fetch') || lower.includes('connection')) {
      return 'Unable to connect to TindaMate servers. Please check your internet connection and try again.';
    }
    return rawMessage;
  };

  /**
   * Handle Registration submission with Supabase Auth
   */
  const handleRegister = async () => {
    if (isLoading) return;

    // Reset previous general auth error
    setAuthError(null);

    const isValid = validateForm();
    if (!isValid) return;

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: password,
        options: {
          data: {
            full_name: trimmedName,
          },
        },
      });

      if (error) {
        console.warn('[Supabase SignUp Error]:', error.message);
        const friendlyMessage = mapAuthError(error.message);
        setAuthError(friendlyMessage);
        if (Platform.OS === 'web') {
          window.alert(`Registration Failed: ${friendlyMessage}`);
        } else {
          Alert.alert('Registration Failed', friendlyMessage, [{ text: 'OK' }]);
        }
        return;
      }

      // Check if session was returned or email confirmation is required
      if (data.session) {
        // Confirmation is disabled; user is immediately logged in
        const message = 'Account created successfully! Welcome to TindaMate.';
        if (Platform.OS === 'web') {
          window.alert(message);
          router.replace('/home');
        } else {
          Alert.alert('Welcome!', message, [
            { text: 'Get Started', onPress: () => router.replace('/home') },
          ]);
        }
      } else {
        // Confirmation is enabled; user must verify email first
        const message =
          'Account created successfully! Please check your email inbox to confirm your account before logging in.';
        if (Platform.OS === 'web') {
          window.alert(message);
          router.replace('/login');
        } else {
          Alert.alert('Confirm Your Email', message, [
            { text: 'Go to Login', onPress: () => router.replace('/login') },
          ]);
        }
      }
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : String(err);
      console.warn('[Supabase SignUp Exception]:', rawMsg);
      const friendlyMsg = mapAuthError(rawMsg);
      setAuthError(friendlyMsg);
      if (Platform.OS === 'web') {
        window.alert(`Registration Error: ${friendlyMsg}`);
      } else {
        Alert.alert('Registration Error', friendlyMsg, [{ text: 'OK' }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle OAuth Registration / Sign In (Google & Facebook)
   */
  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    if (isLoading || oauthLoadingProvider) return;
    setAuthError(null);
    setOauthLoadingProvider(provider);

    try {
      const result = await performOAuthSignIn(provider);
      if (result.success) {
        router.replace('/home');
      } else if (result.error) {
        setAuthError(mapAuthError(result.error));
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Social registration failed. Please try again.';
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
                Create Your Account
              </Text>
              <Text style={styles.supportingText}>
                Join TindaMate and take control of your sari-sari store.
              </Text>
            </View>

            {/* Reusable Auth Error Banner */}
            <AuthErrorBanner message={authError} />

            {/* Field 1: Full Name */}
            <TindaMateInput
              label="Full Name"
              placeholder="Juan Dela Cruz"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (authError) setAuthError(null);
                if (errors.fullName) {
                  setErrors((prev) => ({ ...prev, fullName: undefined }));
                }
              }}
              leftIcon={<UserIcon size={IconSizes.md} />}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              errorMessage={errors.fullName}
              accessibilityLabel="Full Name"
            />

            {/* Field 2: Email Address */}
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

            {/* Field 3: Password */}
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
              returnKeyType="next"
              errorMessage={errors.password}
              accessibilityLabel="Password"
            />

            {/* Password Strength Indicator */}
            <PasswordStrengthMeter password={password} showFeedbackText={!errors.password} />

            {/* Field 4: Confirm Password */}
            <TindaMateInput
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (authError) setAuthError(null);
                if (errors.confirmPassword) {
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              leftIcon={<LockIcon size={IconSizes.md} variant="green" />}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              errorMessage={errors.confirmPassword}
              accessibilityLabel="Confirm Password"
            />

            {/* Primary CTA: Register Button */}
            <View style={styles.ctaContainer}>
              <TindaMateButton
                title={isLoading ? 'Creating Account...' : 'Create Account'}
                loading={isLoading}
                onPress={handleRegister}
                disabled={isLoading}
                accessibilityLabel="Create your TindaMate account"
              />
            </View>

            {/* Divider: OR */}
            <AuthDivider label="OR" />

            {/* Social Logins: Google & Facebook */}
            <View style={styles.socialButtonsContainer}>
              <GoogleSignInButton
                label="Sign up with Google"
                onPress={() => handleOAuthSignIn('google')}
                loading={oauthLoadingProvider === 'google'}
                disabled={isLoading || Boolean(oauthLoadingProvider)}
              />

              <FacebookSignInButton
                label="Sign up with Facebook"
                onPress={() => handleOAuthSignIn('facebook')}
                loading={oauthLoadingProvider === 'facebook'}
                disabled={isLoading || Boolean(oauthLoadingProvider)}
              />
            </View>

            {/* Bottom Navigation: Already have an account? Login */}
            <View style={styles.bottomNavContainer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Already have an account? Go to Login"
                onPress={() => router.push('/login')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={({ pressed }) => [
                  styles.bottomNavPressable,
                  pressed && styles.linkPressed,
                ]}>
                <Text style={styles.bottomNavText}>
                  Already have an account?{' '}
                  <Text style={styles.bottomNavAction}>Login</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  ctaContainer: {
    width: '100%',
    marginTop: Spacing.two,
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
  linkPressed: {
    opacity: 0.65,
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


