import type { UnitDef } from '../../types';
import { gen, inter, match, mcq, num, tf } from '../../helpers';
import { vectorLab } from '../../visuals';
import { randInt } from '../../../lib/random';

const t = String.raw;

export const vetoresFis: UnitDef = {
  id: 'm-vet',
  title: 'Vetores na física',
  icon: '🧭',
  subtitle: 'Deslocamentos, forças e produtos de vetores',
  source: 'Física Aplicada I · Aula 6; Halliday, capítulo 3',
  guide: t`Para ângulo $\theta$ medido do eixo $+x$, $A_x=A\cos\theta$ e $A_y=A\sin\theta$; $A=\sqrt{A_x^2+A_y^2}$. Some componentes de mesma unidade. Para vetores não nulos, $\hat{A}=\vec A/A$. O trabalho de força constante é $W=\vec F\cdot\vec d=Fd\cos\theta$. O torque é $\vec\tau=\vec r\times\vec F$, com módulo $rF\sin\theta$ e sentido dado pela mão direita.`,
  lessons: [
    {
      id: 'm-vet-comp', title: 'Componentes, módulo e direção', parts: [
        {
          card: { title: 'Projete nos eixos', body: t`Um deslocamento tem módulo, direção e sentido. Escolha $+x$ para leste e $+y$ para norte. Suas componentes são as projeções com sinal. Se $\theta$ é medido do eixo $+x$ no sentido anti-horário, $d_x=d\cos\theta$ e $d_y=d\sin\theta$.`, example: t`$10\,\text{m}$ a $30^\circ$ de $+x$: $d_x=5\sqrt3\,\text{m}$ e $d_y=5\,\text{m}$.`, visual: vectorLab('module', { u: [3, 2], snap: 1 }) },
          exercises: [
            mcq(t`Qual grandeza é vetorial?`, ['deslocamento', 'massa', 'tempo', 'temperatura'], 0, t`Deslocamento precisa de módulo, direção e sentido; as outras grandezas listadas são escalares.`),
            tf(t`Uma componente de deslocamento pode ser negativa.`, true, t`O sinal indica sentido oposto ao eixo positivo escolhido.`),
            num(t`Um deslocamento de $8\,\text{m}$ para oeste tem qual componente $x$, em m? Leste é $+x$.`, -8, t`Oeste é o sentido negativo de $x$, logo $d_x=-8\,\text{m}$.`, { unit: 'm' }),
            inter(t`No gráfico, arraste $\vec u$ para representar $2\,\text{m}$ a leste e $3\,\text{m}$ ao norte. Cada unidade vale 1 m.`, 'plot', vectorLab('module', { u: [1, 1], snap: 1 }).props!, (v: any) => v?.pts.u.x === 2 && v?.pts.u.y === 3, t`$(2,\,3)$`, t`Leste é $+x$ e norte é $+y$: as componentes são $(2,\,3)\,\text{m}$.`),
            mcq(t`Uma força de $10\,\text{N}$ faz $30^\circ$ acima de $+x$. Qual sua componente vertical?`, [t`$5\,\text{N}$`, t`$10\,\text{N}$`, t`$5\sqrt3\,\text{N}$`, t`$-5\,\text{N}$`], 0, t`$F_y=10\sin30^\circ=5\,\text{N}$.`),
            gen((rng) => { const a = randInt(rng, 2, 9); return num(t`Uma força de $${a}\,\text{N}$ aponta para baixo. Com $+y$ para cima, qual $F_y$, em N?`, -a, t`Para baixo é o sentido negativo: $F_y=-${a}\,\text{N}$.`, { unit: 'N' }); }),
            mcq(t`Uma força aponta ao segundo quadrante. Quais sinais têm suas componentes $(F_x,\,F_y)$?`, [t`$(-,\,+)$`, t`$(+,\,+)$`, t`$(-,\,-)$`, t`$(+,\,-)$`], 0, t`No segundo quadrante a força aponta para a esquerda e para cima: $F_x<0$ e $F_y>0$.`),
          ],
        },
        {
          card: { title: 'Dois catetos e uma direção', body: t`O módulo é $d=\sqrt{d_x^2+d_y^2}$. Para determinar o ângulo, considere os sinais das componentes e o quadrante: a tangente sozinha não distingue vetores em sentidos opostos. O vetor nulo não tem direção definida.`, example: t`$(3,\,4)\,\text{m}$ tem módulo $5\,\text{m}$ e ângulo aproximadamente $53{,}1^\circ$ acima de $+x$.` },
          exercises: [
            num(t`Um deslocamento tem componentes $(3,\,4)\,\text{m}$. Qual seu módulo, em m?`, 5, t`$d=\sqrt{3^2+4^2}=5\,\text{m}$.`, { unit: 'm' }),
            mcq(t`O vetor $(-3,\,4)$ aponta para qual quadrante?`, ['segundo', 'primeiro', 'terceiro', 'quarto'], 0, t`A componente horizontal é negativa e a vertical positiva: segundo quadrante.`),
            tf(t`Os vetores $(3,\,4)$ e $(-3,\,-4)$ têm o mesmo módulo e sentidos opostos.`, true, t`Ambos têm módulo $5$; o segundo é o negativo do primeiro.`),
            gen((rng) => { const k = randInt(rng, 1, 5); return num(t`Um deslocamento tem componentes $(${3*k},\,${4*k})\,\text{m}$. Qual seu módulo, em m?`, 5*k, t`$d=\sqrt{(${3*k})^2+(${4*k})^2}=${5*k}\,\text{m}$.`, { unit: 'm' }); }),
            num(t`Uma força $(0,\,-6)\,\text{N}$ faz que ângulo entre $0^\circ$ e $360^\circ$, medido de $+x$ no sentido anti-horário? Responda em graus.`, 270, t`Ela aponta em $-y$, que fica a $270^\circ$ de $+x$.`, { unit: '°' }),
            mcq(t`Um deslocamento tem componentes $(-4,\,-4)\,\text{m}$. Qual seu ângulo anti-horário a partir de $+x$?`, [t`$225^\circ$`, t`$45^\circ$`, t`$135^\circ$`, t`$315^\circ$`], 0, t`As componentes são iguais e negativas: terceiro quadrante, $180^\circ+45^\circ=225^\circ$.`),
            num(t`Uma força $(6,\,8)\,\text{N}$ tem qual módulo, em N?`, 10, t`$F=\sqrt{6^2+8^2}=10\,\text{N}$.`, { unit: 'N' }),
          ],
        },
      ],
    },
    {
      id: 'm-vet-soma', title: 'Soma e vetores unitários', parts: [
        {
          card: { title: 'Some deslocamentos', body: t`Deslocamentos sucessivos somam-se ponta com cauda; a resultante vai do ponto inicial ao final. Por componentes, $\vec R=(A_x+B_x)\hat{\imath}+(A_y+B_y)\hat{\jmath}$. A ordem da soma não muda a resultante.`, visual: vectorLab('sum', { snap: 1 }) },
          exercises: [
            tf(t`Trocar a ordem de dois deslocamentos não muda o deslocamento resultante.`, true, t`A soma de vetores é comutativa: $\vec A+\vec B=\vec B+\vec A$.`),
            num(t`Uma pessoa anda $3\,\text{m}$ a leste e depois $2\,\text{m}$ a oeste. Qual o deslocamento em $x$, em m? Leste é positivo.`, 1, t`$d_x=3-2=1\,\text{m}$.`, { unit: 'm' }),
            match('Associe o trajeto à resultante.', [['3 m leste e 2 m oeste', '1 m leste'], ['4 m norte e 4 m sul', 'zero'], ['2 m sul e 1 m norte', '1 m sul']], t`Some com sinais: $3-2=1$ para leste, $4-4=0$ e $-2+1=-1$ para sul.`),
            inter(t`Cada unidade do gráfico vale 1 m. Arraste os dois vetores para que a resultante seja $(4,\,0)\,\text{m}$ e ambos tenham componente vertical não nula.`, 'plot', vectorLab('sum', { snap: 1 }).props!, (v: any) => v && v.pts.u.x + v.pts.v.x === 4 && v.pts.u.y + v.pts.v.y === 0 && v.pts.u.y !== 0, t`Por exemplo $(2,\,2)+(2,\,-2)$.`, t`As componentes verticais se cancelam, enquanto as horizontais somam $4\,\text{m}$.`),
            gen((rng) => { const a = randInt(rng, 2, 8); const b = randInt(rng, 1, 5); return num(t`Um corpo desloca-se $${a}\,\text{m}$ para leste e mais $${b}\,\text{m}$ para leste. Qual o deslocamento resultante, em m?`, a+b, t`Os sentidos coincidem: $${a}+${b}=${a+b}\,\text{m}$.`, { unit: 'm' }); }),
            num(t`Um trajeto tem $3\,\text{m}$ a leste e $4\,\text{m}$ ao norte. Qual o módulo do deslocamento resultante, em m?`, 5, t`$R=\sqrt{3^2+4^2}=5\,\text{m}$.`, { unit: 'm' }),
            num(t`Duas forças são $(4,\,3)\,\text{N}$ e $(-1,\,-5)\,\text{N}$. Qual a componente vertical da resultante, em N?`, -2, t`$R_y=3-5=-2\,\text{N}$.`, { unit: 'N' }),
          ],
        },
        {
          card: { title: 'Unitários e escala', body: t`$\hat{\imath}$ e $\hat{\jmath}$ têm módulo 1 e apontam para $+x$ e $+y$. Escrevemos $\vec F=F_x\hat{\imath}+F_y\hat{\jmath}$. Multiplicar por um escalar multiplica cada componente; um fator negativo inverte o sentido. Para $\vec F\ne\vec 0$, $\hat F=\vec F/|\vec F|$.` },
          exercises: [
            mcq(t`O vetor unitário $\hat{\jmath}$ aponta em qual sentido?`, ['$+y$', '$-y$', '$+x$', '$-x$'], 0, t`Por definição, $\hat{\jmath}$ tem módulo 1 e aponta em $+y$.`),
            tf(t`Multiplicar um vetor não nulo por $-2$ dobra seu módulo e inverte seu sentido.`, true, t`$|-2|=2$ dobra o módulo e o sinal negativo inverte o sentido.`),
            num(t`Se $\vec F=(2\hat{\imath}-3\hat{\jmath})\,\text{N}$, qual é $F_y$, em N?`, -3, t`O coeficiente de $\hat{\jmath}$ é $-3\,\text{N}$.`, { unit: 'N' }),
            gen((rng) => { const a = randInt(rng, 2, 6); return num(t`Se $\vec F=(${a}\hat{\imath}+2\hat{\jmath})\,\text{N}$, qual é a componente $x$ de $-2\vec F$, em N?`, -2*a, t`Multiplique cada componente por $-2$: $F'_x=-2\cdot${a}=${-2*a}\,\text{N}$.`, { unit: 'N' }); }),
            mcq(t`Qual é o unitário na direção e sentido de $(3,\,4)$?`, [t`$\frac35\hat{\imath}+\frac45\hat{\jmath}$`, t`$3\hat{\imath}+4\hat{\jmath}$`, t`$\frac45\hat{\imath}+\frac35\hat{\jmath}$`, t`$-\frac35\hat{\imath}-\frac45\hat{\jmath}$`], 0, t`O módulo é $5$; dividir as componentes por $5$ preserva o sentido e produz módulo 1.`),
            num(t`Se $\vec A=(3,\,-2)\,\text{m}$ e $\vec B=(1,\,4)\,\text{m}$, qual a componente $y$ de $\vec A-\vec B$, em m?`, -6, t`$A_y-B_y=-2-4=-6\,\text{m}$.`, { unit: 'm' }),
            mcq(t`Qual expressão representa uma força de $5\,\text{N}$ em $-x$?`, [t`$-5\hat{\imath}\,\text{N}$`, t`$5\hat{\imath}\,\text{N}$`, t`$-5\hat{\jmath}\,\text{N}$`, t`$5\hat{\jmath}\,\text{N}$`], 0, t`$\hat{\imath}$ aponta para $+x$; o sinal negativo troca o sentido.`),
          ],
        },
      ],
    },
    {
      id: 'm-vet-esc', title: 'Produto escalar', parts: [
        {
          card: { title: 'Projeção e sinal', body: t`$\vec A\cdot\vec B=AB\cos\theta=A_xB_x+A_yB_y+A_zB_z$ é um escalar. Para vetores não nulos, o produto é positivo em ângulo agudo, nulo a $90^\circ$ e negativo em ângulo obtuso. A ordem dos fatores não altera o resultado.`, visual: vectorLab('dot', { u: [3, 0], v: [1, 2], snap: 1 }) },
          exercises: [
            mcq(t`O resultado do produto escalar de duas forças é…`, ['um escalar', 'um vetor perpendicular', 'sempre uma força', 'um vetor unitário'], 0, t`O produto escalar produz um número com a unidade do produto das grandezas.`),
            tf(t`Dois vetores não nulos perpendiculares têm produto escalar zero.`, true, t`$\cos90^\circ=0$, então $\vec A\cdot\vec B=0$.`),
            num(t`Calcule $(2,\,3)\cdot(4,\,-1)$. Responda com o valor sem unidade.`, 5, t`$2\cdot4+3\cdot(-1)=8-3=5$.`),
            inter(t`Arraste os dois vetores não nulos para que sejam perpendiculares.`, 'plot', vectorLab('dot', { u: [2, 0], v: [2, 2], snap: 1 }).props!, (v: any) => v && Math.hypot(v.pts.u.x, v.pts.u.y) > 0 && Math.hypot(v.pts.v.x, v.pts.v.y) > 0 && v.pts.u.x*v.pts.v.x + v.pts.u.y*v.pts.v.y === 0, t`Por exemplo $(2,\,0)$ e $(0,\,2)$.`, t`Para vetores não nulos, produto escalar zero equivale a ângulo de $90^\circ$.`),
            gen((rng) => { const a = randInt(rng, 2, 8); const b = randInt(rng, 2, 6); return num(t`Calcule $(${a},\,2)\cdot(${b},\,1)$. Responda sem unidade.`, a*b+2, t`$${a}\cdot${b}+2\cdot1=${a*b+2}$.`); }),
            mcq(t`Se dois vetores não nulos formam $120^\circ$, seu produto escalar é…`, ['negativo', 'positivo', 'zero', 'um vetor'], 0, t`$\cos120^\circ=-\frac12$, logo o produto é negativo.`),
            num(t`Dois vetores têm módulos 4 e 6 e formam $60^\circ$. Qual o produto escalar, sem unidade?`, 12, t`$4\cdot6\cos60^\circ=24\cdot\frac12=12$.`),
          ],
        },
        {
          card: { title: 'Trabalho de força constante', body: t`O trabalho de uma força constante ao longo de um deslocamento é $W=\vec F\cdot\vec d=Fd\cos\theta$. Só a componente da força na direção do deslocamento contribui. A unidade é o joule: $1\,\text{J}=1\,\text{N}\cdot\text{m}$. Trabalho negativo indica componente da força oposta ao deslocamento.`, example: t`$F=10\,\text{N}$, $d=4\,\text{m}$ e $\theta=60^\circ$: $W=20\,\text{J}$.` },
          exercises: [
            num(t`Uma força constante de $5\,\text{N}$ acompanha um deslocamento de $3\,\text{m}$. Qual o trabalho, em J?`, 15, t`$W=5\cdot3\cos0^\circ=15\,\text{J}$.`, { unit: 'J' }),
            tf(t`Uma força perpendicular ao deslocamento realiza trabalho nulo.`, true, t`$W=Fd\cos90^\circ=0$.`),
            num(t`Uma força de $4\,\text{N}$ opõe-se a um deslocamento de $2\,\text{m}$. Qual o trabalho, em J?`, -8, t`$W=4\cdot2\cos180^\circ=-8\,\text{J}$.`, { unit: 'J' }),
            gen((rng) => { const f = randInt(rng, 2, 9); const d = randInt(rng, 2, 8); return num(t`Uma força constante de $${f}\,\text{N}$ atua no sentido de um deslocamento de $${d}\,\text{m}$. Calcule o trabalho, em J.`, f*d, t`$W=Fd\cos0^\circ=${f}\cdot${d}=${f*d}\,\text{J}$.`, { unit: 'J' }); }),
            num(t`Uma força constante de $10\,\text{N}$ faz $60^\circ$ com um deslocamento de $4\,\text{m}$. Qual o trabalho, em J?`, 20, t`$W=10\cdot4\cdot\frac12=20\,\text{J}$.`, { unit: 'J' }),
            num(t`Uma força constante $(3,\,4)\,\text{N}$ atua durante o deslocamento $(2,\,-1)\,\text{m}$. Qual o trabalho, em J?`, 2, t`$W=3\cdot2+4\cdot(-1)=2\,\text{J}$.`, { unit: 'J' }),
            mcq(t`Uma caixa desliza horizontalmente. Qual o trabalho da força normal vertical sobre ela?`, [t`$0\,\text{J}$`, 'sempre positivo', 'sempre negativo', 'igual ao peso'], 0, t`Normal e deslocamento são perpendiculares, portanto $W=0\,\text{J}$.`),
          ],
        },
      ],
    },
    {
      id: 'm-vet-vetorial', title: 'Produto vetorial', parts: [
        {
          card: { title: 'Área e mão direita', body: t`$\vec A\times\vec B$ é perpendicular aos dois vetores; seu módulo é $AB\sin\theta$, a área do paralelogramo formado por eles. A regra da mão direita fixa o sentido: curve os dedos de $\vec A$ para $\vec B$ pelo menor ângulo; o polegar aponta o produto. Trocar a ordem inverte o resultado.`, visual: vectorLab('area', { u: [3, 0], v: [1, 2], snap: 1 }) },
          exercises: [
            mcq(t`Para vetores não paralelos, o produto vetorial é…`, ['perpendicular aos dois vetores', 'paralelo ao primeiro vetor', 'um escalar', 'sempre nulo'], 0, t`Pela definição, $\vec A\times\vec B$ é perpendicular ao plano dos dois vetores.`),
            tf(t`Trocar a ordem dos fatores inverte o produto vetorial.`, true, t`$\vec B\times\vec A=-(\vec A\times\vec B)$.`),
            num(t`Dois vetores perpendiculares têm módulos 3 e 4. Qual o módulo do produto vetorial, sem unidade?`, 12, t`$|\vec A\times\vec B|=3\cdot4\sin90^\circ=12$.`),
            inter(t`No gráfico, arraste vetores para formar um paralelogramo de área 4 unidades quadradas.`, 'plot', vectorLab('area', { u: [1, 0], v: [0, 1], snap: 1 }).props!, (v: any) => v && Math.abs(v.pts.u.x*v.pts.v.y-v.pts.u.y*v.pts.v.x) === 4, t`Por exemplo $(2,\,0)$ e $(0,\,2)$.`, t`A área é $|u_xv_y-u_yv_x|$; no exemplo, $|2\cdot2|=4$.`),
            gen((rng) => { const a = randInt(rng, 2, 8); const b = randInt(rng, 2, 6); return num(t`Vetores perpendiculares têm módulos $${a}$ e $${b}$. Qual o módulo de seu produto vetorial, sem unidade?`, a*b, t`$AB\sin90^\circ=${a}\cdot${b}=${a*b}$.`); }),
            mcq(t`Com eixos destros, qual o sentido de $\hat{\imath}\times\hat{\jmath}$?`, [t`$+\hat{k}$`, t`$-\hat{k}$`, t`$+\hat{\imath}$`, t`$+\hat{\jmath}$`], 0, t`A mão direita, de $+x$ para $+y$, aponta em $+z$: $\hat{\imath}\times\hat{\jmath}=\hat{k}$.`),
            num(t`Dois vetores de módulos 4 e 6 formam $30^\circ$. Qual o módulo do produto vetorial, sem unidade?`, 12, t`$4\cdot6\sin30^\circ=24\cdot\frac12=12$.`),
          ],
        },
        {
          card: { title: 'Torque de uma força', body: t`O torque de uma força em relação a um ponto é $\vec\tau=\vec r\times\vec F$, com $\vec r$ do ponto de referência até o ponto de aplicação. Seu módulo é $rF\sin\theta=Fd_\perp$, onde $d_\perp$ é a distância perpendicular à linha de ação. Em um plano $xy$, $\tau_z=r_xF_y-r_yF_x$. A unidade é $\text{N}\cdot\text{m}$.`, example: t`$\vec r=(2,\,0)\,\text{m}$ e $\vec F=(0,\,3)\,\text{N}$ dão $\tau_z=6\,\text{N}\cdot\text{m}$, em $+z$.` },
          exercises: [
            tf(t`Uma força cuja linha de ação passa pelo ponto de referência produz torque nulo em relação a esse ponto.`, true, t`A distância perpendicular à linha de ação é zero: $\tau=Fd_\perp=0$.`),
            num(t`Uma força perpendicular de $4\,\text{N}$ atua a $2\,\text{m}$ do eixo. Qual o módulo do torque, em N·m?`, 8, t`$\tau=rF\sin90^\circ=2\cdot4=8\,\text{N}\cdot\text{m}$.`, { unit: 'N·m' }),
            mcq(t`Com $+z$ saindo da tela, $\vec r$ aponta à direita e $\vec F$ para cima. Qual o sentido do torque?`, ['$+z$', '$-z$', '$+x$', '$-y$'], 0, t`$\hat{\imath}\times\hat{\jmath}=\hat{k}$: a mão direita aponta para fora da tela.`),
            gen((rng) => { const r = randInt(rng, 1, 5); const f = randInt(rng, 2, 8); return num(t`Uma força de $${f}\,\text{N}$ atua perpendicularmente a uma alavanca a $${r}\,\text{m}$ do eixo. Qual o módulo do torque, em N·m?`, r*f, t`$\tau=rF=${r}\cdot${f}=${r*f}\,\text{N}\cdot\text{m}$.`, { unit: 'N·m' }); }),
            num(t`No plano $xy$, $\vec r=(2,\,1)\,\text{m}$ e $\vec F=(1,\,3)\,\text{N}$. Qual $\tau_z$, em N·m?`, 5, t`$\tau_z=r_xF_y-r_yF_x=2\cdot3-1\cdot1=5\,\text{N}\cdot\text{m}$.`, { unit: 'N·m' }),
            num(t`Uma força de $10\,\text{N}$ forma $30^\circ$ com $\vec r$ de módulo $2\,\text{m}$. Qual o módulo do torque, em N·m?`, 10, t`$\tau=2\cdot10\sin30^\circ=10\,\text{N}\cdot\text{m}$.`, { unit: 'N·m' }),
            mcq(t`Uma força aplicada mais longe da dobradiça, perpendicularmente à porta, produz qual efeito no módulo do torque, se seu módulo não muda?`, ['aumenta', 'diminui', 'permanece zero', 'não muda'], 0, t`Para força perpendicular, $\tau=rF$: aumentar $r$ aumenta o torque.`),
          ],
        },
      ],
    },
  ],
};
