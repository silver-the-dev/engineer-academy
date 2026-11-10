import type { UnitDef } from '../../types';
import { gen, inter, mcq, near, num, tf } from '../../helpers';
import { circuit, circuitEx, circuitVisual, LED, R, V, wires, Z } from '../../circuits';
import { fnLab } from '../../visuals';
import { fmt, pick } from '../../../lib/random';

const t = String.raw;

// Os valores de junção são os do simulador; a corrente real varia ligeiramente.
const ledCircuit = (r: number, count = 1) => circuit(
  V('fonte', [0, 0], [0, 4], 9, { fixed: true, locked: true }),
  R('r', [0, 0], [3, 0], r, { min: 100, max: 2200, locked: true, label: 'R' }),
  wires([3, 0], [5, 0]),
  ...(count === 1
    ? [LED('led', [5, 0], [5, 3], 'red', { locked: true, show: ['i'] }), ...wires([5, 3], [5, 4])]
    : [LED('led', [5, 0], [5, 2], 'red', { locked: true, show: ['i'] }), LED('led2', [5, 2], [5, 4], 'red', { locked: true })]),
  wires([5, 4], [0, 4]),
);
const parallelCircuit = (r: number) => circuit(
  V('fonte', [0, 0], [0, 4], 9, { fixed: true, locked: true }),
  wires([0, 0], [2, 0]), R('r', [2, 0], [4, 0], r, { min: 100, max: 2200, locked: true, label: 'R1' }),
  LED('led', [4, 0], [4, 3], 'red', { locked: true, show: ['i'] }), wires([4, 3], [4, 4], [2, 4], [0, 4]),
  wires([2, 0], [6, 0]), R('r2', [6, 0], [8, 0], 360, { fixed: true, locked: true, label: 'R2' }),
  LED('led2', [8, 0], [8, 3], 'red', { locked: true, show: ['i'] }), wires([8, 3], [8, 4], [2, 4]),
);
const regulator = (load: number, rs = 470) => circuit(
  V('fonte', [0, 0], [0, 4], 12, { fixed: true, locked: true }),
  R('rs', [0, 0], [3, 0], rs, { min: 100, max: 2200, locked: true, label: 'Rs' }),
  wires([3, 0], [5, 0], [8, 0]),
  Z('z', [5, 3], [5, 0], 5.1, { fixed: true, locked: true, show: ['v', 'i'] }),
  R('rl', [8, 0], [8, 3], load, { min: 220, max: 5000, locked: true, label: 'RL', show: ['v', 'i'] }),
  wires([8, 3], [8, 4], [5, 4], [0, 4]), wires([5, 3], [5, 4]),
);
const ledAdjust = (count: number, target: number, r: number) => circuitEx(
  t`Ajuste o resistor para a corrente do LED vermelho ficar perto de $${target}\,\text{mA}$ sem queimá-lo.`,
  { comps: count === 3 ? parallelCircuit(100) : ledCircuit(100, count), mode: 'adjust' },
  v => near(v.i('led'), target / 1000, 0.001) && !v.burnt('led'),
  t`Ajuste para aproximadamente $${r}\,\Omega$.`,
  t`Pela lei das malhas, subtraia da fonte as quedas diretas dos LEDs do ramo e divida pela corrente desejada; o modelo do simulador varia levemente a queda com a corrente.`,
  { set: { r } },
);
const burnExercise = () => circuitEx(
  t`Para investigar uma ligação sem limitação, reduza o resistor a $1\,\Omega$ (aproximação de um fio). Observe o LED queimado no modelo.`,
  { comps: ledCircuit(360).map(c => c.id === 'r' ? { ...c, min: 1 } : c), mode: 'adjust' },
  v => v.burnt('led'),
  t`Ajuste $R$ para $1\,\Omega$.`,
  t`Sem resistência limitadora significativa, a corrente ultrapassa o limite de $30\,\text{mA}$ adotado pelo simulador e o LED é marcado como queimado. Não faça essa experiência com um LED real.`,
  { set: { r: 1 } },
);
const zAdjust = (initial: number, target: number, answer: number) => circuitEx(
  t`Ajuste a carga $R_L$ para sua corrente ficar próxima de $${target}\,\text{mA}$, mantendo o zener em ruptura.`,
  { comps: regulator(initial), mode: 'adjust' },
  v => near(v.i('rl'), target / 1000, 0.0007) && Math.abs(v.v('z')) > 5 && Math.abs(v.i('z')) > 0.001,
  t`Use aproximadamente $${answer}\,\Omega$.`,
  t`Em regulação, $V_L\approx5,1\,\text{V}$ e $R_L=V_L/I_L\approx${answer}\,\Omega$. Confira que sobra corrente para o zener.`,
  { set: { rl: answer } },
);
const ledReading = (count = 1) => num(t`No circuito, leia a corrente do LED em mA, com uma casa decimal.`, count === 2 ? 15 : 20,
  count === 2 ? t`Há cerca de $9-2(1,8)=5,4\,\text{V}$ no resistor de $360\,\Omega$: $I\approx15,0\,\text{mA}$.` : t`Há cerca de $9-1,8=7,2\,\text{V}$ em $360\,\Omega$: $I\approx20,0\,\text{mA}$.`,
  { unit: 'mA', tol: 0.4, visual: circuitVisual({ comps: ledCircuit(360, count), mode: 'view' }) });
