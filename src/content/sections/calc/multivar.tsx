import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { Arrow, CircleW, FnCurve, InfLine, ParamCurve, Pt } from '../../../components/plot/Plot';
import { Axes3, Line3, Point3, Poly3, type V3 } from '../../../components/visuals/Space3D';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, term } from '../../../lib/random';

const t = String.raw;
type Spec = VisualSpec & { props: Record<string, any> };

/* ---------------- curves ---------------- */

type Curve = { name: string; tex: string; x: (s: number) => number; y: (s: number) => number; dx: (s: number) => number; dy: (s: number) => number; ddx: (s: number) => number; ddy: (s: number) => number; t1: number };
const CURVES: Curve[] = [
  { name: 'circunferência', tex: '(2\\cos t,\\ 2\\operatorname{sen}t)', x: (s) => 2 * Math.cos(s), y: (s) => 2 * Math.sin(s), dx: (s) => -2 * Math.sin(s), dy: (s) => 2 * Math.cos(s), ddx: (s) => -2 * Math.cos(s), ddy: (s) => -2 * Math.sin(s), t1: 2 * Math.PI },
  { name: 'elipse', tex: '(3\\cos t,\\ \\operatorname{sen}t)', x: (s) => 3 * Math.cos(s), y: (s) => Math.sin(s), dx: (s) => -3 * Math.sin(s), dy: (s) => Math.cos(s), ddx: (s) => -3 * Math.cos(s), ddy: (s) => -Math.sin(s), t1: 2 * Math.PI },
  { name: 'parábola', tex: '(t,\\ t^2/2)', x: (s) => s - 2.5, y: (s) => (s - 2.5) ** 2 / 2, dx: () => 1, dy: (s) => s - 2.5, ddx: () => 0, ddy: () => 1, t1: 5 },
  { name: 'cicloide', tex: '(t-\\operatorname{sen}t,\\ 1-\\cos t)', x: (s) => s - Math.sin(s) - 3, y: (s) => 1 - Math.cos(s), dx: (s) => 1 - Math.cos(s), dy: (s) => Math.sin(s), ddx: (s) => Math.sin(s), ddy: (s) => Math.cos(s), t1: 2 * Math.PI },
];

/** Particle on a parametric curve with velocity (and optional acceleration) vectors. */
const particleLab = (opts: { c?: number; acc?: boolean } = {}) =>
  plot({
    view: { xMin: -4, xMax: 4, yMin: -2.6, yMax: 3.4 },
    equalAspect: true,
    params: [
      { key: 'c', label: 'curva', min: 0, max: 3, step: 1, value: opts.c ?? 0, color: C.p2, format: (v: number) => CURVES[Math.round(v)].name },
      { key: 's', label: 't', min: 0, max: 6.28, step: 0.02, value: 1, color: C.gold },
    ],
    render: ({ p }: any) => {
      const K = CURVES[Math.round(p.c)];
      const s = Math.min(p.s, K.t1);
      const x = K.x(s);
      const y = K.y(s);
      return (
        <>
          <ParamCurve fx={K.x} fy={K.y} t0={0} t1={K.t1} color={C.p1} />
          <Arrow x1={x} y1={y} x2={x + 0.5 * K.dx(s)} y2={y + 0.5 * K.dy(s)} color={C.success} />
          {opts.acc ? <Arrow x1={x} y1={y} x2={x + 0.5 * K.ddx(s)} y2={y + 0.5 * K.ddy(s)} color={C.danger} /> : null}
          <Pt x={x} y={y} color={C.gold} />
        </>
      );
    },
    info: ({ p }: any) => {
      const K = CURVES[Math.round(p.c)];
      const s = Math.min(p.s, K.t1);
      const sp = Math.hypot(K.dx(s), K.dy(s));
      return t`$\vec r(t)=${K.tex}$ · $t=${fmt(s, 2)}$ · verde: $\vec r\,'$ (velocidade), $|\vec r\,'|=${fmt(sp, 2)}$` + (opts.acc ? t` · vermelho: $\vec r\,''$` : '');
    },
  });

/** Helix (cos t, sin t, c t) in 3D with a moving point. */
const helixLab = (): Spec => ({
  name: 'space3d',
  props: {
    scale: 32,
    params: [
      { key: 'c', label: 'c', min: 0.05, max: 0.6, step: 0.05, value: 0.25, color: C.p3 },
      { key: 's', label: 't', min: 0, max: 12.5, step: 0.05, value: 3, color: C.gold },
    ],
    render: ({ p }: any) => {
      const pts: V3[] = [];
      for (let i = 0; i <= 160; i++) {
        const s = (12.5 * i) / 160;
        pts.push([1.5 * Math.cos(s), 1.5 * Math.sin(s), p.c * s - 1.5]);
      }
      const P: V3 = [1.5 * Math.cos(p.s), 1.5 * Math.sin(p.s), p.c * p.s - 1.5];
      const T: V3 = [P[0] - 1.5 * Math.sin(p.s) * 0.6, P[1] + 1.5 * Math.cos(p.s) * 0.6, P[2] + p.c * 0.6];
      return (
        <>
          <Axes3 size={2.6} />
          {pts.slice(1).map((q, i) => <Line3 key={i} a={pts[i]} b={q} color={C.p1} width={2.5} />)}
          <Line3 a={P} b={T} color={C.success} width={3.5} />
          <Point3 at={P} color={C.gold} r={6} />
        </>
      );
    },
    info: ({ p }: any) => t`$\vec r(t)=(1{,}5\cos t,\,1{,}5\operatorname{sen}t,\,${fmt(p.c, 2)}t)$ · passo (subida por volta) $=2\pi c\approx${fmt(2 * Math.PI * p.c, 2)}$`,
  },
});

/** Osculating circle on y = x^2 / 2 (or y = sin x). */
const curvatureLab = () =>
  plot({
    view: { xMin: -3.5, xMax: 3.5, yMin: -1.5, yMax: 4 },
    equalAspect: true,
    params: [
      { key: 'f', label: 'curva', min: 0, max: 1, step: 1, value: 0, color: C.p2, format: (v: number) => (Math.round(v) ? 'y = sen x' : 'y = x²/2') },
      { key: 'x', label: 'x_0', min: -2.5, max: 2.5, step: 0.05, value: 0, color: C.gold },
    ],
    render: ({ p }: any) => {
      const sin = Math.round(p.f) === 1;
      const f = sin ? Math.sin : (x: number) => (x * x) / 2;
      const d1 = sin ? Math.cos(p.x) : p.x;
      const d2 = sin ? -Math.sin(p.x) : 1;
      const k = Math.abs(d2) / (1 + d1 * d1) ** 1.5;
      const R = k > 1e-4 ? 1 / k : NaN;
      const nrm = Math.hypot(1, d1);
      const sg = d2 >= 0 ? 1 : -1;
      const cx = p.x - (sg * d1 * R) / nrm;
      const cy = f(p.x) + (sg * R) / nrm;
      return (
        <>
          <FnCurve f={f} color={C.p1} />
          {isFinite(R) && R < 30 ? <CircleW cx={cx} cy={cy} r={R} color={C.gold} width={2} dash="6 4" /> : null}
          <Pt x={p.x} y={f(p.x)} color={C.gold} />
        </>
      );
    },
    info: ({ p }: any) => {
      const sin = Math.round(p.f) === 1;
      const d1 = sin ? Math.cos(p.x) : p.x;
      const d2 = sin ? -Math.sin(p.x) : 1;
      const k = Math.abs(d2) / (1 + d1 * d1) ** 1.5;
      return t`$\kappa=\dfrac{|y''|}{(1+y'^2)^{3/2}}=${fmt(k, 3)}$ · raio do círculo osculador $=\frac1\kappa\approx${k > 1e-4 ? fmt(1 / k, 2) : '\\infty'}$`;
    },
  });

/* ---------------- several variables ---------------- */

/** Approaching (0,0) along y = m x for f = xy/(x^2+y^2). */
const pathLimitLab = () =>
  plot({
    view: { xMin: -3, xMax: 3, yMin: -3, yMax: 3 },
    equalAspect: true,
    params: [{ key: 'm', label: 'm', min: -3, max: 3, step: 0.1, value: 1, color: C.p5 }],
    render: ({ p }: any) => (
      <>
        <InfLine x1={0} y1={0} x2={1} y2={p.m} color={C.p5} width={2.5} />
        <Pt x={0} y={0} color={C.gold} r={5} hollow />
        <Pt x={1.5} y={1.5 * p.m} color={C.p5} r={4} />
        <Pt x={0.5} y={0.5 * p.m} color={C.p5} r={4} />
      </>
    ),
    info: ({ p }: any) => t`$f(x,y)=\dfrac{xy}{x^2+y^2}$ ao longo de $y=${fmt(p.m, 1)}x$: $f=\dfrac{m}{1+m^2}=${fmt(p.m / (1 + p.m * p.m), 3)}$ (constante!) — o valor depende de $m$ ⟹ **o limite em $(0,0)$ não existe**`,
  });

