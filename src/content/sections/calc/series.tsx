import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { FnCurve, Pt, PolylineW, RectW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, term } from '../../../lib/random';

const t = String.raw;

/* ---------------- interactive labs ---------------- */

/** Sequence a_n = 2n/(n+1) -> 2 with epsilon band and index slider N */
const seqLimitLab = () =>
  plot({
    view: { xMin: 0, xMax: 15.5, yMin: 0.4, yMax: 2.6 },
    params: [
      { key: 'eps', label: '\\varepsilon', min: 0.1, max: 0.8, step: 0.05, value: 0.4, color: C.gold },
      { key: 'N', label: 'n', min: 1, max: 15, step: 1, value: 4, color: C.p2, format: (v: number) => String(v) },
    ],
    render: ({ p }: any) => {
      const L = 2;
      const pts: React.ReactNode[] = [];
      for (let k = 1; k <= 15; k++) {
        const ak = (2 * k) / (k + 1);
        const inside = Math.abs(ak - L) < p.eps;
        const isCur = k === p.N;
        pts.push(
          <Pt
            key={k}
            x={k}
            y={ak}
            r={isCur ? 7.5 : 4.5}
            color={isCur ? C.p2 : inside ? C.success : C.danger}
            label={isCur ? `a_${k}` : undefined}
            dy={-12}
            dx={-6}
          />,
        );
      }
      const an = (2 * p.N) / (p.N + 1);
      return (
        <>
          <RectW x={0} y={L - p.eps} w={15.5} h={2 * p.eps} color={C.gold} opacity={0.14} stroke="none" />
          <Seg x1={0} y1={L - p.eps} x2={15.5} y2={L - p.eps} color={C.gold} dash="5 4" width={1.5} />
          <Seg x1={0} y1={L + p.eps} x2={15.5} y2={L + p.eps} color={C.gold} dash="5 4" width={1.5} />
          <Seg x1={0} y1={L} x2={15.5} y2={L} color={C.gold} width={2} />
          <Seg x1={p.N} y1={0.4} x2={p.N} y2={an} color={C.p2} dash="4 4" width={1.5} />
          {pts}
        </>
      );
    },
    info: ({ p }: any) => {
      const an = (2 * p.N) / (p.N + 1);
      const err = Math.abs(an - 2);
      const ok = err < p.eps;
      return (
        t`$a_{${p.N}}=\frac{${2 * p.N}}{${p.N + 1}}\approx ${fmt(an, 3)}$ · $|a_{${p.N}}-2|=${fmt(err, 3)}$ ` +
        (ok ? t`$< \varepsilon=${fmt(p.eps, 2)}$ (**dentro da faixa!**)` : t`$\ge \varepsilon=${fmt(p.eps, 2)}$ (fora da faixa)`)
      );
    },
  });

/** Geometric series partial sums S_n = sum_{k=0}^{n-1} 2 r^k approaching 2/(1-r) */
const geoSeriesLab = () =>
  plot({
    view: { xMin: 0, xMax: 10.5, yMin: -0.5, yMax: 6.5 },
    params: [
      { key: 'r', label: 'r', min: -0.6, max: 0.65, step: 0.05, value: 0.4, color: C.p2 },
      { key: 'n', label: 'n', min: 1, max: 10, step: 1, value: 4, color: C.p3, format: (v: number) => String(v) },
    ],
    render: ({ p }: any) => {
      const a = 2;
      const Sinf = a / (1 - p.r);
      const poly: [number, number][] = [];
      const els: React.ReactNode[] = [];
      let s = 0;
      for (let k = 1; k <= p.n; k++) {
        const tk = a * Math.pow(p.r, k - 1);
        s += tk;
        poly.push([k, s]);
        els.push(<RectW key={'b' + k} x={k - 0.28} y={0} w={0.56} h={tk} color={C.p2} opacity={0.35} />);
        els.push(<Pt key={'p' + k} x={k} y={s} color={C.p3} r={k === p.n ? 6.5 : 4.5} />);
      }
      return (
        <>
          <Seg x1={0} y1={Sinf} x2={10.5} y2={Sinf} color={C.gold} dash="6 4" width={2} />
          {els}
          <PolylineW pts={poly} color={C.p3} width={2.5} />
        </>
      );
    },
    info: ({ p }: any) => {
      const Sinf = 2 / (1 - p.r);
      const Sn = 2 * ((1 - Math.pow(p.r, p.n)) / (1 - p.r));
      return t`Barras: $2r^{k-1}$ · Pontos: soma parcial $S_{${p.n}}=${fmt(Sn, 3)}$ · Limite $S_\infty=\frac{2}{1-${p.r < 0 ? `(${fmt(p.r, 2)})` : fmt(p.r, 2)}}=${fmt(Sinf, 3)}$`;
    },
  });

/** Integral test & p-series 1/x^p */
const pSeriesLab = () =>
  plot({
    view: { xMin: 0.5, xMax: 8.5, yMin: -0.1, yMax: 1.3 },
    params: [{ key: 'p', label: 'p', min: 0.5, max: 3.5, step: 0.25, value: 2, color: C.p1 }],
    render: ({ p }: any) => {
      const f = (x: number) => Math.pow(x, -p.p);
      const rects: React.ReactNode[] = [];
      for (let n = 1; n <= 7; n++) {
        rects.push(<RectW key={n} x={n} y={0} w={1} h={f(n + 1)} color={p.p > 1 ? C.success : C.danger} opacity={0.28} />);
      }
      return (
        <>
          {rects}
          <FnCurve f={f} from={0.8} to={8.5} color={C.p1} width={3} />
        </>
      );
    },
    info: ({ p }: any) => {
      if (p.p <= 1) {
        return t`$p=${fmt(p.p, 2)}\le 1$: $\int_1^\infty \frac{1}{x^{${fmt(p.p, 2)}}}\,dx = \infty$ ⟹ a série $p$ **diverge!**`;
      }
      const area = 1 / (p.p - 1);
      return t`$p=${fmt(p.p, 2)}>1$: cauda $\int_1^\infty \frac{1}{x^{${fmt(p.p, 2)}}}\,dx = \frac{1}{p-1} = ${fmt(area, 3)}$ ⟹ **converge!**`;
    },
  });

/** Alternating harmonic series partial sums oscillating around ln(2) */
const leibnizLab = () =>
  plot({
    view: { xMin: 0.5, xMax: 12.5, yMin: 0.4, yMax: 1.08 },
    params: [{ key: 'n', label: 'n', min: 1, max: 12, step: 1, value: 5, color: C.p5, format: (v: number) => String(v) }],
    render: ({ p }: any) => {
      const S = Math.LN2;
      const poly: [number, number][] = [];
      const pts: React.ReactNode[] = [];
      let s = 0;
      for (let k = 1; k <= p.n; k++) {
        s += (k % 2 === 1 ? 1 : -1) / k;
        poly.push([k, s]);
        pts.push(<Pt key={k} x={k} y={s} color={k === p.n ? C.p5 : C.p2} r={k === p.n ? 6.5 : 4.5} />);
      }
      const bound = 1 / (p.n + 1);
      return (
        <>
          <RectW x={0.5} y={S - bound} w={12} h={2 * bound} color={C.gold} opacity={0.14} stroke="none" />
          <Seg x1={0.5} y1={S} x2={12.5} y2={S} color={C.gold} dash="6 4" width={2} />
          <PolylineW pts={poly} color={C.p2} width={2} />
          {pts}
        </>
      );
    },
    info: ({ p }: any) => {
      let s = 0;
      for (let k = 1; k <= p.n; k++) s += (k % 2 === 1 ? 1 : -1) / k;
      const err = Math.abs(Math.LN2 - s);
      const bNext = 1 / (p.n + 1);
      return t`$S_{${p.n}}=${fmt(s, 4)}$ · $S=\ln 2\approx 0{,}6931$ · erro real $${fmt(err, 4)} \le b_{${p.n + 1}}=\frac{1}{${p.n + 1}}\approx ${fmt(bNext, 3)}$`;
    },
  });

/** Power series convergence interval (a - R, a + R) */
const powerRadiusLab = () =>
  plot({
    view: { xMin: -4.5, xMax: 4.5, yMin: -2, yMax: 5 },
    params: [
      { key: 'a', label: 'a', min: -1.5, max: 1.5, step: 0.5, value: 0, color: C.p2 },
      { key: 'R', label: 'R', min: 0.5, max: 2.5, step: 0.5, value: 1.5, color: C.gold },
      { key: 'n', label: 'n', min: 1, max: 9, step: 1, value: 5, color: C.p1, format: (v: number) => String(v) },
    ],
    render: ({ p }: any) => {
      const exact = (x: number) => {
        const u = (x - p.a) / p.R;
        return Math.abs(u - 1) < 0.04 ? NaN : 1 / (1 - u);
      };
      const poly = (x: number) => {
        const u = (x - p.a) / p.R;
        let s = 0;
        let pw = 1;
        for (let k = 0; k <= p.n; k++) {
          s += pw;
          pw *= u;
        }
        return s;
      };
      return (
        <>
          <RectW x={p.a - p.R} y={-2} w={2 * p.R} h={7} color={C.gold} opacity={0.11} stroke="none" />
          <Seg x1={p.a - p.R} y1={-2} x2={p.a - p.R} y2={5} color={C.gold} dash="5 4" width={1.5} />
          <Seg x1={p.a + p.R} y1={-2} x2={p.a + p.R} y2={5} color={C.gold} dash="5 4" width={1.5} />
          <Seg x1={p.a - p.R} y1={0} x2={p.a + p.R} y2={0} color={C.gold} width={6} />
          <Pt x={p.a} y={0} color={C.p2} r={5.5} label="a" dy={16} dx={-4} />
          <FnCurve f={exact} color={C.gold} dash="6 4" width={2} />
          <FnCurve f={poly} color={C.p1} width={3} />
        </>
      );
    },
    info: ({ p }: any) =>
      t`Centro $a=${fmt(p.a, 1)}$, raio $R=${fmt(p.R, 1)}$ ⟹ converge em $(${fmt(p.a - p.R, 1)},\,${fmt(p.a + p.R, 1)})$ e diverge fora!`,
  });

const fact = (n: number): number => {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
};

const taylorExp = (x: number, n: number): number => {
  let s = 0;
  for (let k = 0; k <= n; k++) s += Math.pow(x, k) / fact(k);
  return s;
};

const taylorSin = (x: number, deg: number): number => {
  let s = 0;
  for (let k = 0; 2 * k + 1 <= deg; k++) {
    const m = 2 * k + 1;
    s += ((k % 2 === 0 ? 1 : -1) * Math.pow(x, m)) / fact(m);
  }
  return s;
};

/** Maclaurin polynomial of e^x with degree n */
const taylorExpLab = () =>
  plot({
    view: { xMin: -3, xMax: 2.5, yMin: -1, yMax: 8 },
    params: [{ key: 'n', label: 'n', min: 0, max: 6, step: 1, value: 1, color: C.p4, format: (v: number) => String(v) }],
    render: ({ p }: any) => (
      <>
        <FnCurve f={(x) => Math.exp(x)} color={C.gold} dash="6 4" width={2.5} />
        <FnCurve f={(x) => taylorExp(x, p.n)} color={C.p4} width={3} />
        <Pt x={0} y={1} color={C.gold} r={5} />
        <Pt x={1} y={taylorExp(1, p.n)} color={C.p4} r={5.5} />
      </>
    ),
    info: ({ p }: any) => {
      const approx = taylorExp(1, p.n);
      const err = Math.abs(Math.E - approx);
      return t`Grau $n=${p.n}$: $P_{${p.n}}(1)=${fmt(approx, 4)}$ · $e^1\approx 2{,}7183$ · erro em $x=1$: $${fmt(err, 4)}$`;
    },
  });

/** Maclaurin polynomial of sin(x) with odd degree n */
const taylorLab = () =>
  plot({
    view: { xMin: -5.2, xMax: 5.2, yMin: -2.2, yMax: 2.2 },
    params: [{ key: 'n', label: 'n', min: 1, max: 11, step: 2, value: 3, color: C.p2, format: (v: number) => String(v) }],
    render: ({ p }: any) => (
      <>
        <FnCurve f={(x) => Math.sin(x)} color={C.gold} dash="6 4" width={2.5} />
        <FnCurve f={(x) => taylorSin(x, p.n)} color={C.p2} width={3} />
        <Pt x={0} y={0} color={C.gold} r={4.5} />
        <Pt x={2} y={taylorSin(2, p.n)} color={C.p2} r={5.5} />
      </>
    ),
    info: ({ p }: any) => {
      const approx = taylorSin(2, p.n);
      const exact = Math.sin(2);
      const err = Math.abs(exact - approx);
      return t`Grau $n=${p.n}$: $P_{${p.n}}(2)=${fmt(approx, 4)}$ vs $\operatorname{sen}(2)=${fmt(exact, 4)}$ · erro $${fmt(err, 4)}$`;
    },
  });

