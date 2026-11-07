import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, match, inter, plot } from '../../helpers';
import { Pt, Seg } from '../../../components/plot/Plot';
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

const big = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');

export const combinatoria: UnitDef = {
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
      parts: [
        {
          card: {
            title: 'Multiplique as escolhas',
            body: t`Se uma decisão tem $n_1$ opções e, para cada uma, a próxima tem $n_2$, o total é $n_1\cdot n_2$. Veja a árvore crescer:`,
            visual: treeLab(),
            example: t`Placas com 3 letras (26) e 4 algarismos (10): $26^3\cdot10^4=175\,760\,000$.`,
          },
          exercises: [
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              const b = randInt(rng, 2, 6);
              return num(t`Você tem $${a}$ camisas e $${b}$ calças. Quantas combinações de camisa e calça pode montar?`, a * b, t`Para cada camisa, $${b}$ calças: $${a}\cdot${b}=${a * b}$.`);
            }),
            tf(t`Com 3 camisas e 2 calças dá para montar 5 combinações diferentes.`, false, t`Multiplica, não soma: $3\cdot2=6$.`),
            inter(t`Ajuste a árvore para ter exatamente $12$ caminhos.`, 'plot', treeLab().props, (v: any) => v && v.p.a * v.p.b === 12, t`por exemplo $3\times4$ ou $4\times3$`, t`Pelo princípio multiplicativo, os caminhos são (ramos do 1º nível) $\times$ (ramos do 2º nível): basta que o produto dê $12$.`),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              const b = randInt(rng, 2, 6);
              const c = randInt(rng, 2, 4);
              return num(t`Um restaurante tem $${a}$ entradas, $${b}$ pratos e $${c}$ sobremesas. Quantos menus completos são possíveis?`, a * b * c, t`$${a}\cdot${b}\cdot${c}=${a * b * c}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const b = randInt(rng, 2, 5);
              return num(t`De A até B há $${a}$ estradas e de B até C há $${b}$. De quantas formas dá para ir de A até C passando por B?`, a * b, t`$${a}\cdot${b}=${a * b}$ caminhos.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 3, 8);
              return num(t`Uma moeda é lançada $${n}$ vezes. Quantas sequências de resultados são possíveis?`, 2 ** n, t`Cada lançamento tem 2 resultados: $2^{${n}}=${2 ** n}$.`);
            }),
            num(t`Lança-se um dado e uma moeda. Quantos resultados possíveis há?`, 12, t`$6\cdot2=12$.`),
            gen((rng) => {
              const a = randInt(rng, 3, 7);
              return num(t`Há $${a}$ estradas entre duas cidades. De quantas formas dá para ir e **voltar por uma estrada diferente** da ida?`, a * (a - 1), t`Ida: $${a}$ opções; volta: $${a - 1}$. Total $${a}\cdot${a - 1}=${a * (a - 1)}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Com e sem repetição',
            body: t`• **Pode repetir**: cada posição tem todas as $n$ opções: $n\cdot n\cdots n=n^k$
• **Não pode repetir**: as opções diminuem a cada passo: $n\cdot(n-1)\cdot(n-2)\cdots$`,
            example: t`Senha de 3 letras (26): com repetição $26^3=17\,576$; sem repetição $26\cdot25\cdot24=15\,600$.`,
          },
          exercises: [
            num(t`Quantas senhas de 4 dígitos (0 a 9) existem, podendo repetir?`, 10000, t`$10^4=10\,000$.`),
            num(t`Quantas senhas de 4 dígitos **distintos** existem?`, 5040, t`$10\cdot9\cdot8\cdot7=5040$.`),
            gen((rng) => {
              const n = pick(rng, [5, 6, 8]);
              const k = randInt(rng, 2, 4);
              return num(t`Um cadeado tem $${k}$ rodinhas, cada uma com $${n}$ símbolos. Quantas combinações existem?`, n ** k, t`Pode repetir: $${n}^{${k}}=${n ** k}$.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 5, 9);
              const k = randInt(rng, 2, 3);
              let p = 1;
              for (let i = 0; i < k; i++) p *= n - i;
              return num(t`Com $${n}$ símbolos, quantos códigos de $${k}$ símbolos **sem repetir** dá para formar?`, p, t`$${Array.from({ length: k }, (_, i) => n - i).join('\\cdot')}=${p}$.`);
            }),
            num(t`Quantos números de 3 algarismos podem ser formados com $\{1, 2, 3, 4, 5\}$ sem repetir?`, 60, t`$5\cdot4\cdot3=60$.`),
            gen((rng) => {
              const n = randInt(rng, 4, 10);
              return num(t`Quantas sequências de $${n}$ bits (cada um $0$ ou $1$) existem?`, 2 ** n, t`$2^{${n}}=${2 ** n}$.`);
            }),
            tf(t`Para códigos de 2 ou mais posições, permitir repetição sempre gera mais possibilidades.`, true, t`$n^k>n(n-1)\cdots$ quando $k\ge2$, porque os fatores não diminuem.`),
            num(t`Quantas placas existem com 3 letras **distintas** (26 letras) seguidas de 4 algarismos quaisquer?`, 156000000, t`$26\cdot25\cdot24\cdot10^4=${big(156000000)}$.`),
          ],
        },
        {
          card: {
            title: 'Restrições primeiro',
            body: t`Quando há condição (número par, não começar com zero, vogal no início…), preencha **primeiro** a posição restrita e só depois as livres.`,
            example: t`Números de 3 algarismos distintos (0–9): o 1º não pode ser $0$ (9 opções); depois sobram $9$ e $8$: $9\cdot9\cdot8=648$.`,
          },
          exercises: [
            tf(t`Ao contar números de 4 algarismos, o primeiro dígito tem $10$ opções.`, false, t`O primeiro não pode ser $0$ (senão seria um número de 3 algarismos): $9$ opções.`),
            num(t`Quantos números de 3 algarismos existem (podendo repetir)?`, 900, t`$9\cdot10\cdot10=900$ (de $100$ a $999$).`),
            num(t`Quantos números de 3 algarismos **distintos** existem?`, 648, t`$9\cdot9\cdot8=648$.`),
            gen((rng) => {
              const n = randInt(rng, 4, 7);
              return num(t`De quantas formas $${n}$ pessoas podem formar uma fila se a Ana precisa ser a **primeira**?`, fact(n - 1), t`Ana fixa no 1º lugar; os outros $${n - 1}$ se permutam: $${n - 1}!=${fact(n - 1)}$.`);
            }),
            num(t`Com os algarismos $1, 3, 4, 6, 7, 8, 9$, quantos números **pares** de 3 algarismos distintos dá para formar?`, 90, t`Último: $4$, $6$ ou $8$ (3 opções). Depois $6$ e $5$: $3\cdot6\cdot5=90$.`),
            gen((rng) => {
              const n = randInt(rng, 4, 6);
              return num(t`De quantas formas $${n}$ pessoas sentam em fila se duas delas (A e B) precisam ficar **juntas**?`, 2 * fact(n - 1), t`Trate A e B como um bloco: $(${n - 1})!$ arrumações, vezes $2$ (AB ou BA): $${2 * fact(n - 1)}$.`);
            }),
            num(t`Quantos números **pares** de 4 algarismos distintos podem ser formados com $1, 2, 3, 4, 5$?`, 48, t`Último: $2$ ou $4$. Depois $4\cdot3\cdot2$: $2\cdot24=48$.`),
            num(t`Quantos números **pares** de 3 algarismos distintos existem (algarismos de 0 a 9)?`, 328, t`Terminando em $0$: $9\cdot8=72$. Terminando em $2,4,6,8$: $4\cdot8\cdot8=256$ (o 1º não pode ser $0$ nem o último). Total $328$.`),
          ],
        },
      ],
    },
    {
      id: 'f-comb-perm',
      title: 'Permutações e arranjos',
      parts: [
        {
          card: {
            title: 'Fatorial e permutação',
            body: t`$n!=n\cdot(n-1)\cdots2\cdot1$ (e $0!=1$).

**Permutação**: ordenar $n$ objetos distintos: $P_n=n!$`,
            example: t`Arrumar 5 livros na estante: $5!=120$ ordens.`,
          },
          exercises: [
            gen((rng) => {
              const n = randInt(rng, 3, 7);
              return num(t`Quanto vale $${n}!$?`, fact(n), t`$${Array.from({ length: n }, (_, i) => n - i).join('\\cdot')}=${fact(n)}$.`);
            }),
            tf(t`$0!=1$`, true, t`É uma convenção que faz as fórmulas funcionarem (há exatamente 1 jeito de ordenar nada).`),
            num(t`Quantos anagramas tem a palavra AMOR?`, 24, t`4 letras distintas: $4!=24$.`),
            gen((rng) => {
              const n = randInt(rng, 4, 8);
              return num(t`De quantas formas $${n}$ pessoas podem formar uma fila?`, fact(n), t`$${n}!=${fact(n)}$.`);
            }),
            mcqS(t`Simplifique $\dfrac{10!}{8!}$.`, '$90$', ['$2$', '$\\frac{5}{4}$', '$80$'], t`$\frac{10\cdot9\cdot8!}{8!}=90$.`),
            gen((rng) => {
              const n = randInt(rng, 5, 12);
              return num(t`Simplifique $\dfrac{${n}!}{${n - 2}!}$.`, n * (n - 1), t`$\frac{${n}\cdot${n - 1}\cdot${n - 2}!}{${n - 2}!}=${n * (n - 1)}$.`);
            }),
            gen((rng) => {
              const [w, n] = pick(rng, [['LIVRO', 5], ['PRATO', 5], ['CAMPO', 5], ['FILME', 5], ['BRASIL', 6]] as const);
              return num(t`Quantos anagramas de ${w} começam com ${w[0]}?`, fact(n - 1), t`${w[0]} fica fixa; as outras $${n - 1}$ letras (todas diferentes) se permutam: $${n - 1}!=${fact(n - 1)}$.`);
            }),
            num(t`Para qual $n$ temos $\dfrac{n!}{(n-2)!}=30$?`, 6, t`$n(n-1)=30\Rightarrow n=6$.`),
          ],
        },
        {
          card: {
            title: 'Permutação com repetição',
            body: t`Se há elementos repetidos, trocar dois iguais de lugar não cria nada novo. Divida pelos fatoriais das repetições:

$$\frac{n!}{a!\,b!\cdots}$$`,
            example: t`Anagramas de ARARA (3 A e 2 R): $\frac{5!}{3!\,2!}=10$.`,
          },
          exercises: [
            tf(t`A palavra AAB tem exatamente 3 anagramas.`, true, t`AAB, ABA, BAA: $\frac{3!}{2!}=3$.`),
            num(t`Quantos anagramas tem a palavra BANANA?`, 60, t`$\frac{6!}{3!\,2!}=\frac{720}{12}=60$ (3 A e 2 N).`),
            gen((rng) => {
              const [w, v, why] = pick(rng, [
                ['CASA', 12, '\\frac{4!}{2!}'],
                ['PAPAI', 30, '\\frac{5!}{2!\\,2!}'],
                ['BOLO', 12, '\\frac{4!}{2!}'],
                ['ARARA', 10, '\\frac{5!}{3!\\,2!}'],
                ['ABACATE', 840, '\\frac{7!}{3!}'],
                ['ANAGRAMA', 3360, '\\frac{8!}{4!}'],
              ] as const);
              return num(t`Quantos anagramas tem a palavra ${w}?`, v, t`$${why}=${v}$.`);
            }),
            mcqS(t`Quantos anagramas tem a palavra OSSO?`, '$6$', ['$24$', '$12$', '$4$'], t`$\frac{4!}{2!\,2!}=6$.`),
            gen((rng) => {
              const m = randInt(rng, 2, 5);
              const n = randInt(rng, 2, 4);
              return num(t`Numa grade, você anda só para a **direita** ou para **cima**. Quantos caminhos levam de $(0,\,0)$ até $(${m},\,${n})$?`, comb(m + n, m), t`São $${m}$ passos D e $${n}$ passos C em alguma ordem: $\frac{${m + n}!}{${m}!\,${n}!}=${comb(m + n, m)}$.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 4, 7);
              const k = randInt(rng, 1, n - 1);
              return num(t`Em $${n}$ lançamentos de moeda, quantas sequências têm **exatamente** $${k}$ caras?`, comb(n, k), t`Anagramas de $${k}$ C e $${n - k}$ K: $\frac{${n}!}{${k}!\,${n - k}!}=${comb(n, k)}$.`);
            }),
            num(t`Quantos números diferentes se formam permutando os algarismos de $112233$?`, 90, t`$\frac{6!}{2!\,2!\,2!}=90$.`),
            num(t`Quantos anagramas de BANANA começam com B?`, 10, t`Sobram ANANA (3 A, 2 N): $\frac{5!}{3!\,2!}=10$.`),
          ],
        },
        {
          card: {
            title: 'Arranjo: a ordem importa',
            body: t`Escolher e **ordenar** $k$ de $n$:
$$A_{n,k}=\frac{n!}{(n-k)!}=n\cdot(n-1)\cdots(n-k+1)$$`,
            example: t`Pódio (ouro, prata, bronze) com 8 atletas: $A_{8,3}=8\cdot7\cdot6=336$.`,
          },
          exercises: [
            tf(t`Em um arranjo, a ordem dos escolhidos importa.`, true, t`Ouro-prata-bronze é diferente de bronze-prata-ouro.`),
            num(t`De quantas formas um pódio (1º, 2º e 3º) pode ser formado com 10 atletas?`, 720, t`$A_{10,3}=10\cdot9\cdot8=720$.`),
            gen((rng) => {
              const n = randInt(rng, 5, 10);
              const k = randInt(rng, 2, 3);
              return num(t`De quantas formas podemos escolher presidente${k === 3 ? ', vice e secretário' : ' e vice'} entre $${n}$ pessoas?`, arr(n, k), t`A ordem importa: $A_{${n},${k}}=${arr(n, k)}$.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 6, 12);
              const k = randInt(rng, 2, 4);
              return num(t`Calcule $A_{${n},${k}}$.`, arr(n, k), t`$${Array.from({ length: k }, (_, i) => n - i).join('\\cdot')}=${arr(n, k)}$.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 4, 8);
              return num(t`Com $${n}$ cores, quantas bandeiras de 3 listras (de cima para baixo) com cores **diferentes** dá para fazer?`, arr(n, 3), t`$A_{${n},3}=${arr(n, 3)}$.`);
            }),
            mcq(t`Escolher os 3 primeiros colocados de um concurso é um problema de…`, ['arranjo', 'combinação', 'permutação com repetição', 'nenhum dos anteriores'], 0, t`A ordem (1º, 2º, 3º) muda o resultado.`),
            gen((rng) => {
              const k = randInt(rng, 2, 4);
              return num(t`Quantos números de $${k}$ algarismos **distintos** podem ser formados usando só os algarismos de $1$ a $9$?`, arr(9, k), t`$A_{9,${k}}=${arr(9, k)}$.`);
            }),
            num(t`Para qual $n$ temos $A_{n,2}=56$?`, 8, t`$n(n-1)=56\Rightarrow n=8$.`),
          ],
        },
      ],
    },
    {
      id: 'f-comb-comb',
      title: 'Combinações',
      parts: [
        {
          card: {
            title: 'A ordem não importa',
            body: t`Escolher $k$ de $n$ **sem ordem**:
$$C_{n,k}=\binom nk=\frac{n!}{k!\,(n-k)!}$$

Dividimos o arranjo por $k!$ porque cada grupo foi contado $k!$ vezes (em todas as ordens).`,
            example: t`Comissão de 3 entre 8 pessoas: $\binom83=\frac{8\cdot7\cdot6}{3!}=56$.`,
            tip: t`$\binom nk=\binom n{n-k}$: escolher quem entra é o mesmo que escolher quem fica de fora.`,
          },
          exercises: [
            gen((rng) => {
              const n = randInt(rng, 5, 12);
              const k = randInt(rng, 2, 4);
              return num(t`Quantas comissões de $${k}$ pessoas podem ser formadas com $${n}$ candidatos?`, comb(n, k), t`$\binom{${n}}{${k}}=${comb(n, k)}$.`);
            }),
            tf(t`$\binom{7}{2}=\binom{7}{5}$`, true, t`Ambos valem 21.`),
            num(t`Numa reunião, 10 pessoas se cumprimentam uma vez cada par. Quantos apertos de mão?`, 45, t`$\binom{10}{2}=45$.`),
            gen((rng) => {
              const n = randInt(rng, 6, 15);
              const k = pick(rng, [2, 3, n - 2]);
              return num(t`Calcule $\dbinom{${n}}{${k}}$.`, comb(n, k), t`$\frac{${n}!}{${k}!\,${n - k}!}=${comb(n, k)}$.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 5, 10);
              return num(t`Há $${n}$ pontos marcados em uma circunferência. Quantos triângulos com vértices nesses pontos existem?`, comb(n, 3), t`Três pontos quaisquer formam um triângulo, e a ordem não importa: $\binom{${n}}{3}=${comb(n, 3)}$.`);
            }),
            num(t`Na Mega-Sena escolhem-se 6 de 60 números. Quantas apostas simples existem? (dica: é bem grande)`, 50063860, t`$\binom{60}{6}=50\,063\,860$.`),
            gen((rng) => {
              const n = randInt(rng, 5, 12);
              return num(t`Quantas diagonais tem um polígono convexo de $${n}$ lados?`, comb(n, 2) - n, t`Pares de vértices: $\binom{${n}}{2}=${comb(n, 2)}$. Tirando os $${n}$ lados: $${comb(n, 2) - n}$.`);
            }),
            num(t`Para qual $n$ temos $\dbinom{n}{2}=28$?`, 8, t`$\frac{n(n-1)}{2}=28\Rightarrow n(n-1)=56\Rightarrow n=8$.`),
          ],
        },
        {
          card: {
            title: 'A ordem importa?',
            body: t`Teste rápido: **troque dois escolhidos de lugar**. O resultado mudou?

• Mudou ⟹ arranjo ou permutação (senha, pódio, fila, cargos diferentes)
• Não mudou ⟹ combinação (comissão, salada de frutas, mão de cartas)

E vale sempre $A_{n,k}=C_{n,k}\cdot k!$.`,
          },
          exercises: [
            mcq(t`Escolher 5 cartas de um baralho é um problema de…`, ['combinação', 'arranjo', 'permutação', 'PFC com repetição'], 0, t`A mão de cartas não depende da ordem em que você as recebe.`),
            match(t`Ligue cada situação ao método:`, [
              ['Ordenar 5 livros na estante', 'Permutação'],
              ['Pódio de uma corrida', 'Arranjo'],
              ['Time de 5 entre 12 jogadores', 'Combinação'],
              ['Senha com repetição', 'PFC'],
            ], t`Pergunte: a ordem importa? Uso todos os elementos? Pode repetir? Todos em ordem é permutação; parte em ordem é arranjo; parte sem ordem é combinação; com repetição, multiplique as opções (PFC).`),
            mcq(t`Escolher 2 representantes de turma, **com o mesmo cargo**, é um problema de…`, ['combinação', 'arranjo', 'permutação', 'nenhum'], 0, t`"Ana e Beto" é a mesma dupla que "Beto e Ana".`),
            mcq(t`Formar senhas de 4 letras **distintas** é um problema de…`, ['arranjo', 'combinação', 'permutação com repetição', 'nenhum'], 0, t`ABCD e DCBA são senhas diferentes: a ordem importa.`),
            gen((rng) => {
              const n = randInt(rng, 5, 10);
              const cargos = rng() < 0.5;
              return num(t`Com $${n}$ pessoas, quantas duplas ${cargos ? 'formadas por **um presidente e um vice**' : 'de trabalho (**sem cargos**)'} podem ser escolhidas?`, cargos ? arr(n, 2) : comb(n, 2), cargos ? t`Com cargos a ordem importa: $A_{${n},2}=${arr(n, 2)}$.` : t`Sem cargos a ordem não importa: $\binom{${n}}{2}=${comb(n, 2)}$.`);
            }),
            tf(t`$A_{n,k}=C_{n,k}\cdot k!$`, true, t`Cada grupo sem ordem pode ser ordenado de $k!$ maneiras.`),
            gen((rng) => {
              const n = randInt(rng, 5, 9);
              return num(t`Uma lanchonete tem $${n}$ frutas. Quantas saladas diferentes com exatamente 3 frutas dá para fazer?`, comb(n, 3), t`Salada não depende da ordem: $\binom{${n}}{3}=${comb(n, 3)}$.`);
            }),
            num(t`De um grupo de 10 pessoas, de quantas formas se escolhe **um presidente** e, entre os outros 9, **um conselho de 3** (sem cargos)?`, 840, t`Presidente: $10$. Conselho: $\binom93=84$. Total $10\cdot84=840$.`),
          ],
        },
        {
          card: {
            title: 'Combinações com condições',
            body: t`Quando a escolha tem partes ("2 engenheiros **e** 3 técnicos"), escolha cada parte separadamente e **multiplique**.

"Pelo menos um" costuma ser mais fácil pelo complementar: **total − nenhum**.`,
            example: t`4 engenheiros e 5 técnicos; equipe com 2 de cada: $\binom42\cdot\binom52=6\cdot10=60$.`,
          },
          exercises: [
            tf(t`Para escolher 2 pessoas do grupo A **e** 1 do grupo B, somamos $\binom{A}{2}+\binom{B}{1}$.`, false, t`"E" multiplica: $\binom A2\cdot\binom B1$.`),
            gen((rng) => {
              const g1 = randInt(rng, 4, 7);
              const g2 = randInt(rng, 4, 7);
              const a = randInt(rng, 1, 3);
              const b = randInt(rng, 1, 3);
              return num(t`Há $${g1}$ engenheiros e $${g2}$ técnicos. Quantas equipes com $${a}$ engenheiro(s) e $${b}$ técnico(s) são possíveis?`, comb(g1, a) * comb(g2, b), t`$\binom{${g1}}{${a}}\cdot\binom{${g2}}{${b}}=${comb(g1, a)}\cdot${comb(g2, b)}=${comb(g1, a) * comb(g2, b)}$.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 6, 10);
              const k = randInt(rng, 3, 4);
              return num(t`Quantas comissões de $${k}$ pessoas, escolhidas entre $${n}$, **incluem** obrigatoriamente a Bia?`, comb(n - 1, k - 1), t`Bia já está; escolha os outros $${k - 1}$ entre $${n - 1}$: $\binom{${n - 1}}{${k - 1}}=${comb(n - 1, k - 1)}$.`);
            }),
            gen((rng) => {
              const n = randInt(rng, 6, 10);
              const k = randInt(rng, 3, 4);
              return num(t`Quantas comissões de $${k}$ pessoas, escolhidas entre $${n}$, **não** incluem o Caio?`, comb(n - 1, k), t`Tire o Caio do grupo: $\binom{${n - 1}}{${k}}=${comb(n - 1, k)}$.`);
            }),
            gen((rng) => {
              const h = randInt(rng, 4, 7);
              const m = randInt(rng, 2, 5);
              const k = 3;
              return num(t`Num grupo de $${h}$ homens e $${m}$ mulheres, quantas comissões de $${k}$ pessoas têm **pelo menos uma mulher**?`, comb(h + m, k) - comb(h, k), t`Total $\binom{${h + m}}{${k}}=${comb(h + m, k)}$ menos as só de homens $\binom{${h}}{${k}}=${comb(h, k)}$: $${comb(h + m, k) - comb(h, k)}$.`);
            }),
            num(t`Uma pizzaria tem 8 sabores e 3 tamanhos. Quantas pizzas diferentes de **2 sabores distintos** existem?`, 84, t`$\binom82\cdot3=28\cdot3=84$.`),
            gen((rng) => {
              const a = randInt(rng, 3, 6);
              const b = randInt(rng, 3, 6);
              return num(t`Uma caixa tem $${a}$ peças boas e $${b}$ defeituosas. De quantas formas tiramos 3 peças com **exatamente 1** defeituosa?`, b * comb(a, 2), t`$\binom{${b}}{1}\cdot\binom{${a}}{2}=${b}\cdot${comb(a, 2)}=${b * comb(a, 2)}$.`);
            }),
            num(t`Com 5 homens e 4 mulheres, quantas comissões de 4 pessoas têm **pelo menos 2 mulheres**?`, 81, t`2M: $\binom42\binom52=60$; 3M: $\binom43\binom51=20$; 4M: $\binom44=1$. Total $81$.`),
          ],
        },
      ],
    },
    {
      id: 'f-comb-prob',
      title: 'Probabilidade',
      parts: [
        {
          card: {
            title: 'Favoráveis sobre possíveis',
            body: t`Com resultados igualmente prováveis:
$$P(A)=\frac{n(A)}{n(\Omega)}$$

$0\le P\le1$, e $P(\bar A)=1-P(A)$.

Lance o dado muitas vezes e veja a frequência se aproximar de $\frac16$ (lei dos grandes números):`,
            visual: { name: 'simulator', props: { kind: 'die' } },
          },
          exercises: [
            gen((rng) => {
              const r = randInt(rng, 2, 6);
              const b = randInt(rng, 2, 6);
              return num(t`Uma urna tem $${r}$ bolas vermelhas e $${b}$ azuis. Qual a probabilidade de tirar uma vermelha? (fração ou decimal)`, r / (r + b), t`$\frac{${r}}{${r + b}}$.`, { tol: 0.005 });
            }),
            mcq(t`Se a chance de chover amanhã é $30\%$, qual a chance de **não** chover?`, ['$70\\%$', '$30\\%$', '$50\\%$', '$130\\%$'], 0, t`Complementar: $1-0{,}3=0{,}7$.`),
            tf(t`Se uma moeda deu cara 5 vezes seguidas, a próxima tem mais chance de dar coroa.`, false, t`Lançamentos são **independentes**: continua $\frac12$ (falácia do apostador).`),
            gen((rng) => {
              const k = randInt(rng, 1, 4);
              return num(t`Lançando um dado, qual a probabilidade de sair um número **maior que** $${k}$? (fração ou decimal)`, (6 - k) / 6, t`Favoráveis: $${6 - k}$ de $6$, ou seja, $\frac{${6 - k}}{6}$.`, { tol: 0.005 });
            }),
            mcqS(t`Retirando uma carta de um baralho de 52, qual a chance de ser ás?`, t`$\frac{1}{13}$`, [t`$\frac{1}{52}$`, t`$\frac{4}{13}$`, t`$\frac{1}{4}$`], t`$\frac{4}{52}=\frac{1}{13}$.`),
            inter(t`Lance o dado pelo menos 100 vezes e observe a frequência de cada face.`, 'simulator', { kind: 'die' }, (v: number) => v >= 100, 'lance mais vezes', t`Com muitos lançamentos, todas as barras se aproximam de $\frac16\approx16{,}7\%$.`),
            mcqS(t`Retirando uma carta de um baralho de 52, qual a chance de ser uma **figura** (valete, dama ou rei)?`, t`$\frac{3}{13}$`, [t`$\frac{1}{13}$`, t`$\frac{3}{52}$`, t`$\frac{1}{4}$`], t`$12$ figuras em $52$: $\frac{12}{52}=\frac{3}{13}$.`),
            gen((rng) => {
              const [r, b, g] = [randInt(rng, 2, 6), randInt(rng, 2, 6), randInt(rng, 2, 6)];
              return num(t`Uma urna tem $${r}$ bolas vermelhas, $${b}$ azuis e $${g}$ verdes. Qual a probabilidade de a bola tirada **não** ser azul?`, (r + g) / (r + b + g), t`$1-\frac{${b}}{${r + b + g}}=\frac{${r + g}}{${r + b + g}}$.`, { tol: 0.005 });
            }),
          ],
        },
        {
          card: {
            title: 'Soma de dois dados',
            body: t`Com dois dados há $6\cdot6=36$ resultados igualmente prováveis. A soma 7 é a mais provável ($\frac{6}{36}$); as somas 2 e 12 são as mais raras ($\frac{1}{36}$):`,
            visual: { name: 'simulator', props: { kind: 'twoDice' } },
          },
          exercises: [
            mcq(t`Quantos resultados possíveis há ao lançar dois dados?`, ['$36$', '$12$', '$11$', '$6$'], 0, t`$6\cdot6=36$ pares ordenados.`),
            num(t`Qual a probabilidade de a soma de dois dados ser 7?`, 1 / 6, t`$(1, 6),\ (2, 5),\ (3, 4),\ (4, 3),\ (5, 2),\ (6, 1)$: $\frac{6}{36}=\frac16$.`, { tol: 0.005 }),
            tf(t`As somas 2 e 12 têm a mesma probabilidade.`, true, t`Cada uma sai de um único par: $(1, 1)$ e $(6, 6)$.`),
            gen((rng) => {
              const s = randInt(rng, 2, 12);
              const c = 6 - Math.abs(s - 7);
              return num(t`Qual a probabilidade de a soma de dois dados ser $${s}$? (fração ou decimal)`, c / 36, t`Há $${c}$ ${c === 1 ? 'par' : 'pares'} com soma $${s}$: $\frac{${c}}{36}$.`, { tol: 0.005 });
            }),
            mcqS(t`Qual a probabilidade de os dois dados mostrarem o **mesmo número**?`, t`$\frac16$`, [t`$\frac{1}{36}$`, t`$\frac{1}{12}$`, t`$\frac13$`], t`$6$ duplas iguais em $36$: $\frac16$.`),
            inter(t`Lance os dois dados pelo menos 100 vezes e veja qual soma aparece mais.`, 'simulator', { kind: 'twoDice' }, (v: number) => v >= 100, 'lance mais vezes', t`A soma 7 tende a liderar, perto de $16{,}7\%$.`),
            gen((rng) => {
              const s = randInt(rng, 9, 11);
              let c = 0;
              for (let t2 = s; t2 <= 12; t2++) c += 6 - Math.abs(t2 - 7);
              return num(t`Qual a probabilidade de a soma de dois dados ser **pelo menos** $${s}$? (fração ou decimal)`, c / 36, t`Somando os casos de $${s}$ até $12$: $${c}$ pares, $\frac{${c}}{36}$.`, { tol: 0.005 });
            }),
            num(t`Qual a probabilidade de o **produto** de dois dados ser par? (fração ou decimal)`, 0.75, t`Só é ímpar se os dois forem ímpares: $\frac36\cdot\frac36=\frac14$. Logo par: $1-\frac14=\frac34$.`, { tol: 0.005 }),
          ],
        },
        {
          card: {
            title: 'Independência e complementar',
            body: t`Eventos **independentes** (um não influencia o outro):
$$P(A\ \text{e}\ B)=P(A)\cdot P(B)$$

Para "pelo menos um", use o complementar:
$$P(\text{pelo menos um})=1-P(\text{nenhum})$$`,
            example: t`Pelo menos uma cara em 3 moedas: $1-\left(\frac12\right)^3=\frac78$.`,
            tip: t`Tirar **sem reposição** muda as chances do segundo sorteio: aí os eventos **não** são independentes.`,
          },
          exercises: [
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              return num(t`Qual a probabilidade de sair cara em **todos** os $${k}$ lançamentos de uma moeda? (fração ou decimal)`, 1 / 2 ** k, t`Independentes: $\left(\frac12\right)^{${k}}=\frac{1}{${2 ** k}}$.`, { tol: 0.002 });
            }),
            num(t`Qual a probabilidade de sair pelo menos uma cara em 3 lançamentos de moeda?`, 7 / 8, t`Complementar: $1-P(\text{nenhuma})=1-\left(\frac12\right)^3=\frac78$.`, { tol: 0.005 }),
            tf(t`Tirar duas cartas de um baralho **sem reposição** são eventos independentes.`, false, t`A primeira carta muda o que sobra para a segunda.`),
            gen((rng) => {
              const p1 = pick(rng, [50, 60, 80, 90]);
              const p2 = pick(rng, [50, 70, 80, 90]);
              return num(t`Duas máquinas independentes funcionam com probabilidade $${p1}\%$ e $${p2}\%$. Qual a probabilidade de **as duas** funcionarem? (em %)`, (p1 * p2) / 100, t`$${fmt(p1 / 100)}\cdot${fmt(p2 / 100)}=${fmt((p1 * p2) / 10000)}$, ou seja, $${fmt((p1 * p2) / 100)}\%$.`, { unit: '%', tol: 0.05 });
            }),
            gen((rng) => {
              const n = randInt(rng, 2, 4);
              return num(t`Lançando um dado $${n}$ vezes, qual a probabilidade de sair **pelo menos um** 6? (decimal com 3 casas)`, 1 - (5 / 6) ** n, t`$1-\left(\frac56\right)^{${n}}\approx${fmt(1 - (5 / 6) ** n, 3)}$.`, { tol: 0.005 });
            }),
            gen((rng) => {
              const r = pick(rng, [80, 90, 95]);
              const serie = rng() < 0.5;
              const v = serie ? (r * r) / 100 : 100 - ((100 - r) * (100 - r)) / 100;
              return num(t`Dois componentes independentes, cada um com confiabilidade $${r}\%$, estão ligados em **${serie ? 'série' : 'paralelo'}**. Qual a confiabilidade do sistema? (em %)`, v, serie ? t`Em série os dois precisam funcionar: $${fmt(r / 100)}^2=${fmt(v / 100, 4)}$, ou $${fmt(v)}\%$.` : t`Em paralelo basta um: $1-${fmt(1 - r / 100)}^2=${fmt(v / 100, 4)}$, ou $${fmt(v)}\%$.`, { unit: '%', tol: 0.05 });
            }),
            gen((rng) => {
              const r = randInt(rng, 3, 6);
              const b = randInt(rng, 2, 5);
              const n = r + b;
              return num(t`Uma urna tem $${r}$ bolas vermelhas e $${b}$ azuis. Tirando 2 **sem reposição**, qual a probabilidade de as duas serem vermelhas? (decimal com 3 casas)`, (r / n) * ((r - 1) / (n - 1)), t`$\frac{${r}}{${n}}\cdot\frac{${r - 1}}{${n - 1}}\approx${fmt((r / n) * ((r - 1) / (n - 1)), 3)}$.`, { tol: 0.005 });
            }),
            num(t`Uma prova tem questões de 4 alternativas. Chutando 3 questões, qual a probabilidade de acertar **pelo menos uma**? (decimal com 3 casas)`, 1 - (3 / 4) ** 3, t`Errar uma: $\frac34$. Errar as três: $\left(\frac34\right)^3=\frac{27}{64}$. Pelo menos uma certa: $1-\frac{27}{64}=\frac{37}{64}\approx0{,}578$.`, { tol: 0.005 }),
          ],
        },
      ],
    },
  ],
};
