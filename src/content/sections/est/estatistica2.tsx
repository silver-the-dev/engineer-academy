import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, order, inter, plot, near, table } from '../../helpers';
import { Label, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, randNZ, term } from '../../../lib/random';
import { binomialLab, normalLab, regressionLab } from '../../visuals';

const t = String.raw;

const treeLab = () =>
  plot(
    {
      view: { xMin: 0, xMax: 10, yMin: 0, yMax: 10 },
      grid: false,
      axes: false,
      tickLabels: false,
      params: [{ key: 'p', label: 'p', min: 0.01, max: 0.2, step: 0.01, value: 0.03, color: C.danger }],
      render: ({ p }: any) => {
        const q = 1 - p.p;
        return (
          <>
            <Seg x1={1} y1={5} x2={4.5} y2={8} color={C.success} width={3} />
            <Seg x1={1} y1={5} x2={4.5} y2={2} color={C.danger} width={3} />
            <Label x={2.4} y={7.2} text={fmt(q, 2)} color={C.success} anchor="middle" />
            <Label x={2.4} y={2.6} text={fmt(p.p, 2)} color={C.danger} anchor="middle" />
            {[8, 2].map((y0, i) => (
              <React.Fragment key={i}>
                <Seg x1={4.5} y1={y0} x2={8.5} y2={y0 + 1.5} color={C.success} width={2} />
                <Seg x1={4.5} y1={y0} x2={8.5} y2={y0 - 1.5} color={C.danger} width={2} />
                <Label x={8.7} y={y0 + 1.5} text={`${i === 0 ? 'B' : 'D'}B: ${fmt((i === 0 ? q : p.p) * q, 4)}`} color={C.text} size={11} dy={4} />
                <Label x={8.7} y={y0 - 1.5} text={`${i === 0 ? 'B' : 'D'}D: ${fmt((i === 0 ? q : p.p) * p.p, 4)}`} color={C.text} size={11} dy={4} />
              </React.Fragment>
            ))}
            <Pt x={1} y={5} color={C.text} r={4} />
          </>
        );
      },
      info: ({ p }: any) => t`Duas peças independentes, defeito com prob. $${fmt(p.p, 2)}$: $P(\text{ambas boas})=${fmt((1 - p.p) ** 2, 4)}$`,
    },
    260,
  );

const corrLab = () =>
  plot({
    view: { xMin: 0, xMax: 10, yMin: 0, yMax: 10 },
    equalAspect: true,
    snap: 0.25,
    points: [
      [1, 2], [2, 3.5], [3, 3], [4, 5], [5, 4.6], [6, 6.5], [7, 6.8], [8, 8.4],
    ].map(([x, y], i) => ({ id: 'p' + i, x, y, color: C.gold, r: 7 })),
    render: ({ pts }: any) => {
      const a = Object.values(pts) as { x: number; y: number }[];
      const n = a.length;
      const mx = a.reduce((s, q) => s + q.x, 0) / n;
      const my = a.reduce((s, q) => s + q.y, 0) / n;
      const sxy = a.reduce((s, q) => s + (q.x - mx) * (q.y - my), 0);
      const sxx = a.reduce((s, q) => s + (q.x - mx) ** 2, 0);
      const b = sxy / (sxx || 1);
      return <Seg x1={0} y1={my - b * mx} x2={10} y2={my + b * (10 - mx)} color={C.p2} width={2.5} />;
    },
    info: ({ pts }: any) => {
      const a = Object.values(pts) as { x: number; y: number }[];
      const n = a.length;
      const mx = a.reduce((s, q) => s + q.x, 0) / n;
      const my = a.reduce((s, q) => s + q.y, 0) / n;
      const sxy = a.reduce((s, q) => s + (q.x - mx) * (q.y - my), 0);
      const sxx = a.reduce((s, q) => s + (q.x - mx) ** 2, 0);
      const syy = a.reduce((s, q) => s + (q.y - my) ** 2, 0);
      const r = sxy / Math.sqrt(sxx * syy || 1);
      return t`Correlação de Pearson $r=${fmt(r, 3)}$ · reta $y=${fmt(sxy / (sxx || 1), 2)}x+${fmt(my - (sxy / (sxx || 1)) * mx, 2)}$`;
    },
  });

const vennIs = (v: any, want: string[]) => Array.isArray(v) && v.length === want.length && [...v].sort().join() === [...want].sort().join();

