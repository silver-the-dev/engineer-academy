import React from 'react';
import type { UnitDef } from '../../types';
import { gen, mcq, mcqS, num, tf, fill, match, order, inter, plot, rmcq, near, multi, table } from '../../helpers';
import { Label, Pt, RectW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, pick, randInt, shuffle } from '../../../lib/random';
import { meanMedianLab } from '../../visuals';

const t = String.raw;
const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};
const varPop = (a: number[]) => {
  const m = mean(a);
  return a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length;
};

const deviationLab = () =>
  plot(
    {
      view: { xMin: 0, xMax: 10, yMin: -1, yMax: 5.5 },
      equalAspect: true,
      grid: false,
      points: [
        { id: 'a', x: 2, y: 0, color: C.p5 },
        { id: 'b', x: 4, y: 0, color: C.p5 },
        { id: 'c', x: 6, y: 0, color: C.p5 },
        { id: 'd', x: 8, y: 0, color: C.p5 },
      ],
      constrain: (_: string, x: number) => ({ x: Math.max(0, Math.min(10, Math.round(x * 2) / 2)), y: 0 }),
      render: ({ pts }: any) => {
        const xs = Object.values(pts).map((p: any) => p.x as number);
        const m = mean(xs);
        return (
          <>
            <Seg x1={0} y1={0} x2={10} y2={0} color={C.plotAxis} width={2} />
            {xs.map((x, i) => (
              <RectW key={i} x={Math.min(x, m)} y={0} w={Math.abs(x - m)} h={Math.abs(x - m)} color={C.p5} opacity={0.18} />
            ))}
            <Seg x1={m} y1={-0.6} x2={m} y2={5.2} color={C.gold} width={2.5} dash="6 4" />
            <Label x={m} y={-0.7} dy={12} text="média" color={C.gold} anchor="middle" />
          </>
        );
      },
      info: ({ pts }: any) => {
        const xs = Object.values(pts).map((p: any) => p.x as number);
        const v = varPop(xs);
        return t`Dados $${xs.map((x) => fmt(x)).join(',\\ ')}$ · $\bar x=${fmt(mean(xs), 2)}$ · $\sigma^2=${fmt(v, 2)}$ (média das áreas) · $\sigma=${fmt(Math.sqrt(v), 2)}$`;
      },
    },
    240,
  );

