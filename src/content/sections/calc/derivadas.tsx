import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { FnCurve, InfLine, Label, Pt, RectW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, polyTex, term } from '../../../lib/random';
import { derivativeSignLab, fnLab, tangentLab } from '../../visuals';

const t = String.raw;

/** derivative of polynomial coefficients */
const dpoly = (c: number[]) => c.slice(1).map((v, i) => v * (i + 1));

const lin = (a: number, b: number) => polyTex([b, a]);

const cornerLab = () =>
  plot({
    view: { xMin: -3, xMax: 3, yMin: -0.5, yMax: 3.2 },
    params: [{ key: 'x0', label: 'x_0', min: -2.5, max: 2.5, step: 0.1, value: -1.2, color: C.gold }],
    render: ({ p }: any) => {
      const x0 = p.x0;
      const y0 = Math.abs(x0);
      const m = x0 < -1e-6 ? -1 : x0 > 1e-6 ? 1 : NaN;
      return (
        <>
          <FnCurve f={(x) => Math.abs(x)} color={C.p1} />
          {!Number.isNaN(m) ? <InfLine x1={x0} y1={y0} x2={x0 + 1} y2={y0 + m} color={C.gold} dash="6 4" width={2} /> : null}
          <Pt x={x0} y={y0} color={C.gold} />
        </>
      );
    },
    info: ({ p }: any) =>
      Math.abs(p.x0) < 1e-6
        ? t`Em $x_0=0$ há um **bico**: inclinação $-1$ à esquerda e $+1$ à direita ⟹ $f'(0)$ **não existe**!`
        : t`$f(x)=|x|$ em $x_0=${fmt(p.x0, 1)}$: inclinação $f'(x_0)=${p.x0 > 0 ? '1' : '-1'}$`,
  });

const powerRuleLab = () =>
  fnLab({
    f: (x, p) => Math.pow(x, p.n),
    params: [
      { key: 'n', label: 'n', min: 1, max: 4, step: 1, value: 2, color: C.p1, format: (v) => String(v) },
      { key: 'x0', label: 'x_0', min: -2, max: 2, step: 0.2, value: 1, color: C.gold },
    ],
    view: { xMin: -2.5, xMax: 2.5, yMin: -4, yMax: 5 },
    extra: (p) => {
      const y0 = Math.pow(p.x0, p.n);
      const m = p.n * Math.pow(p.x0, p.n - 1);
      return (
        <>
          <FnCurve f={(x) => p.n * Math.pow(x, p.n - 1)} color={C.p2} width={2} dash="6 4" />
          <InfLine x1={p.x0} y1={y0} x2={p.x0 + 1} y2={y0 + m} color={C.gold} width={2} />
          <Pt x={p.x0} y={y0} color={C.gold} />
          <Pt x={p.x0} y={m} color={C.p2} r={5} />
        </>
      );
    },
    info: (p) => t`$f(x)=x^{${p.n}}$ · derivada (tracejada): $f'(x)=${p.n}x^{${p.n - 1}}$ · em $x_0=${fmt(p.x0, 1)}$: $f'(${fmt(p.x0, 1)})=${fmt(p.n * Math.pow(p.x0, p.n - 1), 2)}$`,
  });

const prodAreaLab = () =>
  plot(
    {
      view: { xMin: -0.5, xMax: 6.5, yMin: -0.5, yMax: 5.5 },
      equalAspect: true,
      params: [{ key: 'dx', label: '\\Delta x', min: 0.1, max: 1.2, step: 0.1, value: 0.6, color: C.gold }],
      render: ({ p }: any) => {
        const u = 3.5;
        const v = 2.5;
        const du = p.dx * 1.5;
        const dv = p.dx * 1.2;
        return (
          <>
            <RectW x={0} y={0} w={u} h={v} color={C.p1} opacity={0.28} />
            <RectW x={u} y={0} w={du} h={v} color={C.p2} opacity={0.45} />
            <RectW x={0} y={v} w={u} h={dv} color={C.p3} opacity={0.45} />
            <RectW x={u} y={v} w={du} h={dv} color={C.danger} opacity={0.5} />
            <Label x={u / 2} y={v / 2} text="f · g" anchor="middle" color={C.text} />
            <Label x={u + du / 2} y={v / 2} text="Δf·g" anchor="middle" color={C.p2} size={11} />
            <Label x={u / 2} y={v + dv / 2} text="f·Δg" anchor="middle" color={C.p3} size={11} />
          </>
        );
      },
      info: ({ p }: any) => t`$\Delta(fg) = \Delta f\cdot g + f\cdot\Delta g + \Delta f\,\Delta g$ · canto vermelho $\Delta f\,\Delta g\propto (\Delta x)^2\to0$ quando $\Delta x=${fmt(p.dx, 1)}\to0$`,
    },
    260,
  );

const chainWaveLab = () =>
  fnLab({
    f: (x, p) => Math.sin(p.k * x),
    params: [{ key: 'k', label: 'k', min: 0.5, max: 3, step: 0.5, value: 2, color: C.p1 }],
    view: { xMin: -3.2, xMax: 3.2, yMin: -3.4, yMax: 3.4 },
    extra: (p) => (
      <>
        <FnCurve f={(x) => p.k * Math.cos(p.k * x)} color={C.p2} width={2} dash="6 4" />
        <Pt x={0} y={p.k} color={C.p2} r={5} label="f'(0)=k" />
      </>
    ),
    info: (p) => t`$f(x)=\operatorname{sen}(${fmt(p.k)}x)$ · derivada tracejada: $f'(x)=${fmt(p.k)}\cos(${fmt(p.k)}x)$ · inclinação na origem $= ${fmt(p.k)}$`,
  });

const sinCosLab = () =>
  fnLab({
    f: (x) => Math.sin(x),
    params: [{ key: 'x0', label: 'x_0', min: -3, max: 3, step: 0.05, value: 0.5, color: C.gold }],
    view: { xMin: -3.5, xMax: 3.5, yMin: -1.6, yMax: 1.6 },
    extra: (p) => (
      <>
        <FnCurve f={(x) => Math.cos(x)} color={C.p2} width={2} dash="6 4" />
        <InfLine x1={p.x0} y1={Math.sin(p.x0)} x2={p.x0 + 1} y2={Math.sin(p.x0) + Math.cos(p.x0)} color={C.gold} width={2} />
        <Pt x={p.x0} y={Math.sin(p.x0)} color={C.gold} />
        <Pt x={p.x0} y={Math.cos(p.x0)} color={C.p2} r={5} />
      </>
    ),
    info: (p) => t`Inclinação da tangente ao seno em $x_0=${fmt(p.x0, 2)}$: $${fmt(Math.cos(p.x0), 3)}$ = altura do cosseno (azul tracejado)`,
  });

const concavityLab = () =>
  plot({
    view: { xMin: -2.5, xMax: 2.5, yMin: -2.6, yMax: 2.6 },
    params: [{ key: 'x0', label: 'x_0', min: -2, max: 2, step: 0.1, value: -1, color: C.gold }],
    render: ({ p }: any) => {
      const f = (x: number) => (x ** 3) / 3 - x;
      const df = (x: number) => x * x - 1;
      const x0 = p.x0;
      const y0 = f(x0);
      const m = df(x0);
      return (
        <>
          <FnCurve f={(x) => (x <= 0 ? f(x) : NaN)} to={0} color={C.danger} width={3.5} />
          <FnCurve f={(x) => (x >= 0 ? f(x) : NaN)} from={0} color={C.success} width={3.5} />
          <InfLine x1={x0} y1={y0} x2={x0 + 1} y2={y0 + m} color={C.gold} dash="5 4" width={2} />
          <Pt x={0} y={0} color={C.p2} r={5} label="inflexão" />
          <Pt x={x0} y={y0} color={C.gold} />
        </>
      );
    },
    info: ({ p }: any) => {
      const s2 = 2 * p.x0;
      const conc = Math.abs(s2) < 1e-6 ? '**ponto de inflexão** ($f\'\'=0$)' : s2 > 0 ? 'côncava para **cima** ∪ ($f\'\'>0$)' : 'côncava para **baixo** ∩ ($f\'\'<0$)';
      return t`Em $x_0=${fmt(p.x0, 1)}$: $f''(${fmt(p.x0, 1)})=${fmt(s2, 1)}$ ⟹ ${conc}`;
    },
  });

const boxLab = () =>
  plot({
    view: { xMin: 0, xMax: 6.2, yMin: 0, yMax: 140 },
    params: [{ key: 'c', label: 'c', min: 0.1, max: 5.9, step: 0.1, value: 1, color: C.p5 }],
    render: ({ p }: any) => {
      const V = (c: number) => c * (12 - 2 * c) ** 2;
      return (
        <>
          <FnCurve f={V} from={0} to={6} color={C.p2} />
          <Seg x1={2} y1={0} x2={2} y2={128} color={C.gold} dash="5 4" width={1.5} />
          <Pt x={p.c} y={V(p.c)} color={C.gold} />
        </>
      );
    },
    info: ({ p }: any) => t`Folha $12\times12$, corte $c=${fmt(p.c, 1)}$: $V=c(12-2c)^2=${fmt(p.c * (12 - 2 * p.c) ** 2, 1)}$`,
  });

const lhopZoomLab = () =>
  plot({
    view: { xMin: -2, xMax: 2, yMin: -2, yMax: 2 },
    params: [{ key: 'h', label: 'h', min: 0.1, max: 1.5, step: 0.1, value: 1, color: C.gold }],
    render: ({ p }: any) => {
      const h = p.h;
      return (
        <>
          <FnCurve f={(x) => Math.exp(2 * x) - 1} color={C.p2} width={2.5} />
          <FnCurve f={(x) => Math.sin(x)} color={C.p3} width={2.5} />
          <InfLine x1={0} y1={0} x2={1} y2={2} color={C.p2} dash="5 4" width={1.5} />
          <InfLine x1={0} y1={0} x2={1} y2={1} color={C.p3} dash="5 4" width={1.5} />
          <Pt x={h} y={Math.exp(2 * h) - 1} color={C.p2} r={5} />
          <Pt x={h} y={Math.sin(h)} color={C.p3} r={5} />
        </>
      );
    },
    info: ({ p }: any) => {
      const h = p.h;
      const ratio = (Math.exp(2 * h) - 1) / Math.sin(h);
      return t`Em $x=${fmt(h, 1)}$: $\frac{e^{2x}-1}{\operatorname{sen}x}=${fmt(ratio, 3)}$ · perto de $0$, razão das inclinações $=\frac{f'(0)}{g'(0)}=\frac{2}{1}=2$`;
    },
  });

