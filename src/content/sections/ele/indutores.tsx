import type { UnitDef, Exercise } from '../../types';
import { gen, mcq, num, tf, near } from '../../helpers';
import { circuit, circuitEx, circuitVisual, C, D, L, R, SW, V, wires } from '../../circuits';
import { randInt } from '../../../lib/random';

const t = String.raw;

// Fonte de 6 V, bobina ideal e resistor: o resistor também representa perdas da bobina.
const rl = (resistance = 6, inductance = 1) => circuit(
  V('fonte', [0, 0], [0, 3], 6, { fixed: true, locked: true }),
  R('r', [0, 0], [3, 0], resistance, { label: 'R', values: [3, 6, 12], locked: true }),
  L('l', [3, 0], [6, 0], inductance, { label: 'L', values: [0.5, 1, 2], locked: true }),
  wires([6, 0], [6, 3], [0, 3]),
);
const lab = () => circuitVisual({ comps: rl(), mode: 'adjust', scope: { ids: ['l'], of: 'i', window: 2 }, timeScale: 0.2 });

// Dois objetivos elétricos independentes: regime permanente e corrente em um instante.
const pratica = (): Exercise[] => [
  num(t`No simulador, selecione a bobina e leia sua corrente em regime permanente DC. Com $R=6\,\Omega$, responda em A, com uma casa decimal.`, 1,
    t`Em regime DC a bobina ideal é um curto: $I=6/6=1\,\text{A}$.`, { unit: 'A', tol: 0.05, visual: lab() }),
  circuitEx(t`Ajuste $R$ para que a corrente de regime permanente da bobina seja $0,5\,\text{A}$.`,
    { comps: rl(), mode: 'adjust' }, v => near(v.i('l'), 0.5, 0.01), t`$R=12\,\Omega$`,
    t`Em regime DC, $I=V/R$. Assim, $R=6/0,5=12\,\Omega$.`, { set: { r: 12 } }),
  circuitEx(t`Com $R=6\,\Omega$ e corrente inicial nula, ajuste $L$ para que a corrente após $0,167\,\text{s}$ seja aproximadamente $0,39\,\text{A}$.`,
    { comps: rl(), mode: 'adjust', scope: { ids: ['l'], of: 'i', window: 1 }, timeScale: 0.1 }, v => near(v.at('l', 1 / 6, 'i'), 1 - Math.exp(-0.5), 0.015), t`$L=2\,\text{H}$`,
    t`Para $L=2\,\text{H}$, $\tau=L/R=1/3\,\text{s}$ e $i(1/6)=1-e^{-1/2}\approx0,39\,\text{A}$.`, { set: { l: 2 } }),
];

const rlc = (r = 2, cap = 1) => circuit(
  V('fonte', [0, 0], [0, 4], 6, { fixed: true, locked: true }),
  R('r', [0, 0], [2, 0], r, { values: [1, 2, 4], locked: true }),
  L('l', [2, 0], [4, 0], 1, { fixed: true, locked: true }),
  C('c', [4, 0], [4, 4], cap, { values: [0.5, 1, 2], locked: true }),
  wires([4, 4], [0, 4]),
);
const rlcLab = () => circuitVisual({ comps: rlc(), mode: 'adjust', scope: { ids: ['c'], of: 'v', window: 8 }, timeScale: 0.5 });
const praticaRlc = (): Exercise[] => [
  num(t`No simulador RLC, leia a tensão do capacitor em regime DC. Responda em V, com uma casa decimal.`, 6,
    t`Em regime DC, o capacitor está aberto e não há queda no resistor nem na bobina ideal: $V_C=6\,\text{V}$.`, { unit: 'V', tol: 0.05, visual: rlcLab() }),
  circuitEx(t`Ajuste $R$ para que a tensão do capacitor após $1\,\text{s}$, partindo descarregado, seja aproximadamente $1,07\,\text{V}$.`,
    { comps: rlc(), mode: 'adjust', scope: { ids: ['c'], of: 'v', window: 4 }, timeScale: 0.25 }, v => near(v.at('c', 1, 'v'), 1.066, 0.03),
    t`$R=4\,\Omega$`, t`Com $R=4\,\Omega$, $L=C=1$, a resposta é superamortecida. As raízes são $-2\pm\sqrt3$; a tensão em $1\,\text{s}$ é cerca de $1,07\,\text{V}$.`, { set: { r: 4 } }),
  circuitEx(t`Ajuste $C$ para que a tensão do capacitor após $1\,\text{s}$ seja aproximadamente $0,82\,\text{V}$, partindo descarregado.`,
    { comps: rlc(), mode: 'adjust', scope: { ids: ['c'], of: 'v', window: 4 }, timeScale: 0.25 }, v => near(v.at('c', 1, 'v'), 0.822, 0.03), t`$C=2\,\text{F}$`,
    t`Com $R=2\,\Omega$, $L=1\,\text{H}$ e $C=2\,\text{F}$, as raízes são $-1\pm1/\sqrt2$; a resposta ao degrau fornece aproximadamente $0,82\,\text{V}$ em $1\,\text{s}$.`, { set: { c: 2 } }),
];

