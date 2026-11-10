import type { UnitDef } from '../../types';
import { gen, inter, mcq, near, num, tf } from '../../helpers';
import { circuit, circuitEx, circuitVisual, C, D, GND, R, VAC, wires } from '../../circuits';
import { fnLab } from '../../visuals';
import { randInt } from '../../../lib/random';

const t = String.raw;
const fixed = { fixed: true, locked: true };
type Topology = 'meia' | 'central' | 'ponte';

// As fontes representam diretamente os enrolamentos secundários, com valores de pico.
const rede = (tipo: Topology, pico = 10, cap = 0) => {
  const fonte = { locked: true, values: [6, 10, 14] };
  const carga = R('carga', [8, 1], [8, 5], 1000, fixed);
  const filtro = cap ? [C('filtro', [7, 1], [7, 5], cap, { locked: true, values: [100e-6, 470e-6, 1000e-6] })] : [];
  if (tipo === 'meia') return circuit(
    VAC('ac', [0, 1], [0, 5], pico, 60, fonte), D('d1', [0, 1], [4, 1], fixed),
    wires([4, 1], [7, 1], [8, 1]), carga, wires([8, 5], [7, 5], [0, 5]), filtro,
  );
  if (tipo === 'central') return circuit(
    VAC('ac', [0, 1], [0, 3], pico, 60, fonte), VAC('ac2', [0, 3], [0, 5], pico, 60, fixed),
    D('d1', [0, 1], [4, 1], fixed), D('d2', [0, 5], [4, 5], fixed),
    wires([4, 1], [6, 1], [7, 1], [8, 1]), wires([4, 5], [6, 5], [6, 1]),
    carga, wires([8, 5], [7, 5], [7, 3], [0, 3]), GND([0, 3]), filtro,
  );
  return circuit(
    VAC('ac', [0, 2], [0, 4], pico, 60, fonte), wires([0, 2], [2, 2]), wires([0, 4], [2, 4]),
    D('d1', [2, 2], [4, 1], fixed), D('d2', [2, 4], [4, 1], fixed),
    D('d3', [4, 5], [2, 2], fixed), D('d4', [4, 5], [2, 4], fixed),
    wires([4, 1], [7, 1], [8, 1]), carga, wires([8, 5], [7, 5], [4, 5]), GND([4, 5]), filtro,
  );
};
const spec = (tipo: Topology, pico = 10, cap = 0) => ({ comps: rede(tipo, pico, cap), mode: 'adjust' as const, scope: { ids: ['carga'], window: 0.05 }, timeScale: 0.03 });
const leitura = (tipo: Topology) => mcq(
  t`Observe o osciloscópio da carga. Qual descreve a tensão mostrada?`,
  tipo === 'meia' ? ['Pulsos positivos separados por semiciclos quase nulos', 'Senoide simétrica positiva e negativa', 'Tensão constante sem ondulação', 'Pulsos exclusivamente negativos'] : ['Pulsos positivos nos dois semiciclos', 'Senoide simétrica positiva e negativa', 'Tensão constante sem ondulação', 'Pulsos exclusivamente negativos'],
  0, tipo === 'meia' ? 'O diodo conduz em um semiciclo e bloqueia no outro; observe os trechos próximos de zero.' : 'Os dois caminhos alternados mantêm a mesma polaridade na carga.',
  { visual: circuitVisual(spec(tipo)) },
);
const ajuste = (tipo: Topology, pico: 10 | 14) => {
  const queda = tipo === 'ponte' ? 1.4 : 0.7;
  const alvo = pico - queda;
  return circuitEx(
    t`Ajuste o pico da fonte CA para obter aproximadamente $${String(alvo).replace('.', ',')}\,\text{V}$ de pico na carga. Veja o osciloscópio.`,
    spec(tipo, 6),
    (v) => near(v.wave('carga').max, alvo, 0.15),
    t`Pico do secundário: $${pico}\,\text{V}$.`,
    tipo === 'central' ? t`Ajuste a fonte superior para $${pico}\,\text{V}$; ela alimenta um dos semiciclos. Nesse pico, um diodo subtrai cerca de $0,7\,\text{V}$. A outra fonte mantém seu pico de $10\,\text{V}$.` : t`O pico na carga é aproximadamente $${pico}-${String(queda).replace('.', ',')}=${String(alvo).replace('.', ',')}\,\text{V}$.`,
    { set: { ac: pico } },
  );
};
const filtroEx = (tipo: Topology, alvo: 'baixo' | 'alto') => circuitEx(
  alvo === 'baixo' ? t`Aumente o capacitor para obter ondulação pico a pico menor que $0,2\,\text{V}$ na carga em regime. Observe o osciloscópio.` : t`Ajuste o capacitor para produzir ondulação entre $0,2$ e $1\,\text{V}$ pico a pico na carga em regime.`,
  spec(tipo, 10, alvo === 'baixo' ? 100e-6 : 1000e-6),
  (v) => { const w = v.wave('carga', { t: 0.3, from: 0.25 }); return alvo === 'baixo' ? w.pp < 0.2 && w.avg > 5 : w.pp > 0.2 && w.pp < 1 && w.avg > 5; },
  alvo === 'baixo' ? t`Use $1000\,\mu\text{F}$.` : t`Use $100\,\mu\text{F}$.`,
  t`O capacitor carrega perto dos picos e descarrega na carga entre eles. Maior capacitância reduz a queda entre recargas. A ondulação é medida após o transitório inicial.`,
  { set: { filtro: alvo === 'baixo' ? 1000e-6 : 100e-6 } },
);
const aleatorio = (fator: number, contexto: string) => gen((rng) => {
  const n = randInt(rng, 2, 9);
  return num(t`${contexto} $${n}\,\text{V}$. Calcule o resultado em V como inteiro.`, fator*n,
    t`Pela relação indicada, $${fator}\cdot${n}=${fator*n}\,\text{V}$.`, { unit: 'V', tol: 0.5 });
});
const laboratorio = () => fnLab({
  f: (x, p) => 1000*p.c / (120*x),
  params: [{ key: 'c', label: 'I (mA)', min: 10, max: 100, step: 10, value: 60 }],
  view: { xMin: 100, xMax: 1000, yMin: 0, yMax: 9 },
  info: () => t`Estimativa $\Delta V=I/(120C)$: eixo horizontal em µF e vertical em V.`,
});
const interFiltro = () => inter(t`No gráfico, ajuste a corrente para que, com $500\,\mu\text{F}$, a ondulação estimada seja $1\,\text{V}$.`, 'plot', laboratorio().props,
  (v) => near(v.p.c, 60, 0.1), t`$60\,\text{mA}$`, t`$I=\Delta V f C=1\cdot120\cdot500\times10^{-6}=0,06\,\text{A}$.`);

