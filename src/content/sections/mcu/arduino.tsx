import React from 'react';
import type { UnitDef } from '../../types';
import { code, gen, match, mcq, num, order, plot, table, tf, near } from '../../helpers';
import { Label, RectW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, randInt } from '../../../lib/random';
import { circuit, circuitEx, circuitVisual, wires, V, R, LED, SW, OUT, CLK } from '../../circuits';

const t = String.raw;

const chipBlocks = plot({
  view: { xMin: 0, xMax: 12, yMin: 0, yMax: 6 },
  axes: false, grid: false, tickLabels: false,
  render: () => <>
    <Seg x1={2.1} y1={3} x2={9.9} y2={3} color={C.textDim} />
    <Seg x1={6} y1={2} x2={6} y2={4.15} color={C.textDim} />
    <Seg x1={2.1} y1={2} x2={2.1} y2={3} color={C.textDim} />
    <Seg x1={9.9} y1={2} x2={9.9} y2={3} color={C.textDim} />
    <RectW x={4.4} y={4.15} w={3.2} h={1.3} color={C.p2} opacity={0.28} />
    <Label x={6} y={4.8} text="CPU" anchor="middle" />
    <Label x={8.7} y={3.55} text="Barramento interno" anchor="middle" size={12} />
    {['Flash', 'SRAM', 'GPIO'].map((label, i) => {
      const x = 2.1 + i * 3.9;
      return <React.Fragment key={label}>
        <RectW x={x - 1.6} y={0.7} w={3.2} h={1.3} color={C.p3} opacity={0.25} />
        <Label x={x} y={1.35} text={label} anchor="middle" />
      </React.Fragment>;
    })}
  </>,
}, 165);
const led = (r: number) => circuit(V('pin', [0, 0], [0, 3], 5, { fixed: true, locked: true }), wires([0, 0], [2, 0]), R('r', [2, 0], [5, 0], r, { min: 100, max: 1000, locked: true }), LED('led', [5, 0], [5, 3], 'red', { locked: true, show: ['i'] }), wires([5, 3], [0, 3]));
const button = (pullup: boolean) => circuit(V('v', [0, 0], [0, 4], 5, { fixed: true, locked: true }), ...(pullup ? [R('r', [0, 0], [3, 0], 10000, { fixed: true, locked: true }), SW('s', [3, 2], [3, 4], false, { locked: true })] : [SW('s', [0, 0], [3, 0], false, { locked: true }), R('r', [3, 2], [3, 4], 10000, { fixed: true, locked: true })]), wires([3, 0], [3, 2]), OUT('out', [3, 2]), wires([3, 4], [0, 4]));
const divider = (r: number) => circuit(V('v', [0, 0], [0, 4], 5, { fixed: true, locked: true }), R('top', [0, 0], [3, 0], 10000, { fixed: true, locked: true }), wires([3, 0], [3, 2]), OUT('adc', [3, 2]), R('bottom', [3, 2], [3, 4], r, { min: 1000, max: 30000, locked: true }), wires([3, 4], [0, 4]));
const pwm = (volts: number) => circuit(CLK('clk', [0, 0], [0, 3], 100, volts, { min: 1, max: 5, locked: true }), R('load', [0, 0], [3, 0], 1000, { fixed: true, locked: true }), wires([3, 0], [3, 3], [0, 3]));
const ledEx = (current: number, resistance: number) => circuitEx(t`Ajuste o resistor para a corrente do LED ficar perto de $${current}\,\text{mA}$, sem ultrapassar $20\,\text{mA}$.`, { comps: led(1000), mode: 'adjust' }, v => near(v.i('led'), current / 1000, 0.001) && v.i('led') <= 0.020 && !v.burnt('led'), t`Cerca de $${resistance}\,\Omega$.`, t`Com LED vermelho de aproximadamente $1,8\,\text{V}$, $R=(5-1,8)/(${current}/1000)=${resistance}\,\Omega$.`, { set: { r: resistance } });

