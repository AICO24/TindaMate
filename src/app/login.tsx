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
import { CheckIcon, LockIcon, MailIcon } from '@/components/ui/AuthIcons';
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

export default function LoginScreen() {
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Validation Error State
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
   * Handle Login submission
   *
   * UI-only implementation for Batch 3A:
   * Validates inputs, displays validation errors if any,
   * or shows an informational message that backend auth will be connected in the Supabase batch.
   */
  const handleLogin = () => {
    const isValid = validateForm();
    if (!isValid) return;

    const message =
      'Form validation passed! Real login and session handling will be connected in the Supabase Auth batch.';

    if (Platform.OS === 'web') {
      window.alert(`Login (UI Preview)\n\n${message}`);
    } else {
      Alert.alert('Login (UI Preview)', message, [{ text: 'OK' }]);
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

            {/* Email Field */}
            <TindaMateInput
              label="Email address"
              placeholder="juan@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              leftIcon={<MailIcon size={18} color={errors.email ? Colors.error : Colors.textMuted} />}
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
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              leftIcon={<LockIcon size={18} variant={errors.password ? 'default' : 'green'} color={errors.password ? Colors.error : undefined} />}
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
                title="Login"
                onPress={handleLogin}
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

