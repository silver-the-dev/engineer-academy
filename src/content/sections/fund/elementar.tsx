import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near } from '../../helpers';
import { FnCurve, Pt, Seg, RectW, Label } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt } from '../../../lib/random';

const t = String.raw;

const powerPlot = (target?: number) =>
  plot({
    view: { xMin: -3.5, xMax: 4.5, yMin: -1, yMax: 17 },
    params: [{ key: 'a', label: 'a', min: 0.5, max: 3, step: 0.05, value: 1.5, color: C.p1 }],
    render: ({ p }: any) => (
      <>
        {target ? <Seg x1={-3.5} y1={target} x2={4.5} y2={target} color={C.gold} dash="6 5" /> : null}
        <FnCurve f={(x) => Math.pow(p.a, x)} color={C.p1} />
        {[-2, -1, 0, 1, 2, 3, 4].map((n) => (
          <Pt key={n} x={n} y={Math.pow(p.a, n)} color={n === 3 && target ? C.gold : C.p2} r={5} />
        ))}
      </>
    ),
    info: ({ p }: any) => t`$a^{-1}=${fmt(1 / p.a, 3)}$  ·  $a^{0}=1$  ·  $a^{2}=${fmt(p.a ** 2, 3)}$  ·  $a^{3}=${fmt(p.a ** 3, 3)}$`,
  });

const squarePlot = () =>
  plot(
    {
      view: { xMin: -0.5, xMax: 6.5, yMin: -0.5, yMax: 6.5 },
      equalAspect: true,
      params: [{ key: 'A', label: 'A', min: 0, max: 36, step: 0.5, value: 4, color: C.p2 }],
      render: ({ p }: any) => {
        const s = Math.sqrt(p.A);
        return (
          <>
            <RectW x={0} y={0} w={s} h={s} color={C.p2} opacity={0.35} />
            <Label x={s / 2} y={-0.1} text={`lado = ${fmt(s, 3)}`} anchor="middle" dy={14} color={C.p2} />
            <Label x={s / 2} y={s / 2} text={`área ${fmt(p.A, 2)}`} anchor="middle" color={C.text} />
          </>
        );
      },
      info: ({ p }: any) => t`Área $A=${fmt(p.A, 2)}$  ⟹  lado $=\sqrt{A}=${fmt(Math.sqrt(p.A), 4)}$`,
    },
    260,
  );

const percentGrid = (withTarget = false) =>
  plot(
    {
      view: { xMin: 0, xMax: 10, yMin: 0, yMax: 10 },
      equalAspect: true,
      grid: false,
      tickLabels: false,
      params: [
        { key: 'p', label: t`\%`, min: 0, max: 100, step: 1, value: withTarget ? 10 : 25, color: C.success },
        ...(withTarget ? [] : [{ key: 'V', label: 'V', min: 0, max: 500, step: 10, value: 200, color: C.p3 }]),
      ],
      render: ({ p }: any) => {
        const cells = [];
        for (let i = 0; i < 100; i++) {
          const r = Math.floor(i / 10);
          const c = i % 10;
          cells.push(<RectW key={i} x={c + 0.06} y={9 - r + 0.06} w={0.88} h={0.88} color={i < p.p ? C.success : C.surface3} opacity={i < p.p ? 0.9 : 0.6} />);
        }
        return <>{cells}</>;
      },
      info: withTarget ? ({ p }: any) => t`Pintado: $${p.p}\%$ $=\frac{${p.p}}{100}$` : ({ p }: any) => t`$${p.p}\%$ de $${p.V}$ $=\frac{${p.p}}{100}\cdot ${p.V} = ${fmt((p.p * p.V) / 100, 2)}$`,
    },
    260,
  );

const SCI = [['45', '4,5'], ['32', '3,2'], ['12', '1,2'], ['602', '6,02'], ['75', '7,5'], ['18', '1,8'], ['9', '9']] as const;
/** Integer with thin-space thousands for TeX: 40500 -> 40\,500 */
const group = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');
/** Plain decimal for mantissa digits md (one digit before the comma) times 10^k. */
const sciPlain = (md: string, k: number) => (k >= 0 ? group(Number(md.padEnd(k + 1, '0'))) : '0,' + '0'.repeat(-k - 1) + md);