export const probabilidade: UnitDef = {
  id: 'e-prob',
  title: 'Probabilidade',
  subtitle: 'Eventos, regras, condicional, independência e Bayes',
  icon: '🎲',
  source: 'Probabilidade e Estatística · Unidade V — Introdução à teoria das probabilidades',
  guide: t`$P(A)\in[0, 1]$. União: some e desconte a interseção. Condicional: o universo encolhe para $B$. Independentes: $P(A\cap B)=P(A)P(B)$. Bayes "inverte" a condicional.`,
  lessons: [
    {
      id: 'e-prob-ev',
      title: 'Espaço amostral e eventos',
      parts: [
        {
          card: {
            title: 'Ω e eventos',
            body: t`• **Experimento aleatório**: não dá para prever o resultado (lançar um dado)
• **Espaço amostral** $\Omega$: todos os resultados possíveis
• **Evento**: subconjunto de $\Omega$ (ex.: "sair par" $=\{2,\ 4,\ 6\}$)`,
          },
          exercises: [
            num(t`Quantos elementos tem o espaço amostral do lançamento de 2 dados?`, 36, t`$6\cdot6=36$ pares ordenados.`),
            num(t`Ao lançar 3 moedas, quantos resultados possíveis há?`, 8, t`$2^3=8$.`),
            mcq(t`Lançando um dado, o evento "sair par" é…`, ['$\\{2,\\ 4,\\ 6\\}$', '$\\{1,\\ 3,\\ 5\\}$', '$\\{2,\\ 4\\}$', '$\\{6\\}$'], 0, t`Os resultados pares do dado.`),
            gen((rng) => {
              const k = randInt(rng, 2, 5);
              return num(t`Lançando um dado, quantos elementos tem o evento "sair um número maior que $${k}$"?`, 6 - k, t`$\{${Array.from({ length: 6 - k }, (_, i) => k + 1 + i).join(',\\ ')}\}$.`);
            }),
            tf(t`O espaço amostral do lançamento de uma moeda é $\{\text{cara},\ \text{coroa}\}$.`, true, t`São os dois resultados possíveis.`),
            mcq(t`Escolher uma carta de um baralho comum: quantos elementos tem $\Omega$?`, ['52', '13', '4', '26'], 0, t`Uma possibilidade por carta.`),
            num(t`Lançando 2 dados, quantos resultados têm soma $7$?`, 6, t`$(1,6),\ (2,5),\ (3,4),\ (4,3),\ (5,2),\ (6,1)$.`),
          ],
        },
        {
          card: {
            title: 'Operações com eventos',
            body: t`• União $A\cup B$ (**ou**), interseção $A\cap B$ (**e**), complementar $\bar A$ (**não**)
• **Mutuamente exclusivos**: $A\cap B=\varnothing$ — não podem ocorrer juntos

Toque nas regiões do diagrama:`,
            visual: { name: 'venn', props: {} },
          },
          exercises: [
            tf(t`Eventos mutuamente exclusivos não podem ocorrer ao mesmo tempo.`, true, t`Sua interseção é vazia.`),
            inter(t`Pinte o evento "**exatamente um** de $A$ ou $B$ ocorre".`, 'venn', {}, (v: string[]) => vennIs(v, ['A', 'B']), t`$A$ sem $B$ e $B$ sem $A$`, t`Exatamente um é $(A\cup B)$ sem a interseção: $A\setminus B$ junto com $B\setminus A$ (diferença simétrica).`),
            inter(t`Pinte o evento "$A$ **e** $B$ ocorrem".`, 'venn', {}, (v: string[]) => vennIs(v, ['AB']), t`só a interseção`, t`"$A$ e $B$" é a interseção $A\cap B$: a região comum aos dois círculos.`),
            inter(t`Pinte o evento "**nenhum** dos dois ocorre".`, 'venn', {}, (v: string[]) => vennIs(v, ['U']), t`a região fora dos círculos`, t`Nenhum ocorre é o complementar da união, $(A\cup B)^c$: a parte do retângulo fora dos dois círculos.`),
            mcq(t`Num dado, "sair par" e "sair ímpar" são eventos…`, ['mutuamente exclusivos e complementares', 'independentes e iguais', 'mutuamente exclusivos, mas não complementares', 'nenhuma das anteriores'], 0, t`Não ocorrem juntos e, juntos, cobrem todo o $\Omega$.`),
            mcq(t`Num dado, $A=\{1,\ 2,\ 3\}$ e $B=\{2,\ 4,\ 6\}$. Quanto é $A\cap B$?`, ['$\\{2\\}$', '$\\{1,\\ 2,\\ 3,\\ 4,\\ 6\\}$', '$\\varnothing$', '$\\{1,\\ 3\\}$'], 0, t`O único resultado nos dois.`),
            mcq(t`Num dado, $A=\{1,\ 2\}$ e $B=\{5,\ 6\}$. Esses eventos são…`, ['mutuamente exclusivos', 'complementares', 'iguais', 'o espaço amostral'], 0, t`Não têm elementos em comum, mas também não cobrem $\{3,\ 4\}$.`),
          ],
        },
      ],
    },
    {
      id: 'e-prob-regras',
      title: 'Regras da soma e do complementar',
      parts: [
        {
          card: {
            title: 'Regra da soma',
            body: t`$$P(A\cup B)=P(A)+P(B)-P(A\cap B)$$
Tiramos a interseção para não contá-la duas vezes. Se forem mutuamente exclusivos, $P(A\cup B)=P(A)+P(B)$.`,
            example: t`Carta de um baralho: $P(\text{copas}\cup\text{rei})=\frac{13}{52}+\frac{4}{52}-\frac{1}{52}=\frac{16}{52}=\frac{4}{13}$.`,
          },
          exercises: [
            gen((rng) => {
              const a = pick(rng, [0.3, 0.4, 0.5, 0.6]);
              const b = pick(rng, [0.2, 0.3, 0.4]);
              const i = pick(rng, [0.1, 0.15, 0.2]);
              return num(t`$P(A)=${fmt(a)}$, $P(B)=${fmt(b)}$ e $P(A\cap B)=${fmt(i)}$. Quanto vale $P(A\cup B)$?`, a + b - i, t`$${fmt(a)}+${fmt(b)}-${fmt(i)}=${fmt(a + b - i)}$.`, { tol: 0.001 });
            }),
            num(t`Carta de um baralho de 52: qual $P(\text{copas ou rei})$? (fração ou decimal)`, 4 / 13, t`$\frac{13+4-1}{52}=\frac{4}{13}$.`, { tol: 0.002 }),
            gen((rng) => {
              const a = pick(rng, [0.2, 0.25, 0.3]);
              const b = pick(rng, [0.1, 0.15, 0.4]);
              return num(t`$A$ e $B$ são mutuamente exclusivos, com $P(A)=${fmt(a)}$ e $P(B)=${fmt(b)}$. Quanto vale $P(A\cup B)$?`, a + b, t`Sem interseção: $${fmt(a)}+${fmt(b)}=${fmt(a + b)}$.`, { tol: 0.001 });
            }),
            tf(t`É possível ter $P(A)=0{,}7$ e $P(B)=0{,}6$ com $A$ e $B$ mutuamente exclusivos.`, false, t`A soma passaria de 1.`),
            num(t`Num dado, qual $P(\text{par ou maior que }4)$? (fração ou decimal)`, 4 / 6, t`Par: $\{2,4,6\}$; maior que 4: $\{5,6\}$; união $\{2,4,5,6\}$: $\frac46$.`, { tol: 0.002 }),
            gen((rng) => {
              const u = pick(rng, [0.7, 0.8, 0.9]);
              const a = pick(rng, [0.4, 0.5]);
              const b = pick(rng, [0.5, 0.6]);
              return num(t`$P(A)=${fmt(a)}$, $P(B)=${fmt(b)}$ e $P(A\cup B)=${fmt(u)}$. Quanto vale $P(A\cap B)$?`, a + b - u, t`$${fmt(a)}+${fmt(b)}-${fmt(u)}=${fmt(a + b - u)}$.`, { tol: 0.001 });
            }),
            num(t`Numa turma, 40% fazem estágio, 30% fazem IC e 10% fazem os dois. Qual a probabilidade de um aluno sorteado fazer pelo menos um dos dois?`, 0.6, t`$0{,}4+0{,}3-0{,}1=0{,}6$.`),
          ],
        },
        {
          card: {
            title: 'Complementar e "pelo menos um"',
            body: t`$$P(\bar A)=1-P(A)$$

"**Pelo menos um**" quase sempre sai mais fácil pelo complementar: $1-P(\text{nenhum})$.`,
          },
          exercises: [
            num(t`A probabilidade de chover amanhã é $0{,}35$. Qual a de **não** chover?`, 0.65, t`$1-0{,}35$.`),
            num(t`Probabilidade de sair pelo menos um 6 em 2 lançamentos de dado (4 casas)?`, 11 / 36, t`$1-\left(\frac56\right)^2=\frac{11}{36}\approx0{,}3056$.`, { tol: 0.001 }),
            gen((rng) => {
              const p = pick(rng, [0.1, 0.2, 0.05]);
              const n = randInt(rng, 2, 4);
              return num(t`Cada lâmpada tem probabilidade $${fmt(p)}$ de queimar, independentemente. Com $${n}$ lâmpadas, qual a probabilidade de **pelo menos uma** queimar? (4 casas)`, 1 - (1 - p) ** n, t`$1-${fmt(1 - p)}^{${n}}\approx${fmt(1 - (1 - p) ** n, 4)}$.`, { tol: 0.001 });
            }),
            tf(t`$P(A)+P(\bar A)=1$ sempre.`, true, t`$A$ e $\bar A$ cobrem todo o $\Omega$ sem se sobrepor.`),
            num(t`Numa moeda honesta lançada 4 vezes, qual a probabilidade de sair **pelo menos uma** cara? (4 casas)`, 15 / 16, t`$1-\frac{1}{16}=\frac{15}{16}=0{,}9375$.`, { tol: 0.001 }),
            gen((rng) => {
              const p = pick(rng, [0.9, 0.95, 0.8]);
              return num(t`Um sistema tem 2 componentes em paralelo (basta um funcionar). Cada um funciona com probabilidade $${fmt(p)}$, de forma independente. Qual a confiabilidade do sistema? (4 casas)`, 1 - (1 - p) ** 2, t`Falha só se os dois falharem: $1-${fmt(1 - p)}^2=${fmt(1 - (1 - p) ** 2, 4)}$.`, { tol: 0.0005 });
            }),
            num(t`Quantas vezes, no mínimo, é preciso lançar um dado para ter mais de 50% de chance de sair pelo menos um 6?`, 4, t`$1-\left(\frac56\right)^n>0{,}5$: com $n=3$, $0{,}42$; com $n=4$, $0{,}52$.`),
          ],
        },
      ],
    },
    {
      id: 'e-prob-cond',
      title: 'Condicional e independência',
      parts: [
        {
          card: {
            title: 'O universo encolhe',
            body: t`Sabendo que $B$ ocorreu, só os resultados de $B$ continuam possíveis:
$$P(A\mid B)=\frac{P(A\cap B)}{P(B)}$$`,
            example: t`Num dado, sabendo que saiu par: $P(\text{saiu }2\mid\text{par})=\frac{1/6}{3/6}=\frac13$.`,
          },
          exercises: [
            num(t`Numa turma, 60% estudam Cálculo; 30% estudam Cálculo **e** Física. Dado que um aluno estuda Cálculo, qual a probabilidade de estudar Física?`, 0.5, t`$\frac{0{,}3}{0{,}6}=0{,}5$.`),
            num(t`Num dado, sabendo que saiu um número maior que 3, qual a probabilidade de ter saído 6? (fração ou decimal)`, 1 / 3, t`O universo vira $\{4,\ 5,\ 6\}$: $\frac13$.`, { tol: 0.002 }),
            gen((rng) => {
              const pb = pick(rng, [0.4, 0.5, 0.8]);
              const pab = pick(rng, [0.1, 0.2]);
              return num(t`$P(B)=${fmt(pb)}$ e $P(A\cap B)=${fmt(pab)}$. Quanto vale $P(A\mid B)$?`, pab / pb, t`$\frac{${fmt(pab)}}{${fmt(pb)}}=${fmt(pab / pb, 4)}$.`, { tol: 0.002 });
            }),
            tf(t`$P(A\mid B)$ e $P(B\mid A)$ são sempre iguais.`, false, t`Os denominadores são diferentes: $P(B)$ e $P(A)$.`),
            num(t`Duas cartas são retiradas **sem reposição**. Qual a probabilidade de ambas serem ases? (4 casas)`, (4 / 52) * (3 / 51), t`$\frac{4}{52}\cdot\frac{3}{51}=\frac{1}{221}\approx0{,}0045$.`, { tol: 0.0002 }),
            num(t`Lançando 2 dados, sabendo que a soma foi 8, qual a probabilidade de os dois mostrarem o mesmo número? (fração ou decimal)`, 0.2, t`Soma 8: $(2,6),\ (3,5),\ (4,4),\ (5,3),\ (6,2)$; só $(4,4)$ é par igual: $\frac15$.`, { tol: 0.002 }),
            gen((rng) => {
              const r = randInt(rng, 3, 6);
              const b = randInt(rng, 2, 5);
              return num(t`Uma urna tem $${r}$ bolas vermelhas e $${b}$ azuis. Tirando 2 sem reposição, sabendo que a 1ª foi vermelha, qual a chance de a 2ª ser vermelha? (fração ou decimal)`, (r - 1) / (r + b - 1), t`Sobraram $${r - 1}$ vermelhas em $${r + b - 1}$ bolas.`, { tol: 0.002 });
            }),
          ],
        },
        {
          card: {
            title: 'Independência e árvores',
            body: t`**Independentes**: saber de um não muda a chance do outro, $P(A\mid B)=P(A)$, ou seja
$$P(A\cap B)=P(A)\,P(B)$$

Na **árvore**, multiplique ao longo dos galhos e some os caminhos:`,
            visual: treeLab(),
          },
          exercises: [
            tf(t`Se $P(A\mid B)=P(A)$, então $A$ e $B$ são independentes.`, true, t`É uma das definições equivalentes.`),
            gen((rng) => {
              const p = pick(rng, [0.02, 0.03, 0.05, 0.1]);
              return num(t`Uma máquina produz ${fmt(p * 100)}% de peças defeituosas. Escolhendo 2 peças independentes, qual a probabilidade de **ambas serem boas**?`, (1 - p) ** 2, t`$${fmt(1 - p)}^2=${fmt((1 - p) ** 2, 4)}$.`, { tol: 0.0005 });
            }),
            inter(t`Ajuste a taxa de defeito $p$ para que a chance de ambas as peças serem boas seja $0{,}81$.`, 'plot', treeLab().props, (v: any) => v && near(v.p.p, 0.1, 0.001), t`$p=0{,}1$, pois $0{,}9^2=0{,}81$`, t`Peças independentes: $P(\text{ambas boas})=(1-p)^2=0{,}81\Rightarrow 1-p=0{,}9\Rightarrow p=0{,}1$.`),
            gen((rng) => {
              const a = pick(rng, [0.5, 0.4, 0.2]);
              const b = pick(rng, [0.5, 0.3, 0.6]);
              const ind = rng() < 0.5;
              const ab = ind ? a * b : a * b + 0.05;
              return tf(t`$P(A)=${fmt(a)}$, $P(B)=${fmt(b)}$ e $P(A\cap B)=${fmt(ab)}$. $A$ e $B$ são independentes.`, ind, t`$P(A)P(B)=${fmt(a * b)}$${ind ? ', igual a' : ', diferente de'} $P(A\cap B)$.`);
            }),
            mcq(t`Eventos mutuamente exclusivos (com probabilidades positivas) são independentes?`, ['não: se um ocorre, o outro fica impossível', 'sim, sempre', 'só se forem complementares', 'depende do espaço amostral'], 0, t`$P(A\cap B)=0\neq P(A)P(B)$.`),
            num(t`Na árvore, a probabilidade de "1ª peça defeituosa e 2ª boa" com $p=0{,}1$ vale quanto?`, 0.09, t`$0{,}1\cdot0{,}9=0{,}09$.`),
            num(t`Com $p=0{,}1$, qual a probabilidade de **exatamente uma** das duas peças ser defeituosa?`, 0.18, t`Dois caminhos: $0{,}1\cdot0{,}9+0{,}9\cdot0{,}1=0{,}18$.`),
          ],
        },
      ],
    },
    {
      id: 'e-prob-bayes',
      title: 'Teorema de Bayes',
      parts: [
        {
          card: {
            title: 'Probabilidade total',
            body: t`Se o evento $B$ pode acontecer por caminhos diferentes ($A$ ou $\bar A$), some os caminhos:
$$P(B)=P(B\mid A)\,P(A)+P(B\mid\bar A)\,P(\bar A)$$`,
            example: t`Máquinas A (60% da produção, 2% defeito) e B (40%, 5% defeito): $P(\text{defeito})=0{,}6\cdot0{,}02+0{,}4\cdot0{,}05=0{,}032$.`,
          },
          exercises: [
            num(t`Uma fábrica tem máquinas A (60% da produção, 2% defeito) e B (40%, 5% defeito). Qual a fração total de peças defeituosas?`, 0.032, t`$0{,}6\cdot0{,}02+0{,}4\cdot0{,}05=0{,}032$.`),
            gen((rng) => {
              const pa = pick(rng, [0.3, 0.5, 0.7]);
              const da = pick(rng, [0.01, 0.02, 0.04]);
              const db = pick(rng, [0.03, 0.05, 0.06]);
              const tot = pa * da + (1 - pa) * db;
              return num(t`A máquina A faz $${fmt(pa * 100)}\%$ das peças com $${fmt(da * 100)}\%$ de defeito; B faz o resto com $${fmt(db * 100)}\%$ de defeito. Qual a probabilidade de uma peça ser defeituosa? (4 casas)`, tot, t`$${fmt(pa)}\cdot${fmt(da)}+${fmt(1 - pa)}\cdot${fmt(db)}=${fmt(tot, 4)}$.`, { tol: 0.0005 });
            }),
            tf(t`Na probabilidade total, os "caminhos" $A$ e $\bar A$ precisam cobrir todo o espaço amostral sem se sobrepor.`, true, t`Senão algum caso fica de fora ou contado duas vezes.`),
            num(t`Uma doença atinge 1% da população. O teste dá positivo em 99% dos doentes e em 5% dos saudáveis. Qual a probabilidade de um teste dar positivo? (4 casas)`, 0.0594, t`$0{,}99\cdot0{,}01+0{,}05\cdot0{,}99=0{,}0594$.`, { tol: 0.0005 }),
            mcq(t`Numa árvore de probabilidades, para obter $P(B)$ pela regra da probabilidade total, devemos…`, ['somar os produtos dos caminhos que terminam em $B$', 'multiplicar todos os galhos', 'pegar só o maior caminho', 'subtrair os caminhos'], 0, t`Multiplica ao longo, soma entre caminhos.`),
            num(t`Uma urna I (escolhida com prob. $\frac12$) tem 3 bolas brancas de 5; a urna II tem 1 branca de 5. Qual a probabilidade de tirar uma bola branca?`, 0.4, t`$\frac12\cdot\frac35+\frac12\cdot\frac15=0{,}4$.`),
            num(t`Chove em 30% dos dias. Com chuva, o ônibus atrasa 50% das vezes; sem chuva, 10%. Em que fração dos dias o ônibus atrasa?`, 0.22, t`$0{,}3\cdot0{,}5+0{,}7\cdot0{,}1=0{,}22$.`),
          ],
        },
        {
          card: {
            title: 'Invertendo a condicional',
            body: t`$$P(A\mid B)=\frac{P(B\mid A)\,P(A)}{P(B)}$$
O denominador $P(B)$ vem da probabilidade total.`,
            visual: table(['', 'doente (1%)', 'saudável (99%)'], [
              ['teste +', '0,99 · 0,01 = 0,0099', '0,05 · 0,99 = 0,0495'],
              ['teste −', '0,0001', '0,9405'],
            ]),
            example: t`Teste com 99% de sensibilidade e 5% de falso positivo, doença com prevalência 1%: $P(\text{doente}\mid +)=\frac{0{,}0099}{0{,}0099+0{,}0495}\approx16{,}7\%$. Surpreendentemente baixo!`,
          },
          exercises: [
            num(t`Pela tabela do card, qual a probabilidade (em %) de estar doente dado teste positivo?`, 16.7, t`$\frac{0{,}0099}{0{,}0594}\approx16{,}7\%$.`, { tol: 0.2, unit: '%' }),
            num(t`No problema das máquinas (A: 60%, 2% defeito; B: 40%, 5% defeito), dado que uma peça é defeituosa, qual a probabilidade de ter vindo da máquina B? (3 casas)`, 0.625, t`$\frac{0{,}4\cdot0{,}05}{0{,}032}=\frac{0{,}02}{0{,}032}=0{,}625$.`, { tol: 0.002 }),
            tf(t`Um teste com 99% de acerto em doentes garante que um positivo tem 99% de chance de estar doente.`, false, t`Depende da prevalência: com doença rara, a maioria dos positivos é falso positivo.`),
            gen((rng) => {
              const pa = pick(rng, [0.3, 0.5, 0.7]);
              const da = pick(rng, [0.01, 0.02, 0.04]);
              const db = pick(rng, [0.03, 0.05, 0.06]);
              const tot = pa * da + (1 - pa) * db;
              return num(t`A máquina A faz $${fmt(pa * 100)}\%$ das peças com $${fmt(da * 100)}\%$ de defeito; B faz o resto com $${fmt(db * 100)}\%$. Dado que uma peça é defeituosa, qual a chance de ser de A? (3 casas)`, (pa * da) / tot, t`$\frac{${fmt(pa * da, 4)}}{${fmt(tot, 4)}}\approx${fmt((pa * da) / tot, 3)}$.`, { tol: 0.003 });
            }),
            mcq(t`Se a doença ficar **mais comum** (prevalência maior), a chance de um positivo estar realmente doente…`, ['aumenta', 'diminui', 'não muda', 'vira 100%'], 0, t`O numerador $P(+\mid D)P(D)$ cresce.`),
            num(t`Urna I ($\frac12$): 3 brancas de 5; urna II ($\frac12$): 1 branca de 5. Saiu bola branca. Qual a probabilidade de ter sido da urna I?`, 0.75, t`$\frac{0{,}5\cdot0{,}6}{0{,}4}=0{,}75$.`),
            num(t`Chove em 30% dos dias; com chuva o ônibus atrasa 50%, sem chuva 10%. O ônibus atrasou: qual a probabilidade de ter chovido? (3 casas)`, 0.15 / 0.22, t`$\frac{0{,}3\cdot0{,}5}{0{,}22}\approx0{,}682$.`, { tol: 0.003 }),
          ],
        },
      ],
    },
  ],
};

