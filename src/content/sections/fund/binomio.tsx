import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, multi, inter, plot } from '../../helpers';
import { CircleW, Label, RectW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, par, pick, randInt } from '../../../lib/random';

const t = String.raw;
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
const Cb = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
};

/* ---------------- labs ---------------- */

/** Pascal's triangle: row n highlighted, Stifel cell (n, k) with its two parents. */
const pascalLab = (n0 = 5, k0 = 2) =>
  plot({
    view: { xMin: -9.5, xMax: 9.5, yMin: -10.6, yMax: 0.8 },
    grid: false,
    axes: false,
    tickLabels: false,
    params: [
      { key: 'n', label: 'n', min: 1, max: 9, step: 1, value: n0, color: C.p2, format: (v: number) => String(v) },
      { key: 'k', label: 'k', min: 0, max: 9, step: 1, value: k0, color: C.gold, format: (v: number) => String(v) },
    ],
    render: ({ p }: any) => {
      const n = Math.round(p.n);
      const k = Math.min(Math.round(p.k), n);
      const out: React.ReactNode[] = [];
      for (let r = 0; r <= 9; r++)
        for (let c = 0; c <= r; c++) {
          const x = 2 * c - r;
          const y = -r * 1.1;
          const isTarget = r === n && c === k;
          const isParent = r === n - 1 && (c === k - 1 || c === k);
          const color = isTarget ? C.gold : isParent ? C.p5 : r === n ? C.p2 : C.textDim;
          if (isTarget || isParent) out.push(<CircleW key={'o' + r + c} cx={x} cy={y} r={0.75} color={color} width={2} />);
          out.push(<Label key={r + '-' + c} x={x} y={y} dy={5} text={String(Cb(r, c))} color={color} size={r === n ? 14 : 11} anchor="middle" />);
        }
      return <>{out}</>;
    },
    info: ({ p }: any) => {
      const n = Math.round(p.n);
      const k = Math.min(Math.round(p.k), n);
      return t`linha $n=${n}$: soma $=2^{${n}}=${2 ** n}$ · Stifel: $\binom{${n - 1}}{${k - 1}}+\binom{${n - 1}}{${k}}=${Cb(n - 1, k - 1)}+${Cb(n - 1, k)}=${Cb(n, k)}=\binom{${n}}{${k}}$`;
    },
  });

/** Coefficients of (x + a)^n as bars; the highlighted bar is the term T_{k+1}. */
const coefLab = () =>
  plot({
    view: { xMin: -0.8, xMax: 12.8, yMin: -0.1, yMax: 1.15 },
    grid: false,
    tickLabels: false,
    params: [
      { key: 'n', label: 'n', min: 1, max: 12, step: 1, value: 6, color: C.p2, format: (v: number) => String(v) },
      { key: 'k', label: 'k', min: 0, max: 12, step: 1, value: 2, color: C.gold, format: (v: number) => String(v) },
    ],
    render: ({ p }: any) => {
      const n = Math.round(p.n);
      const k = Math.min(Math.round(p.k), n);
      const mx = Cb(n, Math.floor(n / 2));
      return (
        <>
          {Array.from({ length: n + 1 }, (_, j) => (
            <RectW key={j} x={j - 0.38} y={0} w={0.76} h={Cb(n, j) / mx} color={j === k ? C.gold : C.p2} opacity={j === k ? 0.85 : 0.45} />
          ))}
        </>
      );
    },
    info: ({ p }: any) => {
      const n = Math.round(p.n);
      const k = Math.min(Math.round(p.k), n);
      return t`$(x+a)^{${n}}$ tem $${n + 1}$ termos · $T_{${k + 1}}=\binom{${n}}{${k}}x^{${n - k}}a^{${k}}=${Cb(n, k)}\,x^{${n - k}}a^{${k}}$`;
    },
  });