export const retificadores: UnitDef = {
  id: 'ea-ret', title: 'Retificadores e fontes', icon: '🔌',
  subtitle: 'Da tensão alternada à alimentação contínua',
  source: 'Eletrônica I · Aulas 5, 6 e 10',
  guide: t`Para uma senoide, $V_p=\sqrt2 V_{ef}$. Com diodos ideais e carga resistiva, $V_{médio}=V_p/\pi$ em meia onda e $2V_p/\pi$ em onda completa. A frequência dos pulsos é $f$ ou $2f$, respectivamente. Com filtro e ondulação pequena, $\Delta V_{pp}\approx I/(f_{ond}C)$. Um regulador exige tensão de entrada mínima e dissipa aproximadamente $(V_{in}-V_{out})I$.`,
  lessons: [
    { id: 'ea-ret-meia', title: 'Retificador de meia onda', parts: [
      { card: { title: 'Um semiciclo por vez', body: t`O diodo em série conduz no semiciclo positivo e bloqueia no negativo. O osciloscópio mostra a tensão na carga. A fonte de $60\,\text{Hz}$ representa o secundário já reduzido: seu valor é de pico, não eficaz. Com silício, o pico na carga é aproximadamente $V_p-0,7\,\text{V}$.`, visual: circuitVisual(spec('meia')) }, exercises: [
        tf('O diodo ideal conduz nos dois sentidos.', false, 'O diodo ideal conduz no sentido direto e bloqueia no reverso.'),
        leitura('meia'),
        num(t`Com pico de $10\,\text{V}$ no secundário e queda de $0,7\,\text{V}$, estime o pico na carga em V, com uma casa decimal.`, 9.3, t`$10-0,7=9,3\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        ajuste('meia', 10), ajuste('meia', 14),
        mcq('Qual a frequência dos pulsos de meia onda para entrada de 60 Hz?', ['60 Hz', '120 Hz', '30 Hz', '0 Hz'], 0, 'Há um pulso por período da entrada: 60 pulsos por segundo.'),
        gen((rng) => { const p = randInt(rng, 4, 15); return num(t`O secundário tem pico de $${p}\,\text{V}$. Com diodo ideal, qual o pico na carga em V? Dê inteiro.`, p, t`Sem queda no diodo ideal, o pico é $${p}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
      ] },
      { card: { title: 'Média e valor eficaz', body: t`Para uma senoide de pico $V_p$ e diodo ideal, a média na carga é $V_p/\pi$ e o valor eficaz é $V_p/2$. Essas fórmulas integram a forma de onda completa, inclusive o semiciclo nulo. Com queda real, são aproximações e não se deve substituir indiscriminadamente o pico.`, visual: circuitVisual(spec('meia')) }, exercises: [
        tf('A média de uma meia onda positiva ideal é positiva.', true, 'A área positiva dividida pelo período é positiva.'),
        leitura('meia'),
        num(t`Para meia onda ideal com pico $20\,\text{V}$, qual o valor eficaz em V? Dê inteiro.`, 10, t`$V_{ef}=V_p/2=20/2=10\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
        ajuste('meia', 10), ajuste('meia', 14),
        num(t`Com pico ideal $\pi\,\text{V}$, qual a tensão média em V? Dê inteiro.`, 1, t`$V_{médio}=V_p/\pi=1\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
        gen((rng) => { const n = randInt(rng, 2, 9); return num(t`Em meia onda ideal, o pico é $${2*n}\,\text{V}$. Qual o valor eficaz na carga em V? Dê inteiro.`, n, t`$V_{ef}=${2*n}/2=${n}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
      ] },
    ] },
    { id: 'ea-ret-completa', title: 'Onda completa com derivação central', parts: [
      { card: { title: 'Dois enrolamentos equivalentes', body: t`O ponto central é o retorno da carga. As duas fontes CA em série representam metades iguais do secundário; seus extremos ficam em oposição em relação ao centro. Cada diodo conduz em um semiciclo, sempre com corrente no mesmo sentido na carga.`, visual: circuitVisual(spec('central')) }, exercises: [
        tf('Os dois diodos conduzem alternadamente na retificação ideal com derivação central.', true, 'Cada extremo fica positivo em relação ao centro em um semiciclo.'),
        leitura('central'),
        num(t`Cada metade do secundário tem pico de $10\,\text{V}$. Desprezando diodos, qual o pico entre os extremos em V? Dê inteiro.`, 20, t`As tensões das metades em série somam: $10+10=20\,\text{V}$ de pico entre extremos.`, { unit: 'V', tol: 0.5 }),
        ajuste('central', 10), ajuste('central', 14),
        mcq('Com entrada de 60 Hz, qual a frequência dos pulsos na carga?', ['120 Hz', '60 Hz', '30 Hz', '240 Hz'], 0, 'Há dois pulsos por período: 2 × 60 = 120 Hz.'),
        aleatorio(2, 'Se as metades são iguais, o pico entre os extremos é o dobro do pico de cada metade. Este último vale'),
      ] },
      { card: { title: 'Picos e esforço dos diodos', body: t`Em cada semiciclo, há uma queda direta de aproximadamente $0,7\,\text{V}$. Para diodos ideais, a média da onda completa é $2V_p/\pi$, usando o pico de **uma metade** do secundário. No modelo ideal sem filtro, a tensão inversa de pico em cada diodo é $2V_p$.`, visual: circuitVisual(spec('central')) }, exercises: [
        tf('Na derivação central, a corrente atravessa um diodo em cada caminho de condução.', true, 'Um dos diodos liga a metade positiva à carga; o outro bloqueia.'),
        leitura('central'),
        num(t`Uma metade tem pico $10\,\text{V}$. Com queda direta de $0,7\,\text{V}$, estime o pico de saída em V com uma casa.`, 9.3, t`$10-0,7=9,3\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        ajuste('central', 10), ajuste('central', 14),
        num(t`Sem filtro e com diodos ideais, cada metade tem pico de $12\,\text{V}$. Qual a tensão inversa de pico em cada diodo, em V? Dê inteiro.`, 24, t`O catodo está em $+12\,\text{V}$ enquanto o anodo bloqueado está em $-12\,\text{V}$: a diferença é $24\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
        aleatorio(2, 'Sem filtro, a tensão inversa de pico ideal no diodo é o dobro do pico de uma metade. Este último vale'),
      ] },
    ] },
    { id: 'ea-ret-ponte', title: 'Retificador em ponte', parts: [
      { card: { title: 'Quatro diodos', body: t`Na ponte, dois diodos conduzem em série por semiciclo; o outro par conduz no semiciclo seguinte. A corrente mantém o sentido na carga sem precisar de derivação central. A fonte representa o secundário inteiro.`, visual: circuitVisual(spec('ponte')) }, exercises: [
        tf('Uma ponte monofásica usa quatro diodos.', true, 'Dois pares de diodos conduzem alternadamente.'),
        leitura('ponte'),
        num(t`O secundário tem pico $10\,\text{V}$. Com duas quedas de $0,7\,\text{V}$, estime o pico na carga em V com uma casa.`, 8.6, t`$10-2\cdot0,7=8,6\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        ajuste('ponte', 10), ajuste('ponte', 14),
        mcq('Quantos pulsos a ponte produz a cada ciclo da entrada?', ['2', '1', '4', '0'], 0, 'Os dois semiciclos produzem pulsos positivos na carga.'),
        gen((rng) => { const n = randInt(rng, 3, 12); return num(t`Uma ponte ideal recebe pico $${n}\,\text{V}$. Qual o pico na carga em V? Dê inteiro.`, n, t`Sem quedas, o pico permanece $${n}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
      ] },
      { card: { title: 'Dimensionando a ponte', body: t`Com diodos ideais e carga resistiva, $V_{médio}=2V_p/\pi$ e $V_{ef}=V_p/\sqrt2$. A tensão inversa de pico de cada diodo é aproximadamente o pico do secundário ideal. Para uma ponte real, considere duas quedas no caminho e margem nas especificações.`, visual: circuitVisual(spec('ponte')) }, exercises: [
        tf('Na ponte, os dois diodos em condução somam suas quedas de tensão.', true, 'Eles estão em série no caminho da corrente pela carga.'),
        leitura('ponte'),
        num(t`Uma ponte ideal recebe $V_p=\pi\,\text{V}$. Qual sua tensão média em V? Dê inteiro.`, 2, t`$V_{médio}=2\pi/\pi=2\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
        ajuste('ponte', 10), ajuste('ponte', 14),
        num(t`O secundário ideal tem pico $18\,\text{V}$. Qual a tensão inversa de pico ideal em um diodo da ponte, em V? Dê inteiro.`, 18, t`No modelo ideal, cada diodo bloqueado suporta até o pico do secundário, $18\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
        gen((rng) => { const n = randInt(rng, 2, 9); return num(t`A entrada de uma ponte ideal tem $${n}\,\text{V}$ eficazes. Qual o valor eficaz da onda retificada em V? Dê inteiro.`, n, t`Retificar muda o sinal, mas não o quadrado da tensão: o eficaz permanece $${n}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
      ] },
    ] },
    { id: 'ea-ret-filtro', title: 'Filtro capacitivo e ondulação', parts: [
      { card: { title: 'Carga e descarga', body: t`Um capacitor em paralelo com a carga carrega perto dos picos e fornece corrente entre eles. A tensão cai até a próxima recarga: a diferença entre máximo e mínimo é a ondulação pico a pico. O gráfico mostra um circuito de ponte com filtro.`, visual: circuitVisual(spec('ponte', 10, 470e-6)) }, exercises: [
        tf('O capacitor de filtro fica em paralelo com a carga.', true, 'Assim ele pode fornecer corrente à carga entre os picos.'),
        mcq('Observe o osciloscópio da carga. O que o capacitor faz entre recargas?', ['Sua tensão diminui gradualmente', 'Inverte a polaridade a cada semiciclo', 'Mantém exatamente zero volt', 'Cria uma senoide negativa'], 0, 'A corrente da carga descarrega o capacitor entre os picos.', { visual: circuitVisual(spec('ponte', 10, 470e-6)) }),
        num(t`Uma tensão varia de $9\,\text{V}$ a $10\,\text{V}$. Qual a ondulação pico a pico em V? Dê inteiro.`, 1, t`$\Delta V_{pp}=10-9=1\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
        filtroEx('ponte', 'baixo'), filtroEx('ponte', 'alto'),
        tf('Aumentar a capacitância tende a reduzir a ondulação para a mesma carga.', true, 'A mesma carga retirada produz menor variação de tensão: ΔV = ΔQ/C.'),
        gen((rng) => { const n = randInt(rng, 2, 8); return num(t`A saída varia entre $${n}\,\text{V}$ e $${n+2}\,\text{V}$. Calcule a ondulação pico a pico em V como inteiro.`, 2, t`$${n+2}-${n}=2\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
      ] },
      { card: { title: 'Estimativa de ondulação', body: t`Para corrente aproximadamente constante e ondulação pequena, $\Delta V_{pp}\approx I/(f_{ond}C)$. Em $60\,\text{Hz}$, use $f_{ond}=60\,\text{Hz}$ para meia onda e $120\,\text{Hz}$ para onda completa. A aproximação ignora detalhes do ângulo de condução.`, visual: laboratorio() }, exercises: [
        tf('A ponte recarrega o filtro aproximadamente 120 vezes por segundo com entrada de 60 Hz.', true, 'Há dois picos de retificação por ciclo: 2 × 60 = 120 Hz.'),
        mcq('Observe a carga no osciloscópio: qual grandeza diminui ao aumentar o capacitor?', ['Ondulação pico a pico', 'Frequência da rede', 'Número de diodos da ponte', 'Tensão nominal da fonte'], 0, 'O capacitor maior descarrega menos entre picos.', { visual: circuitVisual(spec('ponte', 10, 470e-6)) }),
        interFiltro(), filtroEx('ponte', 'baixo'), filtroEx('ponte', 'alto'),
        num(t`Para $I=120\,\text{mA}$, $f_{ond}=120\,\text{Hz}$ e $C=1000\,\mu\text{F}$, estime a ondulação em V como inteiro.`, 1, t`$\Delta V\approx0,12/(120\cdot0,001)=1\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
        gen((rng) => { const n = randInt(rng, 1, 5); return num(t`Com onda completa a $120\,\text{Hz}$ e $C=1000\,\mu\text{F}$, a corrente é $${120*n}\,\text{mA}$. Estime a ondulação em V como inteiro.`, n, t`$\Delta V\approx${120*n}/(120\cdot1000)\cdot1000=${n}\,\text{V}$, usando mA e µF.`, { unit: 'V', tol: 0.5 }); }),
      ] },
    ] },
    { id: 'ea-ret-reg', title: 'Reguladores e projeto de fonte', parts: [
      { card: { title: 'Regulação linear 78xx', body: t`Um regulador 78xx fornece tensão positiva nominal: por exemplo, o 7805 fornece cerca de $5\,\text{V}$. Ele precisa de tensão de entrada suficientemente acima da saída, inclusive no vale da ondulação. A diferença mínima depende do componente, corrente e temperatura: consulte a folha de dados. O gráfico ilustra a filtragem que antecede o regulador.`, visual: laboratorio() }, exercises: [
        tf('Um 7805 é um regulador de tensão positiva nominal de 5 V.', true, 'Na família 78xx, o sufixo 05 indica tensão nominal de saída de 5 V.'),
        mcq('Qual condição verifica a margem de entrada de um regulador?', ['Comparar o vale da entrada com a tensão mínima exigida', 'Comparar só o pico com a saída', 'Igualar corrente e tensão', 'Ignorar a ondulação'], 0, 'O regulador precisa de margem também no instante de menor tensão de entrada.'),
        num(t`A entrada varia de $9$ a $10\,\text{V}$. Qual seu valor mínimo em V? Dê inteiro.`, 9, t`O vale é $9\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
        interFiltro(),
        num(t`Um regulador de $5\,\text{V}$ exige entrada mínima de $7\,\text{V}$. Se o vale é $8\,\text{V}$, qual a margem em V? Dê inteiro.`, 1, t`$8-7=1\,\text{V}$ acima do mínimo especificado.`, { unit: 'V', tol: 0.5 }),
        tf('Um regulador linear elimina a necessidade de verificar dissipação térmica.', false, 'A diferença entre entrada e saída vezes a corrente gera calor no regulador.'),
        gen((rng) => { const n = randInt(rng, 8, 15); return num(t`A entrada de um regulador vale $${n}\,\text{V}$ e a saída $5\,\text{V}$. Qual a diferença em V? Dê inteiro.`, n-5, t`$${n}-5=${n-5}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
      ] },
      { card: { title: 'Projeto e potência', body: t`Escolha secundário, ponte e filtro para que o vale da entrada supere o mínimo do regulador nas piores condições. Estime $V_{vale}\approx V_{pico}-2V_D-\Delta V_{pp}$ para ponte. A dissipação linear é aproximadamente $P=(V_{in}-V_{out})I$, desprezando corrente própria; confira dissipador, corrente, tensão nominal e polaridade do capacitor.`, visual: laboratorio() }, exercises: [
        tf('O capacitor eletrolítico exige atenção à polaridade e à tensão nominal.', true, 'Uma ligação invertida ou tensão acima da nominal pode danificar o componente.'),
        mcq('Qual ordem descreve uma fonte linear típica?', ['Secundário CA → retificação → filtro → regulador', 'Filtro → rede CA → carga → ponte', 'Regulador → ponte → rede CA', 'Carga → filtro → rede CA'], 0, 'A tensão secundária é retificada, filtrada e então regulada.'),
        num(t`Com $V_{in}=10\,\text{V}$, $V_{out}=5\,\text{V}$ e $I=200\,\text{mA}$, estime a dissipação em W como inteiro.`, 1, t`$P=(10-5)\cdot0,2=1\,\text{W}$.`, { unit: 'W', tol: 0.5 }),
        interFiltro(),
        num(t`Uma ponte recebe pico de $15\,\text{V}$. Com duas quedas de $0,7\,\text{V}$ e ondulação de $1,6\,\text{V}$, estime o vale em V como inteiro.`, 12, t`$15-1,4-1,6=12\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
        tf('O valor de pico de uma senoide é igual ao seu valor eficaz.', false, 'Para senoide, o pico é √2 vezes o valor eficaz.'),
        gen((rng) => { const n = randInt(rng, 6, 12); return num(t`Um regulador recebe $${n+5}\,\text{V}$ e entrega $5\,\text{V}$ a $1\,\text{A}$. Despreze a corrente própria e calcule a dissipação em W como inteiro.`, n, t`$P=(${n+5}-5)\cdot1=${n}\,\text{W}$.`, { unit: 'W', tol: 0.5 }); }),
      ] },
    ] },
  ],
};
