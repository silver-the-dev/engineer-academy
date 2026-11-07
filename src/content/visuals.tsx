/**
 * Reusable interactive visual factories used across lessons and exercises.
 * Each returns a VisualSpec ({name, props}); `.props` can be passed to inter().
 */
import React from 'react';
import type { VisualSpec } from './types';
import { Arrow, AreaUnder, ArcW, CircleW, FnCurve, InfLine, Label, PolygonW, PolylineW, Pt, RectW, Seg } from '../components/plot/Plot';
import { Arrow3, Axes3, Grid3, Line3, Point3, Poly3, type V3 } from '../components/visuals/Space3D';
import { C } from '../theme';
import { fmt } from '../lib/random';
import { Bars } from '../components/visuals/Misc';
import { Slider } from '../components/ui/Slider';
import { RichText } from '../components/math/RichText';

const t = String.raw;
type V = VisualSpec & { props: Record<string, any> };
const plotSpec = (props: Record<string, any>, height?: number): V => ({ name: 'plot', props, height });

/* ---------------- functions ---------------- */

/** y = a x + b with sliders */
export const lineLab = (opts: { a?: number; b?: number; target?: [number, number]; showRoot?: boolean } = {}): V =>
  plotSpec({
    view: { xMin: -6, xMax: 6, yMin: -6, yMax: 6 },
    equalAspect: true,
    params: [
      { key: 'a', label: 'a', min: -3, max: 3, step: 0.1, value: opts.a ?? 1, color: C.p2 },
      { key: 'b', label: 'b', min: -5, max: 5, step: 0.1, value: opts.b ?? 1, color: C.p3 },
    ],
    render: ({ p }: any) => (
      <>
        {opts.target ? <InfLine x1={-1} y1={opts.target[0] * -1 + opts.target[1]} x2={1} y2={opts.target[0] + opts.target[1]} color={C.gold} dash="7 6" width={2} /> : null}
        <FnCurve f={(x) => p.a * x + p.b} color={C.p2} />
        <Pt x={0} y={p.b} color={C.p3} label="b" />
        {opts.showRoot !== false && Math.abs(p.a) > 0.05 ? <Pt x={-p.b / p.a} y={0} color={C.p5} r={5} /> : null}
      </>
    ),
    info: ({ p }: any) => t`$f(x)=${fmt(p.a, 2)}x ${p.b < 0 ? '-' : '+'} ${fmt(Math.abs(p.b), 2)}$` + (Math.abs(p.a) > 0.05 ? t`  ·  raiz $x=${fmt(-p.b / p.a, 2)}$` : ''),
  });

/** parabola a x^2 + b x + c */
export const parabolaLab = (opts: { a?: number; b?: number; c?: number; ghost?: [number, number, number] } = {}): V =>
  plotSpec({
    view: { xMin: -6, xMax: 6, yMin: -6, yMax: 8 },
    params: [
      { key: 'a', label: 'a', min: -2, max: 2, step: 0.1, value: opts.a ?? 1, color: C.p1 },
      { key: 'b', label: 'b', min: -5, max: 5, step: 0.1, value: opts.b ?? 0, color: C.p2 },
      { key: 'c', label: 'c', min: -5, max: 5, step: 0.1, value: opts.c ?? -2, color: C.p3 },
    ],
    render: ({ p }: any) => {
      const D = p.b * p.b - 4 * p.a * p.c;
      const roots: number[] = [];
      if (Math.abs(p.a) > 1e-6 && D >= 0) {
        roots.push((-p.b - Math.sqrt(D)) / (2 * p.a), (-p.b + Math.sqrt(D)) / (2 * p.a));
      }
      const xv = Math.abs(p.a) > 1e-6 ? -p.b / (2 * p.a) : 0;
      return (
        <>
          {opts.ghost ? <FnCurve f={(x) => opts.ghost![0] * x * x + opts.ghost![1] * x + opts.ghost![2]} color={C.gold} dash="7 6" width={2} /> : null}
          <FnCurve f={(x) => p.a * x * x + p.b * x + p.c} color={C.p1} />
          {roots.map((r, i) => (
            <Pt key={i} x={r} y={0} color={C.p5} r={5} />
          ))}
          {Math.abs(p.a) > 1e-6 ? <Pt x={xv} y={p.a * xv * xv + p.b * xv + p.c} color={C.gold} label="V" /> : null}
        </>
      );
    },
    info: ({ p }: any) => {
      const D = p.b * p.b - 4 * p.a * p.c;
      const n = Math.abs(p.a) < 1e-6 ? '—' : D > 1e-9 ? '2 raízes reais' : Math.abs(D) <= 1e-9 ? '1 raiz (dupla)' : 'nenhuma raiz real';
      return t`$\Delta = b^2-4ac = ${fmt(D, 2)}$ ⟹ **${n}**`;
    },
  });

/** generic f(x; params) plotter */
export const fnLab = (opts: {
  f: (x: number, p: Record<string, number>) => number;
  params: { key: string; label?: string; min: number; max: number; step?: number; value: number; color?: string; format?: (v: number) => string }[];
  view: { xMin: number; xMax: number; yMin: number; yMax: number };
  info?: (p: Record<string, number>) => string;
  extra?: (p: Record<string, number>) => React.ReactNode;
  ghost?: (x: number) => number;
  equalAspect?: boolean;
}): V =>
  plotSpec({
    view: opts.view,
    equalAspect: opts.equalAspect,
    params: opts.params,
    render: ({ p }: any) => (
      <>
        {opts.ghost ? <FnCurve f={opts.ghost} color={C.gold} dash="7 6" width={2} /> : null}
        <FnCurve f={(x) => opts.f(x, p)} color={C.p1} />
        {opts.extra ? opts.extra(p) : null}
      </>
    ),
    info: opts.info ? ({ p }: any) => opts.info!(p) : undefined,
  });

