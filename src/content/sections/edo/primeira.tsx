import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { FnCurve, Label, PolylineW, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, term } from '../../../lib/random';

const t = String.raw;

type View = { xMin: number; xMax: number; yMin: number; yMax: number };
type F = (x: number, y: number, p: Record<string, number>) => number;

/** RK4 from (x0, y0) to x1; stops when the solution leaves a generous box. */
export function rk4Path(f: (x: number, y: number) => number, x0: number, y0: number, x1: number, v: View, n = 160): [number, number][] {
  const out: [number, number][] = [[x0, y0]];
  const h = (x1 - x0) / n;
  const big = 4 * (v.yMax - v.yMin) + Math.abs(v.yMax) + Math.abs(v.yMin);
  let x = x0;
  let y = y0;
  for (let i = 0; i < n; i++) {
    const k1 = f(x, y);
    const k2 = f(x + h / 2, y + (h / 2) * k1);
    const k3 = f(x + h / 2, y + (h / 2) * k2);
    const k4 = f(x + h, y + h * k3);
    y += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    x += h;
    if (!isFinite(y) || Math.abs(y) > big) break;
    out.push([x, y]);
  }
  return out;
}

/**
 * Slope (direction) field of y' = f(x, y) with a draggable initial condition P;
 * the solution through P is drawn with RK4 forwards and backwards.
 */
export const slopeFieldLab = (
  f: F,
  opts: {
    view: View;
    P?: [number, number];
    params?: { key: string; label?: string; min: number; max: number; step?: number; value: number; color?: string }[];
    nx?: number;
    ny?: number;
    info?: (x: number, y: number, p: Record<string, number>) => string;
    extra?: (p: Record<string, number>) => React.ReactNode;
  },
) => {
  const v = opts.view;
  const nx = opts.nx ?? 15;
  const ny = opts.ny ?? 11;
  const P = opts.P ?? [0, 1];
  return plot({
    view: v,
    params: opts.params,
    points: [{ id: 'P', x: P[0], y: P[1], color: C.gold, label: 'P' }],
    constrain: (_: string, x: number, y: number) => ({ x: Math.max(v.xMin, Math.min(v.xMax, x)), y: Math.max(v.yMin, Math.min(v.yMax, y)) }),
    render: ({ pts, p }: any) => {
      const hx = (v.xMax - v.xMin) / nx;
      const hy = (v.yMax - v.yMin) / ny;
      const segs: React.ReactNode[] = [];
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < ny; j++) {
          const x = v.xMin + (i + 0.5) * hx;
          const y = v.yMin + (j + 0.5) * hy;
          const m = f(x, y, p);
          if (!isFinite(m)) continue;
          const s = 0.36 / Math.hypot(1 / hx, m / hy);
          segs.push(<Seg key={i + '-' + j} x1={x - s} y1={y - m * s} x2={x + s} y2={y + m * s} color={C.textMuted} width={1.6} />);
        }
      const g = (x: number, y: number) => f(x, y, p);
      const fwd = rk4Path(g, pts.P.x, pts.P.y, v.xMax, v);
      const bwd = rk4Path(g, pts.P.x, pts.P.y, v.xMin, v);
      return (
        <>
          {segs}
          {opts.extra ? opts.extra(p) : null}
          <PolylineW pts={fwd} color={C.p1} width={3} />
          <PolylineW pts={bwd} color={C.p1} width={3} />
        </>
      );
    },
    info: ({ pts, p }: any) =>
      opts.info ? opts.info(pts.P.x, pts.P.y, p) : t`Condição inicial $y(${fmt(pts.P.x, 1)})=${fmt(pts.P.y, 1)}$ · inclinação ali: $y'=${fmt(f(pts.P.x, pts.P.y, p), 2)}$`,
  });
};

/** Exponential growth/decay y = y0 e^{kt} with sliders. */
const expLab = () =>
  plot({
    view: { xMin: -0.3, xMax: 6, yMin: -0.5, yMax: 10 },
    params: [
      { key: 'y0', label: 'y_0', min: 0.5, max: 8, step: 0.5, value: 2, color: C.p2 },
      { key: 'k', label: 'k', min: -1.5, max: 1, step: 0.05, value: 0.3, color: C.p5 },
    ],
    render: ({ p }: any) => {
      const half = p.k < -1e-6 ? Math.log(2) / -p.k : p.k > 1e-6 ? Math.log(2) / p.k : NaN;
      return (
        <>
          <FnCurve f={(x) => p.y0 * Math.exp(p.k * x)} from={0} color={C.p1} />
          <Pt x={0} y={p.y0} color={C.p2} label="y_0" />
          {isFinite(half) && half < 6 ? <Pt x={half} y={p.k < 0 ? p.y0 / 2 : 2 * p.y0} color={C.gold} label={p.k < 0 ? 'y₀/2' : '2y₀'} /> : null}
        </>
      );
    },
    info: ({ p }: any) =>
      Math.abs(p.k) < 1e-6
        ? t`$k=0$: $y$ constante`
        : p.k < 0
          ? t`$y=${fmt(p.y0)}e^{${fmt(p.k, 2)}t}$ · **decaimento** · meia-vida $\frac{\ln 2}{|k|}\approx${fmt(Math.log(2) / -p.k, 2)}$`
          : t`$y=${fmt(p.y0)}e^{${fmt(p.k, 2)}t}$ · **crescimento** · tempo de duplicação $\frac{\ln 2}{k}\approx${fmt(Math.log(2) / p.k, 2)}$`,
  });