const rele = (r = 6, fechado = true) => circuit(
  V('fonte', [0, 0], [0, 4], 6, { fixed: true, locked: true }),
  SW('s', [0, 0], [2, 0], fechado, { locked: true }),
  R('r', [2, 0], [4, 0], r, { values: [3, 6, 12], locked: true }),
  L('l', [4, 0], [6, 0], 1, { fixed: true, locked: true }),
  wires([6, 0], [6, 4], [2, 4], [0, 4]),
  D('d', [2, 4], [2, 0], { fixed: true, locked: true }),
);
const releLab = () => circuitVisual({ comps: rele(), mode: 'adjust' });
const praticaRele = (): Exercise[] => [
  num(t`Com a chave fechada, meça a corrente da bobina em regime DC no simulador. Responda em A, com uma casa decimal.`, 1,
    t`O diodo está reverso e a corrente é aproximadamente $6/6=1\,\text{A}$.`, { unit: 'A', tol: 0.05, visual: releLab() }),
  circuitEx(t`Com a chave fechada, ajuste a resistência da bobina para obter $0,5\,\text{A}$ em regime DC.`,
    { comps: rele(), mode: 'adjust' }, v => near(v.i('l'), 0.5, 0.01), t`$R=12\,\Omega$`,
    t`O diodo está reverso; $R=V/I=6/0,5=12\,\Omega$.`, { set: { r: 12 } }),
  circuitEx(t`Feche a chave para energizar a bobina com aproximadamente $1\,\text{A}$ em regime DC.`,
    { comps: rele(6, false), mode: 'adjust' }, v => near(v.i('l'), 1, 0.02), t`Feche a chave.`,
    t`A chave fechada aplica $6\,\text{V}$ à bobina e sua resistência de $6\,\Omega$: $I=1\,\text{A}$ em regime.`, { on: { s: true } }),
];