export const pesquisa: UnitDef = {
  id: 'e-pesq',
  title: 'Pesquisa de opinião',
  subtitle: 'Planejamento, margem de erro e tamanho de amostra',
  icon: '🗳️',
  source: 'Probabilidade e Estatística · Unidade VI — Projeto de pesquisa de opinião',
  guide: t`Uma boa pesquisa tem objetivo claro, questionário sem viés, amostra aleatória e representativa, e reporta **margem de erro** e **nível de confiança**.`,
  lessons: [
    {
      id: 'e-pesq-plan',
      title: 'Planejando a pesquisa',
      parts: [
        {
          card: {
            title: 'Do objetivo ao relatório',
            body: t`1. Definir **objetivo** e **população**
2. Escolher a técnica de **amostragem** e o tamanho
3. Elaborar o **questionário**
4. Fazer um **pré-teste** (piloto)
5. Coletar, tabular, analisar
6. Relatar com margem de erro e nível de confiança`,
          },
          exercises: [
            order(t`Ordene as etapas de uma pesquisa de opinião:`, ['Definir objetivo e população', 'Planejar a amostragem', 'Elaborar e testar o questionário', 'Coletar e tabular os dados', 'Analisar e relatar com margem de erro'], t`Sem objetivo e população definidos não dá para planejar a amostra; o questionário é testado antes da coleta, e a análise vem por último, com a margem de erro.`),
            tf(t`O pré-teste do questionário serve para encontrar perguntas confusas antes da coleta.`, true, t`É um ensaio em pequena escala.`),
            mcq(t`Qual é a **primeira** etapa de uma pesquisa?`, ['definir objetivo e população', 'coletar os dados', 'calcular a margem de erro', 'fazer gráficos'], 0, t`Sem objetivo claro, não dá para escolher amostra nem perguntas.`),
            mcq(t`Uma pesquisa sobre a satisfação dos alunos de Engenharia de uma universidade tem como população…`, ['todos os alunos de Engenharia daquela universidade', 'todos os brasileiros', 'só os alunos entrevistados', 'os professores'], 0, t`É o grupo sobre o qual queremos concluir algo.`),
            tf(t`Um bom relatório de pesquisa informa o tamanho da amostra, a margem de erro e o nível de confiança.`, true, t`Sem isso, o leitor não sabe o quanto confiar no resultado.`),
            mcq(t`Durante a tabulação, as respostas são…`, ['organizadas em tabelas e frequências', 'descartadas', 'reescritas pelo pesquisador', 'enviadas aos entrevistados'], 0, t`É a etapa que prepara a análise.`),
            mcq(t`Por que fazer um piloto com poucas pessoas antes da pesquisa completa?`, ['para corrigir problemas do questionário e da logística', 'para já ter o resultado final', 'para economizar a margem de erro', 'não é necessário'], 0, t`Mais barato errar no piloto do que na pesquisa inteira.`),
          ],
        },
        {
          card: {
            title: 'Questionário sem viés',
            body: t`Perguntas devem ser **claras**, **neutras** e, quando possível, **fechadas** (com alternativas).

Evite perguntas **indutoras** ("Você concorda que o excelente prefeito…?") e **duplas** ("Você gosta do preço e da qualidade?").`,
          },
          exercises: [
            mcq(t`Qual pergunta é **indutora**?`, ['"Você não acha que o transporte público está péssimo?"', '"Como você avalia o transporte público?"', '"Quantas vezes por semana usa ônibus?"', '"Qual meio de transporte você usa?"'], 0, t`Ela sugere a resposta.`),
            mcqS(t`A pergunta "Você gosta do sabor e do preço do produto?" tem qual problema?`, 'é dupla (duas perguntas em uma)', ['é aberta', 'é neutra demais', 'nenhum'], t`Quem gosta de um e não do outro não sabe o que responder.`),
            mcq(t`Qual é uma pergunta **fechada**?`, ['"Você usa bicicleta? ( ) sim ( ) não"', '"O que você acha da cidade?"', '"Descreva seu dia."', '"Por que você estuda?"'], 0, t`Tem alternativas pré-definidas.`),
            tf(t`Perguntas fechadas facilitam a tabulação das respostas.`, true, t`As respostas já vêm em categorias.`),
            mcq(t`Qual versão é mais **neutra**?`, ['"Qual sua opinião sobre a nova ciclovia?"', '"Você apoia a ótima nova ciclovia?"', '"Você é contra a ciclovia que atrapalha o trânsito?"', '"A ciclovia é um desperdício?"'], 0, t`Não carrega adjetivos nem sugere resposta.`),
            tf(t`A ordem das perguntas pode influenciar as respostas.`, true, t`Perguntas anteriores criam contexto (efeito de ordem).`),
            mcq(t`A pergunta "Com que frequência você se exercita: ( ) nunca ( ) às vezes ( ) sempre" tem que limitação?`, ['"às vezes" é vago e cada um entende diferente', 'é dupla', 'é indutora', 'é aberta'], 0, t`Melhor usar faixas objetivas (ex.: "0, 1–2, 3 ou mais vezes por semana").`),
          ],
        },
      ],
    },
    {
      id: 'e-pesq-erro',
      title: 'Margem de erro e tamanho da amostra',
      parts: [
        {
          card: {
            title: 'Margem de erro',
            body: t`Para uma proporção $\hat p$ com $n$ entrevistados (95% de confiança):
$$e=1{,}96\sqrt{\frac{\hat p(1-\hat p)}{n}}\ \le\ \frac{1}{\sqrt n}\ (\text{aprox.})$$

O resultado é reportado como **intervalo**: $\hat p\pm e$.`,
            example: t`$n=1000$: $e\approx\frac{1}{\sqrt{1000}}\approx3{,}2\%$.`,
          },
          exercises: [
            gen((rng) => {
              const n = pick(rng, [400, 625, 1000, 2500, 10000]);
              return num(t`Pela aproximação $e\approx\frac{1}{\sqrt n}$, qual a margem de erro (%) com $n=${n}$?`, 100 / Math.sqrt(n), t`$\frac{1}{\sqrt{${n}}}=${fmt(1 / Math.sqrt(n), 4)}$, ou $${fmt(100 / Math.sqrt(n), 2)}\%$.`, { tol: 0.05, unit: '%' });
            }),
            num(t`Candidato com 52% numa pesquisa com margem de 3 pontos: qual o limite inferior do intervalo (%)?`, 49, t`$52-3=49\%$.`, { unit: '%' }),
            gen((rng) => {
              const p = randInt(rng, 30, 60);
              const e = pick(rng, [2, 3, 4]);
              return num(t`Uma pesquisa deu $${p}\%$ com margem de erro de $${e}$ pontos. Qual o limite **superior** do intervalo (%)?`, p + e, t`$${p}+${e}=${p + e}\%$.`, { unit: '%' });
            }),
            mcq(t`Dois candidatos têm 48% e 45%, com margem de erro de 3 pontos. Podemos dizer quem está na frente?`, ['não: há empate técnico (os intervalos se sobrepõem)', 'sim, o de 48%', 'sim, o de 45%', 'só se a amostra for de 100 pessoas'], 0, t`$[45,\,51]$ e $[42,\,48]$ se sobrepõem.`),
            tf(t`Com 95% de confiança, em cerca de 95 de cada 100 pesquisas iguais o intervalo conteria a proporção verdadeira.`, true, t`É o significado do nível de confiança.`),
            num(t`Com $\hat p=0{,}5$ e $n=100$, calcule $e=1{,}96\sqrt{\frac{0{,}5\cdot0{,}5}{100}}$ em %.`, 9.8, t`$1{,}96\cdot0{,}05=0{,}098=9{,}8\%$.`, { tol: 0.05, unit: '%' }),
            mcq(t`Para um mesmo $n$, a margem de erro é **maior** quando $\hat p$ está perto de…`, ['$50\\%$', '$0\\%$', '$100\\%$', '$10\\%$'], 0, t`$\hat p(1-\hat p)$ é máximo em $\hat p=0{,}5$.`),
          ],
        },
        {
          card: {
            title: 'Tamanho da amostra',
            body: t`Invertendo a aproximação, para uma margem $e$:
$$n\approx\frac{1}{e^2}$$`,
            example: t`Para $e=2\%$: $n\approx\frac{1}{0{,}02^2}=2500$.`,
            tip: t`Curioso: o tamanho da **população** quase não importa (se ela for grande). O que importa é $n$ e a aleatoriedade.`,
          },
          exercises: [
            num(t`Quantas pessoas entrevistar para margem de erro de $5\%$ (aprox. $n=\frac{1}{e^2}$)?`, 400, t`$\frac{1}{0{,}05^2}=400$.`),
            mcq(t`Para **reduzir pela metade** a margem de erro, o tamanho da amostra deve…`, ['quadruplicar', 'dobrar', 'cair pela metade', 'ficar igual'], 0, t`$e\propto\frac{1}{\sqrt n}$.`),
            gen((rng) => {
              const e = pick(rng, [1, 2, 4, 10]);
              return num(t`Para margem de erro de $${e}\%$, quantas pessoas entrevistar (aprox. $n=\frac{1}{e^2}$)?`, 1 / (e / 100) ** 2, t`$\frac{1}{${fmt(e / 100)}^2}=${fmt(1 / (e / 100) ** 2)}$.`);
            }),
            tf(t`Uma pesquisa com 1.000 pessoas bem sorteadas pode representar um país de 200 milhões.`, true, t`A margem depende de $n$, não do tamanho da população.`),
            gen((rng) => {
              const n = pick(rng, [100, 400, 900]);
              return num(t`Uma pesquisa tem $${n}$ entrevistados. Quantos seriam necessários para cortar a margem de erro pela metade?`, 4 * n, t`Quadruplicar: $4\cdot${n}=${4 * n}$.`);
            }),
            mcq(t`Duas pesquisas sorteadas: uma numa cidade de 50 mil, outra num país de 50 milhões, ambas com $n=1000$. A margem de erro é…`, ['praticamente a mesma', 'muito maior no país', 'muito maior na cidade', 'zero na cidade'], 0, t`Para populações grandes, só $n$ importa.`),
            num(t`Com $n=2500$, qual a margem de erro aproximada (%)?`, 2, t`$\frac{1}{\sqrt{2500}}=\frac{1}{50}=2\%$.`, { unit: '%' }),
          ],
        },
      ],
    },
  ],
};

