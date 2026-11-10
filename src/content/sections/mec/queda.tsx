import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, plot, tf } from '../../helpers';
import { FnCurve, Pt } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;

// O controle percorre apenas o intervalo físico entre lançamento e retorno ao nível inicial.
const alturaLab = (v0: number, h0 = 0, fim = 4) => plot({
  view: { xMin: 0, xMax: fim, yMin: -1, yMax: Math.max(25, h0 + v0 * v0 / 19.6 + 3) },
  params: [{ key: 'tempo', label: 'tempo (s)', min: 0, max: fim, step: 0.1, value: 0, color: C.gold }],
  render: ({ p }: any) => <>
    <FnCurve f={(x) => h0 + v0 * x - 4.9 * x * x} from={0} to={fim} color={C.p1} />
    <Pt x={p.tempo} y={h0 + v0 * p.tempo - 4.9 * p.tempo ** 2} color={C.gold} />
  </>,
  info: ({ p }: any) => t`$t=${fmt(p.tempo, 1)}\,\text{s}$ · $y=${fmt(h0 + v0 * p.tempo - 4.9 * p.tempo ** 2, 1)}\,\text{m}$`,
});

const graficoEx = (prompt: string, v0: number, h0: number, fim: number, alvo: number, explicacao: string) =>
  inter(prompt, 'plot', alturaLab(v0, h0, fim).props, (v) => Math.abs(v.p.tempo - alvo) < 0.051,
    t`Ajuste o tempo para $${fmt(alvo, 1)}\,\text{s}$.`, explicacao);

