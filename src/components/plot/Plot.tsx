import React, { createContext, useContext, useMemo, useRef } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { C, F, alpha } from '../../theme';
import { useScrollLock } from '../ScrollLock';

export type View2D = { xMin: number; xMax: number; yMin: number; yMax: number };

type Ctx = {
  sx: (x: number) => number;
  sy: (y: number) => number;
  ix: (px: number) => number;
  iy: (py: number) => number;
  w: number;
  h: number;
  v: View2D;
  bg: string;
  /** boxes taken by labels in the current render; tick numbers under them are skipped */
  reg: { current: Box[] };
};
type Box = { x0: number; y0: number; x1: number; y1: number };
const PlotCtx = createContext<Ctx | null>(null);
export const usePlot = () => {
  const c = useContext(PlotCtx);
  if (!c) throw new Error('usePlot outside Plot');
  return c;
};

export type Draggable = { id: string; x: number; y: number; color?: string; r?: number; label?: string; hidden?: boolean };

type PlotProps = View2D & {
  width: number;
  height: number;
  grid?: boolean;
  axes?: boolean;
  xStep?: number;
  yStep?: number;
  tickLabels?: boolean;
  equalAspect?: boolean; // keep 1:1 by expanding the x- or y-range (the whole view stays visible)
  draggables?: Draggable[];
  onDrag?: (id: string, x: number, y: number) => void;
  onDragEnd?: (id: string) => void;
  onTap?: (x: number, y: number) => void;
  children?: React.ReactNode;
  background?: string;
};

function niceStep(range: number, target = 8) {
  const raw = range / target;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  const nice = m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10;
  return nice * p;
}

function fmtTick(v: number) {
  const r = Math.round(v * 1000) / 1000;
  return (Math.abs(r) < 1e-9 ? 0 : r).toString().replace('.', ',');
}

/* ---------- label placement shared by 2D and 3D widgets ---------- */

