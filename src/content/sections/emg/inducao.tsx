import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, plot, tf } from '../../helpers';
import { FnCurve } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;

// Cada gráfico mostra uma relação idealizada; os controles mantêm as unidades indicadas.
const lab = (kind: 'fluxo' | 'faraday' | 'gerador' | 'energia') => {
  const config = {
    fluxo: { key: 'b', label: 'B (T)', value: 1, min: 0, max: 4, step: 1 },
    faraday: { key: 's', label: 'taxa (Wb/s)', value: 1, min: 0, max: 4, step: 1 },
    gerador: { key: 'a', label: 'pico (V)', value: 1, min: 0, max: 4, step: 1 },
    energia: { key: 'l', label: 'L (H)', value: 1, min: 0, max: 4, step: 1 },
  }[kind];
  const value = (x: number, p: any) => kind === 'fluxo' ? p.b * x : kind === 'faraday' ? -p.s * x : kind === 'gerador' ? p.a * Math.sin(Math.PI * x) : p.l * x * x / 2;
  return plot({
    view: { xMin: 0, xMax: 2, yMin: -8.5, yMax: 8.5 },
    params: [{ ...config, color: C.p2 }],
    render: ({ p }: any) => <FnCurve f={(x: number) => value(x, p)} color={C.p2} />,
    info: ({ p }: any) => kind === 'fluxo' ? t`Área no eixo horizontal ($\text{m}^2$); fluxo no vertical ($\text{Wb}$), com campo normal à espira.` : kind === 'faraday' ? t`Tempo no eixo horizontal ($\text{s}$); fluxo no vertical ($\text{Wb}$). A fem é o oposto da inclinação.` : kind === 'gerador' ? t`Tempo no eixo horizontal ($\text{s}$); fem no vertical ($\text{V}$), para rotação uniforme.` : t`Corrente no eixo horizontal ($\text{A}$); energia no vertical ($\text{J}$), com $L=${fmt(p.l)}\,\text{H}$.`,
  }, 240);
};
const practice = (kind: 'fluxo' | 'faraday' | 'gerador' | 'energia', prompt: string, key: string, target: number, answer: string, explain: string) =>
  inter(prompt, 'plot', lab(kind).props, (v) => Math.abs(v.p[key] - target) < 0.01, answer, explain);

