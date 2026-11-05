import React from 'react';
import type { Unit } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { CircleW, FnCurve, InfLine, Label, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, polyTex } from '../../../lib/random';
import { fnLab } from '../../visuals';

const t = String.raw;

const transformLab = () =>
  fnLab({
    f: (x, p) => p.a * (x - p.h) ** 2 + p.k,
    params: [
      { key: 'a', label: 'a', min: -2, max: 2, step: 0.1, value: 1, color: C.p1 },
      { key: 'h', label: 'h', min: -4, max: 4, step: 0.5, value: 0, color: C.p2 },
      { key: 'k', label: 'k', min: -4, max: 4, step: 0.5, value: 0, color: C.p3 },
    ],
    view: { xMin: -6, xMax: 6, yMin: -5, yMax: 7 },
    ghost: (x) => x * x,
    info: (p) => t`$y=${fmt(p.a)}(x${p.h < 0 ? '+' : '-'}${fmt(Math.abs(p.h))})^2${p.k < 0 ? '-' : '+'}${fmt(Math.abs(p.k))}$ · tracejada: $y=x^2$`,
  });

const approachLab = () =>
  plot({
    view: { xMin: -1, xMax: 3, yMin: -0.5, yMax: 4 },
    params: [{ key: 'd', label: '\\delta', min: 0.001, max: 1, step: 0.001, value: 0.8, color: C.p5 }],
    render: ({ p }: any) => (
      <>
        <FnCurve f={(x) => (Math.abs(x - 1) < 1e-9 ? NaN : (x * x - 1) / (x - 1))} color={C.p2} />
        <CircleW cx={1} cy={2} r={0.06} color={C.p2} fill={C.bgDeep} fillOpacity={1} width={2.5} />
        <Pt x={1 - p.d} y={2 - p.d} color={C.p3} label="esq" dy={18} />
        <Pt x={1 + p.d} y={2 + p.d} color={C.p5} label="dir" />
        <Seg x1={-1} y1={2} x2={3} y2={2} color={C.gold} dash="5 5" width={1} />
      </>
    ),
    info: ({ p }: any) => t`$f(${fmt(1 - p.d, 3)})=${fmt(2 - p.d, 3)}$ · $f(${fmt(1 + p.d, 3)})=${fmt(2 + p.d, 3)}$ ⟹ $\lim_{x\to1}f(x)=2$`,
  });

const jumpLab = () =>
  plot({
    view: { xMin: -3, xMax: 3, yMin: -1, yMax: 4 },
    params: [{ key: 'L', label: 'c', min: 0, max: 3, step: 0.5, value: 2, color: C.p3 }],
    render: ({ p }: any) => (
      <>
        <FnCurve f={(x) => (x < 1 ? 1 + 0 * x : NaN)} to={1} color={C.p2} />
        <FnCurve f={(x) => (x >= 1 ? p.L : NaN)} from={1} color={C.p3} />
        <CircleW cx={1} cy={1} r={0.07} color={C.p2} fill={C.bgDeep} fillOpacity={1} />
        <Pt x={1} y={p.L} color={C.p3} r={5} />
      </>
    ),
    info: ({ p }: any) => (p.L === 1 ? t`$\lim_{x\to1^-}=1=\lim_{x\to1^+}$ ⟹ o limite **existe** (e a função é contínua)` : t`$\lim_{x\to1^-}f=1\ne\lim_{x\to1^+}f=${fmt(p.L)}$ ⟹ limite **não existe**`),
  });

