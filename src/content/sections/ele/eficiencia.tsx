import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, mcq, num, plot, tf } from '../../helpers';
import { FnCurve, Pt } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;

// Relação linear adaptada a cada grandeza; x é tempo ou entrada, y é resultado.
const lab = (label: string, factor: number, unit: string) => plot({
  view: { xMin: 0, xMax: 10, yMin: 0, yMax: 10 },
  params: [{ key: 'x', label, min: 0, max: 10, step: 1, value: 2, color: C.p2 }],
  render: ({ p }: any) => <><FnCurve f={(x) => factor * x} color={C.p1} /><Pt x={p.x} y={factor * p.x} color={C.gold} /></>,
  info: ({ p }: any) => t`Entrada $${fmt(p.x)}$ · resultado $${fmt(factor * p.x)}\,\text{${unit}}$`,
});
const ajuste = (prompt: string, label: string, factor: number, unit: string, target: number, explanation: string) =>
  inter(prompt, 'plot', lab(label, factor, unit).props, (v) => v && Math.abs(v.p.x * factor - target) < 0.001, t`Resultado: $${fmt(target)}\,\text{${unit}}$.`, explanation);

export const eficiencia: UnitDef = {
  id: 'el-efic', title: 'Eficiência energética', icon: '💡',
  subtitle: 'Consumo, rendimento e escolhas econômicas',
  source: 'Eletricidade Aplicada · Aula Eficiência Energética 1',
  guide: t`Para potência constante, $E=P\Delta t$: use kW e h para obter kWh. Custo variável estimado: $E\times$ tarifa. Rendimento: $\eta=E_{útil}/E_{entrada}$ ou $P_{útil}/P_{entrada}$ nas mesmas condições. Eficácia luminosa: $\Phi/P$ em lm/W. Payback simples: investimento incremental dividido pela economia por período.`,
  lessons: [
    {
      id: 'el-efic-cons', title: 'Consumo e tarifa de energia', parts: [
        {
          card: { title: 'Potência ao longo do tempo', body: t`Potência é a taxa de uso de energia. Para potência constante, $E=P\Delta t$. Converta W em kW dividindo por $1000$; com tempo em horas, a energia sai em kWh. Um kWh é energia, não potência.`, example: t`Um aparelho de $500\,\text{W}=0,5\,\text{kW}$ ligado por $4\,\text{h}$ consome $2\,\text{kWh}$.`, visual: lab('h', 0.5, 'kWh') },
          exercises: [
            mcq('Qual unidade mede energia elétrica consumida?', ['kWh', 'kW', 'W', 'V'], 0, 'kWh é potência multiplicada por tempo; kW e W medem potência.'),
            tf(t`Um aparelho de $1000\,\text{W}$ tem potência de $1\,\text{kW}$.`, true, t`Divida por $1000$: $1000\,\text{W}=1\,\text{kW}$.`),
            num(t`Um aparelho de $2\,\text{kW}$ funciona por $3\,\text{h}$. Qual a energia em kWh?`, 6, t`$E=2\cdot3=6\,\text{kWh}$.`, { unit: 'kWh', tol: 0.001 }),
            gen((rng) => { const h = randInt(rng, 2, 8); return num(t`Uma carga constante de $500\,\text{W}$ funciona por $${h}\,\text{h}$. Qual a energia em kWh, com uma casa decimal?`, h / 2, t`$500\,\text{W}=0,5\,\text{kW}$; $E=0,5\cdot${h}=${fmt(h / 2)}\,\text{kWh}$.`, { unit: 'kWh', tol: 0.05 }); }),
            ajuste(t`No gráfico de uma carga de $0,5\,\text{kW}$, ajuste as horas para consumir $3\,\text{kWh}$.`, 'h', 0.5, 'kWh', 3, t`$0,5t=3$, então $t=6\,\text{h}$.`),
            num(t`Um chuveiro de $6\,\text{kW}$ funciona $20$ minutos por dia durante $30$ dias. Qual o consumo em kWh?`, 60, t`$20$ min é $1/3$ h; em $30$ dias são $10$ h. Logo $6\cdot10=60\,\text{kWh}$.`, { unit: 'kWh', tol: 0.001 }),
            mcq(t`Duas cargas de $1\,\text{kW}$ funcionam juntas por $5\,\text{h}$. Qual o consumo total?`, [t`$10\,\text{kWh}$`, t`$5\,\text{kWh}$`, t`$2\,\text{kWh}$`, t`$0,4\,\text{kWh}$`], 0, t`Somando as potências: $(1+1)\cdot5=10\,\text{kWh}$.`),
          ],
        },
        {
          card: { title: 'Da leitura à conta', body: t`O consumo medido é a leitura atual menos a anterior, em kWh. Uma estimativa da parcela variável é consumo vezes tarifa em R\$/kWh. A conta real pode incluir tributos, encargos, iluminação pública e regras de faturamento. Bandeiras tarifárias podem acrescentar valor por energia consumida; consulte a fatura e os valores vigentes.`, example: t`$150\,\text{kWh}$ a R\$ 0,80/kWh dão R\$ 120,00 antes de outras parcelas.` },
          exercises: [
            num(t`Leituras: anterior $1200\,\text{kWh}$ e atual $1350\,\text{kWh}$. Qual o consumo em kWh?`, 150, t`$1350-1200=150\,\text{kWh}$.`, { unit: 'kWh', tol: 0.001 }),
            tf('O valor total da fatura pode conter parcelas além de consumo vezes tarifa.', true, 'Tributos, encargos e outras cobranças podem compor a fatura.'),
            num(t`Para $100\,\text{kWh}$ e tarifa hipotética de R\$ 0,80/kWh, qual a parcela de energia em reais, com duas casas decimais?`, 80, t`$100\cdot0,80=80$: R\$ 80,00.`, { unit: 'R$', tol: 0.005 }),
            gen((rng) => { const e = randInt(rng, 2, 9) * 100; return num(t`Com consumo de $${e}\,\text{kWh}$ e tarifa hipotética de R\$ 0,50/kWh, calcule a parcela de energia em reais, com duas casas decimais.`, e / 2, t`$${e}\cdot0,50=${fmt(e / 2, 2)}$ reais.`, { unit: 'R$', tol: 0.005 }); }),
            mcq('Qual afirmação descreve as bandeiras tarifárias?', ['Podem acrescentar cobrança proporcional ao consumo conforme as condições de geração.', 'Fixam para sempre a tarifa de toda distribuidora.', 'Medem a potência instantânea de um aparelho.', 'Eliminam todos os tributos da fatura.'], 0, 'A bandeira sinaliza custos de geração e pode acrescentar valor por energia consumida; seus valores variam.'),
            num(t`Uma bandeira hipotética acrescenta R\$ 4,00 a cada $100\,\text{kWh}$. Para $250\,\text{kWh}$, qual o adicional em reais, com duas casas decimais?`, 10, t`$250/100\cdot4=10$: R\$ 10,00.`, { unit: 'R$', tol: 0.005 }),
            num(t`Com $200\,\text{kWh}$, tarifa hipotética de R\$ 0,70/kWh e adicional de R\$ 3,00 por $100\,\text{kWh}$, qual o total dessas duas parcelas em reais, com duas casas?`, 146, t`Energia: $200\cdot0,70=140$; bandeira: $2\cdot3=6$; soma R\$ 146,00.`, { unit: 'R$', tol: 0.005 }),
          ],
        },
      ],
    },
    {
      id: 'el-efic-rend', title: 'Rendimento de equipamentos', parts: [
        {
          card: { title: 'Energia útil e perdas', body: t`Rendimento é a fração da energia de entrada que cumpre a finalidade desejada: $\eta=E_{útil}/E_{entrada}$. Multiplique por $100$ para obter porcentagem. O restante vai para outras formas de energia, como calor e som, segundo o objetivo escolhido.`, visual: lab('entrada', 0.8, 'kWh'), example: t`De $10\,\text{kWh}$ de entrada, $8\,\text{kWh}$ úteis dão $\eta=80\%$.` },
          exercises: [
            mcq('O rendimento relaciona quais grandezas?', ['Energia útil e energia de entrada', 'Tempo e tensão', 'Tarifa e corrente', 'Potência e preço'], 0, 'Divida a energia útil pela energia de entrada, na mesma unidade.'),
            tf('Com a mesma energia útil, menor entrada significa maior rendimento.', true, 'Como a entrada é o denominador, diminuí-la aumenta a razão útil/entrada.'),
            num(t`Uma máquina recebe $10\,\text{kWh}$ e entrega $8\,\text{kWh}$ úteis. Qual o rendimento em %?`, 80, t`$8/10\cdot100=80\%$.`, { unit: '%', tol: 0.001 }),
            gen((rng) => { const useful = randInt(rng, 5, 9); return num(t`Uma máquina recebe $10\,\text{kWh}$ e entrega $${useful}\,\text{kWh}$ úteis. Qual o rendimento em %?`, useful * 10, t`$${useful}/10\cdot100=${useful * 10}\%$.`, { unit: '%', tol: 0.001 }); }),
            ajuste(t`A máquina aproveita $80\%$ da entrada. Ajuste a entrada, em kWh, para obter $4\,\text{kWh}$ úteis.`, 'entrada', 0.8, 'kWh', 4, t`$0,8E=4$, então a entrada é $5\,\text{kWh}$.`),
            num(t`Uma máquina recebe $50\,\text{kWh}$ com rendimento de $80\%$. Qual a energia não útil em kWh?`, 10, t`A fração não útil é $20\%$: $0,2\cdot50=10\,\text{kWh}$.`, { unit: 'kWh', tol: 0.001 }),
            num(t`Para fornecer $12\,\text{kWh}$ úteis com rendimento de $75\%$, qual a entrada em kWh?`, 16, t`$E_{entrada}=12/0,75=16\,\text{kWh}$.`, { unit: 'kWh', tol: 0.001 }),
          ],
        },
        {
          card: { title: 'Potência e comparação justa', body: t`Em regime estável, compare potências úteis e de entrada: $\eta=P_{útil}/P_{entrada}$. Compare equipamentos para o mesmo serviço, nas mesmas condições e período. O Selo Procel destaca produtos eficientes em categorias e critérios próprios; confira também a etiqueta e as características adequadas ao uso.`, example: t`Um motor que absorve $2\,\text{kW}$ e entrega $1,8\,\text{kW}$ no eixo tem rendimento $90\%$.` },
          exercises: [
            tf('O Selo Procel ajuda a identificar equipamentos eficientes dentro dos critérios de sua categoria.', true, 'O selo é uma referência de eficiência; confirme a categoria e o serviço oferecido.'),
            num(t`Um motor absorve $2\,\text{kW}$ e entrega $1,8\,\text{kW}$ no eixo. Qual seu rendimento em %?`, 90, t`$1,8/2\cdot100=90\%$.`, { unit: '%', tol: 0.001 }),
            gen((rng) => { const p = randInt(rng, 2, 9); return num(t`Um motor absorve $${p * 10}\,\text{kW}$ e tem rendimento de $80\%$. Qual a potência útil em kW?`, p * 8, t`$P_{útil}=0,8\cdot${p * 10}=${p * 8}\,\text{kW}$.`, { unit: 'kW', tol: 0.001 }); }),
            mcq('Para comparar eficiência de dois refrigeradores, qual procedimento é mais útil?', ['Comparar consumo para capacidades e condições de uso equivalentes.', 'Escolher apenas pela cor.', 'Comparar consumo sem considerar tamanho ou serviço.', 'Escolher sempre o mais barato sem olhar consumo.'], 0, 'A comparação deve considerar o serviço prestado, as condições de teste e o consumo.'),
            num(t`Um motor recebe $5\,\text{kW}$ e entrega $4\,\text{kW}$ úteis. Qual a potência de perdas em kW?`, 1, t`$5-4=1\,\text{kW}$ não se torna potência útil no eixo.`, { unit: 'kW', tol: 0.001 }),
            num(t`Um equipamento precisa entregar $9\,\text{kW}$ úteis com rendimento de $90\%$. Qual sua potência de entrada em kW?`, 10, t`$P_{entrada}=9/0,9=10\,\text{kW}$.`, { unit: 'kW', tol: 0.001 }),
            tf('Menor potência nominal, sozinha, garante que dois aparelhos prestem o mesmo serviço.', false, 'Potência não informa sozinha capacidade, desempenho ou condições de operação; compare o serviço entregue.'),
          ],
        },
      ],
    },
    {
      id: 'el-efic-ilum', title: 'Iluminação e motores eficientes', parts: [
        {
          card: { title: 'Luz por watt', body: t`Fluxo luminoso $\Phi$ é medido em lúmens (lm). A eficácia luminosa $\Phi/P$ é dada em lm/W. Para iluminação equivalente, compare fluxo, distribuição, cor e necessidades do ambiente, além da potência. lm/W não é rendimento energético percentual.`, visual: lab('W', 2, 'lm'), example: t`Uma lâmpada de $10\,\text{W}$ que fornece $1000\,\text{lm}$ tem eficácia $100\,\text{lm/W}$.` },
          exercises: [
            mcq('Qual unidade mede fluxo luminoso?', ['lm', 'W', 'kWh', 'reais'], 0, 'O lúmen (lm) mede fluxo luminoso; W mede potência.'),
            tf('lm/W expressa fluxo luminoso por potência elétrica.', true, 'Divida os lúmens pelos watts para calcular a eficácia luminosa.'),
            num(t`Uma lâmpada fornece $1000\,\text{lm}$ com $10\,\text{W}$. Qual sua eficácia em lm/W?`, 100, t`$1000/10=100\,\text{lm/W}$.`, { unit: 'lm/W', tol: 0.001 }),
            gen((rng) => { const p = randInt(rng, 5, 15); return num(t`Uma lâmpada fornece $${p * 80}\,\text{lm}$ e consome $${p}\,\text{W}$. Qual sua eficácia em lm/W?`, 80, t`$${p * 80}/${p}=80\,\text{lm/W}$.`, { unit: 'lm/W', tol: 0.001 }); }),
            ajuste(t`No modelo de $2\,\text{lm/W}$, ajuste a potência para obter $8\,\text{lm}$.`, 'W', 2, 'lm', 8, t`$2P=8$, logo $P=4\,\text{W}$. Este modelo é apenas didático.`),
            mcq(t`Para mesmo fluxo de $800\,\text{lm}$, qual tem maior eficácia?`, [t`$10\,\text{W}$`, t`$20\,\text{W}$`, t`$40\,\text{W}$`, t`$60\,\text{W}$`], 0, t`Com fluxo igual, a menor potência dá maior razão: $800/10=80\,\text{lm/W}$.`),
            num(t`Uma lâmpada de $12\,\text{W}$ funciona $5\,\text{h}$ por dia durante $30$ dias. Qual seu consumo em kWh, com uma casa decimal?`, 1.8, t`$0,012\cdot5\cdot30=1,8\,\text{kWh}$.`, { unit: 'kWh', tol: 0.05 }),
          ],
        },
        {
          card: { title: 'Motores no uso real', body: t`Um motor eficiente reduz perdas para uma mesma potência no eixo, mas o consumo depende também das horas de operação e da carga. Dimensionamento, manutenção e controle adequados ajudam a evitar desperdício; compare rendimentos nas condições de trabalho, não apenas na placa.`, example: t`Para $9\,\text{kW}$ no eixo, um motor com $90\%$ de rendimento absorve $10\,\text{kW}$.` },
          exercises: [
            tf('Reduzir horas de funcionamento desnecessário pode reduzir o consumo de um motor.', true, 'Com potência de entrada constante, $E=P\Delta t$ diminui quando o tempo diminui.'),
            mcq('Ao escolher um motor, o que deve ser considerado?', ['Carga, horas e rendimento nas condições de operação', 'Somente a cor da carcaça', 'Apenas a potência de entrada sem considerar o serviço', 'Apenas o preço inicial'], 0, 'Carga, horas e rendimento determinam o serviço e influenciam o consumo.'),
            num(t`Um motor absorve $10\,\text{kW}$ durante $4\,\text{h}$. Qual o consumo em kWh?`, 40, t`$10\cdot4=40\,\text{kWh}$.`, { unit: 'kWh', tol: 0.001 }),
            gen((rng) => { const h = randInt(rng, 2, 9); return num(t`Um motor absorve $2\,\text{kW}$ por $${h}\,\text{h}$. Qual o consumo em kWh?`, 2 * h, t`$E=2\cdot${h}=${2 * h}\,\text{kWh}$.`, { unit: 'kWh', tol: 0.001 }); }),
            num(t`Para $8\,\text{kW}$ no eixo e rendimento de $80\%$, qual a potência de entrada em kW?`, 10, t`$8/0,8=10\,\text{kW}$.`, { unit: 'kW', tol: 0.001 }),
            num(t`Dois motores entregam o mesmo serviço. Um absorve $10\,\text{kW}$ e outro $9\,\text{kW}$ durante $100\,\text{h}$. Qual a economia do segundo em kWh?`, 100, t`$(10-9)\cdot100=100\,\text{kWh}$.`, { unit: 'kWh', tol: 0.001 }),
            tf('Um motor mais eficiente necessariamente consome menos energia em qualquer situação, mesmo prestando serviço diferente.', false, 'A energia depende da carga e do tempo; a comparação exige o mesmo serviço e condições equivalentes.'),
          ],
        },
      ],
    },
    {
      id: 'el-efic-diag', title: 'Diagnóstico energético', parts: [
        {
          card: { title: 'Onde está o consumo?', body: t`Faça um inventário de potência, quantidade e tempo de uso; estime $E=\sum P_i t_i$ e compare com as leituras reais. Diferenças podem indicar estimativas ruins, cargas esquecidas ou variações de operação. Priorize oportunidades pelo consumo e pelo serviço necessário.`, visual: lab('h', 1, 'kWh'), example: t`Duas cargas de $1\,\text{kW}$ por $3\,\text{h}$ consomem juntas $6\,\text{kWh}$.` },
          exercises: [
            mcq('Qual dado é essencial para estimar consumo a partir da potência?', ['Tempo de funcionamento', 'Cor do equipamento', 'Nome do fabricante', 'Comprimento do cabo apenas'], 0, 'Multiplique potência pelo tempo de funcionamento.'),
            tf('Um inventário deve considerar também quantos aparelhos iguais estão em uso.', true, 'O consumo total soma a energia de cada aparelho; multiplique pela quantidade se o uso for igual.'),
            num(t`Três aparelhos de $0,5\,\text{kW}$ operam $4\,\text{h}$ cada. Qual o consumo total em kWh?`, 6, t`$3\cdot0,5\cdot4=6\,\text{kWh}$.`, { unit: 'kWh', tol: 0.001 }),
            gen((rng) => { const n = randInt(rng, 2, 5); return num(t`Há $${n}$ cargas de $1\,\text{kW}$, cada uma ligada por $2\,\text{h}$. Qual o total em kWh?`, n * 2, t`$${n}\cdot1\cdot2=${n * 2}\,\text{kWh}$.`, { unit: 'kWh', tol: 0.001 }); }),
            ajuste(t`No diagnóstico de uma carga de $1\,\text{kW}$, ajuste o tempo para obter $7\,\text{kWh}$.`, 'h', 1, 'kWh', 7, t`$1\cdot t=7$, portanto $t=7\,\text{h}$.`),
            num(t`Uma carga usa $60\,\text{kWh}$ de um total de $200\,\text{kWh}$. Qual sua participação em %?`, 30, t`$60/200\cdot100=30\%$.`, { unit: '%', tol: 0.001 }),
            mcq('A estimativa do inventário ficou muito abaixo da leitura do medidor. Qual próximo passo é adequado?', ['Revisar tempos, potências e cargas esquecidas.', 'Concluir que o medidor está errado sem investigar.', 'Ignorar cargas intermitentes.', 'Somar potência em kW diretamente ao consumo em kWh.'], 0, 'Revise hipóteses e medições antes de atribuir a diferença ao medidor.'),
          ],
        },
        {
          card: { title: 'Economia e payback simples', body: t`Para uma troca, estime a economia de energia com o mesmo serviço e horas. Multiplique pela tarifa evitada para obter economia por período. O payback simples é investimento incremental dividido pela economia no mesmo período; desconsidera valor do dinheiro no tempo, manutenção e mudanças futuras, salvo se incluídas na economia.`, example: t`Investimento extra de R\$ 600 e economia de R\$ 50/mês dão $600/50=12$ meses.` },
          exercises: [
            mcq('No payback simples, divide-se o investimento incremental por…', ['economia por período', 'potência do equipamento antigo', 'número de lâmpadas apenas', 'tarifa sem considerar consumo'], 0, 'Investimento dividido pela economia por período fornece o número de períodos para retorno.'),
            tf('Payback simples ignora o valor do dinheiro no tempo.', true, 'A razão investimento/economia não desconta fluxos futuros.'),
            num(t`Uma troca custa R\$ 400 a mais e economiza R\$ 50 por mês. Qual o payback simples em meses?`, 8, t`$400/50=8$ meses.`, { unit: 'meses', tol: 0.001 }),
            gen((rng) => { const m = randInt(rng, 3, 12); return num(t`Uma troca exige R\$ ${m * 20} adicionais e economiza R\$ 20 por mês. Qual o payback simples em meses?`, m, t`$${m * 20}/20=${m}$ meses.`, { unit: 'meses', tol: 0.001 }); }),
            num(t`Uma lâmpada de $60\,\text{W}$ é trocada por outra de $10\,\text{W}$ com serviço equivalente, por $100\,\text{h}$/mês. Qual a economia mensal em kWh?`, 5, t`$(60-10)/1000\cdot100=5\,\text{kWh}$.`, { unit: 'kWh', tol: 0.001 }),
            num(t`A economia é $5\,\text{kWh}$/mês e a tarifa evitada é R\$ 0,80/kWh. Qual a economia mensal em reais, com duas casas decimais?`, 4, t`$5\cdot0,80=4$: R\$ 4,00 por mês.`, { unit: 'R$', tol: 0.005 }),
            num(t`Uma troca custa R\$ 48 adicionais, economiza $5\,\text{kWh}$/mês e evita R\$ 0,80/kWh. Qual o payback simples em meses?`, 12, t`Economia mensal: $5\cdot0,80=4$ reais. Payback: $48/4=12$ meses.`, { unit: 'meses', tol: 0.001 }),
            mcq('Um aquecedor solar de água pode reduzir o consumo elétrico do banho. Qual descrição é correta?', ['Usa calor solar para aquecer água e pode ter apoio elétrico.', 'Gera necessariamente eletricidade fotovoltaica.', 'Funciona sempre sem reservatório ou apoio.', 'Elimina qualquer necessidade de avaliar custo e uso.'], 0, 'O coletor aproveita calor solar; apoio pode complementar o aquecimento. Isso difere da geração fotovoltaica de eletricidade.'),
          ],
        },
      ],
    },
  ],
};