export const distribuicoes: UnitDef = {
  id: 'e-dist',
  title: 'Distribuições de probabilidade',
  subtitle: 'Binomial, normal e escore z',
  icon: '🔔',
  extra: true,
  source: 'Tópico extra (Probabilidade e Estatística)',
  guide: t`Binomial: número de sucessos em $n$ tentativas independentes. Normal: a curva em sino, definida por $\mu$ e $\sigma$; regra 68–95–99,7; o escore $z$ padroniza.`,
  lessons: [
    {
      id: 'e-dist-bin',
      title: 'Distribuição binomial',
      parts: [
        {
          card: {
            title: 'Sucessos em n tentativas',
            body: t`Com $n$ tentativas **independentes**, cada uma com probabilidade $p$ de sucesso:
$$P(X=k)=\binom nk p^k(1-p)^{n-k}$$
$\binom nk$ conta de quantas maneiras os $k$ sucessos podem aparecer.`,
            visual: binomialLab(),
          },
          exercises: [
            tf(t`Na binomial, as tentativas precisam ser independentes e com a mesma probabilidade de sucesso.`, true, t`São as hipóteses do modelo.`),
            num(t`Uma moeda é lançada 4 vezes. Qual $P(\text{exatamente 2 caras})$?`, 0.375, t`$\binom42\cdot0{,}5^4=\frac{6}{16}$.`),
            num(t`Com $p=0{,}1$ de defeito, qual a probabilidade de nenhuma peça defeituosa em 5? (4 casas)`, 0.9 ** 5, t`$0{,}9^5\approx0{,}5905$.`, { tol: 0.0005 }),
            gen((rng) => {
              const n = randInt(rng, 3, 6);
              return num(t`Uma moeda é lançada $${n}$ vezes. Qual a probabilidade de **todas** darem cara? (fração ou decimal)`, 1 / 2 ** n, t`$\binom{${n}}{${n}}0{,}5^{${n}}=\frac{1}{${2 ** n}}$.`, { tol: 0.002 });
            }),
            gen((rng) => {
              const n = randInt(rng, 3, 5);
              const p = pick(rng, [0.2, 0.3, 0.5]);
              const v = n * p * (1 - p) ** (n - 1);
              return num(t`Binomial com $n=${n}$ e $p=${fmt(p)}$: calcule $P(X=1)$. (4 casas)`, v, t`$${n}\cdot${fmt(p)}\cdot${fmt(1 - p)}^{${n - 1}}\approx${fmt(v, 4)}$.`, { tol: 0.0005 });
            }),
            mcq(t`Qual situação **não** é binomial?`, ['tirar cartas sem reposição contando ases', 'lançar uma moeda 10 vezes contando caras', 'testar 20 peças independentes contando defeitos', 'responder 5 questões no chute contando acertos'], 0, t`Sem reposição, a probabilidade muda a cada retirada.`),
            num(t`Numa prova de 4 questões com 4 alternativas, chutando tudo, qual $P(\text{acertar exatamente 2})$? (4 casas)`, 6 * 0.25 ** 2 * 0.75 ** 2, t`$\binom42\cdot0{,}25^2\cdot0{,}75^2=6\cdot0{,}0625\cdot0{,}5625\approx0{,}2109$.`, { tol: 0.0005 }),
          ],
        },
        {
          card: {
            title: 'Média e desvio da binomial',
            body: t`$$\mu=np\qquad\sigma=\sqrt{np(1-p)}$$

Mude $n$ e $p$ e veja o centro da distribuição andar para $np$:`,
            visual: binomialLab(),
          },
          exercises: [
            gen((rng) => {
              const n = pick(rng, [10, 20, 50, 100]);
              const p = pick(rng, [0.1, 0.2, 0.5]);
              return num(t`Numa binomial com $n=${n}$ e $p=${fmt(p)}$, qual a média?`, n * p, t`$np=${n}\cdot${fmt(p)}=${fmt(n * p)}$.`);
            }),
            num(t`Lançando uma moeda 100 vezes, qual o desvio padrão do número de caras?`, 5, t`$\sqrt{100\cdot0{,}5\cdot0{,}5}=\sqrt{25}=5$.`),
            gen((rng) => {
              const n = pick(rng, [16, 25, 100, 400]);
              const p = 0.5;
              return num(t`Binomial com $n=${n}$ e $p=0{,}5$: qual o desvio padrão?`, Math.sqrt(n * p * (1 - p)), t`$\sqrt{${n}\cdot0{,}25}=${fmt(Math.sqrt(n * 0.25))}$.`, { tol: 0.01 });
            }),
            tf(t`Numa binomial com $p=0{,}5$, a distribuição é simétrica.`, true, t`Sucesso e fracasso têm a mesma chance.`),
            mcq(t`Uma fábrica tem 2% de defeito. Num lote de 500 peças, quantas defeituosas se espera?`, ['10', '2', '50', '250'], 0, t`$500\cdot0{,}02=10$.`),
            num(t`Com $n=200$ e $p=0{,}1$, qual a variância da binomial?`, 18, t`$np(1-p)=200\cdot0{,}1\cdot0{,}9=18$.`),
            mcq(t`Mantendo $n$ fixo, a variância $np(1-p)$ é máxima quando…`, ['$p=0{,}5$', '$p=0$', '$p=1$', '$p=0{,}1$'], 0, t`$p(1-p)$ é máximo em $p=\frac12$.`),
          ],
        },
      ],
    },
    {
      id: 'e-dist-norm',
      title: 'Distribuição normal e escore z',
      parts: [
        {
          card: {
            title: 'A curva em sino',
            body: t`Simétrica em torno de $\mu$. Regra empírica: **68%** em $\mu\pm\sigma$, **95%** em $\mu\pm2\sigma$, **99,7%** em $\mu\pm3\sigma$. Mude $k$:`,
            visual: normalLab(),
            tip: t`O **Teorema Central do Limite** explica por que a normal aparece tanto: médias de muitas variáveis tendem à normal.`,
          },
          exercises: [
            mcq(t`Numa normal, a média, a mediana e a moda…`, ['são iguais', 'são sempre diferentes', 'só a média e a moda coincidem', 'dependem de σ'], 0, t`A curva é simétrica com pico no centro.`),
            inter(t`Ajuste $k$ para que a área dourada seja aproximadamente $95\%$.`, 'plot', normalLab().props, (v: any) => v && near(v.p.k, 2, 0.05), t`$k\approx2$ (mais precisamente $1{,}96$)`, t`Na normal padrão, $P(-1{,}96<Z<1{,}96)=0{,}95$: cerca de $95\%$ dos dados ficam a até $2$ desvios-padrão da média.`),
            num(t`QI tem $\mu=100$ e $\sigma=15$. Que porcentagem das pessoas tem QI entre 85 e 115?`, 68, t`É $\mu\pm\sigma$: cerca de $68\%$.`, { tol: 1, unit: '%' }),
            gen((rng) => {
              const mu = pick(rng, [50, 70, 170]);
              const s = pick(rng, [5, 10]);
              return num(t`Uma medida normal tem $\mu=${mu}$ e $\sigma=${s}$. Cerca de 95% dos valores ficam entre $${mu - 2 * s}$ e qual valor?`, mu + 2 * s, t`$\mu+2\sigma=${mu + 2 * s}$.`);
            }),
            num(t`Numa normal, qual porcentagem dos valores fica **acima** de $\mu+\sigma$?`, 16, t`Fora de $\mu\pm\sigma$ ficam $32\%$, metade de cada lado: $16\%$.`, { tol: 0.5, unit: '%' }),
            tf(t`Aumentar $\sigma$ deixa a curva normal mais "achatada" e larga.`, true, t`A área total continua 1, então o pico abaixa.`),
            num(t`Numa normal, qual porcentagem dos valores fica fora de $\mu\pm3\sigma$?`, 0.3, t`$100\%-99{,}7\%=0{,}3\%$.`, { tol: 0.05, unit: '%' }),
          ],
        },
        {
          card: {
            title: 'Escore z',
            body: t`O escore $z$ diz **quantos desvios padrão** um valor está da média:
$$z=\frac{x-\mu}{\sigma}$$
Com ele, qualquer normal vira a **normal padrão** ($\mu=0$, $\sigma=1$).`,
            visual: normalLab(),
          },
          exercises: [
            gen((rng) => {
              const mu = pick(rng, [50, 70, 100, 170]);
              const s = pick(rng, [5, 10, 15]);
              const k = pick(rng, [-2, -1, 1, 2, 1.5]);
              const x = mu + k * s;
              return num(t`Com $\mu=${mu}$ e $\sigma=${s}$, qual o escore $z$ de $x=${fmt(x)}$?`, k, t`$\frac{${fmt(x)}-${mu}}{${s}}=${fmt(k)}$.`);
            }),
            tf(t`Um valor com $z=0$ é igual à média.`, true, t`$x-\mu=0$.`),
            mcq(t`Um escore $z=-2$ significa que o valor está…`, ['2 desvios padrão abaixo da média', '2 unidades abaixo da média', 'acima da média', 'no percentil 2'], 0, t`O sinal indica o lado; o número, quantos desvios.`),
            gen((rng) => {
              const mu = pick(rng, [60, 100, 500]);
              const s = pick(rng, [5, 10, 20]);
              const z = pick(rng, [-1.5, -1, 0.5, 2]);
              return num(t`Com $\mu=${mu}$ e $\sigma=${s}$, qual valor $x$ tem escore $z=${fmt(z)}$?`, mu + z * s, t`$x=\mu+z\sigma=${mu}+${fmt(z)}\cdot${s}=${fmt(mu + z * s)}$.`);
            }),
            mcq(t`Ana tirou 80 numa prova com média 70 e σ = 5; Beto tirou 85 numa prova com média 75 e σ = 10. Quem foi **relativamente** melhor?`, ['Ana ($z=2$)', 'Beto ($z=1$)', 'empate', 'não dá para comparar'], 0, t`O escore $z$ compara desempenhos em escalas diferentes.`),
            num(t`Na normal padrão, qual a probabilidade (em %) de $Z$ ficar entre $-1$ e $1$?`, 68, t`Regra empírica.`, { tol: 1, unit: '%' }),
            num(t`Peças têm comprimento normal com $\mu=50$ mm e $\sigma=0{,}2$ mm. Aproximadamente que % das peças fica abaixo de $49{,}6$ mm?`, 2.5, t`$z=\frac{49{,}6-50}{0{,}2}=-2$; abaixo de $-2$: $\frac{5\%}{2}=2{,}5\%$.`, { tol: 0.2, unit: '%' }),
          ],
        },
      ],
    },
  ],
};

