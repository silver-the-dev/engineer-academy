import React from 'react';
import type { Unit } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near } from '../../helpers';
import { CircleW, FnCurve, InfLine, Label, PolygonW, Pt, RectW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt } from '../../../lib/random';

const t = String.raw;

const triangleArea = () =>
  plot({
    view: { xMin: -1, xMax: 7, yMin: -1, yMax: 5 },
    equalAspect: true,
    points: [{ id: 'A', x: 2, y: 4, color: C.gold, label: 'arraste' }],
    constrain: (_: string, x: number) => ({ x: Math.max(-0.5, Math.min(6.5, x)), y: 4 }),
    render: ({ pts }: any) => (
      <>
        <PolygonW pts={[[0, 0], [6, 0], [pts.A.x, 4]]} color={C.p3} opacity={0.3} />
        <Seg x1={pts.A.x} y1={4} x2={pts.A.x} y2={0} color={C.gold} dash="5 4" />
        <Seg x1={-1} y1={4} x2={7} y2={4} color={C.textDim} dash="3 5" width={1} />
      </>
    ),
    info: () => t`Base $6$, altura $4$ ⟹ $A=\frac{6\cdot4}{2}=12$ — **não importa** onde está o vértice!`,
  });

const distanceLab = () =>
  plot({
    view: { xMin: -1, xMax: 8, yMin: -1, yMax: 6 },
    equalAspect: true,
    snap: 1,
    points: [
      { id: 'A', x: 1, y: 1, color: C.p2, label: 'A' },
      { id: 'B', x: 5, y: 4, color: C.p3, label: 'B' },
    ],
    render: ({ pts }: any) => (
      <>
        <Seg x1={pts.A.x} y1={pts.A.y} x2={pts.B.x} y2={pts.A.y} color={C.p5} width={3} />
        <Seg x1={pts.B.x} y1={pts.A.y} x2={pts.B.x} y2={pts.B.y} color={C.p4} width={3} />
        <Seg x1={pts.A.x} y1={pts.A.y} x2={pts.B.x} y2={pts.B.y} color={C.gold} width={4} />
        <Pt x={(pts.A.x + pts.B.x) / 2} y={(pts.A.y + pts.B.y) / 2} color={C.text} r={4} label="M" />
      </>
    ),
    info: ({ pts }: any) => {
      const dx = pts.B.x - pts.A.x;
      const dy = pts.B.y - pts.A.y;
      return t`$d=\sqrt{${fmt(dx)}^2+${fmt(dy)}^2}=${fmt(Math.hypot(dx, dy), 3)}$ · $M=\left(${fmt((pts.A.x + pts.B.x) / 2)},\,${fmt((pts.A.y + pts.B.y) / 2)}\right)$`;
    },
  });

const circleLab = () =>
  plot({
    view: { xMin: -6, xMax: 6, yMin: -5, yMax: 5 },
    equalAspect: true,
    snap: 0.5,
    points: [
      { id: 'O', x: 1, y: 0.5, color: C.p2, label: 'centro' },
      { id: 'P', x: 3.5, y: 2, color: C.gold },
    ],
    render: ({ pts }: any) => {
      const r = Math.hypot(pts.P.x - pts.O.x, pts.P.y - pts.O.y);
      return (
        <>
          <CircleW cx={pts.O.x} cy={pts.O.y} r={r} color={C.p2} fill={C.p2} fillOpacity={0.1} />
          <Seg x1={pts.O.x} y1={pts.O.y} x2={pts.P.x} y2={pts.P.y} color={C.gold} />
        </>
      );
    },
    info: ({ pts }: any) => {
      const r2 = (pts.P.x - pts.O.x) ** 2 + (pts.P.y - pts.O.y) ** 2;
      const a = pts.O.x;
      const b = pts.O.y;
      return t`$(x${a < 0 ? '+' : '-'}${fmt(Math.abs(a))})^2+(y${b < 0 ? '+' : '-'}${fmt(Math.abs(b))})^2=${fmt(r2, 2)}$`;
    },
  });

