import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, inter, plot, rmcq, near, multi } from '../../helpers';
import { Arrow, CircleW, FnCurve, Label, Pt, RectW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, polyTex, term } from '../../../lib/random';

const t = String.raw;

const complexLab = (rotate = false) =>
  plot({
    view: { xMin: -5, xMax: 5, yMin: -4, yMax: 4 },
    equalAspect: true,
    points: [{ id: 'z', x: 3, y: 2, color: C.p2, label: 'z' }],
    snap: 0.5,
    render: ({ pts }: any) => {
      const z = pts.z;
      return (
        <>
          <Seg x1={0} y1={0} x2={z.x} y2={0} color={C.p3} width={3} />
          <Seg x1={z.x} y1={0} x2={z.x} y2={z.y} color={C.p5} width={3} />
          <Arrow x1={0} y1={0} x2={z.x} y2={z.y} color={C.p2} />
          {rotate ? <Arrow x1={0} y1={0} x2={-z.y} y2={z.x} color={C.gold} label="iz" /> : null}
          <CircleW cx={0} cy={0} r={Math.hypot(z.x, z.y)} color={C.textDim} width={1} dash="4 4" />
        </>
      );
    },
    info: ({ pts }: any) => {
      const z = pts.z;
      const s = (v: number) => (v < 0 ? '-' : '+');
      const base = t`$z=${fmt(z.x)} ${s(z.y)} ${fmt(Math.abs(z.y))}i$ · $|z|=${fmt(Math.hypot(z.x, z.y), 3)}$`;
      return rotate ? base + t` · $iz=${fmt(-z.y)} ${s(z.x)} ${fmt(Math.abs(z.x))}i$ (giro de $90^\circ$)` : base;
    },
  });

const squareIdentity = () =>
  plot(
    {
      view: { xMin: -0.3, xMax: 6.3, yMin: -0.3, yMax: 6.3 },
      equalAspect: true,
      grid: false,
      tickLabels: false,
      params: [
        { key: 'a', label: 'a', min: 0.5, max: 4.5, step: 0.1, value: 3.5, color: C.p3 },
        { key: 'b', label: 'b', min: 0.5, max: 2.5, step: 0.1, value: 1.8, color: C.p5 },
      ],
      render: ({ p }: any) => {
        return (
          <>
            <RectW x={0} y={0} w={p.a} h={p.a} color={C.p3} opacity={0.45} />
            <RectW x={p.a} y={0} w={p.b} h={p.a} color={C.p2} opacity={0.35} />
            <RectW x={0} y={p.a} w={p.a} h={p.b} color={C.p2} opacity={0.35} />
            <RectW x={p.a} y={p.a} w={p.b} h={p.b} color={C.p5} opacity={0.45} />
            <Label x={p.a / 2} y={p.a / 2} text="a²" anchor="middle" size={16} />
            <Label x={p.a + p.b / 2} y={p.a / 2} text="ab" anchor="middle" size={14} />
            <Label x={p.a / 2} y={p.a + p.b / 2} text="ab" anchor="middle" size={14} />
            <Label x={p.a + p.b / 2} y={p.a + p.b / 2} text="b²" anchor="middle" size={14} />
          </>
        );
      },
      info: ({ p }: any) => t`$(a+b)^2 = ${fmt((p.a + p.b) ** 2, 2)}$ e $a^2+2ab+b^2 = ${fmt(p.a ** 2, 2)}+${fmt(2 * p.a * p.b, 2)}+${fmt(p.b ** 2, 2)}$`,
    },
    280,
  );

/** Set in TeX with spaced commas (so they are not read as decimal commas). */
const setTex = (a: number[]) => (a.length ? `\\{${a.join(', ')}\\}` : '\\varnothing');
/** Interval in TeX; ends may be numbers or '\\infty' strings. */
const iv = (a: number | string, b: number | string, oa: boolean, ob: boolean) => `${oa ? '(' : '['}${a},\\,${b}${ob ? ')' : ']'}`;
/** Complex number a+bi in TeX, without 1i / 0+ / +-. */
const cx = (re: number, im: number) => {
  if (im === 0) return `${re}`;
  const ip = (Math.abs(im) === 1 ? '' : `${Math.abs(im)}`) + 'i';
  if (re === 0) return (im < 0 ? '-' : '') + ip;
  return `${re}${im < 0 ? '-' : '+'}${ip}`;
};
const vennIs = (v: any, want: string[]) => Array.isArray(v) && v.length === want.length && [...v].sort().join() === [...want].sort().join();

const SETS: [number[], number[]][] = [
  [[1, 2, 3, 5], [2, 5, 7]],
  [[0, 2, 4, 6], [1, 2, 3, 4]],
  [[3, 6, 9], [1, 3, 5, 7, 9]],
  [[2, 4, 8], [1, 2, 4, 6]],
  [[5, 6, 7, 8], [7, 8, 9]],
];
const I4: [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1]];