/** exponential & log mirror */
export const expLogLab = (): V =>
  plotSpec({
    view: { xMin: -4, xMax: 6, yMin: -4, yMax: 6 },
    equalAspect: true,
    params: [{ key: 'a', label: 'a', min: 0.3, max: 4, step: 0.05, value: 2, color: C.p4 }],
    render: ({ p }: any) => (
      <>
        <FnCurve f={(x) => x} color={C.textDim} width={1.5} dash="5 5" />
        <FnCurve f={(x) => Math.pow(p.a, x)} color={C.p4} />
        {Math.abs(p.a - 1) > 0.02 ? <FnCurve f={(x) => (x > 0 ? Math.log(x) / Math.log(p.a) : NaN)} from={0.01} color={C.p5} /> : null}
        <Pt x={0} y={1} color={C.p4} r={4} />
        <Pt x={1} y={0} color={C.p5} r={4} />
      </>
    ),
    info: ({ p }: any) => t`Verde: $y=${fmt(p.a, 2)}^x$ · Rosa: $y=\log_{${fmt(p.a, 2)}}x$ · espelhados em $y=x$`,
  });

/* ---------------- calculus ---------------- */

/** secant → tangent: f, x0, slider h */
export const tangentLab = (f: (x: number) => number, df: (x: number) => number, x0 = 1, view = { xMin: -1, xMax: 4, yMin: -1, yMax: 6 }): V =>
  plotSpec({
    view,
    params: [
      { key: 'h', label: 'h', min: 0.01, max: 2, step: 0.01, value: 1.5, color: C.p5 },
      { key: 'x', label: 'x_0', min: view.xMin + 0.3, max: view.xMax - 0.3, step: 0.05, value: x0, color: C.gold },
    ],
    render: ({ p }: any) => {
      const a = p.x;
      const b = p.x + p.h;
      return (
        <>
          <FnCurve f={f} color={C.p1} />
          <InfLine x1={a} y1={f(a)} x2={b} y2={f(b)} color={C.p5} width={2} />
          <InfLine x1={a} y1={f(a)} x2={a + 1} y2={f(a) + df(a)} color={C.gold} width={1.5} dash="6 5" />
          <Pt x={a} y={f(a)} color={C.gold} />
          <Pt x={b} y={f(b)} color={C.p5} />
        </>
      );
    },
    info: ({ p }: any) => {
      const m = (f(p.x + p.h) - f(p.x)) / p.h;
      return t`Secante: $\frac{\Delta y}{\Delta x}=${fmt(m, 3)}$ · Tangente (tracejada): $f'(${fmt(p.x, 2)})=${fmt(df(p.x), 3)}$`;
    },
  });

/** f with draggable point showing tangent and sign of f' */
export const derivativeSignLab = (f: (x: number) => number, df: (x: number) => number, view = { xMin: -3, xMax: 3, yMin: -3, yMax: 3 }, x0 = -2): V =>
  plotSpec({
    view,
    points: [{ id: 'P', x: x0, y: f(x0), color: C.gold }],
    constrain: (_: string, x: number) => {
      const xx = Math.max(view.xMin + 0.1, Math.min(view.xMax - 0.1, x));
      return { x: xx, y: f(xx) };
    },
    render: ({ pts }: any) => {
      const a = pts.P.x;
      const s = df(a);
      return (
        <>
          <FnCurve f={f} color={C.p1} />
          <Seg x1={a - 1} y1={f(a) - s} x2={a + 1} y2={f(a) + s} color={Math.abs(s) < 0.05 ? C.gold : s > 0 ? C.success : C.danger} width={3} />
        </>
      );
    },
    info: ({ pts }: any) => {
      const s = df(pts.P.x);
      const w = Math.abs(s) < 0.05 ? 'ponto crítico (tangente horizontal)' : s > 0 ? 'f **crescente**' : 'f **decrescente**';
      return t`$f'(${fmt(pts.P.x, 2)}) = ${fmt(s, 2)}$ ⟹ ${w}`;
    },
  });

/** Riemann sums with n slider */
export const riemannLab = (f: (x: number) => number, a: number, b: number, exact: number, view: { xMin: number; xMax: number; yMin: number; yMax: number }, mode: 'left' | 'right' | 'mid' = 'mid'): V =>
  plotSpec({
    view,
    params: [{ key: 'n', label: 'n', min: 1, max: 60, step: 1, value: 4, color: C.p2, format: (v: number) => String(v) }],
    render: ({ p }: any) => {
      const n = p.n;
      const h = (b - a) / n;
      const rects = [];
      for (let i = 0; i < n; i++) {
        const x0 = a + i * h;
        const xs = mode === 'left' ? x0 : mode === 'right' ? x0 + h : x0 + h / 2;
        rects.push(<RectW key={i} x={x0} y={0} w={h} h={f(xs)} color={C.p2} opacity={0.35} />);
      }
      return (
        <>
          {rects}
          <FnCurve f={f} color={C.p1} />
        </>
      );
    },
    info: ({ p }: any) => {
      const n = p.n;
      const h = (b - a) / n;
      let s = 0;
      for (let i = 0; i < n; i++) {
        const x0 = a + i * h;
        const xs = mode === 'left' ? x0 : mode === 'right' ? x0 + h : x0 + h / 2;
        s += f(xs) * h;
      }
      return t`Soma com $n=${n}$: $${fmt(s, 4)}$ · valor exato $${fmt(exact, 4)}$ · erro $${fmt(Math.abs(s - exact), 4)}$`;
    },
  });