export const derivadas: UnitDef = {
  id: 'c-der',
  title: 'Derivadas',
  subtitle: 'Taxa de variação, regras e regra da cadeia',
  icon: '📉',
  source: 'Cálculo I · Unidade 3 — Derivadas',
  guide: t`A derivada mede a **inclinação da reta tangente** ao gráfico e a **taxa de variação instantânea** de uma grandeza. Na prática, você vai derivar combinando as regras da potência, produto, quociente, cadeia e as derivadas das funções elementares.`,
  lessons: [
    {
      id: 'c-der-def',
      title: 'Definição e reta tangente',
      parts: [
        {
          card: {
            title: 'Da secante à tangente',
            body: t`A reta **secante** pelos pontos $(x_0,\,f(x_0))$ e $(x_0+h,\,f(x_0+h))$ mede a taxa média de variação no intervalo $[x_0,\,x_0+h]$:

$$\frac{\Delta y}{\Delta x}=\frac{f(x_0+h)-f(x_0)}{h}$$

Quando fazemos o passo $h\to0$, os dois pontos se fundem e a secante gira até virar a **reta tangente** (tracejada). O limite dessa inclinação é a **derivada** $f'(x_0)$:`,
            visual: tangentLab((x) => 0.5 * x * x, (x) => x, 1, { xMin: -1, xMax: 4, yMin: -1, yMax: 6 }),
            formula: t`f'(x)=\lim_{h\to0}\frac{f(x+h)-f(x)}{h}`,
            example: t`Para $f(x)=x^2$ em $x=3$: $\dfrac{(3+h)^2-3^2}{h}=\dfrac{6h+h^2}{h}=6+h\xrightarrow{h\to0}6$. Logo $f'(3)=6$.`,
          },
          exercises: [
            inter(
              t`Leve $h$ até perto de zero ($h<0{,}05$) e veja a secante coincidir com a tangente.`,
              'plot',
              tangentLab((x) => 0.5 * x * x, (x) => x, 1).props,
              (v: any) => v && v.p.h < 0.05,
              t`$h\to0$`,
              t`Quando $h\to0$, a inclinação da secante tende à inclinação da reta tangente $f'(x_0)$.`,
            ),
            tf(
              t`A derivada de uma função num ponto $x_0$ é a inclinação da reta tangente ao gráfico em $(x_0,\,f(x_0))$.`,
              true,
              t`Geometricamente, $f'(x_0)$ é exatamente o coeficiente angular da reta tangente naquele ponto.`,
            ),
            mcqS(
              t`A razão incremental $\dfrac{f(x_0+h)-f(x_0)}{h}$ (antes de tomar o limite $h\to0$) representa a inclinação da reta…`,
              t`secante por $(x_0,\,f(x_0))$ e $(x_0+h,\,f(x_0+h))$`,
              [t`tangente em $x_0$`, t`normal ao gráfico em $x_0$`, t`horizontal $y=f(x_0)$`, t`vertical $x=x_0$`],
              t`Enquanto $h\ne0$, a reta corta o gráfico em dois pontos distintos: é uma reta secante.`,
            ),
            num(
              t`Pela definição, a derivada de $f(x)=x^2$ em $x=3$ é:`,
              6,
              t`$\lim_{h\to0}\frac{(3+h)^2-9}{h}=\lim_{h\to0}\frac{6h+h^2}{h}=\lim_{h\to0}(6+h)=6$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 1, 5);
              const b = a + randInt(rng, 1, 4);
              const m = b + a;
              return num(
                t`Calcule a **taxa média de variação** de $f(x)=x^2$ no intervalo $[${a},\,${b}]$.`,
                m,
                t`$\frac{f(${b})-f(${a})}{${b}-${a}}=\frac{${b * b}-${a * a}}{${b - a}}=${m}$.`,
              );
            }),
            gen((rng) => {
              const a = randNZ(rng, -5, 6);
              return num(
                t`Simplificando $\lim_{h\to0}\dfrac{(${a}+h)^2-${a * a}}{h}$, qual valor obtemos para $f'(${a})$ em $f(x)=x^2$?`,
                2 * a,
                t`$\frac{(${a}+h)^2-${a * a}}{h}=\frac{${2 * a}h+h^2}{h}=${2 * a}+h\to ${2 * a}$.`,
              );
            }),
            mcqS(
              t`O limite $\lim_{h\to0}\dfrac{\operatorname{sen}(\pi+h)-\operatorname{sen}(\pi)}{h}$ representa:`,
              t`$f'(\pi)$ para $f(x)=\operatorname{sen}x$`,
              [t`$f'(0)$ para $f(x)=\operatorname{sen}x$`, t`$f(\pi)$ para $f(x)=\cos x$`, t`$f'(\pi)$ para $f(x)=\cos x$`, t`a taxa média em $[0,\,\pi]$`],
              t`Compare com $\lim_{h\to0}\frac{f(x_0+h)-f(x_0)}{h}$: aqui $f(x)=\operatorname{sen}x$ e $x_0=\pi$.`,
            ),
            gen((rng) => {
              const c = randInt(rng, 2, 7);
              const x0 = randInt(rng, 1, 5);
              return rmcq(
                rng,
                t`Ao montar a definição de $f'(${x0})$ para $f(x)=${c}x^2$, qual expressão fica dentro de $\lim_{h\to0}$?`,
                t`$\dfrac{${c}(${x0}+h)^2-${c * x0 * x0}}{h}$`,
                [
                  t`$\dfrac{${c}x^2-${c * x0 * x0}}{h}$`,
                  t`$\dfrac{(${c * x0}+h)^2-${c * x0 * x0}}{h}$`,
                  t`$\dfrac{${c}(${x0}+h)^2+${c * x0 * x0}}{h}$`,
                  t`$\dfrac{${c}(${x0}+h)-${c * x0}}{h}$`,
                ],
                t`$f(${x0}+h)=${c}(${x0}+h)^2$ e $f(${x0})=${c}\cdot${x0}^2=${c * x0 * x0}$.`,
              );
            }),
          ],
        },
        {
          card: {
            title: 'Equação da reta tangente',
            body: t`Conhecendo o ponto $(x_0,\,f(x_0))$ e a inclinação $m=f'(x_0)$, a equação da **reta tangente** é:

$$y-f(x_0)=f'(x_0)\,(x-x_0)$$

Perto de $x_0$, a reta tangente é a melhor **aproximação linear** da curva: $f(x_0+\Delta x)\approx f(x_0)+f'(x_0)\,\Delta x$.`,
            example: t`$f(x)=x^2$ em $x_0=3$: $f(3)=9$ e $f'(3)=6$. Tangente: $y-9=6(x-3)\Rightarrow y=6x-9$.`,
            tip: t`A **reta normal** é perpendicular à tangente no ponto de tangência: se $f'(x_0)\ne0$, sua inclinação é $-\dfrac{1}{f'(x_0)}$.`,
          },
          exercises: [
            fill(
              t`Complete a equação da reta tangente a $f$ em $x_0=2$, sabendo que $f(2)=5$ e $f'(2)=3$:`,
              t`$y -$ ___ $=$ ___ $\cdot(x-2)$`,
              ['$5$', '$3$'],
              ['$2$', '$6$', '$-5$'],
              t`Fórmula ponto-inclinação: $y-f(2)=f'(2)(x-2)\Rightarrow y-5=3(x-2)$.`,
            ),
            gen((rng) => {
              const a = randNZ(rng, -3, 4);
              const b0 = -a * a;
              return rmcq(
                rng,
                t`Sabendo que $(x^2)'=2x$, qual é a equação da reta tangente a $y=x^2$ em $x=${a}$?`,
                t`$y=${lin(2 * a, b0)}$`,
                [
                  t`$y=${2 * a}x$`,
                  t`$y=${lin(a, b0)}$`,
                  t`$y=${lin(2 * a, a * a)}$`,
                  t`$y=${lin(-2 * a, b0)}$`,
                ],
                t`$f'(${a})=${2 * a}$ e ponto $(${a},\,${a * a})$: $y-${a * a}=${2 * a}(x-${a})\Rightarrow y=${lin(2 * a, b0)}$.`,
              );
            }),
            gen((rng) => {
              const x0 = randInt(rng, 1, 5);
              const y0 = randInt(rng, -4, 6);
              const m = randNZ(rng, -4, 5);
              const x1 = x0 + pick(rng, [1, 2, -1]);
              return num(
                t`A reta tangente ao gráfico de $f$ em $x=${x0}$ passa por $(${x0},\,${y0})$ e tem inclinação $f'(${x0})=${m}$. Qual o valor de $y$ nessa reta para $x=${x1}$?`,
                y0 + m * (x1 - x0),
                t`$y=${y0}${term(m, `(x-${x0})`)} \Rightarrow y(${x1})=${y0}+(${m})\cdot(${x1 - x0})=${y0 + m * (x1 - x0)}$.`,
              );
            }),
            gen((rng) => {
              const m = randNZ(rng, -5, 6);
              const b = randInt(rng, -8, 8);
              const x0 = randInt(rng, -3, 3);
              return num(
                t`A reta $y=${lin(m, b)}$ é tangente ao gráfico de $g$ em $x=${x0}$. Quanto vale $g'(${x0})$?`,
                m,
                t`$g'(${x0})$ é o próprio coeficiente angular da reta tangente: $${m}$.`,
              );
            }),
            gen((rng) => {
              const m = randNZ(rng, -4, 4);
              const b = randInt(rng, -5, 5);
              const x0 = randInt(rng, 1, 4);
              return num(
                t`Se $y=${lin(m, b)}$ é a reta tangente a $g$ no ponto de abscissa $x=${x0}$, quanto vale $g(${x0})$?`,
                m * x0 + b,
                t`No ponto de tangência, curva e reta têm o mesmo $y$: $g(${x0})=${m}\cdot${x0}${term(b, '')}=${m * x0 + b}$.`,
              );
            }),
            mcqS(
              t`Se a reta tangente ao gráfico de $f$ em $x=1$ tem inclinação $f'(1)=4$, qual é a inclinação da **reta normal** nesse ponto?`,
              t`$-\frac{1}{4}$`,
              [t`$\frac{1}{4}$`, t`$-4$`, t`$4$`, t`$0$`],
              t`Retas perpendiculares têm inclinações com produto $-1$: $m_n=-\frac{1}{f'(1)}=-\frac14$.`,
            ),
            num(
              t`Se $f(2)=10$ e $f'(2)=3$, use a aproximação linear $f(2+h)\approx f(2)+f'(2)h$ para estimar $f(2{,}1)$.`,
              10.3,
              t`$f(2{,}1)\approx 10+3\cdot 0{,}1=10{,}3$.`,
              { tol: 0.01 },
            ),
            mcqS(
              t`O que significa geometricamente ter $f'(x_0)=0$?`,
              t`A reta tangente em $x_0$ é horizontal`,
              [t`A reta tangente em $x_0$ é vertical`, t`O gráfico corta o eixo $x$ em $x_0$`, t`A função não existe em $x_0$`, t`A função é constante em todo $\mathbb R$`],
              t`Inclinação zero corresponde a uma reta horizontal $y=f(x_0)$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Notações, física e cantos vivos',
            body: t`A derivada aparece com várias roupas na engenharia:
• **Lagrange**: $f'(x)$ ou $y'$
• **Leibniz**: $\dfrac{dy}{dx}$ ou $\dfrac{df}{dx}$ (destaca quem varia em relação a quem)
• **Newton**: $\dot s(t)$ (derivada no tempo: velocidade $v=\dot s=s'(t)$)

**Quando a derivada falha?** Toda função derivável em $x_0$ é **contínua** em $x_0$, mas a recíproca é falsa! Se o gráfico tiver um **bico** (como $f(x)=|x|$ em $x=0$), um salto ou tangente vertical, $f'(x_0)$ não existe:`,
            visual: cornerLab(),
            tip: t`Derivável $\implies$ contínua. Descontínua $\implies$ não derivável. Mas contínua com "quina" (bico) **não** é derivável na quina!`,
          },
          exercises: [
            mcqS(
              t`Se a posição de um móvel no instante $t$ (em segundos) é $s(t)$ (em metros), a derivada $s'(t)=\dfrac{ds}{dt}$ representa…`,
              'a velocidade instantânea (m/s)',
              ['a aceleração (m/s²)', 'a distância total percorrida', 'o deslocamento médio desde $t=0$', 'o tempo gasto'],
              t`A taxa de variação instantânea da posição em relação ao tempo é a velocidade instantânea.`,
            ),
            match(
              t`Ligue cada grandeza à interpretação de sua derivada:`,
              [
                [t`$\dfrac{ds}{dt}$ (posição no tempo)`, 'Velocidade instantânea'],
                [t`$\dfrac{dv}{dt}$ (velocidade no tempo)`, 'Aceleração instantânea'],
                [t`$\dfrac{dq}{dt}$ (carga elétrica no tempo)`, 'Corrente elétrica'],
                [t`$\dfrac{dC}{dx}$ (custo por produção)`, 'Custo marginal'],
              ],
              t`Derivada é sempre a taxa instantânea de variação de uma grandeza em relação a outra.`,
            ),
            inter(
              t`Mova $x_0$ até o ponto onde $f(x)=|x|$ **não é derivável**.`,
              'plot',
              cornerLab().props,
              (v: any) => v && near(v.p.x0, 0, 0.05),
              t`$x_0=0$`,
              t`Em $x_0=0$ as inclinações laterais são $-1$ e $+1$: o limite não existe.`,
            ),
            tf(
              t`Toda função contínua em $x=a$ é derivável em $x=a$.`,
              false,
              t`Falso! $f(x)=|x|$ é contínua em $x=0$, mas tem um bico lá e $f'(0)$ não existe.`,
            ),
            tf(
              t`Se $f$ é derivável em $x=a$, então $f$ é obrigatoriamente contínua em $x=a$.`,
              true,
              t`Para que $\lim_{h\to0}\frac{f(a+h)-f(a)}{h}$ seja finito, o numerador $f(a+h)-f(a)$ precisa tender a $0$, logo $\lim_{x\to a}f(x)=f(a)$.`,
            ),
            mcqS(
              t`Quanto valem as derivadas laterais de $f(x)=|x|$ em $x=0$?`,
              t`$-1$ pela esquerda e $+1$ pela direita`,
              [t`$0$ dos dois lados`, t`$+1$ pela esquerda e $-1$ pela direita`, t`$\infty$ dos dois lados`, t`$-1$ dos dois lados`],
              t`Para $x<0$, $|x|=-x$ (inclinação $-1$); para $x>0$, $|x|=x$ (inclinação $+1$).`,
            ),
            multi(
              t`Em quais situações uma função $f$ **não** é derivável em $x=a$?`,
              ['Gráfico com um "bico" (quina) em $x=a$', 'Descontinuidade de salto em $x=a$', 'Reta tangente vertical em $x=a$', 'Reta tangente horizontal em $x=a$'],
              [0, 1, 2],
              t`Tangente horizontal é perfeitamente derivável ($f'(a)=0$). Bico, salto e tangente vertical ($\pm\infty$) impedem a existência de $f'(a)$ finito.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const b = randNZ(rng, -6, 6);
              const t0 = randInt(rng, 1, 4);
              return num(
                t`A posição de uma partícula é $s(t)=${a}t^2${term(b, 't')}$ (m), cuja derivada é $v(t)=${2 * a}t${term(b, '')}$. Qual a velocidade em $t=${t0}$ s?`,
                2 * a * t0 + b,
                t`$v(${t0})=${2 * a}\cdot${t0}${term(b, '')}=${2 * a * t0 + b}$ m/s.`,
                { unit: 'm/s' },
              );
            }),
          ],
        },
      ],
    },
    {
      id: 'c-der-regras',
      title: 'Regras básicas',
      parts: [
        {
          card: {
            title: 'Constante e regra do tombo',
            body: t`Derivar pela definição toda vez seria lento demais. Duas regras resolvem qualquer potência:

• **Constante**: $\dfrac{d}{dx}(c)=0$ (reta horizontal tem inclinação zero)
• **Regra do tombo** (potência): o expoente "tomba" multiplicando e perde $1$ unidade:

$$\frac{d}{dx}\left(x^n\right)=n\,x^{n-1}$$

Em especial, $(x)'=1x^0=1$. Veja no gráfico $f(x)=x^n$ e sua derivada tracejada:`,
            visual: powerRuleLab(),
            example: t`$(x^5)'=5x^4$, $(x^2)'=2x$, $(x)'=1$ e $(7)'=0$.`,
          },
          exercises: [
            fill(
              t`Complete:`,
              t`$\frac{d}{dx}\left(x^5\right) =$ ___ e $\frac{d}{dx}(7)=$ ___`,
              ['$5x^4$', '$0$'],
              ['$x^4$', '$7$', '$5x^5$'],
              t`Pela regra do tombo, $(x^5)'=5x^4$. Constantes têm derivada zero.`,
            ),
            inter(
              t`Escolha o expoente $n=3$ e posicione $x_0=1$ para ver que a derivada de $x^3$ em $x=1$ vale $3$.`,
              'plot',
              powerRuleLab().props,
              (v: any) => v && near(v.p.n, 3, 0.1) && near(v.p.x0, 1, 0.05),
              t`$n=3$ e $x_0=1$`,
              t`Para $f(x)=x^3$, $f'(x)=3x^2$, logo $f'(1)=3$.`,
            ),
            tf(
              t`A derivada de $\pi^3$ em relação a $x$ é $3\pi^2$.`,
              false,
              t`Pegadinha clássica! $\pi^3$ não tem $x$: é um número **constante**, portanto sua derivada é $0$.`,
            ),
            gen((rng) => {
              const n = randInt(rng, 3, 9);
              return rmcq(
                rng,
                t`Qual é a derivada de $f(x)=x^{${n}}$?`,
                t`$${n}x^{${n - 1}}$`,
                [t`$${n}x^{${n}}$`, t`$x^{${n - 1}}$`, t`$${n - 1}x^{${n}}$`, t`$${n}x^{${n + 1}}$`],
                t`O expoente $${n}$ tomba multiplicando e diminui $1$: $${n}x^{${n - 1}}$.`,
              );
            }),
            gen((rng) => {
              const n = randInt(rng, 2, 5);
              const x0 = randNZ(rng, -3, 3);
              const ans = n * Math.pow(x0, n - 1);
              return num(
                t`Se $f(x)=x^{${n}}$, quanto vale $f'(${x0})$?`,
                ans,
                t`$f'(x)=${n}x^{${n - 1}}\Rightarrow f'(${x0})=${n}\cdot(${x0})^{${n - 1}}=${ans}$.`,
              );
            }),
            mcqS(
              t`Qual é a derivada da função identidade $f(x)=x$?`,
              '$1$',
              ['$0$', '$x$', '$2x$', 'não existe'],
              t`A reta $y=x$ tem inclinação $1$ em todos os pontos: $(x^1)'=1\cdot x^0=1$.`,
            ),
            gen((rng) => {
              const n = randInt(rng, 2, 6);
              const a = randNZ(rng, -4, 5);
              const x = randInt(rng, -2, 2);
              const ans = a * n * Math.pow(x, n - 1);
              return num(
                t`Se $f(x)=${a}x^{${n}}$, quanto vale $f'(${x})$?`,
                ans,
                t`$f'(x)=${a * n}x^{${n - 1}}$ ⟹ $f'(${x})=${ans}$.`,
              );
            }),
            num(
              t`Para qual valor positivo de $x$ a função $f(x)=x^3$ tem reta tangente de inclinação $12$?`,
              2,
              t`$f'(x)=3x^2=12\Rightarrow x^2=4\Rightarrow x=2$ (positivo).`,
            ),
          ],
        },
        {
          card: {
            title: 'Linearidade e polinômios',
            body: t`A derivada respeita constantes multiplicativas e somas/subtrações (**linearidade**):

$$(c\,f)'=c\,f'\qquad (f\pm g)'=f'\pm g'$$

Com isso, derivamos qualquer **polinômio** termo a termo!`,
            example: t`$(4x^3-5x^2+7x-2)'=4(3x^2)-5(2x)+7(1)-0=12x^2-10x+7$.`,
            tip: t`Cada vez que derivamos um polinômio de grau $n\ge1$, o grau cai em $1$ unidade.`,
          },
          exercises: [
            gen((rng) => {
              const c = [randInt(rng, -5, 5), randInt(rng, -6, 6), randInt(rng, -4, 4), randNZ(rng, -3, 3)];
              const d = dpoly(c);
              return rmcq(
                rng,
                t`Derive $f(x)=${polyTex(c)}$.`,
                `$${polyTex(d)}$`,
                [
                  `$${polyTex([d[0] + 1, d[1], d[2]])}$`,
                  `$${polyTex([c[1], c[2], c[3]])}$`,
                  `$${polyTex([d[0], (d[1] || 1) + 2, d[2]])}$`,
                  `$${polyTex([d[0], d[1], -d[2]])}$`,
                ],
                t`Termo a termo com a regra do tombo: $f'(x)=${polyTex(d)}$.`,
              );
            }),
            gen((rng) => {
              const c = [randInt(rng, -6, 6), randNZ(rng, -5, 5), randNZ(rng, -4, 4)];
              const d = dpoly(c);
              const x0 = randInt(rng, -3, 3);
              const ans = d[0] + d[1] * x0;
              return num(
                t`Sendo $f(x)=${polyTex(c)}$, calcule $f'(${x0})$.`,
                ans,
                t`$f'(x)=${polyTex(d)}\Rightarrow f'(${x0})=${d[1]}\cdot(${x0})${term(d[0], '')}=${ans}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, -4, 4);
              const b = randInt(rng, -5, 5);
              return num(
                t`Em que valor de $x$ a parábola $y=${polyTex([b, -2 * a, 1])}$ tem reta tangente **horizontal**?`,
                a,
                t`Tangente horizontal $\iff y'=0$: $2x${term(-2 * a, '')}=0\Rightarrow x=${a}$ (o vértice da parábola!).`,
              );
            }),
            gen((rng) => {
              const A = randInt(rng, -4, 5);
              const B = randInt(rng, -4, 5);
              const p = randInt(rng, 2, 4);
              const q = randInt(rng, 1, 3);
              return num(
                t`Se $f'(1)=${A}$ e $g'(1)=${B}$, quanto vale $h'(1)$ para $h(x)=${p}f(x)-${q === 1 ? '' : q}g(x)$?`,
                p * A - q * B,
                t`Pela linearidade, $h'(1)=${p}f'(1)-${q}g'(1)=${p}\cdot(${A})-${q}\cdot(${B})=${p * A - q * B}$.`,
              );
            }),
            mcqS(
              t`Se $P(x)$ é um polinômio de grau $4$, qual é o grau de sua derivada $P'(x)$?`,
              'Grau $3$',
              ['Grau $4$', 'Grau $5$', 'Grau $2$', 'Grau $0$'],
              t`O termo líder $a_4x^4$ vira $4a_4x^3$, diminuindo o grau em $1$.`,
            ),
            tf(
              t`Duas funções que diferem por uma constante, como $f(x)=x^2+5$ e $g(x)=x^2-3$, têm exatamente a mesma derivada.`,
              true,
              t`Somar uma constante só desloca o gráfico verticalmente, sem mudar a inclinação em nenhum ponto!`,
            ),
            mcqS(
              t`Para encontrar a derivada de $f(x)=(x+2)^2$ usando apenas a regra do polinômio, podemos expandir $f(x)=x^2+4x+4$ e obter:`,
              t`$f'(x)=2x+4$`,
              [t`$f'(x)=2x+2$`, t`$f'(x)=2x$`, t`$f'(x)=x+2$`, t`$f'(x)=2x+8$`],
              t`Derivando termo a termo: $(x^2)'+(4x)'+(4)'=2x+4$.`,
            ),
            num(
              t`A posição de um objeto é $s(t)=t^3-6t^2+9t$ (m). Em qual instante $t>0$ (além de $t=1$) a velocidade $v(t)=s'(t)$ se anula?`,
              3,
              t`$v(t)=3t^2-12t+9=3(t-1)(t-3)=0\Rightarrow t=1$ ou $t=3$.`,
              { unit: 's' },
            ),
          ],
        },
        {
          card: {
            title: 'Potências negativas e raízes',
            body: t`A regra do tombo $(x^n)'=nx^{n-1}$ vale para **qualquer** expoente real $n$! O segredo é reescrever frações e raízes como potência antes de derivar:

• **No denominador**: $\dfrac{1}{x^k}=x^{-k}\implies \left(x^{-k}\right)'=-k\,x^{-k-1}=-\dfrac{k}{x^{k+1}}$
• **Raízes**: $\sqrt[n]{x^m}=x^{m/n}$. Em especial, memorizar a raiz quadrada economiza muito tempo:`,
            formula: t`\left(\frac{1}{x}\right)'=-\frac{1}{x^2}\qquad \left(\sqrt{x}\right)'=\frac{1}{2\sqrt{x}}`,
            example: t`$\left(\dfrac{3}{x^2}\right)'=(3x^{-2})'=-6x^{-3}=-\dfrac{6}{x^3}$.`,
          },
          exercises: [
            mcqS(
              t`Derive $f(x)=\sqrt{x}$.`,
              t`$\frac{1}{2\sqrt x}$`,
              [t`$\frac{\sqrt x}{2}$`, t`$2\sqrt x$`, t`$\frac{1}{\sqrt x}$`, t`$-\frac{1}{2\sqrt x}$`],
              t`$\sqrt x=x^{1/2}\implies \frac12x^{-1/2}=\frac{1}{2\sqrt x}$.`,
            ),
            mcqS(
              t`Derive $f(x)=\dfrac{1}{x}$.`,
              t`$-\frac{1}{x^2}$`,
              [t`$\frac{1}{x^2}$`, t`$\ln x$`, t`$-x^2$`, t`$-\frac{2}{x^3}$`],
              t`$\frac1x=x^{-1}\implies -1\cdot x^{-2}=-\frac{1}{x^2}$.`,
            ),
            mcqS(
              t`Derive $f(x)=\dfrac{3}{x^2}$.`,
              t`$-\frac{6}{x^3}$`,
              [t`$\frac{6}{x}$`, t`$-\frac{3}{x^3}$`, t`$\frac{3}{2x}$`, t`$\frac{6}{x^3}$`],
              t`$3x^{-2}\to 3\cdot(-2)x^{-3}=-\frac{6}{x^3}$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              const k = randInt(rng, 2, 5);
              return rmcq(
                rng,
                t`Qual é a derivada de $f(x)=\dfrac{${a}}{x^{${k}}}$?`,
                t`$-\dfrac{${a * k}}{x^{${k + 1}}}$`,
                [
                  t`$\dfrac{${a * k}}{x^{${k + 1}}}$`,
                  t`$-\dfrac{${a * k}}{x^{${k - 1}}}$`,
                  t`$-\dfrac{${a}}{${k}x^{${k - 1}}}$`,
                  t`$\dfrac{${a}}{${k}x^{${k + 1}}}$`,
                ],
                t`$f(x)=${a}x^{-${k}}\implies f'(x)=-${a * k}x^{-${k + 1}}=-\frac{${a * k}}{x^{${k + 1}}}$.`,
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              const c = randInt(rng, 1, 4) * 2 * k;
              const x0 = k * k;
              return num(
                t`Se $f(x)=${c}\sqrt{x}$, quanto vale $f'(${x0})$?`,
                c / (2 * k),
                t`$f'(x)=\frac{${c}}{2\sqrt x}\Rightarrow f'(${x0})=\frac{${c}}{2\cdot${k}}=${c / (2 * k)}$.`,
              );
            }),
            mcqS(
              t`Reescrevendo $\sqrt[3]{x}$ como $x^{1/3}$, sua derivada é:`,
              t`$\frac{1}{3\sqrt[3]{x^2}}$`,
              [t`$\frac{1}{3\sqrt[3]{x}}$`, t`$3\sqrt[3]{x^2}$`, t`$\frac{1}{2\sqrt[3]{x}}$`, t`$-\frac{1}{3\sqrt[3]{x^2}}$`],
              t`$(x^{1/3})'=\frac13x^{-2/3}=\frac{1}{3\sqrt[3]{x^2}}$.`,
            ),
            match(
              t`Ligue cada função à sua derivada:`,
              [
                [t`$x^{-3}$`, t`$-3x^{-4}$`],
                [t`$4\sqrt{x}$`, t`$\dfrac{2}{\sqrt{x}}$`],
                [t`$x^{3/2}$`, t`$\dfrac{3}{2}\sqrt{x}$`],
                [t`$-\dfrac{1}{x}$`, t`$\dfrac{1}{x^2}$`],
              ],
              t`Use $(x^n)'=nx^{n-1}$ somando $-1$ ao expoente original.`,
            ),
            mcqS(
              t`Simplificando antes de derivar, a derivada de $f(x)=\dfrac{x^3+2x}{x}$ (para $x\ne0$) é:`,
              t`$2x$`,
              [t`$3x^2+2$`, t`$2x+2$`, t`$\frac{3x^2+2}{1}$`, t`$x^2+2$`],
              t`Dividindo termo a termo por $x$: $f(x)=x^2+2\implies f'(x)=2x$. Muito mais rápido que a regra do quociente!`,
            ),
          ],
        },
      ],
    },
    {
      id: 'c-der-prod',
      title: 'Produto e quociente',
      parts: [
        {
          card: {
            title: 'Regra do produto',
            body: t`Atenção: a derivada do produto **não** é o produto das derivadas! Pense num retângulo de lados $f(x)$ e $g(x)$: quando $x$ aumenta, a área cresce pelas duas faixas laterais $f'\,g$ e $f\,g'$:

$$(f\cdot g)'=f'\,g+f\,g'$$

"Derivada da primeira vezes a segunda, **mais** a primeira vezes a derivada da segunda."`,
            visual: prodAreaLab(),
            example: t`$(x^2\operatorname{sen}x)'=(x^2)'\operatorname{sen}x+x^2(\operatorname{sen}x)'=2x\operatorname{sen}x+x^2\cos x$.`,
          },
          exercises: [
            tf(
              t`Para quaisquer funções deriváveis $f$ e $g$, vale $(f\cdot g)'=f'\cdot g'$.`,
              false,
              t`Erro clássico! Se fosse verdade, $(x\cdot x)'$ daria $1\cdot 1=1$, mas $(x^2)'=2x$. O correto é $f'g+fg'$.`,
            ),
            inter(
              t`Reduza $\Delta x$ até $0{,}1$ no retângulo para ver o quadradinho do canto ($\Delta f\,\Delta g$) quase sumir em comparação às duas faixas laterais.`,
              'plot',
              prodAreaLab().props,
              (v: any) => v && v.p.dx <= 0.15,
              t`$\Delta x=0{,}1$`,
              t`Por isso na derivada sobram exatamente as duas parcelas $f'g + fg'$.`,
            ),
            mcqS(
              t`Derive $f(x)=x\,e^x$ (sabendo que $(e^x)'=e^x$).`,
              t`$e^x+xe^x$`,
              [t`$e^x$`, t`$xe^{x-1}$`, t`$xe^x$`, t`$2xe^x$`],
              t`$(x)'e^x+x(e^x)'=1\cdot e^x+x\cdot e^x=e^x+xe^x$.`,
            ),
            fill(
              t`Aplique a regra do produto em $(x^3\ln x)'$ (com $(\ln x)'=\frac1x$):`,
              t`$(x^3\ln x)' =$ ___ $\cdot\ln x + x^3\cdot$ ___`,
              [t`$3x^2$`, t`$\frac{1}{x}$`],
              [t`$x^3$`, t`$3x^3$`, t`$\ln x$`],
              t`Derivada de $x^3$ é $3x^2$; derivada de $\ln x$ é $\frac1x$ (simplificando o segundo termo, $3x^2\ln x+x^2$).`,
            ),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              const b = randInt(rng, 1, 4);
              const x = randInt(rng, -2, 2);
              const val = x * x + b + (x + a) * 2 * x;
              return num(
                t`Se $f(x)=(x+${a})(x^2+${b})$, calcule $f'(${x})$ pela regra do produto.`,
                val,
                t`$f'(x)=1\cdot(x^2+${b})+(x+${a})\cdot2x$ ⟹ $f'(${x})=${x * x + b}+${(x + a) * 2 * x}=${val}$.`,
              );
            }),
            gen((rng) => {
              const f0 = randInt(rng, 1, 5);
              const df0 = randNZ(rng, -4, 4);
              const g0 = randInt(rng, 1, 5);
              const dg0 = randNZ(rng, -4, 4);
              const ans = df0 * g0 + f0 * dg0;
              return num(
                t`Sabendo que $f(2)=${f0}$, $f'(2)=${df0}$, $g(2)=${g0}$ e $g'(2)=${dg0}$, quanto vale $(f\cdot g)'(2)$?`,
                ans,
                t`$(fg)'(2)=f'(2)g(2)+f(2)g'(2)=(${df0})\cdot${g0}+${f0}\cdot(${dg0})=${ans}$.`,
              );
            }),
            mcqS(
              t`Para três funções, a regra do produto se estende a $(fgh)' =$:`,
              t`$f'gh+fg'h+fgh'$`,
              [t`$f'g'h'$`, t`$f'gh+fgh'$`, t`$f'g'h+fg'h'$`, t`$3f'g'h'$`],
              t`Em cada parcela, derivamos uma das funções e mantemos as outras intactas.`,
            ),
            gen((rng) => {
              const n = randInt(rng, 2, 5);
              return rmcq(
                rng,
                t`Derive e coloque $e^x$ em evidência: $f(x)=x^{${n}}e^x$.`,
                t`$(x^{${n}}+${n}x^{${n - 1}})e^x$`,
                [
                  t`$${n}x^{${n - 1}}e^x$`,
                  t`$(x^{${n}}-${n}x^{${n - 1}})e^x$`,
                  t`$x^{${n}}e^x$`,
                  t`$(${n}x^{${n}}+x^{${n - 1}})e^x$`,
                ],
                t`$f'(x)=${n}x^{${n - 1}}e^x+x^{${n}}e^x=(x^{${n}}+${n}x^{${n - 1}})e^x$.`,
              );
            }),
          ],
        },
        {
          card: {
            title: 'Regra do quociente',
            body: t`Para derivar uma fração $\dfrac{f(x)}{g(x)}$, a ordem no numerador **importa** porque há um sinal de menos:

$$\left(\frac{f}{g}\right)'=\frac{f'\,g-f\,g'}{g^2}$$

Macete: *"derivada de cima vezes a de baixo, **menos** a de cima vezes a derivada de baixo, tudo sobre a de baixo ao quadrado"*.`,
            example: t`$\left(\dfrac{x}{x+1}\right)'=\dfrac{1\cdot(x+1)-x\cdot1}{(x+1)^2}=\dfrac{1}{(x+1)^2}$.`,
            tip: t`Não desenvolva o denominador $(g(x))^2$ a menos que seja necessário: deixá-lo fatorado facilita achar zeros e estudar o sinal!`,
          },
          exercises: [
            mcqS(
              t`Derive $f(x)=\dfrac{x}{x+1}$.`,
              t`$\frac{1}{(x+1)^2}$`,
              [t`$\frac{2x+1}{(x+1)^2}$`, t`$1$`, t`$\frac{-1}{(x+1)^2}$`, t`$\frac{1}{x+1}$`],
              t`$\frac{1\cdot(x+1)-x\cdot1}{(x+1)^2}=\frac{1}{(x+1)^2}$.`,
            ),
            order(
              t`Ordene o cálculo de $\left(\dfrac{x^2}{x-1}\right)'$:`,
              [
                t`Derivada de cima: $2x$; de baixo: $1$`,
                t`Montar $\frac{2x(x-1)-x^2\cdot1}{(x-1)^2}$`,
                t`Simplificar o numerador: $x^2-2x$`,
                t`Resultado: $\frac{x^2-2x}{(x-1)^2}$`,
              ],
              t`Siga sempre o roteiro: identificar $f'$ e $g'$, montar $\frac{f'g-fg'}{g^2}$ e simplificar o numerador.`,
            ),
            gen((rng) => {
              const a = randNZ(rng, -5, 6);
              return rmcq(
                rng,
                t`Qual é a derivada de $f(x)=\dfrac{x}{x${term(a, '')}}$?`,
                t`$\dfrac{${a}}{(x${term(a, '')})^2}$`,
                [
                  t`$\dfrac{${-a}}{(x${term(a, '')})^2}$`,
                  t`$\dfrac{2x${term(a, '')}}{(x${term(a, '')})^2}$`,
                  t`$\dfrac{1}{x${term(a, '')}}$`,
                  t`$1$`,
                ],
                t`$\frac{1\cdot(x${term(a, '')})-x\cdot 1}{(x${term(a, '')})^2}=\frac{${a}}{(x${term(a, '')})^2}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 5);
              const b = randInt(rng, 1, 4);
              // f(x) = (x + a) / (x - b) at x = b + 1 => denom = 1
              const x0 = b + 1;
              const ans = -b - a;
              return num(
                t`Calcule $f'(${x0})$ para $f(x)=\dfrac{x+${a}}{x-${b}}$.`,
                ans,
                t`$f'(x)=\frac{1\cdot(x-${b})-(x+${a})\cdot 1}{(x-${b})^2}=\frac{${-b - a}}{(x-${b})^2}$. Em $x=${x0}$, o denominador vale $1^2=1$, logo $f'(${x0})=${ans}$.`,
              );
            }),
            gen((rng) => {
              const f0 = randInt(rng, 1, 4);
              const df0 = randInt(rng, -3, 4);
              const g0 = pick(rng, [1, 2]);
              const dg0 = randInt(rng, -3, 3);
              const ans = (df0 * g0 - f0 * dg0) / (g0 * g0);
              return num(
                t`Se $f(1)=${f0}$, $f'(1)=${df0}$, $g(1)=${g0}$ e $g'(1)=${dg0}$, calcule $\left(\dfrac{f}{g}\right)'(1)$.`,
                ans,
                t`$\frac{f'(1)g(1)-f(1)g'(1)}{g(1)^2}=\frac{(${df0})\cdot${g0}-${f0}\cdot(${dg0})}{${g0 * g0}}=${fmt(ans)}$.`,
              );
            }),
            mcqS(
              t`Qual é a derivada de $f(x)=\dfrac{e^x}{x}$?`,
              t`$\frac{e^x(x-1)}{x^2}$`,
              [t`$\frac{e^x(x+1)}{x^2}$`, t`$e^x$`, t`$\frac{e^x}{1}$`, t`$\frac{e^x(1-x)}{x^2}$`],
              t`$\frac{e^x\cdot x-e^x\cdot1}{x^2}=\frac{e^x(x-1)}{x^2}$.`,
            ),
            tf(
              t`Na regra do quociente $\left(\frac{f}{g}\right)'$, trocar a ordem no numerador para $fg'-f'g$ só erra o sinal da derivada.`,
              true,
              t`Como $fg'-f'g = -(f'g-fg')$, inverter a ordem troca o sinal do resultado inteiro!`,
            ),
            num(
              t`Para $f(x)=\dfrac{x^2+1}{x+1}$, calcule $f'(0)$.`,
              -1,
              t`$f'(x)=\frac{2x(x+1)-(x^2+1)\cdot 1}{(x+1)^2}$. Em $x=0$: $\frac{0-1}{1^2}=-1$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Escolhendo o caminho mais curto',
            body: t`Antes de sair aplicando a regra do quociente no automático, olhe a expressão:

• **Constante embaixo**: $\dfrac{x^2+3x}{5}=\dfrac{1}{5}(x^2+3x)$ — use só a linearidade!
• **Constante em cima**: $\dfrac{4}{x^3}=4x^{-3}$ — use a regra do tombo!
• **Monômio embaixo**: $\dfrac{x^3-x}{x^2}=x-\dfrac{1}{x}$ — divida primeiro!`,
            tip: t`Engenheiro bom economiza conta: simplificar antes de derivar evita erros de sinal na regra do quociente.`,
          },
          exercises: [
            mcqS(
              t`Qual é a forma mais simples de derivar $f(x)=\dfrac{x^4-2x^2}{3}$?`,
              t`Manter o $\frac13$ multiplicando e derivar $x^4-2x^2$, obtendo $\frac{4x^3-4x}{3}$`,
              [
                t`Dividir as derivadas: $\frac{4x^3-4x}{0}$`,
                t`Obrigatoriamente expandir com um polinômio de grau $5$`,
                t`Derivar o $3$ como $3x$`,
                t`O resultado é zero porque há constante no denominador`,
              ],
              t`$\frac{f(x)}{3}=\frac13 f(x)$, então a derivada é simplesmente $\frac13 f'(x)$.`,
            ),
            mcqS(
              t`Derive $f(x)=\dfrac{\ln x}{x}$ (para $x>0$).`,
              t`$\frac{1-\ln x}{x^2}$`,
              [t`$\frac{1+\ln x}{x^2}$`, t`$\frac{1}{x^2}$`, t`$\frac{\ln x-1}{x^2}$`, t`$\frac{1}{x}$`],
              t`Regra do quociente: $\frac{\frac1x\cdot x-(\ln x)\cdot 1}{x^2}=\frac{1-\ln x}{x^2}$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 1, 5);
              return num(
                t`Se $f(x)=\dfrac{${a}x}{x^2+1}$, quanto vale $f'(0)$?`,
                a,
                t`$f'(x)=\frac{${a}(x^2+1)-${a}x(2x)}{(x^2+1)^2}$. Em $x=0$: $\frac{${a}\cdot 1-0}{1^2}=${a}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 5);
              return num(
                t`Para qual valor **positivo** de $x$ a função $f(x)=\dfrac{x}{x^2+${a * a}}$ tem derivada zero ($f'(x)=0$)?`,
                a,
                t`$f'(x)=\frac{(x^2+${a * a})-x(2x)}{(x^2+${a * a})^2}=\frac{${a * a}-x^2}{(x^2+${a * a})^2}=0\Rightarrow x^2=${a * a}\Rightarrow x=${a}$ ($x>0$).`,
              );
            }),
            mcqS(
              t`Usando $\operatorname{tg}x=\dfrac{\operatorname{sen}x}{\cos x}$ e $\operatorname{sen}^2x+\cos^2x=1$, a regra do quociente mostra que $(\operatorname{tg}x)'$ é:`,
              t`$\frac{1}{\cos^2x}=\sec^2x$`,
              [t`$\frac{\cos^2x-\operatorname{sen}^2x}{\cos^2x}$`, t`$-\sec^2x$`, t`$\frac{\cos x}{-\operatorname{sen}x}$`, t`$1$`],
              t`$\frac{\cos x\cdot\cos x-\operatorname{sen}x(-\operatorname{sen}x)}{\cos^2x}=\frac{\cos^2x+\operatorname{sen}^2x}{\cos^2x}=\frac{1}{\cos^2x}=\sec^2x$.`,
            ),
            gen((rng) => {
              const k = randNZ(rng, -5, 5);
              const x0 = pick(rng, [1, 2]);
              // f(x) = x^2 * g(x) at x0
              const g0 = randInt(rng, 1, 4);
              const dg0 = randInt(rng, -3, 3);
              const ans = 2 * x0 * g0 + x0 * x0 * dg0 + k;
              return num(
                t`Se $g(${x0})=${g0}$ e $g'(${x0})=${dg0}$, calcule $h'(${x0})$ para $h(x)=x^2g(x)${term(k, 'x')}$.`,
                ans,
                t`$h'(x)=2xg(x)+x^2g'(x)${term(k, '')}$ ⟹ $h'(${x0})=${2 * x0}\cdot${g0}+${x0 * x0}\cdot(${dg0})${term(k, '')}=${ans}$.`,
              );
            }),
            tf(
              t`A derivada de $f(x)=\dfrac{1}{g(x)}$ é $-\dfrac{g'(x)}{[g(x)]^2}$.`,
              true,
              t`Pela regra do quociente com numerador $1$: $\frac{0\cdot g - 1\cdot g'}{g^2}=-\frac{g'}{g^2}$. É a regra do recíproco!`,
            ),
            mcqS(
              t`Derive $f(x)=(x+1)\sqrt{x}$ para $x>0$.`,
              t`$\frac{3x+1}{2\sqrt{x}}$`,
              [t`$\frac{1}{2\sqrt{x}}$`, t`$\sqrt{x}+\frac{1}{2\sqrt{x}}$`, t`$\frac{x+1}{2\sqrt{x}}$`, t`$\frac{3x-1}{2\sqrt{x}}$`],
              t`$1\cdot\sqrt{x}+(x+1)\frac{1}{2\sqrt{x}}=\frac{2x+x+1}{2\sqrt{x}}=\frac{3x+1}{2\sqrt{x}}$.`,
            ),
          ],
        },
      ],
    },
    {
      id: 'c-der-cadeia',
      title: 'Regra da cadeia',
      parts: [
        {
          card: {
            title: 'De fora vezes de dentro',
            body: t`Como derivar uma função **composta** $h(x)=f(g(x))$? Derive a função **de fora** (mantendo a de dentro intacta!) e **multiplique** pela derivada da função **de dentro**:

$$\frac{d}{dx}\Big[f(g(x))\Big]=f'(g(x))\cdot g'(x)$$

Na notação de Leibniz, com $u=g(x)$, as taxas se multiplicam como engrenagens: $\dfrac{dy}{dx}=\dfrac{dy}{du}\cdot\dfrac{du}{dx}$.`,
            visual: chainWaveLab(),
            formula: t`\left([g(x)]^n\right)'=n\,[g(x)]^{n-1}\cdot g'(x)`,
            example: t`$\left((3x+1)^5\right)'=5(3x+1)^4\cdot(3x+1)'=5(3x+1)^4\cdot3=15(3x+1)^4$.`,
          },
          exercises: [
            inter(
              t`Ajuste $k=3$ em $f(x)=\operatorname{sen}(kx)$ e veja que a derivada na origem vale $f'(0)=3$.`,
              'plot',
              chainWaveLab().props,
              (v: any) => v && near(v.p.k, 3, 0.05),
              t`$k=3$`,
              t`Comprimir o gráfico horizontalmente por um fator $k$ multiplica todas as inclinações por $k$!`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const b = randNZ(rng, -5, 5);
              const n = randInt(rng, 2, 6);
              return rmcq(
                rng,
                t`Derive $f(x)=(${lin(a, b)})^{${n}}$.`,
                t`$${n * a}(${lin(a, b)})^{${n - 1}}$`,
                [
                  t`$${n}(${lin(a, b)})^{${n - 1}}$`,
                  t`$${n * a}x^{${n - 1}}$`,
                  t`$${a}(${lin(a, b)})^{${n}}$`,
                  t`$${n}(${a})^{${n - 1}}$`,
                ],
                t`De fora: $${n}u^{${n - 1}}$; vezes a derivada de dentro ($${a}$): $${n * a}(${lin(a, b)})^{${n - 1}}$.`,
              );
            }),
            fill(
              t`Complete a regra da cadeia para $f(x)=(x^2+4)^7$:`,
              t`$f'(x) =$ ___ $\cdot(x^2+4)^6\cdot$ ___`,
              ['$7$', '$2x$'],
              ['$6$', '$x^2$', '$14$'],
              t`Tombamos o $7$ mantendo $(x^2+4)^6$, e multiplicamos pela derivada de dentro $(x^2+4)'=2x$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 4);
              const n = randInt(rng, 3, 6);
              return rmcq(
                rng,
                t`Qual é a derivada de $f(x)=(x^2+${k})^{${n}}$?`,
                t`$${2 * n}x(x^2+${k})^{${n - 1}}$`,
                [
                  t`$${n}(x^2+${k})^{${n - 1}}$`,
                  t`$${n}(2x)^{${n - 1}}$`,
                  t`$2x(x^2+${k})^{${n - 1}}$`,
                  t`$${2 * n}x(x^2+${k})^{${n}}$`,
                ],
                t`$f'(x)=${n}(x^2+${k})^{${n - 1}}\cdot 2x=${2 * n}x(x^2+${k})^{${n - 1}}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 4);
              const n = pick(rng, [2, 3]);
              // f(x) = (a x - (a-1))^n at x = 1 => inside = 1
              const b = -(a - 1);
              const ans = n * a;
              return num(
                t`Se $f(x)=(${lin(a, b)})^{${n}}$, quanto vale $f'(1)$?`,
                ans,
                t`$f'(x)=${n}(${lin(a, b)})^{${n - 1}}\cdot${a}$. Em $x=1$, a base vale $1$, logo $f'(1)=${n}\cdot 1\cdot${a}=${ans}$.`,
              );
            }),
            mcqS(
              t`Derive $f(x)=\dfrac{1}{(2x+1)^3}=(2x+1)^{-3}$.`,
              t`$-\frac{6}{(2x+1)^4}$`,
              [t`$-\frac{3}{(2x+1)^4}$`, t`$\frac{6}{(2x+1)^4}$`, t`$-\frac{6}{(2x+1)^2}$`, t`$\frac{1}{6(2x+1)^2}$`],
              t`$-3(2x+1)^{-4}\cdot 2=-\frac{6}{(2x+1)^4}$.`,
            ),
            tf(
              t`A derivada de $(2x)^3$ pela regra da cadeia é $3(2x)^2\cdot 2=24x^2$, que confere com $(8x^3)'=24x^2$.`,
              true,
              t`Se esquecesse de multiplicar pela derivada de dentro ($2$), daria $12x^2$ (errado!).`,
            ),
            mcqS(
              t`Qual é o erro mais comum em $\frac{d}{dx}(x^3+1)^4 = 4(3x^2)^3$?`,
              'Colocar a derivada de dentro no lugar de $g(x)$, em vez de manter $g(x)$ e multiplicar por $g\'(x)$ fora',
              [
                'Diminuir o expoente de $4$ para $3$',
                'Derivar $x^3+1$ como $3x^2$',
                'Não usar a regra do quociente',
                'A conta está certa',
              ],
              t`Na regra da cadeia, a função de fora é avaliada na **própria** função de dentro: $4(x^3+1)^3\cdot 3x^2$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Cadeia em raízes, exp, ln e trig',
            body: t`Cada regra da tabela ganha sua versão com $u=g(x)$:

• $\left(\sqrt{u}\right)'=\dfrac{u'}{2\sqrt{u}}\qquad \left(e^u\right)'=e^u\cdot u'\qquad \left(\ln u\right)'=\dfrac{u'}{u}$
• $\left(\operatorname{sen}u\right)'=(\cos u)\cdot u'\qquad \left(\cos u\right)'=(-\operatorname{sen}u)\cdot u'$`,
            example: t`• $\left(e^{x^2}\right)'=2x\,e^{x^2}$
• $\left(\ln(x^2+1)\right)'=\dfrac{2x}{x^2+1}$
• $\left(\cos(5x)\right)'=-5\operatorname{sen}(5x)$`,
            tip: t`Note que $\dfrac{(\ln u)'}{1}=\dfrac{u'}{u}$: a derivada do logaritmo natural é sempre "a derivada do que está dentro dividida pelo que está dentro"!`,
          },
          exercises: [
            mcqS(
              t`Derive $f(x)=e^{3x}$.`,
              t`$3e^{3x}$`,
              [t`$e^{3x}$`, t`$3xe^{3x-1}$`, t`$e^3$`, t`$\frac{1}{3}e^{3x}$`],
              t`$(e^u)'=e^u\cdot u'\implies e^{3x}\cdot 3=3e^{3x}$.`,
            ),
            mcqS(
              t`Derive $f(x)=\ln(x^2+1)$.`,
              t`$\frac{2x}{x^2+1}$`,
              [t`$\frac{1}{x^2+1}$`, t`$\frac{2x}{x}$`, t`$2x\ln(x^2+1)$`, t`$\frac{1}{2x}$`],
              t`$\frac{u'}{u}=\frac{2x}{x^2+1}$.`,
            ),
            mcqS(
              t`Derive $f(x)=\cos(5x)$.`,
              t`$-5\operatorname{sen}(5x)$`,
              [t`$5\operatorname{sen}(5x)$`, t`$-\operatorname{sen}(5x)$`, t`$-5\cos(5x)$`, t`$-\operatorname{sen}(5)$`],
              t`De fora: $-\operatorname{sen}(5x)$; de dentro: $5$.`,
            ),
            fill(
              t`Complete a regra da cadeia para $\operatorname{sen}(x^3)$:`,
              t`$\frac{d}{dx}\operatorname{sen}(x^3) =$ ___ $\cdot$ ___`,
              [t`$\cos(x^3)$`, t`$3x^2$`],
              [t`$\operatorname{sen}(3x^2)$`, t`$x^3$`, t`$-\cos(x^3)$`],
              t`Derivada do seno é o cosseno (avaliado em $x^3$), multiplicado por $(x^3)'=3x^2$.`,
            ),
            num(
              t`Se $f(x)=\sqrt{x^2+16}$, quanto vale $f'(3)$?`,
              0.6,
              t`$f'(x)=\frac{2x}{2\sqrt{x^2+16}}=\frac{x}{\sqrt{x^2+16}}$ ⟹ $f'(3)=\frac{3}{\sqrt{25}}=\frac{3}{5}=0{,}6$.`,
            ),
            gen((rng) => {
              const a = randNZ(rng, -5, 6);
              return rmcq(
                rng,
                t`Qual é a derivada de $f(x)=e^{${a}x^2}$?`,
                t`$${2 * a}x\,e^{${a}x^2}$`,
                [
                  t`$e^{${a}x^2}$`,
                  t`$${a}x\,e^{${a}x^2}$`,
                  t`$${2 * a}x\,e^{${2 * a}x}$`,
                  t`$${a}x^2e^{${a}x^2-1}$`,
                ],
                t`$(e^u)'=e^u\cdot u'$ com $u=${a}x^2$ e $u'=${2 * a}x$.`,
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 8);
              const fn = pick(rng, ['sen', 'cos'] as const);
              const corr = fn === 'sen' ? `${k}\\cos(${k}x)` : `-${k}\\operatorname{sen}(${k}x)`;
              const w1 = fn === 'sen' ? `-${k}\\cos(${k}x)` : `${k}\\operatorname{sen}(${k}x)`;
              const w2 = fn === 'sen' ? `\\cos(${k}x)` : `-\\operatorname{sen}(${k}x)`;
              const w3 = fn === 'sen' ? `${k}\\operatorname{sen}(${k}x)` : `-${k}\\cos(${k}x)`;
              const promptFn = fn === 'sen' ? `\\operatorname{sen}(${k}x)` : `\\cos(${k}x)`;
              return rmcq(
                rng,
                t`Derive $f(x)=${promptFn}$.`,
                `$${corr}$`,
                [`$${w1}$`, `$${w2}$`, `$${w3}$`],
                t`Multiplique a derivada trigonométrica pelo fator interno $${k}$.`,
              );
            }),
            match(
              t`Ligue cada função composta à sua derivada:`,
              [
                [t`$e^{-x}$`, t`$-e^{-x}$`],
                [t`$\ln(3x)$`, t`$\dfrac{1}{x}$`],
                [t`$\sqrt{2x+1}$`, t`$\dfrac{1}{\sqrt{2x+1}}$`],
                [t`$\operatorname{sen}(2x)$`, t`$2\cos(2x)$`],
              ],
              t`Note que em $(\ln(3x))'=\frac{3}{3x}=\frac1x$ o fator $3$ se cancela!`,
            ),
          ],
        },
        {
          card: {
            title: 'Cadeias duplas, tabelas e taxas',
            body: t`Quando há três camadas $f(g(h(x)))$, aplicamos a regra da cadeia de fora para dentro, como descascar uma cebola:

$$\Big[f(g(h(x)))\Big]'=f'(g(h(x)))\cdot g'(h(x))\cdot h'(x)$$

Atenção à notação: $\operatorname{sen}^2(3x)$ significa $[\operatorname{sen}(3x)]^2$ — a função mais externa é o **quadrado**!`,
            example: t`$\left(\operatorname{sen}^2(3x)\right)'=2\operatorname{sen}(3x)\cdot\cos(3x)\cdot 3=6\operatorname{sen}(3x)\cos(3x)$.`,
            tip: t`Em física e engenharia, se o raio $r(t)$ varia no tempo, a taxa de variação da área $A=\pi r^2$ é $\dfrac{dA}{dt}=2\pi r\,\dfrac{dr}{dt}$ (**taxas relacionadas**).`,
          },
          exercises: [
            mcqS(
              t`Derive $f(x)=\operatorname{sen}^2(x)=[\operatorname{sen}(x)]^2$.`,
              t`$2\operatorname{sen}x\cos x$`,
              [t`$2\operatorname{sen}x$`, t`$\cos^2x$`, t`$2\cos x$`, t`$-2\operatorname{sen}x\cos x$`],
              t`De fora ($u^2$): $2\operatorname{sen}x$; vezes a de dentro ($\operatorname{sen}x$): $\cos x$.`,
            ),
            gen((rng) => {
              const g1 = randInt(rng, 2, 4);
              const dg1 = randNZ(rng, -4, 5);
              const dfg = randNZ(rng, -5, 5);
              const ans = dfg * dg1;
              return num(
                t`Se $h(x)=f(g(x))$, com $g(1)=${g1}$, $g'(1)=${dg1}$ e $f'(${g1})=${dfg}$, quanto vale $h'(1)$?`,
                ans,
                t`$h'(1)=f'(g(1))\cdot g'(1)=f'(${g1})\cdot g'(1)=(${dfg})\cdot(${dg1})=${ans}$.`,
              );
            }),
            order(
              t`Ordene as camadas de fora para dentro ao derivar $h(x)=e^{\operatorname{sen}(2x)}$:`,
              [
                t`Derivar a exponencial: $e^{\operatorname{sen}(2x)}$`,
                t`Multiplicar pela derivada do seno: $\cos(2x)$`,
                t`Multiplicar pela derivada de $2x$: $2$`,
                t`Juntar tudo: $2\cos(2x)\,e^{\operatorname{sen}(2x)}$`,
              ],
              t`Três funções encadeadas geram um produto de três fatores!`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              const n = randInt(rng, 2, 4);
              return rmcq(
                rng,
                t`Derive $f(x)=\cos^{${n}}(${k}x)=[\cos(${k}x)]^{${n}}$.`,
                t`$-${n * k}\cos^{${n - 1}}(${k}x)\operatorname{sen}(${k}x)$`,
                [
                  t`$${n * k}\cos^{${n - 1}}(${k}x)\operatorname{sen}(${k}x)$`,
                  t`$-${n}\cos^{${n - 1}}(${k}x)\operatorname{sen}(${k}x)$`,
                  t`$-${n * k}\operatorname{sen}^{${n - 1}}(${k}x)$`,
                  t`$${n}\cos^{${n - 1}}(${k}x)$`,
                ],
                t`$n[\cos(kx)]^{n-1}\cdot(-\operatorname{sen}(kx))\cdot k=-${n * k}\cos^{${n - 1}}(${k}x)\operatorname{sen}(${k}x)$.`,
              );
            }),
            mcqS(
              t`Para derivar $f(x)=x\,e^{-2x}$, precisamos combinar:`,
              'Regra do produto e regra da cadeia',
              ['Apenas regra da cadeia', 'Apenas regra do produto', 'Regra do quociente apenas', 'Apenas regra do tombo'],
              t`Há um produto $x\cdot e^{-2x}$, e para derivar o segundo fator $e^{-2x}$ usamos a regra da cadeia ($-2e^{-2x}$).`,
            ),
            num(
              t`Se $f(x)=x\,e^{-2x}$, quanto vale $f'(0)$?`,
              1,
              t`$f'(x)=1\cdot e^{-2x}+x(-2e^{-2x})=(1-2x)e^{-2x}$. Em $x=0$: $1\cdot e^0=1$.`,
            ),
            gen((rng) => {
              const l = randInt(rng, 3, 10);
              const dl = randInt(rng, 2, 5);
              return num(
                t`O lado $\ell$ de um quadrado cresce à taxa $\dfrac{d\ell}{dt}=${dl}$ cm/s. Qual a taxa de variação da área $\dfrac{dA}{dt}$ quando $\ell=${l}$ cm?`,
                2 * l * dl,
                t`$A=\ell^2\implies \frac{dA}{dt}=2\ell\,\frac{d\ell}{dt}=2\cdot${l}\cdot${dl}=${2 * l * dl}$ cm²/s.`,
                { unit: 'cm²/s' },
              );
            }),
            mcqS(
              t`Se $f$ é uma função **par** e derivável ($f(-x)=f(x)$), derivando os dois lados pela regra da cadeia concluímos que $f'$ é:`,
              t`ímpar, pois $-f'(-x)=f'(x)$`,
              [t`par, pois $f'(-x)=f'(x)$`, t`sempre positiva`, t`constante`, t`nula em todo ponto`],
              t`Derivando $f(-x)$: $f'(-x)\cdot(-1)=f'(x)\implies f'(-x)=-f'(x)$, logo $f'$ é ímpar!`,
            ),
          ],
        },
      ],
    },
    {
      id: 'c-der-esp',
      title: 'Derivadas de funções especiais',
      parts: [
        {
          card: {
            title: 'Funções trigonométricas',
            body: t`As derivadas trigonométricas descrevem oscilações, ondas e corrente alternada (com $x$ sempre em **radianos**!):

$$(\operatorname{sen}x)'=\cos x\qquad (\cos x)'=-\operatorname{sen}x$$
$$(\operatorname{tg}x)'=\sec^2x\qquad (\sec x)'=\sec x\operatorname{tg}x$$

Mova $x_0$ abaixo e compare a inclinação da tangente ao seno com o gráfico do cosseno:`,
            visual: sinCosLab(),
            tip: t`As "co-funções" ($\cos x$, $\operatorname{cotg}x$, $\operatorname{cossec}x$) têm sinal **negativo** na derivada!`,
          },
          exercises: [
            inter(
              t`Posicione $x_0$ perto de $\frac{\pi}{2}\approx 1{,}57$, onde o seno atinge o topo e sua derivada ($\cos x_0$) zera.`,
              'plot',
              sinCosLab().props,
              (v: any) => v && near(v.p.x0, Math.PI / 2, 0.1),
              t`$x_0\approx 1{,}57$`,
              t`Em $x_0=\frac{\pi}{2}$, o seno tem máximo local e $\cos(\frac\pi2)=0$.`,
            ),
            match(
              t`Ligue cada função trigonométrica à sua derivada:`,
              [
                [t`$\operatorname{sen}x$`, t`$\cos x$`],
                [t`$\cos x$`, t`$-\operatorname{sen}x$`],
                [t`$\operatorname{tg}x$`, t`$\sec^2x$`],
                [t`$\sec x$`, t`$\sec x\operatorname{tg}x$`],
              ],
              t`Memorize essas quatro: elas aparecem o tempo todo em Cálculo e Física.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              const b = randInt(rng, 1, 5);
              // f(x) = a sen x + b cos x at x = 0 => f'(0) = a cos 0 - b sen 0 = a
              return num(
                t`Se $f(x)=${a}\operatorname{sen}x+${b}\cos x$, quanto vale $f'(0)$?`,
                a,
                t`$f'(x)=${a}\cos x-${b}\operatorname{sen}x\implies f'(0)=${a}\cdot 1-${b}\cdot 0=${a}$.`,
              );
            }),
            mcqS(
              t`Derive $f(x)=x\operatorname{sen}x+\cos x$.`,
              t`$x\cos x$`,
              [t`$\operatorname{sen}x+x\cos x$`, t`$\cos x-\operatorname{sen}x$`, t`$2\cos x-x\operatorname{sen}x$`, t`$-x\operatorname{sen}x$`],
              t`$(\operatorname{sen}x+x\cos x)-\operatorname{sen}x=x\cos x$.`,
            ),
            num(
              t`Calcule $f'\left(\frac{\pi}{4}\right)$ para $f(x)=\operatorname{tg}x$.`,
              2,
              t`$f'(x)=\sec^2x=\frac{1}{\cos^2x}$. Como $\cos(\frac\pi4)=\frac{\sqrt2}{2}$, temos $\sec^2(\frac\pi4)=\frac{1}{2/4}=2$.`,
            ),
            mcqS(
              t`As derivadas sucessivas de $f(x)=\operatorname{sen}x$ se repetem de $4$ em $4$. Qual é a **quarta** derivada $f^{(4)}(x)$?`,
              t`$\operatorname{sen}x$`,
              [t`$\cos x$`, t`$-\operatorname{sen}x$`, t`$-\cos x$`, t`$0$`],
              t`$\operatorname{sen}x\to\cos x\to-\operatorname{sen}x\to-\cos x\to\operatorname{sen}x$: na 4ª derivada voltamos ao início!`,
            ),
            gen((rng) => {
              const A = randInt(rng, 2, 7);
              const w = randInt(rng, 2, 5);
              return num(
                t`Uma mola oscila segundo $x(t)=${A}\cos(${w}t)$. Qual é o valor **máximo** da velocidade $|x'(t)|$?`,
                A * w,
                t`$x'(t)=-${A * w}\operatorname{sen}(${w}t)$, cujo valor máximo em módulo é $${A * w}$.`,
              );
            }),
            tf(
              t`A fórmula $(\operatorname{sen}x)'=\cos x$ só vale na forma simples quando $x$ é medido em **radianos**.`,
              true,
              t`Em graus, como $x^\circ=\frac{\pi x}{180}$ rad, a regra da cadeia faria aparecer um fator $\frac{\pi}{180}$ em toda derivada!`,
            ),
          ],
        },
        {
          card: {
            title: 'Exponenciais e logaritmos',
            body: t`A exponencial de base $e\approx 2{,}718$ é a função cuja taxa de crescimento é igual ao seu próprio valor:

$$(e^x)'=e^x\qquad (a^x)'=a^x\ln a$$
$$(\ln x)'=\frac{1}{x}\qquad (\log_a x)'=\frac{1}{x\ln a}$$`,
            example: t`• $(2^x)'=2^x\ln 2$
• $(e^x\cos x)'=e^x\cos x-e^x\operatorname{sen}x=e^x(\cos x-\operatorname{sen}x)$.`,
            tip: t`Cuidado para não confundir: em $x^n$ a variável está na **base** (regra do tombo: $nx^{n-1}$); em $a^x$ a variável está no **expoente** ($a^x\ln a$)!`,
          },
          exercises: [
            tf(
              t`$e^x$ é a única família de funções ($C\,e^x$) igual à própria derivada.`,
              true,
              t`Se $y'=y$, então $y=C\,e^x$: é a equação diferencial mais importante da engenharia.`,
            ),
            mcqS(
              t`Derive $f(x)=2^x$.`,
              t`$2^x\ln2$`,
              [t`$x\,2^{x-1}$`, t`$2^x$`, t`$\frac{2^x}{\ln2}$`, t`$2^{x-1}\ln2$`],
              t`Base constante $a=2$ com $x$ no expoente: $(a^x)'=a^x\ln a=2^x\ln2$.`,
            ),
            mcqS(
              t`Derive $f(x)=e^x\cos x$.`,
              t`$e^x(\cos x-\operatorname{sen}x)$`,
              [t`$-e^x\operatorname{sen}x$`, t`$e^x(\cos x+\operatorname{sen}x)$`, t`$e^x\cos x$`, t`$e^x\operatorname{sen}x$`],
              t`Regra do produto: $e^x\cos x+e^x(-\operatorname{sen}x)=e^x(\cos x-\operatorname{sen}x)$.`,
            ),
            num(
              t`Calcule a derivada de $f(x)=\ln x$ em $x=4$.`,
              0.25,
              t`$f'(x)=\frac1x\implies f'(4)=\frac14=0{,}25$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 8);
              const k = pick(rng, [1, 2, 4, 5]);
              return num(
                t`Se $f(x)=${a}\ln x$, quanto vale $f'(${k})$?`,
                a / k,
                t`$f'(x)=\frac{${a}}{x}\implies f'(${k})=\frac{${a}}{${k}}=${fmt(a / k)}$.`,
              );
            }),
            gen((rng) => {
              const b = pick(rng, [3, 5, 7, 10]);
              return rmcq(
                rng,
                t`Qual é a derivada de $f(x)=x^{${b}}+${b}^x$?`,
                t`$${b}x^{${b - 1}}+${b}^x\ln ${b}$`,
                [
                  t`$${b}x^{${b - 1}}+x\,${b}^{x-1}$`,
                  t`$${b}x^{${b - 1}}+${b}^x$`,
                  t`$x^{${b}}\ln x+${b}^x\ln ${b}$`,
                  t`$${b}x^{${b - 1}}+\frac{${b}^x}{\ln ${b}}$`,
                ],
                t`No 1º termo a variável é a base (regra do tombo: $${b}x^{${b - 1}}$); no 2º é o expoente ($${b}^x\ln ${b}$).`,
              );
            }),
            mcqS(
              t`Qual é a derivada de $f(x)=\log_{10}x$?`,
              t`$\frac{1}{x\ln 10}$`,
              [t`$\frac{1}{x}$`, t`$\frac{\ln 10}{x}$`, t`$\frac{1}{10x}$`, t`$10^x\ln 10$`],
              t`Como $\log_{10}x=\frac{\ln x}{\ln 10}$, sua derivada é $\frac{1}{x\ln 10}$.`,
            ),
            mcqS(
              t`Derive $f(x)=x\ln x-x$ (para $x>0$).`,
              t`$\ln x$`,
              [t`$\ln x+1$`, t`$\frac{1}{x}-1$`, t`$x\ln x$`, t`$\ln x-1$`],
              t`$(x\ln x)'-(x)'=(1\cdot\ln x+x\cdot\frac1x)-1=\ln x+1-1=\ln x$. (Logo $x\ln x-x$ é a primitiva de $\ln x$!)`,
            ),
          ],
        },
        {
          card: {
            title: 'Inversas trigonométricas e implícita',
            body: t`As funções $\operatorname{arcsen}x$ e $\operatorname{arctg}x$ têm derivadas algébricas surpreendentes (e muito usadas em integrais!):

$$(\operatorname{arcsen}x)'=\frac{1}{\sqrt{1-x^2}}\qquad (\operatorname{arctg}x)'=\frac{1}{1+x^2}$$

**Derivação implícita**: quando $y$ não está isolado (como no círculo $x^2+y^2=25$), derivamos os dois lados em relação a $x$ lembrando que $y=y(x)$ (regra da cadeia: $(y^2)'=2y\,y'$).`,
            example: t`Em $x^2+y^2=25$: $2x+2y\,y'=0\implies y'=-\dfrac{x}{y}$.`,
          },
          exercises: [
            match(
              t`Ligue cada função inversa à sua derivada:`,
              [
                [t`$\operatorname{arcsen}x$`, t`$\dfrac{1}{\sqrt{1-x^2}}$`],
                [t`$\operatorname{arccos}x$`, t`$-\dfrac{1}{\sqrt{1-x^2}}$`],
                [t`$\operatorname{arctg}x$`, t`$\dfrac{1}{1+x^2}$`],
                [t`$\ln|x|$`, t`$\dfrac{1}{x}$`],
              ],
              t`As derivadas de $\operatorname{arcsen}x$ e $\operatorname{arctg}x$ serão fundamentais para integrar frações no próximo módulo!`,
            ),
            gen((rng) => {
              const x0 = randInt(rng, 1, 4);
              const den = 1 + x0 * x0;
              return num(
                t`Se $f(x)=${den}\operatorname{arctg}x$, quanto vale $f'(${x0})$?`,
                1,
                t`$f'(x)=\frac{${den}}{1+x^2}$. Em $x=${x0}$, $1+${x0}^2=${den}$, então $f'(${x0})=\frac{${den}}{${den}}=1$.`,
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return rmcq(
                rng,
                t`Pela regra da cadeia, qual é a derivada de $f(x)=\operatorname{arctg}(${k}x)$?`,
                t`$\dfrac{${k}}{1+${k * k}x^2}$`,
                [
                  t`$\dfrac{1}{1+${k * k}x^2}$`,
                  t`$\dfrac{${k}}{1+${k}x^2}$`,
                  t`$\dfrac{1}{\sqrt{1-${k * k}x^2}}$`,
                  t`$${k}\operatorname{arctg}(${k}x)$`,
                ],
                t`$\frac{u'}{1+u^2}=\frac{${k}}{1+(${k}x)^2}=\frac{${k}}{1+${k * k}x^2}$.`,
              );
            }),
            mcqS(
              t`Qual é a derivada de $f(x)=\operatorname{arcsen}(2x)$?`,
              t`$\frac{2}{\sqrt{1-4x^2}}$`,
              [t`$\frac{1}{\sqrt{1-4x^2}}$`, t`$\frac{2}{\sqrt{1-2x^2}}$`, t`$\frac{2}{1+4x^2}$`, t`$-\frac{2}{\sqrt{1-4x^2}}$`],
              t`$\frac{u'}{\sqrt{1-u^2}}$ com $u=2x$ e $u'=2$: $\frac{2}{\sqrt{1-4x^2}}$.`,
            ),
            mcqS(
              t`Na derivação implícita em relação a $x$, sendo $y=y(x)$, quanto vale $\dfrac{d}{dx}\left(y^3\right)$?`,
              t`$3y^2\,y'$`,
              [t`$3y^2$`, t`$y^3\,y'$`, t`$3x^2\,y'$`, t`$0$`],
              t`Como $y$ depende de $x$, aplicamos a regra da cadeia: derivada de fora ($3y^2$) vezes a derivada de dentro ($y'$).`,
            ),
            gen((rng) => {
              const [x0, y0] = pick(rng, [
                [3, 4],
                [4, 3],
                [6, 8],
                [5, 12],
              ] as const);
              const r2 = x0 * x0 + y0 * y0;
              return num(
                t`Na circunferência $x^2+y^2=${r2}$, qual é a inclinação $y'$ da reta tangente no ponto $(${x0},\,${y0})$?`,
                -x0 / y0,
                t`$2x+2yy'=0\implies y'=-\frac{x}{y}=-\frac{${x0}}{${y0}}=${fmt(-x0 / y0)}$.`,
                { tol: 0.005 },
              );
            }),
            num(
              t`Sabendo que $x^2+y^3=9$, calcule $y'$ no ponto $(1,\,2)$ (responda em fração ou decimal).`,
              -1 / 6,
              t`Derivando: $2x+3y^2y'=0\implies 2(1)+3(4)y'=0\implies 12y'=-2\implies y'=-\frac16$.`,
              { tol: 0.002 },
            ),
            mcqS(
              t`Para derivar $y=x^x$ ($x>0$), onde $x$ está na base **e** no expoente, escrevemos $\ln y=x\ln x$. Derivando implicitamente, obtemos:`,
              t`$y'=x^x(\ln x+1)$`,
              [t`$y'=x\cdot x^{x-1}=x^x$`, t`$y'=x^x\ln x$`, t`$y'=x^x\cdot\frac1x$`, t`$y'=(\ln x+1)$`],
              t`$\frac{y'}{y}=1\cdot\ln x+x\cdot\frac1x=\ln x+1\implies y'=y(\ln x+1)=x^x(\ln x+1)$.`,
            ),
          ],
        },
      ],
    },
  ],
};

