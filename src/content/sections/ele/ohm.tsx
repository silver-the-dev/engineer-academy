import type { UnitDef } from '../../types';
import { gen, mcq, num, tf, near } from '../../helpers';
import { circuit, circuitEx, circuitVisual, R, V, wires } from '../../circuits';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;

// Um único resistor ôhmico, com a fonte positiva ligada ao primeiro terminal.
const malha = (volts: number, ohms: number, hidden = false) => circuit(
  V('fonte', [0, 0], [0, 3], volts, { fixed: true, locked: true }),
  wires([0, 0], [1, 0]),
  R('r', [1, 0], [4, 0], ohms, { label: 'R', hidden, locked: true, min: 10, max: 1000, show: ['v', 'i'] }),
  wires([4, 0], [5, 0], [5, 3], [0, 3]),
);
const visual = (v: number, r: number, hidden = false) => circuitVisual({ comps: malha(v, r, hidden), mode: 'view' });
const ajustar = (volts: number, inicial: number, alvo: number, texto: string, explicacao: string) => circuitEx(
  texto, { comps: malha(volts, inicial), mode: 'adjust' },
  (v) => near(v.i('r'), volts / alvo, volts / alvo * 0.02),
  t`Corrente próxima de $${fmt(volts / alvo)}\,\text{A}$.`, explicacao, { set: { r: alvo } },
);
const medir = (volts: number, ohms: number) => num(
  t`Meça a tensão e a corrente no resistor desconhecido. Calcule sua resistência em $\Omega$, sem casas decimais.`,
  ohms, t`$R=V/I=${volts}/${fmt(volts / ohms)}=${ohms}\,\Omega$.`,
  { unit: 'Ω', tol: ohms * 0.02, visual: visual(volts, ohms, true) },
);

