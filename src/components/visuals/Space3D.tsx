import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { PanResponder, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Polygon } from 'react-native-svg';
import { C, F } from '../../theme';
import { useScrollLock } from '../ScrollLock';
import { HaloText } from '../plot/Plot';
import { Slider } from '../ui/Slider';
import { RichText } from '../math/RichText';
import type { ParamSpec } from './PlotLab';

export type V3 = [number, number, number];
type Proj = { p: (v: V3) => [number, number]; depth: (v: V3) => number; w: number; h: number };
const Ctx3 = createContext<Proj | null>(null);
const use3 = () => useContext(Ctx3)!;

export function Arrow3({ from = [0, 0, 0], to, color = C.p1, width = 3.5, label }: { from?: V3; to: V3; color?: string; width?: number; label?: string }) {
  const { p, w, h } = use3();
  const [x1, y1] = p(from);
  const [x2, y2] = p(to);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const hl = Math.min(12, len * 0.4);
  const bx = x2 - hl * Math.cos(ang);
  const by = y2 - hl * Math.sin(ang);
  const pts = `${x2},${y2} ${bx + hl * 0.5 * Math.sin(ang)},${by - hl * 0.5 * Math.cos(ang)} ${bx - hl * 0.5 * Math.sin(ang)},${by + hl * 0.5 * Math.cos(ang)}`;
  return (
    <G>
      <Line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={width} strokeLinecap="round" />
      {len > 3 && <Polygon points={pts} fill={color} />}
      {label ? <HaloText x={x2 + 6} y={y2 - 6} text={label} color={color} size={15} font={F.black} w={w} h={h} bg={C.bgDeep} /> : null}
    </G>
  );
}

export function Line3({ a, b, color = C.textMuted, width = 2, dash }: { a: V3; b: V3; color?: string; width?: number; dash?: string }) {
  const { p } = use3();
  const [x1, y1] = p(a);
  const [x2, y2] = p(b);
  return <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeDasharray={dash} strokeLinecap="round" />;
}

export function Point3({ at, color = C.gold, r = 5, label }: { at: V3; color?: string; r?: number; label?: string }) {
  const { p, w, h } = use3();
  const [x, y] = p(at);
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill={color} stroke={C.white} strokeWidth={1.5} />
      {label ? <HaloText x={x + 8} y={y - 8} text={label} color={color} w={w} h={h} bg={C.bgDeep} /> : null}
    </G>
  );
}

export function Poly3({ pts, color = C.p2, opacity = 0.25, stroke }: { pts: V3[]; color?: string; opacity?: number; stroke?: string }) {
  const { p } = use3();
  return <Polygon points={pts.map((v) => p(v).join(',')).join(' ')} fill={color} fillOpacity={opacity} stroke={stroke ?? color} strokeWidth={1.5} />;
}

export function Axes3({ size = 4, labels = true }: { size?: number; labels?: boolean }) {
  const { p, w, h } = use3();
  const ax: [V3, string, string][] = [
    [[size, 0, 0], 'x', '#FF6B6B'],
    [[0, size, 0], 'y', '#51CF66'],
    [[0, 0, size], 'z', '#4DABF7'],
  ];
  return (
    <G>
      {ax.map(([v, n, col]) => {
        const [x0, y0] = p([0, 0, 0]);
        const [x1, y1] = p(v);
        const [xn, yn] = p([-v[0] * 0.6, -v[1] * 0.6, -v[2] * 0.6]);
        return (
          <G key={n}>
            <Line x1={xn} y1={yn} x2={x0} y2={y0} stroke={col} strokeWidth={1} strokeOpacity={0.35} strokeDasharray="4 4" />
            <Line x1={x0} y1={y0} x2={x1} y2={y1} stroke={col} strokeWidth={1.6} strokeOpacity={0.8} />
            {labels && <HaloText x={x1 + 4} y={y1 + 4} text={n} color={col} w={w} h={h} bg={C.bgDeep} />}
          </G>
        );
      })}
    </G>
  );
}

