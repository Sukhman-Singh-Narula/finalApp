import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import LoadingSpinner from '@/components/LoadingSpinner';

function RootLayoutNav() {
  useFrameworkReady();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="story-player" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingSpinner message="Loading..." />} persistor={persistor}>
        <RootLayoutNav />
      </PersistGate>
    </Provider>
  );
}