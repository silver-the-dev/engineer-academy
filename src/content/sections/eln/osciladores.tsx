import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, tf } from '../../helpers';
import { fnLab } from '../../visuals';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;

// As escalas dos gráficos são normalizadas ou estão indicadas nos enunciados.
const astavelLab = () => fnLab({
  view: { xMin: 0, xMax: 8, yMin: 0, yMax: 1.1 },
  params: [{ key: 'b', label: 'R_B (kΩ)', min: 1, max: 4, step: 1, value: 1 }],
  f: (x, p) => { const th = 0.693 * (1 + p.b); const tl = 0.693 * p.b; const z = x % (th + tl); return z < th ? 1 - (2 / 3) * Math.exp(-z / (1 + p.b)) : (2 / 3) * Math.exp(-(z - th) / p.b); },
  info: (p) => t`$R_A=1\,\text{k}\Omega$, $C=1\,\mu\text{F}$ · tempo em ms · $V_C/V_{CC}$ · $T\approx${fmt(0.693 * (1 + 2 * p.b), 2)}\,\text{ms}$`,
});
const monoLab = () => fnLab({
  view: { xMin: 0, xMax: 5, yMin: 0, yMax: 1.1 },
  params: [{ key: 'rc', label: 'RC (ms)', min: 1, max: 3, step: 1, value: 1 }],
  f: (x, p) => 1 - Math.exp(-x / p.rc),
  info: (p) => t`Carga após disparo: $V_C/V_{CC}$ · tempo em ms · limiar $2/3$ em $${fmt(Math.log(3) * p.rc, 2)}\,\text{ms}$`,
});
const senoLab = () => fnLab({
  view: { xMin: 0, xMax: 4, yMin: -2.2, yMax: 2.2 },
  params: [{ key: 'f', label: 'f (Hz)', min: 1, max: 3, step: 1, value: 1 }],
  f: (x, p) => 2 * Math.sin(2 * Math.PI * p.f * x),
  info: (p) => t`$v(t)=2\sin(2\pi ${p.f}t)\,\text{V}$ · tempo em segundos · $T=${fmt(1 / p.f, 2)}\,\text{s}$`,
});
const divisorLab = () => fnLab({
  view: { xMin: 0, xMax: 10, yMin: 0, yMax: 5.5 },
  params: [{ key: 'r', label: 'R inferior (kΩ)', min: 1, max: 9, step: 1, value: 1 }],
  f: (x, p) => x * p.r / (10 + p.r),
  info: (p) => t`$R_{sup}=10\,\text{k}\Omega$ · eixo horizontal: $V_{CC}$ em V · vertical: $V_o$ em V · $R_{inf}=${p.r}\,\text{k}\Omega$`,
});

