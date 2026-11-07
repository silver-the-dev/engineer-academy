import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { AreaUnder, Arrow, CircleW, FnCurve, Label, PolygonW, PolylineW, Pt, RectW, Seg } from '../../../components/plot/Plot';
import { Axes3, Line3, Point3, Poly3, type V3 } from '../../../components/visuals/Space3D';
import { C } from '../../../theme';
import { fmt, pick, randInt } from '../../../lib/random';

const t = String.raw;

/* ---------------- laboratórios visuais ---------------- */

const discSweep3DLab = (): VisualSpec => ({
  name: 'space3d',
  props: {
    scale: 34,
    initialYaw: -0.65,
    initialPitch: 0.38,
    params: [
      { key: 'ang', label: '\\theta', min: 30, max: 360, step: 15, value: 240, color: C.gold },
      { key: 'n', label: 'n', min: 2, max: 12, step: 1, value: 6, color: C.p2 },
    ],
    render: ({ p }: any) => {
      const angRad = (p.ang * Math.PI) / 180;
      const n = p.n;
      const a = 0;
      const b = 2;
      const dx = (b - a) / n;
      const f = (x: number) => Math.sqrt(Math.max(0, x));
      const els: React.ReactNode[] = [];
      const steps = 16;

      for (let i = 0; i < n; i++) {
        const x0 = a + i * dx;
        const x1 = x0 + dx * 0.92;
        const xm = x0 + dx * 0.5;
        const r = f(xm);
        for (let j = 0; j < steps; j++) {
          const t0 = (angRad * j) / steps;
          const t1 = (angRad * (j + 1)) / steps;
          const p0: V3 = [x0, r * Math.cos(t0), r * Math.sin(t0)];
          const p1: V3 = [x0, r * Math.cos(t1), r * Math.sin(t1)];
          const q0: V3 = [x1, r * Math.cos(t0), r * Math.sin(t0)];
          const q1: V3 = [x1, r * Math.cos(t1), r * Math.sin(t1)];
          els.push(<Line3 key={`r0-${i}-${j}`} a={p0} b={p1} color={C.p2} width={1.3} />);
          els.push(<Line3 key={`r1-${i}-${j}`} a={q0} b={q1} color={C.p2} width={1.6} />);
          if (j % 4 === 0) {
            els.push(<Line3 key={`rib-${i}-${j}`} a={p0} b={q0} color={C.p1} width={1.2} />);
          }
        }
      }

      const prof0: V3[] = [[0, 0, 0]];
      const profAng: V3[] = [[0, 0, 0]];
      const m = 20;
      for (let k = 0; k <= m; k++) {
        const x = (b * k) / m;
        const r = f(x);
        prof0.push([x, r, 0]);
        profAng.push([x, r * Math.cos(angRad), r * Math.sin(angRad)]);
      }
      prof0.push([b, 0, 0]);
      profAng.push([b, 0, 0]);

      return (
        <>
          <Axes3 size={2.6} />
          {els}
          <Poly3 pts={prof0} color={C.gold} opacity={0.22} stroke={C.gold} />
          <Poly3 pts={profAng} color={C.gold} opacity={0.35} stroke={C.gold} />
        </>
      );
    },
    info: ({ p }: any) => {
      const frac = p.ang / 360;
      const vExact = 2 * Math.PI;
      return t`Giro $\theta=${p.ang}^\circ$ · $n=${p.n}$ discos · volume varrido $\approx ${fmt(frac * vExact, 2)}$ · volta completa ($360^\circ$): $V=2\pi\approx ${fmt(vExact, 2)}$`;
    },
  },
});

const washerLab = () =>
  plot(
    {
      view: { xMin: -0.4, xMax: 6.6, yMin: -2.4, yMax: 2.4 },
      equalAspect: true,
      params: [{ key: 'x0', label: 'x_0', min: 0, max: 2, step: 0.1, value: 0.8, color: C.gold }],
      render: ({ p }: any) => {
        const x0 = p.x0;
        const R = 2;
        const r = x0;
        const cx = 4.4;
        return (
          <>
            <AreaUnder f={() => 2} g={(x) => x} a={0} b={2} color={C.p2} opacity={0.28} />
            <AreaUnder f={(x) => -x} g={() => -2} a={0} b={2} color={C.p2} opacity={0.14} />
            <FnCurve f={() => 2} from={0} to={2} color={C.p2} width={2.5} />
            <FnCurve f={(x) => x} from={0} to={2} color={C.p5} width={2.5} />
            <FnCurve f={() => -2} from={0} to={2} color={C.p2} width={1.5} dash="5 4" />
            <FnCurve f={(x) => -x} from={0} to={2} color={C.p5} width={1.5} dash="5 4" />
            <Seg x1={x0} y1={r} x2={x0} y2={R} color={C.gold} width={5} />
            <Seg x1={x0} y1={-R} x2={x0} y2={-r} color={C.gold} width={5} />
            <Pt x={x0} y={R} color={C.p2} r={4} />
            <Pt x={x0} y={r} color={C.p5} r={4} />
            <CircleW cx={cx} cy={0} r={R} color={C.p2} fill={C.p2} fillOpacity={0.35} width={2.5} />
            {r > 0.02 ? <CircleW cx={cx} cy={0} r={r} color={C.p5} fill={C.bgDeep} fillOpacity={1} width={2} /> : null}
            <Seg x1={cx} y1={0} x2={cx + R} y2={0} color={C.p2} width={2} />
            {r > 0.1 ? <Seg x1={cx} y1={0} x2={cx} y2={r} color={C.p5} width={2} /> : null}
            <Label x={1} y={2.15} text="região" color={C.p2} anchor="middle" size={11} />
            <Label x={cx} y={2.15} text="arruela" color={C.gold} anchor="middle" size={11} />
          </>
        );
      },
      info: ({ p }: any) => {
        const r = p.x0;
        const areaCoef = 4 - r * r;
        return t`Em $x_0=${fmt(r, 1)}$: $R=2$, $r=${fmt(r, 1)}$ ⟹ área da arruela $=\pi(2^2-${fmt(r, 1)}^2)=${fmt(areaCoef, 2)}\pi$`;
      },
    },
    240,
  );

const shell3DLab = (): VisualSpec => ({
  name: 'space3d',
  props: {
    scale: 30,
    initialYaw: -0.7,
    initialPitch: 0.42,
    params: [{ key: 'x', label: 'r', min: 0.2, max: 1.9, step: 0.1, value: 1.2, color: C.gold }],
    render: ({ p }: any) => {
      const r = p.x;
      const h = 4 - r * r;
      const n = 24;
      const ring0: V3[] = Array.from({ length: n }, (_, i) => [r * Math.cos((2 * Math.PI * i) / n), r * Math.sin((2 * Math.PI * i) / n), 0]);
      const ring1: V3[] = Array.from({ length: n }, (_, i) => [r * Math.cos((2 * Math.PI * i) / n), r * Math.sin((2 * Math.PI * i) / n), h]);
      const dome: React.ReactNode[] = [];
      for (const rad of [0.6, 1.2, 1.8, 2]) {
        const z = 4 - rad * rad;
        for (let i = 0; i < n; i++) {
          const a0 = (2 * Math.PI * i) / n;
          const a1 = (2 * Math.PI * (i + 1)) / n;
          dome.push(<Line3 key={`d-${rad}-${i}`} a={[rad * Math.cos(a0), rad * Math.sin(a0), z]} b={[rad * Math.cos(a1), rad * Math.sin(a1), z]} color={C.p1} width={1} />);
        }
      }
      for (let k = 0; k < 4; k++) {
        const ang = (Math.PI * k) / 2;
        for (let j = 0; j < 12; j++) {
          const u0 = (2 * j) / 12;
          const u1 = (2 * (j + 1)) / 12;
          dome.push(<Line3 key={`m-${k}-${j}`} a={[u0 * Math.cos(ang), u0 * Math.sin(ang), 4 - u0 * u0]} b={[u1 * Math.cos(ang), u1 * Math.sin(ang), 4 - u1 * u1]} color={C.p1} width={1.2} />);
        }
      }
      return (
        <>
          <Axes3 size={2.8} />
          {dome}
          <Poly3 pts={ring0} color={C.gold} opacity={0.18} stroke={C.gold} />
          <Poly3 pts={ring1} color={C.gold} opacity={0.32} stroke={C.gold} />
          {ring0.map((pt, i) => (i % 2 === 0 ? <Line3 key={'v' + i} a={pt} b={ring1[i]} color={C.gold} width={1.8} /> : null))}
          <Point3 at={[r, 0, h]} color={C.p2} r={5} />
        </>
      );
    },
    info: ({ p }: any) => {
      const r = p.x;
      const h = 4 - r * r;
      const area = 2 * Math.PI * r * h;
      return t`Casca em $r=x=${fmt(r, 1)}$: altura $h=4-x^2=${fmt(h, 2)}$ · área lateral $2\pi rh=${fmt(2 * r * h, 2)}\pi\approx ${fmt(area, 2)}$`;
    },
  },
});

const sliceCompareLab = () =>
  plot({
    view: { xMin: -0.5, xMax: 2.6, yMin: -0.4, yMax: 4.5 },
    params: [
      { key: 'modo', label: 'M', min: 0, max: 1, step: 1, value: 0, color: C.p2, format: (v: number) => (v ? 'Arruela (dy)' : 'Casca (dx)') },
      { key: 'pos', label: 'p', min: 0.2, max: 1.8, step: 0.1, value: 1.4, color: C.gold },
    ],
    render: ({ p }: any) => {
      const isWasher = p.modo === 1;
      const x0 = p.pos;
      const y0 = p.pos * 2;
      return (
        <>
          <AreaUnder f={(x) => 2 * x} g={(x) => x * x} a={0} b={2} color={C.p1} opacity={0.28} />
          <FnCurve f={(x) => 2 * x} from={0} to={2} color={C.p2} width={2.5} />
          <FnCurve f={(x) => x * x} from={0} to={2} color={C.p3} width={2.5} />
          <Seg x1={0} y1={-0.3} x2={0} y2={4.3} color={C.gold} width={3} dash="5 4" />
          <Label x={0.08} y={4.15} text="eixo de giro (y)" color={C.gold} size={11} />
          {!isWasher ? (
            <>
              <Seg x1={x0} y1={x0 * x0} x2={x0} y2={2 * x0} color={C.gold} width={6} />
              <Seg x1={0} y1={1.5 * x0} x2={x0} y2={1.5 * x0} color={C.p4} width={2} dash="4 3" />
              <Pt x={x0} y={2 * x0} color={C.p2} r={4} />
              <Pt x={x0} y={x0 * x0} color={C.p3} r={4} />
            </>
          ) : (
            <>
              <Seg x1={y0 / 2} y1={y0} x2={Math.sqrt(y0)} y2={y0} color={C.gold} width={6} />
              <Seg x1={0} y1={y0} x2={y0 / 2} y2={y0} color={C.p5} width={2} dash="4 3" />
              <Pt x={y0 / 2} y={y0} color={C.p2} r={4} />
              <Pt x={Math.sqrt(y0)} y={y0} color={C.p3} r={4} />
            </>
          )}
        </>
      );
    },
    info: ({ p }: any) => {
      if (p.modo === 0) {
        const x = p.pos;
        const h = 2 * x - x * x;
        return t`**Casca ($\parallel$ eixo $y$)**: $x=${fmt(x, 1)}$, raio $r=${fmt(x, 1)}$, altura $h=2x-x^2=${fmt(h, 2)}$ · $V=\frac{8\pi}{3}$`;
      }
      const y = p.pos * 2;
      const R = Math.sqrt(y);
      const r = y / 2;
      return t`**Arruela ($\perp$ eixo $y$)**: $y=${fmt(y, 1)}$, $R=\sqrt{y}=${fmt(R, 2)}$, $r=\frac{y}{2}=${fmt(r, 2)}$ · $V=\frac{8\pi}{3}$`;
    },
  });