/** Level ellipses of f = x^2 + 2y^2, draggable point, gradient and a direction u(θ). */
const directionalLab = () =>
  plot({
    view: { xMin: -3.5, xMax: 3.5, yMin: -2.6, yMax: 2.6 },
    equalAspect: true,
    points: [{ id: 'P', x: 1.5, y: 1, color: C.gold, label: 'P' }],
    params: [{ key: 'th', label: '\\theta', min: 0, max: 360, step: 5, value: 45, color: C.p2, format: (v: number) => v + '°' }],
    render: ({ pts, p }: any) => {
      const { x, y } = pts.P;
      const gx = 2 * x;
      const gy = 4 * y;
      const g = Math.hypot(gx, gy) || 1;
      const a = (p.th * Math.PI) / 180;
      const lv = [1, 2, 4, 6, 9].map((k) => <ParamCurve key={k} fx={(s) => Math.sqrt(k) * Math.cos(s)} fy={(s) => Math.sqrt(k / 2) * Math.sin(s)} t0={0} t1={2 * Math.PI} color={C.textMuted} width={1.4} />);
      return (
        <>
          {lv}
          <Arrow x1={x} y1={y} x2={x + (0.9 * gx) / g} y2={y + (0.9 * gy) / g} color={C.danger} />
          <Arrow x1={x} y1={y} x2={x + 0.9 * Math.cos(a)} y2={y + 0.9 * Math.sin(a)} color={C.p2} />
        </>
      );
    },
    info: ({ pts, p }: any) => {
      const { x, y } = pts.P;
      const a = (p.th * Math.PI) / 180;
      const D = 2 * x * Math.cos(a) + 4 * y * Math.sin(a);
      return t`$f=x^2+2y^2$ · $\nabla f=(${fmt(2 * x, 1)},\,${fmt(4 * y, 1)})$ (vermelho) · $D_{\vec u}f=\nabla f\cdot\vec u=${fmt(D, 2)}$ · máximo possível $|\nabla f|=${fmt(Math.hypot(2 * x, 4 * y), 2)}$`;
    },
  });

/** Surface z = 4 - (x^2 + y^2)/2 with its tangent plane at (x0, y0). */
const tangentPlaneLab = (): Spec => ({
  name: 'space3d',
  props: {
    scale: 30,
    params: [
      { key: 'x', label: 'x_0', min: -1.5, max: 1.5, step: 0.1, value: 0.8, color: '#FF6B6B' },
      { key: 'y', label: 'y_0', min: -1.5, max: 1.5, step: 0.1, value: 0.5, color: '#51CF66' },
    ],
    render: ({ p }: any) => {
      const f = (x: number, y: number) => 2.5 - (x * x + y * y) / 2;
      const lines: React.ReactNode[] = [];
      const R = 2;
      for (let i = 0; i <= 8; i++) {
        const u = -R + (2 * R * i) / 8;
        for (let j = 0; j < 16; j++) {
          const v0 = -R + (2 * R * j) / 16;
          const v1 = -R + (2 * R * (j + 1)) / 16;
          lines.push(<Line3 key={`a${i}-${j}`} a={[u, v0, f(u, v0)]} b={[u, v1, f(u, v1)]} color={C.p1} width={1} />);
          lines.push(<Line3 key={`b${i}-${j}`} a={[v0, u, f(v0, u)]} b={[v1, u, f(v1, u)]} color={C.p1} width={1} />);
        }
      }
      const z0 = f(p.x, p.y);
      const fx = -p.x;
      const fy = -p.y;
      const L = (x: number, y: number): V3 => [x, y, z0 + fx * (x - p.x) + fy * (y - p.y)];
      const h = 0.9;
      return (
        <>
          <Axes3 size={2.6} />
          {lines}
          <Poly3 pts={[L(p.x - h, p.y - h), L(p.x + h, p.y - h), L(p.x + h, p.y + h), L(p.x - h, p.y + h)]} color={C.gold} opacity={0.35} stroke={C.gold} />
          <Point3 at={[p.x, p.y, z0]} color={C.gold} r={6} />
        </>
      );
    },
    info: ({ p }: any) => {
      const z0 = 2.5 - (p.x * p.x + p.y * p.y) / 2;
      return t`$z=2{,}5-\frac{x^2+y^2}{2}$ · plano tangente: $z=${fmt(z0, 2)}${term(Math.round(-p.x * 10) / 10, `(x-${fmt(p.x, 1)})`)}${term(Math.round(-p.y * 10) / 10, `(y-${fmt(p.y, 1)})`)}$`.replace(/--/g, '+');
    },
  },
});

const EXT = [
  { name: 'mínimo', tex: 'x^2+y^2', f: (x: number, y: number) => (x * x + y * y) / 2, D: '4>0,\\ f_{xx}=2>0' },
  { name: 'máximo', tex: '-(x^2+y^2)', f: (x: number, y: number) => -(x * x + y * y) / 2, D: '4>0,\\ f_{xx}=-2<0' },
  { name: 'sela', tex: 'x^2-y^2', f: (x: number, y: number) => (x * x - y * y) / 2, D: '-4<0' },
  { name: 'degenerado', tex: 'x^4+y^4', f: (x: number, y: number) => (x ** 4 + y ** 4) / 4, D: '0\\ (\\text{teste inconclusivo})' },
];

/** Critical point types at the origin. */
const extremaLab = (k0 = 0): Spec => ({
  name: 'space3d',
  props: {
    scale: 34,
    params: [{ key: 'k', label: 'tipo', min: 0, max: 3, step: 1, value: k0, color: C.p2, format: (v: number) => EXT[Math.round(v)].name }],
    render: ({ p }: any) => {
      const E = EXT[Math.round(p.k)];
      const lines: React.ReactNode[] = [];
      const R = 1.8;
      for (let i = 0; i <= 8; i++) {
        const u = -R + (2 * R * i) / 8;
        for (let j = 0; j < 14; j++) {
          const v0 = -R + (2 * R * j) / 14;
          const v1 = -R + (2 * R * (j + 1)) / 14;
          lines.push(<Line3 key={`a${i}-${j}`} a={[u, v0, E.f(u, v0)]} b={[u, v1, E.f(u, v1)]} color={C.p1} width={1} />);
          lines.push(<Line3 key={`b${i}-${j}`} a={[v0, u, E.f(v0, u)]} b={[v1, u, E.f(v1, u)]} color={C.p1} width={1} />);
        }
      }
      return (
        <>
          <Axes3 size={2.2} />
          {lines}
          <Point3 at={[0, 0, 0]} color={C.gold} r={6} />
        </>
      );
    },
    info: ({ p }: any) => {
      const E = EXT[Math.round(p.k)];
      return t`$f=${E.tex}$ · na origem $\nabla f=\vec 0$ · $D=${E.D}$ ⟹ **${E.name}**`;
    },
  },
});

/** Maximise f = xy on the line x + y = 4 (point constrained to the line). */
const lagrangeLab = () =>
  plot({
    view: { xMin: -0.5, xMax: 5, yMin: -0.5, yMax: 5 },
    equalAspect: true,
    points: [{ id: 'P', x: 3.2, y: 0.8, color: C.gold, label: 'P' }],
    constrain: (_: string, x: number) => {
      const xx = Math.max(0.2, Math.min(3.8, x));
      return { x: xx, y: 4 - xx };
    },
    render: ({ pts }: any) => {
      const { x, y } = pts.P;
      const gf = Math.hypot(y, x) || 1;
      return (
        <>
          {[1, 2, 3, 4, 5].map((k) => <FnCurve key={k} f={(s) => k / s} from={0.15} color={k === 4 ? C.p3 : C.textMuted} width={k === 4 ? 2 : 1.2} />)}
          <InfLine x1={0} y1={4} x2={4} y2={0} color={C.p2} width={2.5} />
          <Arrow x1={x} y1={y} x2={x + (0.9 * y) / gf} y2={y + (0.9 * x) / gf} color={C.danger} />
          <Arrow x1={x} y1={y} x2={x + 0.64} y2={y + 0.64} color={C.success} />
        </>
      );
    },
    info: ({ pts }: any) => {
      const { x, y } = pts.P;
      const cosang = (y + x) / (Math.hypot(x, y) * Math.SQRT2);
      return t`Restrição $x+y=4$ · $f=xy=${fmt(x * y, 2)}$ · vermelho: $\nabla f=(y,\,x)$, verde: $\nabla g=(1,\,1)$` + (cosang > 0.9995 ? t` · **paralelos**: máximo!` : '');
    },
  });

