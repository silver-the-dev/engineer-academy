import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, match, order, rmcq, table } from '../../helpers';
import { InfLine, PolylineW, Pt } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, term } from '../../../lib/random';
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

export const erros: UnitDef = {
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
      parts: [
        {
          card: {
            title: 'Truncar e arredondar',
            body: t`$\frac13=0{,}3333\ldots$ e $\pi=3{,}14159\ldots$ têm infinitos dígitos, mas a máquina guarda só alguns.

• **Truncamento**: corta as casas: $\pi\approx3{,}1415$
• **Arredondamento**: vai ao mais próximo: $\pi\approx3{,}1416$`,
            tip: t`Arredondar erra no máximo **meia unidade** da última casa; truncar pode errar quase uma unidade inteira.`,
          },
          exercises: [
            mcq(t`Truncar $2{,}789$ com uma casa decimal dá…`, ['$2{,}7$', '$2{,}8$', '$2{,}79$', '$3$'], 0, t`Truncar só corta: $2{,}7$.`),
            mcq(t`Arredondar $2{,}789$ com uma casa decimal dá…`, ['$2{,}8$', '$2{,}7$', '$2{,}79$', '$2{,}78$'], 0, t`O próximo dígito ($8$) é maior que $5$: sobe.`),
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
              return num(t`Arredonde $${fmt(x, 5)}$ com $${d}$ casas decimais.`, ar, t`Olhe o dígito seguinte: $${fmt(ar, d)}$.`, { tol: 1e-9 });
            }),
            tf(t`Truncar e arredondar sempre dão o mesmo resultado.`, false, t`Diferem quando o próximo dígito é $5$ ou mais: $3{,}147\to3{,}14$ (truncado) e $3{,}15$ (arredondado).`),
            gen((rng) => {
              const x = pick(rng, [2.71828, 1.41421, 3.14159, 1.73205]);
              const d = randInt(rng, 2, 3);
              const tr = Math.floor(x * 10 ** d) / 10 ** d;
              return num(t`Qual o erro absoluto ao **truncar** $${fmt(x, 5)}$ com $${d}$ casas? (5 casas)`, x - tr, t`$${fmt(x, 5)}-${fmt(tr, d)}=${fmt(x - tr, 5)}$.`, { tol: 0.000006 });
            }),
            num(t`Com 2 casas decimais, qual é o **maior** erro possível ao arredondar? (decimal)`, 0.005, t`Meia unidade da 2ª casa: $0{,}005$.`, { tol: 1e-9 }),
          ],
        },
        {
          card: {
            title: 'Bases e ponto flutuante',
            body: t`O computador trabalha em **base 2**: $(1011)_2=8+0+2+1=11$.

Ponto flutuante: $x=\pm0{,}d_1d_2\ldots d_t\times\beta^e$ (mantissa com $t$ dígitos, base $\beta$, expoente $e$).`,
            tip: t`$0{,}1$ não tem representação binária finita! Por isso, em muitas linguagens, $0{,}1+0{,}2\ne0{,}3$ exatamente.`,
          },
          exercises: [
            mcqS(t`Converta $(1011)_2$ para decimal.`, '$11$', ['$13$', '$1011$', '$9$'], t`$8+0+2+1=11$.`),
            gen((rng) => {
              const n = randInt(rng, 5, 31);
              return num(t`Converta $(${n.toString(2)})_2$ para decimal.`, n, t`Some as potências de 2 onde há $1$: $${n}$.`);
            }),
            num(t`Converta $(13)_{10}$ para binário (digite os dígitos, ex.: 1101).`, 1101, t`$13=8+4+1=(1101)_2$.`),
            gen((rng) => {
              const n = randInt(rng, 5, 20);
              return num(t`Converta $(${n})_{10}$ para binário (digite só os dígitos).`, Number(n.toString(2)), t`Divisões sucessivas por 2: $(${n.toString(2)})_2$.`);
            }),
            tf(t`O número $0{,}1$ é representado exatamente em binário.`, false, t`Em base 2, $0{,}1=0{,}0001100110011\ldots_2$ (dízima periódica).`),
            mcq(t`Em $0{,}d_1d_2\ldots d_t\times\beta^e$, o número de dígitos $t$ da mantissa controla…`, ['a precisão', 'o maior número representável', 'a base', 'o sinal'], 0, t`Mais dígitos na mantissa = mais casas significativas.`),
            num(t`Quantos números diferentes cabem em 8 bits?`, 256, t`$2^8=256$.`),
          ],
        },
      ],
    },
    {
      id: 'n-err-abs',
      title: 'Erro absoluto e relativo',
      parts: [
        {
          card: {
            title: 'Medindo o erro',
            body: t`Valor exato $x$, aproximado $\bar x$:
$$E_A=|x-\bar x|\qquad E_R=\frac{|x-\bar x|}{|x|}$$
O relativo diz se o erro é **grande em proporção**: errar 1 m em 1 km ($0{,}1\%$) é ótimo; errar 1 m em 2 m ($50\%$) é péssimo.`,
          },
          exercises: [
            gen((rng) => {
              const x = randInt(rng, 10, 90);
              const e = pick(rng, [0.5, 1, 2, 0.2]);
              return num(t`O valor exato é $${x}$ e o aproximado é $${fmt(x + e)}$. Qual o erro absoluto?`, e, t`$|${x}-${fmt(x + e)}|=${fmt(e)}$.`, { tol: 1e-9 });
            }),
            gen((rng) => {
              const x = pick(rng, [100, 250, 80, 1000]);
              const e = pick(rng, [1, 2, 5]);
              return num(t`O valor exato é $${x}$ e o aproximado $${x + e}$. Qual o erro relativo em %?`, (100 * e) / x, t`$\frac{${e}}{${x}}=${fmt(e / x, 4)}=${fmt((100 * e) / x, 2)}\%$.`, { tol: 0.01, unit: '%' });
            }),
            num(t`Aproximando $\pi$ por $3{,}14$, qual o erro absoluto (4 casas)?`, 0.0016, t`$|3{,}14159-3{,}14|\approx0{,}0016$.`, { tol: 0.00005 }),
            mcq(t`Qual medição é mais precisa em termos relativos?`, ['erro de 1 cm em 10 m', 'erro de 1 cm em 1 m', 'erro de 1 mm em 1 cm', 'erro de 1 m em 5 m'], 0, t`$\frac{1}{1000}=0{,}1\%$ é o menor relativo.`),
            tf(t`Um erro absoluto de $1$ pode ser pequeno ou grande, dependendo do valor medido.`, true, t`É para isso que serve o erro relativo.`),
            gen((rng) => {
              const [x, ap] = pick(rng, [[1.41421, 1.41], [2.71828, 2.72], [1.73205, 1.73]] as const);
              return num(t`Qual o erro relativo (em %) de aproximar $${fmt(x, 5)}$ por $${fmt(ap)}$? (2 casas)`, (100 * Math.abs(x - ap)) / x, t`$\frac{${fmt(Math.abs(x - ap), 5)}}{${fmt(x, 5)}}\approx${fmt((100 * Math.abs(x - ap)) / x, 2)}\%$.`, { tol: 0.01, unit: '%' });
            }),
            num(t`Uma peça deveria ter $50$ mm e mediu $49{,}8$ mm. Qual o erro relativo em %?`, 0.4, t`$\frac{0{,}2}{50}=0{,}004=0{,}4\%$.`, { tol: 0.001, unit: '%' }),
          ],
        },
        {
          card: {
            title: 'Propagação e cancelamento',
            body: t`Erros se **acumulam** nas contas. Dois perigos clássicos:

• **Cancelamento catastrófico**: subtrair números muito próximos perde algarismos significativos.
• **Somar pequeno com grande**: os dígitos do pequeno podem "sumir" além da mantissa.`,
            tip: t`$\sqrt{10001}-\sqrt{10000}$ é melhor calculado como $\frac{1}{\sqrt{10001}+\sqrt{10000}}$: mesmo valor, sem subtrair números quase iguais.`,
          },
          exercises: [
            tf(t`Somar muitos números pequenos a um número grande pode perder precisão.`, true, t`Os dígitos dos pequenos "somem" além da mantissa do grande. Some os pequenos primeiro!`),
            mcq(t`Qual conta está mais sujeita a cancelamento catastrófico?`, ['$1{,}000001-1{,}000000$', '$1+1000$', '$3\\cdot5$', '$\\frac{10}{2}$'], 0, t`Subtração de números quase iguais.`),
            mcq(t`Para evitar cancelamento em $\sqrt{x+1}-\sqrt{x}$ com $x$ grande, é melhor calcular…`, ['$\\frac{1}{\\sqrt{x+1}+\\sqrt{x}}$', '$\\sqrt{1}$', '$\\sqrt{x+1-x}$', '$(x+1)-x$'], 0, t`Multiplique pelo conjugado: o valor é o mesmo, sem a subtração perigosa.`),
            tf(t`Com aritmética de 4 dígitos, $1000+0{,}4$ pode resultar exatamente em $1000$.`, true, t`$1000{,}4$ precisa de 5 dígitos; com 4, vira $1000$.`),
            mcq(t`Ao somar uma lista de números de tamanhos muito diferentes, a ordem mais segura é…`, ['do menor para o maior', 'do maior para o menor', 'tanto faz', 'aleatória'], 0, t`Os pequenos se somam entre si antes de "sumirem" no grande.`),
            num(t`Se $x=10\pm0{,}1$ e $y=5\pm0{,}1$, qual o maior erro absoluto possível de $x+y$?`, 0.2, t`Na soma, os erros absolutos se somam no pior caso: $0{,}1+0{,}1$.`, { tol: 1e-9 }),
            num(t`Com 4 dígitos significativos, $a=1{,}234$ e $b=1{,}233$. Quantos dígitos significativos sobram em $a-b=0{,}001$?`, 1, t`Só o último dígito sobrou: houve cancelamento de 3 dígitos.`),
          ],
        },
      ],
    },
  ],
};

