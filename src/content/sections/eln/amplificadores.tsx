import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, tf } from '../../helpers';
import { fnLab } from '../../visuals';
import { circuit, circuitEx, circuitVisual, NPN, R, V, wires } from '../../circuits';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;
const graph = (sign: number, follower = false) => fnLab({
  view: { xMin: 0, xMax: 2, yMin: -4.5, yMax: 4.5 },
  params: [{ key: 'a', label: 'Ganho em módulo', min: follower ? 0.4 : 1, max: follower ? 1 : 4, step: follower ? 0.2 : 1, value: follower ? 0.4 : 1 }],
  ghost: x => Math.sin(2 * Math.PI * x),
  f: (x, p) => sign * p.a * Math.sin(2 * Math.PI * x),
  info: p => t`Osciloscópio ideal: entrada tracejada, saída contínua; tensões em V, tempo em ms. Entrada: $v_i=\sin(2\pi t)\,\text{V}$. Ganho $A_v=${sign * p.a}$. Modelo linear, sem recorte.`,
});
const stage = (rb: number, follower = false) => circuit(
  V('vcc', [0, 0], [0, 6], 12, { fixed: true, locked: true }),
  wires([0, 0], [2, 0], [6, 0]),
  R('rb', [2, 0], [2, 3], rb, { label: 'RB', min: 10000, max: 1000000, values: [10000, 100000, 470000, 1000000], locked: true }),
  wires([2, 3], [5, 3]),
  ...(follower ? wires([6, 0], [6, 2]) : [R('rc', [6, 0], [6, 2], 2200, { label: 'RC', fixed: true, locked: true })]),
  NPN('q', [5, 3], { beta: 100, locked: true }),
  ...(follower ? [R('re', [6, 4], [6, 6], 1000, { label: 'RE', fixed: true, locked: true, show: ['v', 'i'] })] : wires([6, 4], [6, 6])),
  wires([6, 6], [0, 6]),
);
const measure = (follower: boolean) => mcq(
  follower ? t`Meça a tensão em $R_E$ neste seguidor. Qual faixa contém a leitura?` : t`Meça $V_{CE}$ do transistor. Qual faixa contém a leitura?`,
  follower ? [t`$1$ a $3\,\text{V}$`, t`$4$ a $6\,\text{V}$`, t`$7$ a $9\,\text{V}$`, t`$10$ a $12\,\text{V}$`] : [t`$5$ a $8\,\text{V}$`, t`$0$ a $1\,\text{V}$`, t`$10$ a $12\,\text{V}$`, t`$15$ a $20\,\text{V}$`], 0,
  follower ? t`Aproximando $V_{BE}=0,7\,\text{V}$ e $\beta=100$, $I_E\approx101(12-0,7)/(470000+101000)=2,0\,\text{mA}$ e $V_E\approx2,0\,\text{V}$. O modelo detalhado varia um pouco.` : t`$I_B\approx(12-0,7)/470\,\text{k}\Omega=24\,\mu\text{A}$, $I_C\approx2,4\,\text{mA}$ e $V_{CE}\approx12-2,2\cdot2,4=6,7\,\text{V}$. O modelo detalhado varia um pouco.`,
  { visual: circuitVisual({ comps: stage(470000, follower), mode: 'view' }) },
);
const adjust = (follower: boolean, high: boolean) => circuitEx(
  follower ? (high ? t`Ajuste $R_B$ para obter corrente em $R_E$ entre $4$ e $7\,\text{mA}$, mantendo $V_{CE}>1\,\text{V}$.` : t`Ajuste $R_B$ para obter corrente em $R_E$ entre $1$ e $3\,\text{mA}$, mantendo $V_{CE}>1\,\text{V}$.`) : (high ? t`Ajuste $R_B$ para obter $I_C$ entre $2$ e $3\,\text{mA}$ e $V_{CE}>1\,\text{V}$.` : t`Ajuste $R_B$ para obter $I_C$ abaixo de $1,5\,\text{mA}$, com $V_{CE}>1\,\text{V}$.`),
  { comps: stage(high ? 1000000 : 100000, follower), mode: 'adjust' },
  v => follower ? (v.i('re') > (high ? 0.004 : 0.001) && v.i('re') < (high ? 0.007 : 0.003) && v.v('q') > 1) : (v.i('q') > 0 && v.i('q') < (high ? 0.003 : 0.0015) && (!high || v.i('q') > 0.002) && v.v('q') > 1),
  high ? (follower ? t`Use $R_B=100\,\text{k}\Omega$.` : t`Use $R_B=470\,\text{k}\Omega$.`) : t`Use $R_B=${follower ? 470 : 1000}\,\text{k}\Omega$.`,
  follower ? (high ? t`$I_E\approx101(12-0,7)/(100000+101000)=5,68\,\text{mA}$; $V_{CE}\approx12-5,68=6,32\,\text{V}$.` : t`$I_E\approx101(12-0,7)/(470000+101000)=2,0\,\text{mA}$; $V_{CE}\approx10\,\text{V}$.`) : (high ? t`$I_C\approx100(12-0,7)/470000=2,4\,\text{mA}$ e $V_{CE}\approx6,7\,\text{V}$.` : t`$I_C\approx100(12-0,7)/1000000=1,13\,\text{mA}$ e $V_{CE}\approx9,5\,\text{V}$.`),
  { set: { rb: high ? (follower ? 100000 : 470000) : (follower ? 470000 : 1000000) } },
);
const q = (prompt: string, correct: string, wrong: string[], explain: string) => mcq(prompt, [correct, ...wrong], 0, explain);
const n = (prompt: string, answer: number, unit: string, explain: string, tol = 0.05) => num(prompt, answer, explain, { unit, tol });
const interactive = (sign: number) => inter(t`No gráfico, ajuste o módulo do ganho para $3$ e compare a saída com a referência indicada.`, 'plot', graph(sign).props, v => v.p.a === 3, t`Ganho em módulo $3$.`, t`A saída tem pico de $3\,\text{V}$ para entrada de pico $1\,\text{V}$; o sinal do ganho indica a fase.`);
const circuitTail = (follower: boolean) => [measure(follower), adjust(follower, true), adjust(follower, false)];

