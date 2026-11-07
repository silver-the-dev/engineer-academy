import React, { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, Text, View } from 'react-native';
import { C, F, alpha } from '../../theme';
import { useScrollLock } from '../ScrollLock';
import { MathView } from '../math/Math';
import { texToSvg } from '../math/tex';
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

  // "h", "\\omega_0" → TeX; "curva", "col 1" → plain words; "k (fator externo)" → TeX symbol + small note
  const lab = useMemo(() => {
    if (!label) return null;
    const wordy = (x: string) => !x.includes('\\') && /[A-Za-zÀ-ú]{3,}|\s/.test(x);
    const m = label.match(/^([^\s()]+)\s+\((.+)\)$/);
    const texBox = (tex: string) => {
      const nat = texToSvg(tex, false).wEx * 18 * 0.5;
      return nat <= 92 ? { w: Math.ceil(nat), size: 18 } : { w: 92, size: (18 * 92) / nat };
    };
    const noteW = (x: string) => Math.min(92, Math.ceil(x.length * 6.4));
    if (m && !wordy(m[1])) {
      const b = texBox(m[1]);
      return { tex: m[1], size: b.size, note: m[2], w: Math.max(34, b.w + 4, noteW(m[2])) };
    }
    if (wordy(label)) return { text: label, w: Math.max(34, Math.min(92, Math.ceil(label.length * 8.6) + 4)) };
    const b = texBox(label);
    return { tex: label, size: b.size, w: Math.max(34, b.w + 4) };
  }, [label]);
  const t = (value - min) / (max - min || 1);
  const shown = format ? format(value) : (Math.round(value * 100) / 100).toString().replace('.', ',');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 6, opacity: disabled ? 0.5 : 1 }}>
      {lab ? (
        <View style={{ width: lab.w, alignItems: 'center', marginRight: lab.w > 34 ? 6 : 0 }}>
          {lab.tex ? <MathView tex={lab.tex} size={lab.size} color={color} /> : null}
          {lab.text ? (
            <Text style={{ color, fontFamily: F.heavy, fontSize: 13, textAlign: 'center' }} numberOfLines={2}>
              {lab.text}
            </Text>
          ) : null}
          {lab.note ? (
            <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 10.5, lineHeight: 12, textAlign: 'center' }} numberOfLines={2}>
              {lab.note}
            </Text>
          ) : null}
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