const polyLin = (m: number, b: number) => term(m, 'x', true) + term(b, '');

export const zeros: UnitDef = {
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
      parts: [
        {
          card: {
            title: 'Bolzano: troca de sinal',
            body: t`Se $f$ é contínua e $f(a)\cdot f(b)<0$, existe raiz em $(a,\,b)$.

**Isolar** uma raiz é achar um intervalo pequeno com troca de sinal: monte uma tabela de valores e procure onde o sinal muda.`,
          },
          exercises: [
            mcq(t`Em qual intervalo $f(x)=x^2-3$ tem raiz?`, ['$[1,\\ 2]$', '$[2,\\ 3]$', '$[0,\\ 1]$', '$[-1,\\ 0]$'], 0, t`$f(1)=-2<0$ e $f(2)=1>0$.`),
            tf(t`Se $f(a)f(b)>0$, não há raízes em $[a,b]$.`, false, t`Pode haver um número **par** de raízes (ex.: $x^2-0{,}25$ em $[-1, 1]$).`),
            gen((rng) => {
              const k = randInt(rng, 2, 9);
              const a = Math.floor(Math.cbrt(k * 10));
              const f = (x: number) => x ** 3 - 10 * k;
              const ok = f(a) < 0 && f(a + 1) > 0;
              return rmcq(rng, t`Em qual intervalo $f(x)=x^3-${10 * k}$ tem raiz?`, ok ? `$[${a},\\ ${a + 1}]$` : `$[${a - 1},\\ ${a}]$`, [`$[${a + 1},\\ ${a + 2}]$`, `$[${a - 2},\\ ${a - 1}]$`, `$[0,\\ 1]$`, `$[${a + 2},\\ ${a + 3}]$`], t`Procure a troca de sinal: $\sqrt[3]{${10 * k}}\approx${fmt(Math.cbrt(10 * k), 2)}$.`);
            }),
            mcq(t`Por que o teorema de Bolzano exige que $f$ seja **contínua**?`, ['para garantir que não há "pulos" sobre o eixo', 'para poder derivar', 'para a raiz ser inteira', 'não exige'], 0, t`Uma função descontínua pode trocar de sinal pulando o zero (ex.: $\frac1x$).`),
            num(t`$f(x)=x^3+x-3$: $f(1)=-1$ e $f(2)=7$. Quantas raízes há em $[1,\,2]$ se $f$ é sempre crescente?`, 1, t`Crescente: cruza o eixo uma única vez.`),
            gen((rng) => {
              const r = randInt(rng, 2, 6);
              const f = (x: number) => x * x - r * r - 1;
              return rmcq(rng, t`$f(x)=x^2-${r * r + 1}$. Entre quais inteiros positivos está a raiz?`, `$${r}$ e $${r + 1}$`, [`$${r - 1}$ e $${r}$`, `$${r + 1}$ e $${r + 2}$`, `$0$ e $1$`], t`$f(${r})=${f(r)}<0$ e $f(${r + 1})=${f(r + 1)}>0$.`);
            }),
            num(t`Quantas raízes reais $f(x)=x^3-3x+1$ tem em $[-2,\,2]$? (use os valores em $-2,-1,0,1,2$)`, 3, t`$f(-2)=-1$, $f(-1)=3$, $f(0)=1$, $f(1)=-1$, $f(2)=3$: três trocas de sinal.`),
          ],
        },
        {
          card: {
            title: 'Bisseção',
            body: t`$m=\frac{a+b}{2}$; fique com a metade onde o sinal muda e repita. Avance passo a passo em $f(x)=x^3-x-2$:`,
            visual: bisectionStepper((x) => x ** 3 - x - 2, 1, 2, 8, { xMin: 0.7, xMax: 2.3, yMin: -3, yMax: 5 }),
            tip: t`Após $n$ passos o erro é no máximo $\frac{b-a}{2^n}$. Para erro $<\varepsilon$: $n>\log_2\frac{b-a}{\varepsilon}$.`,
          },
          exercises: [
            num(t`Qual o primeiro ponto médio da bisseção em $[1,\,2]$?`, 1.5, t`$\frac{1+2}{2}=1{,}5$.`),
            gen((rng) => {
              const f = (x: number) => x ** 3 - x - 2;
              return mcq(t`Bisseção em $f(x)=x^3-x-2$ no intervalo $[1,\,2]$: $f(1{,}5)=${fmt(f(1.5), 3)}$. Qual o novo intervalo?`, ['$[1{,}5;\\ 2]$', '$[1;\\ 1{,}5]$', '$[1;\\ 2]$', '$[1{,}25;\\ 1{,}75]$'], 0, t`$f(1{,}5)<0$ e $f(2)>0$: a troca de sinal está em $[1{,}5;\ 2]$.`);
            }),
            gen((rng) => {
              const L = pick(rng, [1, 2, 4]);
              const n = randInt(rng, 3, 10);
              return num(t`Partindo de um intervalo de comprimento $${L}$, qual o comprimento após $${n}$ bisseções?`, L / 2 ** n, t`$\frac{${L}}{2^{${n}}}=${fmt(L / 2 ** n, 6)}$.`, { tol: 1e-7 });
            }),
            tf(t`A bisseção sempre converge se começar com um intervalo com troca de sinal (e $f$ contínua).`, true, t`O intervalo cai pela metade a cada passo e sempre contém uma raiz.`),
            num(t`Quantas bisseções (mínimo) garantem erro $<0{,}001$ partindo de $[0,\,1]$?`, 10, t`$2^{-n}<10^{-3}\Rightarrow n>9{,}97$ ⟹ $n=10$.`),
            mcq(t`Bisseção em $[2,\,3]$ para $f$ com $f(2)<0$, $f(3)>0$ e $f(2{,}5)>0$. Próximo intervalo e próximo ponto médio:`, ['$[2;\\ 2{,}5]$ e $2{,}25$', '$[2{,}5;\\ 3]$ e $2{,}75$', '$[2;\\ 3]$ e $2{,}5$', '$[2;\\ 2{,}5]$ e $2{,}5$'], 0, t`A troca de sinal fica entre $2$ e $2{,}5$.`),
            num(t`Quantas bisseções (mínimo) garantem erro $<0{,}01$ partindo de um intervalo de comprimento $4$?`, 9, t`$\frac{4}{2^n}<0{,}01\Rightarrow 2^n>400\Rightarrow n=9$ ($2^9=512$).`),
          ],
        },
      ],
    },
    {
      id: 'n-zer-newton',
      title: 'Método de Newton',
      parts: [
        {
          card: {
            title: 'Siga a tangente',
            body: t`$$x_{k+1}=x_k-\frac{f(x_k)}{f'(x_k)}$$
A tangente em $x_k$ corta o eixo em $x_{k+1}$. Veja a convergência para $\sqrt2$ com $f(x)=x^2-2$:`,
            visual: newtonStepper((x) => x * x - 2, (x) => 2 * x, 3, 4, { xMin: 0, xMax: 3.4, yMin: -3, yMax: 8 }),
          },
          exercises: [
            mcq(t`Newton exige, além de $f$…`, ["a derivada f'", 'um intervalo com troca de sinal', 'dois chutes iniciais', 'a integral de f'], 0, t`A fórmula divide por $f'(x_k)$.`),
            gen((rng) => {
              const a = pick(rng, [2, 3, 5, 7, 10]);
              const x0 = Math.ceil(Math.sqrt(a));
              const x1 = x0 - (x0 * x0 - a) / (2 * x0);
              return num(t`Newton para $f(x)=x^2-${a}$ com $x_0=${x0}$: calcule $x_1$.`, x1, t`$x_1=${x0}-\frac{${x0 * x0 - a}}{${2 * x0}}=${fmt(x1, 5)}$.`, { tol: 1e-4 });
            }),
            num(t`Newton em $f(x)=x^3-2x-5$ com $x_0=2$: calcule $x_1$.`, 2.1, t`$f(2)=-1$, $f'(2)=10$: $x_1=2+\frac{1}{10}=2{,}1$.`),
            mcqS(t`A fórmula de Newton para $\sqrt{a}$ (com $f=x^2-a$) é:`, t`$x_{k+1}=\frac12\left(x_k+\frac{a}{x_k}\right)$`, [t`$x_{k+1}=x_k-\frac{a}{2}$`, t`$x_{k+1}=\frac{x_k+a}{2}$`, t`$x_{k+1}=x_k^2-a$`], t`$x-\frac{x^2-a}{2x}=\frac{x}{2}+\frac{a}{2x}$.`),
            gen((rng) => {
              const c = randInt(rng, 2, 6);
              const x0 = randInt(rng, 1, 4);
              const x1 = x0 - (x0 - c);
              return num(t`Newton em $f(x)=x-${c}$ com $x_0=${x0}$: quanto vale $x_1$?`, x1, t`Para uma reta, a tangente é a própria reta: Newton acerta em um passo, $x_1=${c}$.`);
            }),
            num(t`Newton em $f(x)=e^x-2$ com $x_0=0$: calcule $x_1$.`, 1, t`$f(0)=-1$, $f'(0)=1$: $x_1=0+1=1$.`),
            gen((rng) => {
              const a = pick(rng, [2, 3, 5]);
              const x0 = 2;
              const x1 = 0.5 * (x0 + a / x0);
              const x2 = 0.5 * (x1 + a / x1);
              return num(t`Use $x_{k+1}=\frac12\left(x_k+\frac{${a}}{x_k}\right)$ com $x_0=2$ e calcule $x_2$ (5 casas).`, x2, t`$x_1=${fmt(x1, 5)}$ e $x_2=${fmt(x2, 5)}$ (já perto de $\sqrt{${a}}\approx${fmt(Math.sqrt(a), 5)}$).`, { tol: 1e-4 });
            }),
          ],
        },
        {
          card: {
            title: 'Convergência e cuidados',
            body: t`Perto da raiz, Newton tem convergência **quadrática**: o número de casas certas aproximadamente **dobra** a cada passo.

Cuidados:
• chute ruim pode fazer divergir ou oscilar
• $f'(x_k)\approx0$ faz a tangente quase horizontal e o próximo ponto "voa" longe`,
          },
          exercises: [
            tf(t`O método de Newton sempre converge, qualquer que seja o chute inicial.`, false, t`Pode divergir ou oscilar se o chute for ruim ou $f'$ for quase zero.`),
            mcq(t`Se $x_k$ tem 3 casas corretas e Newton converge quadraticamente, quantas casas corretas $x_{k+1}$ terá, aproximadamente?`, ['6', '4', '3', '9'], 0, t`As casas certas dobram, aproximadamente.`),
            mcq(t`O que acontece em Newton se $f'(x_k)=0$?`, ['a fórmula divide por zero: o método falha', 'converge na hora', 'nada muda', 'vira bisseção'], 0, t`A tangente é horizontal e não corta o eixo.`),
            mcq(t`Comparando bisseção e Newton perto da raiz:`, ['Newton converge muito mais rápido', 'bisseção é sempre mais rápida', 'são iguais', 'Newton é linear e bisseção quadrática'], 0, t`Bisseção ganha 1 bit por passo; Newton dobra as casas.`),
            tf(t`Uma boa estratégia é usar bisseção para chegar perto e depois Newton para refinar.`, true, t`Combina a segurança da bisseção com a velocidade de Newton.`),
            mcq(t`Para $f(x)=x^2-2$, qual chute inicial é **proibido** em Newton?`, ['$x_0=0$', '$x_0=1$', '$x_0=2$', '$x_0=-1$'], 0, t`$f'(0)=0$.`),
            num(t`Os erros de Newton numa iteração foram $10^{-2}$, depois $10^{-4}$. Qual o expoente esperado do próximo erro (ex.: $-8$ para $10^{-8}$)?`, -8, t`Convergência quadrática: o erro aproximadamente se eleva ao quadrado: $(10^{-4})^2=10^{-8}$.`),
          ],
        },
      ],
    },
    {
      id: 'n-zer-sec',
      title: 'Secante e ponto fixo',
      parts: [
        {
          card: {
            title: 'Sem derivada: secante',
            body: t`Troque $f'$ pela inclinação da secante pelos dois últimos pontos:
$$x_{k+1}=x_k-f(x_k)\frac{x_k-x_{k-1}}{f(x_k)-f(x_{k-1})}$$

**Falsa posição**: mesma conta, mas mantendo sempre um intervalo com troca de sinal (como na bisseção).`,
          },
          exercises: [
            mcq(t`Vantagem da secante sobre Newton:`, ['não precisa calcular a derivada', 'converge sempre', 'é mais rápida que Newton', 'não precisa de chute inicial'], 0, t`A derivada é aproximada pela inclinação entre dois pontos.`),
            mcq(t`Quantos pontos iniciais a secante precisa?`, ['2', '1', '3', 'nenhum'], 0, t`$x_0$ e $x_1$, para traçar a primeira secante.`),
            num(t`Secante em $f(x)=x^2-4$ com $x_0=1$ e $x_1=3$: calcule $x_2$.`, 1.75, t`$f(1)=-3$, $f(3)=5$: $x_2=3-5\cdot\frac{2}{8}=1{,}75$.`),
            gen((rng) => {
              const m = randNZ(rng, -3, 4);
              const b = randInt(rng, -6, 6);
              const r = -b / m;
              return num(t`Secante em $f(x)=${polyLin(m, b)}$ com $x_0=0$ e $x_1=1$: calcule $x_2$. (fração ou decimal)`, r, t`Para uma reta a secante é a própria reta: $x_2$ já é a raiz, $${fmt(r, 4)}$.`, { tol: 0.002 });
            }),
            tf(t`A falsa posição mantém sempre a raiz dentro do intervalo.`, true, t`Ela escolhe o subintervalo com troca de sinal, como a bisseção.`),
            num(t`Secante em $f(x)=x^2-2$ com $x_0=1$ e $x_1=2$: calcule $x_2$ (4 casas).`, 4 / 3, t`$f(1)=-1$, $f(2)=2$: $x_2=2-2\cdot\frac{1}{3}=1{,}3333$.`, { tol: 0.001 }),
            mcq(t`A ordem de convergência da secante (≈1,618) fica…`, ['entre a bisseção e Newton', 'abaixo da bisseção', 'acima de Newton', 'igual à de Newton'], 0, t`Mais rápida que a bisseção (1) e um pouco mais lenta que Newton (2).`),
          ],
        },
        {
          card: {
            title: 'Ponto fixo',
            body: t`Reescreva $f(x)=0$ como $x=\varphi(x)$ e itere:
$$x_{k+1}=\varphi(x_k)$$

Converge se $|\varphi'(x)|<1$ perto da raiz. Quanto menor $|\varphi'|$, mais rápido.`,
            example: t`$x=\cos x$: comece em $x_0=1$ e aplique $\cos$ repetidamente: $0{,}540$, $0{,}858$, $0{,}654$, … $\to0{,}739$.`,
          },
          exercises: [
            tf(t`A iteração de ponto fixo $x_{k+1}=\cos x_k$ converge para a solução de $x=\cos x$.`, true, t`$|\varphi'(x)|=|\operatorname{sen}x|<1$ perto da raiz ($\approx0{,}739$).`),
            mcq(t`Qual condição garante convergência do ponto fixo perto da raiz?`, ["$|\\varphi'(x)|<1$", "$\\varphi'(x)=0$ em todo ponto", "$|\\varphi'(x)|>1$", '$\\varphi$ crescente'], 0, t`A cada passo o erro é multiplicado por aproximadamente $|\varphi'|$.`),
            gen((rng) => {
              const c = randInt(rng, 2, 8);
              const x0 = randInt(rng, 0, 4);
              const x1 = 0.5 * x0 + c / 2;
              return num(t`Itere $x_{k+1}=\frac{x_k+${c}}{2}$ a partir de $x_0=${x0}$. Quanto vale $x_1$?`, x1, t`$\frac{${x0}+${c}}{2}=${fmt(x1)}$. (O ponto fixo é $x=${c}$.)`);
            }),
            mcq(t`Qual forma $x=\varphi(x)$ corresponde a $x^2-x-2=0$?`, ['$x=\\sqrt{x+2}$', '$x=x^2+2$', '$x=\\frac{2}{x^2}$', '$x=x-2$'], 0, t`$x^2=x+2\Rightarrow x=\sqrt{x+2}$ (para a raiz positiva).`),
            num(t`O ponto fixo de $\varphi(x)=\frac{x}{2}+3$ é:`, 6, t`$x=\frac x2+3\Rightarrow x=6$.`),
            match(t`Ligue o método à sua característica:`, [
              ['Bisseção', 'garantida, porém lenta'],
              ['Newton', 'quadrática, precisa de f′'],
              ['Secante', 'usa dois pontos, sem f′'],
              ['Ponto fixo', 'x = φ(x)'],
            ], t`Bisseção só usa a troca de sinal (sempre converge, devagar); Newton usa a derivada (convergência quadrática); a secante troca $f'$ por dois pontos; o ponto fixo itera $x=\varphi(x)$.`),
            mcq(t`A iteração $x_{k+1}=3x_k$ a partir de $x_0=1$…`, ['diverge, pois $|\\varphi\'|=3>1$', 'converge para 0', 'converge para 3', 'fica parada em 1'], 0, t`$1,\,3,\,9,\,27,\ldots$: o ponto fixo $0$ repele.`),
          ],
        },
      ],
    },
  ],
};