export const curvas: UnitDef = {
  id: 'c-curva',
  title: 'Funções vetoriais e curvas',
  subtitle: 'Trajetórias, velocidade, comprimento e curvatura',
  icon: '🎢',
  source: 'Cálculo 3 · Funções vetoriais',
  guide: t`Uma **função vetorial** $\vec r(t)=(x(t),\,y(t),\,z(t))$ descreve a trajetória de uma partícula. Derivando coordenada a coordenada obtemos a **velocidade** $\vec r\,'$ (tangente à curva) e a **aceleração** $\vec r\,''$. Integrando $|\vec r\,'|$ obtemos o **comprimento de arco**, e a **curvatura** $\kappa$ mede o quanto a curva se dobra.`,
  lessons: [
    {
      id: 'c-curva-param',
      title: 'Curvas parametrizadas',
      parts: [
        {
          card: {
            title: 'O tempo como parâmetro',
            body: t`Em vez de $y=f(x)$, damos as duas coordenadas em função de um **parâmetro** $t$:

$$\vec r(t)=(x(t),\,y(t))$$

Isso descreve não só a forma da curva, mas **como** ela é percorrida (sentido e rapidez). Escolha a curva e mova $t$:`,
            visual: particleLab(),
            example: t`$\vec r(t)=(2\cos t,\,2\operatorname{sen}t)$, $0\le t\le2\pi$: circunferência de raio $2$ no sentido anti-horário, começando em $(2,\,0)$.`,
          },
          exercises: [
            mcqS(t`Qual curva é descrita por $\vec r(t)=(3\cos t,\,3\operatorname{sen}t)$?`, 'circunferência de raio 3', ['elipse de semieixos 3 e 1', 'reta', 'parábola', 'circunferência de raio 9'], t`$x^2+y^2=9(\cos^2t+\operatorname{sen}^2t)=9$.`),
            gen((rng) => {
              const a = randNZ(rng, -3, 3);
              const b = randNZ(rng, -3, 3);
              const x0 = randInt(rng, -3, 3);
              const y0 = randInt(rng, -3, 3);
              const tt = randNZ(rng, -2, 3);
              return rmcq(rng, t`Onde está a partícula $\vec r(t)=(${x0}${term(a, 't')},\,${y0}${term(b, 't')})$ em $t=${tt}$?`, `$(${x0 + a * tt},\\,${y0 + b * tt})$`, [`$(${x0 - a * tt},\\,${y0 - b * tt})$`, `$(${a + x0 * tt},\\,${b + y0 * tt})$`, `$(${x0 + a * tt},\\,${y0})$`], t`Substitua $t=${tt}$ em cada coordenada.`);
            }),
            mcqS(t`Eliminando o parâmetro em $x=t$, $y=t^2$, obtemos:`, t`$y=x^2$`, [t`$x=y^2$`, t`$y=2x$`, t`$x^2+y^2=1$`, t`$y=\sqrt x$`], t`$t=x$ ⟹ $y=x^2$.`),
            tf(t`$(\cos t,\,\operatorname{sen}t)$ e $(\cos 2t,\,\operatorname{sen}2t)$, para $0\le t\le\pi$, descrevem a mesma trajetória percorrida no mesmo tempo.`, false, t`A segunda dá a volta completa em $[0,\,\pi]$ (duas vezes mais rápido); a primeira só meia volta.`),
            inter(t`No lab, escolha a **cicloide** (curva nº 4) e leve a partícula ao ponto mais alto ($t=\pi$).`, 'plot', particleLab().props, (v: any) => v && Math.round(v.p.c) === 3 && near(v.p.s, Math.PI, 0.06), t`Na cicloide $y=1-\cos t$ é máximo em $t=\pi$.`, t`Na cicloide $(t-\operatorname{sen}t,\ 1-\cos t)$, a altura $y=1-\cos t$ é máxima quando $\cos t=-1$, ou seja, em $t=\pi$ (altura $2$).`),
            mcqS(t`A elipse $\frac{x^2}{9}+\frac{y^2}{4}=1$ pode ser parametrizada por:`, t`$(3\cos t,\,2\operatorname{sen}t)$`, [t`$(9\cos t,\,4\operatorname{sen}t)$`, t`$(2\cos t,\,3\operatorname{sen}t)$`, t`$(3t,\,2t)$`, t`$(\cos 3t,\,\operatorname{sen}2t)$`], t`$\frac{9\cos^2t}{9}+\frac{4\operatorname{sen}^2t}{4}=1$.`),
            gen((rng) => {
              const A = [randInt(rng, -3, 3), randInt(rng, -3, 3)];
              const B = [randInt(rng, -3, 3), randInt(rng, -3, 3)];
              if (A[0] === B[0] && A[1] === B[1]) B[0] += 2;
              return rmcq(rng, t`Parametrização do segmento de $A(${A[0]},\,${A[1]})$ a $B(${B[0]},\,${B[1]})$, $0\le t\le1$:`, `$(${A[0]}${term(B[0] - A[0], 't')},\\,${A[1]}${term(B[1] - A[1], 't')})$`, [`$(${B[0]}${term(A[0] - B[0], 't')},\\,${B[1]}${term(A[1] - B[1], 't')})$`, `$(${A[0]}${term(B[0], 't')},\\,${A[1]}${term(B[1], 't')})$`, `$(${A[0] + B[0]}t,\\,${A[1] + B[1]}t)$`], t`$\vec r(t)=A+t(B-A)$ começa em $A$ e termina em $B$.`);
            }),
            num(t`Em que valor de $t$ a curva $\vec r(t)=(t^2-1,\,t+2)$ cruza o eixo $y$ com $t>0$?`, 1, t`Eixo $y$: $x=0\Rightarrow t^2=1\Rightarrow t=1$.`),
          ],
        },
        {
          card: {
            title: 'Curvas no espaço',
            body: t`No espaço, $\vec r(t)=(x(t),\,y(t),\,z(t))$. O exemplo clássico é a **hélice**:

$$\vec r(t)=(\cos t,\,\operatorname{sen}t,\,c\,t)$$

Ela gira em torno do eixo $z$ enquanto sobe — como uma mola ou a rosca de um parafuso. A cada volta sobe $2\pi c$ (o **passo**).`,
            visual: helixLab(),
          },
          exercises: [
            mcq(t`A projeção da hélice $(\cos t,\,\operatorname{sen}t,\,t)$ no plano $xy$ é…`, ['uma circunferência', 'uma reta', 'uma parábola', 'um ponto'], 0, t`$(\cos t,\,\operatorname{sen}t)$.`),
            gen((rng) => {
              const c = randInt(rng, 1, 5);
              return num(t`Quanto a hélice $(\cos t,\,\operatorname{sen}t,\,${c}t)$ sobe a cada volta completa? (2 casas)`, 2 * Math.PI * c, t`Uma volta: $\Delta t=2\pi$, $\Delta z=${c}\cdot2\pi\approx${fmt(2 * Math.PI * c, 2)}$.`, { tol: 0.02 });
            }),
            inter(t`Ajuste a hélice do lab para subir aproximadamente $3{,}14$ por volta.`, 'space3d', helixLab().props, (v: any) => v && near(2 * Math.PI * v.p.c, Math.PI, 0.2), t`$2\pi c=\pi\Rightarrow c=0{,}5$.`, t`Numa volta $t$ cresce $2\pi$, e $z=ct$ sobe $2\pi c$. Para subir $\pi\approx3{,}14$: $2\pi c=\pi\Rightarrow c=0{,}5$.`),
            mcqS(t`Qual curva está **sobre** o cilindro $x^2+y^2=4$?`, t`$(2\cos t,\,2\operatorname{sen}t,\,t^2)$`, [t`$(2\cos t,\,\operatorname{sen}t,\,t)$`, t`$(t,\,2,\,t)$`, t`$(4\cos t,\,4\operatorname{sen}t,\,1)$`, t`$(\cos t,\,\operatorname{sen}t,\,2)$`], t`$x^2+y^2=4(\cos^2t+\operatorname{sen}^2t)=4$ para todo $t$.`),
            gen((rng) => {
              const P = [randInt(rng, -2, 2), randInt(rng, -2, 2), randInt(rng, -2, 2)];
              const v = [randNZ(rng, -3, 3), randNZ(rng, -3, 3), randNZ(rng, -3, 3)];
              const tt = randInt(rng, 1, 3);
              return num(t`Para $\vec r(t)=(${P[0]}${term(v[0], 't')},\,${P[1]}${term(v[1], 't')},\,${P[2]}${term(v[2], 't')})$, quanto vale $z(${tt})$?`, P[2] + v[2] * tt, t`$${P[2]}+${v[2]}\cdot${tt}=${P[2] + v[2] * tt}$.`);
            }),
            tf(t`A curva $(t,\,t^2,\,t^3)$ passa pela origem.`, true, t`Em $t=0$.`),
            mcq(t`$\vec r(t)=(\cos t,\,\operatorname{sen}t,\,0)$ é…`, ['uma circunferência no plano $xy$', 'uma hélice', 'uma reta', 'uma esfera'], 0, t`$z=0$ sempre.`),
            num(t`Em que ponto (valor de $z$) a curva $(t,\,2t,\,t^2)$ fura o plano $x+y=6$?`, 4, t`$t+2t=6\Rightarrow t=2$; $z=4$.`),
          ],
        },
      ],
    },
    {
      id: 'c-curva-vel',
      title: 'Velocidade e aceleração',
      parts: [
        {
          card: {
            title: 'Derivando coordenada a coordenada',
            body: t`$$\vec v(t)=\vec r\,'(t)=(x'(t),\,y'(t),\,z'(t)),\qquad \vec a(t)=\vec r\,''(t)$$

$\vec v$ é **tangente** à trajetória e aponta no sentido do movimento; seu módulo $|\vec v|$ é a **velocidade escalar** (rapidez). Na circunferência, $\vec a$ aponta para o **centro** (aceleração centrípeta).`,
            visual: particleLab({ acc: true }),
          },
          exercises: [
            gen((rng) => {
              const a = randNZ(rng, -3, 3);
              const b = randInt(rng, 2, 3);
              const c = randNZ(rng, -4, 4);
              const tt = randInt(rng, -2, 2);
              return rmcq(rng, t`Para $\vec r(t)=(${a}t,\,t^{${b}},\,${c})$, quanto vale $\vec r\,'(${tt})$?`, `$(${a},\\,${b * tt ** (b - 1)},\\,0)$`, [`$(${a},\\,${tt ** b},\\,${c})$`, `$(${a * tt},\\,${b * tt ** (b - 1)},\\,0)$`, `$(0,\\,${b * tt ** (b - 1)},\\,${c})$`, `$(${a},\\,${b * tt ** (b - 1) + 1},\\,0)$`], t`Derive cada coordenada: $(${a},\,${b}t^{${b - 1}},\,0)$.`);
            }),
            gen((rng) => {
              const R = randInt(rng, 1, 5);
              const w = randInt(rng, 1, 4);
              return num(t`Qual a velocidade escalar de $\vec r(t)=(${R}\cos ${w}t,\,${R}\operatorname{sen}${w}t)$?`, R * w, t`$|\vec r\,'|=\sqrt{(${R * w})^2(\operatorname{sen}^2+\cos^2)}=${R * w}$ (constante).`);
            }),
            tf(t`No movimento circular uniforme, a aceleração é nula porque a rapidez é constante.`, false, t`A **direção** de $\vec v$ muda: há aceleração centrípeta $\vec a=-\omega^2\vec r$.`),
            inter(t`No lab (circunferência), leve a partícula a $t=\frac{\pi}{2}$ e observe: velocidade horizontal para a esquerda.`, 'plot', particleLab({ acc: true }).props, (v: any) => v && Math.round(v.p.c) === 0 && near(v.p.s, Math.PI / 2, 0.05), t`$\vec r\,'(\frac\pi2)=(-2,\,0)$.`, t`Com $\vec r=(2\cos t,\ 2\operatorname{sen}t)$, $\vec r\,'=(-2\operatorname{sen}t,\ 2\cos t)$; em $t=\frac{\pi}{2}$ dá $(-2,\,0)$: velocidade tangente, apontando para a esquerda.`),
            mcqS(t`A reta tangente a $\vec r(t)=(t^2,\,t^3)$ em $t=1$ tem direção:`, t`$(2,\,3)$`, [t`$(1,\,1)$`, t`$(2,\,1)$`, t`$(1,\,3)$`, t`$(0,\,6)$`], t`$\vec r\,'(t)=(2t,\,3t^2)$.`),
            num(t`Para $\vec r(t)=(t,\,t^2,\,t^3)$, quanto vale a 3ª coordenada de $\vec a(2)$?`, 12, t`$z''=6t=12$.`),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const b = randInt(rng, 1, 4);
              return num(t`Rapidez de $\vec r(t)=(${a}t,\,${b}t,\,5)$ (2 casas):`, Math.hypot(a, b), t`$|(${a},\,${b},\,0)|=\sqrt{${a * a + b * b}}\approx${fmt(Math.hypot(a, b), 2)}$.`, { tol: 0.01 });
            }),
            mcq(t`Se $|\vec v(t)|$ é constante, então $\vec v\cdot\vec a=$…`, ['0 (são perpendiculares)', '1', '|v|', 'não dá para saber'], 0, t`$\frac{d}{dt}(\vec v\cdot\vec v)=2\vec v\cdot\vec a=0$.`),
          ],
        },
        {
          card: {
            title: 'De volta: integrando a aceleração',
            body: t`Integrando coordenada a coordenada recuperamos velocidade e posição — cada integral ganha uma constante, fixada pelas condições iniciais.

**Projétil** (sem ar), $\vec a=(0,\,-g)$, saindo da origem com $\vec v_0=(v_0\cos\theta,\,v_0\operatorname{sen}\theta)$:

$$\vec r(t)=\left(v_0\cos\theta\,t,\ v_0\operatorname{sen}\theta\,t-\tfrac{g}{2}t^2\right)$$`,
            tip: t`O alcance $\frac{v_0^2\operatorname{sen}2\theta}{g}$ é máximo em $\theta=45^\circ$.`,
          },
          exercises: [
            mcqS(t`Se $\vec a=(0,\,-10)$ e $\vec v(0)=(3,\,4)$, então $\vec v(t)=$`, t`$(3,\,4-10t)$`, [t`$(3t,\,4t-5t^2)$`, t`$(0,\,-10t)$`, t`$(3,\,-10t)$`, t`$(3-10t,\,4)$`], t`Integre e use $\vec v(0)$.`),
            gen((rng) => {
              const vx = randInt(rng, 2, 6);
              const vy = randInt(rng, 5, 20);
              const g = 10;
              return num(t`Projétil com $\vec v_0=(${vx},\,${vy})$ m/s e $g=10$: quanto tempo (s) até voltar ao chão? (2 casas)`, (2 * vy) / g, t`$y=${vy}t-5t^2=0\Rightarrow t=\frac{${vy}}{5}=${fmt((2 * vy) / g, 2)}$.`, { tol: 0.01 });
            }),
            gen((rng) => {
              const vy = pick(rng, [10, 20, 30]);
              return num(t`Altura máxima (m) de um projétil lançado com componente vertical $${vy}$ m/s ($g=10$):`, (vy * vy) / 20, t`$v_y=0$ em $t=\frac{${vy}}{10}$; $y_{max}=\frac{${vy}^2}{2\cdot10}=${(vy * vy) / 20}$.`);
            }),
            num(t`Alcance (m) de um projétil a $20$ m/s, $45^\circ$, com $g=10$:`, 40, t`$\frac{v_0^2\operatorname{sen}90^\circ}{g}=\frac{400}{10}=40$.`),
            tf(t`Sem resistência do ar, a componente horizontal da velocidade de um projétil é constante.`, true, t`$a_x=0$.`),
            mcqS(t`$\vec v(t)=(2t,\,\cos t)$ e $\vec r(0)=(1,\,0)$. Então $\vec r(t)=$`, t`$(t^2+1,\,\operatorname{sen}t)$`, [t`$(t^2,\,\operatorname{sen}t)$`, t`$(2,\,-\operatorname{sen}t)$`, t`$(t^2+1,\,-\operatorname{sen}t+1)$`, t`$(t^2+1,\,\cos t)$`], t`Integrando: $(t^2+C_1,\,\operatorname{sen}t+C_2)$; $\vec r(0)=(1,\,0)$.`),
            mcq(t`Para maximizar o alcance no chão plano (sem ar), o ângulo de lançamento é…`, ['45°', '30°', '60°', '90°'], 0, t`$\operatorname{sen}2\theta$ é máximo em $2\theta=90^\circ$.`),
            num(t`Ângulos de $30^\circ$ e qual outro ângulo dão o **mesmo** alcance (graus)?`, 60, t`$\operatorname{sen}60^\circ=\operatorname{sen}120^\circ$: ângulos complementares.`),
          ],
        },
      ],
    },
    {
      id: 'c-curva-comp',
      title: 'Comprimento de arco e curvatura',
      parts: [
        {
          card: {
            title: 'Comprimento de arco',
            body: t`Somando os "pedacinhos" $|\vec r\,'(t)|\,dt$ percorridos:

$$L=\int_a^b|\vec r\,'(t)|\,dt=\int_a^b\sqrt{x'^2+y'^2+z'^2}\,dt$$`,
            example: t`Hélice $(\cos t,\,\operatorname{sen}t,\,t)$, uma volta: $|\vec r\,'|=\sqrt{\operatorname{sen}^2+\cos^2+1}=\sqrt2$ ⟹ $L=2\pi\sqrt2\approx8{,}89$.`,
          },
          exercises: [
            gen((rng) => {
              const R = randInt(rng, 1, 6);
              return num(t`Comprimento de $(${R}\cos t,\,${R}\operatorname{sen}t)$ para $0\le t\le2\pi$ (2 casas):`, 2 * Math.PI * R, t`$|\vec r\,'|=${R}$; $L=${R}\cdot2\pi\approx${fmt(2 * Math.PI * R, 2)}$.`, { tol: 0.02 });
            }),
            num(t`Comprimento da hélice $(\cos t,\,\operatorname{sen}t,\,t)$ em uma volta (2 casas):`, 2 * Math.PI * Math.SQRT2, t`$2\pi\sqrt2\approx8{,}89$.`, { tol: 0.02 }),
            gen((rng) => {
              const [a, b, c] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13]] as const);
              const T = randInt(rng, 1, 4);
              return num(t`Comprimento de $\vec r(t)=(${a}t,\,${b}t)$ para $0\le t\le${T}$:`, c * T, t`$|\vec r\,'|=\sqrt{${a * a}+${b * b}}=${c}$; $L=${c * T}$.`);
            }),
            tf(t`O comprimento de arco não depende de como a curva é parametrizada (desde que percorrida uma vez).`, true, t`É uma propriedade geométrica da curva.`),
            mcqS(t`A integral do comprimento de $(t,\,t^2)$ de $0$ a $1$ é:`, t`$\int_0^1\sqrt{1+4t^2}\,dt$`, [t`$\int_0^1\sqrt{1+t^2}\,dt$`, t`$\int_0^1(1+2t)\,dt$`, t`$\int_0^1\sqrt{t^2+t^4}\,dt$`, t`$\int_0^1 2t\,dt$`], t`$\vec r\,'=(1,\,2t)$.`),
            num(t`Calcule o comprimento de $\vec r(t)=\left(2t,\,\frac43t^{3/2}\right)$ para $0\le t\le3$ (dica: $|\vec r\,'|=2\sqrt{1+t}$). (2 casas)`, (4 / 3) * (8 - 1), t`$\int_0^3 2\sqrt{1+t}\,dt=\frac43(1+t)^{3/2}\Big|_0^3=\frac43(8-1)=\frac{28}{3}\approx9{,}33$.`, { tol: 0.02 }),
            mcq(t`Se uma partícula tem rapidez constante $5$ por $4$ s, que distância percorre?`, ['20', '9', '1,25', '5'], 0, t`$L=\int_0^4 5\,dt=20$.`),
            num(t`Comprimento do segmento de $(1,\,2,\,3)$ a $(3,\,5,\,9)$:`, 7, t`$\sqrt{4+9+36}=7$.`),
          ],
        },
        {
          card: {
            title: 'Curvatura',
            body: t`A **curvatura** mede o quanto a direção muda por unidade de comprimento:

$$\kappa=\frac{|\vec r\,'\times\vec r\,''|}{|\vec r\,'|^3}\qquad\text{(para }y=f(x):\ \kappa=\frac{|f''|}{(1+f'^2)^{3/2}})$$

Reta: $\kappa=0$. Circunferência de raio $R$: $\kappa=\frac1R$. O **círculo osculador** é o que melhor se encaixa na curva no ponto (raio $\frac1\kappa$):`,
            visual: curvatureLab(),
          },
          exercises: [
            gen((rng) => {
              const R = randInt(rng, 2, 10);
              return num(t`Qual a curvatura de uma circunferência de raio $${R}$? (3 casas)`, 1 / R, t`$\kappa=\frac1R=\frac1{${R}}$.`, { tol: 0.002 });
            }),
            tf(t`Uma reta tem curvatura zero.`, true, t`A direção nunca muda.`),
            num(t`Curvatura de $y=x^2$ na origem:`, 2, t`$f'(0)=0$, $f''=2$: $\kappa=\frac{2}{1}=2$.`),
            inter(t`No lab ($y=\operatorname{sen}x$), leve o ponto para onde a curvatura é **zero** (um ponto de inflexão).`, 'plot', curvatureLab().props, (v: any) => v && Math.round(v.p.f) === 1 && near(v.p.x, 0, 0.06), t`Em $x=0$, $y''=-\operatorname{sen}0=0$.`, t`$\kappa=\frac{|y''|}{(1+y'^2)^{3/2}}$ zera onde $y''=-\operatorname{sen}x=0$: em $x=0$ (ou $x=\pm\pi$), os pontos de inflexão.`),
            mcq(t`Na parábola $y=\frac{x^2}{2}$, onde a curvatura é máxima?`, ['no vértice', 'longe do vértice', 'é constante', 'em x = 1'], 0, t`$\kappa=\frac{1}{(1+x^2)^{3/2}}$, máximo em $x=0$.`),
            num(t`Raio do círculo osculador de $y=\frac{x^2}{2}$ no vértice:`, 1, t`$\kappa=1\Rightarrow R=1$.`),
            mcqS(t`Em engenharia de estradas, curvatura alta significa:`, 'curva fechada (exige velocidade menor)', ['reta longa', 'subida íngreme', 'pista mais larga', 'nada em especial'], t`Aceleração centrípeta $=\kappa v^2$: com $\kappa$ grande, $v$ precisa ser menor.`),
            num(t`Um carro a $20$ m/s numa curva de raio $100$ m tem aceleração centrípeta $\kappa v^2$ de quanto (m/s²)?`, 4, t`$\frac{1}{100}\cdot400=4$.`),
          ],
        },
      ],
    },
  ],
};