export const funcoesCalc: Unit = {
  id: 'c-func',
  title: 'Funções (revisão para Cálculo)',
  subtitle: 'Domínio, composição, inversa e transformações',
  icon: '🧩',
  source: 'Cálculo I · Unidade 1 — O estudo das funções',
  guide: t`O objeto de estudo do Cálculo são as funções. Antes de derivar e integrar, é preciso dominar domínio, composição, inversa e como transformações mexem no gráfico.`,
  lessons: [
    {
      id: 'c-func-dom',
      title: 'Domínio e imagem',
      cards: [
        {
          title: 'Onde a função existe',
          body: t`**Domínio**: os $x$ permitidos. **Imagem**: os $y$ que a função realmente atinge.

As restrições clássicas:
• denominador $\ne0$: $f(x)=\frac{1}{x-2}$ ⟹ $x\ne2$
• raiz par de algo $\ge0$: $\sqrt{x+3}$ ⟹ $x\ge-3$
• logaritmo de algo $>0$: $\ln(5-x)$ ⟹ $x<5$`,
          example: t`$f(x)=\dfrac{\sqrt{x}}{x-4}$: precisa $x\ge0$ e $x\ne4$ ⟹ $D=[0, 4)\cup(4,\infty)$.`,
        },
      ],
      exercises: [
        mcqS(t`Qual o domínio de $f(x)=\sqrt{x-5}$?`, t`$[5,\,\infty)$`, [t`$(5,\,\infty)$`, t`$\mathbb R$`, t`$(-\infty,\,5]$`]),
        mcqS(t`Qual o domínio de $f(x)=\dfrac{3}{x^2-9}$?`, t`$\mathbb R-\{-3,\,3\}$`, [t`$\mathbb R-\{9\}$`, t`$(-3,\,3)$`, t`$\mathbb R-\{3\}$`], t`$x^2-9=0\iff x=\pm3$.`),
        mcqS(t`Qual o domínio de $f(x)=\ln(2x-6)$?`, t`$(3,\,\infty)$`, [t`$[3,\,\infty)$`, t`$(6,\,\infty)$`, t`$\mathbb R$`], t`$2x-6>0\iff x>3$.`),
        mcqS(t`Qual a imagem de $f(x)=x^2+1$?`, t`$[1,\,\infty)$`, [t`$\mathbb R$`, t`$(1,\,\infty)$`, t`$[0,\,\infty)$`], t`$x^2\ge0\Rightarrow x^2+1\ge1$.`),
        tf(t`A função $f(x)=\frac{1}{x}$ tem domínio $\mathbb R$.`, false, t`$x=0$ não pertence ao domínio.`),
        gen((rng) => {
          const a = randInt(rng, -4, 4);
          const b = randInt(rng, 1, 5);
          const x = randInt(rng, -3, 3);
          return num(t`Se $f(x)=x^2${a < 0 ? '' : '+'}${a}x+${b}$, quanto vale $f(${x})$?`, x * x + a * x + b, t`$(${x})^2${a < 0 ? '' : '+'}${a}\cdot(${x})+${b}=${x * x + a * x + b}$.`);
        }),
      ],
    },
    {
      id: 'c-func-comp',
      title: 'Composição e inversa',
      cards: [
        {
          title: 'Função de função',
          body: t`$(f\circ g)(x)=f(g(x))$: primeiro aplica $g$, depois $f$.

Se $f(x)=x^2$ e $g(x)=x+1$:
• $f(g(x))=(x+1)^2$
• $g(f(x))=x^2+1$ — em geral $f\circ g\neq g\circ f$!`,
          tip: t`A **regra da cadeia** das derivadas é sobre funções compostas. Reconhecer "a de fora" e "a de dentro" é o segredo.`,
        },
        {
          title: 'Inversa',
          body: t`$f^{-1}$ desfaz $f$: $f^{-1}(f(x))=x$. Para achar: troque $x$ e $y$ e isole $y$.

$y=2x+3 \to x=2y+3 \to y=\frac{x-3}{2}$

O gráfico de $f^{-1}$ é o reflexo do de $f$ na reta $y=x$. Só existe inversa se $f$ for **bijetora**.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = randInt(rng, 1, 4);
          const b = randInt(rng, -3, 3);
          const x = randInt(rng, -2, 3);
          return num(t`Sendo $f(x)=x^2$ e $g(x)=${a}x${b < 0 ? '' : '+'}${b}$, calcule $f(g(${x}))$.`, (a * x + b) ** 2, t`$g(${x})=${a * x + b}$ e $f(${a * x + b})=${(a * x + b) ** 2}$.`);
        }),
        mcqS(t`Se $f(x)=\sqrt{x}$ e $g(x)=x^2+9$, quanto é $(f\circ g)(x)$?`, t`$\sqrt{x^2+9}$`, [t`$x+9$`, t`$x+3$`, t`$(\sqrt x)^2+9$`]),
        mcqS(t`Qual a inversa de $f(x)=3x-6$?`, t`$f^{-1}(x)=\frac{x+6}{3}$`, [t`$f^{-1}(x)=\frac{x-6}{3}$`, t`$f^{-1}(x)=3x+6$`, t`$f^{-1}(x)=\frac{1}{3x-6}$`]),
        tf(t`A inversa de $f(x)=e^x$ é $f^{-1}(x)=\ln x$.`, true),
        match(t`Ligue cada função à sua inversa:`, [
          [t`$2x$`, t`$\frac{x}{2}$`],
          [t`$x+5$`, t`$x-5$`],
          [t`$x^3$`, t`$\sqrt[3]{x}$`],
          [t`$10^x$`, t`$\log x$`],
        ]),
      ],
    },
    {
      id: 'c-func-transf',
      title: 'Transformações de gráficos',
      cards: [
        {
          title: 'Deslocar, esticar, refletir',
          body: t`A partir de $y=f(x)$:
• $f(x-h)$: desloca **$h$ para a direita**
• $f(x)+k$: desloca **$k$ para cima**
• $a\,f(x)$: estica verticalmente ($|a|>1$) e reflete se $a<0$

Mexa em $a$, $h$ e $k$ partindo de $y=x^2$:`,
          visual: transformLab(),
        },
      ],
      exercises: [
        mcq(t`O gráfico de $y=(x-3)^2$ é o de $y=x^2$ deslocado…`, ['3 unidades para a direita', '3 unidades para a esquerda', '3 para cima', '3 para baixo'], 0, t`$x-3=0$ em $x=3$: o vértice vai para a direita.`),
        inter(t`Posicione a parábola com vértice em $(2,\,-1)$, mantendo a abertura de $y=x^2$.`, 'plot', transformLab().props, (v: any) => v && near(v.p.a, 1, 0.01) && near(v.p.h, 2, 0.01) && near(v.p.k, -1, 0.01), t`$a=1$, $h=2$, $k=-1$`),
        inter(t`Faça a parábola ficar "triste" (boca para baixo) com vértice em $(-1,\,3)$ e $|a|=1$.`, 'plot', transformLab().props, (v: any) => v && near(v.p.a, -1, 0.01) && near(v.p.h, -1, 0.01) && near(v.p.k, 3, 0.01), t`$a=-1$, $h=-1$, $k=3$`),
        mcqS(t`Qual transformação leva $y=\operatorname{sen}x$ em $y=\operatorname{sen}x+2$?`, '2 unidades para cima', ['2 para a direita', 'amplitude 2', 'período 2']),
        tf(t`O gráfico de $y=-f(x)$ é o reflexo de $y=f(x)$ no eixo $x$.`, true),
      ],
    },
  ],
};

export const limites: Unit = {
  id: 'c-lim',
  title: 'Limites',
  subtitle: 'Aproximação, laterais, infinito e continuidade',
  icon: '🎯',
  source: 'Cálculo I · Unidade 2 — Limites',
  guide: t`Limite responde: de que valor $f(x)$ se aproxima quando $x$ se aproxima de $a$? Não importa o que acontece **em** $a$, só **perto** dele. É a base da derivada e da integral.`,
  lessons: [
    {
      id: 'c-lim-int',
      title: 'Ideia intuitiva e limites laterais',
      cards: [
        {
          title: 'Chegando perto',
          body: t`$f(x)=\frac{x^2-1}{x-1}$ **não existe** em $x=1$ (dá $\frac00$), mas veja os valores quando $x$ se aproxima de 1 pelos dois lados. Diminua $\delta$:`,
          visual: approachLab(),
          formula: t`\lim_{x\to1}\frac{x^2-1}{x-1}=2`,
        },
        {
          title: 'Laterais',
          body: t`$\lim_{x\to a^-}$: pela **esquerda** · $\lim_{x\to a^+}$: pela **direita**.

O limite existe se, e somente se, os laterais existem e são **iguais**. Ajuste o valor $c$ do degrau:`,
          visual: jumpLab(),
        },
      ],
      exercises: [
        inter(t`Diminua $\delta$ até os dois pontos ficarem a menos de $0{,}01$ do valor limite.`, 'plot', approachLab().props, (v: any) => v && v.p.d < 0.01, t`$\delta<0{,}01$`, t`Quanto menor $\delta$, mais perto de 2 ficam as imagens: é isso que "limite igual a 2" significa.`),
        inter(t`Ajuste $c$ para que $\lim_{x\to1}f(x)$ exista.`, 'plot', jumpLab().props, (v: any) => v && near(v.p.L, 1, 0.01), t`$c=1$`),
        tf(t`Para que $\lim_{x\to a}f(x)$ exista, $f$ precisa estar definida em $x=a$.`, false, t`O limite só olha para valores **próximos** de $a$. Ex.: $\frac{x^2-1}{x-1}$ em $a=1$.`),
        mcq(t`Se $\lim_{x\to2^-}f(x)=5$ e $\lim_{x\to2^+}f(x)=3$, então $\lim_{x\to2}f(x)$…`, ['não existe', 'vale 4', 'vale 5', 'vale 3'], 0),
        gen((rng) => {
          const a = randInt(rng, -3, 4);
          const c = randInt(rng, -5, 5);
          return num(t`Calcule $\lim_{x\to${a}}\,(x^2${c < 0 ? '' : '+'}${c})$.`, a * a + c, t`Função polinomial é contínua: basta substituir, $${a}^2${c < 0 ? '' : '+'}${c}=${a * a + c}$.`);
        }),
      ],
    },
    {
      id: 'c-lim-calc',
      title: 'Calculando limites (0/0)',
      cards: [
        {
          title: 'Propriedades e substituição',
          body: t`O limite da soma é a soma dos limites, idem produto e quociente (se o denominador $\ne0$). Para polinômios e funções contínuas: **substitua direto**.

Quando der $\frac00$ (**indeterminação**), simplifique antes:
• **Fatore** e cancele: $\frac{x^2-9}{x-3}=\frac{(x-3)(x+3)}{x-3}=x+3$
• **Racionalize** raízes: multiplique pelo conjugado`,
          example: t`$\lim_{x\to0}\frac{\sqrt{x+4}-2}{x}=\lim\frac{x}{x(\sqrt{x+4}+2)}=\frac14$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = randNZ(rng, -6, 6);
          return num(t`Calcule $\lim_{x\to${a}}\dfrac{x^2-${a * a}}{x${a < 0 ? '+' : '-'}${Math.abs(a)}}$.`, 2 * a, t`Fatore: $\frac{(x-${a})(x+${a})}{x-${a}}=x+${a}$ ⟹ $${a}+${a}=${2 * a}$.`.replace(/\+-/g, '-').replace(/--/g, '+'));
        }),
        gen((rng) => {
          const r1 = randInt(rng, -3, 3);
          let r2 = randInt(rng, -4, 4);
          if (r2 === r1) r2 = r1 + 2;
          return num(t`Calcule $\lim_{x\to${r1}}\dfrac{${polyTex([r1 * r2, -(r1 + r2), 1])}}{x${r1 < 0 ? '+' : '-'}${Math.abs(r1)}}$.`, r1 - r2, t`Numerador $=(x-${r1})(x-${r2})$; cancelando, sobra $x-${r2}$ em $x=${r1}$: $${r1 - r2}$.`.replace(/--/g, '+'));
        }),
        num(t`Calcule $\lim_{x\to0}\dfrac{\sqrt{x+9}-3}{x}$.`, 1 / 6, t`Racionalize: $\frac{x}{x(\sqrt{x+9}+3)}\to\frac16$.`, { tol: 0.002 }),
        mcqS(t`$\lim_{x\to2}\dfrac{x^3-8}{x-2}$ vale:`, '$12$', ['$0$', '$4$', 'não existe'], t`$x^3-8=(x-2)(x^2+2x+4)$ ⟹ $4+4+4=12$.`),
        order(t`Ordene a estratégia para um limite que dá $\frac00$:`, ['Substituir e detectar a indeterminação 0/0', 'Fatorar ou racionalizar', 'Cancelar o fator comum', 'Substituir de novo']),
        tf(t`$\frac00$ significa que o limite é zero.`, false, t`$\frac00$ é uma **indeterminação**: o limite pode ser qualquer coisa; é preciso simplificar.`),
      ],
    },
    {
      id: 'c-lim-inf',
      title: 'Limites infinitos e no infinito',
      cards: [
        {
          title: 'Assíntotas',
          body: t`• $\lim_{x\to a}f(x)=\pm\infty$ ⟹ **assíntota vertical** $x=a$
• $\lim_{x\to\pm\infty}f(x)=L$ ⟹ **assíntota horizontal** $y=L$

Em frações de polinômios com $x\to\infty$, **mandam os termos de maior grau**.`,
          visual: plot({
            view: { xMin: -6, xMax: 6, yMin: -6, yMax: 8 },
            render: () => (
              <>
                <Seg x1={1} y1={-6} x2={1} y2={8} color={C.danger} dash="6 5" width={1.5} />
                <Seg x1={-6} y1={2} x2={6} y2={2} color={C.gold} dash="6 5" width={1.5} />
                <FnCurve f={(x) => (2 * x + 1) / (x - 1)} color={C.p2} />
              </>
            ),
            caption: 'y = (2x+1)/(x−1): vertical x = 1, horizontal y = 2',
          }),
          example: t`$\lim_{x\to\infty}\frac{3x^2+x}{5x^2-2}=\frac35$ e $\lim_{x\to\infty}\frac{x}{x^2+1}=0$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = randInt(rng, 1, 9);
          const b = randInt(rng, 1, 9);
          return num(t`Calcule $\lim_{x\to\infty}\dfrac{${a}x^2+3x}{${b}x^2-1}$.`, a / b, t`Graus iguais: razão dos coeficientes líderes, $\frac{${a}}{${b}}$.`, { tol: 0.005 });
        }),
        mcqS(t`$\lim_{x\to\infty}\dfrac{x+1}{x^3}$ vale:`, '$0$', ['$1$', '$\\infty$', '$\\frac13$'], t`Grau do denominador maior ⟹ tende a 0.`),
        mcqS(t`Qual a assíntota vertical de $f(x)=\dfrac{5}{x+4}$?`, '$x=-4$', ['$x=4$', '$y=0$', '$x=5$']),
        mcqS(t`$\lim_{x\to0^+}\dfrac{1}{x}$ vale:`, '$+\\infty$', ['$-\\infty$', '$0$', '$1$']),
        tf(t`$\lim_{x\to\infty}\left(1+\frac1x\right)^x=e$`, true, t`É um dos limites fundamentais: define o número $e\approx2{,}718$.`),
      ],
    },
    {
      id: 'c-lim-cont',
      title: 'Continuidade e limites fundamentais',
      cards: [
        {
          title: 'Sem tirar o lápis do papel',
          body: t`$f$ é **contínua** em $a$ se:
1. $f(a)$ existe
2. $\lim_{x\to a}f(x)$ existe
3. $\lim_{x\to a}f(x)=f(a)$

Polinômios, exponenciais, seno e cosseno são contínuos em todo $\mathbb R$.`,
        },
        {
          title: 'Os limites fundamentais',
          body: t`$$\lim_{x\to0}\frac{\operatorname{sen}x}{x}=1\qquad\lim_{x\to0}\frac{e^x-1}{x}=1\qquad \lim_{x\to\infty}\left(1+\tfrac1x\right)^x=e$$`,
          visual: plot({
            view: { xMin: -8, xMax: 8, yMin: -0.4, yMax: 1.3 },
            render: () => (
              <>
                <FnCurve f={(x) => (Math.abs(x) < 1e-6 ? NaN : Math.sin(x) / x)} color={C.p5} />
                <CircleW cx={0} cy={1} r={0.12} color={C.p5} fill={C.bgDeep} fillOpacity={1} width={2} />
              </>
            ),
            caption: 'sen(x)/x se aproxima de 1 em x → 0',
          }),
        },
      ],
      exercises: [
        num(t`Calcule $\lim_{x\to0}\dfrac{\operatorname{sen}(3x)}{x}$.`, 3, t`$\frac{\operatorname{sen}3x}{x}=3\cdot\frac{\operatorname{sen}3x}{3x}\to3\cdot1$.`),
        num(t`Calcule $\lim_{x\to0}\dfrac{\operatorname{sen}(5x)}{\operatorname{sen}(2x)}$.`, 2.5, t`$\frac{5}{2}\cdot\frac{\operatorname{sen}5x/5x}{\operatorname{sen}2x/2x}\to\frac52$.`),
        mcq(t`$f(x)=\begin{cases}x^2,&x\ne1\\ 5,&x=1\end{cases}$ é contínua em $x=1$?`, ['Não: o limite é 1, mas f(1) = 5', 'Sim', 'Não: o limite não existe', 'Sim, pois f(1) existe'], 0),
        num(t`Para que valor de $k$ a função $f(x)=\begin{cases}2x+1,&x<2\\ k,&x\ge2\end{cases}$ é contínua?`, 5, t`$\lim_{x\to2^-}(2x+1)=5$, então $k=5$.`),
        tf(t`Toda função polinomial é contínua em todos os reais.`, true),
      ],
    },
  ],
};
