import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, plot, tf } from '../../helpers';
import { circuit, circuitEx, circuitVisual, CLK, DFF, GATE, GND, IN, OUT, wires } from '../../circuits';
import { FnCurve } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { randInt } from '../../../lib/random';

const t = String.raw;

// O gráfico mostra uma entrada constante e a captura na primeira borda de subida.
const timing = () => plot({
  view: { xMin: 0, xMax: 4, yMin: -0.3, yMax: 2.5 },
  params: [{ key: 'd', label: 'D', min: 0, max: 1, step: 1, value: 0, color: C.p2 }],
  render: ({ p }: any) => <><FnCurve f={(x: number) => (Math.floor(x * 2) % 2 ? 1 : 0) + 1.2} color={C.p2} /><FnCurve f={(x: number) => x < 0.5 ? 0 : p.d} color={C.p3} /></>,
  info: ({ p }: any) => `Clock acima; Q abaixo. Q inicia em 0 e captura D=${p.d} na borda em t=0,5.`,
});
const ff = (d: boolean) => circuit(
  IN('D', [2, 1], d, { locked: true }), DFF('ff', [2, 1], { locked: true }),
  CLK('clk', [2, 3], [0, 5], 1, 5, { locked: true, fixed: true }), GND([0, 5]), OUT('Q', [5, 1], { locked: true }),
);
const ffSpec = (d: boolean) => ({ comps: ff(d), mode: 'view' as const, cols: 7, rows: 6, scope: { ids: ['clk', 'Q'], window: 2 } });
const latch = (s: boolean, r: boolean) => circuit(
  IN('R', [1, 0], r, { locked: true }), IN('S', [1, 4], s, { locked: true }),
  GATE('nor', 'q', [1, 0], 2, { locked: true }), GATE('nor', 'qb', [1, 4], 2, { locked: true }),
  wires([4, 1], [1, 6]), wires([4, 5], [1, 2]), OUT('Q', [4, 1], { locked: true }),
);
const latchSpec = (s: boolean, r: boolean) => ({ comps: latch(s, r), mode: 'view' as const, cols: 6, rows: 7 });
const forceLatch = (high: boolean) => circuitEx(
  `No latch NOR, ative ${high ? 'S' : 'R'} e desative ${high ? 'R' : 'S'} para forçar Q=${Number(high)}.`,
  latchSpec(!high, high), v => v.on('Q') === high && v.on('S') === high && v.on('R') !== high,
  `S=${Number(high)} e R=${Number(!high)}.`,
  high ? 'S=1 força Q̅=0; com R=0 a porta superior produz Q=1.' : 'R=1 força Q=0; com S=0 a outra porta produz Q̅=1.',
  { on: { S: high, R: !high } },
);
const capture = (high: boolean) => circuitEx(
  `Ajuste D para que, após a primeira borda de subida do clock, Q seja ${Number(high)}. Reinicie a simulação se necessário.`,
  ffSpec(!high), v => high ? v.at('Q', 0.75) > 4 : v.at('Q', 0.75) < 1,
  `D=${Number(high)}.`, `O clock de 1 Hz sobe em 0,5 s; a saída captura D=${Number(high)} e permanece assim até a borda seguinte.`,
  { on: { D: high } },
);

type Topic = {
  title: string; body: string; fact: string; factAnswer: boolean; factWhy: string;
  question: string; choices: string[]; why: string;
  question2: string; choices2: string[]; why2: string;
  generated: (n: number) => { prompt: string; answer: number; explain: string };
};
const part = (o: Topic, useLatch = false) => ({
  card: { title: o.title, body: o.body, visual: timing(), tip: 'Mude D e compare o clock com Q. O gráfico representa um flip-flop D ideal, com Q inicial zero.' },
  exercises: [
    tf(o.fact, o.factAnswer, o.factWhy),
    mcq(o.question, o.choices, 0, o.why),
    num('No simulador, observe a entrada D inicialmente alta. Qual é sua tensão em V?', 5, 'A entrada lógica alta do modelo fornece 5 V.', { visual: circuitVisual(ffSpec(true)), unit: 'V' }),
    gen(rng => { const x = o.generated(randInt(rng, 1, 4)); return num(x.prompt, x.answer, x.explain); }),
    mcq(o.question2, o.choices2, 0, o.why2),
    inter('No gráfico de captura, ajuste D para que Q seja 1 após a primeira borda.', 'plot', timing().props, v => v.p.d === 1, 'D=1', 'A primeira borda captura D=1; Q parte de 0 e passa a 1.'),
    useLatch ? forceLatch(true) : capture(true),
    useLatch ? forceLatch(false) : capture(false),
  ],
});

