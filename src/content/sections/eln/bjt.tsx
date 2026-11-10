import type { UnitDef, ExerciseSource } from '../../types';
import { gen, mcq, num, tf } from '../../helpers';
import { randInt } from '../../../lib/random';
import { circuit, circuitEx, circuitVisual, LED, NPN, R, V, wires } from '../../circuits';

const t = String.raw;

// Emissor comum: a malha da base e a da carga compartilham a fonte.
const etapa = (rb: number) => circuit(
  V('vcc', [0, 0], [0, 6], 12, { fixed: true, locked: true }),
  wires([0, 0], [2, 0], [6, 0]),
  R('rb', [2, 0], [2, 3], rb, { label: 'RB', min: 10000, max: 1000000, values: [10000, 100000, 470000, 1000000], locked: true }),
  wires([2, 3], [4, 3]),
  R('rc', [6, 0], [6, 2], 2200, { label: 'RC', fixed: true, locked: true, show: ['i'] }),
  NPN('q', [5, 3], { beta: 100, locked: true }),
  wires([4, 3], [5, 3]),
  wires([6, 4], [6, 6], [0, 6]),
);

const led = (rb: number) => circuit(
  V('vcc', [0, 0], [0, 6], 5, { fixed: true, locked: true }),
  wires([0, 0], [2, 0], [6, 0]),
  R('rb', [2, 0], [2, 3], rb, { label: 'RB', min: 1000, max: 1000000, values: [1000, 10000, 1000000], locked: true }),
  wires([2, 3], [5, 3]),
  R('rled', [6, 0], [6, 2], 150, { label: 'RLED', fixed: true, locked: true }),
  LED('led', [6, 2], [6, 3], 'red', { locked: true, show: ['i'] }),
  NPN('q', [5, 4], { beta: 100, locked: true }),
  wires([5, 3], [5, 4]),
  wires([6, 5], [6, 6], [0, 6]),
);

// Divisor carregado e par Darlington: visuais próprios das duas topologias.
const divisor = () => circuit(
  V('vcc', [0, 0], [0, 6], 12, { fixed: true, locked: true }),
  wires([0, 0], [2, 0], [5, 0]),
  R('r1', [2, 0], [2, 3], 20000, { label: 'R1', locked: true }),
  R('r2', [2, 3], [2, 6], 10000, { label: 'R2', locked: true }),
  wires([2, 3], [4, 3]),
  R('rc', [5, 0], [5, 2], 2200, { label: 'RC', locked: true }),
  NPN('q', [4, 3], { beta: 100, locked: true }),
  R('re', [5, 4], [5, 6], 1000, { label: 'RE', locked: true }),
  wires([5, 6], [2, 6], [0, 6]),
);
const darlington = () => circuit(
  V('vcc', [0, 0], [0, 6], 12, { fixed: true, locked: true }),
  wires([0, 0], [2, 0], [6, 0]),
  R('rb', [2, 0], [2, 3], 470000, { label: 'RB', locked: true }),
  wires([2, 3], [3, 3]),
  R('rc', [6, 0], [6, 2], 2200, { label: 'RC', locked: true }),
  NPN('q1', [3, 3], { beta: 100, locked: true }),
  NPN('q2', [5, 4], { beta: 100, locked: true }),
  wires([4, 2], [6, 2], [6, 3]),
  wires([4, 4], [5, 4]),
  wires([6, 5], [6, 6], [0, 6]),
);

