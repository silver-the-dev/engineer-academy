import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcqS, num, tf, match, order, inter, plot, near } from '../../helpers';
import { ArcW, CircleW, InfLine, Label, PolygonW, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt } from '../../../lib/random';

const t = String.raw;
const PI = Math.PI;
const deg = (r: number) => (r * 180) / PI;
type P2 = { x: number; y: number };
const dist = (a: P2, b: P2) => Math.hypot(a.x - b.x, a.y - b.y);
const angAt = (v: P2, a: P2, b: P2) => {
  const ux = a.x - v.x, uy = a.y - v.y, wx = b.x - v.x, wy = b.y - v.y;
  const c = (ux * wx + uy * wy) / (Math.hypot(ux, uy) * Math.hypot(wx, wy) || 1);
  return Math.acos(Math.max(-1, Math.min(1, c)));
};
const circumcenter = (A: P2, B: P2, Cc: P2): P2 => {
  const d = 2 * (A.x * (B.y - Cc.y) + B.x * (Cc.y - A.y) + Cc.x * (A.y - B.y)) || 1e-9;
  const a2 = A.x ** 2 + A.y ** 2, b2 = B.x ** 2 + B.y ** 2, c2 = Cc.x ** 2 + Cc.y ** 2;
  return { x: (a2 * (B.y - Cc.y) + b2 * (Cc.y - A.y) + c2 * (A.y - B.y)) / d, y: (a2 * (Cc.x - B.x) + b2 * (A.x - Cc.x) + c2 * (B.x - A.x)) / d };
};
const onCircle = (R: number, cx = 0, cy = 0) => (_: string, x: number, y: number) => {
  const a = Math.atan2(y - cy, x - cx);
  return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
};

/* ---------------- labs ---------------- */

/** Two parallels cut by a transversal: alternate/corresponding angles. */
const parallelLab = () =>
  plot({
    view: { xMin: -4, xMax: 4, yMin: -3, yMax: 3 },
    equalAspect: true,
    grid: false,
    params: [{ key: 'a', label: '\\alpha', min: 20, max: 160, step: 5, value: 60, color: C.gold, format: (v: number) => v + '°' }],
    render: ({ p }: any) => {
      const a = (p.a * PI) / 180;
      const dx = Math.cos(a) / Math.sin(a);
      const P1 = { x: -dx, y: -1 };
      const P2 = { x: dx, y: 1 };
      return (
        <>
          <InfLine x1={-4} y1={1} x2={4} y2={1} color={C.p2} />
          <InfLine x1={-4} y1={-1} x2={4} y2={-1} color={C.p2} />
          <InfLine x1={P1.x} y1={P1.y} x2={P2.x} y2={P2.y} color={C.p5} />
          <ArcW cx={P2.x} cy={P2.y} r={0.45} a0={0} a1={a} color={C.gold} width={3} />
          <ArcW cx={P1.x} cy={P1.y} r={0.45} a0={0} a1={a} color={C.gold} width={3} />
          <ArcW cx={P1.x} cy={P1.y} r={0.6} a0={a} a1={PI} color={C.p4} width={3} />
          <ArcW cx={P2.x} cy={P2.y} r={0.6} a0={PI} a1={PI + a} color={C.gold} width={3} />
          <Label x={3.2} y={1.25} text="r" color={C.p2} />
          <Label x={3.2} y={-0.75} text="s" color={C.p2} />
        </>
      );
    },
    info: ({ p }: any) => t`$r\parallel s$ · correspondentes e alternos internos (amarelo): $${p.a}^\circ$ · colateral interno (verde): $${180 - p.a}^\circ$ — somam $180^\circ$`,
  });

/** Regular n-gon split into n − 2 triangles from one vertex. */
const polygonLab = () =>
  plot({
    view: { xMin: -2.6, xMax: 2.6, yMin: -2.6, yMax: 2.6 },
    equalAspect: true,
    grid: false,
    axes: false,
    tickLabels: false,
    params: [{ key: 'n', label: 'n', min: 3, max: 12, step: 1, value: 6, color: C.gold, format: (v: number) => String(v) }],
    render: ({ p }: any) => {
      const n = Math.round(p.n);
      const V: [number, number][] = Array.from({ length: n }, (_, i) => [2.2 * Math.cos(-PI / 2 + (2 * PI * i) / n), 2.2 * Math.sin(-PI / 2 + (2 * PI * i) / n)]);
      const cols = [C.p1, C.p2, C.p3, C.p4, C.p5, C.p6];
      return (
        <>
          {Array.from({ length: n - 2 }, (_, i) => (
            <PolygonW key={i} pts={[V[0], V[i + 1], V[i + 2]]} color={cols[i % cols.length]} opacity={0.35} stroke={C.text} strokeWidth={1.5} />
          ))}
          {V.map((v, i) => <Pt key={'v' + i} x={v[0]} y={v[1]} color={i === 0 ? C.gold : C.textMuted} r={i === 0 ? 6 : 4} />)}
        </>
      );
    },
    info: ({ p }: any) => {
      const n = Math.round(p.n);
      return t`$n=${n}$: $${n - 2}$ triângulos · $S_i=(${n}-2)\cdot180^\circ=${(n - 2) * 180}^\circ$ · ângulo interno do regular $=${fmt(((n - 2) * 180) / n, 1)}^\circ$ · diagonais $=\frac{${n}(${n}-3)}{2}=${(n * (n - 3)) / 2}$`;
    },
  });