export const geometria: Unit = {
  id: 'f-geo',
  title: 'Geometria',
  subtitle: 'Áreas, volumes e geometria analítica',
  icon: '📐',
  source: 'Competências Básicas · Geometria',
  guide: t`Áreas e volumes aparecem em todo projeto. A geometria analítica traduz figuras em equações — a ponte para vetores, retas e planos de GAAL.`,
  lessons: [
    {
      id: 'f-geo-area',
      title: 'Áreas de figuras planas',
      cards: [
        {
          title: 'As fórmulas essenciais',
          body: t`• Retângulo: $b\cdot h$ · Quadrado: $\ell^2$
• Triângulo: $\frac{b\cdot h}{2}$ · Paralelogramo: $b\cdot h$
• Trapézio: $\frac{(B+b)\,h}{2}$ · Losango: $\frac{D\cdot d}{2}$
• Círculo: $\pi r^2$ · Circunferência (perímetro): $2\pi r$

Arraste o vértice do triângulo: base e altura fixas ⟹ área fixa!`,
          visual: triangleArea(),
        },
        {
          title: 'Pitágoras e o triângulo retângulo',
          body: t`$$a^2=b^2+c^2$$
A hipotenusa ao quadrado é a soma dos quadrados dos catetos. Triângulos famosos: $(3,4,5)$, $(5,12,13)$, $(8,15,17)$.`,
          tip: t`Triângulo equilátero de lado $\ell$: altura $\frac{\ell\sqrt3}{2}$ e área $\frac{\ell^2\sqrt3}{4}$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const B = randInt(rng, 6, 14);
          const b = randInt(rng, 2, B - 1);
          const h = randInt(rng, 2, 9);
          return num(t`Um trapézio tem bases $${B}$ e $${b}$ e altura $${h}$. Qual sua área?`, ((B + b) * h) / 2, t`$\frac{(${B}+${b})\cdot${h}}{2}=${((B + b) * h) / 2}$.`);
        }),
        gen((rng) => {
          const r = randInt(rng, 2, 10);
          return num(t`Qual a área de um círculo de raio $${r}$ cm? (use $\pi\approx3{,}14$)`, 3.14 * r * r, t`$\pi r^2\approx3{,}14\cdot${r * r}=${fmt(3.14 * r * r, 2)}$ cm².`, { tol: 0.05, unit: 'cm²' });
        }),
        gen((rng) => {
          const [a, b, c] = pick(rng, [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15]] as const);
          return num(t`Os catetos de um triângulo retângulo medem $${a}$ e $${b}$. Quanto mede a hipotenusa?`, c, t`$\sqrt{${a}^2+${b}^2}=\sqrt{${a * a + b * b}}=${c}$.`);
        }),
        tf(t`Dobrando o raio de um círculo, sua área dobra.`, false, t`A área depende de $r^2$: dobrar o raio **quadruplica** a área.`),
        match(t`Ligue figura e área:`, [
          ['Triângulo', t`$\frac{bh}{2}$`],
          ['Trapézio', t`$\frac{(B+b)h}{2}$`],
          ['Losango', t`$\frac{Dd}{2}$`],
          ['Círculo', t`$\pi r^2$`],
        ]),
        num(t`Qual a área de um triângulo equilátero de lado 2? (aprox. com 3 casas)`, Math.sqrt(3), t`$\frac{\ell^2\sqrt3}{4}=\frac{4\sqrt3}{4}=\sqrt3\approx1{,}732$.`, { tol: 0.005 }),
      ],
    },
    {
      id: 'f-geo-vol',
      title: 'Volumes de sólidos',
      cards: [
        {
          title: 'Prismas, cilindros, pirâmides, cones e esferas',
          body: t`• **Prisma e cilindro**: $V=A_{base}\cdot h$ — cilindro: $\pi r^2h$
• **Pirâmide e cone**: $V=\frac13A_{base}\cdot h$ — cone: $\frac13\pi r^2h$
• **Esfera**: $V=\frac43\pi r^3$, área $4\pi r^2$
• **Cubo**: $a^3$ · paralelepípedo: $a\cdot b\cdot c$`,
          visual: { name: 'space3d', props: { params: [{ key: 'h', label: 'h', min: 0.5, max: 3.5, step: 0.1, value: 2, color: C.p2 }], render: ({ p }: any) => require('../../visuals3d').cylinder(p.h), info: ({ p }: any) => t`Cilindro $r=1{,}5$: $V=\pi\cdot1{,}5^2\cdot${fmt(p.h)}=${fmt(Math.PI * 2.25 * p.h, 2)}$ · cone de mesma base e altura: $${fmt((Math.PI * 2.25 * p.h) / 3, 2)}$` } },
          tip: t`Um cone cabe exatamente **3 vezes** dentro do cilindro de mesma base e altura.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = randInt(rng, 2, 8);
          const b = randInt(rng, 2, 8);
          const c = randInt(rng, 2, 8);
          return num(t`Qual o volume de uma caixa de $${a}\times${b}\times${c}$ m?`, a * b * c, t`$${a}\cdot${b}\cdot${c}=${a * b * c}$ m³.`, { unit: 'm³' });
        }),
        gen((rng) => {
          const r = randInt(rng, 1, 5);
          const h = randInt(rng, 2, 10);
          return num(t`Um cilindro tem raio $${r}$ e altura $${h}$. Qual seu volume? (use $\pi\approx3{,}14$)`, 3.14 * r * r * h, t`$\pi r^2h\approx3{,}14\cdot${r * r}\cdot${h}=${fmt(3.14 * r * r * h, 2)}$.`, { tol: 0.1 });
        }),
        mcqS(t`O volume do cone é que fração do cilindro de mesma base e altura?`, t`$\frac13$`, [t`$\frac12$`, t`$\frac23$`, t`$\frac14$`]),
        num(t`Quantos litros cabem num cubo de aresta 1 m? (1 m³ = 1000 L)`, 1000, undefined, { unit: 'L' }),
        tf(t`Se o raio de uma esfera triplica, seu volume fica 27 vezes maior.`, true, t`$V\propto r^3$, e $3^3=27$.`),
      ],
    },
    {
      id: 'f-geo-anal',
      title: 'Geometria analítica',
      cards: [
        {
          title: 'Distância e ponto médio',
          body: t`$$d_{AB}=\sqrt{(x_B-x_A)^2+(y_B-y_A)^2}\qquad M=\left(\tfrac{x_A+x_B}{2},\ \tfrac{y_A+y_B}{2}\right)$$
É Pitágoras no plano cartesiano. Arraste $A$ e $B$:`,
          visual: distanceLab(),
        },
        {
          title: 'Circunferência',
          body: t`Todos os pontos à distância $r$ do centro $(a,b)$:
$$(x-a)^2+(y-b)^2=r^2$$`,
          visual: circleLab(),
          tip: t`Para achar centro e raio de $x^2+y^2-4x+6y-3=0$, **complete quadrados**: $(x-2)^2+(y+3)^2=16$ ⟹ centro $(2, -3)$, $r=4$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const [dx, dy, d] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10]] as const);
          const x = randInt(rng, -4, 4);
          const y = randInt(rng, -4, 4);
          return num(t`Qual a distância entre $A(${x},\,${y})$ e $B(${x + dx},\,${y + dy})$?`, d, t`$\sqrt{${dx}^2+${dy}^2}=${d}$.`);
        }),
        gen((rng) => {
          const x1 = randInt(rng, -6, 6);
          const x2 = randInt(rng, -6, 6);
          return num(t`A abscissa do ponto médio entre $x_A=${x1}$ e $x_B=${x2}$ é:`, (x1 + x2) / 2, t`$\frac{${x1}+${x2}}{2}=${fmt((x1 + x2) / 2)}$.`);
        }),
        mcqS(t`Qual o centro e o raio de $(x-3)^2+(y+1)^2=25$?`, t`centro $(3,\,-1)$, raio $5$`, [t`centro $(-3,\,1)$, raio $5$`, t`centro $(3,\,-1)$, raio $25$`, t`centro $(3,\,1)$, raio $5$`]),
        inter(t`Arraste $A$ e $B$ para que a distância entre eles seja exatamente $5$.`, 'plot', distanceLab().props, (v: any) => v && near(Math.hypot(v.pts.B.x - v.pts.A.x, v.pts.B.y - v.pts.A.y), 5, 0.01), t`ex.: um deslocamento $(3,\,4)$`),
        inter(t`Monte a circunferência de centro $(0,\,0)$ e raio $3$.`, 'plot', circleLab().props, (v: any) => v && near(v.pts.O.x, 0, 0.01) && near(v.pts.O.y, 0, 0.01) && near(Math.hypot(v.pts.P.x, v.pts.P.y), 3, 0.01), t`centro na origem e ponto a distância 3`),
        tf(t`O ponto $(1,\,1)$ está dentro da circunferência $x^2+y^2=4$.`, true, t`$1^2+1^2=2<4$.`),
      ],
    },
  ],
};
