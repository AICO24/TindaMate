import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User } from '@supabase/supabase-js';

import { TindaMateCartLogo } from '@/components/ui/TindaMateCartLogo';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

/**
 * Authenticated App Shell (Home Screen)
 *
 * Serves as the central authenticated foundation for TindaMate:
 * - Validates active Supabase session
 * - Displays authenticated user details (email, full name)
 * - Sets the clean baseline for upcoming business modules
 * - Provides working Logout functionality calling supabase.auth.signOut()
 */
export default function AuthenticatedHomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Verify authenticated session on mount
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          // If no active session, redirect to unauthenticated Welcome flow
          if (isMounted) {
            router.replace('/');
          }
          return;
        }

        if (isMounted) {
          setUser(data.session.user);
        }
      } catch (err) {
        console.warn('[Session Check Error]:', err);
        if (isMounted) {
          router.replace('/');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    // Listen to auth state transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && isMounted) {
        router.replace('/');
      } else if (session && isMounted) {
        setUser(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Handle user sign out
   */
  const handleLogout = async () => {
    if (isLoggingOut) return;

    const performSignOut = async () => {
      try {
        setIsLoggingOut(true);
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn('[Supabase SignOut Error]:', error.message);
        }
        // Redirect to Welcome page
        router.replace('/');
      } catch (err) {
        console.warn('[Supabase SignOut Exception]:', err);
        router.replace('/');
      } finally {
        setIsLoggingOut(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to log out of TindaMate?');
      if (confirmLogout) {
        await performSignOut();
      }
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out of TindaMate?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: performSignOut },
      ]);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading TindaMate session...</Text>
      </SafeAreaView>
    );
  }

  const userDisplayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Vendor Partner';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Top Header with Brand Emblem */}
        <View style={styles.header}>
          <TindaMateCartLogo scale={0.85} showTagline={false} />
          {/* Status Badge */}
          <View style={styles.badge}>
            <View style={styles.statusDot} />
            <Text style={styles.badgeText}>Supabase Connected</Text>
          </View>
        </View>

        {/* User Greeting & Auth Summary Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.greetingTitle}>
            Kumusta, {userDisplayName}! 👋
          </Text>
          <Text style={styles.greetingSubtitle}>
            Welcome to your TindaMate workspace.
          </Text>

          <View style={styles.sessionInfoBox}>
            <Text style={styles.sessionLabel}>Authenticated Account:</Text>
            <Text style={styles.sessionValue}>{user?.email || 'Authenticated User'}</Text>
          </View>
        </View>

        {/* Foundation Architecture Placeholder for Future Modules */}
        <View style={styles.modulesContainer}>
          <Text style={styles.sectionHeader}>Upcoming Modules</Text>
          <Text style={styles.sectionSubheader}>
            Foundation established. Business features will be implemented in subsequent batches:
          </Text>

          {/* Module 1: Inventory & Products */}
          <View style={styles.moduleItem}>
            <View style={styles.moduleIconBox}>
              <Text style={styles.moduleEmoji}>📦</Text>
            </View>
            <View style={styles.moduleTextGroup}>
              <Text style={styles.moduleTitle}>Product & Inventory</Text>
              <Text style={styles.moduleDesc}>Stock tracking, pricing, and fast-moving alerts</Text>
            </View>
            <View style={styles.moduleBadge}>
              <Text style={styles.moduleBadgeText}>Phase 2</Text>
            </View>
          </View>

          {/* Module 2: Daily Sales & POS */}
          <View style={styles.moduleItem}>
            <View style={styles.moduleIconBox}>
              <Text style={styles.moduleEmoji}>💵</Text>
            </View>
            <View style={styles.moduleTextGroup}>
              <Text style={styles.moduleTitle}>Daily Sales & Orders</Text>
              <Text style={styles.moduleDesc}>Record daily transactions and cashier register</Text>
            </View>
            <View style={styles.moduleBadge}>
              <Text style={styles.moduleBadgeText}>Phase 2</Text>
            </View>
          </View>

          {/* Module 3: Utang Tracker / Credit Ledger */}
          <View style={styles.moduleItem}>
            <View style={styles.moduleIconBox}>
              <Text style={styles.moduleEmoji}>📝</Text>
            </View>
            <View style={styles.moduleTextGroup}>
              <Text style={styles.moduleTitle}>Credit Tracker (Lista ng Utang)</Text>
              <Text style={styles.moduleDesc}>Customer credit limits and payment settlement</Text>
            </View>
            <View style={styles.moduleBadge}>
              <Text style={styles.moduleBadgeText}>Phase 3</Text>
            </View>
          </View>
        </View>

        {/* Logout Action */}
        <View style={styles.logoutContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log out of TindaMate"
            onPress={handleLogout}
            disabled={isLoggingOut}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
              isLoggingOut && styles.logoutButtonDisabled,
            ]}>
            {isLoggingOut ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <Text style={styles.logoutButtonText}>Log Out</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFDF9',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  badgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 6,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  greetingSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  sessionInfoBox: {
    backgroundColor: '#F8FAFC',
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sessionLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  sessionValue: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: '700',
    color: '#0F172A',
  },
  modulesContainer: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubheader: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.three,
  },
  moduleIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleEmoji: {
    fontSize: 20,
  },
  moduleTextGroup: {
    flex: 1,
    gap: 2,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  moduleDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  moduleBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  moduleBadgeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  logoutContainer: {
    marginTop: Spacing.four,
  },
  logoutButton: {
    width: '100%',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonPressed: {
    backgroundColor: '#FECACA',
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: Typography.sizes.base,
    fontWeight: '700',
  },
});

