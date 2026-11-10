import React, { memo } from 'react';
import { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import type { Comp, Solution } from '../../lib/circuit';
import { C } from '../../theme';
import { engineering, Grid, names, partValue, pixel } from './model';

type Box = { x: number; y: number; w: number; h: number };
type Label = Box & { id: string; text: string; cx: number; cy: number };
const overlaps = (a: Box, b: Box) => a.x < b.x + b.w + 3 && a.x + a.w + 3 > b.x && a.y < b.y + b.h + 3 && a.y + a.h + 3 > b.y;
export function labelsFor(comps: Comp[], solution: Solution, grid: Grid) {
  const width = grid.cols * grid.cell, height = grid.rows * grid.cell;
  const bodies: Box[] = comps.filter(c => c.type !== 'wire').map(c => {
    const ps = c.pts.map(p => pixel(p, grid));
    const cx = ps.reduce((s, p) => s + p[0], 0) / ps.length, cy = ps.reduce((s, p) => s + p[1], 0) / ps.length;
    if (ps.length <= 2 && c.type !== 'not') return { x: cx - 22, y: cy - 22, w: 44, h: 44 };
    const xs = ps.map(p => p[0]), ys = ps.map(p => p[1]);
    const margin = Math.max(18, grid.cell * 0.65);
    return { x: Math.min(...xs) - 5, y: Math.min(...ys) - margin, w: Math.max(...xs) - Math.min(...xs) + 10, h: Math.max(...ys) - Math.min(...ys) + 2 * margin };
  });
  const labels: Label[] = [], overflow: { id: string; text: string }[] = [];
  for (const c of comps) {
    if (c.type === 'wire' && !c.label && !c.show?.length) continue;
    const state = solution.comp[c.id];
    const text = [c.label ?? (c.type === 'wire' ? c.id : c.id), partValue(c), ...(c.show ?? []).map(k => engineering(state?.[k] ?? 0, { v: 'V', i: 'A', p: 'W' }[k]))].filter(Boolean).join(' · ');
    const ps = c.pts.map(p => pixel(p, grid));
    const cx = ps.reduce((s, p) => s + p[0], 0) / ps.length, cy = ps.reduce((s, p) => s + p[1], 0) / ps.length;
    const w = Math.max(36, text.length * 6.2 + 10), h = 18;
    if (w > width - 12) { overflow.push({ id: c.id, text: `${names[c.type]} ${text}` }); continue; }
    const candidates = [[cx - w / 2, cy - 44], [cx - w / 2, cy + 26], [cx + 26, cy - 8], [cx - w - 26, cy - 8]];
    for (let radius = 55; radius <= 145; radius += 30) for (let n = 0; n < 8; n++) {
      const angle = n * Math.PI / 4;
      candidates.push([cx + Math.cos(angle) * radius - w / 2, cy + Math.sin(angle) * radius - h / 2]);
    }
    const place = candidates.map(([x, y]) => ({ x: Math.max(4, Math.min(width - w - 4, x)), y: Math.max(4, Math.min(height - h - 4, y)), w, h }))
      .find(box => !bodies.some(b => overlaps(box, b)) && !labels.some(b => overlaps(box, b)));
    if (place) labels.push({ ...place, id: c.id, text, cx, cy });
    else overflow.push({ id: c.id, text: `${names[c.type]} ${text}` });
  }
  return { labels, overflow };
}
export const Labels = memo(function Labels({ labels }: { labels: Label[] }) {
  return <G>{labels.map(l => <G key={l.id}>
    {Math.hypot(l.x + l.w / 2 - l.cx, l.y + l.h / 2 - l.cy) > 50 && <Line x1={l.cx} y1={l.cy} x2={l.x + l.w / 2} y2={l.y + l.h / 2} stroke={C.border} strokeDasharray="2 3" />}
    <Rect x={l.x} y={l.y} width={l.w} height={l.h} rx={4} fill={C.surface} opacity={0.97} />
    <SvgText x={l.x + l.w / 2} y={l.y + 13} fontSize={11} fill={C.text} textAnchor="middle">{l.text}</SvgText>
  </G>)}</G>;
});
