import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View, useWindowDimensions } from 'react-native';
import { C } from '../../theme';

const COLORS = [C.primary, C.cyan, C.gold, C.success, C.p5, C.fire];

export function Confetti({ count = 60, duration = 2600 }: { count?: number; duration?: number }) {
  const { width, height } = useWindowDimensions();
  const prog = useRef(new Animated.Value(0)).current;
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        drift: (Math.random() - 0.5) * 160,
        delay: Math.random() * 0.35,
        size: 6 + Math.random() * 8,
        rot: Math.random() * 720 - 360,
        color: COLORS[i % COLORS.length],
        round: Math.random() < 0.3,
      })),
    [count, width],
  );
  useEffect(() => {
    Animated.timing(prog, { toValue: 1, duration, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [prog, duration]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width, height }}>
      {pieces.map((p, i) => {
        const t = prog.interpolate({ inputRange: [0, p.delay, 1], outputRange: [0, 0, 1], extrapolate: 'clamp' });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: -20,
              width: p.size,
              height: p.round ? p.size : p.size * 0.45,
              borderRadius: p.round ? p.size / 2 : 2,
              backgroundColor: p.color,
              opacity: t.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
              transform: [
                { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, height + 40] }) },
                { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
                { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rot}deg`] }) },
              ],
            }}
          />
        );
      })}
    </View>
  );
}