const zReading = () => num(t`Meça a tensão na carga em V, com uma casa decimal.`, 5.1,
  t`O zener reverso em ruptura mantém a carga próxima de $5,1\,\text{V}$.`,
  { unit: 'V', tol: 0.1, visual: circuitVisual({ comps: regulator(1000), mode: 'view' }) });
const currentGen = (n: number) => gen(rng => {
  const r = pick(rng, [360, 540, 720]);
  const i = (9 - 1.8 * n) * 1000 / r;
  return num(t`Uma fonte de $9\,\text{V}$ alimenta ${n} LED(s) vermelho(s) em série e $R=${r}\,\Omega$. Adote $1,8\,\text{V}$ por LED. Calcule a corrente em mA, com uma casa decimal.`, i,
    t`$I=\dfrac{9-${fmt(1.8 * n)}}{${r}}\,\text{A}=${fmt(i, 1)}\,\text{mA}$.`, { unit: 'mA', tol: 0.05 });
});
const zGen = () => gen(rng => {
  const rl = pick(rng, [510, 1020, 1700]);
  const il = 5100 / rl;
  return num(t`Um zener ideal mantém $5,1\,\text{V}$ numa carga de $${rl}\,\Omega$. Calcule $I_L$ em mA, com uma casa decimal.`, il,
    t`$I_L=5,1/${rl}\,\text{A}=${fmt(il, 1)}\,\text{mA}$.`, { unit: 'mA', tol: 0.05 });
});
const clipLab = () => fnLab({
  f: (x, p) => Math.min(x, p.lim),
  params: [{ key: 'lim', label: 'limite (V)', min: 1, max: 4, step: 0.5, value: 2 }],
  view: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
  info: p => t`Modelo ideal: $v_o=\min(v_i,\,${fmt(p.lim)}\,\text{V})$.`,
});

