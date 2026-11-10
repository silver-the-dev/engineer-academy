import type { UnitDef } from '../../types';
import type { Comp, GateType } from '../../../lib/circuit/types';
import { gen, mcq, num, tf } from '../../helpers';
import { randInt } from '../../../lib/random';
import { circuit, circuitEx, circuitVisual, GATE, IN, OUT, wires } from '../../circuits';

const t = String.raw;
const names: Record<GateType, string> = { and: 'E (AND)', or: 'OU (OR)', not: 'NÃO (NOT)', nand: 'NE (NAND)', nor: 'NOU (NOR)', xor: 'XOU (XOR)', xnor: 'XNOU (XNOR)' };
const evalGate = (g: GateType, a: number, b: number) => ({ and: a & b, or: a | b, not: 1 - a, nand: 1 - (a & b), nor: 1 - (a | b), xor: a ^ b, xnor: 1 - (a ^ b) })[g];
const tableOf = (g: GateType) => g === 'not' ? [1, 0] : [0, 1, 2, 3].map(k => evalGate(g, k >> 1, k & 1));
const equal = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => x === b[i]);
const pins = (g: GateType, a = false, b = false) => circuit(
  IN('A', [1, 1], a, { locked: true }),
  ...(g === 'not' ? [] : [IN('B', [1, 3], b, { locked: true })]),
  OUT('S', g === 'not' ? [4, 1] : [4, 2], { locked: true }),
);
const full = (g: GateType, a = false, b = false) => circuit(pins(g, a, b), GATE(g, 'g', [1, 1], undefined, { locked: true }));
const spec = (comps: Comp[], mode: 'view' | 'build' = 'view', palette?: GateType[]) => ({ comps, mode, cols: 7, rows: 5, palette });
const visual = (g: GateType, a = false, b = false) => circuitVisual(spec(full(g, a, b)));

// The unpopulated socket has named, locked input and output terminals; the student adds the gate.
const buildGate = (g: GateType) => circuitEx(
  `Monte a porta ${names[g]} entre as entradas e S. Teste todas as combinações.`,
  spec(pins(g), 'build', [g]),
  v => equal(v.truth(g === 'not' ? ['A'] : ['A', 'B'], 'S'), tableOf(g)),
  `Insira uma porta ${names[g]} na grade.`,
  `A tabela de ${names[g]} na ordem binária é ${tableOf(g).join(', ')}; o teste percorre todas as entradas.`,
  { add: [GATE(g, 'g', [1, 1])] },
);
const toggle = (g: GateType, a: boolean, b: boolean, target: boolean) => circuitEx(
  `Altere as entradas para obter A=${Number(a)}${g === 'not' ? '' : ` e B=${Number(b)}`} e observe S=${Number(target)}.`,
  spec(full(g, !a, g === 'not' ? false : !b)),
  v => v.on('A') === a && (g === 'not' || v.on('B') === b) && v.on('S') === target,
  `A=${Number(a)}${g === 'not' ? '' : `, B=${Number(b)}`}; S=${Number(target)}.`,
  `Para ${names[g]}, a combinação pedida produz S=${Number(target)} pela tabela-verdade.`,
  { on: { A: a, ...(g === 'not' ? {} : { B: b }) } },
);

