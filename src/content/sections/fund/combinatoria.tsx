import React from 'react';
import type { Unit } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near } from '../../helpers';
import { Label, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt } from '../../../lib/random';

const t = String.raw;
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
const comb = (n: number, k: number) => fact(n) / (fact(k) * fact(n - k));
const arr = (n: number, k: number) => fact(n) / fact(n - k);

const treeLab = () =>
  plot(
    {
      view: { xMin: 0, xMax: 10, yMin: 0, yMax: 10 },
      grid: false,
      tickLabels: false,
      axes: false,
      params: [
        { key: 'a', label: 'n_1', min: 1, max: 4, step: 1, value: 3, color: C.p3, format: (v: number) => String(v) },
        { key: 'b', label: 'n_2', min: 1, max: 4, step: 1, value: 2, color: C.p2, format: (v: number) => String(v) },
      ],
      render: ({ p }: any) => {
        const els: React.ReactNode[] = [];
        const r = { x: 1, y: 5 };
        els.push(<Pt key="r" x={r.x} y={r.y} color={C.text} r={5} />);
        for (let i = 0; i < p.a; i++) {
          const y1 = 10 * (i + 0.5) / p.a;
          els.push(<Seg key={'a' + i} x1={r.x} y1={r.y} x2={4.5} y2={y1} color={C.p3} width={2.5} />);
          els.push(<Pt key={'pa' + i} x={4.5} y={y1} color={C.p3} r={5} />);
          for (let j = 0; j < p.b; j++) {
            const y2 = y1 + (10 / p.a) * ((j + 0.5) / p.b - 0.5) * 0.9;
            els.push(<Seg key={`b${i}${j}`} x1={4.5} y1={y1} x2={8.5} y2={y2} color={C.p2} width={1.8} />);
            els.push(<Pt key={`pb${i}${j}`} x={8.5} y={y2} color={C.p2} r={4} />);
          }
        }
        return <>{els}</>;
      },
      info: ({ p }: any) => t`Total de caminhos: $${p.a}\times${p.b}=${p.a * p.b}$`,
    },
    260,
  );