export const sequenciais: UnitDef = {
  id: 'dg-seq', title: 'Circuitos sequenciais', icon: '🔄',
  subtitle: 'Memória, clock, contagem e estados',
  source: 'Tema complementar: Tocci, Widmer e Moss, Sistemas Digitais; Floyd, Sistemas Digitais.',
  extra: true,
  guide: t`Latch SR com NOR: $S=1,R=0$ define $Q=1$; $S=0,R=1$ limpa; $S=R=0$ conserva; $S=R=1$ é proibido. Na borda ativa, D: $Q^+=D$; JK: $Q^+=J\overline Q+\overline KQ$; T: $Q^+=T\oplus Q$. Contador binário de $n$ bits tem módulo $2^n$; um estágio T divide a frequência por 2. Registradores deslocam bits por borda. Em uma máquina de Moore, saída depende do estado; em Mealy, do estado e da entrada.`,
  lessons: [
    { id: 'dg-seq-latch', title: 'Latch SR', parts: [
      part({ title: 'Memória com portas NOR', body: t`Um circuito sequencial guarda informação: sua saída pode depender do estado anterior. Duas portas NOR realimentadas formam um latch SR ativo em nível alto. Com $S=1$ e $R=0$, Q é definido em 1; com $S=0$ e $R=1$, Q é limpo para 0.`,
        fact: 'Um latch pode conservar um bit de informação.', factAnswer: true, factWhy: 'A realimentação sustenta um dos dois estados estáveis.',
        question: 'No latch NOR, qual entrada define Q em 1?', choices: ['S=1 e R=0', 'S=0 e R=1', 'S=1 e R=1', 'Somente o clock'], why: 'S ativo força Q̅ a 0, permitindo Q=1.',
        question2: 'Qual é o papel da realimentação?', choices2: ['Manter o estado quando as entradas ficam inativas', 'Somar tensões das fontes', 'Eliminar a memória', 'Gerar necessariamente um clock'], why2: 'Cada saída alimenta a outra porta e sustenta o estado estável.',
        generated: n => ({ prompt: `Quantos estados distintos podem ser representados por ${n} latches independentes?`, answer: 2 ** n, explain: `Cada latch guarda um bit; ${n} bits representam ${2 ** n} estados.` }) }, true),
      part({ title: 'Retenção e condição proibida', body: t`No latch NOR, $S=R=0$ conserva o estado estabelecido anteriormente. Com $S=R=1$, ambas as saídas ficam 0, deixando de ser complementares; a liberação simultânea pode resultar em estado imprevisível. Evite essa combinação.`,
        fact: 'Com S=R=0, o latch NOR ideal mantém o estado anterior.', factAnswer: true, factWhy: 'As duas portas realimentadas conservam o estado estabelecido.',
        question: 'Qual combinação é proibida no latch SR com NOR?', choices: ['S=1 e R=1', 'S=0 e R=0', 'S=1 e R=0', 'S=0 e R=1'], why: 'Com ambas em 1, Q e Q̅ são forçados a 0 e a liberação simultânea não garante o próximo estado.',
        question2: 'Após definir Q=1, o que ocorre ao voltar a S=R=0?', choices2: ['Q permanece em 1', 'Q passa necessariamente a 0', 'Q alterna a cada segundo', 'As duas saídas ficam em 1'], why2: 'A condição de retenção conserva o 1 previamente definido.',
        generated: n => ({ prompt: `Um banco de ${n} latches guarda quantos bits?`, answer: n, explain: `Cada latch guarda um bit, portanto o banco guarda ${n} bits.` }) }, true),
    ] },
    { id: 'dg-seq-ff', title: 'Flip-flops D, JK e T', parts: [
      part({ title: 'Captura na borda', body: t`O flip-flop D disparado na borda de subida copia D para Q nesse instante: $Q^+=D$. Entre bordas, Q conserva o valor capturado. Um latch sensível a nível pode acompanhar a entrada enquanto habilitado. Em dispositivos reais respeite os tempos de setup e hold.`,
        fact: 'Um flip-flop D de borda não precisa acompanhar D entre bordas.', factAnswer: true, factWhy: 'Q guarda o valor amostrado na última borda ativa.',
        question: 'Na borda de subida, D=1. Qual o próximo Q ideal?', choices: ['1', '0', 'Depende apenas do Q antigo', 'Sempre alterna'], why: 'Na borda ativa, Q recebe D, que vale 1.',
        question2: 'Para que servem os tempos de setup e hold?', choices2: ['Definir a janela de estabilidade de D em torno da borda', 'Determinar a cor do CI', 'Garantir que Q mude continuamente', 'Substituir a alimentação'], why2: 'A entrada deve permanecer estável antes e depois da borda conforme a folha de dados.',
        generated: n => ({ prompt: `Um banco com ${n} flip-flops D guarda quantos bits?`, answer: n, explain: `Cada flip-flop guarda um bit: ${n} no total.` }) }),
      part({ title: 'JK e T', body: t`Na borda ativa do JK: 00 mantém, 01 limpa, 10 define e 11 alterna Q. O flip-flop T mantém para $T=0$ e alterna para $T=1$: $Q^+=T\oplus Q$. D, JK e T são modelos de comportamento; o simulador fornece diretamente D.`,
        fact: 'No JK, J=K=1 provoca alternância na borda ativa.', factAnswer: true, factWhy: 'Para 11, o próximo estado é o complemento do atual.',
        question: 'Com T=0, qual é o próximo estado?', choices: ['O estado atual', 'Sempre 0', 'Sempre 1', 'O complemento do estado atual'], why: 'T=0 mantém Q; T=1 alterna.',
        question2: 'Em um JK, J=0 e K=1 provoca qual ação?', choices2: ['Limpar Q para 0', 'Definir Q em 1', 'Alternar Q', 'Manter Q'], why2: 'A combinação 01 é reset, independentemente do estado anterior.',
        generated: n => ({ prompt: `Um T inicia em 0, com T=1 em ${n} bordas. Qual é Q ao final?`, answer: n % 2, explain: `Cada borda alterna Q; após ${n} alternâncias, Q=${n % 2}.` }) }),
    ] },
    { id: 'dg-seq-cont', title: 'Contadores', parts: [
      part({ title: 'Contagem binária', body: t`Um contador percorre estados em resposta a pulsos. Um contador binário crescente de $n$ bits percorre $0$ a $2^n-1$ e retorna a zero: módulo $2^n$. Por exemplo, 2 bits seguem 00, 01, 10, 11, 00.`,
        fact: 'Um contador binário de 2 bits tem quatro estados.', factAnswer: true, factWhy: 'Os estados são 00, 01, 10 e 11.',
        question: 'Qual estado segue 011 em um contador binário crescente de 3 bits?', choices: ['100', '010', '111', '000'], why: 'Somar 1 a 011 gera 100 após os transportes.',
        question2: 'Depois de 111, qual estado vem em um contador crescente de 3 bits?', choices2: ['000', '100', '001', '1111'], why2: 'O contador tem módulo 8 e retorna a 000 após 111.',
        generated: n => ({ prompt: `Qual é o módulo de um contador binário completo de ${n} bits?`, answer: 2 ** n, explain: `Com ${n} bits há 2^${n}=${2 ** n} estados.` }) }),
      part({ title: 'Divisão e sincronismo', body: t`Um estágio que alterna a cada borda completa um ciclo de Q em duas bordas; sua frequência é metade da frequência do clock. Em um contador síncrono os flip-flops recebem o mesmo clock; no ripple, a mudança se propaga de estágio a estágio, introduzindo atrasos.`,
        fact: 'Um estágio que alterna em cada borda divide a frequência por 2.', factAnswer: true, factWhy: 'São necessárias duas bordas para retornar ao mesmo valor e completar um ciclo.',
        question: 'Qual é a principal característica de um contador síncrono?', choices: ['Flip-flops recebem o mesmo clock', 'Não tem elementos de memória', 'Cada estágio só recebe clock da saída anterior', 'Todos os bits devem mudar em toda borda'], why: 'Os elementos compartilham o clock; a lógica decide quais bits mudam.',
        question2: 'Por que um contador ripple pode apresentar estados transitórios?', choices2: ['Os atrasos se propagam entre estágios', 'Todos os estágios mudam instantaneamente', 'Não há clock', 'A contagem não usa bits'], why2: 'Cada estágio responde após o anterior, criando atrasos de propagação.',
        generated: n => ({ prompt: `Um estágio alternador recebe clock de ${2 * n} Hz. Qual a frequência ideal de Q em Hz?`, answer: n, explain: `${2 * n} dividido por 2 é ${n} Hz.` }) }),
    ] },
    { id: 'dg-seq-reg', title: 'Registradores de deslocamento', parts: [
      part({ title: 'Deslocamento serial', body: t`Um registrador de deslocamento encadeia flip-flops para mover bits a cada borda. Para deslocar à direita em quatro posições, adote $b_3b_2b_1b_0$: o novo bit serial entra em $b_3$, cada bit vai para a direita e o antigo $b_0$ sai.`,
        fact: 'Um registrador de 4 bits armazena quatro bits.', factAnswer: true, factWhy: 'Cada uma das quatro posições guarda um bit.',
        question: 'Em 1010, deslocando à direita e entrando 1 à esquerda, qual o resultado?', choices: ['1101', '0101', '1011', '0110'], why: 'O 1 entra à esquerda, 101 avança à direita e o último 0 sai: 1101.',
        question2: 'Qual bit sai de 1010 em um deslocamento à direita?', choices2: ['0 da direita', '1 da esquerda', 'O segundo bit da esquerda', 'Nenhum bit'], why2: 'O bit menos significativo, à direita, é descartado ou entregue à saída serial.',
        generated: n => ({ prompt: `Quantas bordas são necessárias para inserir ${n} bits seriais, um por borda?`, answer: n, explain: `Entra um bit em cada borda; ${n} bits exigem ${n} bordas.` }) }),
      part({ title: 'Entrada e saída serial ou paralela', body: t`SISO recebe e entrega bits em série; SIPO recebe em série e disponibiliza as posições em paralelo. PISO carrega em paralelo e entrega em série; PIPO carrega e apresenta em paralelo. O sentido e a ordem de transmissão devem ser especificados.`,
        fact: 'SIPO significa entrada serial e saída paralela.', factAnswer: true, factWhy: 'Serial-in, parallel-out: os bits entram um por vez e ficam disponíveis nas posições.',
        question: 'Qual registrador converte entrada paralela em saída serial?', choices: ['PISO', 'SIPO', 'SISO', 'PIPO'], why: 'PISO significa parallel-in, serial-out.',
        question2: 'Inicialmente 0000, entram 1, 0, 1, 1 nessa ordem pela esquerda em deslocamentos à direita. Qual o estado final?', choices2: ['1101', '1011', '0110', '1110'], why2: 'As etapas são 1000, 0100, 1010 e 1101.',
        generated: n => ({ prompt: `Quantas bordas inserem ${n} bits em um SIPO, à taxa de um bit por borda?`, answer: n, explain: `São ${n} bits, um por borda, portanto ${n} bordas.` }) }),
    ] },
    { id: 'dg-seq-fsm', title: 'Máquinas de estados', parts: [
      part({ title: 'Estado e transição', body: t`Uma máquina de estados finitos (FSM) tem um conjunto finito de estados, entradas, uma regra de próximo estado e saídas. No modelo síncrono, o registrador guarda o estado e o atualiza na borda; a lógica combinacional calcula o próximo estado.`,
        fact: 'Uma FSM síncrona pode usar flip-flops para guardar seu estado.', factAnswer: true, factWhy: 'O registrador de estado mantém a codificação entre bordas.',
        question: 'O que define a transição de uma FSM?', choices: ['Estado atual e entrada, conforme a regra', 'Apenas a cor do circuito', 'Somente a tensão de alimentação', 'A quantidade de fios, sem regra'], why: 'A função de transição combina o estado atual com as entradas.',
        question2: 'Uma FSM alterna A→B→A em cada borda. Partindo de A, onde está após 3 bordas?', choices2: ['B', 'A', 'Em ambos os estados', 'Não há informação suficiente'], why2: 'As três transições são A→B→A→B.',
        generated: n => ({ prompt: `Uma FSM alterna entre A e B a cada borda. Partindo de A, quantas transições ocorrem em ${n} bordas?`, answer: n, explain: `Há uma transição por borda, logo ${n} transições.` }) }),
      part({ title: 'Moore, Mealy e codificação', body: t`Na máquina de Moore a saída depende apenas do estado atual; na de Mealy depende também da entrada atual. Para codificar $N$ estados distintos em binário, use ao menos $n$ bits tais que $2^n\ge N$. Estados não usados precisam de tratamento no projeto.`,
        fact: 'Em uma máquina de Mealy, a saída pode depender diretamente da entrada.', factAnswer: true, factWhy: 'A saída de Mealy é função do estado atual e da entrada atual.',
        question: 'Qual máquina tem saída determinada apenas pelo estado atual?', choices: ['Moore', 'Mealy', 'Uma porta XOR isolada', 'Um contador sem estado'], why: 'Na definição de Moore, a saída é função somente do estado.',
        question2: 'Quantos bits são necessários para codificar 5 estados?', choices2: ['3', '2', '4', '5'], why2: 'Dois bits codificam 4 estados; três codificam 8 e são suficientes.',
        generated: n => ({ prompt: `Com ${n} bits de estado, quantas codificações binárias existem?`, answer: 2 ** n, explain: `Cada bit tem duas possibilidades: 2^${n}=${2 ** n} codificações.` }) }),
    ] },
  ],
};