/** Triangle with draggable vertices showing one notable point at a time. */
const notableLab = (mode0 = 0) =>
  plot({
    view: { xMin: -4, xMax: 4, yMin: -3, yMax: 3.5 },
    equalAspect: true,
    grid: false,
    points: [
      { id: 'A', x: -2.6, y: -1.6, color: C.p2, label: 'A' },
      { id: 'B', x: 2.8, y: -1.6, color: C.p2, label: 'B' },
      { id: 'C', x: 0.4, y: 2.4, color: C.p2, label: 'C' },
    ],
    params: [{ key: 'm', label: 'ponto', min: 0, max: 3, step: 1, value: mode0, color: C.gold, format: (v: number) => ['baricentro G', 'circuncentro O', 'incentro I', 'ortocentro H'][Math.round(v)] }],
    render: ({ p, pts }: any) => {
      const { A, B, C: Cc } = pts;
      const m = Math.round(p.m);
      const tri: [number, number][] = [[A.x, A.y], [B.x, B.y], [Cc.x, Cc.y]];
      const out: React.ReactNode[] = [<PolygonW key="t" pts={tri} color={C.p2} opacity={0.12} stroke={C.p2} />];
      const O = circumcenter(A, B, Cc);
      if (m === 0) {
        const G = { x: (A.x + B.x + Cc.x) / 3, y: (A.y + B.y + Cc.y) / 3 };
        [[A, B, Cc], [B, Cc, A], [Cc, A, B]].forEach(([v, u, w], i) => out.push(<Seg key={'md' + i} x1={v.x} y1={v.y} x2={(u.x + w.x) / 2} y2={(u.y + w.y) / 2} color={C.gold} width={1.8} />));
        out.push(<Pt key="G" x={G.x} y={G.y} color={C.gold} label="G" />);
      } else if (m === 1) {
        out.push(<CircleW key="cc" cx={O.x} cy={O.y} r={dist(O, A)} color={C.p5} width={2} />);
        [[A, B], [B, Cc], [Cc, A]].forEach(([u, w], i) => out.push(<Seg key={'mt' + i} x1={O.x} y1={O.y} x2={(u.x + w.x) / 2} y2={(u.y + w.y) / 2} color={C.p5} width={1.5} dash="5 4" />));
        out.push(<Pt key="O" x={O.x} y={O.y} color={C.p5} label="O" />);
      } else if (m === 2) {
        const a = dist(B, Cc), b = dist(A, Cc), c = dist(A, B), s = a + b + c;
        const I = { x: (a * A.x + b * B.x + c * Cc.x) / s, y: (a * A.y + b * B.y + c * Cc.y) / s };
        const area = Math.abs((B.x - A.x) * (Cc.y - A.y) - (Cc.x - A.x) * (B.y - A.y)) / 2;
        out.push(<CircleW key="ic" cx={I.x} cy={I.y} r={(2 * area) / s} color={C.p4} width={2} />);
        [A, B, Cc].forEach((v, i) => out.push(<Seg key={'bs' + i} x1={v.x} y1={v.y} x2={I.x} y2={I.y} color={C.p4} width={1.5} />));
        out.push(<Pt key="I" x={I.x} y={I.y} color={C.p4} label="I" />);
      } else {
        const H = { x: A.x + B.x + Cc.x - 2 * O.x, y: A.y + B.y + Cc.y - 2 * O.y };
        [A, B, Cc].forEach((v, i) => out.push(<Seg key={'h' + i} x1={v.x} y1={v.y} x2={H.x} y2={H.y} color={C.p3} width={1.5} dash="5 4" />));
        out.push(<Pt key="H" x={H.x} y={H.y} color={C.p3} label="H" />);
      }
      return <>{out}</>;
    },
    info: ({ pts }: any) => {
      const { A, B, C: Cc } = pts;
      const a = deg(angAt(A, B, Cc)), b = deg(angAt(B, A, Cc)), c = deg(angAt(Cc, A, B));
      return t`$\hat A=${fmt(a, 0)}^\circ$, $\hat B=${fmt(b, 0)}^\circ$, $\hat C=${fmt(c, 0)}^\circ$ (soma $${fmt(a + b + c, 0)}^\circ$) · G: medianas · O: mediatrizes · I: bissetrizes · H: alturas`;
    },
  });

/** Triangle inequality: build a triangle with sides a, b on base c. */
const inequalityLab = () =>
  plot({
    view: { xMin: -1, xMax: 9, yMin: -1.5, yMax: 6 },
    equalAspect: true,
    grid: false,
    params: [
      { key: 'a', label: 'a', min: 1, max: 7, step: 0.5, value: 3, color: C.p2 },
      { key: 'b', label: 'b', min: 1, max: 7, step: 0.5, value: 4, color: C.p5 },
      { key: 'c', label: 'c', min: 2, max: 8, step: 0.5, value: 6, color: C.gold },
    ],
    render: ({ p }: any) => {
      const { a, b, c } = p;
      const ok = a + b > c && a + c > b && b + c > a;
      const x = (b * b - a * a + c * c) / (2 * c);
      const y2 = b * b - x * x;
      return (
        <>
          <Seg x1={0} y1={0} x2={c} y2={0} color={C.gold} width={4} />
          <ArcW cx={0} cy={0} r={b} a0={0} a1={PI} color={C.p5} width={1.2} />
          <ArcW cx={c} cy={0} r={a} a0={0} a1={PI} color={C.p2} width={1.2} />
          {ok && y2 > 0 ? (
            <>
              <Seg x1={0} y1={0} x2={x} y2={Math.sqrt(y2)} color={C.p5} width={4} />
              <Seg x1={c} y1={0} x2={x} y2={Math.sqrt(y2)} color={C.p2} width={4} />
              <Pt x={x} y={Math.sqrt(y2)} color={C.success} />
            </>
          ) : null}
        </>
      );
    },
    info: ({ p }: any) => {
      const { a, b, c } = p;
      const ok = a + b > c && a + c > b && b + c > a;
      return ok ? t`Fecha! Cada lado é menor que a soma dos outros dois: $${fmt(c, 1)}<${fmt(a + b, 1)}$` : t`Não fecha: os arcos não se encontram. Precisa de cada lado $<$ soma dos outros dois.`;
    },
  });

/** Thales: three parallels cut by two transversals with draggable ends. */
const thalesLab = () =>
  plot({
    view: { xMin: -4, xMax: 4, yMin: -0.6, yMax: 4.6 },
    grid: false,
    params: [{ key: 'h', label: 'reta do meio', min: 0.5, max: 3.5, step: 0.1, value: 1.5, color: C.p2 }],
    points: [
      { id: 'P', x: -3, y: 0, color: C.p5, label: 'r₁' },
      { id: 'Q', x: -1, y: 4, color: C.p5 },
      { id: 'R', x: 1, y: 0, color: C.gold, label: 'r₂' },
      { id: 'S', x: 3.4, y: 4, color: C.gold },
    ],
    constrain: (id: string, x: number) => ({ x, y: id === 'P' || id === 'R' ? 0 : 4 }),
    render: ({ p, pts }: any) => {
      const mid = (U: P2, W: P2) => ({ x: U.x + ((W.x - U.x) * p.h) / 4, y: p.h });
      const M1 = mid(pts.P, pts.Q);
      const M2 = mid(pts.R, pts.S);
      return (
        <>
          <InfLine x1={-4} y1={0} x2={4} y2={0} color={C.p2} />
          <InfLine x1={-4} y1={p.h} x2={4} y2={p.h} color={C.p2} />
          <InfLine x1={-4} y1={4} x2={4} y2={4} color={C.p2} />
          <Seg x1={pts.P.x} y1={0} x2={pts.Q.x} y2={4} color={C.p5} width={3} />
          <Seg x1={pts.R.x} y1={0} x2={pts.S.x} y2={4} color={C.gold} width={3} />
          <Pt x={M1.x} y={M1.y} color={C.p5} r={5} />
          <Pt x={M2.x} y={M2.y} color={C.gold} r={5} />
        </>
      );
    },
    info: ({ p, pts }: any) => {
      const L1 = Math.hypot(pts.Q.x - pts.P.x, 4);
      const L2 = Math.hypot(pts.S.x - pts.R.x, 4);
      const k = p.h / (4 - p.h);
      return t`Na rosa: $\frac{AB}{BC}=\frac{${fmt((L1 * p.h) / 4, 2)}}{${fmt((L1 * (4 - p.h)) / 4, 2)}}=${fmt(k, 2)}$ · na amarela: $\frac{${fmt((L2 * p.h) / 4, 2)}}{${fmt((L2 * (4 - p.h)) / 4, 2)}}=${fmt(k, 2)}$ — **mesma razão**`;
    },
  });

