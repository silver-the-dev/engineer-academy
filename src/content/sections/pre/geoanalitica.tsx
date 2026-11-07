import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { CircleW, FnCurve, InfLine, Label, ParamCurve, PolygonW, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, par, pick, polyTex, randInt, randNZ, term } from '../../../lib/random';

const t = String.raw;

const pt = (x: number | string, y: number | string) => `(${typeof x === 'number' ? fmt(x) : x},\\,${typeof y === 'number' ? fmt(y) : y})`;
const sq = (v: number, s: string) => (v === 0 ? `${s}^2` : `(${s}${v < 0 ? '+' : '-'}${fmt(Math.abs(v))})^2`);
const circEq = (a: number, b: number, r2: number) => `${sq(a, 'x')}+${sq(b, 'y')}=${fmt(r2)}`;
const lin = (m: number, b: number) => polyTex([b, m]);

const TRIPLES = [
  [3, 4, 5],
  [5, 12, 13],
  [6, 8, 10],
  [8, 15, 17],
  [7, 24, 25],
] as const;

/* ---------------- interactive labs ---------------- */

const pontoTriLab = () =>
  plot({
    view: { xMin: -5, xMax: 7, yMin: -4, yMax: 6 },
    equalAspect: true,
    snap: 1,
    points: [
      { id: 'A', x: -2, y: -1, color: C.p2, label: 'A' },
      { id: 'B', x: 4, y: 3, color: C.p3, label: 'B' },
    ],
    render: ({ pts }: any) => {
      const { A, B } = pts;
      const mx = (A.x + B.x) / 2;
      const my = (A.y + B.y) / 2;
      return (
        <>
          <Seg x1={A.x} y1={A.y} x2={B.x} y2={A.y} color={C.p5} width={3} dash="5 4" />
          <Seg x1={B.x} y1={A.y} x2={B.x} y2={B.y} color={C.p4} width={3} dash="5 4" />
          <Seg x1={A.x} y1={A.y} x2={B.x} y2={B.y} color={C.gold} width={4} />
          <Pt x={B.x} y={A.y} color={C.textDim} r={4} />
          <Pt x={mx} y={my} color={C.p2} r={5} label="M" />
          <Label x={(A.x + B.x) / 2} y={A.y} text={`Δx = ${fmt(Math.abs(B.x - A.x))}`} color={C.p5} anchor="middle" dy={16} size={12} />
          <Label x={B.x} y={(A.y + B.y) / 2} text={`Δy = ${fmt(Math.abs(B.y - A.y))}`} color={C.p4} dx={8} size={12} />
        </>
      );
    },
    info: ({ pts }: any) => {
      const dx = pts.B.x - pts.A.x;
      const dy = pts.B.y - pts.A.y;
      const d = Math.hypot(dx, dy);
      const mx = (pts.A.x + pts.B.x) / 2;
      const my = (pts.A.y + pts.B.y) / 2;
      return t`$d_{AB}=\sqrt{${fmt(Math.abs(dx))}^2+${fmt(Math.abs(dy))}^2}=${fmt(d, 2)}$ · ponto médio $M${pt(mx, my)}$`;
    },
  });

const triDetLab = () =>
  plot({
    view: { xMin: -5, xMax: 6, yMin: -4, yMax: 5 },
    equalAspect: true,
    snap: 1,
    points: [
      { id: 'A', x: -3, y: -2, color: C.p2, label: 'A' },
      { id: 'B', x: 3, y: -1, color: C.p3, label: 'B' },
      { id: 'C', x: 0, y: 3, color: C.gold, label: 'C' },
    ],
    render: ({ pts }: any) => {
      const { A, B, C: P } = pts;
      const D = (B.x - A.x) * (P.y - A.y) - (B.y - A.y) * (P.x - A.x);
      const gx = (A.x + B.x + P.x) / 3;
      const gy = (A.y + B.y + P.y) / 3;
      return (
        <>
          {Math.abs(D) < 1e-6 ? <InfLine x1={A.x} y1={A.y} x2={B.x} y2={B.y} color={C.danger} dash="6 4" width={2} /> : null}
          <PolygonW pts={[[A.x, A.y], [B.x, B.y], [P.x, P.y]]} color={Math.abs(D) < 1e-6 ? C.danger : C.p1} opacity={0.28} />
          <Pt x={gx} y={gy} color={C.p4} r={5} label="G" />
        </>
      );
    },
    info: ({ pts }: any) => {
      const { A, B, C: P } = pts;
      const D = (B.x - A.x) * (P.y - A.y) - (B.y - A.y) * (P.x - A.x);
      const area = Math.abs(D) / 2;
      const gx = (A.x + B.x + P.x) / 3;
      const gy = (A.y + B.y + P.y) / 3;
      if (Math.abs(D) < 1e-6) return t`$D=0$ ⟹ **pontos alinhados!** (área $=0$) · $G${pt( fmt(gx, 1), fmt(gy, 1) )}$`;
      return t`$\det D=${fmt(D)}$ · Área $=\frac{|D|}{2}=${fmt(area, 2)}$ · baricentro $G${pt(fmt(gx, 1), fmt(gy, 1))}$`;
    },
  });

const retasLab = (m1Init = 2, m2Init = 0.5) =>
  plot({
    view: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
    equalAspect: true,
    params: [
      { key: 'm1', label: 'm_1', min: -3, max: 3, step: 0.25, value: m1Init, color: C.p2 },
      { key: 'm2', label: 'm_2', min: -3, max: 3, step: 0.25, value: m2Init, color: C.p3 },
    ],
    render: ({ p }: any) => {
      const dm = p.m1 - p.m2;
      const ix = Math.abs(dm) > 1e-6 ? 1 / dm : null;
      const iy = ix !== null ? p.m1 * ix : null;
      return (
        <>
          <FnCurve f={(x) => p.m1 * x} color={C.p2} />
          <FnCurve f={(x) => p.m2 * x + 1} color={C.p3} />
          {ix !== null && iy !== null ? <Pt x={ix} y={iy} color={C.gold} r={5} label="P" /> : null}
        </>
      );
    },
    info: ({ p }: any) => {
      const prod = p.m1 * p.m2;
      const status =
        Math.abs(p.m1 - p.m2) < 1e-6
          ? '**paralelas** ($m_1=m_2$)'
          : Math.abs(prod + 1) < 1e-6
            ? '**perpendiculares!** ($m_1\\cdot m_2=-1$)'
            : 'concorrentes oblíquas';
      return t`$r_1:\ y=${fmt(p.m1, 2)}x$ · $r_2:\ y=${fmt(p.m2, 2)}x+1$ · $m_1\cdot m_2=${fmt(prod, 3)}$ ⟹ ${status}`;
    },
  });

const circRaioLab = () =>
  plot({
    view: { xMin: -6, xMax: 6, yMin: -6, yMax: 6 },
    equalAspect: true,
    snap: 0.5,
    points: [{ id: 'C', x: 1, y: -1, color: C.p2, label: 'C' }],
    params: [{ key: 'r', label: 'r', min: 0.5, max: 5, step: 0.5, value: 3, color: C.gold }],
    render: ({ pts, p }: any) => (
      <>
        <CircleW cx={pts.C.x} cy={pts.C.y} r={p.r} color={C.p2} fill={C.p2} fillOpacity={0.12} />
        <Seg x1={pts.C.x} y1={pts.C.y} x2={pts.C.x + p.r} y2={pts.C.y} color={C.gold} width={2.5} />
        <Pt x={pts.C.x + p.r} y={pts.C.y} color={C.gold} r={4} />
        <Label x={pts.C.x + p.r / 2} y={pts.C.y} text={`r = ${fmt(p.r)}`} color={C.gold} anchor="middle" dy={-8} size={12} />
      </>
    ),
    info: ({ pts, p }: any) => {
      const a = pts.C.x;
      const b = pts.C.y;
      const r2 = p.r * p.r;
      const F = a * a + b * b - r2;
      return t`$${circEq(a, b, r2)}$ · geral: $x^2+y^2${term(-2 * a, 'x')}${term(-2 * b, 'y')}${term(F, '')}=0$`;
    },
  });

const elipseLab = () =>
  plot({
    view: { xMin: -6, xMax: 6, yMin: -4.5, yMax: 4.5 },
    equalAspect: true,
    params: [
      { key: 'a', label: 'a', min: 3, max: 5, step: 0.5, value: 4, color: C.p2 },
      { key: 'b', label: 'b', min: 1.5, max: 3, step: 0.5, value: 2.5, color: C.p3 },
      { key: 't', label: '\\theta', min: 0, max: 6.28, step: 0.05, value: 1.1, color: C.gold },
    ],
    render: ({ p }: any) => {
      const c = Math.sqrt(Math.max(0, p.a * p.a - p.b * p.b));
      const px = p.a * Math.cos(p.t);
      const py = p.b * Math.sin(p.t);
      return (
        <>
          <ParamCurve fx={(th) => p.a * Math.cos(th)} fy={(th) => p.b * Math.sin(th)} t0={0} t1={2 * Math.PI} color={C.p2} />
          <Seg x1={-c} y1={0} x2={px} y2={py} color={C.gold} width={2} dash="5 4" />
          <Seg x1={c} y1={0} x2={px} y2={py} color={C.gold} width={2} dash="5 4" />
          <Pt x={-c} y={0} color={C.p5} r={5} label="F₁" dy={18} />
          <Pt x={c} y={0} color={C.p5} r={5} label="F₂" dy={18} />
          <Pt x={px} y={py} color={C.gold} r={6} label="P" />
        </>
      );
    },
    info: ({ p }: any) => {
      const c = Math.sqrt(Math.max(0, p.a * p.a - p.b * p.b));
      const px = p.a * Math.cos(p.t);
      const py = p.b * Math.sin(p.t);
      const d1 = Math.hypot(px + c, py);
      const d2 = Math.hypot(px - c, py);
      return t`$c=\sqrt{a^2-b^2}=${fmt(c, 2)}$ · $d(P,\,F_1)+d(P,\,F_2)=${fmt(d1, 2)}+${fmt(d2, 2)}=${fmt(2 * p.a)}=2a$ · $e=\frac{c}{a}=${fmt(c / p.a, 2)}$`;
    },
  });