export const otimMulti: UnitDef = {
  id: 'c-otim',
  title: 'Derivadas e otimização em várias variáveis',
  subtitle: 'Limites, plano tangente, derivada direcional, Hessiana e Lagrange',
  icon: '⛰️',
  source: 'Cálculo 3 · Funções de várias variáveis',
  guide: t`Com duas variáveis, há infinitos caminhos para chegar a um ponto — por isso limites são mais delicados. O **plano tangente** aproxima a superfície localmente; a **derivada direcional** $D_{\vec u}f=\nabla f\cdot\vec u$ mede a inclinação em qualquer direção. Extremos aparecem onde $\nabla f=\vec 0$ e são classificados pela **Hessiana**; com restrições, usamos **multiplicadores de Lagrange** ($\nabla f=\lambda\nabla g$).`,
  lessons: [
    {
      id: 'c-otim-lim',
      title: 'Limites e continuidade',
      parts: [
        {
          card: {
            title: 'Muitos caminhos até o ponto',
            body: t`$\lim_{(x,y)\to(a,b)}f(x,y)=L$ exige que $f$ se aproxime de $L$ por **qualquer caminho**. Se dois caminhos dão valores diferentes, o limite **não existe**.

Teste clássico: aproximar de $(0,\,0)$ pelas retas $y=mx$. Para $f=\frac{xy}{x^2+y^2}$, mova $m$:`,
            visual: pathLimitLab(),
            tip: t`Se todas as retas dão o mesmo valor, ainda **não** está provado — teste também parábolas $y=kx^2$ (ou use coordenadas polares).`,
          },
          exercises: [
            num(t`Para $f=\dfrac{xy}{x^2+y^2}$, qual o valor ao longo da reta $y=x$ (perto da origem)?`, 0.5, t`$\frac{x^2}{2x^2}=\frac12$.`),
            num(t`E ao longo do eixo $x$ ($y=0$)?`, 0, t`$\frac{0}{x^2}=0$.`),
            tf(t`Como os dois caminhos acima dão valores diferentes, $\lim_{(x,y)\to(0,0)}\frac{xy}{x^2+y^2}$ não existe.`, true, t`$\frac12\ne0$.`),
            inter(t`No lab, ache uma reta pela origem onde $f$ vale $-\frac12$.`, 'plot', pathLimitLab().props, (v: any) => v && near(v.p.m / (1 + v.p.m * v.p.m), -0.5, 0.01), t`$\frac{m}{1+m^2}=-\frac12\Rightarrow m=-1$.`, t`Sobre $y=mx$, $f=\frac{x\cdot mx}{x^2+m^2x^2}=\frac{m}{1+m^2}$; igualando a $-\frac12$: $m^2+2m+1=0\Rightarrow m=-1$. Como o valor muda com $m$, o limite na origem não existe.`),
            gen((rng) => {
              const a = randInt(rng, -3, 3);
              const b = randInt(rng, -3, 3);
              const c = randNZ(rng, -3, 3);
              return num(t`Calcule $\lim_{(x,y)\to(${a},\,${b})}(x^2${term(c, 'xy')}+y)$.`, a * a + c * a * b + b, t`Polinômios são contínuos: basta substituir: $${a * a}${term(c * a * b, '')}${term(b, '')}=${a * a + c * a * b + b}$.`);
            }),
            mcqS(t`Para $f=\frac{x^2y}{x^4+y^2}$, ao longo de $y=kx^2$ o valor é $\frac{k}{1+k^2}$. Isso mostra que:`, 'o limite na origem não existe', ['o limite é 0', 'o limite é 1/2', 'f é contínua', 'nada se conclui'], t`Depende de $k$ (embora todas as **retas** deem $0$!).`),
            tf(t`Funções polinomiais em $x$ e $y$ são contínuas em todo $\mathbb R^2$.`, true, t`Somas e produtos de funções contínuas.`),
            mcq(t`Em coordenadas polares, $\frac{x^2y}{x^2+y^2}=r\cos^2\theta\operatorname{sen}\theta$. Quando $r\to0$:`, ['tende a 0 para qualquer θ: o limite é 0', 'depende de θ: não existe', 'vai a infinito', 'vale 1'], 0, t`$|r\cos^2\theta\operatorname{sen}\theta|\le r\to0$.`),
          ],
        },
        {
          card: {
            title: 'Continuidade',
            body: t`$f$ é **contínua** em $(a,\,b)$ se o limite existe e vale $f(a,\,b)$. Somas, produtos, quocientes (com denominador $\ne0$) e composições de contínuas são contínuas.

Para "consertar" uma função num ponto, o limite precisa existir: $\frac{\operatorname{sen}(x^2+y^2)}{x^2+y^2}$ tende a $1$ (com $u=x^2+y^2\to0$), então definindo $f(0,0)=1$ ela fica contínua.`,
          },
          exercises: [
            num(t`Qual valor dar a $f(0,0)$ para que $f=\dfrac{\operatorname{sen}(x^2+y^2)}{x^2+y^2}$ seja contínua?`, 1, t`$\lim_{u\to0}\frac{\operatorname{sen}u}{u}=1$.`),
            mcqS(t`Onde $f(x,y)=\dfrac{1}{x-y}$ é descontínua?`, t`na reta $y=x$`, [t`só na origem`, t`no eixo $x$`, t`em lugar nenhum`, t`na reta $y=-x$`], t`O denominador zera quando $x=y$.`),
            gen((rng) => {
              const r = randInt(rng, 1, 4);
              return mcq(t`Onde $f(x,y)=\ln(${r * r}-x^2-y^2)$ é contínua?`, [t`no interior do disco $x^2+y^2<${r * r}$`, t`fora do disco`, t`em todo $\mathbb R^2$`, t`só na circunferência $x^2+y^2=${r * r}$`], 0, t`O $\ln$ exige argumento $>0$.`);
            }),
            tf(t`$f(x,y)=\dfrac{x^2-y^2}{x-y}$ pode ser estendida continuamente a toda a reta $y=x$.`, true, t`Para $x\ne y$, $f=x+y$; basta definir $f=2x$ em $y=x$.`),
            mcq(t`$\lim_{(x,y)\to(0,0)}\dfrac{x^2+y^2}{\sqrt{x^2+y^2}}=$`, ['0', '1', 'não existe', '∞'], 0, t`É $\sqrt{x^2+y^2}=r\to0$.`),
            num(t`Calcule $\lim_{(x,y)\to(1,\,2)}\dfrac{xy}{x+y}$ (3 casas).`, 2 / 3, t`Contínua ali: $\frac{2}{3}\approx0{,}667$.`, { tol: 0.002 }),
            multi(t`Quais funções são contínuas em $(0,\,0)$ (com o valor natural)?`, [t`$e^{x+y}$`, t`$\cos(xy)$`, t`$\frac{xy}{x^2+y^2}$ com $f(0,0)=0$`, t`$x^2+3y$`], [0, 1, 3], t`A terceira não tem limite na origem.`),
            mcqS(t`Para provar que um limite em $\mathbb R^2$ **não** existe, basta:`, 'achar dois caminhos com valores diferentes', ['testar o eixo x', 'testar todas as retas', 'calcular f no ponto', 'derivar'], t`Um contraexemplo basta.`),
          ],
        },
      ],
    },
    {
      id: 'c-otim-tan',
      title: 'Plano tangente e derivada direcional',
      parts: [
        {
          card: {
            title: 'Plano tangente e linearização',
            body: t`Perto de $(x_0,\,y_0)$ a superfície $z=f(x,y)$ parece um plano:

$$z=f(x_0,y_0)+f_x\,(x-x_0)+f_y\,(y-y_0)$$

Essa é a **aproximação linear** $L(x,y)\approx f(x,y)$. Mova o ponto de tangência:`,
            visual: tangentPlaneLab(),
            example: t`$f=x^2+y^2$ em $(1,\,2)$: $f=5$, $f_x=2$, $f_y=4$ ⟹ $z=5+2(x-1)+4(y-2)$. Então $f(1{,}1;\ 1{,}9)\approx5+0{,}2-0{,}4=4{,}8$ (exato: $4{,}82$).`,
          },
          exercises: [
            gen((rng) => {
              const x0 = randNZ(rng, -2, 2);
              const y0 = randNZ(rng, -2, 2);
              return rmcq(rng, t`Plano tangente a $z=x^2+y^2$ em $(${x0},\,${y0})$:`, `$z=${x0 * x0 + y0 * y0}${term(2 * x0, `(x${term(-x0, '')})`)}${term(2 * y0, `(y${term(-y0, '')})`)}$`, [`$z=${x0 * x0 + y0 * y0}${term(x0, `(x${term(-x0, '')})`)}${term(y0, `(y${term(-y0, '')})`)}$`, `$z=${2 * x0}x${term(2 * y0, 'y')}$`, `$z=${x0 * x0 + y0 * y0 + 1}${term(2 * x0, `(x${term(-x0, '')})`)}${term(2 * y0, `(y${term(-y0, '')})`)}$`.replace(/\(x\)/g, 'x').replace(/\(y\)/g, 'y')], t`$f=${x0 * x0 + y0 * y0}$, $f_x=${2 * x0}$, $f_y=${2 * y0}$.`);
            }),
            num(t`Use a linearização de $f=x^2+y^2$ em $(1,\,2)$ para estimar $f(1{,}1;\ 1{,}9)$ (2 casas).`, 4.8, t`$5+2(0{,}1)+4(-0{,}1)=4{,}8$.`, { tol: 0.01 }),
            tf(t`Num ponto de máximo local de uma função diferenciável, o plano tangente é horizontal.`, true, t`$f_x=f_y=0$ ali.`),
            inter(t`No lab, leve o ponto de tangência ao **topo** da superfície (plano horizontal).`, 'space3d', tangentPlaneLab().props, (v: any) => v && near(v.p.x, 0, 0.01) && near(v.p.y, 0, 0.01), t`$(x_0,\,y_0)=(0,\,0)$.`, t`O plano tangente é horizontal onde $f_x=f_y=0$; no topo do morro isso acontece em $(0,\,0)$.`),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const b = randInt(rng, 1, 4);
              const dx = pick(rng, [0.1, -0.1, 0.2]);
              const dy = pick(rng, [0.1, -0.2, 0.05]);
              return num(t`A diferencial de $f=${a}x+${b}xy$ em $(1,\,1)$ com $dx=${fmt(dx)}$, $dy=${fmt(dy)}$ é $df=f_x\,dx+f_y\,dy$. Quanto vale? (3 casas)`, (a + b) * dx + b * dy, t`$f_x=${a}+${b}y=${a + b}$, $f_y=${b}x=${b}$: $df=${a + b}(${fmt(dx)})+${b}(${fmt(dy)})=${fmt((a + b) * dx + b * dy, 3)}$.`, { tol: 0.002 });
            }),
            mcqS(t`O volume de um cilindro $V=\pi r^2h$ com $r=2$, $h=5$ e erros $dr=0{,}1$, $dh=0{,}1$ tem erro estimado $dV=$`, t`$2{,}4\pi$`, [t`$0{,}4\pi$`, t`$\pi$`, t`$20\pi$`, t`$4\pi$`], t`$dV=2\pi rh\,dr+\pi r^2dh=2\pi(10)(0{,}1)+\pi(4)(0{,}1)=2{,}4\pi$.`),
            mcq(t`A aproximação linear é melhor…`, ['perto do ponto de tangência', 'longe do ponto', 'em qualquer lugar igual', 'só em pontos inteiros'], 0, t`O erro cresce com a distância (quadraticamente).`),
            num(t`Plano tangente a $z=xy$ em $(2,\,3)$: $z=6+3(x-2)+2(y-3)$. Quanto vale $z$ em $(2{,}1;\ 3)$?`, 6.3, t`$6+3(0{,}1)=6{,}3$.`, { tol: 0.001 }),
          ],
        },
        {
          card: {
            title: 'Derivada direcional',
            body: t`A inclinação de $f$ na direção de um vetor **unitário** $\vec u$:

$$D_{\vec u}f=\nabla f\cdot\vec u=|\nabla f|\cos\theta$$

• Máxima ($=|\nabla f|$) quando $\vec u$ aponta como $\nabla f$
• Mínima ($=-|\nabla f|$) no sentido oposto
• Zero quando $\vec u\perp\nabla f$ — ao longo da curva de nível

Arraste $P$ e gire $\vec u$ (azul):`,
            visual: directionalLab(),
          },
          exercises: [
            gen((rng) => {
              const gx = randNZ(rng, -5, 5);
              const gy = randNZ(rng, -5, 5);
              const [ux, uy] = pick(rng, [[1, 0], [0, 1], [0.6, 0.8], [0.8, -0.6], [-0.6, 0.8]] as const);
              return num(t`Se $\nabla f(P)=(${gx},\,${gy})$ e $\vec u=(${fmt(ux)},\,${fmt(uy)})$, quanto vale $D_{\vec u}f(P)$?`, gx * ux + gy * uy, t`$${gx}\cdot${fmt(ux)}+${gy}\cdot${fmt(uy)}=${fmt(gx * ux + gy * uy)}$.`, { tol: 0.001 });
            }),
            gen((rng) => {
              const [a, b, c] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10]] as const);
              return num(t`Se $\nabla f(P)=(${a},\,${b})$, qual a **maior** taxa de crescimento de $f$ em $P$?`, c, t`$|\nabla f|=\sqrt{${a * a}+${b * b}}=${c}$.`);
            }),
            tf(t`Para usar $D_{\vec u}f=\nabla f\cdot\vec u$, o vetor $\vec u$ precisa ser unitário.`, true, t`Senão a "taxa" fica multiplicada por $|\vec u|$. Normalize: $\vec u=\frac{\vec v}{|\vec v|}$.`),
            inter(t`No lab, gire $\vec u$ até a derivada direcional ser (quase) **zero** em $P$.`, 'plot', directionalLab().props, (v: any) => { if (!v) return false; const a = (v.p.th * Math.PI) / 180; const g = Math.hypot(2 * v.pts.P.x, 4 * v.pts.P.y); return g > 0.3 && Math.abs(2 * v.pts.P.x * Math.cos(a) + 4 * v.pts.P.y * Math.sin(a)) < 0.15 * g; }, t`$\vec u$ perpendicular ao gradiente: tangente à elipse de nível.`, t`$D_{\vec u}f=\nabla f\cdot\vec u=|\nabla f|\cos\theta$ zera quando $\theta=90^\circ$: $\vec u$ perpendicular ao gradiente, ou seja, tangente à curva de nível.`),
            mcqS(t`Para $f=x^2y$ em $(1,\,2)$, na direção de $\vec v=(3,\,4)$, $D_{\vec u}f=$`, t`$3{,}2$`, [t`$16$`, t`$5$`, t`$4$`, t`$2{,}8$`], t`$\nabla f=(2xy,\,x^2)=(4,\,1)$ e $\vec u=\frac{\vec v}{5}=(0{,}6;\ 0{,}8)$: $4\cdot0{,}6+1\cdot0{,}8=3{,}2$. (Sem normalizar daria $16$.)`),
            mcq(t`Uma formiga sobre $f(x,y)$ quer andar sem subir nem descer. Ela deve seguir…`, ['a curva de nível', 'o gradiente', 'o oposto do gradiente', 'qualquer reta'], 0, t`Ao longo da curva de nível $D_{\vec u}f=0$.`),
            num(t`Qual a taxa de **decrescimento** mais rápido de $f$ em $P$ se $\nabla f(P)=(1,\,1)$? Dê o valor (negativo, 3 casas).`, -Math.SQRT2, t`$-|\nabla f|=-\sqrt2\approx-1{,}414$.`, { tol: 0.002 }),
            mcq(t`Em aprendizado de máquina, o **gradiente descendente** atualiza os parâmetros na direção de…`, ['−∇f (descida mais íngreme)', '∇f', 'uma curva de nível', 'um vetor aleatório'], 0, t`Para minimizar o erro, desce-se na direção oposta ao gradiente.`),
          ],
        },
      ],
    },
    {
      id: 'c-otim-ext',
      title: 'Máximos, mínimos e selas',
      parts: [
        {
          card: {
            title: 'Pontos críticos',
            body: t`Em um extremo local (interior, $f$ diferenciável), o plano tangente é horizontal:

$$\nabla f=\vec 0\iff f_x=0\ \text{e}\ f_y=0$$

Esses são os **pontos críticos**. Mas nem todo ponto crítico é extremo: pode ser uma **sela** (sobe numa direção e desce em outra). Compare os tipos:`,
            visual: extremaLab(0),
          },
          exercises: [
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              const b = randNZ(rng, -4, 4);
              return rmcq(rng, t`Ponto crítico de $f=x^2${term(-2 * a, 'x')}+y^2${term(-2 * b, 'y')}$:`, `$(${a},\\,${b})$`, [`$(${-a},\\,${-b})$`, `$(${2 * a},\\,${2 * b})$`, `$(${b},\\,${a})$`, '$(0,\\,0)$'], t`$f_x=2x-${2 * a}=0$, $f_y=2y-${2 * b}=0$.`);
            }),
            tf(t`Todo ponto crítico é um máximo ou um mínimo local.`, false, t`Pode ser uma sela, como em $x^2-y^2$ na origem.`),
            inter(t`No lab, mostre a superfície em que a origem é **sela**.`, 'space3d', extremaLab(0).props, (v: any) => v && Math.round(v.p.k) === 2, t`$f=x^2-y^2$.`, t`Em $f=x^2-y^2$, a origem é mínimo ao longo do eixo $x$ e máximo ao longo do eixo $y$: $D=f_{xx}f_{yy}-f_{xy}^2=-4<0$, sela.`),
            num(t`Quantos pontos críticos tem $f=x^3-3x+y^2$?`, 2, t`$f_x=3x^2-3=0\Rightarrow x=\pm1$; $f_y=2y=0$. Pontos $(\pm1,\,0)$.`),
            mcqS(t`Os pontos críticos de $f=xy$ são:`, t`só $(0,\,0)$`, [t`os eixos`, t`$(1,\,1)$ e $(-1,\,-1)$`, t`nenhum`, t`a reta $y=x$`], t`$f_x=y=0$ e $f_y=x=0$.`),
            mcq(t`Na origem, $f=xy$ tem…`, ['uma sela', 'um mínimo', 'um máximo', 'nada'], 0, t`$f>0$ no 1º e 3º quadrantes, $<0$ no 2º e 4º.`),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const c = randInt(rng, -5, 5);
              return num(t`Valor mínimo de $f=(x-${a})^2+(y+${a})^2${term(c, '')}$:`, c, t`Soma de quadrados $\ge0$, zera em $(${a},\,${-a})$: mínimo $${c}$.`);
            }),
            mcqS(t`Para achar os pontos críticos de $f(x,y)$ resolvemos:`, t`o sistema $f_x=0$, $f_y=0$`, [t`$f=0$`, t`$f_x+f_y=0$`, t`$f_{xx}=0$`, t`$f_x=f_y$`], t`Gradiente nulo.`),
          ],
        },
        {
          card: {
            title: 'Teste da 2ª derivada (Hessiana)',
            body: t`Num ponto crítico, calcule a Hessiana e seu determinante:

$$H=\begin{pmatrix}f_{xx}&f_{xy}\\f_{xy}&f_{yy}\end{pmatrix},\qquad D=f_{xx}f_{yy}-f_{xy}^2$$

• $D>0$ e $f_{xx}>0$: **mínimo** local
• $D>0$ e $f_{xx}<0$: **máximo** local
• $D<0$: **sela**
• $D=0$: inconclusivo`,
            visual: extremaLab(3),
          },
          exercises: [
            gen((rng) => {
              const fxx = randNZ(rng, -4, 4);
              const fyy = randNZ(rng, -4, 4);
              const fxy = randInt(rng, -3, 3);
              const D = fxx * fyy - fxy * fxy;
              const ans = D > 0 ? (fxx > 0 ? 'mínimo local' : 'máximo local') : D < 0 ? 'sela' : 'inconclusivo';
              return rmcq(rng, t`Num ponto crítico, $f_{xx}=${fxx}$, $f_{yy}=${fyy}$, $f_{xy}=${fxy}$. Ele é:`, ans, ['mínimo local', 'máximo local', 'sela', 'inconclusivo'].filter((x) => x !== ans), t`$D=${fxx}\cdot${fyy}-${fxy * fxy}=${D}$.`);
            }),
            num(t`Para $f=x^3-3x+y^2$ no ponto $(1,\,0)$, quanto vale $D$?`, 12, t`$f_{xx}=6x=6$, $f_{yy}=2$, $f_{xy}=0$: $D=12>0$, mínimo.`),
            mcqS(t`E no ponto $(-1,\,0)$ da mesma função?`, 'sela', ['mínimo local', 'máximo local', 'inconclusivo'], t`$f_{xx}=-6$, $D=-12<0$.`),
            tf(t`Para $f=x^4+y^4$, o teste da 2ª derivada é inconclusivo na origem, embora ela seja mínimo.`, true, t`Todas as segundas derivadas zeram ($D=0$), mas $f\ge0=f(0,0)$.`),
            inter(t`No lab, escolha o caso **degenerado** ($D=0$) e observe que ainda é um mínimo.`, 'space3d', extremaLab(0).props, (v: any) => v && Math.round(v.p.k) === 3, t`$x^4+y^4$: bem "achatado" no fundo.`, t`Em $x^4+y^4$ todas as derivadas segundas zeram na origem ($D=0$, teste inconclusivo), mas $f\ge0=f(0,0)$: ainda é mínimo.`),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const b = randInt(rng, 1, 4);
              return num(t`Para $f=${a}x^2+${b}xy+y^2$ na origem, quanto vale $D$?`, 2 * a * 2 - b * b, t`$f_{xx}=${2 * a}$, $f_{yy}=2$, $f_{xy}=${b}$: $D=${4 * a}-${b * b}=${4 * a - b * b}$.`);
            }),
            mcq(t`Uma caixa sem tampa de volume 32 tem área $S=xy+\frac{64}{x}+\frac{64}{y}$. O ponto crítico é…`, ['x = y = 4', 'x = y = 2', 'x = 8, y = 4', 'x = y = 32'], 0, t`$S_x=y-\frac{64}{x^2}=0$ e $S_y=x-\frac{64}{y^2}=0$ ⟹ $x=y=4$ (altura 2).`),
            fill(t`Complete a classificação:`, t`$D>0,\ f_{xx}>0$: ___ ; $D>0,\ f_{xx}<0$: ___ ; $D<0$: ___`, ['mínimo', 'máximo', 'sela'], ['inconclusivo', 'inflexão'], t`É o teste da 2ª derivada.`),
          ],
        },
        {
          card: {
            title: 'Extremos absolutos em regiões fechadas',
            body: t`Numa região **fechada e limitada**, $f$ contínua atinge máximo e mínimo absolutos (Weierstrass). Roteiro:

1. Pontos críticos **no interior**
2. Máximos e mínimos **na fronteira** (parametrize cada lado: vira um problema de uma variável)
3. Compare todos os valores: o maior e o menor vencem`,
            example: t`$f=x^2+y^2-2x$ no quadrado $[0,\,2]\times[0,\,2]$: crítico $(1,\,0)$ (na borda) com $f=-1$; nos cantos, $f(2,2)=4$ e $f(0,2)=4$. Mínimo $-1$, máximo $4$.`,
          },
          exercises: [
            order(t`Ordene o roteiro para extremos absolutos numa região fechada:`, ['achar os pontos críticos no interior', 'estudar f em cada parte da fronteira', 'listar os valores de f nesses pontos', 'escolher o maior e o menor'], t`Interior, fronteira, comparação.`),
            num(t`Máximo absoluto de $f=x+y$ no disco $x^2+y^2\le2$:`, 2, t`Sem críticos internos; na fronteira, máximo em $(1,\,1)$: $f=2$.`),
            num(t`Mínimo absoluto de $f=x^2+y^2$ no quadrado $[1,\,3]\times[1,\,3]$:`, 2, t`O crítico $(0,0)$ está fora; o ponto mais perto da origem é $(1,\,1)$: $f=2$.`),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              return num(t`Máximo absoluto de $f=xy$ no quadrado $[0,\,${a}]\times[0,\,${a}]$:`, a * a, t`$f$ cresce em $x$ e em $y$: canto $(${a},\,${a})$, $f=${a * a}$.`);
            }),
            tf(t`Uma função contínua num retângulo fechado sempre tem máximo e mínimo absolutos.`, true, t`Teorema de Weierstrass.`),
            mcqS(t`Na fronteira $y=0$, $0\le x\le2$, a função $f=x^2+y^2-2x$ vira:`, t`$g(x)=x^2-2x$`, [t`$g(x)=x^2$`, t`$g(x)=-2x$`, t`$g(x)=x^2+4-2x$`, t`$g(x)=2x-2$`], t`Substitua $y=0$.`),
            mcq(t`Por que precisamos examinar a fronteira?`, ['o extremo pode estar na borda, onde ∇f não precisa ser zero', 'porque f não é contínua', 'porque não há pontos críticos', 'não precisamos'], 0, t`Na borda a "derivada para fora" não precisa zerar.`),
            num(t`Valor mínimo de $f=x^2+y^2-2x$ no quadrado $[0,\,2]\times[0,\,2]$:`, -1, t`Em $(1,\,0)$: $1-2=-1$.`),
          ],
        },
      ],
    },
    {
      id: 'c-otim-lag',
      title: 'Multiplicadores de Lagrange',
      parts: [
        {
          card: {
            title: 'Otimizar com restrição',
            body: t`Maximizar $f(x,y)$ sujeito a $g(x,y)=c$. No ótimo, a curva de nível de $f$ **tangencia** a restrição, então os gradientes são paralelos:

$$\nabla f=\lambda\,\nabla g,\qquad g(x,y)=c$$

Arraste $P$ sobre a reta $x+y=4$ procurando o maior $xy$ — repare nos gradientes:`,
            visual: lagrangeLab(),
            example: t`$f=xy$, $x+y=4$: $(y,\,x)=\lambda(1,\,1)$ ⟹ $x=y=2$, $f=4$.`,
          },
          exercises: [
            inter(t`No lab, ache o ponto da reta $x+y=4$ que maximiza $xy$.`, 'plot', lagrangeLab().props, (v: any) => v && near(v.pts.P.x, 2, 0.08), t`$(2,\,2)$, onde $xy=4$.`, t`Lagrange: $\nabla(xy)=\lambda\nabla(x+y)\Rightarrow y=\lambda=x$; com $x+y=4$, $x=y=2$ e $xy=4$ (a curva de nível $xy=4$ tangencia a reta).`),
            mcqS(t`O sistema de Lagrange para $f=xy$ com $x+y=10$ dá:`, t`$x=y=5$`, [t`$x=10,\ y=0$`, t`$x=2,\ y=8$`, t`$x=y=10$`, t`não tem solução`], t`$y=\lambda$, $x=\lambda$ ⟹ $x=y$; com $x+y=10$.`),
            gen((rng) => {
              const s = 2 * randInt(rng, 2, 8);
              return num(t`Maior produto $xy$ com $x+y=${s}$:`, (s / 2) ** 2, t`$x=y=${s / 2}$: $${(s / 2) ** 2}$.`);
            }),
            tf(t`No ponto ótimo com restrição, $\nabla f$ é perpendicular à curva de restrição.`, true, t`Como $\nabla g$ é perpendicular à curva e $\nabla f\parallel\nabla g$.`),
            mcqS(t`Máximo de $f=x+y$ no círculo $x^2+y^2=8$:`, '4', ['8', '2√2', '2', '16'], t`$(1,\,1)=\lambda(2x,\,2y)$ ⟹ $x=y=2$; $f=4$.`),
            num(t`No problema anterior, quanto vale $\lambda$?`, 0.25, t`$1=\lambda\cdot2x=4\lambda$.`),
            mcq(t`O multiplicador $\lambda$ tem uma interpretação:`, ['quanto o ótimo de f muda se a restrição c aumentar 1 unidade', 'o valor máximo de f', 'a distância à origem', 'nenhuma'], 0, t`$\lambda=\frac{df^*}{dc}$: o "preço sombra" da restrição.`),
            order(t`Ordene o método de Lagrange:`, [t`escrever $\nabla f=\lambda\nabla g$ e $g=c$`, 'resolver o sistema (eliminar λ)', 'avaliar f em cada candidato', 'escolher o maior/menor valor'], t`Montar, resolver, comparar.`),
          ],
        },
        {
          card: {
            title: 'Problemas de engenharia',
            body: t`Lagrange resolve projetos com orçamento, material ou energia limitados:

• Caixa de volume máximo com área de chapa fixa
• Lata de menor área para um volume dado
• Produção máxima $f=AK^{a}L^{b}$ com custo fixo (economia)
• Distância mínima de um ponto a uma superfície`,
            example: t`Lata (cilindro) de volume $V$ com área mínima: $\nabla(2\pi r^2+2\pi rh)=\lambda\nabla(\pi r^2h)$ leva a $h=2r$ — altura igual ao diâmetro.`,
          },
          exercises: [
            mcqS(t`A lata cilíndrica fechada de menor área para um volume fixo tem:`, 'altura igual ao diâmetro (h = 2r)', ['h = r', 'h = 4r', 'r = 2h', 'h = πr'], t`Resultado do sistema de Lagrange.`),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              return num(t`Retângulo de perímetro $${4 * a}$ com área máxima: qual a área?`, a * a, t`Lagrange (ou simetria) dá o quadrado de lado $${a}$.`);
            }),
            num(t`Caixa (paralelepípedo) com $x+y+z=12$ (soma das arestas de um vértice) e volume $xyz$ máximo: volume?`, 64, t`$yz=xz=xy=\lambda$ ⟹ $x=y=z=4$: $64$.`),
            num(t`Distância mínima da origem à reta $x+y=2$ (3 casas):`, Math.SQRT2, t`Minimize $x^2+y^2$: $x=y=1$, distância $\sqrt2\approx1{,}414$.`, { tol: 0.002 }),
            tf(t`Lagrange encontra candidatos; ainda é preciso compará-los para saber qual é máximo e qual é mínimo.`, true, t`O sistema não distingue os dois.`),
            mcqS(t`Produção $f=K^{1/2}L^{1/2}$ com custo $K+L=100$. O ótimo é:`, 'K = L = 50', ['K = 100, L = 0', 'K = 25, L = 75', 'K = L = 100', 'K = 10, L = 90'], t`Simetria: $\frac{L^{1/2}}{2K^{1/2}}=\frac{K^{1/2}}{2L^{1/2}}\Rightarrow K=L$.`),
            gen((rng) => {
              const r = randInt(rng, 1, 5);
              return num(t`Maior valor de $f=x$ sobre o círculo $x^2+y^2=${r * r}$:`, r, t`Ponto $(${r},\,0)$.`);
            }),
            multi(t`Em quais problemas Lagrange se aplica naturalmente?`, ['maximizar volume com área fixa', 'minimizar custo com produção fixa', 'achar a raiz de x² − 2', 'calcular uma integral dupla'], [0, 1], t`Otimização **com restrição**.`),
          ],
        },
      ],
    },
  ],
};
