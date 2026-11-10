import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, tf } from '../../helpers';
import { circuit, circuitEx, circuitVisual, LAMP, SW, V, wires } from '../../circuits';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;

// Lâmpada resistiva idealizada: 6 V / 12 Ω = 0,5 A com a chave fechada.
const lampada = (ligada: boolean) => circuit(
  V('fonte', [0, 0], [0, 3], 6, { fixed: true, locked: true }),
  wires([0, 0], [1, 0]), SW('ch', [1, 0], [3, 0], ligada, { locked: true }),
  wires([3, 0], [5, 0]), LAMP('lamp', [5, 0], [5, 3], 12, { fixed: true, locked: true }),
  wires([5, 3], [0, 3]),
);
const visual = (ligada = true) => circuitVisual({ comps: lampada(ligada), mode: 'view' });
const acender = () => circuitEx('Feche a chave para acender a lâmpada.', { comps: lampada(false), mode: 'view' },
  v => v.ok && v.on('lamp') && v.i('lamp') > 0.49, 'Feche a chave.',
  t`A chave fechada completa o caminho; $I=6/12=0,5\,\text{A}$ e a lâmpada acende.`, { on: { ch: true } });
const apagar = () => circuitEx('Abra a chave para interromper a corrente e apagar a lâmpada.', { comps: lampada(true), mode: 'view' },
  v => v.ok && !v.on('lamp') && Math.abs(v.i('lamp')) < 0.001, 'Abra a chave.',
  'A chave aberta interrompe o caminho; a corrente na lâmpada fica nula.', { on: { ch: false } });
const leitura = () => num(t`Com a chave fechada, toque na lâmpada e leia a corrente no simulador. Responda em A, com uma casa decimal.`, 0.5,
  t`A leitura é $0,5\,\text{A}$: $I=6\,\text{V}/12\,\Omega$.`, { unit: 'A', tol: 0.05, visual: visual() });
const reta = { name: 'numberline', props: { min: 0, max: 9, step: 1, value: 0 } };