/** Logistic growth with sliders r, K, P0 (solution in closed form). */
const logisticLab = () =>
  plot({
    view: { xMin: -0.3, xMax: 10, yMin: -0.5, yMax: 12 },
    params: [
      { key: 'r', label: 'r', min: 0.1, max: 2, step: 0.05, value: 0.8, color: C.p2 },
      { key: 'K', label: 'K', min: 2, max: 11, step: 0.5, value: 8, color: C.gold },
      { key: 'P0', label: 'P_0', min: 0.2, max: 11, step: 0.2, value: 1, color: C.p5 },
    ],
    render: ({ p }: any) => {
      const A = (p.K - p.P0) / p.P0;
      return (
        <>
          <Seg x1={-0.3} y1={p.K} x2={10} y2={p.K} color={C.gold} dash="6 5" width={1.5} />
          <Label x={9.8} y={p.K} text="K" color={C.gold} anchor="end" dy={-6} />
          <FnCurve f={(x) => p.K / (1 + A * Math.exp(-p.r * x))} from={0} color={C.p1} />
          <Pt x={0} y={p.P0} color={C.p5} r={5} />
        </>
      );
    },
    info: ({ p }: any) => t`$P'=${fmt(p.r, 2)}\,P\left(1-\frac{P}{${fmt(p.K, 1)}}\right)$ · $P(t)\to K=${fmt(p.K, 1)}$ · crescimento mais rápido em $P=\frac K2=${fmt(p.K / 2, 2)}$`,
  });

/** RC circuit charging: q(t) = CE(1 - e^{-t/RC}). */
const rcLab = () =>
  plot({
    view: { xMin: -0.3, xMax: 10, yMin: -0.5, yMax: 11 },
    params: [
      { key: 'R', label: 'R', min: 0.5, max: 5, step: 0.1, value: 2, color: C.p2 },
      { key: 'Cc', label: 'C', min: 0.2, max: 2, step: 0.1, value: 1, color: C.p3 },
      { key: 'E', label: 'E', min: 2, max: 10, step: 0.5, value: 8, color: C.gold },
    ],
    render: ({ p }: any) => {
      const tau = p.R * p.Cc;
      const Vc = (x: number) => p.E * (1 - Math.exp(-x / tau));
      return (
        <>
          <Seg x1={-0.3} y1={p.E} x2={10} y2={p.E} color={C.gold} dash="6 5" width={1.5} />
          <FnCurve f={Vc} from={0} color={C.p1} />
          {tau < 10 ? <Pt x={tau} y={Vc(tau)} color={C.p5} label="τ" /> : null}
        </>
      );
    },
    info: ({ p }: any) => t`$V_C(t)=E\,(1-e^{-t/RC})$ · $\tau=RC=${fmt(p.R * p.Cc, 2)}$ · em $t=\tau$ o capacitor tem $63\%$ de $E$`,
  });