const assembleLed = () => circuitEx(
  'Ligue a saída GPIO ao anodo do LED passando pelo resistor de 330 Ω. Use fios para completar a ligação e meça a corrente do LED.',
  {
    comps: circuit(
      V('GPIO', [1, 1], [1, 5], 5, { fixed: true, locked: true }),
      LED('LED', [8, 1], [8, 5], 'red', { locked: true, show: ['i'] }),
      wires([8, 5], [1, 5]),
    ),
    mode: 'build', cols: 10, rows: 6,
    palette: [{ type: 'resistor', value: 330, fixed: true, max: 1 }, 'wire'],
  },
  v => v.ok && v.count('resistor') === 1 && near(v.i('LED'), 0.0097, 0.001) && !v.burnt('LED'),
  'Resistor de 330 Ω em série entre a saída GPIO e o anodo.',
  'O resistor limita a corrente a cerca de 9,7 mA. O catodo já está ligado ao retorno do circuito.',
  { add: [R('serie', [2, 1], [5, 1], 330), ...wires([1, 1], [2, 1]), ...wires([5, 1], [8, 1])] },
);
const switchEx = (on: boolean, pullup = true) => circuitEx(pullup ? 'Feche o botão e faça a entrada pull-up ler nível baixo.' : 'Feche o botão e faça a entrada pull-down ler nível alto.', { comps: (() => { const c = button(pullup); return c.map(x => x.id === 's' ? { ...x, on: !on } : x); })(), mode: 'adjust' }, v => v.on('out') === !pullup, 'Feche a chave.', pullup ? 'O resistor puxa a entrada para 5 V aberta; fechada, a chave liga a entrada ao terra.' : 'O resistor puxa a entrada ao terra aberta; fechada, a chave liga a entrada a 5 V.', { on: { s: on } });
const divEx = (volts: number, resistance: number) => circuitEx(t`Ajuste o resistor inferior para a entrada ADC medir aproximadamente $${volts}\,\text{V}$.`, { comps: divider(1000), mode: 'adjust' }, v => near(v.v('adc'), volts, 0.05), t`Use $${resistance / 1000}\,\text{k}\Omega$.`, t`No divisor, $V=5R_{inf}/(10000+R_{inf})=${volts}\,\text{V}$.`, { set: { bottom: resistance } });
const pwmEx = (volts: number) => circuitEx(t`Com onda de $50\%$, ajuste a amplitude para obter média de $${fmt(volts / 2)}\,\text{V}$.`, { comps: pwm(1), mode: 'adjust' }, v => near(v.wave('load').avg, volts / 2, 0.04), t`Amplitude $${volts}\,\text{V}$.`, t`A média de uma onda entre zero e $${volts}\,\text{V}$, alta por metade do período, é $${fmt(volts / 2)}\,\text{V}$.`, { set: { clk: volts } });

