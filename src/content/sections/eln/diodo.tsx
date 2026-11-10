import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, tf, near } from '../../helpers';
import { circuit, circuitEx, circuitVisual, D, R, V, wires } from '../../circuits';
import { fnLab } from '../../visuals';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;

// Contagens ilustrativas, não concentrações físicas em equilíbrio.
const portadores = () => fnLab({
  view: { xMin: 0, xMax: 10, yMin: 0, yMax: 12 },
  params: [{ key: 'n', label: 'Elétrons livres', min: 1, max: 10, step: 1, value: 3 }],
  f: (_x, p) => p.n,
  info: (p) => t`Contagem ilustrativa de elétrons livres: $${p.n}$.`,
});

// A fonte fornece tensão positiva no nó superior; o primeiro terminal do diodo é o anodo.
const serie = (volts = 10.7, ohms = 1000, reverso = false) => circuit(
  V('fonte', [0, 0], [0, 3], volts, { locked: true, fixed: true }),
  wires([0, 0], [1, 0]), R('r1', [1, 0], [4, 0], ohms, { locked: true, min: 100, max: 5000, values: [500, 1000, 2000, 4000], show: ['i'] }),
  wires([4, 0], [5, 0]), D('d1', reverso ? [5, 3] : [5, 0], reverso ? [5, 0] : [5, 3], { locked: true, show: ['v', 'i'] }),
  wires([5, 3], [0, 3]),
);
const lab = (reverso = false) => circuitVisual({ comps: serie(10.7, 1000, reverso), mode: 'adjust' });
const medir = (reverso = false) => reverso
  ? num(t`Observe o diodo invertido no simulador. Qual é aproximadamente $V_D=V_A-V_K$, em V, com uma casa decimal?`, -10.7, t`Sem corrente apreciável, a queda no resistor é quase zero; o anodo está abaixo do catodo em aproximadamente $10,7\,\text{V}$.`, { unit: 'V', tol: 0.15, visual: lab(true) })
  : num(t`Observe o circuito no simulador. Qual é a corrente no diodo, em mA, com uma casa decimal?`, 10, t`Com $V_D\approx0,7\,\text{V}$, $I\approx(10,7-0,7)/1000=0,010\,\text{A}=10,0\,\text{mA}$.`, { unit: 'mA', tol: 0.2, visual: lab() });
const ajustar = (target: 5 | 10 | 20) => {
  const resistor = target === 5 ? 2000 : target === 10 ? 1000 : 500;
  const inicial = target === 10 ? 2000 : 1000;
  return circuitEx(t`Ajuste $R_1$ para obter aproximadamente $${target}\,\text{mA}$ no diodo direto.`,
    { comps: serie(10.7, inicial), mode: 'adjust' },
    (v) => v.ok && near(v.i('d1'), target / 1000, 0.0004),
    t`$R_1=${resistor}\,\Omega$`,
    t`Na segunda aproximação, $R=(10,7-0,7)/(${target}/1000)=${resistor}\,\Omega$. A leitura pode variar um pouco porque a curva do simulador não é uma queda perfeitamente constante.`,
    { set: { r1: resistor } });
};
const inverter = () => circuitEx(
  t`Corrija o diodo invertido: remova-o e coloque um diodo com anodo em cima e catodo embaixo. Obtenha corrente direta próxima de $10\,\text{mA}$.`,
  { comps: circuit(V('fonte', [0, 0], [0, 3], 10.7, { locked: true, fixed: true }), wires([0, 0], [1, 0]), R('r1', [1, 0], [4, 0], 1000, { locked: true, fixed: true }), wires([4, 0], [5, 0]), D('errado', [5, 3], [5, 0]), wires([5, 3], [0, 3])), mode: 'build', palette: ['diode'] },
  (v) => v.ok && near(v.i('r1'), 0.01, 0.0003) && v.count('diode') === 1,
  'Diodo com anodo no nó superior e catodo no inferior.',
  t`Com o anodo voltado para o lado positivo, a corrente é aproximadamente $(10,7-0,7)/1000=10\,\text{mA}$.`,
  { remove: ['errado'], add: [D('certo', [5, 0], [5, 3])] },
);
const conta = () => gen((rng) => {
  const corrente = randInt(rng, 2, 9);
  const fonte = corrente + 0.7;
  return num(t`Um diodo de silício direto e $1\,\text{k}\Omega$ estão em série com $${fmt(fonte, 1)}\,\text{V}$. Pela segunda aproximação, qual a corrente em mA, com uma casa decimal?`, corrente,
    t`$I=(${fmt(fonte, 1)}-0,7)/1\,\text{k}\Omega=${corrente}\,\text{mA}$.`, { unit: 'mA', tol: 0.05 });
});

