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

const HEIGHTS = table(['classe (cm)', '$f_i$', '$fr_i$', '$F_i$'], [
  ['150 ⊢ 160', '4', '10%', '4'],
  ['160 ⊢ 170', '12', '30%', '16'],
  ['170 ⊢ 180', '16', '40%', '32'],
  ['180 ⊢ 190', '8', '20%', '40'],
]);

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
      parts: [
        {
          card: {
            title: 'Quem estamos estudando?',
            body: t`• **População**: todos os elementos de interesse (ex.: todos os alunos de Engenharia do Brasil)
• **Amostra**: subconjunto observado (ex.: 500 alunos sorteados)
• **Parâmetro**: medida da população ($\mu$, $\sigma$) · **Estatística**: medida da amostra ($\bar x$, $s$)

**Estatística descritiva** resume os dados; **inferencial** tira conclusões sobre a população a partir da amostra.`,
          },
          exercises: [
            mcqS(t`Uma pesquisa entrevistou 1.200 eleitores de um país. Os 1.200 eleitores são:`, 'a amostra', ['a população', 'o parâmetro', 'a variável'], t`São uma parte dos eleitores, escolhida para ser observada.`),
            mcq(t`A média de idade de **todos** os funcionários de uma empresa é um…`, ['parâmetro', 'estatística amostral', 'estimador viesado', 'erro amostral'], 0, t`Medida calculada sobre a população inteira.`),
            mcq(t`Qual símbolo costuma indicar a **média da amostra**?`, ['$\\bar x$', '$\\mu$', '$\\sigma$', '$N$'], 0, t`$\mu$ é a média da população.`),
            tf(t`Um censo observa todos os elementos da população.`, true, t`É o oposto de uma amostragem.`),
            mcq(t`"Com base em 300 peças testadas, estima-se que 2% da produção tem defeito." Isso é estatística…`, ['inferencial', 'descritiva', 'censitária', 'nominal'], 0, t`Tira conclusão sobre a população a partir da amostra.`),
            mcq(t`Montar uma tabela com a média e o desvio das notas de uma turma é estatística…`, ['descritiva', 'inferencial', 'probabilística', 'experimental'], 0, t`Só resume os dados observados.`),
            tf(t`Um parâmetro populacional costuma ser desconhecido e estimado por uma estatística amostral.`, true, t`Medir a população inteira geralmente é caro ou impossível.`),
          ],
        },
        {
          card: {
            title: 'Tipos de variáveis',
            body: t`• **Qualitativa nominal**: categorias sem ordem (cor, curso)
• **Qualitativa ordinal**: categorias com ordem (escolaridade, avaliação ruim/bom/ótimo)
• **Quantitativa discreta**: contagens (nº de filhos, peças defeituosas)
• **Quantitativa contínua**: medidas (altura, tempo, temperatura)`,
          },
          exercises: [
            match(t`Classifique cada variável:`, [
              ['Cor dos olhos', 'qualitativa nominal'],
              ['Nível de satisfação (baixo/médio/alto)', 'qualitativa ordinal'],
              ['Número de irmãos', 'quantitativa discreta'],
              ['Altura em cm', 'quantitativa contínua'],
            ]),
            tf(t`"Tempo de reação em milissegundos" é uma variável quantitativa contínua.`, true, t`É uma medida que pode assumir qualquer valor num intervalo.`),
            multi(t`Quais variáveis são **quantitativas**?`, ['peso', 'CEP', 'número de acidentes', 'time de futebol'], [0, 2], t`O CEP é um rótulo (nominal), apesar de ter números.`),
            gen((rng) => {
              const [v, k, why] = pick(rng, [
                ['Marca do carro', 0, 'categorias sem ordem'],
                ['Classe social (A, B, C, D)', 1, 'categorias com ordem'],
                ['Número de defeitos por lote', 2, 'contagem'],
                ['Temperatura do motor', 3, 'medida'],
                ['Posição de chegada numa corrida (1º, 2º, …)', 1, 'categorias ordenadas'],
                ['Quantidade de alunos na sala', 2, 'contagem'],
                ['Tipo sanguíneo', 0, 'categorias sem ordem'],
                ['Tempo de entrega (em horas)', 3, 'medida'],
              ] as const);
              return mcq(t`Como se classifica a variável "${v}"?`, ['qualitativa nominal', 'qualitativa ordinal', 'quantitativa discreta', 'quantitativa contínua'], k, t`É ${why}.`);
            }),
            mcq(t`A principal diferença entre discreta e contínua é que a discreta…`, ['vem de contagens (valores separados)', 'tem números maiores', 'não tem ordem', 'não pode ser medida'], 0, t`Contínua vem de medições.`),
            tf(t`Numa variável ordinal, faz sentido dizer que uma categoria é "maior" que outra.`, true, t`Ex.: "ótimo" está acima de "bom".`),
            mcq(t`O número da camisa de um jogador é uma variável…`, ['qualitativa nominal', 'quantitativa discreta', 'quantitativa contínua', 'qualitativa ordinal'], 0, t`É só um rótulo: não faz sentido somar números de camisa.`),
          ],
        },
      ],
    },
    {
      id: 'e-conc-amost',
      title: 'Técnicas de amostragem',
      parts: [
        {
          card: {
            title: 'Como sortear bem',
            body: t`• **Aleatória simples**: todos têm a mesma chance (sorteio)
• **Sistemática**: um a cada $k$ elementos de uma lista
• **Estratificada**: divide a população em estratos (ex.: curso) e sorteia em cada um, proporcionalmente
• **Por conglomerados**: sorteia grupos inteiros (ex.: turmas)`,
          },
          exercises: [
            match(t`Ligue a técnica à descrição:`, [
              ['Aleatória simples', 'sorteio entre todos'],
              ['Sistemática', 'um a cada k da lista'],
              ['Estratificada', 'sorteio dentro de cada grupo'],
              ['Conglomerados', 'sorteia grupos inteiros'],
            ]),
            num(t`Numa amostragem sistemática de uma lista de 1.000 nomes para obter 50, a cada quantos nomes escolhemos um?`, 20, t`$k=\frac{1000}{50}=20$.`),
            gen((rng) => {
              const N = pick(rng, [600, 800, 1200, 2000]);
              const n = pick(rng, [20, 40, 50, 100]);
              return num(t`Numa amostragem sistemática, para tirar $${n}$ elementos de uma lista com $${N}$, qual o passo $k$?`, N / n, t`$k=\frac{${N}}{${n}}=${N / n}$.`);
            }),
            mcq(t`Para estimar a altura média dos alunos de uma universidade com cursos muito diferentes em tamanho, a melhor técnica é…`, ['estratificada por curso', 'conveniência na cantina', 'entrevistar só a Engenharia', 'perguntar nas redes sociais'], 0, t`Cada curso fica representado na proporção certa.`),
            gen((rng) => {
              const a = pick(rng, [200, 300, 400]);
              const b = pick(rng, [600, 700, 800]);
              const n = pick(rng, [50, 100]);
              const tot = a + b;
              return num(t`Uma escola tem $${a}$ alunos no turno da manhã e $${b}$ no da noite. Numa amostra estratificada proporcional de $${n}$ alunos, quantos serão da manhã?`, (n * a) / tot, t`$${n}\cdot\frac{${a}}{${tot}}=${fmt((n * a) / tot)}$.`, { tol: 0.5 });
            }),
            mcq(t`Sortear 5 turmas inteiras de uma escola e entrevistar todos os alunos delas é amostragem…`, ['por conglomerados', 'estratificada', 'sistemática', 'aleatória simples'], 0, t`Os grupos (turmas) é que são sorteados.`),
            tf(t`Na amostragem aleatória simples, todos os elementos têm a mesma chance de serem escolhidos.`, true, t`É a definição.`),
          ],
        },
        {
          card: {
            title: 'Viés e tamanho da amostra',
            body: t`Amostras por **conveniência** (quem estiver por perto) ou por **autosseleção** (quem quiser responder) costumam ter **viés**: representam mal a população.

Aumentar o tamanho da amostra **reduz o erro aleatório**, mas **não corrige** o viés.`,
            tip: t`Uma amostra pequena e bem sorteada vale mais do que uma enorme e enviesada.`,
          },
          exercises: [
            tf(t`Uma enquete em que só responde quem quer (autosseleção) tende a ser representativa.`, false, t`Quem se voluntaria costuma ter opinião mais forte: há viés de autosseleção.`),
            tf(t`Aumentar muito o tamanho de uma amostra enviesada elimina o viés.`, false, t`O viés vem do método de escolha; mais dados do mesmo jeito só repetem o erro.`),
            mcq(t`Pesquisar a opinião sobre o transporte público entrevistando só pessoas num shopping é um exemplo de…`, ['amostra por conveniência (com viés)', 'amostragem estratificada', 'censo', 'amostragem sistemática'], 0, t`Quem está no shopping não representa todos os usuários.`),
            mcq(t`O que acontece com o erro aleatório de uma estimativa quando a amostra aumenta (bem sorteada)?`, ['diminui', 'aumenta', 'não muda', 'vira viés'], 0, t`Mais dados bem escolhidos, estimativa mais estável.`),
            mcq(t`Uma pesquisa por telefone fixo, nos dias de hoje, tende a sub-representar…`, ['pessoas mais jovens', 'pessoas idosas', 'ninguém', 'quem tem telefone fixo'], 0, t`O meio de coleta também pode introduzir viés.`),
            tf(t`Sortear aleatoriamente os participantes é a principal defesa contra o viés de seleção.`, true, t`O sorteio não favorece nenhum grupo.`),
            mcq(t`Qual pesquisa é mais confiável?`, ['300 pessoas sorteadas aleatoriamente', '30 000 votos numa enquete online aberta', '5 000 seguidores de um influenciador', '1 000 pessoas na saída de um estádio'], 0, t`Pequena, mas sem viés de seleção.`),
          ],
        },
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
      parts: [
        {
          card: {
            title: 'Absoluta, relativa e acumulada',
            body: t`• $f_i$: quantas vezes o valor/classe aparece
• $fr_i=\frac{f_i}{n}$: proporção (soma 1, ou 100%)
• $F_i$: frequência **acumulada** até a classe $i$`,
            visual: HEIGHTS,
          },
          exercises: [
            tf(t`A soma das frequências relativas é sempre 100%.`, true, t`Somam $\frac{n}{n}=1$.`),
            num(t`Pela tabela do card (alturas), quantos alunos têm menos de 170 cm?`, 16, t`$F_2=4+12=16$.`),
            gen((rng) => {
              const f = [randInt(rng, 2, 10), randInt(rng, 2, 10), randInt(rng, 2, 10), randInt(rng, 2, 10)];
              const n = f.reduce((a, b) => a + b, 0);
              const i = randInt(rng, 0, 3);
              return num(t`Frequências absolutas: $${f.join(',\\ ')}$. Qual a frequência relativa (em %) da classe ${i + 1}?`, (100 * f[i]) / n, t`$\frac{${f[i]}}{${n}}=${fmt((100 * f[i]) / n, 2)}\%$.`, { tol: 0.06, unit: '%' });
            }),
            gen((rng) => {
              const f = [randInt(rng, 2, 10), randInt(rng, 2, 10), randInt(rng, 2, 10), randInt(rng, 2, 10)];
              return num(t`Frequências absolutas: $${f.join(',\\ ')}$. Qual a frequência acumulada $F_3$?`, f[0] + f[1] + f[2], t`$${f[0]}+${f[1]}+${f[2]}=${f[0] + f[1] + f[2]}$.`);
            }),
            num(t`Pela tabela do card, qual a frequência relativa (em %) de alunos com **pelo menos** 170 cm?`, 60, t`$40\%+20\%=60\%$.`, { unit: '%' }),
            gen((rng) => {
              const n = pick(rng, [20, 40, 50, 80]);
              const p = pick(rng, [10, 25, 30, 45]);
              return num(t`Numa amostra de $${n}$ peças, $${p}\%$ estão na classe A. Qual a frequência **absoluta** da classe A?`, (n * p) / 100, t`$${fmt(p / 100)}\cdot${n}=${fmt((n * p) / 100)}$.`);
            }),
            num(t`A última frequência acumulada $F_k$ de uma tabela com $n=75$ dados vale quanto?`, 75, t`Ao final, todos os dados foram contados.`),
          ],
        },
        {
          card: {
            title: 'Classes e Sturges',
            body: t`Para dados contínuos, agrupe em **classes** de mesma largura:

• número de classes (regra de **Sturges**): $k\approx1+3{,}3\log n$
• amplitude da classe: $h=\frac{\text{máx}-\text{mín}}{k}$
• **ponto médio** da classe: média dos limites

A notação $160\vdash170$ inclui $160$ e exclui $170$.`,
            visual: HEIGHTS,
          },
          exercises: [
            num(t`Pela regra de Sturges, quantas classes usar para $n=100$ dados? (arredonde)`, 8, t`$1+3{,}3\cdot2=7{,}6\approx8$.`),
            gen((rng) => {
              const lo = pick(rng, [10, 20, 150, 40]);
              const h = pick(rng, [5, 10, 20]);
              return num(t`Qual o ponto médio da classe $${lo}\vdash${lo + h}$?`, lo + h / 2, t`$\frac{${lo}+${lo + h}}{2}=${fmt(lo + h / 2)}$.`);
            }),
            tf(t`Na classe $160\vdash170$, o valor $170$ pertence à classe.`, false, t`O símbolo $\vdash$ inclui só o limite da esquerda.`),
            gen((rng) => {
              const min = pick(rng, [10, 20, 50]);
              const k = pick(rng, [4, 5, 8]);
              const h = pick(rng, [5, 10]);
              return num(t`Dados variam de $${min}$ a $${min + k * h}$ e queremos $${k}$ classes. Qual a amplitude de cada classe?`, h, t`$\frac{${min + k * h}-${min}}{${k}}=${h}$.`);
            }),
            num(t`Pela regra de Sturges, quantas classes usar para $n=1000$ dados? (arredonde)`, 11, t`$1+3{,}3\cdot3=10{,}9\approx11$.`),
            mcq(t`Classes demais num histograma com poucos dados deixam o gráfico…`, ['cheio de buracos e barras baixas', 'mais preciso sempre', 'igual', 'com uma só barra'], 0, t`Por isso usamos regras como a de Sturges.`),
            num(t`Na tabela do card, qual o ponto médio da classe modal (a de maior frequência)?`, 175, t`Classe $170\vdash180$, ponto médio $175$.`),
          ],
        },
      ],
    },
    {
      id: 'e-tab-graf',
      title: 'Histogramas e gráficos',
      parts: [
        {
          card: {
            title: 'Monte o histograma',
            body: t`No histograma, cada barra é uma **classe** (sem espaço entre elas) e a altura é a frequência. Arraste as barras para representar a tabela de alturas ($4,\ 12,\ 16,\ 8$):`,
            visual: { name: 'bars', props: { labels: ['150', '160', '170', '180'], values: [2, 5, 8, 3], max: 20 } },
          },
          exercises: [
            inter(t`Arraste as barras para formar o histograma da tabela: $4,\ 12,\ 16,\ 8$.`, 'bars', { labels: ['150', '160', '170', '180'], values: [2, 5, 8, 3], max: 20 }, (v: number[]) => Array.isArray(v) && v.join(',') === '4,12,16,8', 'alturas 4, 12, 16, 8'),
            tf(t`Num histograma de variável contínua, as barras ficam separadas por espaços.`, false, t`As classes são contíguas, então as barras se encostam.`),
            mcq(t`Num histograma com classes de mesma largura, a classe modal é…`, ['a de barra mais alta', 'a primeira', 'a do meio', 'a última'], 0, t`Moda = maior frequência.`),
            inter(t`Monte um histograma **simétrico** com pico no meio: alturas $3,\ 9,\ 9,\ 3$.`, 'bars', { labels: ['1', '2', '3', '4'], values: [1, 1, 1, 1], max: 20 }, (v: number[]) => Array.isArray(v) && v.join(',') === '3,9,9,3', 'alturas 3, 9, 9, 3'),
            mcq(t`Um histograma com uma "cauda" longa para a direita é chamado de…`, ['assimétrico à direita (positivo)', 'simétrico', 'assimétrico à esquerda', 'bimodal'], 0, t`Poucos valores grandes puxam a cauda para a direita (ex.: salários).`),
            mcq(t`Um histograma com **dois** picos sugere…`, ['dois grupos misturados nos dados (bimodal)', 'erro de digitação', 'dados simétricos', 'que não há moda'], 0, t`Ex.: alturas de homens e mulheres juntas.`),
            tf(t`No histograma, a área de cada barra é proporcional à frequência da classe (com larguras iguais).`, true, t`Com larguras iguais, área e altura contam a mesma história.`),
          ],
        },
        {
          card: {
            title: 'Qual gráfico usar?',
            body: t`• **Barras / colunas**: comparar categorias
• **Setores (pizza)**: partes de um todo (poucas categorias)
• **Histograma**: distribuição de variável contínua
• **Linhas**: evolução no tempo
• **Dispersão**: relação entre duas variáveis quantitativas
• **Boxplot**: resumo (quartis e outliers)`,
          },
          exercises: [
            match(t`Ligue a situação ao gráfico mais adequado:`, [
              ['Evolução mensal das vendas', 'linhas'],
              ['Participação de mercado de 4 marcas', 'setores'],
              ['Distribuição de pesos de peças', 'histograma'],
              ['Altura × peso de 50 pessoas', 'dispersão'],
            ]),
            mcq(t`Para comparar o número de alunos em 6 cursos, o gráfico mais adequado é…`, ['barras', 'linhas', 'dispersão', 'histograma'], 0, t`Categorias lado a lado.`),
            tf(t`Um gráfico de setores com 15 fatias é fácil de ler.`, false, t`Setores funcionam bem com poucas categorias.`),
            mcq(t`Para ver se há relação entre horas de estudo e nota, use…`, ['diagrama de dispersão', 'setores', 'barras empilhadas', 'pictograma'], 0, t`Duas variáveis quantitativas: dispersão.`),
            gen((rng) => {
              const total = 360;
              const p = pick(rng, [10, 20, 25, 30, 50]);
              return num(t`Num gráfico de setores, uma categoria com $${p}\%$ do total ocupa quantos graus?`, (total * p) / 100, t`$${fmt(p / 100)}\cdot360^\circ=${(total * p) / 100}^\circ$.`, { unit: '°' });
            }),
            mcq(t`Qual gráfico mostra bem quartis e valores discrepantes (outliers)?`, ['boxplot', 'setores', 'linhas', 'pictograma'], 0, t`É a "caixa com bigodes".`),
            tf(t`Começar o eixo vertical de um gráfico de barras longe do zero pode exagerar diferenças.`, true, t`Barras pequenas parecem muito diferentes: cuidado com gráficos enganosos.`),
          ],
        },
      ],
    },
  ],
};

