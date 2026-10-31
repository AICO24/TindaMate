import React, { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, usePathname } from 'expo-router';
import { User } from '@supabase/supabase-js';

import {
  DashboardBottomNav,
  NavTab,
  resolveActiveNavTab,
} from '@/components/dashboard/DashboardBottomNav';
import { DashboardMarketIllustration } from '@/components/dashboard/DashboardMarketIllustration';
import {
  DashboardBadgeVectorIcon,
  NavHomeIcon,
  NavMoreIcon,
  NavProductsIcon,
  NavUtangIcon,
  TrendChartVectorIcon,
} from '@/components/dashboard/DashboardNavIcons';
import { ProductScreenHeader } from '@/components/products/ProductScreenHeader';
import { LogoutConfirmModal } from '@/components/ui/LogoutConfirmModal';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import {
  BorderRadius,
  Colors,
  DashboardMaxContentWidth,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { supabase } from '@/lib/supabase';

interface MenuRowItem {
  id: string;
  label: string;
  subtitle?: string;
  iconBg: string;
  iconElement: React.ReactNode;
  onPress: () => void;
}

/**
 * TindaMate More / Settings Screen (`/more`) — Design 2.0
 *
 * Clean grouped store & account hub matching the TindaMate Design 2.0 reference:
 * - Deep Green Header ("More")
 * - Store Identity Card (Store illustration, "TindaMate Store", owner name, v1.0.0 badge)
 * - Grouped Menu List:
 *   - Store Profile, Inventory, Customers & Utang, Sales History, Expenses, Reports
 *   - Settings, Help & Support, About TindaMate
 * - Outlined Red/Orange "Log Out" action button with LogoutConfirmModal
 */
export default function MoreScreen() {
  const pathname = usePathname();
  const activeTab = resolveActiveNavTab(pathname);

  const [user, setUser] = useState<User | null>(null);
  const [storeName, setStoreName] = useState('TindaMate Store');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [activeInfoSheet, setActiveInfoSheet] = useState<
    'profile' | 'settings' | 'help' | 'about' | null
  >(null);

  const loadAccountInfo = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const sessionUser = data?.session?.user ?? null;
    setUser(sessionUser);

    if (sessionUser) {
      const metaStore =
        sessionUser.user_metadata?.store_name ||
        sessionUser.user_metadata?.business_name;
      if (typeof metaStore === 'string' && metaStore.trim().length > 0) {
        setStoreName(metaStore.trim());
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAccountInfo();
    }, [loadAccountInfo])
  );

  const ownerDisplayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'My Tindahan';

  const handleConfirmLogout = async () => {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
      setIsLogoutModalVisible(false);
      router.replace('/');
    } catch {
      setIsSigningOut(false);
      setIsLogoutModalVisible(false);
      router.replace('/');
    }
  };

  const handleTabPress = (tab: NavTab) => {
    if (tab === 'more') {
      return;
    }
    if (tab === 'home') {
      router.replace('/home');
      return;
    }
    if (tab === 'sales') {
      router.replace('/sales' as any);
      return;
    }
    if (tab === 'products') {
      router.replace('/products');
      return;
    }
    if (tab === 'utang') {
      router.replace('/customers' as any);
      return;
    }
  };

  const menuItems: MenuRowItem[] = [
    {
      id: 'store_profile',
      label: 'Store Profile',
      iconBg: '#E0F2FE',
      iconElement: <NavHomeIcon color="#0284C7" />,
      onPress: () => setActiveInfoSheet('profile'),
    },
    {
      id: 'inventory',
      label: 'Inventory',
      iconBg: '#DCFCE7',
      iconElement: <NavProductsIcon color={Colors.primary} />,
      onPress: () => router.push('/products'),
    },
    {
      id: 'expenses',
      label: 'Expenses',
      iconBg: '#FEF3C7',
      iconElement: (
        <DashboardBadgeVectorIcon type="utang_summary" color="#D97706" />
      ),
      onPress: () => router.push('/expenses' as any),
    },
    {
      id: 'reports',
      label: 'Reports',
      iconBg: '#DCFCE7',
      iconElement: <TrendChartVectorIcon color={Colors.primary} size={18} />,
      onPress: () => router.push('/reports' as any),
    },
    {
      id: 'settings',
      label: 'Settings',
      iconBg: '#F1F5F9',
      iconElement: <NavMoreIcon color="#475569" />,
      onPress: () => setActiveInfoSheet('settings'),
    },
    {
      id: 'help',
      label: 'Help & Support',
      iconBg: '#F1F5F9',
      iconElement: <Text style={styles.circleBadgeText}>?</Text>,
      onPress: () => setActiveInfoSheet('help'),
    },
    {
      id: 'about',
      label: 'About TindaMate',
      iconBg: '#FFEDD5',
      iconElement: (
        <Text style={[styles.circleBadgeText, { color: Colors.accent }]}>i</Text>
      ),
      onPress: () => setActiveInfoSheet('about'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.mainContainer}>
        {/* Top Deep Green Header */}
        <View style={styles.heroHeaderZone}>
          <ProductScreenHeader
            title="More"
            showBack={false}
            leftIcon={<NavMoreIcon color={Colors.textInverse} />}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.bodyContainer}>
            {/* Store Identity Card */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${storeName}, ${ownerDisplayName}, version 1.0.0`}
              onPress={() => setActiveInfoSheet('profile')}
              style={({ pressed }) => [
                styles.storeIdentityCard,
                pressed && styles.rowPressed,
              ]}>
              <View style={styles.storeIllustWrap}>
                <DashboardMarketIllustration compact />
              </View>
              <View style={styles.storeInfoCol}>
                <Text style={styles.storeTitle} numberOfLines={1}>
                  {storeName}
                </Text>
                <Text style={styles.storeSubtitle} numberOfLines={1}>
                  {ownerDisplayName}
                </Text>
                {user?.email ? (
                  <Text style={styles.storeEmailText} numberOfLines={1}>
                    {user.email}
                  </Text>
                ) : null}
              </View>
              <View style={styles.versionTag}>
                <Text style={styles.versionTagText}>v1.0.0</Text>
              </View>
            </Pressable>

            {/* Unified Menu Card */}
            <View style={styles.menuGroupCard}>
              {menuItems.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    onPress={item.onPress}
                    style={({ pressed }) => [
                      styles.menuRow,
                      pressed && styles.rowPressed,
                    ]}>
                    <View
                      style={[
                        styles.menuIconBox,
                        { backgroundColor: item.iconBg },
                      ]}>
                      {item.iconElement}
                    </View>
                    <View style={styles.menuTextCol}>
                      <Text style={styles.menuRowLabel}>{item.label}</Text>
                      {item.subtitle ? (
                        <Text style={styles.menuRowSubtitle} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.menuChevron}>›</Text>
                  </Pressable>
                  {idx < menuItems.length - 1 ? (
                    <View style={styles.menuDivider} />
                  ) : null}
                </React.Fragment>
              ))}

              {/* Outlined Log Out Button inside Bottom of Menu Card */}
              <View style={styles.logoutWrap}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Log Out of TindaMate"
                  onPress={() => setIsLogoutModalVisible(true)}
                  style={({ pressed }) => [
                    styles.logoutOutlineButton,
                    pressed && styles.logoutOutlineButtonPressed,
                  ]}>
                  <View style={styles.logoutIconBox}>
                    <Text style={styles.logoutArrowGlyph}>↪</Text>
                  </View>
                  <Text style={styles.logoutButtonText}>Log Out</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Persistent Bottom Navigation Bar */}
        <DashboardBottomNav
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </View>

      {/* Info Modal for Store Profile / Settings / Help / About */}
      <Modal
        visible={activeInfoSheet !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveInfoSheet(null)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setActiveInfoSheet(null)}>
          <Pressable
            style={styles.modalSheetCard}
            onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {activeInfoSheet === 'profile'
                ? 'Store Profile'
                : activeInfoSheet === 'settings'
                ? 'App Settings'
                : activeInfoSheet === 'help'
                ? 'Help & Support'
                : 'About TindaMate'}
            </Text>

            {activeInfoSheet === 'profile' ? (
              <View style={styles.modalDetailBox}>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Store Name</Text>
                  <Text style={styles.modalDetailValue}>{storeName}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Store Owner</Text>
                  <Text style={styles.modalDetailValue}>
                    {ownerDisplayName}
                  </Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Email</Text>
                  <Text style={styles.modalDetailValue}>
                    {user?.email ?? 'Guest Session'}
                  </Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Currency</Text>
                  <Text style={styles.modalDetailValue}>
                    Philippine Peso (₱ PHP)
                  </Text>
                </View>
              </View>
            ) : activeInfoSheet === 'settings' ? (
              <Text style={styles.modalBodyText}>
                Your store data is automatically synced with Supabase PostgreSQL
                with real-time stock verification, COGS tracking, and atomic
                credit ledger protection.
              </Text>
            ) : activeInfoSheet === 'help' ? (
              <Text style={styles.modalBodyText}>
                Need help managing your sari-sari store? Use the floating center
                POS button anytime to ring up a sale, or visit Customers & Utang
                to record customer payments.
              </Text>
            ) : (
              <Text style={styles.modalBodyText}>
                TindaMate — Your Digital Tindahan Assistant (Design 2.0 ·
                v1.0.0). Purpose-built for Philippine sari-sari store owners to
                track daily sales, inventory, expenses, and customer utang with
                confidence.
              </Text>
            )}

            <TindaMateButton
              title="Close"
              variant="primary"
              onPress={() => setActiveInfoSheet(null)}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        visible={isLogoutModalVisible}
        isLoading={isSigningOut}
        accountName={user?.email ?? ownerDisplayName}
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
  },
  heroHeaderZone: {
    backgroundColor: Colors.primaryDark,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: Spacing.one,
    ...Shadows.sm,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.five,
  },
  bodyContainer: {
    width: '100%',
    maxWidth: DashboardMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  storeIdentityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: 14,
    paddingHorizontal: Spacing.threeHalf,
    gap: 14,
    ...Shadows.sm,
  },
  storeIllustWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfoCol: {
    flex: 1,
    gap: 2,
  },
  storeTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  storeSubtitle: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  storeEmailText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
  },
  versionTag: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  versionTagText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
  },
  menuGroupCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    ...Shadows.sm,
  },
  menuSectionLabel: {
    fontSize: 11,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textMuted,
    letterSpacing: 0.7,
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.md,
    gap: 14,
  },
  rowPressed: {
    backgroundColor: Colors.surfaceSubtle,
    opacity: 0.9,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBadgeText: {
    fontSize: 16,
    fontWeight: Typography.weights.extraBold,
    color: '#475569',
  },
  menuTextCol: {
    flex: 1,
    gap: 1,
  },
  menuRowLabel: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  menuRowSubtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
  },
  menuChevron: {
    fontSize: 22,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginLeft: 58,
  },
  sectionGapDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: Spacing.twoHalf,
  },
  logoutWrap: {
    paddingTop: Spacing.three,
    paddingHorizontal: 4,
  },
  logoutOutlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    gap: 8,
  },
  logoutOutlineButtonPressed: {
    backgroundColor: '#FEE2E2',
    opacity: 0.9,
  },
  logoutIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutArrowGlyph: {
    fontSize: 14,
    fontWeight: Typography.weights.extraBold,
    color: '#EF4444',
  },
  logoutButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.extraBold,
    color: '#EF4444',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  modalSheetCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.four,
    gap: Spacing.three,
    ...Shadows.md,
  },
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  modalBodyText: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.relaxed,
  },
  modalDetailBox: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    gap: 10,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  modalDetailLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textMuted,
  },
  modalDetailValue: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
});