/** area under f from a to b (draggable b) */
export const areaLab = (f: (x: number) => number, F: (x: number) => number, a: number, b0: number, view: { xMin: number; xMax: number; yMin: number; yMax: number }): V =>
  plotSpec({
    view,
    params: [{ key: 'b', label: 'b', min: a + 0.1, max: view.xMax - 0.1, step: 0.05, value: b0, color: C.p3 }],
    render: ({ p }: any) => (
      <>
        <AreaUnder f={f} a={a} b={p.b} color={C.p3} opacity={0.35} />
        <FnCurve f={f} color={C.p1} />
      </>
    ),
    info: ({ p }: any) => t`$\int_{${fmt(a)}}^{${fmt(p.b, 2)}} f(x)\,dx = F(${fmt(p.b, 2)}) - F(${fmt(a)}) = ${fmt(F(p.b) - F(a), 3)}$`,
  });

/** area between two curves */
export const betweenLab = (f: (x: number) => number, g: (x: number) => number, a: number, b: number, area: number, view: { xMin: number; xMax: number; yMin: number; yMax: number }): V =>
  plotSpec({
    view,
    render: () => (
      <>
        <AreaUnder f={f} g={g} a={a} b={b} color={C.gold} opacity={0.35} />
        <FnCurve f={f} color={C.p2} />
        <FnCurve f={g} color={C.p3} />
        <Pt x={a} y={f(a)} color={C.gold} r={4} />
        <Pt x={b} y={f(b)} color={C.gold} r={4} />
      </>
    ),
    caption: `Área entre as curvas = ${fmt(area, 4)}`,
  });

/* ---------------- vectors 2D ---------------- */

export const vectorLab = (mode: 'sum' | 'diff' | 'scale' | 'dot' | 'proj' | 'area' | 'module', opts: { u?: [number, number]; v?: [number, number]; snap?: number } = {}): V => {
  const u0 = opts.u ?? [3, 1];
  const v0 = opts.v ?? [1, 2];
  const points = mode === 'scale' || mode === 'module' ? [{ id: 'u', x: u0[0], y: u0[1], color: C.p2, label: 'u' }] : [
    { id: 'u', x: u0[0], y: u0[1], color: C.p2, label: 'u' },
    { id: 'v', x: v0[0], y: v0[1], color: C.p3, label: 'v' },
  ];
  return plotSpec({
    view: { xMin: -5, xMax: 5, yMin: -4, yMax: 4 },
    equalAspect: true,
    points,
    snap: opts.snap ?? 0.5,
    params: mode === 'scale' ? [{ key: 'k', label: 'k', min: -2, max: 3, step: 0.1, value: 1.5, color: C.p4 }] : [],
    render: ({ pts, p }: any) => {
      const u = pts.u;
      const v = pts.v ?? { x: 0, y: 0 };
      if (mode === 'sum')
        return (
          <>
            <PolygonW pts={[[0, 0], [u.x, u.y], [u.x + v.x, u.y + v.y], [v.x, v.y]]} color={C.gold} opacity={0.1} strokeWidth={0} />
            <Seg x1={u.x} y1={u.y} x2={u.x + v.x} y2={u.y + v.y} color={C.p3} dash="5 4" />
            <Seg x1={v.x} y1={v.y} x2={u.x + v.x} y2={u.y + v.y} color={C.p2} dash="5 4" />
            <Arrow x1={0} y1={0} x2={u.x} y2={u.y} color={C.p2} />
            <Arrow x1={0} y1={0} x2={v.x} y2={v.y} color={C.p3} />
            <Arrow x1={0} y1={0} x2={u.x + v.x} y2={u.y + v.y} color={C.gold} width={4.5} label="u+v" />
          </>
        );
      if (mode === 'diff')
        return (
          <>
            <Arrow x1={0} y1={0} x2={u.x} y2={u.y} color={C.p2} />
            <Arrow x1={0} y1={0} x2={v.x} y2={v.y} color={C.p3} />
            <Arrow x1={v.x} y1={v.y} x2={u.x} y2={u.y} color={C.p5} width={4.5} label="u−v" />
          </>
        );
      if (mode === 'scale')
        return (
          <>
            <Arrow x1={0} y1={0} x2={u.x * p.k} y2={u.y * p.k} color={p.k >= 0 ? C.p4 : C.danger} width={6} />
            <Arrow x1={0} y1={0} x2={u.x} y2={u.y} color={C.p2} width={2.5} />
          </>
        );
      if (mode === 'module')
        return (
          <>
            <Seg x1={0} y1={0} x2={u.x} y2={0} color={C.p5} width={3} />
            <Seg x1={u.x} y1={0} x2={u.x} y2={u.y} color={C.p4} width={3} />
            <Arrow x1={0} y1={0} x2={u.x} y2={u.y} color={C.p2} width={4} />
          </>
        );
      if (mode === 'dot') {
        const a1 = Math.atan2(u.y, u.x);
        let a2 = Math.atan2(v.y, v.x);
        let d = a2 - a1;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        return (
          <>
            <ArcW cx={0} cy={0} r={0.8} a0={a1} a1={a1 + d} color={C.gold} />
            <Arrow x1={0} y1={0} x2={u.x} y2={u.y} color={C.p2} />
            <Arrow x1={0} y1={0} x2={v.x} y2={v.y} color={C.p3} />
          </>
        );
      }
      if (mode === 'proj') {
        const vv = v.x * v.x + v.y * v.y || 1;
        const k = (u.x * v.x + u.y * v.y) / vv;
        return (
          <>
            <InfLine x1={0} y1={0} x2={v.x} y2={v.y} color={C.textDim} width={1} dash="4 4" />
            <Seg x1={u.x} y1={u.y} x2={k * v.x} y2={k * v.y} color={C.textMuted} dash="5 4" />
            <Arrow x1={0} y1={0} x2={v.x} y2={v.y} color={C.p3} />
            <Arrow x1={0} y1={0} x2={u.x} y2={u.y} color={C.p2} />
            <Arrow x1={0} y1={0} x2={k * v.x} y2={k * v.y} color={C.gold} width={6} label="proj" />
          </>
        );
      }
      // area
      return (
        <>
          <PolygonW pts={[[0, 0], [u.x, u.y], [u.x + v.x, u.y + v.y], [v.x, v.y]]} color={C.p1} opacity={0.3} />
          <Arrow x1={0} y1={0} x2={u.x} y2={u.y} color={C.p2} />
          <Arrow x1={0} y1={0} x2={v.x} y2={v.y} color={C.p3} />
        </>
      );
    },
    info: ({ pts, p }: any) => {
      const u = pts.u;
      const v = pts.v ?? { x: 0, y: 0 };
      const U = t`\vec u=(${fmt(u.x)},\,${fmt(u.y)})`;
      const Vv = t`\vec v=(${fmt(v.x)},\,${fmt(v.y)})`;
      if (mode === 'sum') return t`$${U}$, $${Vv}$ ⟹ $\vec u+\vec v=(${fmt(u.x + v.x)},\,${fmt(u.y + v.y)})$`;
      if (mode === 'diff') return t`$\vec u-\vec v=(${fmt(u.x - v.x)},\,${fmt(u.y - v.y)})$`;
      if (mode === 'scale') return t`$k\vec u=(${fmt(p.k * u.x)},\,${fmt(p.k * u.y)})$ · $|k\vec u| = |k|\,|\vec u| = ${fmt(Math.abs(p.k) * Math.hypot(u.x, u.y), 2)}$`;
      if (mode === 'module') return t`$|\vec u|=\sqrt{${fmt(u.x)}^2+${fmt(u.y)}^2}=${fmt(Math.hypot(u.x, u.y), 3)}$`;
      const dot = u.x * v.x + u.y * v.y;
      if (mode === 'dot') {
        const cos = dot / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y) || 1);
        const ang = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
        return t`$\vec u\cdot\vec v=${fmt(dot, 2)}$ · $\theta=${fmt(ang, 1)}^\circ$` + (Math.abs(dot) < 1e-9 ? ' · **ortogonais!**' : '');
      }
      if (mode === 'proj') {
        const vv = v.x * v.x + v.y * v.y || 1;
        const k = dot / vv;
        return t`$\mathrm{proj}_{\vec v}\vec u = \frac{${fmt(dot, 2)}}{${fmt(vv, 2)}}\vec v=(${fmt(k * v.x, 2)},\,${fmt(k * v.y, 2)})$`;
      }
      return t`Área do paralelogramo $=|u_xv_y-u_yv_x| = ${fmt(Math.abs(u.x * v.y - u.y * v.x), 2)}$`;
    },
  });
};

