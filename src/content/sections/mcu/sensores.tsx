import type { UnitDef } from '../../types';
import { code, gen, inter, mcq, near, num, tf } from '../../helpers';
import { fnLab } from '../../visuals';
import { circuit, circuitEx, circuitVisual, D, GND, IN, LAMP, NMOS, NPN, R, V, wires } from '../../circuits';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;
const lab = (factor: number, label: string) => fnLab({
  f: (x, p) => factor * p.k * x,
  params: [{ key: 'k', label, min: 1, max: 5, step: 1, value: 1 }],
  view: { xMin: 0, xMax: 10, yMin: 0, yMax: 50 },
  info: (p) => t`Fator selecionado: $${p.k}$.`,
});
const graphExercise = (factor: number, label: string, target: number, explanation: string) => {
  const visual = lab(factor, label);
  return inter(t`Ajuste ${label} para $${target}$ no gráfico.`, 'plot', visual.props, (v) => v.p.k === target, t`${label} = ${target}`, explanation);
};
const divider = (sensor: number) => circuit(
  V('fonte', [0, 0], [0, 4], 5, { fixed: true, locked: true }),
  wires([0, 0], [3, 0]),
  R('fixo', [3, 0], [3, 2], 10000, { fixed: true, locked: true, label: '10 kΩ' }),
  R('sensor', [3, 2], [3, 4], sensor, { min: 1000, max: 40000, locked: true, label: 'Sensor' }),
  wires([3, 4], [0, 4]),
);
const dividerEx = (target: number, resistance: number) => circuitEx(
  t`Ajuste o resistor que representa o sensor para obter $${fmt(target)}\,\text{V}$ nele. Meça sua tensão.`,
  { comps: divider(1000), mode: 'adjust' },
  (v) => near(Math.abs(v.v('sensor')), target, 0.04),
  t`$R_{sensor}=${resistance / 1000}\,\text{k}\Omega$`,
  t`$V_{sensor}=5R_{sensor}/(10000+R_{sensor})$; com $${resistance / 1000}\,\text{k}\Omega$, resulta $${fmt(target)}\,\text{V}$.`,
  { set: { sensor: resistance } },
);
const switchCircuit = (mos: boolean, on: boolean) => circuit(
  V('fonte', [0, 0], [0, 5], 5, { fixed: true, locked: true }),
  wires([0, 0], [4, 0]), LAMP('lamp', [4, 0], [4, 2], 100, { locked: true }),
  ...(mos ? [NMOS('q', [3, 3], { locked: true })] : [NPN('q', [3, 3], { locked: true })]),
  wires([4, 4], [4, 5], [0, 5]), GND([0, 5]),
  IN('pino', [0, 3], on, { locked: true }), R('rb', [0, 3], [3, 3], 1000, { fixed: true, locked: true }),
  D('diodo', [4, 2], [6, 2], { locked: true }), wires([6, 2], [6, 0], [4, 0]),
);
const switchEx = (mos: boolean, desired: boolean) => circuitEx(
  `Toque em pino para ${desired ? 'acender' : 'apagar'} a lâmpada.`,
  { comps: switchCircuit(mos, !desired), mode: 'adjust' },
  (v) => desired ? v.on('lamp') && Math.abs(v.i('lamp')) > 0.01 : !v.on('lamp') && Math.abs(v.i('lamp')) < 0.001,
  desired ? 'pino em 1' : 'pino em 0',
  `Com pino em ${desired ? '1, a chave conduz e a corrente percorre a lâmpada' : '0, a chave corta e a corrente na lâmpada fica próxima de zero'}.`,
  { on: { pino: desired } },
);