export const amplificadores: UnitDef = {
  id: 'ea-amp', title: 'Amplificadores a transistor', icon: '📢',
  subtitle: 'Ganho, estágios bipolares e classes de operação',
  source: 'Conteúdo complementar · Malvino e Bates, Eletrônica; Sedra e Smith, Microeletrônica', extra: true,
  guide: t`Para sinais de mesma forma, $A_v=v_o/v_i$; o sinal indica fase. $G_V=20\log_{10}|A_v|$ e $G_P=10\log_{10}(P_o/P_i)$. Em pequenos sinais, à temperatura ambiente, $r_e\approx25\,\text{mV}/I_E$. Em emissor comum com emissor aterrado em CA, $A_v\approx-(R_C\parallel R_L)/r_e$; no seguidor idealizado, $A_v\approx R_E/(R_E+r_e)$, com $R_E$ representando a carga efetiva no emissor. Essas aproximações exigem região ativa e sinal pequeno. Classes A, B e AB conduzem, respectivamente, por $360^\circ$, $180^\circ$ e entre $180^\circ$ e $360^\circ$ por dispositivo.`,
  lessons: [
    { id: 'ea-amp-ganho', title: 'Ganho e decibéis', parts: [
      { card: { title: 'Razão e fase', body: t`Ganho de tensão é a razão entre saída e entrada medidas de modo consistente: pico com pico ou eficaz com eficaz. $A_v=-3$ indica módulo 3 e inversão de fase de $180^\circ$. A energia extra vem da fonte de alimentação. No gráfico, compare a saída com a senoide de referência.`, visual: graph(-1) }, exercises: [
        q('De onde vem a energia adicional entregue por um amplificador?', 'Da fonte de alimentação', ['Do resistor sozinho', 'Do osciloscópio', 'Da escala em decibéis'], 'A alimentação fornece a potência adicional controlada pelo sinal de entrada.'),
        tf(t`$A_v<0$ indica inversão de fase para senoides na mesma frequência.`, true, t`O sinal negativo corresponde a uma diferença de fase de $180^\circ$ no modelo real.`),
        n(t`Entrada de pico $0,2\,\text{V}$ e saída de pico $1,0\,\text{V}$. Qual o módulo do ganho, com uma casa decimal?`, 5, '', t`$|A_v|=1,0/0,2=5,0$.`),
        gen(rng => { const a = randInt(rng, 2, 8); return n(t`Uma entrada de pico $0,1\,\text{V}$ passa por ganho $${a}$. Qual a saída de pico em V, com uma casa decimal?`, a / 10, 'V', t`$V_{o,p}=${a}\cdot0,1=${fmt(a / 10, 1)}\,\text{V}$.`); }),
        interactive(-1),
        q(t`No osciloscópio, os picos positivos da entrada coincidem com os negativos da saída. Qual a fase relativa?`, t`$180^\circ$`, [t`$0^\circ$`, t`$90^\circ$`, t`$45^\circ$`], t`Senoides na mesma frequência e em oposição têm defasagem de $180^\circ$.`),
        n(t`Uma entrada de $20\,\text{mV}$ de pico produz saída invertida de $100\,\text{mV}$ de pico. Qual $A_v$ assinado, com uma casa decimal?`, -5, '', t`$A_v=-100/20=-5,0$; o sinal registra a inversão.`),
      ] },
      { card: { title: 'Escala logarítmica', body: t`Para potência, $G_P=10\log_{10}(P_o/P_i)$. Para tensão, use $G_V=20\log_{10}|V_o/V_i|$. O ganho em tensão em dB coincide com o ganho de potência em dB quando as resistências de entrada e saída comparadas são iguais. Ganhos em dB somam em cascata.`, visual: graph(1) }, exercises: [
        q(t`Qual expressão calcula o ganho de potência em dB?`, t`$10\log_{10}(P_o/P_i)$`, [t`$20\log_{10}(P_o/P_i)$`, t`$P_o-P_i$`, t`$10(P_o/P_i)$`], t`Por definição de decibel de potência, multiplique o logaritmo da razão por 10.`),
        tf(t`$0\,\text{dB}$ de ganho de tensão corresponde a razão de módulos igual a 1.`, true, t`$20\log_{10}1=0\,\text{dB}$.`),
        n(t`Uma razão de tensão de $10$ corresponde a quantos dB? Dê uma casa decimal.`, 20, 'dB', t`$20\log_{10}10=20\,\text{dB}$.`),
        gen(rng => { const k = randInt(rng, 1, 3); return n(t`A razão de potência é $10^{${k}}$. Calcule o ganho em dB, com uma casa decimal.`, 10 * k, 'dB', t`$10\log_{10}(10^{${k}})=10\cdot${k}=${10 * k}\,\text{dB}$.`); }),
        interactive(1),
        n(t`Dois estágios têm ganhos de tensão de $6\,\text{dB}$ e $14\,\text{dB}$. Qual o ganho total em dB, com uma casa decimal?`, 20, 'dB', t`Em cascata, somam-se os ganhos expressos em dB: $6+14=20\,\text{dB}$.`),
        n(t`Para razão de tensão $2$, calcule o ganho em dB com duas casas decimais.`, 20 * Math.log10(2), 'dB', t`$20\log_{10}2\approx6,02\,\text{dB}$.`, 0.005),
      ] },
    ] },
    { id: 'ea-amp-ec', title: 'Emissor comum', parts: [
      { card: { title: 'Ponto de operação e sinal', body: t`No emissor comum, a saída no coletor inverte pequenas variações da entrada na base. Polarize na região ativa, deixando margem para oscilações antes do corte e da saturação. O circuito mostra o ponto DC; para comparar senoides, use o gráfico idealizado.`, visual: graph(-1) }, exercises: [
        q('Em emissor comum, onde se toma a saída?', 'No coletor', ['Na base', 'Na fonte de alimentação', 'No terra'], 'A saída da configuração é a variação de tensão no coletor.'),
        tf('Na região linear, uma subida da corrente de coletor aumenta a queda em RC e reduz a tensão do coletor.', true, t`$V_C=V_{CC}-I_C R_C$: maior corrente produz menor tensão de coletor.`),
        gen(rng => { const i = randInt(rng, 1, 5); return n(t`Com $I_E=${i}\,\text{mA}$, estime $r_e$ em Ω, com uma casa decimal.`, 25 / i, 'Ω', t`$r_e\approx25\,\text{mV}/${i}\,\text{mA}=${fmt(25 / i, 2)}\,\Omega$.`); }),
        n(t`Para $V_{CC}=12\,\text{V}$, $R_C=2\,\text{k}\Omega$ e $I_C=3\,\text{mA}$, calcule $V_C$ em V, com uma casa decimal.`, 6, 'V', t`$V_C=12-2\cdot3=6\,\text{V}$.`),
        ...circuitTail(false),
      ] },
      { card: { title: 'Ganho em pequenos sinais', body: t`Com emissor aterrado em CA, $A_v\approx-(R_C\parallel R_L)/r_e$; sem carga externa use $R_C$. A aproximação despreza resistência de saída do transistor. Se a saída alcançar limites de corte ou saturação, a senoide recorta e a fórmula linear deixa de valer.`, visual: circuitVisual({ comps: stage(470000), mode: 'adjust' }) }, exercises: [
        q('Por que a saída do coletor inverte?', 'A queda em RC cresce quando a corrente cresce', ['RC elimina a fonte', 'A frequência fica negativa', 'O transistor não conduz'], t`$V_C=V_{CC}-I_C R_C$, logo uma variação positiva de corrente reduz $V_C$.`),
        tf('O ganho linear previsto permanece válido mesmo com forte recorte.', false, 'O recorte indica saída fora da faixa linear; a razão de picos deixa de representar o ganho incremental.'),
        gen(rng => { const r = randInt(rng, 2, 8) * 100; return n(t`Com emissor aterrado em CA, $r_e=25\,\Omega$ e carga efetiva $${r}\,\Omega$, estime $A_v$ assinado, com uma casa decimal.`, -r / 25, '', t`$A_v\approx-${r}/25=${-r / 25}$.`); }),
        n(t`Para $I_E=1\,\text{mA}$ e carga efetiva $1\,\text{k}\Omega$, estime o módulo do ganho, com uma casa decimal.`, 40, '', t`$r_e=25/1=25\,\Omega$ e $|A_v|\approx1000/25=40$.`),
        ...circuitTail(false),
      ] },
    ] },
    { id: 'ea-amp-cc', title: 'Seguidor de emissor', parts: [
      { card: { title: 'Saída no emissor', body: t`No coletor comum, a saída é tomada no emissor e acompanha a entrada sem inversão em pequenos sinais. A tensão DC do emissor é aproximadamente $0,7\,\text{V}$ abaixo da base; não confunda essa diferença DC com o ganho incremental. O gráfico mostra um modelo linear simplificado.`, visual: graph(1, true) }, exercises: [
        q('Onde fica a saída do seguidor de emissor?', 'No emissor', ['No coletor', 'Na alimentação', 'No resistor de base'], 'O sinal de saída é medido no emissor em relação à referência.'),
        tf('No seguidor em região ativa, pequenas variações na saída acompanham a fase da entrada.', true, 'Uma subida da base tende a elevar a tensão do emissor; não há inversão.'),
        gen(rng => { const v = randInt(rng, 2, 8); return n(t`Com base em $${v}\,\text{V}$ DC e $V_{BE}=0,7\,\text{V}$, estime $V_E$ em V, com uma casa decimal.`, v - 0.7, 'V', t`$V_E\approx V_B-0,7=${fmt(v - 0.7, 1)}\,\text{V}$.`); }),
        n(t`Com $V_B=3,7\,\text{V}$ e $V_{BE}=0,7\,\text{V}$, estime $V_E$ em V, com uma casa decimal.`, 3, 'V', t`$V_E\approx3,7-0,7=3,0\,\text{V}$.`),
        ...circuitTail(true),
      ] },
      { card: { title: 'Carga e adaptação', body: t`O seguidor oferece ganho de tensão positivo e próximo de 1, alta resistência de entrada e baixa resistência de saída em relação a um estágio simples. Com carga efetiva $R_E$ e modelo simplificado, $A_v\approx R_E/(R_E+r_e)$. Ele pode fornecer ganho de corrente e isolar uma fonte de uma carga.`, visual: circuitVisual({ comps: stage(470000, true), mode: 'adjust' }) }, exercises: [
        q('Uma aplicação típica do seguidor é…', 'Isolar uma fonte de uma carga', ['Inverter a fase em 180°', 'Gerar energia sem alimentação', 'Eliminar qualquer corrente'], 'A entrada de alta resistência carrega menos a fonte; a saída pode alimentar uma carga mais exigente.'),
        tf('Um ganho de tensão próximo de 1 impede qualquer ganho de corrente.', false, 'O estágio pode fornecer ganho de corrente mesmo quando a razão de tensões é próxima de 1.'),
        gen(rng => { const k = randInt(rng, 2, 8); return n(t`Se $r_e=100\,\Omega$ e a carga efetiva é $${k * 100}\,\Omega$, estime $A_v$ com duas casas decimais.`, k / (k + 1), '', t`$A_v\approx${k * 100}/(${k * 100}+100)=${fmt(k / (k + 1), 2)}$.`, 0.005); }),
        n(t`Se $r_e=25\,\Omega$ e a carga efetiva é $975\,\Omega$, estime $A_v$ com três casas decimais.`, 0.975, '', t`$A_v\approx975/(975+25)=0,975$.`, 0.0005),
        ...circuitTail(true),
      ] },
    ] },
    { id: 'ea-amp-classes', title: 'Classes de amplificadores', parts: [
      { card: { title: 'Ângulo de condução', body: t`A classe descreve a fração do ciclo durante a qual cada dispositivo conduz: A conduz $360^\circ$; B, idealmente $180^\circ$; AB, mais de $180^\circ$ e menos de $360^\circ$. Em push-pull, dois dispositivos complementares podem compor o ciclo completo.`, visual: graph(1) }, exercises: [
        q('Qual classe conduz durante todo o ciclo?', 'A', ['B', 'C', 'Nenhuma'], t`A classe A mantém o dispositivo conduzindo por $360^\circ$.`),
        tf(t`Na classe B ideal, cada dispositivo conduz por $180^\circ$.`, true, t`Cada dispositivo conduz metade do período: $180^\circ$ de $360^\circ$.`),
        n(t`Um dispositivo conduz por $270^\circ$ em cada ciclo. Qual fração do ciclo em %, com uma casa decimal?`, 75, '%', t`$270/360\cdot100=75,0\%$.`),
        gen(rng => { const k = randInt(rng, 1, 3); return n(t`Uma condução dura $${k}/4$ do ciclo. Qual o ângulo em graus, com uma casa decimal?`, k * 90, '°', t`$360^\circ\cdot${k}/4=${k * 90}^\circ$.`); }),
        interactive(1),
        q(t`Um dispositivo conduz por $220^\circ$. Qual classe descreve essa condução?`, 'AB', ['A', 'B ideal', 'C'], t`$180^\circ<220^\circ<360^\circ$, intervalo da classe AB.`),
        n(t`Para um ciclo de $20\,\text{ms}$, quanto tempo conduz um dispositivo classe B ideal? Responda em ms, com uma casa decimal.`, 10, 'ms', t`Metade de $20\,\text{ms}$ é $10,0\,\text{ms}$.`),
      ] },
      { card: { title: 'Eficiência e distorção', body: t`Na classe B push-pull, a região próxima de zero pode apresentar distorção de cruzamento por causa das tensões de junção. Uma pequena polarização em AB reduz essa zona morta, mas aumenta a dissipação em repouso. Eficiência é $\eta=P_{out}/P_{DC}$; os limites dependem da topologia e do modelo.`, visual: graph(-1) }, exercises: [
        q('Que distorção pode aparecer perto de zero em push-pull classe B?', 'Distorção de cruzamento', ['Eco acústico', 'Refração', 'Distorção gravitacional'], 'As junções precisam de tensão para conduzir, criando uma região morta em torno de zero.'),
        tf('Uma polarização AB adequada reduz a zona morta em relação à classe B idealizada com junções reais.', true, 'A pequena corrente de repouso mantém os dispositivos próximos da condução durante a passagem por zero.'),
        n(t`Uma etapa entrega $4\,\text{W}$ à carga e recebe $10\,\text{W}$ DC. Qual a eficiência em %, com uma casa decimal?`, 40, '%', t`$\eta=4/10\cdot100=40,0\%$.`),
        gen(rng => { const p = randInt(rng, 2, 8); return n(t`Uma etapa recebe $10\,\text{W}$ DC e entrega $${p}\,\text{W}$ à carga. Qual a eficiência em %, com uma casa decimal?`, 10 * p, '%', t`$\eta=${p}/10\cdot100=${10 * p}\%$.`); }),
        interactive(-1),
        q('Ao aumentar a polarização de repouso de B para AB, qual troca é esperada?', 'Menos zona morta e maior dissipação em repouso', ['Mais zona morta e menor dissipação sempre', 'Eficiência de 100% garantida', 'Ausência de necessidade de alimentação'], 'A sobreposição de condução reduz a zona morta, mas a corrente de repouso dissipa potência.'),
        n(t`Uma etapa recebe $20\,\text{W}$ DC e entrega $8\,\text{W}$ à carga. Desprezando outras saídas, qual potência dissipada em W, com uma casa decimal?`, 12, 'W', t`Pela conservação de energia, $P_{diss}=20-8=12,0\,\text{W}$.`),
      ] },
    ] },
  ],
};