const arcLengthLab = () =>
  plot({
    view: { xMin: -0.2, xMax: 3.35, yMin: -0.2, yMax: 1.25 },
    params: [{ key: 'n', label: 'n', min: 1, max: 12, step: 1, value: 2, color: C.gold, format: (v: number) => String(v) }],
    render: ({ p }: any) => {
      const n = p.n;
      const a = 0;
      const b = Math.PI;
      const pts: [number, number][] = [];
      for (let i = 0; i <= n; i++) {
        const x = a + ((b - a) * i) / n;
        pts.push([x, Math.sin(x)]);
      }
      return (
        <>
          <FnCurve f={(x) => Math.sin(x)} from={0} to={Math.PI} color={C.p1} width={3} opacity={0.55} />
          <PolylineW pts={pts} color={C.gold} width={2.8} />
          {pts.map(([x, y], i) => (
            <Pt key={i} x={x} y={y} color={C.gold} r={4} />
          ))}
        </>
      );
    },
    info: ({ p }: any) => {
      const n = p.n;
      const dx = Math.PI / n;
      let len = 0;
      for (let i = 0; i < n; i++) {
        const y0 = Math.sin(i * dx);
        const y1 = Math.sin((i + 1) * dx);
        len += Math.hypot(dx, y1 - y0);
      }
      const exact = 3.8202;
      return t`Poligonal ($n=${n}$): $L_n=${fmt(len, 4)}$ · arco exato: $L\approx ${fmt(exact, 4)}$ · erro: $${fmt(Math.abs(exact - len), 4)}$`;
    },
  });

const surfaceRev3DLab = (): VisualSpec => ({
  name: 'space3d',
  props: {
    scale: 34,
    initialYaw: -0.65,
    initialPitch: 0.35,
    params: [{ key: 'x0', label: 'x_0', min: 0.2, max: 1.8, step: 0.2, value: 0.6, color: C.gold }],
    render: ({ p }: any) => {
      const f = (x: number) => Math.sqrt(Math.max(0, x));
      const m = 20;
      const wire: React.ReactNode[] = [];
      for (const x of [0.4, 0.8, 1.2, 1.6, 2.0]) {
        const r = f(x);
        for (let i = 0; i < m; i++) {
          const a0 = (2 * Math.PI * i) / m;
          const a1 = (2 * Math.PI * (i + 1)) / m;
          wire.push(<Line3 key={`c-${x}-${i}`} a={[x, r * Math.cos(a0), r * Math.sin(a0)]} b={[x, r * Math.cos(a1), r * Math.sin(a1)]} color={C.p1} width={1} />);
        }
      }
      for (let k = 0; k < 6; k++) {
        const ang = (2 * Math.PI * k) / 6;
        for (let j = 0; j < 10; j++) {
          const u0 = (2 * j) / 10;
          const u1 = (2 * (j + 1)) / 10;
          wire.push(<Line3 key={`l-${k}-${j}`} a={[u0, f(u0) * Math.cos(ang), f(u0) * Math.sin(ang)]} b={[u1, f(u1) * Math.cos(ang), f(u1) * Math.sin(ang)]} color={C.p1} width={1} />);
        }
      }
      const xa = Math.max(0.05, p.x0 - 0.15);
      const xb = Math.min(2, p.x0 + 0.15);
      const ra = f(xa);
      const rb = f(xb);
      const band: React.ReactNode[] = [];
      for (let i = 0; i < m; i++) {
        const a0 = (2 * Math.PI * i) / m;
        const a1 = (2 * Math.PI * (i + 1)) / m;
        const pa0: V3 = [xa, ra * Math.cos(a0), ra * Math.sin(a0)];
        const pa1: V3 = [xa, ra * Math.cos(a1), ra * Math.sin(a1)];
        const pb0: V3 = [xb, rb * Math.cos(a0), rb * Math.sin(a0)];
        const pb1: V3 = [xb, rb * Math.cos(a1), rb * Math.sin(a1)];
        band.push(<Line3 key={`ba-${i}`} a={pa0} b={pa1} color={C.gold} width={2.5} />);
        band.push(<Line3 key={`bb-${i}`} a={pb0} b={pb1} color={C.gold} width={2.5} />);
        if (i % 2 === 0) band.push(<Line3 key={`bs-${i}`} a={pa0} b={pb0} color={C.gold} width={2} />);
      }
      return (
        <>
          <Axes3 size={2.5} />
          {wire}
          {band}
        </>
      );
    },
    info: ({ p }: any) => {
      const x = p.x0;
      const y = Math.sqrt(x);
      const dsFactor = Math.sqrt(1 + 1 / (4 * x));
      return t`Fita em $x_0=${fmt(x, 1)}$: raio $f(x_0)=${fmt(y, 2)}$ · fator $\sqrt{1+[f']^2}=${fmt(dsFactor, 2)}$ · $2\pi f\sqrt{1+[f']^2}=${fmt(2 * Math.PI * y * dsFactor, 2)}$`;
    },
  },
});

const springWorkLab = () =>
  plot({
    view: { xMin: -0.3, xMax: 4.3, yMin: -6, yMax: 92 },
    params: [{ key: 'b', label: 'b', min: 0.5, max: 4, step: 0.25, value: 2, color: C.gold }],
    render: ({ p }: any) => {
      const b = p.b;
      const zig: [number, number][] = [[0, 82]];
      const coils = 8;
      for (let i = 1; i <= coils; i++) {
        const x = ((i - 0.5) * b) / coils;
        const y = 82 + (i % 2 === 0 ? 4 : -4);
        zig.push([x, y]);
      }
      zig.push([b, 82]);
      return (
        <>
          <AreaUnder f={(x) => 20 * x} a={0} b={b} color={C.gold} opacity={0.32} />
          <FnCurve f={(x) => 20 * x} from={0} to={4} color={C.p2} width={3} />
          <Pt x={b} y={20 * b} color={C.gold} r={6} label={`F=${fmt(20 * b, 0)} N`} dx={-28} dy={-12} />
          <PolylineW pts={zig} color={C.p4} width={2.5} />
          <RectW x={b} y={76} w={0.28} h={12} color={C.p3} opacity={0.85} />
        </>
      );
    },
    info: ({ p }: any) => {
      const b = p.b;
      const W = 10 * b * b;
      return t`Mola $F(x)=20x\text{ N}$ · esticada até $b=${fmt(b, 2)}\text{ m}$ ⟹ $W=\int_0^{${fmt(b, 2)}} 20x\,dx = ${fmt(W, 2)}\text{ J}$`;
    },
  });

const centroidLab = () =>
  plot({
    view: { xMin: -0.15, xMax: 1.2, yMin: -0.15, yMax: 1.15 },
    equalAspect: true,
    params: [{ key: 'k', label: 'k', min: 0, max: 3, step: 0.5, value: 1, color: C.p2 }],
    render: ({ p }: any) => {
      const k = p.k;
      const xb = (k + 1) / (k + 2);
      const yb = (k + 1) / (2 * (2 * k + 1));
      return (
        <>
          <AreaUnder f={(x) => Math.pow(Math.max(0, x), k)} a={0} b={1} color={C.p1} opacity={0.3} />
          <FnCurve f={(x) => Math.pow(Math.max(0, x), k)} from={0} to={1} color={C.p2} width={3} />
          <Seg x1={xb} y1={0} x2={xb} y2={1} color={C.gold} width={1.5} dash="4 4" />
          <Seg x1={0} y1={yb} x2={1} y2={yb} color={C.gold} width={1.5} dash="4 4" />
          <Pt x={xb} y={yb} color={C.gold} r={6} label="C" />
        </>
      );
    },
    info: ({ p }: any) => {
      const k = p.k;
      const A = 1 / (k + 1);
      const xb = (k + 1) / (k + 2);
      const yb = (k + 1) / (2 * (2 * k + 1));
      return t`Curva $y=x^{${fmt(k, 1)}}$ em $[0,\,1]$ · área $A=${fmt(A, 3)}$ · centroide $(\bar x;\ \bar y)=(${fmt(xb, 3)};\ ${fmt(yb, 3)})$`;
    },
  });

const hydroLab = () =>
  plot({
    view: { xMin: -0.5, xMax: 5.8, yMin: -5.4, yMax: 0.6 },
    params: [{ key: 'H', label: 'H', min: 1, max: 5, step: 0.5, value: 3, color: C.p2 }],
    render: ({ p }: any) => {
      const H = p.H;
      const arrows: React.ReactNode[] = [];
      const steps = Math.round(H * 2);
      for (let i = 1; i <= steps; i++) {
        const h = (H * i) / steps;
        const w = 0.8 * h;
        arrows.push(<Arrow key={i} x1={1.2 + w} y1={-h} x2={1.2} y2={-h} color={C.p2} width={2.2} head={8} />);
      }
      return (
        <>
          <RectW x={0} y={-H} w={1.2} h={H} color={C.p3} opacity={0.45} />
          <Seg x1={-0.4} y1={0} x2={5.5} y2={0} color={C.cyan} width={2.5} dash="6 4" />
          <PolygonW pts={[[1.2, 0], [1.2, -H], [1.2 + 0.8 * H, -H]]} color={C.p2} opacity={0.22} />
          {arrows}
          <Label x={0.6} y={-H / 2} text="L = 2 m" color={C.text} anchor="middle" size={11} />
          <Label x={3.6} y={0.22} text="superfície (h = 0)" color={C.cyan} anchor="middle" size={11} />
        </>
      );
    },
    info: ({ p }: any) => {
      const H = p.H;
      const F = 10 * H * H;
      return t`Comporta $L=2\text{ m}$ até $H=${fmt(H, 1)}\text{ m}$ ($\rho g=10\text{ kN/m}^3$) ⟹ $F=\int_0^{${fmt(H, 1)}} 20h\,dh = ${fmt(F, 0)}\text{ kN}$`;
    },
  });

/* ---------------- unidade: Aplicações da integral ---------------- */

