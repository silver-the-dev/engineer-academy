import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, plot, tf } from '../../helpers';
import { circuit, circuitEx, circuitVisual, GATE, IN, OUT, wires } from '../../circuits';
import { randInt } from '../../../lib/random';
import { Label } from '../../../components/plot/Plot';

const t = String.raw;

// Os fios ramificam somente em terminais coincidentes, nunca no meio de um fio.
const halfBase = () => circuit(
  IN('A', [0, 0], false, { locked: true }), IN('B', [0, 2], false, { locked: true }),
  wires([0, 0], [1, 0]), wires([0, 0], [0, 4], [1, 4]),
  wires([0, 2], [1, 2]), wires([0, 2], [0, 6], [1, 6]),
  OUT('S', [4, 1], { locked: true }), OUT('C', [4, 5], { locked: true }),
);
const half = () => circuit(halfBase(), GATE('xor', 's', [1, 0], 2, { locked: true }), GATE('and', 'c', [1, 4], 2, { locked: true }));
const halfVisual = () => circuitVisual({ comps: half(), mode: 'view', cols: 6, rows: 7 });
const halfBuild = () => circuitEx(
  'Monte o meio somador: coloque XOR para S e AND para C. Teste as quatro combinações.',
  { comps: halfBase(), mode: 'build', palette: ['xor', 'and'], cols: 6, rows: 7 },
  v => v.truth(['A', 'B'], 'S').join('') === '0110' && v.truth(['A', 'B'], 'C').join('') === '0001',
  'XOR em S e AND em C.', 'S é 1 quando os bits diferem; C é 1 apenas em 11. As colunas são 0110 e 0001.',
  { add: [GATE('xor', 's', [1, 0]), GATE('and', 'c', [1, 4])] },
);
const halfRepair = () => circuitEx(
  'Corrija o meio somador: substitua as portas para obter as tabelas de S e C corretas.',
  { comps: circuit(halfBase(), GATE('or', 'errS', [1, 0]), GATE('xor', 'errC', [1, 4])), mode: 'build', palette: ['xor', 'and'], cols: 6, rows: 7 },
  v => v.truth(['A', 'B'], 'S').join('') === '0110' && v.truth(['A', 'B'], 'C').join('') === '0001',
  'Troque OR por XOR e XOR por AND.', 'Em 11 a soma deve ser 0 e o transporte 1; XOR e AND também acertam as demais linhas.',
  { remove: ['errS', 'errC'], add: [GATE('xor', 's', [1, 0]), GATE('and', 'c', [1, 4])] },
);
const toggleHalf = (a: boolean, b: boolean) => circuitEx(
  `Ajuste A=${+a} e B=${+b} no meio somador e observe S e C.`,
  { comps: half(), mode: 'view', cols: 6, rows: 7 },
  v => v.on('A') === a && v.on('B') === b && v.on('S') === (a !== b) && v.on('C') === (a && b),
  `A=${+a}, B=${+b}; S=${+(a !== b)}, C=${+(a && b)}.`,
  `A XOR B dá ${+(a !== b)}; A AND B dá ${+(a && b)}.`, { on: { A: a, B: b } },
);
const readHalf = (a: number, b: number, carry: boolean) => num(
  `No simulador, ajuste A=${a} e B=${b}. Qual o bit de ${carry ? 'C (transporte)' : 'S (soma)'}?`,
  carry ? a & b : a ^ b, `Para ${a}+${b}, o bit de soma é ${a ^ b} e o transporte é ${a & b}.`, { visual: halfVisual() },
);

