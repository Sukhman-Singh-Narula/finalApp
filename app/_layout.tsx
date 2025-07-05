// app/_layout.tsx - UPDATED WITH TOKEN MANAGEMENT
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { AuthProvider } from '../contexts/AuthContext';
import { useTokenManager } from '../hooks/useTokenManager';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Token Management Component
function TokenManager({ children }: { children: React.ReactNode }) {
  useTokenManager({
    checkOnAppForeground: true,
    autoRefreshBeforeExpiry: true,
    showExpirationAlert: true,
  });

  return <>{children}</>;
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-Bold': Nunito_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <TokenManager>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="story" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </TokenManager>
    </AuthProvider>
  );
}