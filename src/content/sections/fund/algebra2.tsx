import React from 'react';
import type { Unit } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, table } from '../../helpers';
import { FnCurve, InfLine, Pt, RectW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ } from '../../../lib/random';

const t = String.raw;

const seqLab = (geo: boolean) =>
  plot({
    view: geo ? { xMin: 0, xMax: 8.5, yMin: 0, yMax: 40 } : { xMin: 0, xMax: 8.5, yMin: -2, yMax: 25 },
    params: geo
      ? [
          { key: 'a', label: 'a_1', min: 0.5, max: 5, step: 0.5, value: 1, color: C.p3 },
          { key: 'q', label: 'q', min: 0.5, max: 2, step: 0.05, value: 1.5, color: C.p5 },
        ]
      : [
          { key: 'a', label: 'a_1', min: -2, max: 5, step: 0.5, value: 1, color: C.p3 },
          { key: 'r', label: 'r', min: -1, max: 3, step: 0.25, value: 2, color: C.p2 },
        ],
    render: ({ p }: any) => {
      const bars = [];
      for (let n = 1; n <= 8; n++) {
        const v = geo ? p.a * Math.pow(p.q, n - 1) : p.a + (n - 1) * p.r;
        bars.push(<RectW key={n} x={n - 0.35} y={0} w={0.7} h={v} color={geo ? C.p5 : C.p2} opacity={0.6} />);
      }
      return <>{bars}</>;
    },
    info: ({ p }: any) =>
      geo
        ? t`$a_n=a_1q^{n-1}$: $${[1, 2, 3, 4, 5].map((n) => fmt(p.a * Math.pow(p.q, n - 1), 2)).join(',\\ ')},\ldots$`
        : t`$a_n=a_1+(n-1)r$: $${[1, 2, 3, 4, 5].map((n) => fmt(p.a + (n - 1) * p.r, 2)).join(',\\ ')},\ldots$`,
  });

const systemLab = () =>
  plot({
    view: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
    equalAspect: true,
    params: [
      { key: 'm', label: 'a', min: -3, max: 3, step: 0.25, value: 1, color: C.p3 },
      { key: 'k', label: 'c', min: -4, max: 4, step: 0.5, value: 3, color: C.p3 },
    ],
    render: ({ p }: any) => {
      // L1: y = -x + 1 ; L2: y = m x + k
      const dm = p.m + 1;
      const sol = Math.abs(dm) > 1e-9 ? (1 - p.k) / dm : null;
      return (
        <>
          <InfLine x1={0} y1={1} x2={1} y2={0} color={C.p2} />
          <InfLine x1={0} y1={p.k} x2={1} y2={p.k + p.m} color={C.p3} />
          {sol !== null ? <Pt x={sol} y={-sol + 1} color={C.gold} label="S" /> : null}
        </>
      );
    },
    info: ({ p }: any) => {
      const dm = p.m + 1;
      if (Math.abs(dm) < 1e-9) return Math.abs(p.k - 1) < 1e-9 ? '**Coincidentes**: infinitas soluções (SPI)' : '**Paralelas**: nenhuma solução (SI)';
      const x = (1 - p.k) / dm;
      return t`Solução única (SPD): $x=${fmt(x, 2)},\ y=${fmt(1 - x, 2)}$`;
    },
  });