const mtx = (rows: (number | string)[][]) => `\\begin{pmatrix}${rows.map((r) => r.join('&')).join('\\\\')}\\end{pmatrix}`;

export const sistemasNum: UnitDef = {
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
      parts: [
        {
          card: {
            title: 'Operações elementares',
            body: t`Três operações **não mudam** a solução de um sistema:
• trocar duas linhas
• multiplicar uma linha por constante não nula
• somar a uma linha um múltiplo de outra

Para zerar $a_{ij}$ abaixo do pivô $a_{jj}$, use o **multiplicador** $m_{ij}=\frac{a_{ij}}{a_{jj}}$: $L_i\leftarrow L_i-m_{ij}L_j$.`,
          },
          exercises: [
            tf(t`Trocar duas linhas de um sistema muda sua solução.`, false, t`É só reordenar as equações.`),
            gen((rng) => {
              const a = randNZ(rng, 1, 4);
              const c = randNZ(rng, -6, 6);
              return num(t`Na eliminação, para zerar $a_{21}=${c}$ usando o pivô $a_{11}=${a}$, qual o multiplicador $m_{21}$?`, c / a, t`$m_{21}=\frac{a_{21}}{a_{11}}=\frac{${c}}{${a}}$.`, { tol: 0.005 });
            }),
            mcq(t`Qual operação **não** é permitida na eliminação?`, ['multiplicar uma linha por zero', 'trocar duas linhas', 'somar a uma linha o dobro de outra', 'dividir uma linha por 3'], 0, t`Multiplicar por zero apaga uma equação.`),
            gen((rng) => {
              const a = randNZ(rng, 1, 3);
              const m = randNZ(rng, -3, 3);
              const r1 = [a, randInt(rng, -3, 3), randInt(rng, -5, 5)];
              const r2 = [m * a, randInt(rng, -3, 3), randInt(rng, -5, 5)];
              const nb = r2[1] - m * r1[1];
              return num(t`Em $${mtx([[r1[0], r1[1], '|', r1[2]], [r2[0], r2[1], '|', r2[2]]])}$, faça $L_2\leftarrow L_2-${m}L_1$. Qual o novo elemento $a_{22}$?`, nb, t`$${r2[1]}-(${m})\cdot(${r1[1]})=${nb}$.`);
            }),
            mcq(t`Depois da eliminação, a matriz dos coeficientes fica…`, ['triangular superior', 'diagonal', 'nula', 'simétrica'], 0, t`Zeros abaixo da diagonal.`),
            tf(t`Multiplicar uma equação por $5$ não muda a solução do sistema.`, true, t`A equação continua dizendo a mesma coisa.`),
            num(t`Para zerar o $6$ em $\begin{pmatrix}2&1\\6&5\end{pmatrix}$, quanto vale o novo $a_{22}$?`, 2, t`$m=3$: $5-3\cdot1=2$.`),
          ],
        },
        {
          card: {
            title: 'Triangularizar e voltar',
            body: t`1. Zere tudo **abaixo** da diagonal, coluna por coluna
2. **Substituição regressiva**: resolva de baixo para cima`,
            visual: table(['passo', 'matriz aumentada'], [
              ['início', t`$\begin{pmatrix}2&1&-1&\big|&8\\-3&-1&2&\big|&-11\\-2&1&2&\big|&-3\end{pmatrix}$`],
              ['elimina col. 1', t`$\begin{pmatrix}2&1&-1&\big|&8\\0&\frac12&\frac12&\big|&1\\0&2&1&\big|&5\end{pmatrix}$`],
              ['elimina col. 2', t`$\begin{pmatrix}2&1&-1&\big|&8\\0&\frac12&\frac12&\big|&1\\0&0&-1&\big|&1\end{pmatrix}$`],
            ]),
            example: t`De baixo para cima: $z=-1$; $\frac12y-\frac12=1\Rightarrow y=3$; $2x+3+1=8\Rightarrow x=2$.`,
          },
          exercises: [
            order(t`Ordene a eliminação de Gauss:`, ['Montar a matriz aumentada', 'Zerar abaixo da diagonal coluna por coluna', 'Obter a matriz triangular superior', 'Resolver por substituição regressiva'], t`A eliminação transforma a matriz aumentada em triangular superior; a última equação tem uma incógnita só e a substituição regressiva resolve de baixo para cima.`),
            gen((rng) => {
              const z = randInt(rng, -3, 3);
              const y = randInt(rng, -3, 3);
              const x = randInt(rng, -3, 3);
              return num(t`Resolva o sistema triangular $\begin{cases}x+y+z=${x + y + z}\\ \quad\ \ y+2z=${y + 2 * z}\\ \qquad\ \ 3z=${3 * z}\end{cases}$. Quanto vale $x$?`, x, t`$z=${z}$, $y=${y + 2 * z}-2\cdot(${z})=${y}$, $x=${x + y + z}-(${y})-(${z})=${x}$.`);
            }),
            mcq(t`Na substituição regressiva, qual incógnita se calcula **primeiro**?`, ['a última (linha de baixo)', 'a primeira', 'a do meio', 'todas ao mesmo tempo'], 0, t`A última linha tem uma incógnita só.`),
            gen((rng) => {
              const y = randInt(rng, -4, 4);
              const x = randInt(rng, -4, 4);
              const a = randNZ(rng, 1, 3);
              const b = randInt(rng, -3, 3);
              const c = randNZ(rng, 1, 4);
              return num(t`Resolva $\begin{cases}${a}x${term(b, 'y')}=${a * x + b * y}\\ ${c}y=${c * y}\end{cases}$. Quanto vale $x$?`, x, t`$y=${y}$; depois $${a}x=${a * x + b * y}-(${b * y})\Rightarrow x=${x}$.`);
            }),
            num(t`No exemplo do card, qual o valor de $y$?`, 3, t`$\frac12y+\frac12(-1)=1\Rightarrow y=3$.`),
            tf(t`Se aparecer uma linha $(0\ 0\ 0\ |\ 5)$ na eliminação, o sistema é impossível.`, true, t`Ela diz $0=5$.`),
            gen((rng) => {
              const [x, y] = [randInt(rng, -3, 4), randInt(rng, -3, 4)];
              return num(t`Use eliminação em $\begin{cases}x+2y=${x + 2 * y}\\ 3x+4y=${3 * x + 4 * y}\end{cases}$. Quanto vale $y$?`, y, t`$L_2-3L_1$: $-2y=${3 * x + 4 * y - 3 * (x + 2 * y)}\Rightarrow y=${y}$.`);
            }),
          ],
        },
      ],
    },
    {
      id: 'n-sis-piv',
      title: 'Pivotamento e fatoração LU',
      parts: [
        {
          card: {
            title: 'Escolha o maior pivô',
            body: t`Dividir por um pivô **pequeno** amplifica erros de arredondamento.

**Pivotamento parcial**: antes de eliminar a coluna $j$, traga para a posição do pivô a linha com o **maior** $|a_{ij}|$ daquela coluna.`,
            example: t`$\begin{pmatrix}0{,}0001&1\\1&1\end{pmatrix}$: troque as linhas antes de eliminar!`,
          },
          exercises: [
            mcqS(t`Com pivotamento parcial, qual linha vira pivô na coluna 1 de $\begin{pmatrix}1&2\\-5&1\\3&0\end{pmatrix}$?`, 'a linha 2 (|−5| é o maior)', ['a linha 1', 'a linha 3', 'tanto faz'], t`Compara-se o **módulo**: $|-5|=5$.`),
            tf(t`Um pivô igual a zero obriga a trocar de linha.`, true, t`Não dá para dividir por zero.`),
            gen((rng) => {
              const vals = [randNZ(rng, -9, 9), randNZ(rng, -9, 9), randNZ(rng, -9, 9)];
              let k = 0;
              vals.forEach((v, i) => Math.abs(v) > Math.abs(vals[k]) && (k = i));
              if (vals.filter((v) => Math.abs(v) === Math.abs(vals[k])).length > 1) vals[k] += vals[k] > 0 ? 1 : -1;
              return num(t`A coluna 1 de uma matriz $3\times3$ é $(${vals[0]},\ ${vals[1]},\ ${vals[2]})$. Com pivotamento parcial, qual linha vira a do pivô (1, 2 ou 3)?`, k + 1, t`O maior módulo é $|${vals[k]}|$, na linha $${k + 1}$.`);
            }),
            mcq(t`Qual o principal motivo do pivotamento parcial?`, ['reduzir erros de arredondamento', 'deixar a matriz simétrica', 'evitar a substituição regressiva', 'aumentar o determinante'], 0, t`Multiplicadores pequenos ($|m|\le1$) não amplificam erros.`),
            tf(t`Com pivotamento parcial, todos os multiplicadores ficam com módulo no máximo 1.`, true, t`O pivô é o maior da coluna: $|m_{ij}|=\frac{|a_{ij}|}{|a_{jj}|}\le1$.`),
            mcq(t`No sistema com $\begin{pmatrix}0{,}0001&1\\1&1\end{pmatrix}$, sem pivotar, o multiplicador seria…`, ['$10\\,000$', '$0{,}0001$', '$1$', '$0$'], 0, t`$\frac{1}{0{,}0001}=10\,000$: um número enorme que amplifica erros.`),
            num(t`Trocar duas linhas multiplica o determinante por qual número?`, -1, t`Troca de linhas troca o sinal do determinante.`),
          ],
        },
        {
          card: {
            title: 'Fatoração LU',
            body: t`$A=LU$: $L$ é triangular **inferior** (com 1 na diagonal e os multiplicadores abaixo) e $U$ é a triangular **superior** que sobra da eliminação.

Para resolver $Ax=b$: primeiro $Ly=b$ (de cima para baixo), depois $Ux=y$ (de baixo para cima). Com muitos vetores $b$, fatora-se uma vez só.`,
            example: t`$\begin{pmatrix}2&1\\6&8\end{pmatrix}=\begin{pmatrix}1&0\\3&1\end{pmatrix}\begin{pmatrix}2&1\\0&5\end{pmatrix}$.`,
          },
          exercises: [
            tf(t`Na fatoração $A=LU$, a matriz $L$ guarda os multiplicadores da eliminação.`, true, t`Cada $m_{ij}$ fica na posição $(i,j)$ de $L$.`),
            num(t`Na fatoração LU de $\begin{pmatrix}2&1\\6&8\end{pmatrix}$, qual o elemento $l_{21}$?`, 3, t`$m_{21}=\frac62=3$; $U=\begin{pmatrix}2&1\\0&5\end{pmatrix}$.`),
            mcq(t`Por que usar LU quando há muitos vetores $b$ diferentes?`, ['a fatoração é feita uma vez só', 'LU é sempre exata', 'LU dispensa substituições', 'LU funciona sem pivôs'], 0, t`Depois é só resolver dois sistemas triangulares, que são baratos.`),
            gen((rng) => {
              const a = randNZ(rng, 1, 4);
              const m = randNZ(rng, -3, 3);
              const b = randInt(rng, -3, 3);
              const d = randInt(rng, -5, 5);
              return num(t`Em $A=${mtx([[a, b], [m * a, d]])}=LU$, qual o elemento $u_{22}$ de $U$?`, d - m * b, t`$m_{21}=${m}$ e $u_{22}=${d}-(${m})\cdot(${b})=${d - m * b}$.`);
            }),
            mcq(t`Para resolver $Ax=b$ com $A=LU$, a ordem é…`, ['resolver $Ly=b$ e depois $Ux=y$', 'resolver $Ux=b$ e depois $Ly=x$', 'inverter $L$ e $U$', 'somar $L$ e $U$'], 0, t`$LUx=b$: chame $Ux=y$.`),
            num(t`Com $L=\begin{pmatrix}1&0\\3&1\end{pmatrix}$ e $b=(4,\,14)$, resolva $Ly=b$. Quanto vale $y_2$?`, 2, t`$y_1=4$ e $3\cdot4+y_2=14\Rightarrow y_2=2$.`),
            num(t`Continuando, com $U=\begin{pmatrix}2&1\\0&5\end{pmatrix}$ e $y=(4,\,2)$, resolva $Ux=y$. Quanto vale $x_1$? (decimal)`, 1.8, t`$x_2=\frac25=0{,}4$ e $2x_1+0{,}4=4\Rightarrow x_1=1{,}8$.`, { tol: 0.001 }),
          ],
        },
      ],
    },
    {
      id: 'n-sis-iter',
      title: 'Jacobi e Gauss-Seidel',
      parts: [
        {
          card: {
            title: 'Chutar e melhorar',
            body: t`Isole cada incógnita na sua equação. Para $\begin{cases}4x+y=9\\x+3y=5\end{cases}$:
$$x=\frac{9-y}{4},\qquad y=\frac{5-x}{3}$$
• **Jacobi**: usa os valores da iteração anterior
• **Gauss-Seidel**: usa sempre o valor **mais recente** (converge mais rápido)

Acompanhe o zigue-zague até a solução $(2,\,1)$:`,
            visual: gaussSeidelStepper(),
          },
          exercises: [
            num(t`Gauss-Seidel em $4x+y=9$, $x+3y=5$ partindo de $(0,\,0)$: qual $x^{(1)}$?`, 2.25, t`$x=\frac{9-0}{4}=2{,}25$.`),
            num(t`Continuando: com $x^{(1)}=2{,}25$, qual $y^{(1)}$ (Gauss-Seidel)?`, 0.9167, t`$y=\frac{5-2{,}25}{3}\approx0{,}9167$.`, { tol: 0.001 }),
            num(t`No **Jacobi**, partindo de $(0,\,0)$, qual $y^{(1)}$ no mesmo sistema? (4 casas)`, 5 / 3, t`Jacobi usa o $x$ antigo ($0$): $y=\frac{5-0}{3}\approx1{,}6667$.`, { tol: 0.001 }),
            tf(t`Gauss-Seidel costuma convergir mais rápido que Jacobi.`, true, t`Ele aproveita na hora os valores recém-calculados.`),
            match(t`Ligue método e tipo:`, [
              ['Eliminação de Gauss', 'direto'],
              ['Fatoração LU', 'direto (reutilizável)'],
              ['Jacobi', 'iterativo (valores antigos)'],
              ['Gauss-Seidel', 'iterativo (valores novos)'],
            ], t`Métodos diretos chegam à solução num número finito de passos; os iterativos refinam um palpite (Jacobi usa só valores da iteração anterior; Gauss-Seidel usa os já atualizados).`),
            gen((rng) => {
              const [x, y] = [randInt(rng, 1, 3), randInt(rng, 1, 3)];
              const e1 = 5 * x + y;
              const e2 = x + 4 * y;
              return num(t`Para $\begin{cases}5x+y=${e1}\\x+4y=${e2}\end{cases}$, partindo de $(0,\,0)$, qual $x^{(1)}$? (decimal)`, e1 / 5, t`$x=\frac{${e1}-0}{5}=${fmt(e1 / 5)}$.`, { tol: 0.001 });
            }),
            mcq(t`Métodos iterativos são especialmente bons para…`, ['sistemas enormes e esparsos (muitos zeros)', 'sistemas 2×2', 'matrizes sem diagonal', 'achar determinantes'], 0, t`Cada iteração é barata e não destrói os zeros da matriz.`),
          ],
        },
        {
          card: {
            title: 'Quando converge?',
            body: t`**Critério das linhas** (diagonal dominante): se em todas as linhas
$$|a_{ii}|>\sum_{j\ne i}|a_{ij}|$$
Jacobi e Gauss-Seidel convergem para qualquer chute inicial.

Para **parar**: quando a diferença entre duas iterações fica menor que uma tolerância $\varepsilon$.`,
            tip: t`Se não for diagonal dominante, às vezes basta **reordenar** as equações.`,
          },
          exercises: [
            mcq(t`A matriz $\begin{pmatrix}5&1&2\\1&4&1\\2&1&6\end{pmatrix}$ é diagonalmente dominante?`, ['Sim', 'Não, falha na linha 1', 'Não, falha na linha 2', 'Não, falha na linha 3'], 0, t`$5>3$, $4>2$, $6>3$.`),
            gen((rng) => {
              const d = randInt(rng, 2, 6);
              const o1 = randInt(rng, 1, 4);
              const o2 = randInt(rng, 0, 3);
              const ok = d > o1 + o2;
              return tf(t`A linha $(${d},\ ${o1},\ ${-o2})$ (com $${d}$ na diagonal) satisfaz o critério das linhas.`, ok, ok ? t`$${d}>${o1}+${o2}$.` : t`$${d}\le${o1}+${o2}$.`);
            }),
            mcq(t`O sistema $\begin{cases}x+5y=6\\4x+y=5\end{cases}$ não é diagonal dominante. O que fazer?`, ['trocar a ordem das equações', 'desistir', 'multiplicar tudo por zero', 'usar só a primeira equação'], 0, t`Com as linhas trocadas: $\begin{cases}4x+y=5\\x+5y=6\end{cases}$, agora dominante.`),
            tf(t`Diagonal dominante é condição suficiente, mas não necessária, para a convergência.`, true, t`O método pode convergir mesmo sem ela, mas aí não há garantia.`),
            mcq(t`Um critério de parada comum é…`, ['$\\max|x^{(k+1)}-x^{(k)}|<\\varepsilon$', 'fazer exatamente 3 iterações', 'parar quando $x=0$', 'parar quando o determinante é 1'], 0, t`Parar quando as iterações quase não mudam.`),
            num(t`Duas iterações deram $(1{,}998;\ 1{,}003)$ e $(2{,}001;\ 0{,}999)$. Qual a maior diferença entre as componentes? (decimal)`, 0.004, t`$|2{,}001-1{,}998|=0{,}003$ e $|0{,}999-1{,}003|=0{,}004$.`, { tol: 1e-6 }),
            mcq(t`Qual destas matrizes **não** é diagonalmente dominante?`, ['$\\begin{pmatrix}2&3\\\\1&5\\end{pmatrix}$', '$\\begin{pmatrix}4&1\\\\1&3\\end{pmatrix}$', '$\\begin{pmatrix}10&2\\\\3&7\\end{pmatrix}$', '$\\begin{pmatrix}5&-1\\\\2&6\\end{pmatrix}$'], 0, t`Linha 1: $2<3$.`),
          ],
        },
      ],
    },
  ],
};
