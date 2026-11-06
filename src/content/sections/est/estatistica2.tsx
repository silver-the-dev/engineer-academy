import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi, table } from '../../helpers';
import { Label, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt } from '../../../lib/random';
import { binomialLab, normalLab, regressionLab } from '../../visuals';

const t = String.raw;
const comb = (n: number, k: number) => {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
};

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
      cards: [
        {
          title: 'Ω, eventos e operações',
          body: t`• **Espaço amostral** $\Omega$: todos os resultados possíveis
• **Evento**: subconjunto de $\Omega$
• União $A\cup B$ (ou), interseção $A\cap B$ (e), complementar $\bar A$ (não)
• **Mutuamente exclusivos**: $A\cap B=\varnothing$

Toque nas regiões do diagrama:`,
          visual: { name: 'venn', props: {} },
        },
      ],
      exercises: [
        num(t`Quantos elementos tem o espaço amostral do lançamento de 2 dados?`, 36),
        num(t`Ao lançar 3 moedas, quantos resultados possíveis há?`, 8),
        inter(t`Pinte o evento "**exatamente um** de $A$ ou $B$ ocorre".`, 'venn', {}, (v: string[]) => Array.isArray(v) && v.length === 2 && v.includes('A') && v.includes('B'), t`$A$ sem $B$ e $B$ sem $A$`),
        tf(t`Eventos mutuamente exclusivos não podem ocorrer ao mesmo tempo.`, true),
        mcq(t`Lançando um dado, o evento "sair par" é…`, ['$\\{2,4,6\\}$', '$\\{1,3,5\\}$', '$\\{2,4\\}$', '$\\{6\\}$'], 0),
      ],
    },
    {
      id: 'e-prob-regras',
      title: 'Regras da soma e do complementar',
      cards: [
        {
          title: 'As regras',
          body: t`$$P(A\cup B)=P(A)+P(B)-P(A\cap B)$$
$$P(\bar A)=1-P(A)$$
Se forem mutuamente exclusivos, $P(A\cup B)=P(A)+P(B)$.`,
          example: t`Carta de um baralho: $P(\text{copas}\cup\text{rei})=\frac{13}{52}+\frac{4}{52}-\frac{1}{52}=\frac{16}{52}=\frac{4}{13}$.`,
          tip: t`"Pelo menos um" quase sempre sai mais fácil pelo complementar: $1-P(\text{nenhum})$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const a = pick(rng, [0.3, 0.4, 0.5, 0.6]);
          const b = pick(rng, [0.2, 0.3, 0.4]);
          const i = pick(rng, [0.1, 0.15, 0.2]);
          return num(t`$P(A)=${fmt(a)}$, $P(B)=${fmt(b)}$ e $P(A\cap B)=${fmt(i)}$. Quanto vale $P(A\cup B)$?`, a + b - i, undefined, { tol: 0.001 });
        }),
        num(t`A probabilidade de chover amanhã é $0{,}35$. Qual a de **não** chover?`, 0.65),
        num(t`Probabilidade de sair pelo menos um 6 em 2 lançamentos de dado (4 casas)?`, 11 / 36, t`$1-\left(\frac56\right)^2=\frac{11}{36}\approx0{,}3056$.`, { tol: 0.001 }),
        num(t`Carta de um baralho de 52: qual $P(\text{copas ou rei})$? (fração ou decimal)`, 4 / 13, undefined, { tol: 0.002 }),
      ],
    },
    {
      id: 'e-prob-cond',
      title: 'Condicional e independência',
      cards: [
        {
          title: 'O universo encolhe',
          body: t`$$P(A\mid B)=\frac{P(A\cap B)}{P(B)}$$
**Independentes**: $P(A\mid B)=P(A)$, ou seja, $P(A\cap B)=P(A)\,P(B)$.

Na **árvore**, multiplique ao longo dos galhos e some os caminhos:`,
          visual: treeLab(),
        },
      ],
      exercises: [
        num(t`Numa turma, 60% estudam Cálculo; 30% estudam Cálculo **e** Física. Dado que um aluno estuda Cálculo, qual a probabilidade de estudar Física?`, 0.5, t`$\frac{0{,}3}{0{,}6}=0{,}5$.`),
        gen((rng) => {
          const p = pick(rng, [0.02, 0.03, 0.05, 0.1]);
          return num(t`Uma máquina produz ${fmt(p * 100)}% de peças defeituosas. Escolhendo 2 peças independentes, qual a probabilidade de **ambas serem boas**?`, (1 - p) ** 2, undefined, { tol: 0.0005 });
        }),
        inter(t`Ajuste a taxa de defeito $p$ para que a chance de ambas as peças serem boas seja $0{,}81$.`, 'plot', treeLab().props, (v: any) => v && near(v.p.p, 0.1, 0.001), t`$p=0{,}1$, pois $0{,}9^2=0{,}81$`),
        tf(t`Se $P(A\mid B)=P(A)$, então $A$ e $B$ são independentes.`, true),
        num(t`Duas cartas são retiradas **sem reposição**. Qual a probabilidade de ambas serem ases? (4 casas)`, (4 / 52) * (3 / 51), t`$\frac{4}{52}\cdot\frac{3}{51}=\frac{1}{221}\approx0{,}0045$.`, { tol: 0.0002 }),
      ],
    },
    {
      id: 'e-prob-bayes',
      title: 'Teorema de Bayes',
      cards: [
        {
          title: 'Invertendo a condicional',
          body: t`$$P(A\mid B)=\frac{P(B\mid A)\,P(A)}{P(B)}$$
com $P(B)=P(B\mid A)P(A)+P(B\mid\bar A)P(\bar A)$ (probabilidade total).`,
          visual: table(['', 'doente (1%)', 'saudável (99%)'], [
            ['teste +', '0,99 · 0,01 = 0,0099', '0,05 · 0,99 = 0,0495'],
            ['teste −', '0,0001', '0,9405'],
          ]),
          example: t`Teste com 99% de sensibilidade e 5% de falso positivo, doença com prevalência 1%: $P(\text{doente}\mid +)=\frac{0{,}0099}{0{,}0099+0{,}0495}\approx16{,}7\%$. Surpreendentemente baixo!`,
        },
      ],
      exercises: [
        num(t`Pela tabela do card, qual a probabilidade (em %) de estar doente dado teste positivo?`, 16.7, undefined, { tol: 0.2, unit: '%' }),
        num(t`Uma fábrica tem máquinas A (60% da produção, 2% defeito) e B (40%, 5% defeito). Qual a fração total de peças defeituosas?`, 0.032, t`$0{,}6\cdot0{,}02+0{,}4\cdot0{,}05=0{,}032$.`),
        num(t`No problema anterior, dado que uma peça é defeituosa, qual a probabilidade de ter vindo da máquina B? (3 casas)`, 0.625, t`$\frac{0{,}02}{0{,}032}=0{,}625$.`, { tol: 0.002 }),
        tf(t`$P(A\mid B)$ e $P(B\mid A)$ são sempre iguais.`, false, t`Bayes mostra que elas diferem quando $P(A)\ne P(B)$.`),
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
      cards: [
        {
          title: 'Do objetivo ao relatório',
          body: t`1. Definir **objetivo** e **população**
2. Escolher a técnica de **amostragem** e o tamanho
3. Elaborar o **questionário** (perguntas claras, neutras, fechadas quando possível)
4. Fazer um **pré-teste** (piloto)
5. Coletar, tabular, analisar
6. Relatar com margem de erro e nível de confiança`,
          tip: t`Evite perguntas **indutoras** ("Você concorda que o excelente prefeito…?") e **duplas** ("Você gosta do preço e da qualidade?").`,
        },
      ],
      exercises: [
        order(t`Ordene as etapas de uma pesquisa de opinião:`, ['Definir objetivo e população', 'Planejar a amostragem', 'Elaborar e testar o questionário', 'Coletar e tabular os dados', 'Analisar e relatar com margem de erro']),
        mcq(t`Qual pergunta é **indutora**?`, ['"Você não acha que o transporte público está péssimo?"', '"Como você avalia o transporte público?"', '"Quantas vezes por semana usa ônibus?"', '"Qual meio de transporte você usa?"'], 0),
        tf(t`O pré-teste do questionário serve para encontrar perguntas confusas antes da coleta.`, true),
        mcqS(t`A pergunta "Você gosta do sabor e do preço do produto?" tem qual problema?`, 'é dupla (duas perguntas em uma)', ['é aberta', 'é neutra demais', 'nenhum']),
      ],
    },
    {
      id: 'e-pesq-erro',
      title: 'Margem de erro e tamanho da amostra',
      cards: [
        {
          title: 'Quanto confiar no resultado',
          body: t`Para uma proporção $\hat p$ com $n$ entrevistados (95% de confiança):
$$e=1{,}96\sqrt{\frac{\hat p(1-\hat p)}{n}}\ \le\ \frac{1}{\sqrt n}\ (\text{aprox.})$$
Tamanho para margem $e$: $$n\approx\frac{1}{e^2}$$`,
          example: t`$n=1000$: $e\approx\frac{1}{\sqrt{1000}}\approx3{,}2\%$. Para $e=2\%$: $n\approx\frac{1}{0{,}02^2}=2500$.`,
          tip: t`Curioso: o tamanho da **população** quase não importa (se ela for grande). O que importa é $n$ e a aleatoriedade.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const n = pick(rng, [400, 625, 1000, 2500, 10000]);
          return num(t`Pela aproximação $e\approx\frac{1}{\sqrt n}$, qual a margem de erro (%) com $n=${n}$?`, 100 / Math.sqrt(n), undefined, { tol: 0.05, unit: '%' });
        }),
        num(t`Quantas pessoas entrevistar para margem de erro de $5\%$ (aprox. $n=\frac{1}{e^2}$)?`, 400),
        mcq(t`Para **reduzir pela metade** a margem de erro, o tamanho da amostra deve…`, ['quadruplicar', 'dobrar', 'cair pela metade', 'ficar igual'], 0, t`$e\propto\frac{1}{\sqrt n}$.`),
        num(t`Candidato com 52% numa pesquisa com margem de 3 pontos: qual o limite inferior do intervalo (%)?`, 49, undefined, { unit: '%' }),
        tf(t`Uma pesquisa com 1.000 pessoas bem sorteadas pode representar um país de 200 milhões.`, true),
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
      cards: [
        {
          title: 'Sucessos em n tentativas',
          body: t`$$P(X=k)=\binom nk p^k(1-p)^{n-k}$$
Média $\mu=np$ e desvio $\sigma=\sqrt{np(1-p)}$. Mude $n$ e $p$:`,
          visual: binomialLab(),
        },
      ],
      exercises: [
        num(t`Uma moeda é lançada 4 vezes. Qual $P(\text{exatamente 2 caras})$?`, 0.375, t`$\binom42\cdot0{,}5^4=\frac{6}{16}$.`),
        gen((rng) => {
          const n = pick(rng, [10, 20, 50, 100]);
          const p = pick(rng, [0.1, 0.2, 0.5]);
          return num(t`Numa binomial com $n=${n}$ e $p=${fmt(p)}$, qual a média?`, n * p);
        }),
        num(t`Com $p=0{,}1$ de defeito, qual a probabilidade de nenhuma peça defeituosa em 5? (4 casas)`, 0.9 ** 5, undefined, { tol: 0.0005 }),
        tf(t`Na binomial, as tentativas precisam ser independentes e com a mesma probabilidade de sucesso.`, true),
      ],
    },
    {
      id: 'e-dist-norm',
      title: 'Distribuição normal e escore z',
      cards: [
        {
          title: 'A curva em sino',
          body: t`Simétrica em torno de $\mu$. Regra empírica: **68%** em $\mu\pm\sigma$, **95%** em $\mu\pm2\sigma$, **99,7%** em $\mu\pm3\sigma$. Mude $k$:`,
          visual: normalLab(),
          formula: t`z=\frac{x-\mu}{\sigma}`,
          tip: t`O **Teorema Central do Limite** explica por que a normal aparece tanto: médias de muitas variáveis tendem à normal.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const mu = pick(rng, [50, 70, 100, 170]);
          const s = pick(rng, [5, 10, 15]);
          const k = pick(rng, [-2, -1, 1, 2, 1.5]);
          const x = mu + k * s;
          return num(t`Com $\mu=${mu}$ e $\sigma=${s}$, qual o escore $z$ de $x=${fmt(x)}$?`, k);
        }),
        inter(t`Ajuste $k$ para que a área dourada seja aproximadamente $95\%$.`, 'plot', normalLab().props, (v: any) => v && near(v.p.k, 2, 0.05), t`$k\approx2$ (mais precisamente $1{,}96$)`),
        num(t`QI tem $\mu=100$ e $\sigma=15$. Que porcentagem das pessoas tem QI entre 85 e 115?`, 68, undefined, { tol: 1, unit: '%' }),
        mcq(t`Numa normal, a média, a mediana e a moda…`, ['são iguais', 'são sempre diferentes', 'só a média e a moda coincidem', 'dependem de σ'], 0),
      ],
    },
  ],
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
      cards: [
        {
          title: 'O coeficiente r',
          body: t`$$r=\frac{\sum(x_i-\bar x)(y_i-\bar y)}{\sqrt{\sum(x_i-\bar x)^2\sum(y_i-\bar y)^2}}$$
• $r\approx1$: forte positiva · $r\approx-1$: forte negativa · $r\approx0$: sem relação linear

Arraste os pontos e observe $r$:`,
          visual: corrLab(),
          tip: t`Sorvete e afogamentos são correlacionados… porque ambos aumentam no verão. Uma terceira variável (temperatura) explica tudo.`,
        },
      ],
      exercises: [
        inter(t`Arraste os pontos para obter correlação **negativa** forte ($r<-0{,}8$).`, 'plot', corrLab().props, (v: any) => {
          if (!v) return false;
          const a = Object.values(v.pts) as { x: number; y: number }[];
          const n = a.length;
          const mx = a.reduce((s, q) => s + q.x, 0) / n;
          const my = a.reduce((s, q) => s + q.y, 0) / n;
          const sxy = a.reduce((s, q) => s + (q.x - mx) * (q.y - my), 0);
          const sxx = a.reduce((s, q) => s + (q.x - mx) ** 2, 0);
          const syy = a.reduce((s, q) => s + (q.y - my) ** 2, 0);
          return sxy / Math.sqrt(sxx * syy || 1) < -0.8;
        }, 'pontos descendo da esquerda para a direita'),
        mcq(t`$r=-0{,}95$ indica…`, ['forte relação linear negativa', 'fraca relação', 'que uma causa a outra', 'relação não linear'], 0),
        tf(t`Correlação alta prova que uma variável causa a outra.`, false),
        tf(t`$r=0$ garante que não há nenhuma relação entre as variáveis.`, false, t`Pode haver relação **não linear** (ex.: $y=x^2$ simétrica).`),
      ],
    },
    {
      id: 'e-reg-reta',
      title: 'Reta de regressão',
      cards: [
        {
          title: 'Prevendo com a reta',
          body: t`$$\hat y=a\,x+b,\quad a=\frac{\sum(x_i-\bar x)(y_i-\bar y)}{\sum(x_i-\bar x)^2},\quad b=\bar y-a\bar x$$
A reta passa por $(\bar x,\bar y)$. O coeficiente de determinação $R^2=r^2$ diz quanto da variação de $y$ a reta explica.`,
          visual: regressionLab(),
        },
      ],
      exercises: [
        num(t`Se $\bar x=4$, $\bar y=10$ e $a=2$, quanto vale $b$?`, 2),
        num(t`Com a reta $\hat y=2x+2$, qual a previsão para $x=7$?`, 16),
        num(t`Se $r=0{,}9$, qual o $R^2$?`, 0.81),
        mcq(t`Usar a reta para prever bem fora do intervalo dos dados (extrapolar) é…`, ['arriscado', 'sempre preciso', 'proibido matematicamente', 'igual a interpolar'], 0),
      ],
    },
  ],
};
