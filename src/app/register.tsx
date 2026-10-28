import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
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
import * as Linking from 'expo-linking';

import { AuthBottomDecorations } from '@/components/ui/AuthBottomDecorations';
import { AuthErrorBanner } from '@/components/ui/AuthErrorBanner';
import { AuthHeader } from '@/components/ui/AuthHeader';
import { LockIcon, MailIcon, UserIcon } from '@/components/ui/AuthIcons';
import { AuthSuccessModal } from '@/components/ui/AuthSuccessModal';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import { TindaMateInput } from '@/components/ui/TindaMateInput';
import {
  AuthMaxContentWidth,
  BorderRadius,
  Colors,
  IconSizes,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function RegisterScreen() {
  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Submission & Error State
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Field-level Validation Error State
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Subtle screen entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

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

    setAuthError(null);

    const isValid = validateForm();
    if (!isValid) return;

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    try {
      setIsLoading(true);

      const redirectUrl = Linking.createURL('home');
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: password,
        options: {
          data: {
            full_name: trimmedName,
          },
          emailRedirectTo: redirectUrl,
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

      if (data.session) {
        router.replace('/home');
      } else {
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ========================================================
            [STEP 1] Top Navigation & Prominent TindaMate Brand
           ======================================================== */}
        <AuthHeader logoScale={1.04} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}>
            {/* ========================================================
                [STEP 2] Create Account Headline & Supporting Text
               ======================================================== */}
            <View style={styles.headingBlock}>
              <Text style={styles.heading} accessibilityRole="header">
                Create your account
              </Text>
              <Text style={styles.supportingText}>
                Start managing your tindahan smarter.
              </Text>
            </View>

            {/* Reusable Auth Error Banner */}
            <AuthErrorBanner message={authError} />

            {/* ========================================================
                [STEP 3] Registration Form Fields
               ======================================================== */}
            <View style={styles.formSection}>
              {/* Field 1: Full name */}
              <TindaMateInput
                label="Full name"
                placeholder="Juan Dela Cruz"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (authError) setAuthError(null);
                  if (errors.fullName) {
                    setErrors((prev) => ({ ...prev, fullName: undefined }));
                  }
                }}
                leftIcon={<UserIcon size={IconSizes.sm} color={Colors.textSecondary} />}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                errorMessage={errors.fullName}
                accessibilityLabel="Full name"
                style={styles.fieldSpacing}
              />

              {/* Field 2: Email Address */}
              <TindaMateInput
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (authError) setAuthError(null);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                leftIcon={<MailIcon size={IconSizes.sm} color={Colors.textSecondary} />}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                errorMessage={errors.email}
                accessibilityLabel="Email Address"
                style={styles.fieldSpacing}
              />

              {/* Field 3: Password */}
              <TindaMateInput
                label="Password"
                placeholder="Create a password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (authError) setAuthError(null);
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                leftIcon={<LockIcon size={IconSizes.sm} color={Colors.textSecondary} />}
                isPassword
                returnKeyType="next"
                errorMessage={errors.password}
                accessibilityLabel="Password"
                style={styles.fieldSpacing}
              />

              {/* Field 4: Confirm password */}
              <TindaMateInput
                label="Confirm password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (authError) setAuthError(null);
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                leftIcon={<LockIcon size={IconSizes.sm} color={Colors.textSecondary} />}
                isPassword
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                errorMessage={errors.confirmPassword}
                accessibilityLabel="Confirm password"
                style={styles.fieldSpacing}
              />
            </View>

            {/* ========================================================
                [STEP 4] Primary CTA: Create Account Button
               ======================================================== */}
            <View style={styles.ctaContainer}>
              <TindaMateButton
                title={isLoading ? 'Creating account...' : 'Create Account'}
                loading={isLoading}
                onPress={handleRegister}
                disabled={isLoading}
                accessibilityLabel="Create your TindaMate account"
                style={styles.registerButton}
                textStyle={styles.registerButtonText}
              />
            </View>

            {/* ========================================================
                [STEP 5] Balanced Bottom Account Switch Section
               ======================================================== */}
            <View style={styles.bottomSection}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Already have an account? Log in"
                onPress={() => router.push('/login')}
                hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
                style={({ pressed }) => [
                  styles.bottomNavPressable,
                  pressed && styles.linkPressed,
                ]}>
                <Text style={styles.bottomPromptText}>
                  Already have an account?
                </Text>
                <Text style={styles.bottomActionText}>Log in</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Restrained organic TindaMate green & orange corner shapes */}
        <AuthBottomDecorations />
      </KeyboardAvoidingView>

      {/* Smooth Direct Redirect Modal */}
      <AuthSuccessModal
        visible={showSuccessModal}
        title="Account Created!"
        message="Welcome to TindaMate! Taking you directly to your dashboard..."
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
    backgroundColor: Colors.backgroundWarm,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: 88,
  },
  contentContainer: {
    width: '100%',
    maxWidth: AuthMaxContentWidth,
    alignSelf: 'center',
    flex: 1,
    paddingTop: 12,
  },
  headingBlock: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 29,
    lineHeight: 35,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    letterSpacing: -0.6,
    marginBottom: 5,
  },
  supportingText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    fontWeight: Typography.weights.medium,
  },
  formSection: {
    width: '100%',
  },
  fieldSpacing: {
    marginBottom: 14,
  },
  ctaContainer: {
    width: '100%',
    marginTop: 6,
    marginBottom: 18,
  },
  registerButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    ...Shadows.primaryButton,
  },
  registerButtonText: {
    fontSize: 17,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.2,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  bottomNavPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    gap: 4,
  },
  linkPressed: {
    opacity: 0.65,
  },
  bottomPromptText: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  bottomActionText: {
    fontSize: Typography.sizes.base,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.extraBold,
  },
});
