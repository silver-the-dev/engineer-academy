import type { UnitDef } from '../../types';
import type { GateType } from '../../../lib/circuit/types';
import { gen, mcq, num, tf } from '../../helpers';
import { circuit, circuitEx, circuitVisual, GATE, IN, OUT, wires } from '../../circuits';
import { randInt } from '../../../lib/random';

const t = String.raw;
const gates: Record<'and' | 'or' | 'nand' | 'nor', { name: string; formula: string; truth: number[] }> = {
  and: { name: 'AND', formula: t`A\cdot B`, truth: [0, 0, 0, 1] },
  or: { name: 'OR', formula: 'A+B', truth: [0, 1, 1, 1] },
  nand: { name: 'NAND', formula: t`\overline{A\cdot B}`, truth: [1, 1, 1, 0] },
  nor: { name: 'NOR', formula: t`\overline{A+B}`, truth: [1, 0, 0, 0] },
};
type Gate = keyof typeof gates;
const base = () => circuit(IN('A', [1, 1], false, { locked: true }), IN('B', [1, 3], false, { locked: true }), OUT('S', [4, 2], { locked: true }));
const complete = (g: Gate) => circuit(base(), GATE(g as GateType, 'g', [1, 1], 2, { locked: true }));
const visual = (g: Gate) => circuitVisual({ comps: complete(g), mode: 'view', cols: 6, rows: 5 });
const build = (g: Gate) => {
  const x = gates[g];
  return circuitEx(
    t`Monte $S=${x.formula}$ entre as entradas A e B e a saída S. Teste as quatro combinações.`,
    { comps: base(), mode: 'build', palette: ['and', 'or', 'nand', 'nor'], cols: 6, rows: 5 },
    v => v.truth(['A', 'B'], 'S').join('') === x.truth.join(''),
    t`Use uma porta ${x.name}.`,
    t`A porta ${x.name} produz, para $AB=00, 01, 10, 11$, a sequência $${x.truth.join('')}$, exatamente a tabela da expressão.`,
    { add: [GATE(g, 'g', [1, 1])] },
  );
};

// A AND intermediária alimenta uma OR com C: S = AB + C.
const cascadeBase = () => circuit(
  IN('A', [1, 0], false, { locked: true }), IN('B', [1, 2], false, { locked: true }),
  GATE('and', 'g1', [1, 0], 2, { locked: true }), wires([4, 1], [5, 1]),
  IN('C', [5, 3], false, { locked: true }), OUT('S', [8, 2], { locked: true }),
);
const cascade = () => circuit(cascadeBase(), GATE('or', 'g2', [5, 1], 2, { locked: true }));
const buildCascade = () => circuitEx(
  t`Complete o circuito de $S=AB+C$: insira a porta final e confira as oito combinações de A, B e C.`,
  { comps: cascadeBase(), mode: 'build', palette: ['and', 'or', 'nand', 'nor'], cols: 9, rows: 5 },
  v => v.truth(['A', 'B', 'C'], 'S').join('') === '01010111',
  'Insira uma OR na saída da AND e de C.',
  t`A primeira porta calcula $AB$; a OR final calcula $AB+C$. Para $ABC=000$ até $111$, a coluna é $01010111$.`,
  { add: [GATE('or', 'g2', [5, 1])] },
);
const readCascade = () => mcq(
  t`Alterne as entradas e acompanhe as portas. Qual expressão descreve a saída S do circuito?`,
  ['$AB+C$', '$A+BC$', t`$\overline{AB}+C$`, '$ABC$'], 0,
  t`A AND recebe A e B e produz $AB$; a OR reúne esse resultado com C, dando $S=AB+C$.`,
  { visual: circuitVisual({ comps: cascade(), mode: 'view', cols: 9, rows: 5 }) },
);