export const grandezas: UnitDef = {
  id: 'el-base', title: 'Grandezas elétricas', icon: '🔋',
  subtitle: 'Carga, tensão, resistência e medições',
  source: 'Eletricidade Aplicada · Lei de Ohm; Eletrônica I · Aula 2; Análise de Circuitos I · Aulas 1 e 2',
  guide: t`Corrente média: $I=\Delta Q/\Delta t$. Tensão: $V=W/q$. Em um resistor ôhmico, $V=RI$ e $R=\rho L/A$. Voltímetro em paralelo; amperímetro em série. No código de quatro faixas, leia dois dígitos, multiplicador e tolerância.`,
  lessons: [
    { id: 'el-base-carga', title: 'Carga e corrente elétrica', parts: [
      { card: { title: 'Carga em movimento', body: t`Carga elétrica é medida em coulombs ($\text{C}$). Cargas de mesmo sinal se repelem e de sinais opostos se atraem. A corrente média mede a carga que atravessa uma seção por tempo: $I=\Delta Q/\Delta t$, em ampères ($1\,\text{A}=1\,\text{C/s}$).`, visual: visual(false) }, exercises: [
        mcq('Qual unidade mede carga elétrica?', ['Coulomb', 'Volt', 'Ohm', 'Watt'], 0, 'Carga é medida em coulombs; volt mede tensão e ohm, resistência.'),
        tf('Cargas de sinais opostos se atraem.', true, 'Cargas de sinais opostos se atraem; cargas de mesmo sinal se repelem.'),
        num(t`Passam $6\,\text{C}$ em $3\,\text{s}$. Qual a corrente média em A, com uma casa decimal?`, 2, t`$I=6/3=2,0\,\text{A}$.`, { unit: 'A', tol: 0.05 }),
        gen(rng => { const n = randInt(rng, 2, 8); return num(t`Passam $${n * 2}\,\text{C}$ em $2\,\text{s}$. Calcule a corrente média em A, com uma casa decimal.`, n, t`$I=${n * 2}/2=${n}\,\text{A}$.`, { unit: 'A', tol: 0.05 }); }),
        leitura(), acender(), apagar(),
      ] },
      { card: { title: 'Sentido e caminho fechado', body: 'O sentido convencional da corrente no circuito externo vai do terminal positivo ao negativo da fonte. Em metais, elétrons se deslocam no sentido oposto. Uma chave aberta interrompe o caminho.', visual: visual() }, exercises: [
        mcq('No circuito externo, qual é o sentido convencional da corrente?', ['Do positivo para o negativo', 'Do negativo para o positivo', 'Sempre para cima', 'Não existe sentido'], 0, 'Por convenção, a corrente externa sai do terminal positivo e retorna ao negativo.'),
        tf('Em um fio metálico, o movimento dos elétrons é oposto ao sentido convencional.', true, 'Elétrons têm carga negativa e seu movimento é oposto ao sentido convencional.'),
        gen(rng => { const i = randInt(rng, 1, 5); return num(t`Uma corrente constante de $${i}\,\text{A}$ passa por $4\,\text{s}$. Qual carga passa, em C, com uma casa decimal?`, i * 4, t`$Q=It=${i}\cdot4=${i * 4}\,\text{C}$.`, { unit: 'C', tol: 0.05 }); }),
        mcq('O que ocorre com a corrente da lâmpada quando a chave em série abre?', ['Cai a zero', 'Dobra', 'Inverte', 'Permanece igual'], 0, 'O caminho fica aberto, impedindo a corrente estacionária na lâmpada.'),
        leitura(), apagar(), acender(),
      ] },
    ] },
    { id: 'el-base-tensao', title: 'Tensão e fontes', parts: [
      { card: { title: 'Energia por carga', body: t`Tensão entre dois pontos é diferença de potencial elétrico: energia transferida por unidade de carga, $V=W/q$. Um volt equivale a um joule por coulomb. A polaridade indica a ordem dos pontos.`, visual: visual() }, exercises: [
        mcq('Qual é a unidade de tensão?', ['Volt', 'Coulomb', 'Ampère', 'Ohm'], 0, 'Tensão é medida em volts.'),
        tf(t`$1\,\text{V}$ equivale a $1\,\text{J/C}$.`, true, 'Volt é joule por coulomb, isto é, energia por carga.'),
        num(t`Uma fonte transfere $12\,\text{J}$ a $2\,\text{C}$. Qual a tensão em V, com uma casa decimal?`, 6, t`$V=W/q=12/2=6,0\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        gen(rng => { const v = randInt(rng, 2, 9); return num(t`Uma fonte transfere $${v * 3}\,\text{J}$ a $3\,\text{C}$. Calcule a tensão em V, com uma casa decimal.`, v, t`$V=${v * 3}/3=${v}\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
        leitura(), acender(), apagar(),
      ] },
      { card: { title: 'Fontes e polaridade', body: 'Uma fonte de tensão ideal mantém a diferença de potencial especificada entre seus terminais. Uma pilha real possui limitações internas. Trocar as pontas do voltímetro inverte o sinal da leitura.', visual: visual() }, exercises: [
        mcq('Uma fonte ideal de tensão mantém qual grandeza entre seus terminais?', ['Diferença de potencial', 'Corrente fixa em qualquer carga', 'Resistência da carga', 'Carga total nula'], 0, 'A fonte ideal mantém sua tensão; a corrente depende do circuito.'),
        tf('Invertendo as pontas de um voltímetro CC, a leitura muda de sinal.', true, 'A diferença de potencial é orientada: inverter os pontos troca seu sinal.'),
        gen(rng => { const v = randInt(rng, 2, 9); return num(t`Uma carga de $2\,\text{C}$ atravessa uma diferença de potencial de $${v}\,\text{V}$. Qual a energia transferida em J, com uma casa decimal?`, 2 * v, t`$W=qV=2\cdot${v}=${2 * v}\,\text{J}$.`, { unit: 'J', tol: 0.05 }); }),
        mcq('Uma pilha ideal de 6 V tem terminal positivo a 6 V acima do negativo. Quanto vale V(negativo) − V(positivo)?', [t`$-6\,\text{V}$`, t`$6\,\text{V}$`, t`$0\,\text{V}$`, t`$12\,\text{V}$`], 0, 'Ao inverter a ordem da subtração, o sinal muda: −6 V.'),
        leitura(), apagar(), acender(),
      ] },
    ] },
    { id: 'el-base-resist', title: 'Resistência e resistividade', parts: [
      { card: { title: 'Resistência elétrica', body: t`A resistência relaciona tensão e corrente em um resistor ôhmico: $R=V/I$, em ohms ($\Omega$). Em temperatura constante, dobrar a tensão dobra a corrente nesse modelo.`, visual: visual() }, exercises: [
        mcq('Qual unidade mede resistência?', ['Ohm', 'Ampère', 'Coulomb', 'Joule'], 0, 'A resistência é medida em ohms.'),
        tf('Num resistor ôhmico com resistência constante, dobrar a tensão dobra a corrente.', true, 'De V = RI, com R constante, I é proporcional a V.'),
        num(t`Um resistor recebe $6\,\text{V}$ e conduz $2\,\text{A}$. Determine R em Ω, com uma casa decimal.`, 3, t`$R=V/I=6/2=3,0\,\Omega$.`, { unit: 'Ω', tol: 0.05 }),
        gen(rng => { const r = randInt(rng, 2, 9); return num(t`Um resistor conduz $2\,\text{A}$ sob $${2 * r}\,\text{V}$. Determine R em Ω, com uma casa decimal.`, r, t`$R=${2 * r}/2=${r}\,\Omega$.`, { unit: 'Ω', tol: 0.05 }); }),
        leitura(), acender(), apagar(),
      ] },
      { card: { title: 'Material e geometria', body: t`Para fio uniforme, $R=\rho L/A$: $\rho$ é resistividade em $\Omega\cdot\text{m}$, $L$ é comprimento e $A$ é área da seção. A resistividade depende do material e da temperatura.`, visual: visual() }, exercises: [
        mcq('Ao dobrar o comprimento de um fio uniforme, mantendo material e área, sua resistência...', ['Dobra', 'Cai à metade', 'Não muda', 'Quadruplica'], 0, 'Em R = ρL/A, R é proporcional a L.'),
        tf('Dobrando a área da seção de um fio, mantendo o restante, sua resistência cai à metade.', true, 'A área está no denominador de R = ρL/A.'),
        num(t`Um fio tem $\rho=2\,\Omega\cdot\text{m}$, $L=3\,\text{m}$ e $A=2\,\text{m}^2$. Qual R em Ω, com uma casa decimal?`, 3, t`$R=2\cdot3/2=3,0\,\Omega$. Os valores são didáticos.`, { unit: 'Ω', tol: 0.05 }),
        gen(rng => { const l = randInt(rng, 2, 9); return num(t`Para $\rho=2\,\Omega\cdot\text{m}$, $A=2\,\text{m}^2$ e $L=${l}\,\text{m}$, determine R em Ω, com uma casa decimal.`, l, t`$R=2\cdot${l}/2=${l}\,\Omega$.`, { unit: 'Ω', tol: 0.05 }); }),
        leitura(), apagar(), acender(),
      ] },
    ] },
    { id: 'el-base-cores', title: 'Resistores reais e código de cores', parts: [
      { card: { title: 'Dígitos e multiplicador', body: t`No código de quatro faixas, as duas primeiras são dígitos, a terceira é multiplicador e a quarta tolerância. Leia a partir da faixa mais próxima de uma ponta; a tolerância costuma ficar mais afastada. Dígitos: preto 0, marrom 1, vermelho 2, laranja 3, amarelo 4, verde 5, azul 6, violeta 7, cinza 8, branco 9. Multiplicador dessas cores: $10^n$; ouro é $0,1$ e prata $0,01$.`, visual: reta }, exercises: [
        mcq('Qual dígito corresponde ao vermelho?', ['2', '1', '3', '4'], 0, 'Vermelho representa o dígito 2.'),
        inter('Arraste até o dígito da faixa laranja.', 'numberline', reta.props, (v: number) => v === 3, '3', 'Laranja corresponde ao dígito 3.'),
        mcq('Marrom, preto e vermelho nas três primeiras faixas representam qual valor nominal?', [t`$1\,\text{k}\Omega$`, t`$100\,\Omega$`, t`$10\,\text{k}\Omega$`, t`$120\,\Omega$`], 0, 'Marrom e preto formam 10; vermelho multiplica por 100: 1000 Ω.'),
        num(t`Vermelho, violeta e marrom: qual valor nominal em Ω, com uma casa decimal?`, 270, t`$27\times10=270\,\Omega$.`, { unit: 'Ω', tol: 0.05 }),
        gen(rng => { const n = randInt(rng, 1, 9); const nomes = ['preto', 'marrom', 'vermelho', 'laranja', 'amarelo', 'verde', 'azul', 'violeta', 'cinza', 'branco']; return num(t`Faixas ${nomes[n]}, preto, marrom: qual valor nominal em Ω, com uma casa decimal?`, n * 100, t`Os dígitos formam $${n * 10}$; marrom multiplica por $10$: $${n * 100}\,\Omega$.`, { unit: 'Ω', tol: 0.05 }); }),
        mcq('Amarelo, violeta e ouro representam:', [t`$4,7\,\Omega$`, t`$47\,\Omega$`, t`$470\,\Omega$`, t`$0,47\,\Omega$`], 0, 'Amarelo e violeta formam 47; ouro multiplica por 0,1: 4,7 Ω.'),
        tf('O terceiro anel é um multiplicador no código de quatro faixas.', true, 'O terceiro anel multiplica o número formado pelos dois primeiros.'),
      ] },
      { card: { title: 'Tolerância e valor real', body: t`A quarta faixa informa a tolerância em torno do valor nominal: ouro $\pm5\%$, prata $\pm10\%$, marrom $\pm1\%$, vermelho $\pm2\%$. A potência nominal é outro limite do componente e não é dada por essas quatro faixas.`, visual: reta }, exercises: [
        mcq('Qual tolerância indica a faixa ouro?', [t`$\pm5\%$`, t`$\pm1\%$`, t`$\pm2\%$`, t`$\pm10\%$`], 0, 'A quarta faixa ouro indica tolerância de ±5%.'),
        inter('Arraste até o percentual de tolerância da faixa prata.', 'numberline', { min: 0, max: 10, step: 1, value: 0 }, (v: number) => v === 10, '10%', 'Prata indica ±10%.'),
        mcq('Vermelho, vermelho, marrom, ouro: qual valor e tolerância?', [t`$220\,\Omega\ \pm5\%$`, t`$22\,\Omega\ \pm5\%$`, t`$220\,\Omega\ \pm10\%$`, t`$2,2\,\text{k}\Omega\ \pm5\%$`], 0, '22 vezes 10 é 220 Ω; ouro indica ±5%.'),
        num(t`Um resistor de $100\,\Omega$ com faixa ouro tem limite inferior de quantos Ω? Responda com uma casa decimal.`, 95, t`$5\%$ de $100$ é $5\,\Omega$; o limite inferior é $100-5=95\,\Omega$.`, { unit: 'Ω', tol: 0.05 }),
        gen(rng => { const n = randInt(rng, 1, 9); return num(t`Faixas ${['', 'marrom', 'vermelho', 'laranja', 'amarelo', 'verde', 'azul', 'violeta', 'cinza', 'branco'][n]}, preto, marrom, prata: qual valor nominal em Ω, com uma casa decimal?`, 100 * n, t`Os dígitos dão $${n * 10}$ e o multiplicador marrom é $10$: $${100 * n}\,\Omega$; prata indica $\pm10\%$.`, { unit: 'Ω', tol: 0.05 }); }),
        tf('A faixa de tolerância especifica a potência nominal do resistor.', false, 'Ela indica a faixa percentual de resistência; a potência nominal é uma especificação separada.'),
        num(t`Marrom, preto, vermelho, ouro: qual limite superior em Ω, com uma casa decimal?`, 1050, t`O nominal é $10\cdot100=1000\,\Omega$; com $+5\%$, o limite é $1050\,\Omega$.`, { unit: 'Ω', tol: 0.05 }),
      ] },
    ] },
    { id: 'el-base-medir', title: 'Multímetro e protoboard', parts: [
      { card: { title: 'Medir tensão e corrente', body: 'Selecione a função e a escala adequadas no multímetro. O voltímetro mede entre dois pontos em paralelo com a carga. Para corrente, abra o circuito e insira o amperímetro em série; nunca ligue o amperímetro diretamente entre os polos da fonte.', visual: visual() }, exercises: [
        mcq('Onde ligar um voltímetro para medir a tensão na lâmpada?', ['Em paralelo aos terminais da lâmpada', 'Em série com a lâmpada', 'Somente ao terminal positivo', 'No lugar da fonte'], 0, 'O voltímetro compara o potencial dos dois terminais da lâmpada.'),
        mcq('Onde inserir um amperímetro para medir a corrente da lâmpada?', ['Em série no caminho da corrente', 'Em paralelo diretamente com a fonte', 'Entre dois pontos isolados', 'Em paralelo com a lâmpada'], 0, 'Abre-se o caminho e insere-se o amperímetro em série.'),
        tf('Para medir resistência com o ohmímetro, o circuito deve estar desenergizado.', true, 'O ohmímetro aplica sua própria excitação; desenergize e isole o componente quando necessário.'),
        gen(rng => { const ma = randInt(rng, 1, 9) * 100; return num(t`O amperímetro mostra $${ma}\,\text{mA}$. Expresse em A, com uma casa decimal.`, ma / 1000, t`$${ma}\,\text{mA}=${ma}/1000=${fmt(ma / 1000, 1)}\,\text{A}$.`, { unit: 'A', tol: 0.05 }); }),
        leitura(), acender(), apagar(),
      ] },
      { card: { title: 'Protoboard e montagem', body: 'Na protoboard comum, grupos de cinco furos de cada lado do canal central são conectados internamente; o canal separa os dois lados. Barramentos laterais costumam ligar furos ao longo da placa, mas podem ser interrompidos: confira o modelo com continuidade e sem alimentação. Monte com a fonte desligada.', visual: visual(false) }, exercises: [
        mcq('Em uma protoboard comum, o canal central normalmente...', ['Separa os grupos de contatos dos dois lados', 'Liga todos os furos da placa', 'É o terminal positivo da fonte', 'Mede corrente'], 0, 'O canal separa os contatos de cada lado; um componente pode atravessá-lo.'),
        tf('Todo barramento lateral de qualquer protoboard é sempre contínuo de ponta a ponta.', false, 'Alguns barramentos são divididos; verifique a placa e a continuidade sem alimentação.'),
        mcq('Antes de montar ou alterar ligações em uma protoboard, qual procedimento é adequado?', ['Desligar a fonte', 'Colocar o amperímetro em paralelo com a fonte', 'Unir diretamente os polos da fonte', 'Escolher a escala de corrente e tocar os polos'], 0, 'Desligar a fonte reduz o risco de curto durante a montagem.'),
        gen(rng => { const n = randInt(rng, 2, 6); return num(t`Uma carga de $${n * 2}\,\text{C}$ atravessa um ramo em $2\,\text{s}$. Qual corrente o amperímetro em série mede em A, com uma casa decimal?`, n, t`$I=Q/t=${n * 2}/2=${n}\,\text{A}$.`, { unit: 'A', tol: 0.05 }); }),
        leitura(), apagar(), acender(),
      ] },
    ] },
  ],
};
