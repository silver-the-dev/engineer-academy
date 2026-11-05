import React from 'react';
import type { Unit } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi, table } from '../../helpers';
import { FnCurve, InfLine, PolylineW, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ } from '../../../lib/random';
import { bisectionStepper, newtonStepper } from '../../visuals';

const t = String.raw;

const gaussSeidelStepper = () => {
  // 4x + y = 9 ; x + 3y = 5  -> solution (2, 1)
  const pts: [number, number][] = [[0, 0]];
  let x = 0;
  let y = 0;
  const steps: { x: number; y: number }[] = [{ x, y }];
  for (let k = 0; k < 5; k++) {
    x = (9 - y) / 4;
    pts.push([x, y]);
    y = (5 - x) / 3;
    pts.push([x, y]);
    steps.push({ x, y });
  }
  return {
    name: 'stepper',
    props: {
      steps: steps.length,
      view: { xMin: -0.3, xMax: 3, yMin: -0.3, yMax: 2.2 },
      render: (k: number) => (
        <>
          <InfLine x1={2} y1={1} x2={2.25} y2={0} color={C.p3} />
          <InfLine x1={2} y1={1} x2={5} y2={0} color={C.p5} />
          <PolylineW pts={pts.slice(0, 2 * k + 1)} color={C.gold} width={2.5} />
          <Pt x={steps[k].x} y={steps[k].y} color={C.gold} />
          <Pt x={2} y={1} color={C.success} r={4} />
        </>
      ),
      info: (k: number) => t`Iteração $${k}$: $x=${fmt(steps[k].x, 5)}$, $y=${fmt(steps[k].y, 5)}$ · solução exata $(2,\,1)$`,
    },
  };
};

export const erros: Unit = {
  id: 'n-err',
  title: 'Erros e aritmética do computador',
  subtitle: 'Arredondamento, truncamento, erro absoluto e relativo',
  icon: '🖥️',
  source: 'Cálculo Numérico · Unidade 1 — Introdução à origem dos erros',
  guide: t`Computadores representam números com finitos dígitos (ponto flutuante). Todo cálculo numérico carrega **erro**; o importante é medi-lo (absoluto e relativo) e controlar sua propagação.`,
  lessons: [
    {
      id: 'n-err-rep',
      title: 'Representação e arredondamento',
      cards: [
        {
          title: 'Finito vs. infinito',
          body: t`$\frac13=0{,}3333\ldots$ e $\pi=3{,}14159\ldots$ têm infinitos dígitos, mas a máquina guarda só alguns.

• **Truncamento**: corta as casas: $\pi\approx3{,}1415$
• **Arredondamento**: vai ao mais próximo: $\pi\approx3{,}1416$

Ponto flutuante: $x=\pm0{,}d_1d_2\ldots d_t\times\beta^e$ (mantissa, base $\beta$, expoente $e$).`,
          tip: t`$0{,}1$ não tem representação binária finita! Por isso, em muitas linguagens, $0{,}1+0{,}2\ne0{,}3$ exatamente.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const x = pick(rng, [2.71828, 1.41421, 3.14159, 0.57721, 1.73205]);
          const d = randInt(rng, 2, 4);
          const tr = Math.floor(x * 10 ** d) / 10 ** d;
          return num(t`Trunque $${fmt(x, 5)}$ com $${d}$ casas decimais.`, tr, t`Basta cortar: $${fmt(tr, d)}$.`, { tol: 1e-9 });
        }),
        gen((rng) => {
          const x = pick(rng, [2.71828, 1.41421, 3.14159, 0.57721, 1.73205]);
          const d = randInt(rng, 2, 4);
          const ar = Math.round(x * 10 ** d) / 10 ** d;
          return num(t`Arredonde $${fmt(x, 5)}$ com $${d}$ casas decimais.`, ar, undefined, { tol: 1e-9 });
        }),
        tf(t`O número $0{,}1$ é representado exatamente em binário.`, false, t`Em base 2, $0{,}1=0{,}0001100110011\ldots_2$ (dízima periódica).`),
        mcqS(t`Converta $(1011)_2$ para decimal.`, '$11$', ['$13$', '$1011$', '$9$'], t`$8+0+2+1=11$.`),
        num(t`Converta $(13)_{10}$ para binário (digite os dígitos, ex.: 1101).`, 1101),
      ],
    },
    {
      id: 'n-err-abs',
      title: 'Erro absoluto e relativo',
      cards: [
        {
          title: 'Medindo o erro',
          body: t`Valor exato $x$, aproximado $\bar x$:
$$E_A=|x-\bar x|\qquad E_R=\frac{|x-\bar x|}{|x|}$$
O relativo diz se o erro é **grande em proporção**: errar 1 m em 1 km ($0{,}1\%$) é ótimo; errar 1 m em 2 m ($50\%$) é péssimo.`,
          tip: t`**Cancelamento catastrófico**: subtrair números muito próximos perde algarismos significativos. Ex.: $\sqrt{10001}-\sqrt{10000}$ é melhor calculado como $\frac{1}{\sqrt{10001}+\sqrt{10000}}$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const x = pick(rng, [100, 250, 80, 1000]);
          const e = pick(rng, [1, 2, 5]);
          return num(t`O valor exato é $${x}$ e o aproximado $${x + e}$. Qual o erro relativo em %?`, (100 * e) / x, t`$\frac{${e}}{${x}}=${fmt(e / x, 4)}=${fmt((100 * e) / x, 2)}\%$.`, { tol: 0.01, unit: '%' });
        }),
        num(t`Aproximando $\pi$ por $3{,}14$, qual o erro absoluto (4 casas)?`, 0.0016, t`$|3{,}14159-3{,}14|\approx0{,}0016$.`, { tol: 0.00005 }),
        mcq(t`Qual medição é mais precisa em termos relativos?`, ['erro de 1 cm em 10 m', 'erro de 1 cm em 1 m', 'erro de 1 mm em 1 cm', 'erro de 1 m em 5 m'], 0, t`$\frac{1}{1000}=0{,}1\%$ é o menor relativo.`),
        tf(t`Somar muitos números pequenos a um número grande pode perder precisão.`, true, t`Os dígitos dos pequenos "somem" além da mantissa do grande. Some os pequenos primeiro!`),
      ],
    },
  ],
};

