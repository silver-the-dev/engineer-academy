import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, tf } from '../../helpers';
import { fnLab } from '../../visuals';
import { randInt } from '../../../lib/random';

const t = String.raw;

// Gráficos com eixos e controles próprios para cada relação física.
const trabalhoLab = () => fnLab({
  f: (x, p) => p.f * x,
  params: [{ key: 'f', label: 'F (N)', min: -4, max: 4, step: 1, value: 1 }],
  view: { xMin: 0, xMax: 5, yMin: -20, yMax: 20 },
  info: (p) => t`Força paralela com sinal $F_x=${p.f}\,\text{N}$: $W=F_x x$. Eixo horizontal: deslocamento em m; vertical: trabalho em J.`,
});
const cineticaLab = () => fnLab({
  f: (x, p) => p.m * x * x / 2,
  params: [{ key: 'm', label: 'm (kg)', min: 1, max: 4, step: 1, value: 1 }],
  view: { xMin: 0, xMax: 4, yMin: 0, yMax: 32 },
  info: (p) => t`$K=\frac12 mv^2$ com $m=${p.m}\,\text{kg}$. Eixo horizontal: velocidade em m/s; vertical: energia em J.`,
});
const potencialLab = () => fnLab({
  f: (x, p) => p.k * x * x / 2,
  params: [{ key: 'k', label: 'k (N/m)', min: 1, max: 4, step: 1, value: 1 }],
  view: { xMin: -4, xMax: 4, yMin: 0, yMax: 32 },
  info: (p) => t`$U_e=\frac12 kx^2$ com $k=${p.k}\,\text{N/m}$. Eixo horizontal: deformação em m; vertical: energia em J.`,
});
const potenciaLab = () => fnLab({
  f: (x, p) => p.p * x,
  params: [{ key: 'p', label: 'P (W)', min: 1, max: 5, step: 1, value: 1 }],
  view: { xMin: 0, xMax: 5, yMin: 0, yMax: 25 },
  info: (p) => t`Potência constante $P=${p.p}\,\text{W}$: $E=Pt$. Eixo horizontal: tempo em s; vertical: energia transferida em J.`,
});