// Build networks from NAND only. Shared wire endpoints are deliberate fan-out junctions.
const network = (kind: 'not' | 'and' | 'or') => {
  if (kind === 'not') return {
    base: circuit(IN('A', [0, 1], false, { locked: true }), OUT('S', [4, 2], { locked: true })),
    add: circuit(wires([0, 1], [1, 1]), wires([0, 1], [0, 3], [1, 3]), GATE('nand', 'n1', [1, 1])),
    inputs: ['A'], truth: [1, 0], description: 'Uma NE com as duas entradas ligadas a A inverte A.',
  };
  if (kind === 'and') return {
    base: circuit(IN('A', [1, 1], false, { locked: true }), IN('B', [1, 3], false, { locked: true }), OUT('S', [8, 2], { locked: true })),
    add: circuit(GATE('nand', 'n1', [1, 1]), wires([4, 2], [5, 1]), wires([4, 2], [5, 3]), GATE('nand', 'n2', [5, 1])),
    inputs: ['A', 'B'], truth: [0, 0, 0, 1], description: 'A primeira NE produz o complemento de A E B; a segunda, com entradas unidas, inverte esse resultado.',
  };
  return {
    base: circuit(IN('A', [0, 0], false, { locked: true }), IN('B', [0, 4], false, { locked: true }), OUT('S', [8, 3], { locked: true })),
    add: circuit(wires([0, 0], [1, 0]), wires([0, 0], [0, 2], [1, 2]), GATE('nand', 'n1', [1, 0]),
      wires([0, 4], [1, 4]), wires([0, 4], [0, 6], [1, 6]), GATE('nand', 'n2', [1, 4]),
      wires([4, 1], [5, 2]), wires([4, 5], [5, 4]), GATE('nand', 'n3', [5, 2])),
    inputs: ['A', 'B'], truth: [0, 1, 1, 1], description: 'Duas NE invertem A e B; a terceira fornece NÃO (NÃO A E NÃO B), igual a A OU B por De Morgan.',
  };
};
const buildNetwork = (kind: 'not' | 'and' | 'or') => {
  const n = network(kind);
  return circuitEx(`Monte ${names[kind]} usando apenas portas NE e fios. Ligue as entradas A${kind === 'not' ? '' : ' e B'} a S; confira todas as combinações.`,
    { comps: n.base, mode: 'build', cols: 9, rows: 7, palette: ['wire', 'nand'] },
    v => v.count('nand') > 0 && equal(v.truth(n.inputs, 'S'), n.truth),
    n.description, n.description, { add: n.add });
};

type PartOptions = { title: string; body: string; gate: GateType; a: number; b: number; fact: string; factTrue: boolean; question: string; choices: string[]; why: string; network?: 'not' | 'and' | 'or' };
const part = (o: PartOptions) => {
  const result = evalGate(o.gate, o.a, o.b);
  return {
    card: { title: o.title, body: o.body, visual: visual(o.gate), tip: 'Toque nas entradas A e B para mudar os bits e observe S.' },
    exercises: [
      tf(o.fact, o.factTrue, o.why),
      mcq(o.question, o.choices, 0, o.why),
      num(`No simulador, coloque A=${o.a}${o.gate === 'not' ? '' : ` e B=${o.b}`}. Qual é o bit de S?`, result,
        `Pela regra de ${names[o.gate]}, essa combinação dá S=${result}.`, { visual: visual(o.gate, !!o.a, !!o.b) }),
      gen(rng => {
        const a = randInt(rng, 0, 1), b = randInt(rng, 0, 1), s = evalGate(o.gate, a, b);
        return num(`Para ${names[o.gate]}, com A=${a}${o.gate === 'not' ? '' : ` e B=${b}`}, qual é S?`, s,
          `Aplicando ${names[o.gate]} a ${a}${o.gate === 'not' ? '' : ` e ${b}`} obtemos ${s}.`);
      }),
      num(`Quantas linhas da tabela-verdade de ${names[o.gate]} têm saída 1?`, tableOf(o.gate).reduce((a, b) => a + b, 0),
        `Na ordem binária, as saídas são ${tableOf(o.gate).join(', ')}; conte os valores 1.`),
      toggle(o.gate, !!o.a, !!o.b, !!result),
      o.network ? buildNetwork(o.network) : buildGate(o.gate),
    ],
  };
};

