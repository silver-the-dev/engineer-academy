import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { C, alpha } from '../../theme';
import { RichText } from '../math/RichText';
import { tapFeedback } from '../../lib/feedback';
import { useLayoutProbe } from '../lesson/LayoutProbe';

export type CheckResult = { correct: boolean; answer?: string; code?: string };

export type ExProps<E> = {
  ex: E;
  locked: boolean;
  onReady: (ready: boolean) => void;
  registerCheck: (fn: () => CheckResult) => void;
  width: number;
};

export type ChoiceState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dim';

export function Choice({ text, state, onPress, style, size = 17, center }: { text: string; state: ChoiceState; onPress?: () => void; style?: ViewStyle; size?: number; center?: boolean }) {
  const onLayout = useLayoutProbe('choice');
  const border =
    state === 'selected' ? C.cyan : state === 'correct' ? C.success : state === 'wrong' ? C.danger : C.border;
  const bg = state === 'selected' ? alpha(C.cyan, 0.12) : state === 'correct' ? alpha(C.success, 0.14) : state === 'wrong' ? alpha(C.danger, 0.14) : C.surface;
  return (
    <Pressable
      onLayout={onLayout}
      accessibilityRole="button"
      accessibilityState={{ selected: state === 'selected', disabled: !onPress }}
      onPress={() => {
        tapFeedback();
        onPress?.();
      }}
      disabled={!onPress}
      style={[
        {
          borderWidth: 2,
          borderBottomWidth: 5,
          borderColor: border,
          backgroundColor: bg,
          borderRadius: 16,
          paddingVertical: 13,
          paddingHorizontal: 14,
          opacity: state === 'dim' ? 0.45 : 1,
          minHeight: 54,
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <RichText size={/^\s*\$[^$]+\$\s*$/.test(text) ? Math.max(size, 21) : size} align={center ? 'center' : 'left'} color={state === 'correct' ? C.success : state === 'wrong' ? C.danger : C.text}>
        {text}
      </RichText>
    </Pressable>
  );
}

export function Token({ text, onPress, used, color }: { text: string; onPress?: () => void; used?: boolean; color?: string }) {
  const onLayout = useLayoutProbe('token');
  return (
    <Pressable
      onLayout={onLayout}
      accessibilityRole="button"
      disabled={used || !onPress}
      onPress={() => {
        if (used) return;
        tapFeedback();
        onPress?.();
      }}
      style={{
        borderWidth: 2,
        borderBottomWidth: 4,
        borderColor: used ? C.surface3 : color ?? C.border,
        backgroundColor: used ? C.surface3 : C.surface,
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        margin: 4,
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ opacity: used ? 0 : 1 }}>
        <RichText size={16} align="center">
          {text}
        </RichText>
      </View>
    </Pressable>
  );
}

export function parseNumber(s: string): number | null {
  const t = s.replace(/\s/g, '').replace(/−/g, '-').replace(',', '.');
  if (!t) return null;
  if (t.includes('/')) {
    const [a, b] = t.split('/');
    const p = parseFloat(a);
    const q = parseFloat(b);
    if (!isFinite(p) || !isFinite(q) || q === 0) return null;
    return p / q;
  }
  const v = parseFloat(t);
  return isFinite(v) ? v : null;
}
