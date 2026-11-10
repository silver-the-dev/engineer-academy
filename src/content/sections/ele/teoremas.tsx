import type { UnitDef } from '../../types';
import { gen, mcq, num, tf, near } from '../../helpers';
import { circuit, wires, R, V, VM, circuitEx, circuitVisual } from '../../circuits';
import { randInt } from '../../../lib/random';

const t = String.raw;

// Divisor com saída entre [4,0] e [4,3]. O voltímetro deixa a saída aberta.
const divisor = (r = 1000) => circuit(
  V('fonte', [0, 0], [0, 3], 12, { fixed: true, locked: true }),
  R('serie', [0, 0], [4, 0], 1000, { fixed: true, locked: true }),
  R('carga', [4, 0], [4, 3], r, { locked: true, min: 250, max: 4000 }),
  wires([4, 3], [0, 3]),
);
const aberto = (r = 1000) => circuit(
  V('fonte', [0, 0], [0, 3], 12, { fixed: true, locked: true }),
  R('serie', [0, 0], [4, 0], 1000, { fixed: true, locked: true }),
  R('ramo', [4, 0], [4, 3], r, { locked: true, min: 250, max: 4000 }),
  VM('saida', [6, 0], [6, 3], { locked: true }),
  wires([4, 0], [6, 0]), wires([4, 3], [6, 3]), wires([4, 3], [0, 3]),
);
// Duas fontes referidas ao mesmo retorno, cada uma através de 1 kΩ.
const duasFontes = (a = 12, b = 6) => circuit(
  V('a', [0, 0], [0, 3], a, { locked: true, min: 0, max: 20 }),
  R('ra', [0, 0], [3, 0], 1000, { fixed: true, locked: true }),
  R('rb', [3, 0], [6, 0], 1000, { fixed: true, locked: true }),
  V('b', [6, 0], [6, 3], b, { locked: true, min: 0, max: 20 }),
  R('carga', [3, 0], [3, 3], 1000, { fixed: true, locked: true, show: ['v'] }),
  wires([0, 3], [3, 3], [6, 3]),
);
const vis = (comps: ReturnType<typeof circuit>) => circuitVisual({ comps, mode: 'adjust' });
const medir = (prompt: string, answer: number, explain: string, comps = aberto()) =>
  num(prompt, answer, explain, { unit: 'V', tol: 0.12, visual: vis(comps) });
const ajustarTensao = (target: number, r: number, explain: string) => circuitEx(
  t`Ajuste o resistor da carga para obter $${target}\,\text{V}$ nele.`,
  { comps: divisor(), mode: 'adjust' }, (v) => near(v.v('carga'), target, 0.12),
  t`$R_L=${r}\,\Omega$`, explain, { set: { carga: r } },
);
const ajustarReq = (target: number, r: number, explain: string) => circuitEx(
  t`Ajuste o resistor do ramo para que a resistência vista entre os terminais do voltímetro, com a fonte independente desativada, seja $${target}\,\Omega$.`,
  { comps: aberto(), mode: 'adjust' }, (v) => near(v.req([6, 0], [6, 3]), target, target * 0.02),
  t`$R=${r}\,\Omega$`, explain, { set: { ramo: r } },
);
const ajustarFonte = (id: 'a' | 'b', target: number, value: number, explain: string) => circuitEx(
  t`Ajuste a fonte ${id.toUpperCase()} até a tensão na carga ser $${target}\,\text{V}$.`,
  { comps: duasFontes(), mode: 'adjust' }, (v) => near(v.v('carga'), target, 0.12),
  t`Fonte ${id.toUpperCase()}: $${value}\,\text{V}$`, explain, { set: { [id]: value } },
);
const potencia = (target: number, r: number, explain: string) => circuitEx(
  t`Ajuste a carga para dissipar aproximadamente $${target}\,\text{mW}$.`,
  { comps: divisor(4000), mode: 'adjust' }, (v) => near(v.p('carga'), target / 1000, 0.0003),
  t`$R_L=${r}\,\Omega$`, explain, { set: { carga: r } },
);

