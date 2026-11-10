import type { UnitDef } from '../../types';
import { gen, match, mcq, near, num, tf } from '../../helpers';
import { circuit, circuitEx, circuitVisual, CLK, NMOS, R, V, wires } from '../../circuits';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;

// Chave NMOS de lado baixo, com fontes de alimentação e de porta independentes.
const chave = (porta: number) => circuit(
  V('fonte', [0, 0], [0, 4], 9, { fixed: true, locked: true }),
  R('carga', [0, 0], [4, 0], 1000, { fixed: true, locked: true, show: ['v', 'i'] }),
  wires([4, 0], [4, 1]), NMOS('q', [3, 2], { vth: 2, k: 0.5, locked: true, show: ['v', 'i'] }),
  wires([4, 3], [4, 4], [0, 4]),
  V('porta', [1, 2], [1, 4], porta, { values: [0, 5], locked: true }),
  wires([1, 2], [3, 2]), wires([1, 4], [0, 4]),
);
const visualChave = (porta = 5) => circuitVisual({ comps: chave(porta), mode: 'adjust', caption: 'Ajuste a fonte de porta e meça a carga e o MOSFET.' });
const ligar = () => circuitEx(
  t`Ajuste a tensão de porta para fazer a carga conduzir pelo menos $8\,\text{mA}$.`,
  { comps: chave(0), mode: 'adjust' }, v => v.ok && v.i('carga') > 0.008,
  t`Ajuste a porta para $5\,\text{V}$.`,
  t`Com $V_{GS}=5\,\text{V}>V_{th}=2\,\text{V}$, o canal conduz e a corrente fica próxima de $9/1000=9\,\text{mA}$.`, { set: { porta: 5 } },
);
const desligar = () => circuitEx(
  t`Ajuste a porta para deixar a corrente da carga abaixo de $0,1\,\text{mA}$.`,
  { comps: chave(5), mode: 'adjust' }, v => v.ok && Math.abs(v.i('carga')) < 0.0001,
  t`Ajuste a porta para $0\,\text{V}$.`,
  t`Com $V_{GS}=0<V_{th}$, o modelo entra em corte e a corrente da carga é praticamente nula.`, { set: { porta: 0 } },
);
const medir = () => num(t`Com a porta em $0\,\text{V}$, meça a tensão dreno-fonte do MOSFET. Informe em V, com uma casa decimal.`, 9,
  t`Em corte, a corrente é praticamente zero e quase não há queda na carga: $V_{DS}\approx9,0\,\text{V}$.`,
  { unit: 'V', tol: 0.18, visual: circuitVisual({ comps: chave(0), mode: 'view' }) });

// O clock do simulador tem ciclo de trabalho fixo de 50%.
const clock = (volts: number) => circuit(
  CLK('clk', [0, 0], [0, 3], 10, volts, { values: [2, 4, 6, 8], locked: true }),
  R('carga', [0, 0], [4, 0], 1000, { fixed: true, locked: true }),
  wires([4, 0], [4, 3], [0, 3]),
);
const visualClock = () => circuitVisual({ comps: clock(4), mode: 'adjust', scope: { ids: ['carga'], window: 0.4 }, caption: 'Clock ideal: 50% alto e 50% baixo.' });
const mediaClock = (inicio: number, alvo: number) => circuitEx(
  t`Ajuste o nível alto do clock para obter tensão média de $${fmt(alvo, 1)}\,\text{V}$ na carga.`,
  { comps: clock(inicio), mode: 'adjust', scope: { ids: ['carga'], window: 0.4 } },
  v => v.ok && near(v.wave('carga').avg, alvo, 0.08),
  t`Use nível alto de $${alvo * 2}\,\text{V}$.`,
  t`O clock fica alto metade do período, então $V_{médio}=0,5V_{alto}=${fmt(alvo, 1)}\,\text{V}$.`,
  { set: { clk: alvo * 2 } },
);
const medirClock = () => num(t`Observe o osciloscópio e meça o nível alto na carga em V, com uma casa decimal.`, 4,
  t`A carga está ligada ao clock ideal, que alterna entre $0$ e $4,0\,\text{V}$.`,
  { unit: 'V', tol: 0.08, visual: visualClock() });

