import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';
import { C, F } from '../../theme';
import { engineering } from './model';
import type { Sample } from './useSimulation';
import type { CircuitSpec } from '../../lib/circuit';

export function Scope({ width, spec, samples, window, t }: { width: number; spec: NonNullable<CircuitSpec['scope']>; samples: Sample[]; window: number; t: number }) {
  const palette = [C.p1, C.p2, C.p3, C.p4, C.p5, C.p6];
  const values = samples.flatMap(p => p.values);
  let min = Math.min(0, ...values), max = Math.max(0, ...values);
  if (max - min < 1e-9) { min -= 1; max += 1; }
  const pad = (max - min) * 0.08; min -= pad; max += pad;
  const left = 64, right = width - 12, top = 14, bottom = 132;
  const from = Math.max(0, t - window), to = from + window;
  const x = (v: number) => left + (v - from) / window * (right - left);
  const y = (v: number) => bottom - (v - min) / (max - min) * (bottom - top);
  const unit = spec.of === 'i' ? 'A' : 'V';
  return <View style={{ backgroundColor: C.bgDeep, paddingVertical: 10 }}>
    <Text style={{ color: C.textMuted, fontFamily: F.heavy, fontSize: 12, paddingHorizontal: 12 }}>OSCILOSCÓPIO · {spec.of === 'i' ? 'CORRENTE' : 'TENSÃO'}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 12, marginTop: 6 }}>
      {spec.ids.map((id, k) => <Text key={id} style={{ color: palette[k % 6], fontFamily: F.bold, fontSize: 12 }}>● {id} {engineering(samples[samples.length - 1]?.values[k] ?? 0, unit)}</Text>)}
    </View>
    <Svg width={width} height={158} viewBox={`0 0 ${width} 158`}>
      {[0, 0.5, 1].map(n => <Line key={n} x1={left} x2={right} y1={top + n * (bottom - top)} y2={top + n * (bottom - top)} stroke={C.plotGrid} />)}
      <Line x1={left} x2={left} y1={top} y2={bottom} stroke={C.plotAxis} />
      <SvgText x={left - 5} y={top + 4} fill={C.textMuted} textAnchor="end" fontSize={10}>{engineering(max, unit)}</SvgText>
      <SvgText x={left - 5} y={bottom} fill={C.textMuted} textAnchor="end" fontSize={10}>{engineering(min, unit)}</SvgText>
      <SvgText x={left} y={152} fill={C.textDim} fontSize={10}>{engineering(from, 's')}</SvgText>
      <SvgText x={right} y={152} fill={C.textDim} fontSize={10} textAnchor="end">{engineering(to, 's')}</SvgText>
      {spec.ids.map((id, k) => <Path key={id} d={samples.filter(p => p.t >= from && p.t <= to).map((p, j) => `${j ? 'L' : 'M'}${x(p.t).toFixed(2)},${y(p.values[k]).toFixed(2)}`).join(' ')} stroke={palette[k % 6]} strokeWidth={2} fill="none" />)}
    </Svg>
    {!samples.length && <Text style={{ color: C.textDim, fontFamily: F.regular, fontSize: 12, paddingHorizontal: 12 }}>Aguardando amostras{t === 0 ? ' · inicie o tempo ou adicione uma fonte variável.' : '.'}</Text>}
  </View>;
}
