import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, tf } from '../../helpers';
import { randInt } from '../../../lib/random';
import { Arrow3, Axes3 } from '../../../components/visuals/Space3D';
import { C } from '../../../theme';

const t = String.raw;

// Vetores orientados no referencial destro: x × y = z.
const direcao = (tipo: 'forca' | 'fio' | 'fontes' | 'mat') => ({
  name: 'space3d',
  props: {
    scale: 38,
    params: [{ key: 's', label: tipo === 'forca' ? 'sinal de q' : tipo === 'mat' ? 'orientação' : 'sentido da corrente', min: -1, max: 1, step: 2, value: 1, color: C.gold }],
    render: ({ p }: any) => (
      <>
        <Axes3 size={2.5} />
        {tipo === 'fontes' ? <>
          <Arrow3 from={[0, 0, -1.5 * p.s]} to={[0, 0, 1.5 * p.s]} color={C.p1} />
          <Arrow3 from={[1.5, 0, 0]} to={[1.5, p.s, 0]} color={C.gold} />
        </> : tipo === 'mat' ? <>
          <Arrow3 from={[-1.5, 0, 0]} to={[1.5, 0, 0]} color={C.p1} />
          <Arrow3 from={[0, 0.7, 0]} to={[1.5 * p.s, 0.7, 0]} color={C.gold} />
        </> : <>
          <Arrow3 from={[0, 0, 0]} to={[2 * (tipo === 'fio' ? p.s : 1), 0, 0]} color={C.p1} />
          <Arrow3 from={[0, 0, 0]} to={[0, 2, 0]} color={C.p2} />
          <Arrow3 from={[0, 0, 0]} to={[0, 0, 2 * p.s]} color={C.gold} />
        </>}
      </>
    ),
    info: ({ p }: any) => tipo === 'fontes'
      ? t`Azul: corrente no eixo $z$. No ponto $x>0$, dourado: sentido tangente de $\vec B$ ($${p.s > 0 ? '+y' : '-y'}$).`
      : tipo === 'mat'
        ? t`Azul: campo externo $+x$. Dourado: momento magnético de um domínio, ${p.s > 0 ? 'alinhado' : 'oposto'} ao campo.`
        : t`Azul: ${tipo === 'fio' ? 'corrente' : 'velocidade'}; verde: campo $+y$; dourado: força em $${p.s > 0 ? '+z' : '-z'}$.`,
  },
});

