import React, { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, Text, View } from 'react-native';
import { C, F, alpha } from '../../theme';
import { useScrollLock } from '../ScrollLock';
import { MathView } from '../math/Math';
import { tick } from '../../lib/feedback';

type Props = {
  label?: string; // TeX label, e.g. "a"
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  color?: string;
  format?: (v: number) => string;
  disabled?: boolean;
};

export function Slider({ label, value, min, max, step = 0.1, onChange, color = C.primary, format, disabled }: Props) {
  const [w, setW] = useState(1);
  const lock = useScrollLock();
  const startX = useRef(0);
  const last = useRef(value);
  const latest = useRef({ min, max, step, onChange, w, disabled });
  latest.current = { min, max, step, onChange, w, disabled };

  const toValue = (px: number) => {
    const { min: a, max: b, step: s, w: W } = latest.current;
    const t = Math.max(0, Math.min(1, px / W));
    let v = a + t * (b - a);
    v = Math.round(v / s) * s;
    v = Math.max(a, Math.min(b, v));
    return parseFloat(v.toFixed(6));
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !latest.current.disabled,
        onMoveShouldSetPanResponder: () => !latest.current.disabled,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          lock(true);
          const { pageX, locationX } = e.nativeEvent;
          startX.current = pageX - locationX;
          const v = toValue(locationX);
          if (v !== last.current) {
            last.current = v;
            latest.current.onChange(v);
          }
        },
        onPanResponderMove: (e) => {
          const v = toValue(e.nativeEvent.pageX - startX.current);
          if (v !== last.current) {
            last.current = v;
            tick();
            latest.current.onChange(v);
          }
        },
        onPanResponderRelease: () => lock(false),
        onPanResponderTerminate: () => lock(false),
      }),
    [lock],
  );

  const t = (value - min) / (max - min || 1);
  const shown = format ? format(value) : (Math.round(value * 100) / 100).toString().replace('.', ',');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 6, opacity: disabled ? 0.5 : 1 }}>
      {label ? (
        <View style={{ width: 34, alignItems: 'center' }}>
          <MathView tex={label} size={18} color={color} />
        </View>
      ) : null}
      <View style={{ flex: 1, height: 40, justifyContent: 'center' }} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} {...pan.panHandlers}>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: C.surface3 }} />
        <View style={{ position: 'absolute', left: 0, width: Math.max(0, t * w), height: 8, borderRadius: 4, backgroundColor: color }} />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: t * w - 14,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: C.white,
            borderWidth: 4,
            borderColor: color,
            shadowColor: color,
            shadowOpacity: 0.6,
            shadowRadius: 8,
            elevation: 4,
          }}
        />
      </View>
      <View style={{ minWidth: 56, marginLeft: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: alpha(color, 0.18), alignItems: 'center' }}>
        <Text style={{ color, fontFamily: F.heavy, fontSize: 15 }}>{shown}</Text>
      </View>
    </View>
  );
}