export const edo1: UnitDef = {
  id: 'd-edo1',
  title: 'EDOs de 1ª ordem',
  subtitle: 'Modelagem, campo de direções, separáveis e lineares',
  icon: '🌱',
  source: 'Cálculo 4 · Equações diferenciais ordinárias',
  guide: t`Uma **equação diferencial** relaciona uma função com suas derivadas: em vez de dizer quanto vale $y$, diz **como $y$ muda**. Ela modela crescimento populacional, resfriamento, circuitos e tanques. Nesta unidade: ler o campo de direções, resolver EDOs **separáveis** ($\int\frac{dy}{h(y)}=\int g(x)\,dx$) e **lineares** com o **fator integrante** $\mu=e^{\int p\,dx}$.`,
  lessons: [
    {
      id: 'd-edo1-intro',
      title: 'O que é uma EDO',
      parts: [
        {
          card: {
            title: 'Equações que falam de taxas',
            body: t`Uma **equação diferencial ordinária (EDO)** envolve uma função desconhecida $y(x)$ e suas derivadas:

• $y'=3y$ — a taxa de variação é proporcional ao valor
• $y''+4y=0$ — oscilador (mola)

A **ordem** é a da maior derivada que aparece. A EDO é **linear** quando $y,\,y',\,y'',\ldots$ aparecem só no 1º grau, sem multiplicar entre si e sem estar dentro de funções ($y^2$, $yy'$, $\operatorname{sen}y$ a tornam **não linear**).

**Resolver** é encontrar funções que, substituídas, tornam a igualdade verdadeira.`,
            example: t`$y=e^{3x}$ resolve $y'=3y$: $y'=3e^{3x}=3y$ ✓. E $y=5e^{3x}$ também! Toda a família $y=Ce^{3x}$ serve.`,
          },
          exercises: [
            mcq(t`Qual é a **ordem** da EDO $y''+3y'=x^2$?`, ['2', '1', '3', '0'], 0, t`A maior derivada é $y''$.`),
            tf(t`A EDO $y'=y^2$ é linear.`, false, t`O termo $y^2$ a torna **não linear**.`),
            match(t`Ligue cada EDO à sua ordem:`, [
              [t`$y'=x+y$`, '1ª ordem'],
              [t`$y''-y=0$`, '2ª ordem'],
              [t`$y'''=\cos x$`, '3ª ordem'],
              [t`$(y')^2=4y$`, '1ª ordem (não linear)'],
            ], t`Ordem = maior derivada; o expoente de $y'$ não muda a ordem, mas tira a linearidade.`),
            multi(t`Quais EDOs são **lineares**?`, [t`$y'+2y=e^x$`, t`$y''+xy=0$`, t`$y'=\operatorname{sen}y$`, t`$yy'=1$`], [0, 1], t`Em $y''+xy=0$ o coeficiente $x$ pode depender de $x$; o que não pode é $\operatorname{sen}y$ ou $yy'$.`),
            gen((rng) => {
              const k = randNZ(rng, -4, 4);
              const c = randNZ(rng, -5, 5);
              return num(t`Se $y=${c}e^{${k}x}$ resolve $y'=ky$, quanto vale $y'(0)$?`, c * k, t`$y'=${c}\cdot${k}\,e^{${k}x}$; em $x=0$: $${c * k}$.`);
            }),
            mcqS(t`Qual função é solução de $y'=2x$?`, t`$y=x^2+7$`, [t`$y=2x^2$`, t`$y=e^{2x}$`, t`$y=2$`, t`$y=x^2+2x$`], t`Derivando $x^2+7$ obtemos $2x$ ✓ (a constante some).`),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const sign = pick(rng, [1, -1]);
              const fn = sign > 0 ? `e^{${a}x}` : `\\cos(${a}x)`;
              const correct = sign > 0 ? `$y''=${a * a}y$` : `$y''=-${a * a}y$`;
              return rmcq(rng, t`$y=${fn}$ é solução de qual EDO?`, correct, [sign > 0 ? `$y''=-${a * a}y$` : `$y''=${a * a}y$`, `$y'=${a}y$`, `$y''=${a}y$`, `$y'=-${a}y$`], sign > 0 ? t`$y''=${a * a}e^{${a}x}=${a * a}y$.` : t`$y'=-${a}\operatorname{sen}(${a}x)$ e $y''=-${a * a}\cos(${a}x)=-${a * a}y$.`);
            }),
            num(t`Para que valor de $r$ a função $y=e^{rx}$ (com $r>0$) resolve $y''-5y'+6y=0$? Dê o **maior** $r$.`, 3, t`Substituindo: $e^{rx}(r^2-5r+6)=0\Rightarrow r=2$ ou $r=3$.`),
          ],
        },
        {
          card: {
            title: 'Solução geral, particular e PVI',
            body: t`A **solução geral** é uma família com constantes ($y=x^2+C$). Uma **condição inicial** $y(x_0)=y_0$ escolhe **uma** curva da família: é o **problema de valor inicial (PVI)**.

Arraste $P$ no campo de $y'=x$: cada posição inicial dá uma parábola $y=\frac{x^2}{2}+C$ diferente.`,
            visual: slopeFieldLab((x) => x, { view: { xMin: -3, xMax: 3, yMin: -3, yMax: 4 }, P: [0, 1], info: (x, y) => t`Passa por $(${fmt(x, 1)},\,${fmt(y, 1)})$ ⟹ $C=${fmt(y - (x * x) / 2, 2)}$: $y=\frac{x^2}{2}${term(Math.round((y - (x * x) / 2) * 100) / 100, '')}$` }),
            tip: t`Uma EDO de ordem $n$ tem $n$ constantes na solução geral — e precisa de $n$ condições para fixá-las.`,
          },
          exercises: [
            tf(t`A solução geral de $y'=\cos x$ é $y=\operatorname{sen}x+C$.`, true, t`Basta integrar os dois lados.`),
            num(t`Resolva o PVI $y'=2x$, $y(0)=3$ e calcule $y(2)$.`, 7, t`$y=x^2+C$; $y(0)=C=3$. Logo $y(2)=4+3=7$.`),
            gen((rng) => {
              const a = randNZ(rng, -3, 3);
              const b = randInt(rng, -4, 4);
              const y0 = randInt(rng, -3, 5);
              const x1 = randInt(rng, 1, 3);
              const ans = (a * x1 * x1) / 2 + b * x1 + y0;
              return num(t`PVI: $y'=${a}x${term(b, '')}$, $y(0)=${y0}$. Quanto vale $y(${x1})$?`, ans, t`$y=\frac{${a}}{2}x^2${term(b, 'x')}${term(y0, '')}$, então $y(${x1})=${fmt(ans)}$.`);
            }),
            mcq(t`Quantas constantes arbitrárias tem a solução geral de uma EDO de **2ª** ordem?`, ['2', '1', '0', 'infinitas'], 0, t`Integra-se "duas vezes": duas constantes.`),
            inter(t`No campo de $y'=x$, arraste $P$ para que a solução seja $y=\frac{x^2}{2}-1$.`, 'plot', slopeFieldLab((x) => x, { view: { xMin: -3, xMax: 3, yMin: -3, yMax: 4 }, P: [1, 2] }).props, (v: any) => v && near(v.pts.P.y - (v.pts.P.x * v.pts.P.x) / 2, -1, 0.12), t`Qualquer ponto da curva, por exemplo $P=(0,\,-1)$ ou $(2,\,1)$.`, t`As soluções são $y=\frac{x^2}{2}+C$; a curva pedida tem $C=-1$, então qualquer ponto dela serve, como $(0,\,-1)$.`),
            gen((rng) => {
              const k = randNZ(rng, -3, 3);
              const y0 = randNZ(rng, -4, 6);
              return rmcq(rng, t`Qual a solução do PVI $y'=${k}y$, $y(0)=${y0}$?`, `$y=${y0}e^{${k}x}$`, [`$y=${k}e^{${y0}x}$`, `$y=e^{${k}x}+${y0}$`.replace('+-', '-'), `$y=${y0}e^{${-k}x}$`, `$y=${y0}x^{${k}}$`], t`Família $y=Ce^{${k}x}$ e $y(0)=C=${y0}$.`);
            }),
            mcqS(t`Na família $y=Ce^{-x}$, qual curva passa por $(0,\,4)$?`, t`$y=4e^{-x}$`, [t`$y=e^{-x}+4$`, t`$y=-4e^{x}$`, t`$y=4e^{x}$`, t`$y=e^{-4x}$`], t`$y(0)=C=4$.`),
            num(t`A curva da família $y=x^3+C$ que passa por $(1,\,5)$ corta o eixo $y$ em qual valor?`, 4, t`$5=1+C\Rightarrow C=4$; em $x=0$: $y=4$.`),
          ],
        },
        {
          card: {
            title: 'Modelagem e campo de direções',
            body: t`Mesmo sem resolver, a EDO $y'=f(x,y)$ diz a **inclinação** da solução em cada ponto. Desenhar tracinhos com essas inclinações dá o **campo de direções**; as soluções "seguem a correnteza".

Modelos clássicos:
• População: $P'=kP$
• Resfriamento de Newton: $T'=-k\,(T-T_a)$
• Logística: $P'=rP\left(1-\frac PK\right)$

Abaixo, $y'=y(2-y)$: veja as **soluções de equilíbrio** $y=0$ e $y=2$ (onde $y'=0$).`,
            visual: slopeFieldLab((_x, y) => y * (2 - y), { view: { xMin: -2, xMax: 4, yMin: -1.5, yMax: 3.5 }, P: [-1.5, 0.3] }),
          },
          exercises: [
            match(t`Ligue cada situação à sua EDO:`, [
              ['bactérias crescendo sem limite', t`$P'=kP$`],
              ['café esfriando numa sala a 20°C', t`$T'=-k(T-20)$`],
              ['peixes num lago com capacidade K', t`$P'=rP(1-P/K)$`],
              ['objeto em queda livre (sem ar)', t`$v'=g$`],
            ], t`Cada modelo traduz uma frase sobre a **taxa** de variação.`),
            gen((rng) => {
              const x = randInt(rng, -2, 2);
              const y = randInt(rng, -2, 3);
              const a = randNZ(rng, -2, 2);
              return num(t`No campo de direções de $y'=x${term(a, 'y')}$, qual a inclinação do tracinho no ponto $(${x},\,${y})$?`, x + a * y, t`$y'=${x}${term(a, `\\cdot(${y})`)}=${x + a * y}$.`);
            }),
            tf(t`Em $y'=y(2-y)$, a função constante $y=2$ é uma solução.`, true, t`$y'=0$ e $2(2-2)=0$ ✓: é uma solução de **equilíbrio**.`),
            mcq(t`Em $y'=y(2-y)$, uma solução que começa em $y(0)=1$…`, ['cresce e se aproxima de 2', 'decresce até 0', 'cresce sem limite', 'fica constante em 1'], 0, t`Entre $0$ e $2$, $y'>0$; ao chegar perto de $2$, $y'\to0$.`),
            inter(t`No campo de $y'=y(2-y)$, arraste $P$ para uma condição inicial que gere uma solução **constante** e **positiva**.`, 'plot', slopeFieldLab((_x, y) => y * (2 - y), { view: { xMin: -2, xMax: 4, yMin: -1.5, yMax: 3.5 }, P: [0, 1] }).props, (v: any) => v && near(v.pts.P.y, 2, 0.08), t`$y=2$, o equilíbrio positivo.`, t`Soluções constantes são os equilíbrios: $y(2-y)=0\Rightarrow y=0$ ou $y=2$; a positiva é $y=2$.`),
            gen((rng) => {
              const Ta = pick(rng, [18, 20, 22, 25]);
              const T = Ta + randInt(rng, 20, 70);
              const k = pick(rng, [0.05, 0.1, 0.2]);
              return num(t`Um corpo a $${T}\,^\circ\text{C}$ esfria numa sala a $${Ta}\,^\circ\text{C}$ segundo $T'=-${fmt(k)}(T-${Ta})$. Qual a taxa de variação inicial (em °C/min)?`, -k * (T - Ta), t`$T'=-${fmt(k)}\cdot(${T}-${Ta})=${fmt(-k * (T - Ta))}$: esfria $${fmt(k * (T - Ta))}$ °C por minuto no início.`, { tol: 0.01 });
            }),
            mcqS(t`Para $T'=-k(T-T_a)$ com $k>0$, o que acontece com $T$ quando $t\to\infty$?`, t`$T\to T_a$`, [t`$T\to0$`, t`$T\to\infty$`, t`$T$ oscila`, t`$T\to -T_a$`], t`A diferença $T-T_a$ decai exponencialmente: o corpo atinge a temperatura ambiente.`),
            multi(t`Para $y'=(y-1)(y+3)$, quais são soluções de equilíbrio?`, [t`$y=1$`, t`$y=-3$`, t`$y=3$`, t`$y=0$`], [0, 1], t`Equilíbrios: zeros de $(y-1)(y+3)$.`),
          ],
        },
      ],
    },
    {
      id: 'd-edo1-sep',
      title: 'EDOs separáveis',
      parts: [
        {
          card: {
            title: 'Separar e integrar',
            body: t`Uma EDO é **separável** se dá para escrever $\dfrac{dy}{dx}=g(x)\,h(y)$. Aí juntamos cada variável do seu lado:

$$\int\frac{dy}{h(y)}=\int g(x)\,dx$$

Integre os dois lados, junte as constantes numa só e, se possível, isole $y$.`,
            example: t`$y'=xy$: $\int\frac{dy}{y}=\int x\,dx\Rightarrow\ln|y|=\frac{x^2}{2}+C\Rightarrow y=Ae^{x^2/2}$.`,
            tip: t`Ao dividir por $h(y)$, guarde os valores com $h(y)=0$: eles são soluções constantes que podem se perder.`,
          },
          exercises: [
            multi(t`Quais EDOs são **separáveis**?`, [t`$y'=x^2y$`, t`$y'=\dfrac{\cos x}{y}$`, t`$y'=e^{x+y}$`, t`$y'=x+y$`], [0, 1, 2], t`$e^{x+y}=e^xe^y$ separa; $x+y$ não fatora como produto.`),
            mcqS(t`Separando $y'=\dfrac{x}{y}$, obtemos…`, t`$\int y\,dy=\int x\,dx$`, [t`$\int\frac{dy}{y}=\int x\,dx$`, t`$\int x\,dy=\int y\,dx$`, t`$\int dy=\int\frac xy\,dx$`, t`$\int\frac{dy}{x}=\int\frac{dx}{y}$`], t`Multiplique os dois lados por $y\,dx$.`),
            fill(t`Complete a solução de $y'=xy$.`, t`$\int\frac{dy}{y}=\int x\,dx\Rightarrow \ln|y|=$ ___ $+C\Rightarrow y=A\,$___`, [t`$\frac{x^2}{2}$`, t`$e^{x^2/2}$`], [t`$x^2$`, t`$e^{x^2}$`, t`$\ln x$`], t`$\int x\,dx=\frac{x^2}{2}$ e exponenciando: $y=Ae^{x^2/2}$.`),
            gen((rng) => {
              const k = randNZ(rng, -3, 3);
              const y0 = randNZ(rng, -4, 4);
              return rmcq(rng, t`Resolva $y'=${k}x^2y$ com $y(0)=${y0}$.`, `$y=${y0}e^{${fmt(k / 3)}x^3}$`.replace('{1x', '{x').replace('{-1x', '{-x'), [`$y=${y0}e^{${k}x^3}$`, `$y=${y0}e^{${2 * k}x}$`, `$y=${y0}+${k}x^3$`.replace('+-', '-'), `$y=${y0}e^{${fmt(k / 2)}x^2}$`], t`$\ln|y|=\frac{${k}}{3}x^3+C$, então $y=y_0e^{${fmt(k / 3)}x^3}$.`);
            }),
            num(t`Resolva $y'=\dfrac{x}{y}$, $y(0)=3$, com $y>0$. Quanto vale $y(4)$?`, 5, t`$\frac{y^2}{2}=\frac{x^2}{2}+C$; $y(0)=3\Rightarrow y^2=x^2+9$. Em $x=4$: $y=\sqrt{25}=5$.`),
            gen((rng) => {
              const [a, c] = pick(rng, [[3, 4], [6, 8], [5, 12], [8, 6], [12, 5]] as const);
              return num(t`Resolva $yy'=x$ com $y(0)=${a}$ ($y>0$) e calcule $y(${c})$.`, Math.hypot(a, c), t`$y^2=x^2+${a * a}$; em $x=${c}$: $y=\sqrt{${c * c}+${a * a}}=${Math.hypot(a, c)}$.`);
            }),
            tf(t`Ao resolver $y'=y^2$ dividindo por $y^2$, perdemos a solução $y=0$.`, true, t`$y\equiv0$ satisfaz $0=0$, mas some quando dividimos por $y^2$.`),
            num(t`Resolva $y'=y^2$, $y(0)=1$. Em que $x$ a solução "explode" (vai a infinito)?`, 1, t`$-\frac1y=x+C$, $C=-1$: $y=\frac{1}{1-x}$, que explode em $x=1$.`),
          ],
        },
        {
          card: {
            title: 'Crescimento, decaimento e meia-vida',
            body: t`$y'=ky$ é separável: $y=y_0e^{kt}$.

• $k>0$: **crescimento** exponencial; tempo de duplicação $\frac{\ln2}{k}$
• $k<0$: **decaimento**; **meia-vida** $T_{1/2}=\frac{\ln2}{|k|}$

Resfriamento de Newton, $T'=-k(T-T_a)$, também separa: $T(t)=T_a+(T_0-T_a)e^{-kt}$.`,
            visual: expLab(),
            example: t`Carbono-14: $T_{1/2}\approx5730$ anos. Um fóssil com $25\%$ do C-14 original passou por **duas** meias-vidas: $\approx11\,460$ anos.`,
          },
          exercises: [
            tf(t`Em $y=y_0e^{kt}$ com $k<0$, a quantidade cai pela metade sempre no mesmo intervalo de tempo.`, true, t`$e^{k(t+T)}=\frac12e^{kt}$ não depende de $t$: $T=\frac{\ln2}{|k|}$.`),
            gen((rng) => {
              const k = pick(rng, [0.1, 0.2, 0.25, 0.5, 0.05]);
              return num(t`Uma substância decai com $k=-${fmt(k)}$ por ano. Qual sua meia-vida (anos, 2 casas)?`, Math.log(2) / k, t`$T_{1/2}=\frac{\ln2}{${fmt(k)}}\approx${fmt(Math.log(2) / k, 2)}$.`, { tol: 0.02 });
            }),
            gen((rng) => {
              const n = randInt(rng, 1, 4);
              const T = pick(rng, [5, 8, 10, 30]);
              const m0 = pick(rng, [80, 160, 320, 640]);
              return num(t`Uma amostra de $${m0}$ g tem meia-vida de $${T}$ dias. Quantos gramas restam após $${n * T}$ dias?`, m0 / 2 ** n, t`$${n * T}$ dias $=${n}$ meias-vidas: $${m0}\cdot\left(\tfrac12\right)^{${n}}=${fmt(m0 / 2 ** n)}$ g.`);
            }),
            mcqS(t`Um fóssil tem $12{,}5\%$ do carbono-14 original ($T_{1/2}\approx5730$ anos). Sua idade aproximada é:`, '≈ 17 190 anos', ['≈ 11 460 anos', '≈ 5 730 anos', '≈ 22 920 anos', '≈ 716 anos'], t`$12{,}5\%=\left(\frac12\right)^3$: três meias-vidas, $3\cdot5730=17\,190$.`),
            inter(t`Ajuste os sliders para um **decaimento** com $y_0=4$ e meia-vida $\approx2$ (isto é, $k\approx-0{,}35$).`, 'plot', expLab().props, (v: any) => v && near(v.p.y0, 4, 0.01) && near(v.p.k, -0.35, 0.03), t`$y_0=4$ e $k=-\frac{\ln2}{2}\approx-0{,}35$.`, t`Em $y=y_0e^{kt}$, a meia-vida $T$ cumpre $e^{kT}=\frac12$, logo $k=-\frac{\ln2}{T}=-\frac{\ln 2}{2}\approx-0{,}35$.`),
            gen((rng) => {
              const Ta = pick(rng, [20, 25]);
              const T0 = pick(rng, [80, 90, 100]);
              const k = pick(rng, [0.1, 0.05, 0.2]);
              const tt = pick(rng, [5, 10]);
              const T = Ta + (T0 - Ta) * Math.exp(-k * tt);
              return num(t`Café a $${T0}\,^\circ$C numa sala a $${Ta}\,^\circ$C, com $k=${fmt(k)}$/min. Temperatura após $${tt}$ min? (1 casa)`, Math.round(T * 10) / 10, t`$T=${Ta}+${T0 - Ta}e^{-${fmt(k * tt)}}\approx${fmt(T, 1)}\,^\circ$C.`, { tol: 0.15 });
            }),
            num(t`Uma cultura dobra a cada $3$ horas. Qual o valor de $k$ em $P=P_0e^{kt}$ (por hora, 3 casas)?`, Math.log(2) / 3, t`$e^{3k}=2\Rightarrow k=\frac{\ln2}{3}\approx0{,}231$.`, { tol: 0.002 }),
            num(t`Um corpo a $100\,^\circ$C, numa sala a $20\,^\circ$C, chega a $60\,^\circ$C em $10$ min. Quanto tempo (min) leva para chegar a $40\,^\circ$C?`, 20, t`$T-20$ cai de $80$ para $40$ (metade) em $10$ min; para $20$ é outra metade: $20$ min no total.`),
          ],
        },
        {
          card: {
            title: 'Logística e estabilidade',
            body: t`Recursos limitados freiam o crescimento: $P'=rP\left(1-\frac{P}{K}\right)$. Separando (com frações parciais):

$$P(t)=\frac{K}{1+Ae^{-rt}},\qquad A=\frac{K-P_0}{P_0}$$

$K$ é a **capacidade de suporte**. Os equilíbrios são $P=0$ (**instável**: soluções se afastam) e $P=K$ (**estável**: soluções se aproximam).`,
            visual: logisticLab(),
          },
          exercises: [
            mcq(t`Na logística $P'=rP(1-P/K)$, se $P_0>K$, a população…`, ['diminui e se aproxima de K', 'cresce sem limite', 'vai a zero', 'fica constante'], 0, t`Para $P>K$, $1-P/K<0\Rightarrow P'<0$.`),
            gen((rng) => {
              const K = pick(rng, [100, 200, 500, 1000]);
              return num(t`Na logística com $K=${K}$, para qual população $P$ o crescimento $P'$ é máximo?`, K / 2, t`$P'=rP-\frac{r}{K}P^2$ é uma parábola em $P$ com vértice em $P=\frac K2=${K / 2}$.`);
            }),
            tf(t`$P=K$ é um equilíbrio estável da logística.`, true, t`Abaixo de $K$, $P'>0$ (sobe); acima, $P'<0$ (desce): converge para $K$.`),
            gen((rng) => {
              const K = pick(rng, [10, 20, 50]);
              const P0 = pick(rng, [1, 2, 5].filter((x) => x < K));
              return num(t`Logística com $K=${K}$ e $P_0=${P0}$: quanto vale $A$ em $P=\frac{K}{1+Ae^{-rt}}$?`, (K - P0) / P0, t`$A=\frac{K-P_0}{P_0}=\frac{${K - P0}}{${P0}}=${fmt((K - P0) / P0)}$.`);
            }),
            inter(t`Ajuste a logística para capacidade $K=6$ partindo de $P_0=9$ (acima de $K$).`, 'plot', logisticLab().props, (v: any) => v && near(v.p.K, 6, 0.01) && near(v.p.P0, 9, 0.11), t`$K=6$ e $P_0=9$: a curva **desce** até $6$.`, t`Acima da capacidade $P'=rP\left(1-\frac{P}{K}\right)<0$: a população diminui e se aproxima de $K=6$ por cima.`),
            mcqS(t`Os equilíbrios de $y'=y(y-3)$ são $0$ e $3$. Qual é **estável**?`, t`$y=0$`, [t`$y=3$`, 'os dois', 'nenhum', t`$y=1{,}5$`], t`Entre 0 e 3, $y'<0$ (desce até 0); abaixo de 0, $y'>0$ (sobe até 0). Acima de 3, $y'>0$: foge de 3.`),
            num(t`Logística $P'=0{,}5P(1-P/100)$, $P_0=20$. Quanto vale $P'(0)$, a taxa inicial?`, 8, t`$0{,}5\cdot20\cdot(1-0{,}2)=8$.`),
            gen((rng) => {
              const r = pick(rng, [0.5, 1, 2]);
              const A = pick(rng, [1, 3, 9]);
              const tt = Math.log(A) / r;
              return num(t`Para $P(t)=\dfrac{100}{1+${A}e^{-${fmt(r)}t}}$, em que instante a população atinge $50$? (2 casas)`, tt, t`$1+${A}e^{-${fmt(r)}t}=2\Rightarrow e^{-${fmt(r)}t}=\frac1{${A}}\Rightarrow t=\frac{\ln ${A}}{${fmt(r)}}\approx${fmt(tt, 2)}$.`, { tol: 0.02 });
            }),
          ],
        },
      ],
    },
    {
      id: 'd-edo1-lin',
      title: 'Lineares e fator integrante',
      parts: [
        {
          card: {
            title: 'O truque do fator integrante',
            body: t`EDO linear de 1ª ordem na **forma padrão**: $y'+p(x)\,y=q(x)$.

Multiplique tudo por $\mu(x)=e^{\int p\,dx}$. O lado esquerdo vira a derivada de um produto:

$$\mu y'+\mu p\,y=(\mu y)'\quad\Rightarrow\quad (\mu y)'=\mu q\quad\Rightarrow\quad y=\frac{1}{\mu}\left(\int\mu q\,dx+C\right)$$`,
            example: t`$y'+2y=4$: $\mu=e^{2x}$, $(e^{2x}y)'=4e^{2x}\Rightarrow e^{2x}y=2e^{2x}+C\Rightarrow y=2+Ce^{-2x}$.`,
            tip: t`Funciona porque $\mu'=p\,\mu$: é a **regra do produto ao contrário**.`,
          },
          exercises: [
            mcqS(t`Qual o fator integrante de $y'+3y=x$?`, t`$e^{3x}$`, [t`$e^{x}$`, t`$3x$`, t`$e^{-3x}$`, t`$e^{x^2/2}$`], t`$\mu=e^{\int3\,dx}=e^{3x}$.`),
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              return rmcq(rng, t`Fator integrante de $y'${term(a, 'y')}=\operatorname{sen}x$:`, `$e^{${a}x}$`.replace('{1x', '{x').replace('{-1x', '{-x'), [`$e^{${-a}x}$`.replace('{1x', '{x').replace('{-1x', '{-x'), `$${a}x$`, `$e^{${a}}$`, `$e^{x^2}$`], t`$\mu=e^{\int ${a}\,dx}=e^{${a}x}$.`);
            }),
            mcqS(t`Para $y'+\dfrac{1}{x}y=x$ ($x>0$), o fator integrante é:`, t`$x$`, [t`$\ln x$`, t`$e^x$`, t`$\frac1x$`, t`$x^2$`], t`$e^{\int\frac1x dx}=e^{\ln x}=x$.`),
            order(t`Ordene os passos para resolver $y'+p(x)y=q(x)$:`, ['escrever na forma padrão', t`calcular $\mu=e^{\int p\,dx}$`, t`multiplicar a EDO por $\mu$`, t`reconhecer $(\mu y)'=\mu q$ e integrar`, t`isolar $y$ e aplicar a condição inicial`], t`Esse é o roteiro completo do método.`),
            tf(t`$y'=2xy+x$ não pode ser resolvida por fator integrante.`, false, t`É linear: $y'-2xy=x$, com $\mu=e^{-x^2}$. (Por acaso também é separável.)`),
            fill(t`Complete para $y'+2y=4$:`, t`$\mu=$ ___ ; $(e^{2x}y)'=4e^{2x}$ ; $y=$ ___ $+Ce^{-2x}$`, [t`$e^{2x}$`, '2'], [t`$e^{-2x}$`, '4', t`$2x$`], t`Integrando: $e^{2x}y=2e^{2x}+C$.`),
            mcqS(t`Antes de usar o fator integrante em $xy'+2y=x^3$, devemos…`, t`dividir por $x$: $y'+\frac2xy=x^2$`, [t`multiplicar por $x$`, t`derivar os dois lados`, t`trocar $y$ por $y^2$`, t`integrar direto`], t`A forma padrão exige coeficiente $1$ em $y'$.`),
            num(t`Para $xy'+2y=x^3$ ($x>0$), o fator integrante é $\mu=x^n$. Quanto vale $n$?`, 2, t`$p=\frac2x\Rightarrow\mu=e^{2\ln x}=x^2$.`),
          ],
        },
        {
          card: {
            title: 'Resolvendo passo a passo',
            body: t`Com $p$ e $q$ constantes, $y'+ay=b$ tem solução:

$$y=\frac{b}{a}+Ce^{-ax}$$

$\frac ba$ é o **equilíbrio** (solução particular constante) e $Ce^{-ax}$ é o **transiente** (some se $a>0$). Veja no campo de $y'=2-y$: todas as soluções convergem para $y=2$.`,
            visual: slopeFieldLab((_x, y) => 2 - y, { view: { xMin: -1, xMax: 5, yMin: -1, yMax: 5 }, P: [0, 4.5] }),
          },
          exercises: [
            gen((rng) => {
              const a = randNZ(rng, -3, 4);
              const b = randNZ(rng, -6, 6);
              return rmcq(rng, t`Solução geral de $y'${term(a, 'y')}=${b}$:`, `$y=${fmt(b / a)}+Ce^{${-a}x}$`.replace('+-', '-').replace('{1x', '{x').replace('{-1x', '{-x'), [`$y=${fmt(a / b)}+Ce^{${-a}x}$`.replace('+-', '-').replace('{1x', '{x').replace('{-1x', '{-x'), `$y=${fmt(b / a)}+Ce^{${a}x}$`.replace('+-', '-').replace('{1x', '{x').replace('{-1x', '{-x'), `$y=${b}x+C$`, `$y=Ce^{${b}x}$`], t`Equilíbrio $\frac{${b}}{${a}}$ mais $Ce^{${-a}x}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const b = a * randInt(rng, 1, 4);
              const y0 = randInt(rng, -3, 6);
              return num(t`Resolva $y'+${a}y=${b}$, $y(0)=${y0}$. Quanto vale $C$ em $y=${b / a}+Ce^{-${a}x}$?`, y0 - b / a, t`$y(0)=${b / a}+C=${y0}\Rightarrow C=${y0 - b / a}$.`);
            }),
            num(t`Para $y'=2-y$, qual o valor de $\lim_{x\to\infty}y(x)$ para qualquer condição inicial?`, 2, t`$y=2+Ce^{-x}\to2$.`),
            inter(t`No campo de $y'=2-y$, arraste $P$ para a única condição em $x=0$ cuja solução é **constante**.`, 'plot', slopeFieldLab((_x, y) => 2 - y, { view: { xMin: -1, xMax: 5, yMin: -1, yMax: 5 }, P: [0, 4] }).props, (v: any) => v && near(v.pts.P.y, 2, 0.08), t`$y(0)=2$: o equilíbrio.`, t`A solução constante é o equilíbrio $2-y=0\Rightarrow y=2$; em $x=0$, isso exige $y(0)=2$.`),
            mcqS(t`Solução de $y'+\frac1xy=x$ ($x>0$):`, t`$y=\frac{x^2}{3}+\frac Cx$`, [t`$y=\frac{x^2}{2}+Cx$`, t`$y=x^2+\frac Cx$`, t`$y=\frac{x^3}{3}+C$`, t`$y=\frac{x}{3}+Ce^{-x}$`], t`$\mu=x$: $(xy)'=x^2\Rightarrow xy=\frac{x^3}{3}+C$.`),
            num(t`Resolva $y'-y=e^{2x}$, $y(0)=2$. Quanto vale $C$ em $y=e^{2x}+Ce^{x}$?`, 1, t`$\mu=e^{-x}$: $(e^{-x}y)'=e^{x}\Rightarrow y=e^{2x}+Ce^x$; $y(0)=1+C=2$.`),
            tf(t`Em $y'+ay=b$ com $a<0$, as soluções convergem para o equilíbrio $b/a$.`, false, t`Com $a<0$, $e^{-ax}$ **cresce**: as soluções se afastam do equilíbrio (instável).`),
            gen((rng) => {
              const a = randInt(rng, 1, 3);
              const b = randInt(rng, 2, 8);
              const y0 = 0;
              const x1 = 1;
              const ans = (b / a) * (1 - Math.exp(-a * x1));
              return num(t`Resolva $y'+${a}y=${b}$, $y(0)=${y0}$ e calcule $y(1)$ (3 casas).`, ans, t`$y=\frac{${b}}{${a}}(1-e^{-${a}x})$; $y(1)\approx${fmt(ans, 3)}$.`, { tol: 0.002 });
            }),
          ],
        },
        {
          card: {
            title: 'Circuitos e tanques',
            body: t`**Circuito RC** com fonte $E$: $R\,q'+\frac{q}{C}=E$ é linear. Com $q(0)=0$:

$$V_C(t)=E\left(1-e^{-t/RC}\right),\qquad \tau=RC$$

A **constante de tempo** $\tau$ mede a rapidez: em $t=\tau$ chega a $63\%$; em $5\tau$, praticamente $100\%$.

**Tanque de mistura**: entra salmoura a uma taxa, sai mistura a outra: $Q'=(\text{entra})-(\text{sai})=r\,c_{in}-\frac{r}{V}Q$.`,
            visual: rcLab(),
          },
          exercises: [
            gen((rng) => {
              const R = pick(rng, [1, 2, 5, 10]);
              const Cc = pick(rng, [0.1, 0.2, 0.5, 1]);
              return num(t`Qual a constante de tempo de um circuito RC com $R=${R}\,\text{k}\Omega$ e $C=${fmt(Cc)}\,\text{mF}$ (em segundos)?`, R * Cc, t`$\tau=RC=${R}\cdot10^{3}\cdot${fmt(Cc)}\cdot10^{-3}=${fmt(R * Cc)}$ s.`, { tol: 0.001 });
            }),
            mcq(t`Em $t=\tau$, o capacitor de um RC (partindo descarregado) tem que fração da tensão da fonte?`, ['≈ 63%', '50%', '≈ 37%', '100%'], 0, t`$1-e^{-1}\approx0{,}632$.`),
            inter(t`Ajuste o circuito para $\tau=RC=4$ com fonte $E=6$.`, 'plot', rcLab().props, (v: any) => v && near(v.p.R * v.p.Cc, 4, 0.06) && near(v.p.E, 6, 0.01), t`Por exemplo $R=4$, $C=1$ e $E=6$.`, t`A constante de tempo do circuito RC é $\tau=RC$: por exemplo $R=4$ e $C=1$ dão $\tau=4$.`),
            tf(t`Dobrar a resistência de um circuito RC faz o capacitor carregar mais devagar.`, true, t`$\tau=RC$ dobra.`),
            gen((rng) => {
              const E = pick(rng, [5, 10, 12]);
              const n = pick(rng, [1, 2, 3]);
              const V = E * (1 - Math.exp(-n));
              return num(t`Um capacitor carrega por uma fonte de $${E}$ V. Qual sua tensão após $${n}\tau$? (2 casas)`, V, t`$V=${E}(1-e^{-${n}})\approx${fmt(V, 2)}$ V.`, { tol: 0.02 });
            }),
            mcqS(t`Um tanque de $100$ L recebe $2$ L/min de salmoura com $3$ g/L e perde $2$ L/min da mistura. A EDO da massa de sal $Q$ é:`, t`$Q'=6-\frac{Q}{50}$`, [t`$Q'=6-2Q$`, t`$Q'=3-\frac{Q}{100}$`, t`$Q'=2-\frac{Q}{50}$`, t`$Q'=6+\frac{Q}{50}$`], t`Entra $2\cdot3=6$ g/min; sai $2\cdot\frac{Q}{100}=\frac{Q}{50}$ g/min.`),
            num(t`No tanque com $Q'=6-\frac{Q}{50}$, qual a massa de sal de equilíbrio (g)?`, 300, t`$Q'=0\Rightarrow Q=300$ g (concentração $3$ g/L, igual à de entrada).`),
            num(t`Ainda com $Q'=6-\frac{Q}{50}$ e $Q(0)=0$, quanto sal há após $50$ min? (inteiro mais próximo)`, Math.round(300 * (1 - Math.exp(-1))), t`$Q=300(1-e^{-t/50})$; em $t=50$: $300(1-e^{-1})\approx190$ g.`, { tol: 0.6 }),
          ],
        },
      ],
    },
  ],
};