export const algebra2: Unit = {
  id: 'f-alg2',
  title: 'Álgebra II',
  subtitle: 'Progressões, matrizes e sistemas lineares',
  icon: '🔲',
  source: 'Competências Básicas · Álgebra II',
  guide: t`PA cresce somando (linear), PG cresce multiplicando (exponencial). Matrizes organizam sistemas lineares — que você vai resolver numericamente em Cálculo Numérico.`,
  lessons: [
    {
      id: 'f-alg2-pa',
      title: 'Progressão aritmética',
      cards: [
        {
          title: 'Soma sempre a mesma razão',
          body: t`Numa **PA**, cada termo é o anterior **mais** a razão $r$:

$$a_n=a_1+(n-1)\,r$$

O gráfico dos termos fica sobre uma **reta**. Mude $a_1$ e $r$:`,
          visual: seqLab(false),
        },
        {
          title: 'O truque de Gauss',
          body: t`Somando o primeiro com o último, o segundo com o penúltimo... todas as duplas dão o mesmo valor! Por isso:

$$S_n=\frac{(a_1+a_n)\,n}{2}$$`,
          example: t`$1+2+\cdots+100=\frac{(1+100)\cdot100}{2}=5050$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a1 = randInt(rng, -5, 10);
          const r = randNZ(rng, -4, 6);
          const n = randInt(rng, 8, 30);
          return num(t`Numa PA com $a_1=${a1}$ e razão $r=${r}$, quanto vale $a_{${n}}$?`, a1 + (n - 1) * r, t`$a_{${n}}=${a1}+(${n}-1)\cdot(${r})=${a1 + (n - 1) * r}$.`);
        }),
        gen((rng) => {
          const a1 = randInt(rng, 1, 10);
          const r = randInt(rng, 1, 5);
          const n = randInt(rng, 5, 20);
          const an = a1 + (n - 1) * r;
          return num(t`Calcule a soma dos $${n}$ primeiros termos da PA $${a1},\ ${a1 + r},\ ${a1 + 2 * r},\ \ldots$`, ((a1 + an) * n) / 2, t`$a_{${n}}=${an}$ e $S=\frac{(${a1}+${an})\cdot${n}}{2}=${((a1 + an) * n) / 2}$.`);
        }),
        mcqS(t`Qual sequência é uma PA?`, t`$7,\ 4,\ 1,\ -2,\ \ldots$`, [t`$1,\ 2,\ 4,\ 8,\ \ldots$`, t`$1,\ 4,\ 9,\ 16,\ \ldots$`, t`$2,\ 3,\ 5,\ 8,\ \ldots$`], t`Diferença constante $-3$.`),
        tf(t`Numa PA de razão negativa, os termos diminuem.`, true),
        inter(t`Ajuste $a_1$ e $r$ para formar a PA $3,\ 5,\ 7,\ 9,\ldots$`, 'plot', seqLab(false).props, (v: any) => v && near(v.p.a, 3, 0.01) && near(v.p.r, 2, 0.01), t`$a_1=3$, $r=2$`),
        num(t`Os números $x-1$, $x+3$ e $2x$ estão em PA nessa ordem. Quanto vale $x$?`, 7, t`Na PA, o termo do meio é a média dos vizinhos: $2(x+3)=(x-1)+2x\Rightarrow 2x+6=3x-1\Rightarrow x=7$.`),
      ],
    },
    {
      id: 'f-alg2-pg',
      title: 'Progressão geométrica',
      cards: [
        {
          title: 'Multiplica sempre pela mesma razão',
          body: t`Numa **PG**, cada termo é o anterior **vezes** a razão $q$:

$$a_n=a_1\,q^{\,n-1}$$

Com $q>1$ o crescimento é **exponencial**; com $0<q<1$ os termos encolhem.`,
          visual: seqLab(true),
        },
        {
          title: 'Somas de PG',
          body: t`Soma finita:
$$S_n=a_1\,\frac{q^n-1}{q-1}$$

Se $|q|<1$, a soma **infinita** converge:
$$S_\infty=\frac{a_1}{1-q}$$`,
          example: t`$1+\frac12+\frac14+\frac18+\cdots=\frac{1}{1-\frac12}=2$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a1 = randInt(rng, 1, 5);
          const q = pick(rng, [2, 3, -2]);
          const n = randInt(rng, 4, 7);
          return num(t`Numa PG com $a_1=${a1}$ e $q=${q}$, quanto vale $a_{${n}}$?`, a1 * Math.pow(q, n - 1), t`$a_{${n}}=${a1}\cdot(${q})^{${n - 1}}=${a1 * Math.pow(q, n - 1)}$.`);
        }),
        mcqS(t`Qual é a razão da PG $81,\ 27,\ 9,\ 3,\ldots$?`, t`$\frac{1}{3}$`, [t`$3$`, t`$-54$`, t`$\frac{1}{9}$`], t`$\frac{27}{81}=\frac13$.`),
        num(t`Calcule $S_\infty$ para $4+2+1+\frac12+\cdots$`, 8, t`$a_1=4$, $q=\frac12$: $S_\infty=\frac{4}{1-\frac12}=8$.`),
        gen((rng) => {
          const a1 = randInt(rng, 1, 3);
          const n = randInt(rng, 4, 8);
          return num(t`Some os $${n}$ primeiros termos da PG $${a1},\ ${2 * a1},\ ${4 * a1},\ldots$`, a1 * (Math.pow(2, n) - 1), t`$S_{${n}}=${a1}\cdot\frac{2^{${n}}-1}{2-1}=${a1 * (Math.pow(2, n) - 1)}$.`);
        }),
        tf(t`Juros compostos formam uma PG.`, true, t`O montante é multiplicado por $(1+i)$ a cada período: razão $q=1+i$.`),
        inter(t`Ajuste para formar a PG $2,\ 3,\ 4{,}5,\ 6{,}75,\ldots$`, 'plot', seqLab(true).props, (v: any) => v && near(v.p.a, 2, 0.01) && near(v.p.q, 1.5, 0.01), t`$a_1=2$, $q=1{,}5$`),
      ],
    },
    {
      id: 'f-alg2-mat',
      title: 'Matrizes e determinantes',
      cards: [
        {
          title: 'Tabelas de números',
          body: t`Uma matriz $m\times n$ tem $m$ linhas e $n$ colunas. O elemento $a_{ij}$ está na linha $i$, coluna $j$.

**Soma**: elemento a elemento (mesmas dimensões).

**Produto** $AB$: elemento $(i,j)$ = linha $i$ de $A$ "vezes" coluna $j$ de $B$:

$$\begin{pmatrix}1&2\\3&4\end{pmatrix}\begin{pmatrix}5&6\\7&8\end{pmatrix}=\begin{pmatrix}1\cdot5+2\cdot7&1\cdot6+2\cdot8\\3\cdot5+4\cdot7&3\cdot6+4\cdot8\end{pmatrix}=\begin{pmatrix}19&22\\43&50\end{pmatrix}$$`,
          tip: t`Só dá para multiplicar $A_{m\times n}\cdot B_{n\times p}$ (colunas de $A$ = linhas de $B$). E em geral $AB\neq BA$!`,
        },
        {
          title: 'Determinante',
          body: t`Para $2\times2$: diagonal principal menos secundária.
$$\det\begin{pmatrix}a&b\\c&d\end{pmatrix}=ad-bc$$

Para $3\times3$, use a **regra de Sarrus** (repita as duas primeiras colunas e some os produtos das diagonais).

Se $\det A\ne0$, $A$ é **inversível**.`,
          example: t`$\det\begin{pmatrix}3&1\\2&4\end{pmatrix}=12-2=10$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = randInt(rng, -5, 6);
          const b = randInt(rng, -5, 6);
          const c = randInt(rng, -5, 6);
          const d = randInt(rng, -5, 6);
          return num(t`Calcule $\det\begin{pmatrix}${a}&${b}\\${c}&${d}\end{pmatrix}$.`, a * d - b * c, t`$${a}\cdot${d}-(${b})\cdot(${c})=${a * d - b * c}$.`);
        }),
        gen((rng) => {
          const A = [randInt(rng, 0, 4), randInt(rng, 0, 4), randInt(rng, 0, 4), randInt(rng, 0, 4)];
          const B = [randInt(rng, 0, 4), randInt(rng, 0, 4), randInt(rng, 0, 4), randInt(rng, 0, 4)];
          const c11 = A[0] * B[0] + A[1] * B[2];
          return num(t`Sendo $A=\begin{pmatrix}${A[0]}&${A[1]}\\${A[2]}&${A[3]}\end{pmatrix}$ e $B=\begin{pmatrix}${B[0]}&${B[1]}\\${B[2]}&${B[3]}\end{pmatrix}$, qual é o elemento $c_{11}$ de $C=AB$?`, c11, t`Linha 1 de $A$ · coluna 1 de $B$: $${A[0]}\cdot${B[0]}+${A[1]}\cdot${B[2]}=${c11}$.`);
        }),
        mcq(t`Se $A$ é $2\times3$ e $B$ é $3\times4$, o produto $AB$ é:`, ['$2\\times4$', '$3\\times3$', '$4\\times2$', 'não existe'], 0, t`$(2\times\underline3)\cdot(\underline3\times4)\to 2\times4$.`),
        tf(t`Para quaisquer matrizes quadradas, $AB=BA$.`, false, t`O produto de matrizes **não** é comutativo em geral.`),
        num(t`Calcule $\det\begin{pmatrix}1&2&0\\0&1&3\\2&0&1\end{pmatrix}$ (Sarrus).`, 13, t`Diagonais principais: $1\cdot1\cdot1+2\cdot3\cdot2+0\cdot0\cdot0=13$. Secundárias: $0\cdot1\cdot2+1\cdot3\cdot0+2\cdot0\cdot1=0$. $\det=13-0=13$.`),
        mcqS(t`A matriz $\begin{pmatrix}2&4\\1&2\end{pmatrix}$ é inversível?`, 'Não, pois det = 0', ['Sim, pois det = 8', 'Sim, sempre', 'Não, pois não é diagonal'], t`$\det=4-4=0$: as linhas são proporcionais.`),
      ],
    },
    {
      id: 'f-alg2-sis',
      title: 'Sistemas lineares',
      cards: [
        {
          title: 'O encontro de retas',
          body: t`Um sistema $2\times2$ é o encontro de duas retas. Fixe a reta azul $x+y=1$ e mexa na laranja $y=ax+c$:

• se cruzam: **uma** solução (SPD)
• paralelas: **nenhuma** (SI)
• coincidentes: **infinitas** (SPI)`,
          visual: systemLab(),
        },
        {
          title: 'Resolvendo',
          body: t`**Substituição**: isole uma variável e substitua.
**Adição/eliminação**: some equações multiplicadas para sumir uma variável.

$$\begin{cases}x+y=5\\x-y=1\end{cases}\Rightarrow 2x=6\Rightarrow x=3,\ y=2$$`,
          tip: t`Regra de Cramer: $x=\frac{\det A_x}{\det A}$. Se $\det A=0$, o sistema não tem solução única.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const x = randInt(rng, -4, 6);
          const y = randInt(rng, -4, 6);
          return num(t`Resolva $\begin{cases}x+y=${x + y}\\x-y=${x - y}\end{cases}$. Quanto vale $x$?`, x, t`Somando: $2x=${2 * x}\Rightarrow x=${x}$ (e $y=${y}$).`);
        }),
        gen((rng) => {
          const x = randInt(rng, 1, 5);
          const y = randInt(rng, 1, 5);
          return num(t`Resolva $\begin{cases}2x+y=${2 * x + y}\\x+3y=${x + 3 * y}\end{cases}$. Quanto vale $y$?`, y, t`Da 1ª: $y=${2 * x + y}-2x$. Substituindo: $x+3(${2 * x + y}-2x)=${x + 3 * y}\Rightarrow x=${x}$, $y=${y}$.`);
        }),
        mcq(t`O sistema $\begin{cases}x+2y=3\\2x+4y=7\end{cases}$ é:`, ['impossível (SI)', 'possível e determinado', 'possível e indeterminado', 'tem solução $x=1, y=1$'], 0, t`A 2ª equação deveria ser o dobro da 1ª ($6$), mas é $7$: retas paralelas.`),
        inter(t`Mexa na reta laranja até que o sistema **não tenha solução**.`, 'plot', systemLab().props, (v: any) => v && near(v.p.m, -1, 0.01) && !near(v.p.k, 1, 0.01), t`inclinação $a=-1$ (paralela) e $c\ne1$`),
        tf(t`Se o determinante da matriz dos coeficientes é zero, o sistema pode ter infinitas soluções ou nenhuma.`, true),
        order(t`Ordene os passos do método da adição para $\begin{cases}2x+3y=8\\x-y=-1\end{cases}$:`, [t`Multiplicar a 2ª equação por $3$: $3x-3y=-3$`, t`Somar com a 1ª: $5x=5$`, t`Concluir $x=1$`, t`Substituir: $y=x+1=2$`]),
      ],
    },
  ],
};
