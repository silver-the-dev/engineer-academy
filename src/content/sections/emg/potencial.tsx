import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, plot, tf } from '../../helpers';
import { FnCurve, Pt } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { randInt } from '../../../lib/random';

const t = String.raw;

// Escalas escolhidas para que os eixos mostrem diretamente as unidades indicadas.
const laboratorio = (kind: 'energia' | 'potencial' | 'capacitor') => {
  const labels = {
    energia: { slider: 'q (µC)' },
    potencial: { slider: 'E (V/m)' },
    capacitor: { slider: 'κ' },
  }[kind];
  const f = (x: number, a: number) => kind === 'energia' ? a * x : kind === 'potencial' ? 6 - a * x : a * x;
  return plot({
    view: { xMin: 0, xMax: 5, yMin: -1, yMax: 16 },
    params: [{ key: 'a', label: labels.slider, min: 1, max: 3, step: 1, value: 1, color: C.p2 }],
    render: ({ p }: any) => <><FnCurve f={(x) => f(x, p.a)} color={C.p2} /><Pt x={2} y={f(2, p.a)} color={C.gold} /></>,
    info: ({ p }: any) => kind === 'energia'
      ? t`Eixo horizontal: $V$ (V). Em $V=2\,\text{V}$: $U=${2 * p.a}\,\mu\text{J}$.`
      : kind === 'potencial'
        ? t`Eixo horizontal: $x$ (m), com $V(0)=6\,\text{V}$. Em $x=2\,\text{m}$: $V=${6 - 2 * p.a}\,\text{V}$.`
        : t`Eixo horizontal: $C_0$ (pF). Em $C_0=2\,\text{pF}$: $C=${2 * p.a}\,\text{pF}$.`,
  });
};