export const combinatoria: Unit = {
  id: 'f-comb',
  title: 'Combinatória',
  subtitle: 'Contagem, permutações, combinações e probabilidade',
  icon: '🎲',
  source: 'Competências Básicas · Combinatória',
  guide: t`A pergunta-chave: **a ordem importa?** Se sim, arranjo/permutação. Se não, combinação. Probabilidade clássica = casos favoráveis ÷ casos possíveis.`,
  lessons: [
    {
      id: 'f-comb-pfc',
      title: 'Princípio fundamental da contagem',
      cards: [
        {
          title: 'Multiplique as escolhas',
          body: t`Se uma decisão tem $n_1$ opções e, para cada uma, a próxima tem $n_2$, o total é $n_1\cdot n_2$. Veja a árvore crescer:`,
          visual: treeLab(),
          example: t`Placas com 3 letras (26) e 4 algarismos (10): $26^3\cdot10^4=175\,760\,000$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = randInt(rng, 2, 6);
          const b = randInt(rng, 2, 6);
          const c = randInt(rng, 2, 4);
          return num(t`Um restaurante tem $${a}$ entradas, $${b}$ pratos e $${c}$ sobremesas. Quantos menus completos são possíveis?`, a * b * c, t`$${a}\cdot${b}\cdot${c}=${a * b * c}$.`);
        }),
        num(t`Quantas senhas de 4 dígitos (0 a 9) existem, podendo repetir?`, 10000, t`$10^4=10\,000$.`),
        num(t`Quantas senhas de 4 dígitos **distintos** existem?`, 5040, t`$10\cdot9\cdot8\cdot7=5040$.`),
        inter(t`Ajuste a árvore para ter exatamente $12$ caminhos.`, 'plot', treeLab().props, (v: any) => v && v.p.a * v.p.b === 12, t`por exemplo $3\times4$ ou $4\times3$`),
        num(t`Quantos números de 3 algarismos podem ser formados com $\{1,2,3,4,5\}$ sem repetir?`, 60, t`$5\cdot4\cdot3=60$.`),
      ],
    },
    {
      id: 'f-comb-perm',
      title: 'Permutações e arranjos',
      cards: [
        {
          title: 'Fatorial e permutação',
          body: t`$n!=n\cdot(n-1)\cdots2\cdot1$ (e $0!=1$).

**Permutação**: ordenar $n$ objetos distintos: $P_n=n!$

**Com repetição**: $\frac{n!}{a!\,b!\cdots}$ — ex.: anagramas de ARARA $=\frac{5!}{3!\,2!}=10$.`,
        },
        {
          title: 'Arranjo: a ordem importa',
          body: t`Escolher e **ordenar** $k$ de $n$:
$$A_{n,k}=\frac{n!}{(n-k)!}$$`,
          example: t`Pódio (ouro, prata, bronze) com 8 atletas: $A_{8,3}=8\cdot7\cdot6=336$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const n = randInt(rng, 3, 7);
          return num(t`Quanto vale $${n}!$?`, fact(n), t`$${Array.from({ length: n }, (_, i) => n - i).join('\\cdot')}=${fact(n)}$.`);
        }),
        gen((rng) => {
          const n = randInt(rng, 5, 10);
          const k = randInt(rng, 2, 3);
          return num(t`De quantas formas podemos escolher presidente${k === 3 ? ', vice e secretário' : ' e vice'} entre $${n}$ pessoas?`, arr(n, k), t`A ordem importa: $A_{${n},${k}}=${arr(n, k)}$.`);
        }),
        num(t`Quantos anagramas tem a palavra AMOR?`, 24, t`4 letras distintas: $4!=24$.`),
        num(t`Quantos anagramas tem a palavra BANANA?`, 60, t`$\frac{6!}{3!\,2!}=\frac{720}{12}=60$ (3 A e 2 N).`),
        mcqS(t`Simplifique $\dfrac{10!}{8!}$.`, '$90$', ['$2$', '$\\frac{5}{4}$', '$80$'], t`$\frac{10\cdot9\cdot8!}{8!}=90$.`),
      ],
    },
    {
      id: 'f-comb-comb',
      title: 'Combinações',
      cards: [
        {
          title: 'A ordem não importa',
          body: t`Escolher $k$ de $n$ **sem ordem**:
$$C_{n,k}=\binom nk=\frac{n!}{k!\,(n-k)!}$$

Dividimos o arranjo por $k!$ porque cada grupo foi contado $k!$ vezes (em todas as ordens).`,
          example: t`Comissão de 3 entre 8 pessoas: $\binom83=\frac{8\cdot7\cdot6}{3!}=56$.`,
          tip: t`$\binom nk=\binom n{n-k}$: escolher quem entra é o mesmo que escolher quem fica de fora.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const n = randInt(rng, 5, 12);
          const k = randInt(rng, 2, 4);
          return num(t`Quantas comissões de $${k}$ pessoas podem ser formadas com $${n}$ candidatos?`, comb(n, k), t`$\binom{${n}}{${k}}=${comb(n, k)}$.`);
        }),
        mcq(t`Escolher 5 cartas de um baralho é um problema de…`, ['combinação', 'arranjo', 'permutação', 'PFC com repetição'], 0, t`A mão de cartas não depende da ordem em que você as recebe.`),
        num(t`Numa reunião, 10 pessoas se cumprimentam uma vez cada par. Quantos apertos de mão?`, 45, t`$\binom{10}{2}=45$.`),
        num(t`Na Mega-Sena escolhem-se 6 de 60 números. Quantas apostas simples existem? (dica: é bem grande)`, 50063860, t`$\binom{60}{6}=50\,063\,860$.`),
        tf(t`$\binom{7}{2}=\binom{7}{5}$`, true, t`Ambos valem 21.`),
        match(t`Ligue cada situação ao método:`, [
          ['Ordenar 5 livros na estante', 'Permutação'],
          ['Pódio de uma corrida', 'Arranjo'],
          ['Time de 5 entre 12 jogadores', 'Combinação'],
          ['Senha com repetição', 'PFC'],
        ]),
      ],
    },
    {
      id: 'f-comb-prob',
      title: 'Probabilidade',
      cards: [
        {
          title: 'Favoráveis sobre possíveis',
          body: t`Com resultados igualmente prováveis:
$$P(A)=\frac{n(A)}{n(\Omega)}$$

$0\le P\le1$, e $P(\bar A)=1-P(A)$.

Lance o dado muitas vezes e veja a frequência se aproximar de $\frac16$ (lei dos grandes números):`,
          visual: { name: 'simulator', props: { kind: 'die' } },
        },
        {
          title: 'Soma de dois dados',
          body: t`Com dois dados há $36$ resultados. A soma 7 é a mais provável ($\frac{6}{36}$):`,
          visual: { name: 'simulator', props: { kind: 'twoDice' } },
        },
      ],
      exercises: [
        gen((rng) => {
          const r = randInt(rng, 2, 6);
          const b = randInt(rng, 2, 6);
          return num(t`Uma urna tem $${r}$ bolas vermelhas e $${b}$ azuis. Qual a probabilidade de tirar uma vermelha? (responda como fração ou decimal)`, r / (r + b), t`$\frac{${r}}{${r + b}}$.`, { tol: 0.005 });
        }),
        num(t`Qual a probabilidade de a soma de dois dados ser 7?`, 1 / 6, t`$(1, 6),(2, 5),(3, 4),(4, 3),(5, 2),(6, 1)$: $\frac{6}{36}=\frac16$.`, { tol: 0.005 }),
        num(t`Qual a probabilidade de sair pelo menos uma cara em 3 lançamentos de moeda?`, 7 / 8, t`Complementar: $1-P(\text{nenhuma})=1-\left(\frac12\right)^3=\frac78$.`, { tol: 0.005 }),
        mcqS(t`Retirando uma carta de um baralho de 52, qual a chance de ser ás?`, t`$\frac{1}{13}$`, [t`$\frac{1}{52}$`, t`$\frac{4}{13}$`, t`$\frac{1}{4}$`], t`$\frac{4}{52}=\frac{1}{13}$.`),
        tf(t`Se uma moeda deu cara 5 vezes seguidas, a próxima tem mais chance de dar coroa.`, false, t`Lançamentos são **independentes**: continua $\frac12$ (falácia do apostador).`),
        inter(t`Lance o dado pelo menos 100 vezes e observe a frequência de cada face.`, 'simulator', { kind: 'die' }, (v: number) => v >= 100, 'lance mais vezes', t`Com muitos lançamentos, todas as barras se aproximam de $\frac16\approx16{,}7\%$.`),
      ],
    },
  ],
};