export const portas: UnitDef = {
  id: 'dg-portas', title: 'Portas lógicas', icon: '🚪',
  subtitle: 'Tabelas-verdade, portas universais e circuitos integrados',
  source: 'Eletrônica Digital · Unidade 3 — Portas Lógicas; níveis e CIs complementados para aplicação prática',
  guide: t`Para duas entradas, E: $AB$; OU: $A+B$; NÃO: $\overline A$; NE: $\overline{AB}$; NOU: $\overline{A+B}$; XOU: $A\oplus B$; XNOU: $\overline{A\oplus B}$. De Morgan: $\overline{AB}=\overline A+\overline B$ e $\overline{A+B}=\overline A\,\overline B$. NE e NOU são universais. Níveis de tensão e pinagem devem ser conferidos na folha de dados do CI.`,
  lessons: [
    { id: 'dg-portas-basicas', title: 'Portas E, OU e NÃO', parts: [
      part({ title: 'E: todas as entradas', body: t`A porta **E (AND)** implementa $S=A\cdot B$. A saída é 1 somente quando ambas as entradas são 1. Com $n$ entradas, há $2^n$ combinações.`, gate: 'and', a: 1, b: 1, fact: 'Uma porta E de duas entradas só fornece 1 se ambas forem 1.', factTrue: true, question: 'Quando a porta E fornece 1?', choices: ['Quando A e B são 1', 'Quando só A é 1', 'Quando só B é 1', 'Quando ambas são 0'], why: 'A multiplicação booleana só dá 1 em 1 E 1.' }),
      part({ title: 'OU e NÃO', body: t`**OU (OR)** fornece 1 quando pelo menos uma entrada é 1, inclusive quando as duas são 1: $S=A+B$. **NÃO (NOT)** inverte uma entrada: $S=\overline A$.`, gate: 'or', a: 1, b: 0, fact: 'A porta OU inclusiva fornece 1 também para A=1 e B=1.', factTrue: true, question: 'Qual operação inverte um único bit?', choices: ['NÃO (NOT)', 'E (AND)', 'OU (OR)', 'A soma aritmética'], why: 'OU inclui a combinação 1, 1; NÃO transforma 0 em 1 e 1 em 0.' }),
    ] },
    { id: 'dg-portas-nand', title: 'Portas NE e NOU', parts: [
      part({ title: 'NE: E seguida de inversão', body: t`A porta **NE (NAND)** dá $S=\overline{AB}$. Primeiro avalie E; depois inverta. Só a combinação 1, 1 produz 0.`, gate: 'nand', a: 1, b: 1, fact: 'A porta NE fornece 0 quando as duas entradas são 1.', factTrue: true, question: 'NE equivale a qual sequência?', choices: ['E seguida de NÃO', 'OU seguida de NÃO', 'NÃO seguida de OU exclusivo', 'Duas portas E em série'], why: 'NE complementa o produto booleano: 1 E 1 é 1, então a saída é 0.' }),
      part({ title: 'NOU e De Morgan', body: t`A porta **NOU (NOR)** dá $S=\overline{A+B}$: só 0, 0 produz 1. De Morgan também escreve $\overline{A+B}=\overline A\,\overline B$ e $\overline{AB}=\overline A+\overline B$.`, gate: 'nor', a: 1, b: 0, fact: 'NOU fornece 1 apenas quando todas as entradas são 0.', factTrue: true, question: 'Qual expressão equivale a NÃO (A OU B)?', choices: [t`$\overline A\cdot\overline B$`, t`$\overline A+\overline B$`, t`$A+B$`, t`$AB$`], why: 'De Morgan inverte cada entrada e troca OU por E; portanto ambas precisam ser 0.' }),
    ] },
    { id: 'dg-portas-xor', title: 'OU exclusivo e coincidência', parts: [
      part({ title: 'XOU: entradas diferentes', body: t`A **XOU (XOR)** de duas entradas dá 1 quando elas diferem: $S=A\oplus B=\overline A B+A\overline B$. Diferentemente do OU inclusivo, 1 e 1 dão 0.`, gate: 'xor', a: 1, b: 0, fact: 'A XOU de duas entradas fornece 1 quando os bits são diferentes.', factTrue: true, question: 'Qual é a saída da XOU para A=1 e B=1?', choices: ['0', '1', '2', 'Depende da ordem'], why: 'Na XOU, entradas iguais dão 0; 1 e 1 são iguais.' }),
      part({ title: 'XNOU: coincidência', body: t`A **XNOU (XNOR)** complementa a XOU. Com duas entradas, indica coincidência: $S=\overline{A\oplus B}$ é 1 para 0, 0 e para 1, 1.`, gate: 'xnor', a: 1, b: 1, fact: 'A XNOU de duas entradas detecta bits iguais.', factTrue: true, question: 'Qual par faz a XNOU fornecer 0?', choices: ['A=0 e B=1', 'A=0 e B=0', 'A=1 e B=1', 'Ambas as entradas iguais'], why: 'XNOU é 1 para entradas iguais e 0 quando diferem.' }),
    ] },
    { id: 'dg-portas-univ', title: 'Universalidade de NE e NOU', parts: [
      part({ title: 'Inversor e E com NE', body: t`Uma família é **universal** quando constrói qualquer função booleana. NE é universal: $\overline A=\overline{AA}$ e $AB=\overline{\overline{AB}\,\overline{AB}}$. A segunda NE atua como inversor.`, gate: 'nand', a: 0, b: 1, fact: 'Uma NE com as duas entradas ligadas ao mesmo sinal funciona como inversor.', factTrue: true, question: 'Quantas portas NE de duas entradas bastam para fazer E?', choices: ['2', '1', '3', '4'], why: 'A primeira NE gera o complemento de AB e a segunda inverte esse sinal.' , network: 'and' }),
      part({ title: 'OU com NE; NOU universal', body: t`Por De Morgan, $A+B=\overline{\overline A\,\overline B}$. Use duas NE como inversores e uma terceira NE. NOU também é universal: uma NOU com entradas unidas inverte, e suas saídas permitem construir OU e E.`, gate: 'or', a: 1, b: 1, fact: 'É possível construir OU a partir de três portas NE de duas entradas.', factTrue: true, question: 'No OU feito com três NE, o que fazem as duas primeiras?', choices: ['Invertem A e B separadamente', 'Somam aritmeticamente A e B', 'Comparam níveis analógicos', 'Guardam o estado anterior'], why: 'As duas primeiras fornecem os complementos; a terceira aplica De Morgan e produz A OU B.', network: 'or' }),
    ] },
    { id: 'dg-portas-ci', title: 'Circuitos integrados e níveis lógicos', parts: [
      part({ title: 'Portas em um CI', body: t`Um **circuito integrado (CI)** pode reunir várias portas independentes no mesmo encapsulamento. Consulte a folha de dados para identificar alimentação, terra, pinos de entrada e saída e quantidade de portas. Nunca suponha a pinagem só pelo formato.`, gate: 'not', a: 1, b: 0, fact: 'A pinagem e a alimentação de um CI devem ser consultadas na folha de dados.', factTrue: true, question: 'O que deve ser identificado antes de ligar um CI lógico?', choices: ['Alimentação, terra e pinagem na folha de dados', 'Apenas a cor do encapsulamento', 'Somente o nome da porta', 'Somente o número de entradas'], why: 'A função lógica não define sozinha tensão de alimentação ou pinagem; a folha de dados especifica ambas.', network: 'not' }),
      part({ title: 'Níveis e limites', body: t`No simulador ideal, IN representa 0 V ou 5 V e as portas leem alto acima de 2,5 V. Em CIs reais, as faixas de entrada e saída dependem da família, alimentação e folha de dados; uma tensão intermediária pode não ter nível garantido. Não deixe entradas reais flutuando: siga as recomendações do fabricante.`, gate: 'and', a: 0, b: 1, fact: 'Uma tensão entre os limites garantidos de entrada de um CI pode ter nível indefinido.', factTrue: true, question: 'Qual regra vale para os níveis de CIs reais?', choices: ['Consultar limites da família e da alimentação', 'Todo CI interpreta exatamente 2,5 V como 1', 'Qualquer tensão intermediária é garantidamente 0', 'Toda família usa sempre 5 V'], why: 'Os limites garantidos dependem do componente; 2,5 V é o limiar ideal adotado neste simulador.' }),
    ] },
  ],
};