export const conceitos: UnitDef = {
  id: 'e-conc',
  title: 'Conceitos fundamentais',
  subtitle: 'População, amostra, variáveis e amostragem',
  icon: '👥',
  source: 'Probabilidade e Estatística · Unidade I — Conceitos fundamentais',
  guide: t`Estatística é coletar, organizar, analisar e interpretar dados. Começa pela distinção entre **população** (todos) e **amostra** (parte observada), e pelo **tipo de variável**.`,
  lessons: [
    {
      id: 'e-conc-pop',
      title: 'População, amostra e variáveis',
      cards: [
        {
          title: 'Quem estamos estudando?',
          body: t`• **População**: todos os elementos de interesse (ex.: todos os alunos de Engenharia do Brasil)
• **Amostra**: subconjunto observado (ex.: 500 alunos sorteados)
• **Parâmetro**: medida da população ($\mu$, $\sigma$) · **Estatística**: medida da amostra ($\bar x$, $s$)

**Estatística descritiva** resume os dados; **inferencial** tira conclusões sobre a população a partir da amostra.`,
        },
        {
          title: 'Tipos de variáveis',
          body: t`• **Qualitativa nominal**: categorias sem ordem (cor, curso)
• **Qualitativa ordinal**: categorias com ordem (escolaridade, avaliação ruim/bom/ótimo)
• **Quantitativa discreta**: contagens (nº de filhos, peças defeituosas)
• **Quantitativa contínua**: medidas (altura, tempo, temperatura)`,
        },
      ],
      exercises: [
        match(t`Classifique cada variável:`, [
          ['Cor dos olhos', 'qualitativa nominal'],
          ['Nível de satisfação (baixo/médio/alto)', 'qualitativa ordinal'],
          ['Número de irmãos', 'quantitativa discreta'],
          ['Altura em cm', 'quantitativa contínua'],
        ]),
        mcq(t`A média de idade de **todos** os funcionários de uma empresa é um…`, ['parâmetro', 'estatística amostral', 'estimador viesado', 'erro amostral'], 0),
        tf(t`"Tempo de reação em milissegundos" é uma variável quantitativa contínua.`, true),
        mcqS(t`Uma pesquisa entrevistou 1.200 eleitores de um país. Os 1.200 eleitores são:`, 'a amostra', ['a população', 'o parâmetro', 'a variável']),
        multi(t`Quais variáveis são **quantitativas**?`, ['peso', 'CEP', 'número de acidentes', 'time de futebol'], [0, 2], t`O CEP é um rótulo (nominal), apesar de ter números.`),
      ],
    },
    {
      id: 'e-conc-amost',
      title: 'Técnicas de amostragem',
      cards: [
        {
          title: 'Como sortear bem',
          body: t`• **Aleatória simples**: todos têm a mesma chance (sorteio)
• **Sistemática**: um a cada $k$ elementos de uma lista
• **Estratificada**: divide a população em estratos (ex.: curso) e sorteia em cada um, proporcionalmente
• **Por conglomerados**: sorteia grupos inteiros (ex.: turmas)

Amostras por **conveniência** (quem estiver por perto) costumam ter **viés**.`,
          tip: t`Uma amostra pequena e bem sorteada vale mais do que uma enorme e enviesada.`,
        },
      ],
      exercises: [
        match(t`Ligue a técnica à descrição:`, [
          ['Aleatória simples', 'sorteio entre todos'],
          ['Sistemática', 'um a cada k da lista'],
          ['Estratificada', 'sorteio dentro de cada grupo'],
          ['Conglomerados', 'sorteia grupos inteiros'],
        ]),
        mcq(t`Para estimar a altura média dos alunos de uma universidade com cursos muito diferentes em tamanho, a melhor técnica é…`, ['estratificada por curso', 'conveniência na cantina', 'entrevistar só a Engenharia', 'perguntar nas redes sociais'], 0),
        tf(t`Uma enquete em que só responde quem quer (autosseleção) tende a ser representativa.`, false, t`Quem se voluntaria costuma ter opinião mais forte: há viés de autosseleção.`),
        num(t`Numa amostragem sistemática de uma lista de 1.000 nomes para obter 50, a cada quantos nomes escolhemos um?`, 20),
      ],
    },
  ],
};