/** Rough rendered width of an SVG label (bold UI font). */
export function textWidth(text: string, size: number) {
  let w = 0;
  for (const ch of text) w += /[1il.,:;'!|ı]/.test(ch) ? 0.32 : /[\s()[\]]/.test(ch) ? 0.36 : /[mwMW—]/.test(ch) ? 0.9 : /[A-ZÁ-Ú0-9]/.test(ch) ? 0.66 : 0.58;
  return w * size;
}

/** Moves a label so that it is fully inside a w×h box (keeps its anchor). */
export function fitLabel(x: number, y: number, text: string, size: number, anchor: 'start' | 'middle' | 'end', w: number, h: number, pad = 3) {
  const tw = textWidth(text, size);
  let left = anchor === 'start' ? x : anchor === 'middle' ? x - tw / 2 : x - tw;
  left = Math.max(pad, Math.min(w - pad - tw, left));
  const nx = anchor === 'start' ? left : anchor === 'middle' ? left + tw / 2 : left + tw;
  // y is the baseline: keep ascenders and descenders inside
  const ny = Math.max(pad + size * 0.78, Math.min(h - pad - size * 0.24, y));
  return { x: nx, y: ny, box: { x0: left - 2, y0: ny - size * 0.8, x1: left + tw + 2, y1: ny + size * 0.25 } };
}

/**
 * SVG text that always stays inside the widget and has a thin outline in the
 * background colour, so it stays readable over grid lines, curves and tick numbers.
 */
export function HaloText({ x, y, text, color, size = 13, anchor = 'start', font = F.heavy, w, h, bg, reg }: { x: number; y: number; text: string; color: string; size?: number; anchor?: 'start' | 'middle' | 'end'; font?: string; w: number; h: number; bg: string; reg?: { current: Box[] } }) {
  const p = fitLabel(x, y, text, size, anchor, w, h);
  reg?.current.push(p.box);
  return (
    <G>
      <SvgText x={p.x} y={p.y} fill={bg} stroke={bg} strokeWidth={3.5} strokeLinejoin="round" fontSize={size} fontFamily={font} textAnchor={anchor}>
        {text}
      </SvgText>
      <SvgText x={p.x} y={p.y} fill={color} fontSize={size} fontFamily={font} textAnchor={anchor}>
        {text}
      </SvgText>
    </G>
  );
}

export function Plot(props: PlotProps) {
  const { width: w, height: h, grid = true, axes = true, tickLabels = true, draggables, onDrag, onDragEnd, onTap, background } = props;
  let { xMin, xMax, yMin, yMax } = props;
  if (props.equalAspect) {
    // 1:1 scale that still shows the whole requested view: on a short, wide plot the x-range grows
    // (it used to always crop the y-range, cutting the top of polygons and circles)
    const s = Math.min(w / (xMax - xMin), h / (yMax - yMin));
    const xSpan = w / s;
    const ySpan = h / s;
    const cx = (xMin + xMax) / 2;
    const cy = (yMin + yMax) / 2;
    xMin = cx - xSpan / 2;
    xMax = cx + xSpan / 2;
    yMin = cy - ySpan / 2;
    yMax = cy + ySpan / 2;
  }
  const reg = useRef<Box[]>([]);
  reg.current = [];
  const ctx = useMemo<Ctx>(() => {
    const sx = (x: number) => ((x - xMin) / (xMax - xMin)) * w;
    const sy = (y: number) => h - ((y - yMin) / (yMax - yMin)) * h;
    const ix = (px: number) => xMin + (px / w) * (xMax - xMin);
    const iy = (py: number) => yMin + ((h - py) / h) * (yMax - yMin);
    return { sx, sy, ix, iy, w, h, v: { xMin, xMax, yMin, yMax }, bg: background ?? C.bgDeep, reg };
  }, [xMin, xMax, yMin, yMax, w, h, background]);

  const lock = useScrollLock();
  const viewRef = useRef<any>(null);
  const origin = useRef({ x: 0, y: 0 });
  const active = useRef<string | null>(null);
  const moved = useRef(false);
  const latest = useRef({ draggables, onDrag, onDragEnd, onTap, ctx });
  latest.current = { draggables, onDrag, onDragEnd, onTap, ctx };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !!(latest.current.draggables?.length || latest.current.onTap),
        onMoveShouldSetPanResponder: () => !!latest.current.draggables?.length,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          moved.current = false;
          const { pageX, pageY, locationX, locationY } = e.nativeEvent;
          origin.current = { x: pageX - locationX, y: pageY - locationY };
          const { draggables: ds, ctx: c } = latest.current;
          active.current = null;
          if (ds && ds.length) {
            let best = 1e9;
            for (const d of ds) {
              if (d.hidden) continue;
              const dx = c.sx(d.x) - locationX;
              const dy = c.sy(d.y) - locationY;
              const dist = Math.hypot(dx, dy);
              if (dist < best) {
                best = dist;
                active.current = d.id;
              }
            }
            if (best > 48) active.current = null;
            if (active.current) lock(true);
          }
        },
        onPanResponderMove: (e) => {
          moved.current = true;
          const id = active.current;
          if (!id) return;
          const { pageX, pageY } = e.nativeEvent;
          const c = latest.current.ctx;
          const px = Math.max(0, Math.min(c.w, pageX - origin.current.x));
          const py = Math.max(0, Math.min(c.h, pageY - origin.current.y));
          latest.current.onDrag?.(id, c.ix(px), c.iy(py));
        },
        onPanResponderRelease: (e) => {
          const id = active.current;
          if (id) latest.current.onDragEnd?.(id);
          if (!moved.current && latest.current.onTap) {
            const c = latest.current.ctx;
            const { locationX, locationY } = e.nativeEvent;
            latest.current.onTap(c.ix(locationX), c.iy(locationY));
          }
          active.current = null;
          lock(false);
        },
        onPanResponderTerminate: () => {
          active.current = null;
          lock(false);
        },
      }),
    [lock],
  );

  const xs = props.xStep ?? niceStep(xMax - xMin);
  const ys = props.yStep ?? niceStep(yMax - yMin, Math.max(4, Math.round((8 * h) / w)));
  const gridLines: React.ReactNode[] = [];
  const ticks: TickSpec[] = [];
  if (grid || tickLabels) {
    for (let x = Math.ceil(xMin / xs) * xs; x <= xMax + 1e-9; x += xs) {
      const X = ctx.sx(x);
      if (grid) gridLines.push(<Line key={'gx' + x} x1={X} y1={0} x2={X} y2={h} stroke={C.plotGrid} strokeWidth={1} />);
      const half = textWidth(fmtTick(x), 10) / 2;
      // a number cut by the edge reads as a different number ("-1" → "1"): drop it instead
      if (tickLabels && Math.abs(x) > 1e-9 && X - half >= 2 && X + half <= w - 2) {
        const y0 = Math.min(h - 4, Math.max(12, ctx.sy(0) + 14));
        ticks.push({ key: 'lx' + x, x: X, y: y0, text: fmtTick(x), anchor: 'middle', box: { x0: X - half, y0: y0 - 8, x1: X + half, y1: y0 + 2 } });
      }
    }
    for (let y = Math.ceil(yMin / ys) * ys; y <= yMax + 1e-9; y += ys) {
      const Y = ctx.sy(y);
      if (grid) gridLines.push(<Line key={'gy' + y} x1={0} y1={Y} x2={w} y2={Y} stroke={C.plotGrid} strokeWidth={1} />);
      if (tickLabels && Math.abs(y) > 1e-9 && Y - 5 >= 2 && Y + 5 <= h - 2) {
        const tw = textWidth(fmtTick(y), 10);
        const x0 = Math.min(w - 4 - tw, Math.max(4, ctx.sx(0) + 5));
        ticks.push({ key: 'ly' + y, x: x0, y: Y + 3.5, text: fmtTick(y), anchor: 'start', box: { x0, y0: Y - 4.5, x1: x0 + tw, y1: Y + 5.5 } });
      }
    }
  }
  for (const d of draggables ?? []) {
    if (d.hidden) continue;
    const X = ctx.sx(d.x);
    const Y = ctx.sy(d.y);
    const r = (d.r ?? 9) + 4;
    reg.current.push({ x0: X - r, y0: Y - r, x1: X + r, y1: Y + r });
    if (d.label) reg.current.push(fitLabel(X + 14, Y - 12, d.label, 13, 'start', w, h).box);
  }
  return (
    <PlotCtx.Provider value={ctx}>
      <View
        ref={viewRef}
        style={{ width: w, height: h, borderRadius: 16, overflow: 'hidden', backgroundColor: background ?? C.bgDeep }}
        {...pan.panHandlers}
      >
        <Svg width={w} height={h}>
          {gridLines}
          {axes && (
            <G>
              {yMin < 0 && yMax > 0 && <Line x1={0} y1={ctx.sy(0)} x2={w} y2={ctx.sy(0)} stroke={C.plotAxis} strokeWidth={1.5} />}
              {xMin < 0 && xMax > 0 && <Line x1={ctx.sx(0)} y1={0} x2={ctx.sx(0)} y2={h} stroke={C.plotAxis} strokeWidth={1.5} />}
            </G>
          )}
          {props.children}
          <TickLayer ticks={ticks} reg={reg} />
          {draggables?.map((d) =>
            d.hidden ? null : (
              <G key={d.id}>
                <Circle cx={ctx.sx(d.x)} cy={ctx.sy(d.y)} r={(d.r ?? 9) + 8} fill={alpha(d.color ?? C.gold, 0.22)} />
                <Circle cx={ctx.sx(d.x)} cy={ctx.sy(d.y)} r={d.r ?? 9} fill={d.color ?? C.gold} stroke={C.white} strokeWidth={2} />
                {d.label ? <HaloText x={ctx.sx(d.x) + 14} y={ctx.sy(d.y) - 12} text={d.label} color={d.color ?? C.gold} w={w} h={h} bg={ctx.bg} /> : null}
              </G>
            ),
          )}
        </Svg>
      </View>
    </PlotCtx.Provider>
  );
}

