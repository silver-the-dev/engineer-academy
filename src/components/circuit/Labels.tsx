import React, { memo } from 'react';
import { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import type { Comp, Solution } from '../../lib/circuit';
import { C, F } from '../../theme';
import { engineering, Grid, measurable, names, partValue, pixel } from './model';

type Box = { x: number; y: number; w: number; h: number };
type Label = Box & { id: string; text: string; cx: number; cy: number };
const overlaps = (a: Box, b: Box) => a.x < b.x + b.w + 3 && a.x + a.w + 3 > b.x && a.y < b.y + b.h + 3 && a.y + a.h + 3 > b.y;
/** Conservative bounds of the visible symbol (including LED arrows and pin text). */
export function symbolBox(c: Comp, grid: Grid): Box {
  const ps = c.pts.map(p => pixel(p, grid));
  const [ax, ay] = ps[0], xs = ps.map(p => p[0]), ys = ps.map(p => p[1]);
  if (c.type === 'ground') return { x: ax - 12, y: ay - 2, w: 24, h: 24 };
  if (c.type === 'input' || c.type === 'output') return { x: ax - 15, y: ay - 15, w: 30, h: 30 };
  if (ps.length <= 2 && c.type !== 'not') {
    const cx = (ax + ps[1][0]) / 2, cy = (ay + ps[1][1]) / 2;
    const r = 25 * Math.max(0.35, Math.min(1, Math.hypot(ps[1][0] - ax, ps[1][1] - ay) / 48));
    return { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r };
  }
  const margin = ['npn', 'pnp', 'nmos'].includes(c.type) ? 5 : grid.cell * 0.65;
  return { x: Math.min(...xs) - 5, y: Math.min(...ys) - margin, w: Math.max(...xs) - Math.min(...xs) + 10, h: Math.max(...ys) - Math.min(...ys) + 2 * margin };
}
// Clip each wire/lead against a padded label rectangle, including diagonal wires.
function crosses(box: Box, a: number[], b: number[]) {
  let lo = 0, hi = 1;
  for (let k = 0; k < 2; k++) {
    const min = (k ? box.y : box.x) - 3, max = min + (k ? box.h : box.w) + 6, d = b[k] - a[k];
    if (Math.abs(d) < 1e-9) { if (a[k] < min || a[k] > max) return false; }
    else { const u = (min - a[k]) / d, v = (max - a[k]) / d; lo = Math.max(lo, Math.min(u, v)); hi = Math.min(hi, Math.max(u, v)); }
  }
  return lo <= hi;
}
export function labelsFor(comps: Comp[], solution: Solution, grid: Grid) {
  const width = grid.cols * grid.cell, height = grid.rows * grid.cell;
  const bodies = comps.filter(c => c.type !== 'wire').map(c => symbolBox(c, grid));
  const leads = comps.filter(c => c.pts.length === 2 && c.type !== 'not').map(c => c.pts.map(p => pixel(p, grid)));
  const labels: Label[] = [], overflow: { id: string; text: string }[] = [];
  for (const c of comps.filter(measurable)) {
    const state = solution.comp[c.id], name = c.label ?? c.id;
    const full = [name, partValue(c), ...(c.show ?? []).map(k => engineering(state?.[k] ?? 0, { v: 'V', i: 'A', p: 'W' }[k]))].filter(Boolean).join(' · ');
    const body = symbolBox(c, grid), cx = body.x + body.w / 2, cy = body.y + body.h / 2;
    let placed = false;
    // Try all sides with the complete text first; a crowded part keeps just its name.
    for (const text of [...new Set([full, name])]) {
      // Nunito Bold at 11 px: leave room for wide glyphs and accents as well.
      const w = Math.max(26, [...text].reduce((sum, ch) => sum + (/[MWΩ@%]/.test(ch) ? 10 : /[il1 ·.,]/.test(ch) ? 4 : 7), 12)), h = 20;
      const candidates = [0, -8, 8, -16, 16, -24, 24].flatMap(offset => [
        [cx - w / 2 + offset, body.y - h - 6], [cx - w / 2 + offset, body.y + body.h + 6],
        [body.x + body.w + 6, cy - h / 2 + offset], [body.x - w - 6, cy - h / 2 + offset],
      ]);
      const place = candidates.map(([x, y]) => ({ x, y, w, h })).find(box =>
        box.x >= 4 && box.y >= 4 && box.x + w <= width - 4 && box.y + h <= height - 4 &&
        !bodies.some(b => overlaps(box, b)) && !labels.some(b => overlaps(box, b)) && !leads.some(([a, b]) => crosses(box, a, b)));
      if (place) { labels.push({ ...place, id: c.id, text, cx, cy }); placed = true; break; }
    }
    if (!placed) overflow.push({ id: c.id, text: `${names[c.type]} ${name}` });
  }
  return { labels, overflow };
}
export const Labels = memo(function Labels({ labels }: { labels: Label[] }) {
  return <G>{labels.map(l => <G key={l.id}>
    {Math.hypot(l.x + l.w / 2 - l.cx, l.y + l.h / 2 - l.cy) > 50 && <Line x1={l.cx} y1={l.cy} x2={l.x + l.w / 2} y2={l.y + l.h / 2} stroke={C.border} strokeDasharray="2 3" />}
    <Rect x={l.x} y={l.y} width={l.w} height={l.h} rx={4} fill={C.surface} opacity={0.97} />
    <SvgText fontFamily={F.bold} x={l.x + l.w / 2} y={l.y + 13} fontSize={11} fill={C.text} textAnchor="middle">{l.text}</SvgText>
  </G>)}</G>;
});