const BOX = () =>
  plot(
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
  );
const list = (d: number[]) => d.map((v) => fmt(v)).join(',\\ ');

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
      parts: [
        {
          card: {
            title: 'A média',
            body: t`$$\bar x=\frac{\sum x_i}{n}$$
É o **ponto de equilíbrio** dos dados: a soma dos desvios $x_i-\bar x$ é sempre zero.

**Média ponderada**: $\bar x=\frac{\sum p_ix_i}{\sum p_i}$ — ex.: notas com pesos diferentes.`,
          },
          exercises: [
            gen((rng) => {
              const d = Array.from({ length: 5 }, () => randInt(rng, 1, 20));
              return num(t`Calcule a média de $${list(d)}$.`, mean(d), t`$\frac{${d.reduce((a, b) => a + b, 0)}}{5}=${fmt(mean(d), 2)}$.`, { tol: 0.005 });
            }),
            tf(t`A soma dos desvios em relação à média é sempre zero.`, true, t`$\sum(x_i-\bar x)=\sum x_i-n\bar x=0$.`),
            num(t`Provas com pesos 2, 3 e 5 tiveram notas 6, 7 e 8. Qual a média ponderada?`, 7.3, t`$\frac{12+21+40}{10}=7{,}3$.`),
            gen((rng) => {
              const m = randInt(rng, 5, 9);
              const n = randInt(rng, 3, 6);
              const target = m + 1;
              return num(t`A média de $${n}$ provas foi $${m}$. Que nota na próxima prova faz a média subir para $${target}$?`, target * (n + 1) - m * n, t`Soma necessária: $${target}\cdot${n + 1}=${target * (n + 1)}$; já tem $${m * n}$; falta $${target * (n + 1) - m * n}$.`);
            }),
            gen((rng) => {
              const d = Array.from({ length: 4 }, () => randInt(rng, 2, 9));
              const k = randInt(rng, 2, 10);
              return num(t`A média de $${list(d)}$ é $${fmt(mean(d))}$. Somando $${k}$ a cada valor, qual a nova média?`, mean(d) + k, t`A média também sobe $${k}$: $${fmt(mean(d) + k)}$.`);
            }),
            mcq(t`Numa turma, 10 alunos tiraram 8 e 30 alunos tiraram 6. Qual a média da turma?`, ['$6{,}5$', '$7$', '$7{,}5$', '$6$'], 0, t`$\frac{10\cdot8+30\cdot6}{40}=\frac{260}{40}=6{,}5$.`),
            num(t`Um carro faz 60 km a 60 km/h e depois 60 km a 120 km/h. Qual a velocidade média no trajeto todo (km/h)?`, 80, t`Tempo: $1+0{,}5=1{,}5$ h para $120$ km: $80$ km/h (e não $90$!).`, { unit: 'km/h' }),
          ],
        },
        {
          card: {
            title: 'Mediana e moda',
            body: t`• **Mediana**: ordene os dados; é o valor central (ou a média dos dois centrais)
• **Moda**: o valor mais frequente (pode haver mais de uma, ou nenhuma)

Arraste o ponto vermelho para longe e veja a média ser "puxada" enquanto a mediana quase não muda:`,
            visual: meanMedianLab(),
          },
          exercises: [
            gen((rng) => {
              const n = pick(rng, [5, 6, 7]);
              const d = shuffle(rng, Array.from({ length: n }, () => randInt(rng, 1, 30)));
              return num(t`Qual a mediana de $${list(d)}$?`, median(d), t`Ordenando: $${list([...d].sort((a, b) => a - b))}$ ⟹ mediana $${fmt(median(d))}$.`);
            }),
            num(t`Qual a moda de $3,\ 7,\ 7,\ 2,\ 9,\ 7,\ 3$?`, 7, t`O $7$ aparece três vezes.`),
            tf(t`Para descrever salários (com poucos valores muito altos), a mediana costuma ser melhor que a média.`, true, t`A mediana não é puxada pelos extremos.`),
            inter(t`Arraste o ponto vermelho para que a média fique **maior que 6** com a mediana ainda igual a 3.`, 'plot', meanMedianLab().props, (v: any) => {
              if (!v) return false;
              const arr = [2, 3, 3, 5, v.pts.X.x];
              return mean(arr) > 6 && median(arr) === 3;
            }, t`valor extremo, ex.: $x=18$`),
            mcq(t`Qual medida faz sentido para a variável "cor preferida"?`, ['moda', 'média', 'mediana', 'desvio padrão'], 0, t`Para dados nominais, só a moda tem sentido.`),
            gen((rng) => {
              const d = [randInt(rng, 1, 5), randInt(rng, 6, 9), randInt(rng, 10, 14), randInt(rng, 15, 20)];
              return num(t`Qual a mediana de $${list(d)}$ (já ordenados)?`, (d[1] + d[2]) / 2, t`Número par de dados: média dos dois centrais, $\frac{${d[1]}+${d[2]}}{2}=${fmt((d[1] + d[2]) / 2)}$.`);
            }),
            mcq(t`Os dados $1,\ 2,\ 2,\ 3,\ 3,\ 4$ têm…`, ['duas modas (bimodal): 2 e 3', 'moda 2', 'moda 3', 'nenhuma moda'], 0, t`$2$ e $3$ aparecem duas vezes cada.`),
          ],
        },
      ],
    },
    {
      id: 'e-pos-quart',
      title: 'Quartis, percentis e boxplot',
      parts: [
        {
          card: {
            title: 'Dividindo em quatro',
            body: t`Com os dados **ordenados**:
• $Q_1$: 25% dos dados abaixo · $Q_2$ = mediana · $Q_3$: 75% abaixo
• **Percentil** $p$: $p\%$ dos dados abaixo dele
• **Amplitude interquartil**: $AIQ=Q_3-Q_1$`,
            tip: t`Um jeito prático: $Q_1$ é a mediana da metade de baixo e $Q_3$ é a mediana da metade de cima.`,
          },
          exercises: [
            mcq(t`O percentil 50 é igual a…`, ['a mediana', 'a média', 'a moda', '$Q_1$'], 0, t`Metade abaixo, metade acima.`),
            num(t`Dados ordenados: $2,\ 4,\ 5,\ 7,\ 8,\ 10,\ 12,\ 15$. Qual a mediana?`, 7.5, t`$\frac{7+8}{2}=7{,}5$.`),
            num(t`Nesses mesmos dados, qual é $Q_1$ (mediana da metade de baixo $2,\ 4,\ 5,\ 7$)?`, 4.5, t`$\frac{4+5}{2}=4{,}5$.`),
            num(t`Se $Q_1=10$ e $Q_3=18$, qual a amplitude interquartil?`, 8, t`$18-10=8$.`),
            gen((rng) => {
              const q1 = randInt(rng, 5, 30);
              const a = randInt(rng, 3, 15);
              return num(t`$Q_1=${q1}$ e $AIQ=${a}$. Quanto vale $Q_3$?`, q1 + a, t`$Q_3=Q_1+AIQ=${q1 + a}$.`);
            }),
            tf(t`Se um aluno está no percentil 90, ele tirou nota 90.`, false, t`Significa que 90% dos alunos tiraram nota **menor ou igual** à dele.`),
            num(t`Dados ordenados: $3,\ 5,\ 6,\ 8,\ 9,\ 11,\ 14$. Qual é $Q_3$ (mediana de $9,\ 11,\ 14$)?`, 11, t`Metade de cima (sem a mediana $8$): $9,\ 11,\ 14$, mediana $11$.`),
          ],
        },
        {
          card: {
            title: 'Boxplot e outliers',
            body: t`O **boxplot** desenha uma caixa de $Q_1$ a $Q_3$, uma linha na mediana e "bigodes" até os dados não discrepantes.

**Outliers**: abaixo de $Q_1-1{,}5\,AIQ$ ou acima de $Q_3+1{,}5\,AIQ$.`,
            visual: BOX(),
          },
          exercises: [
            tf(t`No boxplot, a caixa contém os 50% centrais dos dados.`, true, t`De $Q_1$ (25%) a $Q_3$ (75%).`),
            num(t`Com $Q_1=10$ e $Q_3=18$, acima de qual valor um dado é considerado outlier?`, 30, t`$18+1{,}5\cdot8=30$.`),
            gen((rng) => {
              const q1 = randInt(rng, 20, 40);
              const a = 2 * randInt(rng, 2, 8);
              return num(t`Com $Q_1=${q1}$ e $Q_3=${q1 + a}$, abaixo de qual valor um dado é outlier?`, q1 - 1.5 * a, t`$${q1}-1{,}5\cdot${a}=${fmt(q1 - 1.5 * a)}$.`);
            }),
            gen((rng) => {
              const q1 = randInt(rng, 10, 20);
              const a = 2 * randInt(rng, 2, 5);
              const x = q1 + a + 1.5 * a + pick(rng, [-3, 2, 5]);
              const out = x > q1 + a + 1.5 * a;
              return tf(t`Com $Q_1=${q1}$ e $Q_3=${q1 + a}$, o valor $${fmt(x)}$ é um outlier.`, out, t`Limite superior: $${q1 + a}+1{,}5\cdot${a}=${fmt(q1 + a + 1.5 * a)}$.`);
            }),
            mcq(t`Num boxplot, a mediana fica bem perto de $Q_1$ e o bigode direito é longo. A distribuição é…`, ['assimétrica à direita', 'simétrica', 'assimétrica à esquerda', 'uniforme'], 0, t`Os dados se espalham mais para os valores altos.`),
            mcq(t`Na figura do card, a linha dourada representa…`, ['a mediana', 'a média', '$Q_1$', 'o outlier'], 0, t`É a linha dentro da caixa.`),
            num(t`Dados: $Q_1=4$, mediana $6$, $Q_3=9$, mínimo $1$, máximo $30$. Qual o limite para outliers superiores?`, 16.5, t`$AIQ=5$; $9+7{,}5=16{,}5$. O $30$ é outlier.`),
          ],
        },
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
      parts: [
        {
          card: {
            title: 'A média das áreas dos quadrados',
            body: t`$$\sigma^2=\frac{\sum(x_i-\bar x)^2}{n}\qquad \sigma=\sqrt{\sigma^2}$$
Cada quadrado tem lado igual ao desvio $|x_i-\bar x|$. Arraste os pontos para espalhar ou juntar os dados:`,
            visual: deviationLab(),
          },
          exercises: [
            num(t`Se a variância é $25$, qual o desvio padrão?`, 5, t`$\sqrt{25}=5$.`),
            gen((rng) => {
              const base = randInt(rng, 2, 8);
              const k = randInt(rng, 1, 3);
              const d = [base - k, base, base, base + k];
              return num(t`Calcule a variância populacional de $${list(d)}$.`, varPop(d), t`Média $${base}$; desvios $-${k},\ 0,\ 0,\ ${k}$; $\sigma^2=\frac{${2 * k * k}}{4}=${fmt(varPop(d))}$.`);
            }),
            inter(t`Arraste os pontos para que o desvio padrão seja **zero**.`, 'plot', deviationLab().props, (v: any) => {
              if (!v) return false;
              const xs = Object.values(v.pts).map((p: any) => p.x as number);
              return varPop(xs) < 1e-9;
            }, 'todos os pontos no mesmo valor', t`Sem desvios, sem dispersão.`),
            mcq(t`Por que o desvio padrão costuma ser preferido à variância para interpretar?`, ['está na mesma unidade dos dados', 'é sempre maior', 'não depende da média', 'é mais fácil de calcular'], 0, t`A variância fica em "unidade ao quadrado".`),
            gen((rng) => {
              const m = randInt(rng, 3, 9);
              const d = [m - 3, m - 1, m + 1, m + 3];
              return num(t`Qual o desvio padrão populacional de $${list(d)}$? (2 casas)`, Math.sqrt(varPop(d)), t`Média $${m}$; $\sigma^2=\frac{9+1+1+9}{4}=5$; $\sigma=\sqrt5\approx2{,}24$.`, { tol: 0.01 });
            }),
            tf(t`Dois conjuntos com a mesma média sempre têm o mesmo desvio padrão.`, false, t`$\{5,\,5\}$ e $\{0,\,10\}$ têm média 5 e dispersões bem diferentes.`),
            num(t`Calcule a variância populacional de $1,\ 2,\ 3,\ 4,\ 5$.`, 2, t`Média 3; $\frac{4+1+0+1+4}{5}=2$.`),
          ],
        },
        {
          card: {
            title: 'Amostra e propriedades',
            body: t`Para uma **amostra**, divida por $n-1$ (correção de Bessel):
$$s^2=\frac{\sum(x_i-\bar x)^2}{n-1}$$

Propriedades:
• somar uma constante a todos os dados **não** muda o desvio padrão
• multiplicar todos por $k$ multiplica o desvio padrão por $|k|$ (e a variância por $k^2$)`,
          },
          exercises: [
            num(t`Calcule a variância **amostral** de $2,\ 4,\ 6$.`, 4, t`Média 4; $\frac{4+0+4}{3-1}=4$.`),
            tf(t`Somar uma constante a todos os dados não altera o desvio padrão.`, true, t`Todos os desvios em relação à média continuam iguais.`),
            tf(t`Multiplicar todos os dados por 3 multiplica o desvio padrão por 9.`, false, t`O desvio padrão é multiplicado por 3 (a variância por 9).`),
            gen((rng) => {
              const s = randInt(rng, 2, 8);
              const k = pick(rng, [2, 3, 10]);
              return num(t`Um conjunto tem desvio padrão $${s}$. Multiplicando todos os valores por $${k}$, qual o novo desvio padrão?`, s * k, t`$${s}\cdot${k}=${s * k}$.`);
            }),
            gen((rng) => {
              const v = randInt(rng, 2, 9);
              const c = randInt(rng, 5, 50);
              return num(t`Um conjunto tem variância $${v}$. Somando $${c}$ a todos os valores, qual a nova variância?`, v, t`Deslocar não espalha: continua $${v}$.`);
            }),
            gen((rng) => {
              const m = randInt(rng, 3, 9);
              const d = [m - 2, m, m + 2];
              return num(t`Calcule a variância **amostral** de $${list(d)}$.`, 4, t`Média $${m}$; $\frac{4+0+4}{3-1}=4$.`);
            }),
            mcq(t`Para uma mesma amostra, a variância amostral ($n-1$) é…`, ['um pouco maior que a populacional ($n$)', 'menor', 'igual', 'sempre o dobro'], 0, t`Dividir por $n-1$ dá um número maior.`),
          ],
        },
      ],
    },
    {
      id: 'e-disp-cv',
      title: 'Amplitude e coeficiente de variação',
      parts: [
        {
          card: {
            title: 'Amplitude e CV',
            body: t`• **Amplitude total**: máx − mín (simples, mas sensível a extremos)
• **Coeficiente de variação**: $$CV=\frac{\sigma}{\bar x}\cdot100\%$$
O CV é **sem unidade**: dá para comparar a variabilidade de pesos (kg) e alturas (cm).`,
          },
          exercises: [
            num(t`Qual a amplitude total de $12,\ 7,\ 31,\ 18,\ 9$?`, 24, t`$31-7=24$.`),
            gen((rng) => {
              const m = pick(rng, [50, 80, 100, 200]);
              const s = pick(rng, [4, 8, 10, 20]);
              return num(t`Média $${m}$ e desvio padrão $${s}$. Qual o CV (%)?`, (100 * s) / m, t`$\frac{${s}}{${m}}\cdot100=${fmt((100 * s) / m, 2)}\%$.`, { tol: 0.05, unit: '%' });
            }),
            tf(t`O coeficiente de variação tem a mesma unidade dos dados.`, false, t`É adimensional (porcentagem).`),
            gen((rng) => {
              const d = Array.from({ length: 6 }, () => randInt(rng, 1, 40));
              return num(t`Qual a amplitude total de $${list(d)}$?`, Math.max(...d) - Math.min(...d), t`$${Math.max(...d)}-${Math.min(...d)}=${Math.max(...d) - Math.min(...d)}$.`);
            }),
            mcq(t`Por que a amplitude total é pouco confiável?`, ['depende só dos dois valores extremos', 'é difícil de calcular', 'não tem unidade', 'é sempre zero'], 0, t`Um único valor extremo muda tudo.`),
            gen((rng) => {
              const cv = pick(rng, [10, 20, 25]);
              const m = pick(rng, [40, 60, 80]);
              return num(t`Um processo tem média $${m}$ e CV de $${cv}\%$. Qual o desvio padrão?`, (cv / 100) * m, t`$\sigma=${fmt(cv / 100)}\cdot${m}=${fmt((cv / 100) * m)}$.`);
            }),
            num(t`Média $40$ kg e desvio padrão $6$ kg. Qual o CV (%)?`, 15, t`$\frac{6}{40}=15\%$.`, { unit: '%' }),
          ],
        },
        {
          card: {
            title: 'Comparando dispersões',
            body: t`Para comparar grupos com **médias diferentes** (ou unidades diferentes), use o CV, não o desvio padrão.

Regra prática: $CV<15\%$ baixa dispersão; $15\%$ a $30\%$ média; $>30\%$ alta.`,
          },
          exercises: [
            mcq(t`Turma A: média 70, σ = 7. Turma B: média 50, σ = 7. Qual é relativamente mais homogênea?`, ['A (CV = 10%)', 'B (CV = 14%)', 'são iguais', 'impossível comparar'], 0, t`Mesmo desvio, mas sobre uma média maior.`),
            gen((rng) => {
              const cv = pick(rng, [8, 12, 20, 25, 35, 50]);
              const k = cv < 15 ? 0 : cv <= 30 ? 1 : 2;
              return mcq(t`Um conjunto tem CV de $${cv}\%$. Pela regra prática, a dispersão é…`, ['baixa', 'média', 'alta'], k, t`Faixas: abaixo de 15% baixa; 15–30% média; acima de 30% alta.`);
            }),
            tf(t`Para comparar a variabilidade de pesos (kg) com a de alturas (cm), o desvio padrão é suficiente.`, false, t`Unidades diferentes: use o CV.`),
            mcq(t`Máquina X: média 100 mm, σ = 2 mm. Máquina Y: média 10 mm, σ = 0,5 mm. Qual é mais precisa relativamente?`, ['X (CV = 2%)', 'Y (CV = 5%)', 'iguais', 'não dá para saber'], 0, t`$\frac{2}{100}=2\%$ contra $\frac{0{,}5}{10}=5\%$.`),
            gen((rng) => {
              const [m1, s1, m2, s2] = pick(rng, [[200, 20, 50, 10], [80, 8, 40, 2], [150, 30, 60, 6]] as const);
              const c1 = (100 * s1) / m1;
              const c2 = (100 * s2) / m2;
              return mcq(t`Grupo 1: média $${m1}$, σ $=${s1}$. Grupo 2: média $${m2}$, σ $=${s2}$. Qual tem **maior** variabilidade relativa?`, ['grupo 1', 'grupo 2', 'iguais'], c1 > c2 ? 0 : c1 < c2 ? 1 : 2, t`CVs: $${fmt(c1)}\%$ e $${fmt(c2)}\%$.`);
            }),
            tf(t`Se dois grupos têm a mesma média, comparar o desvio padrão ou o CV dá a mesma conclusão.`, true, t`Com médias iguais, o CV é proporcional ao desvio padrão.`),
            num(t`Notas com média $6$ e CV de $50\%$: qual o desvio padrão?`, 3, t`$0{,}5\cdot6=3$: dispersão alta.`),
          ],
        },
      ],
    },
  ],
};
