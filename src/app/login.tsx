import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

import { AuthBottomDecorations } from '@/components/ui/AuthBottomDecorations';
import { AuthErrorBanner } from '@/components/ui/AuthErrorBanner';
import { AuthHeader } from '@/components/ui/AuthHeader';
import { LockIcon, MailIcon } from '@/components/ui/AuthIcons';
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

export default function LoginScreen() {
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Submission & Error State
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Field-level Validation Error State
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

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
   * Handle Forgot Password click
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
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ========================================================
            [STEP 1] Top Navigation & Prominent TindaMate Brand
           ======================================================== */}
        <AuthHeader logoScale={1.06} />

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
                [STEP 2] Welcome Back Headline & Supporting Copy
               ======================================================== */}
            <View style={styles.headingBlock}>
              <Text style={styles.heading} accessibilityRole="header">
                Welcome back
              </Text>
              <Text style={styles.supportingText}>
                Let&apos;s get your store running.
              </Text>
            </View>

            {/* Reusable Auth Error Banner */}
            <AuthErrorBanner message={authError} />

            {/* ========================================================
                [STEP 3] Login Form (Email, Password, Forgot Password)
               ======================================================== */}
            <View style={styles.formSection}>
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
              />

              <TindaMateInput
                label="Password"
                placeholder="Enter your password"
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
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                errorMessage={errors.password}
                accessibilityLabel="Password"
              />

              {/* Forgot Password Link */}
              <View style={styles.forgotPasswordRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Forgot password"
                  onPress={handleForgotPassword}
                  hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
                  style={({ pressed }) => pressed && styles.linkPressed}>
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </Pressable>
              </View>
            </View>

            {/* ========================================================
                [STEP 4] Primary Login CTA
               ======================================================== */}
            <View style={styles.ctaContainer}>
              <TindaMateButton
                title={isLoading ? 'Signing in...' : 'Log In'}
                loading={isLoading}
                onPress={handleLogin}
                disabled={isLoading}
                accessibilityLabel="Log in to your account"
                style={styles.loginButton}
                textStyle={styles.loginButtonText}
              />
            </View>

            {/* ========================================================
                [STEP 5] Balanced Bottom Account Switch Section
               ======================================================== */}
            <View style={styles.bottomSection}>
              <View style={styles.subtleDivider} />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="New to TindaMate? Create an account"
                onPress={() => router.push('/register')}
                hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
                style={({ pressed }) => [
                  styles.bottomNavPressable,
                  pressed && styles.linkPressed,
                ]}>
                <Text style={styles.bottomPromptText}>New to TindaMate?</Text>
                <Text style={styles.bottomActionText}>Create an account</Text>
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
    paddingTop: 16,
  },
  headingBlock: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 30,
    lineHeight: 36,
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
  forgotPasswordRow: {
    alignItems: 'flex-end',
    marginTop: 2,
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  linkPressed: {
    opacity: 0.65,
  },
  ctaContainer: {
    width: '100%',
    marginBottom: 28,
  },
  loginButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    ...Shadows.primaryButton,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.2,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  subtleDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E8E3D3',
    marginBottom: 20,
  },
  bottomNavPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    gap: 4,
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