export const ledZener: UnitDef = {
  id: 'ea-led', title: 'LED e diodo zener', icon: '🚨',
  subtitle: 'Limitação de corrente, regulação e conformação de sinais',
  source: 'Eletrônica I · Aula 9; ceifadores e grampeadores como complemento',
  guide: t`Para LED em série: $R=(V_S-\sum V_F)/I$. Em paralelo, use um resistor por ramo. No regulador zener em ruptura: $I_S=(V_{in}-V_Z)/R_S$, $I_L=V_Z/R_L$ e $I_Z=I_S-I_L$; confirme corrente e potência admissíveis. Ceifadores limitam amplitudes; grampeadores deslocam o nível de um sinal.`,
  lessons: [
    { id: 'ea-led-led', title: 'LED e resistor limitador', parts: [
      { card: { title: 'Luz e corrente', body: t`Um LED emite luz quando polarizado diretamente: a recombinação de portadores libera fótons. Sua queda direta depende do dispositivo e da corrente. Neste curso usamos aproximadamente $1,8\,\text{V}$ para um LED vermelho. A tensão reversa admissível costuma ser baixa: consulte a folha de dados.`, visual: circuitVisual({ comps: ledCircuit(360), mode: 'adjust' }) }, exercises: [
        mcq('Em que condição um LED comum emite luz?', ['Conduzindo no sentido direto', 'Sempre que está aberto', 'Somente na ruptura reversa', 'Sem corrente'], 0, 'A recombinação de portadores durante a condução direta emite fótons.'),
        tf('O resistor em série limita a corrente no LED.', true, 'A queda de tensão no resistor cresce com a corrente, limitando-a.'),
        ledReading(),
        currentGen(1),
        num(t`Com $9\,\text{V}$, LED vermelho de $1,8\,\text{V}$ e corrente de $20\,\text{mA}$, calcule o resistor em Ω, sem casas decimais.`, 360, t`$R=(9-1,8)/0,020=360\,\Omega$.`, { unit: 'Ω', tol: 0.5 }),
        ledAdjust(1, 20, 360), ledAdjust(1, 10, 720),
      ] },
      { card: { title: 'Limites e potência', body: t`Sem limitação, a corrente pode ultrapassar o limite do LED. No simulador, acima de $30\,\text{mA}$ ele aparece queimado; esse limite não substitui a folha de dados real. Escolha também a potência do resistor: $P_R=I^2R$. Em CA, proteja o LED contra tensão reversa excessiva.`, visual: circuitVisual({ comps: ledCircuit(100), mode: 'adjust' }) }, exercises: [
        tf('Ligar diretamente um LED a uma fonte de tensão pode queimá-lo.', true, 'Sem resistor ou outra limitação de corrente, a corrente pode superar o limite.'),
        mcq('Como proteger um LED de tensão reversa excessiva em CA?', ['Usar diodo de proteção adequado', 'Eliminar toda limitação de corrente', 'Aumentar a tensão reversa', 'Curto-circuitar a fonte'], 0, 'Um diodo adequadamente ligado pode limitar a tensão reversa sobre o LED.'),
        ledReading(), currentGen(1),
        num(t`Para $I=20\,\text{mA}$ e $R=360\,\Omega$, calcule a potência no resistor em mW, com uma casa decimal.`, 144, t`$P=I^2R=(0,020)^2(360)=0,144\,\text{W}=144,0\,\text{mW}$.`, { unit: 'mW', tol: 0.05 }),
        burnExercise(), ledAdjust(1, 10, 720),
      ] },
    ] },
    { id: 'ea-led-assoc', title: 'LEDs em série e em paralelo', parts: [
      { card: { title: 'Ramo em série', body: t`Em série, todos os LEDs conduzem a mesma corrente e suas quedas se somam. Com dois vermelhos de $1,8\,\text{V}$ em $9\,\text{V}$, sobram $5,4\,\text{V}$ no resistor. A fonte precisa ter tensão suficiente para as junções e o resistor.`, visual: circuitVisual({ comps: ledCircuit(360, 2), mode: 'adjust' }) }, exercises: [
        tf('Em um único ramo em série a corrente é a mesma nos dois LEDs.', true, 'A mesma corrente atravessa todos os componentes do ramo.'),
        num(t`Dois LEDs de $1,8\,\text{V}$ em série têm queda total de quantos V? Responda com uma casa decimal.`, 3.6, t`$1,8+1,8=3,6\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        ledReading(2), currentGen(2),
        num(t`Dois LEDs de $1,8\,\text{V}$ em série com $9\,\text{V}$ devem conduzir $15\,\text{mA}$. Calcule $R$ em Ω, sem casas decimais.`, 360, t`$R=(9-3,6)/0,015=360\,\Omega$.`, { unit: 'Ω', tol: 0.5 }),
        ledAdjust(2, 15, 360), ledAdjust(2, 10, 540),
      ] },
      { card: { title: 'Ramos em paralelo', body: t`Em paralelo, cada ramo recebe a tensão da fonte e a corrente total é a soma das correntes dos ramos. Cada LED deve ter seu próprio resistor: pequenas diferenças de tensão direta poderiam causar divisão desigual com um único resistor compartilhado.`, visual: circuitVisual({ comps: parallelCircuit(360), mode: 'adjust' }) }, exercises: [
        mcq('Qual arranjo favorece a limitação independente de corrente?', ['Um resistor em série com cada LED', 'Um único resistor compartilhado por LEDs diretamente em paralelo', 'Nenhum resistor', 'Um fio diretamente sobre cada LED'], 0, 'O resistor próprio limita a corrente em cada ramo mesmo com LEDs diferentes.'),
        tf('A corrente da fonte é a soma das correntes dos ramos paralelos.', true, 'Pela lei dos nós, as correntes que saem somam a corrente que entra.'),
        num(t`Meça a corrente do LED no primeiro ramo em mA, com uma casa decimal.`, 20, t`Aproximadamente $(9-1,8)/360=20,0\,\text{mA}$ no ramo.`, { unit: 'mA', tol: 0.4, visual: circuitVisual({ comps: parallelCircuit(360), mode: 'view' }) }),
        currentGen(1),
        num(t`Dois ramos conduzem $10\,\text{mA}$ e $20\,\text{mA}$. Qual a corrente total em mA, com uma casa decimal?`, 30, t`$I_T=10+20=30,0\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }),
        ledAdjust(3, 20, 360), ledAdjust(3, 10, 720),
      ] },
    ] },
    { id: 'ea-led-zener', title: 'Diodo zener', parts: [
      { card: { title: 'Ruptura controlada', body: t`O zener pode conduzir diretamente como um diodo de silício ou reversamente na região de ruptura. Nessa região, sua tensão reversa fica próxima de $V_Z$ numa faixa de corrente especificada. O resistor externo limita a corrente; ruptura controlada não significa potência ilimitada.`, visual: circuitVisual({ comps: regulator(1000), mode: 'adjust' }) }, exercises: [
        mcq('Para estabilizar uma tensão positiva, como o zener é polarizado?', ['Reversamente, na região de ruptura', 'Diretamente, sem resistor', 'Sempre como circuito aberto', 'Com anodo no nó positivo de saída'], 0, 'O catodo fica no nó positivo e o anodo no retorno; o zener opera reversamente.'),
        tf('A região de ruptura zener pode ser usada sem danificar o diodo se seus limites forem respeitados.', true, 'O resistor e o projeto mantêm corrente e potência dentro dos limites.'),
        zReading(), zGen(),
        num(t`Um zener ideal de $5,1\,\text{V}$ conduz $10\,\text{mA}$. Qual a potência em mW, com uma casa decimal?`, 51, t`$P_Z=V_ZI_Z=5,1\cdot0,010=0,051\,\text{W}=51,0\,\text{mW}$.`, { unit: 'mW', tol: 0.05 }),
        zAdjust(2200, 10, 510), zAdjust(510, 5, 1020),
      ] },
      { card: { title: 'Corrente e potência', body: t`Na aproximação de tensão constante, $P_Z\approx V_Z I_Z$. Abaixo da corrente mínima especificada, não se garante a regulação; acima da potência nominal, o aquecimento pode destruir o componente. Sem carga, a corrente no zener tende a ser máxima.`, visual: circuitVisual({ comps: regulator(2200), mode: 'adjust' }) }, exercises: [
        tf('Uma tensão zener nominal garante regulação mesmo com corrente nula.', false, 'A tensão nominal exige uma faixa de corrente; abaixo do joelho a aproximação falha.'),
        mcq('Qual grandeza limita diretamente o aquecimento do zener?', ['Potência dissipada', 'Cor da cápsula', 'Tensão da carga isoladamente', 'Comprimento dos fios apenas'], 0, 'A potência dissipada é aproximadamente o produto da tensão pela corrente.'),
        zReading(), zGen(),
        num(t`Com $V_Z=5,1\,\text{V}$ e limite de $0,51\,\text{W}$, qual a corrente máxima teórica em mA, com uma casa decimal?`, 100, t`$I_{Z\max}=P_{\max}/V_Z=0,51/5,1=0,1\,\text{A}=100,0\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }),
        zAdjust(2200, 10, 510), zAdjust(510, 5, 1020),
      ] },
    ] },
    { id: 'ea-led-reg', title: 'Regulador zener', parts: [
      { card: { title: 'Balanço de corrente', body: t`O resistor série alimenta a carga e o zener em paralelo. Em ruptura, $V_L\approx V_Z$, $I_S=(V_{in}-V_Z)/R_S$, $I_L=V_Z/R_L$ e $I_Z=I_S-I_L$. Se $I_L$ aumenta, $I_Z$ diminui; a saída só permanece regulada enquanto houver corrente suficiente no zener.`, visual: circuitVisual({ comps: regulator(1000), mode: 'adjust' }) }, exercises: [
        tf('A corrente no resistor série divide-se entre a carga e o zener.', true, 'Pela lei dos nós, $I_S=I_L+I_Z$.'),
        mcq('Se a carga exige mais corrente, com entrada constante e saída regulada, a corrente zener tende a…', ['Diminuir', 'Aumentar na mesma medida', 'Ser sempre zero', 'Inverter a polaridade da fonte'], 0, 'Como $I_S$ é aproximadamente constante, $I_Z=I_S-I_L$ diminui.'),
        zReading(), zGen(),
        num(t`Se $I_S=15\,\text{mA}$ e $I_L=5\,\text{mA}$, calcule $I_Z$ em mA, com uma casa decimal.`, 10, t`$I_Z=15-5=10,0\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }),
        zAdjust(2200, 10, 510), zAdjust(510, 5, 1020),
      ] },
      { card: { title: 'Carga variável e perda de regulação', body: t`Uma carga de menor resistência pede mais corrente. Se a corrente requerida ultrapassar a disponível, o zener sai de ruptura e $V_L$ cai; nesse caso não se pode impor $V_L=V_Z$. Verifique também a potência zener com carga leve e a corrente mínima com carga pesada.`, visual: circuitVisual({ comps: regulator(510), mode: 'adjust' }) }, exercises: [
        tf('Diminuir $R_L$ aumenta a corrente da carga enquanto a saída permanece regulada.', true, 'Com $V_L$ aproximadamente constante, $I_L=V_L/R_L$.'),
        mcq('O que acontece quando a carga exige mais corrente que o resistor série pode fornecer em regulação?', ['O zener sai de ruptura e a saída cai', 'A saída permanece exatamente igual para qualquer carga', 'A corrente do zener cresce sem limite', 'A fonte inverte o sinal'], 0, 'A corrente zener deixa de ser suficiente e a hipótese de tensão fixa deixa de valer.'),
        zReading(), zGen(),
        num(t`Para $V_{in}=12\,\text{V}$, $V_Z=5,1\,\text{V}$ e $R_S=470\,\Omega$, calcule $I_S$ em mA, com uma casa decimal.`, 1000 * 6.9 / 470, t`$I_S=(12-5,1)/470=14,7\,\text{mA}$ aproximadamente.`, { unit: 'mA', tol: 0.05 }),
        zAdjust(2200, 10, 510), zAdjust(510, 5, 1020),
      ] },
    ] },
    { id: 'ea-led-ceif', title: 'Ceifadores e grampeadores', parts: [
      { card: { title: 'Ceifar picos', body: t`Um ceifador limita a excursão do sinal quando um diodo conduz. Num modelo ideal com limite positivo $L$, $v_o=\min(v_i,L)$. Em um circuito real, a queda direta do diodo altera o limiar; o resistor limita a corrente.`, visual: clipLab() }, exercises: [
        mcq('O que um ceifador faz quando o sinal tenta ultrapassar o limiar de condução?', ['Limita a excursão nessa região', 'Aumenta obrigatoriamente a frequência', 'Elimina toda a tensão de entrada', 'Transforma o sinal em corrente constante'], 0, 'A condução desvia corrente e limita a saída perto do limiar.'),
        tf('Um ceifador positivo pode manter a parte negativa do sinal sem cortá-la.', true, 'O diodo só limita a região em que fica diretamente polarizado.'),
        num(t`No modelo ideal $v_o=\min(v_i,2\,\text{V})$, qual a saída para $v_i=4\,\text{V}$? Responda em V com uma casa decimal.`, 2, t`O menor valor entre $4$ e $2$ é $2,0\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        gen(rng => { const lim = pick(rng, [1, 2, 3, 4]); return num(t`Um ceifador ideal limita em $${lim}\,\text{V}$. Para entrada de $6\,\text{V}$, qual a saída em V, com uma casa decimal?`, lim, t`$v_o=\min(6,\,${lim})=${lim}\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
        inter(t`No gráfico, ajuste o limite positivo para $3\,\text{V}$.`, 'plot', clipLab().props, v => near(v.p.lim, 3, 0.01), t`$3\,\text{V}$`, t`A curva deixa de subir quando a entrada chega a $3\,\text{V}$.`),
        num(t`Um diodo de silício conduz ao ultrapassar uma referência de $2\,\text{V}$ em $0,7\,\text{V}$. Qual o limiar positivo em V, com uma casa decimal?`, 2.7, t`$2+0,7=2,7\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        tf('O resistor de um ceifador pode ser necessário para limitar a corrente do diodo.', true, 'Ao conduzir, o diodo precisa de impedância externa para evitar corrente excessiva.'),
      ] },
      { card: { title: 'Grampear um nível', body: t`Um grampeador usa diodo e capacitor para deslocar o nível CC de um sinal periódico. No modelo ideal, depois do transitório, um extremo fica preso à referência e a excursão pico a pico se conserva. A constante $RC$ deve ser grande em relação ao período para reduzir a descarga entre ciclos.`, visual: clipLab() }, exercises: [
        mcq('Qual componente armazena carga para deslocar o nível de um sinal em um grampeador simples?', ['Capacitor', 'Resistor isolado', 'Fio ideal', 'Fusível'], 0, 'O capacitor armazena tensão e desloca o sinal durante a parte não condutiva do ciclo.'),
        tf('No modelo ideal, grampear desloca a forma de onda e preserva sua excursão pico a pico.', true, 'Um deslocamento constante muda ambos os extremos igualmente.'),
        num(t`Uma senoide varia de $-3$ a $3\,\text{V}$. Grampeando idealmente o mínimo em $0\,\text{V}$, qual o máximo em V, com uma casa decimal?`, 6, t`A excursão é $3-(-3)=6\,\text{V}$; com mínimo zero, o máximo é $6,0\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        gen(rng => { const a = pick(rng, [1, 2, 3, 4]); return num(t`Uma senoide simétrica de amplitude $${a}\,\text{V}$ tem mínimo grampeado idealmente em zero. Qual o máximo em V, com uma casa decimal?`, 2 * a, t`A excursão pico a pico é $2\cdot${a}=${2 * a}\,\text{V}$, preservada pelo deslocamento.`, { unit: 'V', tol: 0.05 }); }),
        inter(t`Para comparar com um limitador, ajuste neste gráfico o limite de corte para $1\,\text{V}$.`, 'plot', clipLab().props, v => near(v.p.lim, 1, 0.01), t`$1\,\text{V}$`, t`Acima de $1\,\text{V}$ o ceifador corta o pico; o grampeador ideal desloca a forma inteira.`),
        mcq('Para reduzir a descarga do capacitor entre ciclos, escolha em geral…', ['$RC$ muito maior que o período', '$RC$ muito menor que o período', 'capacitância nula', 'resistência nula'], 0, 'Uma constante de tempo grande conserva aproximadamente a carga durante um período.'),
        num(t`Uma onda varia de $-2$ a $4\,\text{V}$. Ao deslocá-la idealmente para mínimo $1\,\text{V}$, qual o máximo em V, com uma casa decimal?`, 7, t`A excursão é $4-(-2)=6\,\text{V}$; o novo máximo é $1+6=7,0\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
      ] },
    ] },
  ],
};
