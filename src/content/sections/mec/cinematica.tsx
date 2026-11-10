import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, plot, tf } from '../../helpers';
import { FnCurve, Pt } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;

// As duas curvas compartilham o tempo; cada ordenada usa sua própria unidade.
const movimento = () => plot({
  view: { xMin: 0, xMax: 4, yMin: 0, yMax: 8 },
  params: [{ key: 'tempo', label: 'tempo (s)', min: 0, max: 4, step: 0.5, value: 1, color: C.gold }],
  render: ({ p }: any) => <>
    <FnCurve f={(s) => s * s / 2} color={C.p1} />
    <FnCurve f={(s) => s} color={C.p2} />
    <Pt x={p.tempo} y={p.tempo * p.tempo / 2} color={C.p1} label="x" />
    <Pt x={p.tempo} y={p.tempo} color={C.p2} label="v" />
  </>,
  caption: 'Tempo (s) → · posição e velocidade sobrepostas',
  info: ({ p }: any) => t`Em $t=${fmt(p.tempo)}\,\text{s}$: posição (curva 1) $x=${fmt(p.tempo ** 2 / 2)}\,\text{m}$; velocidade (reta 2) $v=${fmt(p.tempo)}\,\text{m/s}$.`,
});

const praticaGrafico = () => inter(
  t`No laboratório, ajuste o tempo para que a velocidade seja $3\,\text{m/s}$.`,
  'plot', movimento().props, (v) => Math.abs(v.p.tempo - 3) < 0.01,
  t`Ajuste para $3\,\text{s}$.`,
  t`A reta representa $v=t$ nas unidades indicadas. Logo, $v=3\,\text{m/s}$ em $t=3\,\text{s}$; nesse instante $x=4,5\,\text{m}$.`,
);