export const energia: UnitDef = {
  id: 'm-energia', title: 'Trabalho e energia', icon: '🔋',
  subtitle: 'Forças, conservação, potência e rendimento',
  source: 'Conteúdo complementar · Halliday, Resnick e Walker, Fundamentos de Física, capítulos 7 e 8',
  extra: true,
  guide: t`Para força constante, $W=Fd\cos\theta$; em uma dimensão, $W=\int F_x\,dx$. O trabalho resultante é $\Delta K$, com $K=\frac12 mv^2$. Próximo à superfície, $U_g=mgh$; numa mola ideal, $U_e=\frac12 kx^2$. Para forças conservativas, $W_c=-\Delta U$; se só elas realizam trabalho, $K+U$ se conserva. A potência média é $P=\Delta E/\Delta t$, e o rendimento é $\eta=E_{\text{útil}}/E_{\text{entrada}}$.`,
  lessons: [
    { id: 'm-en-trab', title: 'Trabalho de uma força', parts: [
      { card: { title: 'Força e deslocamento', body: t`O trabalho de uma força constante é $W=Fd\cos\theta$, onde $\theta$ é o ângulo entre força e deslocamento. É positivo quando a componente da força favorece o movimento, negativo quando se opõe e zero quando é perpendicular. A unidade é o joule: $1\,\text{J}=1\,\text{N}\cdot\text{m}$. No gráfico, varie a componente paralela e observe o trabalho acumulado.`, visual: trabalhoLab() }, exercises: [
        mcq(t`Qual é a unidade SI de trabalho?`, ['joule', 'watt', 'newton', 'metro'], 0, t`Trabalho é força vezes deslocamento: $\text{N}\cdot\text{m}=\text{J}$.`),
        tf(t`Uma força perpendicular ao deslocamento realiza trabalho nulo.`, true, t`Como $\cos90^\circ=0$, $W=Fd\cos90^\circ=0$.`),
        num(t`Uma força paralela de $5\,\text{N}$ desloca uma caixa $3\,\text{m}$ no mesmo sentido. Calcule o trabalho em J, sem casas decimais.`, 15, t`$W=5\cdot3\cos0^\circ=15\,\text{J}$.`, { unit: 'J', tol: 0.5 }),
        mcq(t`Uma força contrária ao deslocamento realiza trabalho de que sinal?`, ['negativo', 'positivo', 'sempre nulo', 'depende apenas da massa'], 0, t`O ângulo é $180^\circ$, logo $\cos180^\circ=-1$ e o trabalho é negativo.`),
        inter(t`No gráfico, ajuste a força paralela para que o trabalho em $3\,\text{m}$ seja $6\,\text{J}$.`, 'plot', trabalhoLab().props, (v) => v.p.f === 2, t`$F_x=2\,\text{N}$`, t`$W=F_x d$: portanto $F_x=6/3=2\,\text{N}$.`),
        gen((rng) => { const f = randInt(rng, 2, 9); const d = randInt(rng, 2, 6); return num(t`Uma força de $${f}\,\text{N}$ atua contra um deslocamento de $${d}\,\text{m}$. Calcule seu trabalho em J, sem casas decimais.`, -f*d, t`$W=${f}\cdot${d}\cos180^\circ=-${f*d}\,\text{J}$.`, { unit: 'J', tol: 0.5 }); }),
        num(t`Uma força de $10\,\text{N}$ faz $60^\circ$ com um deslocamento de $4\,\text{m}$. Calcule o trabalho em J, sem casas decimais.`, 20, t`$W=10\cdot4\cdot\cos60^\circ=40\cdot0{,}5=20\,\text{J}$.`, { unit: 'J', tol: 0.5 }),
      ] },
      { card: { title: 'Força variável e área', body: t`Se a componente $F_x$ varia com a posição, o trabalho entre $x_i$ e $x_f$ é $W=\int_{x_i}^{x_f}F_x\,dx$. Num gráfico de $F_x$ por $x$, é a área algébrica: regiões abaixo do eixo contam negativamente. Para uma mola ideal, $F_x=-kx$, com $x$ medido a partir do equilíbrio.`, example: t`De $x=0$ a $2\,\text{m}$, uma força que cresce linearmente de $0$ a $6\,\text{N}$ realiza $W=\frac12\cdot2\cdot6=6\,\text{J}$.` }, exercises: [
        mcq(t`No gráfico $F_x$ versus $x$, o trabalho corresponde a…`, ['área algébrica sob a curva', 'inclinação da curva', 'altura máxima da curva', 'área sem sinal em qualquer situação'], 0, t`A integral $\int F_x\,dx$ soma áreas com sinal.`),
        tf(t`Uma região do gráfico abaixo do eixo de posição contribui com trabalho negativo.`, true, t`Nessa região $F_x<0$, então sua integral sobre deslocamento positivo é negativa.`),
        num(t`Uma força constante de $4\,\text{N}$ atua de $x=0$ a $x=3\,\text{m}$. Calcule a área e o trabalho em J, sem casas decimais.`, 12, t`O retângulo tem área $4\cdot3=12\,\text{J}$.`, { unit: 'J', tol: 0.5 }),
        num(t`Uma força cresce linearmente de zero a $8\,\text{N}$ em $2\,\text{m}$. Calcule o trabalho em J, sem casas decimais.`, 8, t`A área triangular é $\frac12\cdot2\cdot8=8\,\text{J}$.`, { unit: 'J', tol: 0.5 }),
        gen((rng) => { const k = 2*randInt(rng, 1, 5); const x = randInt(rng, 1, 3); return num(t`Uma mola ideal de $k=${k}\,\text{N/m}$ é esticada lentamente de $0$ a $${x}\,\text{m}$. Qual o trabalho da força da mola em J, sem casas decimais?`, -k*x*x/2, t`$W_{\text{mola}}=-\int_0^{${x}}${k}x\,dx=-\frac12\cdot${k}\cdot${x}^2=-${k*x*x/2}\,\text{J}$.`, { unit: 'J', tol: 0.5 }); }),
        mcq(t`A força da mola ideal aponta em que sentido?`, ['Para o equilíbrio', 'Sempre para a direita', 'Sempre no sentido da velocidade', 'Para longe do equilíbrio'], 0, t`Em $F_x=-kx$, o sinal oposto a $x$ aponta para o equilíbrio.`),
        num(t`Ao longo de $4\,\text{m}$, a força é $+3\,\text{N}$ nos primeiros $2\,\text{m}$ e $-2\,\text{N}$ nos últimos $2\,\text{m}$. Calcule o trabalho total em J, sem casas decimais.`, 2, t`Somando as áreas com sinal: $3\cdot2-2\cdot2=2\,\text{J}$.`, { unit: 'J', tol: 0.5 }),
      ] },
    ] },
    { id: 'm-en-cin', title: 'Energia cinética e o teorema do trabalho', parts: [
      { card: { title: 'Energia do movimento', body: t`Para uma partícula de massa $m$ e velocidade de módulo $v$, $K=\frac12 mv^2$. A energia cinética é escalar e não negativa; depende do referencial. No gráfico, altere a massa e compare velocidades.`, visual: cineticaLab() }, exercises: [
        tf(t`A energia cinética de um corpo em repouso no referencial escolhido é zero.`, true, t`Com $v=0$, $K=\frac12 m(0)^2=0$.`),
        mcq(t`Se a velocidade dobra e a massa não muda, a energia cinética…`, ['quadruplica', 'dobra', 'cai pela metade', 'não muda'], 0, t`Como $K\propto v^2$, dobrar $v$ multiplica $K$ por $2^2=4$.`),
        num(t`Um corpo de $2\,\text{kg}$ move-se a $3\,\text{m/s}$. Calcule $K$ em J, sem casas decimais.`, 9, t`$K=\frac12\cdot2\cdot3^2=9\,\text{J}$.`, { unit: 'J', tol: 0.5 }),
        inter(t`Ajuste a massa no gráfico para que, a $2\,\text{m/s}$, a energia cinética seja $6\,\text{J}$.`, 'plot', cineticaLab().props, (v) => v.p.m === 3, t`$m=3\,\text{kg}$`, t`$6=\frac12 m\cdot2^2=2m$, então $m=3\,\text{kg}$.`),
        gen((rng) => { const m = 2*randInt(rng, 1, 4); const v = randInt(rng, 2, 6); return num(t`Um corpo de $${m}\,\text{kg}$ tem velocidade de módulo $${v}\,\text{m/s}$. Calcule $K$ em J, sem casas decimais.`, m*v*v/2, t`$K=\frac12\cdot${m}\cdot${v}^2=${m*v*v/2}\,\text{J}$.`, { unit: 'J', tol: 0.5 }); }),
        mcq(t`Dois corpos de mesma massa têm velocidades de módulos $v$ e $3v$. A razão entre suas energias cinéticas, respectivamente, é…`, ['$1:9$', '$1:3$', '$3:1$', '$1:6$'], 0, t`A razão é $v^2:(3v)^2=1:9$.`),
        num(t`Uma massa de $2\,\text{kg}$ possui $K=25\,\text{J}$. Qual o módulo da velocidade em m/s, sem casas decimais?`, 5, t`$25=\frac12\cdot2v^2$, logo $v=5\,\text{m/s}$, pois o módulo é não negativo.`, { unit: 'm/s', tol: 0.5 }),
      ] },
      { card: { title: 'Trabalho resultante muda K', body: t`O teorema trabalho–energia afirma $W_{\text{resultante}}=\Delta K=K_f-K_i$. Some os trabalhos de todas as forças. Trabalho resultante positivo aumenta $K$; negativo diminui $K$.`, example: t`Se $K_i=20\,\text{J}$ e $W_{\text{resultante}}=-8\,\text{J}$, então $K_f=12\,\text{J}$.` }, exercises: [
        tf(t`Trabalho resultante positivo aumenta a energia cinética.`, true, t`Pelo teorema, $\Delta K=W_{\text{resultante}}>0$.`),
        mcq(t`Qual trabalho entra no teorema trabalho–energia?`, ['A soma dos trabalhos de todas as forças', 'Apenas o trabalho da força aplicada', 'Apenas o trabalho do peso', 'Apenas o trabalho do atrito'], 0, t`O teorema usa o trabalho resultante, isto é, a soma dos trabalhos de todas as forças.`),
        num(t`Um corpo tem $K_i=8\,\text{J}$ e recebe trabalho resultante de $5\,\text{J}$. Calcule $K_f$ em J, sem casas decimais.`, 13, t`$K_f=K_i+W=8+5=13\,\text{J}$.`, { unit: 'J', tol: 0.5 }),
        gen((rng) => { const ki = randInt(rng, 10, 20); const loss = randInt(rng, 2, 8); return num(t`Uma partícula parte com $${ki}\,\text{J}$ de energia cinética e sofre trabalho resultante de $-${loss}\,\text{J}$. Calcule $K_f$ em J, sem casas decimais.`, ki-loss, t`$K_f=K_i+W=${ki}-${loss}=${ki-loss}\,\text{J}$.`, { unit: 'J', tol: 0.5 }); }),
        num(t`Uma força realiza $20\,\text{J}$ e outra $-7\,\text{J}$. Qual a variação de energia cinética em J, sem casas decimais?`, 13, t`$\Delta K=W_{\text{resultante}}=20-7=13\,\text{J}$.`, { unit: 'J', tol: 0.5 }),
        mcq(t`Se o trabalho resultante é zero, a velocidade vetorial necessariamente permanece igual?`, ['Não; sua direção pode mudar', 'Sim, pois não há forças', 'Sim, pois o corpo está parado', 'Não; o módulo necessariamente aumenta'], 0, t`$\Delta K=0$ mantém o módulo da velocidade para massa fixa, mas sua direção pode mudar.`),
        num(t`Uma massa de $2\,\text{kg}$ parte do repouso e recebe $16\,\text{J}$ de trabalho resultante. Qual sua velocidade final em m/s, sem casas decimais?`, 4, t`$16=\Delta K=\frac12\cdot2v^2$, então $v=4\,\text{m/s}$.`, { unit: 'm/s', tol: 0.5 }),
      ] },
    ] },
    { id: 'm-en-pot', title: 'Energia potencial e conservação', parts: [
      { card: { title: 'Gravidade e mola', body: t`Perto da superfície terrestre, escolha uma altura de referência e use $U_g=mgh$. Para mola ideal, $U_e=\frac12 kx^2$, com $x$ medido a partir do comprimento natural. Para uma força conservativa, $W_c=-\Delta U$: só diferenças de energia potencial importam. Varie $k$ e observe a parábola.`, visual: potencialLab() }, exercises: [
        mcq(t`Qual expressão descreve a energia potencial elástica de uma mola ideal?`, [t`$\frac12 kx^2$`, '$kx$', '$mgx$', '$mv^2$'], 0, t`Integrar a força restauradora dá $U_e=\frac12 kx^2$ com zero no equilíbrio.`),
        tf(t`A energia potencial gravitacional depende da referência escolhida para a altura.`, true, t`Mudar o nível zero altera o valor de $U_g$, mas não sua variação entre dois pontos.`),
        num(t`Uma massa de $2\,\text{kg}$ está $5\,\text{m}$ acima da referência. Use $g=9{,}8\,\text{m/s}^2$. Calcule $U_g$ em J, sem casas decimais.`, 98, t`$U_g=mgh=2\cdot9{,}8\cdot5=98\,\text{J}$.`, { unit: 'J', tol: 0.5 }),
        inter(t`Ajuste $k$ para que uma mola deformada de $2\,\text{m}$ armazene $8\,\text{J}$.`, 'plot', potencialLab().props, (v) => v.p.k === 4, t`$k=4\,\text{N/m}$`, t`$8=\frac12 k(2)^2=2k$, logo $k=4\,\text{N/m}$.`),
        gen((rng) => { const k = 2*randInt(rng, 1, 6); const x = randInt(rng, 1, 3); return num(t`Uma mola ideal de $${k}\,\text{N/m}$ é comprimida $${x}\,\text{m}$. Calcule $U_e$ em J, sem casas decimais.`, k*x*x/2, t`$U_e=\frac12\cdot${k}\cdot${x}^2=${k*x*x/2}\,\text{J}$.`, { unit: 'J', tol: 0.5 }); }),
        mcq(t`Se uma mola ideal sofre deformações $+x$ e $-x$ de mesmo módulo, suas energias potenciais são…`, ['iguais', 'opostas', 'uma nula e outra positiva', 'necessariamente negativas'], 0, t`O quadrado da deformação é igual: $(+x)^2=(-x)^2$.`),
        num(t`Ao subir, um corpo ganha $30\,\text{J}$ de energia potencial gravitacional. Qual o trabalho do peso em J, sem casas decimais?`, -30, t`O peso é conservativo: $W_g=-\Delta U_g=-30\,\text{J}$.`, { unit: 'J', tol: 0.5 }),
      ] },
      { card: { title: 'Balanço de energia', body: t`Se somente forças conservativas realizam trabalho, a energia mecânica $E_m=K+U$ permanece constante. Quando forças não conservativas realizam trabalho, $\Delta E_m=W_{\text{nc}}$. Atrito pode transformar energia mecânica em energia interna; a energia total continua conservada.`, example: t`Se $K_i+U_i=50\,\text{J}$ e o atrito realiza $-10\,\text{J}$, então $K_f+U_f=40\,\text{J}$.` }, exercises: [
        tf(t`Sem trabalho de forças não conservativas, $K+U$ permanece constante.`, true, t`Com $W_{\text{nc}}=0$, a relação $\Delta(K+U)=W_{\text{nc}}$ dá energia mecânica constante.`),
        mcq(t`Em uma queda sem resistência do ar, a energia potencial gravitacional perdida transforma-se em…`, ['energia cinética', 'massa', 'potência constante', 'energia elétrica'], 0, t`A energia mecânica se conserva: $\Delta K=-\Delta U_g$.`),
        num(t`Em um sistema conservativo, $K_i=10\,\text{J}$ e $U_i=40\,\text{J}$. Se $U_f=20\,\text{J}$, calcule $K_f$ em J, sem casas decimais.`, 30, t`$K_f=K_i+U_i-U_f=10+40-20=30\,\text{J}$.`, { unit: 'J', tol: 0.5 }),
        gen((rng) => { const initial = randInt(rng, 30, 60); const loss = randInt(rng, 5, 15); return num(t`Um sistema tem $${initial}\,\text{J}$ de energia mecânica inicial; o atrito realiza $-${loss}\,\text{J}$. Calcule a energia mecânica final em J, sem casas decimais.`, initial-loss, t`$E_{m,f}=E_{m,i}+W_{\text{atrito}}=${initial}-${loss}=${initial-loss}\,\text{J}$.`, { unit: 'J', tol: 0.5 }); }),
        tf(t`O atrito destrói a energia total do universo.`, false, t`O atrito converte parte da energia mecânica em energia interna; a energia total se conserva.`),
        num(t`Um corpo parte do repouso e cai $5\,\text{m}$ sem resistência do ar. Use $g=9{,}8\,\text{m/s}^2$. Calcule $v^2$ em $\text{m}^2/\text{s}^2$, sem casas decimais.`, 98, t`$mgh=\frac12 mv^2$, então $v^2=2gh=2\cdot9{,}8\cdot5=98\,\text{m}^2/\text{s}^2$.`, { unit: 'm²/s²', tol: 0.5 }),
        num(t`Uma massa de $2\,\text{kg}$ desce $5\,\text{m}$ a partir do repouso; o atrito realiza $-34\,\text{J}$. Use $g=9{,}8\,\text{m/s}^2$. Calcule $K_f$ em J, sem casas decimais.`, 64, t`$K_f=mgh+W_{\text{atrito}}=2\cdot9{,}8\cdot5-34=64\,\text{J}$.`, { unit: 'J', tol: 0.5 }),
      ] },
    ] },
    { id: 'm-en-potencia', title: 'Potência e rendimento', parts: [
      { card: { title: 'Taxa de transferência', body: t`Potência média é a energia transferida por unidade de tempo: $P_{\text{méd}}=\Delta E/\Delta t$. Um watt é um joule por segundo. Para uma força instantânea, $P=\vec F\cdot\vec v$. No gráfico, a inclinação representa a potência constante.`, visual: potenciaLab() }, exercises: [
        mcq(t`Um watt equivale a…`, [t`$1\,\text{J/s}$`, t`$1\,\text{J}\cdot\text{s}$`, t`$1\,\text{N/s}$`, t`$1\,\text{J/m}$`], 0, t`Potência é taxa de energia: $1\,\text{W}=1\,\text{J/s}$.`),
        tf(t`Para uma mesma energia transferida, menor tempo implica maior potência média.`, true, t`Em $P_{\text{méd}}=\Delta E/\Delta t$, reduzir o denominador aumenta a razão.`),
        num(t`Uma máquina transfere $120\,\text{J}$ em $4\,\text{s}$. Calcule a potência média em W, sem casas decimais.`, 30, t`$P=120/4=30\,\text{W}$.`, { unit: 'W', tol: 0.5 }),
        inter(t`Ajuste a potência constante para transferir $12\,\text{J}$ em $3\,\text{s}$.`, 'plot', potenciaLab().props, (v) => v.p.p === 4, t`$P=4\,\text{W}$`, t`$P=E/t=12/3=4\,\text{W}$.`),
        gen((rng) => { const p = randInt(rng, 2, 9); const s = randInt(rng, 2, 8); return num(t`Uma máquina opera com potência constante de $${p}\,\text{W}$ por $${s}\,\text{s}$. Calcule a energia transferida em J, sem casas decimais.`, p*s, t`$E=Pt=${p}\cdot${s}=${p*s}\,\text{J}$.`, { unit: 'J', tol: 0.5 }); }),
        num(t`Uma força paralela à velocidade tem módulo $10\,\text{N}$; o corpo move-se a $3\,\text{m/s}$ no mesmo sentido. Calcule a potência instantânea em W, sem casas decimais.`, 30, t`$P=Fv\cos0^\circ=10\cdot3=30\,\text{W}$.`, { unit: 'W', tol: 0.5 }),
        num(t`Uma força de $20\,\text{N}$ faz $60^\circ$ com a velocidade instantânea de $4\,\text{m/s}$. Calcule sua potência em W, sem casas decimais.`, 40, t`$P=Fv\cos60^\circ=20\cdot4\cdot0{,}5=40\,\text{W}$.`, { unit: 'W', tol: 0.5 }),
      ] },
      { card: { title: 'Rendimento e energia elétrica', body: t`Rendimento é a fração útil da energia de entrada: $\eta=E_{\text{útil}}/E_{\text{entrada}}$. Para potências médias medidas no mesmo intervalo, $\eta=P_{\text{útil}}/P_{\text{entrada}}$. Multiplique por $100$ para obter porcentagem. Em potência constante, $E=Pt$: $1\,\text{kWh}=3{,}6\times10^6\,\text{J}$.`, example: t`Um motor recebe $100\,\text{J}$ e entrega $80\,\text{J}$ úteis: $\eta=80\%$.` }, exercises: [
        mcq(t`Uma máquina recebe $100\,\text{J}$ e fornece $75\,\text{J}$ úteis. Qual seu rendimento?`, ['$75\%$', '$25\%$', '$100\%$', '$175\%$'], 0, t`$\eta=75/100=0{,}75=75\%$.`),
        tf(t`Um dispositivo com rendimento de $100\%$ converte toda a energia de entrada na forma útil escolhida.`, true, t`$\eta=E_{\text{útil}}/E_{\text{entrada}}=1$ significa energias útil e de entrada iguais.`),
        num(t`Um motor recebe $200\,\text{W}$ e entrega $150\,\text{W}$ úteis, em médias no mesmo intervalo. Calcule o rendimento em %, sem casas decimais.`, 75, t`$\eta=150/200=0{,}75=75\%$.`, { unit: '%', tol: 0.5 }),
        gen((rng) => { const input = 100*randInt(rng, 2, 8); const percent = 10*randInt(rng, 5, 9); return num(t`Um motor recebe $${input}\,\text{J}$ e tem rendimento de $${percent}\%$. Calcule a energia útil em J, sem casas decimais.`, input*percent/100, t`$E_{\text{útil}}=\eta E_{\text{entrada}}=${percent}/100\cdot${input}=${input*percent/100}\,\text{J}$.`, { unit: 'J', tol: 0.5 }); }),
        num(t`Um aparelho de $2\,\text{kW}$ funciona com potência constante por $3\,\text{h}$. Calcule a energia em kWh, sem casas decimais.`, 6, t`$E=Pt=2\cdot3=6\,\text{kWh}$.`, { unit: 'kWh', tol: 0.5 }),
        num(t`Converta $2\,\text{kWh}$ em MJ, com uma casa decimal.`, 7.2, t`$1\,\text{kWh}=1000\,\text{W}\cdot3600\,\text{s}=3{,}6\,\text{MJ}$; logo $2\,\text{kWh}=7{,}2\,\text{MJ}$.`, { unit: 'MJ', tol: 0.05 }),
        num(t`Um motor de rendimento $80\%$ precisa fornecer $400\,\text{W}$ úteis. Calcule a potência de entrada em W, sem casas decimais.`, 500, t`$P_{\text{entrada}}=P_{\text{útil}}/\eta=400/0{,}8=500\,\text{W}$.`, { unit: 'W', tol: 0.5 }),
      ] },
    ] },
  ],
};
