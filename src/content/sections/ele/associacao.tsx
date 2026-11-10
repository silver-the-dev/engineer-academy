import type { Part, UnitDef } from '../../types';
import { gen, mcq, near, num, tf } from '../../helpers';
import { circuit, circuitEx, circuitVisual, R, V, wires } from '../../circuits';
import { randInt } from '../../../lib/random';

const t = String.raw;

// A fonte alimenta dois resistores em série; os terminais intermediários são explícitos.
const serie = (r = 1000) => circuit(
  V('fonte', [0, 0], [0, 3], 12, { fixed: true, locked: true }),
  R('r1', [0, 0], [3, 0], 1000, { fixed: true, locked: true, label: 'R1' }),
  R('r2', [3, 0], [6, 0], r, { locked: true, label: 'R2', values: [500, 1000, 2000, 3000] }),
  wires([6, 0], [6, 3], [0, 3]),
);
const paralelo = (r = 1000) => circuit(
  V('fonte', [0, 0], [0, 4], 12, { fixed: true, locked: true }),
  wires([0, 0], [3, 0], [6, 0]),
  R('r1', [3, 0], [3, 4], 1000, { fixed: true, locked: true, label: 'R1' }),
  R('r2', [6, 0], [6, 4], r, { locked: true, label: 'R2', values: [500, 1000, 2000, 3000] }),
  wires([6, 4], [3, 4], [0, 4]),
);
const mixed = (r = 1000) => circuit(
  V('fonte', [0, 0], [0, 4], 12, { fixed: true, locked: true }),
  R('r0', [0, 0], [3, 0], 1000, { fixed: true, locked: true, label: 'R0' }),
  wires([3, 0], [6, 0]),
  R('r1', [3, 0], [3, 4], 1000, { fixed: true, locked: true, label: 'R1' }),
  R('r2', [6, 0], [6, 4], r, { locked: true, label: 'R2', values: [500, 1000, 2000, 3000] }),
  wires([6, 4], [3, 4], [0, 4]),
);

// Dois ajustes por parte avaliam grandezas elétricas, não apenas o valor escolhido.
type Tipo = 'serie' | 'paralelo' | 'mista';
const rede = (tipo: Tipo) => tipo === 'serie' ? serie : tipo === 'paralelo' ? paralelo : mixed;
const pratica = (tipo: Tipo) => {
  const make = rede(tipo);
  const metaV = tipo === 'serie' ? 8 : tipo === 'paralelo' ? 12 : 4.8;
  const metaI = tipo === 'serie' ? 4 : tipo === 'paralelo' ? 6 : 2.4;
  const explicacao = tipo === 'serie'
    ? t`Com $R_2=2\,\text{k}\Omega$, $I=12/3\,000=4\,\text{mA}$ e $V_2=I R_2=8\,\text{V}$.`
    : tipo === 'paralelo'
      ? t`Cada ramo recebe $12\,\text{V}$; com $R_2=2\,\text{k}\Omega$, $I_2=12/2\,000=6\,\text{mA}$.`
      : t`$R_1\parallel R_2=2/3\,\text{k}\Omega$; a corrente total é $12/(5/3\,\text{k}\Omega)=7,2\,\text{mA}$. O paralelo recebe $4,8\,\text{V}$ e $I_2=2,4\,\text{mA}$.`;
  return [
    num(t`No circuito, meça a tensão em $R_2$. Informe em V, com uma casa decimal.`, tipo === 'serie' ? 6 : tipo === 'paralelo' ? 12 : 4, tipo === 'serie' ? t`Resistores iguais dividem os $12\,\text{V}$ igualmente: $6,0\,\text{V}$.` : tipo === 'paralelo' ? t`Os dois ramos estão entre os mesmos nós da fonte: $12,0\,\text{V}$.` : t`O paralelo de dois resistores de $1\,\text{k}\Omega$ equivale a $0,5\,\text{k}\Omega$; recebe $12\cdot 0,5/1,5=4,0\,\text{V}$.`, { unit: 'V', tol: 0.05, visual: circuitVisual({ comps: make(), mode: 'view' }) }),
    circuitEx(t`Ajuste $R_2$ para que sua corrente seja ${String(metaI).replace('.', ',')} mA. Confira a leitura no simulador.`, { comps: make(), mode: 'adjust' }, v => near(Math.abs(v.i('r2')), metaI / 1000, 0.00005), t`Uma solução é $R_2=2\,\text{k}\Omega$.`, explicacao, { set: { r2: 2000 } }),
    circuitEx(tipo === 'paralelo' ? t`Ajuste $R_2$ para a corrente total da fonte ser $16\,\text{mA}$.` : t`Ajuste $R_2$ para que sua tensão seja ${String(metaV).replace('.', ',')} V.`, { comps: make(500), mode: 'adjust' }, tipo === 'paralelo' ? v => near(Math.abs(v.i('fonte')), 0.016, 0.00005) : v => near(Math.abs(v.v('r2')), metaV, 0.05), tipo === 'paralelo' ? t`Uma solução é $R_2=3\,\text{k}\Omega$.` : t`Uma solução é $R_2=2\,\text{k}\Omega$.`, tipo === 'paralelo' ? t`$I_T=12/1\,000+12/3\,000=12+4=16\,\text{mA}$.` : explicacao, { set: { r2: tipo === 'paralelo' ? 3000 : 2000 } }),
  ];
};