export const aplIntegral: UnitDef = {
  id: 'c-apli',
  title: 'Aplicações da integral',
  subtitle: 'Volumes de revolução, comprimento de arco e aplicações físicas',
  icon: '⚙️',
  source: 'Cálculo I · Unidade 5 — Aplicações da integral definida',
  guide: t`Integrar é fatiar um problema contínuo em pedaços infinitesimais e somar tudo. Com essa ideia calculamos volumes por discos, arruelas e cascas cilíndricas, comprimentos de curvas, áreas de superfícies de revolução, trabalho mecânico, centros de massa e forças hidrostáticas.`,
  lessons: [
    {
      id: 'c-apli-disco',
      title: 'Volumes por discos e arruelas',
      parts: [
        {
          card: {
            title: 'Fatiando em discos',
            body: t`Ao girar a região sob $y=f(x)\ge 0$ em $[a,\,b]$ em torno do **eixo $x$**, cada fatia vertical de espessura $dx$ varre um **disco circular** de raio $R=f(x)$, área da base $A(x)=\pi[f(x)]^2$ e volume $dV=\pi[f(x)]^2\,dx$.

Gire a figura em 3D e altere o ângulo $\theta$ e o número de discos $n$:`,
            formula: t`V=\pi\int_a^b \big[f(x)\big]^2\,dx`,
            visual: discSweep3DLab(),
            example: t`Girando $y=\sqrt{x}$ em $[0,\,4]$ em torno do eixo $x$: $V=\pi\int_0^4 (\sqrt{x})^2\,dx=\pi\left[\frac{x^2}{2}\right]_0^4=8\pi$.`,
            tip: t`O raio do disco é $f(x)$, por isso o integrando leva $f(x)$ **ao quadrado** — e nunca esqueça o fator $\pi$!`,
          },
          exercises: [
            tf(
              t`Ao girar a região sob $y=f(x)$ em torno do eixo $x$, cada fatia vertical de espessura $dx$ gera um disco de raio $R=f(x)$ e volume $\pi[f(x)]^2\,dx$.`,
              true,
              t`A seção transversal perpendicular ao eixo $x$ é um círculo de área $\pi R^2 = \pi[f(x)]^2$.`,
            ),
            inter(
              t`No sólido 3D ($y=\sqrt{x}$ em $[0,\,2]$), complete a volta inteira ($\theta=360^\circ$) e use pelo menos $n=10$ discos.`,
              'space3d',
              discSweep3DLab().props!,
              (v: any) => v && v.p.ang >= 360 && v.p.n >= 10,
              t`$\theta=360^\circ$ e $n\ge 10$`,
              t`Com $\theta=360^\circ$ a região plana completa a revolução, varrendo o volume $\pi\int_0^2 x\,dx = 2\pi$.`,
            ),
            mcqS(
              t`Qual integral calcula o volume do sólido obtido ao girar a região sob $y=x^2$ de $x=0$ a $x=2$ em torno do eixo $x$?`,
              t`$\pi\int_0^2 x^4\,dx$`,
              [t`$\pi\int_0^2 x^2\,dx$`, t`$2\pi\int_0^2 x^2\,dx$`, t`$\int_0^2 x^4\,dx$`, t`$\pi\int_0^2 2x\,dx$`],
              t`Como $R(x)=x^2$, temos $[R(x)]^2=(x^2)^2=x^4$, logo $V=\pi\int_0^2 x^4\,dx$.`,
            ),
            gen((rng) => {
              const r = randInt(rng, 2, 5);
              const h = randInt(rng, 2, 6);
              return num(
                t`Girando a reta horizontal $y=${r}$ de $x=0$ a $x=${h}$ em torno do eixo $x$, forma-se um cilindro de volume $V=k\pi$. Quanto vale $k$?`,
                r * r * h,
                t`$V=\pi\int_0^{${h}} ${r}^2\,dx = \pi\cdot ${r * r}\cdot ${h} = ${r * r * h}\pi\implies k=${r * r * h}$.`,
              );
            }),
            gen((rng) => {
              const m = randInt(rng, 1, 4);
              const b = randInt(rng, 2, 5);
              const k = m * b * b;
              return num(
                t`A região sob $y=\sqrt{${2 * m}x}$ de $x=0$ até $x=${b}$ gira em torno do eixo $x$. Se o volume é $V=k\pi$, quanto vale $k$?`,
                k,
                t`$V=\pi\int_0^{${b}} ${2 * m}x\,dx = \pi\left[${m === 1 ? '' : m}x^2\right]_0^{${b}} = ${k}\pi\implies k=${k}$.`,
              );
            }),
            num(
              t`Girando a reta $y=x$ de $x=0$ a $x=3$ em torno do eixo $x$, obtemos um cone circular reto. Se o volume é $V=k\pi$, quanto vale $k$?`,
              9,
              t`$V=\pi\int_0^3 x^2\,dx = \pi\left[\frac{x^3}{3}\right]_0^3 = 9\pi\implies k=9$.`,
            ),
            mcqS(
              t`Girando o semicírculo $y=\sqrt{R^2-x^2}$ em $[-R,\,R]$ em torno do eixo $x$, obtemos uma esfera de raio $R$. Qual é o resultado de $\pi\int_{-R}^R (R^2-x^2)\,dx$?`,
              t`$\frac{4}{3}\pi R^3$`,
              [t`$4\pi R^2$`, t`$\frac{2}{3}\pi R^3$`, t`$2\pi R^3$`, t`$\pi R^3$`],
              t`$\pi\left[R^2x-\frac{x^3}{3}\right]_{-R}^R = 2\pi\left(R^3-\frac{R^3}{3}\right)=\frac{4}{3}\pi R^3$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 1, 4);
              return rmcq(
                rng,
                t`Calcule o volume gerado ao girar $y=e^{${k === 1 ? '' : k}x}$ de $x=0$ a $x=1$ em torno do eixo $x$.`,
                t`$\frac{\pi}{${2 * k}}(e^{${2 * k}}-1)$`,
                [
                  t`$\frac{\pi}{${k}}(e^{${k}}-1)$`,
                  t`$\frac{\pi}{${2 * k}}e^{${2 * k}}$`,
                  t`$\pi(e^{${2 * k}}-1)$`,
                  t`$\frac{\pi}{${k}}(e^{${2 * k}}-1)$`,
                ],
                t`$V=\pi\int_0^1 (e^{${k === 1 ? '' : k}x})^2\,dx = \pi\int_0^1 e^{${2 * k}x}\,dx = \frac{\pi}{${2 * k}}(e^{${2 * k}}-1)$.`,
              );
            }),
          ],
        },
        {
          card: {
            title: 'Arruelas: disco com furo',
            body: t`Quando a região está entre uma curva externa $R(x)$ e uma interna $r(x)$ (com $R(x)\ge r(x)\ge 0$), o sólido fica oco no meio. Cada fatia perpendicular ao eixo é uma **arruela** (coroa circular) de área $\pi[R(x)]^2-\pi[r(x)]^2$.

Mova a posição $x_0$ da fatia para ver a arruela vista de frente:`,
            formula: t`V=\pi\int_a^b \Big(\big[R(x)\big]^2-\big[r(x)\big]^2\Big)\,dx`,
            visual: washerLab(),
            example: t`Entre $y=x$ e $y=x^2$ em $[0,\,1]$: $R(x)=x$ e $r(x)=x^2\implies V=\pi\int_0^1(x^2-x^4)\,dx=\pi\left(\frac13-\frac15\right)=\frac{2\pi}{15}$.`,
            tip: t`Cuidado: o integrando é $R(x)^2-r(x)^2$ (diferença dos quadrados), e **nunca** $(R(x)-r(x))^2$!`,
          },
          exercises: [
            tf(
              t`No método das arruelas, a área da seção transversal é $\pi\big(R(x)-r(x)\big)^2$.`,
              false,
              t`Errado! Subtraímos a área do furo interno da área do disco externo: $\pi R(x)^2 - \pi r(x)^2 = \pi\big(R(x)^2-r(x)^2\big)$.`,
            ),
            inter(
              t`No laboratório da arruela (entre $y=2$ e $y=x$ em $[0,\,2]$), mova a fatia $x_0$ até o ponto onde a área da arruela vale $3\pi$.`,
              'plot',
              washerLab().props,
              (v: any) => v && near(v.p.x0, 1, 0.05),
              t`$x_0=1$`,
              t`Em $x_0=1$, temos $\pi(2^2-1^2)=3\pi$.`,
            ),
            fill(
              t`Complete a fórmula do volume pelo método das arruelas:`,
              t`$V = \pi\int_a^b \big($ ___ $-$ ___ $\big)\,dx$`,
              [t`$R(x)^2$`, t`$r(x)^2$`],
              [t`$R(x)$`, t`$r(x)$`, t`$2R(x)$`],
              t`Área do círculo maior $\pi R(x)^2$ menos área do círculo menor $\pi r(x)^2$.`,
            ),
            mcqS(
              t`Para girar a região entre $y=\sqrt{x}$ e $y=x$ em $[0,\,1]$ em torno do eixo $x$, quem são o raio externo $R(x)$ e o raio interno $r(x)$?`,
              t`$R(x)=\sqrt{x}$ e $r(x)=x$`,
              [t`$R(x)=x$ e $r(x)=\sqrt{x}$`, t`$R(x)=x$ e $r(x)=x^2$`, t`$R(x)=\sqrt{x}-x$ e $r(x)=0$`, t`$R(x)=1$ e $r(x)=x$`],
              t`Em $[0,\,1]$, $\sqrt{x}\ge x\ge 0$, logo $\sqrt{x}$ está mais longe do eixo $x$ ($R$) e $x$ está mais perto ($r$).`,
            ),
            num(
              t`Calcule o coeficiente $k$ (fração ou decimal) tal que $V=k\pi$ seja o volume ao girar a região entre $y=\sqrt{x}$ e $y=x$ em $[0,\,1]$ em torno do eixo $x$.`,
              1 / 6,
              t`$k=\int_0^1 \big((\sqrt{x})^2-x^2\big)\,dx=\int_0^1(x-x^2)\,dx=\frac12-\frac13=\frac16\approx 0{,}167$.`,
              { tol: 0.005 },
            ),
            gen((rng) => {
              const r = randInt(rng, 1, 3);
              const R = r + randInt(rng, 1, 3);
              const h = randInt(rng, 2, 5);
              const k = (R * R - r * r) * h;
              return num(
                t`Uma bucha cilíndrica oca é gerada girando a faixa entre $y=${R}$ e $y=${r}$ de $x=0$ até $x=${h}$ em torno do eixo $x$. Se $V=k\pi$, quanto vale $k$?`,
                k,
                t`$V=\pi\int_0^{${h}} (${R}^2-${r}^2)\,dx = \pi(${R * R}-${r * r})\cdot ${h} = ${k}\pi\implies k=${k}$.`,
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              return rmcq(
                rng,
                t`Qual integral calcula o volume ao girar a região entre $y=${k}$ e $y=x^2$ no primeiro quadrante ($0\le x\le \sqrt{${k}}$) em torno do eixo $x$?`,
                t`$\pi\int_0^{\sqrt{${k}}} (${k * k}-x^4)\,dx$`,
                [
                  t`$\pi\int_0^{\sqrt{${k}}} (${k}-x^2)^2\,dx$`,
                  t`$\pi\int_0^{${k}} (${k * k}-x^4)\,dx$`,
                  t`$2\pi\int_0^{\sqrt{${k}}} (${k}-x^2)\,dx$`,
                  t`$\pi\int_0^{\sqrt{${k}}} (x^4-${k * k})\,dx$`,
                ],
                t`$R(x)=${k}$ e $r(x)=x^2\implies R^2-r^2=${k * k}-x^4$ de $x=0$ até $x=\sqrt{${k}}$.`,
              );
            }),
            num(
              t`A região no primeiro quadrante entre a reta $y=2x$ e a parábola $y=2x^2$ gira em torno do eixo $x$. Sabendo que $V=k\pi$, calcule $k$ (fração ou decimal).`,
              8 / 15,
              t`Cruzam em $x=0$ e $x=1$: $k=\int_0^1\big((2x)^2-(2x^2)^2\big)\,dx=\int_0^1(4x^2-4x^4)\,dx=\frac43-\frac45=\frac{8}{15}\approx 0{,}533$.`,
              { tol: 0.005 },
            ),
          ],
        },
        {
          card: {
            title: 'Outros eixos de rotação',
            body: t`• **Giro em torno do eixo $y$**: fatiamos na **horizontal** (espessura $dy$), isolando $x=R(y)$:
$$V=\pi\int_c^d \big[R(y)\big]^2\,dy$$
• **Giro em torno da reta $y=k$**: o raio de cada ponto é a distância perpendicular até a reta, $|f(x)-k|$.`,
            example: t`Girar $y=x^2$ ($0\le y\le 4$, $x\ge 0$) no eixo $y$: $x=\sqrt{y}\implies V=\pi\int_0^4 (\sqrt{y})^2\,dy=\pi\left[\frac{y^2}{2}\right]_0^4=8\pi$.`,
            tip: t`Meça sempre os raios $R$ e $r$ **a partir do eixo de rotação**, e não a partir do eixo $x$!`,
          },
          exercises: [
            mcq(
              t`Ao usar o método dos discos para uma rotação em torno do **eixo $y$**, as fatias são horizontais e integramos em relação a…`,
              ['$y$, isolando $x=g(y)$', '$x$, mantendo $y=f(x)$', '$z$', '$\\theta$'],
              0,
              t`Fatias perpendiculares ao eixo $y$ têm espessura $dy$ e raio $x=g(y)$.`,
            ),
            mcqS(
              t`Para girar a região sob $y=x^2$ (com $y\ge 0$, $x\in[0,\,2]$) em torno da reta horizontal $y=-1$, quem são os raios externo $R(x)$ e interno $r(x)$?`,
              t`$R(x)=x^2+1$ e $r(x)=1$`,
              [
                t`$R(x)=x^2-1$ e $r(x)=0$`,
                t`$R(x)=x^2$ e $r(x)=1$`,
                t`$R(x)=x^2+1$ e $r(x)=0$`,
                t`$R(x)=1-x^2$ e $r(x)=1$`,
              ],
              t`A distância de $y=x^2$ até $y=-1$ é $x^2-(-1)=x^2+1$, e a distância da borda $y=0$ até $y=-1$ é $1$.`,
            ),
            gen((rng) => {
              const b = 2 * randInt(rng, 1, 4);
              const k = (b * b) / 2;
              return num(
                t`A região do 1º quadrante limitada por $y=x^2$, $x=0$ e $y=${b}$ gira em torno do **eixo $y$**. Se $V=k\pi$, quanto vale $k$?`,
                k,
                t`Isolando $x=\sqrt{y}$: $V=\pi\int_0^{${b}} (\sqrt{y})^2\,dy=\pi\left[\frac{y^2}{2}\right]_0^{${b}}=${k}\pi\implies k=${k}$.`,
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 3, 7);
              return rmcq(
                rng,
                t`A região sob $y=f(x)$ (com $0\le f(x)\le ${k}$) em $[a,\,b]$ gira em torno da reta $y=${k}$ acima dela. Qual integral dá o volume por arruelas?`,
                t`$\pi\int_a^b \Big(${k * k}-\big(${k}-f(x)\big)^2\Big)\,dx$`,
                [
                  t`$\pi\int_a^b \big(${k}-f(x)\big)^2\,dx$`,
                  t`$\pi\int_a^b \big(f(x)^2-${k * k}\big)\,dx$`,
                  t`$2\pi\int_a^b \big(${k}-f(x)\big)\,dx$`,
                  t`$\pi\int_a^b \big(f(x)+${k}\big)^2\,dx$`,
                ],
                t`A borda $y=0$ está à distância $R=${k}$ de $y=${k}$, e a curva $y=f(x)$ está à distância $r=${k}-f(x)$.`,
              );
            }),
            match(
              t`Para a região entre $y=x^2$ e $y=0$ em $[0,\,2]$, ligue cada eixo de rotação ao raio externo $R$ correspondente:`,
              [
                [t`Eixo $x$ ($y=0$)`, t`$R(x)=x^2$`],
                [t`Reta $y=-2$`, t`$R(x)=x^2+2$`],
                [t`Reta $y=4$ (borda $y=0$)`, t`$R(x)=4$`],
                [t`Eixo $y$ (fatia em $y$)`, t`$R(y)=\sqrt{y}$`],
              ],
              t`O raio é sempre a distância da borda mais afastada da região até a reta de giro.`,
            ),
            num(
              t`A região sob $y=x$ em $[0,\,2]$ (com $y\ge 0$) gira em torno da reta $y=-1$. Se o volume é $V=k\pi$, calcule $k$ (fração ou decimal).`,
              20 / 3,
              t`$R(x)=x+1$ e $r(x)=1\implies k=\int_0^2\big((x+1)^2-1^2\big)\,dx=\int_0^2(x^2+2x)\,dx=\frac83+4=\frac{20}{3}\approx 6{,}667$.`,
              { tol: 0.01 },
            ),
            gen((rng) => {
              const b = randInt(rng, 1, 2);
              return num(
                t`A região do 1º quadrante limitada por $y=x^{1/3}$, $x=0$ e $y=${b}$ gira em torno do **eixo $y$**. Se $V=k\pi$, calcule $k$ (fração ou decimal).`,
                b ** 7 / 7,
                t`$x=y^3\implies R(y)^2=y^6\implies k=\int_0^{${b}} y^6\,dy=\frac{${b ** 7}}{7}\approx ${fmt(b ** 7 / 7, 3)}$.`,
                { tol: 0.005 },
              );
            }),
            num(
              t`A região entre $y=x^2$ e $y=4$ (para $x\in[0,\,2]$) gira em torno da própria reta $y=4$. Como $R(x)=4-x^2$ e $r=0$, se $V=k\pi$, calcule $k$ (fração ou decimal).`,
              256 / 15,
              t`$k=\int_0^2(4-x^2)^2\,dx=\int_0^2(16-8x^2+x^4)\,dx=32-\frac{64}{3}+\frac{32}{5}=\frac{256}{15}\approx 17{,}067$.`,
              { tol: 0.02 },
            ),
          ],
        },
      ],
    },
    {
      id: 'c-apli-casca',
      title: 'Cascas cilíndricas',
      parts: [
        {
          card: {
            title: 'Cascas como camadas de cebola',
            body: t`Em vez de fatiar perpendicularmente ao eixo, podemos fatiar **paralelamente** ao eixo de rotação! Ao girar uma tira vertical em $x$ (largura $dx$, altura $f(x)$) em torno do **eixo $y$**, ela forma uma **casca cilíndrica** de raio $x$, circunferência $2\pi x$ e altura $f(x)$.

Desenrolada, a casca vira uma placa retangular de volume $dV=2\pi x\,f(x)\,dx$. Mova o raio $r=x$ no modelo 3D:`,
            formula: t`V=2\pi\int_a^b x\,f(x)\,dx`,
            visual: shell3DLab(),
            example: t`Girando $y=4-x^2$ em $[0,\,2]$ em torno do eixo $y$: $V=2\pi\int_0^2 x(4-x^2)\,dx=2\pi\left[2x^2-\frac{x^4}{4}\right]_0^2=8\pi$.`,
            tip: t`Guarde a estrutura física: $2\pi\int (\text{raio})\cdot(\text{altura})\cdot(\text{espessura})$.`,
          },
          exercises: [
            fill(
              t`Ao desenrolar uma casca cilíndrica de raio $x$, altura $f(x)$ e espessura $dx$, obtemos uma placa cujo volume é:`,
              t`$dV =$ ___ $\cdot$ ___ $\cdot\,dx$`,
              [t`$2\pi x$`, t`$f(x)$`],
              [t`$\pi x^2$`, t`$f(x)^2$`, t`$4\pi x$`],
              t`Comprimento da circunferência ($2\pi x$) vezes altura ($f(x)$) vezes espessura ($dx$).`,
            ),
            inter(
              t`No modelo 3D da casca cilíndrica sob $y=4-x^2$, ajuste o raio $r=x$ para que a altura da casca seja exatamente $h=3$.`,
              'space3d',
              shell3DLab().props!,
              (v: any) => v && near(v.p.x, 1, 0.05),
              t`$r=1$ (pois $4-1^2=3$)`,
              t`Em $x=1$, a altura é $h=4-1^2=3$ e a área lateral da casca vale $2\pi(1)(3)=6\pi$.`,
            ),
            tf(
              t`No método das cascas cilíndricas para um giro em torno do eixo $y$, as fatias da região são verticais (paralelas ao eixo $y$) e integramos em relação a $x$.`,
              true,
              t`Cada tira vertical na posição $x$ tem largura $dx$ e gira em torno do eixo $y$ formando um cilindro oco.`,
            ),
            mcqS(
              t`Qual integral calcula, por cascas cilíndricas, o volume ao girar a região sob $y=x^2$ em $[0,\,3]$ em torno do eixo $y$?`,
              t`$2\pi\int_0^3 x^3\,dx$`,
              [
                t`$\pi\int_0^3 x^4\,dx$`,
                t`$2\pi\int_0^3 x^2\,dx$`,
                t`$\pi\int_0^3 x^3\,dx$`,
                t`$2\pi\int_0^9 y^3\,dy$`,
              ],
              t`$V=2\pi\int_0^3 x\cdot f(x)\,dx = 2\pi\int_0^3 x\cdot x^2\,dx = 2\pi\int_0^3 x^3\,dx$.`,
            ),
            gen((rng) => {
              const c = randInt(rng, 1, 4);
              const k = 8 * c;
              return num(
                t`A região sob $y=${c === 1 ? '' : c}x^2$ de $x=0$ a $x=2$ gira em torno do eixo $y$. Usando cascas cilíndricas, se $V=k\pi$, quanto vale $k$?`,
                k,
                t`$V=2\pi\int_0^2 x(${c === 1 ? '' : c}x^2)\,dx = 2\pi\cdot ${c}\left[\frac{x^4}{4}\right]_0^2 = ${k}\pi\implies k=${k}$.`,
              );
            }),
            gen((rng) => {
              const m = randInt(rng, 1, 3);
              const k = 18 * m;
              return num(
                t`A região sob a reta $y=${m === 1 ? '' : m}x$ de $x=0$ até $x=3$ gira em torno do eixo $y$. Se $V=k\pi$, quanto vale $k$?`,
                k,
                t`$V=2\pi\int_0^3 x(${m === 1 ? '' : m}x)\,dx = 2\pi\cdot ${m}\left[\frac{x^3}{3}\right]_0^3 = ${k}\pi\implies k=${k}$.`,
              );
            }),
            mcqS(
              t`A colina $y=\operatorname{sen}(x^2)$ em $[0,\,\sqrt{\pi}]$ gira em torno do eixo $y$. Por que cascas cilíndricas tornam essa integral imediata?`,
              t`porque o fator $x$ do raio gera $2\pi\int x\operatorname{sen}(x^2)\,dx$, integrável por $u=x^2$`,
              [
                t`porque $\operatorname{sen}(x^2)$ é constante nesse intervalo`,
                t`porque o método dos discos não precisa inverter a função`,
                t`porque $\int \operatorname{sen}(x^2)\,dx$ tem primitiva elementar direta`,
              ],
              t`O raio $x$ fornece exatamente a derivada de $u=x^2$ ($du=2x\,dx$).`,
            ),
            num(
              t`Calcule o volume obtido ao girar $y=\operatorname{sen}(x^2)$ em $[0,\,\sqrt{\pi}]$ em torno do eixo $y$. Se $V=k\pi$, quanto vale $k$?`,
              2,
              t`$V=2\pi\int_0^{\sqrt{\pi}} x\operatorname{sen}(x^2)\,dx = \pi\int_0^\pi \operatorname{sen}u\,du = \pi[-\cos u]_0^\pi = 2\pi\implies k=2$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Discos ou cascas? Comparando no mesmo sólido',
            body: t`Todo sólido de revolução pode ser calculado pelos dois métodos, mas escolher a fatia certa economiza muita conta:
• **Fatia $\perp$ ao eixo** ⟹ **Disco/Arruela**: $\pi\int(R^2-r^2)$
• **Fatia $\parallel$ ao eixo** ⟹ **Casca**: $2\pi\int(\text{raio})(\text{altura})$

Compare os dois cortes no mesmo sólido (região entre $y=2x$ e $y=x^2$ girada no eixo $y$):`,
            visual: sliceCompareLab(),
            example: t`No eixo $y$: por cascas ($dx$), $2\pi\int_0^2 x(2x-x^2)\,dx=\frac{8\pi}{3}$; por arruelas ($dy$), $\pi\int_0^4\big((\sqrt{y})^2-(y/2)^2\big)\,dy=\frac{8\pi}{3}$.`,
            tip: t`Se o giro for em torno da reta vertical $x=k$, o raio da casca em $x$ passa a ser $|x-k|$.`,
          },
          exercises: [
            match(
              t`Ligue a orientação da fatia em relação ao eixo de rotação ao método correspondente:`,
              [
                [t`Fatia perpendicular ao eixo (sem furo)`, t`Disco ($\pi\int R^2$)`],
                [t`Fatia perpendicular ao eixo (com furo)`, t`Arruela ($\pi\int(R^2-r^2)$)`],
                [t`Fatia paralela ao eixo de rotação`, t`Casca cilíndrica ($2\pi\int r\,h$)`],
              ],
              t`Perpendicular gera círculos/anéis; paralela gera cascas cilíndricas.`,
            ),
            inter(
              t`No laboratório comparativo, alterne o modo $M$ para **Arruela (dy)** e ajuste $p=1$ (altura $y=2$).`,
              'plot',
              sliceCompareLab().props,
              (v: any) => v && v.p.modo === 1 && near(v.p.pos, 1, 0.05),
              t`Modo Arruela ($M=1$) e $p=1$`,
              t`Em $y=2$, a fatia horizontal vai de $r=1$ até $R=\sqrt{2}$, dando o mesmo volume $\frac{8\pi}{3}$ que as cascas verticais.`,
            ),
            mcqS(
              t`Queremos girar a região sob $y=3x^2-x^3$ em $[0,\,3]$ em torno do **eixo $y$**. Qual método evita ter de isolar $x$ numa equação de 3º grau?`,
              t`Cascas cilíndricas, integrando $2\pi\int_0^3 x(3x^2-x^3)\,dx$ em $x$`,
              [
                t`Arruelas em $y$, isolando $x$ em função de $y$`,
                t`Discos em $x$, calculando $\pi\int_0^3 (3x^2-x^3)^2\,dx$`,
                t`Substituição trigonométrica em $z$`,
              ],
              t`Com cascas mantemos a variável $x$ e integramos um polinômio simples.`,
            ),
            num(
              t`Calcule o volume ao girar a região sob $y=3x^2-x^3$ em $[0,\,3]$ em torno do eixo $y$. Se $V=k\pi$, quanto vale $k$?`,
              72.9,
              t`$k=2\int_0^3(3x^3-x^4)\,dx=2\left[\frac{3\cdot 81}{4}-\frac{243}{5}\right]=2\cdot\frac{729}{20}=72{,}9$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 3, 6);
              return rmcq(
                rng,
                t`A região sob $y=f(x)$ em $[0,\,2]$ gira em torno da reta vertical $x=${a}$ (à direita da região). Qual integral dá o volume por cascas cilíndricas?`,
                t`$2\pi\int_0^2 (${a}-x)f(x)\,dx$`,
                [
                  t`$2\pi\int_0^2 (x-${a})f(x)\,dx$`,
                  t`$2\pi\int_0^2 (x+${a})f(x)\,dx$`,
                  t`$\pi\int_0^2 (${a}-x)^2 f(x)\,dx$`,
                  t`$2\pi\int_0^2 x\,f(x)\,dx$`,
                ],
                t`Como $x\le 2 < ${a}$, a distância de $x$ até a reta $x=${a}$ é $r(x)=${a}-x$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 3, 5);
              const k = 4 * a - 16 / 3;
              return num(
                t`A região sob $y=x$ de $x=0$ até $x=2$ gira em torno da reta vertical $x=${a}$. Usando cascas ($r=${a}-x$, $h=x$), se $V=k\pi$, calcule $k$ (fração ou decimal).`,
                k,
                t`$k=2\int_0^2 (${a}x-x^2)\,dx = 2\left[2\cdot ${a}-\frac83\right] = ${4 * a}-\frac{16}{3}\approx ${fmt(k, 3)}$.`,
                { tol: 0.01 },
              );
            }),
            multi(
              t`Para o sólido obtido ao girar a região entre $y=x$ e $y=x^2$ ($0\le x\le 1$) em torno do **eixo $y$**, quais integrais abaixo fornecem o volume correto?`,
              [
                t`$2\pi\int_0^1 x(x-x^2)\,dx$ (cascas em $x$)`,
                t`$\pi\int_0^1 \big((\sqrt{y})^2-y^2\big)\,dy$ (arruelas em $y$)`,
                t`$\pi\int_0^1 (x^2-x^4)\,dx$`,
                t`$2\pi\int_0^1 x(x^2-x)\,dx$`,
              ],
              [0, 1],
              t`Cascas em $x$ e arruelas em $y$ dão ambas $V=\frac{\pi}{6}$. A terceira opção gira em torno do eixo $x$, e a quarta tem sinal negativo.`,
            ),
            num(
              t`Uma peça anelar é gerada girando a região sob $y=e^{-x^2}$ de $x=0$ a $x=1$ em torno do eixo $y$. Calcule o seu volume (arredonde com 2 casas decimais).`,
              Math.PI * (1 - Math.exp(-1)),
              t`$V=2\pi\int_0^1 x\,e^{-x^2}\,dx = \pi\left[-e^{-x^2}\right]_0^1 = \pi(1-e^{-1})\approx 1{,}99$.`,
              { tol: 0.02 },
            ),
          ],
        },
      ],
    },
    {
      id: 'c-apli-arco',
      title: 'Comprimento de arco e área de superfície',
      parts: [
        {
          card: {
            title: 'Pitágoras infinitesimal',
            body: t`Para medir o comprimento de uma curva suave $y=f(x)$ em $[a,\,b]$, aproximamos o gráfico por uma poligonal de $n$ segmentos. Cada pequeno trecho tem catetos $dx$ e $dy=f'(x)\,dx$, logo sua hipotenusa mede:
$$ds=\sqrt{dx^2+dy^2}=\sqrt{1+\big[f'(x)\big]^2}\,dx$$

Aumente $n$ e veja o comprimento da poligonal convergir para o arco de $y=\operatorname{sen}x$ em $[0,\,\pi]$:`,
            formula: t`L=\int_a^b \sqrt{1+\big[f'(x)\big]^2}\,dx`,
            visual: arcLengthLab(),
            example: t`Para a reta $y=3x+1$ em $[0,\,2]$: $f'(x)=3\implies L=\int_0^2\sqrt{1+9}\,dx=2\sqrt{10}$.`,
            tip: t`Como a reta é o menor caminho entre dois pontos, a poligonal inscrita tem sempre comprimento menor ou igual ao da curva.`,
          },
          exercises: [
            fill(
              t`Complete o elemento diferencial de comprimento de arco a partir de $ds=\sqrt{dx^2+dy^2}$:`,
              t`$ds = \sqrt{A+B}\,dx$, com $A=$ ___ e $B=$ ___`,
              [t`$1$`, t`$[f'(x)]^2$`],
              [t`$f(x)^2$`, t`$x^2$`, t`$2f'(x)$`],
              t`Colocando $dx^2$ em evidência dentro da raiz: $\sqrt{dx^2+(f'(x)\,dx)^2}=\sqrt{1+[f'(x)]^2}\,dx$.`,
            ),
            inter(
              t`No laboratório de comprimento de arco ($y=\operatorname{sen}x$ em $[0,\,\pi]$), aumente o número de segmentos $n$ até o erro ficar menor que $0{,}01$.`,
              'plot',
              arcLengthLab().props,
              (v: any) => v && v.p.n >= 8,
              t`$n\ge 8$`,
              t`Com $n\ge 8$ segmentos, a poligonal já acompanha de perto a curvatura do seno e $L_n\approx 3{,}813$.`,
            ),
            tf(
              t`O comprimento de arco de qualquer curva suave $y=f(x)$ entre $x=a$ e $x=b$ (com $a<b$) é sempre maior ou igual a $b-a$.`,
              true,
              t`Como $[f'(x)]^2\ge 0$, temos $\sqrt{1+[f'(x)]^2}\ge 1$, logo $L\ge \int_a^b 1\,dx = b-a$.`,
            ),
            mcqS(
              t`Qual integral representa o comprimento de arco da parábola $y=x^2$ de $x=0$ até $x=1$?`,
              t`$\int_0^1 \sqrt{1+4x^2}\,dx$`,
              [
                t`$\int_0^1 \sqrt{1+x^4}\,dx$`,
                t`$\int_0^1 \sqrt{1+2x}\,dx$`,
                t`$\int_0^1 (1+2x)\,dx$`,
                t`$\pi\int_0^1 x^4\,dx$`,
              ],
              t`$f'(x)=2x\implies [f'(x)]^2=4x^2$, logo $L=\int_0^1\sqrt{1+4x^2}\,dx$.`,
            ),
            gen((rng) => {
              const [p, q, r] = pick(rng, [
                [3, 4, 5],
                [4, 3, 5],
                [5, 12, 13],
                [12, 5, 13],
              ] as const);
              const k = randInt(rng, 1, 3);
              const b = p * k;
              const ans = r * k;
              return num(
                t`Calcule pela integral de comprimento de arco o tamanho do segmento da reta $y=\frac{${q}}{${p}}x+2$ de $x=0$ até $x=${b}$.`,
                ans,
                t`$f'(x)=\frac{${q}}{${p}}\implies \sqrt{1+\left(\frac{${q}}{${p}}\right)^2}=\frac{${r}}{${p}}$. Integrando de $0$ a $${b}$: $\frac{${r}}{${p}}\cdot ${b}=${ans}$.`,
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              return rmcq(
                rng,
                t`Monte a integral que fornece o comprimento de arco de $y=e^{${k}x}$ no intervalo $[0,\,1]$.`,
                t`$\int_0^1 \sqrt{1+${k * k}e^{${2 * k}x}}\,dx$`,
                [
                  t`$\int_0^1 \sqrt{1+${k}e^{${k}x}}\,dx$`,
                  t`$\int_0^1 \sqrt{1+e^{${2 * k}x}}\,dx$`,
                  t`$\int_0^1 (1+${k}e^{${k}x})\,dx$`,
                  t`$\int_0^1 \sqrt{1+${k * k}e^{x^2}}\,dx$`,
                ],
                t`$y'=${k}e^{${k}x}\implies (y')^2=${k * k}e^{${2 * k}x}$.`,
              );
            }),
            mcqS(
              t`Se uma curva é dada na forma paramétrica $(x(t),\,y(t))$ para $t\in[a,\,b]$, como se escreve o elemento de arco $ds$?`,
              t`$ds=\sqrt{[x'(t)]^2+[y'(t)]^2}\,dt$`,
              [
                t`$ds=\sqrt{1+[y'(t)]^2}\,dt$`,
                t`$ds=\big(|x'(t)|+|y'(t)|\big)\,dt$`,
                t`$ds=\sqrt{x(t)^2+y(t)^2}\,dt$`,
                t`$ds=x'(t)y'(t)\,dt$`,
              ],
              t`$ds=\sqrt{dx^2+dy^2}=\sqrt{(x'(t)\,dt)^2+(y'(t)\,dt)^2}=\sqrt{[x'(t)]^2+[y'(t)]^2}\,dt$.`,
            ),
            num(
              t`Uma partícula percorre a circunferência parametrizada por $x(t)=5\cos t$, $y(t)=5\operatorname{sen}t$ de $t=0$ a $t=\pi$. Como $\sqrt{(x')^2+(y')^2}=5$, o arco percorrido mede $L=k\pi$. Quanto vale $k$?`,
              5,
              t`$L=\int_0^\pi \sqrt{25\operatorname{sen}^2 t+25\cos^2 t}\,dt = \int_0^\pi 5\,dt = 5\pi\implies k=5$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Quando a raiz simplifica',
            body: t`A raiz $\sqrt{1+[f'(x)]^2}$ costuma ser difícil de integrar, mas simplifica exatamente em famílias importantes:
• **Potência $x^{3/2}$**: se $f(x)=\frac{2}{3}x^{3/2}$, então $f'(x)=x^{1/2}$ e $1+[f'(x)]^2=1+x$.
• **Quadrado perfeito e catenária**: em cabos suspensos $y=\cosh x=\frac{e^x+e^{-x}}{2}$, vale $1+\operatorname{senh}^2 x=\cosh^2 x$, eliminando a raiz!`,
            example: t`Para $f(x)=\frac{2}{3}x^{3/2}$ em $[0,\,3]$: $L=\int_0^3\sqrt{1+x}\,dx=\left[\frac{2}{3}(1+x)^{3/2}\right]_0^3=\frac{2}{3}(8-1)=\frac{14}{3}$.`,
            tip: t`Quando $y'=A-\frac{1}{4A}$, somar $1$ em $1+(y')^2$ apenas troca o sinal do meio: $\left(A+\frac{1}{4A}\right)^2$!`,
          },
          exercises: [
            order(
              t`Ordene os passos para calcular o comprimento de arco de $f(x)=\frac{2}{3}x^{3/2}$ em $[0,\,3]$:`,
              [
                t`Derivar a função: $f'(x)=x^{1/2}$`,
                t`Montar o radicando: $1+[f'(x)]^2 = 1+x$`,
                t`Integrar $\int_0^3 (1+x)^{1/2}\,dx = \left[\frac{2}{3}(1+x)^{3/2}\right]_0^3$`,
                t`Avaliar nos limites: $\frac{2}{3}(8-1)=\frac{14}{3}$`,
              ],
              t`A derivada $x^{1/2}$ ao quadrado vira $x$, permitindo integrar por substituição imediata $u=1+x$.`,
            ),
            num(
              t`Calcule o comprimento de arco de $f(x)=\frac{2}{3}x^{3/2}$ de $x=0$ até $x=8$ (fração ou decimal).`,
              52 / 3,
              t`$L=\int_0^8\sqrt{1+x}\,dx=\left[\frac{2}{3}(1+x)^{3/2}\right]_0^8=\frac{2}{3}(27-1)=\frac{52}{3}\approx 17{,}333$.`,
              { tol: 0.01 },
            ),
            gen((rng) => {
              const m = randInt(rng, 2, 4);
              const b = m * m;
              const ans = (2 * (m ** 3 - 1)) / 3;
              return num(
                t`Calcule o comprimento de arco de $f(x)=\frac{2}{3}(x-1)^{3/2}$ de $x=1$ até $x=${b}$ (fração ou decimal).`,
                ans,
                t`$f'(x)=(x-1)^{1/2}\implies 1+[f'(x)]^2=x$. Logo $L=\int_1^{${b}}\sqrt{x}\,dx=\frac{2}{3}(${m ** 3}-1)=\frac{${2 * (m ** 3 - 1)}}{3}$.`,
                { tol: 0.01 },
              );
            }),
            mcqS(
              t`Para $y=\frac{x^3}{6}+\frac{1}{2x}$ ($x>0$), temos $y'=\frac{x^2}{2}-\frac{1}{2x^2}$. Ao calcular $1+(y')^2$, obtemos o quadrado perfeito:`,
              t`$\left(\frac{x^2}{2}+\frac{1}{2x^2}\right)^2$`,
              [
                t`$\left(\frac{x^2}{2}-\frac{1}{2x^2}\right)^2$`,
                t`$\left(x^2+\frac{1}{x^2}\right)^2$`,
                t`$\left(\frac{x^3}{6}+\frac{1}{2x}\right)^2$`,
                t`$x^4+\frac{1}{x^4}$`,
              ],
              t`$1+\left(\frac{x^4}{4}-\frac12+\frac{1}{4x^4}\right)=\frac{x^4}{4}+\frac12+\frac{1}{4x^4}=\left(\frac{x^2}{2}+\frac{1}{2x^2}\right)^2$.`,
            ),
            num(
              t`Usando a simplificação acima, calcule o comprimento de arco de $y=\frac{x^3}{6}+\frac{1}{2x}$ de $x=1$ até $x=2$ (fração ou decimal).`,
              17 / 12,
              t`$L=\int_1^2\left(\frac{x^2}{2}+\frac{1}{2x^2}\right)dx=\left[\frac{x^3}{6}-\frac{1}{2x}\right]_1^2=\left(\frac86-\frac14\right)-\left(\frac16-\frac12\right)=\frac{17}{12}\approx 1{,}417$.`,
              { tol: 0.005 },
            ),
            mcqS(
              t`Um cabo de alta tensão suspenso entre duas torres assume a forma da catenária $y=\cosh x=\frac{e^x+e^{-x}}{2}$. Qual é o comprimento do cabo em $[-a,\,a]$?`,
              t`$2\operatorname{senh}a = e^a-e^{-a}$`,
              [
                t`$2\cosh a = e^a+e^{-a}$`,
                t`$2a$`,
                t`$\operatorname{senh}(2a)$`,
                t`$a\cosh a$`,
              ],
              t`Como $\sqrt{1+\operatorname{senh}^2 x}=\cosh x$, temos $L=\int_{-a}^a\cosh x\,dx=[\operatorname{senh}x]_{-a}^a=2\operatorname{senh}a=e^a-e^{-a}$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 1, 3);
              return num(
                t`Para $y=\frac{x^2}{4}-\frac12\ln x$ em $[1,\,e^{${k}}]$, vale $\sqrt{1+(y')^2}=\frac{x}{2}+\frac{1}{2x}$. Se o comprimento de arco é $L=\frac{e^{${2 * k}}-1}{4}+A$, quanto vale $A$?`,
                0.5 * k,
                t`$\int_1^{e^{${k}}}\left(\frac{x}{2}+\frac{1}{2x}\right)dx=\left[\frac{x^2}{4}+\frac12\ln x\right]_1^{e^{${k}}}=\frac{e^{${2 * k}}-1}{4}+${fmt(0.5 * k)}\implies A=${fmt(0.5 * k)}$.`,
              );
            }),
            num(
              t`Calcule o comprimento da trajetória paramétrica $x(t)=t^2$, $y(t)=\frac{2}{3}t^3$ de $t=0$ até $t=\sqrt{3}$ (fração ou decimal).`,
              14 / 3,
              t`$\sqrt{(2t)^2+(2t^2)^2}=2t\sqrt{1+t^2}\implies L=\int_0^{\sqrt{3}}2t\sqrt{1+t^2}\,dt=\left[\frac{2}{3}(1+t^2)^{3/2}\right]_0^{\sqrt{3}}=\frac{14}{3}\approx 4{,}667$.`,
              { tol: 0.01 },
            ),
          ],
        },
        {
          card: {
            title: 'Pintando o sólido: área de superfície',
            body: t`Quando um pequeno arco $ds$ na altura $y=f(x)\ge 0$ gira em torno do eixo $x$, ele varre uma fita troncocônica de circunferência $2\pi f(x)$ e largura inclinada $ds$ (e **não** $dx$!). Somando todas as fitas:

Mova a posição $x_0$ da fita no paraboloide 3D:`,
            formula: t`S=2\pi\int_a^b f(x)\sqrt{1+\big[f'(x)\big]^2}\,dx`,
            visual: surfaceRev3DLab(),
            example: t`Esfera de raio $R$ ($y=\sqrt{R^2-x^2}$ em $[-R,\,R]$): $y\sqrt{1+(y')^2}=R\implies S=2\pi\int_{-R}^R R\,dx=4\pi R^2$.`,
            tip: t`Compare: casca cilíndrica usa $2\pi x\,f(x)\,dx$ (volume); área de superfície usa $2\pi f(x)\,ds$ (área da casca externa inclinada).`,
          },
          exercises: [
            tf(
              t`Na fórmula da área de superfície de revolução em torno do eixo $x$, multiplicamos a circunferência $2\pi f(x)$ por $dx$ em vez de $ds$.`,
              false,
              t`Falso! Como a parede do sólido é inclinada, a largura da fita é a hipotenusa $ds=\sqrt{1+[f'(x)]^2}\,dx$.`,
            ),
            inter(
              t`No modelo 3D da superfície de revolução ($y=\sqrt{x}$ em $[0,\,2]$), posicione a fita dourada em $x_0=1$.`,
              'space3d',
              surfaceRev3DLab().props!,
              (v: any) => v && near(v.p.x0, 1, 0.05),
              t`$x_0=1$`,
              t`Em $x_0=1$, o raio da fita é $f(1)=1$ e o fator de inclinação vale $\sqrt{1+1/4}=\frac{\sqrt{5}}{2}\approx 1{,}12$.`,
            ),
            mcqS(
              t`Qual integral calcula a área da superfície gerada ao girar $y=x^3$ ($0\le x\le 1$) em torno do eixo $x$?`,
              t`$2\pi\int_0^1 x^3\sqrt{1+9x^4}\,dx$`,
              [
                t`$2\pi\int_0^1 x^3\sqrt{1+3x^2}\,dx$`,
                t`$\pi\int_0^1 x^6\,dx$`,
                t`$2\pi\int_0^1 \sqrt{1+9x^4}\,dx$`,
                t`$2\pi\int_0^1 x\sqrt{1+9x^4}\,dx$`,
              ],
              t`$f(x)=x^3$ e $f'(x)=3x^2\implies 2\pi\int_0^1 x^3\sqrt{1+(3x^2)^2}\,dx$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 1, 3);
              const b = 4 * k;
              const A = 15 * k * k;
              return num(
                t`Girando o segmento de reta $y=\frac{3}{4}x$ de $x=0$ até $x=${b}$ em torno do eixo $x$, forma-se a lateral de um cone de área $S=A\pi$. Quanto vale $A$?`,
                A,
                t`$\sqrt{1+(3/4)^2}=\frac54\implies S=2\pi\int_0^{${b}}\frac34 x\cdot\frac54\,dx = \frac{15\pi}{8}\left[\frac{x^2}{2}\right]_0^{${b}} = ${A}\pi\implies A=${A}$.`,
              );
            }),
            num(
              t`Para o refletor parabólico gerado ao girar $y=\sqrt{x}$ de $x=0$ a $x=2$ em torno do eixo $x$, temos $y\sqrt{1+(y')^2}=\sqrt{x+\frac14}$. Se a área da superfície é $S=k\pi$, calcule $k$ (fração ou decimal).`,
              13 / 3,
              t`$k=2\int_0^2\left(x+\frac14\right)^{1/2}dx=\frac43\left[\left(\frac94\right)^{3/2}-\left(\frac14\right)^{3/2}\right]=\frac43\cdot\frac{26}{8}=\frac{13}{3}\approx 4{,}333$.`,
              { tol: 0.01 },
            ),
            gen((rng) => {
              const R = randInt(rng, 2, 6);
              const h = randInt(rng, 1, R);
              const k = 2 * R * h;
              return num(
                t`Numa esfera de raio $R=${R}$ ($y=\sqrt{${R * R}-x^2}$), o produto $y\sqrt{1+(y')^2}$ é constante e vale $R=${R}$. A área de uma faixa esférica de largura $\Delta x=${h}$ é $S=k\pi$. Quanto vale $k$?`,
                k,
                t`$S=2\pi\int_a^{a+${h}} ${R}\,dx = 2\pi\cdot ${R}\cdot ${h} = ${k}\pi\implies k=${k}$ (Teorema de Arquimedes).`,
              );
            }),
            mcqS(
              t`Se a curva $y=f(x)$ ($x\in[a,\,b]$, $x\ge 0$) gira em torno do **eixo $y$**, o raio de giro de cada ponto passa a ser $x$. Qual é a fórmula da área de superfície?`,
              t`$S=2\pi\int_a^b x\sqrt{1+[f'(x)]^2}\,dx$`,
              [
                t`$S=2\pi\int_a^b f(x)\sqrt{1+[f'(x)]^2}\,dx$`,
                t`$S=2\pi\int_a^b x\,f(x)\,dx$`,
                t`$S=\pi\int_a^b x^2\sqrt{1+[f'(x)]^2}\,dx$`,
              ],
              t`A circunferência da fita em torno do eixo $y$ é $2\pi x$, multiplicada pelo comprimento $ds=\sqrt{1+[f'(x)]^2}\,dx$.`,
            ),
            num(
              t`Calcule a área da superfície gerada ao girar $y=x^3$ de $x=0$ a $x=1$ em torno do eixo $x$ (arredonde com 2 casas decimais).`,
              (Math.PI / 27) * (10 * Math.sqrt(10) - 1),
              t`Com $u=1+9x^4$ ($du=36x^3\,dx$): $S=\frac{2\pi}{36}\left[\frac23 u^{3/2}\right]_1^{10}=\frac{\pi}{27}(10\sqrt{10}-1)\approx 3{,}56$.`,
              { tol: 0.02 },
            ),
          ],
        },
      ],
    },
    {
      id: 'c-apli-fis',
      title: 'Aplicações físicas na engenharia',
      parts: [
        {
          card: {
            title: 'Trabalho e Lei de Hooke',
            body: t`Quando uma força $F(x)$ varia ao longo do deslocamento, dividimos o caminho em trechos $dx$ nos quais a força é praticamente constante e somamos $dW=F(x)\,dx$:
$$W=\int_a^b F(x)\,dx$$

Pela **Lei de Hooke**, esticar uma mola em $x$ além do comprimento natural exige $F(x)=kx$. Ajuste $b$ e veja o trabalho como a área sob $F(x)$:`,
            formula: t`W=\int_a^b F(x)\,dx`,
            visual: springWorkLab(),
            example: t`Se uma mola exige $40\text{ N}$ para esticar $0{,}2\text{ m}$, então $k=\frac{40}{0{,}2}=200\text{ N/m}$. De $0$ a $0{,}3\text{ m}$: $W=\int_0^{0{,}3}200x\,dx=9\text{ J}$.`,
            tip: t`Esticar de $0$ a $L$ consome $\frac12 kL^2$, mas esticar de $L$ a $2L$ consome $\int_L^{2L}kx\,dx=\frac32 kL^2$ — o **triplo** do trabalho!`,
          },
          exercises: [
            mcq(
              t`Geometricamente, no gráfico da força $F(x)$ pela posição $x$, o trabalho $W=\int_a^b F(x)\,dx$ representa…`,
              ['a área com sinal sob a curva de $F(x)$ entre $a$ e $b$', 'a inclinação da reta tangente a $F(x)$', 'o valor médio dividido por $b-a$', 'a derivada $F\'(x)$'],
              0,
              t`Cada retângulo $F(x)\,dx$ é o trabalho num pequeno deslocamento; a soma é a área sob o gráfico.`,
            ),
            inter(
              t`No laboratório da mola ($k=20\text{ N/m}$), ajuste a deformação final $b$ para que o trabalho acumulado seja $W=90\text{ J}$.`,
              'plot',
              springWorkLab().props,
              (v: any) => v && near(v.p.b, 3, 0.05),
              t`$b=3\text{ m}$`,
              t`$W=\int_0^b 20x\,dx = 10b^2 = 90\implies b=3\text{ m}$.`,
            ),
            gen((rng) => {
              const m = randInt(rng, 1, 5);
              const b = randInt(rng, 2, 4);
              const ans = 10 * m * b * b;
              return num(
                t`Uma mola industrial tem constante elástica $k=${20 * m}\text{ N/m}$. Qual o trabalho necessário para esticá-la da posição natural ($x=0$) até $x=${b}\text{ m}$?`,
                ans,
                t`$W=\int_0^{${b}} ${20 * m}x\,dx = \left[${10 * m}x^2\right]_0^{${b}} = ${ans}\text{ J}$.`,
                { unit: 'J' },
              );
            }),
            tf(
              t`Esticar uma mola de $x=1\text{ m}$ até $x=2\text{ m}$ exige exatamente o mesmo trabalho que esticá-la de $x=0$ até $x=1\text{ m}$.`,
              false,
              t`De $0$ a $1$ o trabalho é $\frac12 k$; de $1$ a $2$ a mola já está tensionada e exige $\int_1^2 kx\,dx=\frac32 k$, três vezes mais!`,
            ),
            gen((rng) => {
              const k = 10 * randInt(rng, 1, 5);
              const F0 = 2 * k;
              const ans = 8 * k;
              return num(
                t`Uma força de $${F0}\text{ N}$ mantém uma mola esticada em $2\text{ m}$ além do seu comprimento natural. Qual o trabalho para esticá-la de $x=0$ até $x=4\text{ m}$?`,
                ans,
                t`Como $F(2)=2k=${F0}\implies k=${k}\text{ N/m}$, temos $W=\int_0^4 ${k}x\,dx = \left[${k / 2}x^2\right]_0^4 = ${ans}\text{ J}$.`,
                { unit: 'J' },
              );
            }),
            num(
              t`Um atuador aplica a força variável $F(x)=3x^2+4x$ (em N, com $x$ em m) sobre um carro de testes. Qual o trabalho realizado de $x=1\text{ m}$ até $x=3\text{ m}$?`,
              42,
              t`$W=\int_1^3 (3x^2+4x)\,dx = [x^3+2x^2]_1^3 = (27+18)-(1+2) = 42\text{ J}$.`,
              { unit: 'J' },
            ),
            num(
              t`Um cabo de guindaste de $10\text{ m}$ pesa $40\text{ N/m}$. Um elemento a $y$ metros do topo percorre distância $y$, exigindo $dW=40y\,dy$. Qual o trabalho total para recolher todo o cabo até o topo?`,
              2000,
              t`$W=\int_0^{10} 40y\,dy = [20y^2]_0^{10} = 2000\text{ J}$.`,
              { unit: 'J' },
            ),
            mcqS(
              t`Um pistão expande um gás isotermicamente de $V_1$ até $V_2$ sob pressão $P(V)=\frac{c}{V}$. Qual expressão dá o trabalho $W=\int_{V_1}^{V_2} P(V)\,dV$?`,
              t`$c\ln\left(\frac{V_2}{V_1}\right)$`,
              [
                t`$c(V_2-V_1)$`,
                t`$-\frac{c}{V_2^2}+\frac{c}{V_1^2}$`,
                t`$\frac{c}{2}(V_2^2-V_1^2)$`,
                t`$\ln(cV_2-cV_1)$`,
              ],
              t`$\int_{V_1}^{V_2}\frac{c}{V}\,dV = c[\ln V]_{V_1}^{V_2} = c(\ln V_2-\ln V_1)=c\ln\left(\frac{V_2}{V_1}\right)$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Ponto de equilíbrio: centro de massa e centroide',
            body: t`• **Barra 1D** em $[a,\,b]$ com densidade linear $\rho(x)$: massa $M=\int_a^b\rho(x)\,dx$, momento $M_0=\int_a^b x\,\rho(x)\,dx$ e $\bar x=\frac{M_0}{M}$.
• **Placa plana homogênea (centroide)** sob $y=f(x)\ge 0$ de área $A=\int_a^b f(x)\,dx$:
$$\bar x=\frac{1}{A}\int_a^b x\,f(x)\,dx\qquad \bar y=\frac{1}{A}\int_a^b \frac{1}{2}\big[f(x)\big]^2\,dx$$

Varie o expoente $k$ de $y=x^k$ em $[0,\,1]$ e acompanhe o centroide $C$:`,
            visual: centroidLab(),
            example: t`Triângulo sob $y=x$ em $[0,\,1]$: $A=\frac12$, $\bar x=2\int_0^1 x^2\,dx=\frac23$ e $\bar y=2\int_0^1\frac12 x^2\,dx=\frac13$.`,
            tip: t`O fator $\frac12$ em $\bar y$ aparece porque o centro de cada tira vertical de altura $f(x)$ fica na metade da altura: $\frac{f(x)}{2}\cdot f(x)\,dx=\frac12[f(x)]^2\,dx$.`,
          },
          exercises: [
            mcq(
              t`Por que aparece o fator $\frac12$ na fórmula $\bar y=\frac{1}{A}\int_a^b\frac12[f(x)]^2\,dx$ do centroide de uma região sob $y=f(x)\ge 0$?`,
              [
                'porque o centroide de cada tira vertical de altura $f(x)$ está na altura média $f(x)/2$',
                'porque a derivada de $x^2$ é $2x$',
                t`porque dividimos o intervalo $[a,\,b]$ ao meio`,
                'porque a área da tira é $\\frac12 f(x)\\,dx$',
              ],
              0,
              t`O momento em relação ao eixo $x$ de uma tira de área $f(x)\,dx$ é $(\text{altura do centro})\times(\text{área})=\frac{f(x)}{2}\cdot f(x)\,dx$.`,
            ),
            inter(
              t`No laboratório do centroide ($y=x^k$ em $[0,\,1]$), ajuste o expoente $k$ para que a coordenada horizontal do centroide seja $\bar x=0{,}75$.`,
              'plot',
              centroidLab().props,
              (v: any) => v && near(v.p.k, 2, 0.05),
              t`$k=2$`,
              t`Para $y=x^2$ em $[0,\,1]$, $\bar x=\frac{k+1}{k+2}=\frac{3}{4}=0{,}75$ e $\bar y=0{,}3$.`,
            ),
            gen((rng) => {
              const L = randInt(rng, 2, 6);
              const c = randInt(rng, 1, 4);
              const ans = (2 * L) / 3;
              return num(
                t`Uma barra fina ocupa $[0,\,${L}]$ m com densidade linear $\rho(x)=${c === 1 ? '' : c}x\text{ kg/m}$. Qual é a posição $\bar x$ do seu centro de massa (fração ou decimal)?`,
                ans,
                t`$M=\int_0^{${L}}${c === 1 ? '' : c}x\,dx=\frac{${c * L * L}}{2}$ e $M_0=\int_0^{${L}}${c === 1 ? '' : c}x^2\,dx=\frac{${c * L ** 3}}{3}\implies \bar x=\frac{2}{3}\cdot ${L}=${fmt(ans, 3)}\text{ m}$.`,
                { tol: 0.01, unit: 'm' },
              );
            }),
            tf(
              t`Se uma região plana sob $y=f(x)$ em $[-a,\,a]$ é simétrica em relação ao eixo $y$ ($f$ é par), então seu centroide tem $\bar x=0$.`,
              true,
              t`Como $f(x)$ é par, $x\,f(x)$ é ímpar e $\int_{-a}^a x\,f(x)\,dx=0$, logo $\bar x=0$ (o centroide fica sobre o eixo de simetria).`,
            ),
            num(
              t`Calcule a massa total $M=\int_0^2 \rho(x)\,dx$ de uma viga de $2\text{ m}$ cuja densidade linear varia segundo $\rho(x)=3+2x\text{ kg/m}$.`,
              10,
              t`$M=\int_0^2(3+2x)\,dx=[3x+x^2]_0^2=6+4=10\text{ kg}$.`,
              { unit: 'kg' },
            ),
            num(
              t`Para a mesma viga ($\rho(x)=3+2x$ em $[0,\,2]$, massa $M=10\text{ kg}$), calcule a posição $\bar x=\frac{1}{10}\int_0^2 x(3+2x)\,dx$ do centro de massa (fração ou decimal).`,
              17 / 15,
              t`$M_0=\int_0^2(3x+2x^2)\,dx=\left[\frac32 x^2+\frac23 x^3\right]_0^2=6+\frac{16}{3}=\frac{34}{3}\implies \bar x=\frac{34}{30}=\frac{17}{15}\approx 1{,}133\text{ m}$.`,
              { tol: 0.01, unit: 'm' },
            ),
            gen((rng) => {
              const b = randInt(rng, 2, 4);
              const ans = 0.75 * b;
              return num(
                t`Para a placa sob $y=x^2$ no intervalo $[0,\,${b}]$, a área é $A=\frac{${b ** 3}}{3}$. Calcule a coordenada $\bar x=\frac{1}{A}\int_0^{${b}} x\cdot x^2\,dx$ do centroide.`,
                ans,
                t`$\int_0^{${b}} x^3\,dx=\frac{${b ** 4}}{4}\implies \bar x=\frac{${b ** 4}/4}{${b ** 3}/3}=\frac34\cdot ${b}=${fmt(ans, 2)}$.`,
              );
            }),
            num(
              t`Calcule a altura $\bar y$ do centroide de uma placa semicircular $y=\sqrt{9-x^2}$ em $[-3,\,3]$ (área $A=\frac{9\pi}{2}$), com 2 casas decimais.`,
              4 / Math.PI,
              t`$\int_{-3}^3\frac12(9-x^2)\,dx=18\implies \bar y=\frac{18}{9\pi/2}=\frac{4}{\pi}\approx 1{,}27$.`,
              { tol: 0.02 },
            ),
          ],
        },
        {
          card: {
            title: 'Hidrostática e bombeamento na engenharia',
            body: t`Em problemas com líquidos, fatie sempre na **horizontal** (espessura $dh$), pois todos os pontos na mesma profundidade $h$ sofrem a mesma pressão e percorrem a mesma distância vertical:
• **Força hidrostática em comporta**: pressão $P(h)=\rho g h$ em faixa de largura $L(h)$ dá $dF=\rho g h\,L(h)\,dh$.
• **Bombeamento**: fatia de área $A(h)$ elevada por $D(h)$ exige $dW=\rho g\,D(h)A(h)\,dh$.

Ajuste a profundidade $H$ da comporta no laboratório:`,
            formula: t`F=\int_a^b \rho g\,h\,L(h)\,dh`,
            visual: hydroLab(),
            example: t`Comporta retangular de largura $L=2\text{ m}$ de $h=0$ a $h=3\text{ m}$ ($\rho g=10\text{ kN/m}^3$): $F=\int_0^3 10h\cdot 2\,dh=[10h^2]_0^3=90\text{ kN}$.`,
            tip: t`A pressão hidrostática depende apenas da profundidade $h$ (e não da largura do reservatório atrás da barragem).`,
          },
          exercises: [
            mcq(
              t`Por que fatiamos uma comporta vertical submersa (ou um tanque cheio de líquido) em tiras **horizontais** de espessura $dh$?`,
              [
                'porque todos os pontos de uma mesma tira horizontal estão à mesma profundidade $h$ (mesma pressão)',
                'porque a gravidade atua na direção horizontal',
                'porque a largura $L(h)$ nunca depende de $h$',
                'para aplicar o método das cascas cilíndricas',
              ],
              0,
              t`Na mesma profundidade $h$, a pressão $P=\rho g h$ (e a altura de bombeamento) é constante ao longo de toda a tira.`,
            ),
            inter(
              t`No laboratório da comporta ($L=2\text{ m}$ e $\rho g=10\text{ kN/m}^3$), ajuste a profundidade $H$ para que a força hidrostática total seja $F=160\text{ kN}$.`,
              'plot',
              hydroLab().props,
              (v: any) => v && near(v.p.H, 4, 0.05),
              t`$H=4\text{ m}$`,
              t`$F=\int_0^H 20h\,dh = 10H^2 = 160\implies H=4\text{ m}$.`,
            ),
            gen((rng) => {
              const L = randInt(rng, 2, 5);
              const H = randInt(rng, 2, 4);
              const ans = 5 * L * H * H;
              return num(
                t`Uma comporta retangular de largura $L=${L}\text{ m}$ vai da superfície ($h=0$) até a profundidade $H=${H}\text{ m}$. Com $\rho g=10\text{ kN/m}^3$, qual é a força hidrostática total (em kN)?`,
                ans,
                t`$F=\int_0^{${H}} 10h\cdot ${L}\,dh = \left[${5 * L}h^2\right]_0^{${H}} = ${ans}\text{ kN}$.`,
                { unit: 'kN' },
              );
            }),
            order(
              t`Ordene a montagem da integral do trabalho para bombear toda a água de um tanque até a borda superior:`,
              [
                t`Fatiar o líquido horizontalmente à profundidade $h$ (espessura $dh$)`,
                t`Calcular o volume $dV=A(h)\,dh$ e o peso $dP=\rho g\,A(h)\,dh$ da fatia`,
                t`Multiplicar pela distância vertical $D(h)$ até a saída: $dW=\rho g\,D(h)A(h)\,dh$`,
                t`Integrar $dW$ entre as profundidades inicial e final do líquido`,
              ],
              t`Cada camada horizontal de peso $\rho g A(h)\,dh$ sobe uma distância $D(h)$ até o topo.`,
            ),
            gen((rng) => {
              const A = randInt(rng, 2, 5);
              const H = randInt(rng, 2, 4);
              const ans = 5 * A * H * H;
              return num(
                t`Um reservatório de seção transversal constante $A=${A}\text{ m}^2$ e profundidade $H=${H}\text{ m}$ está cheio de água ($\rho g=10\text{ kN/m}^3$). Qual o trabalho (em kJ) para bombear toda a água até a borda no topo ($h=0$)?`,
                ans,
                t`A fatia na profundidade $h$ sobe distância $h$: $W=\int_0^{${H}} 10\cdot h\cdot ${A}\,dh = \left[${5 * A}h^2\right]_0^{${H}} = ${ans}\text{ kJ}$.`,
                { unit: 'kJ' },
              );
            }),
            num(
              t`Uma comporta triangular tem largura $L(h)=6-2h\text{ m}$ na profundidade $h$, indo de $h=0$ até o vértice em $h=3\text{ m}$. Com $\rho g=10\text{ kN/m}^3$, calcule a força hidrostática $F=\int_0^3 10h(6-2h)\,dh$ (em kN).`,
              90,
              t`$F=10\int_0^3(6h-2h^2)\,dh = 10\left[3h^2-\frac23 h^3\right]_0^3 = 10(27-18) = 90\text{ kN}$.`,
              { unit: 'kN' },
            ),
            num(
              t`Um tanque cônico (vértice em $y=0$, topo aberto em $y=3\text{ m}$) tem raio $r(y)=y\text{ m}$, logo cada fatia tem área $A(y)=\pi y^2$ e sobe $D(y)=3-y$ até a borda. Com $\rho g=10\text{ kN/m}^3$, o trabalho para esvaziar o tanque cheio é $W=k\pi\text{ kJ}$. Quanto vale $k$?`,
              67.5,
              t`$W=\int_0^3 10(3-y)\pi y^2\,dy = 10\pi\left[y^3-\frac{y^4}{4}\right]_0^3 = 10\pi\cdot\frac{27}{4} = 67{,}5\pi\implies k=67{,}5$.`,
            ),
            match(
              t`Ligue cada grandeza física de engenharia à integral definida que a calcula:`,
              [
                [t`Trabalho de força variável $F(x)$`, t`$\int_a^b F(x)\,dx$`],
                [t`Momento estático de barra $\rho(x)$`, t`$\int_a^b x\,\rho(x)\,dx$`],
                [t`Força hidrostática em comporta`, t`$\int_a^b \rho g h\,L(h)\,dh$`],
                [t`Bombeamento de tanque até $y=H$`, t`$\int_0^H \rho g(H-y)A(y)\,dy$`],
              ],
              t`Resumo das quatro principais integrais físicas da engenharia.`,
            ),
          ],
        },
      ],
    },
  ],
};
