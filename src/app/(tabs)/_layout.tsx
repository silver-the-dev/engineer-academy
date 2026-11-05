import React from 'react';
import { Text } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../../theme';
import { useApp } from '../../state/store';

function Icon({ e, focused }: { e: string; focused: boolean }) {
  return <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.55, transform: [{ scale: focused ? 1.12 : 1 }] }}>{e}</Text>;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const onboarded = useApp((s) => s.onboarded);
  if (!onboarded) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: C.bgDeep, borderTopColor: C.surface2, borderTopWidth: 2, height: 64 + insets.bottom, paddingBottom: insets.bottom + 6, paddingTop: 6 },
        tabBarActiveTintColor: C.cyan,
        tabBarInactiveTintColor: C.textDim,
        tabBarLabelStyle: { fontFamily: F.heavy, fontSize: 11 },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Aprender', tabBarIcon: ({ focused }) => <Icon e="🏠" focused={focused} /> }} />
      <Tabs.Screen name="practice" options={{ title: 'Treinar', tabBarIcon: ({ focused }) => <Icon e="🏋️" focused={focused} /> }} />
      <Tabs.Screen name="quests" options={{ title: 'Missões', tabBarIcon: ({ focused }) => <Icon e="🎯" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ focused }) => <Icon e="👤" focused={focused} /> }} />
    </Tabs>
  );
}