// Montagem entre dois terminais livres, com resistência equivalente medida pelo motor.
const montagem = (alvo: number, valor: number, paraleloBase: boolean) => {
  const base = paraleloBase ? circuit(R('fixo', [1, 1], [4, 1], 6000, { fixed: true, locked: true, label: '6 kΩ' }), wires([1, 1], [1, 3]), wires([4, 1], [4, 3])) : circuit(R('fixo', [1, 1], [3, 1], 1000, { fixed: true, locked: true, label: '1 kΩ' }));
  const fim: [number, number] = paraleloBase ? [4, 1] : [5, 1];
  const peca = paraleloBase ? R('nova', [1, 3], [4, 3], valor) : R('nova', [3, 1], fim, valor);
  return circuitEx(t`Monte entre os pontos extremos uma associação com $R_{eq}=${alvo / 1000}\,\text{k}\Omega$. Acrescente um resistor ${paraleloBase ? 'entre as pontas inferiores dos fios' : 'entre as pontas livres'}.`, { comps: base, mode: 'build', palette: [{ type: 'resistor', value: valor }] }, v => near(v.req([1, 1], fim), alvo, 10), t`Adicione um resistor de $${valor / 1000}\,\text{k}\Omega$ ${paraleloBase ? 'em paralelo' : 'em série'}.`, paraleloBase ? t`$6\parallel 3=6\cdot3/(6+3)=2\,\text{k}\Omega$.` : t`Em série, $1+2=3\,\text{k}\Omega$.`, { add: [peca] });
};

const parte = (title: string, body: string, tipo: Tipo, itens: Part['exercises'], montar = false): Part => ({
  card: { title, body, visual: circuitVisual({ comps: rede(tipo)(), mode: 'adjust' }) },
  exercises: [...itens, ...pratica(tipo).slice(0, montar ? 2 : 3), ...(montar ? [montagem(tipo === 'paralelo' ? 2000 : 3000, tipo === 'paralelo' ? 3000 : 2000, tipo === 'paralelo')] : [])],
});