export const magnetismo: UnitDef = {
  id: 'em-mag', title: 'Campo magnético', icon: '🧲',
  subtitle: 'Forças, correntes e materiais magnéticos',
  source: 'Halliday, Resnick e Walker · Fundamentos de Física, vol. 3, caps. 28–29',
  guide: t`$\vec F=q\vec v\times\vec B$ e $F=|q|vB\sin\theta$. Para movimento perpendicular, $r=mv/(|q|B)$. Em fio reto, $\vec F=I\vec L\times\vec B$; numa espira, $\tau=N IAB\sin\theta$. Biot–Savart: $d\vec B=\frac{\mu_0 I}{4\pi}\frac{d\vec\ell\times\hat r}{r^2}$. Para fio longo, $B=\mu_0 I/(2\pi r)$; num solenoide longo, $B\approx\mu_0 nI$. Em magnetostática, $\oint\vec B\cdot d\vec\ell=\mu_0 I_{\rm enc}$. Em material linear, $\vec M=\chi_m\vec H$ e $\vec B=\mu_0(\vec H+\vec M)$.`,
  extra: true,
  lessons: [
    {
      id: 'em-mag-forca', title: 'Força magnética sobre cargas', parts: [
        {
          card: { title: 'Produto vetorial e mão direita', body: t`Uma carga em movimento sofre $\vec F=q\vec v\times\vec B$. O módulo é $F=|q|vB\sin\theta$, com $\theta$ entre velocidade e campo. Aponte os dedos da mão direita no sentido de $\vec v$ e curve-os para $\vec B$: o polegar aponta a força para carga positiva. Para carga negativa, inverta o sentido. Gire a cena e troque o sinal da carga.`, visual: direcao('forca') },
          exercises: [
            tf(t`Uma carga parada sofre força magnética devida apenas a $\vec B$.`, false, t`Como $v=0$, $q\vec v\times\vec B=0$.`),
            mcq(t`Para carga positiva com $\vec v$ em $+x$ e $\vec B$ em $+y$, a força aponta em…`, ['$+z$', '$-z$', '$+x$', '$-y$'], 0, t`Pela mão direita, $\hat\imath\times\hat\jmath=\hat k$.`),
            inter(t`Na cena, selecione carga negativa e observe a força em $-z$.`, 'space3d', direcao('forca').props, (v: any) => v?.p.s === -1, t`Sinal de q: $-1$.`, t`Para carga negativa, a força inverte o sentido de $\vec v\times\vec B$: vai para $-z$.`),
            num(t`Uma carga de $2\,\text{C}$ move-se perpendicularmente a $0,5\,\text{T}$ com $3\,\text{m/s}$. Qual a força em N, com uma casa decimal?`, 3, t`$F=2\cdot3\cdot0,5=3,0\,\text{N}$.`, { unit: 'N', tol: 0.05 }),
            gen((rng) => { const q = randInt(rng, 1, 5); const v = randInt(rng, 1, 5); return num(t`Uma carga de $${q}\,\text{mC}$ move-se a $${v}\,\text{m/s}$ perpendicular a $2\,\text{T}$. Qual $F$ em mN, com uma casa decimal?`, 2*q*v, t`$F=qvB=${q}\cdot${v}\cdot2=${2*q*v}\,\text{mN}$.`, {unit:'mN', tol:0.05}); }),
            mcq(t`Se a velocidade é paralela ao campo, a força magnética é…`, ['nula', 'máxima', 'paralela ao campo', 'oposta à velocidade'], 0, t`O ângulo é $0^\circ$ ou $180^\circ$ e seu seno é zero.`),
            num(t`Uma carga de $4\,\text{C}$ tem velocidade $2\,\text{m/s}$ a $30^\circ$ de um campo de $3\,\text{T}$. Qual $F$ em N, com uma casa decimal?`, 12, t`$F=4\cdot2\cdot3\cdot\sin30^\circ=12,0\,\text{N}$.`, {unit:'N', tol:0.05}),
          ],
        },
        {
          card: { title: 'Órbita e trabalho', body: t`A força magnética é perpendicular à velocidade e não realiza trabalho: só muda sua direção. Para $\vec v\perp\vec B$ uniforme, $|q|vB=mv^2/r$, então $r=mv/(|q|B)$ e $T=2\pi m/(|q|B)$. Uma componente paralela ao campo permanece constante e produz trajetória helicoidal.` },
          exercises: [
            tf(t`Um campo magnético estático, sozinho, aumenta a energia cinética de uma carga.`, false, t`$\vec F\perp\vec v$, portanto a potência $\vec F\cdot\vec v$ é zero.`),
            mcq(t`Com velocidade perpendicular a um campo uniforme, a trajetória é…`, ['circular', 'retilínea acelerada', 'parabólica', 'uma espiral que encolhe'], 0, t`A força perpendicular tem módulo constante e atua como força centrípeta.`),
            num(t`Uma partícula de massa $2\,\text{kg}$ e carga $1\,\text{C}$ entra perpendicularmente a $2\,\text{T}$ com $3\,\text{m/s}$. Qual o raio em m, com uma casa decimal?`, 3, t`$r=mv/(|q|B)=2\cdot3/(1\cdot2)=3,0\,\text{m}$.`, {unit:'m',tol:0.05}),
            gen((rng) => { const v=randInt(rng,1,6); return num(t`Uma carga de $1\,\text{C}$ e massa $2\,\text{kg}$ move-se perpendicular a $2\,\text{T}$ com velocidade $${v}\,\text{m/s}$. Qual o raio em m, com uma casa decimal?`,v,t`$r=mv/(|q|B)=2\cdot${v}/(1\cdot2)=${v}\,\text{m}$.`,{unit:'m',tol:0.05}); }),
            mcq(t`Se $v$ dobra e os demais dados permanecem fixos, o raio da órbita perpendicular…`, ['dobra', 'cai à metade', 'quadruplica', 'não muda'], 0, t`$r$ é proporcional a $v$ quando $m$, $|q|$ e $B$ são fixos.`),
            tf(t`Se há componentes de velocidade paralela e perpendicular ao campo uniforme, a trajetória é helicoidal.`, true, t`A componente perpendicular gira; a paralela permanece constante, formando uma hélice.`),
            num(t`Em campos cruzados perpendiculares de módulos $E=12\,\text{V/m}$ e $B=3\,\text{T}$, uma carga passa sem desvio quando as forças se opõem. Qual a velocidade em m/s, com uma casa decimal?`,4,t`Iguale $|q|E=|q|vB$: $v=12/3=4,0\,\text{m/s}$.`,{unit:'m/s',tol:0.05}),
          ],
        },
      ],
    },
    {
      id: 'em-mag-fio', title: 'Força sobre fios e motores', parts: [
        {
          card: { title: 'Fio percorrido por corrente', body: t`Para um trecho retilíneo em campo uniforme, $\vec F=I\vec L\times\vec B$: $\vec L$ aponta no sentido convencional da corrente. A regra da mão direita dá a força; inverter a corrente inverte a força. Explore os vetores na cena.`, visual: direcao('fio') },
          exercises: [
            tf(t`Um fio paralelo a um campo magnético uniforme sofre força magnética resultante nesse trecho.`, false, t`$F=ILB\sin0^\circ=0$.`),
            mcq(t`Corrente em $+x$ e campo em $+y$: qual o sentido da força?`, ['$+z$', '$-z$', '$+y$', '$-x$'],0,t`$\vec L\times\vec B$ aponta em $+z$ pela mão direita.`),
            inter(t`Inverta a corrente para mostrar a força em $-z$.`, 'space3d', direcao('fio').props, (v:any)=>v?.p.s===-1, t`Corrente em $-x$.`, t`$(-\hat\imath)\times\hat\jmath=-\hat k$.`),
            num(t`Um fio perpendicular de $2\,\text{m}$ conduz $3\,\text{A}$ num campo de $0,5\,\text{T}$. Qual a força em N, com uma casa decimal?`,3,t`$F=ILB=3\cdot2\cdot0,5=3,0\,\text{N}$.`,{unit:'N',tol:0.05}),
            gen((rng)=>{const i=randInt(rng,1,5); const l=randInt(rng,1,4); return num(t`Um fio de $${l}\,\text{m}$ perpendicular a $2\,\text{T}$ conduz $${i}\,\text{A}$. Qual $F$ em N, com uma casa decimal?`,2*i*l,t`$F=ILB=${i}\cdot${l}\cdot2=${2*i*l}\,\text{N}$.`,{unit:'N',tol:0.05});}),
            mcq(t`Ao inverter simultaneamente corrente e campo, a força no fio…`, ['mantém o sentido', 'inverte o sentido', 'zera necessariamente', 'dobra'],0,t`Os dois sinais negativos se cancelam no produto vetorial.`),
            num(t`Um trecho de $4\,\text{m}$ conduz $2\,\text{A}$ a $30^\circ$ de $3\,\text{T}$. Qual $F$ em N, com uma casa decimal?`,12,t`$F=2\cdot4\cdot3\cdot\sin30^\circ=12,0\,\text{N}$.`,{unit:'N',tol:0.05}),
          ],
        },
        {
          card: { title: 'Torque e motor', body: t`Uma espira de área $A$, com $N$ voltas e corrente $I$, tem momento magnético $\vec\mu=NI A\hat n$. A mão direita envolve a corrente e o polegar dá $\hat n$. Em campo uniforme, $\vec\tau=\vec\mu\times\vec B$ e $\tau=NIAB\sin\theta$, com $\theta$ entre a normal e $\vec B$. Num motor CC, o comutador inverte a corrente para manter o torque no sentido de rotação.` },
          exercises: [
            mcq(t`A unidade de torque no SI é…`, [t`$\text{N}\cdot\text{m}$`, t`$\text{N/m}$`, t`$\text{T/s}$`, t`$\text{A/m}$`],0,t`Torque é força vezes braço: $\text{N}\cdot\text{m}$.`),
            tf(t`O torque de uma espira é máximo quando sua normal é perpendicular a $\vec B$.`,true,t`$\sin90^\circ=1$ em $\tau=NIAB\sin\theta$.`),
            num(t`Uma espira de $10$ voltas, área $0,2\,\text{m}^2$, corrente $2\,\text{A}$ e normal perpendicular a $0,5\,\text{T}$ sofre qual torque em N·m, com uma casa decimal?`,2,t`$\tau=10\cdot2\cdot0,2\cdot0,5=2,0\,\text{N}\cdot\text{m}$.`,{unit:'N·m',tol:0.05}),
            gen((rng)=>{const n=randInt(rng,1,5); const i=randInt(rng,1,4);return num(t`Uma bobina tem $${n}$ voltas, área $1\,\text{m}^2$ e corrente $${i}\,\text{A}$. Sua normal é perpendicular a $2\,\text{T}$. Qual o torque em N·m, com uma casa decimal?`,2*n*i,t`$\tau=NIAB=${n}\cdot${i}\cdot1\cdot2=${2*n*i}\,\text{N}\cdot\text{m}$.`,{unit:'N·m',tol:0.05});}),
            mcq(t`Quando a normal da espira está paralela ao campo, o torque magnético é…`, ['zero', 'máximo', 'igual a $NIAB$', 'independente do ângulo'],0,t`O ângulo entre normal e campo é zero, logo $\sin\theta=0$.`),
            tf(t`O comutador de um motor CC pode inverter a corrente na bobina a cada meia volta.`,true,t`A inversão ajuda a manter o torque no sentido da rotação após a passagem pela posição de alinhamento.`),
            num(t`Uma bobina de $20$ voltas, área $0,1\,\text{m}^2$, corrente $2\,\text{A}$ e campo $3\,\text{T}$ tem normal a $30^\circ$ do campo. Qual o torque em N·m, com uma casa decimal?`,6,t`$\tau=20\cdot2\cdot0,1\cdot3\cdot0,5=6,0\,\text{N}\cdot\text{m}$.`,{unit:'N·m',tol:0.05}),
          ],
        },
      ],
    },
    {
      id: 'em-mag-fontes', title: 'Campo de correntes: Biot-Savart e Ampère', parts: [
        {
          card: { title: 'Campo de uma corrente', body: t`Biot–Savart soma as contribuições $d\vec B=\frac{\mu_0 I}{4\pi}\frac{d\vec\ell\times\hat r}{r^2}$. Para fio retilíneo infinito, $B=\mu_0I/(2\pi r)$: as linhas são círculos ao redor do fio. Polegar da mão direita na corrente, dedos curvados no campo. Na cena, observe o campo no ponto $x>0$.`, visual: direcao('fontes') },
          exercises: [
            tf(t`O campo de um fio retilíneo longo forma círculos em torno do fio.`,true,t`A simetria e a regra da mão direita dão linhas circulares ao redor do eixo do fio.`),
            mcq(t`Um fio leva corrente em $+z$. No ponto do eixo $+x$, o campo aponta em…`,['$+y$','$-y$','$+z$','$-x$'],0,t`Com o polegar em $+z$, os dedos passam em $+y$ no lado $+x$.`),
            inter(t`Inverta a corrente no fio: no ponto $x>0$, o campo deve apontar em $-y$.`, 'space3d', direcao('fontes').props, (v:any)=>v?.p.s===-1, t`Corrente em $-z$.`, t`Inverter a corrente inverte o sentido de todas as linhas de campo.`),
            num(t`Para fio longo no vácuo, use $\mu_0=4\pi\times10^{-7}\,\text{T}\cdot\text{m/A}$. Com $I=5\,\text{A}$ e $r=0,1\,\text{m}$, qual $B$ em µT, com uma casa decimal?`,10,t`$B=\frac{4\pi\times10^{-7}\cdot5}{2\pi\cdot0,1}=10^{-5}\,\text{T}=10,0\,\mu\text{T}$.`,{unit:'µT',tol:0.05}),
            gen((rng)=>{const i=randInt(rng,1,8);return num(t`Fio longo no vácuo: $I=${i}\,\text{A}$, $r=0,2\,\text{m}$ e $\mu_0=4\pi\times10^{-7}\,\text{T}\cdot\text{m/A}$. Qual $B$ em µT, com uma casa decimal?`,i,t`$B=\mu_0I/(2\pi r)=${i}\times10^{-6}\,\text{T}=${i}\,\mu\text{T}$.`,{unit:'µT',tol:0.05});}),
            mcq(t`Ao dobrar a distância a um fio longo, com corrente fixa, $B$…`,['cai à metade','dobra','cai a um quarto','não muda'],0,t`$B\propto1/r$: dobrar $r$ reduz o campo à metade.`),
            tf(t`Em Biot–Savart, um elemento de corrente paralelo ao vetor que aponta dele ao ponto observado contribui com campo nulo.`,true,t`O produto vetorial $d\vec\ell\times\hat r$ é zero para vetores paralelos.`),
          ],
        },
        {
          card: { title: 'Lei de Ampère e simetria', body: t`Em regime magnetostático, $\oint\vec B\cdot d\vec\ell=\mu_0 I_{\rm enc}$, com sinal definido pela orientação do percurso e a regra da mão direita. A lei vale em geral nesse regime; extrair $B$ diretamente da integral exige simetria. Num solenoide longo ideal, longe das extremidades, $B\approx\mu_0 nI$, com $n=N/L$.` },
          exercises: [
            tf(t`Na lei de Ampère magnetostática, a corrente atravessando a superfície delimitada pelo caminho contribui para $I_{\rm enc}$.`,true,t`A soma algébrica das correntes que atravessam a superfície determina a circulação do campo.`),
            mcq(t`Para aplicar a lei de Ampère a um fio retilíneo infinito, um caminho conveniente é…`,['um círculo centrado no fio','uma reta paralela ao fio','um círculo deslocado sem simetria','um segmento aberto'],0,t`No círculo centrado, $\vec B$ é tangente e tem módulo constante.`),
            num(t`Um solenoide longo no vácuo tem $n=1000\,\text{m}^{-1}$ e $I=2\,\text{A}$. Use $\mu_0=4\pi\times10^{-7}$ e $\pi=3,14$. Qual $B$ em mT, com duas casas decimais?`,2.512,t`$B=4\pi\times10^{-7}\cdot1000\cdot2=2,512\,\text{mT}\approx2,51\,\text{mT}$.`,{unit:'mT',tol:0.005}),
            gen((rng)=>{const i=randInt(rng,1,5);return num(t`Em um solenoide longo, $n=1000\,\text{m}^{-1}$ e $I=${i}\,\text{A}$. Use $\mu_0=4\pi\times10^{-7}$ e $\pi=3,14$. Qual $B$ em mT, com duas casas decimais?`,1.256*i,t`$B=\mu_0nI=1,256\cdot${i}=${(1.256*i).toFixed(3).replace('.',',')}\,\text{mT}$.`,{unit:'mT',tol:0.005});}),
            mcq(t`A circulação $\oint\vec B\cdot d\vec\ell$ é proporcional a…`,['corrente líquida enlaçada','soma dos módulos de todas as correntes próximas','fluxo elétrico constante','área do caminho em todos os casos'],0,t`A lei usa a soma algébrica $I_{\rm enc}$, com sinais definidos pelo percurso.`),
            num(t`Um percurso enlaça $5\,\text{A}$ num sentido e $2\,\text{A}$ no sentido oposto. Qual a corrente líquida em A, com uma casa decimal, tomando o primeiro sentido como positivo?`,3,t`$I_{\rm enc}=5-2=3,0\,\text{A}$.`,{unit:'A',tol:0.05}),
            tf(t`A lei de Ampère magnetostática permite tirar $B$ da integral como constante para qualquer caminho.`,false,t`Isso só é possível quando a geometria escolhida e a simetria justificam o módulo e a direção necessários ao longo do trecho.`),
          ],
        },
      ],
    },
    {
      id: 'em-mag-mat', title: 'Materiais magnéticos', parts: [
        {
          card: { title: 'Momentos e magnetização', body: t`A magnetização $\vec M$ é o momento magnético por unidade de volume, em $\text{A/m}$. Momentos microscópicos podem se orientar num campo; em certos materiais existem domínios. Na cena, o campo externo azul aponta em $+x$ e a seta dourada representa um momento de domínio.`, visual: direcao('mat') },
          exercises: [
            mcq(t`Magnetização é momento magnético por unidade de…`,['volume','massa','tempo','corrente'],0,t`Por definição, $M$ é a densidade volumétrica de momento magnético.`),
            inter(t`Alinhe o momento de domínio dourado com o campo externo azul.`, 'space3d', {...direcao('mat').props, params:[{key:'s',label:'orientação',min:-1,max:1,step:2,value:-1,color:C.gold}]}, (v:any)=>v?.p.s===1, t`Orientação $+1$.`, t`As duas setas devem apontar para $+x$, orientação de menor energia $U=-\vec\mu\cdot\vec B$.`),
            num(t`Um corpo uniforme tem momento magnético total $6\,\text{A}\cdot\text{m}^2$ e volume $2\,\text{m}^3$. Qual $M$ em A/m, com uma casa decimal?`,3,t`$M=\mu/V=6/2=3,0\,\text{A/m}$.`,{unit:'A/m',tol:0.05}),
            gen((rng)=>{const m=randInt(rng,1,8);return num(t`Um corpo uniforme de volume $2\,\text{m}^3$ tem momento magnético $${2*m}\,\text{A}\cdot\text{m}^2$. Qual $M$ em A/m, com uma casa decimal?`,m,t`$M=\mu/V=${2*m}/2=${m}\,\text{A/m}$.`,{unit:'A/m',tol:0.05});}),
            tf(t`Domínios de um ferromagneto podem estar magnetizados localmente mesmo quando a magnetização total é pequena.`,true,t`Domínios orientados em sentidos diferentes podem cancelar grande parte dos momentos macroscópicos.`),
            mcq(t`A energia de um dipolo magnético num campo uniforme é mínima quando o momento está…`,['paralelo e no mesmo sentido do campo','oposto ao campo','perpendicular ao campo','com módulo zero necessariamente'],0,t`$U=-\mu B\cos\theta$ é mínima para $\theta=0$.`),
            num(t`Um dipolo de $2\,\text{A}\cdot\text{m}^2$ está alinhado a $3\,\text{T}$. Qual sua energia potencial em J, com uma casa decimal, usando $U=-\vec\mu\cdot\vec B$?`,-6,t`$U=-2\cdot3\cos0^\circ=-6,0\,\text{J}$.`,{unit:'J',tol:0.05}),
          ],
        },
        {
          card: { title: 'Resposta e histerese', body: t`Em meio linear e isotrópico, $\vec M=\chi_m\vec H$ e $\vec B=\mu_0(\vec H+\vec M)$. Diamagnéticos têm $\chi_m<0$ pequena; paramagnéticos, $\chi_m>0$ pequena. Ferromagnéticos podem apresentar magnetização intensa, saturação e histerese: a resposta depende da história, então uma permeabilidade constante não descreve todo o ciclo.` },
          exercises: [
            mcq(t`Qual material tem suscetibilidade magnética linear negativa?`,['diamagnético','paramagnético','ferromagnético saturado necessariamente','qualquer material'],0,t`O diamagnetismo induz resposta oposta ao campo aplicado, com $\chi_m<0$.`),
            tf(t`Um paramagnético linear tem suscetibilidade positiva.`,true,t`A magnetização induzida acompanha $\vec H$, então $\chi_m>0$.`),
            num(t`Um material linear tem $\chi_m=0,2$ e $H=10\,\text{A/m}$. Qual $M$ em A/m, com uma casa decimal?`,2,t`$M=\chi_m H=0,2\cdot10=2,0\,\text{A/m}$.`,{unit:'A/m',tol:0.05}),
            gen((rng)=>{const h=randInt(rng,1,8);return num(t`Um material linear tem $\chi_m=0,5$ e $H=${2*h}\,\text{A/m}$. Qual $M$ em A/m, com uma casa decimal?`,h,t`$M=\chi_m H=0,5\cdot${2*h}=${h}\,\text{A/m}$.`,{unit:'A/m',tol:0.05});}),
            mcq(t`Remanência é…`,['magnetização que permanece após retirar o campo aplicado','campo necessário para iniciar corrente','ausência de domínios','temperatura de fusão'],0,t`Após retirar o campo aplicado, a magnetização remanente pode permanecer devido à história do material.`),
            tf(t`Na saturação ferromagnética, aumentar o campo aplicado continua alinhando domínios indefinidamente na mesma proporção.`,false,t`Perto da saturação, os momentos já estão amplamente alinhados e a magnetização cresce muito menos.`),
            num(t`Em um meio linear, $H=100\,\text{A/m}$ e $M=50\,\text{A/m}$. Use $\mu_0=4\pi\times10^{-7}$ e $\pi=3,14$. Qual $B$ em mT, com três casas decimais?`,0.1884,t`$B=\mu_0(H+M)=4\cdot3,14\times10^{-7}\cdot150=0,1884\,\text{mT}\approx0,188\,\text{mT}$.`,{unit:'mT',tol:0.0005}),
          ],
        },
      ],
    },
  ],
};