const leituraTensao = () => mcq(
  t`No circuito, toque em $Q$ e meça $V_{CE}$. Qual faixa contém a leitura?`,
  [t`Entre $5$ e $8\,\text{V}$`, t`Entre $0$ e $1\,\text{V}$`, t`Entre $10$ e $12\,\text{V}$`, t`Entre $15$ e $20\,\text{V}$`], 0,
  t`Na região ativa, $I_B\approx(12-0,7)/470\,000=24\,\mu\text{A}$ e $I_C\approx2,4\,\text{mA}$. Logo $V_{CE}\approx12-2,2\,\text{k}\Omega\cdot2,4\,\text{mA}=6,7\,\text{V}$. O modelo do simulador varia ligeiramente.`,
  { visual: circuitVisual({ comps: etapa(470000), mode: 'view' }) },
);
const leituraCorrente = () => mcq(
  t`No circuito, meça a corrente de $R_C$. Qual faixa contém a leitura?`,
  [t`Entre $2$ e $3\,\text{mA}$`, t`Entre $0$ e $1\,\text{mA}$`, t`Entre $5$ e $6\,\text{mA}$`, t`Entre $10$ e $12\,\text{mA}$`], 0,
  t`A corrente de base é aproximadamente $(12-0,7)/470\,\text{k}\Omega=24\,\mu\text{A}$; com $\beta=100$, $I_C\approx2,4\,\text{mA}$. O simulador usa um modelo de junção mais detalhado.`,
  { visual: circuitVisual({ comps: etapa(470000), mode: 'view' }) },
);
const saturar = () =>
  circuitEx(t`Ajuste $R_B$ para colocar o transistor em saturação: $V_{CE}<0,3\,\text{V}$.`,
    { comps: etapa(470000), mode: 'adjust' }, v => v.v('q') < 0.3 && v.i('q') > 0.004,
    t`Reduza $R_B$ para $10\,\text{k}\Omega$.`,
    t`A corrente de base aumenta ao reduzir $R_B$; a carga limita $I_C$ a cerca de $(12-0,2)/2,2\,\text{k}\Omega=5,36\,\text{mA}$ e $V_{CE}$ fica baixa.`, { set: { rb: 10000 } });
const acender = () => circuitEx(t`Ajuste $R_B$ para acender o LED vermelho sem queimá-lo.`,
    { comps: led(1000000), mode: 'adjust' }, v => v.on('led') && !v.burnt('led') && v.i('led') > 0.015,
    t`Use $R_B=10\,\text{k}\Omega$.`,
    t`A base recebe aproximadamente $(5-0,7)/10\,\text{k}\Omega=0,43\,\text{mA}$. Saturado, o transistor deixa passar aproximadamente $(5-1,8-0,2)/150=20\,\text{mA}$ pelo LED.`, { set: { rb: 10000 } });
const ativar = () => circuitEx(t`Ajuste $R_B$ para obter $I_C$ entre $2$ e $3\,\text{mA}$, com $V_{CE}>1\,\text{V}$.`,
  { comps: etapa(10000), mode: 'adjust' }, v => v.i('q') > 0.002 && v.i('q') < 0.003 && v.v('q') > 1,
  t`Ajuste $R_B$ para $470\,\text{k}\Omega$.`,
  t`Com $R_B=470\,\text{k}\Omega$, $I_B\approx24\,\mu\text{A}$ e $I_C\approx2,4\,\text{mA}$. A queda em $R_C$ deixa $V_{CE}\approx6,7\,\text{V}$: região ativa.`, { set: { rb: 470000 } });
const apagar = () => circuitEx(t`Aumente $R_B$ até o LED ficar apagado, reduzindo sua corrente para menos de $1\,\text{mA}$.`,
  { comps: led(10000), mode: 'adjust' }, v => !v.on('led') && Math.abs(v.i('led')) < 0.001,
  t`Ajuste $R_B$ para $1\,\text{M}\Omega$.`,
  t`A resistência maior reduz a corrente de base; a corrente de coletor e do LED cai abaixo do limiar de acendimento do simulador.`, { set: { rb: 1000000 } });