/** Similar triangles: ratio k multiplies lengths by k and areas by k². */
const similarLab = () =>
  plot({
    view: { xMin: -0.5, xMax: 9, yMin: -0.5, yMax: 6 },
    equalAspect: true,
    grid: false,
    params: [{ key: 'k', label: 'k', min: 0.5, max: 3, step: 0.1, value: 2, color: C.gold }],
    render: ({ p }: any) => (
      <>
        <PolygonW pts={[[0, 0], [2, 0], [0.6, 1.6]]} color={C.p2} opacity={0.45} stroke={C.p2} />
        <PolygonW pts={[[2.6, 0], [2.6 + 2 * p.k, 0], [2.6 + 0.6 * p.k, 1.6 * p.k]]} color={C.gold} opacity={0.3} stroke={C.gold} />
      </>
    ),
    info: ({ p }: any) => t`razão $k=${fmt(p.k, 1)}$ · lados e perímetro $\times${fmt(p.k, 1)}$ · área $\times k^2=${fmt(p.k * p.k, 2)}$`,
  });

/** Central vs inscribed angle over the same arc AB. */
const inscribedLab = () =>
  plot({
    view: { xMin: -2.8, xMax: 2.8, yMin: -2.8, yMax: 2.8 },
    equalAspect: true,
    grid: false,
    points: [
      { id: 'A', x: 2 * Math.cos(-0.5), y: 2 * Math.sin(-0.5), color: C.p2, label: 'A' },
      { id: 'B', x: 2 * Math.cos(1.2), y: 2 * Math.sin(1.2), color: C.p2, label: 'B' },
      { id: 'P', x: 2 * Math.cos(3.6), y: 2 * Math.sin(3.6), color: C.gold, label: 'P' },
    ],
    constrain: onCircle(2),
    render: ({ pts }: any) => {
      const { A, B, P } = pts;
      return (
        <>
          <CircleW cx={0} cy={0} r={2} color={C.textDim} width={2} />
          <Seg x1={0} y1={0} x2={A.x} y2={A.y} color={C.p5} width={2.5} />
          <Seg x1={0} y1={0} x2={B.x} y2={B.y} color={C.p5} width={2.5} />
          <Seg x1={P.x} y1={P.y} x2={A.x} y2={A.y} color={C.gold} width={2.5} />
          <Seg x1={P.x} y1={P.y} x2={B.x} y2={B.y} color={C.gold} width={2.5} />
          <Pt x={0} y={0} color={C.p5} r={4} label="O" />
        </>
      );
    },
    info: ({ pts }: any) => {
      const { A, B, P } = pts;
      const O = { x: 0, y: 0 };
      return t`central $\angle AOB=${fmt(deg(angAt(O, A, B)), 0)}^\circ$ · inscrito $\angle APB=${fmt(deg(angAt(P, A, B)), 0)}^\circ$ (metade, se P está no arco maior)`;
    },
  });

/** Right triangle inscribed in a semicircle: h² = m·n. */
const metricLab = () =>
  plot({
    view: { xMin: -0.5, xMax: 6.5, yMin: -0.8, yMax: 3.6 },
    equalAspect: true,
    grid: false,
    points: [{ id: 'A', x: 2, y: Math.sqrt(9 - 1), color: C.gold, label: 'A' }],
    constrain: (_: string, x: number, y: number) => {
      const a = Math.max(0.15, Math.min(PI - 0.15, Math.atan2(Math.max(y, 0.01), x - 3)));
      return { x: 3 + 3 * Math.cos(a), y: 3 * Math.sin(a) };
    },
    render: ({ pts }: any) => {
      const A = pts.A;
      return (
        <>
          <ArcW cx={3} cy={0} r={3} a0={0} a1={PI} color={C.textDim} width={1.2} />
          <PolygonW pts={[[0, 0], [6, 0], [A.x, A.y]]} color={C.p2} opacity={0.15} stroke={C.p2} />
          <Seg x1={A.x} y1={A.y} x2={A.x} y2={0} color={C.gold} width={3} />
          <Seg x1={0} y1={0} x2={A.x} y2={0} color={C.p5} width={5} />
          <Seg x1={A.x} y1={0} x2={6} y2={0} color={C.p4} width={5} />
          <Label x={A.x / 2} y={-0.45} text="m" color={C.p5} anchor="middle" />
          <Label x={(A.x + 6) / 2} y={-0.45} text="n" color={C.p4} anchor="middle" />
          <Label x={A.x + 0.15} y={A.y / 2} text="h" color={C.gold} />
        </>
      );
    },
    info: ({ pts }: any) => {
      const m = pts.A.x, n = 6 - pts.A.x, h = pts.A.y;
      return t`$a=m+n=6$ · $m=${fmt(m, 2)}$, $n=${fmt(n, 2)}$ · $h^2=${fmt(h * h, 2)}$ e $m\cdot n=${fmt(m * n, 2)}$ · o ângulo em A é sempre $90^\circ$`;
    },
  });

