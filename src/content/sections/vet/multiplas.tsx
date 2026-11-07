import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, near } from '../../helpers';
import { ArcW, PolygonW, PolylineW, Pt, Seg } from '../../../components/plot/Plot';
import { Axes3, Line3, Point3, Poly3, type V3 } from '../../../components/visuals/Space3D';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ } from '../../../lib/random';

const t = String.raw;
const PI = Math.PI;
type Spec = VisualSpec & { props: Record<string, any> };

/** The polar "rectangle" r..r+dr, θ..θ+dθ and its area ≈ r dr dθ. */
const polarRectLab = () =>
  plot({
    view: { xMin: -0.5, xMax: 4, yMin: -0.5, yMax: 4 },
    equalAspect: true,
    params: [
      { key: 'r', label: 'r', min: 0.3, max: 3, step: 0.1, value: 2, color: C.p2 },
      { key: 'dr', label: '\\Delta r', min: 0.1, max: 1, step: 0.05, value: 0.5, color: C.p3 },
      { key: 'dth', label: '\\Delta\\theta', min: 0.05, max: 1, step: 0.05, value: 0.4, color: C.p5 },
    ],
    render: ({ p }: any) => {
      const th0 = 0.4;
      const pts: [number, number][] = [];
      for (let i = 0; i <= 20; i++) {
        const a = th0 + (p.dth * i) / 20;
        pts.push([(p.r + p.dr) * Math.cos(a), (p.r + p.dr) * Math.sin(a)]);
      }
      for (let i = 20; i >= 0; i--) {
        const a = th0 + (p.dth * i) / 20;
        pts.push([p.r * Math.cos(a), p.r * Math.sin(a)]);
      }
      return (
        <>
          <Seg x1={0} y1={0} x2={4 * Math.cos(th0)} y2={4 * Math.sin(th0)} color={C.textDim} width={1} dash="4 4" />
          <Seg x1={0} y1={0} x2={4 * Math.cos(th0 + p.dth)} y2={4 * Math.sin(th0 + p.dth)} color={C.textDim} width={1} dash="4 4" />
          <ArcW cx={0} cy={0} r={p.r} a0={0} a1={PI / 2} color={C.textMuted} width={1} />
          <PolygonW pts={pts} color={C.gold} opacity={0.45} stroke={C.gold} />
        </>
      );
    },
    info: ({ p }: any) => {
      const exact = (p.dth * ((p.r + p.dr) ** 2 - p.r ** 2)) / 2;
      return t`Área exata $${fmt(exact, 4)}$ · aproximação $r\,\Delta r\,\Delta\theta=${fmt(p.r * p.dr * p.dth, 4)}$ — quanto mais longe da origem, maior o "retângulo"`;
    },
  });

/** Cardioid / rose / disk regions in polar coordinates. */
const REG = [
  { name: 'disco r ≤ a', r: (th: number, a: number) => a, area: (a: number) => PI * a * a, tex: 'r\\le a' },
  { name: 'cardioide', r: (th: number, a: number) => a * (1 + Math.cos(th)), area: (a: number) => 1.5 * PI * a * a, tex: 'r\\le a(1+\\cos\\theta)' },
  { name: 'rosácea', r: (th: number, a: number) => Math.max(0, a * Math.cos(2 * th)), area: (a: number) => (PI * a * a) / 4, tex: 'r\\le a\\cos2\\theta' },
];
const polarRegionLab = () =>
  plot({
    view: { xMin: -2.5, xMax: 4.5, yMin: -3, yMax: 3 },
    equalAspect: true,
    params: [
      { key: 'g', label: 'região', min: 0, max: 2, step: 1, value: 1, color: C.p2, format: (v: number) => REG[Math.round(v)].name },
      { key: 'a', label: 'a', min: 0.5, max: 2, step: 0.1, value: 1.5, color: C.gold },
    ],
    render: ({ p }: any) => {
      const R = REG[Math.round(p.g)];
      const pts: [number, number][] = [];
      for (let i = 0; i <= 200; i++) {
        const th = (2 * PI * i) / 200;
        const r = R.r(th, p.a);
        pts.push([r * Math.cos(th), r * Math.sin(th)]);
      }
      return <PolygonW pts={pts} color={C.p1} opacity={0.35} stroke={C.p1} />;
    },
    info: ({ p }: any) => {
      const R = REG[Math.round(p.g)];
      return t`$${R.tex}$ · área $=\int_0^{2\pi}\!\int_0^{r(\theta)}r\,dr\,d\theta=${fmt(R.area(p.a), 3)}$`;
    },
  });