export const sensoresAtuadores: UnitDef = {
  id: 'mc-sens', title: 'Sensores e atuadores', icon: '📡',
  subtitle: 'Aquisição, acionamento e energia',
  source: 'Roteiro Eletrônica — mês 6: sensores, atuadores e aquisição de dados',
  guide: t`Divisor: $V_s=V_{cc}R_s/(R_f+R_s)$. Ultrassom: $d=vt/2$. Servo: pulso de controle, tipicamente $1$ a $2\,\text{ms}$ a cada $20\,\text{ms}$, conforme o fabricante. Corrente média: some as contribuições ponderadas pelo tempo; autonomia ideal $t=C/I_{médio}$. Use driver e diodo de roda livre em cargas indutivas.`,
  lessons: [
    { id: 'mc-sens-anal', title: 'Sensores analógicos: LDR, NTC e potenciômetro', parts: [
      { card: { title: 'Divisor resistivo', body: t`LDR e NTC mudam de resistência com luz e temperatura. Um divisor com resistor fixo em cima e sensor embaixo converte resistência em tensão: $V_s=V_{cc}R_s/(R_f+R_s)$. O ADC mede o nó em relação ao terra. Aqui o resistor ajustável representa o sensor.`, visual: circuitVisual({ comps: divider(10000), mode: 'adjust' }) }, exercises: [
        mcq('Qual elemento varia sua resistência com a iluminação?', ['LDR', 'Motor DC', 'Relé', 'Diodo fixo'], 0, 'O LDR é um resistor sensível à luz.'),
        tf('Um NTC típico diminui sua resistência quando a temperatura aumenta.', true, 'NTC significa coeficiente de temperatura negativo.'),
        num(t`Com $5\,\text{V}$ e dois resistores de $10\,\text{k}\Omega$ em série, qual a tensão no resistor inferior, em V?`, 2.5, t`$5\cdot10/(10+10)=2,5\,\text{V}$.`, { unit: 'V', tol: 0.01, visual: circuitVisual({ comps: divider(10000), mode: 'view' }) }),
        dividerEx(2.5, 10000), dividerEx(4, 40000),
        gen((rng) => { const n = randInt(rng, 1, 4); return num(t`Em um divisor de $${2*n}\,\text{V}$ com resistores iguais, calcule a tensão inferior em V.`, n, t`Resistores iguais dividem a tensão ao meio: $${2*n}/2=${n}\,\text{V}$.`, { unit: 'V', tol: 0.01 }); }),
        mcq('Se o resistor inferior cresce e o superior permanece fixo, a tensão no nó central:', ['aumenta', 'diminui', 'fica sempre zero', 'inverte a fonte'], 0, 'A fração Rs/(Rf+Rs) cresce quando Rs cresce.'),
      ] },
      { card: [{ title: 'Potenciômetro e ADC', body: t`Um potenciômetro tem duas extremidades e um cursor. Entre alimentação e terra ele fornece tensão variável ao ADC. Para um ADC ideal de 10 bits e referência $5\,\text{V}$, o código vai de $0$ a $1023$; tensão aproximada $V=5N/1023$. Não exceda os limites do pino.`, visual: circuitVisual({ comps: divider(10000), mode: 'adjust' }) }, { title: 'Leitura Arduino', body: 'Leia o canal e envie o valor bruto. A referência e a faixa dependem da placa.', visual: code('void setup() {\n  Serial.begin(9600);\n}\nvoid loop() {\n  int leitura = analogRead(A0);\n  Serial.println(leitura);\n  delay(100);\n}', undefined, 'Leitura analógica') }], exercises: [
        mcq('Qual terminal do potenciômetro fornece a tensão variável?', ['Cursor', 'Terra da placa somente', 'Carcaça', 'Nenhum'], 0, 'O cursor divide a resistência entre as extremidades.'),
        tf('Um ADC de 10 bits possui 1024 códigos possíveis.', true, 'Os códigos inteiros vão de 0 a 1023.'),
        num(t`Meça a tensão no resistor inferior de $10\,\text{k}\Omega$ em V.`, 2.5, t`O divisor com resistores iguais dá $5/2=2,5\,\text{V}$.`, { unit: 'V', tol: 0.05, visual: circuitVisual({ comps: divider(10000), mode: 'view' }) }),
        dividerEx(2.5, 10000), dividerEx(4, 40000),
        gen((rng) => { const n = randInt(rng, 1, 5); return num(t`Um ADC ideal usa referência de $${n}\,\text{V}$. Qual tensão em V corresponde aproximadamente ao fundo de escala?`, n, t`O código máximo representa aproximadamente a referência: $${n}\,\text{V}$.`, { unit: 'V', tol: 0.01 }); }),
        mcq('Para reduzir ruído aleatório em leituras estacionárias, uma estratégia simples é:', ['fazer média de várias amostras', 'desconectar o terra', 'exceder a referência do ADC', 'retirar a alimentação'], 0, 'A média reduz flutuações aleatórias, mas não corrige erro sistemático.'),
      ] },
    ] },
    { id: 'mc-sens-dig', title: 'Sensores digitais e ultrassônico', parts: [
      { card: { title: 'Estado e protocolo', body: 'Uma saída digital informa níveis lógicos ou envia dados por um protocolo. Confira tensão, temporização e tipo de saída no manual. Uma saída de coletor aberto precisa de pull-up compatível. No gráfico, x é o tempo em segundos e y é o número de amostras; ajuste a taxa em amostras por segundo.', visual: lab(1, 'taxa') }, exercises: [
        mcq('Uma saída digital simples de presença normalmente informa:', ['dois estados lógicos', 'qualquer tensão contínua exata', 'energia da bateria', 'posição angular diretamente'], 0, 'Uma saída binária distingue dois estados.'),
        tf('O nível lógico alto é necessariamente 5 V em toda placa.', false, 'Placas podem usar 3,3 V ou outros níveis; confira os limites.'),
        mcq('Para que serve um pull-up numa saída coletor aberto?', ['Definir nível alto quando a saída está aberta', 'Alimentar diretamente um motor', 'Inverter a bateria', 'Gerar ultrassom'], 0, 'O resistor puxa a linha para a alimentação quando o transistor não conduz.'),
        graphExercise(1, 'taxa', 3, 'Com 3 amostras por segundo, em 10 s são 30 amostras.'),
        gen((rng) => { const n = randInt(rng, 2, 9); return num(t`Um sensor envia $${n}$ amostras por segundo. Quantas amostras envia em $2\,\text{s}$?`, 2*n, t`Taxa vezes tempo: $${n}\cdot2=${2*n}$.`, { tol: 0.01 }); }),
        num('Amostrando a 4 leituras por segundo durante 5 s, quantas leituras são obtidas?', 20, '4 × 5 = 20 leituras.', { tol: 0.01 }),
        tf('Um sensor digital dispensa verificar compatibilidade de tensão com o microcontrolador.', false, 'A tensão de saída deve respeitar os limites da entrada.'),
      ] },
      { card: [{ title: 'Tempo de voo', body: t`O módulo ultrassônico emite um pulso e mede o tempo do eco. O som percorre ida e volta: $d=vt/2$. Usando $v=340\,\text{m/s}$, um eco de $1000\,\mu\text{s}$ corresponde a $17\,\text{cm}$. Temperatura, ângulo e superfícies afetam a medição. No gráfico, x é o tempo de eco em ms, y a distância em cm e cada unidade de velocidade equivale a $100\,\text{m/s}$.`, visual: lab(5, 'velocidade') }, { title: 'Conversão do eco', body: 'Exemplo: duração em microssegundos já medida; trate ausência de eco com timeout.', visual: code('float distanciaCm(unsigned long us) {\n  return us * 0.034f / 2.0f;\n}', undefined, 'Eco em centímetros') }], exercises: [
        mcq('Por que dividir o percurso por 2?', ['O eco percorre ida e volta', 'O som só viaja metade do tempo', 'O sensor mede tensão dupla', 'A distância é sempre 2 cm'], 0, 'O tempo inclui o caminho até o objeto e o retorno.'),
        num(t`Com $v=340\,\text{m/s}$ e eco de $1000\,\mu\text{s}$, calcule a distância em cm.`, 17, t`$340\cdot0,001/2=0,17\,\text{m}=17\,\text{cm}$.`, { unit: 'cm', tol: 0.01 }),
        graphExercise(5, 'velocidade', 2, 'Ajuste para 200 m/s: em 1 ms de eco, a distância é 10 cm.'),
        gen((rng) => { const n = randInt(rng, 1, 8); return num(t`Com $v=340\,\text{m/s}$, eco de $${n*1000}\,\mu\text{s}$ indica quantos cm?`, 17*n, t`$d=340\cdot${fmt(n/1000)}/2=${17*n}\,\text{cm}$.`, { unit: 'cm', tol: 0.01 }); }),
        num(t`Um objeto está a $34\,\text{cm}$. Com $v=340\,\text{m/s}$, qual o tempo de ida e volta em microssegundos?`, 2000, t`$t=2(0,34)/340=0,002\,\text{s}=2000\,\mu\text{s}$.`, { unit: 'µs', tol: 1 }),
        tf('Sem eco recebido dentro do prazo, deve-se tratar a leitura como inválida.', true, 'Um timeout evita confundir ausência de eco com uma distância válida.'),
        mcq('Qual situação pode prejudicar a leitura ultrassônica?', ['Superfície inclinada que desvia o eco', 'Terra comum correto', 'Tempo de ida e volta medido', 'Conversão de segundos para microssegundos'], 0, 'A reflexão pode não retornar ao receptor.'),
      ] },
    ] },
    { id: 'mc-sens-motor', title: 'Motores DC, ponte H e servo', parts: [
      { card: { title: 'Motor e ponte H', body: 'Um motor DC exige corrente maior que a de um pino. Um driver ou ponte H alimenta o motor; a ponte inverte a polaridade para mudar o sentido. PWM regula a tensão média ideal, mas velocidade e torque dependem da carga. Nunca ligue os dois ramos da ponte de modo a provocar curto. No gráfico, x representa o ciclo ativo em dezenas de por cento e y a tensão média em V; ajuste a tensão da fonte.', visual: lab(0.1, 'fonte (V)') }, exercises: [
        mcq('Qual circuito permite inverter a polaridade no motor?', ['Ponte H', 'Divisor apenas', 'ADC', 'Pull-up isolado'], 0, 'A ponte H comuta os terminais do motor.'),
        tf('Um motor deve ser ligado diretamente ao pino lógico mesmo quando sua corrente excede o limite do pino.', false, 'Use driver dimensionado para a corrente de partida e de operação.'),
        num(t`PWM ideal de $25\%$ com fonte de $8\,\text{V}$ tem tensão média de quantos V?`, 2, t`$V_{médio}=0,25\cdot8=2\,\text{V}$.`, { unit: 'V', tol: 0.01 }),
        graphExercise(0.1, 'fonte (V)', 4, 'Com fonte de 4 V e ciclo ativo de 50%, a tensão média ideal é 2 V.'),
        gen((rng) => { const n = randInt(rng, 1, 4); return num(t`Em PWM ideal de $50\%$ com fonte de $${2*n}\,\text{V}$, qual tensão média em V?`, n, t`$0,5\cdot${2*n}=${n}\,\text{V}$.`, { unit: 'V', tol: 0.01 }); }),
        tf('A corrente de partida ou de rotor travado pode ser maior que a corrente em regime.', true, 'O driver e a fonte precisam suportar essa condição.'),
        mcq('Na ponte H, um curto direto entre alimentação e terra é chamado de:', ['condução simultânea indevida', 'leitura analógica', 'calibração', 'medição de eco'], 0, 'Comutação inadequada pode ligar os dois trilhos diretamente.'),
      ] },
      { card: [{ title: 'Pulso de servo', body: t`Um servo comum interpreta a largura do pulso como comando de posição. Como exemplo linear, $1\,\text{ms}\to0°$, $1,5\,\text{ms}\to90°$ e $2\,\text{ms}\to180°$, com período de $20\,\text{ms}$. Faixas reais variam: calibre pelo fabricante e evite forçar batentes. O gráfico mostra o tempo alto acumulado y em ms após x pulsos, para uma largura ajustável em ms.`, visual: lab(1, 'pulso (ms)') }, { title: 'Comando de pulso', body: 'Exemplo ilustrativo de um pulso; repita-o no período compatível com o servo.', visual: code('digitalWrite(pino, HIGH);\ndelayMicroseconds(1500);\ndigitalWrite(pino, LOW);\ndelayMicroseconds(18500);', undefined, 'Pulso de 1,5 ms') }], exercises: [
        mcq('No modelo apresentado, 1,5 ms corresponde a:', ['90°', '0°', '180°', '360°'], 0, 'É o ponto médio entre 1 ms e 2 ms.'),
        num(t`Num período de $20\,\text{ms}$, pulso alto de $2\,\text{ms}$ ocupa quantos por cento?`, 10, t`$2/20\cdot100=10\%$.`, { unit: '%', tol: 0.01 }),
        graphExercise(1, 'pulso (ms)', 2, 'Dois pulsos de 2 ms somam 4 ms em nível alto; use os limites reais do servo.'),
        gen((rng) => { const n = randInt(rng, 1, 4); return num(t`Um pulso dura $${n}\,\text{ms}$ e o período $20\,\text{ms}$. Qual o ciclo ativo em %?`, 5*n, t`$${n}/20\cdot100=${5*n}\%$.`, { unit: '%', tol: 0.01 }); }),
        num(t`No modelo linear de $1$ a $2\,\text{ms}$ para $0°$ a $180°$, qual a largura em ms para $45°$?`, 1.25, t`$45/180=1/4$ do intervalo: $1+0,25=1,25\,\text{ms}$.`, { unit: 'ms', tol: 0.005 }),
        tf('Todos os servos garantem exatamente os mesmos limites de pulso e ângulo.', false, 'Os limites dependem do modelo e devem ser calibrados.'),
        mcq('Se o servo reinicia a placa ao mover, qual investigação é apropriada?', ['Verificar queda de tensão e capacidade da fonte', 'Elevar a tensão do pino sem limite', 'Desligar o terra comum', 'Forçar o eixo contra o batente'], 0, 'Picos de corrente podem causar queda de alimentação; confira fonte e ligações.'),
      ] },
    ] },
    { id: 'mc-sens-carga', title: 'Acionando cargas: transistor, relé e MOSFET', parts: [
      { card: { title: 'NPN como chave', body: t`No acionamento pelo lado baixo, a carga fica entre o positivo e o coletor; o emissor vai ao terra. Um resistor limita a corrente de base. O pino e a fonte da carga compartilham referência. A lâmpada representa a carga; o diodo está em paralelo, com catodo no positivo.`, visual: circuitVisual({ comps: switchCircuit(false, false), mode: 'adjust' }) }, exercises: [
        mcq('Qual terminal do NPN recebe corrente de comando pelo resistor?', ['Base', 'Coletor apenas', 'Emissor apenas', 'Carcaça'], 0, 'O resistor limita a corrente que entra na base.'),
        tf('Uma carga indutiva pode produzir sobretensão ao ser desligada.', true, 'A energia armazenada na indutância precisa de um caminho de corrente.'),
        num(t`Meça a corrente da lâmpada com pino em 0. Informe em mA.`, 0, t`O transistor está cortado; a corrente é praticamente zero.`, { unit: 'mA', tol: 0.1, visual: circuitVisual({ comps: switchCircuit(false, false), mode: 'view' }) }),
        switchEx(false, true), switchEx(false, false),
        gen((rng) => { const n = randInt(rng, 1, 5); return num(t`Um resistor de base de $1\,\text{k}\Omega$ tem queda de $${n}\,\text{V}$. Qual a corrente em mA?`, n, t`$I=V/R=${n}/1000\,\text{A}=${n}\,\text{mA}$.`, { unit: 'mA', tol: 0.01 }); }),
        mcq('Em regime normal, como ligar o diodo de roda livre em paralelo com uma bobina acionada pelo lado baixo?', ['Catodo no positivo e anodo no lado da chave', 'Anodo no positivo e catodo no lado da chave', 'Em série com o pino', 'Entre base e emissor como única carga'], 0, 'Assim fica reversamente polarizado durante a energização e conduz ao desligar.'),
      ] },
      { card: { title: 'MOSFET e relé', body: 'Um NMOS de nível lógico pode atuar como chave de lado baixo: dreno na carga, fonte no terra e porta comandada pelo pino. Verifique RDS(on) na tensão de porta disponível. Relés isolam contatos da bobina, mas a bobina precisa de driver e diodo. No simulador a lâmpada é resistiva; o diodo ilustra a posição para uma bobina.', visual: circuitVisual({ comps: switchCircuit(true, false), mode: 'adjust' }) }, exercises: [
        mcq('No NMOS de lado baixo, a fonte fica ligada a:', ['terra', 'positivo da carga diretamente', 'entrada ADC flutuante', 'catodo do LED de entrada'], 0, 'A fonte vai ao terra e o dreno ao lado baixo da carga.'),
        tf('O limiar VGS(th), sozinho, garante baixa resistência de condução para a corrente de projeto.', false, 'Confira RDS(on) especificada na tensão de porta disponível e corrente exigida.'),
        num('Meça a corrente da lâmpada em mA com pino em 0.', 0, 'Com porta em zero, o NMOS está em corte.', { unit: 'mA', tol: 0.1, visual: circuitVisual({ comps: switchCircuit(true, false), mode: 'view' }) }),
        switchEx(true, true), switchEx(true, false),
        gen((rng) => { const n = randInt(rng, 1, 5); return num(t`Uma bobina de $${n*100}\,\Omega$ recebe $${n}\,\text{V}$. Na aproximação resistiva de regime, qual a corrente em mA?`, 10, t`$I=${n}/(${n*100})=0,01\,\text{A}=10\,\text{mA}$.`, { unit: 'mA', tol: 0.01 }); }),
        mcq('Qual é a função do diodo em paralelo com a bobina de um relé DC?', ['Oferecer caminho à corrente ao desligar', 'Aumentar permanentemente a tensão do pino', 'Medir distância', 'Substituir a fonte'], 0, 'Ao desligar, o diodo conduz a corrente da bobina e limita a sobretensão.'),
      ] },
    ] },
    { id: 'mc-sens-alim', title: 'Alimentação e consumo', parts: [
      { card: { title: 'Corrente e fonte', body: t`Some as correntes simultâneas para estimar a corrente da fonte: $I_T=I_1+I_2+\cdots$. Considere picos de partida, eficiência do regulador, tensão e margem. Alimentar motor e lógica exige distribuição adequada e referência comum para sinais. No gráfico, x é o número de sensores iguais e y a corrente total em mA, sem contar outras cargas.`, visual: lab(1, 'mA por sensor') }, exercises: [
        mcq('Duas cargas simultâneas puxam 20 mA e 30 mA. A corrente total é:', ['50 mA', '10 mA', '600 mA', '25 mA'], 0, 'As correntes simultâneas se somam: 20 + 30 = 50 mA.'),
        tf('A fonte deve suportar também picos de corrente das cargas.', true, 'Motores e servos podem exigir correntes transitórias maiores.'),
        num('Uma placa consome 80 mA e um sensor 20 mA ao mesmo tempo. Qual o total em mA?', 100, '80 + 20 = 100 mA.', { unit: 'mA', tol: 0.01 }),
        graphExercise(1, 'mA por sensor', 5, 'Cinco sensores de 5 mA consomem juntos 25 mA.'),
        gen((rng) => { const n = randInt(rng, 1, 9); return num(t`Uma placa consome $${n*10}\,\text{mA}$ e um sensor $20\,\text{mA}$. Qual o total em mA?`, n*10+20, t`$${n*10}+20=${n*10+20}\,\text{mA}$.`, { unit: 'mA', tol: 0.01 }); }),
        num(t`Uma carga de $5\,\text{V}$ e $200\,\text{mA}$ consome quantos watts?`, 1, t`$P=VI=5\cdot0,2=1\,\text{W}$.`, { unit: 'W', tol: 0.01 }),
        mcq('Por que o consumo na entrada de um regulador não pode ser calculado ignorando perdas em todos os casos?', ['A eficiência não é perfeita e as tensões podem diferir', 'Porque energia não se conserva', 'Porque corrente nunca passa pelo regulador', 'Porque a carga não consome potência'], 0, 'A potência de entrada inclui as perdas; a corrente depende também da tensão de entrada.'),
      ] },
      { card: { title: 'Autonomia estimada', body: t`Para estados alternados, $I_{médio}=\sum I_k f_k$, com frações de tempo $f_k$ que somam 1. A autonomia ideal em horas é $C\,(\text{mAh})/I_{médio}\,(\text{mA})$. Capacidade útil, conversão e temperatura reduzem a precisão da estimativa. No gráfico, x é o tempo em horas e y a carga consumida em mAh, com corrente constante ajustável em mA.`, visual: lab(1, 'corrente (mA)') }, exercises: [
        mcq('Uma bateria de 1000 mAh fornece idealmente 100 mA durante:', ['10 h', '100 h', '1 h', '0,1 h'], 0, '1000 mAh / 100 mA = 10 h.'),
        tf('Uma estimativa ideal de autonomia garante exatamente o mesmo tempo em qualquer temperatura e carga.', false, 'Capacidade útil e perdas variam com as condições.'),
        num(t`Um dispositivo consome $100\,\text{mA}$ por metade do tempo e $20\,\text{mA}$ na outra metade. Qual a média em mA?`, 60, t`$0,5\cdot100+0,5\cdot20=60\,\text{mA}$.`, { unit: 'mA', tol: 0.01 }),
        graphExercise(1, 'corrente (mA)', 2, 'A 2 mA, em 10 h o consumo ideal é de 20 mAh.'),
        gen((rng) => { const n = randInt(rng, 1, 8); return num(t`Com capacidade útil ideal de $${n*100}\,\text{mAh}$ e corrente média de $100\,\text{mA}$, qual a autonomia em horas?`, n, t`$${n*100}/100=${n}\,\text{h}$.`, { unit: 'h', tol: 0.01 }); }),
        num(t`Uma bateria útil de $1200\,\text{mAh}$ alimenta carga média de $60\,\text{mA}$. Estime a autonomia ideal em horas.`, 20, t`$1200/60=20\,\text{h}$.`, { unit: 'h', tol: 0.01 }),
        mcq('Para melhorar a estimativa prática de autonomia, convém:', ['medir a corrente em cada estado e considerar capacidade útil', 'usar apenas a corrente máxima por um instante', 'ignorar perdas e temperatura como garantia', 'somar mAh e mA'], 0, 'Pondere as correntes pelo tempo e considere perdas e capacidade disponível.'),
      ] },
    ] },
  ],
};
