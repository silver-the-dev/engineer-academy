import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcqS, num, tf, match, order, multi, inter, plot, rmcq } from '../../helpers';
import { FnCurve, InfLine, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, fracTex, pick, randInt, randNZ } from '../../../lib/random';

const t = String.raw;
const lg = Math.log10;

/** a^x and log_a x mirrored in y = x. */
const baseLab = (a0 = 2) =>
  plot({
    view: { xMin: -4, xMax: 6, yMin: -4, yMax: 6 },
    equalAspect: true,
    params: [{ key: 'a', label: 'a', min: 0.2, max: 4, step: 0.1, value: a0, color: C.gold }],
    render: ({ p }: any) => {
      const a = p.a;
      const ok = Math.abs(a - 1) > 0.04;
      return (
        <>
          <InfLine x1={0} y1={0} x2={1} y2={1} color={C.textDim} dash="5 5" width={1.5} />
          <FnCurve f={(x) => a ** x} color={C.p2} />
          {ok ? <FnCurve f={(x) => (x > 0 ? Math.log(x) / Math.log(a) : NaN)} from={0.01} to={6} color={C.p5} /> : null}
          <Pt x={0} y={1} color={C.p2} r={4} />
          <Pt x={1} y={0} color={C.p5} r={4} />
        </>
      );
    },
    info: ({ p }: any) => {
      const a = p.a;
      if (Math.abs(a - 1) <= 0.04) return t`$a=1$: $1^x=1$ é constante e não há $\log_1$ — a base precisa ser $\ne1$.`;
      return t`$y=${fmt(a, 1)}^x$ (azul) e $y=\log_{${fmt(a, 1)}}x$ (rosa) são inversas: simétricas em $y=x$ · ${a > 1 ? 'base > 1: ambas crescentes' : '0 < base < 1: ambas decrescentes'}`;
    },
  });

/** Solve a^x > k graphically: the part of the x-axis where the curve is above the level. */
const ineqLab = () =>
  plot({
    view: { xMin: -4, xMax: 4, yMin: -1, yMax: 8 },
    params: [
      { key: 'a', label: 'a', min: 0.2, max: 3, step: 0.1, value: 2, color: C.gold },
      { key: 'k', label: 'k', min: 0.5, max: 7, step: 0.5, value: 4, color: C.p5 },
    ],
    render: ({ p }: any) => {
      const a = p.a;
      if (Math.abs(a - 1) < 0.04) return <FnCurve f={() => 1} color={C.p2} />;
      const x0 = Math.log(p.k) / Math.log(a);
      const right = a > 1;
      return (
        <>
          <FnCurve f={(x) => a ** x} color={C.p2} />
          <InfLine x1={0} y1={p.k} x2={1} y2={p.k} color={C.p5} dash="5 4" />
          <Seg x1={x0} y1={0} x2={right ? 4 : -4} y2={0} color={C.success} width={6} />
          <Pt x={x0} y={p.k} color={C.gold} />
        </>
      );
    },
    info: ({ p }: any) => {
      const a = p.a;
      if (Math.abs(a - 1) < 0.04) return 'Base 1 não serve.';
      const x0 = Math.log(p.k) / Math.log(a);
      return t`$${fmt(a, 1)}^x>${fmt(p.k, 1)}\iff x${a > 1 ? '>' : '<'}\log_{${fmt(a, 1)}}${fmt(p.k, 1)}\approx${fmt(x0, 3)}$ (verde)${a < 1 ? ' — base < 1 inverte o sinal!' : ''}`;
    },
  });

/** (1 + 1/n)^n approaching e. */
const eLab = () =>
  plot({
    view: { xMin: 0, xMax: 50, yMin: 1.8, yMax: 2.9 },
    params: [{ key: 'n', label: 'n', min: 1, max: 50, step: 1, value: 5, color: C.gold, format: (v: number) => String(v) }],
    render: ({ p }: any) => (
      <>
        <InfLine x1={0} y1={Math.E} x2={1} y2={Math.E} color={C.p5} dash="5 4" />
        {Array.from({ length: Math.round(p.n) }, (_, i) => (
          <Pt key={i} x={i + 1} y={(1 + 1 / (i + 1)) ** (i + 1)} color={i + 1 === Math.round(p.n) ? C.gold : C.p2} r={i + 1 === Math.round(p.n) ? 6 : 3} />
        ))}
      </>
    ),
    info: ({ p }: any) => {
      const n = Math.round(p.n);
      return t`$\left(1+\frac1{${n}}\right)^{${n}}=${fmt((1 + 1 / n) ** n, 5)}$ · $e\approx2{,}71828$ (rosa): juros compostos ${n} vezes por período`;
    },
  });