export const arduino: UnitDef = {
  id: 'mc-ard', title: 'Microcontroladores com Arduino', icon: '🤖',
  subtitle: 'GPIO, conversão, PWM e eventos sem bloqueio',
  source: 'Fase 10 — Microcontroladores I; Roadmap de Eletrônica, mês 5',
  guide: t`No exemplo Arduino Uno clássico, o ADC tem 10 bits e referência de $5\,\text{V}$: $V\approx 5N/1023$. PWM ideal tem média $V_{méd}=D V_H$. Para LED vermelho, $R\approx(5-1,8)/I$. Use tempos sem sinal e compare $agora-anterior\ge intervalo$ para lidar com a virada de millis(). Botão com pull-up lê LOW ao pressionar.`,
  lessons: [
    { id: 'mc-ard-arq', title: 'Por dentro de um microcontrolador', parts: [
      { card: [{ title: 'Um computador em um chip', body: 'A CPU busca as instruções na Flash, usa a SRAM para dados de trabalho e acessa periféricos como os pinos de entrada e saída (GPIO).', visual: chipBlocks, example: 'Ao apertar um botão, a CPU lê a entrada GPIO e atualiza um contador na SRAM. O firmware continua salvo na Flash mesmo quando a placa é desligada.' }, { title: 'Estrutura Arduino', body: 'setup executa uma vez após iniciar; loop é chamado repetidamente. A placa e o chip não são a mesma coisa.', visual: code('void setup() {\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n}', undefined, 'Estrutura básica') }], exercises: [
        mcq('Qual bloco executa instruções?', ['CPU', 'Flash', 'conector USB', 'LED'], 0, 'A CPU busca e executa instruções.'),
        tf('A SRAM mantém variáveis de trabalho enquanto o programa executa.', true, 'A SRAM é memória de trabalho volátil.'),
        mcq('Onde o programa gravado costuma ficar no Uno?', ['Flash', 'SRAM', 'pino GPIO', 'resistor'], 0, 'A Flash não volátil armazena o programa.'),
        num('Quantas vezes setup é chamado após uma inicialização normal?', 1, 'setup é chamado uma vez, antes das chamadas de loop.'),
        gen(rng => { const n = randInt(rng, 2, 8); return num(t`Se loop completar $${n}$ voltas e cada volta ler um sensor uma vez, quantas leituras ocorrem?`, n, t`Uma leitura por volta dá $${n}$ leituras.`); }),
        mcq('O que um periférico GPIO permite?', ['Interagir com pinos digitais', 'Substituir toda a CPU', 'Guardar o programa sem energia', 'Criar energia'], 0, 'GPIO configura e usa pinos digitais.'),
        match('Associe cada parte do microcontrolador a uma função.', [['CPU', 'Executar instruções'], ['Flash', 'Guardar o firmware sem alimentação'], ['SRAM', 'Guardar dados de trabalho enquanto alimentado'], ['GPIO', 'Ler ou comandar níveis digitais']], 'Processamento, armazenamento e interface com o circuito são funções distintas.'),
      ] },
      { card: { title: 'Bits, bytes e fluxo', body: 'Um byte tem 8 bits. Uma condição escolhe um caminho; uma variável guarda um valor. No Uno clássico, int tem 16 bits e unsigned long tem 32 bits.', visual: code('int leitura = 0;\nvoid loop() {\n  leitura = analogRead(A0);\n  if (leitura > 500) {\n    digitalWrite(13, HIGH);\n  } else {\n    digitalWrite(13, LOW);\n  }\n}', undefined, 'Leitura e decisão') }, exercises: [
        num('Quantos bits há em 1 byte?', 8, 'Por definição, um byte tem 8 bits.'),
        num('Quantos padrões distintos há em 4 bits?', 16, t`Cada bit tem duas possibilidades: $2^4=16$.`),
        gen(rng => { const n = randInt(rng, 2, 6); return num(t`Quantos padrões diferentes existem em $${n}$ bits?`, 2 ** n, t`Há duas escolhas por bit: $2^{${n}}=${2 ** n}$.`); }),
        tf('Uma variável local pode guardar uma leitura para uma decisão.', true, 'O programa pode armazenar e testar a leitura.'),
        mcq('Se leitura vale 400 no código, qual saída é escrita?', ['LOW', 'HIGH', '400 V', 'nenhuma, porque setup repete'], 0, '400 não é maior que 500, então o ramo else escreve LOW.'),
        mcq('Qual é a função de um teste if?', ['Escolher um caminho conforme uma condição', 'Apagar a Flash', 'Alimentar o circuito', 'Converter tensão diretamente'], 0, 'O bloco condicional só executa quando sua condição é verdadeira.'),
        num('Um contador registra 12 leituras por segundo durante 5 s. Quantas leituras?', 60, t`$12\times5=60$ leituras.`),
      ] },
    ] },
    { id: 'mc-ard-gpio', title: 'Entradas e saídas digitais', parts: [
      { card: [{ title: 'Saída e LED', body: t`No Uno clássico, configure OUTPUT e escreva HIGH ou LOW. O pino é modelado aqui como fonte ideal de $5\,\text{V}$. Limite a corrente a $20\,\text{mA}$ por pino e confira também limites totais da placa. LED vermelho cai cerca de $1,8\,\text{V}$.`, visual: circuitVisual({ comps: led(330), mode: 'adjust' }) }, { title: 'Acendendo', body: 'A saída HIGH alimenta o LED através do resistor.', visual: code('void setup() {\n  pinMode(13, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(13, HIGH);\n}', undefined, 'Saída digital') }], exercises: [
        mcq('Qual comando configura o pino 13 como saída?', ['pinMode(13, OUTPUT)', 'digitalRead(13)', 'analogRead(13)', 'pinMode(13, INPUT)'], 0, 'pinMode define a direção do pino.'),
        tf('O resistor em série limita a corrente do LED.', true, 'Ele absorve a diferença de tensão e limita a corrente.'),
        num(t`Com $5\,\text{V}$, LED de $1,8\,\text{V}$ e $320\,\Omega$, estime a corrente em mA.`, 10, t`$I=(5-1,8)/320=0,010\,\text{A}=10\,\text{mA}$.`, { unit: 'mA' }),
        gen(rng => { const i = randInt(rng, 4, 16); return num(t`Uma saída fornece $${i}\,\text{mA}$. Quanto falta para $20\,\text{mA}$? Responda em mA.`, 20 - i, t`$20-${i}=${20 - i}\,\text{mA}$.`, { unit: 'mA' }); }),
        mcq(t`Meça a corrente no LED do circuito de $330\,\Omega$. Qual valor é mais próximo?`, [t`$9,7\,\text{mA}$`, t`$30\,\text{mA}$`, t`$100\,\text{mA}$`, t`$0\,\text{mA}$`], 0, t`$(5-1,8)/330\approx9,7\,\text{mA}$.`, { visual: circuitVisual({ comps: led(330), mode: 'adjust' }) }),
        ledEx(10, 320), assembleLed(),
      ] },
      { card: [{ title: 'Botão e resistores', body: 'Uma entrada desconectada pode flutuar. No pull-up, o resistor leva a entrada ao alto; ao fechar o botão para o terra, a leitura fica baixa. Pull-down faz o inverso: resistor ao terra e botão ao positivo.', visual: circuitVisual({ comps: button(true), mode: 'adjust' }) }, { title: 'Leitura com pull-up interno', body: 'INPUT_PULLUP ativa o resistor interno; neste arranjo, LOW indica botão pressionado.', visual: code('void setup() {\n  pinMode(2, INPUT_PULLUP);\n}\nvoid loop() {\n  bool apertado =\n    digitalRead(2) == LOW;\n}', undefined, 'Botão ativo em LOW') }], exercises: [
        mcq('Com pull-up e botão aberto, qual nível se espera?', ['HIGH', 'LOW', 'tensão flutuante', 'corrente de 5 A'], 0, 'O resistor liga a entrada ao positivo.'),
        tf('No pull-down, o botão pode ligar a entrada ao positivo.', true, 'O resistor fixa LOW em repouso; o botão leva a HIGH.'),
        num(t`Com $5\,\text{V}$ e pull-up de $10\,\text{k}\Omega$, estime a corrente no botão fechado em mA.`, 0.5, t`$I=5/10000=0,0005\,\text{A}=0,5\,\text{mA}$.`, { unit: 'mA' }),
        gen(rng => { const r = randInt(rng, 5, 10); return num(t`Um pull-up de $${r}\,\text{k}\Omega$ está ligado a $5\,\text{V}$. Qual a corrente ao fechar o botão, em mA, com duas casas?`, Math.round(500 / r) / 100, t`$I=5/${r}\,\text{mA}\approx${(5 / r).toFixed(2).replace('.', ',')}\,\text{mA}$.`, { unit: 'mA', tol: 0.005 }); }),
        mcq('Observe OUT e feche o botão no simulador. Qual nível aparece?', ['LOW', 'HIGH', 'sempre flutuante', '10 V'], 0, 'Fechar a chave conecta OUT ao terra.', { visual: circuitVisual({ comps: button(true), mode: 'adjust' }) }),
        switchEx(true), switchEx(true, false),
      ] },
    ] },
    { id: 'mc-ard-adc', title: 'Entradas analógicas e PWM', parts: [
      { card: [{ title: 'Conversão analógica', body: t`O ADC do Uno clássico entrega códigos de $0$ a $1023$ para entrada de $0$ a $V_{ref}$. Com referência de $5\,\text{V}$, estime $V\approx5N/1023$. O divisor mantém a entrada dentro da faixa.`, visual: circuitVisual({ comps: divider(10000), mode: 'adjust' }) }, { title: 'Lendo a tensão', body: 'A referência adotada no exemplo é 5 V. Nunca aplique ao ADC tensão fora dos limites da placa.', visual: code('int n = analogRead(A0);\nfloat v = n * 5.0 / 1023.0;', undefined, 'ADC de 10 bits') }], exercises: [
        num('Quantos códigos distintos tem um ADC de 10 bits?', 1024, t`$2^{10}=1024$ códigos: de 0 a 1023.`),
        mcq(t`Qual tensão aproximada corresponde ao código $1023$, com referência de $5\,\text{V}$?`, [t`$5\,\text{V}$`, t`$10\,\text{V}$`, t`$0\,\text{V}$`, t`$1023\,\text{V}$`], 0, t`$5\times1023/1023=5\,\text{V}$.`),
        gen(rng => { const n = randInt(rng, 1, 9); return num(t`Um divisor ideal tem $10\,\text{k}\Omega$ em cada braço e alimentação de $${n}\,\text{V}$. Qual a saída em V?`, n / 2, t`Resistores iguais dividem a tensão ao meio: $${n}/2=${fmt(n / 2)}\,\text{V}$.`, { unit: 'V' }); }),
        tf('O ADC quantiza uma tensão contínua em códigos discretos.', true, 'Cada código representa uma faixa de entrada.'),
        mcq(t`Meça a tensão no nó ADC com resistores iguais. Qual o valor?`, [t`$2,5\,\text{V}$`, t`$5\,\text{V}$`, t`$0\,\text{V}$`, t`$10\,\text{V}$`], 0, t`$5\times10/(10+10)=2,5\,\text{V}$.`, { visual: circuitVisual({ comps: divider(10000), mode: 'adjust' }) }),
        divEx(2.5, 10000), divEx(3.75, 30000),
      ] },
      { card: [{ title: 'PWM e valor médio', body: t`PWM alterna entre baixo e alto. Duty cycle $D$ é a fração do período em alto; para níveis $0$ e $5\,\text{V}$, a média ideal é $5D$. O CLK do simulador tem duty fixo de $50\%$; aqui variamos sua amplitude.`, visual: circuitVisual({ comps: pwm(5), mode: 'adjust', scope: { ids: ['load'] } }) }, { title: 'Controle de brilho', body: 'No Uno clássico, analogWrite usa valores de 0 a 255 em pinos PWM; a saída continua pulsando, não é uma tensão analógica constante.', visual: code('int n = analogRead(A0);\nint brilho = n / 4;\nanalogWrite(9, brilho);', undefined, 'ADC para PWM') }], exercises: [
        num(t`Uma onda fica alta por $2\,\text{ms}$ em período de $8\,\text{ms}$. Qual duty em %?`, 25, t`$D=2/8=0,25=25\%$.`, { unit: '%' }),
        num(t`Para $D=40\%$ e nível alto de $5\,\text{V}$, qual a média ideal em V?`, 2, t`$V_{méd}=0,4\times5=2\,\text{V}$.`, { unit: 'V' }),
        gen(rng => { const d = randInt(rng, 1, 9) * 10; return num(t`PWM entre 0 e $5\,\text{V}$ tem duty $${d}\%$. Qual a média ideal em V?`, d / 20, t`$5\times${d}/100=${fmt(d / 20)}\,\text{V}$.`, { unit: 'V' }); }),
        tf('PWM de 50% é uma tensão constante de 2,5 V no pino.', false, 'O pino alterna entre níveis; 2,5 V é a média ideal.'),
        mcq('Observe a onda CLK de 5 V no osciloscópio. Qual é a média aproximada?', [t`$2,5\,\text{V}$`, t`$5\,\text{V}$`, t`$0\,\text{V}$`, t`$10\,\text{V}$`], 0, 'Metade do tempo em 5 V e metade em 0 V resulta em média de 2,5 V.', { visual: circuitVisual({ comps: pwm(5), mode: 'adjust', scope: { ids: ['load'] } }) }),
        pwmEx(4), pwmEx(5),
      ] },
    ] },
    { id: 'mc-ard-tempo', title: 'Temporização sem bloqueio', parts: [
      { card: [{ title: 'Tempo decorrido', body: 'Para alternar um LED a cada 500 ms, compare millis() com o instante da última troca, que começa em 0. Em cada passagem pelo loop, o botão também pode ser lido.', visual: table(['Agora (ms)', 'Desde a troca', 'Ação no LED'], [[300, '300 ms', 'Mantém'], [500, '500 ms', 'Alterna'], [700, '200 ms', 'Mantém'], [1000, '500 ms', 'Alterna']], [1, 3]) }, { title: 'Pisca cooperativo', body: 'A subtração entre unsigned long funciona também quando millis dá a volta, desde que o intervalo seja representável e as verificações não sejam adiadas por uma volta inteira.', visual: code('unsigned long anterior = 0;\nvoid loop() {\n  unsigned long agora = millis();\n  if (agora - anterior >= 500UL) {\n    anterior = agora;\n    // alternar LED\n  }\n}', undefined, 'Sem delay') }], exercises: [
        mcq('O que millis informa?', ['Milissegundos desde a inicialização, com volta do contador', 'A tensão do pino', 'A corrente do LED', 'A hora civil exata'], 0, 'millis conta tempo decorrido desde o início e seu contador eventualmente retorna a zero.'),
        num('Anterior é 1000 ms e agora é 1450 ms. Quantos ms decorreram?', 450, '1450 − 1000 = 450 ms.', { unit: 'ms' }),
        gen(rng => { const n = randInt(rng, 1, 9) * 100; return num(t`Anterior vale $1000\,\text{ms}$ e agora vale $${1000 + n}\,\text{ms}$. Qual o tempo decorrido em ms?`, n, t`$${1000 + n}-1000=${n}\,\text{ms}$.`, { unit: 'ms' }); }),
        tf('Um loop sem delay pode verificar botão e tempo em cada volta.', true, 'Verificações rápidas permitem intercalar as tarefas.'),
        mcq('Para verificar um intervalo, que operação resiste à volta do contador sem sinal?', ['Subtrair anterior de agora em unsigned long', 'Comparar apenas agora com anterior + intervalo sem tratar a volta', 'Zerar o relógio a cada volta', 'Usar números negativos com sinal'], 0, 'A subtração sem sinal é modular e preserva o tempo decorrido dentro da faixa representável.'),
        num('O LED trocou de estado em 1200 ms e deve esperar 500 ms para trocar de novo. Qual é o primeiro instante permitido, em ms?', 1700, 'A diferença agora − anterior deve ser pelo menos 500 ms: 1200 + 500 = 1700.', { unit: 'ms' }),
        num('Um LED alterna a cada 500 ms. Quanto dura um ciclo completo ligado e desligado, em ms?', 1000, 'São duas alternâncias de 500 ms: 1000 ms.', { unit: 'ms' }),
      ] },
      { card: { title: 'Duas tarefas', body: 'Cada tarefa guarda seu instante anterior. Verifique as duas em cada passagem do loop; mantenha o trabalho de cada uma curto. Atualizar anterior para agora pode acumular atraso de execução.', visual: code('if (agora - t1 >= 200UL) {\n  t1 = agora;\n  // tarefa 1\n}\nif (agora - t2 >= 500UL) {\n  t2 = agora;\n  // tarefa 2\n}', undefined, 'Intervalos independentes') }, exercises: [
        num('Uma tarefa roda a cada 200 ms. Quantas vezes em 1000 ms, sem contar t = 0?', 5, '1000 / 200 = 5 execuções.', { unit: 'vezes' }),
        num('Outra tarefa roda a cada 500 ms. Quantas vezes em 1000 ms, sem contar t = 0?', 2, '1000 / 500 = 2 execuções.', { unit: 'vezes' }),
        gen(rng => { const n = randInt(rng, 2, 8); return num(t`Uma tarefa ocorre a cada $100\,\text{ms}$. Quantas vezes em $${n * 100}\,\text{ms}$, sem contar o início?`, n, t`$${n * 100}/100=${n}$ execuções.`); }),
        tf('Duas tarefas periódicas precisam compartilhar o mesmo instante anterior.', false, 'Cada período precisa de sua própria referência para não interferir no outro.'),
        mcq('Se uma tarefa ocupa 2 segundos em um loop cooperativo, o que acontece com as outras?', ['Esperam essa tarefa terminar', 'Executam automaticamente ao mesmo tempo', 'O tempo para', 'O ADC vira PWM'], 0, 'Em execução cooperativa, uma tarefa longa atrasa as demais.'),
        num('Uma tarefa programada a cada 200 ms roda em 200, 400, 600 e 800 ms. Qual o próximo instante ideal em ms?', 1000, '800 + 200 = 1000 ms.', { unit: 'ms' }),
        mcq('Como reduzir deriva de uma tarefa periódica cujo trabalho é rápido?', ['Avançar a referência pelo intervalo e tratar atrasos', 'Usar delay longo em cada tarefa', 'Compartilhar a referência entre todas', 'Somar a tensão ao tempo'], 0, 'Avançar a referência pelo período preserva a grade temporal; atrasos exigem política de recuperação.'),
      ] },
    ] },
    { id: 'mc-ard-int', title: 'Interrupções e debounce', parts: [
      { card: [{ title: 'Eventos e ISR', body: 'Uma interrupção suspende temporariamente o fluxo principal para executar uma rotina curta (ISR). Use o pino e a borda suportados pela placa; sinalize o evento e processe o trabalho no loop.' }, { title: 'Sinalizando o evento', body: 'No Uno clássico, o pino 2 suporta interrupção externa. Uma flag volatile impede que o compilador suponha que ela não muda fora do fluxo normal.', visual: code('volatile bool evento = false;\nvoid mudou() {\n  evento = true;\n}\nvoid setup() {\n  attachInterrupt(\n    digitalPinToInterrupt(2),\n    mudou, FALLING);\n}', undefined, 'Interrupção externa') }], exercises: [
        mcq('Qual é a função de uma ISR?', ['Responder a um evento de interrupção', 'Guardar o programa na Flash', 'Alimentar um motor', 'Gerar uma tensão de referência'], 0, 'A rotina é chamada quando ocorre o evento configurado.'),
        tf('Uma ISR deve ser curta e evitar trabalho demorado.', true, 'Isso reduz a latência e deixa o processamento maior para o loop.'),
        mcq('FALLING seleciona qual transição?', ['De alto para baixo', 'De baixo para alto', 'Somente nível alto constante', 'Qualquer tensão analógica'], 0, 'FALLING corresponde à borda descendente.'),
        gen(rng => { const n = randInt(rng, 2, 9); return num(t`Em um cenário ideal, cada borda gera uma interrupção. Quantas interrupções para $${n}$ bordas?`, n, t`Uma por borda: $${n}$.`); }),
        tf('volatile torna automaticamente atômica qualquer operação compartilhada.', false, 'volatile trata a visibilidade para o compilador; acessos multibyte podem exigir proteção atômica.'),
        order('Ordene o caminho de um evento que deve atualizar um display sem trabalho demorado na interrupção.', ['Detectar a borda no pino', 'Registrar o evento na ISR', 'Ler e tratar o evento no loop', 'Atualizar o display'], 'A rotina de interrupção registra o evento; o trabalho demorado acontece no fluxo principal.'),
        mcq('Por que uma flag booleana pode perder contagem de eventos?', ['Vários eventos antes da leitura continuam produzindo apenas true', 'Ela aumenta uma unidade por interrupção', 'Ela é uma fonte de tensão', 'Ela impede toda interrupção'], 0, 'Uma flag registra ocorrência, não a quantidade; um contador protegido pode registrar eventos.'),
      ] },
      { card: { title: 'Debounce sem bloquear', body: 'Um botão mecânico pode oscilar durante uma única pressão. Aceite a mudança depois de um intervalo estável; use millis no loop. A ISR pode apenas sinalizar atividade, sem delay.', visual: code('if (leitura != anterior) {\n  mudouEm = agora;\n  anterior = leitura;\n}\nif (agora - mudouEm >= 30UL) {\n  // aceitar estado estavel\n}', undefined, 'Filtro temporal') }, exercises: [
        mcq('O que é bounce em um botão?', ['Transições rápidas causadas pelo contato mecânico', 'Uma tensão de alimentação fixa', 'Um código do ADC', 'Uma memória permanente'], 0, 'O contato pode abrir e fechar várias vezes antes de estabilizar.'),
        tf('Sem debounce, um clique pode ser contado várias vezes.', true, 'Cada oscilação pode parecer uma nova borda.'),
        num('A última mudança ocorreu em 120 ms. Com janela estável de 30 ms, quando pode ser aceita, em ms?', 150, '120 + 30 = 150 ms, se não houver outra mudança.', { unit: 'ms' }),
        gen(rng => { const n = randInt(rng, 2, 8) * 10; return num(t`A última mudança foi em $200\,\text{ms}$ e a janela é $${n}\,\text{ms}$. Qual o primeiro instante de aceitação em ms, sem novas mudanças?`, 200 + n, t`$200+${n}=${200 + n}\,\text{ms}$.`, { unit: 'ms' }); }),
        mcq('Uma nova oscilação acontece antes da janela terminar. O que fazer?', ['Reiniciar a contagem de estabilidade', 'Aceitar imediatamente o primeiro nível', 'Aumentar a tensão da entrada', 'Ignorar para sempre o botão'], 0, 'A janela deve ser medida desde a mudança mais recente.'),
        num('Um botão oscila em 100, 105 e 112 ms. Com 30 ms estáveis, quando aceitar o último estado, em ms?', 142, 'A última transição é em 112 ms; 112 + 30 = 142 ms.', { unit: 'ms' }),
        mcq('Para alternar um LED uma vez por clique, o que contar após filtrar?', ['A transição para pressionado', 'Todas as voltas do loop com botão pressionado', 'Cada oscilação bruta', 'Cada milissegundo'], 0, 'Uma transição estável para pressionado representa um clique, mesmo que o botão permaneça apertado.'),
      ] },
    ] },
  ],
};