const pearson = (a: { x: number; y: number }[]) => {
  const n = a.length;
  const mx = a.reduce((s, q) => s + q.x, 0) / n;
  const my = a.reduce((s, q) => s + q.y, 0) / n;
  const sxy = a.reduce((s, q) => s + (q.x - mx) * (q.y - my), 0);
  const sxx = a.reduce((s, q) => s + (q.x - mx) ** 2, 0);
  const syy = a.reduce((s, q) => s + (q.y - my) ** 2, 0);
  return sxy / Math.sqrt(sxx * syy || 1);
};

export const regressao: UnitDef = {
  id: 'e-reg',
  title: 'Correlação e regressão',
  subtitle: 'Coeficiente de Pearson e reta de regressão',
  icon: '📈',
  extra: true,
  source: 'Tópico extra (Probabilidade e Estatística)',
  guide: t`O coeficiente de Pearson $r\in[-1, 1]$ mede a força da relação **linear**. A reta de regressão é a de mínimos quadrados. Correlação não implica causalidade!`,
  lessons: [
    {
      id: 'e-reg-corr',
      title: 'Correlação',
      parts: [
        {
          card: {
            title: 'O coeficiente r',
            body: t`$$r=\frac{\sum(x_i-\bar x)(y_i-\bar y)}{\sqrt{\sum(x_i-\bar x)^2\sum(y_i-\bar y)^2}}$$
• $r\approx1$: forte positiva · $r\approx-1$: forte negativa · $r\approx0$: sem relação linear

Arraste os pontos e observe $r$:`,
            visual: corrLab(),
          },
          exercises: [
            mcq(t`$r=-0{,}95$ indica…`, ['forte relação linear negativa', 'fraca relação', 'que uma causa a outra', 'relação não linear'], 0, t`Perto de $-1$: pontos quase alinhados numa reta descendente.`),
            inter(t`Arraste os pontos para obter correlação **negativa** forte ($r<-0{,}8$).`, 'plot', corrLab().props, (v: any) => v && pearson(Object.values(v.pts) as { x: number; y: number }[]) < -0.8, 'pontos descendo da esquerda para a direita', t`$r$ negativo e perto de $-1$ significa pontos quase alinhados numa reta descendente: quando $x$ cresce, $y$ diminui.`),
            mcq(t`Qual é o intervalo possível para $r$?`, ['$[-1,\\,1]$', '$[0,\\,1]$', '$[0,\\,\\infty)$', '$\\mathbb R$'], 0, t`Por construção, $|r|\le1$.`),
            gen((rng) => {
              const r = pick(rng, [0.92, 0.55, 0.05, -0.6, -0.97]);
              const k = Math.abs(r) >= 0.8 ? (r > 0 ? 0 : 1) : Math.abs(r) >= 0.4 ? 2 : 3;
              return mcq(t`Como classificar uma correlação com $r=${fmt(r)}$?`, ['forte e positiva', 'forte e negativa', 'moderada', 'fraca ou inexistente'], k, t`Quanto mais perto de $\pm1$, mais forte; o sinal dá o sentido.`);
            }),
            tf(t`Se $r=1$, todos os pontos estão sobre uma reta crescente.`, true, t`Correlação perfeita positiva.`),
            inter(t`Arraste os pontos para que fiquem praticamente sem correlação ($|r|<0{,}2$).`, 'plot', corrLab().props, (v: any) => v && Math.abs(pearson(Object.values(v.pts) as { x: number; y: number }[])) < 0.2, 'pontos espalhados sem tendência', t`$r$ perto de $0$ indica ausência de tendência linear: os pontos ficam espalhados sem subir nem descer.`),
            mcq(t`Horas de estudo e nota numa turma deram $r=0{,}7$. Isso significa que…`, ['quem estuda mais tende a tirar notas maiores', 'estudar causa nota alta com certeza', '70% dos alunos estudaram', 'a nota é 70% das horas'], 0, t`Tendência positiva moderada a forte, sem garantia individual.`),
          ],
        },
        {
          card: {
            title: 'Correlação não é causalidade',
            body: t`Duas variáveis podem andar juntas porque uma **terceira** influencia as duas (variável de confusão), ou por pura coincidência.

E $r$ só mede relação **linear**: $r\approx0$ não exclui uma relação curva.`,
            tip: t`Sorvete e afogamentos são correlacionados… porque ambos aumentam no verão. A temperatura explica tudo.`,
          },
          exercises: [
            tf(t`Correlação alta prova que uma variável causa a outra.`, false, t`Pode haver uma variável de confusão ou coincidência.`),
            tf(t`$r=0$ garante que não há nenhuma relação entre as variáveis.`, false, t`Pode haver relação **não linear** (ex.: $y=x^2$ simétrica).`),
            mcq(t`Cidades com mais bombeiros têm mais incêndios. A explicação mais provável é…`, ['cidades maiores têm mais bombeiros e mais incêndios', 'bombeiros causam incêndios', 'incêndios criam bombeiros', 'coincidência total'], 0, t`O tamanho da cidade é a variável de confusão.`),
            mcq(t`Para mostrar que um remédio **causa** melhora, o ideal é…`, ['um experimento controlado com sorteio dos grupos', 'calcular uma correlação alta', 'perguntar aos pacientes', 'olhar um gráfico de dispersão'], 0, t`O sorteio equilibra as variáveis de confusão entre os grupos.`),
            mcq(t`Os pontos de $y=x^2$ com $x$ de $-3$ a $3$ têm $r$ aproximadamente…`, ['$0$', '$1$', '$-1$', '$0{,}5$'], 0, t`A relação é forte, mas não linear: o lado esquerdo cancela o direito.`),
            tf(t`Uma única observação muito fora do padrão (outlier) pode mudar bastante o valor de $r$.`, true, t`$r$ é sensível a valores extremos.`),
            mcq(t`O nome da "terceira variável" que explica uma correlação aparente é…`, ['variável de confusão', 'variável dependente', 'resíduo', 'parâmetro'], 0, t`Também chamada de variável oculta.`),
          ],
        },
      ],
    },
    {
      id: 'e-reg-reta',
      title: 'Reta de regressão',
      parts: [
        {
          card: {
            title: 'Prevendo com a reta',
            body: t`$$\hat y=a\,x+b,\quad a=\frac{\sum(x_i-\bar x)(y_i-\bar y)}{\sum(x_i-\bar x)^2},\quad b=\bar y-a\bar x$$
É a reta de mínimos quadrados, e ela passa por $(\bar x,\bar y)$.`,
            visual: regressionLab(),
          },
          exercises: [
            num(t`Se $\bar x=4$, $\bar y=10$ e $a=2$, quanto vale $b$?`, 2, t`$b=10-2\cdot4=2$.`),
            num(t`Com a reta $\hat y=2x+2$, qual a previsão para $x=7$?`, 16, t`$2\cdot7+2=16$.`),
            gen((rng) => {
              const a = randNZ(rng, -3, 4);
              const b = randInt(rng, -5, 10);
              const x = randInt(rng, 1, 9);
              return num(t`Com a reta $\hat y=${term(a, 'x', true)}${term(b, '')}$, qual a previsão para $x=${x}$?`, a * x + b, t`$${a}\cdot${x}${term(b, '')}=${a * x + b}$.`);
            }),
            gen((rng) => {
              const a = pick(rng, [1.5, 2, 3, -1]);
              const xb = randInt(rng, 2, 8);
              const yb = randInt(rng, 5, 30);
              return num(t`Com $\bar x=${xb}$, $\bar y=${yb}$ e inclinação $a=${fmt(a)}$, quanto vale o intercepto $b$?`, yb - a * xb, t`$b=${yb}-${fmt(a)}\cdot${xb}=${fmt(yb - a * xb)}$.`);
            }),
            mcq(t`Na reta $\hat y=3x+5$, o que significa o $3$?`, ['cada unidade a mais de $x$ aumenta $y$ em 3, em média', 'o valor de $y$ quando $x=0$', 'a correlação', 'o erro da reta'], 0, t`É a inclinação.`),
            num(t`Para $(1,\,2)$, $(2,\,4)$, $(3,\,5)$: com $\bar x=2$ e $\bar y=\frac{11}{3}$, a inclinação é $a=1{,}5$. Quanto vale $b$? (3 casas)`, 11 / 3 - 3, t`$b=\frac{11}{3}-1{,}5\cdot2\approx0{,}667$.`, { tol: 0.002 }),
            num(t`Para os pontos $(0,\,1)$, $(1,\,3)$ e $(2,\,5)$, qual a inclinação da reta de regressão?`, 2, t`Os pontos já estão sobre $y=2x+1$.`),
          ],
        },
        {
          card: {
            title: 'R² e cuidados',
            body: t`O **coeficiente de determinação** $R^2=r^2$ diz que fração da variação de $y$ a reta explica.

Cuidados:
• **extrapolar** (prever longe dos dados) é arriscado
• olhe os **resíduos**: se formam um padrão, talvez o modelo linear não sirva`,
          },
          exercises: [
            num(t`Se $r=0{,}9$, qual o $R^2$?`, 0.81, t`$0{,}9^2=0{,}81$.`),
            mcq(t`Usar a reta para prever bem fora do intervalo dos dados (extrapolar) é…`, ['arriscado', 'sempre preciso', 'proibido matematicamente', 'igual a interpolar'], 0, t`Não sabemos se a relação continua linear lá fora.`),
            gen((rng) => {
              const r = pick(rng, [0.5, 0.6, 0.8, -0.7, -0.9]);
              return num(t`Com $r=${fmt(r)}$, que porcentagem da variação de $y$ a reta explica?`, 100 * r * r, t`$R^2=${fmt(r * r)}$, ou $${fmt(100 * r * r)}\%$.`, { tol: 0.05, unit: '%' });
            }),
            tf(t`$R^2=0{,}95$ indica que a reta explica 95% da variação de $y$.`, true, t`É a interpretação de $R^2$.`),
            mcq(t`Se os resíduos formam uma curva em "U" no gráfico, isso sugere que…`, ['a relação não é linear', 'a reta é perfeita', 'não há dados', 'a correlação é 1'], 0, t`Resíduos de um bom modelo ficam espalhados ao acaso.`),
            num(t`O $R^2$ de uma reta foi $0{,}49$ e a inclinação é negativa. Quanto vale $r$?`, -0.7, t`$|r|=\sqrt{0{,}49}=0{,}7$, com o sinal da inclinação.`),
            mcq(t`Uma reta ajustada com alturas de crianças de 2 a 10 anos é usada para prever a altura aos 40 anos. Isso é…`, ['extrapolação perigosa', 'interpolação segura', 'um uso correto da regressão', 'cálculo de $R^2$'], 0, t`O crescimento para depois da adolescência: a relação linear não vale mais.`),
          ],
        },
      ],
    },
  ],
};