/** Tetrahedron x, y, z ≥ 0, x/a + y/b + z/c ≤ 1. */
const tetraLab = (): Spec => ({
  name: 'space3d',
  props: {
    scale: 34,
    params: [
      { key: 'a', label: 'a', min: 0.5, max: 3, step: 0.5, value: 2, color: '#FF6B6B' },
      { key: 'b', label: 'b', min: 0.5, max: 3, step: 0.5, value: 2, color: '#51CF66' },
      { key: 'c', label: 'c', min: 0.5, max: 3, step: 0.5, value: 2, color: '#4DABF7' },
    ],
    render: ({ p }: any) => {
      const O: V3 = [0, 0, 0];
      const A: V3 = [p.a, 0, 0];
      const B: V3 = [0, p.b, 0];
      const Cc: V3 = [0, 0, p.c];
      return (
        <>
          <Axes3 size={3.3} />
          <Poly3 pts={[O, A, B]} color={C.p2} opacity={0.2} />
          <Poly3 pts={[O, A, Cc]} color={C.p2} opacity={0.2} />
          <Poly3 pts={[O, B, Cc]} color={C.p2} opacity={0.2} />
          <Poly3 pts={[A, B, Cc]} color={C.gold} opacity={0.45} stroke={C.gold} />
        </>
      );
    },
    info: ({ p }: any) => t`$\frac xa+\frac yb+\frac zc\le1$ · volume $=\iiint dV=\frac{abc}{6}=${fmt((p.a * p.b * p.c) / 6, 3)}$`,
  },
});

/** A point given in spherical coordinates (ρ, θ, φ). */
const sphericalLab = (): Spec => ({
  name: 'space3d',
  props: {
    scale: 34,
    params: [
      { key: 'rho', label: '\\rho', min: 0.5, max: 3, step: 0.1, value: 2.5, color: C.gold },
      { key: 'th', label: '\\theta', min: 0, max: 360, step: 5, value: 45, color: C.p2, format: (v: number) => v + '°' },
      { key: 'ph', label: '\\varphi', min: 0, max: 180, step: 5, value: 50, color: C.p5, format: (v: number) => v + '°' },
    ],
    render: ({ p }: any) => {
      const th = (p.th * PI) / 180;
      const ph = (p.ph * PI) / 180;
      const P: V3 = [p.rho * Math.sin(ph) * Math.cos(th), p.rho * Math.sin(ph) * Math.sin(th), p.rho * Math.cos(ph)];
      const Q: V3 = [P[0], P[1], 0];
      return (
        <>
          <Axes3 size={3} />
          <Line3 a={[0, 0, 0]} b={P} color={C.gold} width={3} />
          <Line3 a={[0, 0, 0]} b={Q} color={C.p2} width={2} dash="5 4" />
          <Line3 a={Q} b={P} color={C.textMuted} width={1.5} dash="4 4" />
          <Point3 at={P} color={C.gold} r={6} label="P" />
        </>
      );
    },
    info: ({ p }: any) => {
      const th = (p.th * PI) / 180;
      const ph = (p.ph * PI) / 180;
      return t`$x=\rho\operatorname{sen}\varphi\cos\theta=${fmt(p.rho * Math.sin(ph) * Math.cos(th), 2)}$ · $y=${fmt(p.rho * Math.sin(ph) * Math.sin(th), 2)}$ · $z=\rho\cos\varphi=${fmt(p.rho * Math.cos(ph), 2)}$ · cilíndrica $r=\rho\operatorname{sen}\varphi=${fmt(p.rho * Math.sin(ph), 2)}$`;
    },
  },
});

/** Linear change of variables: the unit square in (u, v) goes to a parallelogram of area |det|. */
const jacobianLab = () =>
  plot({
    view: { xMin: -3, xMax: 4, yMin: -2.5, yMax: 3.5 },
    equalAspect: true,
    params: [
      { key: 'a', label: 'a', min: -2, max: 2, step: 0.1, value: 2, color: C.p2 },
      { key: 'b', label: 'b', min: -2, max: 2, step: 0.1, value: 0.5, color: C.p2 },
      { key: 'c', label: 'c', min: -2, max: 2, step: 0.1, value: 0.3, color: C.p3 },
      { key: 'd', label: 'd', min: -2, max: 2, step: 0.1, value: 1.5, color: C.p3 },
    ],
    render: ({ p }: any) => {
      const T = (u: number, v: number): [number, number] => [p.a * u + p.b * v, p.c * u + p.d * v];
      const grid: React.ReactNode[] = [];
      for (let k = -2; k <= 2; k++) {
        grid.push(<PolylineW key={'u' + k} pts={[T(k * 0.5, -1), T(k * 0.5, 1)]} color={C.textMuted} width={1} />);
        grid.push(<PolylineW key={'v' + k} pts={[T(-1, k * 0.5), T(1, k * 0.5)]} color={C.textMuted} width={1} />);
      }
      return (
        <>
          {grid}
          <PolygonW pts={[T(0, 0), T(1, 0), T(1, 1), T(0, 1)]} color={C.gold} opacity={0.45} stroke={C.gold} />
          <Pt x={T(1, 0)[0]} y={T(1, 0)[1]} color={C.p2} r={4} label="T(1,0)" />
          <Pt x={T(0, 1)[0]} y={T(0, 1)[1]} color={C.p3} r={4} label="T(0,1)" />
        </>
      );
    },
    info: ({ p }: any) => t`$x=${fmt(p.a, 1)}u+${fmt(p.b, 1)}v$, $y=${fmt(p.c, 1)}u+${fmt(p.d, 1)}v$ · $J=ad-bc=${fmt(p.a * p.d - p.b * p.c, 2)}$ · o quadrado unitário vira área $|J|=${fmt(Math.abs(p.a * p.d - p.b * p.c), 2)}$`.replace(/\+-/g, '-'),
  });

