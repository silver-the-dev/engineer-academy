import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi, table } from '../../helpers';
import { AreaUnder, FnCurve, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, term } from '../../../lib/random';

const t = String.raw;

const FUNCS = [
  { name: '1', tex: '1', f: (_: number) => 1, F: (s: number) => 1 / s, Ftex: '\\frac1s' },
  { name: 't', tex: 't', f: (x: number) => x, F: (s: number) => 1 / (s * s), Ftex: '\\frac1{s^2}' },
  { name: 'e^{0,5t}', tex: 'e^{0{,}5t}', f: (x: number) => Math.exp(0.5 * x), F: (s: number) => 1 / (s - 0.5), Ftex: '\\frac1{s-0{,}5}' },
  { name: 'cos t', tex: '\\cos t', f: (x: number) => Math.cos(x), F: (s: number) => s / (s * s + 1), Ftex: '\\frac{s}{s^2+1}' },
];

/** Area under e^{-st} f(t): the Laplace transform as a function of s. */
const laplaceLab = () =>
  plot({
    view: { xMin: -0.3, xMax: 8, yMin: -1.2, yMax: 2.2 },
    params: [
      { key: 'fi', label: 'f', min: 0, max: 3, step: 1, value: 0, color: C.p2, format: (v: number) => FUNCS[Math.round(v)].name },
      { key: 's', label: 's', min: 0.6, max: 4, step: 0.05, value: 1, color: C.p5 },
    ],
    render: ({ p }: any) => {
      const F = FUNCS[Math.round(p.fi)];
      const g = (x: number) => Math.exp(-p.s * x) * F.f(x);
      return (
        <>
          <FnCurve f={F.f} from={0} color={C.textMuted} width={1.6} dash="5 5" />
          <AreaUnder f={g} a={0} b={8} color={C.p1} opacity={0.35} />
          <FnCurve f={g} from={0} color={C.p1} />
        </>
      );
    },
    info: ({ p }: any) => {
      const F = FUNCS[Math.round(p.fi)];
      return t`Tracejada: $f(t)=${F.tex}$ · área sob $e^{-st}f(t)$ $=F(${fmt(p.s, 2)})=${F.Ftex}\big|_{s=${fmt(p.s, 2)}}\approx${fmt(F.F(p.s), 3)}$`;
    },
  });

/** Unit step u(t - a) multiplied by an amplitude. */
const stepLab = () =>
  plot({
    view: { xMin: -0.5, xMax: 8, yMin: -0.5, yMax: 4 },
    params: [
      { key: 'a', label: 'a', min: 0, max: 6, step: 0.5, value: 2, color: C.gold },
      { key: 'A', label: 'A', min: 0.5, max: 3, step: 0.5, value: 2, color: C.p2 },
    ],
    render: ({ p }: any) => (
      <>
        <Seg x1={-0.5} y1={0} x2={p.a} y2={0} color={C.p1} width={3} />
        <Seg x1={p.a} y1={p.A} x2={8} y2={p.A} color={C.p1} width={3} />
        <Seg x1={p.a} y1={0} x2={p.a} y2={p.A} color={C.p1} width={1.5} dash="4 4" />
        <Pt x={p.a} y={p.A} color={C.gold} r={5} />
      </>
    ),
    info: ({ p }: any) => t`$f(t)=${fmt(p.A)}\,u(t-${fmt(p.a)})$ ⟹ $F(s)=\dfrac{${fmt(p.A)}\,e^{-${fmt(p.a)}s}}{s}$ (liga em $t=${fmt(p.a)}$)`,
  });

/** Impulse response of a 2nd-order system with poles alpha ± beta i. */
const polesLab = () =>
  plot({
    view: { xMin: -0.3, xMax: 10, yMin: -2.5, yMax: 2.5 },
    params: [
      { key: 'al', label: '\\alpha', min: -1.5, max: 0.4, step: 0.05, value: -0.3, color: C.p5 },
      { key: 'be', label: '\\beta', min: 0, max: 4, step: 0.1, value: 2, color: C.p3 },
    ],
    render: ({ p }: any) => (
      <>
        <Seg x1={0} y1={0} x2={10} y2={0} color={C.textDim} width={1} dash="4 4" />
        <FnCurve f={(x) => Math.exp(p.al * x)} from={0} color={C.textMuted} width={1.4} dash="5 5" />
        <FnCurve f={(x) => -Math.exp(p.al * x)} from={0} color={C.textMuted} width={1.4} dash="5 5" />
        <FnCurve f={(x) => Math.exp(p.al * x) * Math.cos(p.be * x)} from={0} color={C.p1} />
      </>
    ),
    info: ({ p }: any) =>
      t`Polos $s=${fmt(p.al, 2)}\pm${fmt(p.be, 1)}i$ · ` + (p.al < -1e-6 ? '**estável** (parte real < 0: a resposta morre)' : p.al > 1e-6 ? '**instável** (parte real > 0: a resposta explode)' : '**marginal** (oscila para sempre)'),
  });

const sMinus = (a: number) => (a === 0 ? 's' : a > 0 ? `s-${a}` : `s+${-a}`);