export const zeros: Unit = {
  id: 'n-zer',
  title: 'Zeros de funções',
  subtitle: 'Isolamento, bisseção, Newton e secante',
  icon: '🎯',
  source: 'Cálculo Numérico · Unidade 1 — Zero de funções reais',
  guide: t`Para resolver $f(x)=0$ numericamente: isole a raiz (troca de sinal — Teorema de Bolzano) e refine. Bisseção é lenta mas garantida; Newton é rapidíssima perto da raiz, mas precisa de $f'$ e de um bom chute.`,
  lessons: [
    {
      id: 'n-zer-iso',
      title: 'Isolamento e bisseção',
      cards: [
        {
          title: 'Bolzano: troca de sinal',
          body: t`Se $f$ é contínua e $f(a)\cdot f(b)<0$, existe raiz em $(a,b)$.

**Bisseção**: $m=\frac{a+b}{2}$; fique com a metade onde o sinal muda. Avance passo a passo em $f(x)=x^3-x-2$:`,
          visual: bisectionStepper((x) => x ** 3 - x - 2, 1, 2, 8, { xMin: 0.7, xMax: 2.3, yMin: -3, yMax: 5 }),
          tip: t`Após $n$ passos o erro é no máximo $\frac{b-a}{2^n}$. Para erro $<\varepsilon$: $n>\log_2\frac{b-a}{\varepsilon}$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = 1;
          const b = 2;
          const f = (x: number) => x ** 3 - x - 2;
          const m = 1.5;
          return mcq(t`Bisseção em $f(x)=x^3-x-2$ no intervalo $[1,\,2]$: $f(1{,}5)=${fmt(f(m), 3)}$. Qual o novo intervalo?`, ['$[1{,}5;\\ 2]$', '$[1;\\ 1{,}5]$', '$[1;\\ 2]$', '$[1{,}25;\\ 1{,}75]$'], 0, t`$f(1{,}5)<0$ e $f(2)>0$: a troca de sinal está em $[1{,}5;\ 2]$.`);
        }),
        gen((rng) => {
          const L = pick(rng, [1, 2, 4]);
          const n = randInt(rng, 3, 10);
          return num(t`Partindo de um intervalo de comprimento $${L}$, qual o comprimento após $${n}$ bisseções?`, L / 2 ** n, t`$\frac{${L}}{2^{${n}}}=${fmt(L / 2 ** n, 6)}$.`, { tol: 1e-7 });
        }),
        num(t`Quantas bisseções (mínimo) garantem erro $<0{,}001$ partindo de $[0,\,1]$?`, 10, t`$2^{-n}<10^{-3}\Rightarrow n>9{,}97$ ⟹ $n=10$.`),
        mcq(t`Em qual intervalo $f(x)=x^2-3$ tem raiz?`, ['$[1,\\ 2]$', '$[2,\\ 3]$', '$[0,\\ 1]$', '$[-1,\\ 0]$'], 0, t`$f(1)=-2<0$ e $f(2)=1>0$.`),
        tf(t`Se $f(a)f(b)>0$, não há raízes em $[a,b]$.`, false, t`Pode haver um número **par** de raízes (ex.: $x^2-0{,}25$ em $[-1, 1]$).`),
      ],
    },
    {
      id: 'n-zer-newton',
      title: 'Método de Newton',
      cards: [
        {
          title: 'Siga a tangente',
          body: t`$$x_{k+1}=x_k-\frac{f(x_k)}{f'(x_k)}$$
A tangente em $x_k$ corta o eixo em $x_{k+1}$. Veja a convergência para $\sqrt2$ com $f(x)=x^2-2$:`,
          visual: newtonStepper((x) => x * x - 2, (x) => 2 * x, 3, 4, { xMin: 0, xMax: 3.4, yMin: -3, yMax: 8 }),
          tip: t`Convergência **quadrática**: perto da raiz, o número de casas certas ~dobra a cada passo. Cuidado com $f'(x_k)\approx0$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = pick(rng, [2, 3, 5, 7, 10]);
          const x0 = Math.ceil(Math.sqrt(a));
          const x1 = x0 - (x0 * x0 - a) / (2 * x0);
          return num(t`Newton para $f(x)=x^2-${a}$ com $x_0=${x0}$: calcule $x_1$.`, x1, t`$x_1=${x0}-\frac{${x0 * x0 - a}}{${2 * x0}}=${fmt(x1, 5)}$.`, { tol: 1e-4 });
        }),
        mcqS(t`A fórmula de Newton para $\sqrt{a}$ (com $f=x^2-a$) é:`, t`$x_{k+1}=\frac12\left(x_k+\frac{a}{x_k}\right)$`, [t`$x_{k+1}=x_k-\frac{a}{2}$`, t`$x_{k+1}=\frac{x_k+a}{2}$`, t`$x_{k+1}=x_k^2-a$`], t`$x-\frac{x^2-a}{2x}=\frac{x}{2}+\frac{a}{2x}$.`),
        tf(t`O método de Newton sempre converge, qualquer que seja o chute inicial.`, false, t`Pode divergir ou oscilar se o chute for ruim ou $f'$ for quase zero.`),
        mcq(t`Newton exige, além de $f$…`, ["a derivada f'", 'um intervalo com troca de sinal', 'dois chutes iniciais', 'a integral de f'], 0),
        num(t`Newton em $f(x)=x^3-2x-5$ com $x_0=2$: calcule $x_1$.`, 2.1, t`$f(2)=-1$, $f'(2)=10$: $x_1=2+\frac{1}{10}=2{,}1$.`),
      ],
    },
    {
      id: 'n-zer-sec',
      title: 'Secante e ponto fixo',
      cards: [
        {
          title: 'Sem derivada: secante',
          body: t`Troque $f'$ pela inclinação da secante pelos dois últimos pontos:
$$x_{k+1}=x_k-f(x_k)\frac{x_k-x_{k-1}}{f(x_k)-f(x_{k-1})}$$

**Falsa posição**: igual, mas mantendo sempre um intervalo com troca de sinal.

**Ponto fixo**: reescreva $f(x)=0$ como $x=\varphi(x)$ e itere $x_{k+1}=\varphi(x_k)$. Converge se $|\varphi'|<1$ perto da raiz.`,
        },
      ],
      exercises: [
        num(t`Secante em $f(x)=x^2-4$ com $x_0=1$ e $x_1=3$: calcule $x_2$.`, 1.75, t`$f(1)=-3$, $f(3)=5$: $x_2=3-5\cdot\frac{2}{8}=1{,}75$.`),
        mcq(t`Vantagem da secante sobre Newton:`, ['não precisa calcular a derivada', 'converge sempre', 'é mais rápida que Newton', 'não precisa de chute inicial'], 0),
        tf(t`A iteração de ponto fixo $x_{k+1}=\cos x_k$ converge para a solução de $x=\cos x$.`, true, t`$|\varphi'(x)|=|\operatorname{sen}x|<1$ perto da raiz ($\approx0{,}739$).`),
        match(t`Ligue o método à sua característica:`, [
          ['Bisseção', 'garantida, porém lenta'],
          ['Newton', 'quadrática, precisa de f′'],
          ['Secante', 'usa dois pontos, sem f′'],
          ['Ponto fixo', 'x = φ(x)'],
        ]),
      ],
    },
  ],
};

