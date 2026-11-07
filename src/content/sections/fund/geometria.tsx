import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, match, inter, plot, rmcq, near } from '../../helpers';
import { cylinder } from '../../visuals3d';
import { CircleW, PolygonW, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, term } from '../../../lib/random';

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

const TRIPLES = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15]] as const;
const sq = (v: number, s: string) => (v === 0 ? `${s}^2` : `(${s}${v < 0 ? '+' : '-'}${Math.abs(v)})^2`);
const circEq = (a: number, b: number, r2: number) => `${sq(a, 'x')}+${sq(b, 'y')}=${r2}`;
const pt = (x: number, y: number) => `(${fmt(x)},\\,${fmt(y)})`;

export const geometria: UnitDef = {
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
      parts: [
        {
          card: {
            title: 'As fórmulas essenciais',
            body: t`• Retângulo: $b\cdot h$ · Quadrado: $\ell^2$
• Triângulo: $\frac{b\cdot h}{2}$ · Paralelogramo: $b\cdot h$
• Trapézio: $\frac{(B+b)\,h}{2}$ · Losango: $\frac{D\cdot d}{2}$
• Círculo: $\pi r^2$ · Circunferência (perímetro): $2\pi r$

Arraste o vértice do triângulo: base e altura fixas ⟹ área fixa!`,
            visual: triangleArea(),
          },
          exercises: [
            match(t`Ligue figura e área:`, [
              ['Triângulo', t`$\frac{bh}{2}$`],
              ['Trapézio', t`$\frac{(B+b)h}{2}$`],
              ['Losango', t`$\frac{Dd}{2}$`],
              ['Círculo', t`$\pi r^2$`],
            ]),
            gen((rng) => {
              const b = randInt(rng, 3, 15);
              const h = randInt(rng, 2, 12);
              return num(t`Qual a área de um retângulo de $${b}$ m por $${h}$ m?`, b * h, t`$${b}\cdot${h}=${b * h}$ m².`, { unit: 'm²' });
            }),
            gen((rng) => {
              const b = 2 * randInt(rng, 2, 8);
              const h = randInt(rng, 2, 10);
              return num(t`Um triângulo tem base $${b}$ cm e altura $${h}$ cm. Qual a sua área?`, (b * h) / 2, t`$\frac{${b}\cdot${h}}{2}=${(b * h) / 2}$ cm².`, { unit: 'cm²' });
            }),
            gen((rng) => {
              const B = randInt(rng, 6, 14);
              const b = randInt(rng, 2, B - 1);
              const h = randInt(rng, 2, 9);
              return num(t`Um trapézio tem bases $${B}$ e $${b}$ e altura $${h}$. Qual sua área?`, ((B + b) * h) / 2, t`$\frac{(${B}+${b})\cdot${h}}{2}=${fmt(((B + b) * h) / 2)}$.`);
            }),
            gen((rng) => {
              const D = randInt(rng, 4, 14);
              const d = 2 * randInt(rng, 1, 6);
              return num(t`Um losango tem diagonais $${D}$ e $${d}$. Qual sua área?`, (D * d) / 2, t`$\frac{${D}\cdot${d}}{2}=${(D * d) / 2}$.`);
            }),
            gen((rng) => {
              const r = randInt(rng, 2, 10);
              return num(t`Qual a área de um círculo de raio $${r}$ cm? (use $\pi\approx3{,}14$)`, 3.14 * r * r, t`$\pi r^2\approx3{,}14\cdot${r * r}=${fmt(3.14 * r * r, 2)}$ cm².`, { tol: 0.05, unit: 'cm²' });
            }),
            tf(t`Dobrando o raio de um círculo, sua área dobra.`, false, t`A área depende de $r^2$: dobrar o raio **quadruplica** a área.`),
            gen((rng) => {
              const r = randInt(rng, 2, 10);
              return num(t`Uma circunferência mede $${fmt(6.28 * r, 2)}$ cm de comprimento. Qual a área do círculo? (use $\pi\approx3{,}14$)`, 3.14 * r * r, t`$2\pi r=${fmt(6.28 * r, 2)}\Rightarrow r=${r}$. Área $=3{,}14\cdot${r * r}=${fmt(3.14 * r * r, 2)}$ cm².`, { tol: 0.1, unit: 'cm²' });
            }),
          ],
        },
        {
          card: {
            title: 'Pitágoras e o triângulo retângulo',
            body: t`$$a^2=b^2+c^2$$
A hipotenusa ao quadrado é a soma dos quadrados dos catetos. Triângulos famosos: $(3, 4, 5)$, $(5, 12, 13)$, $(8, 15, 17)$.`,
            tip: t`Triângulo equilátero de lado $\ell$: altura $\frac{\ell\sqrt3}{2}$ e área $\frac{\ell^2\sqrt3}{4}$. Diagonal do quadrado: $\ell\sqrt2$.`,
          },
          exercises: [
            gen((rng) => {
              const [a, b, c] = pick(rng, TRIPLES);
              return num(t`Os catetos de um triângulo retângulo medem $${a}$ e $${b}$. Quanto mede a hipotenusa?`, c, t`$\sqrt{${a}^2+${b}^2}=\sqrt{${a * a + b * b}}=${c}$.`);
            }),
            tf(t`Os lados $3$, $4$ e $6$ formam um triângulo retângulo.`, false, t`$3^2+4^2=25\neq36=6^2$.`),
            gen((rng) => {
              const [a, b, c] = pick(rng, TRIPLES);
              return num(t`Num triângulo retângulo, a hipotenusa mede $${c}$ e um cateto mede $${a}$. Quanto mede o outro cateto?`, b, t`$\sqrt{${c}^2-${a}^2}=\sqrt{${c * c - a * a}}=${b}$.`);
            }),
            gen((rng) => {
              const [a, b, c] = pick(rng, TRIPLES);
              return num(t`Qual a diagonal de um retângulo de $${a}$ m por $${b}$ m?`, c, t`A diagonal é a hipotenusa: $\sqrt{${a * a}+${b * b}}=${c}$ m.`, { unit: 'm' });
            }),
            num(t`Qual a área de um triângulo equilátero de lado 2? (aprox. com 3 casas)`, Math.sqrt(3), t`$\frac{\ell^2\sqrt3}{4}=\frac{4\sqrt3}{4}=\sqrt3\approx1{,}732$.`, { tol: 0.005 }),
            gen((rng) => {
              const l = 2 * randInt(rng, 1, 6);
              return num(t`Qual a altura de um triângulo equilátero de lado $${l}$? (aprox. com 2 casas)`, (l * Math.sqrt(3)) / 2, t`$\frac{${l}\sqrt3}{2}=${l / 2}\sqrt3\approx${fmt((l * Math.sqrt(3)) / 2, 2)}$.`, { tol: 0.01 });
            }),
            gen((rng) => {
              const [a, b, c] = pick(rng, [[6, 8, 10], [5, 12, 13], [3, 4, 5]] as const);
              return num(t`Uma escada de $${c}$ m está apoiada numa parede, com o pé a $${a}$ m da parede. A que altura ela toca a parede?`, b, t`$\sqrt{${c}^2-${a}^2}=${b}$ m.`, { unit: 'm' });
            }),
            gen((rng) => {
              const l = randInt(rng, 2, 10);
              return num(t`Qual a diagonal de um quadrado de lado $${l}$? (aprox. com 2 casas)`, l * Math.SQRT2, t`$${l}\sqrt2\approx${fmt(l * Math.SQRT2, 2)}$.`, { tol: 0.01 });
            }),
          ],
        },
        {
          card: {
            title: 'Áreas compostas',
            body: t`Figuras complicadas viram **soma ou diferença** de figuras simples.

• Coroa circular: $\pi(R^2-r^2)$
• Setor circular de ângulo $\theta$: $\frac{\theta}{360^\circ}\cdot\pi r^2$
• Semicírculo: $\frac{\pi r^2}{2}$`,
            example: t`Quadrado de lado 4 com um círculo inscrito: área fora do círculo $=16-\pi\cdot2^2\approx3{,}43$.`,
          },
          exercises: [
            tf(t`A área de um semicírculo de raio $r$ é $\frac{\pi r^2}{2}$.`, true, t`Metade do círculo.`),
            gen((rng) => {
              const a = randInt(rng, 6, 12);
              const b = randInt(rng, 5, 10);
              const s = randInt(rng, 1, 4);
              return num(t`Um retângulo de $${a}\times${b}$ teve um quadrado de lado $${s}$ recortado. Qual a área que sobrou?`, a * b - s * s, t`$${a * b}-${s * s}=${a * b - s * s}$.`);
            }),
            gen((rng) => {
              const a1 = randInt(rng, 4, 8);
              const b1 = randInt(rng, 2, 4);
              const a2 = randInt(rng, 2, 4);
              const b2 = randInt(rng, 3, 6);
              return num(t`Uma sala em L é formada por um retângulo de $${a1}\times${b1}$ m e outro de $${a2}\times${b2}$ m (sem sobreposição). Qual a área total?`, a1 * b1 + a2 * b2, t`$${a1 * b1}+${a2 * b2}=${a1 * b1 + a2 * b2}$ m².`, { unit: 'm²' });
            }),
            gen((rng) => {
              const R = randInt(rng, 4, 10);
              const r = randInt(rng, 1, R - 1);
              return num(t`Uma arruela tem raio externo $${R}$ mm e furo de raio $${r}$ mm. Qual a área da arruela? (use $\pi\approx3{,}14$)`, 3.14 * (R * R - r * r), t`$\pi(R^2-r^2)\approx3{,}14\cdot(${R * R}-${r * r})=${fmt(3.14 * (R * R - r * r), 2)}$ mm².`, { tol: 0.1, unit: 'mm²' });
            }),
            gen((rng) => {
              const th = pick(rng, [60, 90, 120, 180, 45]);
              const r = randInt(rng, 2, 10);
              return num(t`Qual a área de um setor circular de $${th}^\circ$ e raio $${r}$? (use $\pi\approx3{,}14$)`, (th / 360) * 3.14 * r * r, t`$\frac{${th}}{360}\cdot3{,}14\cdot${r * r}=${fmt((th / 360) * 3.14 * r * r, 2)}$.`, { tol: 0.05 });
            }),
            gen((rng) => {
              const l = 2 * randInt(rng, 1, 6);
              return num(t`Um quadrado de lado $${l}$ tem um círculo inscrito (tocando os 4 lados). Qual a área do quadrado **fora** do círculo? (use $\pi\approx3{,}14$)`, l * l - 3.14 * (l / 2) ** 2, t`$${l * l}-3{,}14\cdot${(l / 2) ** 2}=${fmt(l * l - 3.14 * (l / 2) ** 2, 2)}$.`, { tol: 0.05 });
            }),
            num(t`Um terreno de $20\times30$ m tem uma piscina circular de raio $3$ m. Qual a área do terreno sem a piscina? (use $\pi\approx3{,}14$)`, 600 - 3.14 * 9, t`$600-3{,}14\cdot9=600-28{,}26=571{,}74$ m².`, { tol: 0.05, unit: 'm²' }),
            num(t`Um quadrado de lado $4$ tem, em cada canto, um quarto de círculo de raio $2$ recortado. Qual a área restante? (2 casas)`, 16 - 4 * Math.PI, t`Os 4 quartos formam um círculo inteiro de raio 2: $16-4\pi\approx3{,}43$.`, { tol: 0.01 }),
          ],
        },
      ],
    },
    {
      id: 'f-geo-vol',
      title: 'Volumes de sólidos',
      parts: [
        {
          card: {
            title: 'Prismas e cilindros',
            body: t`Sólidos "retos", com a mesma seção de baixo a cima: $V=A_{base}\cdot h$.

• **Cubo**: $a^3$ · **paralelepípedo**: $a\cdot b\cdot c$
• **Cilindro**: $\pi r^2h$

$1\ \text{m}^3=1000$ L e $1\ \text{dm}^3=1$ L.`,
            visual: { name: 'space3d', props: { params: [{ key: 'h', label: 'h', min: 0.5, max: 3.5, step: 0.1, value: 2, color: C.p2 }], render: ({ p }: any) => cylinder(p.h), info: ({ p }: any) => t`Cilindro $r=1{,}5$: $V=\pi\cdot1{,}5^2\cdot${fmt(p.h)}=${fmt(Math.PI * 2.25 * p.h, 2)}$` } },
          },
          exercises: [
            tf(t`O volume de qualquer prisma é a área da base vezes a altura.`, true, t`Vale para prismas e cilindros: a seção é a mesma em toda a altura.`),
            gen((rng) => {
              const a = randInt(rng, 2, 8);
              const b = randInt(rng, 2, 8);
              const c = randInt(rng, 2, 8);
              return num(t`Qual o volume de uma caixa de $${a}\times${b}\times${c}$ m?`, a * b * c, t`$${a}\cdot${b}\cdot${c}=${a * b * c}$ m³.`, { unit: 'm³' });
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 9);
              return num(t`Qual o volume de um cubo de aresta $${a}$ cm?`, a ** 3, t`$${a}^3=${a ** 3}$ cm³.`, { unit: 'cm³' });
            }),
            num(t`Quantos litros cabem num cubo de aresta 1 m? (1 m³ = 1000 L)`, 1000, t`$1\ \text{m}^3=1000$ L.`, { unit: 'L' }),
            gen((rng) => {
              const r = randInt(rng, 1, 5);
              const h = randInt(rng, 2, 10);
              return num(t`Um cilindro tem raio $${r}$ e altura $${h}$. Qual seu volume? (use $\pi\approx3{,}14$)`, 3.14 * r * r * h, t`$\pi r^2h\approx3{,}14\cdot${r * r}\cdot${h}=${fmt(3.14 * r * r * h, 2)}$.`, { tol: 0.1 });
            }),
            gen((rng) => {
              const b = 2 * randInt(rng, 1, 5);
              const h = randInt(rng, 2, 6);
              const H = randInt(rng, 3, 10);
              return num(t`Um prisma tem como base um triângulo de base $${b}$ e altura $${h}$, e altura (comprimento) $${H}$. Qual seu volume?`, ((b * h) / 2) * H, t`$A_{base}=\frac{${b}\cdot${h}}{2}=${(b * h) / 2}$; $V=${(b * h) / 2}\cdot${H}=${((b * h) / 2) * H}$.`);
            }),
            gen((rng) => {
              const r = pick(rng, [0.5, 1, 1.5]);
              const h = pick(rng, [1, 2, 3]);
              const V = 3.14 * r * r * h * 1000;
              return num(t`Uma caixa d'água cilíndrica tem raio $${fmt(r)}$ m e altura $${h}$ m. Quantos **litros** ela comporta? (use $\pi\approx3{,}14$)`, V, t`$3{,}14\cdot${fmt(r * r)}\cdot${h}=${fmt(V / 1000, 4)}$ m³ $=${fmt(V, 1)}$ L.`, { tol: 1, unit: 'L' });
            }),
            gen((rng) => {
              const [a, b, c] = pick(rng, [[2, 1.5, 1], [3, 2, 1], [2, 2, 1.5]] as const);
              const p = pick(rng, [40, 60, 75]);
              const L = a * b * c * 1000 * (p / 100);
              return num(t`Uma caixa d'água de $${fmt(a)}\times${fmt(b)}\times${fmt(c)}$ m está com água até $${p}\%$ da capacidade. Quantos litros ela tem?`, L, t`Capacidade: $${fmt(a * b * c)}$ m³ $=${fmt(a * b * c * 1000)}$ L. Com $${p}\%$: $${fmt(L)}$ L.`, { unit: 'L' });
            }),
          ],
        },
        {
          card: {
            title: 'Pirâmides e cones',
            body: t`Sólidos "pontudos" têm **um terço** do volume do prisma de mesma base e altura:

$$V=\frac13\,A_{base}\cdot h\qquad\text{cone: }V=\frac13\pi r^2h$$

A **geratriz** do cone (a "lateral") é $g=\sqrt{r^2+h^2}$.`,
            tip: t`Um cone cabe exatamente **3 vezes** dentro do cilindro de mesma base e altura.`,
          },
          exercises: [
            mcqS(t`O volume do cone é que fração do cilindro de mesma base e altura?`, t`$\frac13$`, [t`$\frac12$`, t`$\frac23$`, t`$\frac14$`], t`$V_{cone}=\frac13\pi r^2h$.`),
            tf(t`Uma pirâmide e um prisma de mesma base e altura têm o mesmo volume.`, false, t`A pirâmide tem $\frac13$ do volume do prisma.`),
            gen((rng) => {
              const l = randInt(rng, 2, 9);
              const h = 3 * randInt(rng, 1, 5);
              return num(t`Uma pirâmide de base quadrada de lado $${l}$ tem altura $${h}$. Qual seu volume?`, (l * l * h) / 3, t`$\frac13\cdot${l * l}\cdot${h}=${(l * l * h) / 3}$.`);
            }),
            gen((rng) => {
              const V = 3 * randInt(rng, 10, 100);
              return num(t`Um cilindro tem volume $${V}$ cm³. Qual o volume de um cone de mesma base e altura?`, V / 3, t`$\frac{${V}}{3}=${V / 3}$ cm³.`, { unit: 'cm³' });
            }),
            gen((rng) => {
              const r = randInt(rng, 1, 6);
              const h = 3 * randInt(rng, 1, 4);
              return num(t`Qual o volume de um cone de raio $${r}$ e altura $${h}$? (use $\pi\approx3{,}14$)`, (3.14 * r * r * h) / 3, t`$\frac13\cdot3{,}14\cdot${r * r}\cdot${h}=${fmt((3.14 * r * r * h) / 3, 2)}$.`, { tol: 0.05 });
            }),
            gen((rng) => {
              const [r, h, g] = pick(rng, TRIPLES);
              return num(t`Um cone tem raio $${r}$ e altura $${h}$. Quanto mede sua geratriz?`, g, t`$g=\sqrt{${r}^2+${h}^2}=${g}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              const b = randInt(rng, 2, 6);
              const h = 3 * randInt(rng, 1, 4);
              return num(t`Uma pirâmide tem base retangular $${a}\times${b}$ e altura $${h}$. Qual seu volume?`, (a * b * h) / 3, t`$\frac13\cdot${a * b}\cdot${h}=${(a * b * h) / 3}$.`);
            }),
            num(t`Um funil cônico tem raio $6$ cm e altura $10$ cm. Quantos mL cabem nele? (use $\pi\approx3{,}14$; $1$ cm³ $=1$ mL)`, (3.14 * 36 * 10) / 3, t`$\frac13\cdot3{,}14\cdot36\cdot10=376{,}8$ mL.`, { tol: 0.2, unit: 'mL' }),
          ],
        },
        {
          card: {
            title: 'Esferas e escala',
            body: t`**Esfera**: $V=\frac43\pi r^3$ e área $4\pi r^2$.

**Escala**: se todas as medidas são multiplicadas por $k$, as **áreas** ficam $k^2$ vezes maiores e os **volumes**, $k^3$ vezes.`,
            example: t`Dobrar o raio de uma bola: área $\times4$, volume $\times8$.`,
          },
          exercises: [
            tf(t`Se o raio de uma esfera triplica, seu volume fica 27 vezes maior.`, true, t`$V\propto r^3$, e $3^3=27$.`),
            mcq(t`Se todas as medidas de uma caixa dobram, o volume fica…`, ['8 vezes maior', '2 vezes maior', '4 vezes maior', '6 vezes maior'], 0, t`$2\cdot2\cdot2=8$.`),
            gen((rng) => {
              const r = 3 * randInt(rng, 1, 3);
              return num(t`Qual o volume de uma esfera de raio $${r}$? (use $\pi\approx3{,}14$)`, (4 / 3) * 3.14 * r ** 3, t`$\frac43\cdot3{,}14\cdot${r ** 3}=${fmt((4 / 3) * 3.14 * r ** 3, 2)}$.`, { tol: 0.1 });
            }),
            gen((rng) => {
              const r = randInt(rng, 1, 10);
              return num(t`Qual a área da superfície de uma esfera de raio $${r}$? (use $\pi\approx3{,}14$)`, 4 * 3.14 * r * r, t`$4\cdot3{,}14\cdot${r * r}=${fmt(4 * 3.14 * r * r, 2)}$.`, { tol: 0.05 });
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              const A = randInt(rng, 2, 20);
              return num(t`Uma peça tem área $${A}$ cm². Uma cópia com todas as medidas $${k}$ vezes maiores terá que área?`, A * k * k, t`Área escala com $k^2=${k * k}$: $${A}\cdot${k * k}=${A * k * k}$ cm².`, { unit: 'cm²' });
            }),
            gen((rng) => {
              const k = pick(rng, [10, 20, 50]);
              const v = pick(rng, [2, 3, 5]);
              return num(t`Uma maquete na escala $1:${k}$ tem volume de $${v}$ cm³. Qual o volume do objeto real, em cm³?`, v * k ** 3, t`Volume escala com $k^3=${k ** 3}$: $${v}\cdot${k ** 3}=${v * k ** 3}$ cm³.`, { unit: 'cm³' });
            }),
            num(t`Quantas bolinhas de raio $1$ cm, derretidas, formam uma bola de raio $3$ cm?`, 27, t`A razão dos volumes é $\left(\frac31\right)^3=27$.`),
            num(t`Uma esfera está inscrita num cubo de aresta $2$. Qual a razão $\frac{V_{esfera}}{V_{cubo}}$? (3 casas)`, Math.PI / 6, t`$\frac{\frac43\pi\cdot1^3}{2^3}=\frac{\pi}{6}\approx0{,}524$.`, { tol: 0.002 }),
          ],
        },
      ],
    },
    {
      id: 'f-geo-anal',
      title: 'Geometria analítica',
      parts: [
        {
          card: {
            title: 'Distância e ponto médio',
            body: t`$$d_{AB}=\sqrt{(x_B-x_A)^2+(y_B-y_A)^2}\qquad M=\left(\tfrac{x_A+x_B}{2},\ \tfrac{y_A+y_B}{2}\right)$$
É Pitágoras no plano cartesiano. Arraste $A$ e $B$:`,
            visual: distanceLab(),
          },
          exercises: [
            tf(t`A distância de $(0,\,0)$ até $(1,\,1)$ é $2$.`, false, t`$\sqrt{1^2+1^2}=\sqrt2\approx1{,}41$.`),
            gen((rng) => {
              const x1 = randInt(rng, -6, 6);
              const x2 = randInt(rng, -6, 6);
              return num(t`A abscissa do ponto médio entre $x_A=${x1}$ e $x_B=${x2}$ é:`, (x1 + x2) / 2, t`$\frac{${x1}+${x2}}{2}=${fmt((x1 + x2) / 2)}$.`);
            }),
            gen((rng) => {
              const [a, b, c] = pick(rng, TRIPLES);
              const s1 = pick(rng, [1, -1]);
              const s2 = pick(rng, [1, -1]);
              return num(t`Qual a distância do ponto $${pt(s1 * a, s2 * b)}$ até a origem?`, c, t`$\sqrt{${a}^2+${b}^2}=${c}$.`);
            }),
            gen((rng) => {
              const [dx, dy, d] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10]] as const);
              const x = randInt(rng, -4, 4);
              const y = randInt(rng, -4, 4);
              return num(t`Qual a distância entre $A${pt(x, y)}$ e $B${pt(x + dx, y + dy)}$?`, d, t`$\sqrt{${dx}^2+${dy}^2}=${d}$.`);
            }),
            gen((rng) => {
              const [x1, y1] = [2 * randInt(rng, -3, 3), 2 * randInt(rng, -3, 3)];
              const [x2, y2] = [2 * randInt(rng, -3, 3), 2 * randInt(rng, -3, 3)];
              const M = pt((x1 + x2) / 2, (y1 + y2) / 2);
              return rmcq(rng, t`Qual o ponto médio entre $A${pt(x1, y1)}$ e $B${pt(x2, y2)}$?`, `$${M}$`, [`$${pt(x1 + x2, y1 + y2)}$`, `$${pt((x2 - x1) / 2, (y2 - y1) / 2)}$`, `$${pt((y1 + y2) / 2, (x1 + x2) / 2)}$`, `$${pt((x1 + x2) / 2 + 1, (y1 + y2) / 2)}$`], t`Média das coordenadas: $${M}$.`);
            }),
            inter(t`Arraste $A$ e $B$ para que a distância entre eles seja exatamente $5$.`, 'plot', distanceLab().props, (v: any) => v && near(Math.hypot(v.pts.B.x - v.pts.A.x, v.pts.B.y - v.pts.A.y), 5, 0.01), t`ex.: um deslocamento $(3,\,4)$`),
            gen((rng) => {
              const [ax, ay, mx, my] = [randInt(rng, -5, 5), randInt(rng, -5, 5), randInt(rng, -4, 4), randInt(rng, -4, 4)];
              const B = pt(2 * mx - ax, 2 * my - ay);
              return rmcq(rng, t`$M${pt(mx, my)}$ é o ponto médio de $AB$, com $A${pt(ax, ay)}$. Quem é $B$?`, `$${B}$`, [`$${pt((ax + mx) / 2, (ay + my) / 2)}$`, `$${pt(mx - ax, my - ay)}$`, `$${pt(2 * ax - mx, 2 * ay - my)}$`, `$${pt(ax + mx, ay + my)}$`], t`$B=2M-A=${B}$.`);
            }),
            gen((rng) => {
              const k = randInt(rng, 1, 4);
              return num(t`Qual o perímetro do triângulo de vértices $${pt(0, 0)}$, $${pt(3 * k, 0)}$ e $${pt(3 * k, 4 * k)}$?`, 12 * k, t`Lados $${3 * k}$, $${4 * k}$ e $\sqrt{${(3 * k) ** 2}+${(4 * k) ** 2}}=${5 * k}$. Soma: $${12 * k}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Circunferência',
            body: t`Todos os pontos à distância $r$ do centro $(a,b)$:
$$(x-a)^2+(y-b)^2=r^2$$`,
            visual: circleLab(),
          },
          exercises: [
            mcqS(t`Qual o centro e o raio de $(x-3)^2+(y+1)^2=25$?`, t`centro $(3,\,-1)$, raio $5$`, [t`centro $(-3,\,1)$, raio $5$`, t`centro $(3,\,-1)$, raio $25$`, t`centro $(3,\,1)$, raio $5$`], t`Os sinais **dentro** dos parênteses aparecem trocados no centro, e $r=\sqrt{25}$.`),
            inter(t`Monte a circunferência de centro $(0,\,0)$ e raio $3$.`, 'plot', circleLab().props, (v: any) => v && near(v.pts.O.x, 0, 0.01) && near(v.pts.O.y, 0, 0.01) && near(Math.hypot(v.pts.P.x, v.pts.P.y), 3, 0.01), t`centro na origem e ponto a distância 3`),
            gen((rng) => {
              const [a, b, r] = [randInt(rng, -4, 4), randInt(rng, -4, 4), randInt(rng, 1, 6)];
              return rmcq(rng, t`Qual é a equação da circunferência de centro $${pt(a, b)}$ e raio $${r}$?`, `$${circEq(a, b, r * r)}$`, [`$${circEq(-a, -b, r * r)}$`, `$${circEq(a, b, r)}$`, `$${circEq(b, a, r * r)}$`, `$${circEq(-a, b, r * r)}$`], t`$(x-a)^2+(y-b)^2=r^2$ com $a=${a}$, $b=${b}$, $r^2=${r * r}$.`);
            }),
            gen((rng) => {
              const [a, b, r] = [randInt(rng, -4, 4), randInt(rng, -4, 4), randInt(rng, 1, 9)];
              return num(t`Qual o raio de $${circEq(a, b, r * r)}$?`, r, t`$r=\sqrt{${r * r}}=${r}$.`);
            }),
            tf(t`O ponto $(1,\,1)$ está dentro da circunferência $x^2+y^2=4$.`, true, t`$1^2+1^2=2<4$.`),
            gen((rng) => {
              const [dx, dy, r] = pick(rng, [[3, 4, 5], [0, 5, 5], [6, 8, 10], [5, 0, 5]] as const);
              const [a, b] = [randInt(rng, -3, 3), randInt(rng, -3, 3)];
              const on = rng() < 0.5;
              const P = pt(a + dx, b + dy + (on ? 0 : 1));
              return tf(t`O ponto $${P}$ pertence à circunferência $${circEq(a, b, r * r)}$.`, on, on ? t`$${dx}^2+${dy}^2=${r * r}$: está exatamente sobre ela.` : t`$${dx}^2+${dy + 1}^2=${dx * dx + (dy + 1) ** 2}\neq${r * r}$.`);
            }),
            gen((rng) => {
              const [a, b] = [randInt(rng, -3, 3), randInt(rng, -3, 3)];
              const [dx, dy] = [randInt(rng, -4, 4), randInt(rng, 1, 4)];
              return num(t`Uma circunferência tem centro $${pt(a, b)}$ e passa por $${pt(a + dx, b + dy)}$. Quanto vale $r^2$?`, dx * dx + dy * dy, t`$r^2=${dx}^2+${dy}^2=${dx * dx + dy * dy}$.`);
            }),
            gen((rng) => {
              const [x1, y1, x2, y2] = [2 * randInt(rng, -3, 3), 2 * randInt(rng, -3, 3), 2 * randInt(rng, -3, 3), 2 * randInt(rng, -3, 3)];
              const C = pt((x1 + x2) / 2, (y1 + y2) / 2);
              return rmcq(rng, t`Os pontos $${pt(x1, y1)}$ e $${pt(x2, y2)}$ são extremos de um **diâmetro**. Qual é o centro?`, `$${C}$`, [`$${pt(x1 + x2, y1 + y2)}$`, `$${pt(x2 - x1, y2 - y1)}$`, `$${pt((x2 - x1) / 2, (y2 - y1) / 2)}$`, `$${pt(0, 0)}$`], t`O centro é o ponto médio do diâmetro: $${C}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Completando quadrados',
            body: t`Se a equação vier "aberta", como $x^2+y^2-4x+6y-3=0$, **complete quadrados**: $x^2+Dx=\left(x+\tfrac D2\right)^2-\tfrac{D^2}{4}$.

$$(x-2)^2-4+(y+3)^2-9-3=0\Rightarrow(x-2)^2+(y+3)^2=16$$

Centro $(2,\,-3)$, raio $4$.`,
            tip: t`Posição de um ponto: compare a distância até o centro com $r$ (menor: dentro; igual: sobre; maior: fora). Uma reta é **tangente** quando sua distância ao centro é exatamente $r$.`,
          },
          exercises: [
            gen((rng) => {
              const h = randNZ(rng, -6, 6);
              return rmcq(rng, t`Complete o quadrado: $x^2${term(2 * h, 'x')}=\ ?$`, `$(x${term(h, '')})^2-${h * h}$`, [`$(x${term(h, '')})^2+${h * h}$`, `$(x${term(2 * h, '')})^2-${4 * h * h}$`, `$(x${term(-h, '')})^2-${h * h}$`], t`$(x${term(h, '')})^2=x^2${term(2 * h, 'x')}+${h * h}$; tire o $${h * h}$ que sobrou.`);
            }),
            gen((rng) => {
              const [a, b, r] = [randNZ(rng, -4, 4), randNZ(rng, -4, 4), randInt(rng, 1, 6)];
              const F = a * a + b * b - r * r;
              return rmcq(rng, t`Qual o centro de $x^2+y^2${term(-2 * a, 'x')}${term(-2 * b, 'y')}${term(F, '')}=0$?`, `$${pt(a, b)}$`, [`$${pt(-a, -b)}$`, `$${pt(-2 * a, -2 * b)}$`, `$${pt(2 * a, 2 * b)}$`, `$${pt(b, a)}$`], t`Completando quadrados: $${circEq(a, b, r * r)}$, centro $${pt(a, b)}$.`);
            }),
            gen((rng) => {
              const [a, b, r] = [randNZ(rng, -4, 4), randNZ(rng, -4, 4), randInt(rng, 1, 6)];
              const F = a * a + b * b - r * r;
              return num(t`Qual o raio de $x^2+y^2${term(-2 * a, 'x')}${term(-2 * b, 'y')}${term(F, '')}=0$?`, r, t`$(x${term(-a, '')})^2+(y${term(-b, '')})^2=${a * a}+${b * b}${term(-F, '')}=${r * r}$, então $r=${r}$.`);
            }),
            tf(t`A equação $x^2+y^2+2x+2=0$ representa uma circunferência real.`, false, t`$(x+1)^2+y^2=-1$: soma de quadrados não pode ser negativa.`),
            gen((rng) => {
              const r = randInt(rng, 2, 6);
              const [x, y] = [randInt(rng, -6, 6), randInt(rng, -6, 6)];
              const d2 = x * x + y * y;
              const ans = d2 < r * r ? 0 : d2 === r * r ? 1 : 2;
              return mcq(t`O ponto $${pt(x, y)}$ está ___ da circunferência $x^2+y^2=${r * r}$.`, ['dentro', 'sobre', 'fora'], ans, t`$${x}^2+${y}^2=${d2}$, ${ans === 0 ? 'menor que' : ans === 1 ? 'igual a' : 'maior que'} $${r * r}$.`);
            }),
            mcq(t`A reta $x=5$ e a circunferência $x^2+y^2=9$…`, ['não se tocam', 'são tangentes', 'se cortam em 2 pontos', 'coincidem'], 0, t`O raio é $3$ e a reta está a distância $5$ do centro: fica do lado de fora.`),
            gen((rng) => {
              const [a, b, r] = [randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, 1, 5)];
              return num(t`A reta horizontal $y=k$, acima do centro, é tangente à circunferência $${circEq(a, b, r * r)}$. Quanto vale $k$?`, b + r, t`Tangente acima do centro: $k=b+r=${b}+${r}=${b + r}$.`);
            }),
            num(t`Para qual $k$ a circunferência $x^2+y^2-2x+4y+k=0$ tem raio $3$?`, -4, t`$(x-1)^2+(y+2)^2=5-k$. Raio $3$: $5-k=9\Rightarrow k=-4$.`),
          ],
        },
      ],
    },
  ],
};