export const tabelas: UnitDef = {
  id: 'e-tab',
  title: 'Tabelas e gráficos',
  subtitle: 'Distribuição de frequências e histogramas',
  icon: '📊',
  source: 'Probabilidade e Estatística · Unidade II — Tabelas e gráficos',
  guide: t`Organize os dados numa tabela de frequências (absoluta, relativa, acumulada) e escolha o gráfico certo: barras/setores para qualitativas, histograma para contínuas, linhas para séries temporais.`,
  lessons: [
    {
      id: 'e-tab-freq',
      title: 'Distribuição de frequências',
      cards: [
        {
          title: 'Absoluta, relativa e acumulada',
          body: t`• $f_i$: quantas vezes o valor/classe aparece
• $fr_i=\frac{f_i}{n}$: proporção (soma 1, ou 100%)
• $F_i$: frequência **acumulada** até a classe $i$`,
          visual: table(['classe (cm)', '$f_i$', '$fr_i$', '$F_i$'], [
            ['150 ⊢ 160', '4', '10%', '4'],
            ['160 ⊢ 170', '12', '30%', '16'],
            ['170 ⊢ 180', '16', '40%', '32'],
            ['180 ⊢ 190', '8', '20%', '40'],
          ]),
          tip: t`Número de classes: regra de Sturges $k\approx1+3{,}3\log n$. Amplitude da classe $=\frac{\text{máx}-\text{mín}}{k}$.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const f = [randInt(rng, 2, 10), randInt(rng, 2, 10), randInt(rng, 2, 10), randInt(rng, 2, 10)];
          const n = f.reduce((a, b) => a + b, 0);
          const i = randInt(rng, 0, 3);
          return num(t`Frequências absolutas: $${f.join(',\\ ')}$. Qual a frequência relativa (em %) da classe ${i + 1}?`, (100 * f[i]) / n, t`$\frac{${f[i]}}{${n}}=${fmt((100 * f[i]) / n, 2)}\%$.`, { tol: 0.06, unit: '%' });
        }),
        gen((rng) => {
          const f = [randInt(rng, 2, 10), randInt(rng, 2, 10), randInt(rng, 2, 10), randInt(rng, 2, 10)];
          return num(t`Frequências absolutas: $${f.join(',\\ ')}$. Qual a frequência acumulada $F_3$?`, f[0] + f[1] + f[2]);
        }),
        num(t`Pela tabela do card (alturas), quantos alunos têm menos de 170 cm?`, 16),
        tf(t`A soma das frequências relativas é sempre 100%.`, true),
        num(t`Pela regra de Sturges, quantas classes usar para $n=100$ dados? (arredonde)`, 8, t`$1+3{,}3\cdot2=7{,}6\approx8$.`),
      ],
    },
    {
      id: 'e-tab-graf',
      title: 'Histogramas e gráficos',
      cards: [
        {
          title: 'Monte o histograma',
          body: t`No histograma, cada barra é uma **classe** (sem espaço entre elas) e a altura é a frequência. Arraste as barras para representar a tabela do card anterior ($4,12,16,8$):`,
          visual: { name: 'bars', props: { labels: ['150', '160', '170', '180'], values: [2, 5, 8, 3], max: 20 } },
        },
        {
          title: 'Qual gráfico usar?',
          body: t`• **Barras / colunas**: comparar categorias
• **Setores (pizza)**: partes de um todo (poucas categorias)
• **Histograma**: distribuição de variável contínua
• **Linhas**: evolução no tempo
• **Dispersão**: relação entre duas variáveis quantitativas
• **Boxplot**: resumo (quartis e outliers)`,
        },
      ],
      exercises: [
        inter(t`Arraste as barras para formar o histograma da tabela: $4,\ 12,\ 16,\ 8$.`, 'bars', { labels: ['150', '160', '170', '180'], values: [2, 5, 8, 3], max: 20 }, (v: number[]) => Array.isArray(v) && v.join(',') === '4,12,16,8', 'alturas 4, 12, 16, 8'),
        match(t`Ligue a situação ao gráfico mais adequado:`, [
          ['Evolução mensal das vendas', 'linhas'],
          ['Participação de mercado de 4 marcas', 'setores'],
          ['Distribuição de pesos de peças', 'histograma'],
          ['Altura × peso de 50 pessoas', 'dispersão'],
        ]),
        tf(t`Num histograma de variável contínua, as barras ficam separadas por espaços.`, false, t`As classes são contíguas, então as barras se encostam.`),
        mcq(t`Num histograma com classes de mesma largura, a classe modal é…`, ['a de barra mais alta', 'a primeira', 'a do meio', 'a última'], 0),
      ],
    },
  ],
};

export const posicao: UnitDef = {
  id: 'e-pos',
  title: 'Medidas de posição',
  subtitle: 'Média, mediana, moda, quartis e boxplot',
  icon: '🎯',
  source: 'Probabilidade e Estatística · Unidade III — Medidas de posição',
  guide: t`Média: ponto de equilíbrio (sensível a extremos). Mediana: valor do meio (robusta). Moda: o mais frequente. Quartis dividem os dados ordenados em 4 partes.`,
  lessons: [
    {
      id: 'e-pos-media',
      title: 'Média, mediana e moda',
      cards: [
        {
          title: 'Três ideias de "centro"',
          body: t`$$\bar x=\frac{\sum x_i}{n}$$
• **Mediana**: ordene; é o valor central (ou a média dos dois centrais)
• **Moda**: valor mais frequente

Arraste o ponto vermelho para longe e veja a média ser "puxada" enquanto a mediana quase não muda:`,
          visual: meanMedianLab(),
          tip: t`Média **ponderada**: $\bar x=\frac{\sum p_ix_i}{\sum p_i}$ — ex.: notas com pesos diferentes.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const d = Array.from({ length: 5 }, () => randInt(rng, 1, 20));
          return num(t`Calcule a média de $${d.join(',\\ ')}$.`, mean(d), t`$\frac{${d.reduce((a, b) => a + b, 0)}}{5}=${fmt(mean(d), 2)}$.`, { tol: 0.005 });
        }),
        gen((rng) => {
          const n = pick(rng, [5, 6, 7]);
          const d = shuffle(rng, Array.from({ length: n }, () => randInt(rng, 1, 30)));
          return num(t`Qual a mediana de $${d.join(',\\ ')}$?`, median(d), t`Ordenando: $${[...d].sort((a, b) => a - b).join(',\\ ')}$ ⟹ mediana $${fmt(median(d))}$.`);
        }),
        num(t`Qual a moda de $3,\ 7,\ 7,\ 2,\ 9,\ 7,\ 3$?`, 7),
        num(t`Provas com pesos 2, 3 e 5 tiveram notas 6, 7 e 8. Qual a média ponderada?`, 7.3, t`$\frac{12+21+40}{10}=7{,}3$.`),
        inter(t`Arraste o ponto vermelho para que a média fique **maior que 6** com a mediana ainda igual a 3.`, 'plot', meanMedianLab().props, (v: any) => {
          if (!v) return false;
          const arr = [2, 3, 3, 5, v.pts.X.x];
          return mean(arr) > 6 && median(arr) === 3;
        }, t`valor extremo, ex.: $x=18$`),
        tf(t`Para descrever salários (com poucos valores muito altos), a mediana costuma ser melhor que a média.`, true),
      ],
    },
    {
      id: 'e-pos-quart',
      title: 'Quartis, percentis e boxplot',
      cards: [
        {
          title: 'Dividindo em quatro',
          body: t`Com os dados ordenados:
• $Q_1$: 25% abaixo · $Q_2$ = mediana · $Q_3$: 75% abaixo
• **Amplitude interquartil**: $AIQ=Q_3-Q_1$
• **Outliers**: abaixo de $Q_1-1{,}5\,AIQ$ ou acima de $Q_3+1{,}5\,AIQ$

O **boxplot** desenha caixa ($Q_1$ a $Q_3$), linha da mediana e "bigodes".`,
          visual: plot(
            {
              view: { xMin: 0, xMax: 22, yMin: -1, yMax: 3 },
              grid: false,
              render: () => (
                <>
                  <Seg x1={2} y1={1} x2={5} y2={1} color={C.p5} width={2} />
                  <RectW x={5} y={0.4} w={8} h={1.2} color={C.p5} opacity={0.35} />
                  <Seg x1={9} y1={0.4} x2={9} y2={1.6} color={C.gold} width={3} />
                  <Seg x1={13} y1={1} x2={18} y2={1} color={C.p5} width={2} />
                  <Pt x={21} y={1} color={C.danger} r={5} label="outlier" />
                  <Label x={5} y={1.9} text="Q1" anchor="middle" color={C.textMuted} />
                  <Label x={9} y={1.9} text="Md" anchor="middle" color={C.gold} />
                  <Label x={13} y={1.9} text="Q3" anchor="middle" color={C.textMuted} />
                </>
              ),
            },
            150,
          ),
        },
      ],
      exercises: [
        num(t`Dados ordenados: $2,\ 4,\ 5,\ 7,\ 8,\ 10,\ 12,\ 15$. Qual a mediana?`, 7.5),
        num(t`Se $Q_1=10$ e $Q_3=18$, qual a amplitude interquartil?`, 8),
        num(t`Com $Q_1=10$ e $Q_3=18$, acima de qual valor um dado é considerado outlier?`, 30, t`$18+1{,}5\cdot8=30$.`),
        mcq(t`O percentil 50 é igual a…`, ['a mediana', 'a média', 'a moda', '$Q_1$'], 0),
        tf(t`No boxplot, a caixa contém os 50% centrais dos dados.`, true),
      ],
    },
  ],
};