type TickSpec = { key: string; x: number; y: number; text: string; anchor: 'start' | 'middle'; box: Box };

/** Axis numbers. Rendered after the plot's children so it can skip numbers hidden under their labels. */
function TickLayer({ ticks, reg }: { ticks: TickSpec[]; reg: { current: Box[] } }) {
  const hit = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  return (
    <G>
      {ticks
        .filter((t) => !reg.current.some((b) => hit(t.box, b)))
        .map((t) => (
          <SvgText key={t.key} x={t.x} y={t.y} fill={C.textDim} fontSize={10} textAnchor={t.anchor} fontFamily={F.semibold}>
            {t.text}
          </SvgText>
        ))}
    </G>
  );
}

/* ---------- primitives (must be rendered inside <Plot>) ---------- */

export function FnCurve({ f, color = C.p1, width = 3, dash, from, to, samples = 220, opacity = 1 }: { f: (x: number) => number; color?: string; width?: number; dash?: string; from?: number; to?: number; samples?: number; opacity?: number }) {
  const { sx, sy, v, h } = usePlot();
  const a = from ?? v.xMin;
  const b = to ?? v.xMax;
  const d = useMemo(() => {
    let path = '';
    let pen = false;
    let prevY: number | null = null;
    const span = v.yMax - v.yMin;
    for (let i = 0; i <= samples; i++) {
      const x = a + ((b - a) * i) / samples;
      let y: number;
      try {
        y = f(x);
      } catch {
        y = NaN;
      }
      if (!isFinite(y) || Math.abs(y - (v.yMin + v.yMax) / 2) > span * 8 || (prevY !== null && Math.abs(y - prevY) > span * 1.5)) {
        pen = false;
        prevY = isFinite(y) ? y : null;
        continue;
      }
      const X = sx(x);
      const Y = Math.max(-h * 4, Math.min(h * 5, sy(y)));
      path += (pen ? 'L' : 'M') + X.toFixed(1) + ' ' + Y.toFixed(1);
      pen = true;
      prevY = y;
    }
    return path;
  }, [f, a, b, samples, sx, sy, v, h]);
  return <Path d={d} stroke={color} strokeWidth={width} fill="none" strokeDasharray={dash} strokeLinejoin="round" strokeLinecap="round" opacity={opacity} />;
}