/** Power of a point: PA · PB is the same for every line through P. */
const powerLab = () =>
  plot({
    view: { xMin: -3.5, xMax: 4.5, yMin: -3, yMax: 3 },
    equalAspect: true,
    grid: false,
    params: [{ key: 'th', label: '\\theta', min: 0, max: 175, step: 5, value: 30, color: C.gold, format: (v: number) => v + '°' }],
    points: [{ id: 'P', x: 0.8, y: 0.3, color: C.p5, label: 'P' }],
    render: ({ p, pts }: any) => {
      const R = 2;
      const P = pts.P;
      const th = (p.th * PI) / 180;
      const ux = Math.cos(th), uy = Math.sin(th);
      const bq = P.x * ux + P.y * uy;
      const cq = P.x * P.x + P.y * P.y - R * R;
      const disc = bq * bq - cq;
      const out: React.ReactNode[] = [<CircleW key="c" cx={0} cy={0} r={R} color={C.p2} width={2.5} />];
      if (disc > 0) {
        const t1 = -bq - Math.sqrt(disc), t2 = -bq + Math.sqrt(disc);
        const A = { x: P.x + t1 * ux, y: P.y + t1 * uy }, B = { x: P.x + t2 * ux, y: P.y + t2 * uy };
        out.push(<Seg key="ab" x1={A.x} y1={A.y} x2={B.x} y2={B.y} color={C.gold} width={3} />);
        if (cq > 0) out.push(<Seg key="pa" x1={P.x} y1={P.y} x2={A.x} y2={A.y} color={C.gold} width={3} dash="5 4" />);
        out.push(<Pt key="A" x={A.x} y={A.y} color={C.gold} r={5} label="A" />, <Pt key="B" x={B.x} y={B.y} color={C.gold} r={5} label="B" />);
      }
      return <>{out}</>;
    },
    info: ({ p, pts }: any) => {
      const P = pts.P;
      const th = (p.th * PI) / 180;
      const bq = P.x * Math.cos(th) + P.y * Math.sin(th);
      const cq = P.x * P.x + P.y * P.y - 4;
      const disc = bq * bq - cq;
      if (disc <= 0) return 'Gire a reta até ela cortar a circunferência.';
      const t1 = -bq - Math.sqrt(disc), t2 = -bq + Math.sqrt(disc);
      return t`$PA\cdot PB=${fmt(Math.abs(t1 * t2), 2)}$ · $|OP^2-R^2|=${fmt(Math.abs(cq), 2)}$ — não depende do ângulo!`;
    },
  });

/* ---------------- unit ---------------- */