export const dispersao: UnitDef = {
  id: 'e-disp',
  title: 'Medidas de dispersão',
  subtitle: 'Amplitude, variância, desvio padrão e CV',
  icon: '↔️',
  source: 'Probabilidade e Estatística · Unidade IV — Medidas de dispersão',
  guide: t`Mesma média não significa mesmos dados. A variância mede o espalhamento em torno da média (média dos desvios ao quadrado); o desvio padrão volta à unidade original; o CV compara dispersões relativas.`,
  lessons: [
    {
      id: 'e-disp-var',
      title: 'Variância e desvio padrão',
      cards: [
        {
          title: 'A média das áreas dos quadrados',
          body: t`$$\sigma^2=\frac{\sum(x_i-\bar x)^2}{n}\qquad \sigma=\sqrt{\sigma^2}$$
Cada quadrado tem lado igual ao desvio $|x_i-\bar x|$. Arraste os pontos para espalhar ou juntar os dados:`,
          visual: deviationLab(),
          tip: t`**Amostra**: divida por $n-1$: $s^2=\frac{\sum(x_i-\bar x)^2}{n-1}$ (correção de Bessel).`,
        },
      ],
      exercises: [
        gen((rng) => {
          const base = randInt(rng, 2, 8);
          const d = [base - 2, base, base, base + 2];
          return num(t`Calcule a variância populacional de $${d.join(',\\ ')}$.`, varPop(d), t`Média $${base}$; desvios $-2,0,0,2$; $\sigma^2=\frac{4+0+0+4}{4}=2$.`);
        }),
        num(t`Se a variância é $25$, qual o desvio padrão?`, 5),
        num(t`Calcule a variância **amostral** de $2,\ 4,\ 6$.`, 4, t`Média 4; $\frac{4+0+4}{3-1}=4$.`),
        inter(t`Arraste os pontos para que o desvio padrão seja **zero**.`, 'plot', deviationLab().props, (v: any) => {
          if (!v) return false;
          const xs = Object.values(v.pts).map((p: any) => p.x as number);
          return varPop(xs) < 1e-9;
        }, 'todos os pontos no mesmo valor'),
        tf(t`Somar uma constante a todos os dados não altera o desvio padrão.`, true, t`Todos os desvios em relação à média continuam iguais.`),
        tf(t`Multiplicar todos os dados por 3 multiplica o desvio padrão por 9.`, false, t`O desvio padrão é multiplicado por 3 (a variância por 9).`),
      ],
    },
    {
      id: 'e-disp-cv',
      title: 'Amplitude e coeficiente de variação',
      cards: [
        {
          title: 'Comparando dispersões',
          body: t`• **Amplitude total**: máx − mín (simples, mas sensível a extremos)
• **Coeficiente de variação**: $$CV=\frac{\sigma}{\bar x}\cdot100\%$$
Sem unidade: permite comparar, por exemplo, a variabilidade de pesos (kg) e alturas (cm).

Regra prática: $CV<15\%$ baixa dispersão; $15\%$ a $30\%$ média; $>30\%$ alta.`,
        },
      ],
      exercises: [
        gen((rng) => {
          const m = pick(rng, [50, 80, 100, 200]);
          const s = pick(rng, [4, 8, 10, 20]);
          return num(t`Média $${m}$ e desvio padrão $${s}$. Qual o CV (%)?`, (100 * s) / m, undefined, { tol: 0.05, unit: '%' });
        }),
        num(t`Qual a amplitude total de $12,\ 7,\ 31,\ 18,\ 9$?`, 24),
        mcq(t`Turma A: média 70, σ = 7. Turma B: média 50, σ = 7. Qual é relativamente mais homogênea?`, ['A (CV = 10%)', 'B (CV = 14%)', 'são iguais', 'impossível comparar'], 0),
        tf(t`O coeficiente de variação tem a mesma unidade dos dados.`, false, t`É adimensional (porcentagem).`),
      ],
    },
  ],
};