export const multiplas: UnitDef = {
  id: 'v-mult',
  title: 'Integrais múltiplas',
  subtitle: 'Polares, triplas, cilíndricas, esféricas e Jacobiano',
  icon: '🧊',
  source: 'Cálculo 4 · Integrais múltiplas',
  guide: t`Integrais duplas e triplas somam uma grandeza sobre áreas e volumes. O segredo é escolher **coordenadas que combinem com a geometria**: polares para discos ($dA=r\,dr\,d\theta$), cilíndricas para cilindros, esféricas para esferas ($dV=\rho^2\operatorname{sen}\varphi\,d\rho\,d\varphi\,d\theta$). O fator extra é sempre o **Jacobiano** — quanto a mudança de variáveis estica a área ou o volume.`,
  lessons: [
    {
      id: 'v-mult-polar',
      title: 'Integrais duplas em polares',
      parts: [
        {
          card: {
            title: 'Por que aparece o r',
            body: t`Em polares, $x=r\cos\theta$, $y=r\operatorname{sen}\theta$. Um "retângulo polar" de lados $\Delta r$ e $\Delta\theta$ tem área $\approx r\,\Delta r\,\Delta\theta$ — o arco mede $r\Delta\theta$. Logo:

$$\iint_D f\,dA=\iint f(r\cos\theta,\,r\operatorname{sen}\theta)\;r\,dr\,d\theta$$`,
            visual: polarRectLab(),
          },
          exercises: [
            mcqS(t`Em coordenadas polares, $dA=$`, t`$r\,dr\,d\theta$`, [t`$dr\,d\theta$`, t`$r^2\,dr\,d\theta$`, t`$\theta\,dr\,d\theta$`, t`$\frac{dr\,d\theta}{r}$`], t`O fator $r$ é o Jacobiano.`),
            tf(t`Em polares, $x^2+y^2=r^2$.`, true, t`$r^2(\cos^2\theta+\operatorname{sen}^2\theta)$.`),
            inter(t`No lab, ajuste $r=3$, $\Delta r=0{,}2$ e $\Delta\theta=0{,}5$ e compare: a aproximação vale $0{,}3$.`, 'plot', polarRectLab().props, (v: any) => v && near(v.p.r, 3, 0.01) && near(v.p.dr, 0.2, 0.01) && near(v.p.dth, 0.5, 0.01), t`$r\Delta r\Delta\theta=3\cdot0{,}2\cdot0{,}5=0{,}3$.`, t`O setor polar é quase um retângulo de lados $\Delta r$ e $r\,\Delta\theta$ (arco), por isso $dA=r\,dr\,d\theta$.`),
            gen((rng) => {
              const R = randInt(rng, 1, 5);
              return num(t`Área do disco de raio $${R}$ via $\int_0^{2\pi}\!\int_0^{${R}}r\,dr\,d\theta$ (2 casas):`, PI * R * R, t`$2\pi\cdot\frac{${R * R}}{2}=${R * R}\pi\approx${fmt(PI * R * R, 2)}$.`, { tol: 0.02 });
            }),
            mcqS(t`O quarto de disco $x^2+y^2\le4$, $x\ge0$, $y\ge0$ em polares é:`, t`$0\le r\le2,\ 0\le\theta\le\frac\pi2$`, [t`$0\le r\le4,\ 0\le\theta\le\frac\pi2$`, t`$0\le r\le2,\ 0\le\theta\le\pi$`, t`$0\le r\le2,\ 0\le\theta\le2\pi$`, t`$0\le r\le\frac\pi2,\ 0\le\theta\le2$`], t`Raio até 2, primeiro quadrante.`),
            gen((rng) => {
              const R = randInt(rng, 1, 3);
              return num(t`$\iint_D(x^2+y^2)\,dA$ no disco de raio $${R}$ (2 casas):`, (PI * R ** 4) / 2, t`$\int_0^{2\pi}\!\int_0^{${R}}r^2\cdot r\,dr\,d\theta=2\pi\cdot\frac{${R}^4}{4}\approx${fmt((PI * R ** 4) / 2, 2)}$.`, { tol: 0.02 });
            }),
            num(t`Área do anel $1\le r\le3$ (2 casas):`, 8 * PI, t`$2\pi\cdot\frac{9-1}{2}=8\pi\approx25{,}13$.`, { tol: 0.02 }),
            mcq(t`Quando vale a pena trocar para polares?`, ['região circular ou integrando com x² + y²', 'região retangular', 'integrando polinomial em x', 'sempre'], 0, t`Discos, anéis, setores e $x^2+y^2$.`),
          ],
        },
        {
          card: {
            title: 'Regiões polares',
            body: t`Muitas curvas têm equação simples em polares: **cardioide** $r=a(1+\cos\theta)$, **rosácea** $r=a\cos2\theta$, circunferências por fora da origem. A área é $\frac12\int r(\theta)^2\,d\theta$:`,
            visual: polarRegionLab(),
          },
          exercises: [
            mcqS(t`A área da região $r\le g(\theta)$, $\alpha\le\theta\le\beta$ é:`, t`$\frac12\int_\alpha^\beta g(\theta)^2\,d\theta$`, [t`$\int_\alpha^\beta g(\theta)\,d\theta$`, t`$\int_\alpha^\beta g(\theta)^2\,d\theta$`, t`$\pi\int g^2\,d\theta$`, t`$\frac12\int g\,d\theta$`], t`$\int_0^{g}r\,dr=\frac{g^2}{2}$.`),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              return num(t`Área da cardioide $r=${a}(1+\cos\theta)$ (2 casas):`, 1.5 * PI * a * a, t`$\frac32\pi a^2=${fmt(1.5 * a * a)}\pi\approx${fmt(1.5 * PI * a * a, 2)}$.`, { tol: 0.03 });
            }),
            inter(t`No lab, escolha a **rosácea** com $a=2$. Área esperada: $\pi$.`, 'plot', polarRegionLab().props, (v: any) => v && Math.round(v.p.g) === 2 && near(v.p.a, 2, 0.01), t`$\frac{\pi a^2}{4}=\pi$.`, t`A região $r\le a\cos2\theta$ só existe onde $\cos2\theta\ge0$ (duas pétalas, ângulo total $\pi$): $A=\frac12\int a^2\cos^2 2\theta\,d\theta=\frac12a^2\cdot\frac{\pi}{2}=\frac{\pi a^2}{4}$; com $a=2$, dá $\pi$.`),
            mcqS(t`$r=2\cos\theta$ é, em cartesianas:`, t`a circunferência $(x-1)^2+y^2=1$`, [t`a reta $x=2$`, t`$x^2+y^2=4$`, t`uma cardioide`, t`a parábola $y=x^2$`], t`$r^2=2r\cos\theta\Rightarrow x^2+y^2=2x$.`),
            tf(t`A integral $\int_{-\infty}^{\infty}e^{-x^2}dx=\sqrt\pi$ pode ser calculada elevando ao quadrado e passando para polares.`, true, t`$I^2=\iint e^{-(x^2+y^2)}dA=\int_0^{2\pi}\!\int_0^\infty e^{-r^2}r\,dr\,d\theta=\pi$.`),
            num(t`Calcule $\int_0^{2\pi}\!\int_0^\infty e^{-r^2}r\,dr\,d\theta$ (2 casas).`, PI, t`$\int_0^\infty e^{-r^2}r\,dr=\frac12$; vezes $2\pi$: $\pi$.`, { tol: 0.01 }),
            gen((rng) => {
              const R = randInt(rng, 2, 5);
              const frac = pick(rng, [2, 4, 6]);
              return num(t`Área do setor de raio $${R}$ e ângulo $\frac{2\pi}{${frac}}$ (2 casas):`, (PI * R * R) / frac, t`$\frac12R^2\Delta\theta=\frac12\cdot${R * R}\cdot\frac{2\pi}{${frac}}\approx${fmt((PI * R * R) / frac, 2)}$.`, { tol: 0.02 });
            }),
            num(t`Volume sob $z=4-x^2-y^2$ e acima de $z=0$ (2 casas):`, 8 * PI, t`$\int_0^{2\pi}\!\int_0^2(4-r^2)r\,dr\,d\theta=2\pi\cdot4=8\pi\approx25{,}13$.`, { tol: 0.03 }),
          ],
        },
      ],
    },
    {
      id: 'v-mult-tripla',
      title: 'Integrais triplas',
      parts: [
        {
          card: {
            title: 'Somando em volume',
            body: t`$$\iiint_E f(x,y,z)\,dV$$

Com $f=1$ dá o **volume** de $E$; com $f=\rho$ (densidade), a **massa**. Calcula-se como integrais iteradas: primeiro $z$ entre a "tampa" e o "fundo", depois a região da sombra no plano $xy$.`,
            visual: tetraLab(),
            example: t`Tetraedro $x+y+z\le1$ no 1º octante: $\int_0^1\!\int_0^{1-x}\!\int_0^{1-x-y}dz\,dy\,dx=\frac16$.`,
          },
          exercises: [
            gen((rng) => {
              const [a, b, c] = [randInt(rng, 1, 4), randInt(rng, 1, 4), randInt(rng, 1, 4)];
              return num(t`$\iiint_E 1\,dV$ na caixa $[0,\,${a}]\times[0,\,${b}]\times[0,\,${c}]$:`, a * b * c, t`Volume $=${a}\cdot${b}\cdot${c}=${a * b * c}$.`);
            }),
            gen((rng) => {
              const c = randInt(rng, 1, 4);
              return num(t`Volume do tetraedro $x+y+z\le${c}$ no 1º octante (3 casas):`, c ** 3 / 6, t`$\frac{c^3}{6}=${fmt(c ** 3 / 6, 3)}$.`, { tol: 0.002 });
            }),
            inter(t`No lab, monte o tetraedro com volume $1$: $a=1$, $b=2$, $c=3$.`, 'space3d', tetraLab().props, (v: any) => v && near(v.p.a, 1, 0.01) && near(v.p.b, 2, 0.01) && near(v.p.c, 3, 0.01), t`$\frac{1\cdot2\cdot3}{6}=1$.`, t`O tetraedro com vértices na origem e em $(a,0,0)$, $(0,b,0)$, $(0,0,c)$ tem volume $\frac{abc}{6}$: $\frac{1\cdot2\cdot3}{6}=1$.`),
            num(t`$\iiint_{[0,1]^3}(x+y+z)\,dV$:`, 1.5, t`Cada termo dá $\frac12$: total $\frac32$.`),
            mcqS(t`Nos limites de $\int\!\int\!\int dz\,dy\,dx$ sobre o tetraedro $x+y+z\le1$, o limite superior de $z$ é:`, t`$1-x-y$`, [t`$1$`, t`$1-x$`, t`$x+y$`, t`$1-y$`], t`A "tampa" é o plano $z=1-x-y$.`),
            tf(t`Uma integral tripla pode ser feita em 6 ordens diferentes de integração.`, true, t`$3!=6$ permutações de $dx,\,dy,\,dz$.`),
            gen((rng) => {
              const k = randInt(rng, 1, 5);
              return num(t`Massa do cubo $[0,\,1]^3$ com densidade $\rho=${k}z$:`, k / 2, t`$\int_0^1${k}z\,dz=\frac{${k}}{2}$ (as outras integrais dão 1).`);
            }),
            num(t`$\int_0^1\!\int_0^2\!\int_0^3 xyz\,dz\,dy\,dx$:`, 4.5, t`$\frac12\cdot2\cdot\frac92=4{,}5$.`),
          ],
        },
        {
          card: {
            title: 'Centro de massa e momento de inércia',
            body: t`Com densidade $\rho$ e massa $M=\iiint\rho\,dV$:

$$\bar x=\frac1M\iiint x\rho\,dV,\quad \bar y=\ldots,\quad \bar z=\ldots$$

**Momento de inércia** em torno do eixo $z$: $I_z=\iiint(x^2+y^2)\rho\,dV$ — mede a resistência a girar (quanto mais massa longe do eixo, maior).`,
            tip: t`Simetria economiza contas: um sólido simétrico com densidade uniforme tem o centroide no centro de simetria.`,
          },
          exercises: [
            num(t`Centroide ($\bar z$) do cubo $[0,\,2]^3$ com densidade uniforme:`, 1, t`Centro do cubo: $(1,\,1,\,1)$.`),
            mcqS(t`O centro de massa de uma barra $[0,\,L]$ com densidade $\rho=x$ fica:`, t`em $\frac{2L}{3}$`, [t`em $\frac L2$`, t`em $\frac L3$`, t`em $L$`, t`em $\frac{3L}{4}$`], t`$\bar x=\frac{\int_0^L x^2dx}{\int_0^L x\,dx}=\frac{L^3/3}{L^2/2}=\frac{2L}{3}$.`),
            tf(t`O momento de inércia em torno de um eixo aumenta se a massa for afastada do eixo.`, true, t`O integrando tem a distância ao quadrado.`),
            gen((rng) => {
              const L = randInt(rng, 1, 6);
              return num(t`Momento de inércia de uma barra fina de massa $1$ e comprimento $${L}$ em torno de uma ponta: $\int_0^{${L}}x^2\frac{1}{${L}}dx$ (3 casas)`, (L * L) / 3, t`$\frac{L^2}{3}=${fmt((L * L) / 3, 3)}$.`, { tol: 0.002 });
            }),
            mcq(t`Patinadoras giram mais rápido ao fechar os braços porque…`, ['o momento de inércia diminui (momento angular se conserva)', 'a massa diminui', 'a gravidade muda', 'o atrito some'], 0, t`$L=I\omega$ constante: $I$ menor ⟹ $\omega$ maior.`),
            num(t`Massa da semiesfera sólida de raio $3$ com $\rho=1$ (2 casas):`, 18 * PI, t`$\frac23\pi\cdot27=18\pi\approx56{,}55$.`, { tol: 0.05 }),
            mcqS(t`Para um disco uniforme centrado na origem, $\bar x$ e $\bar y$ valem:`, '0 e 0', ['o raio', '1 e 1', 'dependem da massa', 'não existem'], t`Simetria.`),
            fill(t`Complete:`, t`massa $M=\iiint$ ___ $dV$; volume $=\iiint$ ___ $dV$`, [t`$\rho$`, '$1$'], [t`$x$`, t`$x^2+y^2$`], t`Integra-se a densidade para massa e $1$ para volume.`),
          ],
        },
      ],
    },
    {
      id: 'v-mult-cilesf',
      title: 'Coordenadas cilíndricas e esféricas',
      parts: [
        {
          card: {
            title: 'Cilíndricas',
            body: t`Polares no plano $xy$ e $z$ normal:

$$x=r\cos\theta,\quad y=r\operatorname{sen}\theta,\quad z=z,\qquad dV=r\,dz\,dr\,d\theta$$

Ideais para cilindros, cones e paraboloides com eixo $z$.`,
            example: t`Volume do cilindro $r\le R$, $0\le z\le h$: $\int_0^{2\pi}\!\int_0^R\!\int_0^h r\,dz\,dr\,d\theta=\pi R^2h$.`,
          },
          exercises: [
            mcqS(t`Em cilíndricas, $dV=$`, t`$r\,dz\,dr\,d\theta$`, [t`$dz\,dr\,d\theta$`, t`$r^2\,dz\,dr\,d\theta$`, t`$\rho^2\operatorname{sen}\varphi\,d\rho\,d\varphi\,d\theta$`, t`$z\,dz\,dr\,d\theta$`], t`O mesmo $r$ das polares.`),
            gen((rng) => {
              const R = randInt(rng, 1, 4);
              const h = randInt(rng, 1, 5);
              return num(t`Volume do cilindro de raio $${R}$ e altura $${h}$ (2 casas):`, PI * R * R * h, t`$\pi R^2h=${R * R * h}\pi\approx${fmt(PI * R * R * h, 2)}$.`, { tol: 0.03 });
            }),
            mcqS(t`O cone $z=\sqrt{x^2+y^2}$ em cilíndricas é:`, t`$z=r$`, [t`$z=r^2$`, t`$r=1$`, t`$\theta=z$`, t`$z=\frac\pi4$`], t`$\sqrt{x^2+y^2}=r$.`),
            gen((rng) => {
              const R = randInt(rng, 1, 3);
              return num(t`Volume sob o paraboloide $z=r^2$ e acima de $r\le${R}$ (2 casas):`, (PI * R ** 4) / 2, t`$\int_0^{2\pi}\!\int_0^{${R}}r^2\cdot r\,dr\,d\theta=\frac{\pi R^4}{2}\approx${fmt((PI * R ** 4) / 2, 2)}$.`, { tol: 0.03 });
            }),
            tf(t`O ponto $(x,y,z)=(0,\,3,\,5)$ tem coordenadas cilíndricas $(r,\theta,z)=(3,\,\frac\pi2,\,5)$.`, true, t`$r=3$, $\theta=90^\circ$.`),
            num(t`Volume do cone de raio $3$ e altura $3$ (2 casas):`, 9 * PI, t`$\frac13\pi\cdot9\cdot3=9\pi\approx28{,}27$.`, { tol: 0.03 }),
            mcq(t`Qual sistema escolher para o volume de um tubo (anel cilíndrico) $1\le r\le2$, $0\le z\le5$?`, ['cilíndricas', 'esféricas', 'cartesianas', 'tanto faz'], 0, t`Limites constantes em cilíndricas.`),
            num(t`Volume do tubo $1\le r\le2$, $0\le z\le5$ (2 casas):`, 15 * PI, t`$\pi(4-1)\cdot5=15\pi\approx47{,}12$.`, { tol: 0.03 }),
          ],
        },
        {
          card: {
            title: 'Esféricas',
            body: t`$\rho$ = distância à origem, $\theta$ = ângulo no plano $xy$, $\varphi$ = ângulo a partir do eixo $z$ ($0\le\varphi\le\pi$):

$$x=\rho\operatorname{sen}\varphi\cos\theta,\ \ y=\rho\operatorname{sen}\varphi\operatorname{sen}\theta,\ \ z=\rho\cos\varphi$$
$$dV=\rho^2\operatorname{sen}\varphi\,d\rho\,d\varphi\,d\theta$$`,
            visual: sphericalLab(),
          },
          exercises: [
            num(t`Volume da esfera de raio $2$ via $\int_0^{2\pi}\!\int_0^\pi\!\int_0^2\rho^2\operatorname{sen}\varphi\,d\rho\,d\varphi\,d\theta$ (2 casas):`, (32 * PI) / 3, t`$2\pi\cdot2\cdot\frac83=\frac{32\pi}{3}\approx33{,}51$.`, { tol: 0.03 }),
            inter(t`No lab, posicione $P$ no **polo norte** de uma esfera de raio $2$.`, 'space3d', sphericalLab().props, (v: any) => v && near(v.p.rho, 2, 0.01) && near(v.p.ph, 0, 0.01), t`$\rho=2$, $\varphi=0$ (qualquer $\theta$).`, t`Em esféricas, $\varphi$ mede o ângulo a partir do eixo $z$ positivo: o polo norte tem $\varphi=0$, e com $\rho=2$ fica em $(0,\,0,\,2)$.`),
            mcqS(t`Em esféricas, a esfera $x^2+y^2+z^2=9$ é:`, t`$\rho=3$`, [t`$\rho=9$`, t`$\varphi=3$`, t`$r=3$`, t`$\theta=3$`], t`$\rho$ é a distância à origem.`),
            mcqS(t`O cone $z=\sqrt{x^2+y^2}$ em esféricas é:`, t`$\varphi=\frac\pi4$`, [t`$\rho=1$`, t`$\theta=\frac\pi4$`, t`$\varphi=\frac\pi2$`, t`$\rho=\varphi$`], t`Ângulo de $45^\circ$ com o eixo $z$.`),
            tf(t`O plano $xy$ corresponde a $\varphi=\frac\pi2$.`, true, t`$z=\rho\cos\varphi=0$.`),
            gen((rng) => {
              const rho = randInt(rng, 1, 5);
              const ph = pick(rng, [0, 90, 180]);
              const z = ph === 0 ? rho : ph === 180 ? -rho : 0;
              return num(t`Para $\rho=${rho}$, $\varphi=${ph}^\circ$ (qualquer $\theta$), quanto vale $z$?`, z, t`$z=\rho\cos\varphi=${rho}\cos${ph}^\circ=${z}$.`);
            }),
            num(t`Volume da "casquinha de sorvete" $\rho\le1$, $\varphi\le\frac\pi4$ (3 casas):`, ((2 * PI) / 3) * (1 - Math.SQRT1_2), t`$2\pi\cdot\left(1-\frac{\sqrt2}{2}\right)\cdot\frac13\approx0{,}613$.`, { tol: 0.003 }),
            match(t`Ligue a superfície ao sistema em que ela tem equação mais simples:`, [
              ['esfera centrada na origem', t`esféricas: $\rho=a$`],
              ['cilindro de eixo z', t`cilíndricas: $r=a$`],
              ['plano horizontal', t`cartesianas: $z=a$`],
              ['cone de eixo z', t`esféricas: $\varphi=\alpha$`],
            ], t`Escolha o sistema que deixa os limites constantes.`),
          ],
        },
      ],
    },
    {
      id: 'v-mult-jac',
      title: 'Mudança de variáveis e Jacobiano',
      parts: [
        {
          card: {
            title: 'O fator de área',
            body: t`Numa mudança $x=x(u,v)$, $y=y(u,v)$:

$$\iint_R f\,dx\,dy=\iint_S f\,|J|\,du\,dv,\qquad J=\frac{\partial(x,y)}{\partial(u,v)}=\begin{vmatrix}x_u&x_v\\y_u&y_v\end{vmatrix}$$

$|J|$ é o quanto um pedacinho de área $du\,dv$ é **esticado**. Para uma transformação linear, é o determinante da matriz — veja o quadrado unitário virar um paralelogramo:`,
            visual: jacobianLab(),
          },
          exercises: [
            gen((rng) => {
              const a = randNZ(rng, -3, 3);
              const b = randInt(rng, -3, 3);
              const c = randInt(rng, -3, 3);
              const d = randNZ(rng, -3, 3);
              return num(t`Jacobiano de $x=${a}u${b < 0 ? '' : '+'}${b}v$, $y=${c}u${d < 0 ? '' : '+'}${d}v$:`, a * d - b * c, t`$\begin{vmatrix}${a}&${b}\\${c}&${d}\end{vmatrix}=${a * d - b * c}$.`);
            }),
            num(t`Jacobiano de $x=r\cos\theta$, $y=r\operatorname{sen}\theta$ quando $r=5$:`, 5, t`$J=\cos\theta\cdot r\cos\theta-(-r\operatorname{sen}\theta)\operatorname{sen}\theta=r$.`),
            inter(t`No lab, faça uma transformação que **dobra** as áreas sem girar: $b=c=0$ e $ad=2$.`, 'plot', jacobianLab().props, (v: any) => v && near(v.p.b, 0, 0.01) && near(v.p.c, 0, 0.01) && near(v.p.a * v.p.d, 2, 0.05), t`Por exemplo $a=2$, $d=1$.`, t`Para $x=au+bv$, $y=cu+dv$, o fator de área é $|J|=|ad-bc|$; com $b=c=0$, $|J|=ad=2$.`),
            tf(t`Se $J=0$, a transformação "achata" a região (área zero).`, true, t`O quadrado vira um segmento.`),
            mcqS(t`O Jacobiano das coordenadas esféricas vale:`, t`$\rho^2\operatorname{sen}\varphi$`, [t`$\rho$`, t`$\rho^2$`, t`$\operatorname{sen}\varphi$`, t`$r$`], t`É o fator em $dV$.`),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const b = randInt(rng, 1, 4);
              return num(t`Área da elipse $\frac{x^2}{${a * a}}+\frac{y^2}{${b * b}}\le1$ usando $x=${a}u$, $y=${b}v$ (2 casas):`, PI * a * b, t`$J=${a * b}$; o disco unitário tem área $\pi$: total $${a * b}\pi\approx${fmt(PI * a * b, 2)}$.`, { tol: 0.03 });
            }),
            mcq(t`O sinal do Jacobiano negativo indica que a transformação…`, ['inverte a orientação (espelha)', 'diminui a área', 'não é válida', 'é uma rotação'], 0, t`Por isso usamos $|J|$ na integral.`),
            num(t`Com $u=x+y$, $v=x-y$, temos $x=\frac{u+v}2$, $y=\frac{u-v}2$. Quanto vale $|J|$?`, 0.5, t`$\begin{vmatrix}\frac12&\frac12\\\frac12&-\frac12\end{vmatrix}=-\frac12$, $|J|=\frac12$.`),
          ],
        },
        {
          card: {
            title: 'Escolhendo a mudança certa',
            body: t`Mude de variáveis quando:
• a **região** vira um retângulo nas novas variáveis (ex.: losango $|x|+|y|\le1$ com $u=x+y$, $v=x-y$)
• o **integrando** simplifica (ex.: $e^{(x-y)/(x+y)}$)

Roteiro: escolha $u,\,v$; ache os novos limites; calcule $|J|$ (às vezes é mais fácil calcular $\frac{\partial(u,v)}{\partial(x,y)}$ e inverter: $J=1/J'$).`,
          },
          exercises: [
            order(t`Ordene a mudança de variáveis numa integral dupla:`, ['escolher u e v que simplificam região ou integrando', 'descrever a nova região S', 'calcular |J|', 'integrar f · |J| sobre S'], t`Região, Jacobiano, integral.`),
            num(t`Área do losango $|x|+|y|\le1$ via $u=x+y$, $v=x-y$ ($-1\le u,v\le1$, $|J|=\frac12$):`, 2, t`$\frac12\cdot2\cdot2=2$.`),
            mcqS(t`Se $\frac{\partial(u,v)}{\partial(x,y)}=4$, então $\frac{\partial(x,y)}{\partial(u,v)}=$`, t`$\frac14$`, [t`$4$`, t`$-4$`, t`$16$`, t`$2$`], t`Jacobianos de transformações inversas são recíprocos.`),
            tf(t`Coordenadas polares são um caso particular de mudança de variáveis com $|J|=r$.`, true, t`Calculado no card anterior.`),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              return num(t`A transformação $x=${k}u$, $y=${k}v$ multiplica áreas por quanto?`, k * k, t`$J=${k}\cdot${k}=${k * k}$.`);
            }),
            mcq(t`Para integrar sobre a região entre as hipérboles $xy=1$ e $xy=4$ e as retas $y=x$ e $y=2x$, uma boa escolha é:`, ['u = xy, v = y/x', 'polares', 'u = x + y, v = x − y', 'esféricas'], 0, t`Assim a região vira $1\le u\le4$, $1\le v\le2$.`),
            num(t`Volume do elipsoide $\frac{x^2}{4}+\frac{y^2}{9}+z^2\le1$ usando $x=2u$, $y=3v$, $z=w$ (2 casas):`, 8 * PI, t`$|J|=6$; bola unitária $\frac43\pi$: $6\cdot\frac43\pi=8\pi\approx25{,}13$.`, { tol: 0.03 }),
            mcqS(t`O Jacobiano mede, geometricamente:`, 'o fator local de mudança de área (ou volume)', ['a inclinação da curva', 'o comprimento de arco', 'a curvatura', 'a derivada direcional'], t`$dx\,dy=|J|\,du\,dv$.`),
          ],
        },
      ],
    },
  ],
};
