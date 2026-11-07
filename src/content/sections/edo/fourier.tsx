import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { FnCurve, Label, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ } from '../../../lib/random';

const t = String.raw;
const PI = Math.PI;

const saw = (x: number) => ((((x + PI) % (2 * PI)) + 2 * PI) % (2 * PI)) - PI;
const WAVES = [
  { name: 'quadrada', target: (x: number) => (Math.sin(x) >= 0 ? 1 : -1), partial: (x: number, N: number) => { let s = 0; for (let n = 1; n <= N; n += 2) s += Math.sin(n * x) / n; return (4 / PI) * s; } },
  { name: 'dente-de-serra', target: (x: number) => saw(x), partial: (x: number, N: number) => { let s = 0; for (let n = 1; n <= N; n++) s += ((n % 2 ? 1 : -1) * Math.sin(n * x)) / n; return 2 * s; } },
  { name: 'triangular', target: (x: number) => Math.abs(saw(x)), partial: (x: number, N: number) => { let s = 0; for (let n = 1; n <= N; n += 2) s += Math.cos(n * x) / (n * n); return PI / 2 - (4 / PI) * s; } },
];

/** Partial Fourier sums of a chosen wave with N harmonics. */
const fourierLab = (w0 = 0) =>
  plot({
    view: { xMin: -2 * PI, xMax: 2 * PI, yMin: -4, yMax: 4 },
    params: [
      { key: 'w', label: 'onda', min: 0, max: 2, step: 1, value: w0, color: C.p2, format: (v: number) => WAVES[Math.round(v)].name },
      { key: 'N', label: 'N', min: 1, max: 31, step: 1, value: 3, color: C.p5, format: (v: number) => String(v) },
    ],
    render: ({ p }: any) => {
      const W = WAVES[Math.round(p.w)];
      return (
        <>
          <FnCurve f={W.target} color={C.gold} width={1.6} dash="5 5" samples={600} />
          <FnCurve f={(x) => W.partial(x, Math.round(p.N))} color={C.p1} width={2.5} samples={600} />
        </>
      );
    },
    info: ({ p }: any) => {
      const W = WAVES[Math.round(p.w)];
      return t`Onda **${W.name}** (tracejada) com harmônicos até $n=${Math.round(p.N)}$` + (Math.round(p.w) === 0 ? t` · pico perto do salto $\approx${fmt(W.partial(PI / (Math.round(p.N) + 1), Math.round(p.N)), 3)}$ (Gibbs: $\approx1{,}18$)` : '');
    },
  });

/** Build a signal from three sine harmonics; optional dashed target. */
const harmonicLab = (target?: [number, number, number]) =>
  plot({
    view: { xMin: -PI, xMax: PI, yMin: -2.5, yMax: 2.5 },
    params: [
      { key: 'b1', label: 'b_1', min: -1.5, max: 1.5, step: 0.05, value: 1, color: C.p1 },
      { key: 'b2', label: 'b_2', min: -1.5, max: 1.5, step: 0.05, value: 0, color: C.p2 },
      { key: 'b3', label: 'b_3', min: -1.5, max: 1.5, step: 0.05, value: 0, color: C.p3 },
    ],
    render: ({ p }: any) => (
      <>
        {target ? <FnCurve f={(x) => target[0] * Math.sin(x) + target[1] * Math.sin(2 * x) + target[2] * Math.sin(3 * x)} color={C.gold} width={2} dash="6 5" /> : null}
        <FnCurve f={(x) => p.b1 * Math.sin(x)} color={C.p1} width={1.2} opacity={0.5} />
        <FnCurve f={(x) => p.b2 * Math.sin(2 * x)} color={C.p2} width={1.2} opacity={0.5} />
        <FnCurve f={(x) => p.b3 * Math.sin(3 * x)} color={C.p3} width={1.2} opacity={0.5} />
        <FnCurve f={(x) => p.b1 * Math.sin(x) + p.b2 * Math.sin(2 * x) + p.b3 * Math.sin(3 * x)} color={C.text} width={3} />
      </>
    ),
    info: ({ p }: any) => t`Soma (branca): $${fmt(p.b1, 2)}\operatorname{sen}x+${fmt(p.b2, 2)}\operatorname{sen}2x+${fmt(p.b3, 2)}\operatorname{sen}3x$`.replace(/\+-/g, '-'),
  });