export const associacao: UnitDef = {
  id: 'el-assoc', title: 'Associação de resistores', icon: '🔗',
  subtitle: 'Série, paralelo, circuitos mistos e divisores',
  source: 'Lei de Ohm e associação de resistores · Lista 1 de exercícios',
  guide: t`Em série, $R_{eq}=\sum R_i$ e a corrente é comum. Em paralelo, $1/R_{eq}=\sum 1/R_i$ e a tensão é comum. Em duas resistências em paralelo, $R_{eq}=R_1R_2/(R_1+R_2)$. Divisor de tensão sem carga: $V_i=V_T R_i/\sum R$. Para dois ramos em paralelo: $I_1=I_T R_2/(R_1+R_2)$.`,
  lessons: [
    { id: 'el-assoc-serie', title: 'Resistores em série', parts: [
      parte('Um único caminho', t`Em série não há derivação entre os resistores: a mesma corrente atravessa todos. A resistência equivalente é a soma $R_{eq}=R_1+R_2+\cdots$. Ajuste $R_2$ e observe a corrente.`, 'serie', [
        tf('Em uma associação em série sem derivações, a corrente é igual em todos os resistores.', true, 'Há um único caminho para a corrente.'),
        num(t`Dois resistores de $2\,\text{k}\Omega$ e $3\,\text{k}\Omega$ estão em série. Qual a equivalente em kΩ, com uma casa decimal?`, 5, t`$2+3=5,0\,\text{k}\Omega$.`, { unit: 'kΩ', tol: 0.05 }),
        gen(rng => { const a = randInt(rng, 2, 8); const b = randInt(rng, 2, 8); return num(t`Em série, $R_1=${a}\,\Omega$ e $R_2=${b}\,\Omega$. Qual a equivalente em Ω, com uma casa decimal?`, a+b, t`$R_{eq}=${a}+${b}=${a+b}\,\Omega$.`, { unit: 'Ω', tol: 0.05 }); }),
        mcq(t`Ao acrescentar um resistor positivo em série, a resistência equivalente:`, ['aumenta', 'diminui', 'fica nula', 'não muda'], 0, t`A nova resistência é somada à anterior.`),
      ], true),
      parte('Corrente e quedas', t`Depois de somar as resistências, calcule $I=V_T/R_{eq}$ e cada queda $V_i=IR_i$. A soma das quedas é a tensão da fonte.`, 'serie', [
        tf(t`Em série, a soma das quedas de tensão é a tensão total.`, true, t`Pela lei das tensões, $V_T=V_1+V_2$.`),
        num(t`Uma fonte de $12\,\text{V}$ alimenta $2\,\text{k}\Omega$ e $4\,\text{k}\Omega$ em série. Qual a corrente em mA, com uma casa decimal?`, 2, t`$I=12/6\,000=2,0\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }),
        gen(rng => { const i = randInt(rng, 1, 5); const r = randInt(rng, 2, 8); return num(t`Um resistor de $${r}\,\text{k}\Omega$ conduz $${i}\,\text{mA}$. Qual a queda em V, com uma casa decimal?`, i*r, t`$V=IR=${i}\cdot${r}=${i*r}\,\text{V}$, pois mA vezes kΩ dá V.`, { unit: 'V', tol: 0.05 }); }),
        num(t`Um aparelho de $127\,\text{V}$ e $2\,\text{A}$ é ligado a $220\,\text{V}$ com resistor em série. Qual resistência em Ω, com uma casa decimal, para operação nominal?`, 46.5, t`O resistor deve cair $220-127=93\,\text{V}$ a $2\,\text{A}$: $R=93/2=46,5\,\Omega$.`, { unit: 'Ω', tol: 0.05 }),
      ]),
    ] },
    { id: 'el-assoc-par', title: 'Resistores em paralelo', parts: [
      parte('Mesmos dois nós', t`Ramos em paralelo compartilham os dois nós e, portanto, a mesma tensão. As correntes se somam. Para dois resistores, $R_{eq}=R_1R_2/(R_1+R_2)$.`, 'paralelo', [
        tf('Resistores em paralelo têm a mesma tensão entre seus terminais.', true, 'Cada ramo liga os mesmos dois nós.'),
        num(t`Calcule $6\,\Omega\parallel3\,\Omega$ em Ω, com uma casa decimal.`, 2, t`$R_{eq}=6\cdot3/(6+3)=2,0\,\Omega$.`, { unit: 'Ω', tol: 0.05 }),
        gen(rng => { const a=randInt(rng, 2, 9); return num(t`Dois resistores iguais de $${2*a}\,\Omega$ estão em paralelo. Qual a equivalente em Ω, com uma casa decimal?`, a, t`Para dois iguais, $R_{eq}=R/2=${a}\,\Omega$.`, { unit: 'Ω', tol: 0.05 }); }),
        mcq('Para resistores positivos em paralelo, a equivalente é:', ['menor que cada resistência', 'maior que todas', 'igual à soma', 'sempre zero'], 0, 'Adicionar caminhos aumenta a condutância e reduz a resistência equivalente.'),
      ], true),
      parte('Somando correntes', t`Em cada ramo, $I_i=V/R_i$; a corrente total é $I_T=\sum I_i$. Para vários ramos, some as condutâncias: $1/R_{eq}=\sum 1/R_i$.`, 'paralelo', [
        tf('A corrente total que entra numa associação paralela é a soma das correntes dos ramos.', true, 'A corrente se reparte nos nós e se conserva.'),
        num(t`A $12\,\text{V}$, um ramo de $3\,\text{k}\Omega$ conduz quantos mA, com uma casa decimal?`, 4, t`$I=12/3\,000=4,0\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }),
        gen(rng => { const v=randInt(rng, 2, 9)*2; return num(t`Dois ramos de $2\,\text{k}\Omega$ recebem $${v}\,\text{V}$. Qual a corrente total em mA, com uma casa decimal?`, v, t`Cada ramo conduz $${v}/2\,\text{mA}$; os dois somam $${v}\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }); }),
        num(t`Resistores de $10\,\Omega$, $15\,\Omega$ e $30\,\Omega$ em paralelo recebem $127\,\text{V}$. Qual a corrente total em A, com uma casa decimal?`, 25.4, t`$1/R_{eq}=1/10+1/15+1/30=1/5$, então $I_T=127/5=25,4\,\text{A}$.`, { unit: 'A', tol: 0.05 }),
      ]),
    ] },
    { id: 'el-assoc-mista', title: 'Associação mista', parts: [
      parte('Reduza por etapas', t`Identifique os nós e reduza primeiro um grupo claramente em série ou paralelo. Substitua-o pela equivalente e repita; o resultado depende dos terminais escolhidos.`, 'mista', [
        mcq('Em R0 em série com o paralelo de R1 e R2, qual grupo pode ser reduzido primeiro?', ['R1 e R2 em paralelo', 'R0 e R1 em série', 'R0 e R2 em paralelo', 'os três em série'], 0, 'R1 e R2 ligam os mesmos dois nós; há uma derivação depois de R0.'),
        num(t`$R_0=1\,\text{k}\Omega$ em série com $2\,\text{k}\Omega\parallel2\,\text{k}\Omega$. Qual a equivalente em kΩ, com uma casa decimal?`, 2, t`O paralelo vale $1\,\text{k}\Omega$ e a soma vale $2,0\,\text{k}\Omega$.`, { unit: 'kΩ', tol: 0.05 }),
        gen(rng => { const a=randInt(rng, 1, 5); return num(t`Um resistor de $${a}\,\text{k}\Omega$ está em série com dois resistores iguais de $${2*a}\,\text{k}\Omega$ em paralelo. Qual a equivalente em kΩ, com uma casa decimal?`, 2*a, t`O paralelo equivale a $${a}\,\text{k}\Omega$; somando, $${2*a}\,\text{k}\Omega$.`, { unit: 'kΩ', tol: 0.05 }); }),
        tf('Dois resistores que compartilham apenas um nó de derivação não são necessariamente série.', true, 'Para ser série, não pode haver outro caminho no nó comum.'),
      ]),
      parte('Volte ao circuito original', t`Após encontrar a corrente total, desfaça as reduções: a corrente é comum nos elementos em série, enquanto a tensão é comum aos ramos paralelos.`, 'mista', [
        num(t`Uma fonte de $12\,\text{V}$ alimenta $1\,\text{k}\Omega$ em série com $1\,\text{k}\Omega\parallel1\,\text{k}\Omega$. Qual a corrente total em mA, com uma casa decimal?`, 8, t`$R_{eq}=1+0,5=1,5\,\text{k}\Omega$; $I_T=12/1,5=8,0\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }),
        tf('Após reduzir um paralelo, sua tensão é a mesma tensão de cada ramo original.', true, 'A substituição mantém os mesmos dois nós e a mesma tensão.'),
        gen(rng => { const v=randInt(rng, 1, 5)*3; return num(t`Uma fonte de $${v}\,\text{V}$ alimenta $2\,\text{k}\Omega$ em série com $2\,\text{k}\Omega\parallel2\,\text{k}\Omega$. Qual a corrente total em mA, com uma casa decimal?`, v/3, t`$R_{eq}=2+1=3\,\text{k}\Omega$; $I_T=${v}/3=${v/3}\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }); }),
        num(t`No circuito de $12\,\text{V}$, com $1\,\text{k}\Omega$ em série com dois ramos de $1\,\text{k}\Omega$, qual a corrente em cada ramo em mA, com uma casa decimal?`, 4, t`A corrente total é $8\,\text{mA}$ e se divide igualmente: $4,0\,\text{mA}$ por ramo.`, { unit: 'mA', tol: 0.05 }),
      ]),
    ] },
    { id: 'el-assoc-divv', title: 'Divisor de tensão', parts: [
      parte('Proporção das quedas', t`Em resistores em série, a corrente é comum. Assim, sem carga na saída, $V_2=V_T R_2/(R_1+R_2)$. A saída é medida entre o nó central e o retorno.`, 'serie', [
        tf('Em um divisor em série, o maior resistor recebe a maior queda de tensão.', true, 'A corrente é comum e $V_i=IR_i$.'),
        num(t`Um divisor sem carga tem $R_1=1\,\text{k}\Omega$, $R_2=2\,\text{k}\Omega$ e entrada $12\,\text{V}$. Qual $V_2$ em V, com uma casa decimal?`, 8, t`$V_2=12\cdot2/(1+2)=8,0\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        gen(rng => { const v=randInt(rng, 2, 9)*2; return num(t`Dois resistores iguais em série dividem $${v}\,\text{V}$ sem carga. Qual a tensão em um deles, em V, com uma casa decimal?`, v/2, t`$V_i=${v}/2=${v/2}\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
        mcq('A fórmula simples do divisor de tensão supõe que a saída:', ['não forneça corrente a uma carga', 'esteja em curto', 'tenha fonte independente em paralelo', 'esteja sempre aterrada nos dois terminais'], 0, 'Uma carga em paralelo altera a resistência efetiva do trecho de saída.'),
      ]),
      parte('Projeto e efeito da carga', t`Escolha a razão das resistências para obter a fração desejada. Uma carga finita em paralelo com $R_2$ reduz sua resistência efetiva e, portanto, a saída.`, 'serie', [
        num(t`Para obter $4\,\text{V}$ de $12\,\text{V}$ sem carga, com $R_1=2\,\text{k}\Omega$, quanto deve valer $R_2$ em kΩ, com uma casa decimal?`, 1, t`$4/12=R_2/(2+R_2)$, logo $R_2=1,0\,\text{k}\Omega$.`, { unit: 'kΩ', tol: 0.05 }),
        tf('Uma carga resistiva finita em paralelo com R2 reduz a tensão de saída de um divisor ideal.', true, 'O paralelo é menor que R2; sua fração da resistência total diminui.'),
        gen(rng => { const r=randInt(rng, 1, 6); return num(t`Em um divisor sem carga, $R_1=${2*r}\,\text{k}\Omega$ e $R_2=${r}\,\text{k}\Omega$. Com entrada de $9\,\text{V}$, qual $V_2$ em V, com uma casa decimal?`, 3, t`$V_2=9\cdot ${r}/(${2*r}+${r})=3,0\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
        num(t`Um divisor de $12\,\text{V}$ tem $R_1=1\,\text{k}\Omega$ e $R_2=1\,\text{k}\Omega$. Uma carga de $1\,\text{k}\Omega$ em paralelo com $R_2$ é conectada. Qual a saída em V, com uma casa decimal?`, 4, t`$R_2\parallel R_L=0,5\,\text{k}\Omega$; $V_o=12\cdot0,5/(1+0,5)=4,0\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
      ]),
    ] },
    { id: 'el-assoc-divi', title: 'Divisor de corrente', parts: [
      parte('Corrente pelos ramos', t`Em paralelo, a tensão é comum e a corrente é inversamente proporcional à resistência. Para dois ramos, $I_1=I_T R_2/(R_1+R_2)$.`, 'paralelo', [
        tf('No paralelo, o ramo de menor resistência conduz mais corrente.', true, 'Com a mesma tensão, $I=V/R$.'),
        num(t`Uma corrente total de $9\,\text{mA}$ entra em $R_1=1\,\text{k}\Omega$ e $R_2=2\,\text{k}\Omega$ em paralelo. Qual $I_1$ em mA, com uma casa decimal?`, 6, t`$I_1=9\cdot2/(1+2)=6,0\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }),
        gen(rng => { const i=randInt(rng, 1, 6)*2; return num(t`Uma corrente de $${i}\,\text{mA}$ alimenta dois ramos iguais. Qual a corrente de cada ramo em mA, com uma casa decimal?`, i/2, t`A simetria dá $${i}/2=${i/2}\,\text{mA}$ em cada ramo.`, { unit: 'mA', tol: 0.05 }); }),
        mcq('Se R1 é o dobro de R2, como se comparam as correntes dos dois ramos?', ['I1 é metade de I2', 'I1 é o dobro de I2', 'as correntes são iguais', 'I1 é zero'], 0, 'A tensão é igual nos ramos e a corrente varia inversamente com a resistência.'),
      ]),
      parte('Projeto de ramos', t`Para mais ramos, use condutâncias $G_i=1/R_i$: $I_i=I_T G_i/\sum G$. Sempre confira que a soma das correntes retorna à corrente total.`, 'paralelo', [
        num(t`Uma corrente de $12\,\text{mA}$ divide-se entre três resistores iguais. Qual a corrente por ramo em mA, com uma casa decimal?`, 4, t`Os três ramos conduzem igualmente: $12/3=4,0\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }),
        tf('Em um divisor de corrente, as correntes dos ramos somam a corrente de entrada.', true, 'Essa é a conservação da corrente no nó.'),
        gen(rng => { const i=randInt(rng, 1, 5)*3; return num(t`A corrente total é $${i}\,\text{mA}$ em dois ramos de $1\,\text{k}\Omega$ e $2\,\text{k}\Omega$. Qual a corrente no ramo de $2\,\text{k}\Omega$, em mA, com uma casa decimal?`, i/3, t`$I_2=${i}\cdot1/(1+2)=${i/3}\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }); }),
        num(t`Um divisor recebe $12\,\text{mA}$. Um ramo de $2\,\text{k}\Omega$ deve conduzir $4\,\text{mA}$. Qual a resistência do outro ramo em kΩ, com uma casa decimal?`, 1, t`A tensão comum é $4\,\text{mA}\cdot2\,\text{k}\Omega=8\,\text{V}$. O outro ramo conduz $8\,\text{mA}$: $R=8/8=1,0\,\text{k}\Omega$.`, { unit: 'kΩ', tol: 0.05 }),
      ]),
    ] },
  ],
};