export const indutores: UnitDef = {
  id: 'el-ind', title: 'Indutores e transitórios', icon: '🌀',
  subtitle: 'Bobinas, resposta RL, oscilações e proteção',
  source: 'Conteúdo complementar · Halliday, Resnick e Walker; Boylestad, Introdução à Análise de Circuitos',
  extra: true,
  guide: t`Na convenção passiva, $v_L=L\,di/dt$ e $W_L=Li^2/2$. A corrente de um indutor ideal não muda instantaneamente quando a tensão é finita. Em um RL série com resistência equivalente $R>0$, $\tau=L/R$ e $i(t)=i(\infty)+[i(0^+)-i(\infty)]e^{-t/\tau}$. Para um LC ideal, $\omega_0=1/\sqrt{LC}$ e $f_0=1/(2\pi\sqrt{LC})$. Um diodo de roda livre oferece caminho à corrente de uma bobina desligada.`,
  lessons: [
    { id: 'el-ind-def', title: 'Indutância', parts: [
      { card: { title: 'Corrente e campo magnético', body: t`Uma bobina cria campo magnético quando conduz corrente. Na convenção passiva, com corrente entrando no terminal positivo, $v_L=L\,di/dt$. A indutância $L$ é medida em henry (H). Com tensão finita, a corrente não dá saltos: o indutor se opõe à **variação** de corrente, não à corrente em si. Explore o circuito e altere $L$ e $R$.`, visual: lab() }, exercises: [
        mcq('Qual é a unidade de indutância?', ['henry', 'farad', 'ohm', 'watt'], 0, 'A indutância é medida em henry, símbolo H.'),
        tf('Um indutor ideal impede toda corrente contínua para sempre.', false, 'Em regime permanente DC, a corrente é constante e a tensão no indutor ideal é zero.'),
        num(t`Uma bobina de $2\,\text{H}$ tem $di/dt=3\,\text{A/s}$. Qual a tensão em V? Responda com uma casa decimal.`, 6, t`$v=L\,di/dt=2\cdot3=6\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        gen(rng => { const l = randInt(rng, 2, 6); const s = randInt(rng, 2, 5); return num(t`Para $L=${l}\,\text{H}$ e $di/dt=${s}\,\text{A/s}$, calcule $v_L$ em V, com uma casa decimal.`, l*s, t`$v_L=${l}\cdot${s}=${l*s}\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
        mcq('Sob tensão finita, o que é contínuo ao chavear um indutor ideal?', ['a corrente', 'a tensão', 'a potência', 'a resistência'], 0, 'Uma mudança instantânea de corrente exigiria tensão impulsiva na relação v = L di/dt.'),
        ...pratica(),
      ] },
      { card: { title: 'Energia e dualidade', body: t`O indutor ideal armazena energia no campo magnético: $W_L=Li^2/2$. O capacitor armazena energia elétrica $W_C=Cv^2/2$. O par dual é corrente contínua no indutor e tensão contínua no capacitor, desde que as grandezas conjugadas permaneçam finitas. Em regime DC ideal o indutor é curto; o capacitor é aberto.`, visual: lab() }, exercises: [
        mcq('Onde a bobina armazena energia?', ['no campo magnético', 'no campo gravitacional', 'na resistência ideal', 'na carga de um capacitor'], 0, 'A energia associada à indutância está no campo magnético.'),
        tf('Dobrar a corrente de um indutor quadruplica sua energia.', true, 'Como W = Li²/2, o fator é 2² = 4.'),
        num(t`Uma bobina de $2\,\text{H}$ conduz $3\,\text{A}$. Calcule sua energia em J, com uma casa decimal.`, 9, t`$W=2\cdot3^2/2=9\,\text{J}$.`, { unit: 'J', tol: 0.05 }),
        gen(rng => { const i = randInt(rng, 2, 6); return num(t`Para $L=2\,\text{H}$ e $i=${i}\,\text{A}$, calcule a energia em J, com uma casa decimal.`, i*i, t`$W=2\cdot${i}^2/2=${i*i}\,\text{J}$.`, { unit: 'J', tol: 0.05 }); }),
        mcq('Qual par representa os elementos ideais em regime DC?', ['indutor em curto; capacitor aberto', 'indutor aberto; capacitor em curto', 'ambos abertos', 'ambos em curto'], 0, 'Corrente constante implica tensão nula no indutor; tensão constante implica corrente nula no capacitor.'),
        ...pratica(),
      ] },
    ] },
    { id: 'el-ind-rl', title: 'Circuito RL', parts: [
      { card: { title: 'Ligação de uma fonte DC', body: t`Ao ligar uma fonte $V$ a $R$ e $L$ em série, com corrente inicial zero, $i(t)=\frac VR(1-e^{-t/\tau})$, com $\tau=L/R$. Em $t=\tau$, a corrente atinge aproximadamente $63,2\%$ do valor final $V/R$. A simulação parte de corrente inicial nula.`, visual: lab() }, exercises: [
        mcq(t`Qual é a constante de tempo de um RL série?`, [t`$L/R$`, t`$R/L$`, t`$LR$`, t`$1/(LR)$`], 0, t`A solução exponencial de $L\,di/dt+Ri=V$ tem $\tau=L/R$.`),
        tf('Na energização com corrente inicial zero, a corrente começa em zero.', true, 'A corrente da bobina é contínua no instante da comutação.'),
        num(t`Para $L=2\,\text{H}$ e $R=4\,\Omega$, calcule $\tau$ em s, com duas casas decimais.`, 0.5, t`$\tau=2/4=0,5\,\text{s}$.`, { unit: 's', tol: 0.005 }),
        gen(rng => { const r = randInt(rng, 2, 6); return num(t`Um RL tem $L=${r}\,\text{H}$ e $R=${r}\,\Omega$. Calcule $\tau$ em s, com uma casa decimal.`, 1, t`$\tau=${r}/${r}=1\,\text{s}$.`, { unit: 's', tol: 0.05 }); }),
        num(t`A corrente final é $2\,\text{A}$. Partindo de zero, calcule a corrente após uma constante de tempo em A, com duas casas decimais.`, 1.26, t`$i(\tau)=2(1-e^{-1})\approx1,26\,\text{A}$.`, { unit: 'A', tol: 0.005 }),
        ...pratica(),
      ] },
      { card: { title: 'Resposta natural', body: t`Com fonte removida e um caminho resistivo fechado, a corrente decai: $i(t)=I_0e^{-t/\tau}$, onde $\tau=L/R$. A energia magnética vira calor na resistência. A expressão geral, inclusive para corrente inicial não nula, é $i(t)=I_\infty+(I_0-I_\infty)e^{-t/\tau}$.`, visual: lab() }, exercises: [
        mcq('O que acontece com a corrente numa descarga RL resistiva?', ['decai exponencialmente', 'cresce sem limite', 'salta a zero', 'permanece constante'], 0, 'A tensão autoinduzida mantém a corrente no mesmo sentido enquanto ela decai.'),
        tf('Após uma constante de tempo de descarga, resta aproximadamente 36,8% da corrente inicial.', true, 'A fração é e⁻¹ ≈ 0,368.'),
        num(t`Uma corrente inicial de $2\,\text{A}$ decai com $\tau=1\,\text{s}$. Calcule $i(1\,\text{s})$ em A, com duas casas decimais.`, 0.74, t`$i=2e^{-1}\approx0,74\,\text{A}$.`, { unit: 'A', tol: 0.005 }),
        gen(rng => { const r = randInt(rng, 2, 6); return num(t`No caminho de descarga, $L=${2*r}\,\text{H}$ e $R=${r}\,\Omega$. Calcule $\tau$ em s, com uma casa decimal.`, 2, t`$\tau=${2*r}/${r}=2\,\text{s}$.`, { unit: 's', tol: 0.05 }); }),
        mcq('Para a corrente decair conforme o modelo RL, o circuito precisa de quê?', ['um caminho fechado de descarga', 'um circuito aberto ideal', 'uma fonte infinita', 'uma resistência negativa'], 0, 'A corrente precisa de um caminho fechado para circular enquanto a energia é dissipada.'),
        ...pratica(),
      ] },
    ] },
    { id: 'el-ind-rlc', title: 'Circuito RLC e oscilações', parts: [
      { card: { title: 'Troca de energia em LC', body: t`Em um LC ideal, energia oscila entre o campo elétrico do capacitor e o campo magnético do indutor. A frequência natural angular é $\omega_0=1/\sqrt{LC}$ e $f_0=\omega_0/(2\pi)$. A resistência real dissipa energia; o circuito mostrado permite explorar a bobina e sua perda resistiva antes de acrescentar um capacitor.`, visual: rlcLab() }, exercises: [
        mcq('No LC ideal, a energia alterna entre quais elementos?', ['campo elétrico do capacitor e campo magnético do indutor', 'dois resistores', 'fonte e resistência', 'dois diodos'], 0, 'O capacitor armazena energia elétrica e o indutor, magnética.'),
        tf('Um LC ideal sem resistência dissipa energia a cada ciclo.', false, 'No modelo ideal a energia total é conservada.'),
        num(t`Para $L=1\,\text{H}$ e $C=1\,\text{F}$, calcule $\omega_0$ em rad/s, com uma casa decimal.`, 1, t`$\omega_0=1/\sqrt{1\cdot1}=1\,\text{rad/s}$.`, { unit: 'rad/s', tol: 0.05 }),
        gen(rng => { const n = randInt(rng, 2, 5); return num(t`Para $L=${n*n}\,\text{H}$ e $C=1\,\text{F}$, calcule o período ideal em unidades de $\pi$ s: digite o coeficiente de $\pi$, com uma casa decimal.`, 2*n, t`$T=2\pi\sqrt{LC}=${2*n}\pi\,\text{s}$.`, { tol: 0.05 }); }),
        mcq('Se L quadruplica e C permanece constante, a frequência natural ideal…', ['cai à metade', 'dobra', 'quadruplica', 'não muda'], 0, 'Como f₀ é inversamente proporcional à raiz de L, multiplicar L por 4 divide f₀ por 2.'),
        ...praticaRlc(),
      ] },
      { card: { title: 'Amortecimento no RLC série', body: t`Na resposta natural do RLC série, $\alpha=R/(2L)$ e $\omega_0=1/\sqrt{LC}$. Se $\alpha<\omega_0$, a resposta é oscilatória amortecida; se $\alpha=\omega_0$, crítica; se $\alpha>\omega_0$, superamortecida. Resistores dissipam energia, reduzindo as oscilações.`, visual: rlcLab() }, exercises: [
        mcq('Qual elemento dissipa energia no RLC idealizado com resistor?', ['resistor', 'indutor ideal', 'capacitor ideal', 'fio ideal'], 0, 'A potência dissipada no resistor é Ri².'),
        tf('Uma resposta subamortecida pode oscilar enquanto sua amplitude diminui.', true, 'No caso subamortecido, uma envoltória exponencial reduz a amplitude.'),
        num(t`Em um RLC série, $R=4\,\Omega$ e $L=2\,\text{H}$. Calcule $\alpha=R/(2L)$ em s⁻¹, com uma casa decimal.`, 1, t`$\alpha=4/(2\cdot2)=1\,\text{s}^{-1}$.`, { unit: 's⁻¹', tol: 0.05 }),
        gen(rng => { const l = randInt(rng, 1, 5); return num(t`Um RLC série tem $L=${l}\,\text{H}$ e $R=${4*l}\,\Omega$. Calcule $\alpha$ em s⁻¹, com uma casa decimal.`, 2, t`$\alpha=${4*l}/(2\cdot${l})=2\,\text{s}^{-1}$.`, { unit: 's⁻¹', tol: 0.05 }); }),
        mcq(t`Se $\alpha=1\,\text{s}^{-1}$ e $\omega_0=3\,\text{rad/s}$, a resposta natural é…`, ['subamortecida', 'criticamente amortecida', 'superamortecida', 'uma corrente constante'], 0, t`Como $\alpha<\omega_0$, as raízes são complexas e ocorre oscilação amortecida.`),
        ...praticaRlc(),
      ] },
    ] },
    { id: 'el-ind-rele', title: 'Relés e cargas indutivas', parts: [
      { card: { title: 'Bobina de um relé', body: t`A bobina de um relé cria campo magnético que move contatos. Sua resistência limita a corrente DC; a indutância atrasa o crescimento da corrente. Ao abrir o comando, a corrente precisa de um caminho: sem proteção, pode surgir uma sobretensão que danifica a chave. No circuito, $R$ representa a resistência da bobina.`, visual: releLab() }, exercises: [
        mcq('O que a bobina energizada de um relé produz para mover os contatos?', ['campo magnético', 'luz obrigatoriamente', 'campo gravitacional variável', 'onda sonora obrigatória'], 0, 'A corrente na bobina gera campo magnético que atua no mecanismo.'),
        tf('Uma bobina real tem resistência que pode dissipar potência.', true, 'O enrolamento tem resistência e aquece por efeito Joule.'),
        num(t`Uma bobina de $12\,\Omega$ recebe $6\,\text{V}$ DC em regime. Calcule a corrente em A, com uma casa decimal.`, 0.5, t`$I=V/R=6/12=0,5\,\text{A}$.`, { unit: 'A', tol: 0.05 }),
        gen(rng => { const r = randInt(rng, 2, 6); return num(t`Uma bobina de resistência $${r}\,\Omega$ recebe $${2*r}\,\text{V}$ DC em regime. Calcule a corrente em A, com uma casa decimal.`, 2, t`$I=${2*r}/${r}=2\,\text{A}$.`, { unit: 'A', tol: 0.05 }); }),
        mcq('Ao abrir abruptamente uma chave sem proteção numa carga indutiva, qual risco aparece?', ['sobretensão na chave', 'a indutância desaparece', 'a energia torna-se negativa', 'a resistência vira capacitor'], 0, 'A bobina tenta manter a corrente; sem caminho adequado, a tensão pode subir até provocar arco ou ruptura.'),
        ...praticaRele(),
      ] },
      { card: { title: 'Diodo de roda livre', body: t`Em uma bobina DC, ligue o diodo em paralelo com a bobina: **cátodo no lado positivo** e ânodo no lado da chave. Enquanto ligada, a fonte polariza o diodo reversamente. Ao desligar, a polaridade da bobina se inverte e a corrente circula pela malha bobina–diodo, dissipando energia. A queda de silício é aproximadamente $0,7\,\text{V}$; a proteção reduz o pico, mas pode atrasar a liberação do relé.`, visual: releLab() }, exercises: [
        mcq('Durante a energização normal de uma bobina DC, o diodo de roda livre fica…', ['polarizado reversamente', 'em curto direto com a fonte', 'conduzindo a corrente total da fonte', 'sem conexão com a bobina'], 0, 'O cátodo no lado positivo deixa o diodo reversamente polarizado durante a alimentação.'),
        tf('Após o desligamento, o diodo oferece um caminho para a corrente da bobina.', true, 'A tensão da bobina se inverte e polariza diretamente o diodo, fechando a malha de descarga.'),
        num(t`Uma bobina de $2\,\text{H}$ conduz $2\,\text{A}$ antes de desligar. Calcule a energia inicial em J, com uma casa decimal.`, 4, t`$W=Li^2/2=2\cdot2^2/2=4\,\text{J}$.`, { unit: 'J', tol: 0.05 }),
        gen(rng => { const i = randInt(rng, 1, 5); return num(t`Uma bobina de $2\,\text{H}$ conduz $${i}\,\text{A}$ antes de desligar. Calcule a energia inicial em J, com uma casa decimal.`, i*i, t`$W=2\cdot${i}^2/2=${i*i}\,\text{J}$.`, { unit: 'J', tol: 0.05 }); }),
        mcq('Qual é uma consequência comum do diodo simples de roda livre?', ['menor pico de tensão e liberação mais lenta', 'pico maior e liberação instantânea', 'corrente cresce indefinidamente', 'a bobina não armazena energia'], 0, 'A baixa tensão de descarga limita o pico, mas faz a corrente diminuir mais lentamente que uma tensão de clamp maior.'),
        ...praticaRele(),
      ] },
    ] },
  ],
};