export const teoremasCirc: UnitDef = {
  id: 'el-teo', title: 'Teoremas de circuitos', icon: '🧩',
  subtitle: 'Superposição, equivalentes e potência na carga',
  source: 'Conteúdo complementar · Boylestad, Introdução à Análise de Circuitos',
  extra: true,
  guide: t`Em redes lineares, some as contribuições de cada fonte independente para tensões ou correntes, respeitando sinais. Para desativar fontes ideais independentes, curto-circuite fontes de tensão e abra fontes de corrente; fontes dependentes continuam ativas.

Nos terminais de uma rede linear, $V_{Th}=V_{oc}$ e $R_{Th}$ é a resistência vista com fontes independentes desativadas. Se houver fontes dependentes, use uma fonte de teste. Norton tem $I_N=V_{Th}/R_{Th}$ e $R_N=R_{Th}$. Para carga resistiva e $R_{Th}>0$, $P_L=V_{Th}^2R_L/(R_{Th}+R_L)^2$ é máxima em $R_L=R_{Th}$.`,
  lessons: [
    { id: 'el-teo-super', title: 'Superposição', parts: [
      { card: { title: 'Uma fonte por vez', body: t`Em um circuito linear, calcule a tensão ou corrente causada por cada fonte independente separadamente e some algebricamente as contribuições. Uma fonte ideal de tensão desativada vira curto; uma fonte ideal de corrente desativada vira circuito aberto. Fontes dependentes permanecem ativas.`, visual: vis(duasFontes()), example: t`Com fontes de $12\,\text{V}$ e $6\,\text{V}$ e três resistores de $1\,\text{k}\Omega$, a tensão na carga é $(12+6)/3=6\,\text{V}$.` }, exercises: [
        mcq(t`Ao desativar uma fonte ideal independente de tensão, substitua-a por…`, ['um curto-circuito', 'um circuito aberto', 'um resistor de 1 kΩ', 'uma fonte de corrente'], 0, t`Tensão igual a zero entre seus terminais equivale a um curto ideal.`),
        tf(t`Uma fonte independente ideal de corrente desativada é substituída por um circuito aberto.`, true, t`Corrente nula no ramo corresponde a um circuito aberto.`),
        medir(t`Meça a tensão na carga de $1\,\text{k}\Omega$ com as duas fontes ativas. Responda em V, com uma casa decimal.`, 6, t`Pela análise nodal, $(12-V)/1\,\text{k}\Omega+(6-V)/1\,\text{k}\Omega=V/1\,\text{k}\Omega$, logo $V=6\,\text{V}$.`, duasFontes()),
        gen((rng) => { const a = randInt(rng, 1, 9); return num(t`Duas contribuições de tensão são $${a}\,\text{V}$ e $2\,\text{V}$ na mesma polaridade. Qual é a tensão total em V, sem casas decimais?`, a + 2, t`Some com os sinais: $${a}+2=${a + 2}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
        ajustarFonte('a', 4, 6, t`A tensão na carga é $(V_A+6)/3$. Para $4\,\text{V}$, $V_A=6\,\text{V}$.`),
        ajustarFonte('b', 5, 3, t`A tensão na carga é $(12+V_B)/3$. Para $5\,\text{V}$, $V_B=3\,\text{V}$.`),
        num(t`As contribuições de corrente são $5\,\text{mA}$ e $-2\,\text{mA}$ no mesmo sentido de referência. Qual é a corrente total em mA, sem casas decimais?`, 3, t`Some algebricamente: $5-2=3\,\text{mA}$.`, { unit: 'mA', tol: 0.5 }),
      ] },
      { card: { title: 'Sinais e limites', body: t`Defina uma única referência de tensão ou corrente antes de analisar as fontes. Uma contribuição no sentido oposto é negativa. A superposição vale diretamente para respostas lineares, não para potência: primeiro some tensão ou corrente, depois calcule $P$.`, visual: vis(duasFontes()) }, exercises: [
        tf(t`É correto somar diretamente as potências causadas separadamente pelas fontes para obter a potência total numa resistência.`, false, t`Potência depende do quadrado da tensão ou corrente e contém termos cruzados.`),
        medir(t`Com as duas fontes ativas, meça a tensão da carga em V, com uma casa decimal.`, 6, t`As contribuições são $12/3=4\,\text{V}$ e $6/3=2\,\text{V}$; a soma é $6\,\text{V}$.`, duasFontes()),
        gen((rng) => { const a = randInt(rng, 4, 9); return num(t`As contribuições são $${a}\,\text{mA}$ e $-3\,\text{mA}$. Determine a corrente total em mA, sem casas decimais.`, a - 3, t`Com a mesma referência, $${a}-3=${a - 3}\,\text{mA}$.`, { unit: 'mA', tol: 0.5 }); }),
        mcq(t`Uma fonte dependente é tratada como ao aplicar superposição?`, ['Permanece ativa', 'É sempre aberta', 'É sempre curto-circuitada', 'É removida com a carga'], 0, t`A fonte dependente permanece no circuito, pois seu valor acompanha a variável de controle.`),
        ajustarFonte('a', 2, 0, t`Com A em zero, ela equivale a um curto ideal; a fonte B produz $6/3=2\,\text{V}$ na carga.`),
        ajustarFonte('b', 4, 0, t`Com B em zero, a contribuição de A é $12/3=4\,\text{V}$ na carga.`),
        num(t`Uma resistência de $1\,\text{k}\Omega$ recebe $4\,\text{V}$ e $2\,\text{V}$ como contribuições de mesma polaridade. Qual a potência total em mW, sem casas decimais?`, 36, t`A tensão total é $6\,\text{V}$; $P=6^2/1000=0,036\,\text{W}=36\,\text{mW}$.`, { unit: 'mW', tol: 0.5 }),
      ] },
    ] },
    { id: 'el-teo-thev', title: 'Teorema de Thévenin', parts: [
      { card: { title: 'Tensão de circuito aberto', body: t`Uma rede linear de dois terminais pode ser substituída, para uma carga externa, por uma fonte ideal $V_{Th}$ em série com $R_{Th}$. Retire a carga externa: a tensão entre os terminais abertos é $V_{Th}$.`, visual: vis(aberto()), example: t`No divisor de $12\,\text{V}$ com dois resistores de $1\,\text{k}\Omega$, o voltímetro ideal lê $6\,\text{V}$ em aberto.` }, exercises: [
        mcq(t`Qual grandeza fornece $V_{Th}$?`, ['Tensão nos terminais sem carga externa', 'Corrente na carga em curto', 'Potência máxima', 'Soma das resistências sempre'], 0, t`A tensão de circuito aberto entre os terminais é $V_{Th}$.`),
        medir(t`Leia o voltímetro conectado aos terminais abertos. Qual é $V_{Th}$ em V, com uma casa decimal?`, 6, t`O divisor interno fornece $12\cdot1000/(1000+1000)=6\,\text{V}$; o voltímetro ideal não carrega a saída.`),
        gen((rng) => { const v = 2 * randInt(rng, 2, 9); return num(t`Um divisor de dois resistores iguais tem fonte de $${v}\,\text{V}$. Qual é a tensão de saída em aberto em V, sem casas decimais?`, v / 2, t`Resistores iguais dividem a tensão ao meio: $${v}/2=${v / 2}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
        tf(t`A equivalência de Thévenin preserva a relação entre tensão e corrente nos terminais externos.`, true, t`A carga vê a mesma característica tensão-corrente da rede original.`),
        ajustarTensao(8, 2000, t`No divisor, $8=12R_L/(1000+R_L)$; isolando, $R_L=2000\,\Omega$.`),
        ajustarTensao(4, 500, t`No divisor, $4=12R_L/(1000+R_L)$; daí $R_L=500\,\Omega$.`),
        num(t`Uma fonte de $10\,\text{V}$ alimenta em série $1\,\text{k}\Omega$ e $4\,\text{k}\Omega$. A saída aberta está sobre o resistor de $4\,\text{k}\Omega$. Calcule $V_{Th}$ em V, sem casas decimais.`, 8, t`O divisor dá $10\cdot4/(1+4)=8\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
      ] },
      { card: { title: 'Resistência equivalente', body: t`Retire a carga externa e desative as fontes independentes para encontrar a resistência vista dos terminais. No simulador, a verificação usa $R_{eq}$ entre esses pontos. Uma fonte dependente continua ativa e pode exigir uma fonte de teste.`, visual: vis(aberto()), example: t`Com a fonte de tensão em curto, os dois resistores de $1\,\text{k}\Omega$ ficam em paralelo: $R_{Th}=500\,\Omega$.` }, exercises: [
        tf(t`Ao encontrar $R_{Th}$ numa rede sem fontes dependentes, substituímos fontes ideais independentes de tensão por curtos.`, true, t`Uma fonte de tensão ideal desativada impõe $0\,\text{V}$ entre os terminais.`),
        medir(t`Antes de desativar a fonte, meça a tensão de saída em aberto em V, com uma casa decimal.`, 6, t`O divisor de resistores iguais dá $12/2=6\,\text{V}$.`),
        gen((rng) => { const r = 2 * randInt(rng, 1, 9); return num(t`Dois resistores iguais de $${r}\,\text{k}\Omega$ estão em paralelo. Qual é a resistência equivalente em kΩ, sem casas decimais?`, r / 2, t`Resistores iguais em paralelo resultam em $${r}/2=${r / 2}\,\text{k}\Omega$.`, { unit: 'kΩ', tol: 0.5 }); }),
        mcq(t`Se houver fonte dependente na rede, uma forma geral de obter $R_{Th}$ é…`, ['manter a dependente ativa e aplicar fonte de teste', 'desativar todas as fontes sem exceção', 'medir só a tensão aberta', 'somar toda resistência em série'], 0, t`Com fontes independentes desativadas e dependentes ativas, use a razão entre tensão e corrente de teste.`),
        ajustarReq(600, 1500, t`Com a fonte em curto, $R_{Th}=1000\parallel1500=600\,\Omega$.`),
        ajustarReq(400, 2000 / 3, t`Resolva $400=1000R/(1000+R)$: $R=666,7\,\Omega$.`),
        num(t`Um equivalente tem $V_{Th}=12\,\text{V}$, $R_{Th}=1\,\text{k}\Omega$ e carga de $2\,\text{k}\Omega$. Qual a tensão na carga em V, sem casas decimais?`, 8, t`$V_L=12\cdot2/(1+2)=8\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
      ] },
    ] },
    { id: 'el-teo-norton', title: 'Norton e transformação de fontes', parts: [
      { card: { title: 'Equivalente de Norton', body: t`O equivalente de Norton é uma fonte ideal de corrente $I_N$ em paralelo com $R_N$. A corrente de curto entre os terminais é $I_N$, com sentido definido; $R_N=R_{Th}$ e, para resistência finita não nula, $I_N=V_{Th}/R_{Th}$.`, visual: vis(aberto()) }, exercises: [
        mcq(t`Qual é a configuração de Norton?`, ['Fonte de corrente em paralelo com resistência', 'Fonte de tensão em paralelo com resistência', 'Fonte de corrente em série com resistência', 'Duas fontes em série'], 0, t`A fonte ideal de corrente fica em paralelo com a resistência equivalente.`),
        medir(t`Meça a tensão em aberto do circuito em V, com uma casa decimal.`, 6, t`O divisor fornece $V_{Th}=6\,\text{V}$; essa é também a tensão aberta do equivalente de Norton.`),
        gen((rng) => { const v = randInt(rng, 2, 9); return num(t`Um equivalente tem $V_{Th}=${v}\,\text{V}$ e $R_{Th}=1\,\text{k}\Omega$. Calcule $I_N$ em mA, sem casas decimais.`, v, t`$I_N=V_{Th}/R_{Th}=${v}/1000\,\text{A}=${v}\,\text{mA}$.`, { unit: 'mA', tol: 0.5 }); }),
        tf(t`$R_N$ e $R_{Th}$ medidos nos mesmos terminais são iguais.`, true, t`Ambos os equivalentes reproduzem a mesma resistência de saída: $R_N=R_{Th}$.`),
        ajustarReq(600, 1500, t`A resistência de Norton é $1000\parallel1500=600\,\Omega$.`),
        ajustarReq(800, 4000, t`A resistência de Norton é $1000\parallel4000=800\,\Omega$.`),
        num(t`Se $V_{Th}=6\,\text{V}$ e $R_{Th}=500\,\Omega$, calcule a corrente de Norton em mA, sem casas decimais.`, 12, t`$I_N=6/500=0,012\,\text{A}=12\,\text{mA}$.`, { unit: 'mA', tol: 0.5 }),
      ] },
      { card: { title: 'Transformar fontes', body: t`Uma fonte de tensão $V_s$ em série com $R$ equivale externamente a uma fonte de corrente $I_s=V_s/R$ em paralelo com o mesmo $R$. A seta da fonte de corrente aponta para o terminal positivo de tensão em aberto. A equivalência vale nos terminais, não necessariamente dentro dos circuitos.`, visual: vis(divisor()) }, exercises: [
        mcq(t`Uma fonte de $10\,\text{V}$ em série com $2\,\text{k}\Omega$ equivale a…`, [t`$5\,\text{mA}$ em paralelo com $2\,\text{k}\Omega$`, t`$20\,\text{mA}$ em série com $2\,\text{k}\Omega$`, t`$5\,\text{mA}$ em série com $2\,\text{k}\Omega$`, t`$10\,\text{mA}$ em paralelo com $1\,\text{k}\Omega$`], 0, t`$I_s=10/2000=5\,\text{mA}$ e a resistência permanece igual, agora em paralelo.`),
        medir(t`No divisor, meça a tensão na carga de $1\,\text{k}\Omega$ em V, com uma casa decimal.`, 6, t`O divisor do equivalente em série dá $12\cdot1/(1+1)=6\,\text{V}$.`, divisor()),
        gen((rng) => { const i = randInt(rng, 2, 9); return num(t`Uma fonte de $${i}\,\text{mA}$ em paralelo com $2\,\text{k}\Omega$ equivale a qual tensão em V, sem casas decimais?`, 2 * i, t`$V_s=I_sR=${i}\cdot2=${2 * i}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
        tf(t`A transformação de fontes preserva necessariamente a corrente em cada elemento interno original.`, false, t`A equivalência é vista nos terminais; correntes internas podem ser diferentes.`),
        ajustarTensao(8, 2000, t`Pelo divisor de tensão equivalente, $8=12R_L/(1000+R_L)$, portanto $R_L=2000\,\Omega$.`),
        ajustarTensao(4, 500, t`Pelo divisor, $4=12R_L/(1000+R_L)$, portanto $R_L=500\,\Omega$.`),
        num(t`Uma fonte de Norton de $12\,\text{mA}$ está em paralelo com $500\,\Omega$. Qual a tensão em aberto em V, sem casas decimais?`, 6, t`Em aberto, toda a corrente passa pelo resistor: $V=0,012\cdot500=6\,\text{V}$.`, { unit: 'V', tol: 0.5 }),
      ] },
    ] },
    { id: 'el-teo-mtp', title: 'Máxima transferência de potência', parts: [
      { card: { title: 'Ajustando a carga', body: t`Para um equivalente de Thévenin com resistência positiva e carga puramente resistiva variável, a potência na carga é máxima quando $R_L=R_{Th}$. Em corrente contínua, $P_L=V_{Th}^2R_L/(R_{Th}+R_L)^2$.`, visual: vis(divisor(4000)), example: t`Com $12\,\text{V}$ e $R_{Th}=1\,\text{k}\Omega$, a carga de $1\,\text{k}\Omega$ recebe $36\,\text{mW}$.` }, exercises: [
        mcq(t`Para máxima potência numa carga resistiva, com $R_{Th}>0$, escolha…`, ['$R_L=R_{Th}$', '$R_L=0$', t`$R_L\to\infty$`, '$R_L=2R_{Th}$ sempre'], 0, t`A expressão de potência tem máximo em $R_L=R_{Th}$.`),
        medir(t`A carga começa em $4\,\text{k}\Omega$. Meça sua tensão em V, com uma casa decimal.`, 9.6, t`$V_L=12\cdot4/(1+4)=9,6\,\text{V}$.`, divisor(4000)),
        gen((rng) => { const r = randInt(rng, 1, 9); return num(t`Para $R_{Th}=${r}\,\text{k}\Omega$, qual carga resistiva maximiza a potência? Responda em kΩ, sem casas decimais.`, r, t`A condição é $R_L=R_{Th}=${r}\,\text{k}\Omega$.`, { unit: 'kΩ', tol: 0.5 }); }),
        tf(t`Uma carga aberta recebe potência elétrica diferente de zero de uma fonte de Thévenin ideal com resistência finita.`, false, t`Em aberto a corrente é zero, então $P=VI=0$.`),
        potencia(36, 1000, t`$R_L=R_{Th}=1000\,\Omega$. A corrente é $12/2000=6\,\text{mA}$ e $P_L=36\,\text{mW}$.`),
        potencia(32, 2000, t`Com $R_L=2000\,\Omega$, $I=12/3000=4\,\text{mA}$ e $P_L=I^2R_L=32\,\text{mW}$.`),
        num(t`Com $V_{Th}=8\,\text{V}$ e $R_{Th}=2\,\text{k}\Omega$, qual a potência máxima em mW, sem casas decimais?`, 8, t`$P_{máx}=V_{Th}^2/(4R_{Th})=64/8000=0,008\,\text{W}=8\,\text{mW}$.`, { unit: 'mW', tol: 0.5 }),
      ] },
      { card: { title: 'Potência e rendimento', body: t`Na condição de máxima potência resistiva, a corrente passa por duas resistências iguais e a carga recebe metade da potência fornecida pelo equivalente de Thévenin. Maior rendimento não implica maior potência na carga. Em CA com impedâncias complexas, a condição geral é casamento conjugado.`, visual: vis(divisor(4000)) }, exercises: [
        tf(t`Na máxima transferência para carga resistiva, a resistência interna e a carga dissipam a mesma potência.`, true, t`A mesma corrente percorre resistências iguais; $I^2R$ é igual nas duas.`),
        medir(t`Meça a tensão na carga de $4\,\text{k}\Omega$ em V, com uma casa decimal.`, 9.6, t`A divisão de tensão dá $12\cdot4/(1+4)=9,6\,\text{V}$.`, divisor(4000)),
        gen((rng) => { const v = 2 * randInt(rng, 2, 9); return num(t`Em máxima transferência, uma fonte de Thévenin de $${v}\,\text{V}$ alimenta a carga casada. Qual a tensão nela em V, sem casas decimais?`, v / 2, t`As duas resistências iguais dividem a tensão: $${v}/2=${v / 2}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
        mcq(t`Qual é o rendimento no ponto de máxima potência de um equivalente resistivo ideal?`, ['$50\%$', '$100\%$', '$25\%$', '$0\%$'], 0, t`A carga e a resistência interna dissipam potências iguais; a carga recebe metade da potência da fonte.`),
        potencia(36, 1000, t`Em $R_L=1\,\text{k}\Omega$, a corrente é $6\,\text{mA}$ e a carga dissipa $36\,\text{mW}$, o máximo.`),
        potencia(32, 500, t`Com $R_L=500\,\Omega$, $I=12/1500=8\,\text{mA}$ e $P_L=0,008^2\cdot500=32\,\text{mW}$.`),
        num(t`No ponto de máxima potência, uma carga recebe $20\,\text{mW}$. Qual potência é dissipada na resistência de Thévenin, em mW, sem casas decimais?`, 20, t`As resistências são iguais e têm a mesma corrente; portanto dissipam ambas $20\,\text{mW}$.`, { unit: 'mW', tol: 0.5 }),
      ] },
    ] },
  ],
};