export const geoPlana: UnitDef = {
  id: 'f-gplan',
  title: 'Geometria plana',
  subtitle: 'Ângulos, triângulos, semelhança e circunferência',
  icon: '📏',
  guide: t`Paralelas cortadas por transversal geram ângulos iguais (alternos, correspondentes) ou suplementares (colaterais). Polígono de $n$ lados: soma interna $(n-2)\cdot180^\circ$, externa $360^\circ$. Triângulos semelhantes têm ângulos iguais e lados proporcionais: comprimentos $\times k$, áreas $\times k^2$. Na circunferência, o ângulo inscrito vale **metade** do central; no triângulo retângulo, $h^2=mn$, $b^2=an$, $c^2=am$.`,
  lessons: [
    {
      id: 'f-gplan-ang',
      title: 'Ângulos, paralelas e polígonos',
      parts: [
        {
          card: [
            {
              title: 'Pares de ângulos',
              body: t`• **Complementares**: somam $90^\circ$. • **Suplementares**: somam $180^\circ$.
• **Opostos pelo vértice**: são **iguais**.

Duas paralelas $r\parallel s$ cortadas por uma transversal formam 8 ângulos com só **dois valores**: $\alpha$ e $180^\circ-\alpha$.
• **Correspondentes** e **alternos** (internos ou externos): iguais.
• **Colaterais** (do mesmo lado): suplementares.`,
              visual: parallelLab(),
            },
          ],
          exercises: [
            gen((rng) => {
              const a = randInt(rng, 10, 80);
              return num(`Qual o complemento de ${a}°?`, 90 - a, `${a}° + ${90 - a}° = 90°.`, { unit: '°' });
            }),
            gen((rng) => {
              const a = randInt(rng, 20, 160);
              return num(`Qual o suplemento de ${a}°?`, 180 - a, `${a}° + ${180 - a}° = 180°.`, { unit: '°' });
            }),
            tf('Ângulos opostos pelo vértice são sempre suplementares.', false, 'São sempre iguais (congruentes). Os adjacentes sobre uma reta é que são suplementares.'),
            gen((rng) => {
              const a = randInt(rng, 25, 155);
              const kind = pick(rng, ['alterno interno', 'correspondente', 'colateral interno', 'alterno externo']);
              const ans = kind === 'colateral interno' ? 180 - a : a;
              return num(`Duas paralelas são cortadas por uma transversal, formando um ângulo de ${a}°. Quanto mede o seu ângulo ${kind}?`, ans, kind === 'colateral interno' ? 'Colaterais são suplementares.' : 'Alternos e correspondentes são iguais.', { unit: '°' });
            }),
            inter('Gire a transversal até os ângulos colaterais internos (verde e amarelo) ficarem iguais.', 'plot', parallelLab().props, (v) => v.p.a === 90, 'α = 90°', 'Iguais e suplementares ao mesmo tempo ⇒ 90° cada: a transversal é perpendicular.'),
            gen((rng) => {
              const x = randInt(rng, 12, 40);
              const k = randInt(rng, 2, 3);
              return num(t`Dois ângulos alternos internos medem $${k}x+${10}^\circ$ e $${k + 1}x-${x - 10}^\circ$. Quanto vale $x$?`, x, t`Alternos internos são iguais: $${k}x+10=${k + 1}x-${x - 10}\Rightarrow x=${x}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 5, 40);
              return num(t`O complemento de um ângulo excede-o em $${2 * a}^\circ$. Quanto mede o ângulo?`, 45 - a, t`$(90-x)-x=${2 * a}\Rightarrow 2x=${90 - 2 * a}\Rightarrow x=${45 - a}^\circ$.`, { unit: '°' });
            }),
            match('Associe a posição ao que vale para os dois ângulos (paralelas + transversal).', [['correspondentes', 'iguais'], ['colaterais internos', 'somam 180°'], ['opostos pelo vértice', 'iguais, em qualquer par de retas'], ['complementares', 'somam 90°']], 'Só os colaterais (mesmo lado, mesma região) somam 180°.'),
          ],
        },
        {
          card: {
            title: 'Soma dos ângulos de um polígono',
            body: t`Num triângulo, $\hat A+\hat B+\hat C=180^\circ$ (trace por um vértice a paralela ao lado oposto e use alternos internos). De um vértice de um polígono de $n$ lados saem $n-3$ diagonais, que o dividem em $n-2$ triângulos:

$$S_i=(n-2)\cdot180^\circ \qquad S_e=360^\circ \qquad d=\frac{n(n-3)}{2}$$

No polígono **regular**, cada ângulo interno vale $\frac{(n-2)\cdot180^\circ}{n}$ e cada externo $\frac{360^\circ}{n}$.`,
            visual: polygonLab(),
            tip: 'A soma dos externos é sempre 360°: andando ao redor do polígono, você dá exatamente uma volta.',
          },
          exercises: [
            gen((rng) => {
              const a = randInt(rng, 30, 90);
              const b = randInt(rng, 20, 150 - a);
              return num(`Um triângulo tem ângulos de ${a}° e ${b}°. Quanto mede o terceiro?`, 180 - a - b, `180 − ${a} − ${b} = ${180 - a - b}.`, { unit: '°' });
            }),
            gen((rng) => {
              const n = randInt(rng, 5, 15);
              return num(`Soma dos ângulos internos de um polígono de ${n} lados:`, (n - 2) * 180, `(${n} − 2)·180° = ${(n - 2) * 180}°.`, { unit: '°' });
            }),
            gen((rng) => {
              const n = pick(rng, [5, 6, 8, 9, 10, 12, 15, 18, 20]);
              return num(`Ângulo interno de um polígono regular de ${n} lados:`, ((n - 2) * 180) / n, `(${n} − 2)·180°/${n} = ${fmt(((n - 2) * 180) / n, 2)}°.`, { unit: '°' });
            }),
            gen((rng) => {
              const n = randInt(rng, 5, 20);
              return num(`Quantas diagonais tem um polígono convexo de ${n} lados?`, (n * (n - 3)) / 2, `n(n − 3)/2 = ${n}·${n - 3}/2 = ${(n * (n - 3)) / 2}.`);
            }),
            gen((rng) => {
              const n = pick(rng, [5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36]);
              return num(`Um polígono regular tem ângulo externo de ${fmt(360 / n, 2)}°. Quantos lados ele tem?`, n, `Externos somam 360°: n = 360/${fmt(360 / n, 2)} = ${n}.`);
            }),
            inter('Escolha o polígono regular cujo ângulo interno é 120°.', 'plot', polygonLab().props, (v) => Math.round(v.p.n) === 6, 'n = 6 (hexágono)', '(n − 2)·180/n = 120 ⇒ n = 6.'),
            tf('Todo polígono convexo tem soma dos ângulos externos igual a 360°, qualquer que seja n.', true, 'Interno + externo = 180° em cada vértice: n·180 − (n − 2)·180 = 360°.'),
            gen((rng) => {
              const n = pick(rng, [5, 6, 7, 8, 9, 10, 11, 12]);
              const S = (n - 2) * 180;
              return num(`A soma dos ângulos internos de um polígono é ${S}°. Quantos lados ele tem?`, n, `(n − 2)·180 = ${S} ⇒ n − 2 = ${n - 2} ⇒ n = ${n}.`);
            }),
            mcqS('Por que não existe polígono regular com ângulo interno de 100°?', '360/(180 − 100) = 4,5 não é inteiro', ['100 não divide 360', 'ângulos internos são sempre maiores que 108°', 'todo polígono regular tem ângulo interno múltiplo de 60°'], 'O externo seria 80° e n = 360/80 = 4,5 lados — impossível.'),
          ],
        },
      ],
    },
    {
      id: 'f-gplan-tri',
      title: 'Triângulos: congruência e pontos notáveis',
      parts: [
        {
          card: [
            {
              title: 'Desigualdade triangular e ângulo externo',
              body: t`Três segmentos $a$, $b$, $c$ formam triângulo se e só se **cada um é menor que a soma dos outros dois** (basta checar o maior: $c<a+b$).

**Ângulo externo**: vale a soma dos dois internos não adjacentes. E no triângulo, ao **maior lado** opõe-se o **maior ângulo**.`,
              visual: inequalityLab(),
            },
            {
              title: 'Casos de congruência',
              body: t`Dois triângulos são congruentes (iguais, a menos de posição) se têm:
• **LLL**: três lados iguais;
• **LAL**: dois lados e o ângulo **entre** eles;
• **ALA**: dois ângulos e o lado entre eles;
• **LAA$_o$**: um lado, um ângulo adjacente e o oposto.

**LLA não serve**: dois lados e um ângulo não compreendido podem dar dois triângulos diferentes.`,
            },
          ],
          exercises: [
            mcqS('Com quais medidas é possível formar um triângulo?', '5, 7 e 10', ['2, 3 e 6', '4, 4 e 8', '1, 9 e 11'], '10 < 5 + 7 = 12. Nos outros, o maior lado é ≥ soma dos outros.'),
            gen((rng) => {
              const a = randInt(rng, 3, 9);
              const b = randInt(rng, a, 12);
              return num(`Dois lados de um triângulo medem ${a} e ${b}. Qual o maior valor inteiro possível para o terceiro lado?`, a + b - 1, `O terceiro lado c precisa de ${b - a} < c < ${a + b}; maior inteiro: ${a + b - 1}.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 3, 9);
              const b = randInt(rng, a + 1, 13);
              return num(`Dois lados de um triângulo medem ${a} e ${b}. Qual o menor valor inteiro possível para o terceiro lado?`, b - a + 1, `Precisa de c > ${b} − ${a} = ${b - a}; menor inteiro: ${b - a + 1}.`);
            }),
            inter('Ajuste a, b e c para os arcos NÃO se encontrarem (triângulo impossível).', 'plot', inequalityLab().props, (v) => !(v.p.a + v.p.b > v.p.c && v.p.a + v.p.c > v.p.b && v.p.b + v.p.c > v.p.a), 'por exemplo a = 2, b = 2, c = 6', 'Quando um lado é ≥ soma dos outros dois, os arcos não se cruzam.'),
            gen((rng) => {
              const a = randInt(rng, 30, 70);
              const b = randInt(rng, 30, 70);
              return num(`Num triângulo, dois ângulos internos medem ${a}° e ${b}°. Quanto mede o ângulo externo no terceiro vértice?`, a + b, `Ângulo externo = soma dos internos não adjacentes = ${a + b}°.`, { unit: '°' });
            }),
            match('Associe o caso ao que ele exige.', [['LLL', 'três lados'], ['LAL', 'dois lados e o ângulo entre eles'], ['ALA', 'dois ângulos e o lado entre eles'], ['LAAₒ', 'lado, ângulo adjacente e ângulo oposto']], 'São os quatro casos válidos de congruência.'),
            tf('Dois triângulos com os três ângulos iguais são sempre congruentes.', false, 'AAA garante semelhança, não congruência: um pode ser ampliação do outro.'),
            tf('Num triângulo isósceles, os ângulos da base são iguais.', true, 'Lados iguais opõem-se a ângulos iguais (prova por LAL com a bissetriz do vértice).'),
            gen((rng) => {
              const v = randInt(rng, 20, 140);
              return num(`Num triângulo isósceles, o ângulo do vértice (entre os lados iguais) mede ${v}°. Quanto mede cada ângulo da base?`, (180 - v) / 2, `(180 − ${v})/2 = ${fmt((180 - v) / 2, 1)}°.`, { unit: '°' });
            }),
          ],
        },
        {
          card: {
            title: 'Os quatro pontos notáveis',
            body: t`• **Baricentro G**: encontro das **medianas** (vértice → ponto médio do lado oposto). Divide cada mediana na razão **2 : 1** a partir do vértice. É o centro de massa de uma placa triangular.
• **Circuncentro O**: encontro das **mediatrizes**; centro da circunferência **circunscrita** (equidista dos vértices).
• **Incentro I**: encontro das **bissetrizes**; centro da circunferência **inscrita** (equidista dos lados).
• **Ortocentro H**: encontro das **alturas**.`,
            visual: notableLab(0),
            tip: 'No triângulo retângulo, o circuncentro é o ponto médio da hipotenusa e o ortocentro é o vértice do ângulo reto.',
          },
          exercises: [
            match('Associe o ponto notável às cevianas/retas que o definem.', [['baricentro', 'medianas'], ['circuncentro', 'mediatrizes'], ['incentro', 'bissetrizes'], ['ortocentro', 'alturas']], 'Bari ↔ medianas, circun ↔ mediatrizes, in ↔ bissetrizes, orto ↔ alturas.'),
            gen((rng) => {
              const m = 3 * randInt(rng, 2, 10);
              return num(`Uma mediana mede ${m} cm. Qual a distância do baricentro ao vértice?`, (2 * m) / 3, `G divide a mediana em 2 : 1 a partir do vértice: (2/3)·${m} = ${(2 * m) / 3}.`, { unit: 'cm' });
            }),
            gen((rng) => {
              const pts: [number, number][] = [[randInt(rng, -5, 5), randInt(rng, -5, 5)], [randInt(rng, -5, 5), randInt(rng, -5, 5)], [randInt(rng, -5, 5), randInt(rng, -5, 5)]];
              const sx = pts[0][0] + pts[1][0] + pts[2][0];
              return num(t`Triângulo de vértices $(${pts[0][0]},\,${pts[0][1]})$, $(${pts[1][0]},\,${pts[1][1]})$ e $(${pts[2][0]},\,${pts[2][1]})$. Qual a abscissa do baricentro?`, sx / 3, t`$x_G=\frac{x_A+x_B+x_C}{3}=\frac{${sx}}{3}$.`, { tol: 0.01 });
            }),
            mcqS('O centro da circunferência que passa pelos três vértices é o:', 'circuncentro', ['incentro', 'baricentro', 'ortocentro'], 'Está nas mediatrizes, que equidistam dos extremos de cada lado.'),
            mcqS('Para instalar um poste equidistante de três casas (não alinhadas), devemos usar o:', 'circuncentro do triângulo das casas', ['incentro', 'baricentro', 'ortocentro'], 'Equidistante dos vértices ⇒ circuncentro.'),
            inter('Mova os vértices até o circuncentro O cair FORA do triângulo.', 'plot', notableLab(1).props, (v) => {
              const { A, B, C: Cc } = v.pts;
              return Math.max(angAt(A, B, Cc), angAt(B, A, Cc), angAt(Cc, A, B)) > PI / 2 + 0.02;
            }, 'deixe um ângulo obtuso (> 90°)', 'O circuncentro está fora exatamente quando o triângulo é obtusângulo (e na hipotenusa se for retângulo).'),
            tf('No triângulo equilátero, baricentro, circuncentro, incentro e ortocentro coincidem.', true, 'Por simetria, mediana, mediatriz, bissetriz e altura de cada lado são a mesma reta.'),
            gen((rng) => {
              const a = 2 * randInt(rng, 3, 12);
              return num(`Num triângulo retângulo, a hipotenusa mede ${a}. Qual o raio da circunferência circunscrita?`, a / 2, `O circuncentro é o ponto médio da hipotenusa: R = ${a}/2 = ${a / 2}.`);
            }),
            gen((rng) => {
              const [a, b, c] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]]);
              return num(`Triângulo retângulo de catetos ${a} e ${b} (hipotenusa ${c}). Qual o raio da circunferência inscrita? (r = área/semiperímetro)`, (a * b) / (a + b + c), `Área = ${(a * b) / 2}, semiperímetro = ${(a + b + c) / 2}; r = ${(a * b) / 2}/${(a + b + c) / 2} = ${(a * b) / (a + b + c)}.`);
            }),
          ],
        },
      ],
    },
    {
      id: 'f-gplan-sem',
      title: 'Tales e semelhança',
      parts: [
        {
          card: {
            title: 'Teorema de Tales',
            body: t`Um feixe de **retas paralelas** cortado por duas transversais determina segmentos **proporcionais**:

$$\frac{AB}{BC}=\frac{A'B'}{B'C'}$$

Consequência — **teorema da bissetriz interna**: a bissetriz do ângulo $A$ divide o lado oposto em partes proporcionais aos lados adjacentes: $\frac{BD}{DC}=\frac{AB}{AC}$.`,
            visual: thalesLab(),
            example: t`Se $AB=4$, $BC=6$ e $A'B'=6$, então $\frac46=\frac{6}{B'C'}\Rightarrow B'C'=9$.`,
          },
          exercises: [
            gen((rng) => {
              const a = randInt(rng, 2, 8);
              const b = randInt(rng, 2, 8);
              const k = randInt(rng, 2, 4);
              return num(`Paralelas cortam duas transversais. Numa, os segmentos medem ${a} e ${b}; na outra, o primeiro mede ${a * k}. Quanto mede o segundo?`, b * k, `${a}/${b} = ${a * k}/x ⇒ x = ${b * k}.`);
            }),
            inter('Arraste as extremidades das transversais e mova a reta do meio até a razão AB/BC ficar igual a 1.', 'plot', thalesLab().props, (v) => near(v.p.h, 2, 0.05), 'reta do meio na altura 2', 'Razão 1 ⇒ a paralela do meio está equidistante das outras duas, em qualquer transversal.'),
            gen((rng) => {
              const a = randInt(rng, 4, 12);
              const c = randInt(rng, 4, 12);
              const L = randInt(rng, 5, 15);
              return num(`Num triângulo, AB = ${a}, AC = ${c} e BC = ${L}. A bissetriz de Â corta BC em D. Quanto mede BD?`, (L * a) / (a + c), `BD/DC = ${a}/${c} e BD + DC = ${L} ⇒ BD = ${L}·${a}/${a + c} = ${fmt((L * a) / (a + c), 3)}.`, { tol: 0.01 });
            }),
            tf('O teorema de Tales exige que as retas do feixe sejam paralelas; as transversais podem ter qualquer inclinação.', true, 'É o paralelismo que garante a proporcionalidade.'),
            gen((rng) => {
              const x = randInt(rng, 2, 9);
              return num(t`Paralelas determinam numa transversal os segmentos $${x}$ e $${x + 2}$. Na outra transversal, o segmento correspondente ao primeiro mede $6$. Quanto mede o correspondente ao segundo?`, (6 * (x + 2)) / x, t`$\frac{${x}}{${x + 2}}=\frac{6}{y}\Rightarrow y=\frac{6\cdot${x + 2}}{${x}}\approx ${fmt((6 * (x + 2)) / x, 2)}$.`, { tol: 0.01 });
            }),
            mcqS('Uma reta paralela a um lado de um triângulo corta os outros dois lados. O que podemos afirmar?', 'ela os divide na mesma razão e forma um triângulo semelhante', ['ela passa pelo baricentro', 'ela divide a área ao meio', 'ela é sempre a base média'], 'É Tales dentro do triângulo — e gera o triângulo menor semelhante.'),
            gen((rng) => {
              const L = 2 * randInt(rng, 3, 15);
              return num(`A base média de um triângulo (segmento que une os pontos médios de dois lados) é paralela ao terceiro lado, que mede ${L}. Quanto mede a base média?`, L / 2, `Razão 1/2: ${L}/2 = ${L / 2}.`);
            }),
            order('Ordene o raciocínio do teorema da bissetriz (BD/DC = AB/AC).', ['Prolongue BA e trace por C a paralela à bissetriz AD, encontrando E', 'Ângulos alternos/correspondentes mostram que o triângulo ACE é isósceles: AE = AC', 'Por Tales no triângulo BCE: BD/DC = BA/AE', 'Substitua AE = AC'], 'Paralela auxiliar → triângulo isósceles → Tales.'),
          ],
        },
        {
          card: {
            title: 'Triângulos semelhantes',
            body: t`Semelhantes = **mesma forma**: ângulos iguais e lados proporcionais. Para provar, basta:
• **AA**: dois ângulos iguais; • **LAL**: dois lados proporcionais e o ângulo entre eles igual; • **LLL**: três lados proporcionais.

Se a razão de semelhança é $k$: comprimentos (lados, alturas, perímetros) $\times k$; **áreas** $\times k^2$.`,
            visual: similarLab(),
            example: 'Um poste projeta sombra de 6 m ao mesmo tempo em que uma pessoa de 1,8 m projeta sombra de 1,2 m. Os raios de sol são paralelos (AA): h/6 = 1,8/1,2 ⇒ h = 9 m.',
          },
          exercises: [
            gen((rng) => {
              const s = randInt(rng, 3, 12);
              const pf = pick(rng, [1.5, 1.6, 1.8, 2]);
              const ps = pick(rng, [0.5, 0.8, 1, 1.2]);
              return num(`Um prédio projeta sombra de ${s} m quando uma vara de ${fmt(pf)} m projeta sombra de ${fmt(ps)} m. Qual a altura do prédio?`, (s * pf) / ps, `h/${s} = ${fmt(pf)}/${fmt(ps)} ⇒ h = ${fmt((s * pf) / ps, 2)} m.`, { tol: 0.01, unit: 'm' });
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              const A = randInt(rng, 3, 20);
              return num(`Dois triângulos semelhantes têm razão de semelhança ${k}. O menor tem área ${A} cm². Qual a área do maior?`, A * k * k, `Áreas multiplicam por k² = ${k * k}: ${A}·${k * k} = ${A * k * k}.`, { unit: 'cm²' });
            }),
            inter('Ajuste k para que a área do triângulo amarelo seja 4 vezes a do azul.', 'plot', similarLab().props, (v) => near(v.p.k, 2, 0.05), 'k = 2', 'k² = 4 ⇒ k = 2.'),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              const P = randInt(rng, 6, 30);
              return num(`Razão entre as áreas de dois triângulos semelhantes é ${k * k}. O perímetro do menor é ${P}. Qual o perímetro do maior?`, P * k, `Razão de áreas = k² ⇒ k = ${k}; perímetros ×${k}: ${P * k}.`);
            }),
            mcqS('Qual informação basta para garantir que dois triângulos são semelhantes?', 'dois ângulos respectivamente iguais', ['um lado igual', 'mesma área', 'mesmo perímetro'], 'AA: o terceiro ângulo fica igual automaticamente (soma 180°).'),
            tf('Um mapa na escala 1 : 50 000 representa áreas na razão 1 : 50 000.', false, 'Comprimentos 1 : 50 000 ⇒ áreas 1 : 50 000² = 1 : 2,5·10⁹.'),
            gen((rng) => {
              const a = randInt(rng, 3, 9);
              const b = randInt(rng, 3, 9);
              const k = randInt(rng, 2, 4);
              return num(`Num triângulo ABC, DE ∥ BC com D em AB e E em AC. AD = ${a}, DB = ${a * (k - 1)} e DE = ${b}. Quanto mede BC?`, b * k, `ADE ~ ABC com razão AB/AD = ${a * k}/${a} = ${k}: BC = ${b}·${k} = ${b * k}.`);
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 4);
              const a = randInt(rng, 2, 8);
              return num(`Uma foto de ${a} cm × ${a + 2} cm é ampliada para que o lado menor fique ${a * k} cm. Quantas vezes a área aumentou?`, k * k, `Razão linear ${k} ⇒ área ×${k * k}.`);
            }),
          ],
        },
      ],
    },
    {
      id: 'f-gplan-circ',
      title: 'Relações métricas e circunferência',
      parts: [
        {
          card: {
            title: 'Relações métricas no triângulo retângulo',
            body: t`Traçando a altura $h$ relativa à hipotenusa $a$, ela é dividida em projeções $m$ e $n$ e surgem **três triângulos semelhantes**. Daí:

$$h^2=m\,n \qquad b^2=a\,n \qquad c^2=a\,m \qquad b\,c=a\,h$$

e somando $b^2+c^2=a(m+n)=a^2$: **Pitágoras** sai de graça. Todo triângulo inscrito num semicírculo é retângulo.`,
            visual: metricLab(),
          },
          exercises: [
            gen((rng) => {
              const m = randInt(rng, 1, 9);
              const n = m * pick(rng, [1, 4, 9]);
              return num(`A altura relativa à hipotenusa divide-a em ${m} e ${n}. Quanto mede a altura?`, Math.sqrt(m * n), `h² = m·n = ${m * n} ⇒ h = ${fmt(Math.sqrt(m * n), 3)}.`, { tol: 0.01 });
            }),
            gen((rng) => {
              const [b, c, a] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]]);
              return num(`Catetos ${b} e ${c}, hipotenusa ${a}. Quanto mede a altura relativa à hipotenusa?`, (b * c) / a, `bc = ah ⇒ h = ${b}·${c}/${a} = ${fmt((b * c) / a, 2)}.`, { tol: 0.01 });
            }),
            gen((rng) => {
              const [b, , a] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]]);
              return num(`Cateto ${b} e hipotenusa ${a}. Quanto mede a projeção desse cateto sobre a hipotenusa?`, (b * b) / a, `b² = a·n ⇒ n = ${b * b}/${a} = ${fmt((b * b) / a, 3)}.`, { tol: 0.01 });
            }),
            inter('Arraste A pelo semicírculo até h² = m·n valer exatamente 9.', 'plot', metricLab().props, (v) => near(v.pts.A.y, 3, 0.08), 'A no topo (m = n = 3)', 'h² = 9 ⇒ h = 3 = raio: A está no ponto mais alto.'),
            tf('Se um triângulo está inscrito numa semicircunferência com um lado sendo o diâmetro, ele é retângulo.', true, 'O ângulo inscrito que enxerga o diâmetro (arco de 180°) mede 90°.'),
            match('Associe cada relação ao que ela fornece.', [[t`$h^2=mn$`, 'altura a partir das projeções'], [t`$b^2=an$`, 'cateto a partir da hipotenusa e da projeção'], [t`$bc=ah$`, 'altura a partir dos catetos e da hipotenusa'], [t`$a^2=b^2+c^2$`, 'hipotenusa a partir dos catetos']], 'Todas vêm da semelhança dos três triângulos.'),
            gen((rng) => {
              const m = randInt(rng, 2, 8);
              const n = randInt(rng, 2, 8);
              return num(`Projeções ${m} e ${n} sobre a hipotenusa. Quanto mede o cateto adjacente à projeção ${m}? (c² = a·m)`, Math.sqrt((m + n) * m), `a = ${m + n}; c² = ${m + n}·${m} = ${(m + n) * m} ⇒ c ≈ ${fmt(Math.sqrt((m + n) * m), 3)}.`, { tol: 0.01 });
            }),
            gen((rng) => {
              const L = randInt(rng, 2, 12);
              return num(`Diagonal de um quadrado de lado ${L} (arredonde a 2 casas).`, L * Math.SQRT2, `d = L√2 = ${fmt(L * Math.SQRT2, 2)}.`, { tol: 0.01 });
            }),
          ],
        },
        {
          card: [
            {
              title: 'Ângulos na circunferência',
              body: t`• **Ângulo central**: vértice no centro; mede o mesmo que o arco.
• **Ângulo inscrito**: vértice na circunferência; mede **metade** do arco (e do central correspondente).
• Inscritos que enxergam o mesmo arco são **iguais**; o que enxerga um diâmetro mede $90^\circ$.
• **Quadrilátero inscritível**: ângulos opostos somam $180^\circ$.`,
              visual: inscribedLab(),
            },
            {
              title: 'Potência de ponto e polígonos inscritos',
              body: t`Por um ponto $P$, toda reta que corta a circunferência em $A$ e $B$ dá o **mesmo** produto: $PA\cdot PB=|OP^2-R^2|$. Daí: duas cordas $PA\cdot PB=PC\cdot PD$; secante e tangente $PT^2=PA\cdot PB$.

Lados dos regulares inscritos num círculo de raio $R$: $\ell_6=R$, $\ell_4=R\sqrt2$, $\ell_3=R\sqrt3$. Arco de ângulo $\theta$ (rad): $s=R\theta$; setor: $A=\frac{R^2\theta}{2}$.`,
              visual: powerLab(),
            },
          ],
          exercises: [
            gen((rng) => {
              const c = 2 * randInt(rng, 15, 85);
              return num(`Um ângulo central mede ${c}°. Quanto mede um ângulo inscrito que enxerga o mesmo arco?`, c / 2, 'Inscrito = metade do central.', { unit: '°' });
            }),
            inter('Mova A e B até o ângulo inscrito APB medir 90°.', 'plot', inscribedLab().props, (v) => {
              const { A, B, P } = v.pts;
              return near(deg(angAt(P, A, B)), 90, 3);
            }, 'A e B diametralmente opostos', 'O inscrito vale 90° quando enxerga um diâmetro (central de 180°).'),
            gen((rng) => {
              const a = randInt(rng, 50, 130);
              return num(`Um quadrilátero inscrito numa circunferência tem um ângulo de ${a}°. Quanto mede o ângulo oposto?`, 180 - a, 'Ângulos opostos de um quadrilátero inscritível somam 180°.', { unit: '°' });
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              const b = randInt(rng, 2, 9);
              const c = pick(rng, [1, 2, 3, 4, 6].filter((x) => (a * b) % x === 0 && x !== a));
              return num(`Duas cordas se cortam num ponto P. Uma fica dividida em ${a} e ${b}; a outra tem um pedaço de ${c}. Quanto mede o outro pedaço?`, (a * b) / c, `${a}·${b} = ${c}·x ⇒ x = ${(a * b) / c}.`);
            }),
            gen((rng) => {
              const PA = randInt(rng, 2, 6);
              const AB = randInt(rng, 2, 10);
              return num(`De um ponto externo P traçam-se uma tangente PT e uma secante que corta a circunferência em A e B (PA = ${PA}, AB = ${AB}). Quanto mede PT?`, Math.sqrt(PA * (PA + AB)), `PT² = PA·PB = ${PA}·${PA + AB} = ${PA * (PA + AB)} ⇒ PT ≈ ${fmt(Math.sqrt(PA * (PA + AB)), 3)}.`, { tol: 0.01 });
            }),
            inter('Mova P para fora da circunferência e gire a reta: confira que PA·PB não muda. Deixe P a distância 3 do centro e a reta cortando o círculo.', 'plot', powerLab().props, (v) => {
              const P = v.pts.P;
              const th = (v.p.th * PI) / 180;
              const bq = P.x * Math.cos(th) + P.y * Math.sin(th);
              return near(Math.hypot(P.x, P.y), 3, 0.15) && bq * bq - (P.x * P.x + P.y * P.y - 4) > 0;
            }, 'OP ≈ 3 e a reta cortando o círculo (PA·PB = 9 − 4 = 5)', 'Potência = OP² − R² = 9 − 4 = 5 para qualquer reta.'),
            match('Lado do polígono regular inscrito num círculo de raio R:', [['hexágono', 'R'], ['quadrado', 'R√2'], ['triângulo equilátero', 'R√3']], 'O hexágono se divide em 6 triângulos equiláteros de lado R.'),
            gen((rng) => {
              const R = randInt(rng, 2, 10);
              const ang = pick(rng, [30, 45, 60, 90, 120]);
              return num(`Comprimento do arco de ${ang}° numa circunferência de raio ${R} (2 casas).`, (R * ang * PI) / 180, `s = Rθ = ${R}·${ang}π/180 ≈ ${fmt((R * ang * PI) / 180, 2)}.`, { tol: 0.01 });
            }),
            gen((rng) => {
              const R = randInt(rng, 2, 9);
              const which = pick(rng, ['triângulo equilátero', 'quadrado']);
              const ans = which === 'quadrado' ? R * Math.SQRT2 : R * Math.sqrt(3);
              return num(`Lado do ${which} inscrito num círculo de raio ${R} (2 casas).`, ans, which === 'quadrado' ? `ℓ₄ = R√2 ≈ ${fmt(ans, 2)}.` : `ℓ₃ = R√3 ≈ ${fmt(ans, 2)}.`, { tol: 0.01 });
            }),
          ],
        },
      ],
    },
  ],
};