export const aplicacoes: UnitDef = {
  id: 'c-apl',
  title: 'Aplicações da derivada',
  subtitle: 'Crescimento, máximos e mínimos, otimização e L’Hôpital',
  icon: '🏔️',
  source: 'Cálculo I · Unidade 3 — Comportamento da função',
  extra: false,
  guide: t`O sinal de $f'$ revela se a função sobe ou desce; os pontos onde $f'=0$ são candidatos a máximo e mínimo; o sinal de $f''$ mostra a concavidade. Com isso resolvemos problemas de otimização na engenharia e limites indeterminados via L'Hôpital.`,
  lessons: [
    {
      id: 'c-apl-cresc',
      title: 'Crescimento e pontos críticos',
      parts: [
        {
          card: {
            title: 'O sinal da primeira derivada',
            body: t`A inclinação da tangente conta para onde o gráfico está indo:

• $f'(x)>0$ num intervalo $\implies f$ é **crescente** (sobe da esquerda para a direita)
• $f'(x)<0$ num intervalo $\implies f$ é **decrescente** (desce)
• $f'(c)=0$ (tangente horizontal) ou $f'(c)$ não existe $\implies c$ é um **ponto crítico**

Arraste o ponto sobre $f(x)=\frac{x^3}{3}-x$ e veja o sinal de $f'(x)=x^2-1$:`,
            visual: derivativeSignLab((x) => x ** 3 / 3 - x, (x) => x * x - 1, { xMin: -2.6, xMax: 2.6, yMin: -2, yMax: 2 }, -2),
          },
          exercises: [
            inter(
              t`Arraste o ponto até um **ponto crítico** de $f(x)=\frac{x^3}{3}-x$.`,
              'plot',
              derivativeSignLab((x) => x ** 3 / 3 - x, (x) => x * x - 1, { xMin: -2.6, xMax: 2.6, yMin: -2, yMax: 2 }, -2).props,
              (v: any) => v && Math.abs(Math.abs(v.pts.P.x) - 1) < 0.08,
              t`$x=\pm1$`,
              t`Em $x=-1$ e $x=1$ temos $f'(x)=x^2-1=0$: a reta tangente fica horizontal!`,
            ),
            gen((rng) => {
              const a = randInt(rng, -3, 3);
              return num(
                t`Qual o ponto crítico de $f(x)=${polyTex([1, -2 * a, 1])}$?`,
                a,
                t`$f'(x)=2x${term(-2 * a, '')}=0\Rightarrow x=${a}$.`,
              );
            }),
            mcqS(
              t`Em que intervalo $f(x)=x^3-3x$ é **decrescente**?`,
              t`$(-1,\,1)$`,
              [t`$(1,\,\infty)$`, t`$(-\infty,\,-1)$`, t`$\mathbb R$`, t`$(0,\,\infty)$`],
              t`$f'(x)=3x^2-3=3(x^2-1)<0\iff -1<x<1$.`,
            ),
            multi(
              t`Quais são os pontos críticos de $f(x)=x^4-2x^2$?`,
              ['$x=0$', '$x=1$', '$x=-1$', '$x=2$'],
              [0, 1, 2],
              t`$f'(x)=4x^3-4x=4x(x-1)(x+1)=0\implies x=0,\,1,\,-1$.`,
            ),
            gen((rng) => {
              const a = randNZ(rng, -4, 4);
              const c = randInt(rng, -5, 5);
              return rmcq(
                rng,
                t`Em qual intervalo a parábola $f(x)=${polyTex([c, -2 * a, 1])}$ é **crescente**?`,
                t`$(${a},\,\infty)$`,
                [
                  t`$(-\infty,\,${a})$`,
                  t`$(${-a},\,\infty)$`,
                  t`$(-\infty,\,${-a})$`,
                  t`$(0,\,\infty)$`,
                ],
                t`$f'(x)=2x${term(-2 * a, '')}>0\iff x>${a}$.`,
              );
            }),
            tf(
              t`A função $f(x)=e^x$ não possui pontos críticos em $\mathbb R$.`,
              true,
              t`$f'(x)=e^x>0$ para todo $x\in\mathbb R$: ela é estritamente crescente sempre e nunca tem tangente horizontal.`,
            ),
            mcqS(
              t`Sobre a função $f(x)=x^3+3x$, cuja derivada é $f'(x)=3x^2+3$, podemos afirmar que:`,
              t`É estritamente crescente em todo $\mathbb R$`,
              [t`Tem pontos críticos em $x=\pm 1$`, t`É decrescente para $x<0$`, t`Tem um mínimo local em $x=0$`],
              t`Como $x^2\ge0$, temos $f'(x)=3x^2+3\ge 3>0$ para todo $x$: sempre crescente!`,
            ),
            gen((rng) => {
              const r = randInt(rng, 1, 5);
              // f(x) = x^3 - 3 r^2 x => f'(x) = 3(x^2 - r^2) = 0 => x = r (positive)
              return num(
                t`Qual é o ponto crítico **positivo** de $f(x)=x^3-${3 * r * r}x$?`,
                r,
                t`$f'(x)=3x^2-${3 * r * r}=0\implies x^2=${r * r}\implies x=${r}$ ($x>0$).`,
              );
            }),
          ],
        },
        {
          card: {
            title: 'Teste da 1ª derivada',
            body: t`Nem todo ponto crítico é máximo ou mínimo! Quem decide é a **troca de sinal** de $f'$ ao atravessar $c$ (da esquerda para a direita):

• $f'$ muda de $+$ para $-$ (sobe $\nearrow$ e depois desce $\searrow$) $\implies$ **máximo local**
• $f'$ muda de $-$ para $+$ (desce $\searrow$ e depois sobe $\nearrow$) $\implies$ **mínimo local**
• $f'$ **não** troca de sinal (ex.: $+$ e $+$) $\implies$ não é extremo (inflexão horizontal)`,
            example: t`Em $f(x)=x^3$, $f'(x)=3x^2$ zera em $x=0$, mas $f'(x)>0$ antes **e** depois de $0$: a função sobe, dá uma "paradinha" horizontal em $0$ e continua subindo!`,
          },
          exercises: [
            tf(
              t`Se $f'(c)=0$, então $x=c$ é obrigatoriamente um ponto de máximo ou de mínimo local.`,
              false,
              t`$f(x)=x^3$ tem $f'(0)=0$, mas $x=0$ é ponto de **inflexão** (não há troca de sinal em $f'(x)=3x^2\ge0$).`,
            ),
            match(
              t`Ligue o comportamento de $f'$ ao passar pelo ponto crítico $c$ à sua classificação:`,
              [
                [t`$f'$ muda de $+$ para $-$`, 'Máximo local'],
                [t`$f'$ muda de $-$ para $+$`, 'Mínimo local'],
                [t`$f'$ continua $+$ antes e depois`, 'Nem máximo nem mínimo'],
                [t`$f'>0$ em todo o intervalo`, 'Função estritamente crescente'],
              ],
              t`Sobe e depois desce = topo (máximo); desce e depois sobe = fundo do vale (mínimo).`,
            ),
            mcqS(
              t`Para $f(x)=x^3-3x$, sabemos que $f'(x)=3(x+1)(x-1)$. O que ocorre nos pontos críticos $x=-1$ e $x=1$?`,
              t`Máximo local em $x=-1$ e mínimo local em $x=1$`,
              [
                t`Mínimo local em $x=-1$ e máximo local em $x=1$`,
                t`Dois mínimos locais`,
                t`Dois pontos de inflexão`,
              ],
              t`Sinal de $f'$: $+$ em $(-\infty,\,-1)$, $-$ em $(-1,\,1)$ e $+$ em $(1,\,\infty)$. Logo $-1$ é máximo e $1$ é mínimo.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 1, 4);
              // f(x) = -x^2 + 2ax => max at x = a, value = a^2
              return num(
                t`Qual é o **valor máximo** atingido por $f(x)=-x^2+${2 * a}x$?`,
                a * a,
                t`$f'(x)=-2x+${2 * a}=0\implies x=${a}$. O valor máximo é $f(${a})=-(${a})^2+${2 * a}\cdot${a}=${a * a}$.`,
              );
            }),
            gen((rng) => {
              const c = randInt(rng, -3, 4);
              const signBefore = pick(rng, ['+', '-'] as const);
              const signAfter = pick(rng, ['+', '-'] as const);
              const corr =
                signBefore === '+' && signAfter === '-'
                  ? 'Máximo local'
                  : signBefore === '-' && signAfter === '+'
                    ? 'Mínimo local'
                    : 'Não é extremo local (sem troca de sinal)';
              const wrongs = ['Máximo local', 'Mínimo local', 'Não é extremo local (sem troca de sinal)', 'Assíntota vertical', 'Função descontínua'].filter(
                (w) => w !== corr,
              );
              return rmcq(
                rng,
                t`$f$ é derivável, $f'(${c})=0$, com $f'(x)$ tendo sinal $(${signBefore})$ à esquerda de $${c}$ e sinal $(${signAfter})$ à direita. O ponto $x=${c}$ é:`,
                corr,
                wrongs,
                t`De $(${signBefore})$ para $(${signAfter})$: ${corr.toLowerCase()}.`,
              );
            }),
            mcqS(
              t`A função $f(x)=|x|$ tem um mínimo local (e global) em $x=0$. O que acontece com $f'(0)$?`,
              t`$f'(0)$ não existe, mas $x=0$ ainda é ponto crítico`,
              [t`$f'(0)=0$`, t`$f'(0)=1$`, t`$x=0$ não é ponto crítico`],
              t`Pontos críticos incluem tanto onde $f'(c)=0$ quanto onde $f'(c)$ não existe (no domínio de $f$).`,
            ),
            num(
              t`Para $f(x)=x\,e^{-x}$, a derivada é $f'(x)=(1-x)e^{-x}$. Em qual valor de $x$ ocorre o **máximo** de $f$?`,
              1,
              t`Como $e^{-x}>0$, $f'(x)=0\iff x=1$. Antes de $1$, $f'>0$; depois de $1$, $f'<0$: máximo em $x=1$.`,
            ),
            mcqS(
              t`Qual é a classificação do ponto crítico $x=0$ para $f(x)=x^4$?`,
              t`Mínimo local (e global), pois $f'(x)=4x^3$ muda de $-$ para $+$`,
              [t`Ponto de inflexão, pois o grau é maior que $2$`, t`Máximo local`, t`Não é ponto crítico`],
              t`Para $x<0$, $4x^3<0$; para $x>0$, $4x^3>0$. Há troca de $-$ para $+$, logo é mínimo!`,
            ),
          ],
        },
        {
          card: {
            title: 'Extremos globais e Valor Médio',
            body: t`Em um intervalo **fechado** $[a,\,b]$, toda função contínua atinge um **máximo absoluto (global)** e um **mínimo absoluto** (**Teorema de Weierstrass**).

**Roteiro em $[a,\,b]$**: calcule $f(x)$ nos **pontos críticos** dentro de $(a,\,b)$ **e** nas **extremidades** $a$ e $b$. O maior valor vence; o menor é o mínimo!`,
            example: t`$f(x)=x^2-2x$ em $[0,\,3]$: ponto crítico $f'(x)=2x-2=0\Rightarrow x=1$. Testando: $f(0)=0$, $f(1)=-1$ (**mínimo global**) e $f(3)=3$ (**máximo global**).`,
            tip: t`**Teorema do Valor Médio (TVM)**: existe $c\in(a,\,b)$ onde a inclinação instantânea iguala a taxa média: $f'(c)=\dfrac{f(b)-f(a)}{b-a}$.`,
          },
          exercises: [
            order(
              t`Ordene o roteiro para achar o máximo e o mínimo globais de $f$ contínua em $[a,\,b]$:`,
              [
                t`Achar os pontos críticos de $f$ dentro de $(a,\,b)$`,
                t`Calcular $f(x)$ nos pontos críticos e nas extremidades $a$ e $b$`,
                t`Comparar todos os valores obtidos`,
                t`Escolher o maior como máximo global e o menor como mínimo global`,
              ],
              t`Nunca esqueça de testar as extremidades $a$ e $b$: o máximo global muitas vezes mora na borda do intervalo!`,
            ),
            num(
              t`Qual é o **máximo global** de $f(x)=x^2-2x$ no intervalo fechado $[0,\,3]$?`,
              3,
              t`Ponto crítico: $x=1\implies f(1)=-1$. Extremidades: $f(0)=0$ e $f(3)=9-6=3$. Maior valor: $3$.`,
            ),
            num(
              t`E qual é o **mínimo global** de $f(x)=x^2-2x$ no mesmo intervalo $[0,\,3]$?`,
              -1,
              t`Comparando $f(0)=0$, $f(1)=-1$ e $f(3)=3$, o menor valor é $-1$ (atingido em $x=1$).`,
            ),
            gen((rng) => {
              const a = randInt(rng, 1, 3);
              const b = a + randInt(rng, 2, 4);
              // f(x) = x^2 - 2ax on [0, b] => min at x = a is -a^2, max at x = b is b^2 - 2ab (since b >= a+2 > 2a? Wait: if a=3, b=5, b^2-2ab = 25-30 = -5 < 0! So check max(f(0), f(b)))
              const v0 = 0;
              const va = -a * a;
              const vb = b * b - 2 * a * b;
              const mx = Math.max(v0, va, vb);
              return num(
                t`Calcule o valor **máximo global** de $f(x)=x^2-${2 * a}x$ em $[0,\,${b}]$.`,
                mx,
                t`Ponto crítico $x=${a}$ dá $f(${a})=${va}$; nas bordas $f(0)=0$ e $f(${b})=${vb}$. O maior valor é $${mx}$.`,
              );
            }),
            gen((rng) => {
              const b = randInt(rng, 2, 6);
              // TVM for f(x) = x^2 on [0, b]: f'(c) = (b^2 - 0)/b = b => 2c = b => c = b/2
              return num(
                t`Pelo Teorema do Valor Médio, para qual $c\in(0,\,${b})$ a função $f(x)=x^2$ satisfaz $f'(c)=\dfrac{f(${b})-f(0)}{${b}-0}$?`,
                b / 2,
                t`$2c=\frac{${b * b}-0}{${b}}=${b}\implies c=${fmt(b / 2)}$. (Para qualquer parábola, o $c$ do TVM é sempre o ponto médio do intervalo!)`,
              );
            }),
            tf(
              t`Se um carro percorre $100$ km em $1$ hora (velocidade média de $100$ km/h), o Teorema do Valor Médio garante que em algum instante o velocímetro marcou exatamente $100$ km/h.`,
              true,
              t`A velocidade instantânea $s'(t)$ deve igualar a velocidade média $\frac{\Delta s}{\Delta t}=100$ km/h em pelo menos um instante.`,
            ),
            mcqS(
              t`O **Teorema de Rolle** (caso particular do TVM) diz que se $f$ é contínua em $[a,\,b]$, derivável em $(a,\,b)$ e $f(a)=f(b)$, então existe $c\in(a,\,b)$ com:`,
              t`$f'(c)=0$`,
              [t`$f(c)=0$`, t`$f''(c)=0$`, t`$f'(c)=1$`],
              t`Se a função sai e chega na mesma altura ($f(a)=f(b)$), em algum ponto entre $a$ e $b$ a tangente precisa ficar horizontal ($f'(c)=0$).`,
            ),
            num(
              t`Qual é o máximo global de $f(x)=x^3-3x$ em $[0,\,2]$?`,
              2,
              t`$f'(x)=3x^2-3=0\implies x=1\in(0,\,2)$. Valores: $f(0)=0$, $f(1)=-2$, $f(2)=8-6=2$. Máximo: $2$.`,
            ),
          ],
        },
      ],
    },
    {
      id: 'c-apl-conc',
      title: 'Concavidade e segunda derivada',
      parts: [
        {
          card: {
            title: 'Segunda derivada e concavidade',
            body: t`A **segunda derivada** $f''(x)=(f'(x))'$ mede como a própria inclinação $f'$ está variando:

• $f''(x)>0$: $f'$ cresce $\implies$ gráfico **côncavo para cima** $\cup$ ("sorriso", fica acima das tangentes)
• $f''(x)<0$: $f'$ decresce $\implies$ gráfico **côncavo para baixo** $\cap$ ("triste", fica abaixo das tangentes)

Na física, se $s(t)$ é a posição, $s'(t)=v(t)$ é a velocidade e $s''(t)=a(t)$ é a **aceleração**!`,
            visual: concavityLab(),
          },
          exercises: [
            inter(
              t`Mova $x_0$ para a região onde $f(x)=\frac{x^3}{3}-x$ é **côncava para cima** ($f''(x_0)>0$, trecho verde).`,
              'plot',
              concavityLab().props,
              (v: any) => v && v.p.x0 > 0.2,
              t`$x_0>0$`,
              t`Para $x_0>0$ temos $f''(x_0)=2x_0>0$: a curva abre para cima ($\cup$).`,
            ),
            tf(
              t`A função $f(x)=e^x$ é côncava para cima em todo $\mathbb R$.`,
              true,
              t`$(e^x)''=e^x>0$ para todo $x\in\mathbb R$: sempre côncava para cima!`,
            ),
            gen((rng) => {
              const c = [randInt(rng, -5, 5), randInt(rng, -5, 5), randInt(rng, -3, 3), randNZ(rng, -2, 2)];
              const d2 = dpoly(dpoly(c));
              const x = randInt(rng, -2, 2);
              const ans = d2[0] + (d2[1] ?? 0) * x;
              return num(
                t`Calcule $f''(${x})$ para $f(x)=${polyTex(c)}$.`,
                ans,
                t`$f'(x)=${polyTex(dpoly(c))}$ e $f''(x)=${polyTex(d2)}\implies f''(${x})=${ans}$.`,
              );
            }),
            mcqS(
              t`Qual é a concavidade de $f(x)=\ln x$ (para $x>0$)?`,
              t`Sempre côncava para baixo, pois $f''(x)=-\frac{1}{x^2}<0$`,
              [
                t`Sempre côncava para cima, pois $\ln x$ é crescente`,
                t`Muda de concavidade em $x=1$`,
                t`Não tem concavidade definida`,
              ],
              t`$f'(x)=x^{-1}>0$ (crescente), mas $f''(x)=-x^{-2}<0$: cresce cada vez mais devagar, logo é côncava para baixo ($\cap$)!`,
            ),
            gen((rng) => {
              const a = randInt(rng, 1, 3);
              const b = randInt(rng, -4, 4);
              const t0 = randInt(rng, 1, 4);
              // s(t) = a t^3 + b t^2 => s''(t) = 6 a t + 2 b
              const ans = 6 * a * t0 + 2 * b;
              return num(
                t`A posição de uma partícula é $s(t)=${polyTex([0, 0, b, a], 't')}$ (m). Qual é a **aceleração** $a(${t0})=s''(${t0})$?`,
                ans,
                t`$v(t)=${3 * a}t^2${term(2 * b, 't')}$ e $a(t)=${6 * a}t${term(2 * b, '')}\implies a(${t0})=${ans}$ m/s².`,
                { unit: 'm/s²' },
              );
            }),
            match(
              t`Ligue os sinais de $f'$ e $f''$ ao formato do gráfico:`,
              [
                [t`$f'>0$ e $f''>0$`, 'Sobe cada vez mais rápido (côncava p/ cima)'],
                [t`$f'>0$ e $f''<0$`, 'Sobe desacelerando (côncava p/ baixo)'],
                [t`$f'<0$ e $f''>0$`, 'Desce desacelerando (côncava p/ cima)'],
                [t`$f'<0$ e $f''<0$`, 'Desce cada vez mais rápido (côncava p/ baixo)'],
              ],
              t`$f'$ dá a direção (sobe/desce) e $f''$ diz se a inclinação aumenta ou diminui.`,
            ),
            mcqS(
              t`Se um carro está andando para a frente ($v>0$) mas pisando no freio, quais são os sinais de $s'(t)$ e $s''(t)$?`,
              t`$s'(t)>0$ e $s''(t)<0$`,
              [t`$s'(t)<0$ e $s''(t)<0$`, t`$s'(t)>0$ e $s''(t)>0$`, t`$s'(t)=0$ e $s''(t)<0$`],
              t`Andar para a frente significa velocidade positiva ($s'>0$); frear significa aceleração negativa ($s''<0$).`,
            ),
            num(
              t`Para $f(x)=x^4$, quanto vale a **terceira** derivada $f'''(2)$?`,
              48,
              t`$f'=4x^3$, $f''=12x^2$, $f'''=24x\implies f'''(2)=48$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Pontos de inflexão',
            body: t`Um **ponto de inflexão** é onde a curva **muda de concavidade** (de $\cup$ para $\cap$ ou vice-versa), ou seja, onde $f''(x)$ **troca de sinal**.

Para achar: resolva $f''(x)=0$ e confirme que o sinal de $f''$ muda de um lado para o outro!`,
            example: t`$f(x)=x^3-6x^2+1$: $f'(x)=3x^2-12x$ e $f''(x)=6x-12=6(x-2)$. Em $x=2$, $f''$ muda de $-$ para $+$: ponto de inflexão!`,
            tip: t`Cuidado: $f''(c)=0$ sozinho não garante inflexão! Em $f(x)=x^4$, $f''(x)=12x^2$ zera em $x=0$, mas continua $\ge0$ dos dois lados (é mínimo, não inflexão).`,
          },
          exercises: [
            num(
              t`Onde está o ponto de inflexão de $f(x)=x^3-6x^2+1$?`,
              2,
              t`$f''(x)=6x-12=0\Rightarrow x=2$ (e $f''$ troca de sinal em $x=2$).`,
            ),
            gen((rng) => {
              const a = randNZ(rng, -5, 5);
              // f(x) = x^3 - 3 a x^2 => f''(x) = 6x - 6a = 0 => x = a
              return num(
                t`Encontre a abscissa $x$ do ponto de inflexão de $f(x)=x^3${term(-3 * a, 'x^2')}+4x$.`,
                a,
                t`$f'(x)=3x^2${term(-6 * a, 'x')}+4$ e $f''(x)=6x${term(-6 * a, '')}=0\implies x=${a}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 5);
              return rmcq(
                rng,
                t`Em qual intervalo $f(x)=x^3-${3 * a}x^2$ é **côncava para baixo**?`,
                t`$(-\infty,\,${a})$`,
                [
                  t`$(${a},\,\infty)$`,
                  t`$(-\infty,\,${3 * a})$`,
                  t`$(0,\,${a})$`,
                  t`$(-${a},\,${a})$`,
                ],
                t`$f''(x)=6x-${6 * a}<0\iff x<${a}$.`,
              );
            }),
            tf(
              t`Se $f''(c)=0$, então $x=c$ é obrigatoriamente um ponto de inflexão.`,
              false,
              t`Falso! Em $f(x)=x^4$, $f''(0)=0$, mas $f''(x)=12x^2\ge0$ não troca de sinal (a curva é côncava para cima dos dois lados).`,
            ),
            mcqS(
              t`No gráfico de uma função suave, o que acontece com a reta tangente exatamente num **ponto de inflexão**?`,
              'A reta tangente atravessa (cruza) a curva de um lado para o outro',
              [
                'A reta tangente é sempre horizontal',
                'A reta tangente não existe',
                'A curva fica inteiramente acima da tangente',
              ],
              t`De um lado a curva é $\cap$ (abaixo da tangente) e do outro é $\cup$ (acima da tangente): a tangente cruza o gráfico!`,
            ),
            num(
              t`Quantos pontos de inflexão tem o polinômio $f(x)=x^4-6x^2$?`,
              2,
              t`$f''(x)=12x^2-12=12(x-1)(x+1)$, que troca de sinal em $x=-1$ e em $x=1$: são $2$ pontos de inflexão.`,
            ),
            mcqS(
              t`Para uma função cúbica $f(x)=ax^3+bx^2+cx+d$ (com $a\ne0$) que possui máximo local em $x_1$ e mínimo local em $x_2$, onde fica o ponto de inflexão?`,
              t`Exatamente no ponto médio $\frac{x_1+x_2}{2}$`,
              [t`Em $x=0$ sempre`, t`Em $x_1\cdot x_2$`, t`Cúbicas nunca têm ponto de inflexão`],
              t`As raízes de $f'(x)=3ax^2+2bx+c$ têm soma $-\frac{2b}{3a}$, então a média é $-\frac{b}{3a}$, que é justamente onde $f''(x)=6ax+2b=0$!`,
            ),
            num(
              t`Se uma função cúbica tem máximo local em $x=1$ e mínimo local em $x=5$, em que valor de $x$ fica seu ponto de inflexão?`,
              3,
              t`Pela simetria da cúbica, fica no ponto médio: $\frac{1+5}{2}=3$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Teste da 2ª derivada',
            body: t`Em vez de montar quadro de sinais de $f'$, você pode classificar um ponto crítico $f'(c)=0$ olhando a concavidade em $c$:

• $f'(c)=0$ e $f''(c)>0$ (tangente horizontal + côncava p/ cima $\cup$) $\implies$ **mínimo local**
• $f'(c)=0$ e $f''(c)<0$ (tangente horizontal + côncava p/ baixo $\cap$) $\implies$ **máximo local**
• $f'(c)=0$ e $f''(c)=0\implies$ **inconclusivo** (volte ao teste da 1ª derivada!)`,
            example: t`$f(x)=x^3-3x$: pontos críticos $x=\pm1$ e $f''(x)=6x$.
• Em $x=1$: $f''(1)=6>0\implies$ **mínimo local**
• Em $x=-1$: $f''(-1)=-6<0\implies$ **máximo local**.`,
          },
          exercises: [
            mcq(
              t`Se $f'(2)=0$ e $f''(2)=-3$, então $x=2$ é…`,
              ['máximo local', 'mínimo local', 'ponto de inflexão', 'nada se pode afirmar'],
              0,
              t`Tangente horizontal ($f'(2)=0$) com concavidade para baixo ($f''(2)<0$, "triste" $\cap$) garante um topo: **máximo local**.`,
            ),
            fill(
              t`Complete o Teste da 2ª Derivada num ponto com $f'(c)=0$:`,
              t`Se $f''(c)>0$, temos um ___ local; se $f''(c)<0$, temos um ___ local.`,
              ['mínimo', 'máximo'],
              ['inflexão', 'zero', 'limite'],
              t`$f''>0$ é sorriso ($\cup$, fundo do vale = mínimo); $f''<0$ é boca para baixo ($\cap$, topo = máximo).`,
            ),
            gen((rng) => {
              const c = randInt(rng, -4, 5);
              const s2 = randNZ(rng, -8, 8);
              const isMin = s2 > 0;
              return rmcq(
                rng,
                t`Sabendo que $f'(${c})=0$ e $f''(${c})=${s2}$, o teste da 2ª derivada garante que $x=${c}$ é:`,
                isMin ? 'Ponto de mínimo local' : 'Ponto de máximo local',
                [
                  isMin ? 'Ponto de máximo local' : 'Ponto de mínimo local',
                  'Ponto de inflexão',
                  'Teste inconclusivo',
                  'Ponto de descontinuidade',
                ],
                isMin
                  ? t`$f''(${c})=${s2}>0$ ($\cup$): mínimo local.`
                  : t`$f''(${c})=${s2}<0$ ($\cap$): máximo local.`,
              );
            }),
            mcqS(
              t`Se $f'(c)=0$ e $f''(c)=0$, o que o Teste da 2ª Derivada permite concluir?`,
              'Nada (o teste é inconclusivo: pode ser mínimo, máximo ou inflexão)',
              [
                'Que $c$ é com certeza ponto de inflexão',
                'Que $c$ não é nem máximo nem mínimo',
                'Que $f$ é constante',
              ],
              t`Com $f'(0)=f''(0)=0$, $x^4$ tem mínimo, $-x^4$ tem máximo e $x^3$ tem inflexão! É preciso olhar a troca de sinal de $f'$.`,
            ),
            gen((rng) => {
              const r = randInt(rng, 1, 4);
              // f(x) = x^3 - 3 r^2 x => min at x = r, max at x = -r
              return num(
                t`Usando $f''(x)$, determine em qual valor de $x$ a função $f(x)=x^3-${3 * r * r}x$ tem um **máximo local**.`,
                -r,
                t`$f'(x)=3(x^2-${r * r})=0\implies x=\pm${r}$. Como $f''(x)=6x$, temos $f''(-${r})=-${6 * r}<0$ (máximo local em $x=-${r}$).`,
              );
            }),
            gen((rng) => {
              const r = randInt(rng, 1, 4);
              return num(
                t`E em qual valor de $x$ a função $f(x)=x^3-${3 * r * r}x$ tem um **mínimo local**?`,
                r,
                t`Em $x=${r}$ temos $f'(${r})=0$ e $f''(${r})=${6 * r}>0$: mínimo local!`,
              );
            }),
            mcqS(
              t`Para $f(x)=x+\dfrac{4}{x}$ ($x>0$), temos $f'(x)=1-\dfrac{4}{x^2}$ e $f''(x)=\dfrac{8}{x^3}$. No ponto crítico $x=2$:`,
              t`$f''(2)=1>0$, logo $x=2$ é ponto de mínimo local`,
              [
                t`$f''(2)=1>0$, logo $x=2$ é ponto de máximo local`,
                t`$f''(2)=0$, teste inconclusivo`,
                t`$f''(2)=-1<0$, logo $x=2$ é ponto de máximo local`,
              ],
              t`Em $x=2$: $f'(2)=0$ e $f''(2)=\frac{8}{8}=1>0\implies$ mínimo local (com valor $f(2)=4$).`,
            ),
            tf(
              t`Uma parábola $f(x)=ax^2+bx+c$ com $a>0$ tem $f''(x)=2a>0$ constante, por isso seu único ponto crítico é um mínimo.`,
              true,
              t`Isso explica pelo Cálculo por que parábola com $a>0$ tem concavidade para cima e vértice de mínimo!`,
            ),
          ],
        },
      ],
    },
    {
      id: 'c-apl-otim',
      title: 'Otimização',
      parts: [
        {
          card: {
            title: 'Transformando problemas em derivadas',
            body: t`Otimizar é encontrar o **melhor** projeto (maior volume, menor custo, maior alcance). O roteiro é sempre o mesmo:

1. Nomeie as variáveis e escreva a grandeza que quer **maximizar ou minimizar**
2. Use a **restrição** do problema para eliminar variáveis até sobrar **uma só variável**
3. Derive, iguale a zero ($f'(x)=0$) e confirme que é o extremo desejado!`,
            visual: boxLab(),
            example: t`Caixa sem tampa feita de uma folha $12\times12$ cortando quadrados $c$ nos cantos: $V(c)=c(12-2c)^2$. Derivando: $V'(c)=(12-2c)(12-6c)=0\implies c=2$ (máximo $V=128$).`,
          },
          exercises: [
            inter(
              t`Ajuste o corte $c$ até encontrar o **volume máximo** da caixa ($V=128$).`,
              'plot',
              boxLab().props,
              (v: any) => v && near(v.p.c, 2, 0.051),
              t`$c=2$`,
              t`Com $c=2$, a base fica $8\times8$ e altura $2$, dando volume máximo $V=2\cdot 64=128$.`,
            ),
            order(
              t`Ordene os passos de um problema de otimização:`,
              [
                'Desenhar e nomear as variáveis',
                'Escrever a função a otimizar',
                'Reduzir a uma variável usando a restrição',
                'Derivar e igualar a zero',
                'Verificar se é máximo/mínimo',
              ],
              t`O passo decisivo é usar a restrição para ficar com uma função de **uma única** variável antes de derivar.`,
            ),
            num(
              t`Dois números positivos somam $20$. Qual o **maior produto** possível entre eles?`,
              100,
              t`$P(x)=x(20-x)=20x-x^2\implies P'(x)=20-2x=0\Rightarrow x=10$, produto $10\cdot10=100$.`,
            ),
            gen((rng) => {
              const S = randInt(rng, 4, 15) * 2;
              const half = S / 2;
              return num(
                t`Dois números reais positivos têm soma $x+y=${S}$. Qual é o valor de $x$ que **maximiza** o produto $P=x\cdot y$?`,
                half,
                t`$P(x)=x(${S}-x)=${S}x-x^2\implies P'(x)=${S}-2x=0\implies x=${half}$ (os dois números iguais!).`,
              );
            }),
            num(
              t`Uma bola é lançada para cima com altura $h(t)=-5t^2+20t$ (m). Qual a **altura máxima** atingida?`,
              20,
              t`$h'(t)=-10t+20=0\Rightarrow t=2$ s $\implies h(2)=-5(4)+40=20$ m.`,
              { unit: 'm' },
            ),
            gen((rng) => {
              const k = randInt(rng, 1, 5);
              const v0 = 10 * k;
              // h(t) = -5t^2 + v0 t => h'(t) = -10t + v0 = 0 => t = k, h_max = 5 k^2
              return num(
                t`Um projétil sobe segundo $h(t)=-5t^2+${v0}t$ (m). Qual a altura máxima atingida?`,
                5 * k * k,
                t`$h'(t)=-10t+${v0}=0\implies t=${k}$ s, e $h(${k})=-5(${k * k})+${v0 * k}=${5 * k * k}$ m.`,
                { unit: 'm' },
              );
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 7);
              // f(x) = x + k^2 / x for x > 0 => min at x = k, value = 2k
              return num(
                t`Para $x>0$, qual é o **menor valor** possível da soma $S(x)=x+\dfrac{${k * k}}{x}$?`,
                2 * k,
                t`$S'(x)=1-\frac{${k * k}}{x^2}=0\implies x=${k}$. O valor mínimo é $S(${k})=${k}+\frac{${k * k}}{${k}}=${2 * k}$.`,
              );
            }),
            mcqS(
              t`Queremos maximizar $P=x^2y$ sabendo que $x+y=12$ ($x,y>0$). Substituindo $y=12-x$, qual função de uma variável devemos derivar?`,
              t`$P(x)=12x^2-x^3$`,
              [t`$P(x)=12x-x^2$`, t`$P(x)=x^2+12-x$`, t`$P(x)=2x(12-x)$`],
              t`$P(x)=x^2(12-x)=12x^2-x^3$. (Derivando: $24x-3x^2=0\implies x=8$ e $y=4$.)`,
            ),
          ],
        },
        {
          card: {
            title: 'Geometria: cercas e terrenos',
            body: t`Problemas clássicos de engenharia civil envolvem cercar áreas com o menor gasto de tela:

• **Retângulo livre** ($2x+2y=L$): a maior área é sempre o **quadrado** ($x=y=L/4$)
• **Retângulo encostado num muro/rio** (só $3$ lados de cerca: $2x+y=L$): a área $A=x(L-2x)$ é máxima quando $y=2x$ (o lado paralelo ao muro vale o dobro do lateral!)`,
            example: t`Com $L=40$ m de tela e um muro num lado: $A(x)=x(40-2x)=40x-2x^2\implies A'(x)=40-4x=0\implies x=10$ m, $y=20$ m e $A_{\text{máx}}=200$ m².`,
          },
          exercises: [
            num(
              t`Um retângulo tem área fixa igual a $64$ m². Qual é o **menor perímetro** possível?`,
              32,
              t`$P(x)=2x+\frac{128}{x}\implies P'(x)=2-\frac{128}{x^2}=0\Rightarrow x=8$ m (quadrado $8\times8$), perímetro $4\cdot8=32$ m.`,
              { unit: 'm' },
            ),
            gen((rng) => {
              const s = randInt(rng, 3, 12);
              const L = 4 * s;
              return num(
                t`Com $${L}$ m de tela para cercar os $4$ lados de um terreno retangular, qual é a **maior área** possível?`,
                s * s,
                t`$2x+2y=${L}\Rightarrow y=${2 * s}-x$. $A(x)=${2 * s}x-x^2\implies x=${s}$ (quadrado $${s}\times${s}$), área $${s * s}$ m².`,
                { unit: 'm²' },
              );
            }),
            gen((rng) => {
              const xOpt = randInt(rng, 5, 25);
              const L = 4 * xOpt;
              // 2x + y = L => A(x) = x(L - 2x), A'(x) = L - 4x = 0 => x = xOpt, y = 2*xOpt, Area = 2 * xOpt^2
              return num(
                t`Um fazendeiro tem $${L}$ m de cerca para fechar $3$ lados de um curral retangular (o 4º lado é um muro já pronto). Qual a **área máxima** do curral?`,
                2 * xOpt * xOpt,
                t`$2x+y=${L}\implies A(x)=x(${L}-2x)=${L}x-2x^2$. $A'(x)=${L}-4x=0\implies x=${xOpt}$ m, $y=${2 * xOpt}$ m e $A=${2 * xOpt * xOpt}$ m².`,
                { unit: 'm²' },
              );
            }),
            mcqS(
              t`No problema do curral encostado num muro ($2x+y=L$), qual é a relação entre os lados no ponto de área máxima?`,
              t`$y=2x$ (o lado paralelo ao muro é o dobro do lado perpendicular)`,
              [t`$y=x$ (sempre um quadrado)`, t`$y=3x$`, t`$y=\frac{x}{2}$`],
              t`Como não gastamos cerca no muro, vale a pena esticar o retângulo ao longo do muro até $y=2x$!`,
            ),
            gen((rng) => {
              const k = randInt(rng, 3, 9);
              const A = k * k;
              return num(
                t`Qual deve ser o lado $x$ de um terreno retangular de área $${A}$ m² para que o comprimento total de cerca ($2x+2y$) seja **mínimo**?`,
                k,
                t`$P(x)=2x+\frac{${2 * A}}{x}\implies P'(x)=2-\frac{${2 * A}}{x^2}=0\implies x^2=${A}\implies x=${k}$ m.`,
                { unit: 'm' },
              );
            }),
            num(
              t`Uma janela tem formato de retângulo de base $x$ e perímetro $12$ m. Se a área é $A(x)=6x-x^2$, qual a base $x$ que maximiza a entrada de luz?`,
              3,
              t`$A'(x)=6-2x=0\implies x=3$ m.`,
              { unit: 'm' },
            ),
            mcqS(
              t`Dentre todos os retângulos de mesmo perímetro, aquele que possui a **maior área** é sempre:`,
              'O quadrado',
              ['Um retângulo com base igual ao dobro da altura', 'Um retângulo áureo', 'Depende do valor do perímetro'],
              t`Maximizar $x(\frac{P}{2}-x)$ sempre leva a $x=\frac{P}{4}$, logo base $=$ altura.`,
            ),
            num(
              t`Qual é a menor distância vertical entre a parábola $y=x^2+2$ e a reta $y=2x$? (Minimize $D(x)=x^2+2-2x$.)`,
              1,
              t`$D'(x)=2x-2=0\implies x=1$, onde a distância vertical vale $D(1)=1+2-2=1$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Embalagens, custos e engenharia',
            body: t`Na indústria, derivadas reduzem o gasto de material e maximizam o lucro:

• **Caixa sem tampa** de folha $L\times L$: corte ótimo $c=\dfrac{L}{6}$
• **Custo e Lucro**: o lucro $L(x)=R(x)-C(x)$ é máximo quando $L'(x)=0$, isto é, **receita marginal $=$ custo marginal** ($R'(x)=C'(x)$)!`,
            example: t`Se o custo de uma peça em função do lote $x$ é $C(x)=x^2-40x+500$, o custo mínimo ocorre em $C'(x)=2x-40=0\implies x=20$.`,
          },
          exercises: [
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              const L = 6 * k;
              return num(
                t`Uma folha quadrada de papelão mede $${L}\times${L}$ cm. Cortando quadrados de lado $c$ nos $4$ cantos e dobrando, qual valor de $c$ **maximiza** o volume $V(c)=c(${L}-2c)^2$?`,
                k,
                t`$V'(c)=(${L}-2c)(${L}-6c)=0$. Como $c=\frac{${L}}{2}=${3 * k}$ zera a caixa, o máximo ocorre em $c=\frac{${L}}{6}=${k}$ cm.`,
                { unit: 'cm' },
              );
            }),
            gen((rng) => {
              const qOpt = randInt(rng, 10, 40);
              const c0 = randInt(rng, 100, 500);
              return num(
                t`O custo de operação de uma máquina é $C(x)=x^2-${2 * qOpt}x+${c0}$. Qual valor de $x$ **minimiza** o custo?`,
                qOpt,
                t`$C'(x)=2x-${2 * qOpt}=0\implies x=${qOpt}$ (e $C''(x)=2>0$, confirmando mínimo).`,
              );
            }),
            mcqS(
              t`Se $R(x)$ é a receita e $C(x)$ é o custo de produzir $x$ unidades, o lucro $L(x)=R(x)-C(x)$ atinge seu ponto crítico quando:`,
              t`$R'(x)=C'(x)$ (receita marginal igual ao custo marginal)`,
              [t`$R(x)=C(x)$ (receita igual ao custo)`, t`$C'(x)=0$`, t`$R''(x)=C''(x)$`],
              t`$L'(x)=R'(x)-C'(x)=0\iff R'(x)=C'(x)$.`,
            ),
            num(
              t`Uma fábrica vende $x$ unidades com lucro $L(x)=-x^2+60x-200$ (em mil reais). Quantas unidades maximizam o lucro?`,
              30,
              t`$L'(x)=-2x+60=0\implies x=30$ unidades.`,
            ),
            mcqS(
              t`Uma lata cilíndrica fechada deve ter volume fixo $V=\pi r^2h$. Minimizando a área total de alumínio $A=2\pi r^2+2\pi rh$, descobre-se que a lata mais econômica tem:`,
              t`Altura igual ao diâmetro ($h=2r$)`,
              [t`Altura igual ao raio ($h=r$)`, t`Altura igual ao triplo do raio ($h=3r$)`, t`Raio igual ao dobro da altura ($r=2h$)`],
              t`Substituindo $h=\frac{V}{\pi r^2}$: $A(r)=2\pi r^2+\frac{2V}{r}$. $A'(r)=4\pi r-\frac{2V}{r^2}=0\implies V=2\pi r^3\implies \pi r^2h=2\pi r^3\implies h=2r$!`,
            ),
            num(
              t`Para construir uma caixa de base quadrada $x\times x$, o custo da base é $4x^2$ e o das laterais é $\dfrac{64}{x}$. Qual lado $x>0$ minimiza o custo total $C(x)=4x^2+\dfrac{64}{x}$?`,
              2,
              t`$C'(x)=8x-\frac{64}{x^2}=0\implies 8x^3=64\implies x^3=8\implies x=2$.`,
            ),
            gen((rng) => {
              const r = randInt(rng, 2, 5);
              // C(x) = x^3 / 3 + ... wait: C(x) = x^2 + (2 r^3) / x => C'(x) = 2x - 2 r^3 / x^2 = 0 => x^3 = r^3 => x = r
              const k = 2 * r * r * r;
              return num(
                t`Minimize a função custo $C(x)=x^2+\dfrac{${k}}{x}$ para $x>0$. Qual o valor ótimo de $x$?`,
                r,
                t`$C'(x)=2x-\frac{${k}}{x^2}=0\implies 2x^3=${k}\implies x^3=${r * r * r}\implies x=${r}$.`,
              );
            }),
            num(
              t`A potência dissipada num resistor de carga $R$ ligado a uma fonte com resistência interna de $4\ \Omega$ é máxima quando $P'(R)=\dfrac{E^2(4-R)}{(R+4)^3}=0$. Qual deve ser o valor de $R$?`,
              4,
              t`Teorema da Máxima Transferência de Potência: $4-R=0\implies R=4\ \Omega$ (igual à resistência interna da fonte!).`,
              { unit: 'Ω' },
            ),
          ],
        },
      ],
    },
    {
      id: 'c-apl-lhop',
      title: 'Regra de L’Hôpital',
      parts: [
        {
          card: {
            title: 'Destravando 0/0 e ∞/∞',
            body: t`Quando um limite $\lim_{x\to a}\dfrac{f(x)}{g(x)}$ cai nas indeterminações $\dfrac{0}{0}$ ou $\dfrac{\infty}{\infty}$, a razão entre as funções se comporta como a razão entre suas **inclinações**:

$$\lim_{x\to a}\frac{f(x)}{g(x)}=\lim_{x\to a}\frac{f'(x)}{g'(x)}$$

Atenção: **não** é a regra do quociente! Derive o numerador e o denominador **separadamente**.`,
            visual: lhopZoomLab(),
            example: t`$\lim_{x\to0}\dfrac{e^{2x}-1}{x}\stackrel{0/0}{=}\lim_{x\to0}\dfrac{2e^{2x}}{1}=2$ e $\lim_{x\to1}\dfrac{\ln x}{x-1}\stackrel{0/0}{=}\lim_{x\to1}\dfrac{1/x}{1}=1$.`,
          },
          exercises: [
            inter(
              t`Diminua $h$ até $0{,}1$ para ver que perto de $x=0$ a razão $\dfrac{e^{2x}-1}{\operatorname{sen}x}$ se aproxima da razão entre as derivadas $\dfrac{2}{1}=2$.`,
              'plot',
              lhopZoomLab().props,
              (v: any) => v && v.p.h <= 0.15,
              t`$h=0{,}1$`,
              t`Perto de um zero comum, cada curva parece sua reta tangente, então a razão das alturas tende à razão das inclinações!`,
            ),
            tf(
              t`A Regra de L'Hôpital pode ser usada em qualquer limite de quociente $\lim\frac{f(x)}{g(x)}$.`,
              false,
              t`Cuidado! Só vale quando o quociente é uma indeterminação do tipo $\frac{0}{0}$ ou $\frac{\infty}{\infty}$. Se não for indeterminado, L'Hôpital dá resultado errado!`,
            ),
            num(
              t`Calcule $\lim_{x\to1}\dfrac{\ln x}{x-1}$.`,
              1,
              t`Indeterminação $\frac00$: $\lim_{x\to1}\frac{1/x}{1}=1$.`,
            ),
            num(
              t`Calcule $\lim_{x\to0}\dfrac{e^{2x}-1}{x}$.`,
              2,
              t`Indeterminação $\frac00$: $\lim_{x\to0}\frac{2e^{2x}}{1}=2$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 7);
              const b = randInt(rng, 1, 5);
              return num(
                t`Usando L'Hôpital, calcule $\lim_{x\to0}\dfrac{e^{${a}x}-1}{${b}x}$.`,
                a / b,
                t`$\frac00\implies \lim_{x\to0}\frac{${a}e^{${a}x}}{${b}}=\frac{${a}}{${b}}=${fmt(a / b)}$.`,
                { tol: 0.005 },
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 8);
              const b = randInt(rng, 1, 4);
              return num(
                t`Calcule $\lim_{x\to0}\dfrac{\operatorname{sen}(${a}x)}{${b}x}$.`,
                a / b,
                t`$\frac00\implies \lim_{x\to0}\frac{${a}\cos(${a}x)}{${b}}=\frac{${a}}{${b}}=${fmt(a / b)}$.`,
                { tol: 0.005 },
              );
            }),
            mcqS(
              t`Um aluno aplicou L'Hôpital em $\lim_{x\to0}\dfrac{\cos x}{x+1}$ e escreveu $\lim_{x\to0}\dfrac{-\operatorname{sen}x}{1}=0$. Qual foi o erro?`,
              t`O limite original não era indeterminado: bastava substituir $x=0$ para achar $\frac{1}{1}=1$`,
              [
                t`A derivada de $\cos x$ é $+\operatorname{sen}x$`,
                t`Deveria ter usado a regra do quociente`,
                t`O cálculo está correto e o limite vale $0$`,
              ],
              t`Sempre teste a substituição direta primeiro! Em $x=0$, $\frac{\cos 0}{0+1}=\frac11=1$ (não é $\frac00$).`,
            ),
            gen((rng) => {
              const n = randInt(rng, 2, 6);
              const a = randInt(rng, 1, 3);
              return num(
                t`Calcule $\lim_{x\to${a}}\dfrac{x^{${n}}-${Math.pow(a, n)}}{x-${a}}$ derivando em cima e embaixo.`,
                n * Math.pow(a, n - 1),
                t`$\frac00\implies \lim_{x\to${a}}\frac{${n}x^{${n - 1}}}{1}=${n}\cdot${a}^{${n - 1}}=${n * Math.pow(a, n - 1)}$.`,
              );
            }),
          ],
        },
        {
          card: {
            title: 'Aplicações repetidas e infinito',
            body: t`Se após derivar em cima e embaixo o limite **ainda** der $\dfrac{0}{0}$ ou $\dfrac{\infty}{\infty}$, você pode aplicar L'Hôpital **de novo**!

No infinito ($x\to\infty$), L'Hôpital confirma a hierarquia de crescimento:
• $\lim_{x\to\infty}\dfrac{x^n}{e^x}=0$ (a exponencial vence qualquer potência)
• $\lim_{x\to\infty}\dfrac{\ln x}{x^p}=0$ para $p>0$ (o logaritmo cresce mais devagar que qualquer potência)`,
            example: t`$\lim_{x\to0}\dfrac{1-\cos x}{x^2}\stackrel{0/0}{=}\lim_{x\to0}\dfrac{\operatorname{sen}x}{2x}\stackrel{0/0}{=}\lim_{x\to0}\dfrac{\cos x}{2}=\dfrac{1}{2}$.`,
          },
          exercises: [
            num(
              t`Calcule $\lim_{x\to0}\dfrac{1-\cos x}{x^2}$.`,
              0.5,
              t`Aplicando L'Hôpital duas vezes: $\lim_{x\to0}\frac{\operatorname{sen}x}{2x}=\lim_{x\to0}\frac{\cos x}{2}=\frac12=0{,}5$.`,
            ),
            mcqS(
              t`$\lim_{x\to\infty}\dfrac{x^2}{e^x}$ vale:`,
              '$0$',
              ['$\\infty$', '$1$', '$2$'],
              t`Duas vezes L'Hôpital ($\frac{\infty}{\infty}$): $\lim\frac{2x}{e^x}=\lim\frac{2}{e^x}=0$. A exponencial ganha de qualquer polinômio.`,
            ),
            mcqS(
              t`Calcule $\lim_{x\to\infty}\dfrac{\ln x}{x}$.`,
              '$0$',
              ['$1$', '$\\infty$', '$e$'],
              t`Forma $\frac{\infty}{\infty}$: $\lim_{x\to\infty}\frac{1/x}{1}=\lim_{x\to\infty}\frac{1}{x}=0$.`,
            ),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              // lim_{x->0} (1 - cos(kx)) / x^2 = k^2 / 2
              return num(
                t`Calcule $\lim_{x\to0}\dfrac{1-\cos(${k}x)}{x^2}$.`,
                (k * k) / 2,
                t`1ª vez: $\lim\frac{${k}\operatorname{sen}(${k}x)}{2x}$. 2ª vez: $\lim\frac{${k * k}\cos(${k}x)}{2}=\frac{${k * k}}{2}=${fmt((k * k) / 2)}$.`,
              );
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              // lim_{x->0} (e^{ax} - 1 - ax) / x^2 = a^2 / 2
              return num(
                t`Aplicando L'Hôpital duas vezes, calcule $\lim_{x\to0}\dfrac{e^{${a}x}-1-${a}x}{x^2}$.`,
                (a * a) / 2,
                t`1ª vez: $\lim\frac{${a}e^{${a}x}-${a}}{2x}$. 2ª vez: $\lim\frac{${a * a}e^{${a}x}}{2}=\frac{${a * a}}{2}=${fmt((a * a) / 2)}$.`,
              );
            }),
            num(
              t`Calcule $\lim_{x\to0}\dfrac{x-\operatorname{sen}x}{x^3}$ (responda em fração ou decimal).`,
              1 / 6,
              t`Três vezes L'Hôpital: $\frac{1-\cos x}{3x^2}\to\frac{\operatorname{sen}x}{6x}\to\frac{\cos x}{6}\to\frac16$.`,
              { tol: 0.002 },
            ),
            mcqS(
              t`Quantas vezes precisamos aplicar L'Hôpital para eliminar a potência do numerador em $\lim_{x\to\infty}\dfrac{x^3}{e^x}$?`,
              '$3$ vezes (até $x^3\to 3x^2\to 6x\to 6$)',
              ['$1$ vez', '$2$ vezes', 'Infinitas vezes'],
              t`Cada derivada reduz o grau de $x^3$ em $1$, enquanto $e^x$ permanece $e^x$: $\lim\frac{6}{e^x}=0$.`,
            ),
            num(
              t`Calcule $\lim_{x\to\infty}\dfrac{4x^2+5x}{2x^2-3}$ usando L'Hôpital.`,
              2,
              t`$\lim\frac{8x+5}{4x}=\lim\frac{8}{4}=2$.`,
            ),
          ],
        },
        {
          card: {
            title: 'Outras formas: 0·∞, ∞−∞ e 1^∞',
            body: t`Outras indeterminações precisam ser **reescritas** como quociente $\frac00$ ou $\frac\infty\infty$ antes de usar L'Hôpital:

• **Produto $0\cdot\infty$**: passe um fator para baixo: $f\cdot g = \dfrac{f}{1/g}$
• **Diferença $\infty-\infty$**: tire o MMC e junte numa fração só
• **Potências $1^\infty$, $0^0$, $\infty^0$**: tome o logaritmo $\ln y = g(x)\ln f(x)$ (que vira $0\cdot\infty$) e no final faça $y=e^L$!`,
            example: t`$\lim_{x\to0^+}x\ln x=\lim_{x\to0^+}\dfrac{\ln x}{1/x}\stackrel{\infty/\infty}{=}\lim_{x\to0^+}\dfrac{1/x}{-1/x^2}=\lim_{x\to0^+}(-x)=0$.`,
          },
          exercises: [
            match(
              t`Ligue cada indeterminação ao truque algébrico que a prepara para L'Hôpital:`,
              [
                [t`$0\cdot\infty$ (ex.: $x\ln x$)`, t`Reescrever como $\dfrac{f}{1/g}$`],
                [t`$\infty-\infty$ (ex.: $\frac{1}{\operatorname{sen}x}-\frac{1}{x}$)`, 'Juntar no mesmo denominador (MMC)'],
                [t`$1^\infty$ ou $0^0$ (ex.: $x^x$)`, t`Aplicar $\ln$ para descer o expoente`],
                [t`$\dfrac{0}{0}$ ou $\dfrac{\infty}{\infty}$`, 'Pronto para derivar em cima e embaixo'],
              ],
              t`L'Hôpital só atua diretamente em $\frac00$ e $\frac\infty\infty$; todas as outras formas são convertidas para essas duas!`,
            ),
            num(
              t`Calcule $\lim_{x\to0^+}x\ln x$.`,
              0,
              t`Reescreva como $\frac{\ln x}{1/x}$ ($\frac{-\infty}{\infty}$): L'Hôpital dá $\frac{1/x}{-1/x^2}=-x\to 0$.`,
            ),
            mcqS(
              t`Para aplicar L'Hôpital em $\lim_{x\to0^+}x\ln x$ (forma $0\cdot(-\infty)$), qual reescrita funciona bem?`,
              t`$\lim_{x\to0^+}\dfrac{\ln x}{1/x}$`,
              [
                t`Derivar o produto direto: $(x)'(\ln x)'=1\cdot\frac1x$`,
                t`Somar $x+\ln x$`,
                t`Substituir $0\cdot(-\infty)=0$ sem justificativa`,
              ],
              t`Colocar $x$ no denominador como $1/x$ transforma em $\frac{-\infty}{\infty}$ e simplifica após derivar!`,
            ),
            gen((rng) => {
              const k = randInt(rng, 1, 5);
              // lim_{x->inf} x * sen(k/x) = k
              return num(
                t`Calcule $\lim_{x\to\infty}x\operatorname{sen}\left(\dfrac{${k}}{x}\right)$ (forma $\infty\cdot0$, trocando $u=1/x$).`,
                k,
                t`Escrevendo $\frac{\operatorname{sen}(${k}/x)}{1/x}$ (ou $u=1/x\to0^+$): $\lim_{u\to0^+}\frac{\operatorname{sen}(${k}u)}{u}=${k}$.`,
              );
            }),
            mcqS(
              t`Sabendo que $\lim_{x\to0^+}x\ln x=0$, quanto vale $\lim_{x\to0^+}x^x$ (indeterminação $0^0$)?`,
              '$1$',
              ['$0$', '$e$', '$\\infty$'],
              t`$x^x=e^{x\ln x}\to e^0=1$.`,
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              // lim_{x->inf} x * (e^{a/x} - 1) = a
              return num(
                t`Calcule $\lim_{x\to\infty}x\left(e^{${a}/x}-1\right)$.`,
                a,
                t`Com $u=1/x\to0^+$: $\lim_{u\to0^+}\frac{e^{${a}u}-1}{u}\stackrel{0/0}{=}\lim_{u\to0^+}\frac{${a}e^{${a}u}}{1}=${a}$.`,
              );
            }),
            num(
              t`Calcule $\lim_{x\to1}\left(\dfrac{1}{\ln x}-\dfrac{1}{x-1}\right)$ (junte em $\dfrac{x-1-\ln x}{(x-1)\ln x}$ e aplique L'Hôpital duas vezes).`,
              0.5,
              t`1ª vez: $\frac{1-1/x}{\ln x+(x-1)/x}=\frac{x-1}{x\ln x+x-1}$. 2ª vez: $\frac{1}{\ln x+1+1}\xrightarrow{x\to1}\frac12=0{,}5$.`,
            ),
            mcqS(
              t`Para calcular $y=\lim_{x\to\infty}\left(1+\dfrac{3}{x}\right)^x$ (forma $1^\infty$), calculamos $\lim_{x\to\infty}\ln y = \lim_{x\to\infty}\dfrac{\ln(1+3/x)}{1/x} = 3$. Logo o limite original $y$ vale:`,
              t`$e^3$`,
              [t`$3$`, t`$1$`, t`$\ln 3$`],
              t`Como encontramos $\ln y\to 3$, devemos desfazer o logaritmo no final: $y=e^3$.`,
            ),
          ],
        },
      ],
    },
  ],
};

