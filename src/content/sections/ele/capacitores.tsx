import type { UnitDef } from '../../types';
import { gen, inter, mcq, near, num, tf } from '../../helpers';
import { fnLab } from '../../visuals';
import { circuit, circuitEx, circuitVisual, C, R, V, wires } from '../../circuits';
import { randInt } from '../../../lib/random';

const t = String.raw;
const chargeLab = () => fnLab({
  f: (x, p) => p.c * x,
  params: [{ key: 'c', label: 'C (µF)', min: 1, max: 5, step: 1, value: 1 }],
  view: { xMin: 0, xMax: 6, yMin: 0, yMax: 30 },
  info: (p) => t`$Q=C V$: inclinação $${p.c}\,\mu\text{F}$; eixo horizontal: V, vertical: µC.`,
});
const energyLab = () => fnLab({
  f: (x, p) => p.c * x * x / 2,
  params: [{ key: 'c', label: 'C (µF)', min: 1, max: 5, step: 1, value: 1 }],
  view: { xMin: 0, xMax: 6, yMin: 0, yMax: 90 },
  info: (p) => t`$E=CV^2/2$ para $C=${p.c}\,\mu\text{F}$; eixo vertical em µJ.`,
});
const labQuestion = (energy = false) => inter(
  energy ? t`No gráfico de energia, ajuste $C$ para que, em $2\,\text{V}$, a energia seja $6\,\mu\text{J}$.` : t`No gráfico de carga, ajuste $C$ para que, em $2\,\text{V}$, a carga seja $6\,\mu\text{C}$.`,
  'plot', (energy ? energyLab() : chargeLab()).props,
  (v) => near(v.p.c, 3, 0.01), t`$C=3\,\mu\text{F}$`,
  energy ? t`$6=C\cdot 2^2/2$, logo $C=3\,\mu\text{F}$.` : t`$6=C\cdot2$, logo $C=3\,\mu\text{F}$.`,
);
const rc = (r: number, cap: number, discharge = false) => circuit(
  V('fonte', [0, 0], [0, 3], discharge ? 0 : 5, { fixed: true, locked: true }),
  wires([0, 0], [1, 0]),
  R('r1', [1, 0], [4, 0], r, { label: 'R', locked: true, values: [5000, 10000, 20000] }),
  wires([4, 0], [5, 0]),
  C('c1', [5, 0], [5, 3], cap, { label: 'C', locked: true, values: [50e-6, 100e-6, 200e-6], ic: discharge ? 5 : 0 }),
  wires([5, 3], [0, 3]),
);
const spec = (r: number, c: number, discharge = false) => ({ comps: rc(r, c, discharge), mode: 'adjust' as const, scope: { ids: ['c1'], of: 'v' as const, window: 5 }, timeScale: 0.5 });