export function Grid3({ size = 4, step = 1 }: { size?: number; step?: number }) {
  const lines: React.ReactNode[] = [];
  for (let i = -size; i <= size; i += step) {
    lines.push(<Line3 key={'a' + i} a={[i, -size, 0]} b={[i, size, 0]} color={C.plotGrid} width={1} />);
    lines.push(<Line3 key={'b' + i} a={[-size, i, 0]} b={[size, i, 0]} color={C.plotGrid} width={1} />);
  }
  return <G>{lines}</G>;
}

export type Space3DState = { p: Record<string, number>; yaw: number; pitch: number };

export function Space3D({
  width,
  height,
  scale = 28,
  params = [],
  render,
  info,
  onChange,
  initialYaw = -0.75,
  initialPitch = 0.42,
}: {
  width: number;
  height?: number;
  scale?: number;
  params?: ParamSpec[];
  render: (s: Space3DState) => React.ReactNode;
  info?: (s: Space3DState) => string;
  onChange?: (s: Space3DState) => void;
  initialYaw?: number;
  initialPitch?: number;
}) {
  const H = height ?? Math.round(width * 0.8);
  const [yaw, setYaw] = useState(initialYaw);
  const [pitch, setPitch] = useState(initialPitch);
  const [p, setP] = useState<Record<string, number>>(() => Object.fromEntries(params.map((q) => [q.key, q.value])));
  const lock = useScrollLock();
  const start = useRef({ yaw, pitch });
  const cur = useRef({ yaw, pitch });
  cur.current = { yaw, pitch };
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          lock(true);
          start.current = { ...cur.current };
        },
        onPanResponderMove: (_, g) => {
          setYaw(start.current.yaw + g.dx * 0.01);
          setPitch(Math.max(-1.4, Math.min(1.4, start.current.pitch + g.dy * 0.01)));
        },
        onPanResponderRelease: () => lock(false),
        onPanResponderTerminate: () => lock(false),
      }),
    [lock],
  );
  const proj = useMemo<Proj>(() => {
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const f = (v: V3) => {
      // world: z up. rotate around z (yaw), then tilt (pitch)
      const x1 = v[0] * cy - v[1] * sy;
      const y1 = v[0] * sy + v[1] * cy;
      const z1 = v[2];
      const yv = y1 * sp + z1 * cp; // screen up
      const d = y1 * cp - z1 * sp; // depth
      return { sx: width / 2 + x1 * scale, sy: H / 2 - yv * scale, d };
    };
    return {
      p: (v) => {
        const r = f(v);
        return [r.sx, r.sy];
      },
      depth: (v) => f(v).d,
      w: width,
      h: H,
    };
  }, [yaw, pitch, width, H, scale]);
  const s: Space3DState = { p, yaw, pitch };
  const infoText = info ? info(s) : '';
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width, height: H, borderRadius: 16, overflow: 'hidden', backgroundColor: C.bgDeep }} {...pan.panHandlers}>
        <Svg width={width} height={H}>
          <Ctx3.Provider value={proj}>{render(s)}</Ctx3.Provider>
        </Svg>
      </View>
      <Text style={{ color: C.textDim, fontFamily: F.semibold, fontSize: 12, marginTop: 4 }}>🔄 Arraste para girar em 3D</Text>
      {params.length > 0 && (
        <View style={{ alignSelf: 'stretch', marginTop: 4 }}>
          {params.map((q) => (
            <Slider
              key={q.key}
              label={q.label ?? q.key}
              min={q.min}
              max={q.max}
              step={q.step ?? 0.1}
              value={p[q.key]}
              color={q.color ?? C.primary}
              onChange={(v) => {
                const n = { ...p, [q.key]: v };
                setP(n);
                onChange?.({ p: n, yaw, pitch });
              }}
            />
          ))}
        </View>
      )}
      {infoText ? (
        <View style={{ alignSelf: 'stretch', marginTop: 8, padding: 12, borderRadius: 14, backgroundColor: C.surface2 }}>
          <RichText size={15} align="center">
            {infoText}
          </RichText>
        </View>
      ) : null}
    </View>
  );
}