export function ParamCurve({ fx, fy, t0, t1, color = C.p1, width = 3, samples = 200, dash }: { fx: (t: number) => number; fy: (t: number) => number; t0: number; t1: number; color?: string; width?: number; samples?: number; dash?: string }) {
  const { sx, sy } = usePlot();
  let d = '';
  for (let i = 0; i <= samples; i++) {
    const t = t0 + ((t1 - t0) * i) / samples;
    d += (i ? 'L' : 'M') + sx(fx(t)).toFixed(1) + ' ' + sy(fy(t)).toFixed(1);
  }
  return <Path d={d} stroke={color} strokeWidth={width} fill="none" strokeDasharray={dash} />;
}

export function AreaUnder({ f, a, b, color = C.p1, opacity = 0.3, g }: { f: (x: number) => number; a: number; b: number; color?: string; opacity?: number; g?: (x: number) => number }) {
  const { sx, sy } = usePlot();
  const n = 120;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  let d = `M${sx(lo)} ${sy(g ? g(lo) : 0)}`;
  for (let i = 0; i <= n; i++) {
    const x = lo + ((hi - lo) * i) / n;
    d += `L${sx(x).toFixed(1)} ${sy(f(x)).toFixed(1)}`;
  }
  if (g) {
    for (let i = n; i >= 0; i--) {
      const x = lo + ((hi - lo) * i) / n;
      d += `L${sx(x).toFixed(1)} ${sy(g(x)).toFixed(1)}`;
    }
  } else d += `L${sx(hi)} ${sy(0)}`;
  d += 'Z';
  return <Path d={d} fill={color} opacity={opacity} />;
}

export function Pt({ x, y, color = C.gold, r = 6, label, labelColor, hollow, dx = 10, dy = -10 }: { x: number; y: number; color?: string; r?: number; label?: string; labelColor?: string; hollow?: boolean; dx?: number; dy?: number }) {
  const { sx, sy, w, h, bg, reg } = usePlot();
  return (
    <G>
      <Circle cx={sx(x)} cy={sy(y)} r={r} fill={hollow ? bg : color} stroke={color} strokeWidth={hollow ? 2.5 : 1.5} />
      {label ? <HaloText x={sx(x) + dx} y={sy(y) + dy} text={label} color={labelColor ?? color} w={w} h={h} bg={bg} reg={reg} /> : null}
    </G>
  );
}

export function Seg({ x1, y1, x2, y2, color = C.textMuted, width = 2, dash }: { x1: number; y1: number; x2: number; y2: number; color?: string; width?: number; dash?: string }) {
  const { sx, sy } = usePlot();
  return <Line x1={sx(x1)} y1={sy(y1)} x2={sx(x2)} y2={sy(y2)} stroke={color} strokeWidth={width} strokeDasharray={dash} strokeLinecap="round" />;
}

/** Infinite line through (x1,y1) and (x2,y2) clipped to view. */
export function InfLine({ x1, y1, x2, y2, color = C.p2, width = 2.5, dash }: { x1: number; y1: number; x2: number; y2: number; color?: string; width?: number; dash?: string }) {
  const { v } = usePlot();
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (Math.abs(dx) < 1e-12) return <Seg x1={x1} y1={v.yMin} x2={x1} y2={v.yMax} color={color} width={width} dash={dash} />;
  const m = dy / dx;
  const span = (v.xMax - v.xMin) * 2;
  return <Seg x1={v.xMin - span} y1={y1 + m * (v.xMin - span - x1)} x2={v.xMax + span} y2={y1 + m * (v.xMax + span - x1)} color={color} width={width} dash={dash} />;
}