export const leiOhm: UnitDef = {
  id: 'el-ohm', title: 'Lei de Ohm e potência', icon: '⚡',
  subtitle: 'Tensão, corrente, resistência, potência e consumo',
  source: 'Eletricidade Aplicada · Lei de Ohm e Lista 1 de Exercícios',
  guide: t`Para um resistor ôhmico a temperatura constante: $V=RI$, $I=V/R$ e $R=V/I$. A potência absorvida é $P=VI=RI^2=V^2/R$. Em potência constante, $E=P\Delta t$: use kW e h para obter kWh. $1\,\text{kWh}=3{,}6\times10^6\,\text{J}$.`,
  lessons: [
    { id: 'el-ohm-lei', title: 'Lei de Ohm', parts: [
      {
        card: { title: 'Tensão e corrente', body: t`Em um resistor ôhmico, a tensão e a corrente são proporcionais: $V=RI$. Use volts, ohms e ampères. Toque no resistor para ver as leituras.`, visual: visual(12, 100) },
        exercises: [
          mcq(t`Qual relação vale para um resistor ôhmico?`, [t`$V=RI$`, t`$V=R/I$`, t`$V=I/R$`, t`$V=R+I$`], 0, t`A lei de Ohm é $V=RI$.`),
          num(t`Um resistor de $10\,\Omega$ conduz $2\,\text{A}$. Calcule a tensão em V, sem casas decimais.`, 20, t`$V=RI=10\cdot2=20\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
          gen((rng) => { const r = randInt(rng, 2, 9); const i = randInt(rng, 2, 5); return num(t`Um resistor de $${r}\,\Omega$ conduz $${i}\,\text{A}$. Calcule a tensão em V, sem casas decimais.`, r*i, t`$V=RI=${r}\cdot${i}=${r*i}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
          medir(12, 100),
          ajustar(12, 100, 200, t`Ajuste o resistor para a corrente ser aproximadamente $60\,\text{mA}$.`, t`$R=12/0{,}060=200\,\Omega$.`),
          ajustar(12, 200, 100, t`Ajuste o resistor para a corrente ser aproximadamente $120\,\text{mA}$.`, t`$R=12/0{,}120=100\,\Omega$.`),
          tf(t`Com resistência fixa, dobrar a tensão dobra a corrente.`, true, t`Como $I=V/R$, com $R$ constante a corrente é proporcional à tensão.`),
        ],
      },
      {
        card: { title: 'Isole a incógnita', body: t`Para achar a corrente, $I=V/R$; para achar a resistência, $R=V/I$. Converta $1\,\text{k}\Omega=1000\,\Omega$ e $1\,\text{mA}=0{,}001\,\text{A}$.` },
        exercises: [
          num(t`Em $6\,\text{V}$ e $3\,\Omega$, calcule a corrente em A, sem casas decimais.`, 2, t`$I=6/3=2\,\text{A}$.`, { unit: 'A', tol: 0.5 }),
          num(t`Um resistor recebe $12\,\text{V}$ e conduz $3\,\text{A}$. Calcule $R$ em $\Omega$, sem casas decimais.`, 4, t`$R=12/3=4\,\Omega$.`, { unit: 'Ω', tol: 0.5 }),
          gen((rng) => { const i = randInt(rng, 2, 8); return num(t`Um resistor de $1\,\text{k}\Omega$ recebe $${i}\,\text{V}$. Calcule a corrente em mA, sem casas decimais.`, i, t`$I=${i}/1000\,\text{A}=${i}\,\text{mA}$.`, { unit: 'mA', tol: 0.5 }); }),
          medir(9, 300),
          ajustar(9, 100, 300, t`Ajuste para obter aproximadamente $30\,\text{mA}$.`, t`$R=9/0{,}030=300\,\Omega$.`),
          ajustar(9, 300, 150, t`Ajuste para obter aproximadamente $60\,\text{mA}$.`, t`$R=9/0{,}060=150\,\Omega$.`),
          tf(t`Para tensão fixa, aumentar a resistência reduz a corrente.`, true, t`Em $I=V/R$, aumentar o denominador reduz $I$.`),
        ],
      },
    ] },
    { id: 'el-ohm-graf', title: 'Curva tensão × corrente', parts: [
      {
        card: { title: 'Uma reta pela origem', body: t`Num gráfico de $V$ no eixo vertical por $I$ no horizontal, um resistor ôhmico tem reta pela origem. Sua inclinação $\Delta V/\Delta I$ é $R$. No circuito, altere o resistor e compare as leituras.`, visual: circuitVisual({ comps: malha(12, 100), mode: 'adjust' }) },
        exercises: [
          tf(t`A curva $V\times I$ de um resistor ôhmico ideal passa pela origem.`, true, t`$V=RI$ dá $V=0$ quando $I=0$.`),
          mcq(t`No gráfico de $V$ vertical contra $I$ horizontal, a inclinação representa…`, ['resistência', 'potência', 'energia', 'tempo'], 0, t`$\Delta V/\Delta I=R$.`),
          gen((rng) => { const r = randInt(rng, 2, 9); return num(t`Uma reta $V\times I$ passa pela origem e por $I=2\,\text{A}$, $V=${2*r}\,\text{V}$. Ache a inclinação em $\Omega$, sem casas decimais.`, r, t`$R=\Delta V/\Delta I=${2*r}/2=${r}\,\Omega$.`, { unit: 'Ω', tol: 0.5 }); }),
          medir(12, 200),
          ajustar(12, 100, 400, t`Ajuste a resistência para que a corrente em $12\,\text{V}$ seja $30\,\text{mA}$.`, t`A inclinação desejada é $R=12/0{,}030=400\,\Omega$.`),
          ajustar(12, 400, 200, t`Ajuste para que a corrente em $12\,\text{V}$ seja $60\,\text{mA}$.`, t`$R=12/0{,}060=200\,\Omega$.`),
          tf(t`No gráfico $V\times I$, entre resistores ôhmicos, a reta mais inclinada representa maior resistência.`, true, t`A inclinação é $R=\Delta V/\Delta I$.`),
        ],
      },
      {
        card: { title: 'Compare pontos e eixos', body: t`Se a temperatura e a resistência não mudam, $V/I$ é igual em qualquer ponto com corrente não nula. Invertendo os eixos, a inclinação de $I\times V$ passa a ser $1/R$, a condutância.` },
        exercises: [
          num(t`Uma reta passa por $2\,\text{A}$ e $8\,\text{V}$. Qual é $R$ em $\Omega$, sem casas decimais?`, 4, t`$R=8/2=4\,\Omega$.`, { unit: 'Ω', tol: 0.5 }),
          tf(t`Se a curva $V\times I$ não é uma reta pela origem, a resistência $V/I$ não é constante em todos os pontos de corrente não nula.`, true, t`Uma razão constante implicaria $V=RI$, uma reta pela origem.`),
          gen((rng) => { const r = randInt(rng, 2, 8); return num(t`Uma reta ôhmica tem inclinação $${r}\,\Omega$. Qual é $V$ em $3\,\text{A}$? Responda em V, sem casas decimais.`, 3*r, t`$V=RI=${r}\cdot3=${3*r}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
          medir(6, 200),
          ajustar(6, 100, 200, t`Ajuste o resistor para o ponto $V=6\,\text{V}$ e $I=30\,\text{mA}$.`, t`$R=6/0{,}030=200\,\Omega$.`),
          ajustar(6, 200, 100, t`Ajuste o resistor para o ponto $V=6\,\text{V}$ e $I=60\,\text{mA}$.`, t`$R=6/0{,}060=100\,\Omega$.`),
          mcq(t`Com $I$ no eixo vertical e $V$ no horizontal, a inclinação de um resistor ôhmico é…`, [t`$1/R$`, t`$R$`, t`$R^2$`, t`$P$`], 0, t`Como $I=V/R$, a inclinação é $1/R$.`),
        ],
      },
    ] },
    { id: 'el-ohm-pot', title: 'Potência elétrica', parts: [
      {
        card: { title: 'Potência é energia por tempo', body: t`A potência elétrica absorvida é $P=VI$, em watts. Para um resistor, substitua $V=RI$: $P=RI^2$. As leituras do circuito permitem calcular as duas formas.`, visual: visual(12, 100) },
        exercises: [
          mcq(t`Qual é a unidade de potência?`, ['watt', 'joule', 'ohm', 'ampère'], 0, t`O watt mede joules por segundo.`),
          num(t`Uma carga recebe $12\,\text{V}$ e $2\,\text{A}$. Qual a potência em W, sem casas decimais?`, 24, t`$P=VI=12\cdot2=24\,\text{W}$.`, { unit: 'W', tol: 0.5 }),
          gen((rng) => { const i = randInt(rng, 2, 5); return num(t`Um resistor de $10\,\Omega$ conduz $${i}\,\text{A}$. Calcule a potência em W, sem casas decimais.`, 10*i*i, t`$P=RI^2=10\cdot${i}^2=${10*i*i}\,\text{W}$.`, { unit: 'W', tol: 0.5 }); }),
          medir(12, 100),
          ajustar(12, 100, 200, t`Ajuste o resistor para dissipar aproximadamente $0{,}72\,\text{W}$ com $12\,\text{V}$.`, t`$R=V^2/P=144/0{,}72=200\,\Omega$; a corrente é $0{,}06\,\text{A}$.`),
          ajustar(12, 200, 100, t`Ajuste o resistor para dissipar aproximadamente $1{,}44\,\text{W}$ com $12\,\text{V}$.`, t`$R=144/1{,}44=100\,\Omega$; a corrente é $0{,}12\,\text{A}$.`),
          tf(t`Num resistor fixo, dobrar a corrente quadruplica a potência.`, true, t`$P=RI^2$: dobrar $I$ multiplica $I^2$ por 4.`),
        ],
      },
      {
        card: { title: 'Use os dados disponíveis', body: t`Para resistor ôhmico, $P=VI=RI^2=V^2/R$. Escolha a expressão pelas grandezas conhecidas; respeite também a potência nominal do componente.` },
        exercises: [
          num(t`Um resistor de $4\,\Omega$ recebe $8\,\text{V}$. Calcule a potência em W, sem casas decimais.`, 16, t`$P=V^2/R=8^2/4=16\,\text{W}$.`, { unit: 'W', tol: 0.5 }),
          tf(t`A tensão fixa, dobrar a resistência reduz à metade a potência dissipada.`, true, t`$P=V^2/R$; dobrar $R$ divide $P$ por 2.`),
          gen((rng) => { const v = 2*randInt(rng, 2, 8); return num(t`Um resistor de $4\,\Omega$ recebe $${v}\,\text{V}$. Calcule sua potência em W, sem casas decimais.`, v*v/4, t`$P=V^2/R=${v}^2/4=${v*v/4}\,\text{W}$.`, { unit: 'W', tol: 0.5 }); }),
          medir(10, 200),
          ajustar(10, 100, 200, t`Ajuste para dissipar $0{,}5\,\text{W}$ sob $10\,\text{V}$.`, t`$R=10^2/0{,}5=200\,\Omega$ e $I=50\,\text{mA}$.`),
          ajustar(10, 200, 100, t`Ajuste para dissipar $1\,\text{W}$ sob $10\,\text{V}$.`, t`$R=10^2/1=100\,\Omega$ e $I=100\,\text{mA}$.`),
          mcq(t`Um resistor dissipa $2\,\text{W}$. Qual potência nominal é adequada entre as opções?`, [t`$3\,\text{W}$`, t`$1\,\text{W}$`, t`$0{,}5\,\text{W}$`, t`$0{,}25\,\text{W}$`], 0, t`A potência nominal deve superar a dissipação prevista; $3\,\text{W}>2\,\text{W}$.`),
        ],
      },
    ] },
    { id: 'el-ohm-energia', title: 'Energia e efeito Joule', parts: [
      {
        card: { title: 'Da potência à energia', body: t`Para potência constante, $E=P\Delta t$. Em watts e segundos, obtenha joules; em quilowatts e horas, obtenha kWh. Um resistor transforma energia elétrica em energia térmica pelo efeito Joule.`, visual: visual(10, 100) },
        exercises: [
          num(t`Um aparelho de $2\,\text{kW}$ funciona por $3\,\text{h}$. Calcule a energia em kWh, sem casas decimais.`, 6, t`$E=2\cdot3=6\,\text{kWh}$.`, { unit: 'kWh', tol: 0.5 }),
          tf(t`O kWh é uma unidade de energia.`, true, t`É o produto de potência por tempo, logo mede energia.`),
          gen((rng) => { const h = randInt(rng, 2, 8); return num(t`Uma carga de $500\,\text{W}$ opera por $${h}\,\text{h}$. Calcule a energia em kWh, com uma casa decimal.`, h/2, t`$500\,\text{W}=0{,}5\,\text{kW}$; $E=0{,}5\cdot${h}=${fmt(h/2)}\,\text{kWh}$.`, { unit: 'kWh', tol: 0.05 }); }),
          medir(10, 100),
          ajustar(10, 100, 200, t`Para dissipar $1\,\text{J}$ em $2\,\text{s}$ a $10\,\text{V}$, ajuste o resistor.`, t`$P=E/t=0{,}5\,\text{W}$ e $R=V^2/P=200\,\Omega$; $I=50\,\text{mA}$.`),
          ajustar(10, 200, 100, t`Para dissipar $2\,\text{J}$ em $2\,\text{s}$ a $10\,\text{V}$, ajuste o resistor.`, t`$P=2/2=1\,\text{W}$ e $R=100/1=100\,\Omega$; $I=100\,\text{mA}$.`),
          num(t`Um resistor dissipa $5\,\text{W}$ por $10\,\text{s}$. Calcule a energia em J, sem casas decimais.`, 50, t`$E=Pt=5\cdot10=50\,\text{J}$.`, { unit: 'J', tol: 0.5 }),
        ],
      },
      {
        card: { title: 'Joule, consumo e custo', body: t`$1\,\text{Wh}=3600\,\text{J}$ e $1\,\text{kWh}=3{,}6\times10^6\,\text{J}$. Para custo de energia, multiplique o consumo em kWh pela tarifa em reais por kWh. Em resistor, $E=RI^2\Delta t$.` },
        exercises: [
          num(t`Quantos joules há em $1\,\text{Wh}$? Responda em J, sem casas decimais.`, 3600, t`$1\,\text{W}=1\,\text{J/s}$ e $1\,\text{h}=3600\,\text{s}$, então $1\,\text{Wh}=3600\,\text{J}$.`, { unit: 'J', tol: 0.5 }),
          mcq(t`Qual conversão representa $1\,\text{kWh}$?`, [t`$3{,}6\times10^6\,\text{J}$`, t`$3600\,\text{J}$`, t`$1000\,\text{J}$`, t`$3{,}6\,\text{J}$`], 0, t`$1000\,\text{W}\cdot3600\,\text{s}=3{,}6\times10^6\,\text{J}$.`),
          gen((rng) => { const h = randInt(rng, 2, 8); return num(t`Um aquecedor de $2\,\text{kW}$ funciona por $${h}\,\text{h}$. A tarifa é R\$ 1 por kWh. Calcule o custo em reais, sem casas decimais.`, 2*h, t`$E=2\cdot${h}=${2*h}\,\text{kWh}$; custo $=${2*h}\cdot1=\text{R}\$ ${2*h}$.`, { unit: 'R$', tol: 0.5 }); }),
          medir(12, 300),
          ajustar(12, 100, 300, t`Ajuste o resistor para dissipar $1{,}44\,\text{J}$ em $3\,\text{s}$ com $12\,\text{V}$.`, t`$P=1{,}44/3=0{,}48\,\text{W}$; $R=144/0{,}48=300\,\Omega$ e $I=40\,\text{mA}$.`),
          ajustar(12, 300, 150, t`Ajuste o resistor para dissipar $2{,}88\,\text{J}$ em $3\,\text{s}$ com $12\,\text{V}$.`, t`$P=2{,}88/3=0{,}96\,\text{W}$; $R=144/0{,}96=150\,\Omega$ e $I=80\,\text{mA}$.`),
          num(t`Um resistor de $5\,\Omega$ conduz $2\,\text{A}$ por $3\,\text{s}$. Calcule a energia térmica em J, sem casas decimais.`, 60, t`$E=RI^2t=5\cdot2^2\cdot3=60\,\text{J}$.`, { unit: 'J', tol: 0.5 }),
        ],
      },
    ] },
  ],
};
