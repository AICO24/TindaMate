import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { supabase } from '@/lib/supabase';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Batch 4.2: Safe Supabase client connectivity verification
    if (__DEV__) {
      const verifySupabaseConnectivity = async () => {
        try {
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            console.warn(
              '[Supabase Check] Connectivity check failed: Auth endpoint returned an error.'
            );
          } else {
            console.log(
              '[Supabase Check] Connectivity check successful. Auth endpoint is reachable. Session is ' +
                (data.session ? 'active.' : 'null (expected before authentication).')
            );
          }
        } catch {
          console.warn(
            '[Supabase Check] Connectivity check failed: Unable to reach the Supabase endpoint.'
          );
        }
      };

      verifySupabaseConnectivity();
    }
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="products/index" options={{ headerShown: false }} />
        <Stack.Screen name="products/add" options={{ headerShown: false }} />
        <Stack.Screen name="products/[id]/index" options={{ headerShown: false }} />
        <Stack.Screen name="products/[id]/edit" options={{ headerShown: false }} />
        <Stack.Screen name="explore" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