export const algebra1: UnitDef = {
  id: 'f-alg1',
  title: 'Álgebra I',
  subtitle: 'Conjuntos, intervalos, complexos e polinômios',
  icon: '🧮',
  source: 'Competências Básicas · Álgebra I',
  guide: t`Conjuntos e intervalos são a linguagem de domínios e soluções. Números complexos aparecem em circuitos e vibrações. Polinômios e produtos notáveis são a ferramenta nº 1 para simplificar expressões e limites.`,
  lessons: [
    {
      id: 'f-alg1-conj',
      title: 'Conjuntos',
      parts: [
        {
          card: {
            title: 'União, interseção e diferença',
            body: t`Um conjunto é uma coleção de elementos. Com dois conjuntos $A$ e $B$:

• **União** $A\cup B$: está em $A$ **ou** em $B$
• **Interseção** $A\cap B$: está em $A$ **e** em $B$
• **Diferença** $A - B$: está em $A$ mas **não** em $B$
• **Complementar** $\bar A$: tudo que **não** está em $A$

Toque nas regiões para explorar:`,
            visual: { name: 'venn', props: {} },
            example: t`$A=\{1, 2, 3\}$, $B=\{2, 3, 4\}$: $A\cup B=\{1, 2, 3, 4\}$, $A\cap B=\{2, 3\}$, $A-B=\{1\}$.`,
          },
          exercises: [
            match(t`Ligue cada símbolo ao seu significado:`, [
              [t`$\cup$`, 'união'],
              [t`$\cap$`, 'interseção'],
              [t`$\subset$`, 'está contido'],
              [t`$\in$`, 'pertence'],
            ], t`$\cup$ junta (união), $\cap$ fica com o comum (interseção); $\subset$ compara **conjuntos** ($A\subset B$) e $\in$ liga um **elemento** a um conjunto ($2\in A$).`),
            mcqS(t`Se $A=\{1, 2, 3\}$ e $B=\{2, 3, 4\}$, quanto vale $A\cup B$?`, t`$\{1, 2, 3, 4\}$`, [t`$\{2, 3\}$`, t`$\{1, 4\}$`, t`$\{1, 2, 3, 2, 3, 4\}$`], t`A união junta tudo, sem repetir: $\{1, 2, 3, 4\}$.`),
            inter(t`Pinte a região $A\cap B$ (somente ela).`, 'venn', {}, (v: string[]) => vennIs(v, ['AB']), 'só a parte comum aos dois círculos', t`$A\cap B$ tem só o que está em $A$ **e** em $B$: a lente do meio.`),
            gen((rng) => {
              const [A, B] = pick(rng, SETS);
              const I = A.filter((x) => B.includes(x));
              const U = [...new Set([...A, ...B])].sort((a, b) => a - b);
              return rmcq(rng, t`Se $A=${setTex(A)}$ e $B=${setTex(B)}$, quanto vale $A\cap B$?`, `$${setTex(I)}$`, [`$${setTex(U)}$`, `$${setTex(A.filter((x) => !B.includes(x)))}$`, `$${setTex(B.filter((x) => !A.includes(x)))}$`], t`Interseção: elementos que estão nos **dois** conjuntos, $${setTex(I)}$.`);
            }),
            mcqS(t`Se $A=\{1, 2, 3, 4\}$ e $B=\{3, 4, 5\}$, quanto vale $A-B$?`, t`$\{1, 2\}$`, [t`$\{5\}$`, t`$\{3, 4\}$`, t`$\{1, 2, 5\}$`], t`Elementos de $A$ que não estão em $B$: $1$ e $2$.`),
            inter(t`Pinte a região $A - B$.`, 'venn', {}, (v: string[]) => vennIs(v, ['A']), 'a parte de A fora de B', t`$A-B$ é o que está em $A$ mas **não** em $B$: a lua de $A$, sem a lente do meio.`),
            inter(t`Pinte toda a região $A\cup B$.`, 'venn', {}, (v: string[]) => vennIs(v, ['A', 'AB', 'B']), 'os dois círculos inteiros', t`$A\cup B$ é tudo que está em $A$ **ou** em $B$: as duas luas e a lente do meio.`),
            inter(t`Pinte o complementar de $A\cup B$.`, 'venn', {}, (v: string[]) => vennIs(v, ['U']), 'a região fora dos dois círculos', t`O complementar de $A\cup B$ é o que não está em nenhum dos dois: só a região de fora dos círculos.`),
            inter(t`Pinte $(A\cup B)-(A\cap B)$: o que está em **exatamente um** dos conjuntos.`, 'venn', {}, (v: string[]) => vennIs(v, ['A', 'B']), 'as duas "luas", sem o meio', t`Tira-se o meio (a interseção) da união. Esse conjunto se chama **diferença simétrica**.`),
          ],
        },
        {
          card: {
            title: 'Os conjuntos numéricos',
            body: t`Eles se encaixam como bonecas russas:

$$\mathbb N\subset\mathbb Z\subset\mathbb Q\subset\mathbb R\subset\mathbb C$$

• $\mathbb N$: naturais $0, 1, 2,\ldots$
• $\mathbb Z$: inteiros (com negativos)
• $\mathbb Q$: racionais, frações $\frac pq$ — incluem dízimas periódicas
• $\mathbb R$: reais, incluem irracionais como $\sqrt2$ e $\pi$
• $\mathbb C$: complexos (veremos já já!)`,
            tip: t`Dízima periódica é racional: $0{,}333\ldots=\frac13$ e $0{,}1212\ldots=\frac{12}{99}$. Irracional é a decimal infinita **sem** período, como $\pi=3{,}14159\ldots$`,
          },
          exercises: [
            tf(t`Todo número inteiro é racional.`, true, t`Qualquer inteiro $n$ pode ser escrito como $\frac n1$.`),
            mcq(t`Qual número é **irracional**?`, ['$\\sqrt{2}$', '$0{,}333\\ldots$', '$\\frac{22}{7}$', '$-5$'], 0, t`$\sqrt2$ não pode ser escrito como fração de inteiros. $0{,}333\ldots=\frac13$ é racional.`),
            gen((rng) => {
              const [x, k, why] = pick(rng, [
                ['-3', 1, 'é inteiro negativo, então não é natural'],
                ['\\frac{3}{4}', 2, 'é fração que não dá inteiro'],
                ['0{,}75', 2, 'é decimal finito, igual a $\\frac34$'],
                ['\\sqrt{5}', 3, 'é irracional'],
                ['\\sqrt{25}', 0, 'vale $5$'],
                ['\\pi', 3, 'é irracional'],
                ['-\\frac{8}{2}', 1, 'vale $-4$'],
              ] as const);
              return mcq(t`Qual é o **menor** conjunto numérico que contém $${x}$?`, ['$\\mathbb N$', '$\\mathbb Z$', '$\\mathbb Q$', '$\\mathbb R$'], k, t`$${x}$ ${why}.`);
            }),
            multi(t`Quais números são **racionais**?`, ['$0{,}25$', '$\\sqrt{9}$', '$\\pi$', '$\\frac{2}{3}$', '$\\sqrt{2}$'], [0, 1, 3], t`$0{,}25=\frac14$ e $\sqrt9=3$. Já $\pi$ e $\sqrt2$ são irracionais.`),
            tf(t`$\sqrt{16}$ é irracional.`, false, t`$\sqrt{16}=4$, um inteiro. Só raízes de números que **não** são quadrados perfeitos (como $\sqrt{15}$) são irracionais.`),
            tf(t`Existe número que é racional e irracional ao mesmo tempo.`, false, t`Irracional significa exatamente "não racional". Os dois grupos não se misturam e, juntos, formam $\mathbb R$.`),
            mcqS(t`Qual fração é igual à dízima $0{,}2727\ldots$?`, t`$\dfrac{3}{11}$`, [t`$\dfrac{27}{100}$`, t`$\dfrac{27}{10}$`, t`$\dfrac{2}{7}$`], t`Período de 2 algarismos: $\frac{27}{99}=\frac{3}{11}$.`),
            mcqS(t`Qual destes números é **irracional**?`, t`$\sqrt{8}$`, [t`$\dfrac{\sqrt{12}}{\sqrt{3}}$`, t`$\dfrac{\sqrt{18}}{\sqrt{2}}$`, t`$(\sqrt{2})^2$`], t`$\frac{\sqrt{12}}{\sqrt3}=\sqrt4=2$, $\frac{\sqrt{18}}{\sqrt2}=\sqrt9=3$ e $(\sqrt2)^2=2$. Sobra $\sqrt8=2\sqrt2$, irracional.`),
          ],
        },
        {
          card: {
            title: 'Contando elementos',
            body: t`Quantos elementos tem a união? Somar $n(A)+n(B)$ conta a interseção **duas vezes**, então tiramos uma:

$$n(A\cup B)=n(A)+n(B)-n(A\cap B)$$

Para resolver problemas, preencha o diagrama **de dentro para fora**: primeiro a interseção, depois "só $A$" $=n(A)-n(A\cap B)$ e "só $B$".`,
            example: t`$30$ pessoas usam o app X, $25$ usam o Y e $10$ usam os dois: só X $=20$, só Y $=15$, total $=20+10+15=45$.`,
            tip: t`Com três conjuntos: $n(A\cup B\cup C)=n(A)+n(B)+n(C)-n(A\cap B)-n(A\cap C)-n(B\cap C)+n(A\cap B\cap C)$.`,
          },
          exercises: [
            gen((rng) => {
              const a = randInt(rng, 10, 30);
              const b = randInt(rng, 10, 30);
              const i = randInt(rng, 2, Math.min(a, b) - 2);
              return num(t`Numa turma, $${a}$ alunos gostam de Cálculo, $${b}$ de Física e $${i}$ gostam dos dois. Quantos gostam de pelo menos uma das matérias?`, a + b - i, t`$n(A\cup B)=${a}+${b}-${i}=${a + b - i}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 15, 40);
              const i = randInt(rng, 3, 12);
              return num(t`$${a}$ engenheiros usam Python, e $${i}$ deles também usam MATLAB. Quantos usam **só** Python?`, a - i, t`Só Python $=n(P)-n(P\cap M)=${a}-${i}=${a - i}$.`);
            }),
            tf(t`Sempre vale $n(A\cup B)=n(A)+n(B)$.`, false, t`Só vale quando $A$ e $B$ não têm elementos em comum ($A\cap B=\varnothing$). Senão a interseção é contada duas vezes.`),
            gen((rng) => {
              const a = randInt(rng, 20, 40);
              const b = randInt(rng, 15, 35);
              const i = randInt(rng, 5, 14);
              const u = a + b - i;
              return num(t`$${a}$ pessoas leem o jornal A, $${b}$ leem o B e $${u}$ leem pelo menos um. Quantas leem os dois?`, i, t`$${u}=${a}+${b}-n(A\cap B)\Rightarrow n(A\cap B)=${a + b}-${u}=${i}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 20, 40);
              const b = randInt(rng, 15, 35);
              const i = randInt(rng, 5, 14);
              const N = a + b - i + randInt(rng, 5, 20);
              return num(t`Numa pesquisa com $${N}$ pessoas, $${a}$ assistem ao canal A, $${b}$ ao canal B e $${i}$ aos dois. Quantas não assistem a **nenhum** dos dois?`, N - (a + b - i), t`Pelo menos um: $${a}+${b}-${i}=${a + b - i}$. Nenhum: $${N}-${a + b - i}=${N - (a + b - i)}$.`);
            }),
            gen((rng) => {
              const [a, b, i] = pick(rng, [[60, 50, 30], [70, 45, 25], [55, 40, 15], [80, 30, 20]]);
              return num(t`Numa cidade, $${a}\%$ usam ônibus, $${b}\%$ usam metrô e $${i}\%$ usam os dois. Que porcentagem não usa nenhum dos dois?`, 100 - (a + b - i), t`Usam pelo menos um: $${a}+${b}-${i}=${a + b - i}\%$. Nenhum: $${100 - (a + b - i)}\%$.`, { unit: '%' });
            }),
            gen((rng) => {
              const N = pick(rng, [50, 60, 80, 100]);
              const x = randInt(rng, 10, 20);
              const y = randInt(rng, 8, 18);
              const z = randInt(rng, 5, 12);
              return num(t`Dos $${N}$ alunos de um curso, $${x}$ fazem **apenas** Cálculo, $${y}$ fazem **apenas** Física e $${z}$ não fazem nenhuma das duas. Quantos fazem as duas?`, N - x - y - z, t`Todo aluno está em exatamente uma região: $${N}-${x}-${y}-${z}=${N - x - y - z}$.`);
            }),
            num(t`Em $100$ alunos: $50$ fazem Cálculo, $40$ Física e $30$ Química; $20$ fazem Cálculo e Física, $15$ Cálculo e Química, $10$ Física e Química, e $5$ fazem as três. Quantos fazem pelo menos uma?`, 80, t`$50+40+30-20-15-10+5=80$ (fórmula de três conjuntos).`),
          ],
        },
      ],
    },
    {
      id: 'f-alg1-int',
      title: 'Intervalos reais',
      parts: [
        {
          card: {
            title: 'Pedaços da reta',
            body: t`Um intervalo é um "pedaço contínuo" da reta real.

• $[a,\,b]$: fechado, inclui $a$ e $b$ (bolinha **cheia**)
• $(a,\,b)$: aberto, exclui as pontas (bolinha **vazia**)
• $[a,\,b)$: inclui $a$, exclui $b$
• $[a,\,\infty)$: todos os $x\ge a$ — o infinito é **sempre aberto**`,
            visual: { name: 'numberline', props: { min: -5, max: 5, marker: false, intervals: [{ a: -1, b: 3, openB: true, color: C.success }] } },
            example: t`$\{x\in\mathbb R \mid -1\le x<3\}=[-1,\,3)$.`,
          },
          exercises: [
            mcq(t`Qual intervalo representa $\{x\in\mathbb R\mid 2< x\le 7\}$?`, ['$(2,\\,7]$', '$[2,\\,7)$', '$[2,\\,7]$', '$(2,\\,7)$'], 0, t`$2$ é excluído (parêntese) e $7$ é incluído (colchete).`),
            tf(t`O intervalo $[3,\infty]$ está escrito corretamente.`, false, t`O infinito não é um número: o lado do $\infty$ é sempre aberto, $[3,\,\infty)$.`),
            mcqS(t`A solução de $x\ge5$ em notação de intervalo é:`, t`$[5,\,\infty)$`, [t`$(5,\,\infty)$`, t`$(-\infty,\,5]$`, t`$[5,\,\infty]$`], t`Inclui o $5$ (colchete) e segue até o infinito (sempre aberto).`),
            gen((rng) => {
              const a = randInt(rng, -6, 2);
              const b = a + randInt(rng, 2, 7);
              const oa = rng() < 0.5;
              const ob = rng() < 0.5;
              return rmcq(rng, t`Escreva $\{x\in\mathbb R\mid ${a}${oa ? '<' : '\\le '}x${ob ? '<' : '\\le '}${b}\}$ como intervalo.`, `$${iv(a, b, oa, ob)}$`, [`$${iv(a, b, !oa, ob)}$`, `$${iv(a, b, oa, !ob)}$`, `$${iv(a, b, !oa, !ob)}$`], t`Sinal $<$ exclui a ponta (parêntese) e $\le$ inclui (colchete).`);
            }),
            gen((rng) => {
              const a = randInt(rng, -5, 1);
              const b = a + randInt(rng, 3, 6);
              const which = pick(rng, ['a', 'b', 'mid', 'out'] as const);
              const r = which === 'a' ? a : which === 'b' ? b : which === 'mid' ? a + 1 : b + 1;
              const why = { a: t`$${a}$ é a ponta **aberta** (parêntese), então fica de fora.`, b: t`$${b}$ é a ponta **fechada** (colchete), então pertence.`, mid: t`$${a}<${r}\le ${b}$, então pertence.`, out: t`$${r}>${b}$: está fora do intervalo.` }[which];
              return tf(t`O número $${r}$ pertence ao intervalo $(${a},\,${b}]$.`, which === 'b' || which === 'mid', why);
            }),
            gen((rng) => {
              const a = randInt(rng, -5, 0);
              const b = randInt(rng, 2, 8);
              return num(t`Quantos números **inteiros** existem em $[${a},\,${b})$?`, b - a, t`De $${a}$ até $${b - 1}$: $${b - 1}-(${a})+1=${b - a}$ inteiros.`);
            }),
            inter(t`Arraste o marcador até um número que pertença a $(-2,\,1]$ **e** seja inteiro negativo.`, 'numberline', { min: -5, max: 5, step: 1, value: 3, intervals: [{ a: -2, b: 1, openA: true, color: C.success }] }, (v: number) => v === -1, '$-1$', t`Os inteiros em $(-2,\,1]$ são $-1$, $0$ e $1$. O único negativo é $-1$ ($-2$ está excluído!).`),
            mcq(t`Quantos números **reais** existem no intervalo $(0,\,1)$?`, ['Infinitos', '$0$', '$1$', '$2$'], 0, t`Entre dois reais quaisquer sempre cabem infinitos outros: $0{,}5$, $0{,}51$, $0{,}501$… Só não há **inteiros** em $(0,\,1)$.`),
          ],
        },
        {
          card: {
            title: 'Operando com intervalos',
            body: t`Faça um desenho! Para $A=[0,\,4]$ e $B=(2,\,6)$:

• $A\cap B=(2,\,4]$ — onde as duas faixas se sobrepõem
• $A\cup B=[0,\,6)$ — tudo coberto por pelo menos uma`,
            visual: {
              name: 'numberline',
              props: {
                min: -1,
                max: 7,
                marker: false,
                intervals: [
                  { a: 0, b: 4, color: C.p2 },
                  { a: 2, b: 6, openA: true, openB: true, color: C.p3 },
                ],
              },
            },
            tip: t`Em cada ponta, pergunte: esse número está nos **dois** (interseção) ou em **algum** (união)? Isso decide colchete ou parêntese.`,
          },
          exercises: [
            mcqS(t`Quanto é $[0,\,4]\cap(2,\,6)$?`, t`$(2,\,4]$`, [t`$[0,\,6)$`, t`$[2,\,4]$`, t`$(2,\,4)$`], t`A sobreposição começa logo depois de $2$ (aberto) e termina em $4$ (fechado, pois $4$ está nos dois).`),
            mcqS(t`Quanto é $[0,\,4]\cup(2,\,6)$?`, t`$[0,\,6)$`, [t`$(2,\,4]$`, t`$[0,\,6]$`, t`$(0,\,6)$`], t`Vai do começo de $A$ ($0$, incluído) até o fim de $B$ ($6$, excluído).`),
            tf(t`$[1,\,3]\cap[5,\,7]=\varnothing$`, true, t`Os intervalos não se encostam: nenhum número está nos dois.`),
            gen((rng) => {
              const a = randInt(rng, -4, 1);
              const c = a + randInt(rng, 1, 3);
              const b = c + randInt(rng, 1, 3);
              const d = b + randInt(rng, 1, 3);
              return rmcq(rng, t`Quanto é $[${a},\,${b}]\cap(${c},\,${d})$?`, `$${iv(c, b, true, false)}$`, [`$${iv(a, d, false, true)}$`, `$${iv(c, b, false, false)}$`, `$${iv(c, b, true, true)}$`, `$${iv(a, c, false, false)}$`], t`A sobreposição vai de $${c}$ (aberto, pois $${c}$ não está no segundo) até $${b}$ (fechado, pois $${b}$ está nos dois).`);
            }),
            gen((rng) => {
              const a = randInt(rng, -4, 1);
              const c = a + randInt(rng, 1, 3);
              const b = c + randInt(rng, 1, 3);
              const d = b + randInt(rng, 1, 3);
              return rmcq(rng, t`Quanto é $[${a},\,${b}]\cup(${c},\,${d})$?`, `$${iv(a, d, false, true)}$`, [`$${iv(c, b, true, false)}$`, `$${iv(a, d, false, false)}$`, `$${iv(a, d, true, true)}$`], t`Do começo do primeiro ($${a}$, incluído) ao fim do segundo ($${d}$, excluído).`);
            }),
            mcqS(t`Quanto é $[0,\,5]-[2,\,3]$?`, t`$[0,\,2)\cup(3,\,5]$`, [t`$[0,\,2]\cup[3,\,5]$`, t`$(2,\,3)$`, t`$[0,\,5]$`], t`Tiramos o pedaço $[2,\,3]$ **com** as pontas, então $2$ e $3$ saem: parênteses neles.`),
            mcqS(t`Qual é o complementar de $[-1,\,4)$ em $\mathbb R$?`, t`$(-\infty,\,-1)\cup[4,\,\infty)$`, [t`$(-\infty,\,-1]\cup(4,\,\infty)$`, t`$(-1,\,4]$`, t`$(-\infty,\,-1)\cup(4,\,\infty)$`], t`$-1$ estava no intervalo, então sai do complementar (aberto). $4$ não estava, então entra (fechado).`),
            num(t`Quantos inteiros pertencem a $[-3,\,5)\cap(0,\,8]$?`, 4, t`A interseção é $(0,\,5)$, com os inteiros $1, 2, 3, 4$.`),
          ],
        },
        {
          card: {
            title: 'Inequações em intervalos',
            body: t`Resolver uma inequação é achar um **intervalo**. Funciona como equação, com uma regra extra: multiplicar ou dividir por **negativo inverte** o sinal.

$$-2x+1>7\ \Rightarrow\ -2x>6\ \Rightarrow\ x<-3$$

Solução: $(-\infty,\,-3)$.`,
            tip: t`Inequação dupla: em $-1\le 2x+3<9$, faça a mesma conta nas três partes: $-4\le 2x<6\Rightarrow -2\le x<3$, ou seja, $[-2,\,3)$.`,
          },
          exercises: [
            gen((rng) => {
              const a = randInt(rng, 2, 9);
              const x0 = randInt(rng, -5, 6);
              const b = x0 + a;
              return rmcq(rng, t`Resolva $x+${a}>${b}$.`, `$${iv(x0, '\\infty', true, true)}$`, [`$${iv(x0, '\\infty', false, true)}$`, `$${iv('-\\infty', x0, true, true)}$`, `$${iv(b + a, '\\infty', true, true)}$`], t`Subtraia $${a}$ dos dois lados: $x>${b}-${a}=${x0}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 6);
              const x0 = randInt(rng, -4, 6);
              const c = randInt(rng, -5, 5);
              const b = a * x0 + c;
              return rmcq(rng, t`Resolva $${a}x${term(c, '')}\le ${b}$.`, `$${iv('-\\infty', x0, true, false)}$`, [`$${iv(x0, '\\infty', false, true)}$`, `$${iv('-\\infty', x0, true, true)}$`, `$${iv('-\\infty', b, true, false)}$`], t`$${a}x\le ${b - c}\Rightarrow x\le ${x0}$ (dividir por positivo mantém o sinal).`);
            }),
            tf(t`Ao multiplicar os dois lados de uma inequação por $-1$, o sinal se mantém.`, false, t`Inverte! $3>2$, mas $-3<-2$.`),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const x0 = randNZ(rng, -4, 4);
              const c = randInt(rng, 1, 9);
              const b = -a * x0 + c;
              return rmcq(rng, t`Resolva $-${a}x+${c}>${b}$.`, `$${iv('-\\infty', x0, true, true)}$`, [`$${iv(x0, '\\infty', true, true)}$`, `$${iv('-\\infty', -x0, true, true)}$`, `$${iv('-\\infty', x0, true, false)}$`], t`$-${a}x>${b}-${c}=${b - c}$. Dividindo por $-${a}$ (negativo!) o sinal **inverte**: $x<${x0}$.`);
            }),
            gen((rng) => {
              const a = randInt(rng, 2, 5);
              const k = randInt(rng, -3, 6);
              const c = randNZ(rng, -6, 6);
              const b = a * k + c;
              return num(t`Qual é o **menor inteiro** que satisfaz $${a}x${term(c, '')}>${b}$?`, k + 1, t`$${a}x>${b - c}\Rightarrow x>${k}$. O menor inteiro maior que $${k}$ é $${k + 1}$.`);
            }),
            gen((rng) => {
              const a = pick(rng, [2, 3]);
              const c = randNZ(rng, -3, 5);
              const lo = randInt(rng, -4, 0);
              const hi = lo + randInt(rng, 2, 5);
              return rmcq(rng, t`Resolva $${a * lo + c}\le ${a}x${term(c, '')}<${a * hi + c}$.`, `$${iv(lo, hi, false, true)}$`, [`$${iv(lo, hi, true, false)}$`, `$${iv(a * lo + c, a * hi + c, false, true)}$`, `$${iv(lo, hi, false, false)}$`], t`Nas três partes: ${c > 0 ? 'subtraia' : 'some'} $${Math.abs(c)}$ e divida por $${a}$, chegando a $${lo}\le x<${hi}$.`);
            }),
            inter(t`Arraste o marcador até o **maior inteiro** que satisfaz $2x+1<9$.`, 'numberline', { min: -5, max: 8, step: 1, value: 0 }, (v: number) => v === 3, '$3$', t`$2x<8\Rightarrow x<4$. O maior inteiro menor que $4$ é $3$.`),
            mcqS(t`Qual é a solução de $x^2<9$?`, t`$(-3,\,3)$`, [t`$(-\infty,\,3)$`, t`$(-\infty,\,-3)\cup(3,\,\infty)$`, t`$[-3,\,3]$`], t`Os números cujo quadrado é menor que $9$ estão entre $-3$ e $3$, sem incluir as pontas ($(\pm3)^2=9$ não é menor que $9$).`),
          ],
        },
      ],
    },
    {
      id: 'f-alg1-comp',
      title: 'Números complexos',
      parts: [
        {
          card: {
            title: 'A unidade imaginária',
            body: t`Nenhum real ao quadrado dá negativo. Então definimos:

$$i^2=-1$$

Um **número complexo** é $z=a+bi$, com parte real $a=\operatorname{Re}(z)$ e parte imaginária $b=\operatorname{Im}(z)$.

Ele é um **ponto no plano** (plano de Argand-Gauss). Arraste $z$:`,
            visual: complexLab(),
            tip: t`O **módulo** $|z|=\sqrt{a^2+b^2}$ é a distância até a origem. O **conjugado** é $\bar z=a-bi$ (reflexo no eixo real).`,
          },
          exercises: [
            mcqS(t`Em $z=4-7i$, qual é a parte **imaginária**?`, '$-7$', ['$7$', '$-7i$', '$4$'], t`$\operatorname{Im}(z)$ é o número que multiplica $i$, com sinal e sem o $i$: $-7$.`),
            mcqS(t`O conjugado de $z=2-5i$ é:`, t`$2+5i$`, [t`$-2+5i$`, t`$-2-5i$`, t`$5-2i$`], t`Troca-se o sinal da parte imaginária.`),
            gen((rng) => {
              const k = randInt(rng, 2, 9);
              return rmcq(rng, t`Quanto vale $\sqrt{-${k * k}}$ nos complexos?`, `$${k}i$`, [`$-${k}$`, `$${k}$`, `$${k * k}i$`], t`$\sqrt{-${k * k}}=\sqrt{${k * k}}\cdot\sqrt{-1}=${k}i$. Confira: $(${k}i)^2=${k * k}i^2=-${k * k}$.`);
            }),
            gen((rng) => {
              const [a, b, m] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [1, 1, Math.SQRT2]] as const);
              return num(t`Qual é o módulo de $z=${a}+${b}i$?`, m, t`$|z|=\sqrt{${a}^2+${b}^2}=${fmt(m, 4)}$.`, { tol: 0.01 });
            }),
            inter(t`Arraste $z$ até o número $-2+3i$.`, 'plot', complexLab().props, (v: any) => v && near(v.pts.z.x, -2, 0.01) && near(v.pts.z.y, 3, 0.01), t`ponto $(-2,\,3)$`, t`No plano complexo, $a+bi$ é o ponto $(a,\,b)$: parte real $-2$ no eixo horizontal e parte imaginária $3$ no vertical.`),
            gen((rng) => {
              const k = randInt(rng, 2, 7);
              return rmcq(rng, t`Resolva $x^2+${k * k}=0$ nos complexos.`, `$x=\\pm ${k}i$`, [`$x=\\pm ${k}$`, `$x=${k}i$`, `$x=\\pm ${k * k}i$`], t`$x^2=-${k * k}\Rightarrow x=\pm\sqrt{-${k * k}}=\pm ${k}i$.`);
            }),
            tf(t`Todo número real também é um número complexo.`, true, t`Um real $a$ é o complexo $a+0i$: fica em cima do eixo real.`),
            gen((rng) => {
              const re = randNZ(rng, -5, 5);
              const im = randNZ(rng, -5, 5);
              const q = re > 0 ? (im > 0 ? 0 : 3) : im > 0 ? 1 : 2;
              return mcq(t`Em qual quadrante do plano fica $z=${cx(re, im)}$?`, ['1º quadrante', '2º quadrante', '3º quadrante', '4º quadrante'], q, t`Parte real ${re > 0 ? 'positiva (direita)' : 'negativa (esquerda)'} e imaginária ${im > 0 ? 'positiva (cima)' : 'negativa (baixo)'}.`);
            }),
            gen((rng) => {
              const a = randNZ(rng, -6, 6);
              const b = randNZ(rng, -6, 6);
              return num(t`Calcule $z\cdot\bar z$ para $z=${cx(a, b)}$.`, a * a + b * b, t`$(a+bi)(a-bi)=a^2+b^2=${a * a}+${b * b}=${a * a + b * b}$ — sempre um real, igual a $|z|^2$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Operações',
            body: t`Soma: coordenada a coordenada. Produto: distributiva, lembrando que $i^2=-1$:

$$(2+3i)(1-i)=2-2i+3i-3i^2=5+i$$

Divisão: multiplique em cima e embaixo pelo **conjugado** do denominador.`,
            example: t`$\dfrac{1}{1+i}=\dfrac{1-i}{(1+i)(1-i)}=\dfrac{1-i}{2}$`,
          },
          exercises: [
            gen((rng) => {
              const [a, b, c, d] = [randNZ(rng, -6, 6), randNZ(rng, -6, 6), randNZ(rng, -6, 6), randNZ(rng, -6, 6)];
              return rmcq(rng, t`Calcule $(${cx(a, b)})+(${cx(c, d)})$.`, `$${cx(a + c, b + d)}$`, [`$${cx(a + c, b - d)}$`, `$${cx(a - c, b + d)}$`, `$${cx(a + b, c + d)}$`, `$${cx(a * c, b * d)}$`], t`Real com real ($${a}+(${c})=${a + c}$) e imaginária com imaginária ($${b}+(${d})=${b + d}$).`);
            }),
            gen((rng) => {
              const [a, b, c, d] = [randNZ(rng, -6, 6), randNZ(rng, -6, 6), randNZ(rng, -6, 6), randNZ(rng, -6, 6)];
              return rmcq(rng, t`Calcule $(${cx(a, b)})-(${cx(c, d)})$.`, `$${cx(a - c, b - d)}$`, [`$${cx(a + c, b + d)}$`, `$${cx(a - c, b + d)}$`, `$${cx(a + c, b - d)}$`, `$${cx(c - a, d - b)}$`], t`O sinal de menos vale para as duas partes: $${a}-(${c})=${a - c}$ e $${b}-(${d})=${b - d}$.`);
            }),
            gen((rng) => {
              const k = pick(rng, [-4, -3, -2, 2, 3, 4, 5]);
              const a = randNZ(rng, -6, 6);
              const b = randNZ(rng, -6, 6);
              return rmcq(rng, t`Calcule $${k}\cdot(${cx(a, b)})$.`, `$${cx(k * a, k * b)}$`, [`$${cx(k * a, b)}$`, `$${cx(a, k * b)}$`, `$${cx(k + a, k + b)}$`, `$${cx(-k * a, k * b)}$`], t`O real multiplica as duas partes: $${cx(k * a, k * b)}$.`);
            }),
            gen((rng) => {
              const [a, b, c, d] = [randNZ(rng, -5, 5), randNZ(rng, -5, 5), randNZ(rng, -5, 5), randNZ(rng, -5, 5)];
              const re = a * c - b * d;
              const im = a * d + b * c;
              return rmcq(rng, t`Calcule $(${cx(a, b)})(${cx(c, d)})$.`, `$${cx(re, im)}$`, [`$${cx(a * c + b * d, im)}$`, `$${cx(a * c, b * d)}$`, `$${cx(re, a * d - b * c)}$`, `$${cx(re + 1, im)}$`], t`Distributiva com $i^2=-1$. Parte real: $${a}\cdot${c}-(${b})(${d})=${re}$. Parte imaginária: $${a}\cdot(${d})+(${b})\cdot${c}=${im}$.`);
            }),
            gen((rng) => {
              const a = randNZ(rng, -5, 5);
              const b = randNZ(rng, -5, 5);
              return rmcq(rng, t`Calcule $(${cx(a, b)})^2$.`, `$${cx(a * a - b * b, 2 * a * b)}$`, [`$${cx(a * a + b * b, 2 * a * b)}$`, `$${cx(a * a, b * b)}$`, `$${cx(a * a - b * b, a * b)}$`, `$${cx(a * a, -b * b)}$`], t`$(a+bi)^2=a^2+2abi+b^2i^2=(a^2-b^2)+2ab\,i=${cx(a * a - b * b, 2 * a * b)}$.`);
            }),
            mcqS(t`Calcule $\dfrac{2}{1-i}$.`, t`$1+i$`, [t`$1-i$`, t`$2+2i$`, t`$\frac{1}{2}+i$`], t`$\frac{2}{1-i}\cdot\frac{1+i}{1+i}=\frac{2(1+i)}{2}=1+i$.`),
            mcqS(t`Calcule $\dfrac{1+i}{1-i}$.`, t`$i$`, [t`$-i$`, t`$1$`, t`$1+i$`], t`$\frac{(1+i)(1+i)}{(1-i)(1+i)}=\frac{1+2i+i^2}{2}=\frac{2i}{2}=i$.`),
            gen((rng) => {
              const [p, q] = [randNZ(rng, -4, 4), randNZ(rng, -4, 4)];
              const [c, d] = pick(rng, [[1, 1], [1, -1], [2, 1], [1, 2], [2, -1], [1, -2]]);
              const nr = p * c - q * d;
              const ni = p * d + q * c;
              return rmcq(rng, t`Calcule $\dfrac{${cx(nr, ni)}}{${cx(c, d)}}$.`, `$${cx(p, q)}$`, [`$${cx(q, p)}$`, `$${cx(p, -q)}$`, `$${cx(-p, q)}$`, `$${cx(p + 1, q)}$`], t`Multiplique em cima e embaixo por $${cx(c, -d)}$; o denominador vira $${c * c + d * d}$ e sobra $${cx(p, q)}$. Confira: $(${cx(p, q)})(${cx(c, d)})=${cx(nr, ni)}$.`);
            }),
          ],
        },
        {
          card: {
            title: 'Multiplicar por i é girar',
            body: t`Multiplicar por $i$ **gira 90°** no sentido anti-horário! Por isso as potências de $i$ repetem a cada 4:

$$i^0=1,\ i^1=i,\ i^2=-1,\ i^3=-i,\ i^4=1$$`,
            visual: complexLab(true),
            tip: t`Para $i^n$, divida $n$ por 4 e use o resto: $i^{27}=i^{3}=-i$.`,
          },
          exercises: [
            tf(t`Multiplicar um complexo por $i$ gira seu ponto $90^\circ$ no sentido anti-horário.`, true, t`$i\cdot(a+bi)=-b+ai$: o ponto $(a,\,b)$ vai para $(-b,\,a)$, um giro de $90^\circ$.`),
            mcqS(t`Quanto vale $i^3$?`, '$-i$', ['$i$', '$-1$', '$1$'], t`$i^3=i^2\cdot i=-1\cdot i=-i$.`),
            gen((rng) => {
              const n = randInt(rng, 5, 99);
              const r = n % 4;
              const ans = ['$1$', '$i$', '$-1$', '$-i$'][r];
              return rmcq(rng, t`Quanto vale $i^{${n}}$?`, ans, ['$1$', '$i$', '$-1$', '$-i$'].filter((x) => x !== ans), t`$${n}=4\cdot${Math.floor(n / 4)}+${r}$, então $i^{${n}}=i^{${r}}$ = ${ans}.`);
            }),
            gen((rng) => {
              const a = randNZ(rng, -5, 5);
              const b = randNZ(rng, -5, 5);
              return rmcq(rng, t`Calcule $i\cdot(${cx(a, b)})$.`, `$${cx(-b, a)}$`, [`$${cx(b, a)}$`, `$${cx(-b, -a)}$`, `$${cx(a, -b)}$`, `$${cx(-a, b)}$`], t`$i\cdot ${a}+i\cdot(${b}i)=${a}i+(${b})i^2=${cx(-b, a)}$.`);
            }),
            mcq(t`Multiplicar um complexo por $-1$ gira seu ponto em quantos graus?`, ['$180^\\circ$', '$90^\\circ$', '$270^\\circ$', '$360^\\circ$'], 0, t`$-1=i^2$: são dois giros de $90^\circ$.`),
            gen((rng) => {
              const a = randInt(rng, 2, 40);
              let b = randInt(rng, 2, 40);
              if (b % 4 === a % 4) b++;
              const re = I4[a % 4][0] + I4[b % 4][0];
              const im = I4[a % 4][1] + I4[b % 4][1];
              const pool = ['0', '2', '-2', '2i', '-2i', '1+i', '1-i', '-1+i', '-1-i'].map((s) => `$${s}$`);
              const ans = `$${cx(re, im)}$`;
              return rmcq(rng, t`Calcule $i^{${a}}+i^{${b}}$.`, ans, pool.filter((s) => s !== ans), t`$i^{${a}}=i^{${a % 4}}$ e $i^{${b}}=i^{${b % 4}}$ (restos da divisão por 4). Somando: $${cx(re, im)}$.`);
            }),
            inter(t`Arraste $z$ até que $iz$ (seta dourada) seja $-1+2i$.`, 'plot', complexLab(true).props, (v: any) => v && near(v.pts.z.x, 2, 0.01) && near(v.pts.z.y, 1, 0.01), t`$z=2+i$`, t`$iz=-b+ai=-1+2i$ exige $b=1$ e $a=2$.`),
            num(t`Calcule $i+i^2+i^3+\cdots+i^{100}$.`, 0, t`A cada 4 termos seguidos, $i-1-i+1=0$. São $100$ termos = $25$ blocos de soma zero.`),
            num(t`Sabendo que $(1+i)^2=2i$, calcule $(1+i)^4$.`, -4, t`$(1+i)^4=\left((1+i)^2\right)^2=(2i)^2=4i^2=-4$.`),
          ],
        },
      ],
    },
    {
      id: 'f-alg1-poli',
      title: 'Polinômios e produtos notáveis',
      parts: [
        {
          card: {
            title: 'O quadrado da soma (com prova visual)',
            body: t`$$(a+b)^2=a^2+2ab+b^2$$

O quadrado grande de lado $a+b$ é formado por $a^2$, $b^2$ e **dois** retângulos $ab$. Mexa em $a$ e $b$:`,
            visual: squareIdentity(),
            tip: t`O erro clássico é escrever $(a+b)^2=a^2+b^2$. Falta o $2ab$!`,
          },
          exercises: [
            tf(t`$(a+b)^2=a^2+b^2$`, false, t`Falta o termo do meio: $(a+b)^2=a^2+2ab+b^2$. Teste com $a=b=1$: $4\neq2$.`),
            gen((rng) => {
              const k = randInt(rng, 2, 9);
              return rmcq(rng, t`Desenvolva $(x+${k})^2$.`, t`$x^2+${2 * k}x+${k * k}$`, [t`$x^2+${k * k}$`, t`$x^2+${k}x+${k * k}$`, t`$x^2+${2 * k}x+${2 * k}$`], t`$(x+${k})^2=x^2+2\cdot${k}\cdot x+${k}^2$.`);
            }),
            gen((rng) => {
              const p = randInt(rng, 2, 4);
              const k = randInt(rng, 1, 7);
              return rmcq(rng, t`Desenvolva $(${p}x+${k})^2$.`, t`$${p * p}x^2+${2 * p * k}x+${k * k}$`, [t`$${p * p}x^2+${k * k}$`, t`$${p}x^2+${2 * p * k}x+${k * k}$`, t`$${p * p}x^2+${p * k}x+${k * k}$`], t`$(${p}x)^2+2\cdot${p}x\cdot${k}+${k}^2=${p * p}x^2+${2 * p * k}x+${k * k}$.`);
            }),
            fill(t`Complete o produto notável:`, t`$(2x+3)^2 = 4x^2 +$ ___ $+$ ___`, ['$12x$', '$9$'], ['$6x$', '$3$', '$6$'], t`$2\cdot(2x)\cdot3=12x$ e $3^2=9$.`),
            inter(t`Ajuste $a$ e $b$ para que a área total $(a+b)^2$ seja exatamente $25$ com $b=2$.`, 'plot', squareIdentity().props, (v: any) => v && near(v.p.a + v.p.b, 5, 0.051) && near(v.p.b, 2, 0.051), t`$a=3$, $b=2$`, t`$(a+b)^2=25$ pede $a+b=5$; com $b=2$, $a=3$. Confira: $a^2+2ab+b^2=9+12+4=25$.`),
            gen((rng) => {
              const m = pick(rng, [2, 3, 4, 5, 6, 7, 10]);
              const n = 10 * m + 1;
              return num(t`Use $(a+b)^2$ para calcular $${n}^2$ de cabeça.`, n * n, t`$(${10 * m}+1)^2=${100 * m * m}+2\cdot${10 * m}+1=${n * n}$.`);
            }),
            gen((rng) => {
              const h = randInt(rng, 2, 8);
              return num(t`Qual valor de $c$ faz $x^2+${2 * h}x+c$ ser um quadrado perfeito?`, h * h, t`$x^2+${2 * h}x+${h * h}=(x+${h})^2$: o termo do meio é $2\cdot${h}\cdot x$, então $c=${h}^2=${h * h}$.`);
            }),
            mcqS(t`Simplifique $(a+b)^2-(a-b)^2$.`, t`$4ab$`, [t`$2b^2$`, t`$0$`, t`$2ab$`], t`$(a^2+2ab+b^2)-(a^2-2ab+b^2)=4ab$.`),
          ],
        },
        {
          card: {
            title: 'Os outros produtos notáveis',
            body: t`$$(a-b)^2=a^2-2ab+b^2$$
$$(a+b)(a-b)=a^2-b^2$$
$$(a+b)^3=a^3+3a^2b+3ab^2+b^3$$

A **diferença de quadrados** é a mais útil para **fatorar**: $x^2-9=(x+3)(x-3)$.`,
          },
          exercises: [
            tf(t`$(a-b)^2=a^2-b^2$`, false, t`$(a-b)^2=a^2-2ab+b^2$. Já $a^2-b^2=(a+b)(a-b)$.`),
            gen((rng) => {
              const k = randInt(rng, 2, 9);
              return rmcq(rng, t`Desenvolva $(x-${k})^2$.`, t`$x^2-${2 * k}x+${k * k}$`, [t`$x^2-${k * k}$`, t`$x^2+${2 * k}x+${k * k}$`, t`$x^2-${2 * k}x-${k * k}$`], t`$(x-${k})^2=x^2-2\cdot${k}\cdot x+${k}^2$: o último termo é sempre positivo.`);
            }),
            gen((rng) => {
              const k = randInt(rng, 2, 12);
              return rmcq(rng, t`Fatore $x^2-${k * k}$.`, t`$(x+${k})(x-${k})$`, [t`$(x-${k})^2$`, t`$(x+${k})^2$`, t`$(x-${k * k})(x+1)$`], t`Diferença de quadrados: $a^2-b^2=(a+b)(a-b)$ com $b=${k}$.`);
            }),
            gen((rng) => {
              const p = randInt(rng, 2, 5);
              const q = randInt(rng, 1, 7);
              return rmcq(rng, t`Calcule $(${p}x+${q})(${p}x-${q})$.`, t`$${p * p}x^2-${q * q}$`, [t`$${p * p}x^2+${q * q}$`, t`$${p}x^2-${q * q}$`, t`$${p * p}x^2-${2 * p * q}x-${q * q}$`], t`$(a+b)(a-b)=a^2-b^2$ com $a=${p}x$ e $b=${q}$.`);
            }),
            num(t`Use $(a+b)(a-b)$ para calcular $101\cdot99$ de cabeça.`, 9999, t`$(100+1)(100-1)=100^2-1=9999$.`),
            gen((rng) => {
              const d = randInt(rng, 2, 9);
              return num(t`Calcule $${50 + d}\cdot${50 - d}$ de cabeça.`, 2500 - d * d, t`$(50+${d})(50-${d})=50^2-${d}^2=2500-${d * d}=${2500 - d * d}$.`);
            }),
            mcqS(t`Desenvolva $(x+1)^3$.`, t`$x^3+3x^2+3x+1$`, [t`$x^3+1$`, t`$x^3+3x+1$`, t`$x^3+x^2+x+1$`], t`$(a+b)^3=a^3+3a^2b+3ab^2+b^3$ com $a=x$, $b=1$.`),
            gen((rng) => {
              const p = randInt(rng, 2, 5);
              let q = randInt(rng, 2, 5);
              if (q === p) q++;
              return rmcq(rng, t`Fatore $${p * p}x^2-${q * q}y^2$.`, t`$(${p}x+${q}y)(${p}x-${q}y)$`, [t`$(${p}x-${q}y)^2$`, t`$(${p * p}x+${q * q}y)(${p * p}x-${q * q}y)$`, t`$(${p}x+${q}y)^2$`], t`$${p * p}x^2=(${p}x)^2$ e $${q * q}y^2=(${q}y)^2$: diferença de quadrados.`);
            }),
            mcqS(t`Simplifique $\dfrac{x^2-9}{x-3}$ (para $x\neq3$).`, t`$x+3$`, [t`$x-3$`, t`$x^2-3$`, t`$3$`], t`$\frac{(x+3)(x-3)}{x-3}=x+3$. Esse truque aparece muito em **limites**!`),
          ],
        },
        {
          card: {
            title: 'Raízes e fatoração',
            body: t`Se $r$ é raiz do polinômio $p$ ($p(r)=0$), então $(x-r)$ é **fator** de $p$.

$$p(x)=x^2-5x+6=(x-2)(x-3)$$

As raízes são os pontos onde o gráfico **corta o eixo x**:`,
            visual: plot({
              view: { xMin: -1, xMax: 5, yMin: -2, yMax: 6 },
              render: () => (
                <>
                  <FnCurve f={(x) => x * x - 5 * x + 6} color={C.p4} />
                  <Pt x={2} y={0} color={C.gold} label="2" />
                  <Pt x={3} y={0} color={C.gold} label="3" />
                </>
              ),
            }),
            tip: t`Soma e produto (Girard) para $x^2+bx+c$: as raízes somam $-b$ e multiplicam $c$.`,
            example: t`**Teorema do resto**: o resto da divisão de $p(x)$ por $(x-a)$ é $p(a)$. Ex.: $x^2+1$ dividido por $x-2$ deixa resto $2^2+1=5$.`,
          },
          exercises: [
            gen((rng) => {
              const r1 = randInt(rng, -4, 4);
              let r2 = randInt(rng, -4, 4);
              if (r2 === r1) r2 = r1 + 2;
              const r = rng() < 0.5 ? r1 : r1 + 1;
              const val = (r - r1) * (r - r2);
              return tf(t`$x=${r}$ é raiz de $p(x)=${polyTex([r1 * r2, -(r1 + r2), 1])}$.`, val === 0, t`$p(${r})=${val}$${val === 0 ? ', então é raiz.' : ', diferente de zero: não é raiz.'}`);
            }),
            gen((rng) => {
              const r1 = randInt(rng, -5, 5);
              let r2 = randInt(rng, -5, 5);
              if (r2 === r1) r2 = r1 + 1;
              const b = -(r1 + r2);
              const c = r1 * r2;
              return rmcq(rng, t`Quais são as raízes de $${polyTex([c, b, 1])}$?`, t`$${Math.min(r1, r2)}$ e $${Math.max(r1, r2)}$`, [t`$${-Math.max(r1, r2)}$ e $${-Math.min(r1, r2)}$`, t`$${c}$ e $${b}$`, t`$${Math.min(r1, r2)}$ e $${Math.max(r1, r2) + 1}$`], t`Soma $=${-b}$ e produto $=${c}$: as raízes são $${r1}$ e $${r2}$.`);
            }),
            multi(t`Quais são fatores de $p(x)=x^3-x$?`, ['$x$', '$x-1$', '$x+1$', '$x-2$'], [0, 1, 2], t`$x^3-x=x(x^2-1)=x(x-1)(x+1)$.`),
            gen((rng) => {
              const r1 = randNZ(rng, -5, 5);
              let r2 = randNZ(rng, -5, 5);
              if (r2 === r1) r2 = -r1 === r1 ? r1 + 1 : -r1;
              const S = r1 + r2;
              const P = r1 * r2;
              return rmcq(rng, t`Qual polinômio do tipo $x^2+bx+c$ tem raízes $${r1}$ e $${r2}$?`, `$${polyTex([P, -S, 1])}$`, [`$${polyTex([P, S, 1])}$`, `$${polyTex([-P, -S, 1])}$`, `$${polyTex([S, -P, 1])}$`], t`$(x-(${r1}))(x-(${r2}))=x^2-(${S})x+(${P})$.`);
            }),
            gen((rng) => {
              const r1 = randInt(rng, -6, 6);
              const r2 = randInt(rng, -6, 6);
              const askSum = rng() < 0.5;
              return num(t`Qual é a ${askSum ? '**soma**' : '**multiplicação**'} das raízes de $${polyTex([r1 * r2, -(r1 + r2), 1])}$?`, askSum ? r1 + r2 : r1 * r2, askSum ? t`Pela relação de Girard, soma $=-b=${r1 + r2}$.` : t`Pela relação de Girard, produto $=c=${r1 * r2}$.`);
            }),
            gen((rng) => {
              const r1 = randNZ(rng, -6, 6);
              let r2 = randNZ(rng, -6, 6);
              // r2 = r1 repeats a factor; r2 = -r1 makes the "signs swapped" option the same product
              while (r2 === r1 || r2 === -r1) r2 = randNZ(rng, -6, 6);
              const f = (r: number) => (r < 0 ? `(x+${-r})` : `(x-${r})`);
              return rmcq(rng, t`Fatore $${polyTex([r1 * r2, -(r1 + r2), 1])}$.`, `$${f(r1)}${f(r2)}$`, [`$${f(-r1)}${f(-r2)}$`, `$${f(r1)}${f(-r2)}$`, `$${f(-r1)}${f(r2)}$`], t`Raízes $${r1}$ e $${r2}$ (soma $${r1 + r2}$, produto $${r1 * r2}$), então os fatores são $${f(r1)}$ e $${f(r2)}$.`);
            }),
            mcqS(t`Um polinômio de grau 2 com coeficiente líder 1 corta o eixo $x$ em $x=2$ e $x=3$. Qual é ele?`, t`$(x-2)(x-3)$`, [t`$(x+2)(x+3)$`, t`$(x-2)(x+3)$`, t`$x^2+6$`], t`Raiz $r$ dá o fator $(x-r)$.`),
            gen((rng) => {
              const a = randInt(rng, -4, 4);
              const b = randInt(rng, -6, 6);
              const r = randNZ(rng, -3, 3);
              const val = r ** 3 + a * r + b;
              return num(t`Qual é o resto da divisão de $p(x)=${polyTex([b, a, 0, 1])}$ por $${r < 0 ? `x+${-r}` : `x-${r}`}$?`, val, t`Teorema do resto: basta calcular $p(${r})=${r ** 3}${term(a * r, '')}${term(b, '')}=${val}$.`);
            }),
            num(t`$1$ é raiz de $x^3-6x^2+11x-6$. Quanto vale a **soma** das outras duas raízes?`, 5, t`Dividindo por $(x-1)$ sobra $x^2-5x+6=(x-2)(x-3)$: as outras raízes são $2$ e $3$, soma $5$.`),
          ],
        },
      ],
    },
  ],
};