export const diodos: UnitDef = {
  id: 'ea-semi', title: 'Semicondutores e diodo', icon: '🔺',
  subtitle: 'Dopagem, junção PN, curva e análise de circuitos',
  source: 'Eletrônica I · aulas 1 e 3; fundamentos de dispositivos semicondutores',
  guide: t`Silício intrínseco tem elétrons e lacunas em igual concentração. Dopantes doadores produzem material tipo N; aceitadores produzem tipo P. Na junção PN, a polarização direta reduz a barreira e a reversa a aumenta.

Defina $V_D=V_A-V_K$. A curva real é não linear; abaixo da ruptura há pequena corrente reversa. A PIV especifica a máxima tensão reversa repetitiva admissível: escolha-a acima do pico aplicado, com margem. Na primeira aproximação, diodo direto é curto ideal; na segunda, $V_D\approx0,7\,\text{V}$ para silício; na terceira, $V_D\approx0,7+I_Dr_d$. Em série, $I_D\approx(V_S-0,7)/R$ na segunda aproximação, se a hipótese de condução for consistente. A reta de carga é $I_D=(V_S-V_D)/R$; sua interseção com a curva dá o ponto Q.`,
  lessons: [
    { id: 'ea-semi-mat', title: 'Materiais semicondutores e dopagem', parts: [
      { card: { title: 'Elétrons e lacunas', body: t`O silício tem quatro elétrons de valência e forma ligações covalentes. Energia térmica pode libertar um elétron, deixando uma **lacuna** que se comporta como portador positivo. No material intrínseco, elétrons e lacunas são criados aos pares: $n=p$. O gráfico mostra uma contagem ilustrativa, não uma escala de concentração real.`, visual: portadores() }, exercises: [
        mcq('Qual material é semicondutor?', ['Silício', 'Cobre', 'Vidro', 'Borracha'], 0, 'O silício tem condutividade intermediária e controlável por dopagem e temperatura.'),
        tf('Uma lacuna representa a ausência de um elétron em uma ligação.', true, 'A ausência pode se deslocar quando elétrons vizinhos ocupam a ligação, comportando-se como portador positivo.'),
        mcq('No silício intrínseco em equilíbrio, como se comparam as concentrações?', ['$n=p$', '$n=0$', '$p=0$', '$n=2p$'], 0, 'Cada par gerado fornece um elétron e uma lacuna, então $n=p$.'),
        inter('No gráfico, ajuste a contagem ilustrativa de elétrons livres para 7.', 'plot', portadores().props, (v) => v.p.n === 7, 'Ajuste para 7.', 'O controle representa a contagem de elétrons; selecione 7.'),
        gen((rng) => { const n = randInt(rng, 3, 9); return num(t`Um modelo intrínseco contém $${n}$ pares elétron-lacuna. Quantas lacunas há?`, n, t`Cada par contém uma lacuna, portanto há $${n}$ lacunas.`); }),
        tf('Ao criar um par em material intrínseco, surge um elétron livre e uma lacuna.', true, 'O elétron sai da ligação e deixa uma lacuna: os dois são criados juntos.'),
        mcq('O que ocorre na recombinação?', ['Um elétron preenche uma lacuna', 'Um elétron vira próton', 'Uma lacuna vira átomo dopante', 'A carga elétrica desaparece do universo'], 0, 'Um elétron livre ocupa uma lacuna; o par de portadores móveis deixa de existir.'),
      ] },
      { card: { title: 'Dopagem controlada', body: t`Doadores como fósforo têm cinco elétrons de valência: no silício, contribuem com elétrons livres e formam material **N**. Aceitadores como boro têm três e favorecem lacunas, formando material **P**. Maioritário indica o portador mais abundante, não a carga líquida do cristal. O cristal dopado em equilíbrio continua aproximadamente neutro.`, visual: portadores() }, exercises: [
        mcq('Um dopante doador produz material de que tipo?', ['N', 'P', 'Isolante perfeito', 'Metal necessariamente'], 0, 'O doador aumenta a concentração de elétrons livres: tipo N.'),
        mcq('Qual portador é majoritário no tipo P?', ['Lacunas', 'Elétrons', 'Prótons móveis', 'Nêutrons'], 0, 'Aceitadores aumentam a concentração de lacunas; elas são majoritárias no tipo P.'),
        tf('O tipo N é necessariamente um cristal com carga líquida negativa.', false, 'Os íons doadores positivos compensam a carga dos elétrons; o material permanece aproximadamente neutro.'),
        inter('Ajuste a contagem ilustrativa de elétrons para 5.', 'plot', portadores().props, (v) => v.p.n === 5, 'Ajuste para 5.', 'Mova o controle até indicar 5; a contagem é apenas ilustrativa.'),
        gen((rng) => { const n = randInt(rng, 4, 9); return num(t`Em um modelo, há $${n}$ elétrons livres e $1$ lacuna. Quantos elétrons livres há a mais que lacunas?`, n - 1, t`A diferença é $${n}-1=${n - 1}$; elétrons são majoritários nesse modelo.`); }),
        mcq('Qual impureza é aceitadora no silício?', ['Boro', 'Fósforo', 'Arsênio', 'Antimônio'], 0, 'O boro tem três elétrons de valência e atua como aceitador, favorecendo lacunas.'),
        tf('Um material tipo P ainda pode conter elétrons como portadores minoritários.', true, 'A dopagem altera as concentrações, mas não elimina necessariamente os portadores minoritários.'),
      ] },
    ] },
    { id: 'ea-semi-pn', title: 'Junção PN e polarização', parts: [
      { card: { title: 'A junção em equilíbrio', body: t`Ao unir P e N, elétrons e lacunas difundem-se e recombinam perto da interface. Restam íons fixos, criando a região de depleção e um campo que se opõe à difusão. Em equilíbrio, as correntes de deriva e difusão se compensam.`, visual: lab() }, exercises: [
        mcq('A região de depleção contém principalmente…', ['Íons fixos e poucos portadores móveis', 'Apenas elétrons livres', 'Apenas lacunas livres', 'Um condutor metálico'], 0, 'A difusão deixa íons dopantes fixos e empobrece a região de portadores móveis.'),
        tf('Em equilíbrio, a corrente líquida na junção é zero.', true, 'Deriva e difusão têm sentidos opostos e seus efeitos se equilibram.'),
        medir(),
        gen((rng) => { const n = randInt(rng, 2, 8); return num(t`No modelo de uma junção, $${n}$ elétrons e $${n}$ lacunas se recombinam em pares. Quantos pares desaparecem?`, n, t`Cada par usa um elétron e uma lacuna; desaparecem $${n}$ pares.`); }),
        mcq('A barreira interna se opõe principalmente a qual movimento inicial?', ['Difusão de portadores majoritários', 'Conservação de carga', 'Existência de átomos', 'Passagem de luz no vácuo'], 0, 'O campo interno dificulta a difusão adicional de portadores majoritários pela junção.'),
        ajustar(5), inverter(),
      ] },
      { card: { title: 'Direta e reversa', body: t`Na polarização direta, o anodo P fica em potencial maior que o catodo N e a barreira efetiva diminui. Na reversa, a barreira e a região de depleção aumentam; antes da ruptura, passa apenas uma pequena corrente reversa. O resistor limita a corrente direta.`, visual: lab(true) }, exercises: [
        mcq('Para polarizar diretamente a junção, o lado P deve estar…', ['Em potencial maior que o lado N', 'Em potencial menor que o lado N', 'Sempre aterrado', 'Desligado'], 0, 'Na polarização direta, $V_A>V_K$, reduzindo a barreira efetiva.'),
        tf('A polarização reversa aumenta a região de depleção.', true, 'O campo aplicado afasta os portadores majoritários da interface, alargando a região.'),
        medir(true), conta(),
        mcq('Qual função tem o resistor em série quando o diodo conduz?', ['Limitar a corrente', 'Inverter a dopagem', 'Eliminar a fonte', 'Aumentar a PIV do diodo'], 0, 'A queda no resistor limita a corrente segundo a lei de Ohm.'),
        inverter(), ajustar(20),
      ] },
    ] },
    { id: 'ea-semi-curva', title: 'Curva característica', parts: [
      { card: { title: 'Corrente versus tensão', body: t`A curva $I_D\times V_D$ é não linear. Em condução direta, um pequeno aumento de tensão pode produzir grande aumento de corrente. A queda típica de silício depende da corrente e da temperatura; $0,7\,\text{V}$ é uma aproximação útil, não um limiar exato. No simulador, varie o resistor e observe corrente e tensão.`, visual: lab() }, exercises: [
        mcq('A curva real de um diodo é aproximadamente…', ['Não linear', 'Uma reta pela origem em toda a faixa', 'Uma reta horizontal em toda a faixa', 'Uma parábola obrigatoriamente'], 0, 'A relação entre corrente e tensão é não linear; a corrente direta cresce rapidamente.'),
        tf('A queda direta de um diodo real é exatamente 0,7 V em qualquer corrente e temperatura.', false, 'O valor de 0,7 V é um modelo aproximado; a queda varia com corrente e temperatura.'),
        medir(), conta(),
        mcq('No gráfico $I_D$ por $V_D$, o ponto Q é…', ['A interseção da curva com a reta de carga', 'Sempre a origem', 'Sempre a tensão de ruptura', 'A resistência isolada'], 0, 'O ponto Q satisfaz simultaneamente a curva do diodo e a equação da malha.'),
        ajustar(5), ajustar(20),
      ] },
      { card: { title: 'Reversa e PIV', body: t`Em reversa, a corrente é pequena até a região de ruptura. **PIV** (ou PRV) é a tensão inversa de pico admissível especificada para o componente; selecione um diodo com valor superior ao maior pico reverso, incluindo margem. O simulador deste diodo comum não modela a ruptura reversa: use dados de catálogo para escolhê-lo.`, visual: lab(true) }, exercises: [
        mcq('O que significa PIV?', ['Tensão inversa de pico admissível', 'Potência instantânea de valência', 'Corrente direta mínima', 'Resistência do encapsulamento'], 0, 'PIV é a tensão reversa de pico que o diodo pode suportar segundo sua especificação.'),
        tf('A corrente reversa real antes da ruptura é sempre exatamente zero.', false, 'Existe corrente de fuga, geralmente pequena, antes da região de ruptura.'),
        medir(true),
        gen((rng) => { const pico = randInt(rng, 2, 8) * 10; return num(t`Um circuito aplica pico reverso de $${pico}\,\text{V}$. Com margem de $20\%$, qual PIV mínima calculada em V, sem casas decimais?`, pico * 1.2, t`$PIV_{mín}=1,2\cdot ${pico}=${fmt(pico * 1.2, 0)}\,\text{V}$. Escolha especificação comercial igual ou superior.`, { unit: 'V', tol: 0.01 }); }),
        mcq('Para pico reverso de 40 V e margem exigida de 25%, qual PIV atende?', [t`$60\,\text{V}$`, t`$40\,\text{V}$`, t`$30\,\text{V}$`, t`$20\,\text{V}$`], 0, t`A exigência é $1,25\cdot40=50\,\text{V}$; entre as opções, apenas $60\,\text{V}$ atende.`),
        inverter(), ajustar(10),
      ] },
    ] },
    { id: 'ea-semi-aprox', title: 'Aproximações do diodo', parts: [
      { card: { title: 'Primeira e segunda aproximações', body: t`Na primeira aproximação, o diodo ideal conduz como curto ($V_D=0$) ou bloqueia como circuito aberto. Na segunda, o diodo de silício conduz com queda aproximada de $0,7\,\text{V}$ e bloqueia em reversa. Confirme a hipótese: uma corrente direta calculada negativa invalida o estado conduzindo.`, visual: lab() }, exercises: [
        mcq('Na primeira aproximação, um diodo direto equivale a…', ['Um curto ideal', 'Um circuito aberto', 'Uma fonte de 10 V', 'Um resistor de 1 kΩ'], 0, 'O diodo ideal conduz sem queda de tensão: equivale a um curto.'),
        tf('Na segunda aproximação, usa-se cerca de 0,7 V para um diodo de silício conduzindo.', true, 'O modelo simplificado fixa a queda direta em aproximadamente 0,7 V.'),
        medir(), conta(),
        num(t`Pela primeira aproximação, uma fonte de $10\,\text{V}$ alimenta $1\,\text{k}\Omega$ e um diodo direto. Qual a corrente em mA, com uma casa decimal?`, 10, t`O diodo ideal tem queda zero: $I=10/1000=10,0\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }),
        ajustar(5), inverter(),
      ] },
      { card: { title: 'Terceira aproximação', body: t`A terceira aproximação acrescenta a resistência de corpo $r_d$ ao modelo de queda fixa: $V_D\approx0,7+I_Dr_d$. Em série com $R$, $I_D\approx(V_S-0,7)/(R+r_d)$ quando conduz. É um modelo linear por trechos; não substitui a curva completa do catálogo.`, visual: lab() }, exercises: [
        mcq('O que a terceira aproximação acrescenta à segunda?', ['Uma resistência em série com a queda fixa', 'Uma fonte CA obrigatória', 'Uma lacuna fixa no circuito', 'Uma PIV infinita'], 0, 'Além da queda fixa, o modelo inclui a queda $I_Dr_d$ na resistência de corpo.'),
        tf('Na terceira aproximação, a tensão direta cresce com a corrente quando $r_d>0$.', true, 'A expressão $V_D=0,7+I_Dr_d$ cresce com $I_D$ para resistência positiva.'),
        medir(),
        gen((rng) => { const i = randInt(rng, 2, 8); return num(t`Na terceira aproximação, $r_d=10\,\Omega$ e $I_D=${i}\,\text{mA}$. Qual $V_D$ em V, com duas casas decimais?`, 0.7 + i * 0.01, t`$V_D=0,7+(${i}/1000)\cdot10=${fmt(0.7 + i * 0.01, 2)}\,\text{V}$.`, { unit: 'V', tol: 0.005 }); }),
        num(t`Para $V_S=5,7\,\text{V}$, $R=490\,\Omega$ e $r_d=10\,\Omega$, calcule a corrente direta em mA, com uma casa decimal.`, 10, t`$I=(5,7-0,7)/(490+10)=0,010\,\text{A}=10,0\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }),
        ajustar(20), ajustar(5),
      ] },
    ] },
    { id: 'ea-semi-ckt', title: 'Circuitos com diodos', parts: [
      { card: { title: 'Lei das malhas', body: t`Para fonte, resistor e diodo em série, $V_S=I_DR+V_D$. Se o diodo de silício conduz, estime $I_D=(V_S-0,7)/R$. A mesma corrente passa pelos dois componentes; verifique a polaridade e a consistência da solução antes de aplicá-la.`, visual: lab() }, exercises: [
        mcq('Em uma malha em série, a corrente no resistor e no diodo é…', ['A mesma', 'Sempre zero', 'O dobro no resistor', 'Independente em cada peça'], 0, 'Em série há um único caminho de corrente, portanto as correntes são iguais.'),
        tf('A soma das quedas de tensão em uma malha fechada é igual à tensão da fonte ideal.', true, 'A lei das malhas impõe $V_S=V_R+V_D$ neste circuito.'),
        medir(), conta(),
        num(t`Uma fonte de $5,7\,\text{V}$ alimenta diodo direto e $1\,\text{k}\Omega$. Pela segunda aproximação, qual a potência do diodo em mW, com uma casa decimal?`, 3.5, t`$I=(5,7-0,7)/1000=5\,\text{mA}$ e $P_D=0,7\cdot5=3,5\,\text{mW}$.`, { unit: 'mW', tol: 0.05 }),
        ajustar(5), ajustar(20),
      ] },
      { card: { title: 'Reta de carga e projeto', body: t`A reta de carga $I_D=(V_S-V_D)/R$ liga os interceptos $(V_S,\,0)$ e $(0,\,V_S/R)$. Sua interseção com a curva do diodo determina o ponto Q. Para limitar a corrente, escolha $R\approx(V_S-0,7)/I_D$ e confira potência e PIV.`, visual: lab() }, exercises: [
        mcq('Na reta de carga, quando $I_D=0$, qual é $V_D$?', ['$V_S$', '$0$ sempre', '$R$', '$1/R$'], 0, 'Pela malha $V_S=V_D+I_DR$; com corrente zero, $V_D=V_S$.'),
        tf('Aumentar o resistor reduz o intercepto de corrente $V_S/R$.', true, 'Com a mesma fonte, dividir por uma resistência maior reduz o intercepto de corrente.'),
        medir(), conta(),
        num(t`Com fonte de $8\,\text{V}$ e resistor de $400\,\Omega$, qual é o intercepto da reta de carga em $V_D=0$, em mA, com uma casa decimal?`, 20, t`No intercepto, $I_D=V_S/R=8/400=0,020\,\text{A}=20,0\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }),
        ajustar(10), inverter(),
      ] },
    ] },
  ],
};