export function Arrow({ x1, y1, x2, y2, color = C.p1, width = 3.5, label, head = 12 }: { x1: number; y1: number; x2: number; y2: number; color?: string; width?: number; label?: string; head?: number }) {
  const { sx, sy, w, h, bg, reg } = usePlot();
  const X1 = sx(x1);
  const Y1 = sy(y1);
  const X2 = sx(x2);
  const Y2 = sy(y2);
  const ang = Math.atan2(Y2 - Y1, X2 - X1);
  const len = Math.hypot(X2 - X1, Y2 - Y1);
  const hl = Math.min(head, len * 0.45);
  const bx = X2 - hl * Math.cos(ang);
  const by = Y2 - hl * Math.sin(ang);
  const p1 = `${X2},${Y2}`;
  const p2 = `${bx + (hl * 0.55) * Math.sin(ang)},${by - (hl * 0.55) * Math.cos(ang)}`;
  const p3 = `${bx - (hl * 0.55) * Math.sin(ang)},${by + (hl * 0.55) * Math.cos(ang)}`;
  return (
    <G>
      <Line x1={X1} y1={Y1} x2={bx} y2={by} stroke={color} strokeWidth={width} strokeLinecap="round" />
      {len > 2 && <Polygon points={`${p1} ${p2} ${p3}`} fill={color} />}
      {label ? <HaloText x={(X1 + X2) / 2 + 10 * Math.sin(ang)} y={(Y1 + Y2) / 2 - 10 * Math.cos(ang)} text={label} color={color} size={15} font={F.black} anchor="middle" w={w} h={h} bg={bg} reg={reg} /> : null}
    </G>
  );
}

export function Label({ x, y, text, color = C.text, size = 13, anchor = 'start', dx = 0, dy = 0, weight = 'heavy' }: { x: number; y: number; text: string; color?: string; size?: number; anchor?: 'start' | 'middle' | 'end'; dx?: number; dy?: number; weight?: 'heavy' | 'semibold' }) {
  const { sx, sy, w, h, bg, reg } = usePlot();
  return <HaloText x={sx(x) + dx} y={sy(y) + dy} text={text} color={color} size={size} anchor={anchor} font={weight === 'heavy' ? F.heavy : F.semibold} w={w} h={h} bg={bg} reg={reg} />;
}

export function RectW({ x, y, w, h, color = C.p1, opacity = 0.35, stroke }: { x: number; y: number; w: number; h: number; color?: string; opacity?: number; stroke?: string }) {
  const { sx, sy } = usePlot();
  const X = Math.min(sx(x), sx(x + w));
  const Y = Math.min(sy(y), sy(y + h));
  return <Rect x={X} y={Y} width={Math.abs(sx(x + w) - sx(x))} height={Math.abs(sy(y + h) - sy(y))} fill={color} fillOpacity={opacity} stroke={stroke ?? color} strokeWidth={1.2} />;
}

export function PolygonW({ pts, color = C.p1, opacity = 0.3, stroke, strokeWidth = 2 }: { pts: [number, number][]; color?: string; opacity?: number; stroke?: string; strokeWidth?: number }) {
  const { sx, sy } = usePlot();
  return <Polygon points={pts.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ')} fill={color} fillOpacity={opacity} stroke={stroke ?? color} strokeWidth={strokeWidth} />;
}

export function PolylineW({ pts, color = C.p2, width = 2.5, dash }: { pts: [number, number][]; color?: string; width?: number; dash?: string }) {
  const { sx, sy } = usePlot();
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`).join('');
  return <Path d={d} stroke={color} strokeWidth={width} fill="none" strokeDasharray={dash} strokeLinejoin="round" />;
}

export function CircleW({ cx, cy, r, color = C.p2, width = 2.5, fill = 'none', dash, fillOpacity = 0.2 }: { cx: number; cy: number; r: number; color?: string; width?: number; fill?: string; dash?: string; fillOpacity?: number }) {
  const { sx, sy, v, w } = usePlot();
  const rp = (r / (v.xMax - v.xMin)) * w;
  return <Circle cx={sx(cx)} cy={sy(cy)} r={rp} stroke={color} strokeWidth={width} fill={fill} fillOpacity={fillOpacity} strokeDasharray={dash} />;
}

export function ArcW({ cx, cy, r, a0, a1, color = C.gold, width = 2.5, fillOpacity = 0 }: { cx: number; cy: number; r: number; a0: number; a1: number; color?: string; width?: number; fillOpacity?: number }) {
  const { sx, sy } = usePlot();
  const n = 40;
  let d = fillOpacity > 0 ? `M${sx(cx)} ${sy(cy)}` : '';
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    d += `${i === 0 && fillOpacity === 0 ? 'M' : 'L'}${sx(cx + r * Math.cos(a)).toFixed(1)} ${sy(cy + r * Math.sin(a)).toFixed(1)}`;
  }
  if (fillOpacity > 0) d += 'Z';
  return <Path d={d} stroke={color} strokeWidth={width} fill={fillOpacity > 0 ? color : 'none'} fillOpacity={fillOpacity} />;
}
