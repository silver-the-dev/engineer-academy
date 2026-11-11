import React from 'react';
import type { Exercise, UnitDef } from '../../types';
import { fill, gen, match, mcq, num, order, plot, table, tf } from '../../helpers';
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
type Practice = [Exercise, Exercise, Exercise, Exercise];
const practice = {
  latchSet: [
    num('Em um latch NOR, R está em 1 e S em 0. Que nível fica em Q?', 0, 'R força a saída Q da porta NOR para zero.'),
    match('Associe a configuração ao efeito no latch SR.', [['S=1 e R=0', 'Definir Q'], ['S=0 e R=1', 'Limpar Q'], ['S=R=0', 'Conservar Q']], 'Os dois comandos ativos têm efeitos opostos. Com ambos inativos, a realimentação conserva o bit.'),
    forceLatch(true),
    forceLatch(false),
  ],
  latchHold: [
    fill('Um latch NOR foi colocado em Q=1. Complete os níveis de S e R que mantêm o valor sem forçar nenhum comando.', 'S = ___; R = ___.', ['0', '0'], ['1', '1'], 'Com as duas entradas inativas, a realimentação mantém o estado.'),
    num('Depois de limpar o latch, as duas entradas voltam a 0. Qual é Q?', 0, 'O estado anterior era zero; S=R=0 conserva esse estado.'),
    tf('Liberar S e R juntos após a condição proibida garante que Q voltará ao valor anterior.', false, 'As duas saídas foram forçadas a 0. A liberação simultânea não determina qual porta responderá primeiro.'),
    order('S e R começam em 0. Ordene os passos para gravar 1, soltar S e comprovar a retenção.', ['Ativar S e confirmar Q em 1', 'Desativar S com R em 0', 'Verificar que Q continua em 1'], 'Depois de retirar o pulso S, as duas entradas em 0 deixam Q no estado gravado.'),
  ],
  d: [
    num('D vale 1 na borda de subida e muda para 0 entre bordas. Qual Q imediatamente depois da mudança em D?', 1, 'Q guarda o 1 amostrado e só muda na próxima borda ativa.'),
    num('Q começa em 0 e D vale 1. Quantas bordas de subida precisam ocorrer para a primeira captura de 1?', 1, 'O primeiro pulso de subida já captura D. A borda de descida não faz a captura.'),
    capture(true),
    num('D vale 0 na primeira borda e 1 na segunda. Qual Q logo depois da segunda?', 1, 'Na segunda borda o flip-flop substitui o valor anterior por D=1.'),
  ],
  jk: [
    match('Ligue cada entrada do JK à ação na borda.', [['J=0, K=0', 'Manter'], ['J=0, K=1', 'Limpar'], ['J=1, K=0', 'Definir'], ['J=1, K=1', 'Alternar']], 'As quatro combinações representam manter, limpar, definir e alternar.'),
    fill('Um T parte de Q=0 e recebe T=1 nas três bordas. Complete Q após cada borda.', '___, ___, ___', ['1', '0', '1'], ['0'], 'Cada borda com T ativo inverte o estado.'),
    num('Um JK parte de Q=1. A primeira borda recebe J=K=1, e a segunda recebe J=K=0. Qual Q final?', 0, 'A primeira borda alterna para 0; a segunda conserva.'),
    tf('O JK alterna continuamente com J=K=1 mesmo sem bordas ativas.', false, 'Em um flip-flop disparado por borda, a mudança só ocorre na borda ativa.'),
  ],
  count: [
    order('Ordene quatro estados consecutivos de um contador de 2 bits, começando em 10.', ['10', '11', '00', '01'], 'Após 11, o contador volta a 00.'),
    num('Um contador de 3 bits está em 6. Depois de três pulsos, que valor decimal ele mostra?', 1, 'A sequência é 7, 0, 1. A contagem é módulo 8.'),
    fill('Complete o próximo estado de um contador de 4 bits após 1111.', '___', ['0000'], ['1110', '1000', '1111'], 'O máximo de 4 bits é 15. O próximo pulso reinicia a contagem.'),
    num('Um contador começa em 0 e tem módulo 8. Em qual valor fica após 19 pulsos?', 3, 'Duas voltas consomem 16 pulsos e restam 3.'),
  ],
  divide: [
    num('Três estágios dividem a frequência pela metade, um após o outro. Com 96 Hz na entrada, qual a frequência final?', 12, 'As frequências são 48, 24 e 12 Hz.', { unit: 'Hz' }),
    order('Ordene a propagação de uma mudança em um contador ripple de três estágios.', ['Clock externo atinge o primeiro estágio', 'Saída do primeiro aciona o segundo', 'Saída do segundo aciona o terceiro'], 'O clock não chega a todos ao mesmo tempo.'),
    num('Um estágio alterna Q a cada borda de clock. Quantas bordas completam cinco ciclos de Q?', 10, 'Cada ciclo completo de Q exige duas alternâncias.'),
    tf('Saídas de um contador ripple podem formar códigos intermediários durante a propagação.', true, 'Os estágios mudam em instantes distintos devido aos atrasos.'),
  ],
  shift: [
    fill('O registrador contém 0110. Entra 1 pela esquerda e ocorre um deslocamento à direita. Complete o novo conteúdo.', '___', ['1011'], ['1100', '0011', '0111'], 'O 1 novo ocupa a esquerda e os três bits anteriores mais à esquerda avançam.'),
    num('Em 0101, qual bit sai no próximo deslocamento à direita?', 1, 'A saída serial recebe o bit mais à direita, que é 1.'),
    order('Partindo de 0000, entram três bits 1 pela esquerda. Ordene o conteúdo após cada borda.', ['1000', '1100', '1110'], 'A cada borda, os bits anteriores andam uma casa para a direita.'),
    fill('Partindo de 1000, entram dois zeros pela esquerda. Complete o estado após duas bordas.', '___', ['0010'], ['0100', '0001', '1100'], 'O bit alto se desloca duas posições à direita.'),
  ],
  serial: [
    match('Associe o objetivo ao tipo de registrador.', [['Receber em série e acionar quatro saídas juntas', 'SIPO'], ['Capturar quatro botões e enviar os bits em série', 'PISO'], ['Atrasar uma sequência serial', 'SISO']], 'A primeira parte da sigla indica como os dados entram; a segunda, como saem.'),
    num('Um PISO carregou 1011 e envia o menos significativo primeiro. Qual é o segundo bit transmitido?', 1, 'Da direita para a esquerda saem 1, 1, 0, 1.'),
    fill('Um SIPO começa em 0000. Entram, pela esquerda, 0, 1, 0 e 1. Complete o conteúdo paralelo final.', '___', ['1010'], ['0101', '0011', '1100'], 'O último bit recebido fica à esquerda; os anteriores avançam para a direita.'),
    tf('Num PIPO, os quatro bits de uma palavra podem ser carregados juntos na mesma borda.', true, 'As entradas de dados são paralelas.'),
  ],
  fsm: [
    order('Um semáforo segue verde, amarelo, vermelho e retorna a verde. Ordene os próximos três estados começando depois de verde.', ['Amarelo', 'Vermelho', 'Verde'], 'O estado atual determina qual transição ocorre a seguir.'),
    fill('Um alarme tem estados NORMAL e ALERTA. A regra só permite sair de ALERTA com reset. Complete o próximo estado sem reset.', '___', ['ALERTA'], ['NORMAL'], 'A regra mantém ALERTA enquanto o reset não chega.'),
    num('Uma máquina tem sete estados distintos. Qual o menor número de bits de um registrador binário que permite codificar todos?', 3, 'Dois bits têm quatro códigos; três têm oito.'),
    tf('Uma entrada pode alterar o próximo estado sem mudar o registrador antes da borda ativa.', true, 'A lógica calcula o próximo estado continuamente, mas o registrador o captura na borda.'),
  ],
  moore: [
    match('Associe o comportamento à definição de saída.', [['Saída depende só do estado', 'Moore'], ['Saída depende do estado e da entrada', 'Mealy']], 'A distinção é se a entrada atual afeta diretamente a saída.'),
    num('Cinco estados foram codificados com três bits. Quantos códigos sobraram sem uso?', 3, 'Três bits geram oito códigos; oito menos cinco dá três.'),
    tf('Uma máquina de Moore pode mudar a saída diretamente ao mudar a entrada, mantendo o mesmo estado.', false, 'A saída de Moore depende do estado; a entrada só pode afetá-la por uma transição.'),
    fill('O registrador caiu em um código não usado. Complete o destino mais adequado para uma recuperação definida no projeto:', 'Voltar ao ___.', ['estado seguro especificado'], ['código anterior desconhecido', 'estado que gastar mais energia'], 'A recuperação de um código inválido deve seguir uma regra explícita.'),
  ],
} satisfies Record<string, Practice>;
const theoryVisuals: Partial<Record<keyof typeof practice, ReturnType<typeof table>>> = {
  latchHold: table(['Passo', 'S', 'R', 'Q'], [['Definir', 1, 0, 1], ['Soltar S', 0, 0, 1], ['Limpar', 0, 1, 0], ['Soltar R', 0, 0, 0]], [1, 3]),
  jk: table(['J', 'K', 'Q após a borda'], [[0, 0, 'Q anterior'], [0, 1, 0], [1, 0, 1], [1, 1, 'Inverte Q']]),
  shift: table(['Borda', 'Bit que entra', 'Conteúdo', 'Bit que sai'], [['Inicial', '—', '0011', '—'], [1, 1, '1001', 1], [2, 0, '0100', 1]]),
  fsm: table(['Estado atual', 'Entrada', 'Próximo estado'], [['Fechado', 'Cartão válido', 'Aberto'], ['Fechado', 'Cartão inválido', 'Fechado'], ['Aberto', 'Tempo esgotado', 'Fechado']]),
};
const part = (o: Topic, kind: keyof typeof practice) => ({
  card: {
    title: o.title, body: o.body, visual: theoryVisuals[kind],
    ...(kind === 'd' ? { visual: timing(), tip: 'Mude D e observe Q depois da primeira borda de subida.' } : {}),
    ...(kind === 'latchSet' ? { visual: circuitVisual(latchSpec(true, false)), tip: 'Compare Q ao alternar os comandos S e R, um de cada vez.' } : {}),
  },
  exercises: [
    tf(o.fact, o.factAnswer, o.factWhy),
    mcq(o.question, o.choices, 0, o.why),
    practice[kind][0],
    gen(rng => { const x = o.generated(randInt(rng, 1, 4)); return num(x.prompt, x.answer, x.explain); }),
    mcq(o.question2, o.choices2, 0, o.why2),
    ...practice[kind].slice(1),
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
        generated: n => ({ prompt: `Quantos estados distintos podem ser representados por ${n} latches independentes?`, answer: 2 ** n, explain: `Cada latch guarda um bit; ${n} bits representam ${2 ** n} estados.` }) }, 'latchSet'),
      part({ title: 'Retenção e condição proibida', body: t`No latch NOR, $S=R=0$ conserva o estado estabelecido anteriormente. Com $S=R=1$, ambas as saídas ficam 0, deixando de ser complementares; a liberação simultânea pode resultar em estado imprevisível. Evite essa combinação.`,
        fact: 'Com S=R=0, o latch NOR ideal mantém o estado anterior.', factAnswer: true, factWhy: 'As duas portas realimentadas conservam o estado estabelecido.',
        question: 'Qual combinação é proibida no latch SR com NOR?', choices: ['S=1 e R=1', 'S=0 e R=0', 'S=1 e R=0', 'S=0 e R=1'], why: 'Com ambas em 1, Q e Q̅ são forçados a 0 e a liberação simultânea não garante o próximo estado.',
        question2: 'Após definir Q=1, o que ocorre ao voltar a S=R=0?', choices2: ['Q permanece em 1', 'Q passa necessariamente a 0', 'Q alterna a cada segundo', 'As duas saídas ficam em 1'], why2: 'A condição de retenção conserva o 1 previamente definido.',
        generated: n => ({ prompt: `Um banco de ${n} latches guarda quantos bits?`, answer: n, explain: `Cada latch guarda um bit, portanto o banco guarda ${n} bits.` }) }, 'latchHold'),
    ] },
    { id: 'dg-seq-ff', title: 'Flip-flops D, JK e T', parts: [
      part({ title: 'Captura na borda', body: t`O flip-flop D disparado na borda de subida copia D para Q nesse instante: $Q^+=D$. Entre bordas, Q conserva o valor capturado. Um latch sensível a nível pode acompanhar a entrada enquanto habilitado. Em dispositivos reais respeite os tempos de setup e hold.`,
        fact: 'Um flip-flop D de borda não precisa acompanhar D entre bordas.', factAnswer: true, factWhy: 'Q guarda o valor amostrado na última borda ativa.',
        question: 'Na borda de subida, D=1. Qual o próximo Q ideal?', choices: ['1', '0', 'Depende apenas do Q antigo', 'Sempre alterna'], why: 'Na borda ativa, Q recebe D, que vale 1.',
        question2: 'Para que servem os tempos de setup e hold?', choices2: ['Definir a janela de estabilidade de D em torno da borda', 'Determinar a cor do CI', 'Garantir que Q mude continuamente', 'Substituir a alimentação'], why2: 'A entrada deve permanecer estável antes e depois da borda conforme a folha de dados.',
        generated: n => ({ prompt: `Um banco com ${n} flip-flops D guarda quantos bits?`, answer: n, explain: `Cada flip-flop guarda um bit: ${n} no total.` }) }, 'd'),
      part({ title: 'JK e T', body: t`Na borda ativa do JK: 00 mantém, 01 limpa, 10 define e 11 alterna Q. O flip-flop T mantém para $T=0$ e alterna para $T=1$: $Q^+=T\oplus Q$. D, JK e T são modelos de comportamento; o simulador fornece diretamente D.`,
        fact: 'No JK, J=K=1 provoca alternância na borda ativa.', factAnswer: true, factWhy: 'Para 11, o próximo estado é o complemento do atual.',
        question: 'Com T=0, qual é o próximo estado?', choices: ['O estado atual', 'Sempre 0', 'Sempre 1', 'O complemento do estado atual'], why: 'T=0 mantém Q; T=1 alterna.',
        question2: 'Em um JK, J=0 e K=1 provoca qual ação?', choices2: ['Limpar Q para 0', 'Definir Q em 1', 'Alternar Q', 'Manter Q'], why2: 'A combinação 01 é reset, independentemente do estado anterior.',
        generated: n => ({ prompt: `Um T inicia em 0, com T=1 em ${n} bordas. Qual é Q ao final?`, answer: n % 2, explain: `Cada borda alterna Q; após ${n} alternâncias, Q=${n % 2}.` }) }, 'jk'),
    ] },
    { id: 'dg-seq-cont', title: 'Contadores', parts: [
      part({ title: 'Contagem binária', body: t`Um contador percorre estados em resposta a pulsos. Um contador binário crescente de $n$ bits percorre $0$ a $2^n-1$ e retorna a zero: módulo $2^n$. Por exemplo, 2 bits seguem 00, 01, 10, 11, 00.`,
        fact: 'Um contador binário de 2 bits tem quatro estados.', factAnswer: true, factWhy: 'Os estados são 00, 01, 10 e 11.',
        question: 'Qual estado segue 011 em um contador binário crescente de 3 bits?', choices: ['100', '010', '111', '000'], why: 'Somar 1 a 011 gera 100 após os transportes.',
        question2: 'Depois de 111, qual estado vem em um contador crescente de 3 bits?', choices2: ['000', '100', '001', '1111'], why2: 'O contador tem módulo 8 e retorna a 000 após 111.',
        generated: n => ({ prompt: `Qual é o módulo de um contador binário completo de ${n} bits?`, answer: 2 ** n, explain: `Com ${n} bits há 2^${n}=${2 ** n} estados.` }) }, 'count'),
      part({ title: 'Divisão e sincronismo', body: t`Um estágio que alterna a cada borda completa um ciclo de Q em duas bordas; sua frequência é metade da frequência do clock. Em um contador síncrono os flip-flops recebem o mesmo clock; no ripple, a mudança se propaga de estágio a estágio, introduzindo atrasos.`,
        fact: 'Um estágio que alterna em cada borda divide a frequência por 2.', factAnswer: true, factWhy: 'São necessárias duas bordas para retornar ao mesmo valor e completar um ciclo.',
        question: 'Qual é a principal característica de um contador síncrono?', choices: ['Flip-flops recebem o mesmo clock', 'Não tem elementos de memória', 'Cada estágio só recebe clock da saída anterior', 'Todos os bits devem mudar em toda borda'], why: 'Os elementos compartilham o clock; a lógica decide quais bits mudam.',
        question2: 'Por que um contador ripple pode apresentar estados transitórios?', choices2: ['Os atrasos se propagam entre estágios', 'Todos os estágios mudam instantaneamente', 'Não há clock', 'A contagem não usa bits'], why2: 'Cada estágio responde após o anterior, criando atrasos de propagação.',
        generated: n => ({ prompt: `Um estágio alternador recebe clock de ${2 * n} Hz. Qual a frequência ideal de Q em Hz?`, answer: n, explain: `${2 * n} dividido por 2 é ${n} Hz.` }) }, 'divide'),
    ] },
    { id: 'dg-seq-reg', title: 'Registradores de deslocamento', parts: [
      part({ title: 'Deslocamento serial', body: t`Um registrador de deslocamento encadeia flip-flops para mover bits a cada borda. Para deslocar à direita em quatro posições, adote $b_3b_2b_1b_0$: o novo bit serial entra em $b_3$, cada bit vai para a direita e o antigo $b_0$ sai.`,
        fact: 'Um registrador de 4 bits armazena quatro bits.', factAnswer: true, factWhy: 'Cada uma das quatro posições guarda um bit.',
        question: 'Em 1010, deslocando à direita e entrando 1 à esquerda, qual o resultado?', choices: ['1101', '0101', '1011', '0110'], why: 'O 1 entra à esquerda, 101 avança à direita e o último 0 sai: 1101.',
        question2: 'Qual bit sai de 1010 em um deslocamento à direita?', choices2: ['0 da direita', '1 da esquerda', 'O segundo bit da esquerda', 'Nenhum bit'], why2: 'O bit menos significativo, à direita, é descartado ou entregue à saída serial.',
        generated: n => ({ prompt: `Quantas bordas são necessárias para inserir ${n} bits seriais, um por borda?`, answer: n, explain: `Entra um bit em cada borda; ${n} bits exigem ${n} bordas.` }) }, 'shift'),
      part({ title: 'Entrada e saída serial ou paralela', body: t`SISO recebe e entrega bits em série; SIPO recebe em série e disponibiliza as posições em paralelo. PISO carrega em paralelo e entrega em série; PIPO carrega e apresenta em paralelo. O sentido e a ordem de transmissão devem ser especificados.`,
        fact: 'SIPO significa entrada serial e saída paralela.', factAnswer: true, factWhy: 'Serial-in, parallel-out: os bits entram um por vez e ficam disponíveis nas posições.',
        question: 'Qual registrador converte entrada paralela em saída serial?', choices: ['PISO', 'SIPO', 'SISO', 'PIPO'], why: 'PISO significa parallel-in, serial-out.',
        question2: 'Inicialmente 0000, entram 1, 0, 1, 1 nessa ordem pela esquerda em deslocamentos à direita. Qual o estado final?', choices2: ['1101', '1011', '0110', '1110'], why2: 'As etapas são 1000, 0100, 1010 e 1101.',
        generated: n => ({ prompt: `Quantas bordas inserem ${n} bits em um SIPO, à taxa de um bit por borda?`, answer: n, explain: `São ${n} bits, um por borda, portanto ${n} bordas.` }) }, 'serial'),
    ] },
    { id: 'dg-seq-fsm', title: 'Máquinas de estados', parts: [
      part({ title: 'Estado e transição', body: t`Uma máquina de estados finitos (FSM) tem um conjunto finito de estados, entradas, uma regra de próximo estado e saídas. No modelo síncrono, o registrador guarda o estado e o atualiza na borda; a lógica combinacional calcula o próximo estado.`,
        fact: 'Uma FSM síncrona pode usar flip-flops para guardar seu estado.', factAnswer: true, factWhy: 'O registrador de estado mantém a codificação entre bordas.',
        question: 'O que define a transição de uma FSM?', choices: ['Estado atual e entrada, conforme a regra', 'Apenas a cor do circuito', 'Somente a tensão de alimentação', 'A quantidade de fios, sem regra'], why: 'A função de transição combina o estado atual com as entradas.',
        question2: 'Uma FSM alterna A→B→A em cada borda. Partindo de A, onde está após 3 bordas?', choices2: ['B', 'A', 'Em ambos os estados', 'Não há informação suficiente'], why2: 'As três transições são A→B→A→B.',
        generated: n => ({ prompt: `Uma FSM alterna entre A e B a cada borda. Partindo de A, quantas transições ocorrem em ${n} bordas?`, answer: n, explain: `Há uma transição por borda, logo ${n} transições.` }) }, 'fsm'),
      part({ title: 'Moore, Mealy e codificação', body: t`Na máquina de Moore a saída depende apenas do estado atual; na de Mealy depende também da entrada atual. Para codificar $N$ estados distintos em binário, use ao menos $n$ bits tais que $2^n\ge N$. Estados não usados precisam de tratamento no projeto.`,
        fact: 'Em uma máquina de Mealy, a saída pode depender diretamente da entrada.', factAnswer: true, factWhy: 'A saída de Mealy é função do estado atual e da entrada atual.',
        question: 'Qual máquina tem saída determinada apenas pelo estado atual?', choices: ['Moore', 'Mealy', 'Uma porta XOR isolada', 'Um contador sem estado'], why: 'Na definição de Moore, a saída é função somente do estado.',
        question2: 'Quantos bits são necessários para codificar 5 estados?', choices2: ['3', '2', '4', '5'], why2: 'Dois bits codificam 4 estados; três codificam 8 e são suficientes.',
        generated: n => ({ prompt: `Com ${n} bits de estado, quantas codificações binárias existem?`, answer: 2 ** n, explain: `Cada bit tem duas possibilidades: 2^${n}=${2 ** n} codificações.` }) }, 'moore'),
    ] },
  ],
};