/* ---------------- trigonometry ---------------- */

export const unitCircleLab = (withWave = false): V =>
  plotSpec(
    {
      view: withWave ? { xMin: -1.4, xMax: 7.3, yMin: -1.5, yMax: 1.5 } : { xMin: -1.6, xMax: 1.6, yMin: -1.6, yMax: 1.6 },
      equalAspect: true,
      points: [{ id: 'P', x: Math.cos(0.8), y: Math.sin(0.8), color: C.gold, label: 'P' }],
      constrain: (_: string, x: number, y: number) => {
        const a = Math.atan2(y, x);
        return { x: Math.cos(a), y: Math.sin(a) };
      },
      render: ({ pts }: any) => {
        const a = Math.atan2(pts.P.y, pts.P.x);
        const ang = a < 0 ? a + 2 * Math.PI : a;
        return (
          <>
            <CircleW cx={0} cy={0} r={1} color={C.textDim} width={2} />
            <ArcW cx={0} cy={0} r={0.3} a0={0} a1={ang} color={C.gold} />
            <Seg x1={0} y1={0} x2={pts.P.x} y2={pts.P.y} color={C.gold} width={2} />
            <Seg x1={0} y1={0} x2={pts.P.x} y2={0} color={C.p2} width={5} />
            <Seg x1={pts.P.x} y1={0} x2={pts.P.x} y2={pts.P.y} color={C.p5} width={5} />
            {withWave ? (
              <>
                <FnCurve f={(x) => Math.sin(x)} from={0} to={6.28} color={C.p5} width={2} opacity={0.5} />
                <FnCurve f={(x) => Math.sin(x)} from={0} to={ang} color={C.p5} width={4} />
                <Pt x={ang} y={Math.sin(ang)} color={C.p5} r={5} />
                <Seg x1={pts.P.x} y1={pts.P.y} x2={ang} y2={Math.sin(ang)} color={C.p5} dash="4 4" width={1} />
              </>
            ) : null}
          </>
        );
      },
      info: ({ pts }: any) => {
        const a = Math.atan2(pts.P.y, pts.P.x);
        const ang = a < 0 ? a + 2 * Math.PI : a;
        return t`$\theta=${fmt((ang * 180) / Math.PI, 1)}^\circ=${fmt(ang, 3)}$ rad · $\cos\theta=${fmt(pts.P.x, 3)}$ · $\operatorname{sen}\theta=${fmt(pts.P.y, 3)}$`;
      },
    },
    withWave ? 220 : 300,
  );

/* ---------------- linear algebra ---------------- */