export const cinematica: UnitDef = {
  id: 'm-cin', title: 'Movimento retilíneo', icon: '🏃',
  subtitle: 'Posição, velocidade, aceleração e gráficos',
  source: 'Física Aplicada I · aulas 2 e 3; Halliday, movimento retilíneo (cap. 2)',
  guide: t`Escolha uma origem e um sentido positivo. $\Delta x=x_f-x_i$ e $v_{\rm méd}=\Delta x/\Delta t$; a velocidade instantânea é a inclinação de $x(t)$. A aceleração é a inclinação de $v(t)$: $a=\mathrm{d}v/\mathrm{d}t$. A área **com sinal** sob $v(t)$ é o deslocamento. Para aceleração constante: $v=v_0+at$, $x=x_0+v_0t+\frac12at^2$ e $v^2=v_0^2+2a(x-x_0)$, com $t$ contado a partir do instante inicial.`,
  lessons: [
    { id: 'm-cin-pos', title: 'Posição e deslocamento', parts: [
      { card: { title: 'Origem e posição', body: t`A posição $x$ localiza o corpo em um eixo com origem e sentido positivo escolhidos. Uma posição negativa fica no lado negativo da origem, não significa necessariamente movimento para trás.`, visual: movimento(), tip: t`No laboratório, a curva 1 mostra $x=t^2/2$ em metros; deslize o tempo para acompanhar a posição.` }, exercises: [
        mcq(t`Em um eixo, onde está $x=-3\,\text{m}$?`, ['No lado negativo da origem', 'No lado positivo da origem', 'Na origem', 'Não é uma posição possível'], 0, t`O sinal negativo indica o lado negativo do eixo escolhido.`),
        tf(t`Uma posição negativa exige velocidade negativa.`, false, t`Posição indica onde está; velocidade indica como a posição muda. São sinais independentes.`),
        num(t`Um corpo está em $x=4\,\text{m}$. Qual sua distância à origem, em m, sem casas decimais?`, 4, t`A distância à origem é $|4|=4\,\text{m}$.`, {unit:'m',tol:0.5}),
        gen(rng => { const n=randInt(rng,2,9); return num(t`Um corpo está em $x=-${n}\,\text{m}$. Qual a distância à origem, em m, sem casas decimais?`, n, t`A distância é $|- ${n}|=${n}\,\text{m}$.`, {unit:'m',tol:0.5}); }),
        mcq(t`Se mudamos a origem do eixo, mas não o movimento, o que pode mudar?`, ['O valor da posição', 'A distância percorrida', 'O intervalo de tempo', 'A trajetória física'], 0, t`A coordenada depende da origem escolhida; o percurso físico e o tempo não mudam.`),
        praticaGrafico(),
        num(t`No laboratório, em $t=4\,\text{s}$, qual a posição em m, sem casas decimais? Use $x=t^2/2$.`, 8, t`$x=4^2/2=8\,\text{m}$.`, {unit:'m',tol:0.5}),
      ] },
      { card: { title: 'Deslocamento e distância', body: t`O deslocamento é $\Delta x=x_f-x_i$, com sinal. A distância percorrida soma os comprimentos de todos os trechos e nunca é negativa. Uma volta à posição inicial tem deslocamento zero, mesmo com distância percorrida.`, visual: movimento() }, exercises: [
        num(t`De $2\,\text{m}$ a $7\,\text{m}$, qual o deslocamento em m, sem casas decimais?`, 5, t`$\Delta x=7-2=5\,\text{m}$.`, {unit:'m',tol:0.5}),
        gen(rng => { const a=randInt(rng,2,6), b=randInt(rng,1,4); return num(t`De $${a}\,\text{m}$ a $-${b}\,\text{m}$, determine o deslocamento em m, sem casas decimais.`, -a-b, t`$\Delta x=-${b}-${a}=-${a+b}\,\text{m}$.`, {unit:'m',tol:0.5}); }),
        tf(t`Um deslocamento negativo indica movimento líquido no sentido negativo do eixo.`, true, t`Como $x_f<x_i$, a mudança líquida aponta para o sentido negativo.`),
        num(t`Alguém vai de $0$ a $5\,\text{m}$ e volta a $2\,\text{m}$. Qual a distância percorrida em m, sem casas decimais?`, 8, t`São $5\,\text{m}$ na ida e $3\,\text{m}$ na volta: $5+3=8\,\text{m}$.`, {unit:'m',tol:0.5}),
        num(t`No mesmo trajeto, de $0$ a $5\,\text{m}$ e depois a $2\,\text{m}$, qual o deslocamento em m, sem casas decimais?`, 2, t`Só as extremidades contam: $2-0=2\,\text{m}$.`, {unit:'m',tol:0.5}),
        mcq(t`Após uma ida e volta ao ponto inicial, o deslocamento é…`, ['zero', 'igual à distância total', 'necessariamente negativo', 'sempre maior que a distância'], 0, t`Como $x_f=x_i$, a diferença é zero, ainda que o percurso não seja zero.`),
        num(t`Um corpo vai de $-2$ a $4\,\text{m}$ e depois a $-1\,\text{m}$. Qual a distância em m, sem casas decimais?`, 11, t`Primeiro percorre $4-(-2)=6\,\text{m}$; depois $4-(-1)=5\,\text{m}$. Total: $11\,\text{m}$.`, {unit:'m',tol:0.5}),
      ] },
    ] },
    { id: 'm-cin-vel', title: 'Velocidade média e instantânea', parts: [
      { card: { title: 'Média e rapidez média', body: t`A velocidade média é $v_{\rm méd}=\Delta x/\Delta t$; seu sinal acompanha o deslocamento. A rapidez média é a distância total dividida pelo tempo total. Em $x(t)$, a inclinação da secante entre dois instantes é a velocidade média.`, visual: movimento() }, exercises: [
        num(t`Deslocamento de $12\,\text{m}$ em $3\,\text{s}$: velocidade média em m/s, sem casas decimais?`, 4, t`$v_{\rm méd}=12/3=4\,\text{m/s}$.`, {unit:'m/s',tol:0.5}),
        gen(rng => { const v=randInt(rng,2,6), s=randInt(rng,2,5); return num(t`Um deslocamento de $${v*s}\,\text{m}$ ocorre em $${s}\,\text{s}$. Qual a velocidade média em m/s, sem casas decimais?`,v,t`$v_{\rm méd}=${v*s}/${s}=${v}\,\text{m/s}$.`,{unit:'m/s',tol:0.5}); }),
        num(t`De $x=4$ a $x=-2\,\text{m}$ em $2\,\text{s}$, qual a velocidade média em m/s, sem casas decimais?`, -3, t`$\Delta x=-2-4=-6\,\text{m}$; $v_{\rm méd}=-6/2=-3\,\text{m/s}$.`, {unit:'m/s',tol:0.5}),
        tf(t`A rapidez média pode ser positiva quando a velocidade média é zero.`, true, t`Em uma volta completa há distância percorrida, mas deslocamento zero.`),
        num(t`Uma ida de $6\,\text{m}$ e volta de $6\,\text{m}$ levam $4\,\text{s}$. Qual a rapidez média em m/s, sem casas decimais?`, 3, t`A distância total é $12\,\text{m}$; $12/4=3\,\text{m/s}$.`, {unit:'m/s',tol:0.5}),
        praticaGrafico(),
        num(t`Para $x=t^2/2$, qual a velocidade média entre $t=1$ e $t=3\,\text{s}$, em m/s, sem casas decimais?`, 2, t`As posições são $0,5$ e $4,5\,\text{m}$; a secante tem inclinação $(4,5-0,5)/(3-1)=2\,\text{m/s}$.`, {unit:'m/s',tol:0.5}),
      ] },
      { card: { title: 'Velocidade instantânea', body: t`A velocidade instantânea é o limite da velocidade média quando o intervalo tende a zero: $v=\mathrm{d}x/\mathrm{d}t$. É a inclinação da tangente ao gráfico $x(t)$. A rapidez instantânea é $|v|$.`, visual: movimento() }, exercises: [
        mcq(t`A inclinação da tangente ao gráfico $x(t)$ fornece…`, ['a velocidade instantânea', 'a posição inicial', 'a distância total', 'o tempo decorrido'], 0, t`Por definição, a derivada de $x$ em relação ao tempo é a velocidade.`),
        num(t`Se $v=-5\,\text{m/s}$, qual a rapidez instantânea em m/s, sem casas decimais?`, 5, t`Rapidez é o módulo: $|-5|=5\,\text{m/s}$.`, {unit:'m/s',tol:0.5}),
        gen(rng => { const k=randInt(rng,2,6), s=randInt(rng,1,4); return num(t`Para $x=${k}t$ em unidades SI, qual $v$ em $t=${s}\,\text{s}$, em m/s, sem casas decimais?`, k, t`A inclinação constante de $x=${k}t$ é $${k}\,\text{m/s}$.`,{unit:'m/s',tol:0.5}); }),
        tf(t`Uma tangente horizontal em $x(t)$ indica velocidade instantânea nula.`, true, t`A inclinação da tangente horizontal é zero.`),
        num(t`Para $x=t^2$ em unidades SI, calcule a velocidade em $t=3\,\text{s}$, em m/s, sem casas decimais.`, 6, t`$v=\mathrm{d}(t^2)/\mathrm{d}t=2t$; em $t=3$, $v=6\,\text{m/s}$.`, {unit:'m/s',tol:0.5}),
        mcq(t`Quando $x(t)$ diminui com o tempo, a velocidade instantânea é…`, ['negativa', 'sempre positiva', 'necessariamente zero', 'igual à posição'], 0, t`Uma curva decrescente tem inclinação negativa.`),
        num(t`Para $x=8t-t^2$ em unidades SI, em que instante a velocidade zera? Responda em s, sem casas decimais.`, 4, t`$v=8-2t$. Fazendo $8-2t=0$, obtemos $t=4\,\text{s}$.`, {unit:'s',tol:0.5}),
      ] },
    ] },
    { id: 'm-cin-acel', title: 'Aceleração', parts: [
      { card: { title: 'Variação da velocidade', body: t`A aceleração média é $a_{\rm méd}=(v_f-v_i)/\Delta t$, em $\text{m/s}^2$. O sinal indica o sentido da variação de velocidade, não se o corpo está necessariamente aumentando sua rapidez.`, visual: movimento() }, exercises: [
        num(t`A velocidade cresce de $2$ para $8\,\text{m/s}$ em $3\,\text{s}$. Qual a aceleração média em m/s², sem casas decimais?`, 2, t`$a_{\rm méd}=(8-2)/3=2\,\text{m/s}^2$.`, {unit:'m/s²',tol:0.5}),
        gen(rng => { const a=randInt(rng,1,4), s=randInt(rng,2,4); return num(t`A velocidade passa de zero a $${a*s}\,\text{m/s}$ em $${s}\,\text{s}$. Qual a aceleração média em m/s², sem casas decimais?`,a,t`$a_{\rm méd}=(${a*s}-0)/${s}=${a}\,\text{m/s}^2$.`,{unit:'m/s²',tol:0.5}); }),
        num(t`De $10$ a $2\,\text{m/s}$ em $4\,\text{s}$, calcule a aceleração média em m/s², sem casas decimais.`, -2, t`$(2-10)/4=-2\,\text{m/s}^2$.`, {unit:'m/s²',tol:0.5}),
        tf(t`Aceleração negativa sempre significa diminuição da rapidez.`, false, t`Se $v<0$ e $a<0$, a velocidade fica mais negativa e seu módulo aumenta.`),
        mcq(t`Um corpo com $v<0$ e $a>0$ está, naquele instante…`, ['diminuindo a rapidez', 'aumentando a rapidez', 'parado', 'necessariamente em posição positiva'], 0, t`Velocidade e aceleração têm sinais opostos; o módulo da velocidade diminui naquele instante.`),
        praticaGrafico(),
        num(t`De $-3$ a $5\,\text{m/s}$ em $2\,\text{s}$, calcule a aceleração média em m/s², sem casas decimais.`, 4, t`$\Delta v=5-(-3)=8\,\text{m/s}$; $a_{\rm méd}=8/2=4\,\text{m/s}^2$.`, {unit:'m/s²',tol:0.5}),
      ] },
      { card: { title: 'Aceleração instantânea', body: t`A aceleração instantânea é $a=\mathrm{d}v/\mathrm{d}t=\mathrm{d}^2x/\mathrm{d}t^2$. Ela é a inclinação da tangente ao gráfico $v(t)$. Aceleração zero em um intervalo implica velocidade constante nesse intervalo.`, visual: movimento() }, exercises: [
        mcq(t`A inclinação da tangente a $v(t)$ representa…`, ['a aceleração instantânea', 'a posição', 'a distância', 'a rapidez média'], 0, t`A inclinação é $\mathrm{d}v/\mathrm{d}t=a$.`),
        tf(t`Velocidade constante em um intervalo implica aceleração nula nesse intervalo.`, true, t`Sem variação de velocidade, $\mathrm{d}v/\mathrm{d}t=0$.`),
        gen(rng => { const a=randInt(rng,1,5), v=randInt(rng,1,5); return num(t`Se $v=${v}+${a}t$ em unidades SI, qual a aceleração em m/s², sem casas decimais?`,a,t`A derivada de $v=${v}+${a}t$ é $a=${a}\,\text{m/s}^2$.`,{unit:'m/s²',tol:0.5}); }),
        num(t`Se $v=12-3t$ em unidades SI, qual a aceleração em m/s², sem casas decimais?`, -3, t`A inclinação da reta $v(t)$ é $-3\,\text{m/s}^2$.`, {unit:'m/s²',tol:0.5}),
        num(t`Se $x=2t^2$ em unidades SI, qual a aceleração em m/s², sem casas decimais?`, 4, t`$v=4t$ e, derivando de novo, $a=4\,\text{m/s}^2$.`, {unit:'m/s²',tol:0.5}),
        mcq(t`Em uma parada momentânea com $v=0$, a aceleração…`, ['pode ser diferente de zero', 'deve ser zero', 'não tem unidade', 'é igual à posição'], 0, t`No ponto de retorno de um lançamento vertical, por exemplo, $v=0$ e a aceleração da gravidade persiste.`),
        num(t`Se $v=t^2$ em unidades SI, qual a aceleração em $t=3\,\text{s}$, em m/s², sem casas decimais?`, 6, t`$a=\mathrm{d}v/\mathrm{d}t=2t=6\,\text{m/s}^2$.`, {unit:'m/s²',tol:0.5}),
      ] },
    ] },
    { id: 'm-cin-muv', title: 'Movimento com aceleração constante', parts: [
      { card: { title: 'Velocidade e posição', body: t`Com aceleração constante e tempo contado a partir de $t=0$: $v=v_0+at$ e $x=x_0+v_0t+\frac12at^2$. A primeira expressão é linear no tempo; a segunda inclui o efeito acumulado da aceleração.`, visual: movimento() }, exercises: [
        num(t`Com $v_0=2\,\text{m/s}$ e $a=3\,\text{m/s}^2$, qual $v$ após $2\,\text{s}$, em m/s, sem casas decimais?`, 8, t`$v=2+3\cdot2=8\,\text{m/s}$.`, {unit:'m/s',tol:0.5}),
        gen(rng => { const a=randInt(rng,1,4), s=randInt(rng,2,4), v=randInt(rng,1,4); return num(t`Com $v_0=${v}\,\text{m/s}$ e $a=${a}\,\text{m/s}^2$, calcule $v$ em $${s}\,\text{s}$, em m/s, sem casas decimais.`,v+a*s,t`$v=${v}+${a}\cdot${s}=${v+a*s}\,\text{m/s}$.`,{unit:'m/s',tol:0.5}); }),
        num(t`Partindo do repouso na origem com $a=2\,\text{m/s}^2$, qual $x$ após $3\,\text{s}$, em m, sem casas decimais?`, 9, t`$x=0+0+\frac12\cdot2\cdot3^2=9\,\text{m}$.`, {unit:'m',tol:0.5}),
        tf(t`Com aceleração constante, a velocidade muda igualmente em intervalos de tempo iguais.`, true, t`Como $\Delta v=a\Delta t$, intervalos iguais produzem variações iguais de velocidade.`),
        praticaGrafico(),
        num(t`Com $x_0=3\,\text{m}$, $v_0=4\,\text{m/s}$ e $a=-2\,\text{m/s}^2$, qual $x$ em $2\,\text{s}$, em m, sem casas decimais?`, 7, t`$x=3+4\cdot2+\frac12(-2)\cdot2^2=7\,\text{m}$.`, {unit:'m',tol:0.5}),
        num(t`Um carro a $12\,\text{m/s}$ freia com $a=-3\,\text{m/s}^2$. Quando para pela primeira vez? Em s, sem casas decimais.`, 4, t`$0=12-3t$ dá $t=4\,\text{s}$.`, {unit:'s',tol:0.5}),
      ] },
      { card: { title: 'Sem o tempo', body: t`Para aceleração constante, eliminar o tempo fornece $v^2=v_0^2+2a\Delta x$. O quadrado não determina sozinho o sinal de $v$: use o sentido do movimento e as condições do problema.`, visual: movimento() }, exercises: [
        mcq(t`Qual equação liga velocidades, aceleração constante e deslocamento sem usar o tempo?`, ['$v^2=v_0^2+2a\Delta x$', '$v=v_0+at$', '$\Delta x=vt$ em qualquer movimento', '$a=v/t$ sempre'], 0, t`A equação $v^2=v_0^2+2a\Delta x$ elimina o tempo para aceleração constante.`),
        gen(rng => { const v=randInt(rng,2,7); return num(t`Com $v_0=0$, $a=1\,\text{m/s}^2$ e $\Delta x=${fmt(v*v/2)}\,\text{m}$, qual a velocidade positiva em m/s, sem casas decimais?`,v,t`$v^2=2\cdot1\cdot${fmt(v*v/2)}=${v*v}$; escolhendo o sentido positivo, $v=${v}\,\text{m/s}$.`,{unit:'m/s',tol:0.5}); }),
        num(t`Um corpo parte do repouso com $a=2\,\text{m/s}^2$ e percorre $9\,\text{m}$ no sentido positivo. Qual $v$ em m/s, sem casas decimais?`, 6, t`$v^2=2\cdot2\cdot9=36$; no sentido positivo, $v=6\,\text{m/s}$.`, {unit:'m/s',tol:0.5}),
        tf(t`Conhecer $v^2=25$ determina, sozinho, o sinal de $v$.`, false, t`Tanto $v=5$ quanto $v=-5$ têm quadrado igual a $25$.`),
        num(t`Um carro a $10\,\text{m/s}$ freia com aceleração constante $-2\,\text{m/s}^2$. Qual a distância até parar, em m, sem casas decimais?`, 25, t`$0=10^2+2(-2)\Delta x$, logo $\Delta x=25\,\text{m}$. Até parar, segue no sentido positivo, então a distância é $25\,\text{m}$.`, {unit:'m',tol:0.5}),
        mcq(t`A equação $v^2=v_0^2+2a\Delta x$ exige…`, ['aceleração constante', 'velocidade constante obrigatoriamente', 'posição inicial nula', 'movimento sempre positivo'], 0, t`A relação foi obtida para aceleração constante; posição e sinais podem variar.`),
        num(t`Uma partícula passa de $3$ para $7\,\text{m/s}$ com aceleração constante $2\,\text{m/s}^2$. Qual o deslocamento em m, sem casas decimais?`, 10, t`$49=9+4\Delta x$, então $\Delta x=40/4=10\,\text{m}$.`, {unit:'m',tol:0.5}),
      ] },
    ] },
    { id: 'm-cin-graf', title: 'Gráficos do movimento', parts: [
      { card: { title: 'Inclinações', body: t`Num gráfico $x\times t$, a inclinação dá velocidade: secante para a média, tangente para a instantânea. Num gráfico $v\times t$, a inclinação dá aceleração. No laboratório, a curva 1 é $x=t^2/2$ e a reta 2 é $v=t$, em unidades SI.`, visual: movimento() }, exercises: [
        mcq(t`Uma reta horizontal em $x(t)$ indica…`, ['posição constante e velocidade zero', 'velocidade crescente', 'aceleração positiva obrigatória', 'posição zero obrigatória'], 0, t`A posição é constante, então sua inclinação e a velocidade são zero.`),
        num(t`Uma reta $x(t)$ sobe $6\,\text{m}$ em $2\,\text{s}$. Qual a velocidade em m/s, sem casas decimais?`, 3, t`A inclinação é $\Delta x/\Delta t=6/2=3\,\text{m/s}$.`, {unit:'m/s',tol:0.5}),
        gen(rng => { const a=randInt(rng,1,5), s=randInt(rng,2,4); return num(t`Uma reta $v(t)$ sobe $${a*s}\,\text{m/s}$ em $${s}\,\text{s}$. Qual sua inclinação em m/s², sem casas decimais?`,a,t`$a=\Delta v/\Delta t=${a*s}/${s}=${a}\,\text{m/s}^2$.`,{unit:'m/s²',tol:0.5}); }),
        tf(t`Uma reta horizontal em $v(t)$ representa aceleração zero.`, true, t`A velocidade é constante e a inclinação do gráfico é zero.`),
        praticaGrafico(),
        num(t`No laboratório, para $x=t^2/2$, qual a inclinação da tangente em $t=2\,\text{s}$, em m/s, sem casas decimais?`, 2, t`A derivada $v=t$ dá inclinação $2\,\text{m/s}$ em $t=2\,\text{s}$.`, {unit:'m/s',tol:0.5}),
        mcq(t`Uma curva $x(t)$ tem inclinação negativa cada vez menos intensa. Qual é o sinal de $v$ e de $a$ nesse intervalo?`, ['$v<0$ e $a>0$', '$v>0$ e $a<0$', '$v<0$ e $a<0$', '$v=0$ e $a=0$'], 0, t`A inclinação é negativa, mas cresce em direção a zero: velocidade negativa e aceleração positiva.`),
      ] },
      { card: { title: 'Área sob a velocidade', body: t`A área algébrica entre $v(t)$ e o eixo do tempo é o deslocamento: áreas acima contam positivas e abaixo negativas. Para distância total, somamos os módulos das áreas, separando os intervalos em que a velocidade muda de sinal.`, visual: movimento() }, exercises: [
        num(t`Velocidade constante de $3\,\text{m/s}$ por $4\,\text{s}$: qual a área algébrica sob $v(t)$, em m, sem casas decimais?`, 12, t`O retângulo tem área $3\cdot4=12\,\text{m}$, igual ao deslocamento.`, {unit:'m',tol:0.5}),
        gen(rng => { const v=randInt(rng,2,6), s=randInt(rng,2,5); return num(t`Velocidade constante $-${v}\,\text{m/s}$ durante $${s}\,\text{s}$. Qual o deslocamento em m, sem casas decimais?`,-v*s,t`A área com sinal é $(-${v})\cdot${s}=-${v*s}\,\text{m}$.`,{unit:'m',tol:0.5}); }),
        num(t`Velocidade cresce linearmente de zero a $6\,\text{m/s}$ em $4\,\text{s}$. Qual o deslocamento em m, sem casas decimais?`, 12, t`A área triangular é $\frac12\cdot4\cdot6=12\,\text{m}$.`, {unit:'m',tol:0.5}),
        tf(t`A área abaixo do eixo em $v(t)$ contribui negativamente para o deslocamento.`, true, t`Nesse intervalo $v<0$, portanto sua integral tem sinal negativo.`),
        num(t`Um corpo tem $v=2\,\text{m/s}$ por $3\,\text{s}$ e depois $v=-1\,\text{m/s}$ por $2\,\text{s}$. Qual o deslocamento em m, sem casas decimais?`, 4, t`Somando áreas com sinal: $2\cdot3+(-1)\cdot2=4\,\text{m}$.`, {unit:'m',tol:0.5}),
        num(t`No mesmo movimento ($2\,\text{m/s}$ por $3\,\text{s}$ e $-1\,\text{m/s}$ por $2\,\text{s}$), qual a distância total em m, sem casas decimais?`, 8, t`Somam-se os módulos: $|2\cdot3|+|(-1)\cdot2|=8\,\text{m}$.`, {unit:'m',tol:0.5}),
        num(t`A velocidade cresce linearmente de $2$ para $6\,\text{m/s}$ durante $4\,\text{s}$. Qual o deslocamento em m, sem casas decimais?`, 16, t`A área do trapézio é $(2+6)\cdot4/2=16\,\text{m}$.`, {unit:'m',tol:0.5}),
      ] },
    ] },
  ],
};