const parabolaFocoLab = () =>
  plot({
    view: { xMin: -6, xMax: 6, yMin: -3.5, yMax: 5.5 },
    equalAspect: true,
    params: [
      { key: 'p', label: 'p', min: 0.5, max: 2.5, step: 0.5, value: 1, color: C.p2 },
      { key: 'x', label: 'x_P', min: -4, max: 4, step: 0.25, value: 2, color: C.gold },
    ],
    render: ({ p }: any) => {
      const yp = (p.x * p.x) / (4 * p.p);
      return (
        <>
          <FnCurve f={(x) => (x * x) / (4 * p.p)} color={C.p2} />
          <Seg x1={-6} y1={-p.p} x2={6} y2={-p.p} color={C.p5} width={2} dash="6 4" />
          <Seg x1={0} y1={p.p} x2={p.x} y2={yp} color={C.gold} width={2.5} />
          <Seg x1={p.x} y1={-p.p} x2={p.x} y2={yp} color={C.gold} width={2.5} />
          <Pt x={0} y={p.p} color={C.p3} r={5} label="F" />
          <Pt x={p.x} y={-p.p} color={C.p5} r={4} />
          <Pt x={p.x} y={yp} color={C.gold} r={6} label="P" />
        </>
      );
    },
    info: ({ p }: any) => {
      const yp = (p.x * p.x) / (4 * p.p);
      const d = yp + p.p;
      return t`$x^2=${fmt(4 * p.p)}y$ · foco $F(0,\,${fmt(p.p)})$ · diretriz $y=-${fmt(p.p)}$ · $d(P,\,F)=d(P,\,d)=${fmt(d, 2)}$`;
    },
  });