export const matrixLab = (m0: [number, number, number, number] = [1, 1, 0, 1], showEig = false): V =>
  plotSpec(
    {
      view: { xMin: -4, xMax: 4, yMin: -4, yMax: 4 },
      equalAspect: true,
      grid: false,
      params: [
        { key: 'a', label: 'a', min: -2, max: 2, step: 0.1, value: m0[0], color: C.p5 },
        { key: 'c', label: 'c', min: -2, max: 2, step: 0.1, value: m0[2], color: C.p5 },
        { key: 'b', label: 'b', min: -2, max: 2, step: 0.1, value: m0[1], color: C.p4 },
        { key: 'd', label: 'd', min: -2, max: 2, step: 0.1, value: m0[3], color: C.p4 },
      ],
      render: ({ p }: any) => {
        const T = (x: number, y: number): [number, number] => [p.a * x + p.b * y, p.c * x + p.d * y];
        const lines = [];
        for (let k = -4; k <= 4; k++) {
          const [x1, y1] = T(k, -4);
          const [x2, y2] = T(k, 4);
          const [x3, y3] = T(-4, k);
          const [x4, y4] = T(4, k);
          lines.push(<Seg key={'v' + k} x1={x1} y1={y1} x2={x2} y2={y2} color={C.p2} width={1} />);
          lines.push(<Seg key={'h' + k} x1={x3} y1={y3} x2={x4} y2={y4} color={C.p2} width={1} />);
        }
        const sq = [T(0, 0), T(1, 0), T(1, 1), T(0, 1)];
        const eig: React.ReactNode[] = [];
        if (showEig) {
          const tr = p.a + p.d;
          const det = p.a * p.d - p.b * p.c;
          const disc = tr * tr - 4 * det;
          if (disc >= 0) {
            [(tr + Math.sqrt(disc)) / 2, (tr - Math.sqrt(disc)) / 2].forEach((l, i) => {
              let vx = p.b;
              let vy = l - p.a;
              if (Math.abs(vx) + Math.abs(vy) < 1e-6) {
                vx = l - p.d;
                vy = p.c;
              }
              if (Math.abs(vx) + Math.abs(vy) < 1e-6) {
                vx = i === 0 ? 1 : 0;
                vy = i === 0 ? 0 : 1;
              }
              eig.push(<InfLine key={'e' + i} x1={0} y1={0} x2={vx} y2={vy} color={C.gold} width={2} dash="6 4" />);
            });
          }
        }
        return (
          <>
            {lines}
            <PolygonW pts={sq} color={C.gold} opacity={0.35} />
            {eig}
            <Arrow x1={0} y1={0} x2={p.a} y2={p.c} color={C.p5} label="Aî" />
            <Arrow x1={0} y1={0} x2={p.b} y2={p.d} color={C.p4} label="Aĵ" />
          </>
        );
      },
      info: ({ p }: any) => {
        const det = p.a * p.d - p.b * p.c;
        return t`$A=\begin{pmatrix}${fmt(p.a)}&${fmt(p.b)}\\${fmt(p.c)}&${fmt(p.d)}\end{pmatrix}$ · $\det A=${fmt(det, 2)}$ = área do quadrado dourado` + (Math.abs(det) < 0.02 ? ' · **achatou!**' : '');
      },
    },
    300,
  );

/* ---------------- numerical methods ---------------- */

export const bisectionStepper = (f: (x: number) => number, a0: number, b0: number, steps = 8, view?: { xMin: number; xMax: number; yMin: number; yMax: number }): VisualSpec => {
  const iters: { a: number; b: number; m: number }[] = [];
  let a = a0;
  let b = b0;
  for (let k = 0; k < steps; k++) {
    const m = (a + b) / 2;
    iters.push({ a, b, m });
    if (f(a) * f(m) <= 0) b = m;
    else a = m;
  }
  return {
    name: 'stepper',
    props: {
      steps,
      view: view ?? { xMin: a0 - 0.5, xMax: b0 + 0.5, yMin: -4, yMax: 4 },
      render: (k: number) => {
        const it = iters[k];
        return (
          <>
            <FnCurve f={f} color={C.p1} />
            <Seg x1={it.a} y1={0} x2={it.b} y2={0} color={C.gold} width={7} />
            <Pt x={it.a} y={f(it.a)} color={f(it.a) < 0 ? C.danger : C.success} r={5} />
            <Pt x={it.b} y={f(it.b)} color={f(it.b) < 0 ? C.danger : C.success} r={5} />
            <Seg x1={it.m} y1={0} x2={it.m} y2={f(it.m)} color={C.p2} dash="4 4" />
            <Pt x={it.m} y={0} color={C.p2} label="m" />
          </>
        );
      },
      info: (k: number) => {
        const it = iters[k];
        return t`$[a,b]=[${fmt(it.a, 4)},\,${fmt(it.b, 4)}]$ · $m=${fmt(it.m, 5)}$ · $f(m)=${fmt(f(it.m), 4)}$`;
      },
    },
  };
};

export const newtonStepper = (f: (x: number) => number, df: (x: number) => number, x0: number, steps = 5, view: { xMin: number; xMax: number; yMin: number; yMax: number }): VisualSpec => {
  const xs = [x0];
  for (let k = 0; k < steps; k++) xs.push(xs[k] - f(xs[k]) / df(xs[k]));
  return {
    name: 'stepper',
    props: {
      steps,
      view,
      render: (k: number) => {
        const x = xs[k];
        return (
          <>
            <FnCurve f={f} color={C.p1} />
            <InfLine x1={x} y1={f(x)} x2={x + 1} y2={f(x) + df(x)} color={C.gold} width={2} />
            <Seg x1={x} y1={0} x2={x} y2={f(x)} color={C.textMuted} dash="4 4" />
            <Pt x={x} y={f(x)} color={C.gold} />
            <Pt x={xs[k + 1]} y={0} color={C.p5} label={`x${k + 1}`} />
          </>
        );
      },
      info: (k: number) => t`$x_{${k}}=${fmt(xs[k], 6)}$ ⟹ $x_{${k + 1}}=x_{${k}}-\frac{f(x_{${k}})}{f'(x_{${k}})}=${fmt(xs[k + 1], 6)}$`,
    },
  };
};

const lagrange = (pts: { x: number; y: number }[]) => (x: number) => {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    let l = 1;
    for (let j = 0; j < pts.length; j++) if (j !== i) l *= (x - pts[j].x) / (pts[i].x - pts[j].x || 1e-9);
    s += pts[i].y * l;
  }
  return s;
};

