import React from 'react';
import type { Unit } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi } from '../../helpers';
import { Arrow, CircleW, FnCurve, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, polyTex } from '../../../lib/random';

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
        const { RectW, Label } = require('../../../components/plot/Plot');
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

export const algebra1: Unit = {
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
      cards: [
        {
          title: 'União, interseção e diferença',
          body: t`Um conjunto é uma coleção de elementos. Com dois conjuntos $A$ e $B$:

• **União** $A\cup B$: está em $A$ **ou** em $B$
• **Interseção** $A\cap B$: está em $A$ **e** em $B$
• **Diferença** $A - B$: está em $A$ mas **não** em $B$
• **Complementar** $\bar A$: tudo que **não** está em $A$

Toque nas regiões para explorar:`,
          visual: { name: 'venn', props: {} },
          example: t`$A=\{1,2,3\}$, $B=\{2,3,4\}$: $A\cup B=\{1,2,3,4\}$, $A\cap B=\{2,3\}$, $A-B=\{1\}$.`,
        },
        {
          title: 'Os conjuntos numéricos',
          body: t`Eles se encaixam como bonecas russas:

$$\mathbb N\subset\mathbb Z\subset\mathbb Q\subset\mathbb R\subset\mathbb C$$

• $\mathbb N$: naturais $0,1,2,\ldots$
• $\mathbb Z$: inteiros (com negativos)
• $\mathbb Q$: racionais, frações $\frac pq$ — incluem dízimas periódicas
• $\mathbb R$: reais, incluem irracionais como $\sqrt2$ e $\pi$
• $\mathbb C$: complexos (veremos já já!)`,
          tip: t`Número de elementos da união: $n(A\cup B)=n(A)+n(B)-n(A\cap B)$ — subtraímos para não contar a interseção duas vezes.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = randInt(rng, 10, 30);
          const b = randInt(rng, 10, 30);
          const i = randInt(rng, 2, Math.min(a, b) - 2);
          return num(t`Numa turma, $${a}$ alunos gostam de Cálculo, $${b}$ de Física e $${i}$ gostam dos dois. Quantos gostam de pelo menos uma das matérias?`, a + b - i, t`$n(A\cup B)=${a}+${b}-${i}=${a + b - i}$.`);
        }),
        inter(t`Pinte a região $A\cap B$ (somente ela).`, 'venn', {}, (v: string[]) => Array.isArray(v) && v.length === 1 && v[0] === 'AB', 'só a parte comum aos dois círculos'),
        inter(t`Pinte a região $A - B$.`, 'venn', {}, (v: string[]) => Array.isArray(v) && v.length === 1 && v[0] === 'A', 'a parte de A fora de B'),
        inter(t`Pinte o complementar de $A\cup B$.`, 'venn', {}, (v: string[]) => Array.isArray(v) && v.length === 1 && v[0] === 'U', 'a região fora dos dois círculos'),
        mcq(t`Qual número é **irracional**?`, ['$\\sqrt{2}$', '$0{,}333\\ldots$', '$\\frac{22}{7}$', '$-5$'], 0, t`$\sqrt2$ não pode ser escrito como fração de inteiros. $0{,}333\ldots=\frac13$ é racional.`),
        tf(t`Todo número inteiro é racional.`, true, t`Qualquer inteiro $n$ pode ser escrito como $\frac n1$.`),
        mcqS(t`Se $A=\{1,2,3,4\}$ e $B=\{3,4,5\}$, quanto vale $A-B$?`, t`$\{1,2\}$`, [t`$\{5\}$`, t`$\{3,4\}$`, t`$\{1,2,5\}$`], t`Elementos de $A$ que não estão em $B$: $1$ e $2$.`),
        match(t`Ligue cada símbolo ao seu significado:`, [
          [t`$\cup$`, 'união'],
          [t`$\cap$`, 'interseção'],
          [t`$\subset$`, 'está contido'],
          [t`$\in$`, 'pertence'],
        ]),
      ],
    },
    {
      id: 'f-alg1-int',
      title: 'Intervalos reais',
      cards: [
        {
          title: 'Pedaços da reta',
          body: t`Um intervalo é um "pedaço contínuo" da reta real.

• $[a,b]$: fechado, inclui $a$ e $b$ (bolinha **cheia**)
• $(a,b)$: aberto, exclui as pontas (bolinha **vazia**)
• $[a,b)$: inclui $a$, exclui $b$
• $[a,\infty)$: todos os $x\ge a$ — o infinito é **sempre aberto**`,
          visual: { name: 'numberline', props: { min: -5, max: 5, marker: false, intervals: [{ a: -1, b: 3, openB: true, color: C.success }] } },
          example: t`$\{x\in\mathbb R \mid -1\le x<3\}=[-1,\,3)$.`,
        },
        {
          title: 'Operando com intervalos',
          body: t`Faça um desenho! Para $A=[0, 4]$ e $B=(2, 6)$:

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
        },
      ],
      exercises: [
        mcq(t`Qual intervalo representa $\{x\in\mathbb R\mid 2< x\le 7\}$?`, ['$(2,\\,7]$', '$[2,\\,7)$', '$[2,\\,7]$', '$(2,\\,7)$'], 0, t`$2$ é excluído (parêntese) e $7$ é incluído (colchete).`),
        tf(t`O intervalo $[3,\infty]$ está escrito corretamente.`, false, t`O infinito não é um número: o lado do $\infty$ é sempre aberto, $[3,\infty)$.`),
        mcqS(t`Quanto é $[0, 4]\cap(2, 6)$?`, t`$(2,\,4]$`, [t`$[0,\,6)$`, t`$[2,\,4]$`, t`$(2,\,4)$`], t`A sobreposição começa logo depois de $2$ (aberto) e termina em $4$ (fechado, pois $4\in[0, 4]$ e $4\in(2, 6)$).`),
        inter(t`Arraste o marcador até um número que pertença a $(-2,\,1]$ **e** seja inteiro negativo.`, 'numberline', { min: -5, max: 5, step: 1, value: 3, intervals: [{ a: -2, b: 1, openA: true, color: C.success }] }, (v: number) => v === -1, '$-1$', t`Os inteiros em $(-2, 1]$ são $-1,0,1$. O único negativo é $-1$ ($-2$ está excluído!).`),
        gen((rng) => {
          const a = randInt(rng, -5, 0);
          const b = randInt(rng, 2, 8);
          return num(t`Quantos números **inteiros** existem em $[${a},\,${b})$?`, b - a, t`De $${a}$ até $${b - 1}$: $${b - 1}-(${a})+1=${b - a}$ inteiros.`);
        }),
        mcqS(t`A solução de $x\ge5$ em notação de intervalo é:`, t`$[5,\,\infty)$`, [t`$(5,\,\infty)$`, t`$(-\infty,\,5]$`, t`$[5,\,\infty]$`], t`Inclui o $5$ (colchete) e segue até o infinito (sempre aberto).`),
      ],
    },
    {
      id: 'f-alg1-comp',
      title: 'Números complexos',
      cards: [
        {
          title: 'A unidade imaginária',
          body: t`Nenhum real ao quadrado dá negativo. Então definimos:

$$i^2=-1$$

Um **número complexo** é $z=a+bi$, com parte real $a=\operatorname{Re}(z)$ e parte imaginária $b=\operatorname{Im}(z)$.

Ele é um **ponto no plano** (plano de Argand-Gauss). Arraste $z$:`,
          visual: complexLab(),
          tip: t`O **módulo** $|z|=\sqrt{a^2+b^2}$ é a distância até a origem. O **conjugado** é $\bar z=a-bi$ (reflexo no eixo real).`,
        },
        {
          title: 'Operações',
          body: t`Soma: coordenada a coordenada. Produto: distributiva, lembrando que $i^2=-1$:

$$(2+3i)(1-i)=2-2i+3i-3i^2=5+i$$

Divisão: multiplique em cima e embaixo pelo **conjugado** do denominador.`,
          example: t`$\dfrac{1}{1+i}=\dfrac{1-i}{(1+i)(1-i)}=\dfrac{1-i}{2}$`,
        },
        {
          title: 'Multiplicar por i é girar',
          body: t`Multiplicar por $i$ **gira 90°** no sentido anti-horário! Por isso as potências de $i$ repetem a cada 4:

$$i^0=1,\ i^1=i,\ i^2=-1,\ i^3=-i,\ i^4=1$$`,
          visual: complexLab(true),
          tip: t`Para $i^n$, divida $n$ por 4 e use o resto: $i^{27}=i^{3}=-i$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = randNZ(rng, -5, 5);
          const b = randNZ(rng, -5, 5);
          const c = randNZ(rng, -5, 5);
          const d = randNZ(rng, -5, 5);
          const re = a * c - b * d;
          const im = a * d + b * c;
          const z = (x: number, y: number) => t`${x}${y < 0 ? '-' : '+'}${Math.abs(y)}i`;
          return rmcq(rng, t`Calcule $(${z(a, b)})(${z(c, d)})$.`, `$${z(re, im)}$`, [`$${z(a * c + b * d, im)}$`, `$${z(a * c, b * d)}$`, `$${z(re, a * d - b * c)}$`], t`$(${z(a, b)})(${z(c, d)}) = ${a * c} ${a * d < 0 ? '-' : '+'} ${Math.abs(a * d)}i ${b * c < 0 ? '-' : '+'} ${Math.abs(b * c)}i ${-b * d < 0 ? '-' : '+'} ${Math.abs(b * d)} = ${z(re, im)}$ (lembre: $i^2=-1$).`);
        }),
        gen((rng) => {
          const [a, b, m] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [1, 1, Math.SQRT2]] as const);
          return num(t`Qual é o módulo de $z=${a}+${b}i$?`, m, t`$|z|=\sqrt{${a}^2+${b}^2}=${fmt(m, 4)}$.`, { tol: 0.01 });
        }),
        gen((rng) => {
          const n = randInt(rng, 5, 99);
          const r = n % 4;
          const ans = ['$1$', '$i$', '$-1$', '$-i$'][r];
          return rmcq(rng, t`Quanto vale $i^{${n}}$?`, ans, ['$1$', '$i$', '$-1$', '$-i$'].filter((x) => x !== ans), t`$${n}=4\cdot${Math.floor(n / 4)}+${r}$, então $i^{${n}}=i^{${r}}$ = ${ans}.`);
        }),
        mcqS(t`O conjugado de $z=2-5i$ é:`, t`$2+5i$`, [t`$-2+5i$`, t`$-2-5i$`, t`$5-2i$`], t`Troca-se o sinal da parte imaginária.`),
        tf(t`Multiplicar um complexo por $i$ gira seu ponto $90^\circ$ no sentido anti-horário.`, true),
        inter(t`Arraste $z$ até o número $-2+3i$.`, 'plot', complexLab().props, (v: any) => v && near(v.pts.z.x, -2, 0.01) && near(v.pts.z.y, 3, 0.01), t`ponto $(-2,\,3)$`),
        mcqS(t`Calcule $\dfrac{2}{1-i}$.`, t`$1+i$`, [t`$1-i$`, t`$2+2i$`, t`$\frac{1}{2}+i$`], t`$\frac{2}{1-i}\cdot\frac{1+i}{1+i}=\frac{2(1+i)}{2}=1+i$.`),
      ],
    },
    {
      id: 'f-alg1-poli',
      title: 'Polinômios e produtos notáveis',
      cards: [
        {
          title: 'O quadrado da soma (com prova visual)',
          body: t`$$(a+b)^2=a^2+2ab+b^2$$

O quadrado grande de lado $a+b$ é formado por $a^2$, $b^2$ e **dois** retângulos $ab$. Mexa em $a$ e $b$:`,
          visual: squareIdentity(),
          tip: t`O erro clássico é escrever $(a+b)^2=a^2+b^2$. Falta o $2ab$!`,
        },
        {
          title: 'Os outros produtos notáveis',
          body: t`$$(a-b)^2=a^2-2ab+b^2$$
$$(a+b)(a-b)=a^2-b^2$$
$$(a+b)^3=a^3+3a^2b+3ab^2+b^3$$

A **diferença de quadrados** é a mais útil para **fatorar**: $x^2-9=(x+3)(x-3)$.`,
        },
        {
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
        },
      ],
      exercises: [
        gen((rng) => {
          const k = randInt(rng, 2, 9);
          return rmcq(rng, t`Desenvolva $(x+${k})^2$.`, t`$x^2+${2 * k}x+${k * k}$`, [t`$x^2+${k * k}$`, t`$x^2+${k}x+${k * k}$`, t`$x^2+${2 * k}x+${2 * k}$`], t`$(x+${k})^2=x^2+2\cdot${k}\cdot x+${k}^2$.`);
        }),
        gen((rng) => {
          const k = randInt(rng, 2, 12);
          return rmcq(rng, t`Fatore $x^2-${k * k}$.`, t`$(x+${k})(x-${k})$`, [t`$(x-${k})^2$`, t`$(x+${k})^2$`, t`$(x-${k * k})(x+1)$`], t`Diferença de quadrados: $a^2-b^2=(a+b)(a-b)$ com $b=${k}$.`);
        }),
        gen((rng) => {
          const r1 = randInt(rng, -5, 5);
          let r2 = randInt(rng, -5, 5);
          if (r2 === r1) r2 = r1 + 1;
          const b = -(r1 + r2);
          const c = r1 * r2;
          return rmcq(rng, t`Quais são as raízes de $${polyTex([c, b, 1])}$?`, t`$${Math.min(r1, r2)}$ e $${Math.max(r1, r2)}$`, [t`$${-Math.min(r1, r2)}$ e $${-Math.max(r1, r2)}$`, t`$${c}$ e $${b}$`, t`$${Math.min(r1, r2)}$ e $${Math.max(r1, r2) + 1}$`], t`Soma $=${-b}$ e produto $=${c}$: as raízes são $${r1}$ e $${r2}$.`);
        }),
        tf(t`$(a-b)^2=a^2-b^2$`, false, t`$(a-b)^2=a^2-2ab+b^2$. Já $a^2-b^2=(a+b)(a-b)$.`),
        fill(t`Complete o produto notável:`, t`$(2x+3)^2 = 4x^2 +$ ___ $+$ ___`, ['$12x$', '$9$'], ['$6x$', '$3$', '$6$'], t`$2\cdot(2x)\cdot3=12x$ e $3^2=9$.`),
        num(t`Use $(a+b)(a-b)$ para calcular $101\cdot99$ de cabeça.`, 9999, t`$(100+1)(100-1)=100^2-1=9999$.`),
        inter(t`Ajuste $a$ e $b$ para que a área total $(a+b)^2$ seja exatamente $25$ com $b=2$.`, 'plot', squareIdentity().props, (v: any) => v && near(v.p.a + v.p.b, 5, 0.051) && near(v.p.b, 2, 0.051), t`$a=3$, $b=2$`),
        multi(t`Quais são fatores de $p(x)=x^3-x$?`, ['$x$', '$x-1$', '$x+1$', '$x-2$'], [0, 1, 2], t`$x^3-x=x(x^2-1)=x(x-1)(x+1)$.`),
      ],
    },
  ],
};