export const inducao: UnitDef = {
  id: 'em-ind', title: 'Indução eletromagnética', icon: '🌩️',
  subtitle: 'Fluxo, Faraday, máquinas e indutores',
  source: 'Conteúdo complementar · Halliday, Resnick e Walker, Fundamentos de Física, capítulo 30',
  extra: true,
  guide: t`Fluxo por uma superfície: $\Phi_B=\int\vec B\cdot d\vec A$; para campo uniforme e área plana, $\Phi_B=BA\cos\theta$, com $\theta$ medido em relação à normal. Faraday: $\mathcal E=-N\frac{d\Phi_B}{dt}$ para espiras com mesmo fluxo. Lenz determina o sentido que se opõe à variação do fluxo. Numa espira girante, $\mathcal E=NBA\omega\sin(\omega t)$ para a fase indicada. Autoindução: $\mathcal E_L=-L\frac{di}{dt}$ e energia $U=\frac12 LI^2$. Transformadores usam fluxo variável e indução mútua.`,
  lessons: [
    {
      id: 'em-ind-fluxo', title: 'Fluxo magnético', parts: [
        {
          card: { title: 'Campo através de uma superfície', body: t`O fluxo magnético mede a passagem orientada do campo por uma superfície. Em campo uniforme numa área plana, $\Phi_B=BA\cos\theta$, onde $\theta$ é o ângulo entre $\vec B$ e a normal escolhida. Sua unidade é o weber ($\text{Wb}=\text{T}\cdot\text{m}^2$).`, visual: lab('fluxo'), example: t`Com $B=2\,\text{T}$, $A=3\,\text{m}^2$ e campo paralelo à normal, $\Phi_B=6\,\text{Wb}$.` },
          exercises: [
            mcq('Qual é a unidade SI de fluxo magnético?', ['weber', 'ampère', 'tesla por segundo', 'henry'], 0, t`Fluxo é medido em weber, equivalente a $\text{T}\cdot\text{m}^2$.`),
            tf(t`O ângulo em $BA\cos\theta$ é medido entre o campo e a normal à superfície.`, true, 'A normal é perpendicular ao plano e define a orientação da área.'),
            num(t`Uma superfície de $2\,\text{m}^2$ tem campo uniforme normal de $3\,\text{T}$. Calcule o fluxo em Wb, com uma casa decimal.`, 6, t`$\Phi_B=3\cdot2\cdot\cos 0^\circ=6\,\text{Wb}$.`, { unit: 'Wb', tol: 0.05 }),
            practice('fluxo', t`No gráfico, ajuste $B$ para que uma área normal de $2\,\text{m}^2$ tenha fluxo de $6\,\text{Wb}$.`, 'b', 3, t`$B=3\,\text{T}$`, t`Como $\Phi_B=BA$, $B=6/2=3\,\text{T}$.`),
            gen((rng) => { const b = randInt(rng, 1, 5); const a = randInt(rng, 1, 5); return num(t`Campo normal uniforme de $${b}\,\text{T}$ atravessa $${a}\,\text{m}^2$. Qual o fluxo em Wb, com uma casa decimal?`, b*a, t`$\Phi_B=BA=${b}\cdot${a}=${b*a}\,\text{Wb}$.`, { unit: 'Wb', tol: 0.05 }); }),
            num(t`Uma área de $4\,\text{m}^2$ está em campo uniforme de $2\,\text{T}$ a $60^\circ$ da normal. Qual o fluxo em Wb, com uma casa decimal?`, 4, t`$\Phi_B=2\cdot4\cdot\cos60^\circ=4\,\text{Wb}$.`, { unit: 'Wb', tol: 0.05 }),
            mcq(t`Se o campo é paralelo ao plano da espira, o fluxo pela espira é…`, ['zero', 'máximo positivo', 'sempre negativo', 'igual ao campo'], 0, t`O campo faz $90^\circ$ com a normal, logo $\cos90^\circ=0$.`),
          ],
        },
        {
          card: { title: 'Sinal e fluxo não uniforme', body: t`A escolha da normal fixa o sinal: campo no sentido oposto dá fluxo negativo. Para campo variável ou superfície curva, some as contribuições orientadas: $\Phi_B=\int\vec B\cdot d\vec A$. Em uma superfície fechada, o fluxo magnético total é zero: $\oint\vec B\cdot d\vec A=0$.`, example: t`Se $B$ é normal e vale $2x\,\text{T}$ numa faixa $0\le x\le2\,\text{m}$ de largura $1\,\text{m}$, $\Phi_B=\int_0^2 2x\,dx=4\,\text{Wb}$.` },
          exercises: [
            tf('Inverter a normal escolhida inverte o sinal do fluxo pela mesma superfície.', true, t`O vetor área troca de sinal, então $\vec B\cdot d\vec A$ também troca.`),
            mcq('O fluxo magnético total através de qualquer superfície fechada é:', ['zero', 'sempre positivo', 'igual à área', 'igual à corrente interna'], 0, t`Pela lei de Gauss do magnetismo, $\oint\vec B\cdot d\vec A=0$.`),
            num(t`Campo uniforme de $2\,\text{T}$ aponta contra a normal de uma área plana de $3\,\text{m}^2$. Calcule o fluxo orientado em Wb, com uma casa decimal.`, -6, t`$\theta=180^\circ$ e $\Phi_B=2\cdot3\cdot(-1)=-6\,\text{Wb}$.`, { unit: 'Wb', tol: 0.05 }),
            gen((rng) => { const a = randInt(rng, 1, 5); const b = randInt(rng, 1, 5); return num(t`Um campo de $${b}\,\text{T}$ aponta contra a normal de uma área de $${a}\,\text{m}^2$. Calcule o fluxo orientado em Wb, com uma casa decimal.`, -a*b, t`$\Phi_B=${b}\cdot${a}\cos180^\circ=-${a*b}\,\text{Wb}$.`, { unit: 'Wb', tol: 0.05 }); }),
            tf('Um fluxo negativo significa que o campo tem componente oposta à normal escolhida.', true, 'O sinal descreve orientação; o módulo do campo não é negativo.'),
            num(t`Uma superfície fechada tem fluxo de entrada de $5\,\text{Wb}$ em módulo. Qual é o fluxo de saída em Wb, com uma casa decimal?`, 5, t`O fluxo líquido é zero: a saída de $5\,\text{Wb}$ compensa a entrada de $-5\,\text{Wb}$.`, { unit: 'Wb', tol: 0.05 }),
            num(t`Numa superfície plana de largura $1\,\text{m}$, $B(x)=2x\,\text{T}$ é normal e favorável à normal, para $0\le x\le2\,\text{m}$. Calcule o fluxo em Wb, com uma casa decimal.`, 4, t`$\Phi_B=\int_0^2 2x\cdot1\,dx=[x^2]_0^2=4\,\text{Wb}$.`, { unit: 'Wb', tol: 0.05 }),
          ],
        },
      ],
    },
    {
      id: 'em-ind-faraday', title: 'Leis de Faraday e Lenz', parts: [
        {
          card: { title: 'Variação de fluxo produz fem', body: t`Para $N$ espiras que compartilham o mesmo fluxo, $\mathcal E=-N\,d\Phi_B/dt$. Em um intervalo, a fem média é $-N\Delta\Phi_B/\Delta t$. O sinal depende da normal e do sentido positivo de circulação associados pela regra da mão direita.`, visual: lab('faraday'), example: t`Em 10 espiras, um aumento de $0{,}2\,\text{Wb}$ em $2\,\text{s}$ produz fem média $-1\,\text{V}$.` },
          exercises: [
            tf('Fluxo constante numa espira estacionária implica fem induzida nula.', true, t`Com $d\Phi_B/dt=0$, a lei de Faraday dá $\mathcal E=0$.`),
            mcq('O módulo da fem média depende diretamente de:', ['taxa de variação do fluxo', 'valor do fluxo isoladamente', 'resistência isoladamente', 'carga inicial da espira'], 0, t`$|\mathcal E_{\rm méd}|=N|\Delta\Phi_B|/\Delta t$.`),
            num(t`Uma espira tem fluxo que cresce $0{,}6\,\text{Wb}$ em $2\,\text{s}$. Qual o módulo da fem média em V, com duas casas decimais?`, 0.3, t`$|\mathcal E|=0{,}6/2=0{,}30\,\text{V}$.`, { unit: 'V', tol: 0.005 }),
            practice('faraday', t`Ajuste a taxa positiva indicada para que a inclinação do fluxo seja $-3\,\text{Wb/s}$. Qual será a fem de uma espira?`, 's', 3, t`Taxa $3\,\text{Wb/s}$; fem $+3\,\text{V}$`, t`O gráfico tem inclinação $-3\,\text{Wb/s}$; pela lei de Faraday, $\mathcal E=-(-3)=3\,\text{V}$.`),
            gen((rng) => { const n = randInt(rng, 2, 8); const d = randInt(rng, 1, 5); return num(t`Em $${n}$ espiras, o fluxo por espira cresce $${d}\,\text{Wb}$ em $2\,\text{s}$. Qual o módulo da fem média em V, com uma casa decimal?`, n*d/2, t`$|\mathcal E|=${n}\cdot${d}/2=${fmt(n*d/2)}\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
            num(t`Em $10$ espiras o fluxo por espira aumenta $0{,}2\,\text{Wb}$ em $2\,\text{s}$. Calcule a fem média orientada em V, com uma casa decimal.`, -1, t`$\mathcal E=-10(0{,}2/2)=-1\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
            num(t`Numa espira, $\Phi_B=3t^2\,\text{Wb}$, com $t$ em segundos. Calcule a fem instantânea em $t=2\,\text{s}$, em V, com uma casa decimal.`, -12, t`$\mathcal E=-d(3t^2)/dt=-6t=-12\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
          ],
        },
        {
          card: { title: 'Lenz e conservação de energia', body: t`A corrente induzida, se o circuito estiver fechado, cria um campo que se opõe à **variação** do fluxo, não necessariamente ao campo externo. Use a regra da mão direita para relacionar corrente e campo. A oposição impede obter energia sem trabalho externo.`, example: t`Fluxo entrando na página e aumentando: a espira cria campo saindo da página; vista de frente, a corrente é anti-horária.` },
          exercises: [
            mcq('A lei de Lenz afirma que a corrente induzida se opõe:', ['à variação do fluxo', 'sempre ao campo externo', 'sempre ao movimento dos elétrons', 'à resistência do fio'], 0, 'O campo induzido atua contra a mudança de fluxo que o produziu.'),
            tf('Uma fem pode existir num circuito aberto mesmo sem corrente contínua no circuito.', true, 'A separação de cargas estabelece fem; sem caminho fechado não há corrente de circulação sustentada.'),
            mcq('Um fluxo para dentro da página aumenta numa espira fechada. O campo induzido aponta:', ['para fora da página', 'para dentro da página', 'para a direita', 'para a esquerda'], 0, 'O campo induzido se opõe ao aumento do fluxo para dentro.'),
            mcq('No caso anterior, vista de frente, a corrente induzida é:', ['anti-horária', 'horária', 'nula', 'alternada obrigatoriamente'], 0, 'Pela mão direita, dedos no sentido anti-horário geram campo para fora da página.'),
            gen((rng) => { const n = randInt(rng, 2, 6); const r = randInt(rng, 1, 4); return num(t`O módulo da fem induzida é $${n*r}\,\text{V}$ e a resistência da espira fechada é $${r}\,\Omega$. Qual a corrente em A, com uma casa decimal?`, n, t`Pela lei de Ohm, $I=|\mathcal E|/R=${n*r}/${r}=${n}\,\text{A}$.`, { unit: 'A', tol: 0.05 }); }),
            mcq('Fluxo para fora da página diminui. Qual campo a corrente induzida cria?', ['para fora da página', 'para dentro da página', 'nenhum', 'paralelo à página'], 0, 'Para contrariar a diminuição, o campo induzido reforça o fluxo para fora.'),
            num(t`Uma bobina fechada de $4\,\Omega$ tem fem de módulo $12\,\text{V}$. Qual a potência dissipada em W, com uma casa decimal?`, 36, t`$I=12/4=3\,\text{A}$ e $P=I^2R=3^2\cdot4=36\,\text{W}$.`, { unit: 'W', tol: 0.05 }),
          ],
        },
      ],
    },
    {
      id: 'em-ind-ger', title: 'Geradores e motores', parts: [
        {
          card: { title: 'Espira girante e gerador', body: t`Uma espira girando uniformemente num campo uniforme pode ter $\Phi_B=BA\cos(\omega t)$. Para $N$ espiras, $\mathcal E=NBA\omega\sin(\omega t)$; o pico é $NBA\omega$. O gerador converte energia mecânica em elétrica.`, visual: lab('gerador'), example: t`Se $N=10$, $B=2\,\text{T}$, $A=0{,}1\,\text{m}^2$ e $\omega=5\,\text{rad/s}$, o pico é $10\,\text{V}$.` },
          exercises: [
            mcq('Um gerador elétrico converte principalmente energia:', ['mecânica em elétrica', 'elétrica em mecânica', 'térmica em massa', 'elétrica em massa'], 0, 'O torque externo realiza trabalho que pode ser entregue como energia elétrica.'),
            tf('Uma espira girante pode produzir fem alternada porque seu fluxo varia periodicamente.', true, 'A projeção da área na direção do campo muda de sinal durante a rotação.'),
            num(t`Para $N=10$, $B=2\,\text{T}$, $A=0{,}1\,\text{m}^2$ e $\omega=5\,\text{rad/s}$, calcule o pico da fem em V, com uma casa decimal.`, 10, t`$\mathcal E_0=NBA\omega=10\cdot2\cdot0{,}1\cdot5=10\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
            practice('gerador', t`Ajuste o controle para uma senoide com pico de $3\,\text{V}$.`, 'a', 3, t`Pico $3\,\text{V}$`, t`A amplitude multiplica o seno; como seu valor máximo é $1$, o pico é $3\,\text{V}$.`),
            gen((rng) => { const n = randInt(rng, 2, 6); const w = randInt(rng, 2, 5); return num(t`Um gerador tem $${n}$ espiras, $B=1\,\text{T}$, $A=1\,\text{m}^2$ e $\omega=${w}\,\text{rad/s}$. Qual o pico da fem em V, com uma casa decimal?`, n*w, t`$\mathcal E_0=NBA\omega=${n}\cdot1\cdot1\cdot${w}=${n*w}\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
            mcq(t`Se $N$, $B$ e $A$ são fixos, dobrar $\omega$ faz o pico da fem:`, ['dobrar', 'cair pela metade', 'quadruplicar', 'não mudar'], 0, t`O pico $NBA\omega$ é proporcional a $\omega$.`),
            num(t`Uma senoide de período $0{,}02\,\text{s}$ tem frequência de quantos Hz? Responda com uma casa decimal.`, 50, t`$f=1/T=1/0{,}02=50\,\text{Hz}$.`, { unit: 'Hz', tol: 0.05 }),
          ],
        },
        {
          card: { title: 'Motores e força contraeletromotriz', body: t`O motor converte energia elétrica em mecânica. Quando gira, surge uma fem induzida que se opõe à tensão aplicada: em um modelo DC simples, $I=(V-\mathcal E_c)/R$. Ela cresce com a rotação; na partida, pode ser pequena.`, example: t`Com $V=12\,\text{V}$, $\mathcal E_c=8\,\text{V}$ e $R=2\,\Omega$, $I=2\,\text{A}$.` },
          exercises: [
            mcq('Um motor elétrico converte principalmente energia:', ['elétrica em mecânica', 'mecânica em elétrica', 'química em nuclear', 'magnética em massa'], 0, 'A corrente interage com o campo e produz torque, realizando trabalho mecânico.'),
            tf('A força contraeletromotriz de um motor em rotação se opõe à tensão aplicada.', true, 'A polaridade induzida tende a reduzir a corrente imposta pela fonte.'),
            num(t`Um motor DC tem $V=12\,\text{V}$, fem contrária de $8\,\text{V}$ e resistência $2\,\Omega$. Calcule a corrente em A, com uma casa decimal.`, 2, t`$I=(12-8)/2=2\,\text{A}$.`, { unit: 'A', tol: 0.05 }),
            gen((rng) => { const r = randInt(rng, 1, 4); const i = randInt(rng, 1, 5); const e = randInt(rng, 2, 8); return num(t`Num motor DC, $V=${e+r*i}\,\text{V}$, fem contrária $${e}\,\text{V}$ e resistência $${r}\,\Omega$. Qual a corrente em A, com uma casa decimal?`, i, t`$I=(V-\mathcal E_c)/R=(${e+r*i}-${e})/${r}=${i}\,\text{A}$.`, { unit: 'A', tol: 0.05 }); }),
            mcq('Por que um motor DC pode consumir corrente elevada na partida?', ['A fem contrária é pequena quando está parado.', 'A resistência necessariamente é infinita.', 'O fluxo é sempre zero.', 'A tensão aplicada desaparece.'], 0, t`Em repouso, a fem de rotação é aproximadamente zero; então $I\approx V/R$.`),
            num(t`Um motor idealizado recebe $12\,\text{V}$ e $2\,\text{A}$, com resistência de enrolamento $2\,\Omega$. Qual a potência dissipada no enrolamento em W, com uma casa decimal?`, 8, t`$P_R=I^2R=2^2\cdot2=8\,\text{W}$.`, { unit: 'W', tol: 0.05 }),
            num(t`No mesmo modelo, com $V=12\,\text{V}$, $I=2\,\text{A}$ e $R=2\,\Omega$, qual a potência convertida eletromecanicamente em W, com uma casa decimal?`, 16, t`$\mathcal E_c=V-IR=8\,\text{V}$ e $P=\mathcal E_cI=8\cdot2=16\,\text{W}$.`, { unit: 'W', tol: 0.05 }),
          ],
        },
      ],
    },
    {
      id: 'em-ind-auto', title: 'Indutância e energia magnética', parts: [
        {
          card: { title: 'Autoindução e indutância', body: t`A corrente variável numa bobina altera seu próprio fluxo e induz uma fem oposta à variação: $\mathcal E_L=-L\,di/dt$, para indutância constante. A unidade de $L$ é o henry ($\text{H}$). Para uma bobina linear, $N\Phi_B=LI$.`, visual: lab('energia'), example: t`Se $L=2\,\text{H}$ e a corrente cresce a $3\,\text{A/s}$, a fem é $-6\,\text{V}$.` },
          exercises: [
            mcq('Qual é a unidade SI de indutância?', ['henry', 'weber por segundo', 'ampère', 'joule por segundo'], 0, t`O henry equivale a $\text{V}\cdot\text{s}/\text{A}$.`),
            tf('Um indutor ideal se opõe à variação da corrente, não à corrente constante em si.', true, t`Se $di/dt=0$, a fem autoinduzida é zero.`),
            num(t`Um indutor de $2\,\text{H}$ tem corrente crescendo a $3\,\text{A/s}$. Qual a fem autoinduzida em V, com uma casa decimal?`, -6, t`$\mathcal E_L=-L\,di/dt=-2\cdot3=-6\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
            gen((rng) => { const l = randInt(rng, 1, 5); const rate = randInt(rng, 1, 5); return num(t`Em um indutor de $${l}\,\text{H}$ a corrente cresce a $${rate}\,\text{A/s}$. Qual a fem autoinduzida em V, com uma casa decimal?`, -l*rate, t`$\mathcal E_L=-${l}\cdot${rate}=-${l*rate}\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
            mcq('Se a corrente de uma bobina diminui, a fem autoinduzida tende a:', ['manter a corrente no sentido original', 'acelerar sua queda', 'anular instantaneamente o campo', 'impedir a existência de tensão'], 0, 'Pela lei de Lenz, a fem se opõe à diminuição e tende a sustentar a corrente.'),
            num(t`Uma bobina linear possui $N\Phi_B=6\,\text{Wb}$ de fluxo concatenado a $I=3\,\text{A}$. Calcule $L$ em H, com uma casa decimal.`, 2, t`$L=N\Phi_B/I=6/3=2\,\text{H}$.`, { unit: 'H', tol: 0.05 }),
            num(t`Uma bobina de $0{,}5\,\text{H}$ tem corrente que cai de $4\,\text{A}$ para $2\,\text{A}$ em $0{,}1\,\text{s}$ uniformemente. Calcule a fem induzida em V, com uma casa decimal.`, 10, t`$\Delta I/\Delta t=(2-4)/0{,}1=-20\,\text{A/s}$; $\mathcal E_L=-0{,}5(-20)=10\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
          ],
        },
        {
          card: { title: 'Energia e indução mútua', body: t`Um indutor linear armazena energia no campo magnético: $U=\frac12 LI^2$. Em bobinas acopladas, uma corrente variável na primeira produz fluxo variável na segunda: $\mathcal E_2=-M\,di_1/dt$. Num transformador ideal, a razão de tensões eficazes é $V_2/V_1=N_2/N_1$.`, example: t`Para $L=2\,\text{H}$ e $I=3\,\text{A}$, $U=\frac12\cdot2\cdot3^2=9\,\text{J}$.` },
          exercises: [
            tf('A energia armazenada por um indutor linear ideal é proporcional ao quadrado da corrente.', true, t`$U=\frac12 LI^2$: dobrar $I$ quadruplica $U$.`),
            num(t`Para $L=2\,\text{H}$ e $I=3\,\text{A}$, calcule a energia em J, com uma casa decimal.`, 9, t`$U=\frac12\cdot2\cdot3^2=9\,\text{J}$.`, { unit: 'J', tol: 0.05 }),
            practice('energia', t`Ajuste $L$ para armazenar $6\,\text{J}$ em $2\,\text{A}$.`, 'l', 3, t`$L=3\,\text{H}$`, t`$6=\frac12 L(2)^2=2L$, portanto $L=3\,\text{H}$.`),
            gen((rng) => { const l = randInt(rng, 1, 5); const i = randInt(rng, 1, 4); return num(t`Um indutor de $${l}\,\text{H}$ conduz $${i}\,\text{A}$. Qual a energia armazenada em J, com uma casa decimal?`, l*i*i/2, t`$U=\frac12\cdot${l}\cdot${i}^2=${fmt(l*i*i/2)}\,\text{J}$.`, { unit: 'J', tol: 0.05 }); }),
            mcq('O transformador ideal precisa de qual fenômeno para induzir tensão no secundário?', ['fluxo magnético variável compartilhado', 'fluxo constante sem variação', 'contato elétrico entre enrolamentos', 'carga estática no núcleo'], 0, 'O fluxo variável produzido pelo primário atravessa o secundário e induz fem pela lei de Faraday.'),
            num(t`Num transformador ideal, $N_1=100$, $N_2=200$ e $V_1=12\,\text{V}$ eficazes. Qual $V_2$ eficaz em V, com uma casa decimal?`, 24, t`$V_2=V_1N_2/N_1=12\cdot200/100=24\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
            num(t`Duas bobinas têm indutância mútua $M=0{,}5\,\text{H}$. Se a corrente primária cresce a $4\,\text{A/s}$, qual a fem induzida orientada na secundária em V, com uma casa decimal, pela convenção $\mathcal E_2=-M\,di_1/dt$?`, -2, t`$\mathcal E_2=-0{,}5\cdot4=-2\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
          ],
        },
      ],
    },
  ],
};