export const geoAnalitica: UnitDef = {
  id: 'p-ga',
  title: 'Geometria analítica e cônicas',
  subtitle: 'Pontos, retas, circunferência, elipse, parábola e hipérbole',
  icon: '🪐',
  source: 'Pré-Cálculo · Geometria Analítica e Seções Cônicas',
  guide: t`A geometria analítica traduz figuras e lugares geométricos em equações algébricas no plano cartesiano. Dominar retas, circunferências e as **seções cônicas** (elipse, parábola e hipérbole) é indispensável para parametrizar curvas e superfícies no Cálculo e em GAAL.`,
  lessons: [
    {
      id: 'p-ga-pontos',
      title: 'Pontos, razão de seção e áreas',
      parts: [
        {
          card: {
            title: 'Distância, ponto médio e razão de seção',
            body: t`Dados $A(x_A,\,y_A)$ e $B(x_B,\,y_B)$, as diferenças $\Delta x = x_B-x_A$ e $\Delta y = y_B-y_A$ formam os catetos de um triângulo retângulo:

$$d_{AB}=\sqrt{(\Delta x)^2+(\Delta y)^2}\qquad M=\left(\frac{x_A+x_B}{2},\,\frac{y_A+y_B}{2}\right)$$

Para achar o ponto $P$ que está a uma fração $t\in[0,\,1]$ do caminho de $A$ até $B$ (ou que divide $\overline{AB}$ na razão $k=\frac{AP}{PB}$), somamos a fração do deslocamento:

$$P = A + t(B-A) = \left(\frac{x_A+k\,x_B}{1+k},\,\frac{y_A+k\,y_B}{1+k}\right)$$`,
            visual: pontoTriLab(),
            example: t`De $A(1,\,2)$ até $B(7,\,8)$, um terço do caminho ($t=\frac13$) dá $P=\left(1+\frac{6}{3},\,2+\frac{6}{3}\right)=(3,\,4)$.`,
            tip: t`No ponto médio temos $t=\frac12$ (razão $k=1$). Se $B$ é o ponto médio de $AC$, então $C = 2B - A$.`,
          },
          exercises: [
            inter(
              t`Arraste $A$ e $B$ para formar um segmento **inclinado** ($\Delta x\ne 0$ e $\Delta y\ne 0$) cuja distância seja exatamente $d_{AB}=5$.`,
              'plot',
              pontoTriLab().props,
              (v: any) =>
                v &&
                Math.abs(v.pts.B.x - v.pts.A.x) > 0.5 &&
                Math.abs(v.pts.B.y - v.pts.A.y) > 0.5 &&
                near(Math.hypot(v.pts.B.x - v.pts.A.x, v.pts.B.y - v.pts.A.y), 5, 0.05),
              t`Catetos $3$ e $4$, por exemplo $A(0,\,0)$ e $B(4,\,3)$.`,
              t`Pelo terno pitagórico $(3,\,4,\,5)$, $\sqrt{3^2+4^2}=\sqrt{25}=5$.`,
            ),
            gen((rng) => {
              const [dx, dy, d] = pick(rng, TRIPLES);
              const x1 = randInt(rng, -5, 3);
              const y1 = randInt(rng, -5, 3);
              const s1 = pick(rng, [1, -1]);
              const s2 = pick(rng, [1, -1]);
              return num(
                t`Calcule a distância entre $A${pt(x1, y1)}$ e $B${pt(x1 + s1 * dx, y1 + s2 * dy)}$.`,
                d,
                t`$|\Delta x|=${dx}$ e $|\Delta y|=${dy}$ ⟹ $d=\sqrt{${dx}^2+${dy}^2}=\sqrt{${dx * dx + dy * dy}}=${d}$.`,
              );
            }),
            mcqS(
              t`Qual ponto $P$ divide o segmento de $A(1,\,2)$ até $B(7,\,8)$ a **um terço** do caminho a partir de $A$ ($AP=\frac13 AB$)?`,
              t`$(3,\,4)$`,
              [t`$(4,\,5)$`, t`$(5,\,6)$`, t`$(2,\,3)$`, t`$(6,\,6)$`],
              t`$\Delta x=6$ e $\Delta y=6$; somando $\frac13$ de cada variação a $A$: $(1+2,\,2+2)=(3,\,4)$.`,
            ),
            gen((rng) => {
              const ax = randInt(rng, -4, 2);
              const ay = randInt(rng, -4, 2);
              const kx = randNZ(rng, -3, 3);
              const ky = randNZ(rng, -3, 3);
              const bx = ax + 3 * kx;
              const by = ay + 3 * ky;
              const px = ax + kx;
              const py = ay + ky;
              return rmcq(
                rng,
                t`Dados $A${pt(ax, ay)}$ e $B${pt(bx, by)}$, qual ponto $P$ está a $\dfrac13$ do caminho de $A$ para $B$ (razão $\dfrac{AP}{PB}=\dfrac12$)?`,
                `$${pt(px, py)}$`,
                [
                  `$${pt(ax + 2 * kx, ay + 2 * ky)}$`,
                  `$${pt((ax + bx) / 2, (ay + by) / 2)}$`,
                  `$${pt(px + 1, py - 1)}$`,
                  `$${pt(ax - kx, ay - ky)}$`,
                ],
                t`$P = A + \frac13(B-A) = \left(${ax}+${par(kx)},\,${ay}+${par(ky)}\right)=${pt(px, py)}$.`,
              );
            }),
            tf(
              t`O ponto $P(0,\,2)$ é equidistante de $A(-2,\,0)$ e $B(2,\,0)$.`,
              true,
              t`$d(P,\,A)=\sqrt{(-2)^2+2^2}=\sqrt8$ e $d(P,\,B)=\sqrt{2^2+2^2}=\sqrt8$: está sobre a mediatriz (eixo $y$).`,
            ),
            gen((rng) => {
              const xm = randInt(rng, -3, 4);
              const d = randInt(rng, 1, 3);
              const x1 = xm - d;
              const x2 = xm + d;
              const y = randInt(rng, 2, 5);
              return num(
                t`Qual deve ser a abscissa $x$ para que o ponto $P(x,\,0)$, no eixo $x$, seja equidistante de $A${pt(x1, y)}$ e $B${pt(x2, -y)}$?`,
                xm,
                t`Igualando $d(P,\,A)^2=d(P,\,B)^2$: $(x${term(-x1, '')})^2+${y * y}=(x${term(-x2, '')})^2+${y * y}\Rightarrow x=\frac{${x1}+(${x2})}{2}=${xm}$.`,
              );
            }),
            fill(
              t`Complete a fórmula do ponto que divide $\overline{AB}$ na razão $k=\dfrac{AP}{PB}$:`,
              t`$x_P = \dfrac{x_A + k\,x_B}{D}$, com $D=$ ___ ; no ponto médio, $k=$ ___ e $x_M = \dfrac{x_A+x_B}{2}$.`,
              ['1+k', '1'],
              ['k', '2', 'k-1'],
              t`Ponderando com pesos $1$ e $k$, dividimos pela soma dos pesos $1+k$; no ponto médio $AP=PB$, logo $k=1$.`,
            ),
            num(
              t`O segmento de $A(-2,\,1)$ até $B(6,\,5)$ é prolongado além de $B$ até um ponto $C$ tal que $BC=AB$ ($B$ é o ponto médio de $AC$). Quanto vale $x_C+y_C$?`,
              23,
              t`$C = 2B - A = (2\cdot6 - (-2),\,2\cdot5 - 1) = (14,\,9)$. Logo, $x_C+y_C = 14+9 = 23$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Baricentro e simetrias',
            body: t`O **baricentro** $G$ de um triângulo $ABC$ é o ponto de encontro das três **medianas** (e o centro de gravidade de uma placa homogênea). Suas coordenadas são a média aritmética dos vértices:

$$G=\left(\frac{x_A+x_B+x_C}{3},\,\frac{y_A+y_B+y_C}{3}\right)$$

Propriedade geométrica fundamental: $G$ divide cada mediana na razão $2:1$ a partir do vértice ($AG = 2\,GM$, ou seja, $\frac23$ da mediana).`,
            example: t`Vértices $(0,\,0)$, $(6,\,0)$ e $(3,\,9)$ ⟹ $G=\left(\frac{0+6+3}{3},\,\frac{0+0+9}{3}\right)=(3,\,3)$.`,
            tip: t`Simetrias de $(x,\,y)$: eixo $x\to(x,\,-y)$; eixo $y\to(-x,\,y)$; origem $\to(-x,\,-y)$; bissetriz $y=x\to(y,\,x)$.`,
          },
          exercises: [
            mcq(
              t`O baricentro $G$ de um triângulo é o ponto de encontro das três…`,
              ['medianas', 'alturas (ortocentro)', 'bissetrizes internas (incentro)', 'mediatrizes (circuncentro)'],
              0,
              t`Cada mediana liga um vértice ao ponto médio do lado oposto; as três se cruzam no baricentro $G$.`,
            ),
            gen((rng) => {
              const gx = randInt(rng, -3, 4);
              const gy = randInt(rng, -3, 4);
              const ax = randInt(rng, -4, 4);
              const ay = randInt(rng, -4, 4);
              const bx = randInt(rng, -4, 4);
              const by = randInt(rng, -4, 4);
              const cx = 3 * gx - ax - bx;
              const cy = 3 * gy - ay - by;
              return rmcq(
                rng,
                t`Qual é o baricentro do triângulo de vértices $A${pt(ax, ay)}$, $B${pt(bx, by)}$ e $C${pt(cx, cy)}$?`,
                `$${pt(gx, gy)}$`,
                [
                  `$${pt(gx + 1, gy - 1)}$`,
                  `$${pt(3 * gx, 3 * gy)}$`,
                  `$${pt(gx - 2, gy + 1)}$`,
                  `$${pt(gy, gx === gy ? gx + 2 : gx)}$`,
                ],
                t`Média das coordenadas: $x_G=\frac{${ax}+(${bx})+(${cx})}{3}=${gx}$ e $y_G=\frac{${ay}+(${by})+(${cy})}{3}=${gy}$.`,
              );
            }),
            gen((rng) => {
              const gx = randInt(rng, -3, 4);
              const ax = randInt(rng, -5, 5);
              const bx = randInt(rng, -5, 5);
              const cx = 3 * gx - ax - bx;
              return num(
                t`Num triângulo $ABC$, sabemos que $x_A=${ax}$, $x_B=${bx}$ e a abscissa do baricentro é $x_G=${gx}$. Quanto vale $x_C$?`,
                cx,
                t`$\frac{${ax}+(${bx})+x_C}{3}=${gx}\Rightarrow x_C=3\cdot(${gx})-(${ax})-(${bx})=${cx}$.`,
              );
            }),
            tf(
              t`O baricentro divide cada mediana na razão $2:1$ a partir do vértice (fica a $\frac23$ do caminho do vértice até o ponto médio do lado oposto).`,
              true,
              t`Por isso $G = \frac{1\cdot A + 2\cdot M_{BC}}{1+2} = \frac{A + (B+C)}{3} = \frac{A+B+C}{3}$.`,
            ),
            match(
              t`Ligue cada transformação aplicada ao ponto $P(3,\,-5)$ à imagem resultante:`,
              [
                ['Reflexão no eixo $x$', t`$(3,\,5)$`],
                ['Reflexão no eixo $y$', t`$(-3,\,-5)$`],
                ['Simetria em relação à origem', t`$(-3,\,5)$`],
                ['Reflexão na reta $y=x$', t`$(-5,\,3)$`],
              ],
              t`Refletir no eixo $x$ troca o sinal de $y$; no eixo $y$ troca o de $x$; na origem troca ambos; em $y=x$ permuta as coordenadas.`,
            ),
            gen((rng) => {
              const ax = randInt(rng, -4, 2);
              const ay = randInt(rng, -4, 2);
              const kx = randNZ(rng, -3, 3);
              const ky = randNZ(rng, -3, 3);
              const mx = ax + 3 * kx;
              const my = ay + 3 * ky;
              const gx = ax + 2 * kx;
              return num(
                t`Em $\triangle ABC$, o vértice é $A${pt(ax, ay)}$ e o ponto médio do lado $BC$ é $M${pt(mx, my)}$. Qual é a abscissa $x_G$ do baricentro?`,
                gx,
                t`$G$ está a $\frac23$ do caminho de $A$ até $M$: $x_G = ${ax} + \frac23(${mx}-(${ax})) = ${gx}$.`,
              );
            }),
            mcqS(
              t`Três partículas de mesma massa estão nos pontos $(0,\,0)$, $(6,\,0)$ e $(0,\,9)$. Onde fica o centro de massa do sistema?`,
              t`$(2,\,3)$`,
              [t`$(3,\,4{,}5)$`, t`$(6,\,9)$`, t`$(3,\,2)$`, t`$(2,\,4{,}5)$`],
              t`Com massas iguais, o centro de massa coincide com o baricentro: $\left(\frac{0+6+0}{3},\,\frac{0+0+9}{3}\right)=(2,\,3)$.`,
            ),
            num(
              t`Os pontos médios dos três lados de um triângulo são $M_1(1,\,2)$, $M_2(3,\,4)$ e $M_3(5,\,0)$. Quanto vale a soma $x_G+y_G$ das coordenadas do baricentro do triângulo original?`,
              5,
              t`O baricentro do triângulo original coincide com o baricentro do triângulo dos pontos médios: $G=\left(\frac{1+3+5}{3},\,\frac{2+4+0}{3}\right)=(3,\,2)$, soma $=5$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Área de triângulo e alinhamento',
            body: t`Dados $A(x_A,\,y_A)$, $B(x_B,\,y_B)$ e $C(x_C,\,y_C)$, o determinante

$$D=\begin{vmatrix}x_A&y_A&1\\x_B&y_B&1\\x_C&y_C&1\end{vmatrix}=(x_B-x_A)(y_C-y_A)-(y_B-y_A)(x_C-x_A)$$

fornece a **área do triângulo** e a **condição de alinhamento**:

$$A_{\triangle}=\frac{|D|}{2}\qquad\text{e}\qquad A,\,B,\,C\text{ colineares}\iff D=0$$`,
            visual: triDetLab(),
            example: t`Para $A(0,\,0)$, $B(4,\,1)$ e $C(2,\,5)$: $D = 4\cdot5 - 1\cdot2 = 18 \implies A_{\triangle}=\frac{18}{2}=9$.`,
            tip: t`Quando um vértice é a origem $(0,\,0)$ (ou subtraindo $A$ dos outros dois), basta fazer $D = x_1 y_2 - y_1 x_2$.`,
          },
          exercises: [
            tf(
              t`Três pontos $A$, $B$ e $C$ estão alinhados (são colineares) se, e somente se, o determinante $D$ formado por suas coordenadas for igual a zero.`,
              true,
              t`$D=0$ equivale a área zero, isto é, os três pontos pertencem a uma mesma reta.`,
            ),
            inter(
              t`Arraste o vértice $C$ no gráfico até que os três pontos $A$, $B$ e $C$ fiquem **alinhados** ($D=0$).`,
              'plot',
              triDetLab().props,
              (v: any) => {
                if (!v) return false;
                const { A, B, C: P } = v.pts;
                const D = (B.x - A.x) * (P.y - A.y) - (B.y - A.y) * (P.x - A.x);
                return near(D, 0, 0.05);
              },
              t`Qualquer ponto sobre a reta $AB$, como $C(-3,\,-2)$ ou $C(3,\,-1)$.`,
              t`Quando $C$ cai sobre a reta que passa por $A$ e $B$, o triângulo degenera num segmento e $D=0$.`,
            ),
            gen((rng) => {
              const x1 = 2 * randInt(rng, 1, 4);
              const y1 = randInt(rng, 0, 3);
              const x2 = randInt(rng, 0, 3);
              const y2 = 2 * randInt(rng, 2, 5);
              const D = Math.abs(x1 * y2 - y1 * x2);
              return num(
                t`Calcule a área do triângulo de vértices $O(0,\,0)$, $B${pt(x1, y1)}$ e $C${pt(x2, y2)}$.`,
                D / 2,
                t`Com um vértice na origem, $|D|=|${x1}\cdot${y2}-${y1}\cdot${x2}|=${D}$ e $A=\frac{${D}}{2}=${fmt(D / 2)}$.`,
              );
            }),
            gen((rng) => {
              const m = randNZ(rng, -3, 3);
              const y0 = randInt(rng, -4, 4);
              const k = y0 + 4 * m;
              return num(
                t`Para qual valor de $k$ os pontos $A(1,\,${y0 + m})$, $B(3,\,${y0 + 3 * m})$ e $C(5,\,k)$ são **colineares**?`,
                k,
                t`De $x=1$ a $x=3$, $y$ varia $${2 * m}$ (taxa $m=${m}$). De $x=3$ a $x=5$, varia mais $${2 * m}$: $k=${y0 + 3 * m}+(${2 * m})=${k}$.`,
              );
            }),
            mcqS(
              t`Os pontos $A(1,\,1)$, $B(2,\,3)$ e $C(4,\,7)$ no plano cartesiano…`,
              'são colineares (estão na mesma reta)',
              ['formam um triângulo de área $2$', 'formam um triângulo retângulo', 'formam um triângulo equilátero'],
              t`$\Delta x_{AB}=1,\,\Delta y_{AB}=2$ e $\Delta x_{AC}=3,\,\Delta y_{AC}=6$: mesma inclinação $m=2$, logo $D=1\cdot6-2\cdot3=0$.`,
            ),
            gen((rng) => {
              const m = randNZ(rng, -2, 3);
              const b = randInt(rng, -3, 3);
              const aligned = rng() < 0.5;
              const y3 = 4 * m + b + (aligned ? 0 : pick(rng, [-2, 1, 2]));
              return tf(
                t`Os pontos $(0,\,${b})$, $(2,\,${2 * m + b})$ e $(4,\,${y3})$ estão alinhados.`,
                aligned,
                aligned
                  ? t`A taxa de variação é constante igual a $m=${m}$ nos dois trechos ($D=0$).`
                  : t`A reta pelos dois primeiros pontos dá $y=${4 * m + b}$ em $x=4$, diferente de $${y3}$ ($D\ne0$).`,
              );
            }),
            order(
              t`Ordene os passos para calcular a área de um triângulo pelos seus vértices $(x_i,\,y_i)$:`,
              [
                'Montar a matriz 3×3 com as coordenadas (x, y, 1) de cada vértice',
                'Calcular o determinante D da matriz (ou usar os vetores AB e AC)',
                'Tomar o valor absoluto |D| para garantir sinal positivo',
                'Dividir o resultado por 2: A = |D| / 2',
              ],
              t`O módulo do determinante dá a área do paralelogramo; metade disso é a área do triângulo.`,
            ),
            num(
              t`Os pontos $A(0,\,k)$, $B(4,\,0)$ e $C(0,\,0)$, com $k>0$, formam um triângulo de área $14$. Quanto vale $k$?`,
              7,
              t`Base $4$ no eixo $x$ e altura $k$ no eixo $y$: $\frac{4k}{2}=14 \Rightarrow 2k=14 \Rightarrow k=7$.`,
            ),
          ],
        },
      ],
    },
    {
      id: 'p-ga-reta',
      title: 'Estudo analítico da reta',
      parts: [
        {
          card: {
            title: 'Inclinação e equações da reta',
            body: t`A **inclinação** $\theta\in[0^\circ,\,180^\circ)$ é o ângulo que a reta forma com o semieixo positivo $x$. O **coeficiente angular** é

$$m = \operatorname{tg}\theta = \frac{y_2-y_1}{x_2-x_1}\quad (\theta\ne 90^\circ)$$

Principais formas da equação da reta:
• **Ponto-inclinação**: $y - y_0 = m(x - x_0)$
• **Reduzida**: $y = mx + n$ ($n$: onde corta o eixo $y$)
• **Geral**: $ax + by + c = 0$ (com $m = -\frac{a}{b}$ se $b\ne0$)
• **Segmentária**: $\frac{x}{p} + \frac{y}{q} = 1$ (corta os eixos em $(p,\,0)$ e $(0,\,q)$)`,
            example: t`Reta com $\theta=45^\circ$ ($m=\operatorname{tg}45^\circ=1$) por $(2,\,5)$: $y-5=1(x-2)\implies y=x+3\implies x-y+3=0$.`,
            tip: t`Se $0^\circ<\theta<90^\circ$, $m>0$ (sobe); se $90^\circ<\theta<180^\circ$, $m<0$ (desce); se $\theta=90^\circ$ (reta vertical $x=k$), $\operatorname{tg}90^\circ$ não existe!`,
          },
          exercises: [
            match(
              t`Ligue o ângulo de inclinação $\theta$ ao coeficiente angular $m=\operatorname{tg}\theta$:`,
              [
                [t`$\theta = 0^\circ$ (horizontal)`, '$m = 0$'],
                [t`$\theta = 45^\circ$`, '$m = 1$'],
                [t`$\theta = 60^\circ$`, t`$m = \sqrt{3}$`],
                [t`$\theta = 135^\circ$`, '$m = -1$'],
              ],
              t`$\operatorname{tg}0^\circ=0$, $\operatorname{tg}45^\circ=1$, $\operatorname{tg}60^\circ=\sqrt3$ e $\operatorname{tg}135^\circ=-\operatorname{tg}45^\circ=-1$.`,
            ),
            mcq(
              t`Sobre uma reta **vertical** de equação $x = 4$ ($\theta = 90^\circ$), seu coeficiente angular $m$ é…`,
              ['inexistente (não definido)', 'igual a $0$', 'igual a $4$', 'igual a $1$'],
              0,
              t`Numa reta vertical $\Delta x = 0$, e não existe divisão por zero (nem $\operatorname{tg}90^\circ$).`,
            ),
            gen((rng) => {
              const m = randNZ(rng, -4, 4);
              const x0 = randInt(rng, -3, 3);
              const y0 = randInt(rng, -4, 4);
              const n = y0 - m * x0;
              return rmcq(
                rng,
                t`Usando $y-y_0=m(x-x_0)$, qual é a equação reduzida da reta de coeficiente angular $m=${m}$ que passa por $${pt(x0, y0)}$?`,
                `$y=${lin(m, n)}$`,
                [
                  `$y=${lin(m, y0 + m * x0 === n ? n + 2 : y0 + m * x0)}$`,
                  `$y=${lin(-m, n)}$`,
                  `$y=${lin(m, n + 3)}$`,
                  `$y=${lin(m, -n === n ? n - 2 : -n)}$`,
                ],
                t`$y-(${y0})=${m}(x-(${x0}))\Rightarrow y=${m}x${term(-m * x0 + y0, '')}=${lin(m, n)}$.`,
              );
            }),
            gen((rng) => {
              const b = pick(rng, [2, 3, 4, 5]);
              const m = randNZ(rng, -4, 4);
              const a = -m * b;
              const c = randNZ(rng, -9, 9);
              return num(
                t`Qual é o coeficiente angular $m$ da reta de equação geral $${term(a, 'x', true)}${term(b, 'y')}${term(c, '')}=0$?`,
                m,
                t`Isolando $y$: $${b}y=${term(-a, 'x', true)}${term(-c, '')}\Rightarrow m=-\frac{a}{b}=-\frac{${a}}{${b}}=${m}$.`,
              );
            }),
            mcqS(
              t`Qual é a equação **segmentária** da reta que corta o eixo $x$ em $(4,\,0)$ e o eixo $y$ em $(0,\,-3)$?`,
              t`$\dfrac{x}{4} - \dfrac{y}{3} = 1$`,
              [t`$\dfrac{x}{4} + \dfrac{y}{3} = 1$`, t`$4x - 3y = 1$`, t`$-\dfrac{x}{3} + \dfrac{y}{4} = 1$`],
              t`Na forma $\frac{x}{p}+\frac{y}{q}=1$, temos $p=4$ e $q=-3$: $\frac{x}{4}-\frac{y}{3}=1$.`,
            ),
            fill(
              t`Passe a reta $6x - 2y + 8 = 0$ para a forma reduzida:`,
              t`Isolando $y$: $y=$ ___ $x\,+$ ___ , portanto o coeficiente linear é $n=$ ___ .`,
              ['3', '4', '4'],
              ['-3', '-4', '6'],
              t`$2y = 6x + 8 \Rightarrow y = 3x + 4$, onde $m=3$ e $n=4$.`,
            ),
            gen((rng) => {
              const p = 2 * randInt(rng, 1, 5);
              const q = randInt(rng, 2, 7);
              return num(
                t`A reta $\dfrac{x}{${p}}+\dfrac{y}{${q}}=1$ determina com os eixos coordenados um triângulo retângulo no 1º quadrante. Qual a área desse triângulo?`,
                (p * q) / 2,
                t`A reta corta os eixos em $(${p},\,0)$ e $(0,\,${q})$: catetos $${p}$ e $${q}$, área $=\frac{${p}\cdot${q}}{2}=${(p * q) / 2}$.`,
              );
            }),
            mcqS(
              t`Uma reta forma ângulo de $135^\circ$ com o semieixo positivo $x$ e passa por $(1,\,4)$. Qual é sua equação geral?`,
              t`$x + y - 5 = 0$`,
              [t`$x - y + 3 = 0$`, t`$x + y + 5 = 0$`, t`$2x + y - 6 = 0$`],
              t`$m=\operatorname{tg}135^\circ=-1$. Assim, $y-4=-1(x-1)\Rightarrow x+y-5=0$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Paralelas e perpendiculares',
            body: t`Duas retas não verticais $r_1$ e $r_2$ de coeficientes angulares $m_1$ e $m_2$ são:

• **Paralelas**: $m_1 = m_2$
• **Perpendiculares** ($90^\circ$): $m_1\cdot m_2 = -1 \iff m_2 = -\frac{1}{m_1}$

Para obter a inclinação perpendicular, **inverta a fração e troque o sinal**!`,
            visual: retasLab(),
            example: t`Perpendicular a $y=\frac{2}{3}x+1$: tem $m_2=-\frac{3}{2}$.`,
            tip: t`Na forma geral $a_1x+b_1y+c_1=0$ e $a_2x+b_2y+c_2=0$, elas são perpendiculares quando $a_1a_2+b_1b_2=0$.`,
          },
          exercises: [
            tf(
              t`As retas $y = 3x + 1$ e $y = \frac{1}{3}x - 2$ são perpendiculares.`,
              false,
              t`$m_1\cdot m_2 = 3\cdot\frac13 = +1 \ne -1$. Para ser perpendicular a $y=3x+1$, o coeficiente deve ser $-\frac13$.`,
            ),
            inter(
              t`Ajuste os controles no gráfico para que as duas retas fiquem **perpendiculares** ($m_1\cdot m_2 = -1$).`,
              'plot',
              retasLab(2, 0.5).props,
              (v: any) => v && near(v.p.m1 * v.p.m2, -1, 0.05),
              t`Por exemplo, $m_1 = 2$ e $m_2 = -0{,}5$ (ou $m_1 = 1$ e $m_2 = -1$).`,
              t`Quando $m_1\cdot m_2 = -1$, o ângulo entre as retas é exatamente $90^\circ$.`,
            ),
            gen((rng) => {
              const [p, q] = pick(rng, [
                [2, 3],
                [3, 4],
                [2, 5],
                [3, 5],
                [4, 7],
                [5, 2],
              ]);
              const s = pick(rng, [1, -1]);
              const m1 = `${s < 0 ? '-' : ''}\\frac{${p}}{${q}}`;
              const m2 = `${s > 0 ? '-' : ''}\\frac{${q}}{${p}}`;
              return rmcq(
                rng,
                t`Se uma reta $r$ tem coeficiente angular $m_r = ${m1}$, qual é o coeficiente angular de uma reta **perpendicular** a $r$?`,
                `$${m2}$`,
                [`$${s < 0 ? '-' : ''}\\frac{${q}}{${p}}$`, `$${s > 0 ? '-' : ''}\\frac{${p}}{${q}}$`, `$${m1}$`, `$-1$`],
                t`Inverta a fração e troque o sinal: $-\frac{1}{${m1}} = ${m2}$.`,
              );
            }),
            gen((rng) => {
              const mPerp = pick(rng, [1, -1, 2, -2, 3, -3]);
              const k = randInt(rng, -2, 2);
              const x0 = mPerp * k;
              const y0 = randInt(rng, -4, 4);
              const n = y0 - mPerp * x0;
              // the given line has slope -1/mPerp (a single sign, never "--1/3")
              const rEq = Math.abs(mPerp) === 1 ? `${mPerp > 0 ? '-' : ''}x+5` : `${mPerp > 0 ? '-' : ''}\\frac{1}{${Math.abs(mPerp)}}x+1`;
              return rmcq(
                rng,
                t`Qual é a equação reduzida da reta que passa por $${pt(x0, y0)}$ e é **perpendicular** a $y=${rEq}$?`,
                `$y=${lin(mPerp, n)}$`,
                [
                  `$y=${lin(-mPerp, n)}$`,
                  `$y=${lin(mPerp, n + 2)}$`,
                  `$y=${lin(mPerp, y0 + mPerp * x0 === n ? n - 3 : y0 + mPerp * x0)}$`,
                  `$y=${lin(-mPerp, -n)}$`,
                ],
                t`O coeficiente perpendicular é $m=${mPerp}$; passando por $${pt(x0, y0)}$: $y=${mPerp}(x${term(-x0, '')})${term(y0, '')}=${lin(mPerp, n)}$.`,
              );
            }),
            match(
              t`Classifique cada reta em relação à reta de referência $r:\ y = 2x - 1$:`,
              [
                [t`$y = 2x + 5$`, 'Paralela distinta'],
                [t`$2x - y - 1 = 0$`, 'Coincidente (mesma reta)'],
                [t`$x + 2y - 4 = 0$`, 'Perpendicular'],
                [t`$y = -2x + 3$`, 'Concorrente oblíqua'],
              ],
              t`$x+2y-4=0 \Rightarrow y=-\frac12x+2$ tem $m=-\frac12$, logo $2\cdot(-\frac12)=-1$ (perpendicular).`,
            ),
            gen((rng) => {
              const a2 = randNZ(rng, -4, 4);
              const b1 = pick(rng, [2, 3, 4]);
              const k = randNZ(rng, -3, 3);
              const b2 = -a2 * k;
              const a1 = b1 * k;
              return num(
                t`Para qual valor de $k$ as retas $kx ${term(b1, 'y')} - 1 = 0$ e $${term(a2, 'x', true)} ${term(b2, 'y')} + 5 = 0$ são **perpendiculares**?`,
                a1,
                t`Condição $a_1a_2 + b_1b_2 = 0$: $${a2}k + (${b1})\cdot(${b2}) = 0 \Rightarrow ${a2}k = ${-b1 * b2} \Rightarrow k = ${a1}$.`,
              );
            }),
            mcqS(
              t`A **mediatriz** do segmento $AB$ é a reta perpendicular a $AB$ pelo seu ponto médio. Dados $A(0,\,0)$ e $B(4,\,2)$, qual é a equação da mediatriz de $AB$?`,
              t`$y = -2x + 5$`,
              [t`$y = \frac12 x$`, t`$y = -2x + 3$`, t`$y = 2x - 3$`],
              t`Ponto médio $M(2,\,1)$ e $m_{AB}=\frac{2}{4}=\frac12 \Rightarrow m_{\perp}=-2$. Logo $y-1=-2(x-2)\Rightarrow y=-2x+5$.`,
            ),
            num(
              t`Qual é a abscissa $x$ da projeção ortogonal (pé da perpendicular) do ponto $P(0,\,5)$ sobre a reta $y = 2x$?`,
              2,
              t`A perpendicular a $y=2x$ por $(0,\,5)$ é $y=-0{,}5x+5$. Igualando: $2x=-0{,}5x+5\Rightarrow 2{,}5x=5\Rightarrow x=2$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Distância de ponto a reta e ângulo',
            body: t`A menor distância de um ponto $P(x_0,\,y_0)$ até a reta $r:\ ax + by + c = 0$ é o comprimento da perpendicular baixada de $P$ a $r$:

$$d(P,\,r) = \frac{|ax_0 + by_0 + c|}{\sqrt{a^2 + b^2}}$$

Para duas retas **paralelas** $ax+by+c_1=0$ e $ax+by+c_2=0$ (com os mesmos $a$ e $b$):

$$d(r,\,s) = \frac{|c_1 - c_2|}{\sqrt{a^2 + b^2}}$$`,
            example: t`Distância de $P(1,\,2)$ a $3x+4y-1=0$: $d = \frac{|3(1)+4(2)-1|}{\sqrt{3^2+4^2}} = \frac{10}{5} = 2$.`,
            tip: t`Antes de aplicar a fórmula, deixe sempre a reta na **forma geral** ($ax+by+c=0$).`,
          },
          exercises: [
            fill(
              t`Sobre a fórmula $d(P,\,r)=\dfrac{|ax_0+by_0+c|}{\sqrt{a^2+b^2}}$:`,
              t`A equação da reta deve estar na forma ___ e o denominador $\sqrt{a^2+b^2}$ nunca ___ porque $a$ e $b$ não são ambos nulos.`,
              ['geral', 'zera'],
              ['reduzida', 'existe', 'negativa'],
              t`Escreva $ax+by+c=0$ para identificar $a, b, c$; como $a^2+b^2>0$, o denominador é sempre positivo.`,
            ),
            gen((rng) => {
              const [a, b, h] = pick(rng, TRIPLES);
              const k = randInt(rng, 1, 6);
              const c = pick(rng, [1, -1]) * k * h;
              return num(
                t`Calcule a distância da origem $(0,\,0)$ à reta $${a}x ${term(b, 'y')} ${term(c, '')} = 0$.`,
                k,
                t`$d = \frac{|0 + 0 ${term(c, '')}|}{\sqrt{${a}^2+${b}^2}} = \frac{${k * h}}{${h}} = ${k}$.`,
              );
            }),
            gen((rng) => {
              const [a, b, h] = pick(rng, [
                [3, 4, 5],
                [4, -3, 5],
                [5, 12, 13],
                [6, 8, 10],
              ] as const);
              const x0 = randInt(rng, -3, 4);
              const y0 = randInt(rng, -3, 4);
              const k = randInt(rng, 1, 5);
              const c = k * h - (a * x0 + b * y0);
              return num(
                t`Qual a distância do ponto $P${pt(x0, y0)}$ à reta $${a}x ${term(b, 'y')} ${term(c, '')} = 0$?`,
                k,
                t`$d = \frac{|${a}(${x0}) ${term(b, `(${y0})`)} ${term(c, '')}|}{\sqrt{${a * a}+${b * b}}} = \frac{${k * h}}{${h}} = ${k}$.`,
              );
            }),
            mcqS(
              t`Qual é a distância do ponto $P(4,\,-1)$ até a reta horizontal $y = 5$?`,
              '$6$',
              ['$4$', '$5$', '$3$', '$1$'],
              t`A distância vertical entre $y=-1$ e $y=5$ é $|5 - (-1)| = 6$.`,
            ),
            gen((rng) => {
              const [a, b, h] = pick(rng, [
                [3, 4, 5],
                [5, 12, 13],
                [8, 6, 10],
              ] as const);
              const c1 = randInt(rng, -10, 5);
              const k = randInt(rng, 1, 4);
              const c2 = c1 + k * h;
              return num(
                t`Calcule a distância entre as retas paralelas $${a}x+${b}y${term(c1, '')}=0$ e $${a}x+${b}y${term(c2, '')}=0$.`,
                k,
                t`$d = \frac{|c_2 - c_1|}{\sqrt{${a}^2+${b}^2}} = \frac{${k * h}}{${h}} = ${k}$.`,
              );
            }),
            tf(
              t`Se a distância de um ponto $P(x_0,\,y_0)$ à reta $r:\ ax+by+c=0$ é igual a zero, então $P$ pertence à reta $r$.`,
              true,
              t`$d(P,\,r)=0 \iff |ax_0+by_0+c|=0 \iff ax_0+by_0+c=0$, que é exatamente a condição de $P\in r$.`,
            ),
            num(
              t`A base $AB$ de um triângulo mede $6$ e está contida na reta $3x - 4y + 2 = 0$. Se o terceiro vértice é $C(2,\,-1)$, qual é a área do triângulo $ABC$?`,
              7.2,
              t`A altura é $h = d(C,\,r) = \frac{|3(2)-4(-1)+2|}{\sqrt{9+16}} = \frac{12}{5} = 2{,}4$. Área $= \frac{6\cdot 2{,}4}{2} = 7{,}2$.`,
            ),
            mcqS(
              t`O ângulo agudo $\alpha$ entre duas retas de inclinações $m_1$ e $m_2$ satisfaz $\operatorname{tg}\alpha = \left|\dfrac{m_1-m_2}{1+m_1m_2}\right|$. Qual é o ângulo agudo entre $y=3x$ e $y=\frac12 x$?`,
              t`$45^\circ$`,
              [t`$30^\circ$`, t`$60^\circ$`, t`$90^\circ$`],
              t`$\operatorname{tg}\alpha = \left|\frac{3 - 1/2}{1 + 3/2}\right| = \frac{5/2}{5/2} = 1 \implies \alpha = 45^\circ$.`,
            ),
          ],
        },
      ],
    },
    {
      id: 'p-ga-circ',
      title: 'A circunferência a fundo',
      parts: [
        {
          card: {
            title: 'Equação geral e condição de existência',
            body: t`Desenvolvendo a equação reduzida $(x-a)^2 + (y-b)^2 = r^2$, chegamos à **equação geral**:

$$x^2 + y^2 + Dx + Ey + F = 0$$

onde $D = -2a$, $E = -2b$ e $F = a^2 + b^2 - r^2$. Portanto:

$$C=\left(-\frac{D}{2},\,-\frac{E}{2}\right)\qquad\text{e}\qquad r^2 = a^2 + b^2 - F$$

Só representa uma circunferência real se os coeficientes de $x^2$ e $y^2$ forem iguais, não houver termo $xy$ e $a^2+b^2-F > 0$.`,
            visual: circRaioLab(),
            example: t`$x^2+y^2-6x+4y-3=0 \implies a=3,\,b=-2$ e $r^2=9+4-(-3)=16\implies r=4$.`,
            tip: t`Se $x^2$ e $y^2$ vierem multiplicados por $k\ne 1$ (como $2x^2+2y^2-8x=0$), **divida toda a equação por $k$** antes de achar $D, E, F$!`,
          },
          exercises: [
            inter(
              t`No gráfico, posicione o centro em $C(-2,\,1)$ e ajuste o raio $r$ para que a equação reduzida seja $(x+2)^2+(y-1)^2=9$.`,
              'plot',
              circRaioLab().props,
              (v: any) => v && near(v.pts.C.x, -2, 0.1) && near(v.pts.C.y, 1, 0.1) && near(v.p.r, 3, 0.1),
              t`Centro $C(-2,\,1)$ e raio $r = 3$.`,
              t`$(x-(-2))^2+(y-1)^2=3^2=9$.`,
            ),
            multi(
              t`Quais condições a equação $Ax^2 + By^2 + Cxy + Dx + Ey + F = 0$ deve satisfazer para representar uma circunferência real?`,
              [
                '$A = B \\ne 0$ (coeficientes de $x^2$ e $y^2$ iguais)',
                '$C = 0$ (ausência de termo misto $xy$)',
                '$D^2 + E^2 - 4AF > 0$ (raio real positivo)',
                '$F < 0$ obrigatoriamente',
                '$D = E = 0$ obrigatoriamente',
              ],
              [0, 1, 2],
              t`$F$ pode ser positivo (basta $a^2+b^2>F$) e $D, E$ só zeram quando o centro está na origem.`,
            ),
            gen((rng) => {
              const a = randNZ(rng, -5, 5);
              const b = randNZ(rng, -5, 5);
              const r = randInt(rng, 2, 6);
              const F = a * a + b * b - r * r;
              return rmcq(
                rng,
                t`Determine o centro $C$ e o raio $r$ de $x^2+y^2${term(-2 * a, 'x')}${term(-2 * b, 'y')}${term(F, '')}=0$.`,
                `$C${pt(a, b)}$ e $r=${r}$`,
                [
                  `$C${pt(-a, -b)}$ e $r=${r}$`,
                  `$C${pt(a, b)}$ e $r=${r * r}$`,
                  `$C${pt(-2 * a, -2 * b)}$ e $r=${r}$`,
                  `$C${pt(-a, b)}$ e $r=${r + 1}$`,
                ],
                t`$a=-\frac{${-2 * a}}{2}=${a}$, $b=-\frac{${-2 * b}}{2}=${b}$ e $r=\sqrt{${a * a}+${b * b}-(${F})}=${r}$.`,
              );
            }),
            gen((rng) => {
              const k = pick(rng, [2, 3]);
              const a = randInt(rng, -3, 3);
              const b = randInt(rng, -3, 3);
              const r = randInt(rng, 2, 5);
              const F = a * a + b * b - r * r;
              return num(
                t`Qual é o raio da circunferência $${k}x^2+${k}y^2${term(-2 * k * a, 'x')}${term(-2 * k * b, 'y')}${term(k * F, '')}=0$?`,
                r,
                t`Dividindo tudo por $${k}$: $x^2+y^2${term(-2 * a, 'x')}${term(-2 * b, 'y')}${term(F, '')}=0 \implies r=\sqrt{${a * a}+${b * b}-(${F})}=${r}$.`,
              );
            }),
            gen((rng) => {
              const a = randNZ(rng, -5, 5);
              const b = randNZ(rng, -5, 5);
              return num(
                t`Para qual valor de $m$ a equação $x^2+y^2${term(-2 * a, 'x')}${term(-2 * b, 'y')}+m=0$ reduz-se a um **único ponto** ($r=0$)?`,
                a * a + b * b,
                t`$r^2 = a^2 + b^2 - m = ${a * a}+${b * b}-m = 0 \implies m = ${a * a + b * b}$.`,
              );
            }),
            mcqS(
              t`Uma circunferência $x^2+y^2+Dx+Ey+F=0$ (com $D^2+E^2>0$) passa pela **origem** $(0,\,0)$ se, e somente se…`,
              '$F = 0$',
              ['$D = E = 0$', '$F = 1$', '$D + E + F = 0$'],
              t`Substituindo $(0,\,0)$ na equação geral sobra $0 + 0 + 0 + 0 + F = 0 \iff F = 0$.`,
            ),
            num(
              t`Qual é o comprimento (perímetro) da circunferência $x^2 + y^2 - 6x + 8y = 0$, dividido por $\pi$?`,
              10,
              t`Centro $(3,\,-4)$ e $F=0 \implies r = \sqrt{3^2+(-4)^2} = 5$. O comprimento dividido por $\pi$ é $2r = 10$.`,
            ),
            mcqS(
              t`Qual é a equação reduzida da circunferência de centro $C(3,\,4)$ que é **tangente ao eixo $x$**?`,
              t`$(x-3)^2 + (y-4)^2 = 16$`,
              [t`$(x-3)^2 + (y-4)^2 = 9$`, t`$(x-3)^2 + (y-4)^2 = 25$`, t`$(x+3)^2 + (y+4)^2 = 16$`],
              t`A distância do centro $(3,\,4)$ ao eixo $x$ ($y=0$) é $|4| = 4$, logo o raio é $r = 4$ e $r^2 = 16$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Posição de reta, cordas e duas circunferências',
            body: t`Seja $d = d(C,\,r)$ a distância do centro $C$ até uma reta $r$, e $R$ o raio da circunferência:

• $d < R$: **secante** (corta em 2 pontos)
• $d = R$: **tangente** (toca em 1 ponto)
• $d > R$: **externa** (não toca)

Se a reta é secante, o raio $R$, a distância $d$ e a metade da corda $\frac{L}{2}$ formam um **triângulo retângulo**:

$$R^2 = d^2 + \left(\frac{L}{2}\right)^2 \implies L = 2\sqrt{R^2 - d^2}$$`,
            example: t`Raio $R=5$ e reta a distância $d=3$ do centro: semimais-corda $=\sqrt{25-9}=4\implies$ corda $L=8$.`,
            tip: t`Para um ponto externo $P$ a distância $d$ de $C$, a menor distância até a circunferência é $d-R$ e a maior é $d+R$.`,
          },
          exercises: [
            match(
              t`Considere uma circunferência de raio $R = 5$ e uma reta a distância $d$ do centro. Ligue cada caso:`,
              [
                ['$d = 3$', 'Reta secante (2 pontos comuns)'],
                ['$d = 5$', 'Reta tangente (1 ponto comum)'],
                ['$d = 7$', 'Reta externa (0 pontos comuns)'],
                ['$d = 0$', 'Reta diametral (passa pelo centro)'],
              ],
              t`Comparando $d$ com $R=5$: menor é secante (se $d=0$, é um diâmetro), igual é tangente e maior é externa.`,
            ),
            gen((rng) => {
              const [d, halfL, R] = pick(rng, TRIPLES);
              return num(
                t`Uma reta secante passa a uma distância $d = ${d}$ do centro de uma circunferência de raio $R = ${R}$. Qual é o comprimento total $L$ da **corda** determinada?`,
                2 * halfL,
                t`Metade da corda: $\frac{L}{2}=\sqrt{${R}^2-${d}^2}=\sqrt{${R * R - d * d}}=${halfL}$. Corda inteira: $L=2\cdot${halfL}=${2 * halfL}$.`,
              );
            }),
            gen((rng) => {
              const R = randInt(rng, 2, 6);
              const k = randInt(rng, 1, 9);
              const c = 5 * k;
              const ans = k < R ? 'Secante' : k === R ? 'Tangente' : 'Externa';
              return rmcq(
                rng,
                t`Qual a posição da reta $3x + 4y - ${c} = 0$ em relação à circunferência $x^2 + y^2 = ${R * R}$?`,
                ans,
                ['Secante', 'Tangente', 'Externa', 'Coincidente'].filter((s) => s !== ans),
                t`Centro $(0,\,0)$, raio $R=${R}$ e $d(C,\,r)=\frac{${c}}{\sqrt{3^2+4^2}}=\frac{${c}}{5}=${k}$ (${k < R ? '$d < R$' : k === R ? '$d = R$' : '$d > R$'}).`,
              );
            }),
            tf(
              t`O ponto $P(2,\,3)$ está no **interior** da circunferência $(x-1)^2 + (y+1)^2 = 16$.`,
              false,
              t`Substituindo: $(2-1)^2 + (3+1)^2 = 1 + 16 = 17 > 16$. Como $d^2 > R^2$, o ponto é **exterior**.`,
            ),
            gen((rng) => {
              const [dx, dy, d] = pick(rng, TRIPLES);
              const R = randInt(rng, 1, d - 1);
              const a = randInt(rng, -3, 3);
              const b = randInt(rng, -3, 3);
              return num(
                t`Qual é a **menor** distância entre o ponto $P${pt(a + dx, b + dy)}$ e a circunferência $${circEq(a, b, R * R)}$?`,
                d - R,
                t`Distância ao centro: $d(P,\,C)=\sqrt{${dx}^2+${dy}^2}=${d}$. Menor distância até a curva: $d - R = ${d} - ${R} = ${d - R}$.`,
              );
            }),
            mcqS(
              t`Em quais pontos a circunferência $(x-2)^2 + (y-3)^2 = 25$ intercepta o **eixo $x$** ($y=0$)?`,
              t`$(-2,\,0)$ e $(6,\,0)$`,
              [t`$(-4,\,0)$ e $(4,\,0)$`, t`$(2,\,0)$ e $(-6,\,0)$`, t`$(0,\,-2)$ e $(0,\,6)$`],
              t`Fazendo $y=0$: $(x-2)^2 + 9 = 25 \implies (x-2)^2 = 16 \implies x - 2 = \pm 4 \implies x = -2$ ou $x = 6$.`,
            ),
            num(
              t`A reta $3x + 4y - 15 = 0$ é tangente a uma circunferência centrada na origem $(0,\,0)$. Qual é o raio $R$ dessa circunferência?`,
              3,
              t`Na tangência, $R = d(O,\,r) = \frac{|3(0)+4(0)-15|}{\sqrt{3^2+4^2}} = \frac{15}{5} = 3$.`,
            ),
            mcqS(
              t`Duas circunferências têm raios $R_1 = 5$ e $R_2 = 3$, e a distância entre seus centros é $d = 8$. Elas são…`,
              'tangentes externamente',
              ['secantes', 'tangentes internamente', 'externas sem ponto comum'],
              t`Como $d = R_1 + R_2 = 5 + 3 = 8$, elas se tocam em um único ponto pelo lado de fora.`,
            ),
          ],
        },
        {
          card: {
            title: 'Reta tangente à circunferência',
            body: t`A propriedade chave da reta tangente é geométrica: **a tangente no ponto $T$ é perpendicular ao raio $\overline{CT}$**!

• Se o raio $\overline{CT}$ tem inclinação $m_{CT} = \frac{y_T - b}{x_T - a}$, a reta tangente tem inclinação $m_t = -\frac{1}{m_{CT}}$.
• **Regra do desdobramento**: a tangente a $(x-a)^2 + (y-b)^2 = r^2$ no ponto $T(x_T,\,y_T)$ da curva é

$$(x_T-a)(x-a) + (y_T-b)(y-b) = r^2$$`,
            example: t`Tangente a $x^2+y^2=25$ em $T(3,\,4)$: basta "desdobrar" para $3x + 4y = 25$.`,
            tip: t`De um ponto $P$ externo a distância $d$ do centro $C$, o segmento tangente $PT$ mede $\sqrt{d^2 - R^2}$ (Pitágoras no $\triangle CTP$ retângulo em $T$).`,
          },
          exercises: [
            mcq(
              t`O ângulo formado entre o raio $\overline{CT}$ e a reta tangente à circunferência no ponto de tangência $T$ é sempre…`,
              [t`$90^\circ$ (perpendiculares)`, t`$45^\circ$`, t`$60^\circ$`, t`$0^\circ$ (paralelos)`],
              0,
              t`O ponto de tangência realiza a menor distância da reta ao centro, logo o raio $\overline{CT}$ é perpendicular à tangente.`,
            ),
            gen((rng) => {
              const xt = randNZ(rng, -5, 5);
              const yt = pick(rng, [-4, -2, -1, 1, 2, 4]);
              const r2 = xt * xt + yt * yt;
              return num(
                t`Qual é o coeficiente angular $m_t$ da reta tangente à circunferência $x^2+y^2=${r2}$ no ponto $T${pt(xt, yt)}$?`,
                -xt / yt,
                t`$m_{OT} = \frac{${yt}}{${xt}} \implies m_t = -\frac{1}{m_{OT}} = -\frac{${xt}}{${yt}} = ${fmt(-xt / yt)}$.`,
              );
            }),
            gen((rng) => {
              const [xt, yt, r] = pick(rng, TRIPLES);
              const s1 = pick(rng, [1, -1]);
              const s2 = pick(rng, [1, -1]);
              const x0 = s1 * xt;
              const y0 = s2 * yt;
              const r2 = r * r;
              return rmcq(
                rng,
                t`Qual é a equação da reta tangente à circunferência $x^2 + y^2 = ${r2}$ no ponto $T${pt(x0, y0)}$?`,
                `$${term(x0, 'x', true)}${term(y0, 'y')}=${r2}$`,
                [
                  `$${term(y0, 'x', true)}${term(x0, 'y')}=${r2}$`,
                  `$${term(x0, 'x', true)}${term(-y0, 'y')}=${r2}$`,
                  `$${term(x0, 'x', true)}${term(y0, 'y')}=${r}$`,
                  `$${term(-x0, 'x', true)}${term(y0, 'y')}=${r2}$`,
                ],
                t`Pelo desdobramento $x_T x + y_T y = r^2$: $${term(x0, 'x', true)}${term(y0, 'y')}=${r2}$.`,
              );
            }),
            mcqS(
              t`Qual é a equação geral da reta tangente a $(x-1)^2 + (y-2)^2 = 25$ no ponto $T(4,\,6)$?`,
              t`$3x + 4y - 36 = 0$`,
              [t`$4x + 6y - 25 = 0$`, t`$3x - 4y + 12 = 0$`, t`$4x + 3y - 34 = 0$`],
              t`Desdobrando: $(4-1)(x-1)+(6-2)(y-2)=25 \implies 3x-3+4y-8=25 \implies 3x+4y-36=0$.`,
            ),
            tf(
              t`Por um ponto $P$ situado no **interior** de uma circunferência é possível traçar duas retas tangentes a ela.`,
              false,
              t`Qualquer reta que passe por um ponto interno corta a circunferência em 2 pontos (é secante). De um ponto **externo** saem 2 tangentes.`,
            ),
            gen((rng) => {
              const [R, ptLen, d] = pick(rng, TRIPLES);
              return num(
                t`Um ponto $P$ está a distância $d = ${d}$ do centro $C$ de uma circunferência de raio $R = ${R}$. Se $T$ é o ponto de tangência de uma reta traçada por $P$, quanto mede o segmento tangente $PT$?`,
                ptLen,
                t`O triângulo $CTP$ é retângulo em $T$: $PT = \sqrt{d^2 - R^2} = \sqrt{${d}^2 - ${R}^2} = ${ptLen}$.`,
              );
            }),
            num(
              t`Para qual valor **positivo** de $c$ a reta $y = x + c$ é tangente à circunferência $x^2 + y^2 = 8$?`,
              4,
              t`Na forma geral $x - y + c = 0$: $d(O,\,r) = \frac{|c|}{\sqrt{1^2+(-1)^2}} = \sqrt{8} \implies \frac{|c|}{\sqrt2} = 2\sqrt2 \implies c = 4$.`,
            ),
            order(
              t`Ordene os passos para encontrar a reta tangente à circunferência de centro $C$ no ponto $T$ da curva:`,
              [
                'Calcular a inclinação do raio CT: m_CT = (y_T − y_C) / (x_T − x_C)',
                'Inverter e trocar o sinal para obter a inclinação da tangente: m_t = −1 / m_CT',
                'Montar a equação ponto-inclinação passando por T: y − y_T = m_t (x − x_T)',
                'Simplificar para a forma reduzida ou geral',
              ],
              t`Como o raio é perpendicular à tangente em $T$, basta usar $m_t = -\frac{1}{m_{CT}}$ e o ponto $T$.`,
            ),
          ],
        },
      ],
    },
    {
      id: 'p-ga-con',
      title: 'Seções cônicas: elipse, parábola e hipérbole',
      parts: [
        {
          card: {
            title: 'A elipse',
            body: t`**Elipse** é o lugar geométrico dos pontos $P$ cuja **soma das distâncias** a dois focos fixos $F_1$ e $F_2$ é constante e igual a $2a$:

$$d(P,\,F_1) + d(P,\,F_2) = 2a$$

Com centro na origem e eixo maior no eixo $x$ ($a > b > 0$):

$$\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1 \qquad\text{com}\qquad a^2 = b^2 + c^2$$

• Vértices: $(\pm a,\,0)$ e $(0,\,\pm b)$ · Focos: $(\pm c,\,0)$
• **Excentricidade**: $e = \frac{c}{a} \in (0,\,1)$ (mede o achatamento).`,
            visual: elipseLab(),
            example: t`Em $\frac{x^2}{25}+\frac{y^2}{9}=1$: $a=5$, $b=3 \implies c=\sqrt{25-9}=4$, focos $(\pm4,\,0)$ e $e=\frac45=0{,}8$.`,
            tip: t`**1ª Lei de Kepler**: os planetas descrevem órbitas **elípticas** com o Sol ocupando um dos focos!`,
          },
          exercises: [
            inter(
              t`Ajuste os semieixos da elipse para $a = 5$ e $b = 3$, de modo que os focos fiquem em $(\pm 4,\,0)$ e a soma das distâncias seja $2a = 10$.`,
              'plot',
              elipseLab().props,
              (v: any) => v && near(v.p.a, 5, 0.05) && near(v.p.b, 3, 0.05),
              t`$a = 5$ e $b = 3$.`,
              t`Como $c = \sqrt{5^2 - 3^2} = 4$, os focos ficam em $(\pm 4,\,0)$ e $d(P,\,F_1)+d(P,\,F_2)=10$.`,
            ),
            mcq(
              t`Na elipse de semieixo maior $a$, semieixo menor $b$ e semidistância focal $c$, a relação pitagórica correta é…`,
              [t`$a^2 = b^2 + c^2$`, t`$c^2 = a^2 + b^2$`, t`$b^2 = a^2 + c^2$`, t`$a = b + c$`],
              0,
              t`No topo $(0,\,b)$ da elipse, a distância a cada foco é $a$, formando um triângulo retângulo de catetos $b, c$ e hipotenusa $a$.`,
            ),
            gen((rng) => {
              const [b, c, a] = pick(rng, TRIPLES);
              return num(
                t`Na elipse $\dfrac{x^2}{${a * a}} + \dfrac{y^2}{${b * b}} = 1$, quanto vale a semidistância focal $c$?`,
                c,
                t`$a^2=${a * a}$ e $b^2=${b * b} \implies c = \sqrt{a^2 - b^2} = \sqrt{${a * a}-${b * b}} = ${c}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 4, 12);
              const b = randInt(rng, 1, a - 1);
              return num(
                t`Se $P$ é um ponto qualquer da elipse $\dfrac{x^2}{${a * a}} + \dfrac{y^2}{${b * b}} = 1$ de focos $F_1$ e $F_2$, quanto vale $d(P,\,F_1) + d(P,\,F_2)$?`,
                2 * a,
                t`Pela definição da elipse, a soma das distâncias aos focos é constante e vale $2a = 2\cdot${a} = ${2 * a}$.`,
              );
            }),
            gen((rng) => {
              const [b, c, a] = pick(rng, [
                [3, 4, 5],
                [4, 3, 5],
                [6, 8, 10],
                [8, 6, 10],
              ] as const);
              return num(
                t`Qual é a excentricidade $e = \dfrac{c}{a}$ da elipse $\dfrac{x^2}{${a * a}} + \dfrac{y^2}{${b * b}} = 1$?`,
                c / a,
                t`$a=${a}$ e $c=\sqrt{${a * a}-${b * b}}=${c} \implies e=\frac{${c}}{${a}}=${fmt(c / a)}$.`,
              );
            }),
            tf(
              t`Quanto mais próxima de $0$ for a excentricidade $e = \frac{c}{a}$ de uma elipse, mais arredondada (próxima de uma circunferência) ela é.`,
              true,
              t`$e\to 0$ significa $c\to 0$ (os dois focos se aproximam do centro) e $b\to a$.`,
            ),
            mcqS(
              t`Onde estão os focos da elipse $\dfrac{x^2}{9} + \dfrac{y^2}{25} = 1$?`,
              t`Em $(0,\,\pm 4)$, sobre o eixo $y$`,
              [t`Em $(\pm 4,\,0)$, sobre o eixo $x$`, t`Em $(0,\,\pm 5)$, sobre o eixo $y$`, t`Em $(\pm 3,\,0)$, sobre o eixo $x$`],
              t`O maior denominador ($25=5^2$) está sob $y^2$, logo o eixo maior é vertical: $a=5,\,b=3\implies c=4$ no eixo $y$.`,
            ),
            num(
              t`A área limitada por uma elipse de semieixos $a$ e $b$ é $A = \pi a b$. Qual é a área da elipse $\dfrac{x^2}{16} + \dfrac{y^2}{9} = 1$ dividida por $\pi$?`,
              12,
              t`$a = \sqrt{16} = 4$ e $b = \sqrt{9} = 3 \implies \frac{A}{\pi} = a\cdot b = 4\cdot 3 = 12$.`,
            ),
          ],
        },
        {
          card: {
            title: 'A parábola por foco e diretriz',
            body: t`**Parábola** é o lugar geométrico dos pontos $P$ equidistantes de um foco $F$ e de uma reta **diretriz** $d$:

$$d(P,\,F) = d(P,\,d)$$

Com vértice na origem $V(0,\,0)$ e parâmetro $p$ (distância do vértice ao foco e do vértice à diretriz):
• Eixo vertical: $x^2 = 4py \iff y = \frac{1}{4p}x^2$, foco $F(0,\,p)$ e diretriz $y = -p$
• Eixo horizontal: $y^2 = 4px$, foco $F(p,\,0)$ e diretriz $x = -p$.`,
            visual: parabolaFocoLab(),
            example: t`Em $x^2 = 12y$: $4p = 12 \implies p = 3$, logo o foco é $F(0,\,3)$ e a diretriz é $y = -3$.`,
            tip: t`**Propriedade refletora**: ondas paralelas ao eixo de simetria batem na parábola e convergem todas para o **foco** $F$ (antenas parabólicas e telescópios)!`,
          },
          exercises: [
            mcq(
              t`Pela definição geométrica, todo ponto $P$ de uma parábola satisfaz…`,
              [
                t`$d(P,\,F) = d(P,\,d)$ (mesma distância ao foco e à diretriz)`,
                t`$d(P,\,F) = 2\,d(P,\,d)$`,
                t`$d(P,\,F) + d(P,\,V) = \text{constante}$`,
                t`$d(P,\,F) = \text{constante}$`,
              ],
              0,
              t`A parábola tem excentricidade $e=1$: a distância até o foco $F$ é igual à distância até a reta diretriz $d$.`,
            ),
            gen((rng) => {
              const p = randInt(rng, 1, 6);
              return rmcq(
                rng,
                t`Quais são o foco $F$ e a diretriz $d$ da parábola $x^2 = ${4 * p}y$?`,
                `$F(0,\\,${p})$ e $y = -${p}$`,
                [
                  `$F(${p},\\,0)$ e $x = -${p}$`,
                  `$F(0,\\,${4 * p})$ e $y = -${4 * p}$`,
                  `$F(0,\\,-${p})$ e $y = ${p}$`,
                  `$F(0,\\,${2 * p})$ e $y = -${2 * p}$`,
                ],
                t`Comparando com $x^2 = 4py$: $4p = ${4 * p} \implies p = ${p}$, logo $F(0,\,${p})$ e diretriz $y = -${p}$.`,
              );
            }),
            gen((rng) => {
              const p = randNZ(rng, -5, 5);
              return rmcq(
                rng,
                t`Qual é a equação da parábola com vértice na origem $(0,\,0)$, foco $F(${p},\,0)$ no eixo $x$ e diretriz $x = ${-p}$?`,
                `$y^2 = ${4 * p}x$`,
                [`$x^2 = ${4 * p}y$`, `$y^2 = ${2 * p}x$`, `$y^2 = ${-4 * p}x$`, `$x^2 = ${-4 * p}y$`],
                t`Foco no eixo $x$ dá $y^2 = 4px = 4\cdot(${p})x = ${4 * p}x$.`,
              );
            }),
            gen((rng) => {
              const p = randInt(rng, 1, 5);
              return num(
                t`Na parábola $y = \dfrac{1}{${4 * p}}x^2$, qual é a distância $p$ entre o vértice e o foco?`,
                p,
                t`Reescrevendo: $x^2 = ${4 * p}y = 4py \implies 4p = ${4 * p} \implies p = ${p}$.`,
              );
            }),
            mcqS(
              t`O corte transversal de um refletor parabólico segue $y = \dfrac{1}{8}x^2$ (em metros). Onde deve ser posicionada a lâmpada (no foco) para que o feixe saia paralelo ao eixo $y$?`,
              t`Em $(0,\,2)$, a $2$ m do vértice`,
              [t`Em $(0,\,8)$, a $8$ m do vértice`, t`Em $(0,\,4)$, a $4$ m do vértice`, t`Em $(0,\,1)$, a $1$ m do vértice`],
              t`$x^2 = 8y = 4py \implies 4p = 8 \implies p = 2$ m.`,
            ),
            tf(
              t`A equação $y^2 = -12x$ representa uma parábola com eixo horizontal e concavidade voltada para a **esquerda**.`,
              true,
              t`$4p = -12 \implies p = -3 < 0$: o foco fica em $(-3,\,0)$, à esquerda do vértice $(0,\,0)$.`,
            ),
            mcqS(
              t`Qual é o vértice $V$ e o foco $F$ da parábola deslocada $(x-2)^2 = 8(y-1)$?`,
              t`$V(2,\,1)$ e $F(2,\,3)$`,
              [t`$V(2,\,1)$ e $F(4,\,1)$`, t`$V(-2,\,-1)$ e $F(-2,\,1)$`, t`$V(2,\,1)$ e $F(2,\,9)$`],
              t`Vértice em $(2,\,1)$ e $4p = 8 \implies p = 2$ unidades acima do vértice: $F(2,\,1+2) = (2,\,3)$.`,
            ),
            num(
              t`O ponto $P(x_0,\,6)$ pertence à parábola $x^2 = 8y$, cujo foco é $F(0,\,2)$ e cuja diretriz é $y = -2$. Quanto vale a distância de $P$ até o foco $F$?`,
              8,
              t`Pela definição da parábola, $d(P,\,F) = d(P,\,\text{diretriz}) = 6 - (-2) = 8$.`,
            ),
          ],
        },
        {
          card: {
            title: 'A hipérbole e identificação das cônicas',
            body: t`**Hipérbole**: pontos $P$ cujo módulo da **diferença** das distâncias aos focos é constante: $|d(P,\,F_1) - d(P,\,F_2)| = 2a$.

$$\frac{x^2}{a^2} - \frac{y^2}{b^2} = 1 \qquad\text{com}\qquad c^2 = a^2 + b^2\quad (e=\tfrac{c}{a}>1)$$

• Vértices: $(\pm a,\,0)$ · Focos: $(\pm c,\,0)$ · **Assíntotas**: $y = \pm\frac{b}{a}x$.

**Como identificar a cônica** em $Ax^2 + By^2 + Dx + Ey + F = 0$ (não degenerada):
• $A = B \ne 0$: **circunferência** · $A\cdot B > 0$ ($A\ne B$): **elipse**
• $A\cdot B < 0$ (sinais opostos): **hipérbole** · $A=0$ ou $B=0$: **parábola**.`,
            example: t`Em $\frac{x^2}{9}-\frac{y^2}{16}=1$: $a=3,\,b=4 \implies c=\sqrt{9+16}=5$, focos $(\pm5,\,0)$ e assíntotas $y=\pm\frac43 x$.`,
            tip: t`O gráfico de proporcionalidade inversa $y = \frac{k}{x}$ ($xy = k$) é uma **hipérbole equilátera** rotacionada de $45^\circ$, cujas assíntotas são os eixos $x$ e $y$!`,
          },
          exercises: [
            match(
              t`Ligue cada seção cônica à sua excentricidade $e$ e propriedade característica:`,
              [
                ['Circunferência', '$e = 0$ (dois focos coincidem no centro)'],
                ['Elipse', '$0 < e < 1$ (soma das distâncias aos focos constante)'],
                ['Parábola', '$e = 1$ (distância ao foco = distância à diretriz)'],
                ['Hipérbole', '$e > 1$ (diferença das distâncias aos focos constante)'],
              ],
              t`A excentricidade $e$ classifica todas as cônicas: $0$ (círculo), $(0,\,1)$ (elipse), $1$ (parábola) e $>1$ (hipérbole).`,
            ),
            gen((rng) => {
              const [a, b, c] = pick(rng, TRIPLES);
              return num(
                t`Na hipérbole $\dfrac{x^2}{${a * a}} - \dfrac{y^2}{${b * b}} = 1$, quanto vale a semidistância focal $c$?`,
                c,
                t`Na hipérbole os focos ficam além dos vértices: $c = \sqrt{a^2 + b^2} = \sqrt{${a * a} + ${b * b}} = ${c}$.`,
              );
            }),
            gen((rng) => {
              const [a, b] = pick(rng, [
                [3, 4],
                [4, 3],
                [2, 5],
                [5, 2],
                [3, 2],
              ]);
              return rmcq(
                rng,
                t`Quais são as equações das **assíntotas** da hipérbole $\dfrac{x^2}{${a * a}} - \dfrac{y^2}{${b * b}} = 1$?`,
                `$y = \\pm\\dfrac{${b}}{${a}}x$`,
                [
                  `$y = \\pm\\dfrac{${a}}{${b}}x$`,
                  `$y = \\pm\\dfrac{${b * b}}{${a * a}}x$`,
                  `$y = \\pm ${a * b}x$`,
                  `$x = \\pm ${a}$`,
                ],
                t`Para $x$ muito grande, $\frac{x^2}{${a * a}}\approx\frac{y^2}{${b * b}} \implies y = \pm\frac{b}{a}x = \pm\frac{${b}}{${a}}x$.`,
              );
            }),
            match(
              t`Identifique a curva representada por cada equação:`,
              [
                [t`$\dfrac{x^2}{9} + \dfrac{y^2}{4} = 1$`, 'Elipse'],
                [t`$\dfrac{x^2}{9} - \dfrac{y^2}{4} = 1$`, 'Hipérbole'],
                [t`$x^2 + y^2 = 9$`, 'Circunferência'],
                [t`$y^2 = 12x$`, 'Parábola'],
              ],
              t`Soma de quadrados com denominadores diferentes: elipse; diferença de quadrados: hipérbole; soma com coeficientes iguais: circunferência; um único quadrado: parábola.`,
            ),
            gen((rng) => {
              const kind = pick(rng, ['Elipse', 'Hipérbole', 'Circunferência'] as const);
              const p = randInt(rng, 2, 5);
              const q = p + randInt(rng, 1, 4);
              const eq =
                kind === 'Circunferência'
                  ? `${p}x^2 + ${p}y^2 = ${p * q}`
                  : kind === 'Elipse'
                    ? `${p}x^2 + ${q}y^2 = ${p * q}`
                    : `${p}x^2 - ${q}y^2 = ${p * q}`;
              return rmcq(
                rng,
                t`Que cônica é descrita pela equação $${eq}$?`,
                kind,
                ['Circunferência', 'Elipse', 'Hipérbole', 'Parábola'].filter((k) => k !== kind),
                kind === 'Circunferência'
                  ? t`Coeficientes de $x^2$ e $y^2$ iguais e de mesmo sinal: circunferência.`
                  : kind === 'Elipse'
                    ? t`Coeficientes de $x^2$ e $y^2$ positivos porém diferentes ($${p}\ne${q}$): elipse.`
                    : t`Coeficientes de $x^2$ e $y^2$ com sinais opostos: hipérbole.`,
              );
            }),
            tf(
              t`A curva $xy = 4$ ($y = \frac{4}{x}$, proporcionalidade inversa) é uma **hipérbole** cujas assíntotas são os próprios eixos coordenados.`,
              true,
              t`Rotacionando os eixos em $45^\circ$, $xy=4$ vira $\frac{X^2}{8}-\frac{Y^2}{8}=1$, uma hipérbole equilátera.`,
            ),
            mcqS(
              t`Na hipérbole $\dfrac{y^2}{16} - \dfrac{x^2}{9} = 1$, onde ficam os vértices reais?`,
              t`Em $(0,\,\pm 4)$, sobre o eixo $y$`,
              [t`Em $(\pm 4,\,0)$, sobre o eixo $x$`, t`Em $(\pm 3,\,0)$, sobre o eixo $x$`, t`Em $(0,\,\pm 5)$, sobre o eixo $y$`],
              t`O termo positivo é $\frac{y^2}{16}$, logo o eixo real é o eixo $y$ e para $x=0$ temos $y = \pm 4$.`,
            ),
            fill(
              t`Classifique a equação $Ax^2 + By^2 + Dx + Ey + F = 0$ (não degenerada) pelos coeficientes $A$ e $B$:`,
              t`Se $A\cdot B > 0$ com $A\ne B$ temos uma ___, se $A\cdot B < 0$ temos uma ___, e se $A = 0$ (ou $B = 0$) temos uma ___.`,
              ['elipse', 'hipérbole', 'parábola'],
              ['circunferência', 'reta'],
              t`Mesmo sinal ($A\ne B$): elipse; sinais contrários: hipérbole; apenas uma variável ao quadrado: parábola.`,
            ),
          ],
        },
      ],
    },
  ],
};
