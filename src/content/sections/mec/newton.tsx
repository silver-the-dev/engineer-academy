import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, plot, tf } from '../../helpers';
import { Arrow, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;

// DCL de um bloco que já desliza para baixo; μ é cinético.
const rampa = () => plot({
  view: { xMin: -3, xMax: 4, yMin: -2.5, yMax: 3.5 }, equalAspect: true,
  params: [
    { key: 'ang', label: 'ângulo (°)', min: 0, max: 45, step: 5, value: 30, color: C.p2 },
    { key: 'mu', label: 'μ cinético', min: 0, max: 0.8, step: 0.1, value: 0.2, color: C.p3 },
  ],
  render: ({ p }: any) => {
    const a = p.ang * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return <>
      <Seg x1={-2.5*c} y1={-2.5*s} x2={2.5*c} y2={2.5*s} color={C.textDim} width={3} />
      <Pt x={0} y={0} color={C.gold} label="bloco" />
      <Arrow x1={0} y1={0} x2={0} y2={-2} color={C.p1} label="P" />
      <Arrow x1={0} y1={0} x2={-2*c*s} y2={-2*s*s} color={C.p2} label="P∥" />
      <Arrow x1={0} y1={0} x2={-2*c*s} y2={2*c*c} color={C.p5} label="N" />
      {p.mu > 0 ? <Arrow x1={0} y1={0} x2={2*p.mu*c*c} y2={2*p.mu*c*s} color={C.success} label="f" /> : null}
    </>;
  },
  info: ({ p }: any) => {
    const a = p.ang * Math.PI / 180;
    return t`DCL: $P=mg$, $N=mg\cos\theta$, $f_k=\mu_k N$. Se o bloco desliza **para baixo**, $a= g(\sin\theta-\mu_k\cos\theta)=${fmt(9.8*(Math.sin(a)-p.mu*Math.cos(a)), 2)}\,\text{m/s}^2$ no sentido descendente. Valor negativo indica desaceleração.`;
  },
});
const pratica = () => inter(t`No DCL de um bloco que desliza para baixo, ajuste o ângulo para $30^\circ$ e o coeficiente de atrito cinético para $0{,}4$.`, 'plot', rampa().props,
  (v) => Math.abs(v.p.ang-30)<0.01 && Math.abs(v.p.mu-0.4)<0.01,
  t`$\theta=30^\circ$, $\mu_k=0{,}4$.`, t`O peso aponta para baixo, a normal é perpendicular à rampa e o atrito aponta rampa acima, contrário ao deslizamento.`);
const n = (prompt: string, answer: number, explain: string, unit: string, tol = 0.000001) => num(prompt, answer, explain, { unit, tol });

export const leisNewton: UnitDef = {
  id: 'm-newton', title: 'Leis de Newton', icon: '🍏',
  subtitle: 'Forças, atrito e movimento em rampas',
  source: 'Física Aplicada I · Aula 9 e Prova A1 · Halliday, capítulos 5 e 6',
  guide: t`Em referencial inercial, isole o corpo e desenhe seu diagrama de corpo livre (DCL): só forças que **agem nele**. Some por eixos: $\sum\vec F=m\vec a$. Peso $P=mg$; normal é perpendicular ao contato; tração segue o fio. Atrito estático satisfaz $f_s\le\mu_sN$; no deslizamento, $f_k=\mu_kN$. Na rampa, $P_\parallel=mg\sin\theta$ e $P_\perp=mg\cos\theta$.`,
  lessons: [
    { id: 'm-newton-1', title: 'Força e primeira lei', parts: [
      { card: { title: 'Forças e diagrama de corpo livre', body: t`Força é vetor, medido em newtons: $1\,\text{N}=1\,\text{kg}\cdot\text{m/s}^2$. Isole o corpo no DCL e desenhe cada força externa. Some componentes com sinais. Exemplo: no DCL de uma caixa, $8\,\text{N}$ à direita e $3\,\text{N}$ à esquerda dão $5\,\text{N}$ à direita; peso e normal se equilibram verticalmente.`, visual: rampa() }, exercises: [
        mcq(t`No DCL de uma caixa, duas forças horizontais valem $8\,\text{N}$ à direita e $3\,\text{N}$ à esquerda. Qual a resultante horizontal?`, [t`$5\,\text{N}$ à direita`, t`$11\,\text{N}$ à direita`, t`$5\,\text{N}$ à esquerda`, t`$11\,\text{N}$ à esquerda`], 0, t`Direita positiva: $8-3=5\,\text{N}$.`),
        tf(t`No DCL de uma caixa, desenhamos apenas forças que agem sobre ela.`, true, t`O DCL isola o corpo; forças que ele exerce em outros corpos ficam nos DCLs desses outros corpos.`),
        gen(rng => { const a=randInt(rng,5,12), b=randInt(rng,1,4); return n(t`No DCL de uma caixa, $${a}\,\text{N}$ apontam à direita e $${b}\,\text{N}$ à esquerda. Qual a resultante para a direita, em N?`,a-b,t`Direita positiva: $${a}-${b}=${a-b}\,\text{N}$.`,'N'); }),
        n(t`No DCL de uma partícula, há $3\,\text{N}$ à direita e $4\,\text{N}$ para cima. Qual o módulo da resultante, em N?`,5,t`As componentes são perpendiculares: $\sqrt{3^2+4^2}=5\,\text{N}$.`,'N'),
        mcq(t`No DCL de uma caixa apoiada, qual força aponta perpendicularmente para fora do piso?`, ['Normal', 'Peso', 'Tração vertical necessariamente', 'Atrito'],0,t`A normal é a força de contato perpendicular à superfície.`),
        pratica(),
        n(t`No DCL de uma caixa, atuam $10\,\text{N}$ à direita e $6\,\text{N}$ à esquerda. Quanto falta aplicar à esquerda para zerar a resultante horizontal, em N?`,4,t`A resultante inicial é $10-6=4\,\text{N}$ à direita; faltam $4\,\text{N}$ à esquerda.`,'N'),
      ] },
      { card: { title: 'Inércia e equilíbrio', body: t`Em referencial inercial, resultante nula implica velocidade constante: repouso é apenas um caso. No DCL de uma caixa sobre piso horizontal, $N$ para cima e $P$ para baixo se equilibram. Forças podem existir mesmo com resultante nula.` }, exercises: [
        tf(t`No DCL de um corpo em repouso num referencial inercial, a resultante é nula.`,true,t`Repouso significa velocidade constante e aceleração zero, portanto $\sum\vec F=0$.`),
        mcq(t`Um corpo move-se em linha reta com velocidade constante. Em referencial inercial, o que mostra seu DCL?`,['Resultante nula','Uma força resultante no sentido da velocidade','Nenhuma força pode atuar','Resultante oposta à velocidade'],0,t`Velocidade constante implica aceleração nula; forças podem se cancelar.`),
        gen(rng=>{const f=randInt(rng,2,12); return n(t`No DCL de uma caixa em equilíbrio, há $${f}\,\text{N}$ à direita e uma força horizontal à esquerda. Qual o módulo desta, em N?`,f,t`Para soma nula, a força à esquerda vale $${f}\,\text{N}$.`,'N');}),
        tf(t`Uma caixa com forças equilibradas em seu DCL deve estar parada.`,false,t`Ela também pode mover-se em linha reta com velocidade constante.`),
        n(t`No DCL de uma caixa em equilíbrio vertical, o peso é $49\,\text{N}$ e a única outra força vertical é a normal. Qual a normal, em N?`,49,t`$N-P=0$, logo $N=49\,\text{N}$.`,'N'),
        mcq(t`No DCL de uma caixa, $12\,\text{N}$ à direita e $12\,\text{N}$ à esquerda atuam sem outras forças horizontais. Sua aceleração horizontal é…`,['zero','necessariamente para a direita','necessariamente para a esquerda','impossível de determinar'],0,t`A resultante horizontal é zero; pela segunda lei, $a_x=0$.`),
        tf(t`Num referencial inercial, um corpo pode manter velocidade não nula mesmo com resultante nula no DCL.`,true,t`A primeira lei prevê movimento retilíneo uniforme quando a resultante é nula.`),
      ] },
    ] },
    { id:'m-newton-2', title:'Segunda lei', parts:[
      { card:{title:'Resultante e aceleração',body:t`Em cada eixo, $\sum F=ma$. No DCL de uma caixa de $2\,\text{kg}$, $10\,\text{N}$ para a direita e $4\,\text{N}$ para a esquerda geram $a=(10-4)/2=3\,\text{m/s}^2$ à direita.`,visual:rampa()}, exercises:[
        n(t`No DCL de um bloco de $2\,\text{kg}$, a resultante horizontal é $10\,\text{N}$ à direita. Qual a aceleração em m/s²?`,5,t`$a=F/m=10/2=5\,\text{m/s}^2$.`,'m/s²'),
        gen(rng=>{const m=randInt(rng,2,8), a=randInt(rng,1,5); return n(t`No DCL de um bloco de $${m}\,\text{kg}$, a resultante é $${m*a}\,\text{N}$ à direita. Qual a aceleração para a direita, em m/s²?`,a,t`$a=${m*a}/${m}=${a}\,\text{m/s}^2$.`,'m/s²');}),
        n(t`No DCL de um bloco de $3\,\text{kg}$, a resultante aponta à direita e a aceleração é $4\,\text{m/s}^2$. Qual seu módulo em N?`,12,t`$F=ma=3\cdot4=12\,\text{N}$.`,'N'),
        tf(t`No DCL de um corpo, a aceleração tem o sentido da força resultante não nula.`,true,t`Como $m>0$, $\vec a=\sum\vec F/m$ tem o mesmo sentido da resultante.`),
        pratica(),
        n(t`No DCL de um bloco de $2\,\text{kg}$, atuam $10\,\text{N}$ à direita e $4\,\text{N}$ à esquerda. Qual a aceleração para a direita, em m/s²?`,3,t`$a=(10-4)/2=3\,\text{m/s}^2$.`,'m/s²'),
        n(t`No DCL de um corpo, a resultante é $18\,\text{N}$ e a aceleração tem módulo $3\,\text{m/s}^2$. Qual a massa em kg?`,6,t`$m=F/a=18/3=6\,\text{kg}$.`,'kg'),
      ]},
      { card:{title:'Componentes independentes',body:t`Escolha eixos e aplique $\sum F_x=ma_x$ e $\sum F_y=ma_y$. Por exemplo, no DCL de uma partícula de $2\,\text{kg}$ com resultante $(6,\,8)\,\text{N}$, $\vec a=(3,\,4)\,\text{m/s}^2$.`}, exercises:[
        n(t`No DCL de uma partícula de $2\,\text{kg}$, $\sum F_x=6\,\text{N}$. Qual $a_x$, em m/s²?`,3,t`$a_x=6/2=3\,\text{m/s}^2$.`,'m/s²'),
        gen(rng=>{const m=randInt(rng,2,5), a=randInt(rng,1,4); return n(t`No DCL de um corpo de $${m}\,\text{kg}$, a resultante em $y$ é $${m*a}\,\text{N}$ para baixo. Qual o módulo de $a_y$, em m/s²?`,a,t`$|a_y|=${m*a}/${m}=${a}\,\text{m/s}^2$.`,'m/s²');}),
        n(t`No DCL de um corpo de $2\,\text{kg}$, $\sum F_x=6\,\text{N}$ e $\sum F_y=8\,\text{N}$. Qual o módulo da aceleração em m/s²?`,5,t`As componentes são $(3,\,4)\,\text{m/s}^2$; o módulo é $5\,\text{m/s}^2$.`,'m/s²'),
        tf(t`No DCL de um corpo, $\sum F_y=0$ implica necessariamente $a_x=0$.`,false,t`Os eixos são independentes: $a_y=0$, mas $\sum F_x$ pode ser não nula.`),
        n(t`No DCL de um corpo de $4\,\text{kg}$, a resultante horizontal é $12\,\text{N}$ à esquerda. Com direita positiva, qual $a_x$ em m/s²?`,-3,t`$a_x=-12/4=-3\,\text{m/s}^2$.`,'m/s²'),
        mcq(t`No DCL de uma partícula com aceleração horizontal, o que determina a componente vertical da resultante?`,['A aceleração vertical multiplicada pela massa','A velocidade horizontal','A posição horizontal','A massa dividida pela velocidade'],0,t`A segunda lei no eixo vertical é $\sum F_y=ma_y$.`),
        n(t`No DCL de uma partícula de $2\,\text{kg}$, $F_1=10\,\text{N}$ à direita e $F_2$ à esquerda. Para $a_x=2\,\text{m/s}^2$ à direita, qual $F_2$ em N?`,6,t`$10-F_2=2\cdot2=4$, então $F_2=6\,\text{N}$.`,'N'),
      ]},
    ]},
    { id:'m-newton-3', title:'Terceira lei, peso, normal e tração', parts:[
      {card:{title:'Ação, reação e peso',body:t`Se A exerce força em B, B exerce força de mesmo módulo e sentido oposto em A. O par age em corpos distintos. No DCL da maçã em queda livre aparece só o peso $P=mg$; a força da maçã sobre a Terra pertence ao DCL da Terra. Use $g=9{,}8\,\text{m/s}^2$.`,visual:rampa()}, exercises:[
        tf(t`No DCL da maçã, o peso e a força da maçã sobre a Terra formam um par ação-reação no mesmo corpo.`,false,t`O peso age na maçã; a reação age na Terra, em outro DCL.`),
        n(t`No DCL de uma maçã de $2\,\text{kg}$, qual o peso em N? Use $g=9{,}8\,\text{m/s}^2$.`,19.6,t`$P=mg=2\cdot9{,}8=19{,}6\,\text{N}$.`,'N'),
        gen(rng=>{const m=randInt(rng,1,9); return n(t`No DCL de um corpo de $${m}\,\text{kg}$, qual o peso em N? Use $g=9{,}8\,\text{m/s}^2$ e uma casa decimal.`,m*9.8,t`$P=mg=${m}\cdot9{,}8=${fmt(m*9.8,1)}\,\text{N}$.`,'N',0.05);}),
        mcq(t`No DCL de um livro sobre a mesa, a reação ao peso do livro é…`,['A atração gravitacional do livro sobre a Terra','A normal da mesa sobre o livro','A força do livro sobre a mesa','O atrito da mesa sobre o livro'],0,t`A interação gravitacional é entre Terra e livro; a reação atua na Terra.`),
        pratica(),
        tf(t`No DCL de um corpo, a normal e o peso podem se equilibrar sem formar um par ação-reação.`,true,t`Ambas agem no mesmo corpo, enquanto forças de ação e reação agem em corpos diferentes.`),
        n(t`No DCL de uma carga, o peso é $98\,\text{N}$. Qual a massa em kg? Use $g=9{,}8\,\text{m/s}^2$.`,10,t`$m=P/g=98/9{,}8=10\,\text{kg}$.`,'kg'),
      ]},
      {card:{title:'Normal e tração',body:t`A normal é perpendicular ao contato e não é sempre igual ao peso. A tração de um fio ideal puxa ao longo do fio. No DCL de um bloco suspenso em repouso: $T$ para cima e $P=mg$ para baixo, portanto $T=mg$.`},exercises:[
        n(t`No DCL de um bloco de $2\,\text{kg}$ pendurado em repouso, qual a tração em N? Use $g=9{,}8\,\text{m/s}^2$.`,19.6,t`$T-P=0$ e $P=2\cdot9{,}8=19{,}6\,\text{N}$.`,'N'),
        gen(rng=>{const m=randInt(rng,1,6);return n(t`No DCL de um bloco de $${m}\,\text{kg}$ em repouso num piso horizontal, só peso e normal são verticais. Qual a normal em N? Use $g=9{,}8\,\text{m/s}^2$ e uma casa decimal.`,m*9.8,t`$N=mg=${fmt(m*9.8,1)}\,\text{N}$.`,'N',0.05);}),
        tf(t`No DCL de um bloco apoiado, a normal é sempre igual ao peso.`,false,t`Outras forças ou aceleração perpendicular ao apoio podem alterar a normal.`),
        n(t`No DCL de um bloco de $2\,\text{kg}$ em piso horizontal, além do peso age uma força vertical de $4\,\text{N}$ para baixo. Sem aceleração vertical, qual a normal em N? Use $g=9{,}8\,\text{m/s}^2$.`,23.6,t`$N-mg-4=0$; $N=19{,}6+4=23{,}6\,\text{N}$.`,'N'),
        mcq(t`No DCL de uma carga suspensa por fio ideal, a tração do fio sobre a carga aponta…`,['Ao longo do fio, afastando-se da carga','Sempre vertical para baixo','Para o centro da Terra','Perpendicular ao fio'],0,t`Um fio ideal puxa a carga ao longo de sua direção.`),
        n(t`No DCL de uma carga de $2\,\text{kg}$ suspensa, $T$ aponta para cima e $P$ para baixo. Se ela acelera para cima a $1\,\text{m/s}^2$, qual $T$ em N? Use $g=9{,}8\,\text{m/s}^2$.`,21.6,t`$T-mg=ma$, logo $T=2(9{,}8+1)=21{,}6\,\text{N}$.`,'N'),
        n(t`No DCL de uma carga de $2\,\text{kg}$, $T$ aponta para cima e $P$ para baixo. Se ela acelera para baixo a $2\,\text{m/s}^2$, qual $T$ em N? Use $g=9{,}8\,\text{m/s}^2$.`,15.6,t`Tomando baixo positivo: $mg-T=ma$; $T=2(9{,}8-2)=15{,}6\,\text{N}$.`,'N'),
      ]},
    ]},
    {id:'m-newton-atrito',title:'Atrito',parts:[
      {card:{title:'Atrito estático',body:t`O atrito estático se ajusta para impedir deslizamento, até $f_s\le\mu_sN$. No DCL de um bloco em repouso sobre piso, uma força horizontal de $3\,\text{N}$ à direita é equilibrada por atrito de $3\,\text{N}$ à esquerda, se o limite permitir.`,visual:rampa()},exercises:[
        tf(t`No DCL de um bloco sem tendência a deslizar, o atrito estático é necessariamente igual a $\mu_sN$.`,false,t`Ele se ajusta de zero até o máximo necessário; só atinge $\mu_sN$ no limiar.`),
        n(t`No DCL de um bloco em repouso, a força aplicada é $3\,\text{N}$ à direita. O único outro esforço horizontal é o atrito. Qual seu módulo em N?`,3,t`Equilíbrio: $3-f_s=0$, então $f_s=3\,\text{N}$.`,'N'),
        gen(rng=>{const N=randInt(rng,2,10)*10; return n(t`No DCL de um bloco, $N=${N}\,\text{N}$ e $\mu_s=0{,}5$. Qual o atrito estático máximo em N?`,N/2,t`$f_{s,\max}=\mu_sN=0{,}5\cdot${N}=${N/2}\,\text{N}$.`,'N');}),
        mcq(t`No DCL de um bloco em repouso puxado para a direita, o atrito estático do piso aponta…`,['Para a esquerda','Para a direita','Para cima','Para baixo'],0,t`Ele se opõe à tendência de movimento relativo no contato.`),
        pratica(),
        n(t`No DCL de uma caixa, $N=40\,\text{N}$ e $\mu_s=0{,}3$. Qual a maior força horizontal em N que pode ser equilibrada pelo atrito estático?`,12,t`O limite é $\mu_sN=0{,}3\cdot40=12\,\text{N}$.`,'N'),
        tf(t`No DCL de uma caixa em repouso, uma força horizontal de $8\,\text{N}$ pode ser equilibrada pelo atrito se $f_{s,\max}=10\,\text{N}$.`,true,t`O atrito necessário é $8\,\text{N}$, abaixo do limite de $10\,\text{N}$.`),
      ]},
      {card:{title:'Atrito cinético',body:t`Quando há deslizamento, $f_k=\mu_kN$ e o atrito aponta contra a velocidade relativa no contato. No DCL de uma caixa que desliza à direita, o atrito do piso aponta à esquerda, mesmo que outra força acelere a caixa à direita.`},exercises:[
        n(t`No DCL de um bloco deslizante, $N=20\,\text{N}$ e $\mu_k=0{,}2$. Qual $f_k$ em N?`,4,t`$f_k=\mu_kN=0{,}2\cdot20=4\,\text{N}$.`,'N'),
        gen(rng=>{const N=randInt(rng,2,9)*10; return n(t`No DCL de uma caixa deslizante, $N=${N}\,\text{N}$ e $\mu_k=0{,}2$. Qual o atrito cinético em N?`,N*0.2,t`$f_k=0{,}2\cdot${N}=${fmt(N*0.2)}\,\text{N}$.`,'N');}),
        mcq(t`No DCL de uma caixa que desliza à direita sobre piso parado, o atrito cinético aponta…`,['À esquerda','À direita','Para cima','Para baixo'],0,t`O atrito se opõe ao movimento relativo no contato: à esquerda.`),
        tf(t`No DCL de um bloco deslizante, o atrito cinético pode apontar no mesmo sentido da aceleração.`,true,t`Se o bloco desliza à direita e desacelera, atrito e aceleração podem ambos apontar à esquerda.`),
        n(t`No DCL de um bloco de $2\,\text{kg}$ que desliza à direita, $10\,\text{N}$ puxam à direita e $4\,\text{N}$ de atrito agem à esquerda. Qual a aceleração à direita em m/s²?`,3,t`$a=(10-4)/2=3\,\text{m/s}^2$.`,'m/s²'),
        n(t`No DCL de um bloco que desliza em piso, $f_k=6\,\text{N}$ e $N=30\,\text{N}$. Qual $\mu_k$?`,0.2,t`$\mu_k=f_k/N=6/30=0{,}2$.`,''),
        n(t`No DCL de uma caixa de $5\,\text{kg}$ que desliza à direita, há apenas atrito horizontal de $10\,\text{N}$ à esquerda. Com direita positiva, qual $a_x$ em m/s²?`,-2,t`$a_x=-10/5=-2\,\text{m/s}^2$.`,'m/s²'),
      ]},
    ]},
    {id:'m-newton-plano',title:'Plano inclinado e sistemas de blocos',parts:[
      {card:{title:'Geometria e forças na rampa',body:t`Na rampa de ângulo $\theta$, escolha eixos paralelo e perpendicular. No DCL do bloco, peso é vertical, normal é perpendicular, e o atrito se opõe ao deslizamento. As componentes do peso são $mg\sin\theta$ rampa abaixo e $mg\cos\theta$ contra a superfície. Sem outras forças perpendiculares, $N=mg\cos\theta$.`,visual:rampa()},exercises:[
        mcq(t`No DCL de um bloco sobre rampa, em que direção aponta o peso?`,['Verticalmente para baixo','Perpendicular à rampa','Paralelo à rampa','Verticalmente para cima'],0,t`A gravidade aponta verticalmente para baixo; suas componentes dependem dos eixos escolhidos.`),
        n(t`No DCL de um bloco de $2\,\text{kg}$ numa rampa de $30^\circ$, qual a componente do peso rampa abaixo em N? Use $g=9{,}8\,\text{m/s}^2$.`,9.8,t`$mg\sin30^\circ=2\cdot9{,}8\cdot0{,}5=9{,}8\,\text{N}$.`,'N'),
        gen(rng=>{const m=randInt(rng,1,8); return n(t`No DCL de um bloco de $${m}\,\text{kg}$ em rampa de $30^\circ$, calcule a componente do peso paralela à rampa em N, com uma casa decimal. Use $g=9{,}8\,\text{m/s}^2$.`,m*4.9,t`$mg\sin30^\circ=${m}\cdot9{,}8\cdot0{,}5=${fmt(m*4.9,1)}\,\text{N}$.`,'N',0.05);}),
        pratica(),
        n(t`Uma máquina sobe uma rampa reta que avança $12{,}5\,\text{m}$ na horizontal e $5{,}25\,\text{m}$ na vertical. Antes do DCL, determine o comprimento da rampa em m, com duas casas decimais.`,Math.hypot(12.5,5.25),t`Pelo triângulo da rampa, $L=\sqrt{12{,}5^2+5{,}25^2}\approx13{,}56\,\text{m}$.`,'m',0.005),
        n(t`Para a máquina da rampa com avanço horizontal $12{,}5\,\text{m}$ e altura $5{,}25\,\text{m}$, determine o ângulo em graus, com uma casa decimal, para orientar os eixos do DCL.`,Math.atan(5.25/12.5)*180/Math.PI,t`$\theta=\arctan(5{,}25/12{,}5)\approx22{,}8^\circ$.`,'°',0.05),
        n(t`No DCL de um bloco que desliza para baixo numa rampa de $30^\circ$ sem atrito, qual a aceleração para baixo em m/s²? Use $g=9{,}8\,\text{m/s}^2$.`,4.9,t`$ma=mg\sin30^\circ$, logo $a=4{,}9\,\text{m/s}^2$.`,'m/s²'),
      ]},
      {card:{title:'Sistemas e rampa com atrito',body:t`Desenhe um DCL para cada corpo e escolha sentidos positivos coerentes com o fio. Num fio e polia ideais a tração tem mesmo módulo e os blocos têm acelerações de mesmo módulo. Para um bloco deslizando rampa abaixo, $ma=mg\sin\theta-\mu_kmg\cos\theta$.`},exercises:[
        tf(t`Nos DCLs de dois blocos ligados por fio ideal sobre polia ideal, as trações têm o mesmo módulo.`,true,t`Fio sem massa e polia ideal transmitem a mesma tração; os sentidos dependem de cada DCL.`),
        n(t`No DCL de um bloco deslizante, a componente do peso rampa abaixo é $10\,\text{N}$ e o atrito é $4\,\text{N}$ rampa acima. Se a massa é $2\,\text{kg}$, qual a aceleração rampa abaixo em m/s²?`,3,t`$a=(10-4)/2=3\,\text{m/s}^2$.`,'m/s²'),
        gen(rng=>{const m=randInt(rng,2,7), a=randInt(rng,1,4); return n(t`No DCL de um bloco de $${m}\,\text{kg}$, a força paralela à rampa é $${m*a+4}\,\text{N}$ para baixo e o atrito é $4\,\text{N}$ para cima. Qual a aceleração para baixo em m/s²?`,a,t`$a=(${m*a+4}-4)/${m}=${a}\,\text{m/s}^2$.`,'m/s²');}),
        n(t`No DCL de uma máquina de $100\,\text{kg}$ subindo rampa sem atrito a velocidade constante, uma tração paralela à rampa aponta para cima. Se $\sin\theta=0{,}4$, qual a tração em N? Use $g=9{,}8\,\text{m/s}^2$.`,392,t`A resultante paralela é nula: $T=mg\sin\theta=100\cdot9{,}8\cdot0{,}4=392\,\text{N}$.`,'N'),
        n(t`Dois blocos de $2\,\text{kg}$ e $3\,\text{kg}$ estão ligados por fio ideal em piso horizontal sem atrito. No DCL do conjunto, uma força externa de $10\,\text{N}$ puxa à direita. Qual a aceleração em m/s²?`,2,t`As trações internas se cancelam no DCL do conjunto: $a=10/(2+3)=2\,\text{m/s}^2$.`,'m/s²'),
        n(t`No sistema anterior, a força de $10\,\text{N}$ puxa o bloco de $3\,\text{kg}$, ligado ao de $2\,\text{kg}$, em piso sem atrito. No DCL do bloco de $2\,\text{kg}$, qual a tração em N?`,4,t`A aceleração comum é $10/5=2\,\text{m/s}^2$. No bloco de $2\,\text{kg}$, $T=ma=2\cdot2=4\,\text{N}$.`,'N'),
        n(t`No DCL de um bloco que desliza rampa abaixo, $\theta=30^\circ$ e $\mu_k=0{,}2$. Qual a aceleração rampa abaixo em m/s², com duas casas decimais? Use $g=9{,}8\,\text{m/s}^2$.`,9.8*(0.5-0.2*Math.cos(Math.PI/6)),t`$a=9{,}8(\sin30^\circ-0{,}2\cos30^\circ)\approx3{,}20\,\text{m/s}^2$.`,'m/s²',0.005),
      ]},
    ]},
  ],
};