/** Stars and bars: x + y + z = n drawn as n stars and 2 bars. */
const starsLab = () =>
  plot({
    view: { xMin: -0.5, xMax: 12.5, yMin: -1.2, yMax: 1.4 },
    grid: false,
    axes: false,
    tickLabels: false,
    params: [
      { key: 'x', label: 'x', min: 0, max: 10, step: 1, value: 3, color: C.p2, format: (v: number) => String(v) },
      { key: 'y', label: 'y', min: 0, max: 10, step: 1, value: 4, color: C.p5, format: (v: number) => String(v) },
    ],
    render: ({ p }: any) => {
      const n = 10;
      const x = Math.min(Math.round(p.x), n);
      const y = Math.min(Math.round(p.y), n - x);
      const z = n - x - y;
      const seq: string[] = [...Array(x).fill('a'), '|', ...Array(y).fill('b'), '|', ...Array(z).fill('c')];
      const col: Record<string, string> = { a: C.p2, b: C.p5, c: C.p4 };
      return (
        <>
          {seq.map((s, i) =>
            s === '|' ? <Seg key={i} x1={i} y1={-0.7} x2={i} y2={0.7} color={C.gold} width={4} /> : <CircleW key={i} cx={i} cy={0} r={0.3} color={col[s]} fill={col[s]} fillOpacity={0.8} />,
          )}
          <Label x={0} y={1.15} text={`x = ${x}   y = ${y}   z = ${z}`} color={C.text} />
        </>
      );
    },
    info: () => t`Cada solução de $x+y+z=10$ é uma fila de 10 bolinhas e 2 barras: escolha onde ficam as barras entre 12 posições: $\binom{12}{2}=66$ soluções.`,
  });

/* ---------------- unit ---------------- */