export const mosfet: UnitDef = {
  id: 'ea-mos', title: 'MOSFET e eletrônica de potência', icon: '🎚️',
  subtitle: 'Do canal controlado por tensão ao acionamento de cargas',
  source: 'Conteúdo complementar · Sedra e Smith: Microeletrônica; Boylestad e Nashelsky: Dispositivos Eletrônicos e Teoria de Circuitos',
  guide: t`Para NMOS de enriquecimento, o canal surge quando $V_{GS}>V_{th}$. Neste modelo, com $V_{DS}\ge V_{GS}-V_{th}$, $I_D=K(V_{GS}-V_{th})^2$; na região ôhmica, $I_D=K[2(V_{GS}-V_{th})V_{DS}-V_{DS}^2]$. Em PWM ideal, $D=t_{alto}/T$, $f=1/T$, $V_{médio}=DV_{alto}$ e, em carga resistiva, $P_{médio}=DV_{alto}^2/R$. Em condução, $P\approx I^2R_{DS(on)}$; estime a temperatura por $T_j\approx T_a+P\theta_{JA}$. Consulte limites, condições e curvas do fabricante.`,
  extra: true,
  lessons: [
    { id: 'ea-mos-estr', title: 'Estrutura e regiões do MOSFET', parts: [
      { card: { title: 'Porta e canal', body: t`No NMOS de enriquecimento, a porta é isolada do semicondutor por uma fina camada dielétrica. A tensão porta-fonte $V_{GS}$ controla a formação do canal entre dreno e fonte. No modelo ideal, abaixo do limiar $V_{th}$ o canal está em corte. A porta praticamente não consome corrente contínua, mas possui capacitâncias que precisam ser carregadas na comutação. Mude a fonte de porta no circuito.`, visual: visualChave(0) }, exercises: [
        mcq('Qual tensão controla a formação do canal?', ['$V_{GS}$', '$V_{DS}$ apenas', 'Tensão da carga isoladamente', 'Tensão ambiente'], 0, t`A tensão da porta em relação à fonte é $V_{GS}$.`),
        tf('A porta isolada apresenta corrente contínua idealmente nula.', true, 'O dielétrico isola a porta; correntes de fuga reais são pequenas.'),
        match('Associe o terminal à função.', [['Porta', 'Controla o canal'], ['Dreno', 'Recebe a corrente convencional do canal'], ['Fonte', 'Referência de VGS']], 'O controle é feito pela tensão entre porta e fonte; neste circuito a corrente convencional entra pelo dreno.'),
        medir(),
        gen(rng => { const v = randInt(rng, 3, 6); return num(t`Com porta a $${v}\,\text{V}$ e fonte a $1\,\text{V}$, quanto vale $V_{GS}$ em V, com uma casa decimal?`, v - 1, t`$V_{GS}=${v}-1=${fmt(v - 1, 1)}\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
        ligar(), desligar(),
        mcq(t`Com $V_{th}=2\,\text{V}$, qual situação está em corte no modelo?`, [t`$V_{GS}=1\,\text{V}$`, t`$V_{GS}=4\,\text{V}$`, t`$V_{GS}=5\,\text{V}$`, t`$V_{GS}=6\,\text{V}$`], 0, t`$1<2$, logo o canal de enriquecimento não se forma no modelo.`),
      ] },
      { card: { title: 'Regiões de operação', body: t`Defina a sobretensão $V_{ov}=V_{GS}-V_{th}$. Para $V_{GS}>V_{th}$, o modelo quadrático usa região ôhmica quando $0\le V_{DS}<V_{ov}$ e saturação quando $V_{DS}\ge V_{ov}$. Nesta convenção, $I_D=K V_{ov}^2$ em saturação. O fator $1/2$ às vezes aparece incorporado em outras definições de $K$.`, visual: visualChave() }, exercises: [
        tf('Na saturação do modelo, VDS é pelo menos igual à sobretensão.', true, t`A condição é $V_{DS}\ge V_{GS}-V_{th}$.`),
        mcq(t`Com $V_{GS}=4\,\text{V}$, $V_{th}=2\,\text{V}$ e $V_{DS}=1\,\text{V}$, qual região?`, ['Ôhmica', 'Corte', 'Saturação', 'Ruptura'], 0, t`$V_{ov}=2\,\text{V}$ e $0<V_{DS}=1<2\,\text{V}$.`),
        medir(),
        gen(rng => { const ov = randInt(rng, 1, 4); return num(t`Na saturação, $K=2\,\text{mA/V}^2$ e $V_{ov}=${ov}\,\text{V}$. Qual $I_D$ em mA, com uma casa decimal?`, 2 * ov * ov, t`$I_D=K V_{ov}^2=2\cdot${ov}^2=${fmt(2 * ov * ov, 1)}\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }); }),
        num(t`Na região ôhmica, $K=1\,\text{mA/V}^2$, $V_{ov}=2\,\text{V}$ e $V_{DS}=1\,\text{V}$. Qual $I_D$ em mA, com uma casa decimal?`, 3, t`$I_D=1[2\cdot2\cdot1-1^2]=3,0\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }),
        ligar(), desligar(),
        tf('Vth sozinho garante baixa resistência de condução para uma carga de potência.', false, 'O limiar é definido em uma corrente de teste; para condução de potência consulte RDS(on) na tensão de porta aplicada.'),
      ] },
    ] },
    { id: 'ea-mos-chave', title: 'MOSFET como chave', parts: [
      { card: { title: 'Chave de lado baixo', body: t`Com a carga entre o positivo e o dreno e a fonte no retorno, um NMOS pode chavear a carga pelo lado baixo. Em corte, a corrente é pequena; ligado adequadamente, sua queda $V_{DS}$ pode ser pequena. A tensão de comando deve ser medida em relação à fonte, e os retornos do comando e da carga devem ser compatíveis.`, visual: visualChave(0) }, exercises: [
        mcq('Na chave de lado baixo, onde fica a carga?', ['Entre o positivo e o dreno', 'Entre porta e fonte apenas', 'Em paralelo com a porta isolada', 'Entre dois terminais da fonte do MOSFET'], 0, 'A corrente convencional passa do positivo pela carga ao dreno e sai pela fonte.'),
        tf('Uma porta flutuante garante que o MOSFET fique desligado.', false, 'A capacitância da porta pode reter carga; um resistor de pull-down ajuda a definir o estado.'),
        medir(),
        gen(rng => { const r = randInt(rng, 2, 6); return num(t`Uma chave ideal alimenta $${r}\,\Omega$ com $12\,\text{V}$. Qual a corrente ligada em A, com duas casas decimais?`, 12 / r, t`$I=12/${r}=${fmt(12 / r, 2)}\,\text{A}$.`, { unit: 'A', tol: 0.005 }); }),
        mcq('Para garantir o desligamento durante a inicialização, qual componente ajuda?', ['Resistor entre porta e fonte', 'Capacitor em série com a carga como única proteção', 'Fio entre dreno e positivo', 'Fonte sem retorno comum'], 0, 'Um pull-down mantém a porta próxima da fonte quando o controlador está em alta impedância.'),
        ligar(), desligar(),
        tf('Uma fonte no potencial de 3 V e uma porta em 5 V resultam em VGS de 5 V.', false, t`$V_{GS}=5-3=2\,\text{V}$.`),
      ] },
      { card: { title: 'Escolha e proteção', body: t`Para uma chave real, confira $V_{DS}$ máximo, corrente, margem térmica e $R_{DS(on)}$ especificada no $V_{GS}$ disponível. Uma carga indutiva precisa de caminho para a corrente na abertura: um diodo de roda livre em paralelo, catodo no positivo, limita o pico numa alimentação CC. A energia magnética ainda precisa ser dissipada.`, visual: visualChave() }, exercises: [
        mcq('Qual dado indica a resistência ligada nas condições especificadas?', ['$R_{DS(on)}$', '$V_{th}$ isoladamente', 'A cor do encapsulamento', 'A frequência da rede elétrica'], 0, 'Use RDS(on) na tensão de porta, temperatura e corrente especificadas.'),
        tf('Um diodo de roda livre em carga CC indutiva conduz normalmente quando a chave está ligada.', false, 'Com o catodo no positivo, ele fica reversamente polarizado durante a alimentação normal.'),
        medir(),
        gen(rng => { const i = randInt(rng, 1, 4); return num(t`Com $I=${i}\,\text{A}$ e $R_{DS(on)}=0,1\,\Omega$, estime a perda em W, com uma casa decimal.`, i * i * 0.1, t`$P=I^2R=${i}^2\cdot0,1=${fmt(i * i * 0.1, 1)}\,\text{W}$.`, { unit: 'W', tol: 0.05 }); }),
        mcq('Na carga indutiva de uma chave NMOS de lado baixo, o catodo do diodo de roda livre vai ao…', ['positivo da alimentação', 'dreno, com anodo no positivo', 'terminal de porta', 'ponto sem conexão'], 0, 'O anodo vai ao dreno e o catodo ao positivo para ficar reverso durante a condução normal.'),
        ligar(), desligar(),
        tf('A resistência ligada pode aumentar com a temperatura.', true, 'A folha de dados traz a variação térmica, relevante para estimar perdas e margem.'),
      ] },
    ] },
    { id: 'ea-mos-pwm', title: 'PWM e controle de potência', parts: [
      { card: { title: 'Ciclo de trabalho', body: t`PWM alterna a chave entre estados. O ciclo de trabalho é $D=t_{alto}/T$ e a frequência é $f=1/T$. Para níveis $0$ e $V_{alto}$, a média em um período é $DV_{alto}$. A tensão instantânea continua pulsada. O clock deste simulador tem ciclo fixo de 50%; altere seu nível alto e observe a forma de onda.`, visual: visualClock() }, exercises: [
        mcq('O que representa o ciclo de trabalho?', ['Fração do período no nível alto', 'Número de volts da fonte', 'Corrente máxima do transistor', 'Resistência da carga'], 0, 'Divida o tempo alto pelo período completo.'),
        tf('Com período fixo, aumentar o tempo alto aumenta o ciclo de trabalho.', true, t`Como $D=t_{alto}/T$, o numerador aumenta e o denominador fica fixo.`),
        medirClock(),
        gen(rng => { const d = randInt(rng, 1, 9); return num(t`Um sinal de $0$ a $10\,\text{V}$ fica alto por $${d * 10}\%$ do período. Qual a média em V, com uma casa decimal?`, d, t`$V_{médio}=0,${d}\cdot10=${fmt(d, 1)}\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
        num(t`Um pulso fica alto por $2\,\text{ms}$ em um período de $8\,\text{ms}$. Qual o ciclo em %, com uma casa decimal?`, 25, t`$D=2/8=0,25=25,0\%$.`, { unit: '%', tol: 0.05 }),
        mediaClock(2, 3), mediaClock(8, 2),
        num(t`Um PWM tem período de $2\,\text{ms}$. Qual a frequência em Hz, com uma casa decimal?`, 500, t`$f=1/(0,002)=500,0\,\text{Hz}$.`, { unit: 'Hz', tol: 0.05 }),
      ] },
      { card: { title: 'Potência média e forma de onda', body: t`Em carga puramente resistiva e chave ideal, com tensão $0$ ou $V$, a potência é $V^2/R$ durante o pulso e zero no restante: $P_{médio}=DV^2/R$. Ela não é $(DV)^2/R$, pois a média do quadrado difere do quadrado da média. Motores e filtros podem suavizar a resposta, mas sua dinâmica depende da carga e frequência.`, visual: visualClock() }, exercises: [
        tf('A tensão PWM instantânea é sempre igual à média.', false, 'Ela alterna entre níveis; a média resume o período.'),
        mcq('Em resistência fixa, qual expressão descreve a potência média de PWM ideal 0–V?', ['$DV^2/R$', '$D^2V^2/R$', '$V/R$', '$R/V$'], 0, 'A potência ligada é V²/R e aparece durante a fração D do tempo.'),
        medirClock(),
        gen(rng => { const d = randInt(rng, 1, 9); return num(t`Uma carga de $10\,\Omega$ recebe pulsos ideais de $10\,\text{V}$ com ciclo de $${d * 10}\%$. Qual a potência média em W, com uma casa decimal?`, d, t`$P=0,${d}\cdot10^2/10=${fmt(d, 1)}\,\text{W}$.`, { unit: 'W', tol: 0.05 }); }),
        num(t`Para $V=12\,\text{V}$, $R=6\,\Omega$ e ciclo de $25\%$, calcule a potência média em W, com uma casa decimal.`, 6, t`$P=0,25\cdot12^2/6=6,0\,\text{W}$.`, { unit: 'W', tol: 0.05 }),
        mediaClock(2, 4), mediaClock(8, 1),
        tf('A resposta de um motor a PWM depende de sua dinâmica e da frequência.', true, 'Indutância, inércia e frequência afetam a ondulação de corrente e velocidade.'),
      ] },
    ] },
    { id: 'ea-mos-pot', title: 'Relés, tiristores e dissipação térmica', parts: [
      { card: { title: 'Relé e tiristor', body: t`O relé eletromecânico usa uma bobina para acionar contatos, isolando eletricamente o circuito de controle dos contatos dentro dos limites especificados. Um SCR é um tiristor que pode ser disparado pela porta em polarização direta e permanece conduzindo enquanto a corrente não cair abaixo da corrente de manutenção. A bobina CC precisa de proteção contra sobretensão. O circuito mostra a chave que poderia acionar uma carga, não um modelo de relé ou SCR.`, visual: visualChave() }, exercises: [
        mcq('O que aciona os contatos de um relé eletromecânico?', ['O campo magnético da bobina', 'A luz ambiente', 'A resistência térmica da caixa', 'A cor dos contatos'], 0, 'A corrente na bobina cria campo magnético que move o mecanismo.'),
        tf('Um SCR convencional pode permanecer conduzindo após o pulso de porta.', true, 'Ele permanece ligado enquanto as condições de condução se mantêm e a corrente supera a corrente de manutenção.'),
        medir(),
        gen(rng => { const v = randInt(rng, 2, 6) * 2; return num(t`Uma bobina CC ideal de $${v * 100}\,\Omega$ recebe $${v}\,\text{V}$. Qual sua corrente em mA, com uma casa decimal?`, 10, t`$I=${v}/${v * 100}=0,01\,\text{A}=10,0\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }); }),
        mcq('Em CC, como um SCR ligado pode ser desligado?', ['Reduzindo a corrente abaixo da manutenção', 'Retirando apenas o pulso de porta', 'Aumentando indefinidamente a corrente', 'Desconectando só a porta'], 0, 'O pulso inicia a condução; desligar exige reduzir a corrente abaixo da manutenção ou comutação apropriada.'),
        ligar(), desligar(),
        tf('O isolamento dos contatos de relé dispensa respeitar tensão e distância especificadas.', false, 'Os contatos e o isolamento têm limites de tensão, corrente e aplicação.'),
      ] },
      { card: { title: 'Calor e margem', body: t`Perdas de condução e de comutação aquecem o semicondutor. Uma estimativa estacionária é $T_j=T_a+P\theta_{JA}$, desde que a resistência térmica corresponda à montagem. Dissipador, interface e ventilação alteram o caminho térmico. Para perdas variáveis e pulsos, consulte impedância térmica transitória e área de operação segura.`, visual: visualChave() }, exercises: [
        mcq('Qual grandeza relaciona elevação de temperatura e potência em regime estacionário?', ['Resistência térmica', 'Capacitância da porta isoladamente', 'Ciclo de rede somente', 'Tensão de limiar'], 0, t`$\Delta T=P\theta$ quando o modelo térmico estacionário se aplica.`),
        tf('Um dissipador adequado pode reduzir a temperatura de junção.', true, 'Ele reduz a resistência térmica do caminho de calor quando bem instalado.'),
        medir(),
        gen(rng => { const p = randInt(rng, 1, 4); return num(t`Com ambiente a $25\,°\text{C}$, $P=${p}\,\text{W}$ e $\theta_{JA}=10\,°\text{C/W}$, estime a junção em °C, com uma casa decimal.`, 25 + 10 * p, t`$T_j=25+${p}\cdot10=${fmt(25 + 10 * p, 1)}\,°\text{C}$.`, { unit: '°C', tol: 0.05 }); }),
        num(t`Um MOSFET conduz $2\,\text{A}$ com $R_{DS(on)}=0,2\,\Omega$. Estime a perda de condução em W, com uma casa decimal.`, 0.8, t`$P=I^2R=2^2\cdot0,2=0,8\,\text{W}$.`, { unit: 'W', tol: 0.05 }),
        ligar(), desligar(),
        tf('A estimativa térmica estacionária sozinha descreve qualquer pulso curto com precisão.', false, 'Pulsos exigem considerar a impedância térmica transitória e os limites do dispositivo.'),
      ] },
    ] },
  ],
};
