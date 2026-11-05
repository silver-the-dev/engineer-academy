import React from 'react';
import { Arrow3, Axes3, Line3, Point3, Poly3, type V3 } from '../components/visuals/Space3D';
import { C } from '../theme';
import type { VisualSpec } from './types';
import { fmt } from '../lib/random';

const t = String.raw;

/** Cylinder (radius 1.5) next to a cone of same base/height. */
export function cylinder(h: number) {
  const n = 28;
  const r = 1.5;
  const ring = (z: number, cx: number): V3[] => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((2 * Math.PI * i) / n), r * Math.sin((2 * Math.PI * i) / n), z] as V3);
  const cx1 = -2;
  const cx2 = 2;
  const bottom1 = ring(0, cx1);
  const top1 = ring(h, cx1);
  const bottom2 = ring(0, cx2);
  const apex: V3 = [cx2, 0, h];
  return (
    <>
      <Poly3 pts={bottom1} color={C.p2} opacity={0.15} />
      <Poly3 pts={top1} color={C.p2} opacity={0.3} />
      {bottom1.map((p, i) => (i % 4 === 0 ? <Line3 key={'c' + i} a={p} b={top1[i]} color={C.p2} width={1.5} /> : null))}
      <Poly3 pts={bottom2} color={C.p3} opacity={0.2} />
      {bottom2.map((p, i) => (i % 4 === 0 ? <Line3 key={'k' + i} a={p} b={apex} color={C.p3} width={1.5} /> : null))}
    </>
  );
}

/** Wireframe surface z=f(x,y) with a point (x0,y0) and its x/y slices. */
export const surfaceLab = (f: (x: number, y: number) => number, fx: (x: number, y: number) => number, fy: (x: number, y: number) => number, R = 2, texF = 'f'): VisualSpec => ({
  name: 'space3d',
  props: {
    scale: 30,
    params: [
      { key: 'x', label: 'x_0', min: -R, max: R, step: 0.1, value: 0.8, color: '#FF6B6B' },
      { key: 'y', label: 'y_0', min: -R, max: R, step: 0.1, value: 0.5, color: '#51CF66' },
    ],
    render: ({ p }: any) => {
      const n = 10;
      const lines: React.ReactNode[] = [];
      for (let i = 0; i <= n; i++) {
        const u = -R + (2 * R * i) / n;
        const ptsX: V3[] = [];
        const ptsY: V3[] = [];
        for (let j = 0; j <= 24; j++) {
          const v = -R + (2 * R * j) / 24;
          ptsX.push([u, v, f(u, v)]);
          ptsY.push([v, u, f(v, u)]);
        }
        for (let j = 0; j < 24; j++) {
          lines.push(<Line3 key={`a${i}-${j}`} a={ptsX[j]} b={ptsX[j + 1]} color={C.p1} width={1} />);
          lines.push(<Line3 key={`b${i}-${j}`} a={ptsY[j]} b={ptsY[j + 1]} color={C.p1} width={1} />);
        }
      }
      const z0 = f(p.x, p.y);
      const sx: React.ReactNode[] = [];
      const sy: React.ReactNode[] = [];
      for (let j = 0; j < 30; j++) {
        const a = -R + (2 * R * j) / 30;
        const b = -R + (2 * R * (j + 1)) / 30;
        sx.push(<Line3 key={'sx' + j} a={[a, p.y, f(a, p.y)]} b={[b, p.y, f(b, p.y)]} color="#FF6B6B" width={3} />);
        sy.push(<Line3 key={'sy' + j} a={[p.x, a, f(p.x, a)]} b={[p.x, b, f(p.x, b)]} color="#51CF66" width={3} />);
      }
      const gx = fx(p.x, p.y);
      const gy = fy(p.x, p.y);
      return (
        <>
          <Axes3 size={R + 0.8} />
          {lines}
          {sx}
          {sy}
          <Line3 a={[p.x - 0.6, p.y, z0 - 0.6 * gx]} b={[p.x + 0.6, p.y, z0 + 0.6 * gx]} color={C.gold} width={3} />
          <Line3 a={[p.x, p.y - 0.6, z0 - 0.6 * gy]} b={[p.x, p.y + 0.6, z0 + 0.6 * gy]} color={C.gold} width={3} />
          <Point3 at={[p.x, p.y, z0]} color={C.gold} r={6} />
        </>
      );
    },
    info: ({ p }: any) => t`$${texF}(${fmt(p.x, 1)},\,${fmt(p.y, 1)})=${fmt(f(p.x, p.y), 2)}$ · $\frac{\partial ${texF}}{\partial x}=${fmt(fx(p.x, p.y), 2)}$ (vermelho) · $\frac{\partial ${texF}}{\partial y}=${fmt(fy(p.x, p.y), 2)}$ (verde)`,
  },
});

/** Columns over a rectangle approximating a double integral. */
export const doubleIntegralLab = (f: (x: number, y: number) => number, a: number, b: number, c: number, d: number, exact: number): VisualSpec => ({
  name: 'space3d',
  props: {
    scale: 34,
    initialYaw: -0.9,
    initialPitch: 0.5,
    params: [{ key: 'n', label: 'n', min: 1, max: 8, step: 1, value: 3, color: C.p2 }],
    render: ({ p }: any) => {
      const n = p.n;
      const hx = (b - a) / n;
      const hy = (d - c) / n;
      const boxes: React.ReactNode[] = [];
      const cells: { x0: number; y0: number; h: number }[] = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) cells.push({ x0: a + i * hx, y0: c + j * hy, h: f(a + (i + 0.5) * hx, c + (j + 0.5) * hy) });
      // painter: far first (larger y, smaller x)
      cells.sort((u, v) => v.y0 - u.y0 || u.x0 - v.x0);
      cells.forEach((q, k) => {
        const x1 = q.x0 + hx * 0.92;
        const y1 = q.y0 + hy * 0.92;
        const top: V3[] = [[q.x0, q.y0, q.h], [x1, q.y0, q.h], [x1, y1, q.h], [q.x0, y1, q.h]];
        const front: V3[] = [[q.x0, q.y0, 0], [x1, q.y0, 0], [x1, q.y0, q.h], [q.x0, q.y0, q.h]];
        const side: V3[] = [[x1, q.y0, 0], [x1, y1, 0], [x1, y1, q.h], [x1, q.y0, q.h]];
        boxes.push(<Poly3 key={'f' + k} pts={front} color={C.p2} opacity={0.55} stroke={C.bgDeep} />);
        boxes.push(<Poly3 key={'s' + k} pts={side} color={C.p1} opacity={0.55} stroke={C.bgDeep} />);
        boxes.push(<Poly3 key={'t' + k} pts={top} color={C.cyan} opacity={0.75} stroke={C.bgDeep} />);
      });
      return (
        <>
          <Axes3 size={3.2} />
          {boxes}
        </>
      );
    },
    info: ({ p }: any) => {
      const n = p.n;
      const hx = (b - a) / n;
      const hy = (d - c) / n;
      let s = 0;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += f(a + (i + 0.5) * hx, c + (j + 0.5) * hy) * hx * hy;
      return t`Soma das colunas ($${n * n}$): $${fmt(s, 4)}$ · integral exata: $${fmt(exact, 4)}$`;
    },
  },
});

/** Level curves of f with draggable point and gradient arrow. */
export { Arrow3 };