export const capacitores: UnitDef = {
  id: 'el-cap', title: 'Capacitores', icon: '🪫',
  subtitle: 'Carga, associações, energia e transitórios RC',
  source: 'Eletricidade Aplicada · Capacitor; Listas de Exercícios II e Final',
  guide: t`$Q=CV$ e $C=\varepsilon A/d$. Em paralelo, $C_T=\sum C_i$ e a tensão é comum; em série, $1/C_T=\sum 1/C_i$ e as cargas têm mesmo módulo. $E=CV^2/2$. Para RC, $\tau=RC$, $V_C(t)=V_f+(V_0-V_f)e^{-t/\tau}$.`,
  lessons: [
    { id: 'el-cap-def', title: 'Capacitância e carga', parts: [
      { card: { title: 'Carga por tensão', body: t`Um capacitor tem duas armaduras separadas por dielétrico. As cargas nas armaduras têm módulos iguais e sinais opostos. A capacitância relaciona o módulo da carga à tensão: $Q=CV$. Um farad é um coulomb por volt.`, visual: chargeLab(), example: t`$2\,\mu\text{F}$ a $3\,\text{V}$ armazenam $6\,\mu\text{C}$ em cada armadura (em módulo).` }, exercises: [
        tf(t`A capacitância é a razão entre o módulo da carga e a tensão.`, true, t`Pela definição, $C=Q/V$.`),
        mcq(t`Qual é a unidade de capacitância?`, ['farad', 'volt', 'ampere', 'joule'], 0, t`O farad equivale a coulomb por volt.`),
        num(t`Um capacitor de $3\,\mu\text{F}$ está a $4\,\text{V}$. Qual a carga em µC? Dê um inteiro.`, 12, t`$Q=CV=3\cdot4=12\,\mu\text{C}$.`, { unit: 'µC', tol: 0.5 }),
        num(t`Uma armadura tem $20\,\mu\text{C}$ com $5\,\text{V}$. Qual a capacitância em µF? Dê um inteiro.`, 4, t`$C=Q/V=20/5=4\,\mu\text{F}$.`, { unit: 'µF', tol: 0.5 }),
        labQuestion(),
        tf(t`Um capacitor ideal de capacitância fixa dobra sua carga em módulo quando a tensão dobra.`, true, t`Com $C$ constante, $Q=CV$ é proporcional a $V$.`),
        gen((rng) => { const c = randInt(rng, 2, 8); const v = randInt(rng, 2, 9); return num(t`Um capacitor de $${c}\,\mu\text{F}$ recebe $${v}\,\text{V}$. Calcule a carga em µC, como inteiro.`, c*v, t`$Q=CV=${c}\cdot${v}=${c*v}\,\mu\text{C}$.`, { unit: 'µC', tol: 0.5 }); }),
      ] },
      { card: { title: 'Geometria e dielétrico', body: t`Para placas paralelas ideais, $C=\varepsilon A/d$: aumentar a área $A$ ou a permissividade $\varepsilon$ aumenta $C$; aumentar a separação $d$ diminui $C$. Respeite a tensão nominal do componente e a polaridade dos eletrolíticos.`, visual: chargeLab() }, exercises: [
        tf(t`Com geometria e material fixos, a capacitância ideal não depende da carga aplicada.`, true, t`A relação $C=\varepsilon A/d$ depende da geometria e do dielétrico.`),
        mcq(t`Se a área dobra, com $d$ e $\varepsilon$ fixos, a capacitância…`, ['dobra', 'cai à metade', 'quadruplica', 'não muda'], 0, t`$C$ é proporcional a $A$.`),
        mcq(t`Se a distância entre placas dobra, mantendo o resto fixo, a capacitância…`, ['cai à metade', 'dobra', 'quadruplica', 'não muda'], 0, t`$C$ é inversamente proporcional a $d$.`),
        num(t`Converta $4\,\mu\text{F}$ em nF. Responda com inteiro.`, 4000, t`$1\,\mu\text{F}=1000\,\text{nF}$; portanto são $4000\,\text{nF}$.`, { unit: 'nF', tol: 0.5 }),
        tf(t`É aceitável aplicar continuamente $30\,\text{V}$ a um capacitor nominal de $16\,\text{V}$.`, false, t`A tensão aplicada excede a nominal e pode danificar o dielétrico.`),
        num(t`Uma capacitância inicial de $6\,\text{nF}$ tem a área triplicada e a distância dobrada. Qual o novo valor em nF? Dê um inteiro.`, 9, t`$C'=6\cdot3/2=9\,\text{nF}$.`, { unit: 'nF', tol: 0.5 }),
        gen((rng) => { const c = randInt(rng, 2, 8); return num(t`Um capacitor de placas vale $${c}\,\text{nF}$. Se a área dobra sem mudar o restante, qual o valor em nF? Dê um inteiro.`, 2*c, t`Como $C\propto A$, o novo valor é $2\cdot${c}=${2*c}\,\text{nF}$.`, { unit: 'nF', tol: 0.5 }); }),
      ] },
    ] },
    { id: 'el-cap-assoc', title: 'Associação de capacitores', parts: [
      { card: { title: 'Paralelo', body: t`Em paralelo, os capacitores compartilham os mesmos dois nós e a mesma tensão. As cargas se somam: $C_T=C_1+C_2+\cdots$ e $Q_T=C_TV$.`, visual: chargeLab(), example: t`$2\,\mu\text{F}$ em paralelo com $3\,\mu\text{F}$ resultam em $5\,\mu\text{F}$.` }, exercises: [
        tf(t`Capacitores em paralelo estão sujeitos à mesma tensão.`, true, t`Ambos estão ligados aos mesmos dois nós.`),
        num(t`Em paralelo, $2\,\mu\text{F}$ e $3\,\mu\text{F}$ equivalem a quantos µF? Dê um inteiro.`, 5, t`$C_T=2+3=5\,\mu\text{F}$.`, { unit: 'µF', tol: 0.5 }),
        num(t`O conjunto anterior recebe $10\,\text{V}$. Qual a carga total em µC? Dê um inteiro.`, 50, t`$Q_T=C_TV=5\cdot10=50\,\mu\text{C}$.`, { unit: 'µC', tol: 0.5 }),
        num(t`Em paralelo com uma fonte de $12\,\text{V}$, quanto vale a tensão em um dos capacitores, em V? Dê um inteiro.`, 12, t`Em paralelo cada capacitor recebe a tensão da fonte: $12\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
        labQuestion(),
        num(t`Em paralelo sob $10\,\text{V}$, um capacitor de $2\,\mu\text{F}$ e outro de $3\,\mu\text{F}$ guardam cargas de módulos diferentes. Qual a carga do maior em µC? Dê um inteiro.`, 30, t`$Q_2=C_2V=3\cdot10=30\,\mu\text{C}$.`, { unit: 'µC', tol: 0.5 }),
        gen((rng) => { const a = randInt(rng, 2, 8); const b = randInt(rng, 2, 8); return num(t`Em paralelo estão $${a}\,\mu\text{F}$ e $${b}\,\mu\text{F}$. Determine $C_T$ em µF como inteiro.`, a+b, t`$C_T=${a}+${b}=${a+b}\,\mu\text{F}$.`, { unit: 'µF', tol: 0.5 }); }),
      ] },
      { card: { title: 'Série e associação mista', body: t`Em série, com nós intermediários inicialmente neutros, todos os capacitores têm cargas de mesmo módulo e as tensões se somam. Use $1/C_T=1/C_1+1/C_2+\cdots$. Numa rede mista, reduza primeiro cada grupo identificável.`, example: t`$10\,\mu\text{F}$ em série com o paralelo de $10\,\mu\text{F}$ e $5\,\mu\text{F}$: $C_T=10\cdot15/(10+15)=6\,\mu\text{F}$.` }, exercises: [
        tf(t`Em série, com nós intermediários inicialmente neutros, os módulos das cargas são iguais.`, true, t`A conservação de carga nos nós intermediários impõe módulos iguais.`),
        num(t`Dois capacitores de $6\,\mu\text{F}$ em série equivalem a quantos µF? Dê um inteiro.`, 3, t`$C_T=6/2=3\,\mu\text{F}$.`, { unit: 'µF', tol: 0.5 }),
        num(t`Capacitores de $3\,\mu\text{F}$ e $6\,\mu\text{F}$ em série equivalem a quantos µF? Dê um inteiro.`, 2, t`$C_T=3\cdot6/(3+6)=2\,\mu\text{F}$.`, { unit: 'µF', tol: 0.5 }),
        num(t`A associação anterior recebe $12\,\text{V}$. Calcule a carga em cada capacitor, em µC, como inteiro.`, 24, t`$Q=C_TV=2\cdot12=24\,\mu\text{C}$ em cada um.`, { unit: 'µC', tol: 0.5 }),
        num(t`Na mesma associação, qual a tensão no capacitor de $3\,\mu\text{F}$ em V? Dê um inteiro.`, 8, t`$V_1=Q/C_1=24/3=8\,\text{V}$; no outro são $4\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
        num(t`Um capacitor de $10\,\mu\text{F}$ está em série com o paralelo de $10\,\mu\text{F}$ e $5\,\mu\text{F}$, sob $100\,\text{V}$. Qual a carga total em µC? Dê um inteiro.`, 600, t`O paralelo vale $15\,\mu\text{F}$ e a série $6\,\mu\text{F}$; $Q_T=6\cdot100=600\,\mu\text{C}$.`, { unit: 'µC', tol: 0.5 }),
        gen((rng) => { const c = randInt(rng, 2, 9)*2; return num(t`Dois capacitores iguais de $${c}\,\mu\text{F}$ estão em série. Qual $C_T$ em µF? Dê um inteiro.`, c/2, t`Dois iguais em série dão $C_T=${c}/2=${c/2}\,\mu\text{F}$.`, { unit: 'µF', tol: 0.5 }); }),
      ] },
    ] },
    { id: 'el-cap-energia', title: 'Energia armazenada', parts: [
      { card: { title: 'Energia no campo', body: t`A energia fica armazenada no campo elétrico: $E=CV^2/2=QV/2=Q^2/(2C)$. Use unidades SI para obter joules. Com µF e V, o resultado numérico sai em µJ.`, visual: energyLab() }, exercises: [
        tf(t`Um capacitor carregado armazena energia no campo elétrico.`, true, t`O trabalho para separar as cargas fica armazenado no campo entre as armaduras.`),
        mcq(t`Qual expressão dá a energia de um capacitor ideal?`, ['$CV^2/2$', '$CV$', '$C/V$', '$V/C$'], 0, t`A tensão cresce de zero até $V$ durante a carga; a energia é $CV^2/2$.`),
        num(t`Um capacitor de $2\,\mu\text{F}$ está a $4\,\text{V}$. Qual a energia em µJ? Dê um inteiro.`, 16, t`$E=2\cdot4^2/2=16\,\mu\text{J}$.`, { unit: 'µJ', tol: 0.5 }),
        labQuestion(true),
        tf(t`Com capacitância fixa, dobrar a tensão quadruplica a energia.`, true, t`Como $E=CV^2/2$, o fator é $2^2=4$.`),
        num(t`Uma carga de $10\,\mu\text{C}$ está a $6\,\text{V}$. Determine a energia em µJ como inteiro.`, 30, t`$E=QV/2=10\cdot6/2=30\,\mu\text{J}$.`, { unit: 'µJ', tol: 0.5 }),
        gen((rng) => { const c = randInt(rng, 1, 8); return num(t`Um capacitor de $${c}\,\mu\text{F}$ está a $2\,\text{V}$. Calcule a energia em µJ como inteiro.`, 2*c, t`$E=CV^2/2=${c}\cdot4/2=${2*c}\,\mu\text{J}$.`, { unit: 'µJ', tol: 0.5 }); }),
      ] },
      { card: { title: 'Comparando condições', body: t`É essencial saber o que permanece fixo. A tensão fixada por uma fonte dá $E\propto C$; para carga fixa, $E\propto1/C$. Um capacitor carregado pode manter tensão após desligar a fonte.`, visual: energyLab() }, exercises: [
        tf(t`Com tensão fixa, dobrar a capacitância dobra a energia armazenada.`, true, t`Pela fórmula $E=CV^2/2$, com $V$ fixa a energia é proporcional a $C$.`),
        tf(t`Com carga fixa, dobrar a capacitância dobra a energia.`, false, t`Com $Q$ fixa, $E=Q^2/(2C)$ cai à metade.`),
        num(t`Converta $3\,\text{mJ}$ em µJ. Responda com inteiro.`, 3000, t`$1\,\text{mJ}=1000\,\mu\text{J}$, então são $3000\,\mu\text{J}$.`, { unit: 'µJ', tol: 0.5 }),
        num(t`Se a energia inicial é $5\,\mu\text{J}$ e a tensão triplica com $C$ fixa, qual a energia final em µJ? Dê um inteiro.`, 45, t`A energia multiplica por $3^2$: $5\cdot9=45\,\mu\text{J}$.`, { unit: 'µJ', tol: 0.5 }),
        mcq(t`Ao desligar a fonte, o que pode permanecer no capacitor?`, ['Carga e tensão', 'Apenas corrente contínua permanente', 'Somente resistência', 'Nenhuma carga obrigatoriamente'], 0, t`Se não houver caminho de descarga, a carga e a tensão podem permanecer.`),
        num(t`Com $Q=12\,\mu\text{C}$ e $C=3\,\mu\text{F}$, calcule $E$ em µJ como inteiro.`, 24, t`$E=Q^2/(2C)=12^2/(2\cdot3)=24\,\mu\text{J}$.`, { unit: 'µJ', tol: 0.5 }),
        gen((rng) => { const e = randInt(rng, 2, 9); return num(t`A energia é $${e}\,\mu\text{J}$ com certa tensão. Se ela dobra e $C$ é fixa, quanto vale a energia em µJ? Dê um inteiro.`, 4*e, t`$E\propto V^2$: $${e}\cdot4=${4*e}\,\mu\text{J}$.`, { unit: 'µJ', tol: 0.5 }); }),
      ] },
    ] },
    { id: 'el-cap-rc', title: 'Carga e descarga no circuito RC', parts: [
      { card: { title: 'Carga e constante de tempo', body: t`Com capacitor inicialmente descarregado, fonte constante e resistor em série, $V_C(t)=V_f(1-e^{-t/RC})$. A constante $\tau=RC$ mede a rapidez: em $t=\tau$, a tensão atinge cerca de 63,2% do valor final. No osciloscópio, reinicie para observar a curva.`, visual: circuitVisual(spec(10000, 100e-6)) }, exercises: [
        tf(t`A constante de tempo de um circuito RC é $RC$.`, true, t`O produto de resistência em ohms por capacitância em farads tem unidade de segundos.`),
        num(t`Para $R=10\,\text{k}\Omega$ e $C=100\,\mu\text{F}$, calcule $\tau$ em s como inteiro.`, 1, t`$\tau=10^4\cdot100\cdot10^{-6}=1\,\text{s}$.`, { unit: 's', tol: 0.5 }),
        num(t`No simulador, reinicie e observe a tensão final no capacitor, em V, com uma casa decimal.`, 5, t`Em regime permanente ideal, a corrente é zero e a tensão no capacitor tende aos $5\,\text{V}$ da fonte.`, { unit: 'V', tol: 0.1, visual: circuitVisual(spec(10000, 100e-6)) }),
        circuitEx(t`Ajuste o resistor para que, após $1\,\text{s}$ desde o reinício, a tensão no capacitor seja aproximadamente $3,16\,\text{V}$.`, spec(5000, 100e-6), (v) => near(v.at('c1', 1), 3.16, 0.08), t`$R=10\,\text{k}\Omega$`, t`$3,16/5\approx0,632$, então $1\,\text{s}=RC$ e $R=1/(100\,\mu\text{F})=10\,\text{k}\Omega$.`, { set: { r1: 10000 } }),
        circuitEx(t`Ajuste o capacitor para obter cerca de $3,16\,\text{V}$ após $1\,\text{s}$ desde o reinício.`, spec(10000, 50e-6), (v) => near(v.at('c1', 1), 3.16, 0.08), t`$C=100\,\mu\text{F}$`, t`A tensão pedida é $63,2\%$ de $5\,\text{V}$; portanto $RC=1\,\text{s}$ e $C=100\,\mu\text{F}$.`, { set: { c1: 100e-6 } }),
        mcq(t`Depois de aproximadamente cinco constantes de tempo, a tensão de carga está…`, ['próxima do valor final', 'exatamente em zero', 'em metade do valor final', 'aumentando linearmente sem limite'], 0, t`$1-e^{-5}\approx0,993$: o capacitor está próximo da tensão final.`),
        gen((rng) => { const r = randInt(rng, 1, 8); return num(t`Um RC tem $R=${r}\,\text{k}\Omega$ e $C=1000\,\mu\text{F}$. Calcule $\tau$ em s como inteiro.`, r, t`$\tau=${r}\cdot10^3\cdot1000\cdot10^{-6}=${r}\,\text{s}$.`, { unit: 's', tol: 0.5 }); }),
      ] },
      { card: { title: 'Descarga', body: t`Ao descarregar um capacitor inicialmente a $V_0$ por um resistor, $V_C(t)=V_0e^{-t/RC}$. Após uma constante de tempo restam cerca de 36,8% da tensão inicial; a corrente diminui em módulo. No circuito, a fonte de $0\,\text{V}$ representa o caminho fechado de retorno.`, visual: circuitVisual(spec(10000, 100e-6, true)) }, exercises: [
        tf(t`Após uma constante de tempo de descarga, resta cerca de 36,8% da tensão inicial.`, true, t`Em $t=RC$, $V_C/V_0=e^{-1}\approx0,368$.`),
        num(t`Uma descarga começa em $10\,\text{V}$. Qual a tensão após uma constante de tempo, em V, com uma casa decimal?`, 3.7, t`$V=10e^{-1}\approx3,7\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        num(t`Reinicie o simulador e leia no osciloscópio a tensão inicial do capacitor em V, com uma casa decimal.`, 5, t`A condição inicial ajustada é $V_C(0)=5\,\text{V}$.`, { unit: 'V', tol: 0.1, visual: circuitVisual(spec(10000, 100e-6, true)) }),
        circuitEx(t`Ajuste o resistor para restarem cerca de $1,84\,\text{V}$ após $1\,\text{s}$ de descarga desde o reinício.`, spec(5000, 100e-6, true), (v) => near(v.at('c1', 1), 1.84, 0.08), t`$R=10\,\text{k}\Omega$`, t`$1,84/5\approx e^{-1}$, logo $RC=1\,\text{s}$ e $R=10\,\text{k}\Omega$.`, { set: { r1: 10000 } }),
        circuitEx(t`Ajuste o capacitor para restarem cerca de $1,84\,\text{V}$ após $1\,\text{s}$ de descarga desde o reinício.`, spec(10000, 50e-6, true), (v) => near(v.at('c1', 1), 1.84, 0.08), t`$C=100\,\mu\text{F}$`, t`O valor pedido corresponde a $t=RC=1\,\text{s}$; com $10\,\text{k}\Omega$, $C=100\,\mu\text{F}$.`, { set: { c1: 100e-6 } }),
        mcq(t`Se $R$ dobra e $C$ permanece igual, a descarga ideal fica…`, [t`mais lenta, com o dobro de $\tau$`, t`mais rápida, com metade de $\tau$`, 'igual', 'instantânea'], 0, t`$\tau=RC$ dobra; a mesma fração de tensão leva o dobro do tempo.`),
        gen((rng) => { const v = randInt(rng, 2, 9); return num(t`Um capacitor começa com $${v}\,\text{V}$. Quanto resta após uma constante de tempo, em V, com duas casas decimais?`, v/Math.E, t`$V=${v}e^{-1}\approx${(v/Math.E).toFixed(2).replace('.', ',')}\,\text{V}$.`, { unit: 'V', tol: 0.005 }); }),
      ] },
    ] },
  ],
};
