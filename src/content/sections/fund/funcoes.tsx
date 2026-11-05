import React from 'react';
import type { Unit } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { AreaUnder, FnCurve, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, polyTex } from '../../../lib/random';
import { expLogLab, lineLab, parabolaLab } from '../../visuals';

const t = String.raw;

const ineqLab = () =>
  plot({
    view: { xMin: -5, xMax: 5, yMin: -6, yMax: 8 },
    params: [{ key: 'c', label: 'c', min: -5, max: 5, step: 0.5, value: 4, color: C.p3 }],
    render: ({ p }: any) => {
      const f = (x: number) => x * x - p.c;
      const segs = [];
      if (p.c > 0) {
        const r = Math.sqrt(p.c);
        segs.push(<Seg key="s" x1={-r} y1={0} x2={r} y2={0} color={C.danger} width={7} />);
        segs.push(<FnCurve key="n" f={f} from={-r} to={r} color={C.danger} width={5} />);
      }
      return (
        <>
          <FnCurve f={f} color={C.p1} />
          {segs}
        </>
      );
    },
    info: ({ p }: any) => (p.c > 0 ? t`$x^2-${fmt(p.c)}<0 \iff -${fmt(Math.sqrt(p.c), 2)}<x<${fmt(Math.sqrt(p.c), 2)}$` : t`$x^2-(${fmt(p.c)})<0$ não tem solução real: a parábola nunca fica abaixo do eixo.`),
  });

