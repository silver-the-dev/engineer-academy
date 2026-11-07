import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, order, inter, plot, rmcq, near } from '../../helpers';
import { InfLine, Pt, RectW } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, term } from '../../../lib/random';

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

/** Matrix in TeX (pmatrix). */
const mat = (rows: number[][]) => `\\begin{pmatrix}${rows.map((r) => r.join('&')).join('\\\\')}\\end{pmatrix}`;
const seq = (xs: (number | string)[]) => xs.join(',\\ ') + ',\\ \\ldots';
const r4 = (rng: () => number, lo: number, hi: number) => [randInt(rng, lo, hi), randInt(rng, lo, hi), randInt(rng, lo, hi), randInt(rng, lo, hi)];

export const algebra2: UnitDef = {
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
      parts: [
        {
          card: {
            title: 'Soma sempre a mesma razão',
            body: t`Numa **PA**, cada termo é o anterior **mais** a razão $r$:

$$a_n=a_1+(n-1)\,r$$

O gráfico dos termos fica sobre uma **reta**. Mude $a_1$ e $r$:`,
            visual: seqLab(false),
          },
          exercises: [
            mcqS(t`Qual sequência é uma PA?`, t`$7,\ 4,\ 1,\ -2,\ \ldots$`, [t`$1,\ 2,\ 4,\ 8,\ \ldots$`, t`$1,\ 4,\ 9,\ 16,\ \ldots$`, t`$2,\ 3,\ 5,\ 8,\ \ldots$`], t`Diferença constante $-3$.`),
            tf(t`Numa PA de razão negativa, os termos diminuem.`, true, t`Somar um número negativo a cada passo faz a sequência descer.`),
            gen((rng) => {
              const a1 = randInt(rng, -5, 12);
              const r = randNZ(rng, -5, 7);
              return num(t`Qual é a razão da PA $${seq([a1, a1 + r, a1 + 2 * r, a1 + 3 * r])}$?`, r, t`$r=a_2-a_1=${a1 + r}-(${a1})=${r}$.`);
            }),
            gen((rng) => {
              const a1 = randInt(rng, -5, 12);
              const r = randNZ(rng, -5, 7);
              return num(t`Qual é o próximo termo da PA $${seq([a1, a1 + r, a1 + 2 * r, a1 + 3 * r])}$?`, a1 + 4 * r, t`Razão $${r}$: $${a1 + 3 * r}+(${r})=${a1 + 4 * r}$.`);
            }),
            gen((rng) => {
              const a1 = randInt(rng, -5, 10);
              const r = randNZ(rng, -4, 6);
              const n = randInt(rng, 8, 30);
              return num(t`Numa PA com $a_1=${a1}$ e razão $r=${r}$, quanto vale $a_{${n}}$?`, a1 + (n - 1) * r, t`$a_{${n}}=${a1}+(${n}-1)\cdot(${r})=${a1 + (n - 1) * r}$.`);
            }),
            inter(t`Ajuste $a_1$ e $r$ para formar a PA $3,\ 5,\ 7,\ 9,\ldots$`, 'plot', seqLab(false).props, (v: any) => v && near(v.p.a, 3, 0.01) && near(v.p.r, 2, 0.01), t`$a_1=3$, $r=2$`),
            gen((rng) => {
              const a1 = randInt(rng, 1, 9);
              const r = randInt(rng, 2, 6);
              const n = randInt(rng, 10, 40);
              const X = a1 + (n - 1) * r;
              return num(t`Na PA $${seq([a1, a1 + r, a1 + 2 * r])}$, qual é a posição do termo que vale $${X}$?`, n, t`$${X}=${a1}+(n-1)\cdot${r}\Rightarrow n-1=${(X - a1) / r}\Rightarrow n=${n}$.`);
            }),
            gen((rng) => {
              const a1 = randInt(rng, 2, 9);
              const r = randInt(rng, 3, 7);
              const n = randInt(rng, 15, 40);
              const last = a1 + (n - 1) * r;
              return num(t`Quantos termos tem a PA $${a1},\ ${a1 + r},\ ${a1 + 2 * r},\ \ldots,\ ${last}$?`, n, t`$${last}=${a1}+(n-1)\cdot${r}\Rightarrow n=\frac{${last}-${a1}}{${r}}+1=${n}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Termos que faltam',
            body: t`Conhecendo **dois** termos quaisquer, achamos a razão:

$$a_n=a_m+(n-m)\,r$$

Ex.: $a_3=10$ e $a_7=22$: $22=10+4r\Rightarrow r=3$.

Em três termos seguidos de uma PA, o do meio é a **média** dos vizinhos: $b=\frac{a+c}{2}$.`,
            tip: t`"Inserir $k$ meios aritméticos" entre $a$ e $b$ é montar uma PA com $k+2$ termos: $b=a+(k+1)\,r$.`,
          },
          exercises: [
            tf(t`Os números $4,\ x,\ 10$ estão em PA quando $x=7$.`, true, t`O termo do meio é a média: $\frac{4+10}{2}=7$.`),
            gen((rng) => {
              const a = randInt(rng, -6, 10);
              const r = randNZ(rng, -6, 8);
              return num(t`Os números $${a},\ x,\ ${a + 2 * r}$ estão em PA. Quanto vale $x$?`, a + r, t`$x=\frac{${a}+(${a + 2 * r})}{2}=${a + r}$.`);
            }),
            gen((rng) => {
              const m = randInt(rng, 2, 5);
              const n = m + randInt(rng, 2, 6);
              const r = randNZ(rng, -5, 6);
              const am = randInt(rng, -10, 20);
              return num(t`Numa PA, $a_{${m}}=${am}$ e $a_{${n}}=${am + (n - m) * r}$. Qual é a razão?`, r, t`$a_{${n}}=a_{${m}}+${n - m}r\Rightarrow ${n - m}r=${(n - m) * r}\Rightarrow r=${r}$.`);
            }),
            gen((rng) => {
              const a1 = randInt(rng, -8, 10);
              const r = randNZ(rng, -4, 6);
              const m = randInt(rng, 3, 6);
              const n = m + randInt(rng, 2, 5);
              return num(t`Numa PA, $a_{${m}}=${a1 + (m - 1) * r}$ e $a_{${n}}=${a1 + (n - 1) * r}$. Quanto vale $a_1$?`, a1, t`Razão: $\frac{${a1 + (n - 1) * r}-(${a1 + (m - 1) * r})}{${n - m}}=${r}$. Então $a_1=a_{${m}}-${m - 1}\cdot(${r})=${a1}$.`);
            }),
            num(t`Os números $x-1$, $x+3$ e $2x$ estão em PA nessa ordem. Quanto vale $x$?`, 7, t`O termo do meio é a média dos vizinhos: $2(x+3)=(x-1)+2x\Rightarrow 2x+6=3x-1\Rightarrow x=7$.`),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              const r = randInt(rng, 2, 7);
              const a = randInt(rng, 1, 10);
              const b = a + (k + 1) * r;
              return num(t`Inserindo $${k}$ meios aritméticos entre $${a}$ e $${b}$, qual é a razão da PA formada?`, r, t`São $${k + 2}$ termos: $${b}=${a}+${k + 1}r\Rightarrow r=\frac{${b - a}}{${k + 1}}=${r}$.`);
            }),
            gen((rng) => {
              const a1 = randInt(rng, 1, 6);
              const r = randInt(rng, 2, 5);
              return num(t`Uma PA tem $a_1=${a1}$ e $a_{10}=${a1 + 9 * r}$. Quanto vale $a_{20}$?`, a1 + 19 * r, t`$9r=${9 * r}\Rightarrow r=${r}$. Então $a_{20}=${a1}+19\cdot${r}=${a1 + 19 * r}$.`);
            }),
            num(t`Três números em PA somam $15$ e o produto deles é $80$. Qual é o **maior**?`, 8, t`Chame-os de $x-r,\ x,\ x+r$. Soma $3x=15\Rightarrow x=5$. Produto $(5-r)\cdot5\cdot(5+r)=80\Rightarrow 25-r^2=16\Rightarrow r=3$. Números: $2,\ 5,\ 8$.`),
          ],
        },
        {
          card: {
            title: 'O truque de Gauss',
            body: t`Somando o primeiro com o último, o segundo com o penúltimo... todas as duplas dão o mesmo valor! Por isso:

$$S_n=\frac{(a_1+a_n)\,n}{2}$$`,
            example: t`$1+2+\cdots+100=\frac{(1+100)\cdot100}{2}=5050$.`,
            tip: t`Soma dos $n$ primeiros ímpares: $1+3+5+\cdots=n^2$.`,
          },
          exercises: [
            num(t`Calcule $1+2+3+\cdots+50$.`, 1275, t`$\frac{(1+50)\cdot50}{2}=1275$.`),
            gen((rng) => {
              const n = pick(rng, [20, 30, 40, 60, 80, 200]);
              return num(t`Calcule $1+2+3+\cdots+${n}$.`, (n * (n + 1)) / 2, t`$\frac{(1+${n})\cdot${n}}{2}=${(n * (n + 1)) / 2}$.`);
            }),
            gen((rng) => {
              const a1 = randInt(rng, 1, 10);
              const r = randInt(rng, 1, 5);
              const n = randInt(rng, 5, 20);
              const an = a1 + (n - 1) * r;
              return num(t`Calcule a soma dos $${n}$ primeiros termos da PA $${seq([a1, a1 + r, a1 + 2 * r])}$`, ((a1 + an) * n) / 2, t`$a_{${n}}=${an}$ e $S=\frac{(${a1}+${an})\cdot${n}}{2}=${((a1 + an) * n) / 2}$.`);
            }),
            tf(t`$2+4+6+\cdots+20=110$`, true, t`São $10$ termos: $\frac{(2+20)\cdot10}{2}=110$.`),
            gen((rng) => {
              const n = randInt(rng, 5, 30);
              return num(t`Quanto vale a soma dos $${n}$ primeiros números ímpares, $1+3+5+\cdots$?`, n * n, t`O $${n}$º ímpar é $${2 * n - 1}$: $\frac{(1+${2 * n - 1})\cdot${n}}{2}=${n}^2=${n * n}$.`);
            }),
            gen((rng) => {
              const a1 = randInt(rng, 1, 3);
              const r = pick(rng, [0.5, 1]);
              const n = pick(rng, [10, 20, 30]);
              const an = a1 + (n - 1) * r;
              return num(t`Um atleta corre $${a1}$ km no 1º dia e, a cada dia, $${fmt(r)}$ km a mais que no anterior. Quantos km ele corre no total em $${n}$ dias?`, ((a1 + an) * n) / 2, t`No último dia: $${fmt(an)}$ km. Total: $\frac{(${a1}+${fmt(an)})\cdot${n}}{2}=${fmt(((a1 + an) * n) / 2)}$ km.`, { unit: 'km' });
            }),
            num(t`Quanto vale a soma de todos os múltiplos de $3$ entre $1$ e $100$?`, 1683, t`$3+6+\cdots+99$ tem $33$ termos: $\frac{(3+99)\cdot33}{2}=1683$.`),
            num(t`Quantos termos de $1+3+5+\cdots$ precisam ser somados para dar $400$?`, 20, t`Soma dos $n$ primeiros ímpares $=n^2=400\Rightarrow n=20$.`),
          ],
        },
      ],
    },
    {
      id: 'f-alg2-pg',
      title: 'Progressão geométrica',
      parts: [
        {
          card: {
            title: 'Multiplica sempre pela mesma razão',
            body: t`Numa **PG**, cada termo é o anterior **vezes** a razão $q$:

$$a_n=a_1\,q^{\,n-1}$$

Com $q>1$ o crescimento é **exponencial**; com $0<q<1$ os termos encolhem.`,
            visual: seqLab(true),
          },
          exercises: [
            mcqS(t`Qual sequência é uma PG?`, t`$3,\ 6,\ 12,\ 24,\ \ldots$`, [t`$3,\ 6,\ 9,\ 12,\ \ldots$`, t`$1,\ 4,\ 9,\ 16,\ \ldots$`, t`$2,\ 3,\ 5,\ 8,\ \ldots$`], t`Cada termo é o anterior vezes $2$.`),
            mcqS(t`Qual é a razão da PG $81,\ 27,\ 9,\ 3,\ldots$?`, t`$\frac{1}{3}$`, [t`$3$`, t`$-54$`, t`$\frac{1}{9}$`], t`$\frac{27}{81}=\frac13$.`),
            gen((rng) => {
              const a1 = randInt(rng, 1, 5);
              const q = pick(rng, [2, 3, -2, -3]);
              return num(t`Qual é o próximo termo da PG $${seq([a1, a1 * q, a1 * q * q])}$?`, a1 * q ** 3, t`Razão $q=${q}$: $${a1 * q * q}\cdot(${q})=${a1 * q ** 3}$.`);
            }),
            gen((rng) => {
              const a1 = randInt(rng, 1, 5);
              const q = pick(rng, [2, 3, -2]);
              const n = randInt(rng, 4, 7);
              return num(t`Numa PG com $a_1=${a1}$ e $q=${q}$, quanto vale $a_{${n}}$?`, a1 * Math.pow(q, n - 1), t`$a_{${n}}=${a1}\cdot(${q})^{${n - 1}}=${a1 * Math.pow(q, n - 1)}$.`);
            }),
            tf(t`Juros compostos formam uma PG.`, true, t`O montante é multiplicado por $(1+i)$ a cada período: razão $q=1+i$.`),
            inter(t`Ajuste para formar a PG $2,\ 3,\ 4{,}5,\ 6{,}75,\ldots$`, 'plot', seqLab(true).props, (v: any) => v && near(v.p.a, 2, 0.01) && near(v.p.q, 1.5, 0.01), t`$a_1=2$, $q=1{,}5$`),
            gen((rng) => {
              const N = pick(rng, [100, 200, 500]);
              const h = randInt(rng, 3, 8);
              return num(t`Uma cultura começa com $${N}$ bactérias e dobra a cada hora. Quantas haverá depois de $${h}$ horas?`, N * 2 ** h, t`PG de razão $2$: $${N}\cdot2^{${h}}=${N * 2 ** h}$.`);
            }),
            gen((rng) => {
              const q = pick(rng, [2, 3, -2]);
              const a2 = pick(rng, [1, 2, 3]) * q;
              return num(t`Numa PG, $a_2=${a2}$ e $a_5=${a2 * q ** 3}$. Qual é a razão?`, q, t`$a_5=a_2\cdot q^3\Rightarrow q^3=\frac{${a2 * q ** 3}}{${a2}}=${q ** 3}\Rightarrow q=${q}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Somas finitas',
            body: t`A soma dos $n$ primeiros termos de uma PG ($q\neq1$) é:

$$S_n=a_1\,\frac{q^n-1}{q-1}$$`,
            example: t`$1+2+4+\cdots+128$ tem $8$ termos: $S_8=\frac{2^8-1}{2-1}=255$.`,
            tip: t`Se $q=1$ a fórmula divide por zero, mas aí todos os termos são iguais e $S_n=n\cdot a_1$.`,
          },
          exercises: [
            num(t`Calcule $1+3+9+27+81$.`, 121, t`$a_1=1$, $q=3$, $n=5$: $\frac{3^5-1}{3-1}=\frac{242}{2}=121$.`),
            gen((rng) => {
              const a1 = randInt(rng, 1, 3);
              const n = randInt(rng, 4, 8);
              return num(t`Some os $${n}$ primeiros termos da PG $${seq([a1, 2 * a1, 4 * a1])}$`, a1 * (Math.pow(2, n) - 1), t`$S_{${n}}=${a1}\cdot\frac{2^{${n}}-1}{2-1}=${a1 * (Math.pow(2, n) - 1)}$.`);
            }),
            tf(t`A fórmula $S_n=a_1\frac{q^n-1}{q-1}$ funciona para $q=1$.`, false, t`Com $q=1$ o denominador é zero. Nesse caso basta fazer $S_n=n\cdot a_1$.`),
            gen((rng) => {
              const a1 = pick(rng, [2, 4]);
              const n = randInt(rng, 3, 6);
              return num(t`Some os $${n}$ primeiros termos da PG de $a_1=${a1}$ e $q=3$.`, (a1 * (3 ** n - 1)) / 2, t`$S_{${n}}=${a1}\cdot\frac{3^{${n}}-1}{3-1}=${(a1 * (3 ** n - 1)) / 2}$.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 4, 7);
              return num(t`Uma corrente começa com $1$ pessoa, que manda a mensagem para $3$; cada uma manda para mais $3$, e assim por diante. Quantas pessoas no total receberam ou mandaram a mensagem nas $${n}$ primeiras "rodadas" (contando a primeira pessoa)?`, (3 ** n - 1) / 2, t`$1+3+9+\cdots$ com $${n}$ termos: $\frac{3^{${n}}-1}{2}=${(3 ** n - 1) / 2}$.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 3, 7);
              return num(t`Calcule $64+32+16+\cdots$ somando só os $${n}$ primeiros termos.`, 128 * (1 - 2 ** -n), t`$a_1=64$, $q=\frac12$: $S_{${n}}=64\cdot\frac{1-(1/2)^{${n}}}{1-1/2}=${fmt(128 * (1 - 2 ** -n))}$.`);
            }),
            mcqS(t`Quanto vale $1+2+4+\cdots+2^9$?`, '$1023$', ['$1024$', '$512$', '$2047$'], t`São $10$ termos: $2^{10}-1=1023$.`),
            num(t`Quantos termos de $3+6+12+\cdots$ precisam ser somados para dar $189$?`, 6, t`$3\cdot\frac{2^n-1}{1}=189\Rightarrow 2^n-1=63\Rightarrow 2^n=64\Rightarrow n=6$.`),
          ],
        },
        {
          card: {
            title: 'Soma infinita',
            body: t`Se $|q|<1$, os termos encolhem tão rápido que a soma **infinita** converge para um número:

$$S_\infty=\frac{a_1}{1-q}$$`,
            example: t`$1+\frac12+\frac14+\frac18+\cdots=\frac{1}{1-\frac12}=2$.`,
            tip: t`Dízimas periódicas são PGs infinitas: $0{,}333\ldots=\frac{3}{10}+\frac{3}{100}+\cdots=\frac{3/10}{1-1/10}=\frac13$.`,
          },
          exercises: [
            tf(t`A soma $1+2+4+8+\cdots$ converge para um número.`, false, t`Com $q=2$ (maior que 1) os termos crescem sem parar: a soma vai ao infinito.`),
            num(t`Calcule $S_\infty$ para $4+2+1+\frac12+\cdots$`, 8, t`$a_1=4$, $q=\frac12$: $S_\infty=\frac{4}{1-\frac12}=8$.`),
            gen((rng) => {
              const [q, qt, k] = pick(rng, [[1 / 2, '\\frac12', 2], [1 / 3, '\\frac13', 3], [1 / 4, '\\frac14', 4]] as const);
              const a1 = (k - 1) * randInt(rng, 1, 5);
              return num(t`Calcule a soma infinita da PG com $a_1=${a1}$ e $q=${qt}$.`, a1 / (1 - q), t`$S_\infty=\frac{${a1}}{1-${qt}}=${fmt(a1 / (1 - q))}$.`);
            }),
            mcq(t`Para qual razão a soma infinita de uma PG **converge**?`, ['$q=0{,}9$', '$q=1{,}1$', '$q=-2$', '$q=1$'], 0, t`Só converge quando $|q|<1$.`),
            gen((rng) => {
              const a1 = pick(rng, [3, 6, 9, 12]);
              return num(t`Calcule $${a1}-${fmt(a1 / 2)}+${fmt(a1 / 4)}-\cdots$ (PG infinita de razão $-\frac12$).`, a1 / 1.5, t`$S_\infty=\frac{${a1}}{1-(-\frac12)}=\frac{${a1}}{1{,}5}=${fmt(a1 / 1.5)}$.`);
            }),
            mcqS(t`Escreva a dízima $0{,}777\ldots$ como fração.`, t`$\dfrac{7}{9}$`, [t`$\dfrac{7}{10}$`, t`$\dfrac{77}{100}$`, t`$\dfrac{7}{99}$`], t`$\frac{7}{10}+\frac{7}{100}+\cdots=\frac{7/10}{1-1/10}=\frac{7}{9}$.`),
            gen((rng) => {
              const h = pick(rng, [2, 4, 5, 10]);
              return num(t`Uma bola cai de $${h}$ m e, a cada quique, sobe até a **metade** da altura anterior. Qual a distância total (subidas e descidas) que ela percorre até parar?`, 3 * h, t`Descida inicial $${h}$; depois sobe e desce $${fmt(h / 2)}+${fmt(h / 2)}$, $${fmt(h / 4)}+${fmt(h / 4)}$… Total: $${h}+2\cdot\frac{${fmt(h / 2)}}{1-\frac12}=${3 * h}$ m.`, { unit: 'm' });
            }),
            num(t`Uma PG infinita tem $a_1=8$ e soma $S_\infty=12$. Qual é a razão? (pode responder em fração)`, 1 / 3, t`$\frac{8}{1-q}=12\Rightarrow 1-q=\frac23\Rightarrow q=\frac13$.`, { tol: 0.002 }),
          ],
        },
      ],
    },
    {
      id: 'f-alg2-mat',
      title: 'Matrizes e determinantes',
      parts: [
        {
          card: {
            title: 'Tabelas de números',
            body: t`Uma matriz $m\times n$ tem $m$ linhas e $n$ colunas. O elemento $a_{ij}$ está na linha $i$, coluna $j$.

• **Soma**: elemento a elemento (mesmas dimensões)
• **Número vezes matriz**: multiplica todos os elementos
• **Transposta** $A^T$: troca linhas por colunas`,
            example: t`$2\cdot${mat([[1, 0], [3, -2]])}=${mat([[2, 0], [6, -4]])}$ e $${mat([[1, 2, 3], [4, 5, 6]])}^T=${mat([[1, 4], [2, 5], [3, 6]])}$.`,
          },
          exercises: [
            mcq(t`Qual é a dimensão de $${mat([[1, 4, 0], [2, -1, 5]])}$?`, ['$2\\times3$', '$3\\times2$', '$2\\times2$', '$6\\times1$'], 0, t`$2$ linhas e $3$ colunas: $2\times3$ (sempre linhas primeiro).`),
            gen((rng) => {
              const M = [r4(rng, -9, 9).slice(0, 3), r4(rng, -9, 9).slice(0, 3), r4(rng, -9, 9).slice(0, 3)];
              const i = randInt(rng, 1, 3);
              const j = randInt(rng, 1, 3);
              return num(t`Em $A=${mat(M)}$, quanto vale $a_{${i}${j}}$?`, M[i - 1][j - 1], t`Linha $${i}$, coluna $${j}$: $${M[i - 1][j - 1]}$.`);
            }),
            tf(t`Dá para somar uma matriz $2\times3$ com uma $3\times2$.`, false, t`A soma é elemento a elemento: as dimensões precisam ser iguais.`),
            gen((rng) => {
              const A = r4(rng, -5, 6);
              const B = r4(rng, -5, 6);
              const S = A.map((x, k) => x + B[k]);
              const m2 = (v: number[]) => `$${mat([[v[0], v[1]], [v[2], v[3]]])}$`;
              return rmcq(rng, t`Calcule $${mat([[A[0], A[1]], [A[2], A[3]]])}+${mat([[B[0], B[1]], [B[2], B[3]]])}$.`, m2(S), [m2(A.map((x, k) => x - B[k])), m2(A.map((x, k) => x * B[k])), m2([S[0], S[2], S[1], S[3]]), m2(S.map((x) => x + 1))], t`Some posição a posição.`);
            }),
            gen((rng) => {
              const k = pick(rng, [-2, 2, 3, -3, 4]);
              const A = r4(rng, -4, 5);
              const m2 = (v: number[]) => `$${mat([[v[0], v[1]], [v[2], v[3]]])}$`;
              return rmcq(rng, t`Calcule $${k}\cdot${mat([[A[0], A[1]], [A[2], A[3]]])}$.`, m2(A.map((x) => k * x)), [m2([k * A[0], A[1], A[2], A[3]]), m2(A.map((x) => x + k)), m2([k * A[0], k * A[1], A[2], A[3]]), m2(A.map((x) => -k * x))], t`O número multiplica **todos** os elementos.`);
            }),
            gen((rng) => {
              const a = r4(rng, -5, 9);
              const b = r4(rng, -5, 9);
              const M = [[a[0], a[1], a[2]], [b[0], b[1], b[2]]];
              const T = [[a[0], b[0]], [a[1], b[1]], [a[2], b[2]]];
              return rmcq(rng, t`Qual é a transposta de $${mat(M)}$?`, `$${mat(T)}$`, [`$${mat([[a[2], b[2]], [a[1], b[1]], [a[0], b[0]]])}$`, `$${mat([[b[0], a[0]], [b[1], a[1]], [b[2], a[2]]])}$`, `$${mat([[a[0], a[1]], [a[2], b[0]], [b[1], b[2]]])}$`], t`A 1ª linha vira a 1ª coluna, e a 2ª linha vira a 2ª coluna.`);
            }),
            gen((rng) => {
              const p = randInt(rng, 1, 3);
              const q = randInt(rng, 1, 3);
              const i = randInt(rng, 2, 3);
              const j = randInt(rng, 1, 3);
              return num(t`A matriz $A=(a_{ij})_{3\times3}$ é definida por $a_{ij}=${p === 1 ? '' : p}i+${q === 1 ? '' : q}j$. Quanto vale $a_{${i}${j}}$?`, p * i + q * j, t`$a_{${i}${j}}=${p}\cdot${i}+${q}\cdot${j}=${p * i + q * j}$.`);
            }),
            gen((rng) => {
              const A = r4(rng, -4, 6);
              const B = r4(rng, -4, 6);
              const pos = randInt(rng, 0, 3);
              const names = ['11', '12', '21', '22'];
              return num(t`Sendo $A=${mat([[A[0], A[1]], [A[2], A[3]]])}$ e $B=${mat([[B[0], B[1]], [B[2], B[3]]])}$, qual é o elemento da posição $${names[pos]}$ de $2A-B$?`, 2 * A[pos] - B[pos], t`$2\cdot(${A[pos]})-(${B[pos]})=${2 * A[pos] - B[pos]}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Produto de matrizes',
            body: t`No produto $AB$, o elemento $(i,j)$ é a linha $i$ de $A$ "vezes" a coluna $j$ de $B$:

$$${mat([[1, 2], [3, 4]])}${mat([[5, 6], [7, 8]])}=${mat([[19, 22], [43, 50]])}$$

pois $1\cdot5+2\cdot7=19$, $1\cdot6+2\cdot8=22$, e assim por diante.`,
            tip: t`Só dá para multiplicar $A_{m\times n}\cdot B_{n\times p}$ (colunas de $A$ = linhas de $B$). E em geral $AB\neq BA$!`,
          },
          exercises: [
            mcq(t`Se $A$ é $2\times3$ e $B$ é $3\times4$, o produto $AB$ é:`, ['$2\\times4$', '$3\\times3$', '$4\\times2$', 'não existe'], 0, t`$(2\times\underline3)\cdot(\underline3\times4)\to 2\times4$.`),
            tf(t`Para quaisquer matrizes quadradas, $AB=BA$.`, false, t`O produto de matrizes **não** é comutativo em geral.`),
            gen((rng) => {
              const A = r4(rng, 0, 4);
              const B = r4(rng, 0, 4);
              const c11 = A[0] * B[0] + A[1] * B[2];
              return num(t`Sendo $A=${mat([[A[0], A[1]], [A[2], A[3]]])}$ e $B=${mat([[B[0], B[1]], [B[2], B[3]]])}$, qual é o elemento $c_{11}$ de $C=AB$?`, c11, t`Linha 1 de $A$ · coluna 1 de $B$: $${A[0]}\cdot${B[0]}+${A[1]}\cdot${B[2]}=${c11}$.`);
            }),
            mcq(t`Sendo $I$ a matriz identidade $2\times2$, quanto vale $A\cdot I$?`, ['$A$', '$I$', '$0$', '$2A$'], 0, t`A identidade faz o papel do número $1$: $AI=IA=A$.`),
            gen((rng) => {
              const A = r4(rng, -3, 4);
              const v = [randInt(rng, -3, 4), randInt(rng, -3, 4)];
              const r = [A[0] * v[0] + A[1] * v[1], A[2] * v[0] + A[3] * v[1]];
              return rmcq(rng, t`Calcule $${mat([[A[0], A[1]], [A[2], A[3]]])}${mat([[v[0]], [v[1]]])}$.`, `$${mat([[r[0]], [r[1]]])}$`, [`$${mat([[A[0] * v[0] + A[2] * v[1]], [A[1] * v[0] + A[3] * v[1]]])}$`, `$${mat([[A[0] * v[0]], [A[3] * v[1]]])}$`, `$${mat([[r[0] + 1], [r[1]]])}$`], t`Cada linha da matriz "vezes" o vetor: $${A[0]}\cdot${v[0]}+${A[1]}\cdot(${v[1]})=${r[0]}$ e $${A[2]}\cdot${v[0]}+${A[3]}\cdot(${v[1]})=${r[1]}$.`);
            }),
            gen((rng) => {
              const A = r4(rng, -2, 4);
              const B = r4(rng, -2, 4);
              const pos = pick(rng, ['21', '22', '12'] as const);
              const val = { '21': A[2] * B[0] + A[3] * B[2], '22': A[2] * B[1] + A[3] * B[3], '12': A[0] * B[1] + A[1] * B[3] }[pos];
              return num(t`Sendo $A=${mat([[A[0], A[1]], [A[2], A[3]]])}$ e $B=${mat([[B[0], B[1]], [B[2], B[3]]])}$, qual é o elemento $c_{${pos}}$ de $AB$?`, val, t`Linha $${pos[0]}$ de $A$ vezes coluna $${pos[1]}$ de $B$: $${val}$.`);
            }),
            gen((rng) => {
              const A = r4(rng, 0, 3);
              const B = r4(rng, 0, 3);
              const P = [A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3], A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]];
              const Q = [B[0] * A[0] + B[1] * A[2], B[0] * A[1] + B[1] * A[3], B[2] * A[0] + B[3] * A[2], B[2] * A[1] + B[3] * A[3]];
              const m2 = (v: number[]) => `$${mat([[v[0], v[1]], [v[2], v[3]]])}$`;
              return rmcq(rng, t`Calcule $${mat([[A[0], A[1]], [A[2], A[3]]])}${mat([[B[0], B[1]], [B[2], B[3]]])}$.`, m2(P), [m2(A.map((x, k) => x * B[k])), m2(Q), m2([P[0], P[2], P[1], P[3]]), m2(P.map((x) => x + 1))], t`Linha por coluna em cada posição. Cuidado: multiplicar posição a posição **não** é o produto de matrizes.`);
            }),
            num(t`Sendo $A=${mat([[1, 1], [0, 1]])}$, qual é o elemento da linha 1, coluna 2 de $A^3=A\cdot A\cdot A$?`, 3, t`$A^2=${mat([[1, 2], [0, 1]])}$ e $A^3=${mat([[1, 3], [0, 1]])}$: o canto cresce $1$ a cada potência.`),
          ],
        },
        {
          card: {
            title: 'Determinante',
            body: t`Para $2\times2$: diagonal principal menos secundária.
$$\det\begin{pmatrix}a&b\\c&d\end{pmatrix}=ad-bc$$

Para $3\times3$, use a **regra de Sarrus** (repita as duas primeiras colunas e some os produtos das diagonais).

Se $\det A\ne0$, $A$ é **inversível**.`,
            example: t`$\det${mat([[3, 1], [2, 4]])}=12-2=10$.`,
            tip: t`Propriedades úteis: trocar duas linhas troca o sinal do determinante; matriz triangular tem $\det$ = produto da diagonal; e $\det(kA)=k^n\det A$ para $A$ de ordem $n$.`,
          },
          exercises: [
            gen((rng) => {
              const [a, b, c, d] = r4(rng, -5, 6);
              return num(t`Calcule $\det${mat([[a, b], [c, d]])}$.`, a * d - b * c, t`$${a}\cdot${d}-(${b})\cdot(${c})=${a * d - b * c}$.`);
            }),
            tf(t`O determinante da matriz identidade $2\times2$ é $1$.`, true, t`$\det${mat([[1, 0], [0, 1]])}=1\cdot1-0\cdot0=1$.`),
            mcqS(t`A matriz $${mat([[2, 4], [1, 2]])}$ é inversível?`, 'Não, pois det = 0', ['Sim, pois det = 8', 'Sim, sempre', 'Não, pois não é diagonal'], t`$\det=4-4=0$: as linhas são proporcionais.`),
            gen((rng) => {
              const b = randNZ(rng, -4, 4);
              const d = randNZ(rng, -4, 4);
              const k = randNZ(rng, -3, 3);
              const c = d * k;
              const x = b * k;
              return num(t`Para qual valor de $x$ temos $\det\begin{pmatrix}x&${b}\\${c}&${d}\end{pmatrix}=0$?`, x, t`$${d}x-(${b})\cdot(${c})=0\Rightarrow x=\frac{${b * c}}{${d}}=${x}$.`);
            }),
            num(t`Calcule $\det${mat([[1, 2, 0], [0, 1, 3], [2, 0, 1]])}$ (Sarrus).`, 13, t`Diagonais principais: $1\cdot1\cdot1+2\cdot3\cdot2+0\cdot0\cdot0=13$. Secundárias: $0\cdot1\cdot2+1\cdot3\cdot0+2\cdot0\cdot1=0$. $\det=13-0=13$.`),
            gen((rng) => {
              const [a, b, c] = [randNZ(rng, -4, 5), randNZ(rng, -4, 5), randNZ(rng, -4, 5)];
              const [x, y, z] = r4(rng, -6, 6);
              return num(t`Calcule $\det${mat([[a, x, y], [0, b, z], [0, 0, c]])}$.`, a * b * c, t`Matriz triangular: o determinante é o produto da diagonal, $${a}\cdot${b}\cdot${c}=${a * b * c}$.`);
            }),
            tf(t`Trocar duas linhas de uma matriz troca o sinal do seu determinante.`, true, t`Ex.: $\det${mat([[1, 2], [3, 4]])}=-2$ e $\det${mat([[3, 4], [1, 2]])}=2$.`),
            gen((rng) => {
              const d = randNZ(rng, -6, 6);
              const k = pick(rng, [2, 3, -2]);
              return num(t`Uma matriz $A$ de ordem $2$ tem $\det A=${d}$. Quanto vale $\det(${k}A)$?`, k * k * d, t`Cada uma das $2$ linhas é multiplicada por $${k}$: $\det(${k}A)=${k}^2\cdot${d}=${k * k * d}$.`);
            }),
          ],
        },
      ],
    },
    {
      id: 'f-alg2-sis',
      title: 'Sistemas lineares',
      parts: [
        {
          card: {
            title: 'O encontro de retas',
            body: t`Um sistema $2\times2$ é o encontro de duas retas. Fixe a reta azul $x+y=1$ e mexa na laranja $y=ax+c$:

• se cruzam: **uma** solução (SPD)
• paralelas: **nenhuma** (SI)
• coincidentes: **infinitas** (SPI)`,
            visual: systemLab(),
          },
          exercises: [
            mcq(t`Se as duas retas de um sistema são **paralelas** (distintas), o sistema é:`, ['impossível (SI)', 'possível e determinado (SPD)', 'possível e indeterminado (SPI)', 'homogêneo'], 0, t`Retas paralelas nunca se encontram: nenhuma solução.`),
            gen((rng) => {
              const x0 = randInt(rng, -3, 4);
              const y0 = randInt(rng, -3, 4);
              const [a, b, c, d] = [randNZ(rng, -3, 3), randNZ(rng, -3, 3), randNZ(rng, -3, 3), randNZ(rng, -3, 3)];
              const ok = rng() < 0.5;
              const e = a * x0 + b * y0;
              const f = c * x0 + d * y0 + (ok ? 0 : 1);
              return tf(t`O par $(${x0},\ ${y0})$ é solução de $\begin{cases}${term(a, 'x', true)}${term(b, 'y')}=${e}\\${term(c, 'x', true)}${term(d, 'y')}=${f}\end{cases}$.`, ok, ok ? t`Substituindo, as duas equações ficam verdadeiras.` : t`A segunda equação dá $${c * x0 + d * y0}\neq${f}$.`);
            }),
            mcq(t`O sistema $\begin{cases}x+2y=3\\2x+4y=7\end{cases}$ é:`, ['impossível (SI)', 'possível e determinado', 'possível e indeterminado', 'tem solução $x=1$, $y=1$'], 0, t`A 2ª equação deveria ser o dobro da 1ª ($6$), mas é $7$: retas paralelas.`),
            mcq(t`O sistema $\begin{cases}x+y=2\\2x+2y=4\end{cases}$ é:`, ['possível e indeterminado (SPI)', 'impossível (SI)', 'possível e determinado (SPD)', 'sem equações válidas'], 0, t`A 2ª equação é exatamente o dobro da 1ª: é a mesma reta, infinitas soluções.`),
            inter(t`Mexa na reta laranja até que o sistema **não tenha solução**.`, 'plot', systemLab().props, (v: any) => v && near(v.p.m, -1, 0.01) && !near(v.p.k, 1, 0.01), t`inclinação $a=-1$ (paralela) e $c\ne1$`),
            inter(t`Agora faça o sistema ter **infinitas** soluções.`, 'plot', systemLab().props, (v: any) => v && near(v.p.m, -1, 0.01) && near(v.p.k, 1, 0.01), t`$a=-1$ e $c=1$ (a mesma reta)`),
            tf(t`Se o determinante da matriz dos coeficientes é zero, o sistema pode ter infinitas soluções ou nenhuma.`, true, t`$\det=0$ significa retas paralelas ou coincidentes.`),
            gen((rng) => {
              const k = pick(rng, [2, 3, 4]);
              return num(t`Para qual valor de $k$ o sistema $\begin{cases}x+ky=1\\2x+${2 * k}y=3\end{cases}$ é impossível?`, k, t`Impossível quando os coeficientes de $x$ e $y$ são proporcionais mas o termo independente não: $\frac{1}{2}=\frac{k}{${2 * k}}$ vale para $k=${k}$, e $\frac12\neq\frac13$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Substituição e adição',
            body: t`**Substituição**: isole uma variável e substitua na outra equação.

**Adição/eliminação**: some equações (multiplicadas, se preciso) para sumir uma variável.

$$\begin{cases}x+y=5\\x-y=1\end{cases}\Rightarrow 2x=6\Rightarrow x=3,\ y=2$$`,
          },
          exercises: [
            gen((rng) => {
              const x = randInt(rng, -4, 6);
              const y = randInt(rng, -4, 6);
              return num(t`Resolva $\begin{cases}x+y=${x + y}\\x-y=${x - y}\end{cases}$. Quanto vale $x$?`, x, t`Somando: $2x=${2 * x}\Rightarrow x=${x}$ (e $y=${y}$).`);
            }),
            gen((rng) => {
              const y = randInt(rng, 5, 30);
              const x = y + randInt(rng, 2, 15);
              return num(t`A soma de dois números é $${x + y}$ e a diferença entre eles é $${x - y}$. Qual é o **maior**?`, x, t`$x+y=${x + y}$ e $x-y=${x - y}$: somando, $2x=${2 * x}\Rightarrow x=${x}$ (e o outro é $${y}$).`);
            }),
            gen((rng) => {
              const x = randInt(rng, 1, 5);
              const y = randInt(rng, 1, 5);
              return num(t`Resolva $\begin{cases}2x+y=${2 * x + y}\\x+3y=${x + 3 * y}\end{cases}$. Quanto vale $y$?`, y, t`Da 1ª: $y=${2 * x + y}-2x$. Substituindo: $x+3(${2 * x + y}-2x)=${x + 3 * y}\Rightarrow x=${x}$, $y=${y}$.`);
            }),
            gen((rng) => {
              const x = randInt(rng, -3, 5);
              const m = randNZ(rng, -3, 3);
              const c = randInt(rng, -4, 4);
              const y = m * x + c;
              const a = randInt(rng, 1, 3);
              const b = randNZ(rng, -3, 3);
              return num(t`Resolva por substituição: $\begin{cases}y=${term(m, 'x', true)}${term(c, '')}\\${term(a, 'x', true)}${term(b, 'y')}=${a * x + b * y}\end{cases}$. Quanto vale $x$?`, x, t`Troque $y$ por $${m}x${term(c, '')}$ na 2ª equação e isole $x$: $x=${x}$ (e $y=${y}$).`);
            }),
            order(t`Ordene os passos do método da adição para $\begin{cases}2x+3y=8\\x-y=-1\end{cases}$:`, [t`Multiplicar a 2ª equação por $3$: $3x-3y=-3$`, t`Somar com a 1ª: $5x=5$`, t`Concluir $x=1$`, t`Substituir: $y=x+1=2$`]),
            gen((rng) => {
              const x = randInt(rng, -3, 4);
              const y = randInt(rng, -3, 4);
              return num(t`Resolva $\begin{cases}3x+2y=${3 * x + 2 * y}\\2x-y=${2 * x - y}\end{cases}$. Quanto vale $y$?`, y, t`Multiplique a 2ª por $2$ ($4x-2y=${2 * (2 * x - y)}$) e some: $7x=${7 * x}\Rightarrow x=${x}$. Então $y=2x-(${2 * x - y})=${y}$.`);
            }),
            gen((rng) => {
              const motos = randInt(rng, 5, 30);
              const carros = randInt(rng, 5, 40);
              return num(t`Num estacionamento há $${motos + carros}$ veículos entre carros e motos, com $${4 * carros + 2 * motos}$ rodas no total. Quantas são as **motos**?`, motos, t`$c+m=${motos + carros}$ e $4c+2m=${4 * carros + 2 * motos}$. Da 1ª, $c=${motos + carros}-m$; substituindo: $${4 * (motos + carros)}-2m=${4 * carros + 2 * motos}\Rightarrow m=${motos}$.`);
            }),
            num(t`Resolva $\begin{cases}x+y+z=6\\x-y=-1\\y-z=-1\end{cases}$. Quanto vale $z$?`, 3, t`Das duas últimas: $x=y-1$ e $z=y+1$. Na 1ª: $(y-1)+y+(y+1)=6\Rightarrow y=2$. Logo $x=1$ e $z=3$.`),
          ],
        },
        {
          card: {
            title: 'Regra de Cramer',
            body: t`Para $\begin{cases}ax+by=e\\cx+dy=f\end{cases}$, calcule três determinantes:

$$D=\begin{vmatrix}a&b\\c&d\end{vmatrix},\quad D_x=\begin{vmatrix}e&b\\f&d\end{vmatrix},\quad D_y=\begin{vmatrix}a&e\\c&f\end{vmatrix}$$

Então $x=\frac{D_x}{D}$ e $y=\frac{D_y}{D}$ (só quando $D\neq0$).`,
            example: t`$\begin{cases}2x+y=5\\x-y=1\end{cases}$: $D=-3$, $D_x=-6$, $D_y=-3$, então $x=2$ e $y=1$.`,
            tip: t`Se $D=0$: com algum $D_x$ ou $D_y$ diferente de zero o sistema é impossível; com todos zero, pode ser indeterminado.`,
          },
          exercises: [
            gen((rng) => {
              const [a, b, c, d] = [randNZ(rng, -4, 5), randNZ(rng, -4, 5), randNZ(rng, -4, 5), randNZ(rng, -4, 5)];
              return num(t`Para $\begin{cases}${term(a, 'x', true)}${term(b, 'y')}=1\\${term(c, 'x', true)}${term(d, 'y')}=2\end{cases}$, calcule $D$ (o determinante dos coeficientes).`, a * d - b * c, t`$D=${a}\cdot${d}-(${b})\cdot(${c})=${a * d - b * c}$.`);
            }),
            tf(t`A regra de Cramer só dá a solução quando $D\neq0$.`, true, t`As fórmulas dividem por $D$.`),
            gen((rng) => {
              let [a, b, c, d] = [randNZ(rng, -3, 4), randNZ(rng, -3, 4), randNZ(rng, -3, 4), randNZ(rng, -3, 4)];
              if (a * d - b * c === 0) d += 1;
              const x = randInt(rng, -3, 4);
              const y = randInt(rng, -3, 4);
              const e = a * x + b * y;
              const f = c * x + d * y;
              return num(t`Para $\begin{cases}${term(a, 'x', true)}${term(b, 'y')}=${e}\\${term(c, 'x', true)}${term(d, 'y')}=${f}\end{cases}$, calcule $D_x$.`, e * d - b * f, t`$D_x=\begin{vmatrix}${e}&${b}\\${f}&${d}\end{vmatrix}=${e}\cdot${d}-(${b})\cdot(${f})=${e * d - b * f}$.`);
            }),
            gen((rng) => {
              let [a, b, c, d] = [randNZ(rng, -3, 4), randNZ(rng, -3, 4), randNZ(rng, -3, 4), randNZ(rng, -3, 4)];
              if (a * d - b * c === 0) d += 1;
              const x = randInt(rng, -3, 4);
              const y = randInt(rng, -3, 4);
              const e = a * x + b * y;
              const f = c * x + d * y;
              const D = a * d - b * c;
              return num(t`Use Cramer: $\begin{cases}${term(a, 'x', true)}${term(b, 'y')}=${e}\\${term(c, 'x', true)}${term(d, 'y')}=${f}\end{cases}$. Quanto vale $x$?`, x, t`$D=${D}$ e $D_x=${e * d - b * f}$, então $x=\frac{${e * d - b * f}}{${D}}=${x}$.`);
            }),
            gen((rng) => {
              let [a, b, c, d] = [randNZ(rng, -3, 4), randNZ(rng, -3, 4), randNZ(rng, -3, 4), randNZ(rng, -3, 4)];
              if (a * d - b * c === 0) d += 1;
              const x = randInt(rng, -3, 4);
              const y = randInt(rng, -3, 4);
              const e = a * x + b * y;
              const f = c * x + d * y;
              const D = a * d - b * c;
              return num(t`Use Cramer: $\begin{cases}${term(a, 'x', true)}${term(b, 'y')}=${e}\\${term(c, 'x', true)}${term(d, 'y')}=${f}\end{cases}$. Quanto vale $y$?`, y, t`$D=${D}$ e $D_y=${a * f - e * c}$, então $y=\frac{${a * f - e * c}}{${D}}=${y}$.`);
            }),
            mcq(t`Num sistema $2\times2$, deu $D=0$ e $D_x=5$. O sistema é:`, ['impossível (SI)', 'possível e determinado', 'possível e indeterminado', 'tem $x=0$'], 0, t`$x\cdot0=5$ não tem solução: retas paralelas.`),
            gen((rng) => {
              const p = pick(rng, [20, 30, 40, 50]);
              const meia = randInt(rng, 10, 60);
              const inteira = randInt(rng, 10, 60);
              return num(t`Um show vendeu $${meia + inteira}$ ingressos: inteira a R\$ $${p}$ e meia a R\$ $${p / 2}$. A arrecadação foi R\$ $${p * inteira + (p / 2) * meia}$. Quantas **meias** foram vendidas?`, meia, t`$i+m=${meia + inteira}$ e $${p}i+${p / 2}m=${p * inteira + (p / 2) * meia}$. Resolvendo: $m=${meia}$ (e $i=${inteira}$).`);
            }),
            num(t`Quantos kg de café de R\$ $20$/kg devem ser misturados com café de R\$ $30$/kg para obter $10$ kg a R\$ $24$/kg?`, 6, t`$x+y=10$ e $20x+30y=240$. Substituindo $y=10-x$: $20x+300-30x=240\Rightarrow x=6$ kg.`, { unit: 'kg' }),
          ],
        },
      ],
    },
  ],
};