export const interpolationLab = (init: [number, number][] = [[-3, 1], [-1, 3], [1, -1], [3, 2]]): V =>
  plotSpec({
    view: { xMin: -4.5, xMax: 4.5, yMin: -4, yMax: 5 },
    points: init.map(([x, y], i) => ({ id: 'p' + i, x, y, color: C.gold })),
    snap: 0.25,
    render: ({ pts }: any) => {
      const arr = Object.keys(pts)
        .sort()
        .map((k) => pts[k]);
      return <FnCurve f={lagrange(arr)} color={C.p4} />;
    },
    info: ({ pts }: any) => t`Polinômio interpolador de grau $${Object.keys(pts).length - 1}$ passa por **todos** os pontos`,
  });

export const regressionLab = (init: [number, number][] = [[1, 1.5], [2, 2.2], [3, 3.6], [4, 3.9], [5, 5.4], [6, 5.8]]): V =>
  plotSpec({
    view: { xMin: 0, xMax: 7, yMin: 0, yMax: 7 },
    equalAspect: true,
    points: init.map(([x, y], i) => ({ id: 'p' + i, x, y, color: C.gold, r: 7 })),
    snap: 0.1,
    params: [
      { key: 'a', label: 'a', min: -1, max: 2, step: 0.02, value: 0.4, color: C.p2 },
      { key: 'b', label: 'b', min: -2, max: 5, step: 0.05, value: 2, color: C.p3 },
    ],
    render: ({ pts, p }: any) => {
      const arr = Object.values(pts) as { x: number; y: number }[];
      return (
        <>
          {arr.map((q, i) => {
            const yh = p.a * q.x + p.b;
            const r = q.y - yh;
            return <RectW key={i} x={q.x} y={yh} w={Math.abs(r) * (r >= 0 ? -1 : 1)} h={r} color={C.p5} opacity={0.2} />;
          })}
          <FnCurve f={(x) => p.a * x + p.b} color={C.p2} />
        </>
      );
    },
    info: ({ pts, p }: any) => {
      const arr = Object.values(pts) as { x: number; y: number }[];
      const n = arr.length;
      const sx = arr.reduce((s, q) => s + q.x, 0);
      const sy = arr.reduce((s, q) => s + q.y, 0);
      const sxx = arr.reduce((s, q) => s + q.x * q.x, 0);
      const sxy = arr.reduce((s, q) => s + q.x * q.y, 0);
      const aa = (n * sxy - sx * sy) / (n * sxx - sx * sx);
      const bb = (sy - aa * sx) / n;
      const sse = arr.reduce((s, q) => s + (q.y - (p.a * q.x + p.b)) ** 2, 0);
      return t`Soma dos quadrados (sua reta): $${fmt(sse, 3)}$ · melhor reta: $y=${fmt(aa, 3)}x+${fmt(bb, 3)}$`;
    },
  });

export const quadratureLab = (f: (x: number) => number, a: number, b: number, exact: number, view: { xMin: number; xMax: number; yMin: number; yMax: number }): V =>
  plotSpec({
    view,
    params: [
      { key: 'n', label: 'n', min: 2, max: 20, step: 2, value: 2, color: C.p2, format: (v: number) => String(v) },
      { key: 's', label: 'S', min: 0, max: 1, step: 1, value: 0, color: C.p4, format: (v: number) => (v ? 'Simpson' : 'Trapézio') },
    ],
    render: ({ p }: any) => {
      const n = p.n;
      const h = (b - a) / n;
      const shapes = [];
      if (!p.s) {
        for (let i = 0; i < n; i++) {
          const x0 = a + i * h;
          shapes.push(<PolygonW key={i} pts={[[x0, 0], [x0 + h, 0], [x0 + h, f(x0 + h)], [x0, f(x0)]]} color={C.p2} opacity={0.3} strokeWidth={1.2} />);
        }
      } else {
        for (let i = 0; i < n; i += 2) {
          const x0 = a + i * h;
          const x1 = x0 + h;
          const x2 = x0 + 2 * h;
          const y0 = f(x0);
          const y1 = f(x1);
          const y2 = f(x2);
          const P = (x: number) => y0 * ((x - x1) * (x - x2)) / ((x0 - x1) * (x0 - x2)) + y1 * ((x - x0) * (x - x2)) / ((x1 - x0) * (x1 - x2)) + y2 * ((x - x0) * (x - x1)) / ((x2 - x0) * (x2 - x1));
          shapes.push(<AreaUnder key={i} f={P} a={x0} b={x2} color={C.p4} opacity={0.3} />);
          shapes.push(<FnCurve key={'c' + i} f={P} from={x0} to={x2} color={C.p4} width={2} />);
        }
      }
      return (
        <>
          {shapes}
          <FnCurve f={f} color={C.p1} />
        </>
      );
    },
    info: ({ p }: any) => {
      const n = p.n;
      const h = (b - a) / n;
      let s = 0;
      if (!p.s) {
        for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 0.5 : 1) * f(a + i * h);
        s *= h;
      } else {
        for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * f(a + i * h);
        s *= h / 3;
      }
      return t`${p.s ? 'Simpson' : 'Trapézios'} com $n=${n}$: $${fmt(s, 6)}$ · exato $${fmt(exact, 6)}$ · erro $${fmt(Math.abs(s - exact), 6)}$`;
    },
  });