// Laboratório compacto: dois bits e um resultado escolhido para cada tema.
const lab = (kind: 'mux' | 'dec' | 'comp') => plot({
  view: { xMin: 0, xMax: 4, yMin: 0, yMax: 3 },
  params: [
    { key: 'a', label: kind === 'mux' ? 'Seleção' : 'A', min: 0, max: 1, step: 1, value: 0 },
    { key: 'b', label: kind === 'mux' ? 'D1' : 'B', min: 0, max: 1, step: 1, value: 0 },
  ],
  render: ({ p }: any) => <Label x={0.3} y={1.5} text={kind === 'mux' ? `D0=1 · Y=${p.a ? p.b : 1}` : kind === 'dec' ? `Entrada ${p.a}${p.b} · Y${2 * p.a + p.b}=1` : `${p.a} ${p.a === p.b ? '=' : p.a > p.b ? '>' : '<'} ${p.b}`} />,
});
const labEx = (kind: 'mux' | 'dec' | 'comp', prompt: string, a: number, b: number, explanation: string) =>
  inter(prompt, 'plot', lab(kind).props, (v) => v.p.a === a && v.p.b === b, `Ajuste os controles para ${a} e ${b}.`, explanation);

export const combinacionais: UnitDef = {
  id: 'dg-comb', title: 'Circuitos combinacionais', icon: '🧱',
  subtitle: 'Somadores, seleção, decodificação e processamento',
  source: 'Conteúdo complementar · Tocci, Widmer e Moss — Sistemas Digitais: Princípios e Aplicações',
  extra: true,
  guide: t`Um circuito combinacional depende das entradas atuais. Meio somador: $S=A\oplus B$, $C=AB$. Somador completo: $S=A\oplus B\oplus C_{in}$ e $C_{out}=AB+C_{in}(A\oplus B)$.

Um multiplexador seleciona uma entrada; um demultiplexador encaminha uma entrada a uma saída. Um decodificador $n$ para $2^n$ ativa a linha correspondente ao código, quando habilitado. No display, confirme polaridade e código. Comparadores indicam maior, igual ou menor; a ULA seleciona operações aritméticas ou lógicas.`,
  lessons: [
    { id: 'dg-comb-soma', title: 'Meio somador e somador completo', parts: [
      { card: { title: 'Somar dois bits', body: t`O meio somador recebe $A$ e $B$: $S=A\oplus B$ e $C=AB$. Em $1+1=10_2$, o bit baixo é $S=0$ e o transporte é $C=1$. Alterne as entradas no circuito.`, visual: halfVisual() }, exercises: [
        tf('A soma de 1 e 1 em binário é 10.', true, 'Dois em decimal é 10 em binário: soma 0, transporte 1.'),
        mcq('Qual porta produz a soma de um meio somador?', ['XOR', 'AND', 'OR', 'NOR'], 0, 'A soma é 1 exatamente quando as entradas diferem: XOR.'),
        readHalf(1, 1, true),
        gen(rng => { const a = randInt(rng, 0, 1), b = randInt(rng, 0, 1); return num(`No meio somador, A=${a} e B=${b}. Qual é S?`, a ^ b, `XOR de ${a} e ${b} é ${a ^ b}.`); }),
        num('Quantas linhas da tabela do meio somador têm transporte 1?', 1, 'Somente a linha A=B=1 produz transporte.'),
        toggleHalf(true, false), halfBuild(),
      ] },
      { card: { title: 'Somador completo', body: t`O somador completo inclui $C_{in}$. Dois meios somadores calculam $P=A\oplus B$, $S=P\oplus C_{in}$ e os transportes parciais $AB$ e $PC_{in}$; uma OR produz $C_{out}=AB+PC_{in}$. O circuito mostra o primeiro meio somador.`, visual: halfVisual() }, exercises: [
        mcq('Quantos bits de entrada recebe um somador completo de um bit?', ['3', '2', '4', '1'], 0, 'São A, B e o transporte de entrada.'),
        tf('O transporte de entrada pode alterar o bit da soma.', true, 'S é XOR dos três bits, incluindo o transporte de entrada.'),
        readHalf(1, 0, false),
        gen(rng => { const a = randInt(rng, 0, 1), b = randInt(rng, 0, 1), c = randInt(rng, 0, 1), sum = a + b + c; return num(`Somador completo: A=${a}, B=${b}, entrada de transporte=${c}. Qual é o transporte de saída?`, Math.floor(sum / 2), `A soma total é ${sum}; o transporte é a parte inteira de ${sum}/2, isto é, ${Math.floor(sum / 2)}.`); }),
        num('Para A=B=1 e transporte de entrada 1, qual é o bit de soma?', 1, '1+1+1=3=11 em binário: soma 1 e transporte 1.'),
        toggleHalf(true, true), halfRepair(),
      ] },
    ] },
    { id: 'dg-comb-mux', title: 'Multiplexadores e demultiplexadores', parts: [
      { card: { title: 'Escolha uma entrada', body: t`Um MUX 2:1 seleciona $D_0$ ou $D_1$: $Y=\overline S D_0+SD_1$. No laboratório, $D_0=1$; mude a seleção e $D_1$.`, visual: lab('mux') }, exercises: [
        mcq('Um MUX 2:1 encaminha para sua saída:', ['uma das duas entradas de dados', 'as duas entradas somadas', 'apenas o seletor invertido', 'sempre zero'], 0, 'O seletor escolhe uma entrada de dados por vez.'),
        tf('Com S=0, um MUX 2:1 seleciona D0.', true, 'A expressão reduz-se a Y=D0 quando S=0.'),
        num('Se S=1 e D1=0, qual é Y?', 0, 'Com S=1, Y=D1=0.'),
        gen(rng => { const s = randInt(rng, 0, 1), d0 = randInt(rng, 0, 1), d1 = randInt(rng, 0, 1); return num(`MUX: S=${s}, D0=${d0}, D1=${d1}. Qual é Y?`, s ? d1 : d0, `S=${s} seleciona D${s}, logo Y=${s ? d1 : d0}.`); }),
        num('Um MUX com 8 entradas de dados precisa de quantos bits de seleção?', 3, 'Três bits distinguem 2³=8 entradas.'),
        labEx('mux', 'No laboratório, selecione D1 e ajuste D1 para 0.', 1, 0, 'Com seleção 1, a saída segue D1=0.'),
        mcq('Com S=0, D0=1 e D1=0, qual é Y?', ['1', '0', '2', 'indeterminado'], 0, 'S=0 seleciona D0=1, independentemente de D1.'),
      ] },
      { card: { title: 'Distribua um sinal', body: t`Um DEMUX 1:2 encaminha $D$ à saída selecionada: $Y_0=\overline S D$ e $Y_1=SD$. Com $D=0$, ambas ficam em 0. O seletor tem o mesmo papel de endereço do laboratório.`, visual: lab('mux') }, exercises: [
        mcq('Um DEMUX 1:2 distribui:', ['uma entrada para uma saída selecionada', 'duas entradas para uma soma', 'um relógio para memória', 'dois dados para duas somas'], 0, 'O seletor determina para qual saída a entrada é encaminhada.'),
        tf('Com D=0, as duas saídas de um DEMUX ativo em nível alto são 0.', true, 'Cada saída é D em AND com uma condição de seleção.'),
        num('Com D=1 e S=1, quanto vale Y0?', 0, 'Y0=NOT S AND D=0 AND 1=0.'),
        gen(rng => { const s = randInt(rng, 0, 1), d = randInt(rng, 0, 1); return num(`DEMUX: D=${d} e S=${s}. Qual é Y1?`, s & d, `Y1=S AND D=${s} AND ${d}=${s & d}.`); }),
        num('Quantas saídas tem um DEMUX 1:8?', 8, 'A notação 1:8 indica uma entrada de dados e oito saídas.'),
        labEx('mux', 'Ajuste o seletor para 1 e D1 para 1 para observar seleção ativa.', 1, 1, 'O seletor em 1 escolhe a segunda posição; com dado 1 o resultado é 1.'),
        mcq('Com D=1 e S=0, quais são Y0 e Y1, nessa ordem?', ['1 e 0', '0 e 1', '1 e 1', '0 e 0'], 0, 'S=0 habilita Y0; Y1 fica em zero.'),
      ] },
    ] },
    { id: 'dg-comb-dec', title: 'Decodificadores e display de 7 segmentos', parts: [
      { card: { title: 'Um código, uma linha', body: t`Um decodificador 2:4 ativo em nível alto produz uma linha 1 para cada código de entrada, se habilitado: $Y_0=\overline A\overline B$, $Y_1=\overline AB$, $Y_2=A\overline B$, $Y_3=AB$. A é o bit mais significativo.`, visual: lab('dec') }, exercises: [
        num('Quantas saídas tem um decodificador 2:4?', 4, 'A nomenclatura indica duas entradas e quatro saídas.'),
        tf('Em um decodificador 2:4 habilitado e ativo em nível alto, uma saída fica em 1 por código.', true, 'As quatro combinações selecionam uma linha cada.'),
        num('Com A=1 e B=0, qual o índice da saída ativa?', 2, 'O código 10 em binário vale 2: Y2=1.'),
        gen(rng => { const a = randInt(rng, 0, 1), b = randInt(rng, 0, 1), n = 2 * a + b; return num(`Decodificador habilitado: A=${a}, B=${b}. Qual é o índice da saída ativa?`, n, `O código ${a}${b} vale 2×${a}+${b}=${n}; ativa Y${n}.`); }),
        num('Um decodificador completo de 3 entradas tem quantas saídas?', 8, 'Há 2³=8 combinações de entrada.'),
        labEx('dec', 'Ajuste A=1 e B=1 para selecionar Y3.', 1, 1, 'O código 11 vale 3 e seleciona Y3.'),
        mcq('Com saídas ativas em nível baixo, a linha selecionada vale:', ['0', '1', '2', 'alta impedância necessariamente'], 0, 'Ativo em nível baixo significa que a linha selecionada é 0.'),
      ] },
      { card: { title: 'Sete segmentos', body: t`Os segmentos são nomeados a até g: a no topo, b e c à direita, d embaixo, e e f à esquerda, g no meio. Para mostrar 1 acenda b e c; para 8 acenda todos. Em cátodo comum, nível alto acende cada segmento; em ânodo comum, nível baixo, conforme o driver.`, visual: lab('dec') }, exercises: [
        num('Quantos segmentos formam o algarismo 8 em um display de sete segmentos?', 7, 'O 8 usa todos os sete segmentos, de a até g.'),
        mcq('Quais segmentos formam o algarismo 1?', ['b e c', 'a e d', 'e e f', 'a e g'], 0, 'O 1 usa os dois segmentos à direita, b e c.'),
        tf('No cátodo comum, com alimentação e driver adequados, nível alto no segmento pode acendê-lo.', true, 'O cátodo comum está no retorno; o driver fornece corrente ao ânodo do segmento.'),
        gen(rng => { const n = randInt(rng, 0, 1); return num(`Para mostrar ${n === 0 ? '1' : '8'}, quantos segmentos devem acender?`, n === 0 ? 2 : 7, n === 0 ? 'O 1 usa b e c, dois segmentos.' : 'O 8 usa os sete segmentos.'); }),
        num('Quantos códigos de 4 bits existem além dos dez algarismos BCD válidos?', 6, 'Quatro bits permitem 16 códigos; BCD usa 0 a 9, restando 16−10=6.'),
        labEx('dec', 'No laboratório de endereço, ajuste A=0 e B=1 para selecionar Y1.', 0, 1, 'O código 01 vale 1; o laboratório seleciona Y1.'),
        mcq('Qual cuidado é necessário ao usar um decodificador BCD para display?', ['Verificar polaridade e comportamento para códigos 10 a 15', 'Ligar todos os segmentos sem limitar corrente', 'Supor que qualquer driver serve para ambos os comuns', 'Tratar 1010 como dígito BCD válido'], 0, 'A polaridade depende do display e do driver; códigos 10 a 15 não são dígitos BCD válidos.'),
      ] },
    ] },
    { id: 'dg-comb-comp', title: 'Comparadores e ULA', parts: [
      { card: { title: 'Compare bits', body: t`Um comparador de um bit tem saídas $A>B=A\overline B$, $A=B=\overline{A\oplus B}$ e $A<B=\overline AB$. Para palavras maiores, compare primeiro os bits mais significativos.`, visual: lab('comp') }, exercises: [
        tf('Para A=1 e B=0, A é maior que B.', true, '1 é maior que 0.'),
        mcq('Qual porta indica igualdade entre dois bits?', ['XNOR', 'XOR', 'AND', 'OR'], 0, 'XNOR é 1 quando os dois bits coincidem.'),
        num('Para A=0 e B=1, quanto vale a saída A<B?', 1, '0 é menor que 1, portanto A<B=1.'),
        gen(rng => { const a = randInt(rng, 0, 1), b = randInt(rng, 0, 1); return num(`Comparador: A=${a}, B=${b}. Qual é a saída A=B?`, +(a === b), `${a} e ${b} ${a === b ? 'são iguais' : 'são diferentes'}; a saída de igualdade é ${+(a === b)}.`); }),
        num('Quantas das três saídas A>B, A=B e A<B ficam em 1 numa comparação válida?', 1, 'Exatamente uma das três relações é verdadeira.'),
        labEx('comp', 'Ajuste A=1 e B=0 para observar A>B.', 1, 0, 'O bit 1 é maior que o bit 0.'),
        mcq('Comparando 101 e 011 sem sinal, qual é maior?', ['101', '011', 'são iguais', 'não é possível comparar'], 0, 'O bit mais significativo já decide: 1 é maior que 0; 101₂=5 e 011₂=3.'),
      ] },
      { card: { title: 'Operações na ULA', body: t`A unidade lógica e aritmética recebe operandos e uma seleção de operação. Pode fornecer soma, AND ou XOR. Uma ULA de largura fixa conserva os bits disponíveis e pode indicar transporte; transporte e overflow com sinal são conceitos diferentes.`, visual: lab('comp') }, exercises: [
        mcq('Qual é o papel da seleção de operação de uma ULA?', ['Escolher a operação aplicada aos operandos', 'Guardar permanentemente o resultado', 'Fornecer energia ao processador', 'Eliminar os operandos'], 0, 'Os bits de controle escolhem entre as operações disponíveis.'),
        tf('Uma ULA pode realizar operações lógicas e aritméticas.', true, 'Por exemplo, ela pode selecionar AND ou soma.'),
        num('Numa ULA de 2 bits, quanto vale 01 AND 11 em decimal?', 1, 'AND bit a bit: 01 AND 11=01, que vale 1.'),
        gen(rng => { const a = randInt(rng, 0, 3), b = randInt(rng, 0, 3); return num(`ULA de 2 bits: calcule ${a} XOR ${b}, bit a bit. Responda em decimal.`, a ^ b, `XOR bit a bit dos operandos de 2 bits resulta em ${a ^ b} em decimal.`); }),
        num('Numa soma sem sinal de 2 bits, 3+1 gera qual transporte de saída?', 1, '11₂+01₂=100₂: os dois bits baixos são 00 e o transporte é 1.'),
        labEx('comp', 'Ajuste os dois operandos de um bit iguais a 1.', 1, 1, 'Os dois operandos são iguais; uma ULA poderia usar esses mesmos bits numa operação escolhida.'),
        mcq('Em complemento de dois de 2 bits, 01 + 01 produz 10. O que ocorre?', ['Overflow com sinal', 'Nenhum overflow com sinal', 'O resultado representa +2', 'O resultado é 00'], 0, '1+1=2 não cabe na faixa com sinal de −2 a 1; 10 representa −2, indicando overflow.'),
      ] },
    ] },
  ],
};