const calc = (label: string, factor: number, unit: string, explanation: string) => gen(rng => {
  const n = randInt(rng, 2, 9);
  return num(t`${label} $${n}$? Responda em ${unit}, sem casas decimais.`, n * factor,
    t`${explanation}: $${n}\cdot ${factor}=${n * factor}\,\text{${unit}}$.`, { unit, tol: 0.5 });
});
const q = (prompt: string, correct: string, a: string, b: string, c: string, explanation: string) => mcq(prompt, [correct, a, b, c], 0, explanation);
const n = (prompt: string, answer: number, unit: string, explanation: string) => num(prompt, answer, explanation, { unit, tol: 0.05 });

type PartData = { title: string; body: string; questions: ExerciseSource[] };
const part = (p: PartData) => ({
  card: { title: p.title, body: p.body, visual: circuitVisual({ comps: ['Divisor e emissor', 'Carga do divisor'].includes(p.title) ? divisor() : ['Par Darlington', 'Cascata e limites'].includes(p.title) ? darlington() : etapa(470000), mode: 'adjust', caption: 'Toque nos componentes para medir; varie resistores e observe o ponto de operação.' }) },
  exercises: [...p.questions,
    (['Terminais e junções', 'Corte, ativa e saturação', 'Ligar e desligar', 'Malhas de base e coletor', 'Divisor e emissor', 'Par Darlington'].includes(p.title) ? leituraTensao() : leituraCorrente()),
    (['Terminais e junções', 'Corte, ativa e saturação', 'Ligar e desligar', 'Malhas de base e coletor', 'Divisor e emissor', 'Par Darlington'].includes(p.title) ? saturar() : ativar()),
    (['Terminais e junções', 'Corte, ativa e saturação', 'Ligar e desligar', 'Malhas de base e coletor', 'Divisor e emissor', 'Par Darlington'].includes(p.title) ? acender() : apagar()),
  ],
});