export const elementar: UnitDef = {
  id: 'f-elem',
  title: 'Matemática Elementar',
  subtitle: 'Potências, raízes, proporção e porcentagem',
  icon: '🔢',
  source: 'Competências Básicas · Matemática Elementar',
  guide: t`A base de toda conta de engenharia. Domine **propriedades das potências**, **raízes como potências fracionárias**, **regra de três** e **porcentagem como fator multiplicativo**.`,
  lessons: [
    {
      id: 'f-elem-pot',
      title: 'Potenciação',
      parts: [
        {
          card: {
            title: 'Multiplicação repetida',
            body: t`Uma potência é uma **multiplicação repetida** da base por ela mesma:

$$a^n=\underbrace{a\cdot a\cdots a}_{n\ \text{vezes}}$$

$a$ é a **base** e $n$ é o **expoente**. Por exemplo, $2^5=2\cdot2\cdot2\cdot2\cdot2=32$.

Mexa no controle e veja: com $a>1$ a potência **cresce muito rápido**; com $0<a<1$ ela **encolhe**.`,
            visual: powerPlot(),
            tip: t`Cuidado com o sinal: $(-3)^2=9$, mas $-3^2=-(3^2)=-9$. O expoente só "pega" o que está colado nele.`,
          },
          exercises: [
            mcq(t`Em $7^4$, qual número é a **base**?`, ['$7$', '$4$', '$28$', '$2401$'], 0, t`A base é o número que se repete ($7$); o expoente ($4$) diz quantas vezes: $7^4=7\cdot7\cdot7\cdot7$.`),
            gen((rng) => {
              const a = randInt(rng, 2, 9);
              const n = randInt(rng, 3, 5);
              return rmcq(rng, t`Qual expressão é igual a $${a}^{${n}}$?`, `$${Array(n).fill(a).join('\\cdot ')}$`, [`$${a}\\cdot ${n}$`, a ** n === n ** a ? `$${a * n}$` : `$${n}^{${a}}$`, `$${Array(n).fill(a).join('+')}$`], t`O expoente $${n}$ diz quantas vezes a base $${a}$ aparece **multiplicando**.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const n = a <= 3 ? randInt(rng, 2, 5) : randInt(rng, 2, 3);
              return num(t`Calcule $${a}^{${n}}$.`, a ** n, t`$${a}^{${n}}$ é $${a}$ multiplicado por ele mesmo $${n}$ vezes $=${a ** n}$.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 2, 6);
              return num(t`Calcule $10^{${n}}$.`, 10 ** n, t`Em potências de 10, o expoente conta os zeros: $10^{${n}}=1${'0'.repeat(n)}$.`);
            }),
            tf(t`$(-2)^4=-16$`, false, t`Expoente par com base negativa dá resultado **positivo**: $(-2)^4=16$. Já $-2^4=-16$.`),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              const n = pick(rng, [2, 3, 4]);
              const paren = rng() < 0.5;
              const val = paren ? (-k) ** n : -(k ** n);
              const expr = paren ? `(-${k})^{${n}}` : `-${k}^{${n}}`;
              return num(
                t`Calcule $${expr}$.`,
                val,
                paren
                  ? t`O sinal está dentro do parêntese, então também é elevado: $(-${k})^{${n}}=${val}$ (expoente ${n % 2 ? 'ímpar mantém' : 'par elimina'} o sinal).`
                  : t`Sem parênteses, o expoente pega só o $${k}$: $-${k}^{${n}}=-(${k ** n})=${val}$.`,
              );
            }),
            gen((rng) => {
              const [a, b] = pick(rng, [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [2, 7], [5, 6]]);
              return rmcq(rng, t`Calcule $\left(\dfrac{${a}}{${b}}\right)^2$.`, t`$\dfrac{${a * a}}{${b * b}}$`, [t`$\dfrac{${a}}{${b * b}}$`, t`$\dfrac{${2 * a}}{${2 * b}}$`, t`$\dfrac{${a * a}}{${b}}$`], t`O expoente vale para o numerador **e** para o denominador: $\frac{${a}^2}{${b}^2}=\frac{${a * a}}{${b * b}}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 4);
              const b = randInt(rng, 2, 3);
              const n = pick(rng, [3, 4, 5]);
              const v = a ** 2 + b ** 3 - (-1) ** n;
              return num(t`Calcule $${a}^2+${b}^3-(-1)^{${n}}$.`, v, t`$${a}^2=${a * a}$, $${b}^3=${b ** 3}$ e $(-1)^{${n}}=${(-1) ** n}$. Total: $${a * a}+${b ** 3}${n % 2 ? '+1' : '-1'}=${v}$.`);
            }),
            inter(t`Ajuste a base $a$ até que $a^{3}=8$ (o ponto dourado precisa tocar a linha tracejada).`, 'plot', powerPlot(8).props, (v) => v && near(v.p.a, 2, 0.06), t`$a=2$, pois $2^3=8$.`, t`A raiz cúbica de 8 é 2: $\sqrt[3]{8}=2$.`),
          ],
        },
        {
          card: {
            title: 'As propriedades',
            body: t`Com a **mesma base**, multiplicar soma os expoentes e dividir subtrai:

$$a^m\cdot a^n=a^{m+n}\qquad \frac{a^m}{a^n}=a^{m-n}$$

Potência de potência multiplica, e o expoente se distribui no produto:

$$(a^m)^n=a^{m\cdot n}\qquad (a\cdot b)^n=a^n\cdot b^n$$`,
            example: t`$\dfrac{x^7\cdot x^2}{x^4}=x^{7+2-4}=x^5$ e $(2x^3)^2=4x^6$.`,
          },
          exercises: [
            gen((rng) => {
              const m = randInt(rng, 2, 9);
              const n = randInt(rng, 2, 9);
              return rmcq(rng, t`Simplifique $x^{${m}}\cdot x^{${n}}$.`, t`$x^{${m + n}}$`, [t`$x^{${m * n}}$`, t`$x^{${Math.abs(m - n)}}$`, t`$2x^{${m + n}}$`, t`$x^{${m}${n}}$`], t`Mesma base na multiplicação: **somamos** os expoentes, $${m}+${n}=${m + n}$.`);
            }),
            gen((rng) => {
              const m = randInt(rng, 6, 12);
              const n = randInt(rng, 2, 5);
              return rmcq(rng, t`Simplifique $\dfrac{y^{${m}}}{y^{${n}}}$.`, t`$y^{${m - n}}$`, [t`$y^{${m + n}}$`, t`$y^{${m * n}}$`, t`$\frac{${m}}{${n}}y$`, t`$1$`], t`Na divisão de mesma base, **subtraímos** os expoentes: $${m}-${n}=${m - n}$.`);
            }),
            fill(t`Complete a propriedade:`, t`$(a^3)^4=a^{\,}$___ e $a^3\cdot a^4=a^{\,}$___`, ['12', '7'], ['81', '1', '34'], t`Potência de potência **multiplica** ($3\cdot4=12$); produto de mesma base **soma** ($3+4=7$).`),
            gen((rng) => {
              const c = randInt(rng, 2, 5);
              const n = pick(rng, [2, 3]);
              return rmcq(rng, t`Desenvolva $(${c}x)^{${n}}$.`, t`$${c ** n}x^{${n}}$`, [t`$${c}x^{${n}}$`, t`$${c * n}x^{${n}}$`, t`$${c ** n}x$`], t`O expoente se distribui no produto: $(${c}x)^{${n}}=${c}^{${n}}\cdot x^{${n}}=${c ** n}x^{${n}}$.`);
            }),
            gen((rng) => {
              const r = randInt(rng, 2, 6);
              const k = randInt(rng, 2, 5);
              const m = randInt(rng, 1, r + k - 1);
              const n = r + k - m;
              return num(t`Calcule $\dfrac{2^{${m}}\cdot 2^{${n}}}{2^{${k}}}$.`, 2 ** r, t`Mesma base: $2^{${m}+${n}-${k}}=2^{${r}}=${2 ** r}$.`);
            }),
            match(
              t`Ligue cada expressão à forma simplificada:`,
              [
                [t`$x^2\cdot x^5$`, t`$x^7$`],
                [t`$(x^2)^5$`, t`$x^{10}$`],
                [t`$\dfrac{x^{10}}{x^2}$`, t`$x^8$`],
                [t`$(2x)^2$`, t`$4x^2$`],
              ],
              t`Produto soma, potência de potência multiplica, divisão subtrai e o expoente se distribui no produto.`,
            ),
            gen((rng) => {
              const c = randInt(rng, 2, 4);
              const m = randInt(rng, 2, 5);
              const n = pick(rng, [2, 3]);
              return rmcq(rng, t`Simplifique $(${c}x^{${m}})^{${n}}$.`, t`$${c ** n}x^{${m * n}}$`, [t`$${c}x^{${m * n}}$`, t`$${c ** n}x^{${m + n}}$`, t`$${c * n}x^{${m * n}}$`], t`Cada fator é elevado a $${n}$: $${c}^{${n}}=${c ** n}$ e $(x^{${m}})^{${n}}=x^{${m * n}}$.`);
            }),
            gen((rng) => {
              const m = randInt(rng, 2, 4);
              const n = randInt(rng, 2, 5);
              const k = randInt(rng, 1, 2 * m + n - 1);
              const r = 2 * m + n - k;
              return rmcq(rng, t`Simplifique $\dfrac{(x^{${m}})^2\cdot x^{${n}}}{x^{${k}}}$.`, t`$x^{${r}}$`, [t`$x^{${m + 2 + n - k}}$`, t`$x^{${2 * m * n - k}}$`, t`$x^{${2 * m + n + k}}$`, t`$x^{${m + n - k}}$`, t`$x^{${r + 2}}$`], t`$(x^{${m}})^2=x^{${2 * m}}$; depois $x^{${2 * m}+${n}-${k}}=x^{${r}}$.`);
            }),
            tf(t`$2^3+2^3=2^6$`, false, t`Soma **não** junta expoentes: $2^3+2^3=8+8=16=2^4$. Somar expoentes só vale na **multiplicação**: $2^3\cdot2^3=2^6$.`),
          ],
        },
        {
          card: {
            title: 'Expoente zero e negativo',
            body: t`Pela regra da divisão, $\frac{a^3}{a^3}=a^{0}$, mas também vale $1$. Então $a^0=1$ (com $a\neq0$).

Expoente negativo **inverte** a base:

$$a^{-n}=\frac{1}{a^n}\qquad \left(\frac{2}{3}\right)^{-2}=\left(\frac{3}{2}\right)^{2}=\frac{9}{4}$$`,
            tip: t`Notação científica usa potências de 10: $0{,}00045=4{,}5\times10^{-4}$ e $320\,000=3{,}2\times10^{5}$.`,
          },
          exercises: [
            gen((rng) => {
              const k = randInt(rng, 2, 9);
              return rmcq(rng, t`Quanto vale $(-${k})^0$?`, '$1$', ['$0$', '$-1$', `$-${k}$`], t`Qualquer número diferente de zero elevado a $0$ dá $1$, inclusive os negativos.`);
            }),
            gen((rng) => {
              const b = randInt(rng, 2, 5);
              const n = randInt(rng, 1, 3);
              return rmcq(rng, t`Escreva $${b}^{-${n}}$ como fração.`, t`$\dfrac{1}{${b ** n}}$`, [t`$-${b ** n}$`, t`$-\dfrac{1}{${b ** n}}$`, t`$\dfrac{1}{${b * n}}$`], t`Expoente negativo inverte: $${b}^{-${n}}=\frac{1}{${b}^{${n}}}=\frac{1}{${b ** n}}$.`);
            }),
            num(t`Quanto vale $2^{-3}$? (pode responder em fração)`, 0.125, t`$2^{-3}=\frac{1}{2^3}=\frac18=0{,}125$.`),
            mcqS(t`Qual é o valor de $\left(\frac{1}{5}\right)^{-2}$?`, '$25$', ['$\\frac{1}{25}$', '$-25$', '$-\\frac{1}{10}$'], t`Expoente negativo inverte a base: $\left(\frac15\right)^{-2}=5^2=25$.`),
            gen((rng) => {
              const [a, b] = pick(rng, [[2, 3], [3, 4], [2, 5], [3, 5], [4, 7], [5, 2]]);
              return rmcq(rng, t`Calcule $\left(\dfrac{${a}}{${b}}\right)^{-2}$.`, t`$\dfrac{${b * b}}{${a * a}}$`, [t`$\dfrac{${a * a}}{${b * b}}$`, t`$-\dfrac{${a * a}}{${b * b}}$`, t`$\dfrac{${b}}{${2 * a}}$`], t`Inverta a fração e troque o sinal do expoente: $\left(\frac{${b}}{${a}}\right)^2=\frac{${b * b}}{${a * a}}$.`);
            }),
            gen((rng) => {
              const [md, mt] = pick(rng, SCI);
              const k = rng() < 0.5 ? -randInt(rng, 2, 5) : randInt(rng, 3, 6);
              return rmcq(rng, t`Escreva $${sciPlain(md, k)}$ em notação científica.`, t`$${mt}\times10^{${k}}$`, [t`$${mt}\times10^{${-k}}$`, t`$${mt}\times10^{${k + 1}}$`, t`$${mt}\times10^{${k - 1}}$`], t`Para ficar com um algarismo antes da vírgula, ela anda $${Math.abs(k)}$ casas. ${k < 0 ? 'Número menor que 1: expoente **negativo**' : 'Número grande: expoente **positivo**'}, $${mt}\times10^{${k}}$.`);
            }),
            gen((rng) => {
              const [a, b] = pick(rng, [[2, 3], [1.5, 4], [2, 4], [2.5, 2], [1.2, 3], [3, 3]]);
              const m = randInt(rng, 2, 8);
              const n = -randInt(rng, 1, 5);
              const p = a * b;
              return rmcq(rng, t`Calcule $(${fmt(a)}\times10^{${m}})\cdot(${fmt(b)}\times10^{${n}})$.`, t`$${fmt(p)}\times10^{${m + n}}$`, [t`$${fmt(p)}\times10^{${m * n}}$`, t`$${fmt(a + b)}\times10^{${m + n}}$`, t`$${fmt(p)}\times10^{${m - n}}$`], t`Multiplique as mantissas ($${fmt(a)}\cdot${fmt(b)}=${fmt(p)}$) e **some** os expoentes ($${m}+(${n})=${m + n}$).`);
            }),
            gen((rng) => {
              const a = randInt(rng, 1, 3);
              const b = randInt(rng, 4, 7);
              const c = -randInt(rng, 1, 2);
              const r = -a + b - c;
              return num(t`Calcule $\dfrac{2^{-${a}}\cdot 2^{${b}}}{2^{${c}}}$.`, 2 ** r, t`Some e subtraia os expoentes: $-${a}+${b}-(${c})=${r}$, então o resultado é $2^{${r}}=${2 ** r}$.`);
            }),
            num(t`Calcule $\left(\dfrac{2}{3}\right)^{-2}\cdot\dfrac{4}{9}$.`, 1, t`$\left(\frac23\right)^{-2}=\frac94$, e $\frac94\cdot\frac49=1$.`),
          ],
        },
      ],
    },
    {
      id: 'f-elem-raiz',
      title: 'Radiciação',
      parts: [
        {
          card: {
            title: 'A operação inversa',
            body: t`A raiz desfaz a potência:

$$\sqrt[n]{a}=b\iff b^n=a$$

$\sqrt{9}=3$ porque $3^2=9$; $\sqrt[3]{-8}=-2$ porque $(-2)^3=-8$. Geometricamente, $\sqrt{A}$ é o **lado** de um quadrado de área $A$:`,
            visual: squarePlot(),
            tip: t`Índice par não aceita radicando negativo nos reais: $\sqrt{-4}$ não existe, pois nenhum número ao quadrado dá negativo.`,
          },
          exercises: [
            gen((rng) => {
              const k = randInt(rng, 2, 12);
              return num(t`Calcule $\sqrt{${k * k}}$.`, k, t`$${k}^2=${k * k}$, logo $\sqrt{${k * k}}=${k}$.`);
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              return num(t`Calcule $\sqrt[3]{${k ** 3}}$.`, k, t`$${k}^3=${k ** 3}$.`);
            }),
            tf(t`$\sqrt{-9}$ é um número real.`, false, t`Nenhum número real ao quadrado dá negativo, então raiz de índice **par** de negativo não existe nos reais. Já $\sqrt[3]{-8}=-2$ existe.`),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              return num(t`Calcule $\sqrt[3]{-${k ** 3}}$.`, -k, t`Índice ímpar aceita negativo: $(-${k})^3=-${k ** 3}$.`);
            }),
            gen((rng) => {
              const [a, b] = pick(rng, [[2, 3], [3, 4], [3, 5], [4, 5], [5, 7], [2, 9], [7, 10]]);
              return rmcq(rng, t`Calcule $\sqrt{\dfrac{${a * a}}{${b * b}}}$.`, t`$\dfrac{${a}}{${b}}$`, [t`$\dfrac{${a * a}}{${b}}$`, t`$\dfrac{${a}}{${b * b}}$`, t`$\dfrac{${b}}{${a}}$`], t`Tire a raiz de cima e de baixo: $\frac{\sqrt{${a * a}}}{\sqrt{${b * b}}}=\frac{${a}}{${b}}$.`);
            }),
            match(t`Ligue cada expressão ao seu valor:`, [
              [t`$\sqrt{49}$`, '$7$'],
              [t`$\sqrt[3]{27}$`, '$3$'],
              [t`$\sqrt[4]{16}$`, '$2$'],
              [t`$\sqrt{0{,}25}$`, t`$0{,}5$`],
            ], t`Procure o número que, elevado ao índice, dá o radicando: $7^2=49$, $3^3=27$, $2^4=16$ e $0{,}5^2=0{,}25$.`),
            inter(t`Ajuste a área $A$ do quadrado para que o **lado** fique igual a $3$.`, 'plot', squarePlot().props, (v) => v && near(v.p.A, 9, 0.01), t`$A=9$`, t`Lado $3$ ⟹ área $3^2=9$.`),
            gen((rng) => {
              let n = randInt(rng, 11, 95);
              while (Number.isInteger(Math.sqrt(n))) n++;
              const a = Math.floor(Math.sqrt(n));
              return rmcq(rng, t`$\sqrt{${n}}$ está entre quais inteiros consecutivos?`, t`$${a}$ e $${a + 1}$`, [t`$${a - 1}$ e $${a}$`, t`$${a + 1}$ e $${a + 2}$`, t`$${Math.floor(n / 2)}$ e $${Math.floor(n / 2) + 1}$`], t`$${a}^2=${a * a}<${n}<${(a + 1) ** 2}=${a + 1}^2$, então $${a}<\sqrt{${n}}<${a + 1}$.`);
            }),
            mcqS(t`Para qualquer número real $x$, $\sqrt{x^2}$ é igual a:`, '$|x|$', ['$x$', '$-x$', '$x^2$'], t`Se $x=-3$: $\sqrt{(-3)^2}=\sqrt9=3=|-3|$. A raiz quadrada nunca é negativa, por isso aparece o **módulo**.`),
          ],
        },
        {
          card: {
            title: 'Raiz = expoente fracionário',
            body: t`Toda raiz pode ser escrita como potência:

$$\sqrt[n]{a^m}=a^{\frac{m}{n}}$$

Assim todas as propriedades das potências valem para raízes!`,
            example: t`$8^{2/3}=\left(\sqrt[3]{8}\right)^2=2^2=4$ e $\sqrt{x}\cdot\sqrt[3]{x}=x^{\frac12+\frac13}=x^{\frac56}$.`,
          },
          exercises: [
            mcqS(t`Escreva $\sqrt[5]{x^3}$ como potência.`, t`$x^{3/5}$`, [t`$x^{5/3}$`, t`$x^{15}$`, t`$x^{-2}$`], t`$\sqrt[n]{x^m}=x^{m/n}$: o índice vai para o **denominador**.`),
            mcqS(t`Escreva $x^{2/3}$ na forma de raiz.`, t`$\sqrt[3]{x^2}$`, [t`$\sqrt{x^3}$`, t`$\dfrac{x^2}{3}$`, t`$\sqrt[2]{x^{1/3}}$`], t`O denominador ($3$) vira o índice, e o numerador ($2$) fica como expoente do radicando.`),
            gen((rng) => {
              const k = randInt(rng, 2, 4);
              const n = pick(rng, [2, 3, 4]);
              return num(t`Calcule $${k ** n}^{1/${n}}$.`, k, t`Expoente $\frac{1}{${n}}$ é raiz de índice $${n}$: $\sqrt[${n}]{${k ** n}}=${k}$.`);
            }),
            num(t`Quanto vale $16^{3/4}$?`, 8, t`$16^{3/4}=(\sqrt[4]{16})^3=2^3=8$.`),
            gen((rng) => {
              const k = randInt(rng, 2, 3);
              const n = pick(rng, [2, 3]);
              const m = n === 2 ? 3 : 2;
              return num(t`Calcule $${k ** n}^{${m}/${n}}$.`, k ** m, t`Primeiro a raiz, depois a potência: $\left(\sqrt[${n}]{${k ** n}}\right)^{${m}}=${k}^{${m}}=${k ** m}$.`);
            }),
            mcqS(t`Simplifique $\sqrt{x}\cdot\sqrt[3]{x}$.`, t`$x^{5/6}$`, [t`$x^{1/6}$`, t`$\sqrt[5]{x}$`, t`$x^{1/5}$`], t`$x^{\frac12}\cdot x^{\frac13}=x^{\frac12+\frac13}=x^{\frac56}$.`),
            tf(t`$27^{-1/3}=-3$`, false, t`O sinal negativo do expoente **inverte**, não deixa negativo: $27^{-1/3}=\frac{1}{\sqrt[3]{27}}=\frac13$.`),
            num(t`Calcule $8^{2/3}+16^{1/2}$.`, 8, t`$8^{2/3}=(\sqrt[3]8)^2=4$ e $16^{1/2}=\sqrt{16}=4$. Soma: $8$.`),
            mcqS(t`Simplifique $\dfrac{\sqrt{x^3}}{\sqrt[4]{x}}$.`, t`$x^{5/4}$`, [t`$x^{3/4}$`, t`$x^{2}$`, t`$x^{7/4}$`], t`$\frac{x^{3/2}}{x^{1/4}}=x^{\frac32-\frac14}=x^{\frac54}$.`),
          ],
        },
        {
          card: {
            title: 'Simplificar e racionalizar',
            body: t`**Simplificar**: tire do radical os fatores que são potências perfeitas.
$$\sqrt{12}=\sqrt{4\cdot3}=2\sqrt3\qquad \sqrt{50}=5\sqrt2$$

**Racionalizar**: tirar a raiz do denominador multiplicando em cima e embaixo:
$$\frac{1}{\sqrt2}=\frac{1}{\sqrt2}\cdot\frac{\sqrt2}{\sqrt2}=\frac{\sqrt2}{2}$$`,
            tip: t`Raiz **não** distribui na soma: $\sqrt{9+16}=\sqrt{25}=5$, mas $\sqrt9+\sqrt{16}=7$.`,
            example: t`Com soma no denominador, use o **conjugado**: $\dfrac{1}{\sqrt5+\sqrt3}\cdot\dfrac{\sqrt5-\sqrt3}{\sqrt5-\sqrt3}=\dfrac{\sqrt5-\sqrt3}{2}$, porque $(a+b)(a-b)=a^2-b^2$.`,
          },
          exercises: [
            tf(t`$\sqrt{9+16}=\sqrt9+\sqrt{16}$`, false, t`Lado esquerdo: $\sqrt{25}=5$. Lado direito: $3+4=7$. A raiz não se distribui na soma.`),
            gen((rng) => {
              const k = randInt(rng, 2, 6);
              const m = pick(rng, [2, 3, 5, 6, 7]);
              return rmcq(rng, t`Simplifique $\sqrt{${k * k * m}}$.`, t`$${k}\sqrt{${m}}$`, [t`$${m}\sqrt{${k}}$`, t`$${k * m}\sqrt{${k}}$`, t`$${k * k}\sqrt{${m}}$`, t`$\sqrt{${k}}\cdot${m}$`], t`$${k * k * m}=${k * k}\cdot${m}$ e $\sqrt{${k * k}}=${k}$.`);
            }),
            gen((rng) => {
              const [a, b] = pick(rng, [[2, 8], [3, 12], [2, 18], [5, 20], [3, 27], [2, 32], [6, 24]]);
              return num(t`Calcule $\sqrt{${a}}\cdot\sqrt{${b}}$.`, Math.sqrt(a * b), t`$\sqrt{${a}}\cdot\sqrt{${b}}=\sqrt{${a * b}}=${Math.sqrt(a * b)}$.`);
            }),
            gen((rng) => {
              const m = pick(rng, [2, 3, 5]);
              const a = randInt(rng, 2, 4);
              let b = randInt(rng, 2, 5);
              if (b === a) b++;
              return rmcq(rng, t`Simplifique $\sqrt{${a * a * m}}+\sqrt{${b * b * m}}$.`, t`$${a + b}\sqrt{${m}}$`, [t`$\sqrt{${(a * a + b * b) * m}}$`, t`$${a * b}\sqrt{${m}}$`, t`$${a + b}\sqrt{${2 * m}}$`], t`$\sqrt{${a * a * m}}=${a}\sqrt{${m}}$ e $\sqrt{${b * b * m}}=${b}\sqrt{${m}}$. Radicais iguais se somam: $${a + b}\sqrt{${m}}$.`);
            }),
            mcqS(t`Racionalize $\dfrac{2}{\sqrt3}$.`, t`$\dfrac{2\sqrt3}{3}$`, [t`$\dfrac{2}{3}$`, t`$\dfrac{\sqrt3}{2}$`, t`$2\sqrt3$`], t`Multiplique por $\frac{\sqrt3}{\sqrt3}$: $\frac{2\sqrt3}{3}$.`),
            gen((rng) => {
              const m = pick(rng, [2, 3, 5, 7]);
              const c = randInt(rng, 2, 4);
              const k = c * m;
              return rmcq(rng, t`Racionalize $\dfrac{${k}}{\sqrt{${m}}}$.`, t`$${c}\sqrt{${m}}$`, [t`$\dfrac{${k}}{${m}}$`, t`$${k}\sqrt{${m}}$`, t`$\dfrac{\sqrt{${m}}}{${k}}$`], t`$\frac{${k}}{\sqrt{${m}}}\cdot\frac{\sqrt{${m}}}{\sqrt{${m}}}=\frac{${k}\sqrt{${m}}}{${m}}=${c}\sqrt{${m}}$.`);
            }),
            num(t`Calcule $(\sqrt5+\sqrt3)(\sqrt5-\sqrt3)$.`, 2, t`Produto da soma pela diferença: $(\sqrt5)^2-(\sqrt3)^2=5-3=2$.`),
            mcqS(t`Racionalize $\dfrac{1}{\sqrt3-1}$.`, t`$\dfrac{\sqrt3+1}{2}$`, [t`$\sqrt3+1$`, t`$\dfrac{\sqrt3-1}{2}$`, t`$\dfrac{1}{2}$`], t`Multiplique pelo **conjugado** $\sqrt3+1$: o denominador vira $(\sqrt3)^2-1^2=2$.`),
          ],
        },
      ],
    },
    {
      id: 'f-elem-prop',
      title: 'Razão, proporção e regra de três',
      parts: [
        {
          card: {
            title: 'Razão e proporção',
            body: t`**Razão** compara duas grandezas por divisão: $\frac{a}{b}$. Uma escala $1:100$ significa que $1$ cm no desenho vale $100$ cm reais.

**Proporção** é uma igualdade entre razões, e nela o produto dos meios é igual ao produto dos extremos:

$$\frac{a}{b}=\frac{c}{d}\iff a\cdot d=b\cdot c$$`,
            example: t`$\frac{x}{6}=\frac{10}{15}\Rightarrow 15x=60\Rightarrow x=4$.`,
          },
          exercises: [
            gen((rng) => {
              const g = randInt(rng, 2, 6);
              const [p, q] = pick(rng, [[2, 3], [3, 4], [3, 5], [4, 5], [5, 7], [1, 3], [2, 5]]);
              return rmcq(rng, t`Qual é a razão entre $${g * p}$ e $${g * q}$, na forma mais simples?`, t`$\dfrac{${p}}{${q}}$`, [t`$\dfrac{${q}}{${p}}$`, t`$\dfrac{${g * p}}{${q}}$`, t`$\dfrac{${p}}{${g * q}}$`], t`Divida os dois por $${g}$: $\frac{${g * p}}{${g * q}}=\frac{${p}}{${q}}$.`);
            }),
            num(t`Resolva a proporção $\dfrac{x}{6}=\dfrac{10}{15}$.`, 4, t`$15x=60\Rightarrow x=4$.`),
            gen((rng) => {
              const b = pick(rng, [2, 3, 4, 5]);
              const k = randInt(rng, 2, 6);
              const a = randInt(rng, 2, 9);
              return num(t`Resolva $\dfrac{x}{${b * k}}=\dfrac{${a}}{${b}}$.`, a * k, t`Produto cruzado: $${b}x=${a}\cdot${b * k}=${a * b * k}\Rightarrow x=${a * k}$.`);
            }),
            gen((rng) => {
              const cm = pick(rng, [2.5, 3, 3.5, 4, 4.5, 6, 7.5]);
              return num(t`Numa planta na escala $1:100$, uma parede mede $${fmt(cm)}$ cm. Qual o comprimento real em **metros**?`, cm, t`$${fmt(cm)}\cdot100=${fmt(cm * 100)}$ cm $=${fmt(cm)}$ m.`, { unit: 'm' });
            }),
            num(t`Um mapa tem escala $1:50\,000$. Uma distância de $4$ cm no mapa corresponde a quantos **km** reais?`, 2, t`$4\cdot50\,000=200\,000$ cm $=2$ km.`, { unit: 'km' }),
            gen((rng) => {
              const [p, q] = pick(rng, [[2, 3], [3, 4], [2, 5], [4, 7], [3, 8], [5, 6]]);
              const m = randInt(rng, 2, 5);
              return num(t`Resolva $\dfrac{${p * m}}{x}=\dfrac{${p}}{${q}}$.`, m * q, t`Produto cruzado: $${p}x=${p * m}\cdot${q}\Rightarrow x=${m * q}$.`);
            }),
            gen((rng) => {
              const [p, q] = pick(rng, [[2, 3], [1, 4], [3, 5], [2, 5], [3, 7]]);
              const k = pick(rng, [20, 30, 40, 50, 60, 100]);
              const tot = (p + q) * k;
              return num(t`Divida R\$ $${tot}$ entre duas pessoas na razão $${p}:${q}$. Quanto recebe quem fica com a **maior** parte?`, q * k, t`São $${p}+${q}=${p + q}$ partes de $${tot}\div${p + q}=${k}$. A maior: $${q}\cdot${k}=${q * k}$.`, { unit: 'R$' });
            }),
          ],
        },
        {
          card: {
            title: 'Diretamente proporcionais',
            body: t`Duas grandezas são **diretamente proporcionais** quando a razão entre elas é constante: $y=k\,x$. Dobrou uma, dobra a outra. O gráfico é uma **reta pela origem**.`,
            visual: plot({
              view: { xMin: -0.5, xMax: 6, yMin: -0.5, yMax: 12 },
              params: [{ key: 'k', label: 'k', min: 0.5, max: 4, step: 0.1, value: 2, color: C.p2 }],
              render: ({ p }: any) => (
                <>
                  <FnCurve f={(x) => p.k * x} color={C.p2} from={0} />
                  {[1, 2, 3, 4, 5].map((x) => (
                    <Pt key={x} x={x} y={p.k * x} color={C.p2} r={5} />
                  ))}
                </>
              ),
              info: ({ p }: any) => t`$y=${fmt(p.k)}x$: para $x=1,2,3$ temos $y=${fmt(p.k)},\,${fmt(2 * p.k)},\,${fmt(3 * p.k)}$ — razão $\frac{y}{x}=${fmt(p.k)}$ sempre.`,
            }),
          },
          exercises: [
            mcq(t`O gráfico de duas grandezas **diretamente proporcionais** é…`, ['uma reta que passa pela origem', 'uma hipérbole', 'uma parábola', 'uma reta horizontal'], 0, t`$y=kx$ é uma reta pela origem com inclinação $k$.`),
            gen((rng) => {
              const kg = randInt(rng, 2, 6);
              const price = kg * randInt(rng, 3, 12);
              const kg2 = randInt(rng, 7, 15);
              return num(t`Se $${kg}$ kg de arroz custam R\$ $${price}$, quanto custam $${kg2}$ kg?`, (price / kg) * kg2, t`Direta: $\frac{${kg}}{${price}}=\frac{${kg2}}{x}\Rightarrow x=${fmt((price / kg) * kg2)}$.`, { unit: 'R$' });
            }),
            tf(t`Se uma grandeza aumenta quando a outra aumenta, elas são **sempre** diretamente proporcionais.`, false, t`É preciso que a **razão** seja constante. Ex.: a área de um quadrado cresce com o lado, mas $A=\ell^2$ não é proporcional a $\ell$.`),
            mcq(t`Em qual tabela $y$ é diretamente proporcional a $x$?`, ['x = 1, 2, 4  →  y = 3, 6, 12', 'x = 1, 2, 4  →  y = 3, 5, 9', 'x = 1, 2, 4  →  y = 12, 6, 3', 'x = 1, 2, 4  →  y = 1, 4, 16'], 0, t`Só na primeira a razão é constante: $\frac{y}{x}=3$ sempre.`),
            gen((rng) => {
              const g = pick(rng, [200, 240, 300, 360]);
              const p1 = pick(rng, [6, 10, 12, 14]);
              return num(t`Uma receita para $4$ pessoas usa $${g}$ g de farinha. Quantos gramas para $${p1}$ pessoas?`, (g / 4) * p1, t`$${g}\div4=${fmt(g / 4)}$ g por pessoa; vezes $${p1}$: $${fmt((g / 4) * p1)}$ g.`, { unit: 'g' });
            }),
            gen((rng) => {
              const k = pick(rng, [1.5, 2.5, 3, 4.5, 6]);
              const x = pick(rng, [2, 4, 6]);
              return num(t`$y$ é diretamente proporcional a $x$, e $y=${fmt(k * x)}$ quando $x=${x}$. Qual é a constante $k$ em $y=kx$?`, k, t`$k=\frac{y}{x}=\frac{${fmt(k * x)}}{${x}}=${fmt(k)}$.`);
            }),
            gen((rng) => {
              const kml = pick(rng, [10, 12, 15]);
              const d = kml * pick(rng, [20, 25, 30, 40]);
              const pr = pick(rng, [5, 5.5, 6, 6.5]);
              return num(t`Um carro faz $${kml}$ km por litro. Numa viagem de $${d}$ km, com gasolina a R\$ $${fmt(pr)}$ o litro, quanto se gasta?`, (d / kml) * pr, t`Litros: $${d}\div${kml}=${d / kml}$. Custo: $${d / kml}\cdot${fmt(pr)}=${fmt((d / kml) * pr)}$ reais.`, { unit: 'R$' });
            }),
          ],
        },
        {
          card: {
            title: 'Inversamente proporcionais',
            body: t`São **inversamente proporcionais** quando o **produto** é constante: $x\cdot y=k$. Dobrou uma, a outra cai pela metade (mais operários ⟹ menos dias).

Arraste o ponto: a área do retângulo $x\cdot y$ nunca muda!`,
            visual: plot({
              view: { xMin: -0.5, xMax: 12.5, yMin: -0.5, yMax: 12.5 },
              equalAspect: true,
              points: [{ id: 'P', x: 3, y: 4, color: C.gold, label: 'P' }],
              constrain: (_id: string, x: number) => {
                const xx = Math.max(1, Math.min(12, x));
                return { x: xx, y: 12 / xx };
              },
              render: ({ pts }: any) => (
                <>
                  <RectW x={0} y={0} w={pts.P.x} h={pts.P.y} color={C.p3} opacity={0.3} />
                  <FnCurve f={(x) => 12 / x} from={0.9} color={C.p3} />
                </>
              ),
              info: ({ pts }: any) => t`$x=${fmt(pts.P.x, 2)}$, $y=${fmt(pts.P.y, 2)}$, área $x\cdot y=${fmt(pts.P.x * pts.P.y, 2)}$`,
            }),
          },
          exercises: [
            mcq(t`Para percorrer uma **distância fixa**, velocidade e tempo são grandezas…`, ['inversamente proporcionais', 'diretamente proporcionais', 'não proporcionais', 'iguais'], 0, t`$v\cdot t=d$ constante: dobrar a velocidade corta o tempo pela metade.`),
            tf(t`Se $x\cdot y$ é constante, dobrar $x$ faz $y$ cair pela metade.`, true, t`$(2x)\cdot\frac{y}{2}=x\cdot y$: o produto continua o mesmo.`),
            gen((rng) => {
              const n = pick(rng, [2, 3, 4, 6]);
              const d = pick(rng, [6, 8, 12, 24]);
              const m = pick(rng, [2, 3, 4, 6, 8, 12].filter((x) => x !== n));
              return num(t`$${n}$ operários constroem um muro em $${d}$ dias. Em quantos dias $${m}$ operários (no mesmo ritmo) constroem o mesmo muro?`, (n * d) / m, t`Inversa: o produto é constante, $${n}\cdot${d}=${m}\cdot x\Rightarrow x=${fmt((n * d) / m)}$ dias.`, { unit: 'dias' });
            }),
            gen((rng) => {
              const [v1, t1, v2] = pick(rng, [[60, 3, 90], [80, 3, 120], [60, 2, 40], [90, 2, 60], [100, 3, 150], [72, 5, 90], [50, 6, 75]]);
              return num(t`A $${v1}$ km/h, uma viagem leva $${t1}$ h. Quanto tempo leva a $${v2}$ km/h?`, (v1 * t1) / v2, t`Distância fixa: $v\cdot t$ constante. $${v1}\cdot${t1}=${v2}\cdot t\Rightarrow t=${(v1 * t1) / v2}$ h.`, { unit: 'h' });
            }),
            mcq(t`Qual par de grandezas é **inversamente** proporcional?`, ['Número de pessoas que dividem uma conta e o valor pago por pessoa', 'Quantidade de pães comprados e o preço total', 'Lado de um quadrado e seu perímetro', 'Tempo com a torneira aberta e o volume de água'], 0, t`Dividindo a conta entre mais pessoas, cada uma paga menos, e $n\cdot v$ é sempre o total da conta.`),
            inter(
              t`O produto $x\cdot y=12$ é fixo. Arraste o ponto até que $y=2$.`,
              'plot',
              {
                view: { xMin: -0.5, xMax: 12.5, yMin: -0.5, yMax: 12.5 },
                equalAspect: true,
                points: [{ id: 'P', x: 2, y: 6, color: C.gold, label: 'P' }],
                constrain: (_: string, x: number) => {
                  const xx = Math.max(1, Math.min(12, Math.round(x * 2) / 2));
                  return { x: xx, y: 12 / xx };
                },
                render: ({ pts }: any) => (
                  <>
                    <RectW x={0} y={0} w={pts.P.x} h={pts.P.y} color={C.p3} opacity={0.3} />
                    <FnCurve f={(x) => 12 / x} from={0.9} color={C.p3} />
                  </>
                ),
                info: ({ pts }: any) => t`$x=${fmt(pts.P.x, 2)}$, $y=${fmt(pts.P.y, 2)}$`,
              },
              (v) => v && near(v.pts.P.y, 2, 0.01),
              t`$x=6$, pois $6\cdot2=12$.`,
              t`Com o produto fixo, $y=\frac{12}{x}$: para $y=2$, $x=\frac{12}{2}=6$. A área do retângulo ($x\cdot y$) nunca muda.`,
            ),
            num(t`$x$ e $y$ são inversamente proporcionais. Se $x$ aumenta $25\%$, $y$ diminui quantos por cento?`, 20, t`$x\cdot y$ fixo: $y_{novo}=\frac{y}{1{,}25}=0{,}8\,y$, ou seja, diminui $20\%$.`, { unit: '%' }),
          ],
        },
        {
          card: {
            title: 'Regra de três',
            body: t`1. Monte uma tabela com as grandezas em colunas.
2. Decida se são **diretas** (setas no mesmo sentido) ou **inversas** (setas opostas).
3. Se for inversa, **inverta** uma das razões e resolva a proporção.`,
            example: t`3 máquinas fazem um serviço em 12 h. Em quanto tempo 4 máquinas fazem?
Mais máquinas ⟹ menos tempo (inversa): $\frac{12}{x}=\frac{4}{3}\Rightarrow x=9$ h.`,
            tip: t`**Regra de três composta** (3 ou mais grandezas): compare cada grandeza com a incógnita separadamente (direta ou inversa) e multiplique todas as razões.`,
          },
          exercises: [
            order(t`Ordene os passos para resolver uma regra de três:`, ['Organizar as grandezas em uma tabela', 'Identificar se a relação é direta ou inversa', 'Inverter a razão se for inversa', 'Montar a proporção e isolar o $x$'], t`Primeiro organize os dados e decida se a relação é direta ou inversa; só depois monte a proporção (invertendo uma das razões se for inversa) e isole $x$.`),
            gen((rng) => {
              const l = pick(rng, [2, 4, 5]);
              const area = l * pick(rng, [4, 5, 6]);
              const j = pick(rng, [3, 7, 8, 9]);
              const a2 = (area / l) * j;
              return num(t`$${l}$ L de tinta pintam $${area}$ m². Quantos litros são necessários para pintar $${a2}$ m²?`, j, t`Direta: $\frac{${l}}{${area}}=\frac{x}{${a2}}\Rightarrow x=${j}$ L.`, { unit: 'L' });
            }),
            gen((rng) => {
              const [m1, h1, m2] = pick(rng, [[3, 12, 4], [4, 9, 6], [2, 15, 3], [6, 10, 5], [5, 12, 4], [8, 6, 12]]);
              return num(t`$${m1}$ máquinas iguais fazem um serviço em $${h1}$ h. Em quantas horas $${m2}$ máquinas fazem o mesmo serviço?`, (m1 * h1) / m2, t`Inversa (mais máquinas, menos tempo): $${m1}\cdot${h1}=${m2}\cdot x\Rightarrow x=${(m1 * h1) / m2}$ h.`, { unit: 'h' });
            }),
            gen((rng) => {
              const sc = pick(rng, [
                ['Uma impressora imprime 40 páginas em 2 min. Quantas páginas em 7 min?', true],
                ['Com 5 pedreiros a obra leva 30 dias. Com 10 pedreiros, quantos dias?', false],
                ['Um carro a 80 km/h faz o trajeto em 3 h. A 120 km/h, quanto tempo?', false],
                ['3 kg de carne custam R\\$ 120. Quanto custam 5 kg?', true],
                ['Uma ração dura 20 dias para 6 cães. Para 8 cães, dura quantos dias?', false],
                ['Uma torneira enche 30 L em 4 min. Quantos litros em 10 min?', true],
              ] as const);
              return mcq(`Sem resolver: esta regra de três é direta ou inversa?\n\n${sc[0]}`, ['Direta', 'Inversa'], sc[1] ? 0 : 1, sc[1] ? t`As duas grandezas crescem juntas, na mesma razão: **direta**.` : t`Quando uma aumenta, a outra diminui na mesma proporção: **inversa**.`);
            }),
            gen((rng) => {
              const rpm = pick(rng, [1200, 1800, 2400, 3000]);
              const s = pick(rng, [5, 10, 15, 20]);
              return num(t`Um motor gira a $${rpm}$ rpm (rotações por minuto). Quantas voltas ele dá em $${s}$ segundos?`, (rpm / 60) * s, t`$${rpm}$ voltas em $60$ s dão $\frac{${rpm}}{60}=${rpm / 60}$ por segundo; em $${s}$ s: $${(rpm / 60) * s}$ voltas.`);
            }),
            num(t`$6$ máquinas produzem $900$ peças em $5$ h. Quantas peças $4$ máquinas produzem em $6$ h?`, 720, t`Peças é direta com máquinas **e** com horas: $900\cdot\frac{4}{6}\cdot\frac{6}{5}=720$.`),
            gen((rng) => {
              const [w1, d1, w2, d2] = pick(rng, [[4, 6, 6, 8], [5, 4, 10, 6], [3, 10, 6, 5], [8, 3, 4, 9]]);
              const base = pick(rng, [120, 240, 360]);
              const ans = (base * w2 * d2) / (w1 * d1);
              return num(t`$${w1}$ operários fazem $${base}$ m de muro em $${d1}$ dias. Quantos metros $${w2}$ operários fazem em $${d2}$ dias?`, ans, t`Metros é direta com operários e com dias: $${base}\cdot\frac{${w2}}{${w1}}\cdot\frac{${d2}}{${d1}}=${fmt(ans)}$ m.`, { unit: 'm' });
            }),
          ],
        },
      ],
    },
    {
      id: 'f-elem-porc',
      title: 'Porcentagem',
      parts: [
        {
          card: {
            title: 'Porcento = por cem',
            body: t`$x\%$ significa $\frac{x}{100}$. Para calcular $x\%$ de um valor $V$, multiplique: $\frac{x}{100}\cdot V$.`,
            visual: percentGrid(),
            example: t`$15\%$ de $80$ $=0{,}15\cdot80=12$.`,
          },
          exercises: [
            gen((rng) => {
              const p = pick(rng, [5, 10, 12, 15, 20, 25, 30, 40, 75]);
              const V = pick(rng, [40, 60, 80, 120, 200, 250, 360, 500]);
              return num(t`Quanto é $${p}\%$ de $${V}$?`, (p * V) / 100, t`$\frac{${p}}{100}\cdot${V}=${fmt((p * V) / 100)}$.`);
            }),
            match(t`Ligue cada porcentagem à fração equivalente:`, [
              [t`$50\%$`, t`$\frac12$`],
              [t`$25\%$`, t`$\frac14$`],
              [t`$10\%$`, t`$\frac{1}{10}$`],
              [t`$75\%$`, t`$\frac34$`],
            ], t`Porcentagem é fração de denominador $100$: $50\%=\frac{50}{100}=\frac12$, $25\%=\frac14$, $10\%=\frac{1}{10}$ e $75\%=\frac34$.`),
            gen((rng) => {
              const d = pick(rng, [0.07, 0.35, 0.8, 1.5, 0.125, 0.04, 2]);
              return rmcq(rng, t`Escreva $${fmt(d)}$ em porcentagem.`, t`$${fmt(d * 100)}\%$`, [t`$${fmt(d * 10)}\%$`, t`$${fmt(d)}\%$`, t`$${fmt(d * 1000)}\%$`], t`Multiplique por $100$: $${fmt(d)}\cdot100=${fmt(d * 100)}\%$.`);
            }),
            mcqS(t`$18$ representa que porcentagem de $72$?`, '$25\\%$', ['$18\\%$', '$40\\%$', '$4\\%$'], t`$\frac{18}{72}=0{,}25=25\%$.`),
            gen((rng) => {
              const tot = pick(rng, [20, 40, 80, 200]);
              const p = pick(rng, [5, 10, 15, 20, 30, 35, 45, 60]);
              const part = (tot * p) / 100;
              return num(t`Numa turma de $${tot}$ alunos, $${part}$ tiraram nota máxima. Que porcentagem da turma é essa?`, p, t`$\frac{${part}}{${tot}}=${fmt(p / 100)}=${p}\%$.`, { unit: '%' });
            }),
            inter(t`Pinte exatamente $35\%$ do quadrado.`, 'plot', percentGrid(true).props, (v) => v && v.p.p === 35, t`$35$ quadradinhos de $100$.`, t`$35\%=\frac{35}{100}$: dos $100$ quadradinhos, pinte $35$.`),
            gen((rng) => {
              const p = pick(rng, [20, 25, 30, 40, 60]);
              const V = pick(rng, [50, 80, 120, 150, 200, 250]);
              return num(t`$${p}\%$ de um valor é $${fmt((p * V) / 100)}$. Qual é esse valor?`, V, t`$${fmt(p / 100)}\cdot V=${fmt((p * V) / 100)}\Rightarrow V=\frac{${fmt((p * V) / 100)}}{${fmt(p / 100)}}=${V}$.`);
            }),
            num(t`Numa empresa, $60\%$ dos funcionários são mulheres, e $25\%$ delas trabalham na engenharia. Que porcentagem do **total** de funcionários são engenheiras?`, 15, t`Porcentagem de porcentagem multiplica: $0{,}6\cdot0{,}25=0{,}15=15\%$.`, { unit: '%' }),
          ],
        },
        {
          card: {
            title: 'Fator multiplicativo',
            body: t`O truque dos engenheiros: transformar aumentos e descontos em **multiplicações**.

• Aumento de $i$: multiplique por $(1+i)$. Ex.: $+12\%\to\times1{,}12$
• Desconto de $i$: multiplique por $(1-i)$. Ex.: $-30\%\to\times0{,}70$

Variações **sucessivas** se multiplicam: $+20\%$ e depois $-20\%$ dá $1{,}2\cdot0{,}8=0{,}96$, ou seja, **perda de 4%**!`,
          },
          exercises: [
            gen((rng) => {
              const p = randInt(rng, 3, 45);
              const up = rng() < 0.5;
              const f = up ? 1 + p / 100 : 1 - p / 100;
              return rmcq(rng, t`Qual fator multiplicativo representa ${up ? 'um **aumento**' : 'um **desconto**'} de $${p}\%$?`, `$${fmt(f)}$`, [`$${fmt(up ? 1 - p / 100 : 1 + p / 100)}$`, `$${fmt(p / 100)}$`, `$${p}$`, `$${fmt(1 + p / 10)}$`], t`${up ? 'Aumento' : 'Desconto'}: $1${up ? '+' : '-'}${fmt(p / 100)}=${fmt(f)}$.`);
            }),
            gen((rng) => {
              const price = pick(rng, [80, 120, 150, 200, 240, 300]);
              const d = pick(rng, [10, 15, 20, 25, 30]);
              return num(t`Um produto de R\$ $${price}$ tem desconto de $${d}\%$. Qual o novo preço?`, price * (1 - d / 100), t`$${price}\cdot${fmt(1 - d / 100)}=${fmt(price * (1 - d / 100))}$.`, { unit: 'R$' });
            }),
            gen((rng) => {
              const price = pick(rng, [50, 80, 120, 200, 250]);
              const i = pick(rng, [5, 10, 12, 15, 20, 30]);
              return num(t`Um produto de R\$ $${price}$ sofre um aumento de $${i}\%$. Qual o novo preço?`, price * (1 + i / 100), t`Fator $${fmt(1 + i / 100)}$: $${price}\cdot${fmt(1 + i / 100)}=${fmt(price * (1 + i / 100))}$.`, { unit: 'R$' });
            }),
            tf(t`Aumentar um preço em $10\%$ e depois reduzir $10\%$ faz o preço voltar ao valor original.`, false, t`$1{,}1\cdot0{,}9=0{,}99$: o preço final é $1\%$ menor.`),
            gen((rng) => {
              const a = pick(rng, [40, 50, 80, 120, 200]);
              const c = pick(rng, [-25, -20, -10, 5, 15, 30, 50]);
              const b = a * (1 + c / 100);
              return num(t`Um preço passou de R\$ $${a}$ para R\$ $${fmt(b)}$. Qual foi a variação percentual? (use sinal negativo para queda)`, c, t`$\frac{${fmt(b)}}{${a}}=${fmt(1 + c / 100)}$, ou seja, ${c > 0 ? `aumento de $${c}\\%$` : `queda de $${-c}\\%$`}.`, { unit: '%' });
            }),
            num(t`Dois descontos sucessivos de $20\%$ e $10\%$ equivalem a um desconto único de quantos por cento?`, 28, t`$0{,}8\cdot0{,}9=0{,}72$, ou seja, paga-se $72\%$: desconto de $28\%$.`, { unit: '%' }),
            gen((rng) => {
              const i = pick(rng, [10, 20, 25, 50]);
              const old = pick(rng, [80, 120, 200, 400]);
              const nw = old * (1 + i / 100);
              return num(t`Após um aumento de $${i}\%$, um produto passou a custar R\$ $${fmt(nw)}$. Quanto custava antes?`, old, t`Novo $=$ antigo $\cdot\,${fmt(1 + i / 100)}$. Então antigo $=\frac{${fmt(nw)}}{${fmt(1 + i / 100)}}=${old}$.`, { unit: 'R$' });
            }),
            gen((rng) => {
              const a = pick(rng, [10, 20, 30, 50]);
              return num(t`Um preço sobe $${a}\%$ e depois cai $${a}\%$. No total, ele caiu quantos por cento?`, (a * a) / 100, t`$${fmt(1 + a / 100)}\cdot${fmt(1 - a / 100)}=${fmt(1 - (a * a) / 10000)}$: queda de $${fmt((a * a) / 100)}\%$.`, { unit: '%' });
            }),
          ],
        },
        {
          card: {
            title: 'Juros compostos',
            body: t`Aplicando a taxa $i$ por $t$ períodos, o fator é aplicado $t$ vezes:

$$M=C\,(1+i)^t$$

Compare com juros simples ($M=C(1+i\,t)$, uma reta): o composto cresce **exponencialmente**.`,
            visual: plot({
              view: { xMin: -0.5, xMax: 20, yMin: -100, yMax: 5000 },
              params: [{ key: 'i', label: 'i\\%', min: 1, max: 20, step: 0.5, value: 8, color: C.success }],
              render: ({ p }: any) => (
                <>
                  <FnCurve f={(x) => 1000 * (1 + (p.i / 100) * x)} color={C.p3} from={0} dash="7 5" />
                  <FnCurve f={(x) => 1000 * Math.pow(1 + p.i / 100, x)} color={C.success} from={0} />
                </>
              ),
              info: ({ p }: any) => t`$C=1000$. Em 10 períodos: composto $=${fmt(1000 * Math.pow(1 + p.i / 100, 10), 2)}$ vs. simples (tracejado) $=${fmt(1000 * (1 + (p.i / 100) * 10), 2)}$`,
            }),
          },
          exercises: [
            mcq(t`Um capital $C$ aplicado a juros compostos de taxa $i$ por $t$ períodos vira:`, [t`$C(1+i)^t$`, t`$C(1+i\,t)$`, t`$C\cdot i\cdot t$`, t`$C+i^t$`], 0, t`A cada período o valor é multiplicado por $(1+i)$; em $t$ períodos, por $(1+i)^t$.`),
            num(t`R\$ $1000$ aplicados a juros compostos de $10\%$ ao mês. Qual o montante após $2$ meses?`, 1210, t`$1000\cdot1{,}1^2=1000\cdot1{,}21=1210$.`, { unit: 'R$' }),
            gen((rng) => {
              const Cc = pick(rng, [1000, 2000, 5000]);
              const i = pick(rng, [2, 3, 5]);
              const tm = pick(rng, [4, 6, 10, 12]);
              return num(t`R\$ $${Cc}$ aplicados a juros **simples** de $${i}\%$ ao mês. Qual o montante após $${tm}$ meses?`, Cc * (1 + (i / 100) * tm), t`Juros simples: $M=C(1+i\,t)=${Cc}\cdot(1+${fmt(i / 100)}\cdot${tm})=${fmt(Cc * (1 + (i / 100) * tm))}$.`, { unit: 'R$' });
            }),
            gen((rng) => {
              const Cc = pick(rng, [1000, 2000, 5000]);
              const i = pick(rng, [10, 20]);
              const tm = pick(rng, [2, 3]);
              const M = Math.round(Cc * (1 + i / 100) ** tm * 100) / 100;
              return num(t`R\$ $${Cc}$ a juros **compostos** de $${i}\%$ ao mês. Qual o montante após $${tm}$ meses?`, M, t`$M=${Cc}\cdot${fmt(1 + i / 100)}^{${tm}}=${fmt(M, 2)}$.`, { unit: 'R$' });
            }),
            tf(t`Nos juros compostos, o valor dos juros é o mesmo todo mês.`, false, t`Os juros incidem sobre o montante acumulado, que cresce; então os juros de cada mês também crescem. Juros iguais todo mês é o regime **simples**.`),
            gen((rng) => {
              const i = pick(rng, [2, 5, 10, 20]);
              const f = (1 + i / 100) ** 2;
              return rmcq(rng, t`Uma aplicação rende $${i}\%$ ao mês. Por qual fator o capital fica multiplicado em $2$ meses?`, `$${fmt(f)}$`, [`$${fmt(1 + (2 * i) / 100)}$`, `$${fmt(2 * (1 + i / 100))}$`, `$${fmt(1 + i / 100)}$`], t`$${fmt(1 + i / 100)}^2=${fmt(f)}$, um pouco mais que $${fmt(1 + (2 * i) / 100)}$ (juros sobre juros).`);
            }),
            num(t`A inflação foi de $10\%$ em um ano e de $20\%$ no seguinte. Qual a inflação acumulada nos dois anos?`, 32, t`$1{,}1\cdot1{,}2=1{,}32$: acumulado de $32\%$ (e não $30\%$).`, { unit: '%' }),
            gen((rng) => {
              const V = pick(rng, [40000, 50000, 80000]);
              const d = pick(rng, [10, 20]);
              const M = Math.round(V * (1 - d / 100) ** 2);
              return num(t`Um carro de R\$ $${group(V)}$ desvaloriza $${d}\%$ ao ano. Quanto ele vale depois de $2$ anos?`, M, t`Fator anual $${fmt(1 - d / 100)}$: $${group(V)}\cdot${fmt(1 - d / 100)}^2=${group(M)}$.`, { unit: 'R$' });
            }),
          ],
        },
      ],
    },
  ],
};
