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
};
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
  equalAspect?: boolean; // keep 1:1 by expanding y-range
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

export function Plot(props: PlotProps) {
  const { width: w, height: h, grid = true, axes = true, tickLabels = true, draggables, onDrag, onDragEnd, onTap, background } = props;
  let { xMin, xMax, yMin, yMax } = props;
  if (props.equalAspect) {
    const sx = w / (xMax - xMin);
    const ySpan = h / sx;
    const cy = (yMin + yMax) / 2;
    yMin = cy - ySpan / 2;
    yMax = cy + ySpan / 2;
  }
  const v = { xMin, xMax, yMin, yMax };
  const ctx = useMemo<Ctx>(() => {
    const sx = (x: number) => ((x - xMin) / (xMax - xMin)) * w;
    const sy = (y: number) => h - ((y - yMin) / (yMax - yMin)) * h;
    const ix = (px: number) => xMin + (px / w) * (xMax - xMin);
    const iy = (py: number) => yMin + ((h - py) / h) * (yMax - yMin);
    return { sx, sy, ix, iy, w, h, v: { xMin, xMax, yMin, yMax } };
  }, [xMin, xMax, yMin, yMax, w, h]);

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
  const labels: React.ReactNode[] = [];
  if (grid || tickLabels) {
    for (let x = Math.ceil(xMin / xs) * xs; x <= xMax + 1e-9; x += xs) {
      const X = ctx.sx(x);
      if (grid) gridLines.push(<Line key={'gx' + x} x1={X} y1={0} x2={X} y2={h} stroke={C.plotGrid} strokeWidth={1} />);
      if (tickLabels && Math.abs(x) > 1e-9) {
        const y0 = Math.min(h - 4, Math.max(12, ctx.sy(0) + 14));
        labels.push(
          <SvgText key={'lx' + x} x={X} y={y0} fill={C.textDim} fontSize={10} textAnchor="middle" fontFamily={F.semibold}>
            {fmtTick(x)}
          </SvgText>,
        );
      }
    }
    for (let y = Math.ceil(yMin / ys) * ys; y <= yMax + 1e-9; y += ys) {
      const Y = ctx.sy(y);
      if (grid) gridLines.push(<Line key={'gy' + y} x1={0} y1={Y} x2={w} y2={Y} stroke={C.plotGrid} strokeWidth={1} />);
      if (tickLabels && Math.abs(y) > 1e-9) {
        const x0 = Math.min(w - 16, Math.max(4, ctx.sx(0) + 5));
        labels.push(
          <SvgText key={'ly' + y} x={x0} y={Y + 3.5} fill={C.textDim} fontSize={10} textAnchor="start" fontFamily={F.semibold}>
            {fmtTick(y)}
          </SvgText>,
        );
      }
    }
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
          {labels}
          {props.children}
          {draggables?.map((d) =>
            d.hidden ? null : (
              <G key={d.id}>
                <Circle cx={ctx.sx(d.x)} cy={ctx.sy(d.y)} r={(d.r ?? 9) + 8} fill={alpha(d.color ?? C.gold, 0.22)} />
                <Circle cx={ctx.sx(d.x)} cy={ctx.sy(d.y)} r={d.r ?? 9} fill={d.color ?? C.gold} stroke={C.white} strokeWidth={2} />
                {d.label ? (
                  <SvgText x={ctx.sx(d.x) + 14} y={ctx.sy(d.y) - 12} fill={d.color ?? C.gold} fontSize={13} fontFamily={F.heavy}>
                    {d.label}
                  </SvgText>
                ) : null}
              </G>
            ),
          )}
        </Svg>
      </View>
    </PlotCtx.Provider>
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
  const { sx, sy } = usePlot();
  return (
    <G>
      <Circle cx={sx(x)} cy={sy(y)} r={r} fill={hollow ? C.bgDeep : color} stroke={color} strokeWidth={hollow ? 2.5 : 1.5} />
      {label ? (
        <SvgText x={sx(x) + dx} y={sy(y) + dy} fill={labelColor ?? color} fontSize={13} fontFamily={F.heavy}>
          {label}
        </SvgText>
      ) : null}
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
  const { sx, sy } = usePlot();
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
      {label ? (
        <SvgText x={(X1 + X2) / 2 + 10 * Math.sin(ang)} y={(Y1 + Y2) / 2 - 10 * Math.cos(ang)} fill={color} fontSize={15} fontFamily={F.black} textAnchor="middle">
          {label}
        </SvgText>
      ) : null}
    </G>
  );
}

export function Label({ x, y, text, color = C.text, size = 13, anchor = 'start', dx = 0, dy = 0, weight = 'heavy' }: { x: number; y: number; text: string; color?: string; size?: number; anchor?: 'start' | 'middle' | 'end'; dx?: number; dy?: number; weight?: 'heavy' | 'semibold' }) {
  const { sx, sy } = usePlot();
  return (
    <SvgText x={sx(x) + dx} y={sy(y) + dy} fill={color} fontSize={size} fontFamily={weight === 'heavy' ? F.heavy : F.semibold} textAnchor={anchor}>
      {text}
    </SvgText>
  );
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
