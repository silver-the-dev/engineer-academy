import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../../theme';
import { useApp, useStreak } from '../../state/store';
import { dateKey } from '../../lib/dates';

export function TopBar({ left, onLeftPress, color }: { left?: React.ReactNode; onLeftPress?: () => void; color?: string }) {
  const insets = useSafeAreaInsets();
  const streak = useStreak();
  const gems = useApp((s) => s.gems);
  const hearts = useApp((s) => s.currentHearts());
  const heartsOn = useApp((s) => s.settings.hearts);
  const today = useApp((s) => s.days[dateKey()] ?? 0);
  const studied = today > 0;
  return (
    <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderBottomWidth: 2, borderColor: C.surface2 }}>
      <Pressable onPress={onLeftPress} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        {left}
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Text style={{ color: studied ? C.fire : C.textDim, fontFamily: F.black, fontSize: 17 }}>🔥 {streak}</Text>
        <Text style={{ color: C.gem, fontFamily: F.black, fontSize: 17 }}>💎 {gems}</Text>
        {heartsOn ? <Text style={{ color: C.heart, fontFamily: F.black, fontSize: 17 }}>❤️ {hearts}</Text> : null}
      </View>
    </View>
  );
}