/** Low-pass filter: keep harmonics up to the cutoff; stem plot of the square-wave spectrum. */
const filterLab = () =>
  plot({
    view: { xMin: -PI, xMax: 12, yMin: -1.8, yMax: 1.8 },
    params: [{ key: 'fc', label: 'corte', min: 1, max: 11, step: 2, value: 5, color: C.p5, format: (v: number) => String(v) }],
    render: ({ p }: any) => {
      const stems: React.ReactNode[] = [];
      for (let n = 1; n <= 11; n += 2) {
        const h = 4 / (PI * n);
        const on = n <= p.fc;
        stems.push(<Seg key={n} x1={PI + 0.5 + n * 0.7} y1={-1.6} x2={PI + 0.5 + n * 0.7} y2={-1.6 + h * 1.5} color={on ? C.p1 : C.textDim} width={5} />);
      }
      return (
        <>
          <FnCurve f={(x) => (x <= PI ? WAVES[0].partial(x, Math.round(p.fc)) : NaN)} to={PI} color={C.p1} width={2.5} samples={400} />
          <FnCurve f={(x) => (x <= PI ? WAVES[0].target(x) : NaN)} to={PI} color={C.gold} width={1.4} dash="5 5" samples={400} />
          {stems}
          <Label x={PI + 1.2} y={1.3} text="espectro" color={C.textDim} size={11} />
        </>
      );
    },
    info: ({ p }: any) => t`Filtro passa-baixas: mantém harmônicos $n\le${Math.round(p.fc)}$ (barras acesas) · amplitudes $b_n=\frac{4}{\pi n}$`,
  });

/** Heat equation on [0, π] with square initial profile: high harmonics die first. */
const heatLab = () =>
  plot({
    view: { xMin: -0.2, xMax: PI + 0.2, yMin: -0.3, yMax: 1.5 },
    params: [{ key: 'tt', label: 't', min: 0, max: 1.5, step: 0.01, value: 0, color: C.p5 }],
    render: ({ p }: any) => {
      const u = (x: number) => {
        let s = 0;
        for (let n = 1; n <= 61; n += 2) s += (Math.exp(-n * n * p.tt) * Math.sin(n * x)) / n;
        return (4 / PI) * s;
      };
      return (
        <>
          <FnCurve f={(x) => (x > 0 && x < PI ? 1 : 0)} from={0} to={PI} color={C.gold} width={1.4} dash="5 5" />
          <FnCurve f={u} from={0} to={PI} color={C.danger} width={3} samples={300} />
        </>
      );
    },
    info: ({ p }: any) => t`$u(x,t)=\sum b_n e^{-n^2t}\operatorname{sen}nx$ · em $t=${fmt(p.tt, 2)}$: $e^{-t}=${fmt(Math.exp(-p.tt), 3)}$, $e^{-9t}=${fmt(Math.exp(-9 * p.tt), 3)}$, $e^{-25t}=${fmt(Math.exp(-25 * p.tt), 3)}$`,
  });

