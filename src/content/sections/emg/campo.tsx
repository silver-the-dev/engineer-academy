import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, plot, tf } from '../../helpers';
import { Arrow, Pt } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;

// Cargas de ±1 nC; coordenadas em metros. P fica na origem.
const campoLab = () => plot({
  view: { xMin: -3.5, xMax: 3.5, yMin: -3, yMax: 3 },
  points: [
    { id: 'mais', x: -2, y: 0, color: C.p2, label: '+' },
    { id: 'menos', x: 0, y: 2, color: C.p3, label: '−' },
  ],
  constrain: (_id: string, x: number, y: number) => {
    const a = Math.max(-3, Math.min(3, Math.round(x)));
    const b = Math.max(-2, Math.min(2, Math.round(y)));
    return a === 0 && b === 0 ? { x: 1, y: 0 } : { x: a, y: b };
  },
  render: ({ pts }: any) => {
    const contribution = (pt: { x: number; y: number }, q: number) => {
      const r = Math.hypot(pt.x, pt.y);
      return { x: -9 * q * pt.x / r ** 3, y: -9 * q * pt.y / r ** 3 };
    };
    const a = contribution(pts.mais, 1);
    const b = contribution(pts.menos, -1);
    const x = a.x + b.x;
    const y = a.y + b.y;
    const m = Math.hypot(x, y);
    const scale = m ? 1.5 / m : 0;
    return <><Pt x={0} y={0} label="P" color={C.gold} />{m > 1e-8 && <Arrow x1={0} y1={0} x2={x * scale} y2={y * scale} color={C.gold} label="E" />}</>;
  },
  info: ({ pts }: any) => {
    const component = (pt: { x: number; y: number }, q: number) => {
      const r = Math.hypot(pt.x, pt.y);
      return [-9 * q * pt.x / r ** 3, -9 * q * pt.y / r ** 3];
    };
    const a = component(pts.mais, 1), b = component(pts.menos, -1);
    return t`$\vec E(P)=(${fmt(a[0] + b[0], 2)}\,\hat{\imath}+${fmt(a[1] + b[1], 2)}\,\hat{\jmath})\,\text{N/C}$ · seta de comprimento fixo indica o sentido; sem seta quando $E=0$.`;
  },
});

const fluxoLab = () => plot({
  view: { xMin: -1, xMax: 5, yMin: -1, yMax: 4 },
  params: [{ key: 'e', label: 'E', min: 0, max: 4, step: 1, value: 1, color: C.p2 }, { key: 'a', label: 'A', min: 1, max: 3, step: 1, value: 1, color: C.p3 }],
  render: ({ p }: any) => <><Arrow x1={0} y1={1} x2={p.e} y2={1} color={C.p2} label="E" /><Pt x={4} y={1} color={C.p3} label="A" /></>,
  info: ({ p }: any) => t`Campo uniforme normal à superfície plana: $E=${p.e}\,\text{N/C}$, $A=${p.a}\,\text{m}^2$, $\Phi=EA=${p.e * p.a}\,\text{N}\cdot\text{m}^2/\text{C}$.`,
});

const alinhamento = () => inter(t`Arraste as cargas para $+1\,\text{nC}$ em $(-2,\,0)\,\text{m}$ e $-1\,\text{nC}$ em $(2,\,0)\,\text{m}$. Observe o campo em P.`, 'plot', campoLab().props,
  (v) => v.pts.mais.x === -2 && v.pts.mais.y === 0 && v.pts.menos.x === 2 && v.pts.menos.y === 0,
  t`Coloque a positiva à esquerda e a negativa à direita.`, t`Em P, as duas contribuições apontam para a direita: afastam-se da positiva e aproximam-se da negativa.`);

