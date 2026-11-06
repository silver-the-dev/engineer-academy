import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { Arrow, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ } from '../../../lib/random';
import { vectorLab, vectors3DLab } from '../../visuals';

const t = String.raw;
const V = (x: number, y: number) => t`(${x},\,${y})`;
const V3 = (x: number, y: number, z: number) => t`(${x},\,${y},\,${z})`;

const vecTarget = (tx: number, ty: number) =>
  plot({
    view: { xMin: -5, xMax: 5, yMin: -4, yMax: 4 },
    equalAspect: true,
    snap: 1,
    points: [{ id: 'u', x: 1, y: 1, color: C.p2, label: 'arraste' }],
    render: ({ pts }: any) => (
      <>
        <Arrow x1={0} y1={0} x2={tx} y2={ty} color={C.gold} width={2} />
        <Arrow x1={0} y1={0} x2={pts.u.x} y2={pts.u.y} color={C.p2} />
      </>
    ),
    info: ({ pts }: any) => t`$\vec u=(${fmt(pts.u.x)},\,${fmt(pts.u.y)})$`,
  });

export const vetoresGeo: UnitDef = {
  id: 'g-vgeo',
  title: 'Vetores: visão geométrica',
  subtitle: 'Soma, subtração, escalar, versor e ângulo',
  icon: '➡️',
  source: 'GA e Álgebra Linear · Unidade 1 — Vetores: viés geométrico',
  guide: t`Vetor = classe de segmentos orientados com mesmo **módulo, direção e sentido**. Soma pela regra do paralelogramo; multiplicar por escalar estica/encolhe (e inverte se negativo).`,
  lessons: [
    {
      id: 'g-vgeo-conc',
      title: 'Conceito e casos particulares',
      cards: [
        {
          title: 'Módulo, direção e sentido',
          body: t`Um vetor é uma "flecha" que pode ser transportada paralelamente: o que importa é **módulo** (tamanho), **direção** (a reta suporte) e **sentido** (para onde aponta).

Casos particulares:
• **Nulo** $\vec0$: módulo zero
• **Unitário**: módulo 1
• **Oposto** $-\vec v$: mesmo módulo e direção, sentido contrário
• **Colineares**: mesma direção; **coplanares**: no mesmo plano`,
          visual: vectorLab('module'),
        },
      ],
      exercises: [
        tf(t`Dois vetores com mesmo módulo e mesma direção são sempre iguais.`, false, t`Falta o **sentido**: $\vec v$ e $-\vec v$ têm mesmo módulo e direção, mas são diferentes.`),
        mcq(t`O vetor oposto de $\vec v$ tem…`, ['mesmo módulo, mesma direção e sentido contrário', 'módulo oposto', 'direção perpendicular', 'módulo 1'], 0),
        inter(t`Arraste $\vec u$ para formar um vetor **unitário** apontando para cima.`, 'plot', vecTarget(0, 1).props, (v: any) => v && v.pts.u.x === 0 && v.pts.u.y === 1, t`$\vec u=(0,\,1)$`),
        mcqS(t`Vetores que estão sobre retas paralelas são chamados…`, 'colineares', ['ortogonais', 'opostos', 'unitários']),
      ],
    },
    {
      id: 'g-vgeo-soma',
      title: 'Soma e subtração',
      cards: [
        {
          title: 'Regra do paralelogramo',
          body: t`Para somar, coloque o início de $\vec v$ na ponta de $\vec u$: a soma vai do início de $\vec u$ à ponta de $\vec v$. É a **diagonal** do paralelogramo. Arraste as pontas:`,
          visual: vectorLab('sum'),
          tip: t`A soma é comutativa ($\vec u+\vec v=\vec v+\vec u$) e associativa. Na física: forças resultantes!`,
        },
        {
          title: 'Subtração',
          body: t`$\vec u-\vec v=\vec u+(-\vec v)$. Geometricamente, é a flecha que vai da ponta de $\vec v$ até a ponta de $\vec u$ — a **outra** diagonal:`,
          visual: vectorLab('diff'),
        },
      ],
      exercises: [
        inter(t`Arraste $\vec u$ e $\vec v$ para que $\vec u+\vec v=(4,\,0)$ com $\vec u$ e $\vec v$ **não horizontais**.`, 'plot', vectorLab('sum').props, (v: any) => v && near(v.pts.u.x + v.pts.v.x, 4, 0.01) && near(v.pts.u.y + v.pts.v.y, 0, 0.01) && Math.abs(v.pts.u.y) > 0.1, t`ex.: $\vec u=(2,\,2)$ e $\vec v=(2,\,-2)$`),
        inter(t`Arraste para que $\vec u-\vec v=(0,\,3)$.`, 'plot', vectorLab('diff').props, (v: any) => v && near(v.pts.u.x - v.pts.v.x, 0, 0.01) && near(v.pts.u.y - v.pts.v.y, 3, 0.01), t`$\vec u$ exatamente 3 acima de $\vec v$`),
        num(t`Duas forças de 3 N e 4 N, perpendiculares, atuam num ponto. Qual o módulo da resultante?`, 5, t`Pitágoras: $\sqrt{9+16}=5$ N.`, { unit: 'N' }),
        tf(t`$\vec u-\vec v=\vec v-\vec u$`, false, t`$\vec v-\vec u=-(\vec u-\vec v)$: são opostos.`),
        mcq(t`No paralelogramo de lados $\vec u$ e $\vec v$, as diagonais são…`, [t`$\vec u+\vec v$ e $\vec u-\vec v$`, t`$\vec u$ e $\vec v$`, t`$2\vec u$ e $2\vec v$`, t`$\vec u\cdot\vec v$ e $\vec u\times\vec v$`], 0),
      ],
    },
    {
      id: 'g-vgeo-esc',
      title: 'Escalar, versor e ângulo',
      cards: [
        {
          title: 'Esticar e encolher',
          body: t`$k\vec u$: módulo $|k|\,|\vec u|$, mesma direção; sentido igual se $k>0$, oposto se $k<0$:`,
          visual: vectorLab('scale'),
        },
        {
          title: 'Versor',
          body: t`O **versor** de $\vec v$ é o vetor unitário de mesma direção e sentido:
$$\hat v=\frac{\vec v}{|\vec v|}$$

O **ângulo** entre dois vetores (com origens juntas) fica em $[0^\circ,\,180^\circ]$.`,
          visual: vectorLab('dot'),
        },
      ],
      exercises: [
        gen((rng) => {
          const k = pick(rng, [-3, -2, 2, 3, 0.5]);
          const m = randInt(rng, 2, 6);
          return num(t`Se $|\vec v|=${m}$, qual o módulo de $${String(k).replace('.', ',')}\vec v$?`, Math.abs(k) * m, t`$|k\vec v|=|k|\,|\vec v|=${fmt(Math.abs(k) * m)}$.`);
        }),
        mcqS(t`Qual o versor de $\vec v=(3,\,4)$?`, t`$\left(\frac35,\,\frac45\right)$`, [t`$(3,\,4)$`, t`$\left(\frac13,\,\frac14\right)$`, t`$(0{,}3,\,0{,}4)$`], t`$|\vec v|=5$.`),
        inter(t`Ajuste $k$ e $\vec u$ para que $k\vec u$ tenha módulo 4 e sentido **oposto** a $\vec u$.`, 'plot', vectorLab('scale').props, (v: any) => v && v.p.k < 0 && near(Math.abs(v.p.k) * Math.hypot(v.pts.u.x, v.pts.u.y), 4, 0.06), t`ex.: $\vec u=(2,\,0)$ e $k=-2$`),
        inter(t`Arraste os vetores para formarem um ângulo de $90^\circ$.`, 'plot', vectorLab('dot').props, (v: any) => v && Math.abs(v.pts.u.x * v.pts.v.x + v.pts.u.y * v.pts.v.y) < 1e-9 && Math.hypot(v.pts.v.x, v.pts.v.y) > 0, t`produto escalar zero, ex.: $(2,\,1)$ e $(-1,\,2)$`),
      ],
    },
  ],
};