export const eulerLab = (f: (x: number, y: number) => number, exact: (x: number) => number, x0: number, y0: number, X: number, view: { xMin: number; xMax: number; yMin: number; yMax: number }): V =>
  plotSpec({
    view,
    params: [
      { key: 'h', label: 'h', min: 0.05, max: 1, step: 0.05, value: 0.5, color: C.p3 },
      { key: 'rk', label: 'M', min: 0, max: 1, step: 1, value: 0, color: C.p4, format: (v: number) => (v ? 'RK4' : 'Euler') },
    ],
    render: ({ p }: any) => {
      const pts: [number, number][] = [[x0, y0]];
      let x = x0;
      let y = y0;
      while (x < X - 1e-9) {
        const h = Math.min(p.h, X - x);
        if (!p.rk) y = y + h * f(x, y);
        else {
          const k1 = f(x, y);
          const k2 = f(x + h / 2, y + (h * k1) / 2);
          const k3 = f(x + h / 2, y + (h * k2) / 2);
          const k4 = f(x + h, y + h * k3);
          y = y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
        }
        x += h;
        pts.push([x, y]);
      }
      return (
        <>
          <FnCurve f={exact} color={C.p4} />
          <PolylineW pts={pts} color={C.p3} width={3} />
          {pts.map(([a, b2], i) => (
            <Pt key={i} x={a} y={b2} r={3.5} color={C.p3} />
          ))}
        </>
      );
    },
    info: ({ p }: any) => {
      let x = x0;
      let y = y0;
      while (x < X - 1e-9) {
        const h = Math.min(p.h, X - x);
        if (!p.rk) y = y + h * f(x, y);
        else {
          const k1 = f(x, y);
          const k2 = f(x + h / 2, y + (h * k1) / 2);
          const k3 = f(x + h / 2, y + (h * k2) / 2);
          const k4 = f(x + h, y + h * k3);
          y = y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
        }
        x += h;
      }
      return t`${p.rk ? 'RK4' : 'Euler'}: $y(${fmt(X)})\approx ${fmt(y, 5)}$ · exato $${fmt(exact(X), 5)}$ · erro $${fmt(Math.abs(y - exact(X)), 5)}$`;
    },
  });

/* ---------------- statistics ---------------- */

/** dots on number line; drag one to see mean vs median */
export const meanMedianLab = (data: number[] = [2, 3, 3, 5, 7]): V =>
  plotSpec(
    {
      view: { xMin: 0, xMax: 20, yMin: -1.2, yMax: 2.5 },
      grid: false,
      points: [{ id: 'X', x: data[data.length - 1], y: 0.5, color: C.danger, label: 'arraste' }],
      constrain: (_: string, x: number) => ({ x: Math.max(0, Math.min(20, Math.round(x))), y: 0.5 }),
      render: ({ pts }: any) => {
        const arr = [...data.slice(0, -1), pts.X.x].sort((a, b) => a - b);
        const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
        const n = arr.length;
        const med = n % 2 ? arr[(n - 1) / 2] : (arr[n / 2 - 1] + arr[n / 2]) / 2;
        const counts: Record<number, number> = {};
        return (
          <>
            <Seg x1={0} y1={0} x2={20} y2={0} color={C.plotAxis} width={2} />
            {data.slice(0, -1).map((v, i) => {
              counts[v] = (counts[v] ?? 0) + 1;
              return <Pt key={i} x={v} y={0.5 + (counts[v] - 1) * 0.55} color={C.p5} r={7} />;
            })}
            <Seg x1={mean} y1={-0.9} x2={mean} y2={2.2} color={C.gold} width={3} />
            <Label x={mean} y={-1} text="média" color={C.gold} anchor="middle" dy={0} />
            <Seg x1={med} y1={-0.6} x2={med} y2={2.2} color={C.p2} width={3} dash="6 4" />
            <Label x={med} y={2.3} text="mediana" color={C.p2} anchor="middle" />
          </>
        );
      },
      info: ({ pts }: any) => {
        const arr = [...data.slice(0, -1), pts.X.x].sort((a, b) => a - b);
        const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
        const n = arr.length;
        const med = n % 2 ? arr[(n - 1) / 2] : (arr[n / 2 - 1] + arr[n / 2]) / 2;
        return t`Dados: $${arr.join(',\\ ')}$ · média $=${fmt(mean, 2)}$ · mediana $=${fmt(med, 2)}$`;
      },
    },
    200,
  );

export const normalLab = (): V =>
  plotSpec({
    view: { xMin: -4, xMax: 4, yMin: -0.05, yMax: 0.85 },
    params: [
      { key: 'm', label: '\\mu', min: -2, max: 2, step: 0.1, value: 0, color: C.p5 },
      { key: 's', label: '\\sigma', min: 0.5, max: 2, step: 0.05, value: 1, color: C.p2 },
      { key: 'k', label: 'k', min: 0.5, max: 3, step: 0.1, value: 1, color: C.gold },
    ],
    render: ({ p }: any) => {
      const pdf = (x: number) => Math.exp(-((x - p.m) ** 2) / (2 * p.s * p.s)) / (p.s * Math.sqrt(2 * Math.PI));
      return (
        <>
          <AreaUnder f={pdf} a={p.m - p.k * p.s} b={p.m + p.k * p.s} color={C.gold} opacity={0.35} />
          <FnCurve f={pdf} color={C.p5} />
        </>
      );
    },
    info: ({ p }: any) => {
      const erf = (x: number) => {
        const s = Math.sign(x);
        x = Math.abs(x);
        const tt = 1 / (1 + 0.3275911 * x);
        const y = 1 - ((((1.061405429 * tt - 1.453152027) * tt + 1.421413741) * tt - 0.284496736) * tt + 0.254829592) * tt * Math.exp(-x * x);
        return s * y;
      };
      return t`$P(\mu-k\sigma < X < \mu+k\sigma) = ${fmt(erf(p.k / Math.SQRT2) * 100, 1)}\%$ para $k=${fmt(p.k, 1)}$`;
    },
  });

export const binomialLab = (): V => ({
  name: 'custom',
  props: { component: BinomialView },
});

