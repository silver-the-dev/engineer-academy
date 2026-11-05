import React, { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { C } from '../theme';
import { useApp } from '../state/store';
import { initSounds } from '../lib/feedback';
import { rescheduleReminders, setupNotificationChannel } from '../lib/notifications';
import { syncWidget } from '../lib/widget';

SplashScreen.preventAutoHideAsync().catch(() => {});

function useHydrated() {
  const [h, setH] = useState(useApp.persist.hasHydrated());
  useEffect(() => {
    const unsub = useApp.persist.onFinishHydration(() => setH(true));
    setH(useApp.persist.hasHydrated());
    return unsub;
  }, []);
  return h;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black });
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;
    useApp.getState().ensureDaily();
    initSounds();
    setupNotificationChannel().then(rescheduleReminders).catch(() => {});
    syncWidget();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') {
        useApp.getState().ensureDaily();
        syncWidget();
        rescheduleReminders();
      }
    });
    return () => sub.remove();
  }, [hydrated]);

  useEffect(() => {
    if (fontsLoaded && hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, hydrated]);

  if (!fontsLoaded || !hydrated) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="lesson/[id]" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
          <Stack.Screen name="unit/[id]" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