export const quedaLivre: UnitDef = {
  id: 'm-queda', title: 'Queda livre', icon: '🍎',
  subtitle: 'Gravidade, lançamento vertical e altura no tempo',
  source: 'Física Aplicada I · Aula 4 — Aceleração em queda livre',
  guide: t`Desprezando o ar e adotando $y$ para cima, $a_y=-g=-9,8\,\text{m/s}^2$. Então $v_y=v_0-gt$ e $y=y_0+v_0t-\frac12gt^2$. No lançamento para cima, $t_{sub}=v_0/g$ e $\Delta y_{max}=v_0^2/(2g)$. Para retornar ao mesmo nível, $t_{total}=2t_{sub}$ e a velocidade tem módulo igual ao inicial e sentido oposto.`,
  lessons: [
    { id: 'm-queda-g', title: 'Aceleração da gravidade', parts: [
      { card: { title: 'A gravidade aponta para baixo', body: t`Em queda livre, apenas a gravidade atua. Perto da superfície terrestre, desprezando o ar, a aceleração é aproximadamente constante e tem módulo $g=9,8\,\text{m/s}^2$. Com $y$ positivo para cima, $a_y=-9,8\,\text{m/s}^2$, independentemente da massa.`, visual: alturaLab(0, 19.6, 2), tip: 'Mova o tempo: a altura diminui cada vez mais depressa. O gráfico termina no solo.' }, exercises: [
        mcq('Com o eixo positivo para cima, qual é a aceleração em queda livre?', [t`$-9,8\,\text{m/s}^2$`, t`$+9,8\,\text{m/s}^2$`, '$0$', t`$-9,8\,\text{m/s}$`], 0, t`A gravidade aponta para baixo, sentido negativo: $a_y=-g$.`),
        tf('Sem resistência do ar, a aceleração depende da massa do corpo.', false, 'No mesmo local, todos têm a mesma aceleração gravitacional, independentemente da massa.'),
        num(t`Um corpo é solto do repouso. Após $1\,\text{s}$, qual é sua velocidade com sinal, em m/s? Use uma casa decimal.`, -9.8, t`$v=0-9,8\cdot1=-9,8\,\text{m/s}$.`, {unit:'m/s', tol:0.05}),
        gen(rng => { const s = randInt(rng, 1, 4); return num(t`Um corpo é solto do repouso. Após $${s}\,\text{s}$, qual é sua velocidade com sinal, em m/s? Use uma casa decimal.`, -9.8*s, t`$v=0-9,8\cdot${s}=-${fmt(9.8*s, 1)}\,\text{m/s}$.`, {unit:'m/s', tol:0.05}); }),
        tf('Um corpo lançado para cima tem aceleração para cima enquanto sobe.', false, 'Mesmo na subida, a gravidade aponta para baixo e a aceleração é negativa.'),
        graficoEx(t`No gráfico de um corpo solto de $19,6\,\text{m}$, ajuste o tempo até chegar ao solo.`, 0, 19.6, 2, 2, t`No solo, $0=19,6-4,9t^2$; logo $t^2=4$ e o tempo positivo é $2\,\text{s}$.`),
        num(t`Uma bola tem velocidade inicial $+4,9\,\text{m/s}$. Qual é sua velocidade após $2\,\text{s}$, em m/s, com uma casa decimal?`, -14.7, t`$v=4,9-9,8\cdot2=-14,7\,\text{m/s}$. O sinal indica descida.`, {unit:'m/s', tol:0.05}),
      ] },
      { card: { title: 'Posição durante a queda', body: t`Com $y$ para cima, as equações são $v=v_0-9,8t$ e $y=y_0+v_0t-4,9t^2$, em unidades SI. Se o corpo é solto, $v_0=0$ e a distância caída é $4,9t^2$.`, example: t`Após $2\,\text{s}$ de queda a partir do repouso, a distância é $4,9\cdot2^2=19,6\,\text{m}$.` }, exercises: [
        mcq('Um corpo solto do repouso tem qual velocidade inicial?', [t`$0\,\text{m/s}$`, t`$9,8\,\text{m/s}$`, t`$-9,8\,\text{m/s}$`, t`$4,9\,\text{m/s}$`], 0, 'Soltar do repouso significa velocidade inicial nula.'),
        num(t`Que distância, em m e com uma casa decimal, um corpo solto percorre em $1\,\text{s}$?`, 4.9, t`$d=4,9\cdot1^2=4,9\,\text{m}$.`, {unit:'m', tol:0.05}),
        gen(rng => { const s = randInt(rng, 1, 4); return num(t`Um corpo é solto do repouso. Qual a distância caída em $${s}\,\text{s}$, em m e com uma casa decimal?`, 4.9*s*s, t`$d=4,9\cdot${s}^2=${fmt(4.9*s*s, 1)}\,\text{m}$.`, {unit:'m', tol:0.05}); }),
        num(t`Uma bola é solta de $44,1\,\text{m}$. Qual sua altura após $2\,\text{s}$, em m e com uma casa decimal?`, 24.5, t`$y=44,1-4,9\cdot2^2=24,5\,\text{m}$.`, {unit:'m', tol:0.05}),
        tf('Ao dobrar o tempo de queda a partir do repouso, a distância caída quadruplica.', true, t`Como $d=4,9t^2$, trocar $t$ por $2t$ multiplica $d$ por $4$.`),
        num(t`Um objeto é solto e cai $44,1\,\text{m}$. Quanto tempo leva, em s e com uma casa decimal?`, 3, t`$44,1=4,9t^2$ dá $t^2=9$; escolhemos $t=3\,\text{s}$.`, {unit:'s', tol:0.05}),
        num(t`Uma pedra é solta de $78,4\,\text{m}$. Qual o módulo da velocidade ao atingir o solo, em m/s e com uma casa decimal?`, 39.2, t`$78,4=4,9t^2$ dá $t=4\,\text{s}$; assim $v=-39,2\,\text{m/s}$ e o módulo é $39,2\,\text{m/s}$.`, {unit:'m/s', tol:0.05}),
      ] },
    ] },
    { id: 'm-queda-vert', title: 'Lançamento vertical', parts: [
      { card: { title: 'Subida e ponto mais alto', body: t`Lançada para cima com $v_0>0$, a bola perde $9,8\,\text{m/s}$ de velocidade a cada segundo. No ponto mais alto, $v=0$, mas $a=-g$ continua. Logo $t_{sub}=v_0/g$ e $\Delta y_{max}=v_0^2/(2g)$.`, visual: alturaLab(19.6), tip: 'Mova o controle para percorrer a parábola de altura versus tempo.' }, exercises: [
        mcq('No ponto mais alto, quais são velocidade e aceleração?', [t`$v=0$ e $a=-9,8\,\text{m/s}^2$`, '$v=0$ e $a=0$', t`$v=9,8\,\text{m/s}$ e $a=0$`, t`$v<0$ e $a>0$`], 0, 'No topo a velocidade zera instantaneamente; a gravidade continua atuando para baixo.'),
        num(t`Uma bola sai para cima a $19,6\,\text{m/s}$. Quanto dura a subida, em s e com uma casa decimal?`, 2, t`$t_{sub}=19,6/9,8=2\,\text{s}$.`, {unit:'s', tol:0.05}),
        gen(rng => { const s = randInt(rng, 1, 4); const v = 9.8*s; return num(t`Uma bola é lançada para cima a $${fmt(v, 1)}\,\text{m/s}$. Determine o tempo de subida em s, com uma casa decimal.`, s, t`No topo $0=${fmt(v, 1)}-9,8t$; portanto $t=${s}\,\text{s}$.`, {unit:'s', tol:0.05}); }),
        graficoEx(t`No gráfico do lançamento a $19,6\,\text{m/s}$, ajuste o tempo ao ponto de altura máxima.`, 19.6, 0, 4, 2, t`O topo ocorre quando $v=19,6-9,8t=0$: $t=2\,\text{s}$.`),
        num(t`Para $v_0=19,6\,\text{m/s}$, qual é a altura máxima acima do lançamento, em m e com uma casa decimal?`, 19.6, t`$\Delta y_{max}=19,6^2/(2\cdot9,8)=19,6\,\text{m}$.`, {unit:'m', tol:0.05}),
        tf('No ponto mais alto, a bola permanece parada porque sua aceleração também é zero.', false, t`A velocidade zera por um instante, mas a aceleração continua $-9,8\,\text{m/s}^2$.`),
        num(t`Uma bola parte de $5\,\text{m}$ de altura a $9,8\,\text{m/s}$ para cima. Qual a altura máxima em relação ao solo, em m e com uma casa decimal?`, 9.9, t`A subida acrescenta $9,8^2/(2\cdot9,8)=4,9\,\text{m}$; altura total $5+4,9=9,9\,\text{m}$.`, {unit:'m', tol:0.05}),
      ] },
      { card: { title: 'Subida e descida simétricas', body: t`Sem ar, ao voltar à mesma altura de lançamento, a bola leva na descida o mesmo tempo que levou na subida. As velocidades nessa altura têm módulos iguais e sentidos opostos. Em alturas diferentes, não se pode aplicar diretamente essa igualdade de tempos.`, visual: alturaLab(19.6) }, exercises: [
        tf('Ao retornar à altura de lançamento, o tempo de descida desde o topo iguala o tempo de subida.', true, 'A parábola é simétrica em torno do instante do topo, quando a aceleração é constante.'),
        num(t`Uma bola sobe durante $2\,\text{s}$ e retorna ao nível de lançamento. Qual é o tempo total em s, com uma casa decimal?`, 4, t`Subida e descida duram $2\,\text{s}$ cada: $2+2=4\,\text{s}$.`, {unit:'s', tol:0.05}),
        gen(rng => { const s = randInt(rng, 1, 4); return num(t`Uma bola sai para cima a $${fmt(9.8*s, 1)}\,\text{m/s}$ e volta à altura inicial. Qual o tempo total em s, com uma casa decimal?`, 2*s, t`A subida dura $${fmt(9.8*s, 1)}/9,8=${s}\,\text{s}$; o retorno dura o dobro: $${2*s}\,\text{s}$.`, {unit:'s', tol:0.05}); }),
        graficoEx(t`No gráfico, ajuste o tempo para a volta ao nível inicial após o lançamento a $19,6\,\text{m/s}$.`, 19.6, 0, 4, 4, t`O topo ocorre em $2\,\text{s}$ e a volta ao mesmo nível em $4\,\text{s}$.`),
        num(t`Uma bola sai para cima a $19,6\,\text{m/s}$. Qual sua velocidade com sinal ao retornar à altura inicial, em m/s e com uma casa decimal?`, -19.6, t`No retorno, o módulo é o inicial e o sentido é para baixo: $v=-19,6\,\text{m/s}$.`, {unit:'m/s', tol:0.05}),
        num(t`No lançamento a $19,6\,\text{m/s}$, qual a altura acima da origem em $3\,\text{s}$, em m e com uma casa decimal?`, 14.7, t`$y=19,6\cdot3-4,9\cdot3^2=14,7\,\text{m}$.`, {unit:'m', tol:0.05}),
        mcq(t`A bola passa por uma altura em $1\,\text{s}$ na subida. Se o topo ocorre em $2\,\text{s}$, quando passa pela mesma altura na descida?`, [t`$3\,\text{s}$`, t`$2\,\text{s}$`, t`$4\,\text{s}$`, t`$5\,\text{s}$`], 0, t`Os instantes são simétricos em torno de $2\,\text{s}$: $2+(2-1)=3\,\text{s}$.`),
      ] },
    ] },
    { id: 'm-queda-prob', title: 'Problemas de queda livre', parts: [
      { card: { title: 'Escolha a equação', body: t`Desenhe o eixo, defina origem e sinais, liste dados e escolha a equação. Se o tempo não aparece, use $v^2=v_0^2-2g(y-y_0)$. O quadrado dá o módulo; determine o sinal de $v$ pelo sentido do movimento.`, visual: alturaLab(0, 19.6, 2) }, exercises: [
        mcq('Uma pedra cai de uma ponte. Com eixo positivo para cima, o deslocamento até a água é…', ['negativo', 'positivo', 'zero', 'sempre igual à velocidade'], 0, 'A posição final está abaixo da inicial, portanto $y-y_0<0$.'),
        num(t`Uma pedra é lançada para baixo a $4,9\,\text{m/s}$. Qual sua velocidade com sinal após $1\,\text{s}$, em m/s e com uma casa decimal?`, -14.7, t`$v_0=-4,9$ e $v=-4,9-9,8=-14,7\,\text{m/s}$.`, {unit:'m/s', tol:0.05}),
        gen(rng => { const s = randInt(rng, 1, 3); return num(t`Uma pedra é lançada para baixo a $9,8\,\text{m/s}$. Qual a distância percorrida após $${s}\,\text{s}$, em m e com uma casa decimal?`, 9.8*s+4.9*s*s, t`A distância é $9,8\cdot${s}+4,9\cdot${s}^2=${fmt(9.8*s+4.9*s*s, 1)}\,\text{m}$.`, {unit:'m', tol:0.05}); }),
        graficoEx(t`Uma pedra solta de $19,6\,\text{m}$ atinge que tempo ao chegar ao solo? Ajuste o gráfico.`, 0, 19.6, 2, 2, t`$19,6=4,9t^2$, então $t=2\,\text{s}$.`),
        num(t`Uma bola é solta de $19,6\,\text{m}$. Qual o módulo da velocidade no solo em m/s, com uma casa decimal?`, 19.6, t`$v^2=2\cdot9,8\cdot19,6=384,16$; portanto $|v|=19,6\,\text{m/s}$.`, {unit:'m/s', tol:0.05}),
        tf('A fórmula $v^2=v_0^2-2g\Delta y$ determina sozinha se a velocidade aponta para cima ou para baixo.', false, 'A fórmula determina o quadrado da velocidade; o sentido deve ser obtido da etapa do movimento.'),
        num(t`Uma pedra é lançada para baixo a $9,8\,\text{m/s}$ e cai por $2\,\text{s}$. Qual o deslocamento com sinal, em m e com uma casa decimal?`, -39.2, t`$\Delta y=-9,8\cdot2-4,9\cdot2^2=-39,2\,\text{m}$.`, {unit:'m', tol:0.05}),
      ] },
      { card: { title: 'Alturas e instantes', body: t`Uma mesma altura pode ser alcançada duas vezes: na subida e na descida. Resolva $y=y_0+v_0t-4,9t^2$ e mantenha os tempos não negativos no intervalo físico, antes do impacto. Para níveis finais diferentes do inicial, calcule o tempo de impacto pela equação da posição.`, visual: alturaLab(19.6) }, exercises: [
        tf('Uma altura abaixo do topo pode ser alcançada tanto na subida quanto na descida, antes do impacto.', true, 'A parábola de altura cruza essa altura nos dois ramos, desde que ambos ocorram durante o voo.'),
        num(t`Uma bola parte do solo a $19,6\,\text{m/s}$. Qual a altura após $1\,\text{s}$, em m e com uma casa decimal?`, 14.7, t`$y=19,6\cdot1-4,9\cdot1^2=14,7\,\text{m}$.`, {unit:'m', tol:0.05}),
        gen(rng => { const s = randInt(rng, 1, 3); return num(t`Uma bola é lançada para cima a $${fmt(9.8*s, 1)}\,\text{m/s}$. Qual a altura máxima acima do lançamento, em m e com uma casa decimal?`, 4.9*s*s, t`A subida dura $${s}\,\text{s}$; a altura ganha é $4,9\cdot${s}^2=${fmt(4.9*s*s, 1)}\,\text{m}$.`, {unit:'m', tol:0.05}); }),
        graficoEx(t`Uma bola é lançada do solo a $19,6\,\text{m/s}$. Ajuste o gráfico ao instante de descida em que ela está a $14,7\,\text{m}$.`, 19.6, 0, 4, 3, t`$14,7=19,6t-4,9t^2$ tem soluções $t=1$ e $t=3\,\text{s}$; a descida ocorre em $3\,\text{s}$.`),
        num(t`Uma bola sai do solo a $19,6\,\text{m/s}$. Ao passar a $14,7\,\text{m}$ na descida, qual sua velocidade com sinal, em m/s e com uma casa decimal?`, -9.8, t`Na descida a passagem ocorre em $t=3\,\text{s}$; $v=19,6-9,8\cdot3=-9,8\,\text{m/s}$.`, {unit:'m/s', tol:0.05}),
        num(t`Uma bola parte de uma plataforma a $19,6\,\text{m}$ do solo, com velocidade inicial para cima de $14,7\,\text{m/s}$. Quando atinge o solo? Responda em s, com uma casa decimal.`, 4, t`$0=19,6+14,7t-4,9t^2$ equivale a $t^2-3t-4=0$. As raízes são $4$ e $-1$; fisicamente $t=4\,\text{s}$.`, {unit:'s', tol:0.05}),
        num(t`Na situação anterior, qual a velocidade com sinal ao atingir o solo, em m/s e com uma casa decimal?`, -24.5, t`No impacto $t=4\,\text{s}$; $v=14,7-9,8\cdot4=-24,5\,\text{m/s}$.`, {unit:'m/s', tol:0.05}),
      ] },
    ] },
  ],
};