export const osciladores: UnitDef = {
  id: 'ea-osc', title: 'Temporizadores, osciladores e sensores', icon: '⏱️',
  subtitle: '555, oscilação e leitura de sensores resistivos',
  source: 'Conteúdo complementar · Boylestad e Nashelsky, Dispositivos Eletrônicos e Teoria de Circuitos; Malvino e Bates, Eletrônica',
  extra: true,
  guide: t`No 555 astável convencional, $t_H=0{,}693(R_A+R_B)C$, $t_L=0{,}693R_BC$, $T=t_H+t_L$ e $f=1/T$. No monoestável, $t_p\approx1{,}1RC$. Em um oscilador, a realimentação positiva sustenta a oscilação; $T=1/f$. Num divisor sem carga, $V_o=V_{CC}R_{inf}/(R_{sup}+R_{inf})$. Uma ponte equilibrada tem tensões iguais nos pontos médios.`,
  lessons: [
    { id: 'ea-osc-555a', title: '555 astável', parts: [
      { card: { title: 'Carga e descarga repetidas', body: t`O 555 astável convencional alterna sozinho. O capacitor carrega por $R_A+R_B$ de $V_{CC}/3$ a $2V_{CC}/3$, com saída alta; depois descarrega por $R_B$ até $V_{CC}/3$, com saída baixa. O gráfico começa no regime periódico, após a partida.

$t_H=0{,}693(R_A+R_B)C$ e $t_L=0{,}693R_BC$. Use resistências em ohms e capacitância em farads para obter segundos.`, visual: astavelLab() }, exercises: [
        mcq('No astável, qual componente armazena carga entre as comutações?', ['Capacitor', 'Fusível', 'Transformador', 'Chave manual'], 0, 'O capacitor armazena carga e sua tensão determina as comutações.'),
        tf(t`No regime periódico, a descarga termina em $V_{CC}/3$.`, true, t`O comparador de disparo comuta no limiar inferior $V_{CC}/3$.`),
        mcq(t`Durante a carga do astável convencional, a saída está…`, ['alta', 'baixa', 'sempre desligada', 'em alta impedância'], 0, 'Durante a carga entre os limiares, o transistor de descarga está desligado e a saída está alta.'),
        num(t`Com $V_{CC}=9\,\text{V}$, qual o limiar superior em V? Dê uma casa decimal.`, 6, t`$2V_{CC}/3=2\cdot9/3=6\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        gen((rng) => { const v = randInt(rng, 2, 5) * 3; return num(t`Se $V_{CC}=${v}\,\text{V}$, qual o limiar inferior em V? Dê uma casa decimal.`, v / 3, t`$V_{CC}/3=${v}/3=${v / 3}\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
        inter(t`No gráfico, ajuste $R_B$ para $3\,\text{k}\Omega$ e observe o período crescer.`, 'plot', astavelLab().props, (v: any) => v?.p.b === 3, t`$R_B=3\,\text{k}\Omega$`, t`Com $R_A=1\,\text{k}\Omega$, $T=0{,}693(1+2\cdot3)\approx4{,}85\,\text{ms}$.`),
        num(t`Para $R_A=2\,\text{k}\Omega$, $R_B=3\,\text{k}\Omega$ e $C=1\,\mu\text{F}$, calcule $t_H$ em ms, com duas casas.`, 3.465, t`$t_H=0{,}693(2+3)\cdot1=3{,}465\,\text{ms}\approx3{,}47\,\text{ms}$.`, { unit: 'ms', tol: 0.005 }),
      ] },
      { card: { title: 'Período e ciclo de trabalho', body: t`O período é $T=0{,}693(R_A+2R_B)C$ e a frequência é $f=1/T$. A fração de tempo em nível alto é $D=t_H/T=(R_A+R_B)/(R_A+2R_B)$.

Para $R_A,R_B>0$, o circuito convencional sem diodo tem $D>50\%$. As equações aproximam componentes ideais e desprezam atrasos.`, }, exercises: [
        mcq('A frequência é o inverso de qual grandeza?', ['Período', 'Tensão', 'Resistência', 'Carga'], 0, t`Por definição, $f=1/T$.`),
        tf(t`No astável convencional sem diodo, com resistores positivos, $t_H>t_L$.`, true, t`A carga inclui $R_A$ além de $R_B$; a descarga usa apenas $R_B$.`),
        num(t`Uma onda tem período $20\,\text{ms}$. Qual a frequência em Hz? Dê uma casa decimal.`, 50, t`$T=0{,}020\,\text{s}$ e $f=1/0{,}020=50\,\text{Hz}$.`, { unit: 'Hz', tol: 0.05 }),
        num(t`Uma saída fica alta por $6\,\text{ms}$ em cada período de $10\,\text{ms}$. Qual o ciclo de trabalho em %, com uma casa decimal?`, 60, t`$D=6/10=0{,}60=60\%$.`, { unit: '%', tol: 0.05 }),
        gen((rng) => { const a = randInt(rng, 1, 4); const b = randInt(rng, 1, 4); const period = 0.693 * (a + 2 * b); return num(t`No astável, $R_A=${a}\,\text{k}\Omega$, $R_B=${b}\,\text{k}\Omega$ e $C=1\,\mu\text{F}$. Calcule $T$ em ms, com duas casas.`, period, t`$T=0{,}693(${a}+2\cdot${b})=${fmt(period, 3)}\,\text{ms}\approx${fmt(period, 2)}\,\text{ms}$.`, { unit: 'ms', tol: 0.005 }); }),
        tf(t`Dobrar $C$, sem alterar os resistores, reduz a frequência ideal à metade.`, true, t`Como $T$ é proporcional a $C$, o período dobra e $f=1/T$ cai à metade.`),
        num(t`Com $R_A=R_B$, qual o ciclo de trabalho ideal em %, com uma casa decimal?`, 100 * 2 / 3, t`$D=(R_A+R_B)/(R_A+2R_B)=2/3\approx66{,}7\%$.`, { unit: '%', tol: 0.05 }),
      ] },
    ] },
    { id: 'ea-osc-555m', title: '555 monoestável', parts: [
      { card: { title: 'Um pulso por disparo', body: t`O monoestável tem um estado estável de saída baixa. Um disparo negativo que cruza $V_{CC}/3$ inicia um pulso alto; o capacitor, inicialmente descarregado, carrega por $R$. Ao atingir $2V_{CC}/3$, a saída volta a ficar baixa e o capacitor descarrega.

A duração ideal é $t_p=RC\ln 3\approx1{,}1RC$. No gráfico, tempo em ms e tensão normalizada; considere o disparo encerrado antes do fim do pulso.`, visual: monoLab() }, exercises: [
        mcq('Quantos estados estáveis possui o monoestável?', ['Um', 'Dois', 'Nenhum', 'Três'], 0, 'Monoestável significa um estado estável; o outro é temporário.'),
        tf('Um disparo válido inicia um pulso temporário na saída.', true, 'O disparo coloca a saída em nível alto até o capacitor atingir o limiar superior.'),
        mcq(t`O pulso termina quando a tensão do capacitor atinge…`, [t`$2V_{CC}/3$`, t`$V_{CC}/3$`, t`$V_{CC}$`, t`$0\,\text{V}$`], 0, t`O comparador de limiar responde a $2V_{CC}/3$ e reinicia o circuito.`),
        num(t`Se $R=10\,\text{k}\Omega$ e $C=10\,\mu\text{F}$, estime o pulso em ms usando $1{,}1RC$, com uma casa decimal.`, 110, t`$1{,}1\cdot10000\cdot10^{-5}=0{,}11\,\text{s}=110\,\text{ms}$.`, { unit: 'ms', tol: 0.05 }),
        gen((rng) => { const r = randInt(rng, 1, 9); return num(t`Para $R=${r}\,\text{k}\Omega$ e $C=1\,\mu\text{F}$, estime o pulso em ms por $1{,}1RC$, com uma casa decimal.`, 1.1 * r, t`$t_p\approx1{,}1\cdot${r}\cdot1=${fmt(1.1 * r, 1)}\,\text{ms}$.`, { unit: 'ms', tol: 0.05 }); }),
        inter(t`Ajuste o gráfico para $RC=2\,\text{ms}$; o limiar será alcançado depois de aproximadamente $2{,}20\,\text{ms}$.`, 'plot', monoLab().props, (v: any) => v?.p.rc === 2, t`$RC=2\,\text{ms}$`, t`$t_p=RC\ln3=2\ln3\approx2{,}20\,\text{ms}$.`),
        num(t`Usando $t_p\approx1{,}1RC$, encontre $R$ em kΩ para $t_p=22\,\text{ms}$ e $C=1\,\mu\text{F}$. Dê uma casa decimal.`, 20, t`$R=t_p/(1{,}1C)=22/(1{,}1\cdot1)=20\,\text{k}\Omega$.`, { unit: 'kΩ', tol: 0.05 }),
      ] },
      { card: { title: 'Da exponencial ao tempo', body: t`Após o disparo, a carga ideal é $V_C(t)=V_{CC}(1-e^{-t/(RC)})$. Em $V_C=2V_{CC}/3$, resulta $e^{-t/(RC)}=1/3$ e $t=RC\ln3$.

As fórmulas supõem disparo curto e capacitor inicialmente descarregado; tolerâncias dos componentes e comportamento do disparo podem alterar o pulso real.`, }, exercises: [
        tf(t`O produto $RC$ tem dimensão de tempo.`, true, t`$\Omega\cdot\text{F}=\text{s}$, a constante de tempo do circuito.`),
        mcq(t`Com $R$ fixo, dobrar $C$ faz o pulso ideal…`, ['dobrar', 'cair à metade', 'ficar igual', 'quadruplicar'], 0, t`Em $t_p\approx1{,}1RC$, o tempo é proporcional a $C$.`),
        num(t`Se $RC=10\,\text{ms}$, estime o pulso em ms usando $1{,}1RC$, com uma casa decimal.`, 11, t`$t_p\approx1{,}1\cdot10=11\,\text{ms}$.`, { unit: 'ms', tol: 0.05 }),
        mcq(t`Ao atingir $2V_{CC}/3$, qual é o valor de $e^{-t/(RC)}$?`, [t`$1/3$`, t`$2/3$`, t`$1$`, t`$3$`], 0, t`$2/3=1-e^{-t/(RC)}$ implica $e^{-t/(RC)}=1/3$.`),
        gen((rng) => { const c = randInt(rng, 2, 8); return num(t`Um monoestável tem $R=10\,\text{k}\Omega$ e $C=${c}\,\mu\text{F}$. Estime o pulso em ms com $1{,}1RC$, com uma casa decimal.`, 11 * c, t`$t_p\approx1{,}1\cdot10\cdot${c}=${11 * c}\,\text{ms}$.`, { unit: 'ms', tol: 0.05 }); }),
        num(t`Após uma constante de tempo, $V_C/V_{CC}=1-e^{-1}$. Calcule essa razão com duas casas decimais.`, 1 - Math.exp(-1), t`$1-e^{-1}\approx1-0{,}368=0{,}63$.`, { unit: '', tol: 0.005 }),
        num(t`Se $R=100\,\text{k}\Omega$ e $C=2\,\mu\text{F}$, estime o pulso em segundos usando $1{,}1RC$, com duas casas decimais.`, 0.22, t`$RC=100000\cdot0{,}000002=0{,}2\,\text{s}$; $t_p\approx1{,}1\cdot0{,}2=0{,}22\,\text{s}$.`, { unit: 's', tol: 0.005 }),
      ] },
    ] },
    { id: 'ea-osc-rc', title: 'Osciladores', parts: [
      { card: { title: 'Oscilação periódica', body: t`Um oscilador converte energia da alimentação em sinal periódico sem precisar de entrada periódica. Uma senoide pode ser escrita $v(t)=A\sin(2\pi ft+\phi)$, com amplitude $A$, frequência $f$ e período $T=1/f$. A tensão pico a pico vale $2A$ quando a senoide é centrada em zero.`, visual: senoLab() }, exercises: [
        mcq('Qual unidade mede frequência?', ['Hz', 'V', 'Ω', 'F'], 0, 'Hertz é o número de ciclos por segundo.'),
        tf('Uma senoide periódica repete seus valores após um período.', true, 'Por definição, o período é o menor intervalo positivo de repetição da onda.'),
        num(t`Uma onda faz $5$ ciclos por segundo. Qual a frequência em Hz, com uma casa decimal?`, 5, t`Cinco ciclos por segundo correspondem a $5\,\text{Hz}$.`, { unit: 'Hz', tol: 0.05 }),
        num(t`Uma senoide centrada em zero tem amplitude $2\,\text{V}$. Qual sua tensão pico a pico em V, com uma casa decimal?`, 4, t`Vai de $-2$ a $+2\,\text{V}$: $V_{pp}=4\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        gen((rng) => { const f = randInt(rng, 2, 9); return num(t`Uma onda tem frequência $${f}\,\text{Hz}$. Calcule o período em segundos, com três casas decimais.`, 1 / f, t`$T=1/f=1/${f}\approx${fmt(1 / f, 3)}\,\text{s}$.`, { unit: 's', tol: 0.0005 }); }),
        inter(t`Ajuste a senoide para três ciclos por segundo.`, 'plot', senoLab().props, (v: any) => v?.p.f === 3, t`$f=3\,\text{Hz}$`, t`Três ciclos por segundo significam $f=3\,\text{Hz}$ e $T=1/3\,\text{s}$.`),
        num(t`Para $f=50\,\text{Hz}$, determine o período em ms, com uma casa decimal.`, 20, t`$T=1/50=0{,}02\,\text{s}=20\,\text{ms}$.`, { unit: 'ms', tol: 0.05 }),
      ] },
      { card: { title: 'Realimentação e frequência', body: t`Em um oscilador de realimentação, a rede devolve parte do sinal ao amplificador. Na frequência de oscilação, a fase total da malha é múltipla de $360^\circ$; no modelo linear de oscilação sustentada, o ganho de malha tem módulo unitário. Na partida, o ganho pode ser maior, enquanto não linearidades limitam a amplitude.

Para a ponte de Wien ideal com pares iguais $R$ e $C$, $f_0=1/(2\pi RC)$; a rede atenua por $3$ e o amplificador ideal precisa de ganho $3$ em regime.`, }, exercises: [
        mcq('Qual é a função da fonte de alimentação em um oscilador ativo?', ['Fornecer energia ao circuito', 'Impor necessariamente uma entrada senoidal', 'Eliminar toda perda', 'Medir a frequência'], 0, 'O circuito transforma energia da alimentação em sinal de saída.'),
        tf('Uma rede de realimentação pode selecionar a frequência de oscilação.', true, 'Sua resposta em frequência determina onde a fase e o ganho da malha atendem às condições de oscilação.'),
        mcq('Na condição ideal de regime sustentado, o módulo do ganho de malha é…', ['$1$', '$0$', '$10$', '$100$'], 0, 'Ganho de malha unitário repõe exatamente as perdas em cada volta no modelo linear.'),
        num(t`Na ponte de Wien ideal, a rede atenua por $3$. Qual ganho do amplificador compensa essa atenuação? Dê uma casa decimal.`, 3, t`$A\beta=1$, com $\beta=1/3$, pede $A=3$.`, { unit: '', tol: 0.05 }),
        gen((rng) => { const r = randInt(rng, 1, 5); const f = 1000 / (2 * Math.PI * r); return num(t`Na ponte de Wien ideal, $R=${r}\,\text{k}\Omega$ e $C=1\,\mu\text{F}$. Calcule $f_0$ em Hz com uma casa decimal.`, f, t`$f_0=1/(2\pi RC)=1000/(2\pi\cdot${r})\approx${fmt(f, 1)}\,\text{Hz}$.`, { unit: 'Hz', tol: 0.05 }); }),
        tf('A condição linear de ganho unitário, sozinha, determina a amplitude real final.', false, 'Ela indica a condição de sustentação; limitações e controle de amplitude determinam a amplitude real.'),
        num(t`Se $RC=1\,\text{ms}$ na ponte de Wien ideal, calcule $f_0$ em Hz, com uma casa decimal.`, 1000 / (2 * Math.PI), t`$f_0=1/(2\pi\cdot0{,}001)\approx159{,}2\,\text{Hz}$.`, { unit: 'Hz', tol: 0.05 }),
      ] },
    ] },
    { id: 'ea-osc-sens', title: 'Sensores e condicionamento de sinal', parts: [
      { card: { title: 'LDR e NTC no divisor', body: t`Um LDR costuma reduzir sua resistência quando a iluminação aumenta; um termistor NTC reduz a resistência quando a temperatura aumenta. A relação exata depende do componente e das condições.

Num divisor sem carga, $R_{sup}$ liga $V_{CC}$ ao nó e $R_{inf}$ liga o nó ao terra: $V_o=V_{CC}R_{inf}/(R_{sup}+R_{inf})$. O gráfico varia $V_{CC}$; ajuste a resistência inferior.`, visual: divisorLab() }, exercises: [
        mcq('Qual grandeza um LDR é usado para detectar?', ['Iluminação', 'Pressão sonora diretamente', 'Campo magnético diretamente', 'Aceleração diretamente'], 0, 'A resistência do LDR varia com a iluminação incidente.'),
        tf('Em geral, a resistência de um NTC diminui quando sua temperatura sobe.', true, 'NTC significa coeficiente de temperatura negativo: a resistência cai com a temperatura.'),
        mcq('Num divisor sem carga, onde é medida a saída descrita no card?', ['Entre o nó central e o terra', 'Entre os dois terminais da fonte apenas', 'Em série com a fonte', 'Entre dois pontos do mesmo fio'], 0, 'O nó central está acima de R inferior; a saída é a tensão desse nó em relação ao terra.'),
        num(t`Com $V_{CC}=10\,\text{V}$ e dois resistores iguais, qual $V_o$ em V? Dê uma casa decimal.`, 5, t`$V_o=10R/(R+R)=5\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        gen((rng) => { const v = randInt(rng, 2, 6) * 2; return num(t`O divisor sem carga tem resistores iguais e $V_{CC}=${v}\,\text{V}$. Qual $V_o$ em V, com uma casa decimal?`, v / 2, t`$V_o=V_{CC}/2=${v / 2}\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
        inter(t`Ajuste $R_{inf}$ para $5\,\text{k}\Omega$. Em $V_{CC}=6\,\text{V}$, a saída será $2\,\text{V}$.`, 'plot', divisorLab().props, (v: any) => v?.p.r === 5, t`$R_{inf}=5\,\text{k}\Omega$`, t`$V_o=6\cdot5/(10+5)=2\,\text{V}$.`),
        num(t`Com $V_{CC}=9\,\text{V}$, $R_{sup}=2\,\text{k}\Omega$ e $R_{inf}=1\,\text{k}\Omega$, calcule $V_o$ em V com uma casa decimal.`, 3, t`$V_o=9\cdot1/(2+1)=3\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
      ] },
      { card: { title: 'Ponte e condicionamento', body: t`Uma ponte de Wheatstone tem dois divisores alimentados pela mesma fonte: à esquerda $R_1$ em cima e $R_2$ embaixo; à direita $R_3$ em cima e $R_4$ embaixo. Sem carga entre os nós, $V_L=V_{CC}R_2/(R_1+R_2)$ e $V_R=V_{CC}R_4/(R_3+R_4)$. A ponte equilibra quando $R_1R_4=R_2R_3$; então $V_L-V_R=0$.

Condicionar o sinal pode incluir amplificação diferencial, filtragem e calibração. A impedância de entrada finita pode carregar os divisores e alterar a leitura.`, }, exercises: [
        mcq('Qual operação pode reduzir ruído fora da faixa de interesse?', ['Filtragem', 'Curto-circuitar o sensor', 'Desligar a referência', 'Trocar volts por amperes'], 0, 'Um filtro adequado atenua componentes indesejadas de frequência.'),
        tf('Uma ponte equilibrada tem tensão diferencial nula entre seus nós centrais.', true, t`No equilíbrio $V_L=V_R$, portanto $V_L-V_R=0$.`),
        num(t`Uma ponte equilibrada tem $V_L=2{,}5\,\text{V}$. Quanto vale $V_R$ em V, com uma casa decimal?`, 2.5, t`No equilíbrio, $V_R=V_L=2{,}5\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        num(t`Na ponte sem carga, $V_L=3\,\text{V}$ e $V_R=2\,\text{V}$. Calcule $V_L-V_R$ em V, com uma casa decimal.`, 1, t`$V_L-V_R=3-2=1\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        gen((rng) => { const r = randInt(rng, 1, 8); return num(t`Na ponte equilibrada, $R_1=2\,\text{k}\Omega$, $R_2=${r}\,\text{k}\Omega$ e $R_3=4\,\text{k}\Omega$. Ache $R_4$ em kΩ, com uma casa decimal.`, 2 * r, t`$R_1R_4=R_2R_3$: $R_4=${r}\cdot4/2=${2 * r}\,\text{k}\Omega$.`, { unit: 'kΩ', tol: 0.05 }); }),
        tf('Um amplificador diferencial pode ampliar a diferença entre os nós da ponte.', true, 'Ele responde à diferença de tensão entre as entradas, respeitados seus limites reais de operação.'),
        num(t`Com $V_{CC}=12\,\text{V}$, $R_1=R_2=R_3=1\,\text{k}\Omega$ e $R_4=2\,\text{k}\Omega$, ache $V_L-V_R$ em V, com uma casa decimal. Despreze carga.`, -2, t`$V_L=12/2=6\,\text{V}$ e $V_R=12\cdot2/3=8\,\text{V}$; logo $V_L-V_R=-2\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
      ] },
    ] },
  ],
};
