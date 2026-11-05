import React, { useRef } from 'react';
import { Animated, Pressable, Text, View, ViewStyle } from 'react-native';
import { C, F, shade } from '../../theme';
import { tapFeedback } from '../../lib/feedback';

type Props = {
  title: string;
  onPress?: () => void;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  variant?: 'solid' | 'outline' | 'ghost';
  style?: ViewStyle;
  small?: boolean;
  icon?: string;
  silent?: boolean;
};

/** Chunky "3D" button (Duolingo style) with press-down animation. */
export function Button({ title, onPress, color = C.primary, textColor = C.white, disabled, variant = 'solid', style, small, icon, silent }: Props) {
  const press = useRef(new Animated.Value(0)).current;
  const depth = small ? 3 : 5;
  const bg = disabled ? C.surface3 : variant === 'solid' ? color : 'transparent';
  const edge = disabled ? shade(C.surface3, -0.35) : variant === 'solid' ? shade(color, -0.32) : variant === 'outline' ? C.border : 'transparent';
  const fg = disabled ? C.textDim : variant === 'solid' ? textColor : color;
  const animate = (to: number) => Animated.timing(press, { toValue: to, duration: 70, useNativeDriver: true }).start();
  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => animate(1)}
      onPressOut={() => animate(0)}
      onPress={() => {
        if (!silent) tapFeedback();
        onPress?.();
      }}
      style={[{ alignSelf: 'stretch' }, style]}
    >
      <View style={{ borderRadius: 16, backgroundColor: edge, paddingBottom: variant === 'ghost' ? 0 : depth }}>
        <Animated.View
          style={{
            transform: [{ translateY: press.interpolate({ inputRange: [0, 1], outputRange: [0, depth] }) }],
            borderRadius: 16,
            backgroundColor: bg,
            borderWidth: variant === 'outline' ? 2 : 0,
            borderColor: C.border,
            paddingVertical: small ? 9 : 15,
            paddingHorizontal: 18,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            marginBottom: variant === 'ghost' ? 0 : -depth,
          }}
        >
          {icon ? <Text style={{ fontSize: small ? 15 : 18, marginRight: 8 }}>{icon}</Text> : null}
          <Text style={{ color: fg, fontFamily: F.black, fontSize: small ? 14 : 17, letterSpacing: 0.8 }}>{title.toUpperCase()}</Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

export function ProgressBar({ value, color = C.success, height = 16, track = C.surface3 }: { value: number; color?: string; height?: number; track?: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${v * 100}%`, height: '100%', borderRadius: height / 2, backgroundColor: color }}>
        <View style={{ position: 'absolute', top: height * 0.22, left: height * 0.5, right: height * 0.5, height: height * 0.22, borderRadius: height, backgroundColor: 'rgba(255,255,255,0.28)' }} />
      </View>
    </View>
  );
}

export function Card({ children, style, color }: { children: React.ReactNode; style?: ViewStyle; color?: string }) {
  return (
    <View style={[{ backgroundColor: C.surface, borderRadius: 20, padding: 16, borderWidth: 2, borderColor: color ?? C.border }, style]}>{children}</View>
  );
}