export const campoEletrico: UnitDef = {
  id: 'em-campo', title: 'Carga e campo elétrico', icon: '⚛️',
  subtitle: 'Coulomb, campo, superposição e fluxo elétrico',
  source: 'Conteúdo complementar: Halliday, Resnick e Walker, Fundamentos de Física, capítulos 21–23.',
  extra: true,
  guide: t`Carga é conservada e quantizada. No vácuo, $k\approx9\times10^9\,\text{N}\cdot\text{m}^2/\text{C}^2$ e $F=k|q_1q_2|/r^2$. O campo de uma carga puntiforme tem módulo $E=k|q|/r^2$; $\vec F=q\vec E$. Some campos vetorialmente. Para uma superfície fechada, $\displaystyle\oint\vec E\cdot d\vec A=Q_{\rm int}/\varepsilon_0$, com normal para fora e $\varepsilon_0\approx8{,}85\times10^{-12}\,\text{C}^2/(\text{N}\cdot\text{m}^2)$.`,
  lessons: [
    { id: 'em-campo-coulomb', title: 'Lei de Coulomb', parts: [
      { card: { title: 'Carga e interação', body: t`A carga elétrica é conservada e vem em múltiplos da carga elementar $e=1{,}6\times10^{-19}\,\text{C}$. Cargas de mesmo sinal se repelem; de sinais opostos se atraem. No laboratório, arraste as cargas e observe o campo em P.`, visual: campoLab() }, exercises: [
        mcq('Duas cargas positivas se comportam como?', ['Repelem-se', 'Atraem-se', 'Não interagem', 'Perdem carga'], 0, 'Cargas de mesmo sinal se repelem.'),
        tf('Um elétron tem carga negativa.', true, t`A carga do elétron é $-e$.`),
        mcq('Um corpo neutro perde elétrons. Qual é sua carga final?', ['Positiva', 'Negativa', 'Nula', 'Alternada'], 0, 'Ao perder carga negativa, fica com excesso de carga positiva.'),
        gen((rng) => { const n = randInt(rng, 2, 9); return num(t`Um corpo ganha $${n}$ elétrons. Qual é sua carga em múltiplos de $e$? Digite o inteiro.`, -n, t`Cada elétron tem carga $-e$; logo $q=-${n}e$.`, { unit: 'e', tol: 0.01 }); }),
        num(t`Duas cargas de $+3\,\mu\text{C}$ e $-1\,\mu\text{C}$ formam um sistema isolado. Qual a carga total em $\mu\text{C}$, com uma casa decimal?`, 2, t`A soma algébrica é $3-1=2\,\mu\text{C}$.`, { unit: 'µC', tol: 0.05 }),
        alinhamento(),
        mcq(t`Duas esferas idênticas isoladas, com $+6\,\mu\text{C}$ e $-2\,\mu\text{C}$, encostam e são separadas. Qual carga fica em cada uma?`, [t`$+2\,\mu\text{C}$`, t`$+4\,\mu\text{C}$`, t`$-2\,\mu\text{C}$`, t`$0\,\mu\text{C}$`], 0, t`A carga total $4\,\mu\text{C}$ se divide igualmente entre esferas idênticas: $2\,\mu\text{C}$ em cada.`),
      ] },
      { card: { title: 'A lei do inverso do quadrado', body: t`Para cargas puntiformes em repouso no vácuo, $F=k|q_1q_2|/r^2$, com $k=9\times10^9\,\text{N}\cdot\text{m}^2/\text{C}^2$. A força age ao longo da linha que une as cargas; as forças mútuas têm módulos iguais e sentidos opostos.`, example: t`$1\,\mu\text{C}$ e $2\,\mu\text{C}$ a $1\,\text{m}$ interagem com $F=0{,}018\,\text{N}$.` }, exercises: [
        tf('Duplicar a distância entre duas cargas reduz a força a um quarto.', true, t`Como $F\propto1/r^2$, obtemos $F/2^2=F/4$.`),
        mcq('Se uma carga triplica e a distância não muda, o módulo da força fica:', ['três vezes maior', 'nove vezes maior', 'um terço', 'igual'], 0, 'A força é proporcional ao produto das cargas.'),
        num(t`No vácuo, duas cargas de $1\,\mu\text{C}$ estão a $1\,\text{m}$. Use $k=9\times10^9$ e dê o módulo da força em mN, com uma casa decimal.`, 9, t`$F=9\times10^9(10^{-6})^2/1^2=0{,}009\,\text{N}=9\,\text{mN}$.`, { unit: 'mN', tol: 0.05 }),
        gen((rng) => { const q = randInt(rng, 2, 8); return num(t`No vácuo, cargas $1\,\mu\text{C}$ e $${q}\,\mu\text{C}$ distam $1\,\text{m}$. Use $k=9\times10^9$; dê $F$ em mN, com uma casa decimal.`, 9 * q, t`$F=9\times10^9(1\times10^{-6})(${q}\times10^{-6})=${9*q}\,\text{mN}$.`, { unit: 'mN', tol: 0.05 }); }),
        mcq('Uma carga positiva e uma negativa se atraem. Compare os módulos das forças que uma exerce sobre a outra.', ['São iguais', 'A maior carga sofre força maior', 'A menor carga sofre força maior', 'Uma força é zero'], 0, 'Pela terceira lei de Newton, as forças do par têm módulos iguais e sentidos opostos.'),
        num(t`Duas cargas de $2\,\mu\text{C}$ no vácuo distam $2\,\text{m}$. Use $k=9\times10^9$; dê $F$ em mN, com uma casa decimal.`, 9, t`$F=9\times10^9(2\times10^{-6})^2/2^2=0{,}009\,\text{N}=9\,\text{mN}$.`, { unit: 'mN', tol: 0.05 }),
        mcq('Para quadruplicar a força sem alterar as cargas, a distância deve ser:', ['reduzida à metade', 'duplicada', 'quadruplicada', 'reduzida a um quarto'], 0, t`Como $F\propto1/r^2$, trocar $r$ por $r/2$ multiplica $F$ por $4$.`),
      ] },
    ] },
    { id: 'em-campo-e', title: 'Campo elétrico', parts: [
      { card: { title: 'Campo e carga de prova', body: t`O campo elétrico é a força por unidade de carga de prova positiva: $\vec E=\vec F/q_0$. Sua unidade é $\text{N/C}$. O campo existe mesmo sem a carga de prova; uma carga negativa sofre força em sentido oposto a $\vec E$.`, visual: campoLab() }, exercises: [
        mcq('Qual é a unidade SI de campo elétrico?', [t`$\text{N/C}$`, t`$\text{C/N}$`, t`$\text{N}\cdot\text{C}$`, t`$\text{C}$`], 0, t`De $E=F/q$, a unidade é $\text{N/C}$.`),
        tf('Uma carga de prova negativa sofre força no sentido do campo elétrico.', false, t`Em $\vec F=q\vec E$, o sinal negativo inverte o sentido.`),
        num(t`Uma carga de prova de $2\,\text{C}$ sofre força de $6\,\text{N}$. Qual o módulo do campo em N/C, com uma casa decimal?`, 3, t`$E=F/q=6/2=3\,\text{N/C}$.`, { unit: 'N/C', tol: 0.05 }),
        gen((rng) => { const e = randInt(rng, 2, 9); return num(t`Em campo uniforme de $${e}\,\text{N/C}$, uma carga de $2\,\text{C}$ sofre força de qual módulo em N? Use uma casa decimal.`, 2 * e, t`$F=|q|E=2\cdot${e}=${2*e}\,\text{N}$.`, { unit: 'N', tol: 0.05 }); }),
        alinhamento(),
        mcq(t`O campo aponta para a direita. Qual o sentido da força sobre uma carga negativa?`, ['Para a esquerda', 'Para a direita', 'Para cima', 'A força é nula'], 0, t`$q<0$ inverte o sentido de $\vec F=q\vec E$.`),
        num(t`Uma carga de $-3\,\mu\text{C}$ está num campo de módulo $200\,\text{N/C}$. Qual o módulo da força em mN, com uma casa decimal?`, 0.6, t`$F=|q|E=3\times10^{-6}\cdot200=0{,}0006\,\text{N}=0{,}6\,\text{mN}$.`, { unit: 'mN', tol: 0.05 }),
      ] },
      { card: { title: 'Campo de uma carga puntiforme', body: t`A distância $r$ de uma carga puntiforme $Q$, no vácuo, $E=k|Q|/r^2$. O campo aponta para fora se $Q>0$ e para a carga se $Q<0$. Na posição da própria carga puntiforme, a expressão é singular.`, example: t`Para $Q=1\,\text{nC}$ a $1\,\text{m}$, $E=9\,\text{N/C}$.` }, exercises: [
        mcq('O campo de uma carga positiva isolada aponta:', ['para fora da carga', 'para a carga', 'sempre para cima', 'em círculos'], 0, 'Uma carga de prova positiva é repelida pela carga positiva.'),
        tf('A carga fonte negativa produz campo apontando para ela.', true, 'Uma carga de prova positiva é atraída pela carga negativa.'),
        num(t`No vácuo, qual o campo a $1\,\text{m}$ de $2\,\text{nC}$? Use $k=9\times10^9$ e dê o módulo em N/C com uma casa decimal.`, 18, t`$E=9\times10^9(2\times10^{-9})/1^2=18\,\text{N/C}$.`, { unit: 'N/C', tol: 0.05 }),
        gen((rng) => { const q = randInt(rng, 1, 8); return num(t`No vácuo, uma carga de $${q}\,\text{nC}$ está a $1\,\text{m}$ de P. Use $k=9\times10^9$ e calcule $E$ em N/C, com uma casa decimal.`, 9*q, t`$E=9\times10^9(${q}\times10^{-9})/1^2=${9*q}\,\text{N/C}$.`, { unit: 'N/C', tol: 0.05 }); }),
        mcq('Se a distância à carga fonte triplica, o módulo do campo passa a ser:', ['um nono', 'um terço', 'três vezes maior', 'nove vezes maior'], 0, t`$E\propto 1/r^2$; portanto $E'=E/3^2=E/9$.`),
        num(t`Qual o módulo de $E$ a $2\,\text{m}$ de $4\,\text{nC}$ no vácuo? Use $k=9\times10^9$ e responda em N/C com uma casa decimal.`, 9, t`$E=9\times10^9(4\times10^{-9})/2^2=9\,\text{N/C}$.`, { unit: 'N/C', tol: 0.05 }),
        mcq(t`Uma carga negativa está à esquerda de P. Em P, o campo que ela produz aponta:`, ['para a esquerda', 'para a direita', 'para cima', 'para baixo'], 0, 'O campo aponta de P para a carga negativa, portanto para a esquerda.'),
      ] },
    ] },
    { id: 'em-campo-linhas', title: 'Linhas de campo e superposição', parts: [
      { card: { title: 'Lendo as linhas', body: t`A tangente à linha em cada ponto dá a direção de $\vec E$; a seta dá seu sentido. Onde as linhas estão mais densas, o campo é mais intenso. Linhas saem de cargas positivas e chegam a negativas ou ao infinito.`, visual: campoLab() }, exercises: [
        tf('Linhas de campo se cruzam em um ponto onde o campo tem direção definida.', false, 'O cruzamento daria duas direções distintas ao mesmo campo naquele ponto.'),
        mcq('As setas de linhas de campo saem de qual carga?', ['Positiva', 'Negativa', 'Neutra', 'De qualquer carga no mesmo sentido'], 0, 'As setas seguem a força sobre uma carga de prova positiva, repelida pela positiva.'),
        mcq('Em uma representação consistente, onde as linhas estão mais próximas, o campo é:', ['mais intenso', 'mais fraco', 'sempre nulo', 'necessariamente horizontal'], 0, 'A densidade de linhas representa o módulo do campo.'),
        alinhamento(),
        gen((rng) => { const n = randInt(rng, 2, 8); return num(t`Uma figura usa $${n}$ linhas por unidade de área onde o campo vale $${n}\,\text{N/C}$. Na mesma escala, quantas linhas por unidade de área representam o dobro do campo? Responda com uma casa decimal.`, 2*n, t`Na mesma escala, a densidade é proporcional ao módulo: $2\cdot${n}=${2*n}$.`, { unit: 'linhas/m²', tol: 0.05 }); }),
        tf('Uma linha de campo pode terminar no espaço vazio, longe de cargas e do infinito.', false, 'Na eletrostática, linhas começam e terminam em cargas ou se estendem ao infinito.'),
        mcq('No ponto médio entre cargas iguais e positivas, o campo resultante é:', ['nulo', 'para a direita', 'para a esquerda', 'perpendicular à linha das cargas'], 0, 'Os campos têm módulos iguais e sentidos opostos no ponto médio, cancelando-se.'),
      ] },
      { card: { title: 'Somar vetores', body: t`O princípio da superposição diz $\vec E=\sum_i\vec E_i$. Calcule cada contribuição no mesmo ponto, atribua direção e sentido e some componentes; não some simplesmente os módulos quando as direções diferem.`, example: t`Se $\vec E_1=3\hat{\imath}$ e $\vec E_2=4\hat{\jmath}$ em N/C, então $|\vec E|=5\,\text{N/C}$.` }, exercises: [
        mcq('Campos de 3 N/C para a direita e 2 N/C para a direita resultam em:', ['5 N/C para a direita', '1 N/C para a direita', '5 N/C para a esquerda', 'zero'], 0, 'Na mesma direção e sentido, somamos os módulos: 3 + 2 = 5 N/C.'),
        num(t`Campos de $7\,\text{N/C}$ para a direita e $2\,\text{N/C}$ para a esquerda atuam no mesmo ponto. Qual o módulo resultante em N/C, com uma casa decimal?`, 5, t`Com direita positiva, $E_x=7-2=5\,\text{N/C}$.`, { unit: 'N/C', tol: 0.05 }),
        gen((rng) => { const e = randInt(rng, 2, 8); return num(t`Dois campos iguais de $${e}\,\text{N/C}$ apontam em sentidos opostos na mesma reta. Qual o módulo resultante em N/C, com uma casa decimal?`, 0, t`$E_x=${e}-${e}=0\,\text{N/C}$.`, { unit: 'N/C', tol: 0.05 }); }),
        num(t`Campos perpendiculares de $3\,\text{N/C}$ e $4\,\text{N/C}$ atuam no mesmo ponto. Qual o módulo resultante em N/C, com uma casa decimal?`, 5, t`Pelo teorema de Pitágoras, $E=\sqrt{3^2+4^2}=5\,\text{N/C}$.`, { unit: 'N/C', tol: 0.05 }),
        tf('Campos de módulos iguais sempre se anulam.', false, 'Eles só se anulam se também tiverem direções iguais e sentidos opostos.'),
        mcq('No ponto médio entre uma carga positiva à esquerda e uma negativa de mesmo módulo à direita, o campo resultante aponta:', ['para a direita', 'para a esquerda', 'para cima', 'é nulo'], 0, 'O campo sai da positiva e entra na negativa; no meio, ambos apontam para a direita.'),
        num(t`No vácuo, cargas $+1\,\text{nC}$ e $-1\,\text{nC}$ estão a $2\,\text{m}$ de P, em lados opostos. Use $k=9\times10^9$ e calcule o módulo do campo em P, em N/C com uma casa decimal.`, 4.5, t`Cada campo vale $9/2^2=2{,}25\,\text{N/C}$; os sentidos coincidem, então $E=4{,}5\,\text{N/C}$.`, { unit: 'N/C', tol: 0.05 }),
      ] },
    ] },
    { id: 'em-campo-gauss', title: 'Lei de Gauss', parts: [
      { card: { title: 'Fluxo elétrico', body: t`O fluxo mede a componente do campo que atravessa uma superfície. Para campo uniforme em área plana, $\Phi=EA\cos\theta$, onde $\theta$ é o ângulo entre o campo e a normal escolhida. Para superfície fechada, a normal aponta para fora.`, visual: fluxoLab() }, exercises: [
        mcq(t`Em $\Phi=EA\cos\theta$, o ângulo é medido entre o campo e:`, ['a normal à superfície', 'o plano da superfície', 'a borda da superfície', 'a velocidade da carga'], 0, 'O produto escalar usa a normal à superfície.'),
        tf('Um campo paralelo a uma superfície plana tem fluxo nulo por ela.', true, t`O campo é perpendicular à normal, então $\cos90^\circ=0$.`),
        num(t`Campo normal de $3\,\text{N/C}$ atravessa área plana de $2\,\text{m}^2$ no sentido da normal. Calcule o fluxo em N·m²/C com uma casa decimal.`, 6, t`$\Phi=EA\cos0^\circ=3\cdot2=6\,\text{N}\cdot\text{m}^2/\text{C}$.`, { unit: 'N·m²/C', tol: 0.05 }),
        gen((rng) => { const e = randInt(rng, 2, 8); return num(t`Campo uniforme de $${e}\,\text{N/C}$ é paralelo à normal de uma área plana de $2\,\text{m}^2$ e tem o mesmo sentido dela. Calcule o fluxo em N·m²/C com uma casa decimal.`, 2*e, t`$\Phi=EA\cos0^\circ=${e}\cdot2=${2*e}\,\text{N}\cdot\text{m}^2/\text{C}$.`, { unit: 'N·m²/C', tol: 0.05 }); }),
        inter(t`No visual, ajuste o campo e a área para que o fluxo seja $6\,\text{N}\cdot\text{m}^2/\text{C}$.`, 'plot', fluxoLab().props, (v) => v.p.e * v.p.a === 6, t`Use, por exemplo, $E=3$ e $A=2$.`, t`Com campo normal, $\Phi=EA$; por exemplo, $3\cdot2=6\,\text{N}\cdot\text{m}^2/\text{C}$.`),
        num(t`Campo uniforme de $10\,\text{N/C}$ atravessa área plana de $2\,\text{m}^2$ a $60^\circ$ da normal. Calcule o fluxo em N·m²/C com uma casa decimal.`, 10, t`$\Phi=10\cdot2\cos60^\circ=10\,\text{N}\cdot\text{m}^2/\text{C}$.`, { unit: 'N·m²/C', tol: 0.05 }),
        mcq('O fluxo por uma superfície plana é negativo quando o campo:', ['tem componente oposta à normal escolhida', 'é paralelo à superfície', 'é nulo', 'tem componente no sentido da normal'], 0, t`O produto escalar $\vec E\cdot\vec A$ é negativo quando a componente normal aponta contra a normal escolhida.`),
      ] },
      { card: { title: 'Carga interna e simetria', body: t`A lei de Gauss vale para qualquer superfície fechada: $\displaystyle\oint\vec E\cdot d\vec A=Q_{\rm int}/\varepsilon_0$. O fluxo líquido depende da carga total interna, mas o campo local também pode receber contribuições externas. Simetria esférica permite obter $E=|Q|/(4\pi\varepsilon_0r^2)$ fora da distribuição.`, tip: t`Fluxo líquido zero não garante campo zero em todos os pontos.` }, exercises: [
        mcq('Na lei de Gauss, qual carga determina o fluxo líquido?', ['A carga total dentro da superfície fechada', 'Toda carga do universo', 'Somente a maior carga externa', 'A carga na origem, esteja onde estiver'], 0, 'A lei relaciona o fluxo líquido à soma algébrica das cargas internas.'),
        tf('Fluxo líquido zero implica campo elétrico nulo em todos os pontos da superfície.', false, 'Um campo uniforme pode entrar por um lado e sair pelo outro, dando fluxo líquido zero sem ser nulo.'),
        mcq('Uma carga externa a uma superfície fechada contribui quanto para o fluxo líquido total através dela?', ['Zero', 'Sempre positivo', 'Sempre negativo', 'Depende apenas da área'], 0, 'Suas linhas que entram também saem: a contribuição líquida é zero.'),
        gen((rng) => { const n = randInt(rng, 2, 9); return num(t`Uma superfície fechada contém carga líquida $${fmt(8.85*n, 2)}\,\text{nC}$. Use $\varepsilon_0=8{,}85\times10^{-12}$ no SI. Qual o fluxo em N·m²/C, com uma casa decimal?`, 1000*n, t`Pela lei de Gauss, $\Phi=(${fmt(8.85*n, 2)}\times10^{-9})/(8{,}85\times10^{-12})=${1000*n}\,\text{N}\cdot\text{m}^2/\text{C}$.`, { unit: 'N·m²/C', tol: 0.05 }); }),
        num(t`Uma superfície fechada contém $+26{,}55\,\text{nC}$ e $-44{,}25\,\text{nC}$. Use $\varepsilon_0=8{,}85\times10^{-12}$ no SI. Qual o fluxo líquido em N·m²/C, com uma casa decimal?`, -2000, t`$Q_{\rm int}=26{,}55-44{,}25=-17{,}70\,\text{nC}$, logo $\Phi=-17{,}70\times10^{-9}/(8{,}85\times10^{-12})=-2000\,\text{N}\cdot\text{m}^2/\text{C}$.`, { unit: 'N·m²/C', tol: 0.05 }),
        mcq('Uma carga puntiforme positiva está no centro de uma esfera. Ao dobrar o raio da esfera, o fluxo total:', ['permanece igual', 'dobra', 'quadruplica', 'cai a um quarto'], 0, t`A carga interna não muda, então $\Phi=Q/\varepsilon_0$ é o mesmo.`),
        num(t`Uma carga de $8{,}85\,\text{nC}$ está dentro de uma superfície fechada. Use $\varepsilon_0=8{,}85\times10^{-12}$ no SI. Calcule o fluxo em N·m²/C com uma casa decimal.`, 1000, t`$\Phi=8{,}85\times10^{-9}/(8{,}85\times10^{-12})=1000\,\text{N}\cdot\text{m}^2/\text{C}$.`, { unit: 'N·m²/C', tol: 0.05 }),
      ] },
    ] },
  ],
};