export const expLog: UnitDef = {
  id: 'p-exp',
  title: 'Exponenciais e logaritmos a fundo',
  subtitle: 'Gráficos, mudança de base, inequações e escalas logarítmicas',
  icon: '📈',
  guide: t`$a^x$ e $\log_a x$ são inversas (gráficos simétricos em $y=x$). Condições de existência de $\log_a b$: $a>0$, $a\ne1$, $b>0$. Mudança de base: $\log_a b=\frac{\log b}{\log a}$. Em inequações, **base > 1 mantém o sentido** e **0 < base < 1 inverte**; nas logarítmicas, sempre intersecte com a condição de existência. Escalas como pH, decibéis e Richter são logaritmos: cada unidade a mais é um fator 10.`,
  lessons: [
    {
      id: 'p-exp-func',
      title: 'Funções exponencial e logarítmica',
      parts: [
        {
          card: {
            title: 'Duas funções, uma inversa da outra',
            body: t`$f(x)=a^x$ ($a>0$, $a\ne1$) tem domínio $\mathbb R$ e imagem $(0,\,\infty)$; passa por $(0,\,1)$. Sua inversa $g(x)=\log_a x$ tem domínio $(0,\,\infty)$, imagem $\mathbb R$ e passa por $(1,\,0)$.

• $a>1$: ambas **crescentes**. • $0<a<1$: ambas **decrescentes**.

**Domínio** de funções com log: tudo que está "dentro" do log tem de ser positivo, e a base positiva e diferente de 1.`,
            visual: baseLab(),
          },
          exercises: [
            inter('Escolha uma base em que as duas curvas são decrescentes.', 'plot', baseLab().props, (v) => v.p.a < 0.96, 'qualquer 0 < a < 1', 'Base entre 0 e 1: aˣ decresce, e a inversa também.'),
            mcqS(t`O domínio de $f(x)=\log_2(x-3)$ é:`, t`$x>3$`, [t`$x\ge3$`, t`$x>0$`, t`$\mathbb R$`], 'O logaritmando x − 3 precisa ser positivo.'),
            gen((rng) => {
              const a = randInt(rng, 1, 6);
              const b = randInt(rng, 1, 6);
              return rmcq(rng, t`Domínio de $f(x)=\log\big((x+${a})(${b}-x)\big)$:`, t`$-${a}<x<${b}$`, [t`$x<-${a}$ ou $x>${b}$`, t`$x>${b}$`, t`$x>-${a}$`, t`$-${b}<x<${a}$`], t`O produto precisa ser positivo: entre as raízes $-${a}$ e $${b}$ (parábola com concavidade para baixo).`);
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              return rmcq(rng, t`Para quais $x$ existe $\log_{x}${k}$?`, t`$x>0$ e $x\ne1$`, [t`$x>0$`, t`$x\ne1$`, t`$x>${k}$`, 'todo x real'], 'A base precisa ser positiva e diferente de 1.');
            }),
            tf(t`O gráfico de $y=\log_3 x$ passa por $(3,\,1)$ e por $(1,\,0)$.`, true, t`$\log_33=1$ e $\log_31=0$.`),
            gen((rng) => {
              const h = randInt(rng, 1, 5);
              const k = randInt(rng, -3, 3);
              return num(t`O gráfico de $y=\log_2(x-${h})${k === 0 ? '' : k < 0 ? k : '+' + k}$ corta a reta $y=${k}$ em que $x$?`, h + 1, t`$\log_2(x-${h})=0\Rightarrow x-${h}=1\Rightarrow x=${h + 1}$ (o ponto $(1,\,0)$ deslocado).`);
            }),
            match('Associe cada característica ao gráfico.', [['crescente, passa por (0, 1)', t`$y=2^x$`], ['decrescente, passa por (0, 1)', t`$y=\left(\frac12\right)^x$`], ['crescente, passa por (1, 0)', t`$y=\log_2x$`], ['decrescente, passa por (1, 0)', t`$y=\log_{1/2}x$`]], 'Exponenciais passam por (0, 1) e logaritmos por (1, 0); base > 1 cresce, base entre 0 e 1 decresce.'),
            tf(t`$f(x)=\left(\frac12\right)^x$ é crescente.`, false, 'Base entre 0 e 1: decrescente.'),
          ],
        },
        {
          card: {
            title: 'Mudança de base e logaritmos decimais',
            body: t`$$\log_a b=\frac{\log_c b}{\log_c a}$$
Calculadoras só têm $\log$ (base 10) e $\ln$ (base $e$): use qualquer uma delas como $c$. Consequências: $\log_a b\cdot\log_b a=1$ e $\log_{a^k}b=\frac1k\log_a b$.

**Número de algarismos**: se $\log N=3{,}7$, então $10^3\le N<10^4$: $N$ tem 4 algarismos. Em geral, $N$ tem $\lfloor\log N\rfloor+1$ dígitos.`,
            example: t`Quantos dígitos tem $2^{100}$? $\log2^{100}=100\cdot0{,}30103\approx30{,}1$: são $31$ dígitos.`,
          },
          exercises: [
            gen((rng) => {
              const a = pick(rng, [2, 3, 5, 7]);
              const b = randInt(rng, 3, 50);
              return num(t`Calcule $\log_{${a}}${b}$ com 3 casas (use $\log b/\log a$).`, Math.log(b) / Math.log(a), t`$\frac{\log${b}}{\log${a}}=\frac{${fmt(lg(b), 4)}}{${fmt(lg(a), 4)}}\approx${fmt(Math.log(b) / Math.log(a), 3)}$.`, { tol: 0.002 });
            }),
            gen((rng) => {
              const a = pick(rng, [2, 3, 5]);
              const k = randInt(rng, 2, 4);
              const m = randInt(rng, 1, 6);
              const s = fracTex(m, k);
              return num(t`Simplifique $\log_{${a ** k}}${a ** m}$.`, m / k, t`$\log_{${a}^{${k}}}${a}^{${m}}=\frac{${m}}{${k}}${s === `\\frac{${m}}{${k}}` ? '' : '=' + s}$.`, { tol: 0.001 });
            }),
            tf(t`$\log_2 5\cdot\log_5 2=1$.`, true, t`$\frac{\log5}{\log2}\cdot\frac{\log2}{\log5}=1$.`),
            gen((rng) => {
              const b = pick(rng, [2, 3, 7]);
              // evita n·log b perto de um inteiro (a aproximação de 5 casas poderia mudar a contagem)
              let n = randInt(rng, 20, 200);
              while (Math.abs(n * lg(b) - Math.round(n * lg(b))) < 0.01) n = randInt(rng, 20, 200);
              const d = Math.floor(n * lg(b)) + 1;
              return num(t`Quantos algarismos tem $${b}^{${n}}$? ($\log${b}\approx${fmt(lg(b), 5)}$)`, d, t`$${n}\cdot${fmt(lg(b), 5)}\approx${fmt(n * lg(b), 3)}$ ⇒ $${d}$ algarismos.`);
            }),
            gen((rng) => {
              const [N, p, q] = pick(rng, [[12, 2, 1], [18, 1, 2], [24, 3, 1], [36, 2, 2], [54, 1, 3], [72, 3, 2], [8, 3, 0], [9, 0, 2]] as [number, number, number][]);
              const sum = [p ? `${p === 1 ? '' : p}\\log2` : '', q ? `${q === 1 ? '' : q}\\log3` : ''].filter(Boolean).join('+');
              return num(t`Se $\log 2\approx0{,}301$ e $\log 3\approx0{,}477$, quanto vale $\log ${N}$ (3 casas)?`, lg(N), t`$\log${N}=${sum}\approx${fmt(p * 0.301 + q * 0.477, 3)}$ (use $\log(ab)=\log a+\log b$ e $\log a^k=k\log a$).`, { tol: 0.003 });
            }),
            mcqS(t`$\log_8 32$ vale:`, t`$\frac53$`, [t`$4$`, t`$\frac35$`, t`$\frac52$`], t`$8=2^3$, $32=2^5$: $\frac53$.`),
            order(t`Ordene do menor para o maior: $\log_2 10$, $\log_3 10$, $\log_{10}10$, $\log_{0{,}5}10$.`, [t`$\log_{0{,}5}10$`, t`$\log_{10}10$`, t`$\log_3 10$`, t`$\log_2 10$`], t`Base < 1 dá negativo; entre bases > 1, quanto menor a base, maior o log: $\approx-3{,}32$, $1$, $2{,}10$, $3{,}32$.`),
            gen((rng) => {
              const x = randInt(rng, 2, 5);
              return num(t`Resolva $\log_{2}x+\log_{4}x=${fmt(1.5 * Math.log2(x), 3)}$ (dica: $\log_4x=\frac12\log_2x$).`, x, t`$\frac32\log_2x=${fmt(1.5 * Math.log2(x), 3)}\Rightarrow\log_2x=${fmt(Math.log2(x), 3)}\Rightarrow x=${x}$.`, { tol: 0.01 });
            }),
          ],
        },
      ],
    },
    {
      id: 'p-exp-ineq',
      title: 'Inequações exponenciais e logarítmicas',
      parts: [
        {
          card: {
            title: 'A regra da base',
            body: t`Como $a^x$ é crescente para $a>1$ e decrescente para $0<a<1$:
$$a^{f(x)}>a^{g(x)}\iff\begin{cases}f(x)>g(x)&\text{se }a>1\\f(x)<g(x)&\text{se }0<a<1\end{cases}$$
Estratégia: escreva os dois lados na **mesma base** e compare os expoentes (invertendo se a base é menor que 1). Com $4^x$, $2^x$… use a troca $y=2^x$ ($y>0$).`,
            visual: ineqLab(),
          },
          exercises: [
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              const c = randNZ(rng, -2, 3);
              return rmcq(rng, t`Resolva $2^{x${c < 0 ? '' : '+'}${c}}>${2 ** k}$.`, t`$x>${k - c}$`, [t`$x<${k - c}$`, t`$x>${k}$`, t`$x>${k + c}$`, t`$x\ge${k - c}$`], t`$2^{x${c < 0 ? '' : '+'}${c}}>2^{${k}}\Rightarrow x${c < 0 ? '' : '+'}${c}>${k}$ (base > 1 mantém).`);
            }),
            gen((rng) => {
              const k = randInt(rng, 1, 4);
              return rmcq(rng, t`Resolva $\left(\frac13\right)^x\le${3 ** k}$.`, t`$x\ge-${k}$`, [t`$x\le-${k}$`, t`$x\ge${k}$`, t`$x\le${k}$`, t`$x>-${k}$`], t`$${3 ** k}=\left(\frac13\right)^{-${k}}$; base < 1 inverte: $x\ge-${k}$.`);
            }),
            inter(t`Escolha a base e o nível para que a solução de $a^x>k$ seja um intervalo do tipo $x<\dots$ (para a esquerda).`, 'plot', ineqLab().props, (v) => v.p.a < 0.96, 'qualquer base entre 0 e 1', 'Base menor que 1: a curva desce, então fica acima do nível à esquerda.'),
            gen((rng) => {
              const a = randInt(rng, 1, 3), b = randInt(rng, a + 1, 5);
              return rmcq(rng, t`Resolva $4^x-${2 ** a + 2 ** b}\cdot2^x+${2 ** (a + b)}<0$.`, t`$${a}<x<${b}$`, [t`$x<${a}$ ou $x>${b}$`, t`$${2 ** a}<x<${2 ** b}$`, t`$x>${b}$`, t`$${a}\le x\le${b}$`], t`Com $y=2^x$: $(y-${2 ** a})(y-${2 ** b})<0\Rightarrow ${2 ** a}<2^x<${2 ** b}\Rightarrow ${a}<x<${b}$.`);
            }),
            tf(t`$\left(0{,}5\right)^{x}>\left(0{,}5\right)^{3}\iff x>3$.`, false, 'Base 0,5 < 1 inverte o sentido: x < 3.'),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              return num(t`Qual o menor inteiro $x$ com $3^x>${3 ** k * 2}$?`, k + 1, t`$3^{${k}}=${3 ** k}<${3 ** k * 2}<3^{${k + 1}}=${3 ** (k + 1)}$.`);
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 9);
              return num(t`Menor inteiro $n$ com $1{,}1^n>${k}$ (use logaritmos).`, Math.ceil(Math.log(k) / Math.log(1.1)), t`$n>\frac{\log${k}}{\log1{,}1}\approx${fmt(Math.log(k) / Math.log(1.1), 2)}\Rightarrow n=${Math.ceil(Math.log(k) / Math.log(1.1))}$.`);
            }),
            match('Associe a inequação ao conjunto solução.', [[t`$2^x>1$`, t`$x>0$`], [t`$\left(\frac12\right)^x>1$`, t`$x<0$`], [t`$2^x>0$`, t`$\mathbb R$`], [t`$2^x<0$`, t`$\varnothing$`]], 'aˣ é sempre positivo e vale 1 em x = 0.'),
          ],
        },
        {
          card: {
            title: 'Inequações logarítmicas',
            body: t`Mesma regra da base, **mais** a condição de existência:
$$\log_a f(x)>\log_a g(x)\iff\begin{cases}f(x)>g(x)>0&\text{se }a>1\\0<f(x)<g(x)&\text{se }0<a<1\end{cases}$$
Passos: (1) condições de existência; (2) resolva com a regra da base; (3) **intersecte** os dois conjuntos.`,
            example: t`$\log_2(x-1)<3$: existência $x>1$; $x-1<8\Rightarrow x<9$. Solução: $1<x<9$.`,
          },
          exercises: [
            gen((rng) => {
              const c = randInt(rng, 1, 5), k = randInt(rng, 1, 4);
              return rmcq(rng, t`Resolva $\log_2(x-${c})<${k}$.`, t`$${c}<x<${c + 2 ** k}$`, [t`$x<${c + 2 ** k}$`, t`$x>${c + 2 ** k}$`, t`$${c}<x<${c + k}$`, t`$x>${c}$`], t`Existência $x>${c}$; $x-${c}<2^{${k}}=${2 ** k}$. Interseção: $${c}<x<${c + 2 ** k}$.`);
            }),
            gen((rng) => {
              const k = randInt(rng, 1, 3);
              return rmcq(rng, t`Resolva $\log_{1/2}x>-${k}$.`, t`$0<x<${2 ** k}$`, [t`$x>${2 ** k}$`, t`$x<${2 ** k}$`, t`$x>-${k}$`, t`$0<x<${k}$`], t`$-${k}=\log_{1/2}${2 ** k}$; base < 1 inverte: $x<${2 ** k}$, com $x>0$.`);
            }),
            order(t`Ordene a resolução de $\log_3(2x-4)\le\log_3(x+1)$.`, [t`Existência: $2x-4>0$ e $x+1>0\Rightarrow x>2$`, t`Base 3 > 1: $2x-4\le x+1$`, t`Logo $x\le5$`, t`Interseção: $2<x\le5$`], 'Existência, regra da base, interseção.'),
            tf(t`Ao resolver $\log(x-2)>0$, a resposta $x>3$ já respeita a condição de existência.`, true, t`$x-2>1\Rightarrow x>3$, que já implica $x>2$.`),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              return num(t`Quantos inteiros satisfazem $\log_2 x<${a}$?`, 2 ** a - 1, t`$0<x<${2 ** a}$: inteiros $1,\dots,${2 ** a - 1}$.`);
            }),
            multi(t`Quais valores satisfazem $\log_{0{,}5}(x-1)\ge -1$?`, ['1,5', '2', '3', '4', '1'], [0, 1, 2], t`Existência $x>1$; base < 1 inverte: $x-1\le2\Rightarrow x\le3$. Solução $1<x\le3$.`),
            gen((rng) => {
              const k = randInt(rng, 1, 3);
              return rmcq(rng, t`Domínio de $f(x)=\sqrt{\log_2 x-${k}}$:`, t`$x\ge${2 ** k}$`, [t`$x>0$`, t`$x\ge${k}$`, t`$0<x\le${2 ** k}$`, t`$x>${2 ** k}$`], t`Raiz exige $\log_2x\ge${k}\Rightarrow x\ge${2 ** k}$ (já positivo).`);
            }),
            mcqS(t`Resolva $(\log_2x)^2-3\log_2x+2<0$.`, t`$2<x<4$`, [t`$1<x<2$`, t`$x<2$ ou $x>4$`, t`$1<x<4$`], t`Com $y=\log_2x$: $(y-1)(y-2)<0\Rightarrow1<y<2\Rightarrow2<x<4$.`),
          ],
        },
      ],
    },
    {
      id: 'p-exp-apl',
      title: 'Aplicações: escalas e modelos',
      parts: [
        {
          card: {
            title: 'Escalas logarítmicas',
            body: t`Quando uma grandeza varia em muitas ordens de grandeza, usamos o log:
• **pH** $=-\log[H^+]$: pH 3 é 10 vezes mais ácido que pH 4.
• **Decibéis**: $N=10\log\frac{I}{I_0}$: +10 dB = intensidade ×10; +3 dB ≈ ×2.
• **Richter**: cada ponto = amplitude ×10 (e energia ≈ ×32).

"Somar 1 na escala" = "multiplicar por 10 na grandeza".`,
          },
          exercises: [
            gen((rng) => {
              const k = randInt(rng, 2, 12);
              return num(t`Uma solução tem $[H^+]=10^{-${k}}$ mol/L. Qual o pH?`, k, t`$-\log10^{-${k}}=${k}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 6), d = randInt(rng, 1, 4);
              return num(`Quantas vezes a concentração de H⁺ de um pH ${a} é maior que a de um pH ${a + d}?`, 10 ** d, `Diferença de ${d} unidades: 10^${d} = ${10 ** d}.`);
            }),
            gen((rng) => {
              const d = 10 * randInt(rng, 1, 5);
              return num(`Um som tem ${d} dB a mais que outro. Quantas vezes a intensidade é maior?`, 10 ** (d / 10), `10^(${d}/10) = ${10 ** (d / 10)}.`);
            }),
            gen((rng) => {
              const n = pick(rng, [2, 4, 8]);
              return num(`Quantos dB aumenta o nível sonoro quando ${n} fontes iguais tocam juntas, em relação a uma só (2 casas)?`, 10 * lg(n), `10·log ${n} ≈ ${fmt(10 * lg(n), 2)} dB.`, { tol: 0.01 });
            }),
            tf('Um terremoto de magnitude 7 tem amplitude 2 vezes maior que um de magnitude 5.', false, '2 pontos = 10² = 100 vezes a amplitude.'),
            mcqS('Por que gráficos de resposta em frequência usam eixo logarítmico?', 'para ver de 10 Hz a 100 kHz com a mesma resolução relativa', ['porque o log é sempre positivo', 'para os valores ficarem inteiros', 'porque a frequência não pode ser zero'], 'Escala log dá o mesmo espaço para cada década (fator 10).'),
            gen((rng) => {
              const I = randInt(rng, 2, 9);
              const e = randInt(rng, 4, 9);
              return num(t`Nível em dB de um som com $I=${I}\cdot10^{${e}}\,I_0$ (2 casas).`, 10 * lg(I * 10 ** e), t`$10\log(${I}\cdot10^{${e}})=10(${fmt(lg(I), 4)}+${e})\approx${fmt(10 * lg(I * 10 ** e), 2)}$ dB.`, { tol: 0.01 });
            }),
            match('Associe.', [['pH', '−log [H⁺]'], ['decibel', '10 log (I/I₀)'], ['Richter', 'log da amplitude'], ['oitava musical', 'frequência ×2']], 'Todas comparam razões, não diferenças.'),
          ],
        },
        {
          card: {
            title: 'Modelos exponenciais e o número e',
            body: t`• **Decaimento** radioativo: $N(t)=N_0\left(\frac12\right)^{t/T}$, $T$ = meia-vida.
• **Juros contínuos**: compondo $n$ vezes por período, $\left(1+\frac1n\right)^n\to e\approx2{,}718$; daí $M=Ce^{rt}$.
• **Resfriamento de Newton**: $T(t)=T_a+(T_0-T_a)e^{-kt}$.
• **Linearização**: se $y=Ce^{kx}$, então $\ln y=\ln C+kx$ — no papel monolog vira uma **reta**.`,
            visual: eLab(),
          },
          exercises: [
            inter(t`Aumente $n$ até $\left(1+\frac1n\right)^n$ passar de $2{,}69$.`, 'plot', eLab().props, (v) => (1 + 1 / Math.round(v.p.n)) ** Math.round(v.p.n) > 2.69, 'n ≥ 48', 'A convergência para e é lenta: só em n = 48 o valor passa de 2,69 (≈ 2,6905).'),
            gen((rng) => {
              const T = pick(rng, [5, 8, 10, 30]), k = randInt(rng, 2, 5), N0 = 100 * randInt(rng, 2, 10);
              return num(`Meia-vida de ${T} anos, ${N0} g iniciais. Quanto resta após ${k * T} anos?`, N0 / 2 ** k, `${k} meias-vidas: ${N0}/2^${k} = ${fmt(N0 / 2 ** k, 3)} g.`, { tol: 0.01, unit: 'g' });
            }),
            gen((rng) => {
              const T = 5730;
              const f = pick(rng, [0.5, 0.25, 0.1, 0.7, 0.8]);
              const tt = (T * Math.log(f)) / Math.log(0.5);
              return num(`Um fóssil tem ${fmt(f * 100)}% do carbono-14 original (meia-vida 5730 anos). Idade aproximada (anos)?`, tt, t`$t=5730\cdot\frac{\ln ${fmt(f)}}{\ln 0{,}5}\approx${fmt(tt, 0)}$ anos.`, { tol: Math.max(2, tt * 0.001) });
            }),
            gen((rng) => {
              const Ta = randInt(rng, 18, 25), T0 = randInt(rng, 80, 95), k = pick(rng, [0.05, 0.1, 0.08]), tt = randInt(rng, 5, 20);
              const T = Ta + (T0 - Ta) * Math.exp(-k * tt);
              return num(`Café a ${T0} °C numa sala a ${Ta} °C, k = ${fmt(k)} por minuto. Temperatura após ${tt} min (1 casa)?`, T, t`$${Ta}+${T0 - Ta}e^{-${fmt(k)}\cdot${tt}}\approx${fmt(T, 1)}$ °C.`, { tol: 0.1, unit: '°C' });
            }),
            gen((rng) => {
              const k = pick(rng, [0.02, 0.05, 0.07, 0.1]);
              return num(`Uma população cresce como P₀e^(${fmt(k)}t). Em quanto tempo dobra (na unidade de t, 2 casas)?`, Math.log(2) / k, t`$e^{${fmt(k)}t}=2\Rightarrow t=\frac{\ln2}{${fmt(k)}}\approx${fmt(Math.log(2) / k, 2)}$.`, { tol: 0.01 });
            }),
            tf(t`Se $y=3e^{0{,}5x}$, o gráfico de $\ln y$ contra $x$ é uma reta de inclinação $0{,}5$.`, true, t`$\ln y=\ln3+0{,}5x$.`),
            mcqS('Dados (x, y) cujo gráfico de log y contra log x é uma reta indicam um modelo:', 'potência y = C·xᵏ', ['exponencial y = C·eᵏˣ', 'linear y = ax + b', 'logarítmico y = a ln x'], 'log y = log C + k log x: reta no papel di-log ⇔ lei de potência.'),
            gen((rng) => {
              const r = pick(rng, [4, 6, 10, 12]);
              const n = pick(rng, [1, 12, 365]);
              const v = (1 + r / 100 / n) ** n;
              return num(`Fator de 1 ano a ${r}% a.a. capitalizados ${n === 1 ? 'anualmente' : n === 12 ? 'mensalmente' : 'diariamente'} (4 casas).`, v, t`$\left(1+\frac{${fmt(r / 100)}}{${n}}\right)^{${n}}\approx${fmt(v, 4)}$; o limite seria $e^{${fmt(r / 100)}}\approx${fmt(Math.exp(r / 100), 4)}$.`, { tol: 0.0002 });
            }),
          ],
        },
      ],
    },
  ],
};

