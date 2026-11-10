import React, { memo } from 'react';
import { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { C } from '../../theme';
import type { Comp, CompState, Pt, Solution } from '../../lib/circuit';
import { Grid, pixel } from './model';

const ledColors = { red: '#FF5A6E', green: '#2BD576', yellow: '#FFC83D', blue: '#4FC3F7', white: '#EEF1FF' };
export function voltageColor(v: number, max: number): string {
  const t = Math.min(1, Math.abs(v) / (max || 1));
  const target = v >= 0 ? [43, 213, 118] : [255, 90, 110];
  return `rgb(${target.map((n, k) => Math.round([107, 116, 153][k] + (n - [107, 116, 153][k]) * t)).join(',')})`;
}
export const nodeColor = (p: Pt, s: Solution, max: number) => voltageColor(s.nodeV[s.nodeAt(p)] ?? 0, max);

const arrow = (x: number, y: number, left = false) => <Path d={left ? `M${x + 5},${y - 3} L${x},${y} L${x + 5},${y + 3}` : `M${x - 5},${y - 3} L${x},${y} L${x - 5},${y + 3}`} />;

/** Symbol geometry has no animation state. Leads and terminals carry node voltages. */
export const Symbol = memo(function Symbol({ c, grid, state, solution, max, selected = false }: {
  c: Comp; grid: Grid; state?: CompState; solution: Solution; max: number; selected?: boolean;
}) {
  const ps = c.pts.map(p => pixel(p, grid));
  const [a, b = a] = ps;
  const color = C.textMuted;
  const pins = ps.map((p, k) => <Circle key={k} cx={p[0]} cy={p[1]} r={2.5} fill={nodeColor(c.pts[k], solution, max)} stroke="none" />);
  if (c.type === 'wire') return <G><Line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={selected ? C.cyan : nodeColor(c.pts[0], solution, max)} strokeWidth={selected ? 4 : 2} />{pins}</G>;
  if (c.type === 'ground' || c.type === 'input' || c.type === 'output') return <G stroke={selected ? C.cyan : color} strokeWidth={2} fill={C.surface}>
    {c.type === 'ground' ? <Path d={`M${a[0]},${a[1]} v10 m-10,0 h20 m-16,5 h12 m-9,5 h6`} /> : <>
      <Rect x={a[0] - 13} y={a[1] - 13} width={26} height={26} rx={c.type === 'output' ? 13 : 4} fill={state?.on ? C.successBg : C.surface2} />
      <SvgText x={a[0]} y={a[1] + 5} textAnchor="middle" stroke="none" fill={state?.on ? C.success : C.textMuted} fontSize={16} fontWeight="bold">{state?.on ? '1' : '0'}</SvgText>
    </>}{pins}</G>;
  if (ps.length > 2 || c.type === 'not') return <MultiSymbol c={c} grid={grid} state={state} selected={selected} solution={solution} max={max} />;
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
  const scale = Math.max(0.35, Math.min(1, length / 48));
  const half = 15 * scale, mid = length / 2;
  const glow = c.type === 'led' ? ledColors[c.color ?? 'red'] : C.gold;
  const brightness = c.type === 'lamp' ? Math.min(1, Math.abs(state?.p ?? 0) / (c.rated ?? 36 / (c.value ?? 60))) : 1;
  let body: React.ReactNode;
  switch (c.type) {
    case 'resistor': body = <Path d="M-15,0 l3,-7 5,14 5,-14 5,14 5,-14 4,7" />; break;
    case 'capacitor': body = <Path d="M-15,0 H-4 M-4,-13 V13 M4,-13 V13 M4,0 H15" />; break;
    case 'inductor': body = <Path d="M-15,0 c0,-14 7,-14 7,0 c0,-14 7,-14 7,0 c0,-14 7,-14 7,0 c0,-14 7,-14 7,0 H15" />; break;
    case 'vsrc': body = <><Path d="M-15,0 H-4 M-4,-14 V14 M4,-8 V8 M4,0 H15" /><SvgText x={-10} y={-18} fill={C.textMuted} stroke="none" fontSize={10}>+</SvgText></>; break;
    case 'acsrc': case 'clock': case 'isrc': case 'voltmeter': case 'ammeter':
      body = <><Circle r={15} />{c.type === 'acsrc' ? <Path d="M-10,0 Q-5,-13 0,0 T10,0" />
        : c.type === 'clock' ? <Path d="M-10,6 v-12 h10 v12 h10 v-12" />
        : c.type === 'isrc' ? <><Path d="M9,0 H-9" />{arrow(-9, 0, true)}</>
        : <SvgText x={0} y={6} stroke="none" fill={color} fontSize={17} textAnchor="middle">{c.type === 'voltmeter' ? 'V' : 'A'}</SvgText>}</>; break;
    case 'switch': body = <><Path d={`M-15,0 H-10 M10,0 H15 M-10,0 L10,${c.on ? 0 : -13}`} /><Circle cx={-10} r={2} /><Circle cx={10} r={2} /></>; break;
    case 'lamp': body = <><Circle r={15} fill={state?.on ? glow : C.surface} fillOpacity={state?.on ? 0.15 + 0.6 * brightness : 1} /><Path d="M-10,-10 L10,10 M-10,10 L10,-10" /></>; break;
    case 'diode': case 'led': case 'zener': body = <>
      <Path d="M-15,0 H-9 M8,0 H15" /><Polygon points="-9,-10 -9,10 8,0" fill={state?.burnt ? C.textDim : c.type === 'led' && state?.on ? glow : C.surface2} />
      <Path d={c.type === 'zener' ? 'M4,-14 H8 V10 H12' : 'M8,-11 V11'} />
      {c.type === 'led' && <G stroke={glow}><Path d="M-3,-15 l7,-7 M5,-13 l7,-7 M0,-22 h4 v4 M8,-20 h4 v4" /></G>}
    </>; break;
    default: body = null;
  }
  return <G>
    {selected && <Circle cx={(a[0] + b[0]) / 2} cy={(a[1] + b[1]) / 2} r={23} fill={C.cyan} opacity={0.1} />}
    <G transform={`translate(${a[0]} ${a[1]}) rotate(${angle})`} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <Line x1={0} y1={0} x2={mid - half} y2={0} stroke={nodeColor(c.pts[0], solution, max)} />
      <Line x1={mid + half} y1={0} x2={length} y2={0} stroke={nodeColor(c.pts[1], solution, max)} />
      <G transform={`translate(${mid} 0) scale(${scale})`} stroke={selected ? C.cyan : state?.burnt ? C.textDim : color} strokeWidth={2 / scale} fill={C.surface}>
        {state?.on && (c.type === 'led' || c.type === 'lamp') && <><Circle r={25} fill={glow} opacity={0.08 * brightness} stroke="none" /><Circle r={19} fill={glow} opacity={0.15 * brightness} stroke="none" /></>}
        {body}
      </G>
    </G>{pins}
    {state?.burnt && <SvgText x={(a[0] + b[0]) / 2 + 9} y={(a[1] + b[1]) / 2 - 14} fontSize={15}>💥</SvgText>}
  </G>;
});

function MultiSymbol({ c, grid, state, selected, solution, max }: {
  c: Comp; grid: Grid; state?: CompState; selected: boolean; solution: Solution; max: number;
}) {
  const ps = c.pts.map(p => pixel(p, grid)), [ax, ay] = ps[0], s = grid.cell;
  const stroke = selected ? C.cyan : C.textMuted;
  const transistor = ['npn', 'pnp', 'nmos'].includes(c.type);
  const isNot = c.type === 'not';
  const h = isNot ? s * 1.25 : Math.max(2 * s, ...ps.slice(0, -1).map(p => p[1] - ay));
  const top = isNot ? -h / 2 : -s * 0.45;
  const bottom = isNot ? h / 2 : h + s * 0.45;
  const right = 2.45 * s;
  let shape: React.ReactNode;
  if (transistor) {
    shape = <G transform={`translate(${ax} ${ay})`}>
      <Path d={`M0,0 H${s * 0.4} M${s * 0.4},${-s * 0.45} V${s * 0.45}`} />
      <Path d={`M${s * 0.5},${-s * 0.25} L${s},${-s * 0.65} V${-s} M${s * 0.5},${s * 0.25} L${s},${s * 0.65} V${s}`} />
      {c.type === 'nmos' ? <>
        <Path d={`M${s * 0.52},${-s * 0.48} V${s * 0.48} M${s * 0.52},0 H${s * 0.9} M${s * 0.52},${-s * 0.48} H${s} M${s * 0.52},${s * 0.48} H${s}`} />
        <Path d={`M${s * 0.75},${-s * 0.1} L${s * 0.6},0 L${s * 0.75},${s * 0.1}`} />
      </> : <Path d={c.type === 'npn' ? `M${s * 0.73},${s * 0.32} l${s * 0.23},${s * 0.29} l${-s * 0.3},${-s * 0.05}` : `M${s * 0.88},${s * 0.59} l${-s * 0.27},${-s * 0.21} l${s * 0.3},${-s * 0.01}`} />}
    </G>;
  } else {
    const outStart = c.type === 'dff' ? 2.5 * s : right;
    shape = <G transform={`translate(${ax} ${ay})`}>
      {ps.map((p, k) => {
        const output = c.type === 'dff' ? k >= 2 : k === ps.length - 1;
        return <Line key={k} x1={p[0] - ax} y1={p[1] - ay} x2={output ? outStart : s * 0.6} y2={p[1] - ay} stroke={nodeColor(c.pts[k], solution, max)} />;
      })}
      {c.type === 'opamp' || isNot ? <Polygon points={`${s * 0.6},${top} ${s * 0.6},${bottom} ${right},${isNot ? 0 : s}`} />
        : c.type === 'dff' ? <Rect x={s * 0.6} y={top} width={s * 1.9} height={bottom - top} rx={3} />
        : c.type === 'and' || c.type === 'nand' ? <Path d={`M${s * 0.6},${top} H${s * 1.2} C${s * 2.9},${top} ${s * 2.9},${bottom} ${s * 1.2},${bottom} H${s * 0.6} Z`} />
        : <><Path d={`M${s * 0.5},${top} Q${s * 1.7},${top} ${right},${s} Q${s * 1.7},${bottom} ${s * 0.5},${bottom} Q${s * 1.2},${s} ${s * 0.5},${top} Z`} />
          {(c.type === 'xor' || c.type === 'xnor') && <Path d={`M${s * 0.3},${top} Q${s},${s} ${s * 0.3},${bottom}`} fill="none" />}</>}
      {['nand', 'nor', 'not', 'xnor'].includes(c.type) && <Circle cx={right + 3} cy={isNot ? 0 : s} r={3.5} />}
      {(c.type === 'opamp' || c.type === 'dff') && <G stroke="none" fill={C.text} fontSize={Math.min(14, s * 0.4)}>
        <SvgText x={s * 0.76} y={4}>{c.type === 'opamp' ? '−' : 'D'}</SvgText>
        <SvgText x={s * 0.76} y={2 * s + 4}>{c.type === 'opamp' ? '+' : '▷'}</SvgText>
        {c.type === 'dff' && <><SvgText x={s * 1.9} y={4}>Q</SvgText><SvgText x={s * 1.9} y={2 * s + 4}>Q̅</SvgText></>}
      </G>}
    </G>;
  }
  return <G stroke={stroke} strokeWidth={2} fill={state?.on ? C.successBg : C.surface2} strokeLinejoin="round" strokeLinecap="round">
    {shape}{ps.map((p, k) => <Circle key={k} cx={p[0]} cy={p[1]} r={2.5} stroke="none" fill={nodeColor(c.pts[k], solution, max)} />)}
  </G>;
}
