import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AuthHeader } from '@/components/ui/AuthHeader';
import { LockIcon, MailIcon, UserIcon } from '@/components/ui/AuthIcons';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import { TindaMateInput } from '@/components/ui/TindaMateInput';
import {
  Colors,
  MaxContentWidth,
  Spacing,
  Typography,
} from '@/constants/theme';

export default function RegisterScreen() {
  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validation Error State
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
   * Handle Registration submission
   *
   * UI-only implementation for Batch 3A:
   * Validates inputs, displays validation errors if any,
   * or shows an informational message that backend registration will be connected in the Supabase batch.
   */
  const handleRegister = () => {
    const isValid = validateForm();
    if (!isValid) return;

    const message =
      'Form validation passed! Account registration and store setup will be connected in the Supabase Auth batch.';

    if (Platform.OS === 'web') {
      window.alert(`Create Account (UI Preview)\n\n${message}`);
    } else {
      Alert.alert('Create Account (UI Preview)', message, [{ text: 'OK' }]);
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
              <Text style={styles.heading}>Create Your Account</Text>
              <Text style={styles.supportingText}>
                Join TindaMate and take control of your store.
              </Text>
            </View>

            {/* Field 1: Full Name */}
            <TindaMateInput
              label="Full Name"
              placeholder="Juan Dela Cruz"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName) {
                  setErrors((prev) => ({ ...prev, fullName: undefined }));
                }
              }}
              leftIcon={<UserIcon size={18} color={errors.fullName ? Colors.error : Colors.textMuted} />}
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

            {/* Field 3: Password */}
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
              leftIcon={<LockIcon size={18} color={errors.password ? Colors.error : Colors.textMuted} />}
              isPassword
              returnKeyType="next"
              errorMessage={errors.password}
              accessibilityLabel="Password"
            />

            {/* Password Strength Indicator (shown in reference image screen 5) */}
            <PasswordStrengthMeter password={password} showFeedbackText={!errors.password} />

            {/* Field 4: Confirm Password */}
            <TindaMateInput
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) {
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              leftIcon={<LockIcon size={18} color={errors.confirmPassword ? Colors.error : Colors.textMuted} />}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              errorMessage={errors.confirmPassword}
              accessibilityLabel="Confirm Password"
            />

            {/* Primary CTA: Register Button */}
            <View style={styles.ctaContainer}>
              <TindaMateButton
                title="Register"
                onPress={handleRegister}
                accessibilityLabel="Create your TindaMate account"
              />
            </View>

            {/* Bottom Navigation: Already have an account? Login */}
            <View style={styles.bottomNavContainer}>
              <Text style={styles.bottomNavText}>
                Already have an account?{' '}
                <Text
                  style={styles.bottomNavAction}
                  onPress={() => router.push('/login')}>
                  Login
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
  bottomNavText: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
  },
  bottomNavAction: {
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
  },
});

