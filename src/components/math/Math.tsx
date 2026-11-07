import React, { memo, useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, ScrollView, Text, View, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { C, F } from '../../theme';
import { sizedSvg, texToSvg } from './tex';

type Props = {
  tex: string;
  size?: number; // font size in px
  color?: string;
  display?: boolean;
};

/**
 * Renders a single TeX formula as native SVG.
 * Inline formulas are shifted so that the math axis lines up with the centre
 * of the surrounding text line (rows use alignItems: 'center').
 */
export const MathView = memo(function MathView({ tex, size = 18, color = C.text, display = false }: Props) {
  const t = useMemo(() => texToSvg(tex, display), [tex, display]);
  const exPx = size * 0.5;
  const s = useMemo(() => sizedSvg(t, exPx, color), [t, exPx, color]);
  if (t.error || !t.xml) {
    return <Text style={{ color: C.danger, fontFamily: F.semibold, fontSize: size * 0.85 }}>{tex}</Text>;
  }
  let mt = 0;
  let mb = 0;
  if (!display) {
    const aboveBaseline = (t.hEx + t.vaEx) * exPx;
    const axisFromTop = aboveBaseline - 0.3 * size;
    const delta = s.h / 2 - axisFromTop;
    if (delta > 0) mt = 2 * delta;
    else mb = -2 * delta;
  }
  return (
    <View style={{ width: s.w, height: s.h, marginTop: mt, marginBottom: mb }}>
      <SvgXml xml={s.xml} width={s.w} height={s.h} />
    </View>
  );
});

/** Smallest scale a display formula is shrunk to; anything wider scrolls sideways instead of becoming unreadable. */
const MIN_SCALE = 0.62;

/** Display formula that fits `avail` px: shrinks it, and past MIN_SCALE lets it scroll horizontally. */
export const FitMath = memo(function FitMath({ tex, size, color = C.text, avail, style }: { tex: string; size: number; color?: string; avail: number; style?: ViewStyle }) {
  const t = useMemo(() => texToSvg(tex, true), [tex]);
  const room = Math.max(40, avail - 4);
  const natural = t.wEx * size * 0.5;
  const scale = natural > room ? room / natural : 1;
  if (scale >= MIN_SCALE) {
    return (
      <View style={[{ alignItems: 'center' }, style]}>
        <MathView tex={tex} size={size * scale} color={color} display />
      </View>
    );
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator style={[{ maxWidth: avail, alignSelf: 'center' }, style]} contentContainerStyle={{ paddingBottom: 6 }}>
      <MathView tex={tex} size={size * MIN_SCALE} color={color} display />
    </ScrollView>
  );
});

export const DisplayMath = memo(function DisplayMath({ tex, size = 20, color = C.text }: Omit<Props, 'display'>) {
  const [w, setW] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const nw = Math.floor(e.nativeEvent.layout.width);
    setW((old) => (Math.abs(old - nw) > 1 ? nw : old));
  }, []);
  return (
    <View style={{ alignSelf: 'stretch', marginVertical: 8 }} onLayout={onLayout}>
      {w > 0 ? <FitMath tex={tex} size={size} color={color} avail={w} /> : null}
    </View>
  );
});