export const potencialEletrico: UnitDef = {
  id: 'em-pot', title: 'Potencial elétrico', icon: '🏔️',
  subtitle: 'Energia, tensão e capacitância',
  source: 'Conteúdo complementar · Halliday, Resnick e Walker, Fundamentos de Física, vol. 3, caps. 24–25',
  extra: true,
  guide: t`Na eletrostática, $\Delta U=-W_{\text{el}}$ e $\Delta U=q\Delta V$. Para cargas puntiformes, com zero no infinito, $U=kq_1q_2/r$ e $V=kQ/r$. O campo e o potencial obedecem a $\Delta V=-\int_A^B\vec E\cdot d\vec l$. Um capacitor tem $C=Q/|\Delta V|$ e, para placas paralelas ideais preenchidas por dielétrico linear, $C=\kappa\varepsilon_0 A/d$. Sua energia é $U_C=Q^2/(2C)=C(\Delta V)^2/2$.`,
  lessons: [
    {
      id: 'em-pot-energia', title: 'Energia potencial elétrica', parts: [
        {
          card: { title: 'Trabalho e energia', body: t`A força eletrostática é conservativa: o trabalho elétrico depende só dos pontos inicial e final. Defina $\Delta U=U_f-U_i$ e $W_{\text{el}}=-\Delta U$. Se apenas a força elétrica realiza trabalho, $\Delta K=-\Delta U$. Um agente externo que move a carga lentamente faz $W_{\text{ext}}=\Delta U$.`, visual: laboratorio('energia'), tip: t`No gráfico, $U=qV$ com referência fixa. Varie a carga positiva e veja a energia no ponto dourado.` },
          exercises: [
            tf(t`Se o campo faz trabalho positivo, a energia potencial elétrica diminui.`, true, t`Como $\Delta U=-W_{\text{el}}$, trabalho positivo implica variação negativa.`),
            mcq(t`A unidade SI de energia potencial é:`, ['joule', 'volt', 'coulomb', 'farad'], 0, t`Energia e trabalho são medidos em joules.`),
            num(t`O campo realiza $4\,\text{J}$ de trabalho. Calcule $\Delta U$ em J, sem casas decimais.`, -4, t`$\Delta U=-W_{\text{el}}=-4\,\text{J}$.`, { unit: 'J', tol: 0.5 }),
            gen((rng) => { const w = randInt(rng, 2, 9); return num(t`Uma força externa move lentamente uma carga e realiza $${w}\,\text{J}$ de trabalho. Calcule $\Delta U$ em J, sem casas decimais.`, w, t`Sem variação de energia cinética, $\Delta U=W_{\text{ext}}=${w}\,\text{J}$.`, { unit: 'J', tol: 0.5 }); }),
            inter(t`No gráfico de $U=qV$, ajuste a carga para que $U=6\,\mu\text{J}$ no ponto dourado, onde $V=2\,\text{V}$.`, 'plot', laboratorio('energia').props, (v) => v.p.a === 3, t`$q=3\,\mu\text{C}$`, t`$q=U/V=6/2=3\,\mu\text{C}$.`),
            num(t`Uma carga de $2\,\mu\text{C}$ passa por uma diferença de potencial de $3\,\text{V}$. Calcule $\Delta U$ em µJ, sem casas decimais.`, 6, t`$\Delta U=q\Delta V=2\cdot3=6\,\mu\text{J}$.`, { unit: 'µJ', tol: 0.5 }),
            num(t`Somente a força elétrica atua. Se $U$ cai $8\,\text{J}$ e a energia cinética inicial é $3\,\text{J}$, calcule a energia cinética final em J, sem casas decimais.`, 11, t`$\Delta K=-\Delta U=8\,\text{J}$; então $K_f=3+8=11\,\text{J}$.`, { unit: 'J', tol: 0.5 }),
          ],
        },
        {
          card: { title: 'Duas cargas puntiformes', body: t`Para duas cargas puntiformes separadas por $r$, no vácuo, tome $U=0$ no infinito: $$U=\frac{kq_1q_2}{r},\qquad k=9\cdot10^9\,\text{N m}^2/\text{C}^2.$$ Cargas de mesmo sinal têm $U>0$; sinais opostos dão $U<0$. Para várias cargas, some a energia de cada par uma única vez.`, tip: t`O sinal negativo indica energia menor que a referência escolhida, não uma energia cinética negativa.` },
          exercises: [
            tf(t`Com zero no infinito, duas cargas de sinais opostos têm energia potencial negativa.`, true, t`O produto $q_1q_2$ é negativo em $U=kq_1q_2/r$.`),
            mcq(t`Duas cargas positivas são aproximadas lentamente. A energia potencial do par:`, ['aumenta', 'diminui', 'fica constante', 'torna-se necessariamente negativa'], 0, t`Com produto positivo, $U=kq_1q_2/r$ aumenta quando $r$ diminui.`),
            num(t`No vácuo, cargas de $1\,\mu\text{C}$ e $2\,\mu\text{C}$ estão separadas por $3\,\text{m}$. Use $k=9\cdot10^9$. Calcule $U$ em mJ, sem casas decimais.`, 6, t`$U=9\cdot10^9(1\cdot10^{-6})(2\cdot10^{-6})/3=6\cdot10^{-3}\,\text{J}=6\,\text{mJ}$.`, { unit: 'mJ', tol: 0.5 }),
            gen((rng) => { const q = randInt(rng, 1, 5); return num(t`No vácuo, $q_1=${q}\,\mu\text{C}$ e $q_2=-1\,\mu\text{C}$ estão a $3\,\text{m}$. Use $k=9\cdot10^9$. Calcule $U$ em mJ, sem casas decimais.`, -3 * q, t`$U=9\cdot10^9(${q}\cdot10^{-6})(-10^{-6})/3=-${3 * q}\,\text{mJ}$.`, { unit: 'mJ', tol: 0.5 }); }),
            mcq(t`Se a separação de duas cargas fixas de mesmo sinal dobra, sua energia potencial, com zero no infinito:`, ['cai à metade', 'dobra', 'quadruplica', 'muda de sinal'], 0, t`Como $U\propto1/r$, dobrar $r$ reduz $U$ à metade.`),
            num(t`A energia de um par passa de $12\,\text{mJ}$ para $4\,\text{mJ}$. Qual o trabalho da força elétrica em mJ, sem casas decimais?`, 8, t`$W_{\text{el}}=-\Delta U=-(4-12)=8\,\text{mJ}$.`, { unit: 'mJ', tol: 0.5 }),
            num(t`Três cargas puntiformes positivas têm energias de pares $2$, $3$ e $4\,\text{mJ}$. Calcule a energia total em mJ, sem casas decimais.`, 9, t`Some cada par uma vez: $U=2+3+4=9\,\text{mJ}$.`, { unit: 'mJ', tol: 0.5 }),
          ],
        },
      ],
    },
    {
      id: 'em-pot-v', title: 'Potencial e diferença de potencial', parts: [
        {
          card: { title: 'Potencial é energia por carga', body: t`O potencial $V=U/q$ caracteriza a posição no campo, com referência escolhida. A diferença $\Delta V=V_B-V_A$ é energia potencial por unidade de carga: $\Delta U=q\Delta V$. Um volt é um joule por coulomb. Para carga puntiforme $Q$ no vácuo, com $V=0$ no infinito, $V=kQ/r$; potenciais de várias fontes somam-se algebricamente.`, visual: laboratorio('potencial'), tip: t`No gráfico, o campo uniforme aponta no sentido positivo de $x$. Varie $E$ e observe a queda do potencial.` },
          exercises: [
            mcq(t`Um volt equivale a:`, [t`$1\,\text{J/C}$`, t`$1\,\text{C/J}$`, t`$1\,\text{J C}$`, t`$1\,\text{N/C}$`], 0, t`Pela definição, diferença de potencial é energia por carga: $1\,\text{V}=1\,\text{J/C}$.`),
            tf(t`O potencial criado por uma carga puntiforme negativa é negativo quando o zero está no infinito.`, true, t`Em $V=kQ/r$, $k$ e $r$ são positivos; o sinal é o de $Q$.`),
            num(t`Uma carga de $2\,\text{C}$ ganha $10\,\text{J}$ de energia potencial. Calcule $\Delta V$ em V, sem casas decimais.`, 5, t`$\Delta V=\Delta U/q=10/2=5\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
            gen((rng) => { const q = randInt(rng, 1, 5); return num(t`Uma carga fonte de $${q}\,\mu\text{C}$ está no vácuo. Em um ponto a $3\,\text{m}$, calcule $V$ em kV, sem casas decimais. Use $k=9\cdot10^9$ e zero no infinito.`, 3 * q, t`$V=kQ/r=9\cdot10^9(${q}\cdot10^{-6})/3=${3 * q}\,\text{kV}$.`, { unit: 'kV', tol: 0.5 }); }),
            inter(t`No gráfico, ajuste o campo uniforme para obter $V=2\,\text{V}$ no ponto dourado em $x=2\,\text{m}$.`, 'plot', laboratorio('potencial').props, (v) => v.p.a === 2, t`$E=2\,\text{V/m}$`, t`$V=6-Ex$; logo $2=6-2E$ e $E=2\,\text{V/m}$.`),
            num(t`Dois potenciais de fontes diferentes num ponto valem $8\,\text{V}$ e $-3\,\text{V}$. Qual o potencial resultante em V, sem casas decimais?`, 5, t`Potencial é escalar: $V=8+(-3)=5\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
            num(t`Uma carga de $-2\,\mu\text{C}$ atravessa $\Delta V=3\,\text{V}$. Calcule $\Delta U$ em µJ, sem casas decimais.`, -6, t`$\Delta U=q\Delta V=(-2)(3)=-6\,\mu\text{J}$.`, { unit: 'µJ', tol: 0.5 }),
          ],
        },
        {
          card: { title: 'Campo e superfícies equipotenciais', body: t`Entre $A$ e $B$, $$V_B-V_A=-\int_A^B\vec E\cdot d\vec l.$$ Em campo uniforme paralelo ao deslocamento, $\Delta V=-E\Delta x$. O campo aponta para potenciais decrescentes e é perpendicular às superfícies equipotenciais. Deslocar uma carga sobre uma equipotencial exige trabalho elétrico nulo.`, tip: t`Em uma dimensão, $E_x=-dV/dx$: a inclinação de $V(x)$ determina o campo com sinal trocado.` },
          exercises: [
            tf(t`O campo eletrostático aponta no sentido de potencial decrescente.`, true, t`$\Delta V=-\int\vec E\cdot d\vec l$: ao avançar no sentido do campo, o potencial diminui.`),
            mcq(t`O trabalho elétrico ao mover uma carga sobre uma equipotencial é:`, ['zero', 'sempre positivo', 'sempre negativo', 'igual à carga'], 0, t`Na equipotencial $\Delta V=0$; então $W_{\text{el}}=-q\Delta V=0$.`),
            gen((rng) => { const e = randInt(rng, 2, 8); return num(t`Um campo uniforme de $${e}\,\text{V/m}$ aponta em $+x$. Ao avançar $2\,\text{m}$ em $+x$, calcule $\Delta V$ em V, sem casas decimais.`, -2 * e, t`$\Delta V=-E\Delta x=-${e}\cdot2=-${2 * e}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
            num(t`Entre placas ideais há queda de $12\,\text{V}$ ao longo de $3\,\text{m}$ na direção do campo uniforme. Calcule o módulo de $E$ em V/m, sem casas decimais.`, 4, t`$E=|\Delta V|/d=12/3=4\,\text{V/m}$.`, { unit: 'V/m', tol: 0.5 }),
            mcq(t`Uma superfície equipotencial num ponto onde $\vec E\ne0$ é localmente:`, ['perpendicular ao campo', 'paralela ao campo', 'necessariamente esférica', 'necessariamente plana'], 0, t`Não há variação de potencial em deslocamentos tangentes; portanto $\vec E$ é normal à superfície.`),
            num(t`Se $V(x)=10-2x$ em unidades SI, calcule $E_x$ em V/m, sem casas decimais.`, 2, t`$E_x=-dV/dx=-(-2)=2\,\text{V/m}$.`, { unit: 'V/m', tol: 0.5 }),
            num(t`Uma carga de $3\,\mu\text{C}$ vai de $8\,\text{V}$ a $2\,\text{V}$. Calcule o trabalho elétrico em µJ, sem casas decimais.`, 18, t`$W_{\text{el}}=-q(V_B-V_A)=-3(2-8)=18\,\mu\text{J}$.`, { unit: 'µJ', tol: 0.5 }),
          ],
        },
      ],
    },
    {
      id: 'em-pot-cap', title: 'Capacitor de placas paralelas e dielétricos', parts: [
        {
          card: { title: 'Capacitância e geometria', body: t`Um capacitor armazena cargas $+Q$ e $-Q$ em seus condutores. Sua capacitância é $C=Q/|\Delta V|$, com $Q$ o módulo da carga em uma placa; $1\,\text{F}=1\,\text{C/V}$. Para placas paralelas grandes, no vácuo, desprezando bordas: $$C_0=\frac{\varepsilon_0 A}{d},\quad \varepsilon_0=8{,}85\cdot10^{-12}\,\text{F/m}.$$`, visual: laboratorio('capacitor'), tip: t`O gráfico mostra $C=\kappa C_0$ para um dielétrico preenchendo todo o espaço; ajuste $\kappa$.` },
          exercises: [
            mcq(t`A unidade SI de capacitância é:`, ['farad', 'volt', 'joule', 'coulomb'], 0, t`$C=Q/|\Delta V|$ é medida em farads, equivalentes a coulombs por volt.`),
            tf(t`Aumentar a área das placas ideais, mantendo a distância, aumenta a capacitância.`, true, t`Em $C_0=\varepsilon_0A/d$, a capacitância é proporcional à área.`),
            num(t`Um capacitor tem $Q=12\,\mu\text{C}$ e tensão de $3\,\text{V}$. Calcule $C$ em µF, sem casas decimais.`, 4, t`$C=Q/V=12/3=4\,\mu\text{F}$.`, { unit: 'µF', tol: 0.5 }),
            gen((rng) => { const c = randInt(rng, 2, 8); return num(t`Um capacitor de $${c}\,\mu\text{F}$ recebe $4\,\text{V}$. Calcule o módulo da carga em uma placa em µC, sem casas decimais.`, 4 * c, t`$Q=CV=${c}\cdot4=${4 * c}\,\mu\text{C}$.`, { unit: 'µC', tol: 0.5 }); }),
            inter(t`O capacitor tinha $C_0=2\,\text{pF}$ no vácuo. Ajuste o dielétrico para obter $C=6\,\text{pF}$ no ponto dourado.`, 'plot', laboratorio('capacitor').props, (v) => v.p.a === 3, t`$\kappa=3$`, t`$C=\kappa C_0$: $\kappa=6/2=3$.`),
            num(t`Placas ideais no vácuo têm área $0{,}02\,\text{m}^2$ e separação $1\,\text{mm}$. Use $\varepsilon_0=8{,}85\cdot10^{-12}\,\text{F/m}$. Calcule $C$ em pF, com uma casa decimal.`, 177, t`$C=8{,}85\cdot10^{-12}(0{,}02)/(10^{-3})=177\cdot10^{-12}\,\text{F}=177{,}0\,\text{pF}$.`, { unit: 'pF', tol: 0.05 }),
            mcq(t`Se a área dobra e a separação triplica, a capacitância de placas ideais fica:`, ['$2/3$ da inicial', '$3/2$ da inicial', '$6$ vezes maior', 'inalterada'], 0, t`$C\propto A/d$: o fator é $2/3$.`),
          ],
        },
        {
          card: { title: 'Dielétricos e energia armazenada', body: t`Um dielétrico linear preenchendo todo o espaço entre placas aumenta a capacitância para $C=\kappa C_0$, com $\kappa>1$. A energia armazenada é $$U_C=\frac{Q^2}{2C}=\frac12 CV^2=\frac12 QV.$$ Ao inserir o material: com capacitor isolado, $Q$ permanece fixo; ligado a uma bateria ideal, $V$ permanece fixo.`, tip: t`Compare as situações antes de escolher a forma da energia: $Q$ fixo e $V$ fixo levam a resultados diferentes.` },
          exercises: [
            tf(t`Um dielétrico linear que preenche todo o capacitor aumenta sua capacitância por um fator $\kappa>1$.`, true, t`Com geometria fixa, $C=\kappa C_0$.`),
            mcq(t`Um capacitor isolado tem dielétrico inserido entre as placas. Qual grandeza permanece fixa?`, ['carga livre nas placas', 'tensão entre placas', 'energia armazenada', 'campo elétrico'], 0, t`Isolado, o capacitor não troca carga livre com uma fonte; $Q$ permanece constante.`),
            gen((rng) => { const k = randInt(rng, 2, 5); return num(t`Um capacitor no vácuo de $2\,\text{pF}$ é inteiramente preenchido por um dielétrico de $\kappa=${k}$. Calcule $C$ em pF, sem casas decimais.`, 2 * k, t`$C=\kappa C_0=${k}\cdot2=${2 * k}\,\text{pF}$.`, { unit: 'pF', tol: 0.5 }); }),
            num(t`Um capacitor de $4\,\mu\text{F}$ está sob $3\,\text{V}$. Calcule sua energia em µJ, sem casas decimais.`, 18, t`$U_C=\frac12 CV^2=\frac12(4)(3^2)=18\,\mu\text{J}$.`, { unit: 'µJ', tol: 0.5 }),
            mcq(t`Um capacitor isolado é preenchido por dielétrico com $\kappa=2$. A tensão final é:`, ['metade da inicial', 'o dobro da inicial', 'igual à inicial', 'quatro vezes a inicial'], 0, t`$Q$ é fixo e $C$ dobra; por $V=Q/C$, a tensão cai à metade.`),
            mcq(t`Com a bateria ideal ligada, inserir um dielétrico que dobra $C$ faz a energia armazenada:`, ['dobrar', 'cair à metade', 'ficar igual', 'quadruplicar'], 0, t`A bateria fixa $V$; em $U_C=CV^2/2$, dobrar $C$ dobra a energia. A fonte troca energia e carga com o sistema.`),
            num(t`Um capacitor isolado armazena $24\,\mu\text{J}$. Um dielétrico preenche todo o espaço e triplica $C$. Calcule a energia final em µJ, sem casas decimais.`, 8, t`Com $Q$ fixo, $U_C=Q^2/(2C)$; triplicar $C$ divide a energia por 3: $24/3=8\,\mu\text{J}$.`, { unit: 'µJ', tol: 0.5 }),
          ],
        },
      ],
    },
  ],
};