export const binomio: UnitDef = {
  id: 'f-bin',
  title: 'Binômio de Newton e contagem avançada',
  subtitle: 'Triângulo de Pascal, termo geral, permutação circular e inclusão-exclusão',
  icon: '🔺',
  guide: t`O número binomial $\binom nk=\frac{n!}{k!(n-k)!}$ conta escolhas e é o coeficiente de $x^{n-k}a^k$ em $(x+a)^n$. Propriedades-chave: $\binom nk=\binom n{n-k}$, Stifel $\binom{n-1}{k-1}+\binom{n-1}{k}=\binom nk$ e $\sum_k\binom nk=2^n$. Termo geral: $T_{k+1}=\binom nk x^{n-k}a^k$. Para contar: fila circular $(n-1)!$; soluções inteiras $\ge0$ de $x_1+\dots+x_r=n$: $\binom{n+r-1}{r-1}$; uniões: inclusão-exclusão.`,
  lessons: [
    {
      id: 'f-bin-pascal',
      title: 'Números binomiais e triângulo de Pascal',
      parts: [
        {
          card: {
            title: 'Número binomial',
            body: t`$$\binom nk=\frac{n!}{k!\,(n-k)!}\qquad(0\le k\le n)$$
É o mesmo $C_{n,k}$ das combinações: de quantos modos escolher $k$ objetos entre $n$. Valem $\binom n0=\binom nn=1$ e $\binom n1=n$.

**Complementares**: $\binom nk=\binom n{n-k}$ — escolher quem entra é o mesmo que escolher quem fica de fora. Por isso, se $\binom nk=\binom np$, então $k=p$ **ou** $k+p=n$.`,
            example: t`$\binom{10}{8}=\binom{10}{2}=\frac{10\cdot9}{2}=45$: sempre calcule pelo menor dos dois.`,
          },
          exercises: [
            gen((rng) => {
              const n = randInt(rng, 5, 12);
              const k = randInt(rng, 2, 3);
              return num(t`Calcule $\binom{${n}}{${k}}$.`, Cb(n, k), t`$\frac{${n}!}{${k}!\,${n - k}!}=${Cb(n, k)}$.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 8, 20);
              const k = n - randInt(rng, 1, 3);
              return num(t`Calcule $\binom{${n}}{${k}}$ (use o complementar).`, Cb(n, k), t`$\binom{${n}}{${k}}=\binom{${n}}{${n - k}}=${Cb(n, k)}$.`);
            }),
            tf(t`$\binom{7}{0}=0$.`, false, t`$\binom n0=\frac{n!}{0!\,n!}=1$ (há um único modo de não escolher nada).`),
            gen((rng) => {
              const n = randInt(rng, 9, 20);
              const k = randInt(rng, 2, Math.floor(n / 2) - 1);
              return num(t`Se $\binom{${n}}{x}=\binom{${n}}{${k}}$ e $x\ne ${k}$, quanto vale $x$?`, n - k, t`Complementares: $x+${k}=${n}\Rightarrow x=${n - k}$.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 4, 15);
              return num(t`Para qual $n$ temos $\binom n2=${Cb(n, 2)}$?`, n, t`$\frac{n(n-1)}{2}=${Cb(n, 2)}\Rightarrow n(n-1)=${n * (n - 1)}\Rightarrow n=${n}$.`);
            }),
            match('Associe cada binomial ao seu valor.', [[t`$\binom{5}{2}$`, '10'], [t`$\binom{6}{3}$`, '20'], [t`$\binom{8}{1}$`, '8'], [t`$\binom{9}{9}$`, '1']], 'Use n!/(k!(n − k)!).'),
            mcqS(t`Simplifique $\frac{(n+1)!}{(n-1)!}$.`, t`$n(n+1)$`, [t`$n+1$`, t`$(n+1)^2$`, t`$n!$`], t`$(n+1)!=(n+1)\,n\,(n-1)!$: cancela $(n-1)!$.`),
            fill(t`Complete: $\binom{n}{k}=\binom{n}{j}$ com $j$ = (1ª lacuna), e $\binom{n}{1}$ = (2ª lacuna).`, '___ ; ___', ['n − k', 'n'], ['k − 1', '1', 'n!'], 'Complementares e escolha de um só elemento.'),
          ],
        },
        {
          card: {
            title: 'Triângulo de Pascal',
            body: t`Coloque $\binom nk$ na linha $n$, coluna $k$. Cada número é a soma dos dois acima dele — **relação de Stifel**:
$$\binom{n-1}{k-1}+\binom{n-1}{k}=\binom nk$$
Propriedades que se leem no triângulo:
• simetria (complementares);
• soma da linha $n$: $2^n$ (cada elemento entra ou não num subconjunto);
• **teorema das colunas** ("taco de hóquei"): $\binom kk+\binom{k+1}k+\dots+\binom nk=\binom{n+1}{k+1}$.`,
            visual: pascalLab(),
          },
          exercises: [
            gen((rng) => {
              const n = randInt(rng, 4, 12);
              return num(`Soma dos elementos da linha ${n} do triângulo de Pascal:`, 2 ** n, `2^${n} = ${2 ** n}.`);
            }),
            inter(t`Ajuste $n$ e $k$ para ver Stifel produzir $\binom{6}{3}$.`, 'plot', pascalLab(4, 1).props, (v) => Math.round(v.p.n) === 6 && Math.round(v.p.k) === 3, 'n = 6, k = 3', t`$\binom52+\binom53=10+10=20=\binom63$.`),
            gen((rng) => {
              const n = randInt(rng, 5, 12);
              const k = randInt(rng, 1, n - 1);
              return num(t`Sabendo que $\binom{${n}}{${k - 1}}=${Cb(n, k - 1)}$ e $\binom{${n}}{${k}}=${Cb(n, k)}$, quanto vale $\binom{${n + 1}}{${k}}$?`, Cb(n + 1, k), `Stifel: ${Cb(n, k - 1)} + ${Cb(n, k)} = ${Cb(n + 1, k)}.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 4, 10);
              return num(`Quantos subconjuntos tem um conjunto de ${n} elementos?`, 2 ** n, `Cada elemento entra ou não: 2^${n} = ${2 ** n} (é a soma da linha ${n}).`);
            }),
            gen((rng) => {
              const n = randInt(rng, 4, 9);
              return num(t`Pelo teorema das colunas, $\binom22+\binom32+\dots+\binom{${n}}{2}=$ ?`, Cb(n + 1, 3), t`$=\binom{${n + 1}}{3}=${Cb(n + 1, 3)}$.`);
            }),
            tf('Cada linha do triângulo de Pascal é simétrica.', true, 'É a propriedade dos complementares: C(n, k) = C(n, n − k).'),
            gen((rng) => {
              const n = randInt(rng, 5, 10);
              return num(t`Quanto vale $\binom{${n}}{1}+\binom{${n}}{2}+\dots+\binom{${n}}{${n}}$?`, 2 ** n - 1, t`Linha inteira $2^{${n}}$ menos $\binom{${n}}{0}=1$: $${2 ** n - 1}$.`);
            }),
            mcqS('Quantos caminhos mínimos (só direita e cima) levam de (0, 0) a (4, 3) numa grade?', '35', ['12', '7', '24'], 'São 7 passos, dos quais 3 são "cima": C(7, 3) = 35. Por isso Pascal soma caminhos.'),
          ],
        },
      ],
    },
    {
      id: 'f-bin-termo',
      title: 'Binômio de Newton e termo geral',
      parts: [
        {
          card: {
            title: 'Expandindo (x + a)ⁿ',
            body: t`$$(x+a)^n=\sum_{k=0}^{n}\binom nk x^{n-k}a^k$$
Os coeficientes são a linha $n$ de Pascal; o expoente de $x$ desce de $n$ a $0$ enquanto o de $a$ sobe. Há $n+1$ termos.

**Soma dos coeficientes**: troque as variáveis por 1. Em $(2x-1)^5$, a soma é $(2-1)^5=1$.`,
            example: t`$(x+2)^4=x^4+4x^3\cdot2+6x^2\cdot4+4x\cdot8+16=x^4+8x^3+24x^2+32x+16$.`,
            visual: coefLab(),
          },
          exercises: [
            gen((rng) => {
              const n = randInt(rng, 3, 12);
              return num(`Quantos termos tem o desenvolvimento de (x + a)^${n}?`, n + 1, `n + 1 = ${n + 1}.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 3);
              const n = randInt(rng, 3, 5);
              const k = randInt(rng, 1, n - 1);
              return num(t`Em $(x+${a})^{${n}}$, qual o coeficiente de $x^{${n - k}}$?`, Cb(n, k) * a ** k, t`$\binom{${n}}{${k}}\cdot${a}^{${k}}=${Cb(n, k)}\cdot ${par(a ** k)}=${Cb(n, k) * a ** k}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 4);
              const b = randInt(rng, -3, 3) || 1;
              const n = randInt(rng, 3, 8);
              return num(t`Soma dos coeficientes de $(${a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)})^{${n}}$:`, (a + b) ** n, t`Faça $x=1$: $(${a}${b < 0 ? '-' : '+'}${Math.abs(b)})^{${n}}=${(a + b) ** n}$.`);
            }),
            inter(t`Ajuste $n$ e $k$ para destacar o termo de maior coeficiente de $(x+a)^{8}$.`, 'plot', coefLab().props, (v) => Math.round(v.p.n) === 8 && Math.round(v.p.k) === 4, 'n = 8, k = 4', t`O maior é o do meio: $\binom84=70$.`),
            mcqS(t`O desenvolvimento de $(x-1)^4$ é:`, t`$x^4-4x^3+6x^2-4x+1$`, [t`$x^4+4x^3+6x^2+4x+1$`, t`$x^4-1$`, t`$x^4-4x^3-6x^2-4x+1$`], t`Com $a=-1$, os sinais alternam.`),
            tf(t`$(a+b)^2=a^2+b^2$.`, false, t`Falta o termo do meio: $\binom21ab=2ab$.`),
            order(t`Ordene os termos de $(x+y)^3$ pela potência de $x$ (decrescente).`, [t`$x^3$`, t`$3x^2y$`, t`$3xy^2$`, t`$y^3$`], 'Coeficientes 1, 3, 3, 1 (linha 3 de Pascal).'),
            gen((rng) => {
              const n = randInt(rng, 4, 9);
              return num(t`Em $(1+x)^{${n}}$, quanto vale a soma $\binom{${n}}{0}-\binom{${n}}{1}+\binom{${n}}{2}-\dots$ (sinais alternados)?`, 0, t`Faça $x=-1$: $(1-1)^{${n}}=0$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Termo geral',
            body: t`O termo de ordem $k+1$ de $(x+a)^n$ é
$$T_{k+1}=\binom nk x^{n-k}a^k$$
Para achar um termo específico (por exemplo, o **independente de** $x$), escreva o expoente de $x$ em função de $k$ e iguale ao desejado.`,
            example: t`Termo independente de $\left(x+\frac1x\right)^6$: $T_{k+1}=\binom6kx^{6-k}x^{-k}=\binom6kx^{6-2k}$. $6-2k=0\Rightarrow k=3$: $\binom63=20$.`,
            tip: 'Aproximações: (1 + x)ⁿ ≈ 1 + nx + C(n, 2)x² para x pequeno. Ex.: 1,01¹⁰ ≈ 1 + 0,1 + 45·0,0001 = 1,1045.',
          },
          exercises: [
            gen((rng) => {
              const n = 2 * randInt(rng, 2, 6);
              return num(t`Termo independente de $x$ em $\left(x+\frac1x\right)^{${n}}$:`, Cb(n, n / 2), t`Expoente $${n}-2k=0\Rightarrow k=${n / 2}$: $\binom{${n}}{${n / 2}}=${Cb(n, n / 2)}$.`);
            }),
            gen((rng) => {
              const n = 3 * randInt(rng, 1, 3);
              const k = n / 3;
              return num(t`Termo independente de $x$ em $\left(x^2+\frac1x\right)^{${n}}$:`, Cb(n, 2 * k), t`$T_{j+1}=\binom{${n}}{j}x^{2(${n}-j)}x^{-j}=\binom{${n}}{j}x^{${2 * n}-3j}$. $j=${2 * k}$: $\binom{${n}}{${2 * k}}=${Cb(n, 2 * k)}$.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 5, 10);
              const k = randInt(rng, 2, n - 2);
              const a = pick(rng, [2, -2, 3]);
              return num(t`Coeficiente de $x^{${n - k}}$ em $(x${a < 0 ? '' : '+'}${a})^{${n}}$:`, Cb(n, k) * a ** k, t`$\binom{${n}}{${k}}(${a})^{${k}}=${Cb(n, k)}\cdot ${par(a ** k)}=${Cb(n, k) * a ** k}$.`);
            }),
            mcqS(t`O termo médio de $(x+a)^{10}$ é o:`, t`$T_6=\binom{10}{5}x^5a^5$`, [t`$T_5$`, t`$T_{10}$`, t`$T_6=\binom{10}{6}x^4a^6$`], t`11 termos: o do meio é o 6º, com $k=5$.`),
            gen((rng) => {
              const n = pick(rng, [5, 8, 10, 12]);
              const x = pick(rng, [0.01, 0.02, 0.03]);
              const approx = 1 + n * x + Cb(n, 2) * x * x;
              return num(t`Use os três primeiros termos do binômio para aproximar $(1+${fmt(x)})^{${n}}$ (4 casas).`, approx, t`$1+${n}\cdot${fmt(x)}+\binom{${n}}{2}\cdot${fmt(x)}^2=${fmt(approx, 4)}$ (exato: ${fmt((1 + x) ** n, 4)}).`, { tol: 0.0006 });
            }),
            gen((rng) => {
              const n = randInt(rng, 4, 10);
              const p = pick(rng, [0.5, 0.2, 0.3]);
              const k = randInt(rng, 1, n - 1);
              return num(`Cada ensaio independente tem probabilidade ${fmt(p)} de sucesso. Qual a probabilidade de exatamente ${k} sucessos em ${n} ensaios (4 casas)?`, Cb(n, k) * p ** k * (1 - p) ** (n - k), t`É um termo de $(q+p)^{${n}}$: $\binom{${n}}{${k}}p^{${k}}q^{${n - k}}\approx ${fmt(Cb(n, k) * p ** k * (1 - p) ** (n - k), 4)}$.`, { tol: 0.0006 });
            }),
            tf(t`Em $(x+a)^n$, a soma dos expoentes de $x$ e $a$ em cada termo é sempre $n$.`, true, t`$x^{n-k}a^k$: $(n-k)+k=n$.`),
            mcq(t`Qual a ordem do termo em $x^3$ de $(x+2)^7$?`, ['5º termo', '3º termo', '4º termo', '7º termo'], 0, t`$x^{7-k}=x^3\Rightarrow k=4\Rightarrow T_{k+1}=T_5$.`),
          ],
        },
      ],
    },
    {
      id: 'f-bin-cont',
      title: 'Contagem avançada',
      parts: [
        {
          card: {
            title: 'Permutação circular e elementos juntos',
            body: t`Numa mesa redonda, girar todo mundo não muda a disposição: fixe uma pessoa e permute as outras.
$$PC_n=(n-1)!$$
**Juntos**: trate o grupo como um bloco e multiplique pelas permutações internas. **Separados**: total − juntos.`,
            example: t`5 pessoas em fila com A e B juntos: bloco AB + 3 pessoas = 4 itens ⇒ $4!\cdot2!=48$. Separados: $5!-48=72$.`,
          },
          exercises: [
            gen((rng) => {
              const n = randInt(rng, 4, 9);
              return num(`De quantos modos ${n} pessoas podem sentar-se ao redor de uma mesa redonda?`, fact(n - 1), `(n − 1)! = ${n - 1}! = ${fact(n - 1)}.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 4, 8);
              return num(`${n} pessoas em fila, com duas delas sempre juntas. Quantas filas?`, fact(n - 1) * 2, `Bloco + ${n - 2} pessoas = ${n - 1} itens: ${n - 1}!·2! = ${fact(n - 1) * 2}.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 4, 8);
              return num(`${n} pessoas em fila, com duas delas NUNCA juntas. Quantas filas?`, fact(n) - fact(n - 1) * 2, `Total − juntas: ${n}! − 2·${n - 1}! = ${fact(n) - 2 * fact(n - 1)}.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 5, 8);
              return num(`Quantos colares diferentes com ${n} contas distintas (o colar pode ser virado)?`, fact(n - 1) / 2, `Circular (n − 1)! e virar identifica pares: ${fact(n - 1)}/2 = ${fact(n - 1) / 2}.`);
            }),
            mcqS('Anagramas de LIVRO com as vogais juntas:', '48', ['24', '120', '12'], 'Bloco "IO" + L, V, R = 4 itens: 4!·2! = 48.'),
            gen((rng) => {
              const n = randInt(rng, 5, 8);
              return num(`Ao redor de uma mesa com ${n} lugares, quantas disposições deixam o casal Ana e Beto lado a lado?`, 2 * fact(n - 2), `Bloco (Ana, Beto) + ${n - 2} pessoas = ${n - 1} itens em círculo: (${n - 2})!·2 = ${2 * fact(n - 2)}.`);
            }),
            tf('Numa mesa redonda com 4 lugares, há 4! = 24 disposições distintas de 4 pessoas.', false, 'Rotações são a mesma disposição: (4 − 1)! = 6.'),
            mcqS('Anagramas de PERMUTA que começam e terminam com vogal:', '720', ['5040', '1440', '360'], 'Vogais E, U, A: 3·2 = 6 jeitos para as pontas; as 5 letras do meio: 5! = 120. Total 720.'),
          ],
        },
        {
          card: [
            {
              title: 'Soluções inteiras: estrelas e barras',
              body: t`O número de soluções com inteiros **não negativos** de $x_1+x_2+\dots+x_r=n$ é
$$\binom{n+r-1}{r-1}$$
Desenhe $n$ estrelas e $r-1$ barras: cada arrumação é uma solução. É também o número de **combinações com repetição** (escolher $n$ itens de $r$ tipos).

Se cada $x_i\ge1$, troque $x_i=y_i+1$: sobram $n-r$ unidades livres.`,
              visual: starsLab(),
            },
            {
              title: 'Inclusão-exclusão e casa dos pombos',
              body: t`$$|A\cup B|=|A|+|B|-|A\cap B|$$
$$|A\cup B\cup C|=|A|+|B|+|C|-|A\cap B|-|A\cap C|-|B\cap C|+|A\cap B\cap C|$$
**Casa dos pombos**: se $n+1$ pombos entram em $n$ casas, alguma casa tem pelo menos 2 pombos.`,
            },
          ],
          exercises: [
            gen((rng) => {
              const n = randInt(rng, 4, 12);
              return num(t`Quantas soluções inteiras não negativas tem $x+y+z=${n}$?`, Cb(n + 2, 2), t`$\binom{${n}+2}{2}=${Cb(n + 2, 2)}$.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 6, 12);
              return num(t`Quantas soluções inteiras **positivas** tem $x+y+z=${n}$?`, Cb(n - 1, 2), t`Com $x=x'+1$ etc.: $x'+y'+z'=${n - 3}$ ⇒ $\binom{${n - 1}}{2}=${Cb(n - 1, 2)}$.`);
            }),
            inter('Escolha x e y para representar a solução (2, 5, 3) de x + y + z = 10.', 'plot', starsLab().props, (v) => Math.round(v.p.x) === 2 && Math.round(v.p.y) === 5, 'x = 2, y = 5', 'Duas bolinhas, barra, cinco, barra, três.'),
            gen((rng) => {
              const k = randInt(rng, 3, 6);
              const n = randInt(rng, 3, 8);
              return num(`Uma sorveteria tem ${k} sabores. De quantos modos posso montar um pote com ${n} bolas (sabores podem repetir, ordem não importa)?`, Cb(n + k - 1, k - 1), t`Combinação com repetição: $\binom{${n}+${k}-1}{${k}-1}=${Cb(n + k - 1, k - 1)}$.`);
            }),
            gen((rng) => {
              const N = 10 * randInt(rng, 10, 30);
              const a = randInt(rng, 2, 4);
              const b = pick(rng, [3, 5, 7].filter((x) => x !== a && x % a !== 0));
              const cnt = Math.floor(N / a) + Math.floor(N / b) - Math.floor(N / (a * b));
              return num(`Quantos inteiros de 1 a ${N} são divisíveis por ${a} ou por ${b}?`, cnt, `⌊${N}/${a}⌋ + ⌊${N}/${b}⌋ − ⌊${N}/${a * b}⌋ = ${Math.floor(N / a)} + ${Math.floor(N / b)} − ${Math.floor(N / (a * b))} = ${cnt}.`);
            }),
            gen((rng) => {
              const A = randInt(rng, 20, 40), B = randInt(rng, 15, 35), AB = randInt(rng, 5, 12);
              return num(`Numa turma, ${A} alunos fazem Cálculo, ${B} fazem Física e ${AB} fazem as duas. Quantos fazem pelo menos uma?`, A + B - AB, `${A} + ${B} − ${AB} = ${A + B - AB}.`);
            }),
            mcqS('Quantas pessoas precisa haver numa sala para garantir que duas façam aniversário no mesmo mês?', '13', ['12', '24', '7'], 'Casa dos pombos: 12 meses (casas), 13 pessoas (pombos).'),
            multi('Quais contagens são dadas por estrelas e barras?', ['soluções de a + b + c + d = 7 com inteiros ≥ 0', 'pedidos de 5 salgados escolhidos entre 3 tipos', 'filas de 5 pessoas', 'comissões de 3 pessoas escolhidas entre 10'], [0, 1], 'Filas são permutações; comissões são combinações simples (sem repetição).'),
            gen((rng) => {
              const n = randInt(rng, 5, 9);
              const tot = fact(n);
              const ans = tot - 2 * fact(n - 1) + fact(n - 2);
              return num(`Permutações de ${n} livros em que o livro 1 NÃO fica na 1ª posição e o livro 2 NÃO fica na 2ª:`, ans, `n! − 2·(n − 1)! + (n − 2)! = ${tot} − ${2 * fact(n - 1)} + ${fact(n - 2)} = ${ans} (inclusão-exclusão).`);
            }),
          ],
        },
      ],
    },
  ],
};