// O exercício de leitura obriga a alternar as entradas do circuito mostrado.
const readGate = (g: Gate) => {
  const x = gates[g];
  return mcq(t`No circuito, teste $A=1$ e $B=0$. Qual é a saída $S$?`, [String(x.truth[2]), String(1 - x.truth[2]), '2', 'indeterminada'], 0,
    t`Para $AB=10$, a porta ${x.name} fornece $S=${x.truth[2]}$. Confira alternando as entradas.`, { visual: visual(g) });
};
const randomRow = (g: Gate) => gen(rng => {
  const a = randInt(rng, 0, 1), b = randInt(rng, 0, 1), x = gates[g];
  const s = x.truth[2 * a + b];
  return num(t`Para $S=${x.formula}$, determine $S$ quando $A=${a}$ e $B=${b}$. Responda 0 ou 1.`, s,
    t`Substituindo $A=${a}$ e $B=${b}$ na operação ${x.name}, obtemos $S=${s}$.`);
});

export const booleana: UnitDef = {
  id: 'dg-bool', title: 'Ágebra booleana e circuitos lógicos', icon: '🧮',
  subtitle: 'Expressões, tabelas-verdade e simplificação',
  source: 'Eletrônica Digital · Aula 4 — Avaliação da saída de circuitos lógicos',
  guide: t`Em álgebra booleana, $+$ é OR, $\cdot$ é AND e a barra é NOT. Avalie primeiro os parênteses e as complementações, depois AND e por fim OR.

Identidades: $A+0=A$, $A\cdot1=A$, $A+1=1$, $A\cdot0=0$, $A+\overline A=1$, $A\overline A=0$. Absorção: $A+AB=A$ e $A(A+B)=A$. De Morgan: $\overline{AB}=\overline A+\overline B$ e $\overline{A+B}=\overline A\,\overline B$. Compare circuitos pelas saídas em todas as combinações de entrada.`,
  lessons: [
    { id: 'dg-bool-expr', title: 'Da expressão ao circuito', parts: [
      { card: { title: 'Operadores viram portas', body: t`Em $S=A\cdot B$, as entradas A e B chegam à AND; sua saída é S. Em $S=A+B$, use OR. Toque nas entradas e observe a saída.`, visual: visual('and') }, exercises: [
        mcq(t`Que porta implementa $S=A\cdot B$?`, ['AND', 'OR', 'NOR', 'NOT'], 0, t`O produto lógico é a operação AND.`),
        tf(t`Em $A+B$, o símbolo $+$ representa OR.`, true, t`A soma booleana é OR: basta uma entrada ser 1.`),
        readGate('and'), randomRow('or'),
        mcq(t`Para $S=A+B$, quando a saída é 0?`, ['Quando A e B são 0', 'Quando A e B são 1', 'Sempre', 'Quando apenas A é 1'], 0, t`OR só fornece 0 quando todas as entradas são 0.`),
        build('and'), build('or'),
      ] },
      { card: { title: 'Barras e ordem', body: t`Uma barra sobre uma expressão inverte a saída inteira. Assim, $\overline{AB}$ é uma AND seguida de NOT, equivalente a NAND. Em $A+BC$, faça primeiro $BC$ e depois OR com A.`, visual: visual('nand') }, exercises: [
        mcq(t`Qual é a última operação em $A+BC$?`, ['OR', 'AND', 'NOT', 'XOR'], 0, t`Primeiro calcule $BC$; depois some logicamente com A.`),
        tf(t`$\overline{AB}$ inverte o resultado do produto inteiro.`, true, t`A barra cobre $AB$: calcule AND e inverta a saída.`),
        readCascade(), randomRow('nand'),
        mcq(t`Para $A=0$, $B=1$, $C=1$, quanto vale $A+BC$?`, ['1', '0', '2', '3'], 0, t`$BC=1$ e $0+1=1$ na álgebra booleana.`),
        build('nand'), buildCascade(),
      ] },
    ] },
    { id: 'dg-bool-tab', title: 'Do circuito à tabela-verdade', parts: [
      { card: { title: 'Enumerar as entradas', body: t`Para duas entradas, enumere $AB=00, 01, 10, 11$. Leia a porta e calcule cada saída. Uma AND produz $0001$. Alterne A e B no circuito para conferir.`, visual: visual('and') }, exercises: [
        num('Quantas linhas tem a tabela de duas entradas independentes?', 4, t`Cada entrada tem dois valores: $2^2=4$ combinações.`),
        mcq('Qual sequência enumera todas as entradas de duas variáveis?', ['00, 01, 10, 11', '00, 01, 11', '00, 10, 11, 11', '01, 10'], 0, t`A contagem binária de 0 a 3 cobre cada combinação uma vez.`),
        readGate('and'), randomRow('and'),
        mcq(t`Qual coluna de saída corresponde a $S=A+B$, na ordem $00, 01, 10, 11$?`, ['0111', '0001', '1110', '1000'], 0, t`OR só é 0 na primeira linha, quando ambas entradas são 0.`),
        build('and'), build('or'),
      ] },
      { card: { title: 'Leia da entrada para a saída', body: t`Identifique a operação de cada porta e nomeie suas saídas intermediárias. Se uma OR alimenta uma NOT, a expressão final é $S=\overline{A+B}$. Inverta cada linha da coluna OR para obter NOR.`, visual: visual('nor') }, exercises: [
        mcq(t`Uma OR seguida de NOT implementa qual expressão?`, [t`$\overline{A+B}$`, t`$\overline{AB}$`, '$AB$', '$A+B$'], 0, t`A OR calcula $A+B$; a NOT complementa esse resultado.`),
        tf(t`A coluna NOR é a coluna OR invertida linha a linha.`, true, t`NOR significa NOT OR: cada 0 vira 1 e cada 1 vira 0.`),
        readGate('nor'), randomRow('nor'),
        mcq(t`Qual é a sequência de $\overline{AB}$ para $AB=00, 01, 10, 11$?`, ['1110', '0001', '0111', '1000'], 0, t`AND gera $0001$; invertendo a coluna resulta $1110$.`),
        build('nor'), build('nand'),
      ] },
    ] },
    { id: 'dg-bool-leis', title: 'Postulados e teoremas', parts: [
      { card: { title: 'Identidade e complemento', body: t`Para qualquer bit A: $A+0=A$, $A\cdot1=A$, $A+1=1$ e $A\cdot0=0$. Também $A+\overline A=1$ e $A\overline A=0$. Experimente os estados da AND.`, visual: visual('and') }, exercises: [
        mcq(t`Simplifique $A+0$.`, ['$A$', '$0$', '$1$', t`$\overline A$`], 0, t`Zero é elemento neutro de OR: $A+0=A$.`),
        tf(t`$A\cdot0=0$ para qualquer valor de A.`, true, t`AND exige duas entradas 1; a entrada 0 garante saída 0.`),
        readGate('and'), randomRow('and'),
        mcq(t`Quanto vale $A+\overline A$?`, ['$1$', '$0$', '$A$', t`$\overline A$`], 0, t`Se $A=0$, o complemento é 1; se $A=1$, o próprio A é 1.`),
        build('and'), build('or'),
      ] },
      { card: { title: 'Comutativa e distributiva', body: t`Trocar entradas não altera AND ou OR: $AB=BA$ e $A+B=B+A$. A distributiva dá $A(B+C)=AB+AC$ e $(A+B)(A+C)=A+BC$.`, visual: visual('or') }, exercises: [
        mcq(t`Qual expressão é igual a $A(B+C)$?`, ['$AB+AC$', '$A+B+C$', '$AB+C$', '$ABC$'], 0, t`Distribua A em cada parcela: $A(B+C)=AB+AC$.`),
        tf(t`$A+B=B+A$ pela comutatividade.`, true, t`OR retorna 1 quando pelo menos uma entrada é 1, independentemente da ordem.`),
        readGate('or'), randomRow('or'),
        mcq(t`Qual expressão equivale a $(A+B)(A+C)$?`, ['$A+BC$', '$A+B+C$', '$ABC$', '$AB+AC$'], 0, t`Expanda: $A+AC+AB+BC=A+BC$ por absorção.`),
        build('or'), build('and'),
      ] },
    ] },
    { id: 'dg-bool-morgan', title: 'Teoremas de De Morgan', parts: [
      { card: { title: 'Complemento de um produto', body: t`De Morgan troca AND por OR e complementa cada entrada: $\overline{AB}=\overline A+\overline B$. Uma NAND só dá 0 quando ambas as entradas valem 1.`, visual: visual('nand') }, exercises: [
        mcq(t`Aplique De Morgan a $\overline{AB}$.`, [t`$\overline A+\overline B$`, t`$\overline A\,\overline B$`, '$A+B$', '$AB$'], 0, t`Inverta cada entrada e troque o produto por soma.`),
        tf(t`$\overline{AB}=0$ quando $A=B=1$.`, true, t`$AB=1$ e seu complemento é 0.`),
        readGate('nand'), randomRow('nand'),
        mcq(t`Para $A=0$ e $B=1$, quanto vale $\overline A+\overline B$?`, ['$1$', '$0$', '$2$', '$3$'], 0, t`Os complementos são 1 e 0; portanto $1+0=1$.`),
        build('nand'), build('and'),
      ] },
      { card: { title: 'Complemento de uma soma', body: t`O outro teorema troca OR por AND: $\overline{A+B}=\overline A\,\overline B$. NOR é 1 apenas quando ambas as entradas são 0. A regra vale também para mais de duas variáveis.`, visual: visual('nor') }, exercises: [
        mcq(t`Aplique De Morgan a $\overline{A+B}$.`, [t`$\overline A\,\overline B$`, t`$\overline A+\overline B$`, '$AB$', '$A+B$'], 0, t`Complemente cada entrada e troque OR por AND.`),
        tf(t`$\overline{A+B+C}=\overline A\,\overline B\,\overline C$.`, true, t`A negação da soma exige que todas as parcelas sejam 0.`),
        readGate('nor'), randomRow('nor'),
        mcq(t`Para $A=1$ e $B=0$, quanto vale $\overline{A+B}$?`, ['$0$', '$1$', '$2$', '$3$'], 0, t`$A+B=1$; invertendo, obtemos 0.`),
        build('nor'), build('or'),
      ] },
    ] },
    { id: 'dg-bool-simp', title: 'Simplificação algébrica', parts: [
      { card: { title: 'Absorção', body: t`A expressão $A+AB$ simplifica para A: se A é 1, a saída já é 1; se A é 0, ambos os termos são 0. Por dualidade, $A(A+B)=A$.`, visual: visual('or') }, exercises: [
        mcq(t`Simplifique $A+AB$.`, ['$A$', '$B$', '$AB$', '$1$'], 0, t`Pela distributiva, $A+AB=A(1+B)=A\cdot1=A$.`),
        tf(t`$A(A+B)=A$.`, true, t`Expandindo, $AA+AB=A+AB=A$ por idempotência e absorção.`),
        readGate('or'), randomRow('or'),
        mcq(t`Simplifique $AB+A\overline B$.`, ['$A$', '$B$', '$0$', '$AB$'], 0, t`Coloque A em evidência: $A(B+\overline B)=A\cdot1=A$.`),
        build('or'), build('and'),
      ] },
      { card: { title: 'Simplifique e confira', body: t`Combine distributiva, complemento e absorção. Por exemplo, $(A+B)(A+\overline B)=A+B\overline B=A$. Uma simplificação é válida quando todas as linhas das tabelas coincidem.`, visual: visual('nand') }, exercises: [
        mcq(t`Simplifique $(A+B)(A+\overline B)$.`, ['$A$', '$B$', '$1$', '$0$'], 0, t`Use $(A+B)(A+C)=A+BC$: fica $A+B\overline B=A$.`),
        tf('Duas expressões equivalentes têm a mesma saída para cada combinação das entradas.', true, t`A equivalência booleana exige igualdade em todas as linhas da tabela-verdade.`),
        readGate('nand'), randomRow('nand'),
        mcq(t`Simplifique $\overline{\overline{AB}}$.`, ['$AB$', '$A+B$', t`$\overline{AB}$`, '$1$'], 0, t`Dupla complementação devolve o valor original: $\overline{\overline{AB}}=AB$.`),
        build('nand'), build('nor'),
      ] },
    ] },
  ],
};