export const sistemasNum: Unit = {
  id: 'n-sis',
  title: 'Sistemas lineares (numérico)',
  subtitle: 'Eliminação de Gauss, pivotamento, Jacobi e Gauss-Seidel',
  icon: '🧱',
  source: 'Cálculo Numérico · Unidade 2 — Sistemas lineares',
  guide: t`Métodos **diretos** (Gauss, LU) dão a solução em número finito de passos. Métodos **iterativos** (Jacobi, Gauss-Seidel) refinam um chute — ótimos para sistemas enormes e esparsos.`,
  lessons: [
    {
      id: 'n-sis-gauss',
      title: 'Eliminação de Gauss',
      cards: [
        {
          title: 'Triangularizar e voltar',
          body: t`Operações elementares (trocar linhas, multiplicar por constante, somar múltiplo de outra) não mudam a solução.

1. Zere tudo **abaixo** da diagonal com multiplicadores $m_{ij}=\frac{a_{ij}}{a_{jj}}$
2. **Substituição regressiva**: resolva de baixo para cima`,
          visual: table(['passo', 'matriz aumentada'], [
            ['início', t`$\begin{pmatrix}2&1&-1&\big|&8\\-3&-1&2&\big|&-11\\-2&1&2&\big|&-3\end{pmatrix}$`],
            ['elimina col. 1', t`$\begin{pmatrix}2&1&-1&\big|&8\\0&\frac12&\frac12&\big|&1\\0&2&1&\big|&5\end{pmatrix}$`],
            ['elimina col. 2', t`$\begin{pmatrix}2&1&-1&\big|&8\\0&\frac12&\frac12&\big|&1\\0&0&-1&\big|&1\end{pmatrix}$`],
          ]),
          example: t`De baixo para cima: $z=-1$; $\frac12y-\frac12=1\Rightarrow y=3$; $2x+3+1=8\Rightarrow x=2$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = randNZ(rng, 1, 4);
          const c = randNZ(rng, -6, 6);
          return num(t`Na eliminação, para zerar $a_{21}=${c}$ usando o pivô $a_{11}=${a}$, qual o multiplicador $m_{21}$?`, c / a, t`$m_{21}=\frac{a_{21}}{a_{11}}=\frac{${c}}{${a}}$.`, { tol: 0.005 });
        }),
        gen((rng) => {
          const z = randInt(rng, -3, 3);
          const y = randInt(rng, -3, 3);
          const x = randInt(rng, -3, 3);
          return num(t`Resolva o sistema triangular $\begin{cases}x+y+z=${x + y + z}\\ \quad\ \ y+2z=${y + 2 * z}\\ \qquad\ \ 3z=${3 * z}\end{cases}$. Quanto vale $x$?`, x, t`$z=${z}$, $y=${y + 2 * z}-2\cdot(${z})=${y}$, $x=${x + y + z}-(${y})-(${z})=${x}$.`);
        }),
        order(t`Ordene a eliminação de Gauss:`, ['Montar a matriz aumentada', 'Zerar abaixo da diagonal coluna por coluna', 'Obter a matriz triangular superior', 'Resolver por substituição regressiva']),
        tf(t`Trocar duas linhas de um sistema muda sua solução.`, false),
      ],
    },
    {
      id: 'n-sis-piv',
      title: 'Pivotamento e fatoração LU',
      cards: [
        {
          title: 'Escolha o maior pivô',
          body: t`Dividir por um pivô pequeno amplifica erros de arredondamento. **Pivotamento parcial**: antes de eliminar a coluna $j$, troque para a posição do pivô a linha com o **maior** $|a_{ij}|$.

**Fatoração LU**: $A=LU$ ($L$ triangular inferior com os multiplicadores, $U$ triangular superior). Para vários vetores $b$: resolva $Ly=b$ e depois $Ux=y$ — muito mais barato que refazer Gauss.`,
          example: t`$\begin{pmatrix}0{,}0001&1\\1&1\end{pmatrix}$: troque as linhas antes de eliminar!`,
        },
      ],
      exercises: [
        mcqS(t`Com pivotamento parcial, qual linha vira pivô na coluna 1 de $\begin{pmatrix}1&2\\-5&1\\3&0\end{pmatrix}$?`, 'a linha 2 (|−5| é o maior)', ['a linha 1', 'a linha 3', 'tanto faz']),
        tf(t`Na fatoração $A=LU$, a matriz $L$ guarda os multiplicadores da eliminação.`, true),
        mcq(t`Por que usar LU quando há muitos vetores $b$ diferentes?`, ['a fatoração é feita uma vez só', 'LU é sempre exata', 'LU dispensa substituições', 'LU funciona sem pivôs'], 0),
        num(t`Na fatoração LU de $\begin{pmatrix}2&1\\6&8\end{pmatrix}$, qual o elemento $l_{21}$?`, 3, t`$m_{21}=\frac62=3$; $U=\begin{pmatrix}2&1\\0&5\end{pmatrix}$.`),
      ],
    },
    {
      id: 'n-sis-iter',
      title: 'Jacobi e Gauss-Seidel',
      cards: [
        {
          title: 'Chutar e melhorar',
          body: t`Isole cada incógnita na sua equação. Para $\begin{cases}4x+y=9\\x+3y=5\end{cases}$:
$$x=\frac{9-y}{4},\qquad y=\frac{5-x}{3}$$
• **Jacobi**: usa os valores da iteração anterior
• **Gauss-Seidel**: usa sempre o valor **mais recente** (converge mais rápido)

Acompanhe o zigue-zague até a solução $(2, 1)$:`,
          visual: gaussSeidelStepper(),
          tip: t`**Critério das linhas** (diagonal dominante): $|a_{ii}|>\sum_{j\ne i}|a_{ij}|$ em todas as linhas garante convergência.`,
        },
      ],
      exercises: [
        num(t`Gauss-Seidel em $4x+y=9$, $x+3y=5$ partindo de $(0, 0)$: qual $x^{(1)}$?`, 2.25, t`$x=\frac{9-0}{4}=2{,}25$.`),
        num(t`Continuando: com $x^{(1)}=2{,}25$, qual $y^{(1)}$ (Gauss-Seidel)?`, 0.9167, t`$y=\frac{5-2{,}25}{3}\approx0{,}9167$.`, { tol: 0.001 }),
        mcq(t`A matriz $\begin{pmatrix}5&1&2\\1&4&1\\2&1&6\end{pmatrix}$ é diagonalmente dominante?`, ['Sim', 'Não, falha na linha 1', 'Não, falha na linha 2', 'Não, falha na linha 3'], 0, t`$5>3$, $4>2$, $6>3$.`),
        tf(t`Gauss-Seidel costuma convergir mais rápido que Jacobi.`, true),
        match(t`Ligue método e tipo:`, [
          ['Eliminação de Gauss', 'direto'],
          ['Fatoração LU', 'direto (reutilizável)'],
          ['Jacobi', 'iterativo (valores antigos)'],
          ['Gauss-Seidel', 'iterativo (valores novos)'],
        ]),
      ],
    },
  ],
};