export const bjt: UnitDef = {
  id: 'ea-bjt', title: 'Transistor bipolar', icon: '🔀',
  subtitle: 'Correntes, chaveamento e polarização',
  source: 'Eletrônica I · aulas 7, 8 e 10',
  guide: t`Em região ativa, $I_C=\beta I_B$ e $I_E=I_C+I_B$. Na malha de coletor com emissor aterrado, $V_{CE}=V_{CC}-R_C I_C$; o ponto Q é a interseção da reta de carga com a característica do transistor. Para chavear, use corte e saturação; em silício, adote $V_{BE}\approx0,7\,\text{V}$ e $V_{CE(sat)}\approx0,2\,\text{V}$. O divisor com resistor de emissor reduz a sensibilidade a $\beta$. Darlington: $\beta_{eq}=\beta_1\beta_2+\beta_1+\beta_2$.`,
  lessons: [
    { id: 'ea-bjt-estr', title: 'Estrutura e correntes', parts: [
      part({ title: 'Terminais e junções', body: t`O transistor bipolar tem duas junções e três terminais: base, coletor e emissor. Há NPN e PNP; elétrons e lacunas participam da condução. A seta está no emissor: sai no NPN e entra no PNP. No laboratório, observe um NPN em emissor comum.`, questions: [
        q('Quantos terminais tem um BJT?', 'Três', 'Dois', 'Quatro', 'Um', 'São base, coletor e emissor.'),
        tf('A seta do símbolo fica no emissor.', true, 'A seta identifica o emissor e o sentido convencional da corrente nele.'),
        q('No símbolo NPN, a seta do emissor aponta…', 'para fora', 'para dentro', 'para a base', 'para o coletor', 'No NPN a corrente convencional sai pelo emissor.'),
        calc(t`Se a corrente de base é $10\,\mu\text{A}$ em região ativa, com $\beta$ igual a 100 vezes`, 1, 'mA', t`$I_C=100 I_B$; cada unidade da pergunta equivale a $1\,\text{mA}$`),
      ] }),
      part({ title: 'Balanço de correntes', body: t`Para os módulos das correntes, Kirchhoff dá $I_E=I_C+I_B$. Na região ativa direta, $I_C=\beta I_B$; portanto $I_E=(\beta+1)I_B$. Essas relações não garantem operação ativa se a carga limitar o coletor.`, questions: [
        q('Qual é a soma correta dos módulos?', '$I_E=I_C+I_B$', '$I_C=I_E+I_B$', '$I_B=I_E+I_C$', '$I_E=I_C-I_B$', 'Pela lei dos nós, a corrente do emissor é a soma das outras duas.'),
        n(t`Se $I_C=4,0\,\text{mA}$ e $I_B=0,1\,\text{mA}$, calcule $I_E$ em mA, com uma casa decimal.`, 4.1, 'mA', t`$I_E=4,0+0,1=4,1\,\text{mA}$.`),
        q(t`Na região ativa, $I_B=20\,\mu\text{A}$ e $I_C=2\,\text{mA}$. Qual é $\beta$?`, '$100$', '$10$', '$200$', '$0,01$', t`$\beta=2000/20=100$, usando a mesma unidade.`),
        calc(t`Em região ativa, $\beta=100$ e $I_B$ em $\mu\text{A}$ é`, 100, 'µA', t`$I_C=\beta I_B$`),
      ] }),
    ] },
    { id: 'ea-bjt-reg', title: 'Regiões de operação', parts: [
      part({ title: 'Corte, ativa e saturação', body: t`No NPN, em corte ambas as junções estão reversamente polarizadas e as correntes são aproximadamente nulas. Na ativa direta, BE está direta e BC reversa, com $I_C\approx\beta I_B$. Na saturação, ambas estão diretas e a carga limita $I_C$.`, questions: [
        q('Qual região se aproxima de uma chave aberta?', 'Corte', 'Saturação', 'Ativa', 'Ruptura', 'No corte, a corrente de coletor é praticamente nula.'),
        q('Qual região é usada para amplificação linear?', 'Ativa direta', 'Corte', 'Saturação', 'Ruptura', 'Na ativa direta, variações de corrente de base controlam a corrente de coletor.'),
        tf(t`Na saturação, $I_C=\beta I_B$ é sempre uma boa previsão.`, false, 'Na saturação, a carga limita a corrente; o produto é uma previsão da região ativa.'),
        calc(t`Em região ativa, $\beta=50$ e $I_B$ em $\mu\text{A}$ é`, 50, 'µA', t`$I_C=50 I_B$`),
      ] }),
      part({ title: 'Reta de carga e ponto Q', body: t`Com emissor aterrado, $V_{CC}=R_C I_C+V_{CE}$. No gráfico $I_C$ versus $V_{CE}$, a reta liga $(V_{CC},\,0)$ a $(0,\,V_{CC}/R_C)$. O ponto Q é a interseção com a curva do transistor para a polarização escolhida.`, questions: [
        q('No corte ideal, qual é a tensão coletor-emissor?', '$V_{CC}$', '$0$', '$V_{BE}$', '$-V_{CC}$', t`Sem corrente em $R_C$, não há queda nele; $V_{CE}=V_{CC}$.`),
        n(t`Para $V_{CC}=12\,\text{V}$ e $R_C=2\,\text{k}\Omega$, qual o intercepto ideal de corrente em mA, com uma casa?`, 6, 'mA', t`Com $V_{CE}=0$, $I_C=12/2\,\text{k}\Omega=6,0\,\text{mA}$.`),
        q('O ponto Q é…', 'a interseção da reta de carga com a curva do transistor', 'sempre o ponto de corte', 'sempre o ponto de saturação', 'o valor de beta', 'As duas relações devem ser satisfeitas simultaneamente.'),
        calc(t`Com $R_C=1\,\text{k}\Omega$ e $V_{CC}=12\,\text{V}$, a queda em $R_C$ em volts para uma corrente em mA igual a`, 1, 'V', t`$V_{RC}=R_C I_C$`),
      ] }),
    ] },
    { id: 'ea-bjt-chave', title: 'Transistor como chave', parts: [
      part({ title: 'Ligar e desligar', body: t`Numa chave NPN de lado baixo, a carga fica entre $V_{CC}$ e o coletor; o emissor vai ao retorno. Sem comando de base, o transistor corta. Com corrente de base suficiente, satura e a carga conduz. O resistor de base limita $I_B$.`, questions: [
        q('Onde fica a carga numa chave NPN de lado baixo?', 'Entre alimentação positiva e coletor', 'Entre base e emissor', 'Em paralelo com a fonte ideal', 'Entre emissor e base', 'A corrente da carga passa pelo coletor até o emissor e retorna à fonte.'),
        tf('Um LED ligado a uma fonte precisa de limitação de corrente.', true, 'Um resistor em série limita a corrente e protege o LED.'),
        n(t`Para $5\,\text{V}$, LED vermelho de $1,8\,\text{V}$ e $V_{CE(sat)}=0,2\,\text{V}$, calcule a corrente em mA com $R=150\,\Omega$, uma casa decimal.`, 20, 'mA', t`$I=(5-1,8-0,2)/150=0,020\,\text{A}=20,0\,\text{mA}$.`),
        calc(t`Uma carga resiste a $1\,\text{k}\Omega$ e recebe uma tensão em volts igual a`, 1, 'mA', t`$I=V/R$`),
      ] }),
      part({ title: 'Dimensionar a base', body: t`Para chave confiável, escolha uma corrente de base com margem: use um $\beta$ forçado menor que o ganho mínimo especificado, respeitando os limites de base e da saída de comando. $R_B\approx(V_{comando}-V_{BE})/I_B$. Confira corrente, potência e tensão máximas do transistor.`, questions: [
        q(t`Para $I_C=100\,\text{mA}$ e $\beta$ forçado $10$, quanto vale $I_B$?`, t`$10\,\text{mA}$`, t`$1\,\text{mA}$`, t`$100\,\text{mA}$`, t`$1000\,\text{mA}$`, t`$I_B=I_C/10=10\,\text{mA}$.`),
        tf(t`Usar $\beta$ forçado menor proporciona margem de corrente de base.`, true, t`Para a mesma carga, $I_B=I_C/\beta_{forçado}$ aumenta.`),
        n(t`Com comando de $5\,\text{V}$, $V_{BE}=0,7\,\text{V}$ e $I_B=1\,\text{mA}$, calcule $R_B$ em kΩ, com uma casa.`, 4.3, 'kΩ', t`$R_B=(5-0,7)/1\,\text{mA}=4,3\,\text{k}\Omega$.`),
        calc(t`Com ganho forçado 10 e corrente de carga em mA igual a 10 vezes`, 1, 'mA', t`$I_B=I_C/10$`),
      ] }),
    ] },
    { id: 'ea-bjt-fixa', title: 'Polarização fixa', parts: [
      part({ title: 'Malhas de base e coletor', body: t`Na polarização fixa com emissor aterrado e resistor de base ligado a $V_{CC}$: $I_B\approx(V_{CC}-0,7)/R_B$. Se a hipótese ativa for válida, $I_C=\beta I_B$ e $V_{CE}=V_{CC}-R_C I_C$.`, questions: [
        q(t`Qual resistor limita diretamente a corrente de base?`, '$R_B$', '$R_C$', 'A carga isolada', 'Nenhum', t`A malha de base passa por $R_B$ e pela junção BE.`),
        n(t`Para $V_{CC}=10,7\,\text{V}$ e $R_B=100\,\text{k}\Omega$, use $V_{BE}=0,7\,\text{V}$ e calcule $I_B$ em µA com uma casa.`, 100, 'µA', t`$I_B=(10,7-0,7)/100\,000=100,0\,\mu\text{A}$.`),
        n(t`Se $V_{CC}=12\,\text{V}$, $R_C=2\,\text{k}\Omega$ e $I_C=3\,\text{mA}$, calcule $V_{CE}$ em V com uma casa.`, 6, 'V', t`$V_{CE}=12-2\cdot3=6,0\,\text{V}$.`),
        calc(t`Em ativa, $\beta=100$ e $I_B$ em $\mu\text{A}$ é`, 100, 'µA', t`$I_C=100 I_B$`),
      ] }),
      part({ title: 'Validade e estabilidade', body: t`Teste a hipótese ativa: compare $\beta I_B$ com a corrente aproximada de saturação $(V_{CC}-0,2)/R_C$. Se a corrente prevista excede o limite da carga, use a hipótese saturada. A polarização fixa é sensível a variações de $\beta$ e temperatura.`, questions: [
        q('Se a previsão ativa ultrapassa a corrente permitida pela carga, qual hipótese testar?', 'Saturação', 'Corrente infinita', 'Fonte desligada', 'Beta negativo', 'A reta de carga limita a corrente de coletor; teste saturação.'),
        tf(t`Com $I_B$ aproximadamente constante, aumentar $\beta$ aumenta a previsão de $I_C$ na ativa.`, true, t`Pela relação $I_C=\beta I_B$, a corrente cresce proporcionalmente.`),
        n(t`Com $12\,\text{V}$, $R_C=2\,\text{k}\Omega$ e $V_{CE(sat)}=0,2\,\text{V}$, calcule $I_C$ saturada em mA com uma casa.`, 5.9, 'mA', t`$I_C=(12-0,2)/2\,\text{k}\Omega=5,9\,\text{mA}$.`),
        calc(t`Para $I_B=10\,\mu\text{A}$, o ganho $\beta$ é 10 vezes`, 100, 'µA', t`$I_C=\beta I_B$`),
      ] }),
    ] },
    { id: 'ea-bjt-div', title: 'Polarização por divisor de tensão', parts: [
      part({ title: 'Divisor e emissor', body: t`Um divisor $R_1$–$R_2$ alimenta a base, e $R_E$ liga o emissor ao retorno. Se a corrente do divisor for muito maior que $I_B$, $V_B\approx V_{CC}R_2/(R_1+R_2)$; então $V_E\approx V_B-0,7$ e $I_E\approx V_E/R_E$. Verifique depois a região ativa.`, questions: [
        q('Qual componente introduz realimentação no emissor?', '$R_E$', '$R_1$ sozinho', 'A fonte ideal', 'O fio de base', t`Se $I_E$ sobe, a queda em $R_E$ sobe e reduz $V_{BE}$.`),
        n(t`Com $V_{CC}=12\,\text{V}$, $R_1=20\,\text{k}\Omega$ e $R_2=10\,\text{k}\Omega$, despreze $I_B$ e calcule $V_B$ em V com uma casa.`, 4, 'V', t`$V_B=12\cdot10/(20+10)=4,0\,\text{V}$.`),
        n(t`Com $V_B=2,7\,\text{V}$, $V_{BE}=0,7\,\text{V}$ e $R_E=1\,\text{k}\Omega$, calcule $I_E$ em mA com uma casa.`, 2, 'mA', t`$V_E=2,0\,\text{V}$; logo $I_E=2,0/1\,\text{k}\Omega=2,0\,\text{mA}$.`),
        calc(t`Se $R_E=1\,\text{k}\Omega$, a tensão $V_E$ em volts é`, 1, 'mA', t`$I_E=V_E/R_E$`),
      ] }),
      part({ title: 'Carga do divisor', body: t`Quando $I_B$ não é desprezível, substitua o divisor por Thévenin: $V_{TH}=V_{CC}R_2/(R_1+R_2)$ e $R_{TH}=R_1\parallel R_2$. Em ativa, $I_B=(V_{TH}-0,7)/[R_{TH}+(\beta+1)R_E]$. O modelo exige $V_{TH}>0,7$ e verificação posterior de $V_{CE}$.`, questions: [
        q('Quando a aproximação de divisor sem carga é melhor?', 'Quando a corrente no divisor é muito maior que a corrente de base', 'Quando a corrente de base domina', 'Quando R2 está aberto', 'Quando a fonte está desligada', 'A corrente extra retirada pela base então altera pouco a tensão do divisor.'),
        n(t`Dois resistores de $10\,\text{k}\Omega$ em paralelo têm resistência equivalente em kΩ de quanto? Dê uma casa.`, 5, 'kΩ', t`$R_{TH}=10\cdot10/(10+10)=5,0\,\text{k}\Omega$.`),
        tf(t`$R_E$ reduz a sensibilidade da corrente a variações de $\beta$.`, true, t`A realimentação negativa pelo emissor contraria variações de corrente.`),
        calc(t`Em um divisor sem carga com resistores iguais, $V_{CC}$ em volts é o dobro de`, 1, 'V', t`$V_B=V_{CC}/2$`),
      ] }),
    ] },
    { id: 'ea-bjt-darl', title: 'Darlington e cascata', parts: [
      part({ title: 'Par Darlington', body: t`No Darlington NPN, o emissor do primeiro alimenta a base do segundo e os coletores são comuns. Na região ativa, $\beta_{eq}=\beta_1\beta_2+\beta_1+\beta_2$. Há duas junções BE em série, com queda aproximada de $1,4\,\text{V}$. No laboratório, observe as duas junções e os coletores comuns.`, questions: [
        q('Como se conectam os coletores de um Darlington convencional?', 'Juntos', 'Um à base de entrada', 'Um ao emissor de saída', 'Ficam desconectados', 'Os coletores são comuns; o emissor do primeiro aciona a base do segundo.'),
        n(t`Para duas junções de silício com $0,7\,\text{V}$ cada, qual a queda total em V com uma casa?`, 1.4, 'V', t`$0,7+0,7=1,4\,\text{V}$.`),
        n(t`Na ativa, com $\beta_1=10$ e $\beta_2=20$, calcule $\beta_{eq}$ sem casas decimais.`, 230, '', t`$\beta_{eq}=10\cdot20+10+20=230$.`),
        calc(t`Em ativa, para $\beta_1=\beta_2=1$ e corrente de entrada em µA igual a`, 3, 'µA', t`$\beta_{eq}=1\cdot1+1+1=3$ e $I_C=3I_B$`),
      ] }),
      part({ title: 'Cascata e limites', body: t`Uma cascata usa a saída de um estágio para comandar outro. No Darlington, a corrente do emissor do primeiro alimenta a base do segundo; o ganho elevado reduz a corrente de entrada necessária na ativa. Em chaveamento real, confira saturação, dissipação, corrente máxima e tempo de desligamento no datasheet.`, questions: [
        q('Em uma cascata, o primeiro estágio pode…', 'comandar a entrada do seguinte', 'eliminar a necessidade de alimentação', 'criar energia', 'impedir qualquer corrente', 'O primeiro estágio fornece o sinal ou corrente à entrada do seguinte.'),
        tf('Um ganho alto elimina a necessidade de verificar a dissipação.', false, t`A potência aproximada $P=V_{CE}I_C$ ainda aquece o transistor.`),
        n(t`Se $V_{CE}=2,0\,\text{V}$ e $I_C=0,5\,\text{A}$, calcule a potência aproximada em W com uma casa.`, 1, 'W', t`$P\approx V_{CE}I_C=2,0\cdot0,5=1,0\,\text{W}$.`),
        calc(t`Um transistor dissipa $V_{CE}I_C$; com $V_{CE}=2\,\text{V}$ e corrente em A igual a`, 2, 'W', t`$P=2I_C$`),
      ] }),
    ] },
  ],
};
