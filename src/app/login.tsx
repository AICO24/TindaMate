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
import { AuthHeader } from '@/components/ui/AuthHeader';
import { AlertCircleIcon, CheckIcon, LockIcon, MailIcon } from '@/components/ui/AuthIcons';
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import { TindaMateInput } from '@/components/ui/TindaMateInput';
import {
  BorderRadius,
  Colors,
  MaxContentWidth,
  Spacing,
  Typography,
} from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Submission & Error State
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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
      return `Unable to connect to Supabase: ${rawMessage}. Please check your internet connection.`;
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
        // Successful login: navigate to authenticated home screen
        router.replace('/home');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn('[Supabase SignIn Exception]:', errMsg);
      setAuthError(errMsg);
      if (Platform.OS === 'web') {
        window.alert(`Login Error: ${errMsg}`);
      } else {
        Alert.alert('Login Error', errMsg, [{ text: 'OK' }]);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Top Header with Back Button and Brand Logo */}
        <AuthHeader />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            {/* Screen Heading & Supporting Text */}
            <View style={styles.headingBlock}>
              <Text style={styles.heading}>Welcome Back!</Text>
              <Text style={styles.supportingText}>
                Login to your account to continue
              </Text>
            </View>

            {/* General Auth Error Banner */}
            {authError && (
              <View style={styles.authErrorBanner}>
                <AlertCircleIcon size={16} color={Colors.error} />
                <Text style={styles.authErrorText}>{authError}</Text>
              </View>
            )}

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
              leftIcon={<MailIcon size={19} />}
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
              leftIcon={<LockIcon size={19} variant="green" />}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              errorMessage={errors.password}
              accessibilityLabel="Password"
            />

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.optionsRow}>
              {/* Remember Me Checkbox (UI-only for now; persistence in future batch) */}
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberMe }}
                accessibilityLabel="Remember me"
                onPress={() => setRememberMe((prev) => !prev)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.checkboxContainer}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <CheckIcon size={10} color="#FFFFFF" />}
                </View>
                <Text style={styles.rememberMeText}>Remember me</Text>
              </Pressable>

              {/* Forgot Password Link */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Forgot password"
                onPress={handleForgotPassword}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </Pressable>
            </View>

            {/* Primary CTA: Login Button */}
            <View style={styles.ctaContainer}>
              <TindaMateButton
                title={isLoading ? 'Signing In...' : 'Login'}
                onPress={handleLogin}
                disabled={isLoading}
                accessibilityLabel="Log in to your account"
              />
            </View>

            {/* Divider: OR */}
            <AuthDivider label="OR" />

            {/* Secondary CTA: Continue with Google */}
            <GoogleSignInButton />

            {/* Bottom Navigation: Don't have an account? Register */}
            <View style={styles.bottomNavContainer}>
              <Text style={styles.bottomNavText}>
                Don&apos;t have an account?{' '}
                <Text
                  style={styles.bottomNavAction}
                  onPress={() => router.push('/register')}>
                  Register
                </Text>
              </Text>
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
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  contentContainer: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingTop: Spacing.two,
  },
  headingBlock: {
    marginBottom: Spacing.four,
  },
  heading: {
    fontSize: 24,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  supportingText: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.normal,
  },
  authErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.three,
  },
  authErrorText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
    lineHeight: 18,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
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
    backgroundColor: '#FFFFFF',
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
    fontWeight: Typography.weights.semiBold,
  },
  ctaContainer: {
    width: '100%',
    marginTop: Spacing.one,
  },
  bottomNavContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.five,
    paddingVertical: Spacing.two,
  },
  bottomNavText: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
  },
  bottomNavAction: {
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
  },
});

