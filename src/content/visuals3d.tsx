import React from 'react';
import { Axes3, Line3, Poly3, type V3 } from '../components/visuals/Space3D';
import { C } from '../theme';

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
      <Axes3 size={0.01} labels={false} />
      <Poly3 pts={bottom1} color={C.p2} opacity={0.15} />
      <Poly3 pts={top1} color={C.p2} opacity={0.3} />
      {bottom1.map((p, i) => (i % 4 === 0 ? <Line3 key={'c' + i} a={p} b={top1[i]} color={C.p2} width={1.5} /> : null))}
      <Poly3 pts={bottom2} color={C.p3} opacity={0.2} />
      {bottom2.map((p, i) => (i % 4 === 0 ? <Line3 key={'k' + i} a={p} b={apex} color={C.p3} width={1.5} /> : null))}
    </>
  );
}