export const funcoes: Unit = {
  id: 'f-func',
  title: 'Funções',
  subtitle: 'Afim, quadrática, inequações, exponencial e logaritmo',
  icon: '📈',
  source: 'Competências Básicas · Funções',
  guide: t`Função é uma regra que associa cada $x$ do domínio a **um único** $y$. Os gráficos são a forma mais rápida de entender e resolver equações e inequações.`,
  lessons: [
    {
      id: 'f-func-afim',
      title: 'Função afim',
      cards: [
        {
          title: 'Uma reta: f(x) = ax + b',
          body: t`$a$ é o **coeficiente angular** (inclinação): quanto $y$ sobe quando $x$ anda 1.
$b$ é o **coeficiente linear**: onde a reta corta o eixo $y$.

• $a>0$: crescente · $a<0$: decrescente
• Raiz (zero): $x=-\frac{b}{a}$`,
          visual: lineLab(),
        },
        {
          title: 'Reta por dois pontos',
          body: t`Dados $(x_1,y_1)$ e $(x_2,y_2)$:
$$a=\frac{y_2-y_1}{x_2-x_1}=\frac{\Delta y}{\Delta x}$$
Depois, $b=y_1-a\,x_1$.`,
          example: t`Pontos $(1,3)$ e $(3,7)$: $a=\frac{7-3}{3-1}=2$, $b=3-2=1$ ⟹ $f(x)=2x+1$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = randNZ(rng, -4, 4);
          const b = randInt(rng, -6, 6);
          const x = randInt(rng, -3, 5);
          return num(t`Se $f(x)=${polyTex([b, a])}$, quanto vale $f(${x})$?`, a * x + b, t`$f(${x})=${a}\cdot(${x})${b < 0 ? '' : '+'}${b}=${a * x + b}$.`);
        }),
        gen((rng) => {
          const a = randNZ(rng, -3, 3);
          const r = randInt(rng, -4, 4);
          const b = -a * r;
          return num(t`Qual é a raiz de $f(x)=${polyTex([b, a])}$?`, r, t`$${polyTex([b, a])}=0\Rightarrow x=-\frac{${b}}{${a}}=${r}$.`);
        }),
        gen((rng) => {
          const x1 = randInt(rng, -3, 2);
          const x2 = x1 + randInt(rng, 1, 4);
          const a = randNZ(rng, -3, 3);
          const b = randInt(rng, -4, 4);
          return num(t`Qual o coeficiente angular da reta que passa por $(${x1},\,${a * x1 + b})$ e $(${x2},\,${a * x2 + b})$?`, a, t`$a=\frac{${a * x2 + b}-(${a * x1 + b})}{${x2}-(${x1})}=${a}$.`);
        }),
        inter(t`Ajuste $a$ e $b$ para a reta coincidir com a tracejada $y=-2x+3$.`, 'plot', lineLab({ a: 0.5, b: 0, target: [-2, 3] }).props, (v: any) => v && near(v.p.a, -2, 0.01) && near(v.p.b, 3, 0.01), t`$a=-2$, $b=3$`),
        tf(t`A função $f(x)=-3x+5$ é crescente.`, false, t`$a=-3<0$: decrescente.`),
        mcqS(t`Um táxi cobra R\$ 5 de bandeirada mais R\$ 2,50 por km. Qual função dá o preço?`, t`$P(x)=2{,}5x+5$`, [t`$P(x)=5x+2{,}5$`, t`$P(x)=7{,}5x$`, t`$P(x)=2{,}5x-5$`], t`A parte fixa é o $b=5$, a taxa por km é o $a=2{,}5$.`),
      ],
    },
    {
      id: 'f-func-quad',
      title: 'Função quadrática',
      cards: [
        {
          title: 'A parábola',
          body: t`$f(x)=ax^2+bx+c$ com $a\ne0$.

• $a>0$: concavidade para **cima** (sorriso) · $a<0$: para **baixo**
• $c$: onde corta o eixo $y$
• **Discriminante** $\Delta=b^2-4ac$ decide o número de raízes

Mexa nos coeficientes:`,
          visual: parabolaLab(),
        },
        {
          title: 'Bhaskara e o vértice',
          body: t`$$x=\frac{-b\pm\sqrt{\Delta}}{2a}$$

O **vértice** é o ponto de máximo ou mínimo:
$$x_v=-\frac{b}{2a},\qquad y_v=-\frac{\Delta}{4a}$$`,
          example: t`$x^2-6x+5$: $\Delta=36-20=16$, raízes $\frac{6\pm4}{2}=5$ e $1$; vértice em $x_v=3$, $y_v=-4$.`,
          tip: t`Problemas de **área máxima** ou **lucro máximo** com função quadrática? A resposta está no vértice.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const r1 = randInt(rng, -5, 5);
          const r2 = randInt(rng, -5, 5);
          const a = pick(rng, [1, 1, 2, -1]);
          const b = -a * (r1 + r2);
          const c = a * r1 * r2;
          return num(t`Calcule o discriminante $\Delta$ de $${polyTex([c, b, a])}$.`, b * b - 4 * a * c, t`$\Delta=b^2-4ac=(${b})^2-4\cdot(${a})\cdot(${c})=${b * b - 4 * a * c}$.`);
        }),
        gen((rng) => {
          const r1 = randInt(rng, -5, 3);
          const r2 = r1 + randInt(rng, 1, 6);
          const b = -(r1 + r2);
          const c = r1 * r2;
          return num(t`Qual a **maior** raiz de $${polyTex([c, b, 1])}=0$?`, r2, t`$\Delta=${b * b - 4 * c}$, $x=\frac{${-b}\pm${Math.sqrt(b * b - 4 * c)}}{2}$: raízes $${r1}$ e $${r2}$.`);
        }),
        gen((rng) => {
          const a = pick(rng, [1, 2, -1, -2]);
          const xv = randInt(rng, -3, 3);
          const b = -2 * a * xv;
          const c = randInt(rng, -5, 5);
          return num(t`Qual o $x$ do vértice de $f(x)=${polyTex([c, b, a])}$?`, xv, t`$x_v=-\frac{b}{2a}=-\frac{${b}}{2\cdot(${a})}=${xv}$.`);
        }),
        inter(t`Ajuste a parábola para coincidir com a tracejada $y=-x^2+2x+3$.`, 'plot', parabolaLab({ a: 1, b: 0, c: 0, ghost: [-1, 2, 3] }).props, (v: any) => v && near(v.p.a, -1, 0.01) && near(v.p.b, 2, 0.01) && near(v.p.c, 3, 0.01), t`$a=-1,\ b=2,\ c=3$`),
        mcq(t`Se $\Delta<0$, a parábola…`, ['não corta o eixo $x$', 'corta o eixo $x$ em dois pontos', 'é uma reta', 'tem vértice na origem'], 0),
        num(t`Com 40 m de cerca, qual a **maior área** (em m²) de um retângulo?`, 100, t`Lados $x$ e $20-x$: $A=x(20-x)=-x^2+20x$, vértice $x=10$ ⟹ quadrado $10\times10=100$ m².`, { unit: 'm²' }),
      ],
    },
    {
      id: 'f-func-ineq',
      title: 'Inequações',
      cards: [
        {
          title: 'Onde a função é positiva ou negativa?',
          body: t`Resolver $f(x)<0$ é encontrar os $x$ onde o gráfico fica **abaixo** do eixo.

Para $x^2-c<0$, veja o trecho vermelho:`,
          visual: ineqLab(),
        },
        {
          title: 'Regras práticas',
          body: t`• Inequação afim: resolva como equação, mas **inverta o sinal** ao multiplicar/dividir por negativo: $-2x>6\Rightarrow x<-3$.
• Quadrática: ache as raízes e use a concavidade. Para $a>0$, a parábola é negativa **entre** as raízes.
• Produto/quociente: faça o **quadro de sinais**.`,
          example: t`$x^2-5x+6\le0$: raízes 2 e 3, $a>0$ ⟹ $S=[2,\,3]$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = randNZ(rng, -4, -1);
          const k = randInt(rng, -6, 6);
          return rmcq(rng, t`Resolva $${a}x>${a * k}$.`, t`$x<${k}$`, [t`$x>${k}$`, t`$x<${-k}$`, t`$x>${-k}$`], t`Dividindo por $${a}$ (negativo) o sinal **inverte**: $x<${k}$.`);
        }),
        gen((rng) => {
          const r1 = randInt(rng, -4, 2);
          const r2 = r1 + randInt(rng, 1, 5);
          const b = -(r1 + r2);
          const c = r1 * r2;
          return rmcq(rng, t`Resolva $${polyTex([c, b, 1])}<0$.`, t`$${r1}<x<${r2}$`, [t`$x<${r1}$ ou $x>${r2}$`, t`$x>${r2}$`, t`$x\le${r1}$`], t`Raízes $${r1}$ e $${r2}$; concavidade para cima ⟹ negativa entre as raízes.`);
        }),
        inter(t`Ajuste $c$ para que a solução de $x^2-c<0$ seja $-3<x<3$.`, 'plot', ineqLab().props, (v: any) => v && near(v.p.c, 9, 0.01), t`$c=9$`),
        tf(t`A inequação $x^2+1<0$ não tem solução real.`, true, t`$x^2+1\ge1$ para todo real.`),
        mcqS(t`Qual o conjunto solução de $\frac{x-1}{x+2}\ge0$?`, t`$x<-2$ ou $x\ge1$`, [t`$-2<x\le1$`, t`$x\ge1$`, t`$x\le-2$ ou $x\ge1$`], t`Numerador zera em 1 (incluído), denominador em $-2$ (excluído). Positivo fora do intervalo.`),
      ],
    },
    {
      id: 'f-func-exp',
      title: 'Função exponencial',
      cards: [
        {
          title: 'Crescimento que acelera',
          body: t`$f(x)=a^x$ com $a>0$, $a\ne1$.

• $a>1$: crescente (bactérias, juros) · $0<a<1$: decrescente (decaimento radioativo)
• Sempre passa por $(0,1)$ e nunca toca o eixo $x$.`,
          visual: expLogLab(),
        },
        {
          title: 'Equações exponenciais',
          body: t`Iguale as bases: $2^{x+1}=32=2^5\Rightarrow x+1=5\Rightarrow x=4$.

O número $e\approx2{,}718$ é a base "natural" da engenharia: $e^x$ é a única função que é a **própria derivada**.`,
          tip: t`Meia-vida: $N(t)=N_0\left(\tfrac12\right)^{t/T}$. Depois de 3 meias-vidas sobra $\tfrac18$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const base = pick(rng, [2, 3, 5]);
          const k = randInt(rng, 2, base === 2 ? 6 : 3);
          const s = randInt(rng, -2, 2);
          return num(t`Resolva $${base}^{x${s < 0 ? '-' : '+'}${Math.abs(s)}}=${Math.pow(base, k)}$.`, k - s, t`$${Math.pow(base, k)}=${base}^{${k}}$, então $x${s < 0 ? '-' : '+'}${Math.abs(s)}=${k}\Rightarrow x=${k - s}$.`);
        }),
        mcq(t`O gráfico de $f(x)=\left(\frac12\right)^x$ é:`, ['decrescente e passa por (0, 1)', 'crescente e passa por (0, 1)', 'decrescente e passa por (0, 0)', 'uma reta'], 0),
        num(t`Uma cultura dobra a cada hora. Começando com 100 bactérias, quantas há após 5 horas?`, 3200, t`$100\cdot2^5=3200$.`),
        tf(t`A função $f(x)=2^x$ assume valores negativos para $x<0$.`, false, t`$2^{-1}=\frac12>0$: a exponencial é sempre positiva.`),
        num(t`Uma substância tem meia-vida de 10 anos. De 80 g, quantos gramas restam após 30 anos?`, 10, t`3 meias-vidas: $80\cdot\left(\frac12\right)^3=10$ g.`, { unit: 'g' }),
      ],
    },
    {
      id: 'f-func-log',
      title: 'Logaritmos',
      cards: [
        {
          title: 'A pergunta inversa',
          body: t`$$\log_a b = x \iff a^x=b$$

"A que expoente eu elevo $a$ para obter $b$?" Ex.: $\log_2 8=3$ porque $2^3=8$.

O gráfico do log é o **espelho** da exponencial na reta $y=x$:`,
          visual: expLogLab(),
        },
        {
          title: 'Propriedades',
          body: t`$$\log(ab)=\log a+\log b \qquad \log\frac ab=\log a-\log b$$
$$\log a^n = n\log a \qquad \log_a b=\frac{\log_c b}{\log_c a}$$

$\ln$ é o log na base $e$; $\log$ sem base costuma ser base 10.`,
          example: t`Resolva $3^x=20$: $x=\log_3 20=\frac{\ln 20}{\ln 3}\approx2{,}727$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = pick(rng, [2, 3, 5, 10]);
          const k = randInt(rng, 1, a === 2 ? 7 : 3);
          return num(t`Calcule $\log_{${a}} ${Math.pow(a, k)}$.`, k, t`$${a}^{${k}}=${Math.pow(a, k)}$.`);
        }),
        num(t`Calcule $\log_2 \frac{1}{8}$.`, -3, t`$2^{-3}=\frac18$.`),
        match(t`Ligue cada expressão à sua simplificação:`, [
          [t`$\log a+\log b$`, t`$\log(ab)$`],
          [t`$\log a-\log b$`, t`$\log\frac ab$`],
          [t`$3\log a$`, t`$\log a^3$`],
          [t`$\log_a a$`, '$1$'],
        ]),
        num(t`Sabendo que $\log 2\approx0{,}301$ e $\log 3\approx0{,}477$, calcule $\log 12$.`, 1.079, t`$\log12=\log(4\cdot3)=2\log2+\log3\approx0{,}602+0{,}477=1{,}079$.`, { tol: 0.002 }),
        tf(t`$\log(a+b)=\log a+\log b$`, false, t`A propriedade é para **produto**: $\log(ab)=\log a+\log b$.`),
        mcqS(t`Quantos anos leva para um capital dobrar a 10% ao ano (compostos)? Use $\frac{\ln 2}{\ln 1{,}1}$.`, 'cerca de 7,3 anos', ['5 anos', '10 anos', 'cerca de 20 anos'], t`$1{,}1^t=2\Rightarrow t=\frac{\ln2}{\ln1{,}1}\approx\frac{0{,}693}{0{,}0953}\approx7{,}3$.`),
      ],
    },
  ],
};
