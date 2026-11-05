import React, { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
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

export const DisplayMath = memo(function DisplayMath({ tex, size = 20, color = C.text }: Omit<Props, 'display'>) {
  return (
    <View style={{ alignItems: 'center', marginVertical: 8, maxWidth: '100%' }}>
      <MathView tex={tex} size={size} color={color} display />
    </View>
  );
});