/* ================================================================
   UNIDADE 1 — Sequências e séries (c-seq)
   ================================================================ */

export const sequencias: UnitDef = {
  id: 'c-seq',
  title: 'Sequências e séries',
  subtitle: 'Convergência, séries geométricas, telescópicas e testes',
  icon: '♾️',
  source: 'Cálculo II · Sequências e Séries Numéricas',
  guide: t`Uma sequência é uma lista infinita de números $a_1, a_2, a_3, \ldots$; uma série soma todos esses termos. Descobrir quando uma soma de infinitas parcelas dá um resultado finito é a base para aproximar funções e sinais na engenharia.`,
  lessons: [
    {
      id: 'c-seq-seq',
      title: 'Sequências e convergência',
      parts: [
        {
          card: {
            title: 'Lista infinita e seu destino',
            body: t`Uma **sequência** é uma função que associa a cada inteiro $n\ge 1$ um número $a_n$. Dizemos que $(a_n)$ **converge** para o limite $L$ quando os termos entram e permanecem dentro de qualquer faixa $L\pm\varepsilon$ a partir de um índice $N$:`,
            visual: seqLimitLab(),
            formula: t`\lim_{n\to\infty}\frac{1}{n^p}=0\quad(p>0)`,
            example: t`Para $a_n=\frac{3n+1}{n+2}$, dividindo cima e baixo por $n$: $a_n=\frac{3+1/n}{1+2/n}\to\frac{3+0}{1+0}=3$.`,
            tip: t`Em quocientes de polinômios $\frac{P(n)}{Q(n)}$: mesmo grau $\to$ razão dos coeficientes líderes; grau menor em cima $\to 0$; grau maior em cima $\to \pm\infty$ (diverge).`,
          },
          exercises: [
            inter(
              t`No laboratório ($a_n=\frac{2n}{n+1}$, limite $L=2$), ajuste $\varepsilon=0{,}3$ e mova $n$ para o **primeiro** índice em que $a_n$ entra na faixa $2\pm\varepsilon$.`,
              'plot',
              seqLimitLab().props,
              (v: any) => v && near(v.p.eps, 0.3, 0.01) && near(v.p.N, 6, 0.1),
              t`$\varepsilon=0{,}3$ e $n=6$`,
              t`Para $n=5$, $|a_5-2|=\frac{2}{6}\approx 0{,}333\ge 0{,}3$; para $n=6$, $|a_6-2|=\frac{2}{7}\approx 0{,}286<0{,}3$.`,
            ),
            tf(
              t`Se $\lim_{n\to\infty}a_n=\infty$, dizemos que a sequência $(a_n)$ é convergente.`,
              false,
              t`Convergir exige se aproximar de um número **finito** $L\in\mathbb R$. Quando vai para $\pm\infty$, a sequência diverge.`,
            ),
            gen((rng) => {
              const c = randInt(rng, 2, 5);
              const k = randInt(rng, 1, 5);
              const a = c * k;
              const b = randNZ(rng, -7, 7);
              const d = randInt(rng, 1, 8);
              return num(
                t`Calcule o limite da sequência $a_n=\dfrac{${a}n${term(b, '')}}{${c}n+${d}}$ quando $n\to\infty$.`,
                k,
                t`Mesmo grau em cima e embaixo: razão dos coeficientes de $n$, $\frac{${a}}{${c}}=${k}$.`,
              );
            }),
            mcqS(
              t`O que acontece com a sequência $a_n=(-1)^n$ quando $n\to\infty$?`,
              t`Diverge, pois oscila entre $-1$ e $1$`,
              [t`Converge para $0$`, t`Converge para $1$`, t`Converge para $-1$`, t`Diverge para $+\infty$`],
              t`Os termos pares valem $1$ e os ímpares valem $-1$: nunca se fixam perto de um único valor.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return rmcq(
                rng,
                t`Qual é o termo geral $a_n$ ($n\ge 1$) da sequência $\dfrac{1}{${k + 1}},\ \dfrac{2}{${k + 2}},\ \dfrac{3}{${k + 3}},\ \dfrac{4}{${k + 4}},\ \ldots$?`,
                t`$a_n=\dfrac{n}{n+${k}}$`,
                [
                  t`$a_n=\dfrac{n}{${k}n+1}$`,
                  t`$a_n=\dfrac{n+${k}}{n}$`,
                  t`$a_n=\dfrac{1}{n+${k}}$`,
                  t`$a_n=\dfrac{n}{n+${k + 1}}$`,
                ],
                t`O numerador é $n$ e o denominador é sempre $n+${k}$.`,
              );
            }),
            mcqS(
              t`Calcule $\lim_{n\to\infty}\dfrac{5n^2+3n}{10n^3-1}$.`,
              t`$0$`,
              [t`$\frac{1}{2}$`, t`$5$`, t`$\infty$`, t`$-3$`],
              t`O grau do numerador ($2$) é menor que o do denominador ($3$), então a fração vai a $0$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 1, 6);
              const a = 2 * k;
              return num(
                t`Calcule $\lim_{n\to\infty}\left(\sqrt{n^2+${a}n}-n\right)$ multiplicando pelo conjugado.`,
                k,
                t`$\frac{(n^2+${a}n)-n^2}{\sqrt{n^2+${a}n}+n}=\frac{${a}n}{n(\sqrt{1+${a}/n}+1)}\to\frac{${a}}{1+1}=${k}$.`,
              );
            }),
            match(
              t`Ligue cada sequência ao seu comportamento quando $n\to\infty$:`,
              [
                [t`$a_n=\frac{6n^2-1}{2n^2+5}$`, t`Converge para $3$`],
                [t`$a_n=\frac{(-1)^n}{n}$`, t`Converge para $0$`],
                [t`$a_n=\frac{n^2+1}{n}$`, t`Diverge para $+\infty$`],
                [t`$a_n=\cos(n\pi)$`, t`Diverge oscilando`],
              ],
              t`Em $\frac{(-1)^n}{n}$, o sinal alterna mas a amplitude $\frac{1}{n}\to 0$; já $\cos(n\pi)=(-1)^n$ oscila sem amortecer.`,
            ),
          ],
        },
        {
          card: {
            title: 'Quem cresce mais rápido?',
            body: t`Pelo **Teorema do Confronto**, se $b_n\le a_n\le c_n$ e $b_n,c_n\to L$, então $a_n\to L$. Na disputa de crescimento quando $n\to\infty$, vale a hierarquia:`,
            formula: t`\ln n \ll n^p \ll a^n \ll n! \ll n^n\quad(p>0,\ a>1)`,
            example: t`$\lim_{n\to\infty}\frac{\cos n}{n}=0$ pois $-\frac{1}{n}\le\frac{\cos n}{n}\le\frac{1}{n}$, e $\lim_{n\to\infty}\left(1+\frac{k}{n}\right)^n=e^k$.`,
            tip: t`Para a sequência geométrica $a_n=r^n$: converge para $0$ se $|r|<1$, vale $1$ se $r=1$ e diverge se $r\le -1$ ou $r>1$.`,
          },
          exercises: [
            tf(
              t`Para qualquer constante $a>1$, temos $\lim_{n\to\infty}\dfrac{a^n}{n!}=0$.`,
              true,
              t`O fatorial $n!=1\cdot 2\cdot 3\cdots n$ multiplica por fatores cada vez maiores e vence qualquer exponencial $a^n$.`,
            ),
            mcqS(
              t`Para quais valores reais de $r$ a sequência $a_n=r^n$ é **convergente**?`,
              t`$-1 < r \le 1$`,
              [t`$-1 \le r \le 1$`, t`$|r| < 1$`, t`$r < 1$`, t`$0 \le r \le 1$`],
              t`Para $|r|<1$, $r^n\to 0$; para $r=1$, $1^n=1\to 1$; para $r=-1$, $(-1)^n$ oscila e diverge.`,
            ),
            gen((rng) => {
              const k = pick(rng, [2, 3, 4, 5]);
              const c = randInt(rng, 1, 4);
              const m = randInt(rng, 1, 5);
              const a = c * m;
              const b = randInt(rng, 1, 9);
              return num(
                t`Calcule $\lim_{n\to\infty}\dfrac{${a}\cdot ${k}^n+${b}}{${c}\cdot ${k}^n-1}$.`,
                m,
                t`Dividindo cima e baixo por $${k}^n$: $\frac{${a}+${b}/${k}^n}{${c}-1/${k}^n}\to\frac{${a}}{${c}}=${m}$.`,
              );
            }),
            mcqS(
              t`Qual teorema justifica diretamente que $\lim_{n\to\infty}\dfrac{\operatorname{sen}(n^2)}{n}=0$?`,
              t`Teorema do Confronto, usando $-\frac{1}{n}\le\frac{\operatorname{sen}(n^2)}{n}\le\frac{1}{n}$`,
              [
                t`Regra de L'Hôpital aplicada em $\operatorname{sen}(n^2)$`,
                t`Teste da Razão para fatoriais`,
                t`Teorema do Valor Intermediário`,
              ],
              t`Como $-1\le\operatorname{sen}(n^2)\le 1$, a sequência fica espremida entre $-\frac{1}{n}$ e $\frac{1}{n}$, que tendem a $0$.`,
            ),
            order(
              t`Ordene as sequências da que cresce **mais devagar** para a que cresce **mais rápido** quando $n\to\infty$:`,
              [t`$\ln n$`, t`$n^3$`, t`$2^n$`, t`$n!$`],
              t`Hierarquia clássica: logarítmica $\ll$ potência $\ll$ exponencial $\ll$ fatorial.`,
            ),
            gen((rng) => {
              const k = randNZ(rng, -5, 6);
              return rmcq(
                rng,
                t`Qual é o valor do limite fundamental $\lim_{n\to\infty}\left(1+\dfrac{${k}}{n}\right)^n$?`,
                t`$e^{${k}}$`,
                [t`$1$`, t`$${k}e$`, t`$e^{${-k}}$`, t`$\infty$`],
                t`Pelo limite exponencial fundamental, $\lim_{n\to\infty}\left(1+\frac{k}{n}\right)^n=e^k$.`,
              );
            }),
            mcqS(
              t`Quanto vale $\lim_{n\to\infty}\sqrt[n]{n}=\lim_{n\to\infty}n^{1/n}$?`,
              t`$1$`,
              [t`$0$`, t`$e$`, t`$\infty$`, t`não existe`],
              t`Tomando o logaritmo: $\ln(n^{1/n})=\frac{\ln n}{n}\to 0$, logo $n^{1/n}=e^{(\ln n)/n}\to e^0=1$.`,
            ),
            gen((rng) => {
              const n0 = randInt(rng, 3, 7);
              return num(
                t`Simplificando fatoriais, calcule o valor exato de $\dfrac{(n+2)!}{n!}$ para $n=${n0}$.`,
                (n0 + 2) * (n0 + 1),
                t`$\frac{(n+2)!}{n!}=\frac{(n+2)(n+1)n!}{n!}=(n+2)(n+1)=${n0 + 2}\cdot ${n0 + 1}=${(n0 + 2) * (n0 + 1)}$.`,
              );
            }),
          ],
        },
        {
          card: {
            title: 'Monótonas e recursivas',
            body: t`Uma sequência é **monótona** se só cresce ($a_{n+1}\ge a_n$) ou só decresce ($a_{n+1}\le a_n$), e é **limitada** se existe um piso e um teto ($m\le a_n\le M$).`,
            formula: t`\text{Monótona} + \text{Limitada} \implies \text{Convergente}`,
            example: t`Se $a_1=1$ e $a_{n+1}=\frac{1}{2}a_n+3$ converge para $L$, como $\lim a_{n+1}=\lim a_n=L$, temos $L=\frac{1}{2}L+3\implies L=6$.`,
            tip: t`Toda sequência convergente é limitada, mas a recíproca é falsa: $(-1)^n$ é limitada entre $-1$ e $1$ e diverge!`,
          },
          exercises: [
            tf(
              t`Toda sequência limitada é obrigatoriamente convergente.`,
              false,
              t`Falso! $a_n=(-1)^n$ é limitada ($-1\le a_n\le 1$), mas oscila e diverge. Precisa ser também monótona.`,
            ),
            fill(
              t`Complete o Teorema da Convergência Monótona:`,
              t`Toda sequência ___ e ___ é convergente.`,
              [t`monótona`, t`limitada`],
              [t`alternada`, t`positiva`, t`infinita`],
              t`Se uma sequência só sobe (ou só desce) mas tem uma barreira que não pode ultrapassar, ela é obrigada a convergir.`,
            ),
            mcqS(
              t`A sequência $a_n=1-\dfrac{1}{n}$ ($n\ge 1$) é:`,
              t`crescente e limitada ($0\le a_n<1$)`,
              [
                t`decrescente e ilimitada`,
                t`decrescente e limitada`,
                t`oscilante e divergente`,
                t`crescente e ilimitada`,
              ],
              t`Quando $n$ aumenta, $\frac{1}{n}$ diminui e $1-\frac{1}{n}$ cresce de $0$ em direção ao teto $1$.`,
            ),
            gen((rng) => {
              const a1 = randInt(rng, 1, 4);
              const k = randInt(rng, 2, 3);
              const b = randInt(rng, 1, 4);
              const a2 = k * a1 + b;
              const a3 = k * a2 + b;
              return num(
                t`Considere a sequência recursiva dada por $a_1=${a1}$ e $a_{n+1}=${k}a_n+${b}$. Quanto vale o termo $a_3$?`,
                a3,
                t`$a_2=${k}\cdot ${a1}+${b}=${a2}$ e $a_3=${k}\cdot ${a2}+${b}=${a3}$.`,
              );
            }),
            gen((rng) => {
              const k = pick(rng, [2, 3, 4]);
              const m = randInt(rng, 1, 5);
              const b = m * (k - 1);
              const L = m * k;
              return num(
                t`Sabendo que a sequência recursiva $a_1=1$, $a_{n+1}=\dfrac{1}{${k}}a_n+${b}$ converge, calcule seu limite $L=\lim_{n\to\infty}a_n$.`,
                L,
                t`No limite, $L=\frac{1}{${k}}L+${b}\implies \frac{${k - 1}}{${k}}L=${b}\implies L=${L}$.`,
              );
            }),
            gen((rng) => {
              const m = randInt(rng, 2, 5);
              const k = m * (m - 1);
              return num(
                t`A sequência $a_1=1$ e $a_{n+1}=\sqrt{${k}+a_n}$ é crescente e limitada. Qual é o seu limite $L>0$?`,
                m,
                t`$L=\sqrt{${k}+L}\implies L^2-L-${k}=0\implies (L-${m})(L+${m - 1})=0$. Como $L>0$, temos $L=${m}$.`,
              );
            }),
            multi(
              t`Quais das sequências abaixo são **limitadas** para $n\ge 1$?`,
              [t`$a_n=\frac{n}{n+1}$`, t`$a_n=(-1)^n$`, t`$a_n=\cos(n)$`, t`$a_n=n^2$`, t`$a_n=2^n$`],
              [0, 1, 2],
              t`$\frac{n}{n+1}\in[\frac12,\,1)$, $(-1)^n\in\{-1,\,1\}$ e $\cos(n)\in[-1,\,1]$ têm piso e teto; já $n^2$ e $2^n$ crescem até $+\infty$.`,
            ),
            mcqS(
              t`Se uma sequência $(a_n)$ é **decrescente** e todos os seus termos são positivos ($a_n>0$), podemos garantir que:`,
              t`ela converge, pois é monótona e limitada inferiormente por $0$`,
              [
                t`ela diverge para $-\infty$`,
                t`seu limite é obrigatoriamente $0$`,
                t`ela oscila em torno de $1$`,
              ],
              t`Decrescente + piso em $0$ garante convergência pelo Teorema da Convergência Monótona (o limite é $\ge 0$, não necessariamente $0$).`,
            ),
          ],
        },
      ],
    },
    {
      id: 'c-seq-geo',
      title: 'Séries: geométrica, harmônica e telescópica',
      parts: [
        {
          card: {
            title: 'Somando infinitos termos',
            body: t`Dada uma sequência $(a_n)$, a **série** $\sum_{n=1}^\infty a_n$ é o limite das **somas parciais** $S_n=a_1+a_2+\cdots+a_n$. Na **série geométrica**, cada termo multiplica o anterior pela razão $r$:`,
            visual: geoSeriesLab(),
            formula: t`\sum_{n=0}^{\infty}a\,r^n=\frac{a}{1-r}\quad(|r|<1)`,
            example: t`$\sum_{n=1}^{\infty}\frac{3}{4^n}$ começa em $n=1$ com $1º$ termo $\frac{3}{4}$ e razão $r=\frac{1}{4}$: soma $S=\frac{3/4}{1-1/4}=1$.`,
            tip: t`No numerador de $\frac{\text{1º termo}}{1-r}$ vai sempre o **primeiro termo efetivamente somado** (olhe o índice inicial do somatório!).`,
          },
          exercises: [
            inter(
              t`No laboratório da série $\sum_{k=0}^\infty 2r^k$, ajuste a razão $r$ para que a soma infinita seja $S_\infty=4$ e aumente $n$ até que $S_n$ passe de $3{,}9$.`,
              'plot',
              geoSeriesLab().props,
              (v: any) => v && near(v.p.r, 0.5, 0.02) && v.p.n >= 6,
              t`$r=0{,}5$ e $n\ge 6$`,
              t`$\frac{2}{1-r}=4\implies r=0{,}5$. Com $n=6$, $S_6=4(1-0{,}5^6)=3{,}9375>3{,}9$.`,
            ),
            tf(
              t`A série geométrica $\sum_{n=0}^\infty r^n$ converge quando $r=1$.`,
              false,
              t`Para $r=1$, a soma parcial é $S_n=1+1+\cdots+1=n\to\infty$. Só converge se $|r|<1$.`,
            ),
            gen((rng) => {
              const k = pick(rng, [2, 3, 4, 5]);
              const m = randInt(rng, 1, 5);
              const a = m * (k - 1);
              return num(
                t`Calcule a soma da série geométrica $\sum_{n=0}^{\infty}\dfrac{${a}}{${k}^n}$ (atenção: começa em $n=0$).`,
                m * k,
                t`Em $n=0$ o $1º$ termo é $${a}$ e a razão é $r=\frac{1}{${k}}$: $S=\frac{${a}}{1-1/${k}}=\frac{${a}}{${k - 1}/${k}}=${m * k}$.`,
              );
            }),
            gen((rng) => {
              const k = pick(rng, [2, 3, 4, 5]);
              const m = randInt(rng, 1, 6);
              const a = m * (k - 1);
              return num(
                t`Calcule a soma da série geométrica $\sum_{n=1}^{\infty}\dfrac{${a}}{${k}^n}$ (começa em $n=1$).`,
                m,
                t`Em $n=1$ o $1º$ termo é $\frac{${a}}{${k}}$ e $r=\frac{1}{${k}}$: $S=\frac{${a}/${k}}{1-1/${k}}=\frac{${a}}{${k - 1}}=${m}$.`,
              );
            }),
            mcqS(
              t`A dízima periódica $0{,}232323\ldots$ pode ser escrita como a série geométrica $\sum_{n=1}^\infty \dfrac{23}{100^n}$. Qual é sua fração geratriz?`,
              t`$\dfrac{23}{99}$`,
              [t`$\dfrac{23}{100}$`, t`$\dfrac{23}{90}$`, t`$\dfrac{23}{999}$`, t`$\dfrac{23}{9}$`],
              t`$1º$ termo $\frac{23}{100}$ e razão $\frac{1}{100}$: $S=\frac{23/100}{1-1/100}=\frac{23}{99}$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 9);
              return num(
                t`Uma série $\sum_{n=1}^\infty a_n$ tem $n$-ésima soma parcial dada por $S_n=\dfrac{${k}n}{n+1}$. Quanto vale a soma infinita $\sum_{n=1}^\infty a_n$?`,
                k,
                t`Por definição, a soma da série é o limite das somas parciais: $S=\lim_{n\to\infty}S_n=\lim_{n\to\infty}\frac{${k}n}{n+1}=${k}$.`,
              );
            }),
            mcqS(
              t`Se as somas parciais de $\sum_{n=1}^\infty a_n$ são dadas por $S_n=5-\dfrac{3}{2^n}$, quanto vale o termo $a_3$?`,
              t`$\dfrac{3}{8}$`,
              [t`$\dfrac{37}{8}$`, t`$\dfrac{3}{4}$`, t`$5$`, t`$-\dfrac{3}{8}$`],
              t`O $3º$ termo isolado é $a_3=S_3-S_2=\left(5-\frac{3}{8}\right)-\left(5-\frac{3}{4}\right)=\frac{3}{4}-\frac{3}{8}=\frac{3}{8}$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 7);
              return rmcq(
                rng,
                t`Para quais valores reais de $x$ a série geométrica $\sum_{n=0}^{\infty}\left(\dfrac{x}{${k}}\right)^n$ converge?`,
                t`$-${k} < x < ${k}$`,
                [
                  t`$-${k} \le x \le ${k}$`,
                  t`$0 < x < ${k}$`,
                  t`$x < ${k}$`,
                  t`$|x| > ${k}$`,
                ],
                t`A série geométrica converge se e somente se a razão em módulo é menor que $1$: $\left|\frac{x}{${k}}\right|<1\iff -${k}<x<${k}$.`,
              );
            }),
          ],
        },
        {
          card: {
            title: 'Quando a soma explode',
            body: t`**Teste da Divergência**: se $\lim_{n\to\infty}a_n\ne 0$ (ou não existe), então $\sum a_n$ **diverge**. Mas cuidado: ter $a_n\to 0$ **não** garante convergência! O contraexemplo mais famoso é a **série harmônica**:`,
            formula: t`\sum_{n=1}^{\infty}\frac{1}{n}=1+\frac{1}{2}+\frac{1}{3}+\frac{1}{4}+\cdots=\infty`,
            example: t`Prova de Oresme (agrupando em potências de $2$): $$1+\frac12+\underbrace{\left(\frac13+\frac14\right)}_{>\,2/4\,=\,1/2}+\underbrace{\left(\frac15+\frac16+\frac17+\frac18\right)}_{>\,4/8\,=\,1/2}+\cdots > 1+\frac12+\frac12+\frac12+\cdots=\infty$$`,
            tip: t`Se $\lim_{n\to\infty}a_n=0$, o Teste da Divergência é **inconclusivo**: você precisa usar outro teste!`,
          },
          exercises: [
            tf(
              t`Se $\lim_{n\to\infty}a_n=0$, então a série $\sum_{n=1}^\infty a_n$ certamente converge.`,
              false,
              t`Armadilha clássica! Na série harmônica $\sum\frac{1}{n}$, temos $\frac{1}{n}\to 0$ e mesmo assim a soma diverge para $+\infty$.`,
            ),
            mcqS(
              t`O que o Teste da Divergência afirma sobre a série $\sum_{n=1}^{\infty}\dfrac{n}{2n+1}$?`,
              t`Diverge, pois $\lim_{n\to\infty}a_n=\frac{1}{2}\ne 0$`,
              [
                t`Converge para $\frac{1}{2}$`,
                t`Converge, pois os termos são menores que $1$`,
                t`O teste é inconclusivo`,
              ],
              t`Como as parcelas se aproximam de $\frac{1}{2}$ (e não de $0$), estamos somando quase $\frac{1}{2}$ infinitas vezes: a soma explode.`,
            ),
            order(
              t`Ordene a demonstração por agrupamento de que a série harmônica $\sum_{n=1}^\infty\frac{1}{n}$ diverge:`,
              [
                t`Agrupar os termos em blocos de $1, 2, 4, 8, \ldots$ parcelas: $1+\frac12+(\frac13+\frac14)+(\frac15+\cdots+\frac18)+\cdots$`,
                t`Menorizar cada parcela do bloco pela última dele (ex.: $\frac13+\frac14 > \frac14+\frac14$)`,
                t`Observar que cada bloco soma mais que $\frac{1}{2}$`,
                t`Concluir que $S_{2^k} > 1+\frac{k}{2}\to\infty$, logo a série diverge`,
              ],
              t`Cada bloco de $2^{k-1}$ termos terminando em $\frac{1}{2^k}$ soma mais que $2^{k-1}\cdot\frac{1}{2^k}=\frac{1}{2}$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 1, 5);
              const b = randInt(rng, 2, 6);
              return rmcq(
                rng,
                t`Analise a série $\sum_{n=1}^{\infty}\dfrac{${a}n^2+1}{${b}n^2+n}$ pelo Teste da Divergência.`,
                t`Diverge, pois $\lim_{n\to\infty}a_n=\frac{${a}}{${b}}\ne 0$`,
                [
                  t`Converge para $\frac{${a}}{${b}}$`,
                  t`Converge por ser parecida com $\sum\frac{1}{n^2}$`,
                  t`O Teste da Divergência é inconclusivo porque o limite é finito`,
                ],
                t`Não confunda limite da sequência ($a_n\to\frac{${a}}{${b}}$) com soma da série! Como $\lim a_n\ne 0$, a série diverge.`,
              );
            }),
            multi(
              t`Quais das séries abaixo têm divergência provada **imediatamente** pelo Teste da Divergência ($\lim a_n\ne 0$)?`,
              [
                t`$\sum_{n=1}^\infty \frac{n+1}{n}$`,
                t`$\sum_{n=1}^\infty (-1)^n$`,
                t`$\sum_{n=1}^\infty \cos\left(\frac{1}{n}\right)$`,
                t`$\sum_{n=1}^\infty \frac{1}{n}$`,
                t`$\sum_{n=1}^\infty \frac{1}{n^2}$`,
              ],
              [0, 1, 2],
              t`Nas três primeiras, $\lim a_n$ é $1$, não existe e $\cos(0)=1\ne 0$. Nas duas últimas, $a_n\to 0$ (o Teste da Divergência nada conclui).`,
            ),
            mcqS(
              t`Sabendo que a série $\sum_{n=1}^\infty a_n$ **converge** e sua soma vale $S=10$, quanto vale $\lim_{n\to\infty}a_n$?`,
              t`$0$`,
              [t`$10$`, t`$1$`, t`não é possível determinar`],
              t`Se $\sum a_n$ converge para $S$, então $a_n=S_n-S_{n-1}\to S-S=0$. As parcelas precisam zerar no infinito.`,
            ),
            gen((rng) => {
              const M = randInt(rng, 3, 6);
              const k = 2 * (M - 1);
              return num(
                t`Pela desigualdade de Oresme, $S_{2^k} > 1 + \dfrac{k}{2}$. Qual é o menor inteiro $k$ que garante que essa cota inferior $1+\frac{k}{2}$ seja igual a $${M}$?`,
                k,
                t`$1+\frac{k}{2}=${M}\implies \frac{k}{2}=${M - 1}\implies k=${k}$.`,
              );
            }),
            mcqS(
              t`Sobre a série $\sum_{n=1}^{\infty}\dfrac{5}{n}$, é correto afirmar que:`,
              t`diverge, pois é $5$ vezes a série harmônica divergente`,
              [
                t`converge para $5$`,
                t`converge para $0$, pois $\frac{5}{n}\to 0$`,
                t`é uma série geométrica de razão $\frac{1}{5}$`,
              ],
              t`Multiplicar uma série divergente por uma constante não nula ($5$) mantém a série divergente.`,
            ),
          ],
        },
        {
          card: {
            title: 'O efeito dominó dos cancelamentos',
            body: t`Numa **série telescópica**, o termo geral é uma diferença $a_n=b_n-b_{n+1}$. Ao abrir a soma parcial $S_n$, os termos intermediários se cancelam aos pares:`,
            formula: t`\sum_{k=1}^{n}(b_k-b_{k+1})=b_1-b_{n+1}\xrightarrow{n\to\infty}b_1-\lim_{n\to\infty}b_{n+1}`,
            example: t`$\sum_{n=1}^{\infty}\frac{1}{n(n+1)}=\sum_{n=1}^{\infty}\left(\frac{1}{n}-\frac{1}{n+1}\right)$: $S_n=\left(1-\frac12\right)+\left(\frac12-\frac13\right)+\cdots+\left(\frac1n-\frac{1}{n+1}\right)=1-\frac{1}{n+1}\to 1$.`,
            tip: t`Frações parciais transformam produtos em diferenças: $\frac{k}{n(n+k)}=\frac{1}{n}-\frac{1}{n+k}$.`,
          },
          exercises: [
            fill(
              t`Complete a decomposição em frações parciais e a soma parcial $S_n$ de $\sum_{k=1}^n\frac{1}{k(k+1)}$:`,
              t`$\frac{1}{k(k+1)}=\frac{1}{k}-$ ___ $\implies S_n = 1 -$ ___`,
              [t`$\frac{1}{k+1}$`, t`$\frac{1}{n+1}$`],
              [t`$\frac{1}{k}$`, t`$\frac{1}{n}$`, t`$0$`],
              t`Todos os termos de $-\frac{1}{2}$ até $+\frac{1}{n}$ se anulam, sobrando apenas o primeiro ($1$) e o último ($-\frac{1}{n+1}$).`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 9);
              return num(
                t`Calcule a soma da série telescópica $\sum_{n=1}^{\infty}\dfrac{${a}}{n(n+1)}$.`,
                a,
                t`$${a}\sum_{n=1}^\infty\left(\frac{1}{n}-\frac{1}{n+1}\right)=${a}(1-0)=${a}$.`,
              );
            }),
            gen((rng) => {
              const m = pick(rng, [2, 3, 4, 5]);
              const q = randInt(rng, 1, 5);
              const k = m * q;
              return num(
                t`Calcule a soma da série telescópica $\sum_{n=${m}}^{\infty}\dfrac{${k}}{n(n+1)}$ (começando em $n=${m}$).`,
                q,
                t`$${k}\sum_{n=${m}}^\infty\left(\frac{1}{n}-\frac{1}{n+1}\right)=${k}\left(\frac{1}{${m}}-0\right)=\frac{${k}}{${m}}=${q}$.`,
              );
            }),
            mcqS(
              t`Qual é a soma da série telescópica $\sum_{n=1}^{\infty}\left(\dfrac{1}{n+2}-\dfrac{1}{n+3}\right)$?`,
              t`$\dfrac{1}{3}$`,
              [t`$1$`, t`$\dfrac{1}{2}$`, t`$0$`, t`$\dfrac{5}{6}$`],
              t`Em $n=1$, o primeiro termo positivo é $\frac{1}{1+2}=\frac{1}{3}$, e $\lim_{n\to\infty}\frac{1}{n+3}=0$.`,
            ),
            gen((rng) => {
              const N = pick(rng, [3, 4, 9, 19]);
              const ans = N / (N + 1);
              return num(
                t`Calcule a soma finita $S_{${N}}=\sum_{n=1}^{${N}}\dfrac{1}{n(n+1)}$.`,
                ans,
                t`$S_{${N}}=1-\frac{1}{${N}+1}=\frac{${N}}{${N + 1}}=${fmt(ans)}$.`,
              );
            }),
            mcqS(
              t`Usando $\ln\left(\frac{n}{n+1}\right)=\ln n-\ln(n+1)$, o que acontece com a série $\sum_{n=1}^{\infty}\ln\left(\dfrac{n}{n+1}\right)$?`,
              t`Diverge para $-\infty$, pois $S_n=\ln 1-\ln(n+1)=-\ln(n+1)\to -\infty$`,
              [
                t`Converge para $0$, pois $\ln 1=0$`,
                t`Converge para $1$`,
                t`Converge para $-\ln 2$`,
              ],
              t`Cuidado! Só converge quando $\lim_{n\to\infty}b_{n+1}$ é finito. Aqui $\ln(n+1)\to\infty$, logo a soma parcial vai a $-\infty$.`,
            ),
            num(
              t`Calcule $\sum_{n=1}^{\infty}\dfrac{2}{n(n+2)}=\sum_{n=1}^{\infty}\left(\dfrac{1}{n}-\dfrac{1}{n+2}\right)$ (dica: o cancelamento pula de 2 em 2, deixando os dois primeiros termos!).`,
              1.5,
              t`$\left(1-\frac13\right)+\left(\frac12-\frac14\right)+\left(\frac13-\frac15\right)+\cdots$: sobram $1+\frac{1}{2}=1{,}5$.`,
            ),
            gen((rng) => {
              const k = pick(rng, [2, 4, 6, 8]);
              return rmcq(
                rng,
                t`Se $b_n=\dfrac{${k}}{n+1}$ para $n\ge 1$, quanto vale a série telescópica $\sum_{n=1}^{\infty}(b_n-b_{n+1})$?`,
                t`$${k / 2}$`,
                [t`$${k}$`, t`$0$`, t`$${k + 1}$`, t`$\infty$`],
                t`$S=b_1-\lim_{n\to\infty}b_{n+1}=\frac{${k}}{1+1}-0=${k / 2}$.`,
              );
            }),
          ],
        },
      ],
    },
    {
      id: 'c-seq-testes',
      title: 'Testes de convergência',
      parts: [
        {
          card: {
            title: 'Séries p e comparação',
            body: t`Se $f(x)$ é contínua, positiva e decrescente, $\sum_{n=1}^\infty f(n)$ e $\int_1^\infty f(x)\,dx$ convergem ou divergem **juntas** (**Teste da Integral**). Aplicando isso a $f(x)=\frac{1}{x^p}$, obtemos a regra das **séries $p$**:`,
            visual: pSeriesLab(),
            formula: t`\sum_{n=1}^{\infty}\frac{1}{n^p}\text{ converge }\iff p>1`,
            example: t`$\sum\frac{1}{n^2+5}$: como $0<\frac{1}{n^2+5}<\frac{1}{n^2}$ e $\sum\frac{1}{n^2}$ converge ($p=2>1$), por **comparação direta** ela converge.`,
            tip: t`**Comparação no Limite**: se $a_n,b_n>0$ e $\lim_{n\to\infty}\frac{a_n}{b_n}=c\in(0,\,\infty)$, ambas têm o mesmo destino. Compare sempre com $b_n=\frac{1}{n^{\text{grau de baixo}-\text{grau de cima}}}$!`,
          },
          exercises: [
            inter(
              t`No laboratório do Teste da Integral, ajuste o expoente $p$ para que a integral $\int_1^\infty\frac{1}{x^p}\,dx=\frac{1}{p-1}$ convirja e tenha área igual a $0{,}5$.`,
              'plot',
              pSeriesLab().props,
              (v: any) => v && near(v.p.p, 3, 0.05),
              t`$p=3$`,
              t`$\frac{1}{p-1}=0{,}5\implies p-1=2\implies p=3$.`,
            ),
            tf(
              t`A série $\sum_{n=1}^{\infty}\dfrac{1}{\sqrt{n}}$ é convergente.`,
              false,
              t`$\frac{1}{\sqrt{n}}=\frac{1}{n^{1/2}}$ é uma série $p$ com $p=\frac{1}{2}\le 1$, portanto **diverge**.`,
            ),
            gen((rng) => {
              const p = pick(rng, [2, 3, 4]);
              const q = randInt(rng, 1, 5);
              const conv = q > p;
              return rmcq(
                rng,
                t`Classifique a série $\sum_{n=1}^{\infty}\dfrac{1}{\sqrt[${p}]{n^{${q}}}}$.`,
                conv ? t`Converge, pois é série $p$ com $p=\frac{${q}}{${p}}>1$` : t`Diverge, pois é série $p$ com $p=\frac{${q}}{${p}}\le 1$`,
                [
                  conv ? t`Diverge, pois é série $p$ com $p=\frac{${q}}{${p}}\le 1$` : t`Converge, pois é série $p$ com $p=\frac{${q}}{${p}}>1$`,
                  t`Diverge pelo Teste da Divergência ($\lim a_n\ne 0$)`,
                  t`Converge por ser série geométrica`,
                ],
                t`$\frac{1}{\sqrt[${p}]{n^{${q}}}}=\frac{1}{n^{${q}/${p}}}$: converge se e só se $\frac{${q}}{${p}}>1$.`,
              );
            }),
            multi(
              t`Quais das séries abaixo são **convergentes**?`,
              [
                t`$\sum_{n=1}^\infty \frac{1}{n^2}$`,
                t`$\sum_{n=1}^\infty \frac{1}{n\sqrt{n}}$`,
                t`$\sum_{n=1}^\infty \frac{1}{n^3+4}$`,
                t`$\sum_{n=1}^\infty \frac{1}{\sqrt[3]{n}}$`,
                t`$\sum_{n=1}^\infty \frac{1}{n}$`,
              ],
              [0, 1, 2],
              t`$n\sqrt{n}=n^{1{,}5}$ ($p=1{,}5>1$), $n^2$ ($p=2>1$) e $\frac{1}{n^3+4}<\frac{1}{n^3}$ convergem; já $p=\frac13$ e $p=1$ divergem.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 1, 3);
              const diff = pick(rng, [1, 2, 3]);
              const b = a + diff;
              const conv = diff > 1;
              return rmcq(
                rng,
                t`Para aplicar o Teste da Comparação no Limite em $\sum_{n=1}^{\infty}\dfrac{n^{${a}}+2}{n^{${b}}+5}$, comparamos com $b_n=\dfrac{1}{n^p}$ onde:`,
                t`$p=${diff}$, e a série ${conv ? 'converge' : 'diverge'}`,
                [
                  t`$p=${diff}$, e a série ${conv ? 'diverge' : 'converge'}`,
                  t`$p=${b}$, e a série converge`,
                  t`$p=${a}$, e a série diverge`,
                ],
                t`Grau dominante: $\frac{n^{${a}}}{n^{${b}}}=\frac{1}{n^{${diff}}}$, logo $p=${diff}$ (${conv ? '$p>1$, converge' : '$p=1$, diverge'}).`,
              );
            }),
            mcqS(
              t`Usando o Teste da Integral (com $u=\ln x$), a série $\sum_{n=2}^{\infty}\dfrac{1}{n\ln n}$:`,
              t`diverge, pois $\int_2^\infty\frac{dx}{x\ln x}=\left[\ln(\ln x)\right]_2^\infty=\infty$`,
              [
                t`converge, pois $\frac{1}{n\ln n}<\frac{1}{n}$`,
                t`converge para $\ln 2$`,
                t`diverge pelo Teste da Divergência`,
              ],
              t`Com $u=\ln x$ e $du=\frac{dx}{x}$, a integral dá $\ln(\ln x)\to\infty$, logo a série diverge.`,
            ),
            mcqS(
              t`Se $0\le a_n\le b_n$ e sabemos que $\sum b_n$ **diverge**, o que o Teste da Comparação Direta garante sobre $\sum a_n$?`,
              t`Nada se pode concluir (ser menor que infinito não garante ser finito)`,
              [
                t`$\sum a_n$ também diverge`,
                t`$\sum a_n$ certamente converge`,
                t`$\sum a_n$ converge para $0$`,
              ],
              t`Para provar convergência precisamos de $a_n\le b_n$ com $\sum b_n$ convergente; para divergência precisamos de $a_n\ge b_n$ com $\sum b_n$ divergente.`,
            ),
            match(
              t`Ligue cada série ao seu diagnóstico por comparação:`,
              [
                [t`$\sum \frac{1}{n^2+1}$`, t`Converge ($\le \frac{1}{n^2}$)`],
                [t`$\sum \frac{1}{n-0{,}5}$`, t`Diverge ($\ge \frac{1}{n}$)`],
                [t`$\sum \frac{n}{n^4+3}$`, t`Converge (compara com $\frac{1}{n^3}$)`],
                [t`$\sum \frac{1}{\sqrt{n^2+1}}$`, t`Diverge (compara com $\frac{1}{n}$)`],
              ],
              t`Olhe sempre a potência equivalente para $n$ grande.`,
            ),
          ],
        },
        {
          card: {
            title: 'Fatoriais e potências n-ésimas',
            body: t`Calcule $L=\lim_{n\to\infty}\left|\frac{a_{n+1}}{a_n}\right|$ (**Teste da Razão**) ou $L=\lim_{n\to\infty}\sqrt[n]{|a_n|}$ (**Teste da Raiz**). Nos dois testes vale a mesma régua:`,
            formula: t`L<1\implies\text{converge}\qquad L>1\implies\text{diverge}\qquad L=1\implies\text{inconclusivo}`,
            example: t`Em $\sum_{n=1}^\infty\frac{2^n}{n!}$: $\left|\frac{a_{n+1}}{a_n}\right|=\frac{2^{n+1}}{(n+1)!}\cdot\frac{n!}{2^n}=\frac{2}{n+1}\to 0<1\implies$ converge!`,
            tip: t`Tem fatorial ($n!$) ou $c^n$ misturado com polinômio? Use **Razão**. Tudo está elevado a $n$? Use **Raiz**.`,
          },
          exercises: [
            fill(
              t`Complete as conclusões do Teste da Razão (e da Raiz) de acordo com o limite $L$:`,
              t`Se $L<1$ a série ___, se $L>1$ a série ___ e se $L=1$ o teste é ___.`,
              [t`converge`, t`diverge`, t`inconclusivo`],
              [t`oscila`, t`zera`],
              t`O teste compara assintoticamente a série com uma geométrica de razão $L$.`,
            ),
            gen((rng) => {
              const k = pick(rng, [2, 4, 5, 10]);
              return num(
                t`Calcule o limite $L=\lim_{n\to\infty}\left|\dfrac{a_{n+1}}{a_n}\right|$ do Teste da Razão para a série $\sum_{n=1}^{\infty}\dfrac{n}{${k}^n}$.`,
                1 / k,
                t`$\frac{a_{n+1}}{a_n}=\frac{n+1}{${k}^{n+1}}\cdot\frac{${k}^n}{n}=\frac{1}{${k}}\cdot\frac{n+1}{n}\to\frac{1}{${k}}=${fmt(1 / k)}$ ($<1$, converge).`,
              );
            }),
            gen((rng) => {
              const b = pick(rng, [2, 4, 5]);
              const a = randInt(rng, 1, 7);
              return num(
                t`Calcule o limite $L=\lim_{n\to\infty}\sqrt[n]{|a_n|}$ do Teste da Raiz para $\sum_{n=1}^{\infty}\left(\dfrac{${a}n+1}{${b}n+3}\right)^n$.`,
                a / b,
                t`$\sqrt[n]{a_n}=\frac{${a}n+1}{${b}n+3}\to\frac{${a}}{${b}}=${fmt(a / b)}$.`,
              );
            }),
            mcqS(
              t`Aplicando o Teste da Razão à série $\sum_{n=1}^{\infty}\dfrac{n!}{10^n}$, obtemos:`,
              t`$L=\infty>1$, logo a série diverge`,
              [
                t`$L=\frac{1}{10}<1$, logo a série converge`,
                t`$L=1$, logo o teste é inconclusivo`,
                t`$L=0$, logo a série converge`,
              ],
              t`$\frac{a_{n+1}}{a_n}=\frac{(n+1)!}{10^{n+1}}\cdot\frac{10^n}{n!}=\frac{n+1}{10}\to\infty>1$.`,
            ),
            tf(
              t`Se o Teste da Razão resulta em $L=1$, podemos concluir que a série diverge.`,
              false,
              t`Quando $L=1$, o teste é **inconclusivo**: tanto $\sum\frac{1}{n}$ (divergente) quanto $\sum\frac{1}{n^2}$ (convergente) dão $L=1$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 9);
              return rmcq(
                rng,
                t`Na série $\sum_{n=1}^{\infty}\dfrac{${k}^n}{n!}$, qual é a razão simplificada $\dfrac{a_{n+1}}{a_n}$ e a conclusão do Teste da Razão?`,
                t`$\dfrac{${k}}{n+1}\to 0<1$, logo converge`,
                [
                  t`$\dfrac{n+1}{${k}}\to\infty$, logo diverge`,
                  t`$\dfrac{${k}}{n}\to ${k}>1$, logo diverge`,
                  t`$${k}(n+1)\to\infty$, logo diverge`,
                ],
                t`Como $(n+1)!=(n+1)n!$, sobra $\frac{${k}}{n+1}\to 0<1$: converge para qualquer constante $${k}$.`,
              );
            }),
            mcqS(
              t`Pelo Teste da Raiz, a série $\sum_{n=2}^{\infty}\dfrac{1}{(\ln n)^n}$:`,
              t`converge, pois $\sqrt[n]{a_n}=\frac{1}{\ln n}\to 0<1$`,
              [
                t`diverge, pois $\ln n$ cresce muito devagar`,
                t`é inconclusiva, pois $L=1$`,
                t`diverge para $+\infty$`,
              ],
              t`Tirar a raiz $n$-ésima elimina o expoente $n$: $\frac{1}{\ln n}\to 0<1$.`,
            ),
            order(
              t`Ordene a aplicação do Teste da Razão para $\sum_{n=1}^\infty\frac{n}{3^n}$:`,
              [
                t`Montar o quociente $\left|\frac{a_{n+1}}{a_n}\right|=\frac{n+1}{3^{n+1}}\cdot\frac{3^n}{n}$`,
                t`Simplificar as potências de $3$: $\frac{n+1}{3n}$`,
                t`Passar ao limite quando $n\to\infty$: $L=\frac{1}{3}$`,
                t`Concluir que, como $L=\frac{1}{3}<1$, a série converge`,
              ],
              t`Roteiro padrão do Teste da Razão.`,
            ),
          ],
        },
        {
          card: {
            title: 'Leibniz e convergência absoluta',
            body: t`Uma **série alternada** $\sum (-1)^{n-1}b_n$ ($b_n>0$) converge pelo **Critério de Leibniz** se $b_n$ é decrescente e $\lim_{n\to\infty}b_n=0$. O erro de truncamento é limitado pelo primeiro termo ignorado: $|S-S_n|\le b_{n+1}$.`,
            visual: leibnizLab(),
            formula: t`\sum |a_n|\text{ converge}\implies\sum a_n\text{ converge (absolutamente)}`,
            example: t`$\sum_{n=1}^\infty\frac{(-1)^{n-1}}{n}=1-\frac12+\frac13-\cdots$ converge por Leibniz (para $\ln 2$), mas $\sum\left|\frac{(-1)^{n-1}}{n}\right|=\sum\frac{1}{n}$ diverge: é **condicionalmente convergente**.`,
            tip: t`Classificação em 3 níveis: **absolutamente convergente** ($\sum|a_n|$ converge), **condicionalmente convergente** ($\sum a_n$ converge mas $\sum|a_n|$ diverge) ou **divergente**.`,
          },
          exercises: [
            inter(
              t`No laboratório da harmônica alternada $\sum_{n=1}^\infty\frac{(-1)^{n-1}}{n}$, escolha o **menor** $n$ tal que a cota de erro de Leibniz $b_{n+1}=\frac{1}{n+1}$ seja $\le 0{,}1$.`,
              'plot',
              leibnizLab().props,
              (v: any) => v && near(v.p.n, 9, 0.1),
              t`$n=9$`,
              t`$\frac{1}{n+1}\le 0{,}1=\frac{1}{10}\iff n+1\ge 10\iff n\ge 9$.`,
            ),
            tf(
              t`Se $\sum_{n=1}^\infty |a_n|$ converge, então $\sum_{n=1}^\infty a_n$ também converge.`,
              true,
              t`Convergência absoluta implica convergência! Cancelamentos de sinal só ajudam, nunca atrapalham.`,
            ),
            mcqS(
              t`Como se classifica a série $\sum_{n=1}^{\infty}\dfrac{(-1)^{n-1}}{n^2}$?`,
              t`Absolutamente convergente`,
              [t`Condicionalmente convergente`, t`Divergente`, t`Oscilante sem limite`],
              t`Tomando o módulo, $\sum\frac{1}{n^2}$ é uma série $p$ com $p=2>1$, que converge.`,
            ),
            gen((rng) => {
              const p = pick(rng, [2, 3, 4]);
              const isAbs = rng() < 0.5;
              const termTex = isAbs ? `n^{${p}}` : `\\sqrt[${p}]{n}`;
              return rmcq(
                rng,
                t`Classifique a série alternada $\sum_{n=1}^{\infty}\dfrac{(-1)^{n-1}}{${termTex}}$.`,
                isAbs ? t`Absolutamente convergente` : t`Condicionalmente convergente`,
                [
                  isAbs ? t`Condicionalmente convergente` : t`Absolutamente convergente`,
                  t`Divergente pelo Teste da Divergência`,
                  t`Divergente pelo Critério de Leibniz`,
                ],
                isAbs
                  ? t`Em módulo, $\sum\frac{1}{n^{${p}}}$ converge ($p=${p}>1$).`
                  : t`Converge por Leibniz ($\frac{1}{\sqrt[${p}]{n}}\downarrow 0$), mas em módulo diverge ($p=\frac{1}{${p}}\le 1$).`,
              );
            }),
            gen((rng) => {
              const N = pick(rng, [1, 3, 4, 9]);
              const bNext = 1 / ((N + 1) * (N + 1));
              return num(
                t`Na série alternada $\sum_{n=1}^{\infty}\dfrac{(-1)^{n-1}}{n^2}$, qual é a cota máxima do erro $|S-S_{${N}}|$ dada por $b_{${N + 1}}$ ao somar apenas os $${N}$ primeiros termos?`,
                bNext,
                t`Pelo teorema de Leibniz, $|S-S_{${N}}|\le b_{${N + 1}}=\frac{1}{(${N}+1)^2}=\frac{1}{${(N + 1) * (N + 1)}}=${fmt(bNext)}$.`,
              );
            }),
            mcqS(
              t`Sobre a série alternada $\sum_{n=1}^{\infty}(-1)^n\dfrac{n}{n+1}$, é correto afirmar que:`,
              t`diverge pelo Teste da Divergência, pois $b_n=\frac{n}{n+1}\to 1\ne 0$`,
              [
                t`converge condicionalmente pelo Critério de Leibniz`,
                t`converge absolutamente`,
                t`converge para $-1$`,
              ],
              t`O Critério de Leibniz exige $\lim b_n=0$. Como $\frac{n}{n+1}\to 1\ne 0$, o termo geral oscila perto de $\pm 1$ e a série diverge.`,
            ),
            match(
              t`"Qual teste usar primeiro?" Ligue cada série ao teste mais adequado:`,
              [
                [t`$\sum \frac{n!}{5^n}$`, t`Teste da Razão`],
                [t`$\sum \left(\frac{n}{2n+1}\right)^n$`, t`Teste da Raiz`],
                [t`$\sum \frac{(-1)^{n-1}}{\sqrt{n}}$`, t`Critério de Leibniz`],
                [t`$\sum \frac{1}{n^2+3}$`, t`Comparação com série $p$`],
              ],
              t`Fatorial $\to$ Razão; potência $n$-ésima $\to$ Raiz; sinal alternado $\to$ Leibniz; racional em $n$ $\to$ Comparação.`,
            ),
            mcqS(
              t`Para analisar $\sum_{n=1}^{\infty}\dfrac{\cos n}{n^2}$ (cujos sinais mudam de modo irregular), notamos que $\left|\dfrac{\cos n}{n^2}\right|\le\dfrac{1}{n^2}$. Logo a série:`,
              t`converge absolutamente (por comparação de $\sum|a_n|$ com $\sum\frac{1}{n^2}$)`,
              [
                t`diverge, pois $\cos n$ não tem limite`,
                t`converge apenas condicionalmente`,
                t`exige o Critério de Leibniz`,
              ],
              t`Leibniz não se aplica porque os sinais de $\cos n$ não se alternam estritamente, mas a convergência absoluta resolve de imediato!`,
            ),
          ],
        },
      ],
    },
  ],
};

/* ================================================================
   UNIDADE 2 — Séries de potências e Taylor (c-pot)
   ================================================================ */

export const potencias: UnitDef = {
  id: 'c-pot',
  title: 'Séries de potências e Taylor',
  subtitle: 'Raio de convergência, séries de Maclaurin e aproximações',
  icon: '📡',
  source: 'Cálculo II · Séries de Potências e Polinômios de Taylor',
  guide: t`Uma série de potências é um "polinômio de grau infinito" $\sum c_n(x-a)^n$. Dentro do seu raio de convergência, podemos derivá-la e integrá-la termo a termo — e com a fórmula de Taylor, transformar funções como $e^x$, $\operatorname{sen}x$ e $\ln(1+x)$ em polinômios fáceis de computar.`,
  lessons: [
    {
      id: 'c-pot-raio',
      title: 'Séries de potências e raio de convergência',
      parts: [
        {
          card: {
            title: 'Polinômios de grau infinito',
            body: t`Uma **série de potências** centrada em $a$ tem a forma $\sum_{n=0}^\infty c_n(x-a)^n$. Pelo Teste da Razão, existe sempre um **raio de convergência** $R\ge 0$ (ou $R=\infty$) tal que a série converge absolutamente para $|x-a|<R$ e diverge para $|x-a|>R$:`,
            visual: powerRadiusLab(),
            formula: t`R=\lim_{n\to\infty}\left|\frac{c_n}{c_{n+1}}\right|`,
            example: t`Para $\sum_{n=1}^\infty\frac{(x-2)^n}{n\cdot 3^n}$: $\left|\frac{a_{n+1}}{a_n}\right|=\frac{|x-2|}{3}\cdot\frac{n}{n+1}\to\frac{|x-2|}{3}<1\iff |x-2|<3\implies R=3$.`,
            tip: t`Toda série de potências converge pelo menos no seu centro $x=a$, onde $(x-a)^n=0$ para todo $n\ge 1$.`,
          },
          exercises: [
            inter(
              t`Configure no laboratório o centro $a$ e o raio de convergência $R$ da série de potências $\sum_{n=0}^{\infty}\dfrac{(x-1)^n}{2^n}$.`,
              'plot',
              powerRadiusLab().props,
              (v: any) => v && near(v.p.a, 1, 0.05) && near(v.p.R, 2, 0.05),
              t`$a=1$ e $R=2$`,
              t`O termo é $\left(\frac{x-1}{2}\right)^n$: centro em $a=1$ e converge para $|x-1|<2$, logo $R=2$.`,
            ),
            tf(
              t`Toda série de potências $\sum_{n=0}^\infty c_n(x-a)^n$ converge para pelo menos um valor de $x$.`,
              true,
              t`Em $x=a$, a série reduz-se a $c_0+0+0+\cdots=c_0$, convergindo sempre!`,
            ),
            gen((rng) => {
              const a = randInt(rng, -4, 4);
              const k = randInt(rng, 2, 8);
              return num(
                t`Qual é o raio de convergência $R$ da série $\sum_{n=1}^{\infty}\dfrac{(x${term(-a, '')})^n}{n\cdot ${k}^n}$?`,
                k,
                t`Pelo Teste da Razão, $\left|\frac{a_{n+1}}{a_n}\right|\to\frac{|x-${a}|}{${k}}<1\iff |x-${a}|<${k}\implies R=${k}$.`,
              );
            }),
            gen((rng) => {
              const k = pick(rng, [2, 4, 5, 10]);
              return num(
                t`Qual é o raio de convergência $R$ da série $\sum_{n=0}^{\infty}${k}^n x^n$?`,
                1 / k,
                t`$\left|\frac{a_{n+1}}{a_n}\right|=${k}|x|<1\iff |x|<\frac{1}{${k}}\implies R=\frac{1}{${k}}=${fmt(1 / k)}$.`,
              );
            }),
            mcqS(
              t`Qual é o raio de convergência da série $\sum_{n=0}^{\infty}\dfrac{x^n}{n!}$?`,
              t`$R=\infty$ (converge para todo $x\in\mathbb R$)`,
              [t`$R=0$`, t`$R=1$`, t`$R=e$`],
              t`$\left|\frac{a_{n+1}}{a_n}\right|=\frac{|x|}{n+1}\to 0<1$ para qualquer $x\in\mathbb R$, logo $R=\infty$.`,
            ),
            mcqS(
              t`Qual é o raio de convergência da série $\sum_{n=0}^{\infty}n!\,x^n$?`,
              t`$R=0$ (converge apenas no centro $x=0$)`,
              [t`$R=1$`, t`$R=\infty$`, t`$R=\frac{1}{e}$`],
              t`Para qualquer $x\ne 0$, $\left|\frac{a_{n+1}}{a_n}\right|=(n+1)|x|\to\infty>1$, logo só converge em $x=0$.`,
            ),
            gen((rng) => {
              const a = randNZ(rng, -5, 5);
              const R = randInt(rng, 1, 6);
              return rmcq(
                rng,
                t`Uma série de potências centrada em $a=${a}$ tem raio de convergência $R=${R}$. Qual é o intervalo aberto onde a convergência absoluta é garantida?`,
                t`$(${a - R},\,${a + R})$`,
                [
                  t`$(-${R},\,${R})$`,
                  t`$(${a},\,${a + R})$`,
                  t`$(${-a - R},\,${-a + R})$`,
                  t`$(${a - 2 * R},\,${a + 2 * R})$`,
                ],
                t`$|x-(${a})|<${R}\iff ${a}-${R}<x<${a}+${R}$, ou seja, $(${a - R},\,${a + R})$.`,
              );
            }),
            num(
              t`Uma série de potências centrada em $a=2$ tem a fronteira do seu intervalo de convergência passando exatamente em $x=6$. Quanto vale o raio $R$?`,
              4,
              t`O raio é a distância do centro até a extremidade: $R=|6-2|=4$ (o outro extremo é $2-4=-2$).`,
            ),
          ],
        },
        {
          card: {
            title: 'Checando as pontas do intervalo',
            body: t`Nos extremos $x=a-R$ e $x=a+R$, o Teste da Razão dá $L=1$ (inconclusivo). Para achar o **intervalo de convergência** completo, substituímos cada extremo individualmente na série e testamos as duas séries numéricas resultantes:`,
            formula: t`I\text{ pode ser }(a-R,\,a+R),\ [a-R,\,a+R),\ (a-R,\,a+R]\text{ ou }[a-R,\,a+R]`,
            example: t`Em $\sum_{n=1}^\infty\frac{x^n}{n}$ ($R=1$): para $x=1$ dá $\sum\frac{1}{n}$ (harmônica, diverge); para $x=-1$ dá $\sum\frac{(-1)^n}{n}$ (Leibniz, converge). Logo $I=[-1,\,1)$.`,
            tip: t`Quando o denominador tem $n$ na 1ª potência, um extremo costuma convergir por Leibniz e o outro divergir; quando tem $n^2$, ambos convergem ($p=2>1$)!`,
          },
          exercises: [
            order(
              t`Ordene o roteiro para determinar o intervalo de convergência de $\sum c_n(x-a)^n$:`,
              [
                t`Aplicar o Teste da Razão e impor $L<1$ para achar o raio $R$`,
                t`Escrever o intervalo aberto inicial $(a-R,\,a+R)$`,
                t`Substituir $x=a-R$ e $x=a+R$ separadamente na série`,
                t`Fechar com colchete cada extremo cuja série numérica convergir`,
              ],
              t`O Teste da Razão resolve o interior; as duas pontas são sempre testadas no braço.`,
            ),
            mcqS(
              t`Qual é o intervalo de convergência de $\sum_{n=1}^{\infty}\dfrac{x^n}{n}$?`,
              t`$[-1,\,1)$`,
              [t`$(-1,\,1)$`, t`$(-1,\,1]$`, t`$[-1,\,1]$`],
              t`$R=1$; em $x=-1$ converge (harmônica alternada) e em $x=1$ diverge (harmônica).`,
            ),
            mcqS(
              t`Qual é o intervalo de convergência de $\sum_{n=1}^{\infty}\dfrac{x^n}{n^2}$?`,
              t`$[-1,\,1]$`,
              [t`$(-1,\,1)$`, t`$[-1,\,1)$`, t`$(-1,\,1]$`],
              t`$R=1$; em $x=\pm 1$, os termos têm módulo $\frac{1}{n^2}$ e convergem em ambos os extremos ($p=2>1$).`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 7);
              return rmcq(
                rng,
                t`Qual é o intervalo de convergência de $\sum_{n=1}^{\infty}\dfrac{x^n}{n\cdot ${k}^n}$?`,
                t`$[-${k},\,${k})$`,
                [
                  t`$(-${k},\,${k})$`,
                  t`$(-${k},\,${k}]$`,
                  t`$[-${k},\,${k}]$`,
                  t`$[0,\,${k})$`,
                ],
                t`Em $x=${k}$ vira $\sum\frac{1}{n}$ (diverge); em $x=-${k}$ vira $\sum\frac{(-1)^n}{n}$ (converge por Leibniz).`,
              );
            }),
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              return rmcq(
                rng,
                t`Qual é o intervalo de convergência de $\sum_{n=1}^{\infty}\dfrac{(x${term(-a, '')})^n}{n^2}$?`,
                t`$[${a - 1},\,${a + 1}]$`,
                [
                  t`$(${a - 1},\,${a + 1})$`,
                  t`$[${a - 1},\,${a + 1})$`,
                  t`$(${a - 1},\,${a + 1}]$`,
                ],
                t`Centro $a=${a}$ e $R=1$; em $x=${a}\pm 1$ fica $\sum\frac{(\pm 1)^n}{n^2}$, que converge nos dois extremos.`,
              );
            }),
            tf(
              t`Na série geométrica $\sum_{n=0}^\infty x^n$, os extremos $x=-1$ e $x=1$ divergem, portanto o intervalo de convergência é aberto $(-1,\,1)$.`,
              true,
              t`Em $x=\pm 1$, o termo geral $(\pm 1)^n$ não tende a $0$, divergindo pelo Teste da Divergência.`,
            ),
            mcqS(
              t`Qual é o intervalo de convergência de $\sum_{n=1}^{\infty}\dfrac{(-1)^{n-1}x^n}{n}$?`,
              t`$(-1,\,1]$`,
              [t`$[-1,\,1)$`, t`$(-1,\,1)$`, t`$[-1,\,1]$`],
              t`Em $x=1$ dá $\sum\frac{(-1)^{n-1}}{n}$ (converge); em $x=-1$ dá $\sum\frac{(-1)^{2n-1}}{n}=-\sum\frac{1}{n}$ (diverge).`,
            ),
            match(
              t`Ligue cada série (todas com $R=1$) ao seu intervalo de convergência:`,
              [
                [t`$\sum_{n=0}^\infty x^n$`, t`$(-1,\,1)$`],
                [t`$\sum_{n=1}^\infty \frac{x^n}{n}$`, t`$[-1,\,1)$`],
                [t`$\sum_{n=1}^\infty \frac{(-1)^{n-1}x^n}{n}$`, t`$(-1,\,1]$`],
                [t`$\sum_{n=1}^\infty \frac{x^n}{n^2}$`, t`$[-1,\,1]$`],
              ],
              t`Os quatro formatos possíveis de intervalo para o mesmo raio $R=1$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Fábrica de novas séries',
            body: t`Dentro de $(a-R,\,a+R)$, podemos **derivar** e **integrar** uma série de potências termo a termo, preservando o **mesmo raio $R$**. Quase tudo nasce da série geométrica:`,
            formula: t`\frac{1}{1-x}=\sum_{n=0}^{\infty}x^n=1+x+x^2+x^3+\cdots\quad(|x|<1)`,
            example: t`Trocando $x$ por $-x$: $\frac{1}{1+x}=1-x+x^2-x^3+\cdots$. Integrando termo a termo: $$\ln(1+x)=\sum_{n=1}^{\infty}(-1)^{n-1}\frac{x^n}{n}=x-\frac{x^2}{2}+\frac{x^3}{3}-\frac{x^4}{4}+\cdots$$`,
            tip: t`Trocando $x$ por $-x^2$ em $\frac{1}{1-x}$ temos $\frac{1}{1+x^2}=1-x^2+x^4-x^6+\cdots$, cuja integral é a série de $\operatorname{arctg}x$!`,
          },
          exercises: [
            tf(
              t`Ao derivar ou integrar uma série de potências termo a termo, o raio de convergência $R$ não se altera.`,
              true,
              t`O raio $R$ é sempre preservado (apenas a convergência nos extremos $a\pm R$ pode mudar).`,
            ),
            mcqS(
              t`Substituindo $x$ por $-x$ em $\dfrac{1}{1-x}=\sum_{n=0}^\infty x^n$, qual é a série de potências de $\dfrac{1}{1+x}$ para $|x|<1$?`,
              t`$\sum_{n=0}^{\infty}(-1)^n x^n = 1-x+x^2-x^3+\cdots$`,
              [
                t`$\sum_{n=0}^{\infty}-x^n = -1-x-x^2-\cdots$`,
                t`$\sum_{n=1}^{\infty}\frac{x^n}{n}$`,
                t`$1+x-x^2+x^3-\cdots$`,
              ],
              t`$(-x)^n=(-1)^n x^n$, gerando sinais alternados.`,
            ),
            mcqS(
              t`Derivando termo a termo $\dfrac{1}{1-x}=1+x+x^2+x^3+\cdots$, qual série obtemos para $\dfrac{1}{(1-x)^2}$ ($|x|<1$)?`,
              t`$\sum_{n=1}^{\infty}n x^{n-1}=1+2x+3x^2+4x^3+\cdots$`,
              [
                t`$\sum_{n=0}^{\infty}x^{2n}=1+x^2+x^4+\cdots$`,
                t`$\sum_{n=1}^{\infty}\frac{x^n}{n}$`,
                t`$\sum_{n=0}^{\infty}(n+1)x^{n+1}$`,
              ],
              t`$\frac{d}{dx}(x^n)=n x^{n-1}$, e a derivada de $\frac{1}{1-x}$ é $\frac{1}{(1-x)^2}$.`,
            ),
            gen((rng) => {
              const k = pick(rng, [2, 3, 4]);
              const ans = (k * k) / ((k - 1) * (k - 1));
              return num(
                t`Sabendo que $\sum_{n=1}^{\infty}n x^{n-1}=\dfrac{1}{(1-x)^2}$ para $|x|<1$, calcule o valor exato de $\sum_{n=1}^{\infty}\dfrac{n}{${k}^{n-1}}$.`,
                ans,
                t`Basta substituir $x=\frac{1}{${k}}$: $\frac{1}{(1-1/${k})^2}=\frac{1}{((${k - 1})/${k})^2}=\frac{${k * k}}{${(k - 1) * (k - 1)}}=${fmt(ans)}$.`,
                { tol: 0.005 },
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return rmcq(
                rng,
                t`Substituindo $u=${k}x^2$ em $\dfrac{1}{1-u}=\sum_{n=0}^\infty u^n$, qual é a série de potências de $\dfrac{1}{1-${k}x^2}$?`,
                t`$\sum_{n=0}^{\infty}${k}^n x^{2n}$`,
                [
                  t`$\sum_{n=0}^{\infty}${k} x^{2n}$`,
                  t`$\sum_{n=0}^{\infty}(-1)^n ${k}^n x^{2n}$`,
                  t`$\sum_{n=0}^{\infty}${k}^n x^n$`,
                ],
                t`$(${k}x^2)^n=${k}^n x^{2n}$ para $|x|<\frac{1}{\sqrt{${k}}}$.`,
              );
            }),
            fill(
              t`Integrando $\frac{1}{1+x^2}=1-x^2+x^4-x^6+\cdots$ termo a termo, complete a série de Maclaurin de $\operatorname{arctg}x$:`,
              t`$\operatorname{arctg}x = x -$ ___ $+$ ___ $-\cdots$`,
              [t`$\frac{x^3}{3}$`, t`$\frac{x^5}{5}$`],
              [t`$\frac{x^3}{3!}$`, t`$\frac{x^2}{2}$`, t`$\frac{x^4}{4}$`],
              t`$\int x^{2n}\,dx=\frac{x^{2n+1}}{2n+1}$ (sem fatorial no denominador!).`,
            ),
            mcqS(
              t`Substituindo $x=1$ na série $\operatorname{arctg}x=x-\frac{x^3}{3}+\frac{x^5}{5}-\frac{x^7}{7}+\cdots$, descobrimos que $1-\frac{1}{3}+\frac{1}{5}-\frac{1}{7}+\cdots$ vale:`,
              t`$\dfrac{\pi}{4}$`,
              [t`$\pi$`, t`$\dfrac{\pi}{2}$`, t`$\ln 2$`, t`$1$`],
              t`$\operatorname{arctg}(1)=\frac{\pi}{4}$ (a célebre fórmula de Leibniz para $\pi$).`,
            ),
            mcqS(
              t`Na série de Maclaurin $\ln(1+x)=x-\frac{x^2}{2}+\frac{x^3}{3}-\frac{x^4}{4}+\cdots$, qual é o coeficiente de $x^4$?`,
              t`$-\dfrac{1}{4}$`,
              [t`$\dfrac{1}{4}$`, t`$-\dfrac{1}{24}$`, t`$\dfrac{1}{24}$`],
              t`Em $\ln(1+x)=\sum_{n=1}^\infty\frac{(-1)^{n-1}}{n}x^n$, para $n=4$ o coeficiente é $-\frac{1}{4}$ (dividido por $4$, não por $4!$).`,
            ),
          ],
        },
      ],
    },
    {
      id: 'c-pot-taylor',
      title: 'Séries e polinômios de Taylor',
      parts: [
        {
          card: {
            title: 'Construindo o polinômio que imita f(x)',
            body: t`Para que um polinômio tenha em $x=a$ o mesmo valor e as mesmas derivadas de $f(x)$ até a ordem $n$, seus coeficientes devem ser $c_k=\frac{f^{(k)}(a)}{k!}$. Essa é a **série de Taylor** (quando $a=0$, chamada de **série de Maclaurin**):`,
            visual: taylorExpLab(),
            formula: t`f(x)=\sum_{n=0}^{\infty}\frac{f^{(n)}(a)}{n!}(x-a)^n`,
            example: t`Para $f(x)=e^x$ em $a=0$, todas as derivadas valem $f^{(n)}(0)=e^0=1$: $$e^x=\sum_{n=0}^{\infty}\frac{x^n}{n!}=1+x+\frac{x^2}{2!}+\frac{x^3}{3!}+\cdots\quad(\forall x\in\mathbb R)$$`,
            tip: t`O polinômio de Taylor de grau $1$, $P_1(x)=f(a)+f'(a)(x-a)$, é exatamente a reta tangente em $x=a$!`,
          },
          exercises: [
            inter(
              t`No laboratório de $e^x$, ajuste o grau $n$ para o **menor** inteiro que aproxima $e^1\approx 2{,}7183$ com erro menor que $0{,}05$.`,
              'plot',
              taylorExpLab().props,
              (v: any) => v && near(v.p.n, 4, 0.1),
              t`$n=4$`,
              t`Para $n=3$, $P_3(1)=2{,}6667$ (erro $0{,}0516>0{,}05$); para $n=4$, $P_4(1)=2{,}7083$ (erro $0{,}0099<0{,}05$).`,
            ),
            fill(
              t`Complete a fórmula do coeficiente de grau $n$ da série de Taylor centrada em $a$:`,
              t`$c_n =$ ___ dividido por ___`,
              [t`$f^{(n)}(a)$`, t`$n!$`],
              [t`$f(a)$`, t`$n$`, t`$x^n$`],
              t`Ao derivar $(x-a)^n$ $n$ vezes sobra $n!$, que é cancelado pelo denominador de $c_n=\frac{f^{(n)}(a)}{n!}$.`,
            ),
            gen((rng) => {
              const k = randNZ(rng, -5, 6);
              return num(
                t`Se uma função tem terceira derivada $f'''(a)=${6 * k}$, quanto vale o coeficiente $c_3$ de $(x-a)^3$ na sua série de Taylor?`,
                k,
                t`$c_3=\frac{f'''(a)}{3!}=\frac{${6 * k}}{6}=${k}$.`,
              );
            }),
            gen((rng) => {
              const k = randNZ(rng, -6, 6);
              return num(
                t`A série de Taylor de $f(x)$ em torno de $a=1$ começa com $f(x)=4-3(x-1)${term(k, '(x-1)^2')}+\cdots$. Quanto vale a segunda derivada $f''(1)$?`,
                2 * k,
                t`Como $c_2=\frac{f''(1)}{2!}=${k}$, temos $f''(1)=2!\cdot(${k})=${2 * k}$.`,
              );
            }),
            mcqS(
              t`Qual é o polinômio de Taylor de grau $2$ de $f(x)=\sqrt{x}$ em torno de $a=1$?`,
              t`$1+\frac{1}{2}(x-1)-\frac{1}{8}(x-1)^2$`,
              [
                t`$1+\frac{1}{2}(x-1)-\frac{1}{4}(x-1)^2$`,
                t`$1+\frac{1}{2}x-\frac{1}{8}x^2$`,
                t`$1+(x-1)-\frac{1}{2}(x-1)^2$`,
              ],
              t`$f(1)=1$, $f'(1)=\frac{1}{2}$ e $f''(1)=-\frac{1}{4}\implies c_2=\frac{-1/4}{2!}=-\frac{1}{8}$.`,
            ),
            num(
              t`Usando a série $e^x=\sum_{n=0}^\infty\frac{x^n}{n!}$, quanto vale a soma $\sum_{n=0}^{\infty}\dfrac{1}{n!}=1+1+\dfrac{1}{2!}+\dfrac{1}{3!}+\cdots$ (arredonde para 2 casas)?`,
              2.72,
              t`É a série de $e^x$ avaliada em $x=1$, logo vale $e^1=e\approx 2{,}72$.`,
              { tol: 0.01 },
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              return rmcq(
                rng,
                t`Substituindo $x$ por $${k}x$ na série de $e^x$, qual é a série de Maclaurin de $f(x)=e^{${k}x}$?`,
                t`$\sum_{n=0}^{\infty}\dfrac{${k}^n x^n}{n!}$`,
                [
                  t`$\sum_{n=0}^{\infty}\dfrac{${k} x^n}{n!}$`,
                  t`$\sum_{n=0}^{\infty}\dfrac{x^{${k}n}}{n!}$`,
                  t`$\sum_{n=0}^{\infty}\dfrac{${k}^n x^n}{n}$`,
                ],
                t`$e^{${k}x}=\sum_{n=0}^\infty\frac{(${k}x)^n}{n!}=\sum_{n=0}^\infty\frac{${k}^n x^n}{n!}$.`,
              );
            }),
            mcqS(
              t`Qual é a soma exata da série numérica $\sum_{n=0}^{\infty}\dfrac{(\ln 5)^n}{n!}$?`,
              t`$5$`,
              [t`$\ln 5$`, t`$e^5$`, t`$1$`],
              t`É a série $\sum\frac{x^n}{n!}=e^x$ avaliada em $x=\ln 5$: $e^{\ln 5}=5$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Ondas em forma de polinômio',
            body: t`Em $a=0$, as derivadas de $\operatorname{sen}x$ ciclam em $0, 1, 0, -1$. Por simetria, o **seno** só tem potências **ímpares** e o **cosseno** só tem potências **pares**, ambos com sinais alternados:`,
            visual: taylorLab(),
            formula: t`\operatorname{sen}x=\sum_{n=0}^{\infty}(-1)^n\frac{x^{2n+1}}{(2n+1)!}=x-\frac{x^3}{3!}+\frac{x^5}{5!}-\cdots`,
            example: t`Derivando o seno termo a termo: $$\cos x=\sum_{n=0}^{\infty}(-1)^n\frac{x^{2n}}{(2n)!}=1-\frac{x^2}{2!}+\frac{x^4}{4!}-\cdots$$`,
            tip: t`Trocando $x$ por $i\theta$ ($i^2=-1$) na série de $e^x$, os termos pares viram $\cos\theta$ e os ímpares viram $i\operatorname{sen}\theta$, provando a **fórmula de Euler**: $e^{i\theta}=\cos\theta+i\operatorname{sen}\theta$!`,
          },
          exercises: [
            inter(
              t`No laboratório de $\operatorname{sen}x$, aumente o grau $n$ para o **menor** grau ímpar capaz de aproximar $\operatorname{sen}(2)$ com erro menor que $0{,}01$.`,
              'plot',
              taylorLab().props,
              (v: any) => v && near(v.p.n, 7, 0.1),
              t`$n=7$`,
              t`Em $x=2$: grau $5$ tem erro $0{,}024$; grau $7$ tem erro $0{,}0014<0{,}01$. Veja como o polinômio abraça mais voltas da onda!`,
            ),
            tf(
              t`A série de Maclaurin de $\cos x$ possui apenas potências pares de $x$ porque $\cos x$ é uma função par.`,
              true,
              t`Todas as derivadas de ordem ímpar de $\cos x$ valem $\pm\operatorname{sen}(0)=0$.`,
            ),
            match(
              t`Ligue cada função elementar à sua série de Maclaurin:`,
              [
                [t`$e^x$`, t`$1+x+\frac{x^2}{2!}+\frac{x^3}{3!}+\cdots$`],
                [t`$\operatorname{sen}x$`, t`$x-\frac{x^3}{3!}+\frac{x^5}{5!}-\cdots$`],
                [t`$\cos x$`, t`$1-\frac{x^2}{2!}+\frac{x^4}{4!}-\cdots$`],
                [t`$\frac{1}{1-x}$`, t`$1+x+x^2+x^3+\cdots$`],
              ],
              t`As quatro expansões mais importantes do Cálculo.`,
            ),
            gen((rng) => {
              const k = pick(rng, [2, 3, 4]);
              return rmcq(
                rng,
                t`Qual é o polinômio de Maclaurin de grau $2$ de $f(x)=\cos(${k}x)$?`,
                t`$1-\dfrac{${k * k}}{2}x^2$`,
                [
                  t`$1-${k}x^2$`,
                  t`$1+\dfrac{${k * k}}{2}x^2$`,
                  t`$${k}x-\dfrac{${k ** 3}}{6}x^3$`,
                ],
                t`Substituindo $u=${k}x$ em $\cos u\approx 1-\frac{u^2}{2}$: $1-\frac{(${k}x)^2}{2}=1-\frac{${k * k}}{2}x^2$.`,
              );
            }),
            gen((rng) => {
              const x0 = pick(rng, [0.2, 0.4, 0.6]);
              const ans = 1 - (x0 * x0) / 2;
              return num(
                t`Para pequenas oscilações em engenharia, aproximamos $\cos x\approx 1-\dfrac{x^2}{2}$ ($x$ em radianos). Calcule essa aproximação para $x=${fmt(x0)}$.`,
                ans,
                t`$P_2(${fmt(x0)})=1-\frac{(${fmt(x0)})^2}{2}=1-${fmt((x0 * x0) / 2)}=${fmt(ans)}$.`,
              );
            }),
            mcqS(
              t`Pela fórmula de Euler $e^{i\theta}=\cos\theta+i\operatorname{sen}\theta$ (deduzida das séries de Maclaurin), quanto vale $e^{i\pi}+1$?`,
              t`$0$`,
              [t`$2$`, t`$1+i$`, t`$-1$`],
              t`$e^{i\pi}=\cos\pi+i\operatorname{sen}\pi=-1+0=-1\implies e^{i\pi}+1=0$ (identidade de Euler).`,
            ),
            mcqS(
              t`Multiplicando por $x$ a série de $\operatorname{sen}(x^2)$, qual função tem série de Maclaurin $x^3-\dfrac{x^7}{3!}+\dfrac{x^{11}}{5!}-\cdots$?`,
              t`$x\operatorname{sen}(x^2)$`,
              [t`$\operatorname{sen}(x^3)$`, t`$x^2\operatorname{sen}x$`, t`$\cos(x^3)$`],
              t`$\operatorname{sen}(x^2)=x^2-\frac{x^6}{3!}+\frac{x^{10}}{5!}-\cdots$; multiplicando por $x$, os expoentes sobem para $3, 7, 11, \ldots$`,
            ),
            num(
              t`Pela série de Maclaurin $g(x)=\cos(2x)=1-\frac{(2x)^2}{2!}+\frac{(2x)^4}{4!}-\cdots$, quanto vale a quarta derivada $g^{(4)}(0)$?`,
              16,
              t`O coeficiente de $x^4$ é $\frac{g^{(4)}(0)}{4!}=\frac{2^4}{4!}=\frac{16}{4!}$, portanto $g^{(4)}(0)=16$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Resto de Lagrange, integrais e limites',
            body: t`Ao truncar a série no grau $n$, o erro $R_n(x)=f(x)-P_n(x)$ é limitado pela **fórmula de Lagrange**: se $|f^{(n+1)}(t)|\le M$ entre $a$ e $x$, então`,
            formula: t`|R_n(x)|\le\frac{M}{(n+1)!}|x-a|^{n+1}`,
            example: t`Limites com $\frac{0}{0}$ saem rápido trocando a função pelos primeiros termos de Maclaurin: $$\lim_{x\to 0}\frac{e^x-1-x}{x^2}=\lim_{x\to 0}\frac{\left(1+x+\frac{x^2}{2}+\cdots\right)-1-x}{x^2}=\frac{1}{2}$$`,
            tip: t`Integrais sem primitiva elementar, como $\int_0^1 e^{-x^2}\,dx$, são resolvidas na prática integrando a série de Maclaurin termo a termo!`,
          },
          exercises: [
            gen((rng) => {
              const x0 = pick(rng, [0.1, 0.2, 0.4]);
              const ans = 1 + x0 + (x0 * x0) / 2;
              return num(
                t`Use o polinômio de Maclaurin de grau $2$, $P_2(x)=1+x+\dfrac{x^2}{2}$, para aproximar $e^{${fmt(x0)}}$.`,
                ans,
                t`$P_2(${fmt(x0)})=1+${fmt(x0)}+${fmt((x0 * x0) / 2)}=${fmt(ans)}$.`,
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 1, 4);
              const ans = (k * k) / 2;
              return num(
                t`Use a série de Maclaurin de $e^{${k === 1 ? '' : k}x}$ para calcular $\lim_{x\to 0}\dfrac{e^{${k === 1 ? '' : k}x}-1-${k === 1 ? '' : k}x}{x^2}$.`,
                ans,
                t`$e^{${k}x}=1+${k}x+\frac{${k * k}x^2}{2}+\cdots\implies \frac{e^{${k}x}-1-${k}x}{x^2}\to\frac{${k * k}}{2}=${fmt(ans)}$.`,
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 1, 3);
              const ans = k ** 3;
              return num(
                t`Usando $\operatorname{sen}u=u-\frac{u^3}{6}+\cdots$, calcule $\lim_{x\to 0}\dfrac{6\left(${k === 1 ? '' : k}x-\operatorname{sen}(${k === 1 ? '' : k}x)\right)}{x^3}$.`,
                ans,
                t`$${k}x-\operatorname{sen}(${k}x)=\frac{(${k}x)^3}{6}-\cdots=\frac{${ans}}{6}x^3-\cdots$; multiplicando por $6$ e dividindo por $x^3$, tende a $${ans}$.`,
              );
            }),
            mcqS(
              t`Usando $\cos x=1-\frac{x^2}{2!}+\frac{x^4}{4!}-\cdots$, calcule $\lim_{x\to 0}\dfrac{\cos x-1+\frac{x^2}{2}}{x^4}$.`,
              t`$\dfrac{1}{24}$`,
              [t`$-\dfrac{1}{24}$`, t`$\dfrac{1}{4}$`, t`$0$`, t`$\dfrac{1}{2}$`],
              t`O numerador começa com $\frac{x^4}{4!}=\frac{x^4}{24}$; dividindo por $x^4$, o limite é $\frac{1}{24}$.`,
            ),
            mcqS(
              t`Integrando termo a termo $e^{-x^2}=1-x^2+\frac{x^4}{2!}-\frac{x^6}{3!}+\cdots$, obtemos para $\int e^{-x^2}\,dx$:`,
              t`$x-\dfrac{x^3}{3}+\dfrac{x^5}{10}-\dfrac{x^7}{42}+\cdots+C$`,
              [
                t`$x-\dfrac{x^3}{3!}+\dfrac{x^5}{5!}-\cdots+C$`,
                t`$-\dfrac{e^{-x^2}}{2x}+C$`,
                t`$1-2x+\dfrac{4x^3}{2!}-\cdots+C$`,
              ],
              t`$\int\frac{x^4}{2}\,dx=\frac{x^5}{10}$ e $\int\frac{x^6}{6}\,dx=\frac{x^7}{42}$.`,
            ),
            num(
              t`Usando os dois primeiros termos de $\int_0^x e^{-t^2}\,dt\approx x-\dfrac{x^3}{3}$, calcule a aproximação de $\int_0^{0{,}3} e^{-t^2}\,dt$.`,
              0.291,
              t`$0{,}3-\frac{(0{,}3)^3}{3}=0{,}3-\frac{0{,}027}{3}=0{,}3-0{,}009=0{,}291$.`,
            ),
            mcqS(
              t`Para $f(x)=\operatorname{sen}x$ ou $\cos x$, todas as derivadas satisfazem $|f^{(n+1)}(t)|\le 1$. Pela fórmula de Lagrange, o erro $|R_n(x)|$ em torno de $a=0$ é no máximo:`,
              t`$\dfrac{|x|^{n+1}}{(n+1)!}$`,
              [
                t`$\dfrac{|x|^n}{n!}$`,
                t`$\dfrac{|x|^{n+1}}{n+1}$`,
                t`$|x|^{n+1}$`,
              ],
              t`Substituindo $M=1$ e $a=0$ em $\frac{M}{(n+1)!}|x-a|^{n+1}$, obtemos $\frac{|x|^{n+1}}{(n+1)!}$.`,
            ),
            num(
              t`Se $|f^{(3)}(t)|\le 12$ para todo $t\in[0,\,0{,}5]$, qual é a cota máxima do erro $|R_2(0{,}5)|$ pelo Resto de Lagrange ao usar o polinômio de Maclaurin de grau $2$ em $x=0{,}5$?`,
              0.25,
              t`$|R_2(0{,}5)|\le\frac{M}{3!}|0{,}5|^3=\frac{12}{6}\cdot 0{,}125=2\cdot 0{,}125=0{,}25$.`,
            ),
          ],
        },
      ],
    },
  ],
};
