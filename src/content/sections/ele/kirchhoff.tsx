import type { UnitDef } from '../../types';
import { gen, mcq, num, tf, near } from '../../helpers';
import { circuit, circuitEx, circuitVisual, R, V, wires } from '../../circuits';
import { randInt } from '../../../lib/random';

const t = String.raw;

// Dois nós essenciais: topo central A e retorno B. R1 conduz da esquerda a A;
// R2, de A à direita; R3, de A a B. As duas fontes têm o positivo em cima.
const rede = (r3 = 1000, e2 = 3) => circuit(
  V('e1', [0, 0], [0, 4], 12, { fixed: true, locked: true, label: 'E1' }),
  wires([0, 0], [1, 0]),
  R('r1', [1, 0], [4, 0], 1000, { fixed: true, locked: true, label: 'R1' }),
  R('r2', [4, 0], [7, 0], 1000, { fixed: true, locked: true, label: 'R2' }),
  wires([7, 0], [8, 0]),
  V('e2', [8, 0], [8, 4], e2, { locked: true, label: 'E2', values: [3, 6, 9] }),
  wires([4, 0], [4, 1]),
  R('r3', [4, 1], [4, 3], r3, { locked: true, label: 'R3', values: [1000, 2000, 3000] }),
  wires([4, 3], [4, 4]),
  wires([0, 4], [4, 4], [8, 4]),
);
const visualRede = () => circuitVisual({ comps: rede(), mode: 'adjust', caption: 'Toque nas peças para medir. O retorno é o nó de referência.' });
const medir = () => num(t`No simulador, meça a corrente em R3, do nó central para o retorno. Em mA, com uma casa decimal.`, 5,
  t`Com $V_A=5\,\text{V}$ e $R_3=1\,\text{k}\Omega$, $I_3=5/1=5\,\text{mA}$.`, { unit: 'mA', tol: 0.05, visual: visualRede() });
const ajustarR = () => circuitEx(
  t`Calcule e ajuste R3 para que sua corrente, do nó central ao retorno, seja $3\,\text{mA}$. Confira no simulador.`,
  { comps: rede(), mode: 'adjust' }, (v) => near(v.i('r3'), 0.003, 0.00006),
  t`$R_3=2\,\text{k}\Omega$`,
  t`Com $R_3=2\,\text{k}\Omega$, a equação do nó é $(12-V_A)+(3-V_A)=V_A/2$, em mA e kΩ. Logo $V_A=6\,\text{V}$ e $I_3=6/2=3\,\text{mA}$.`,
  { set: { r3: 2000 } },
);
const ajustarE = () => circuitEx(
  t`Calcule e ajuste E2 para que a corrente em R2 seja zero. Confira no simulador.`,
  { comps: rede(), mode: 'adjust' }, (v) => near(v.i('r2'), 0, 0.00002),
  t`$E_2=6\,\text{V}$`,
  t`Para corrente nula em R2, $V_A=E_2$. Como R1 e R3 são iguais, $V_A=12/2=6\,\text{V}$. Ajuste E2 a $6\,\text{V}$.`,
  { set: { e2: 6 } },
);


const inverterR2 = () => circuitEx(
  t`Ajuste E2 para que R2 conduza $2\,\text{mA}$ da direita para o nó central. Confira o sentido pelo sinal no simulador.`,
  { comps: rede(), mode: 'adjust' }, (v) => near(v.i('r2'), -0.002, 0.00004),
  t`$E_2=9\,\text{V}$`,
  t`Com E2 em $9\,\text{V}$, $V_A=(12+9)/3=7\,\text{V}$. Como R2 é orientado de A para a direita, $I_2=(7-9)/1=-2\,\text{mA}$; a corrente real vai da direita para A.`,
  { set: { e2: 9 } },
);
const ajustarNo = () => circuitEx(
  t`Ajuste R3 para que o nó central fique em aproximadamente $6,43\,\text{V}$ em relação ao retorno. Confira a tensão em R3.`,
  { comps: rede(), mode: 'adjust' }, (v) => near(v.v('r3'), 45 / 7, 0.05),
  t`$R_3=3\,\text{k}\Omega$`,
  t`Com $R_3=3\,\text{k}\Omega$, $(12-V_A)+(3-V_A)=V_A/3$ em mA; logo $V_A=45/7\approx6,43\,\text{V}$.`,
  { set: { r3: 3000 } },
);