export const laplace: UnitDef = {
  id: 'd-lap',
  title: 'Transformada de Laplace',
  subtitle: 'Do tempo para s: EDOs viram álgebra',
  icon: '🔁',
  source: 'Cálculo 4 · Ferramentas de engenharia',
  guide: t`A transformada de Laplace $F(s)=\int_0^\infty e^{-st}f(t)\,dt$ troca **derivadas por multiplicações por $s$**. Um PVI vira uma equação algébrica em $Y(s)$; resolvemos, decompomos em frações parciais e voltamos com a tabela. É a linguagem dos sistemas de controle: funções de transferência e polos.`,
  lessons: [
    {
      id: 'd-lap-def',
      title: 'Definição e tabela',
      parts: [
        {
          card: {
            title: 'Uma integral que muda de mundo',
            body: t`$$\mathcal L\{f\}(s)=F(s)=\int_0^\infty e^{-st}f(t)\,dt$$

O peso $e^{-st}$ "apaga" o futuro distante; para cada $s$ sai um número — a área sob $e^{-st}f(t)$. Escolha $f$ e varie $s$:`,
            visual: laplaceLab(),
            example: t`$\mathcal L\{1\}=\int_0^\infty e^{-st}dt=\left[-\frac{e^{-st}}{s}\right]_0^\infty=\frac1s$ (para $s>0$).`,
          },
          exercises: [
            tf(t`A transformada de Laplace é definida por uma integral imprópria de $0$ a $\infty$.`, true, t`$\int_0^\infty e^{-st}f(t)\,dt$.`),
            mcqS(t`Quanto vale $\mathcal L\{1\}$?`, t`$\frac1s$`, [t`$s$`, t`$1$`, t`$\frac1{s^2}$`, t`$e^{-s}$`], t`$\int_0^\infty e^{-st}dt=\frac1s$ para $s>0$.`),
            gen((rng) => {
              const s = randInt(rng, 2, 6);
              return num(t`Calcule $\mathcal L\{1\}$ em $s=${s}$ (3 casas).`, 1 / s, t`$F(${s})=\frac1{${s}}\approx${fmt(1 / s, 3)}$.`, { tol: 0.002 });
            }),
            mcqS(t`Quanto vale $\mathcal L\{e^{at}\}$?`, t`$\frac{1}{s-a}$ para $s>a$`, [t`$\frac{1}{s+a}$`, t`$\frac{a}{s}$`, t`$e^{-as}$`, t`$\frac{s}{s^2+a^2}$`], t`$\int_0^\infty e^{-(s-a)t}dt=\frac1{s-a}$.`),
            gen((rng) => {
              const a = randNZ(rng, -5, 5);
              return rmcq(rng, t`$\mathcal L\{e^{${a}t}\}=$`, `$\\frac{1}{${sMinus(a)}}$`, [`$\\frac{1}{${sMinus(-a)}}$`, `$\\frac{${a}}{s}$`, `$\\frac{s}{s^2+${a * a}}$`, `$e^{${-a}s}$`], t`Regra $\frac{1}{s-a}$ com $a=${a}$.`);
            }),
            inter(t`No lab, escolha $f=1$ e ajuste $s$ até a área valer $0{,}5$.`, 'plot', laplaceLab().props, (v: any) => v && Math.round(v.p.fi) === 0 && near(v.p.s, 2, 0.06), t`$\frac1s=0{,}5\Rightarrow s=2$.`, t`$\mathcal L\{1\}=\int_0^\infty e^{-st}dt=\frac1s$; a área sob $e^{-st}$ vale $0{,}5$ quando $s=2$.`),
            tf(t`$\mathcal L\{e^{2t}\}$ só existe para $s>2$.`, true, t`Para $s\le2$ a integral $\int_0^\infty e^{(2-s)t}dt$ diverge.`),
            num(t`Use a definição: $\mathcal L\{e^{3t}\}$ em $s=5$ vale quanto?`, 0.5, t`$\frac{1}{5-3}=\frac12$.`),
          ],
        },
        {
          card: {
            title: 'A tabela essencial',
            body: t`Ninguém integra toda vez — usa-se a tabela:`,
            visual: table(['$f(t)$', '$F(s)$'], [['$1$', '$\\frac1s$'], ['$t^n$', '$\\frac{n!}{s^{n+1}}$'], ['$e^{at}$', '$\\frac1{s-a}$'], ['$\\operatorname{sen}bt$', '$\\frac{b}{s^2+b^2}$'], ['$\\cos bt$', '$\\frac{s}{s^2+b^2}$']]),
            tip: t`Seno tem $b$ no numerador; cosseno tem $s$.`,
          },
          exercises: [
            match(t`Ligue cada função à sua transformada:`, [
              [t`$t$`, t`$\frac1{s^2}$`],
              [t`$t^2$`, t`$\frac2{s^3}$`],
              [t`$\operatorname{sen}3t$`, t`$\frac3{s^2+9}$`],
              [t`$\cos3t$`, t`$\frac{s}{s^2+9}$`],
            ], t`Use a tabela: $t^n\to\frac{n!}{s^{n+1}}$.`),
            gen((rng) => {
              const n = randInt(rng, 2, 5);
              const fact = [1, 1, 2, 6, 24, 120][n];
              return rmcq(rng, t`$\mathcal L\{t^{${n}}\}=$`, `$\\frac{${fact}}{s^{${n + 1}}}$`, [`$\\frac{${fact}}{s^{${n}}}$`, `$\\frac{1}{s^{${n + 1}}}$`, `$\\frac{${n}}{s^{${n + 1}}}$`, `$\\frac{${fact * (n + 1)}}{s^{${n + 2}}}$`], t`$\frac{${n}!}{s^{${n + 1}}}$, com $${n}!=${fact}$.`);
            }),
            gen((rng) => {
              const b = randInt(rng, 2, 6);
              const sin = rng() < 0.5;
              return rmcq(rng, t`$\mathcal L\{${sin ? '\\operatorname{sen}' : '\\cos'}${b}t\}=$`, sin ? `$\\frac{${b}}{s^2+${b * b}}$` : `$\\frac{s}{s^2+${b * b}}$`, [sin ? `$\\frac{s}{s^2+${b * b}}$` : `$\\frac{${b}}{s^2+${b * b}}$`, `$\\frac{${b}}{s^2-${b * b}}$`, `$\\frac{1}{s-${b}}$`, `$\\frac{${b}}{s^2+${b}}$`], sin ? t`Seno: $\frac{b}{s^2+b^2}$.` : t`Cosseno: $\frac{s}{s^2+b^2}$.`);
            }),
            tf(t`$\mathcal L\{t^3\}=\frac{6}{s^4}$.`, true, t`$3!=6$ e expoente $3+1=4$.`),
            num(t`Calcule $\mathcal L\{\operatorname{sen}2t\}$ em $s=0$.`, 0.5, t`$\frac{2}{0+4}=\frac12$ (é a área $\int_0^\infty\operatorname{sen}2t\,dt$ no sentido de Abel).`),
            mcqS(t`Qual $f(t)$ tem $F(s)=\dfrac{s}{s^2+16}$?`, t`$\cos4t$`, [t`$\operatorname{sen}4t$`, t`$\cos16t$`, t`$e^{4t}$`, t`$\frac14\operatorname{sen}4t$`], t`Forma do cosseno com $b=4$.`),
            gen((rng) => {
              const n = randInt(rng, 1, 4);
              const s = randInt(rng, 1, 3);
              const fact = [1, 1, 2, 6, 24][n];
              return num(t`Calcule $\mathcal L\{t^{${n}}\}$ em $s=${s}$ (3 casas).`, fact / s ** (n + 1), t`$\frac{${fact}}{${s}^{${n + 1}}}\approx${fmt(fact / s ** (n + 1), 3)}$.`, { tol: 0.002 });
            }),
            mcqS(t`Qual $f$ tem $F(s)=\dfrac{5}{s^2+25}$?`, t`$\operatorname{sen}5t$`, [t`$\cos5t$`, t`$5\operatorname{sen}t$`, t`$e^{5t}$`, t`$\operatorname{sen}25t$`], t`$\frac{b}{s^2+b^2}$ com $b=5$.`),
          ],
        },
        {
          card: {
            title: 'Linearidade',
            body: t`A integral é linear, então a transformada também:

$$\mathcal L\{a\,f+b\,g\}=a\,F(s)+b\,G(s)$$`,
            example: t`$\mathcal L\{3+2e^{4t}-\operatorname{sen}t\}=\frac3s+\frac{2}{s-4}-\frac{1}{s^2+1}$.`,
          },
          exercises: [
            mcqS(t`$\mathcal L\{5t+2\}=$`, t`$\frac5{s^2}+\frac2s$`, [t`$\frac5s+\frac2{s^2}$`, t`$\frac{5}{s^2+2}$`, t`$\frac{7}{s^2}$`, t`$5s+2$`], t`$5\cdot\frac1{s^2}+2\cdot\frac1s$.`),
            gen((rng) => {
              const A = randNZ(rng, -4, 5);
              const a = randNZ(rng, -3, 3);
              const B = randInt(rng, 1, 5);
              const s = Math.max(a, 0) + randInt(rng, 1, 3); // s > a and s > 0 (both terms must exist)
              const v = A / (s - a) + B / s;
              return num(t`Calcule $\mathcal L\{${A}e^{${a}t}+${B}\}$ em $s=${s}$ (3 casas).`, v, t`$\frac{${A}}{${s}-(${a})}+\frac{${B}}{${s}}\approx${fmt(v, 3)}$.`, { tol: 0.002 });
            }),
            tf(t`$\mathcal L\{f\cdot g\}=F(s)\cdot G(s)$.`, false, t`A transformada **não** é multiplicativa (o produto $F\cdot G$ corresponde à **convolução**).`),
            mcqS(t`$\mathcal L\{\cosh(2t)\}$, com $\cosh2t=\frac{e^{2t}+e^{-2t}}{2}$, é:`, t`$\frac{s}{s^2-4}$`, [t`$\frac{s}{s^2+4}$`, t`$\frac{2}{s^2-4}$`, t`$\frac{1}{s-2}$`, t`$\frac{1}{s^2-4}$`], t`$\frac12\left(\frac1{s-2}+\frac1{s+2}\right)=\frac{s}{s^2-4}$.`),
            gen((rng) => {
              const b = randInt(rng, 1, 4);
              const A = randInt(rng, 2, 6);
              return rmcq(rng, t`$\mathcal L\{${A}\cos ${b === 1 ? '' : b}t-${A}\}=$`, `$\\frac{${A}s}{s^2+${b * b}}-\\frac{${A}}{s}$`, [`$\\frac{${A}}{s^2+${b * b}}-\\frac{${A}}{s}$`, `$\\frac{${A}s}{s^2-${b * b}}-\\frac{${A}}{s}$`, `$\\frac{${A}s}{s^2+${b * b}}-${A}$`, `$\\frac{${A}b}{s^2+${b * b}}$`], t`Linearidade + tabela do cosseno.`);
            }),
            fill(t`Complete: $\mathcal L\{2t^2-3e^{t}\}$`, t`$=2\cdot$ ___ $-\,3\cdot$ ___`, [t`$\frac2{s^3}$`, t`$\frac1{s-1}$`], [t`$\frac1{s^2}$`, t`$\frac1{s+1}$`, t`$\frac2{s^2}$`], t`$t^2\to\frac{2}{s^3}$, $e^t\to\frac1{s-1}$.`),
            num(t`$\mathcal L\{4-\operatorname{sen}t\}$ em $s=1$ vale quanto?`, 3.5, t`$\frac41-\frac{1}{1+1}=4-0{,}5=3{,}5$.`),
            multi(t`Quais igualdades são verdadeiras?`, [t`$\mathcal L\{7\}=\frac7s$`, t`$\mathcal L\{e^{-t}\}=\frac1{s+1}$`, t`$\mathcal L\{t\}=\frac1s$`, t`$\mathcal L\{\operatorname{sen}t\}=\frac{s}{s^2+1}$`], [0, 1], t`$\mathcal L\{t\}=\frac1{s^2}$ e $\mathcal L\{\operatorname{sen}t\}=\frac{1}{s^2+1}$.`),
          ],
        },
      ],
    },
    {
      id: 'd-lap-prop',
      title: 'Propriedades e inversa',
      parts: [
        {
          card: {
            title: 'Derivadas viram multiplicação por s',
            body: t`Integrando por partes:

$$\mathcal L\{f'\}=sF(s)-f(0)$$
$$\mathcal L\{f''\}=s^2F(s)-s\,f(0)-f'(0)$$

É isso que transforma uma EDO em **álgebra** — e as condições iniciais entram automaticamente.`,
          },
          exercises: [
            mcqS(t`$\mathcal L\{y'\}$ em termos de $Y(s)$:`, t`$sY(s)-y(0)$`, [t`$sY(s)$`, t`$Y(s)-y(0)$`, t`$\frac{Y(s)}{s}$`, t`$s^2Y(s)-y(0)$`], t`Fórmula da derivada.`),
            mcqS(t`$\mathcal L\{y''\}=$`, t`$s^2Y-sy(0)-y'(0)$`, [t`$s^2Y-y(0)-y'(0)$`, t`$s^2Y$`, t`$sY-y'(0)$`, t`$s^2Y-sy'(0)-y(0)$`], t`Aplique a regra duas vezes.`),
            gen((rng) => {
              const y0 = randInt(rng, -3, 4);
              const a = randNZ(rng, -4, 4);
              return rmcq(rng, t`Transformando $y'${term(a, 'y')}=0$ com $y(0)=${y0}$, obtemos:`, `$(s${term(a, '')})Y=${y0}$`, [`$(s${term(-a, '')})Y=${y0}$`, `$sY=${y0}$`, `$(s${term(a, '')})Y=0$`, `$Y=${y0}(s${term(a, '')})$`], t`$sY-${y0}${term(a, 'Y')}=0$.`);
            }),
            tf(t`As condições iniciais aparecem naturalmente ao transformar as derivadas.`, true, t`$y(0)$ e $y'(0)$ surgem nas fórmulas.`),
            num(t`Se $y(0)=2$, $y'(0)=-1$ e $Y(s)$ é a transformada, quanto vale o termo constante (sem $Y$) em $\mathcal L\{y''\}$ quando $s=3$?`, -5, t`$-sy(0)-y'(0)=-3\cdot2-(-1)=-5$.`),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              return num(t`Use $\mathcal L\{f'\}=sF-f(0)$ com $f=e^{${k}t}$: quanto vale $sF(s)-f(0)$ simplificado em $s=${k + 1}$?`, k, t`$\frac{s}{s-${k}}-1=\frac{${k}}{s-${k}}$; em $s=${k + 1}$: $${k}$ (de fato $f'=${k}e^{${k}t}$).`);
            }),
            order(t`Ordene o método de Laplace para um PVI:`, ['transformar os dois lados da EDO', t`isolar $Y(s)$`, 'decompor em frações parciais', 'voltar ao tempo com a tabela (inversa)'], t`Tempo → $s$ → álgebra → tempo.`),
            fill(t`Complete para $y''+4y=0$, $y(0)=1$, $y'(0)=0$:`, t`$s^2Y-$ ___ $+4Y=0\Rightarrow Y=$ ___`, ['$s$', t`$\frac{s}{s^2+4}$`], ['$1$', t`$\frac{1}{s^2+4}$`, '$s^2$'], t`$-sy(0)-y'(0)=-s$; então $Y=\frac{s}{s^2+4}$, ou seja $y=\cos2t$.`),
          ],
        },
        {
          card: {
            title: 'Deslocamentos e o degrau',
            body: t`**1º deslocamento** (em $s$): $\mathcal L\{e^{at}f(t)\}=F(s-a)$.

**Degrau unitário** $u(t-a)$: vale $0$ antes de $a$ e $1$ depois — liga uma fonte num instante. **2º deslocamento** (em $t$):

$$\mathcal L\{u(t-a)\,f(t-a)\}=e^{-as}F(s),\qquad \mathcal L\{u(t-a)\}=\frac{e^{-as}}{s}$$`,
            visual: stepLab(),
          },
          exercises: [
            mcqS(t`$\mathcal L\{e^{2t}\cos3t\}=$`, t`$\frac{s-2}{(s-2)^2+9}$`, [t`$\frac{s}{s^2+9}$`, t`$\frac{s+2}{(s+2)^2+9}$`, t`$\frac{3}{(s-2)^2+9}$`, t`$\frac{s-2}{s^2+9}$`], t`Troque $s$ por $s-2$ em $\frac{s}{s^2+9}$.`),
            gen((rng) => {
              const a = randNZ(rng, -3, 3);
              const n = randInt(rng, 1, 3);
              const fact = [1, 1, 2, 6][n];
              return rmcq(rng, t`$\mathcal L\{t^{${n}}e^{${a}t}\}=$`, `$\\frac{${fact}}{(${sMinus(a)})^{${n + 1}}}$`, [`$\\frac{${fact}}{(${sMinus(-a)})^{${n + 1}}}$`, `$\\frac{${fact}}{s^{${n + 1}}}$`, `$\\frac{1}{(${sMinus(a)})^{${n + 1}}}$`, `$\\frac{${fact}}{(${sMinus(a)})^{${n}}}$`], t`Tabela de $t^{${n}}$ com $s\to s-(${a})$.`);
            }),
            tf(t`$u(t-3)$ vale $0$ para $t<3$ e $1$ para $t\ge3$.`, true, t`É o "interruptor" ligado em $t=3$.`),
            mcqS(t`$\mathcal L\{u(t-4)\}=$`, t`$\frac{e^{-4s}}{s}$`, [t`$\frac{e^{4s}}{s}$`, t`$\frac{1}{s-4}$`, t`$e^{-4s}$`, t`$\frac{4}{s}$`], t`Degrau: $\frac{e^{-as}}{s}$.`),
            inter(t`Ajuste o lab para representar uma fonte de $3$ V ligada em $t=5$.`, 'plot', stepLab().props, (v: any) => v && near(v.p.a, 5, 0.01) && near(v.p.A, 3, 0.01), t`$3\,u(t-5)$.`, t`O degrau $u(t-5)$ vale $0$ antes de $t=5$ e $1$ depois; multiplicado por $3$, a fonte de $3$ V ligada em $t=5$.`),
            gen((rng) => {
              const a = randInt(rng, 1, 5);
              const A = randInt(rng, 2, 6);
              return rmcq(rng, t`Uma tensão de $${A}$ V ligada em $t=${a}$ s tem transformada:`, `$\\frac{${A}e^{-${a}s}}{s}$`, [`$\\frac{${A}e^{${a}s}}{s}$`, `$\\frac{${A}}{s-${a}}$`, `$${A}e^{-${a}s}$`, `$\\frac{e^{-${A}s}}{${a}s}$`], t`$${A}\,u(t-${a})\to\frac{${A}e^{-${a}s}}{s}$.`);
            }),
            num(t`$\mathcal L\{u(t-2)\}$ em $s=1$ (3 casas):`, Math.exp(-2), t`$\frac{e^{-2}}{1}\approx0{,}135$.`, { tol: 0.002 }),
            mcqS(t`Qual $f(t)$ tem $F(s)=\dfrac{e^{-3s}}{s^2}$?`, t`$(t-3)\,u(t-3)$`, [t`$t\,u(t-3)$`, t`$t-3$`, t`$e^{-3t}t$`, t`$u(t-3)$`], t`$\frac1{s^2}\to t$, deslocado: $(t-3)u(t-3)$ — uma rampa que começa em $t=3$.`),
          ],
        },
        {
          card: {
            title: 'A transformada inversa',
            body: t`Para voltar ao tempo, reescreva $F(s)$ como soma de termos da tabela — quase sempre com **frações parciais**:

$$\frac{s+5}{(s-1)(s+2)}=\frac{A}{s-1}+\frac{B}{s+2}$$

Cobrindo: $A=\frac{1+5}{1+2}=2$, $B=\frac{-2+5}{-2-1}=-1$ ⟹ $f(t)=2e^{t}-e^{-2t}$.`,
            tip: t`Denominador $s^2+b^2$ ⟹ senos e cossenos; $(s-a)^2+b^2$ ⟹ os mesmos com $e^{at}$.`,
          },
          exercises: [
            mcqS(t`$\mathcal L^{-1}\left\{\frac{3}{s-2}\right\}=$`, t`$3e^{2t}$`, [t`$3e^{-2t}$`, t`$e^{3t}$`, t`$\frac32t$`, t`$3\cos2t$`], t`Tabela: $\frac1{s-a}\to e^{at}$.`),
            gen((rng) => {
              const r1 = randInt(rng, -3, 0);
              const r2 = r1 + randInt(rng, 1, 3);
              const A = randNZ(rng, -3, 3);
              const B = randNZ(rng, -3, 3);
              const n1 = A + B;
              const n0 = -(A * r2 + B * r1);
              return num(t`Em $\dfrac{${n1 === 0 ? '' : n1 === 1 ? 's' : n1 === -1 ? '-s' : n1 + 's'}${n1 === 0 ? n0 : term(n0, '')}}{(${sMinus(r1)})(${sMinus(r2)})}=\dfrac{A}{${sMinus(r1)}}+\dfrac{B}{${sMinus(r2)}}$, quanto vale $A$?`, A, t`Cobrindo $s=${r1}$: $A=\frac{${n1}\cdot(${r1})${term(n0, '')}}{${r1}-(${r2})}=${A}$.`);
            }),
            mcqS(t`$\mathcal L^{-1}\left\{\frac{4}{s^2+16}\right\}=$`, t`$\operatorname{sen}4t$`, [t`$\cos4t$`, t`$4\operatorname{sen}t$`, t`$\operatorname{sen}16t$`, t`$e^{4t}$`], t`$\frac{b}{s^2+b^2}$ com $b=4$.`),
            mcqS(t`$\mathcal L^{-1}\left\{\frac{1}{s^2+9}\right\}=$`, t`$\frac13\operatorname{sen}3t$`, [t`$\operatorname{sen}3t$`, t`$\frac13\cos3t$`, t`$\operatorname{sen}9t$`, t`$3\operatorname{sen}3t$`], t`Falta o $3$ no numerador: $\frac13\cdot\frac{3}{s^2+9}$.`),
            num(t`Se $F(s)=\dfrac{2}{s}-\dfrac{1}{s+3}$, quanto vale $f(0)$?`, 1, t`$f(t)=2-e^{-3t}$, $f(0)=2-1=1$.`),
            mcqS(t`$\mathcal L^{-1}\left\{\frac{s+1}{(s+1)^2+4}\right\}=$`, t`$e^{-t}\cos2t$`, [t`$e^{t}\cos2t$`, t`$e^{-t}\operatorname{sen}2t$`, t`$\cos2t$`, t`$e^{-t}\cos4t$`], t`Cosseno deslocado com $a=-1$, $b=2$.`),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const tt = pick(rng, [0, 1]);
              return num(t`$f=\mathcal L^{-1}\left\{\frac{1}{s(s+${a})}\right\}=\frac1{${a}}\left(1-e^{-${a}t}\right)$. Quanto vale $f(${tt})$ (3 casas)?`, (1 - Math.exp(-a * tt)) / a, t`$\frac{1-e^{-${a * tt}}}{${a}}\approx${fmt((1 - Math.exp(-a * tt)) / a, 3)}$.`, { tol: 0.002 });
            }),
            tf(t`$\mathcal L^{-1}\{F+G\}=\mathcal L^{-1}\{F\}+\mathcal L^{-1}\{G\}$.`, true, t`A inversa também é linear.`),
          ],
        },
      ],
    },
    {
      id: 'd-lap-edo',
      title: 'Resolvendo EDOs e sistemas',
      parts: [
        {
          card: {
            title: 'PVI em quatro passos',
            body: t`$y'+2y=0$, $y(0)=5$:

1. Transformar: $sY-5+2Y=0$
2. Isolar: $Y=\frac{5}{s+2}$
3. (Frações parciais, se preciso)
4. Inverter: $y=5e^{-2t}$

Para 2ª ordem, $y''+y=0$, $y(0)=0$, $y'(0)=1$: $s^2Y-1+Y=0\Rightarrow Y=\frac1{s^2+1}\Rightarrow y=\operatorname{sen}t$.`,
          },
          exercises: [
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              const y0 = randNZ(rng, -5, 5);
              return rmcq(rng, t`Resolva por Laplace: $y'${term(a, 'y')}=0$, $y(0)=${y0}$.`, `$y=${y0}e^{${-a}t}$`, [`$y=${y0}e^{${a}t}$`, `$y=${a}e^{${y0}t}$`, `$y=${y0}+e^{${-a}t}$`.replace('+-', '-'), `$y=${y0}\\cos ${Math.abs(a)}t$`], t`$Y=\frac{${y0}}{s${term(a, '')}}\Rightarrow y=${y0}e^{${-a}t}$.`);
            }),
            gen((rng) => {
              const b = randInt(rng, 1, 5);
              const v0 = b * randInt(rng, 1, 3);
              return rmcq(rng, t`Resolva $y''+${b * b}y=0$, $y(0)=0$, $y'(0)=${v0}$.`, `$y=${v0 / b === 1 ? '' : v0 / b}\\operatorname{sen}${b === 1 ? '' : b}t$`, [`$y=${v0}\\operatorname{sen}${b === 1 ? '' : b}t$`, `$y=${v0 / b === 1 ? '' : v0 / b}\\cos ${b === 1 ? '' : b}t$`, `$y=${v0}e^{${b}t}$`, `$y=${v0}t$`], t`$Y=\frac{${v0}}{s^2+${b * b}}=${v0 / b}\cdot\frac{${b}}{s^2+${b * b}}$.`);
            }),
            num(t`Resolva $y'-y=1$, $y(0)=0$. Quanto vale $y(\ln2)$?`, 1, t`$Y=\frac1{s(s-1)}=\frac1{s-1}-\frac1s\Rightarrow y=e^t-1$; $y(\ln2)=2-1=1$.`),
            mcqS(t`Para $y''-y=0$, $y(0)=1$, $y'(0)=1$, obtemos $Y=$`, t`$\frac{1}{s-1}$`, [t`$\frac{s}{s^2-1}$`, t`$\frac{1}{s^2-1}$`, t`$\frac{s+1}{s^2+1}$`, t`$\frac1{s+1}$`], t`$s^2Y-s-1-Y=0\Rightarrow Y=\frac{s+1}{s^2-1}=\frac{1}{s-1}$, isto é $y=e^t$.`),
            tf(t`Com Laplace não é preciso achar a solução geral e depois as constantes.`, true, t`As condições iniciais entram na própria transformação.`),
            num(t`Resolva $y'+3y=6$, $y(0)=0$. Qual o valor de equilíbrio $\lim_{t\to\infty}y$?`, 2, t`$Y=\frac{6}{s(s+3)}=\frac2s-\frac{2}{s+3}\Rightarrow y=2-2e^{-3t}\to2$.`),
            order(t`Ordene os passos para $y''+3y'+2y=0$, $y(0)=1$, $y'(0)=0$:`, [t`$(s^2Y-s)+3(sY-1)+2Y=0$`, t`$Y=\frac{s+3}{(s+1)(s+2)}$`, t`$Y=\frac{2}{s+1}-\frac{1}{s+2}$`, t`$y=2e^{-t}-e^{-2t}$`], t`Transforma, isola, decompõe, inverte.`),
            num(t`Na solução $y=2e^{-t}-e^{-2t}$ acima, quanto vale $y(0)$?`, 1, t`$2-1=1$ ✓ confere com a condição inicial.`),
          ],
        },
        {
          card: {
            title: 'Fontes ligadas e impulsos',
            body: t`Laplace brilha com entradas **descontínuas**:

• Fonte ligada em $t=a$: $E\,u(t-a)\to\frac{Ee^{-as}}{s}$
• **Impulso** (pancada instantânea, delta de Dirac): $\mathcal L\{\delta(t-a)\}=e^{-as}$, $\mathcal L\{\delta(t)\}=1$

Circuito RC ligado em $t=0$: $RCv'+v=E$, $v(0)=0$ ⟹ $V=\frac{E}{s(RCs+1)}$ ⟹ $v=E(1-e^{-t/RC})$.`,
          },
          exercises: [
            mcqS(t`$\mathcal L\{\delta(t)\}=$`, t`$1$`, [t`$0$`, t`$\frac1s$`, t`$s$`, t`$e^{-s}$`], t`O impulso unitário concentra área 1 em $t=0$.`),
            gen((rng) => {
              const a = randInt(rng, 1, 5);
              return rmcq(rng, t`$\mathcal L\{\delta(t-${a})\}=$`, `$e^{-${a}s}$`, [`$\\frac{e^{-${a}s}}{s}$`, `$e^{${a}s}$`, '$1$', `$\\frac1{s-${a}}$`], t`Impulso no instante $${a}$.`);
            }),
            num(t`Resolva $y'=\delta(t)$, $y(0^-)=0$. Quanto vale $y(1)$?`, 1, t`$sY=1\Rightarrow Y=\frac1s\Rightarrow y=u(t)$: um salto de altura 1.`),
            mcqS(t`Uma massa-mola $y''+y=\delta(t)$ em repouso recebe uma pancada. A resposta é:`, t`$y=\operatorname{sen}t$`, [t`$y=\cos t$`, t`$y=1$`, t`$y=e^{-t}$`, t`$y=t$`], t`$(s^2+1)Y=1\Rightarrow Y=\frac1{s^2+1}$.`),
            gen((rng) => {
              const RC = pick(rng, [0.5, 1, 2]);
              const E = pick(rng, [5, 10, 12]);
              const tt = RC;
              return num(t`RC com $RC=${fmt(RC)}$ s e fonte $${E}$ V ligada em $t=0$: tensão no capacitor em $t=${fmt(tt)}$ s? (2 casas)`, E * (1 - Math.exp(-1)), t`$v=${E}(1-e^{-1})\approx${fmt(E * (1 - Math.exp(-1)), 2)}$ V.`, { tol: 0.02 });
            }),
            tf(t`Para resolver uma EDO com fonte ligada em $t=2$ pelo método clássico, seria preciso resolver em dois intervalos e "colar" as soluções.`, true, t`Laplace faz isso de uma vez com $u(t-2)$.`),
            mcqS(t`$y'+y=u(t-1)$, $y(0)=0$ leva a $Y=$`, t`$\frac{e^{-s}}{s(s+1)}$`, [t`$\frac{1}{s(s+1)}$`, t`$\frac{e^{-s}}{s+1}$`, t`$\frac{e^{s}}{s(s+1)}$`, t`$e^{-s}$`], t`$(s+1)Y=\frac{e^{-s}}{s}$.`),
            num(t`Na solução de $y'+y=u(t-1)$, $y(0)=0$, quanto vale $y(0{,}5)$?`, 0, t`Antes de $t=1$ a fonte está desligada e $y$ continua $0$.`),
          ],
        },
        {
          card: {
            title: 'Função de transferência e polos',
            body: t`Com condições iniciais nulas, a razão saída/entrada só depende do sistema:

$$H(s)=\frac{Y(s)}{X(s)}\qquad\text{ex.: } y''+2y'+5y=x\ \Rightarrow\ H=\frac{1}{s^2+2s+5}$$

As raízes do denominador são os **polos**. Sistema **estável** ⟺ todos os polos com **parte real negativa**. Mova os polos $\alpha\pm\beta i$ e veja a resposta ao impulso:`,
            visual: polesLab(),
            tip: t`Engenheiros de controle projetam $H(s)$ empurrando os polos para a esquerda do plano complexo.`,
          },
          exercises: [
            mcqS(t`Função de transferência de $y''+3y'+2y=x(t)$:`, t`$\frac{1}{s^2+3s+2}$`, [t`$s^2+3s+2$`, t`$\frac{s}{s^2+3s+2}$`, t`$\frac{1}{s+2}$`, t`$\frac{1}{s^2-3s+2}$`], t`$(s^2+3s+2)Y=X$.`),
            gen((rng) => {
              const p1 = randInt(rng, -5, 3);
              let p2 = randInt(rng, -5, 3);
              if (p2 === p1) p2 = p1 - 1;
              const stable = p1 < 0 && p2 < 0;
              return tf(t`$H(s)=\dfrac{1}{(${sMinus(p1)})(${sMinus(p2)})}$ é estável.`, stable, stable ? t`Polos $${p1}$ e $${p2}$, ambos negativos.` : t`Há polo com parte real $\ge0$ (${Math.max(p1, p2)}): a resposta não decai.`);
            }),
            num(t`Quais os polos de $H=\frac{1}{s^2+2s+5}$? Dê a parte real.`, -1, t`$s=-1\pm2i$: parte real $-1<0$ ⟹ estável.`),
            inter(t`Ajuste os polos para uma resposta **estável** que oscile com $\beta=3$.`, 'plot', polesLab().props, (v: any) => v && v.p.al < -0.01 && near(v.p.be, 3, 0.01), t`Qualquer $\alpha<0$ com $\beta=3$.`, t`Polos $\alpha\pm i\beta$ geram $e^{\alpha t}\cos\beta t$: estável exige $\alpha<0$ (decai) e $\beta=3$ fixa a frequência.`),
            mcq(t`Um polo em $s=+0{,}5$ significa que a resposta ao impulso…`, ['cresce como $e^{0{,}5t}$', 'decai', 'oscila com amplitude fixa', 'é zero'], 0, t`$\frac{1}{s-0{,}5}\to e^{0{,}5t}$.`),
            match(t`Ligue os polos ao comportamento:`, [
              [t`$-2$ e $-3$`, 'decai sem oscilar'],
              [t`$-1\pm4i$`, 'oscila decaindo'],
              [t`$\pm4i$`, 'oscila para sempre'],
              [t`$1\pm4i$`, 'oscila crescendo'],
            ], t`Parte real: decaimento/crescimento; parte imaginária: oscilação.`),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const b = randInt(rng, 1, 4);
              return num(t`$H(s)=\dfrac{1}{s^2+${2 * a}s+${a * a + b * b}}$ tem resposta ao impulso $\frac1{${b}}e^{-${a}t}\operatorname{sen}${b}t$. Com que frequência angular ela oscila?`, b, t`Polos $-${a}\pm${b}i$.`);
            }),
            tf(t`Em regime permanente, a resposta de um sistema estável ao degrau unitário tende a $H(0)$.`, true, t`Teorema do valor final: $\lim_{t\to\infty}y=\lim_{s\to0}s\cdot H(s)\frac1s=H(0)$.`),
          ],
        },
      ],
    },
  ],
};
