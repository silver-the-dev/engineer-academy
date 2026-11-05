import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { C, F } from '../../theme';
import { addDays, dateKey, MONTHS } from '../../lib/dates';

const LEVELS = ['#161B22', '#0E4429', '#006D32', '#26A641', '#39D353'];

export function levelFor(xp: number, goal: number) {
  if (xp <= 0) return 0;
  if (xp < goal / 2) return 1;
  if (xp < goal) return 2;
  if (xp < goal * 2) return 3;
  return 4;
}

/** GitHub-style contribution grid (same look as the home-screen widget). */
export function Heatmap({ days, frozen = [], goal, width, weeks: wantWeeks }: { days: Record<string, number>; frozen?: string[]; goal: number; width: number; weeks?: number }) {
  const gap = 3;
  const left = 18;
  const weeks = wantWeeks ?? Math.min(53, Math.floor((width - left + gap) / (13 + gap)));
  const cell = Math.floor((width - left - (weeks - 1) * gap) / weeks);
  const top = 16;
  const H = top + 7 * cell + 6 * gap + 2;
  const today = new Date();
  const dow = today.getDay();
  const thisSunday = addDays(today, -dow);
  const first = addDays(thisSunday, -(weeks - 1) * 7);
  const rects: React.ReactNode[] = [];
  const months: React.ReactNode[] = [];
  let lastM = -1;
  let lastX = -100;
  for (let c = 0; c < weeks; c++) {
    const colStart = addDays(first, c * 7);
    const m = addDays(colStart, 6).getMonth();
    const x = left + c * (cell + gap);
    if (m !== lastM) {
      if (x - lastX > 26 && c < weeks - 1) {
        months.push(
          <SvgText key={'m' + c} x={x} y={11} fill={C.textDim} fontSize={10} fontFamily={F.bold}>
            {MONTHS[m]}
          </SvgText>,
        );
        lastX = x;
      }
      lastM = m;
    }
    for (let r = 0; r < 7; r++) {
      const d = addDays(colStart, r);
      if (d > today) continue;
      const k = dateKey(d);
      const xp = days[k] ?? 0;
      const isFrozen = frozen.includes(k);
      const isToday = k === dateKey(today);
      rects.push(
        <Rect
          key={k}
          x={x}
          y={top + r * (cell + gap)}
          width={cell}
          height={cell}
          rx={3}
          fill={isFrozen && xp === 0 ? '#1E4E8C' : LEVELS[levelFor(xp, goal)]}
          stroke={isToday ? (xp > 0 ? '#E6EDF3' : C.fire) : 'none'}
          strokeWidth={isToday ? 1.5 : 0}
        />,
      );
    }
  }
  return (
    <View>
      <Svg width={width} height={H}>
        {months}
        {['', 'S', '', 'Q', '', 'S', ''].map((l, i) =>
          l ? (
            <SvgText key={'d' + i} x={0} y={top + i * (cell + gap) + cell - 2} fill={C.textDim} fontSize={9} fontFamily={F.bold}>
              {l}
            </SvgText>
          ) : null,
        )}
        {rects}
      </Svg>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 6 }}>
        <Text style={{ color: C.textDim, fontSize: 11, fontFamily: F.bold, marginRight: 6 }}>Menos</Text>
        {LEVELS.map((c) => (
          <View key={c} style={{ width: 11, height: 11, borderRadius: 2, backgroundColor: c, marginHorizontal: 1.5 }} />
        ))}
        <Text style={{ color: C.textDim, fontSize: 11, fontFamily: F.bold, marginLeft: 6 }}>Mais</Text>
        <View style={{ width: 11, height: 11, borderRadius: 2, backgroundColor: '#1E4E8C', marginLeft: 12 }} />
        <Text style={{ color: C.textDim, fontSize: 11, fontFamily: F.bold, marginLeft: 4 }}>congelado</Text>
      </View>
    </View>
  );
}