export const vetoresAlg: UnitDef = {
  id: 'g-valg',
  title: 'Vetores: visão algébrica',
  subtitle: 'Coordenadas, módulo, ponto médio, paralelismo e R³',
  icon: '🔢',
  source: 'GA e Álgebra Linear · Unidade 2 — Vetores: viés algébrico',
  guide: t`Na base $\{\vec i,\vec j\}$, todo vetor é $(x,y)=x\vec i+y\vec j$. As operações viram contas coordenada a coordenada, e o módulo vem de Pitágoras.`,
  lessons: [
    {
      id: 'g-valg-coord',
      title: 'Coordenadas e operações',
      cards: [
        {
          title: 'Base canônica',
          body: t`$\vec i=(1, 0)$ e $\vec j=(0, 1)$. Então $\vec v=(x,y)=x\vec i+y\vec j$.

$$(x_1,y_1)+(x_2,y_2)=(x_1+x_2,\ y_1+y_2)\qquad k(x,y)=(kx,\ ky)$$

Igualdade: $(a,b)=(c,d)\iff a=c$ e $b=d$.`,
          visual: vectorLab('sum', { snap: 1 }),
        },
      ],
      exercises: [
        gen((rng) => {
          const a = [randInt(rng, -5, 5), randInt(rng, -5, 5)];
          const b = [randInt(rng, -5, 5), randInt(rng, -5, 5)];
          const k = randNZ(rng, -3, 3);
          return rmcq(rng, t`Sendo $\vec u=${V(a[0], a[1])}$ e $\vec v=${V(b[0], b[1])}$, calcule $\vec u+${k}\vec v$.`, `$${V(a[0] + k * b[0], a[1] + k * b[1])}$`, [`$${V(a[0] + b[0], a[1] + b[1])}$`, `$${V(k * (a[0] + b[0]), k * (a[1] + b[1]))}$`, `$${V(a[0] - k * b[0], a[1] - k * b[1])}$`], t`$${V(a[0], a[1])}+${V(k * b[0], k * b[1])}=${V(a[0] + k * b[0], a[1] + k * b[1])}$.`);
        }),
        gen((rng) => {
          const x = randInt(rng, -4, 4);
          const y = randInt(rng, -4, 4);
          return inter(t`Arraste $\vec u$ até $${x}\vec i${y < 0 ? '' : '+'}${y}\vec j$.`, 'plot', vecTarget(x, y).props, (v: any) => v && v.pts.u.x === x && v.pts.u.y === y, `$${V(x, y)}$`);
        }),
        num(t`Se $(2a-1,\ 6)=(5,\ 3b)$, quanto vale $a+b$?`, 5, t`$2a-1=5\Rightarrow a=3$; $3b=6\Rightarrow b=2$.`),
        tf(t`$3\vec i-2\vec j=(3,\,-2)$`, true),
      ],
    },
    {
      id: 'g-valg-pontos',
      title: 'Vetor entre pontos, módulo e ponto médio',
      cards: [
        {
          title: 'B − A',
          body: t`$$\vec{AB}=B-A=(x_B-x_A,\ y_B-y_A)$$
$$|\vec v|=\sqrt{x^2+y^2}\qquad M=\frac{A+B}{2}$$`,
          visual: vectorLab('module', { snap: 1 }),
          example: t`$A(1, 2)$, $B(4, 6)$: $\vec{AB}=(3, 4)$, $|\vec{AB}|=5$, $M=(2{,}5;\ 4)$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const A = [randInt(rng, -4, 4), randInt(rng, -4, 4)];
          const B = [randInt(rng, -4, 4), randInt(rng, -4, 4)];
          return rmcq(rng, t`Dados $A=${V(A[0], A[1])}$ e $B=${V(B[0], B[1])}$, qual é $\vec{AB}$?`, `$${V(B[0] - A[0], B[1] - A[1])}$`, [`$${V(A[0] - B[0], A[1] - B[1])}$`, `$${V(A[0] + B[0], A[1] + B[1])}$`, `$${V(B[0] - A[1], B[1] - A[0])}$`], t`Ponta menos origem.`);
        }),
        gen((rng) => {
          const [x, y, m] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [-3, 4, 5], [12, -5, 13]] as const);
          return num(t`Calcule $|\vec v|$ para $\vec v=${V(x, y)}$.`, m, t`$\sqrt{${x * x}+${y * y}}=${m}$.`);
        }),
        inter(t`Arraste $\vec u$ até um vetor de módulo $5$ que não esteja sobre os eixos.`, 'plot', vectorLab('module', { snap: 1 }).props, (v: any) => v && near(Math.hypot(v.pts.u.x, v.pts.u.y), 5, 0.01) && v.pts.u.x !== 0 && v.pts.u.y !== 0, t`ex.: $(3,\,4)$ ou $(-4,\,3)$`),
        num(t`O ponto médio de $A(2,\,-1)$ e $B(6,\,5)$ tem ordenada:`, 2, t`$\frac{-1+5}{2}=2$.`),
        num(t`Para que valor de $k$ o vetor $(k,\,0{,}6)$ é unitário (com $k>0$)?`, 0.8, t`$k^2+0{,}36=1\Rightarrow k=0{,}8$.`),
      ],
    },
    {
      id: 'g-valg-r3',
      title: 'Paralelismo e vetores no espaço',
      cards: [
        {
          title: 'Paralelismo',
          body: t`$\vec u\parallel\vec v\iff\vec u=k\vec v\iff\frac{x_1}{x_2}=\frac{y_1}{y_2}$ (coordenadas proporcionais).`,
          example: t`$(2, -3)\parallel(-4, 6)$, pois $(-4, 6)=-2(2, -3)$.`,
        },
        {
          title: 'No espaço R³',
          body: t`Base $\{\vec i,\vec j,\vec k\}$: $\vec v=(x,y,z)=x\vec i+y\vec j+z\vec k$ e $|\vec v|=\sqrt{x^2+y^2+z^2}$. Gire e mexa nas coordenadas:`,
          visual: vectors3DLab(),
        },
      ],
      exercises: [
        gen((rng) => {
          const a = randNZ(rng, -4, 4);
          const b = randNZ(rng, -4, 4);
          const k = pick(rng, [2, 3, -2]);
          return num(t`Para que $\vec u=${V(a, b)}$ e $\vec v=(${a * k},\,m)$ sejam paralelos, quanto vale $m$?`, b * k, t`$\vec v=${k}\vec u$ ⟹ $m=${b * k}$.`);
        }),
        gen((rng) => {
          const [x, y, z, m] = pick(rng, [[1, 2, 2, 3], [2, 3, 6, 7], [2, 6, 9, 11], [4, 4, 7, 9], [1, 4, 8, 9]] as const);
          return num(t`Calcule $|\vec v|$ para $\vec v=${V3(x, y, z)}$.`, m, t`$\sqrt{${x * x}+${y * y}+${z * z}}=\sqrt{${m * m}}=${m}$.`);
        }),
        mcqS(t`Qual vetor é paralelo a $(1,\,-2,\,3)$?`, t`$(-2,\,4,\,-6)$`, [t`$(2,\,4,\,6)$`, t`$(1,\,2,\,3)$`, t`$(3,\,-2,\,1)$`]),
        inter(t`Gire a cena e ajuste o vetor para $(2,\,-1{,}5,\,1)$.`, 'space3d', vectors3DLab().props!, (v: any) => v && near(v.p.x, 2, 0.01) && near(v.p.y, -1.5, 0.01) && near(v.p.z, 1, 0.01), t`$x=2$, $y=-1{,}5$, $z=1$`),
      ],
    },
  ],
};