export const fourier: UnitDef = {
  id: 'd-four',
  title: 'Séries de Fourier',
  subtitle: 'Sinais como somas de senos e cossenos',
  icon: '〰️',
  source: 'Cálculo 4 · Ferramentas de engenharia',
  guide: t`Todo sinal periódico razoável é uma soma de senos e cossenos de frequências múltiplas da fundamental: $f(x)=\frac{a_0}{2}+\sum(a_n\cos nx+b_n\operatorname{sen}nx)$. Os coeficientes saem de integrais graças à **ortogonalidade**. É a base do processamento de áudio, imagens, telecomunicações e da solução de EDPs como a equação do calor.`,
  lessons: [
    {
      id: 'd-four-ideia',
      title: 'Harmônicos',
      parts: [
        {
          card: {
            title: 'Sinais periódicos',
            body: t`$f$ é **periódica** de período $T$ se $f(x+T)=f(x)$ para todo $x$. A **frequência** é $\frac1T$ (ciclos por unidade) e a **frequência angular** é $\omega=\frac{2\pi}{T}$.

$\operatorname{sen}(nx)$ e $\cos(nx)$ têm período $\frac{2\pi}{n}$: são os **harmônicos** de uma onda de período $2\pi$. O 1º é a **fundamental**.`,
            example: t`Uma corda de violão vibrando em $110$ Hz (lá) também vibra em $220$, $330$, $440$ Hz… A mistura dessas intensidades é o **timbre**.`,
          },
          exercises: [
            num(t`Qual o período de $\operatorname{sen}(4x)$? (2 casas)`, PI / 2, t`$\frac{2\pi}{4}\approx1{,}57$.`, { tol: 0.01 }),
            tf(t`$\operatorname{sen}(3x)$ também tem período $2\pi$ (além do período fundamental $\frac{2\pi}{3}$).`, true, t`Em $2\pi$ ela completa exatamente 3 ciclos.`),
            gen((rng) => {
              const f = pick(rng, [50, 60, 100, 440]);
              return num(t`Um sinal de $${f}$ Hz tem período de quantos milissegundos? (2 casas)`, 1000 / f, t`$T=\frac1{${f}}$ s $\approx${fmt(1000 / f, 2)}$ ms.`, { tol: 0.01 });
            }),
            gen((rng) => {
              const f = pick(rng, [100, 110, 220, 440]);
              const n = randInt(rng, 2, 5);
              return num(t`A fundamental de uma nota é $${f}$ Hz. Qual a frequência do ${n}º harmônico (Hz)?`, f * n, t`$${n}\cdot${f}=${f * n}$ Hz.`);
            }),
            mcqS(t`Qual destas funções **não** é periódica?`, t`$x^2$`, [t`$\cos x$`, t`$\operatorname{sen}2x+\cos3x$`, t`$\operatorname{tg}x$`, t`$|\operatorname{sen}x|$`], t`$x^2$ só cresce; as outras se repetem.`),
            mcq(t`Duas notas iguais (mesma frequência) tocadas por um piano e por uma flauta soam diferentes porque…`, ['as intensidades dos harmônicos são diferentes', 'a fundamental é diferente', 'uma não é periódica', 'a flauta não tem harmônicos'], 0, t`É o espectro de harmônicos (o timbre).`),
            num(t`Qual o período comum de $\operatorname{sen}(2x)+\cos(3x)$? (2 casas)`, 2 * PI, t`Períodos $\pi$ e $\frac{2\pi}3$; o menor múltiplo comum é $2\pi\approx6{,}28$.`, { tol: 0.01 }),
            match(t`Ligue cada função ao seu período:`, [
              [t`$\cos x$`, t`$2\pi$`],
              [t`$\operatorname{sen}2x$`, t`$\pi$`],
              [t`$\cos\frac{x}{2}$`, t`$4\pi$`],
              [t`$\operatorname{sen}(\pi x)$`, t`$2$`],
            ], t`Período de $\operatorname{sen}(kx)$ é $\frac{2\pi}{k}$.`),
          ],
        },
        {
          card: {
            title: 'Somando harmônicos',
            body: t`Somando senos de frequências $1,\,2,\,3,\ldots$ com amplitudes $b_1,\,b_2,\,b_3,\ldots$, conseguimos formas muito variadas. Ajuste as amplitudes (as curvas finas são cada harmônico; a grossa, a soma):`,
            visual: harmonicLab(),
            tip: t`$\operatorname{sen}x+\frac13\operatorname{sen}3x$ já parece uma onda quadrada "arredondada".`,
          },
          exercises: [
            inter(t`Monte o sinal tracejado $\operatorname{sen}x+\frac13\operatorname{sen}3x$.`, 'plot', harmonicLab([1, 0, 1 / 3]).props, (v: any) => v && near(v.p.b1, 1, 0.06) && near(v.p.b2, 0, 0.06) && near(v.p.b3, 1 / 3, 0.06), t`$b_1=1$, $b_2=0$, $b_3\approx0{,}33$.`),
            inter(t`Monte o sinal tracejado (só o 2º harmônico, com amplitude $-0{,}8$).`, 'plot', harmonicLab([0, -0.8, 0]).props, (v: any) => v && near(v.p.b1, 0, 0.06) && near(v.p.b2, -0.8, 0.06) && near(v.p.b3, 0, 0.06), t`$b_1=0$, $b_2=-0{,}8$, $b_3=0$.`),
            tf(t`Somando só senos ($b_n\operatorname{sen}nx$) o resultado é sempre uma função ímpar.`, true, t`Cada $\operatorname{sen}nx$ é ímpar, e soma de ímpares é ímpar.`),
            gen((rng) => {
              const b1 = randNZ(rng, -3, 3);
              const b3 = randNZ(rng, -3, 3);
              return num(t`Quanto vale $f(x)=${b1}\operatorname{sen}x${b3 < 0 ? '' : '+'}${b3}\operatorname{sen}3x$ em $x=\frac{\pi}{2}$?`, b1 - b3, t`$\operatorname{sen}\frac\pi2=1$, $\operatorname{sen}\frac{3\pi}{2}=-1$: $${b1}-(${b3})=${b1 - b3}$.`);
            }),
            mcqS(t`Para obter uma função **par**, devemos somar…`, 'cossenos (e uma constante)', ['apenas senos', 'senos e cossenos sempre', 'exponenciais', 'nada: somas de harmônicos nunca são pares'], t`$\cos nx$ é par.`),
            num(t`Quantos ciclos completos $\operatorname{sen}(5x)$ faz no intervalo $[0,\,2\pi]$?`, 5, t`Período $\frac{2\pi}{5}$: cabem $5$.`),
            gen((rng) => {
              const a0 = randInt(rng, 1, 6);
              return num(t`Qual o valor médio de $f(x)=${a0}+\operatorname{sen}x+2\cos3x$ em um período?`, a0, t`Senos e cossenos têm média zero: sobra a constante $${a0}$.`);
            }),
            mcq(t`Por que não usamos $\operatorname{sen}(1{,}5x)$ numa série de período $2\pi$?`, ['ele não se repete com período $2\\pi$', 'é ímpar', 'tem amplitude grande', 'é igual a $\\cos x$'], 0, t`$\frac{2\pi}{1{,}5}$ não divide $2\pi$ um número inteiro de vezes.`),
          ],
        },
        {
          card: {
            title: 'Ortogonalidade',
            body: t`O segredo da série: em $[-\pi,\,\pi]$, harmônicos diferentes são **ortogonais** (o "produto escalar" deles é zero):

$$\int_{-\pi}^{\pi}\operatorname{sen}mx\,\operatorname{sen}nx\,dx=\begin{cases}0,&m\ne n\\ \pi,&m=n\end{cases}$$

e $\int_{-\pi}^{\pi}\operatorname{sen}mx\cos nx\,dx=0$ sempre. É como projetar um vetor numa base ortogonal: cada coeficiente se calcula **sozinho**.`,
            tip: t`Lembre do produto escalar $\vec u\cdot\vec e_k$ dando a componente $k$: aqui $\int f\operatorname{sen}nx$ dá (a menos de $\pi$) a componente $b_n$.`,
          },
          exercises: [
            num(t`Calcule $\displaystyle\int_{-\pi}^{\pi}\operatorname{sen}2x\,\operatorname{sen}5x\,dx$.`, 0, t`$m\ne n$: ortogonais.`),
            num(t`Calcule $\displaystyle\int_{-\pi}^{\pi}\operatorname{sen}^2 3x\,dx$ (2 casas).`, PI, t`$m=n$: vale $\pi\approx3{,}14$.`, { tol: 0.01 }),
            gen((rng) => {
              const m = randInt(rng, 1, 6);
              const n = randInt(rng, 1, 6);
              return num(t`Calcule $\displaystyle\int_{-\pi}^{\pi}\operatorname{sen}${m === 1 ? '' : m}x\cos ${n === 1 ? '' : n}x\,dx$.`, 0, t`O integrando é ímpar (seno × cosseno), então a integral em intervalo simétrico é $0$.`);
            }),
            gen((rng) => {
              const m = randInt(rng, 1, 6);
              const n = randInt(rng, 1, 6);
              return num(t`Calcule $\displaystyle\int_{-\pi}^{\pi}\cos ${m === 1 ? '' : m}x\cos ${n === 1 ? '' : n}x\,dx$ (2 casas).`, m === n ? PI : 0, m === n ? t`$m=n$: $\pi$.` : t`$m\ne n$: $0$.`, { tol: 0.01 });
            }),
            tf(t`Ortogonalidade permite achar $b_3$ sem conhecer os outros coeficientes.`, true, t`Multiplicando por $\operatorname{sen}3x$ e integrando, todos os outros termos somem.`),
            mcqS(t`A ortogonalidade das funções é análoga a qual ideia de vetores?`, 'produto escalar zero entre vetores da base', ['produto vetorial', 'determinante nulo', 'vetores paralelos', 'norma unitária'], t`$\int fg\,dx$ funciona como um produto escalar entre funções.`),
            num(t`Quanto vale $\displaystyle\int_{-\pi}^{\pi}\cos^2 x\,dx$? (2 casas)`, PI, t`Média de $\cos^2$ é $\frac12$, vezes $2\pi$: $\pi$.`, { tol: 0.01 }),
            fill(t`Complete: multiplicando $f=\sum b_k\operatorname{sen}kx$ por $\operatorname{sen}nx$ e integrando em $[-\pi,\,\pi]$:`, t`$\int f\operatorname{sen}nx\,dx=$ ___ $\cdot\,b_n$, logo $b_n=$ ___ $\int_{-\pi}^{\pi} f\operatorname{sen}nx\,dx$`, [t`$\pi$`, t`$\frac1\pi$`], [t`$2\pi$`, t`$\frac{1}{2\pi}$`, '$1$'], t`Só o termo $k=n$ sobrevive, valendo $\pi\,b_n$.`),
          ],
        },
      ],
    },
    {
      id: 'd-four-coef',
      title: 'Coeficientes de Fourier',
      parts: [
        {
          card: {
            title: 'As fórmulas',
            body: t`Para $f$ de período $2\pi$:

$$f(x)\sim\frac{a_0}{2}+\sum_{n=1}^\infty\left(a_n\cos nx+b_n\operatorname{sen}nx\right)$$
$$a_n=\frac1\pi\int_{-\pi}^{\pi}f(x)\cos nx\,dx,\qquad b_n=\frac1\pi\int_{-\pi}^{\pi}f(x)\operatorname{sen}nx\,dx$$

Para período $2L$: troque $nx$ por $\frac{n\pi x}{L}$ e $\frac1\pi\int_{-\pi}^{\pi}$ por $\frac1L\int_{-L}^{L}$.`,
            tip: t`$\frac{a_0}{2}$ é o **valor médio** de $f$ no período.`,
          },
          exercises: [
            mcqS(t`O termo $\frac{a_0}{2}$ da série de Fourier representa:`, 'o valor médio de f no período', ['o valor máximo', 'a frequência fundamental', 'o primeiro harmônico', 'f(0)'], t`$\frac{a_0}{2}=\frac{1}{2\pi}\int_{-\pi}^{\pi}f\,dx$.`),
            gen((rng) => {
              const c = randInt(rng, 1, 6);
              return num(t`Para $f(x)=${c}$ (constante), quanto vale $a_0$?`, 2 * c, t`$a_0=\frac1\pi\int_{-\pi}^{\pi}${c}\,dx=\frac{${c}\cdot2\pi}{\pi}=${2 * c}$, e $\frac{a_0}2=${c}$.`);
            }),
            num(t`Para $f(x)=3\operatorname{sen}2x$, quanto vale $b_2$?`, 3, t`Ela já é uma série de Fourier com um termo só.`),
            num(t`Para $f(x)=5\cos4x+\operatorname{sen}x$, quanto vale $a_4$?`, 5, t`Leitura direta do coeficiente.`),
            mcqS(t`Para uma função de período $2L=4$ (isto é, $L=2$), os harmônicos são:`, t`$\cos\frac{n\pi x}{2}$ e $\operatorname{sen}\frac{n\pi x}{2}$`, [t`$\cos nx$ e $\operatorname{sen}nx$`, t`$\cos2nx$ e $\operatorname{sen}2nx$`, t`$\cos\frac{nx}{4}$ e $\operatorname{sen}\frac{nx}{4}$`, t`$e^{nx}$`], t`Troque $nx$ por $\frac{n\pi x}{L}$.`),
            tf(t`Os coeficientes de Fourier de uma função são calculados com integrais sobre **um** período.`, true, t`Qualquer intervalo de comprimento $2\pi$ (ou $2L$) serve.`),
            gen((rng) => {
              const A = randInt(rng, 1, 5);
              return num(t`$f(x)=${A}$ para $0<x<\pi$ e $f(x)=0$ para $-\pi<x<0$. Quanto vale $\frac{a_0}{2}$ (o valor médio)?`, A / 2, t`Metade do período vale $${A}$, metade vale $0$: média $${fmt(A / 2)}$.`);
            }),
            num(t`Para $f(x)=x$ em $(-\pi,\,\pi)$, $b_n=\frac{2(-1)^{n+1}}{n}$. Quanto vale $b_2$?`, -1, t`$\frac{2\cdot(-1)^3}{2}=-1$.`),
          ],
        },
        {
          card: {
            title: 'Funções pares e ímpares',
            body: t`Simetria economiza metade do trabalho:

• $f$ **par** ($f(-x)=f(x)$): todos os $b_n=0$ — **série de cossenos**
• $f$ **ímpar** ($f(-x)=-f(x)$): todos os $a_n=0$ — **série de senos**

Porque $\int_{-\pi}^{\pi}(\text{ímpar})\,dx=0$, e par × ímpar = ímpar.`,
            visual: fourierLab(2),
          },
          exercises: [
            mcq(t`A onda quadrada $f=\operatorname{sign}(\operatorname{sen}x)$ é ímpar. Sua série tem…`, ['só senos', 'só cossenos', 'senos e cossenos', 'só a constante'], 0, t`Função ímpar ⟹ $a_n=0$.`),
            mcq(t`A onda triangular $|x|$ em $(-\pi,\,\pi)$ é par. Sua série tem…`, ['constante e cossenos', 'só senos', 'senos e cossenos', 'só a constante'], 0, t`Par ⟹ $b_n=0$; e a média $\frac\pi2\ne0$.`),
            multi(t`Quais funções são **ímpares**?`, [t`$x^3$`, t`$\operatorname{sen}x$`, t`$x\cos x$`, t`$x^2$`, t`$\cos x$`], [0, 1, 2], t`$x\cos x$: ímpar × par = ímpar.`),
            tf(t`Se $f$ é par, então $b_n=\frac1\pi\int_{-\pi}^{\pi}f\operatorname{sen}nx\,dx=0$.`, true, t`$f\operatorname{sen}nx$ é ímpar.`),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              const even = rng() < 0.5;
              return rmcq(rng, t`A série de Fourier de $f(x)=x^{${even ? 2 * Math.floor(k / 2) : 2 * Math.floor(k / 2) + 1}}$ em $(-\pi,\,\pi)$ tem:`, even ? 'apenas cossenos (e constante)' : 'apenas senos', [even ? 'apenas senos' : 'apenas cossenos (e constante)', 'senos e cossenos', 'nenhum termo'], even ? t`Potência par ⟹ função par.` : t`Potência ímpar ⟹ função ímpar.`);
            }),
            inter(t`No lab, escolha a onda **triangular** e use harmônicos até $N=5$.`, 'plot', fourierLab(0).props, (v: any) => v && Math.round(v.p.w) === 2 && Math.round(v.p.N) === 5, t`Onda $=2$ (triangular), $N=5$: já fica quase perfeita — os coeficientes caem como $\frac{1}{n^2}$.`),
            mcqS(t`Por que a série da triangular converge mais rápido que a da quadrada?`, t`seus coeficientes caem como $1/n^2$ (a função é contínua)`, [t`porque ela é ímpar`, t`porque tem período maior`, t`porque não tem harmônicos`, t`porque $a_0=0$`], t`Saltos ⟹ $\frac1n$; bicos (contínua) ⟹ $\frac1{n^2}$: quanto mais suave, mais rápido.`),
            num(t`Para $f(x)=|x|$ em $(-\pi,\,\pi)$, quanto vale o valor médio $\frac{a_0}{2}$? (2 casas)`, PI / 2, t`Média de $|x|$ entre $0$ e $\pi$ é $\frac\pi2\approx1{,}57$.`, { tol: 0.01 }),
          ],
        },
        {
          card: {
            title: 'A onda quadrada e o fenômeno de Gibbs',
            body: t`Para a onda quadrada ($-1$ e $1$):

$$f(x)=\frac4\pi\left(\operatorname{sen}x+\frac{\operatorname{sen}3x}{3}+\frac{\operatorname{sen}5x}{5}+\cdots\right)$$

Nos saltos, a série converge para a **média** dos limites laterais ($0$). Perto deles, as somas parciais sempre "passam do ponto" cerca de $9\%$ do salto — o **fenômeno de Gibbs** — por maior que seja $N$.`,
            visual: fourierLab(0),
          },
          exercises: [
            gen((rng) => {
              const n = pick(rng, [1, 3, 5, 7]);
              return num(t`Na série da onda quadrada, quanto vale $b_{${n}}$? (3 casas)`, 4 / (PI * n), t`$b_n=\frac{4}{\pi n}$ para $n$ ímpar: $\approx${fmt(4 / (PI * n), 3)}$.`, { tol: 0.002 });
            }),
            num(t`Na onda quadrada, quanto vale $b_4$?`, 0, t`Harmônicos pares não aparecem.`),
            num(t`Para que valor converge a série da onda quadrada em $x=0$ (no salto)?`, 0, t`Média de $-1$ e $1$.`),
            inter(t`Aumente $N$ na onda quadrada até $15$ ou mais e observe o pico perto do salto.`, 'plot', fourierLab(0).props, (v: any) => v && Math.round(v.p.w) === 0 && Math.round(v.p.N) >= 15, t`O pico continua perto de $1{,}18$: Gibbs não desaparece, só fica mais estreito.`),
            tf(t`Com $N$ grande o suficiente, a soma parcial da onda quadrada para de ultrapassar $1$ perto do salto.`, false, t`O excesso de $\approx9\%$ do salto persiste (Gibbs); ele só se concentra mais perto do salto.`),
            mcqS(t`Substituindo $x=\frac\pi2$ na série da onda quadrada, obtém-se a série de Leibniz. Qual?`, t`$1-\frac13+\frac15-\cdots=\frac\pi4$`, [t`$1+\frac12+\frac13+\cdots=\infty$`, t`$1+\frac14+\frac19+\cdots=\frac{\pi^2}{6}$`, t`$1-\frac12+\frac13-\cdots=\ln2$`, t`$\sum\frac{1}{2^n}=1$`], t`$\operatorname{sen}\frac{n\pi}{2}$ alterna $1,-1,\ldots$ nos ímpares: $1=\frac4\pi\left(1-\frac13+\frac15-\cdots\right)$.`),
            gen((rng) => {
              const N = pick(rng, [1, 3]);
              const x = PI / 2;
              const v = WAVES[0].partial(x, N);
              return num(t`Calcule a soma parcial da onda quadrada com harmônicos até $n=${N}$ em $x=\frac\pi2$ (3 casas).`, v, N === 1 ? t`$\frac4\pi\cdot1\approx1{,}273$.` : t`$\frac4\pi\left(1-\frac13\right)\approx0{,}849$.`, { tol: 0.002 });
            }),
            mcq(t`Os coeficientes da quadrada caem como $\frac1n$; os da triangular, como $\frac{1}{n^2}$. A dente-de-serra (com salto) deve cair como:`, ['$\\frac1n$', '$\\frac{1}{n^2}$', '$\\frac{1}{n^3}$', 'não cai'], 0, t`Ela tem saltos, como a quadrada: $b_n=\frac{2(-1)^{n+1}}{n}$.`),
          ],
        },
      ],
    },
    {
      id: 'd-four-apl',
      title: 'Aplicações',
      parts: [
        {
          card: {
            title: 'Espectro e filtros',
            body: t`O **espectro** é o gráfico das amplitudes $\sqrt{a_n^2+b_n^2}$ por frequência. Muitas operações de engenharia são feitas **no espectro**:

• **Filtro passa-baixas**: zera harmônicos altos (remove chiado, suaviza)
• **Equalizador**: aumenta ou diminui faixas de frequência
• **Compressão** (MP3, JPEG): descarta componentes quase inaudíveis/invisíveis

Mova o corte do filtro:`,
            visual: filterLab(),
          },
          exercises: [
            mcq(t`Um filtro passa-baixas aplicado à onda quadrada a deixa…`, ['mais arredondada', 'com saltos mais bruscos', 'igual', 'com frequência dobrada'], 0, t`Sem os harmônicos altos, não dá para fazer cantos vivos.`),
            inter(t`Ajuste o filtro para manter só a fundamental.`, 'plot', filterLab().props, (v: any) => v && Math.round(v.p.fc) === 1, t`Corte $=1$: sobra $\frac4\pi\operatorname{sen}x$.`),
            gen((rng) => {
              const a = randInt(rng, 1, 6);
              const b = randInt(rng, 1, 6);
              return num(t`Um harmônico tem $a_n=${a}$ e $b_n=${b}$. Qual sua amplitude no espectro? (2 casas)`, Math.hypot(a, b), t`$\sqrt{${a * a}+${b * b}}\approx${fmt(Math.hypot(a, b), 2)}$.`, { tol: 0.01 });
            }),
            tf(t`O chiado de uma gravação costuma estar nas frequências altas, por isso filtros passa-baixas o reduzem.`, true, t`Ruído "branco" espalha energia em altas frequências, onde a voz tem pouca.`),
            match(t`Ligue a aplicação à ideia de Fourier:`, [
              ['equalizador de som', 'ajustar a amplitude de faixas de frequência'],
              ['compressão MP3', 'descartar componentes pouco audíveis'],
              ['afinador de violão', 'detectar a frequência fundamental'],
              ['rádio AM/FM', 'separar sinais em frequências diferentes'],
            ], t`Todas trabalham no domínio da frequência.`),
            mcqS(t`A versão complexa da série escreve $f=\sum c_ne^{inx}$. Isso vem de:`, t`$e^{inx}=\cos nx+i\operatorname{sen}nx$`, [t`$e^{x}=\sum\frac{x^n}{n!}$`, t`$\operatorname{sen}^2+\cos^2=1$`, t`integração por partes`, t`regra da cadeia`], t`Fórmula de Euler: senos e cossenos juntos numa exponencial.`),
            mcq(t`A **transformada de Fourier** generaliza a série para…`, ['sinais não periódicos (espectro contínuo)', 'apenas funções pares', 'funções polinomiais', 'equações algébricas'], 0, t`Quando o período tende a infinito, as frequências discretas viram um contínuo.`),
            num(t`Um sinal amostrado a $44\,100$ Hz (CD) representa frequências até no máximo quantos Hz? (teorema de Nyquist)`, 22050, t`Metade da taxa de amostragem: $22\,050$ Hz — acima do limite da audição humana.`),
          ],
        },
        {
          card: {
            title: 'A equação do calor',
            body: t`Numa barra de comprimento $\pi$ com pontas a $0^\circ$, a temperatura obedece $u_t=u_{xx}$. Cada harmônico decai sozinho:

$$u(x,t)=\sum_{n} b_n\,e^{-n^2t}\operatorname{sen}nx$$

onde $b_n$ são os coeficientes do perfil inicial. O fator $e^{-n^2t}$ apaga **primeiro os harmônicos altos**: os cantos se arredondam rápido e sobra a forma de $\operatorname{sen}x$. Foi assim que Fourier criou sua série (1807). Avance o tempo:`,
            visual: heatLab(),
          },
          exercises: [
            gen((rng) => {
              const n = randInt(rng, 2, 5);
              return num(t`Na equação do calor, o harmônico $n=${n}$ decai quantas vezes mais rápido (no expoente) que o fundamental?`, n * n, t`Expoentes $-${n * n}t$ contra $-t$: fator $${n * n}$.`);
            }),
            tf(t`Depois de algum tempo, a temperatura na barra fica parecida com $b_1e^{-t}\operatorname{sen}x$.`, true, t`Os outros termos decaem muito mais rápido.`),
            inter(t`Avance o tempo até o 3º harmônico ter caído abaixo de $1\%$ ($e^{-9t}<0{,}01$).`, 'plot', heatLab().props, (v: any) => v && Math.exp(-9 * v.p.tt) < 0.01, t`$t>\frac{\ln100}{9}\approx0{,}51$.`),
            num(t`Em que instante (2 casas) o harmônico fundamental cai para metade, isto é $e^{-t}=\frac12$?`, Math.log(2), t`$t=\ln2\approx0{,}69$.`, { tol: 0.01 }),
            mcq(t`Por que os cantos do perfil inicial (degrau) somem quase instantaneamente?`, ['são feitos de harmônicos altos, que decaem como $e^{-n^2t}$', 'porque a barra esquenta', 'por causa do fenômeno de Gibbs', 'porque $b_n=0$'], 0, t`Detalhes finos = altas frequências = decaimento rápido.`),
            mcqS(t`Se o perfil inicial é $u(x,0)=3\operatorname{sen}2x$, a solução é:`, t`$3e^{-4t}\operatorname{sen}2x$`, [t`$3e^{-2t}\operatorname{sen}2x$`, t`$3e^{-t}\operatorname{sen}x$`, t`$3\operatorname{sen}2x$`, t`$3e^{4t}\operatorname{sen}2x$`], t`Um só harmônico, $n=2$: fator $e^{-n^2t}=e^{-4t}$.`),
            order(t`Ordene o método de Fourier para a equação do calor:`, ['expandir o perfil inicial em série de senos', 'resolver cada harmônico: decai como $e^{-n^2t}$', 'somar as soluções (superposição)', 'avaliar onde for preciso'], t`Linearidade + ortogonalidade.`),
            num(t`Com $u(x,0)=\operatorname{sen}x+\operatorname{sen}3x$, quanto vale $u\left(\frac\pi2,\,0\right)$?`, 0, t`$\operatorname{sen}\frac\pi2+\operatorname{sen}\frac{3\pi}2=1-1=0$.`),
          ],
        },
      ],
    },
  ],
};