export const kirchhoff: UnitDef = {
  id: 'el-kirch', title: 'Leis de Kirchhoff', icon: '🕸️',
  subtitle: 'Nós, malhas e fontes reais',
  source: 'Física e Eletricidade · Lista 1 de exercícios (associações de resistores); análise de circuitos complementada',
  guide: t`**Nós:** $\sum I_{\text{entra}}=\sum I_{\text{sai}}$. **Malhas:** $\sum\Delta V=0$. Em resistor, $V=RI$; os sinais dependem dos sentidos escolhidos. Na análise nodal, escolha uma referência e escreva as correntes por $(V_a-V_b)/R$. Na análise de malhas, um resistor compartilhado conduz a diferença das correntes de malha. Para fonte real que fornece corrente, $V_{\text{term}}=\mathcal E-rI$.`,
  lessons: [
    { id: 'el-kirch-nos', title: 'Lei dos nós', parts: [
      { card: { title: 'Corrente se conserva', body: t`Um nó liga terminais por condutores ideais. Em regime estacionário a carga não se acumula nele: a soma das correntes que entram é igual à das que saem. No circuito, R1 alimenta o nó central e R2 e R3 levam corrente para fora. Toque em cada resistor para medir.`, visual: visualRede(), example: t`Se entram $7\,\text{mA}$ e saem $2\,\text{mA}$ por R2, saem $5\,\text{mA}$ por R3.` }, exercises: [
        mcq('Qual grandeza se conserva na lei dos nós?', ['Carga elétrica', 'Resistência', 'Tensão em série', 'Potência em cada ramo'], 0, 'Em regime estacionário a carga não se acumula no nó, então as correntes se equilibram.'),
        tf('Uma corrente que entra no nó pode ser igual à soma de duas que saem.', true, 'A lei dos nós exige justamente que a soma das entradas iguale a soma das saídas.'),
        num(t`Entram $9\,\text{mA}$ e saem $4\,\text{mA}$ por um ramo. Quanto sai pelo outro, em mA, com uma casa decimal?`, 5, t`$9=4+I$, logo $I=5\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }),
        gen((rng) => { const a = randInt(rng, 3, 8), b = randInt(rng, 1, 4); return num(t`Entram $${a}\,\text{mA}$ e $${b}\,\text{mA}$. Quanto sai pelo único ramo restante, em mA, com uma casa decimal?`, a + b, t`A saída é a soma das entradas: $${a}+${b}=${a + b}\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }); }),
        medir(), ajustarR(), ajustarE(),
      ] },
      { card: { title: 'Sentidos e sinais', body: t`Escolha setas de referência antes de calcular. Com entradas positivas, $\sum I=0$: uma corrente negativa significa que a corrente real aponta no sentido oposto à seta escolhida.`, visual: visualRede(), example: t`Se $I_1-I_2-I_3=0$, com $I_1=7$ e $I_2=2\,\text{mA}$, então $I_3=5\,\text{mA}$.` }, exercises: [
        mcq('Uma corrente calculada negativa indica:', ['Sentido real oposto à seta escolhida', 'Ausência de carga', 'Resistência negativa obrigatória', 'Erro inevitável'], 0, 'O sinal apenas compara o sentido real com a referência adotada.'),
        tf('Trocar o sentido de referência de um ramo troca o sinal da sua corrente.', true, 'A corrente física é a mesma; sua componente algébrica muda de sinal.'),
        num(t`Em $I_1-I_2-I_3=0$, $I_1=8\,\text{mA}$ e $I_2=3\,\text{mA}$. Calcule $I_3$ em mA, com uma casa decimal.`, 5, t`$I_3=8-3=5\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }),
        gen((rng) => { const a = randInt(rng, 2, 5), b = randInt(rng, 6, 9); return num(t`Pelas setas escolhidas, $${a}- ${b}-I=0$, com correntes em mA. Calcule $I$ em mA, com uma casa decimal.`, a-b, t`$I=${a}-${b}=${a-b}\,\text{mA}$: o sinal mostra sentido contrário à seta.`, { unit: 'mA', tol: 0.05 }); }),
        medir(), inverterR2(), ajustarNo(),
      ] },
    ] },
    { id: 'el-kirch-malhas', title: 'Lei das malhas', parts: [
      { card: { title: 'Volta completa', body: t`Ao percorrer uma malha fechada, a soma algébrica das variações de potencial é zero. Atravesse uma fonte de $-$ para $+$ como subida; no resistor, ao percorrê-lo no sentido da corrente, conte uma queda $-RI$.`, visual: visualRede(), example: t`Na malha esquerda do circuito: $12-7-5=0\,\text{V}$.` }, exercises: [
        mcq('Qual é a soma das variações de tensão numa volta fechada?', ['$0$', '$1$', 'A corrente total', 'A maior tensão'], 0, 'Ao voltar ao mesmo nó, o potencial final é igual ao inicial.'),
        tf('Atravessar uma fonte ideal do terminal negativo ao positivo é uma subida de potencial.', true, 'Por definição o terminal positivo está acima do negativo pelo valor da fonte.'),
        num(t`Uma fonte de $12\,\text{V}$ alimenta duas quedas de $7\,\text{V}$ e $V$. Ache $V$ em V, com uma casa decimal.`, 5, t`$12-7-V=0$, então $V=5\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        gen((rng) => { const a=randInt(rng, 6, 12), b=randInt(rng, 1, 5); return num(t`Numa malha há subida de $${a}\,\text{V}$ e quedas de $${b}\,\text{V}$ e $V$. Ache $V$ em V, com uma casa decimal.`, a-b, t`$${a}-${b}-V=0$, portanto $V=${a-b}\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
        medir(), ajustarR(), ajustarE(),
      ] },
      { card: { title: 'Percursos e polaridades', body: t`No resistor, percorrer contra a corrente dá subida $+RI$. Inverter todo o percurso troca todos os sinais, sem alterar a equação. Na malha direita, usando as correntes físicas do circuito, $5-2-3=0\,\text{V}$.`, visual: visualRede() }, exercises: [
        tf('Inverter o percurso de uma malha muda o resultado físico.', false, 'Todas as variações trocam de sinal; a equação equivalente mantém as mesmas correntes.'),
        mcq('Ao atravessar um resistor no sentido oposto ao da corrente, a variação de potencial é:', ['Uma subida de $RI$', 'Uma queda de $RI$', 'Sempre zero', 'Igual à potência'], 0, 'A corrente convencional atravessa o resistor do potencial maior para o menor.'),
        num(t`Ao percorrer uma malha, há uma subida de $10\,\text{V}$ e uma queda de $4\,\text{V}$. Qual é a queda restante em V, com uma casa decimal?`, 6, t`$10-4-V=0$, então $V=6\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        gen((rng) => { const i=randInt(rng, 1, 5), r=randInt(rng, 2, 6); return num(t`Um resistor de $${r}\,\text{k}\Omega$ conduz $${i}\,\text{mA}$. Qual a queda no sentido da corrente, em V, com uma casa decimal?`, i*r, t`$RI=${r}\cdot${i}=${i*r}\,\text{V}$, pois kΩ vezes mA dá V.`, { unit: 'V', tol: 0.05 }); }),
        medir(), inverterR2(), ajustarNo(),
      ] },
    ] },
    { id: 'el-kirch-analise', title: 'Análise de malhas', parts: [
      { card: { title: 'Duas correntes de malha', body: t`Escolha correntes de malha $i_1$ e $i_2$ no sentido horário. No resistor central, $i_1$ desce e $i_2$ sobe; a corrente descendente é $i_1-i_2$. Em kΩ e mA, o circuito fornece $2i_1-i_2=12$ e $-i_1+2i_2=-3$.`, visual: visualRede(), example: t`A solução é $i_1=7\,\text{mA}$ e $i_2=2\,\text{mA}$; no resistor central descem $5\,\text{mA}$.` }, exercises: [
        mcq('Em um resistor comum a duas malhas horárias, a corrente de ramo é:', ['Diferença das correntes de malha', 'Sempre a soma dos módulos', 'Sempre zero', 'Igual à tensão da fonte'], 0, 'As correntes horárias atravessam o ramo comum em sentidos opostos.'),
        tf('Correntes de malha são referências matemáticas; uma pode resultar negativa.', true, 'Um valor negativo indica que a circulação real correspondente é oposta à referência.'),
        num(t`Se $i_1=7\,\text{mA}$ e $i_2=2\,\text{mA}$, calcule $i_1-i_2$ em mA, com uma casa decimal.`, 5, t`$7-2=5\,\text{mA}$ no sentido de $i_1$ pelo ramo comum.`, { unit: 'mA', tol: 0.05 }),
        gen((rng) => { const a=randInt(rng, 5, 9), b=randInt(rng, 1, 4); return num(t`Duas malhas horárias têm $i_1=${a}\,\text{mA}$ e $i_2=${b}\,\text{mA}$. Ache $i_1-i_2$ em mA, com uma casa decimal.`, a-b, t`As setas se opõem no ramo comum: $${a}-${b}=${a-b}\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }); }),
        medir(), ajustarR(), ajustarE(),
      ] },
      { card: { title: 'Resolver e conferir', body: t`Escreva uma equação de tensões por malha, resolva o sistema e traduza as correntes de malha em correntes de ramo. Depois confira ambas as leis: para $i_1=7$ e $i_2=2\,\text{mA}$, o ramo comum tem $5\,\text{mA}$.`, visual: visualRede(), example: t`$2(7)-2=12$ e $-7+2(2)=-3$: as duas equações são satisfeitas.` }, exercises: [
        mcq(t`Qual par resolve $2i_1-i_2=12$ e $-i_1+2i_2=-3$?`, [t`$(7,\,2)$`, t`$(2,\,7)$`, t`$(6,\,3)$`, t`$(5,\,5)$`], 0, t`Substituindo: $14-2=12$ e $-7+4=-3$.`),
        tf('Num ramo exclusivo de uma malha, a corrente de ramo tem o mesmo módulo da corrente dessa malha.', true, 'Só aquela corrente de malha atravessa esse ramo.'),
        num(t`Se $2i_1-i_2=12$ e $i_2=2\,\text{mA}$, calcule $i_1$ em mA, com uma casa decimal.`, 7, t`$2i_1=14$, então $i_1=7\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }),
        gen((rng) => { const a=randInt(rng, 3, 8), b=randInt(rng, 1, 2); return num(t`Uma equação de malha é $2i_1-i_2=${2*a-b}$, com $i_2=${b}\,\text{mA}$. Ache $i_1$ em mA, com uma casa decimal.`, a, t`$2i_1=${2*a-b}+${b}=${2*a}$, logo $i_1=${a}\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }); }),
        medir(), ajustarNo(), inverterR2(),
      ] },
    ] },
    { id: 'el-kirch-nodal', title: 'Análise nodal', parts: [
      { card: { title: 'Tensão de nó', body: t`Escolha um nó como referência de $0\,\text{V}$. As demais tensões são medidas em relação a ele. Para um resistor entre $a$ e $b$, a corrente de $a$ para $b$ é $(V_a-V_b)/R$.`, visual: visualRede(), example: t`No circuito, o nó central está a $5\,\text{V}$ e o retorno a zero. Assim, em R3, $I=5/1=5\,\text{mA}$ com resistência em kΩ.` }, exercises: [
        mcq('Qual a função do nó de referência?', ['Definir zero para medir as demais tensões', 'Impor corrente zero em todos os ramos', 'Eliminar resistores', 'Tornar todas as fontes nulas'], 0, 'Tensão é diferença de potencial; o zero escolhido fornece uma referência comum.'),
        tf('Escolher outro nó de referência muda as diferenças de potencial físicas.', false, 'Todas as tensões de nó mudam pela mesma constante, mas suas diferenças permanecem iguais.'),
        num(t`Um resistor de $2\,\text{k}\Omega$ liga um nó de $8\,\text{V}$ ao retorno. Calcule a corrente para o retorno em mA, com uma casa decimal.`, 4, t`$I=(8-0)/2=4\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }),
        gen((rng) => { const i=randInt(rng, 1, 5), r=randInt(rng, 1, 4); return num(t`Um nó de $${i*r}\,\text{V}$ liga-se ao retorno por $${r}\,\text{k}\Omega$. Ache a corrente para o retorno em mA, com uma casa decimal.`, i, t`$I=${i*r}/${r}=${i}\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }); }),
        medir(), ajustarR(), ajustarE(),
      ] },
      { card: { title: 'Equação do nó', body: t`Some as correntes que saem do nó e iguale a zero. No circuito de duas fontes, com resistores de $1\,\text{k}\Omega$, $(V_A-12)+(V_A-3)+V_A=0$ em mA. Logo $V_A=5\,\text{V}$.`, visual: visualRede(), tip: t`Uma corrente negativa na soma significa que ela entra no nó, embora a seta escolhida saia.` }, exercises: [
        mcq(t`Qual equação descreve o nó central com todos os resistores de $1\,\text{k}\Omega$ e fontes de 12 V e 3 V?`, [t`$(V-12)+(V-3)+V=0$`, t`$V-12-3=0$`, t`$3V+15=0$`, t`$V+12+3=0$`], 0, t`Cada termo é uma corrente que sai do nó por um dos três resistores, em mA.`),
        tf('Uma corrente calculada negativa na equação nodal pode indicar que ela entra no nó.', true, 'Se as setas de referência saem do nó, o sinal negativo indica sentido inverso.'),
        num(t`Resolva $3V-15=0$. Dê $V$ em V, com uma casa decimal.`, 5, t`$3V=15$, logo $V=5\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        gen((rng) => { const a=randInt(rng, 3, 9), b=randInt(rng, 1, 5); return num(t`Dois ramos iguais ligam um nó a fontes de $${a}\,\text{V}$ e $${b}\,\text{V}$; um terceiro resistor igual liga-o ao retorno. Ache $V=( ${a}+${b})/3$ em V, com duas casas decimais.`, (a+b)/3, t`Pela lei dos nós, $3V=${a}+${b}$ e $V=${((a+b)/3).toFixed(2).replace('.', ',')}\,\text{V}$.`, { unit: 'V', tol: 0.005 }); }),
        medir(), ajustarNo(), inverterR2(),
      ] },
    ] },
    { id: 'el-kirch-fontes', title: 'Fontes reais e resistência interna', parts: [
      { card: { title: 'Modelo de fonte real', body: t`Modele uma fonte real por uma fonte ideal de força eletromotriz $\mathcal E$ em série com resistência interna $r$. Ao fornecer corrente $I$, sua tensão nos terminais é $V=\mathcal E-rI$. Sem corrente, a tensão terminal é $\mathcal E$.`, visual: visualRede(), tip: t`Na rede, interprete E1 e R1 juntos como uma fonte real vista do nó central: $\mathcal E=12\,\text{V}$ e $r=1\,\text{k}\Omega$.` }, exercises: [
        mcq('No modelo de fonte real, a resistência interna fica:', ['Em série com a fonte ideal', 'Em paralelo com um fio ideal', 'Sempre fora do circuito', 'Em série apenas com o voltímetro'], 0, 'O modelo série produz queda interna proporcional à corrente fornecida.'),
        tf('Ao fornecer corrente, uma fonte com resistência interna positiva tem tensão terminal menor que sua força eletromotriz.', true, 'A queda interna $rI$ é positiva, então $V=\mathcal E-rI$ é menor.'),
        num(t`Uma fonte de $12\,\text{V}$ fornece $2\,\text{mA}$ através de $1\,\text{k}\Omega$ interno. Ache a tensão terminal em V, com uma casa decimal.`, 10, t`$V=12-1\cdot2=10\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
        gen((rng) => { const i=randInt(rng, 1, 4), e=randInt(rng, 8, 12); return num(t`Uma fonte de $${e}\,\text{V}$ fornece $${i}\,\text{mA}$ e tem $1\,\text{k}\Omega$ interno. Ache a tensão terminal em V, com uma casa decimal.`, e-i, t`$V=${e}-1\cdot${i}=${e-i}\,\text{V}$.`, { unit: 'V', tol: 0.05 }); }),
        medir(), ajustarR(), ajustarE(),
      ] },
      { card: { title: 'Carga e potência interna', body: t`Com carga $R$ ligada à fonte real, $I=\mathcal E/(R+r)$ e a potência dissipada internamente é $I^2r$. Se a corrente entra no terminal positivo da fonte ideal, ela está absorvendo energia: o sinal de $I$ na fórmula deve acompanhar a referência de corrente fornecida.`, visual: visualRede(), example: t`No circuito, E1 fornece $7\,\text{mA}$ por R1: $V_{\text{terminal}}=12-1\cdot7=5\,\text{V}$.` }, exercises: [
        mcq('Para uma fonte real que fornece corrente a uma carga resistiva, a corrente é:', [t`$\mathcal E/(R+r)$`, t`$\mathcal E/(R-r)$`, t`$R/\mathcal E$`, t`$\mathcal E R$`], 0, 'A fonte ideal vê as resistências interna e externa em série.'),
        tf('A resistência interna dissipa potência quando passa corrente por ela.', true, t`A potência dissipada no resistor é $I^2r$, positiva quando $I\ne0$.`),
        num(t`Uma fonte de $12\,\text{V}$ com $1\,\text{k}\Omega$ interno alimenta carga de $2\,\text{k}\Omega$. Ache a corrente em mA, com uma casa decimal.`, 4, t`$I=12/(1+2)=4\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }),
        gen((rng) => { const i=randInt(rng, 1, 5), r=randInt(rng, 1, 3); return num(t`Uma resistência interna de $${r}\,\text{k}\Omega$ conduz $${i}\,\text{mA}$. Ache sua potência em mW, com uma casa decimal.`, i*i*r, t`$P=I^2r=${i}^2\cdot${r}=${i*i*r}\,\text{mW}$, usando mA e kΩ.`, { unit: 'mW', tol: 0.05 }); }),
        medir(), inverterR2(), ajustarNo(),
      ] },
    ] },
  ],
};