function BinomialView({ width }: { width: number }) {
  const [n, setN] = React.useState(10);
  const [p, setP] = React.useState(0.5);
  const comb = (a: number, b: number) => {
    let r = 1;
    for (let i = 1; i <= b; i++) r = (r * (a - b + i)) / i;
    return r;
  };
  const vals = Array.from({ length: n + 1 }, (_, k) => Math.round(comb(n, k) * p ** k * (1 - p) ** (n - k) * 1000) / 10);
  const mx = Math.max(...vals);
  return (
    <>
      <Bars key={`${n}-${p}`} width={width} labels={vals.map((_: number, k: number) => String(k))} values={vals} max={Math.ceil(mx / 5) * 5 || 5} editable={false} color={C.p2} />
      <Slider label="n" min={1} max={20} step={1} value={n} onChange={setN} color={C.p2} format={(v: number) => String(v)} />
      <Slider label="p" min={0.05} max={0.95} step={0.05} value={p} onChange={setP} color={C.p5} />
      <RichText size={15} align="center">{t`Barras: $P(X=k)$ em %. Média $np=${fmt(n * p, 2)}$, $\sigma=\sqrt{np(1-p)}=${fmt(Math.sqrt(n * p * (1 - p)), 2)}$`}</RichText>
    </>
  );
}

/* ---------------- 3D ---------------- */

export const cross3DLab = (): VisualSpec => ({
  name: 'space3d',
  props: {
    params: [
      { key: 'ux', label: 'u_x', min: -3, max: 3, step: 0.5, value: 2, color: C.p2 },
      { key: 'vy', label: 'v_y', min: -3, max: 3, step: 0.5, value: 2, color: C.p3 },
      { key: 'vx', label: 'v_x', min: -3, max: 3, step: 0.5, value: 1, color: C.p3 },
    ],
    render: ({ p }: any) => {
      const u: V3 = [p.ux, 0, 0];
      const v: V3 = [p.vx, p.vy, 0];
      const w: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      return (
        <>
          <Grid3 size={3} />
          <Axes3 size={3.5} />
          <Poly3 pts={[[0, 0, 0], u, [u[0] + v[0], u[1] + v[1], 0], v]} color={C.p1} opacity={0.3} />
          <Arrow3 to={u} color={C.p2} label="u" />
          <Arrow3 to={v} color={C.p3} label="v" />
          <Arrow3 to={[w[0] * 0.5, w[1] * 0.5, w[2] * 0.5]} color={C.gold} label="u×v" />
        </>
      );
    },
    info: ({ p }: any) => {
      const area = Math.abs(p.ux * p.vy);
      return t`$\vec u\times\vec v=(0,\,0,\,${fmt(p.ux * p.vy)})$ (seta dourada em escala ½) · área $=${fmt(area)}$`;
    },
  },
});

export const vectors3DLab = (): VisualSpec => ({
  name: 'space3d',
  props: {
    params: [
      { key: 'x', label: 'x', min: -3, max: 3, step: 0.5, value: 2, color: '#FF6B6B' },
      { key: 'y', label: 'y', min: -3, max: 3, step: 0.5, value: 1.5, color: '#51CF66' },
      { key: 'z', label: 'z', min: -3, max: 3, step: 0.5, value: 2.5, color: '#4DABF7' },
    ],
    render: ({ p }: any) => (
      <>
        <Grid3 size={3} />
        <Axes3 size={3.5} />
        <Line3 a={[p.x, 0, 0]} b={[p.x, p.y, 0]} color={C.textDim} dash="4 4" />
        <Line3 a={[0, p.y, 0]} b={[p.x, p.y, 0]} color={C.textDim} dash="4 4" />
        <Line3 a={[p.x, p.y, 0]} b={[p.x, p.y, p.z]} color={C.textDim} dash="4 4" />
        <Arrow3 to={[p.x, p.y, p.z]} color={C.gold} label="v" />
        <Point3 at={[p.x, p.y, 0]} color={C.textMuted} r={3} />
      </>
    ),
    info: ({ p }: any) => t`$\vec v=(${fmt(p.x)},\,${fmt(p.y)},\,${fmt(p.z)})$ · $|\vec v|=\sqrt{x^2+y^2+z^2}=${fmt(Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z), 3)}$`,
  },
});

export const plane3DLab = (): VisualSpec => ({
  name: 'space3d',
  props: {
    scale: 26,
    params: [
      { key: 'a', label: 'a', min: -2, max: 2, step: 0.25, value: 0.5, color: C.gold },
      { key: 'b', label: 'b', min: -2, max: 2, step: 0.25, value: 0.5, color: C.gold },
      { key: 'd', label: 'd', min: -3, max: 3, step: 0.5, value: 1, color: C.p2 },
    ],
    render: ({ p }: any) => {
      // plane a x + b y + z = d  -> z = d - a x - b y
      const z = (x: number, y: number) => p.d - p.a * x - p.b * y;
      const S = 2.5;
      const corners: V3[] = [
        [-S, -S, z(-S, -S)],
        [S, -S, z(S, -S)],
        [S, S, z(S, S)],
        [-S, S, z(-S, S)],
      ];
      const n: V3 = [p.a, p.b, 1];
      const c: V3 = [0, 0, p.d];
      return (
        <>
          <Axes3 size={3.5} />
          <Poly3 pts={corners} color={C.p1} opacity={0.3} />
          <Arrow3 from={c} to={[c[0] + n[0] * 1.5, c[1] + n[1] * 1.5, c[2] + n[2] * 1.5]} color={C.gold} label="n" />
          <Point3 at={c} color={C.p2} r={4} />
        </>
      );
    },
    info: ({ p }: any) => t`Plano $${fmt(p.a)}x + ${fmt(p.b)}y + z = ${fmt(p.d)}$ · normal $\vec n=(${fmt(p.a)},\,${fmt(p.b)},\,1)$`,
  },
});
