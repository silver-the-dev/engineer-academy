import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, match, mcq, num, order, plot, tf } from '../../helpers';
import { Label, RectW, Seg } from '../../../components/plot/Plot';
import { randInt } from '../../../lib/random';

const t = String.raw;

// Diagrama didático: as dimensões representam unidades do exercício, não uma regra de fabricação.
const layout = () => plot({
  view: { xMin: 0, xMax: 10, yMin: 0, yMax: 5 }, grid: false, axes: false, tickLabels: false,
  params: [{ key: 'x', label: 'Posição do componente', min: 3, max: 8, step: 1, value: 7 }],
  render: ({ p }: any) => <>
    <RectW x={0.4} y={0.4} w={9.2} h={4.2} color="#198754" opacity={0.16} />
    <RectW x={1} y={1.5} w={2} h={2} color="#385a9e" opacity={0.6} />
    <Label x={2} y={2.5} text="CI" anchor="middle" />
    <RectW x={p.x} y={2} w={0.8} h={1} color="#d19a36" opacity={0.8} />
    <Label x={p.x + 0.4} y={3.4} text="C" anchor="middle" />
    <Seg x1={3} y1={2.5} x2={p.x} y2={2.5} color="#d19a36" width={3} />
  </>,
  info: ({ p }: any) => `Distância ilustrada entre CI e C: ${p.x - 3} unidades.`,
});

const aproxima = () => inter('Mova C até a posição 3, junto ao CI, para reduzir o caminho de desacoplamento.', 'plot', layout().props,
  (v) => v.p.x === 3, 'Posição 3', 'Na posição 3, a distância ilustrada é zero; na placa real mantenha curtas as conexões aos pinos de alimentação e terra.');

// O controle desloca a peça à direita para examinar uma medida ou um alinhamento.
const comparacao = (tipo: 'pad' | 'folga' | 'camada') => plot({
  view: { xMin: 0, xMax: 10, yMin: 0, yMax: 5 }, grid: false, axes: false, tickLabels: false,
  params: [{ key: 'x', label: 'Posição', min: 3, max: 8, step: 1, value: tipo === 'folga' ? 4 : 7 }],
  render: ({ p }: any) => <>
    <RectW x={1} y={1} w={8} h={3} color="#198754" opacity={0.12} />
    <RectW x={2} y={2} w={1} h={1} color="#385a9e" opacity={0.65} />
    <RectW x={tipo === 'camada' ? p.x - 1 : p.x} y={2} w={1} h={1} color="#d19a36" opacity={0.65} />
    <Label x={2.5} y={3.5} text={tipo === 'camada' ? 'Cobre' : 'Pad A'} anchor="middle" />
    <Label x={p.x + 0.5} y={3.5} text={tipo === 'camada' ? 'Máscara' : 'Pad B'} anchor="middle" />
    <Seg x1={3} y1={1.6} x2={p.x} y2={1.6} color="#d19a36" width={2} />
  </>,
  info: ({ p }: any) => tipo === 'pad' ? `Distância entre centros: ${p.x - 2} unidades.` : `Deslocamento entre bordas: ${p.x - 3} unidades.`,
});

const ajustaComparacao = (tipo: 'pad' | 'folga' | 'camada') => {
  if (tipo === 'pad') return inter('Ajuste os pads para que seus centros fiquem a 2 unidades de distância, conforme este componente fictício.', 'plot', comparacao(tipo).props, (v) => v.p.x === 4, 'Posição 4', 'O centro do primeiro pad está em 2,5; com o segundo em 4,5, o passo é 2 unidades.');
  if (tipo === 'folga') return inter('Para estas redes diferentes, ajuste a folga entre as bordas para pelo menos 2 unidades.', 'plot', comparacao(tipo).props, (v) => v.p.x >= 5, 'Posição 5 ou maior', 'O primeiro pad termina na posição 3; o segundo deve começar em 5 ou mais para ter folga de pelo menos 2 unidades.');
  return inter('Alinhe a abertura de máscara ao pad de cobre no desenho sobreposto.', 'plot', comparacao(tipo).props, (v) => v.p.x === 3, 'Posição 3', 'Neste desenho simplificado a borda móvel deve coincidir com a borda direita do pad; confira a sobreposição real no visualizador de fabricação.');
};

export const projetoPCB: UnitDef = {
  id: 'of-pcb', title: 'Projeto de placas de circuito impresso', icon: '🟩',
  subtitle: 'Do esquemático aos arquivos de fabricação',
  source: 'Roadmap Eletrônica, meses 8 e 9 — KiCad, layout e fabricação',
  guide: t`O esquemático define as redes; o layout transforma essas conexões em cobre. Confira footprints e pinagem com o datasheet, posicione componentes, roteie e rode ERC e DRC. Trilhas e vias são dimensionadas para corrente, temperatura, cobre e fabricação; o retorno precisa de um caminho próximo. Coloque o desacoplamento junto aos pinos de alimentação do CI. Confira Gerbers, furação, BOM e posição antes de fabricar. Para orçamento: custo por placa = custo total do lote dividido pelo número de placas úteis.`,
  lessons: [
    { id: 'of-pcb-fluxo', title: 'Do esquemático ao layout', parts: [
      { card: { title: 'Da ideia às redes', body: 'No KiCad, desenhe o esquemático com símbolos, valores e conexões. Uma rede reúne pinos eletricamente ligados; rótulos iguais podem ligar pontos distantes. O ERC aponta inconsistências elétricas, mas não prova que o circuito funciona. Associe footprints e atualize a placa a partir do esquemático.', visual: layout() }, exercises: [
        mcq('O que o esquemático descreve?', ['Componentes e conexões elétricas', 'Somente a cor da máscara', 'A embalagem de envio', 'Somente o contorno da placa'], 0, 'Símbolos e redes descrevem os componentes e suas conexões.'),
        tf('Pontos com o mesmo rótulo de rede podem estar conectados mesmo sem fio desenhado entre eles.', true, 'Rótulos de rede iguais representam a mesma conexão, conforme o escopo definido no projeto.'),
        mcq('Qual verificação procura inconsistências elétricas no esquemático?', ['ERC', 'DRC de fabricação', 'Visualizador de Gerber', 'Lista de materiais'], 0, 'O ERC verifica regras elétricas do esquemático.'),
        match('Associe cada representação à função.', [['Símbolo', 'Representa o componente no esquemático'], ['Rede', 'Identifica pinos conectados'], ['Footprint', 'Define a geometria na placa']], 'Símbolo e footprint têm papéis distintos; a rede conserva as ligações.'),
        gen((rng) => { const n = randInt(rng, 3, 9); return num(`Uma rede liga ${n} pinos e recebe mais 2 pinos. Quantos pinos ela reúne?`, n + 2, `${n} + 2 = ${n + 2} pinos.`); }),
        order('Ordene o início do projeto.', ['Desenhar o esquemático', 'Verificar o ERC', 'Associar footprints', 'Atualizar a placa'], 'Primeiro defina e confira as conexões, associe os encapsulamentos e transfira ao editor de placa.'),
        aproxima(),
      ] },
      { card: { title: 'Posicionar antes de rotear', body: 'No editor de PCB, defina o contorno fechado e coloque conectores conforme a caixa e o acesso. Agrupe componentes relacionados, respeite a polaridade e deixe espaço para montagem. As linhas de conexão indicam redes ainda não roteadas; não são cobre.', tip: 'Um DRC limpo não substitui conferir a função elétrica, a mecânica e o datasheet.' }, exercises: [
        mcq('O contorno da placa deve ser...', ['Fechado e compatível com a caixa', 'Uma linha aberta sem dimensão', 'Uma rede elétrica de alimentação', 'Um texto na serigrafia'], 0, 'Um contorno fechado define a geometria de fabricação.'),
        tf('Linhas de conexão pendentes já são trilhas de cobre fabricadas.', false, 'Elas indicam ligações ainda necessárias; é preciso roteá-las ou conectá-las por cobre.'),
        mcq('Onde considerar primeiro a posição de um conector externo?', ['Na borda acessível e compatível com a caixa', 'Sob um CI sem acesso', 'Fora do contorno', 'Sobre um furo de fixação'], 0, 'O encaixe mecânico e o acesso orientam a posição do conector.'),
        match('Associe a etapa ao objetivo.', [['Posicionamento', 'Acomodar componentes e conexões'], ['Roteamento', 'Criar caminhos de cobre'], ['Revisão mecânica', 'Conferir encaixe e acesso']], 'Cada etapa resolve uma dimensão diferente do projeto.'),
        gen((rng) => { const n = randInt(rng, 4, 9); return num(`Havia ${n} conexões pendentes e 3 foram roteadas. Quantas restam?`, n - 3, `${n} - 3 = ${n - 3} conexões pendentes.`); }),
        mcq('Uma mudança nas conexões do circuito foi feita no esquemático. O que fazer?', ['Atualizar a placa a partir do esquemático e revisar o layout', 'Ignorar a diferença entre os arquivos', 'Alterar apenas a cor da placa', 'Gerar Gerbers imediatamente'], 0, 'Sincronize a alteração e confira redes, posicionamento e roteamento novamente.'),
        tf('Uma placa com DRC sem erros necessariamente caberá na caixa e funcionará.', false, 'O DRC depende das regras configuradas; revise mecânica e circuito separadamente.'),
      ] },
    ] },
    { id: 'of-pcb-comp', title: 'Footprints e bibliotecas', parts: [
      { card: { title: 'Símbolo e encapsulamento', body: 'O símbolo mostra a função e os números dos pinos; o footprint descreve pads, furos e contorno físico. Compare dimensões e numeração com o desenho do fabricante, inclusive polaridade e orientação. THT atravessa a placa; SMD é montado na superfície.', visual: comparacao('pad') }, exercises: [
        mcq('O footprint define principalmente...', ['A geometria de montagem na placa', 'A equação do circuito', 'A tensão da rede elétrica', 'O preço do frete'], 0, 'Pads, furos e contornos são características físicas do footprint.'),
        tf('THT usa terminais que atravessam furos; SMD é montado na superfície.', true, 'Essas são as formas típicas de montagem dos dois tipos.'),
        mcq('O que confirmar antes de aceitar um footprint de biblioteca?', ['Dimensões e números dos pinos no datasheet', 'Apenas a cor exibida na tela', 'Somente o nome do arquivo', 'O número de camadas do monitor'], 0, 'A aparência ou o nome não garantem medidas e pinagem corretas.'),
        match('Relacione.', [['Símbolo', 'Função e pinos no esquemático'], ['Footprint', 'Pads e geometria física'], ['Datasheet', 'Referência de medidas e pinagem']], 'Os três precisam ser compatíveis para o componente montar e conectar corretamente.'),
        gen((rng) => { const n = randInt(rng, 2, 8); return num(`Um footprint THT tem ${n} furos e outro tem 2. Quantos furos ao todo?`, n + 2, `${n} + 2 = ${n + 2} furos.`); }),
        mcq('O pino 1 do símbolo está ligado a VCC, mas o pad 1 do footprint corresponde fisicamente ao GND do componente. Qual é o problema?', ['A associação de pinos está errada', 'A serigrafia está muito clara', 'O contorno está fechado', 'A BOM tem muitos itens'], 0, 'A rede VCC chegaria ao terminal físico GND; corrija a associação e confirme no datasheet.'),
        ajustaComparacao('pad'),
      ] },
      { card: { title: 'Biblioteca e inspeção', body: 'Mesmo dois componentes com o mesmo símbolo podem usar encapsulamentos diferentes, como DIP THT e SOIC SMD. Confira passo, furação, dimensões, pino 1, folgas e espaço de soldagem. O modelo 3D ajuda na revisão mecânica, mas não substitui medidas do datasheet.' }, exercises: [
        mcq('DIP e SOIC podem representar...', ['Encapsulamentos físicos diferentes de CIs', 'Duas camadas de máscara', 'Dois nomes obrigatórios para a mesma rede', 'Duas unidades de corrente'], 0, 'DIP e SOIC descrevem famílias físicas de encapsulamento.'),
        tf('O modelo 3D sozinho garante que a pinagem e os furos estão corretos.', false, 'O modelo pode estar incorreto; compare o footprint com o desenho do fabricante.'),
        mcq('Qual medida descreve a distância entre centros de terminais vizinhos?', ['Passo', 'Cor da máscara', 'Quantidade de redes', 'Revisão da BOM'], 0, 'O passo é a distância entre centros de terminais adjacentes.'),
        gen((rng) => { const n = randInt(rng, 3, 8); return num(`Uma fileira tem ${n + 1} terminais com passo de 2 mm. Qual a distância em mm entre os centros extremos?`, 2 * n, `${n} intervalos de 2 mm: ${n} × 2 = ${2 * n} mm.`, { unit: 'mm' }); }),
        mcq('Um diodo polarizado tem marca física de cátodo. O que conferir?', ['Se a marca e os pads correspondem ao símbolo e ao datasheet', 'Se ambos os pads têm o mesmo nome', 'Se o corpo é desenhado fora da placa', 'Somente a cor do componente'], 0, 'A polaridade física deve coincidir com as redes do esquemático e a marca de montagem.'),
        match('Associe o risco à revisão.', [['Furo pequeno demais', 'Comparar com diâmetro do terminal'], ['Pino 1 invertido', 'Conferir numeração e orientação'], ['Conector sem acesso', 'Conferir caixa e posição']], 'Dimensões, pinagem e acesso são verificações complementares.'),
        tf('Dois footprints visualmente parecidos podem ter pinagens diferentes.', true, 'A numeração e o desenho do fabricante precisam ser conferidos individualmente.'),
      ] },
    ] },
    { id: 'of-pcb-rot', title: 'Roteamento, trilhas e plano de terra', parts: [
      { card: { title: 'Trilhas, corrente e vias', body: 'A trilha conduz corrente e apresenta resistência. Para a mesma espessura e comprimento, aumentar a largura reduz a resistência aproximada. Dimensione com corrente, espessura do cobre, aquecimento admissível e condições de montagem; não há largura universal por ampère. Vias ligam camadas e também precisam suportar corrente.', visual: layout() }, exercises: [
        mcq('Uma via metalizada serve para...', ['Conectar cobre entre camadas', 'Substituir qualquer componente', 'Definir a cor da placa', 'Marcar apenas o nome do projeto'], 0, 'A metalização liga eletricamente as camadas pertinentes.'),
        tf('Existe uma largura única segura para qualquer corrente e espessura de cobre.', false, 'O dimensionamento depende também do aquecimento, geometria e condições de uso.'),
        mcq('Com mesmo comprimento e espessura, uma trilha mais larga tende a ter...', ['Menor resistência', 'Maior resistência', 'A mesma resistência sempre', 'Corrente obrigatoriamente nula'], 0, 'A seção transversal aumenta e a resistência diminui aproximadamente na mesma proporção.'),
        gen((rng) => { const n = randInt(rng, 2, 8); return num(`Um trecho tem ${n} vias e outro tem 2. Quantas vias no total?`, n + 2, `${n} + 2 = ${n + 2} vias.`); }),
        mcq('A corrente de uma alimentação aumentou bastante. Qual ação é adequada?', ['Redimensionar trilhas e vias para as condições reais', 'Manter qualquer largura sem análise', 'Apagar o plano de terra', 'Trocar somente o texto da serigrafia'], 0, 'Use uma calculadora ou norma adequada, incluindo cobre, temperatura e vias.'),
        mcq('Uma trilha uniforme tem resistência de 40 mΩ. Se a largura dobrar e o comprimento e cobre forem iguais, qual a resistência aproximada?', ['20 mΩ', '80 mΩ', '40 mΩ', '160 mΩ'], 0, 'A resistência é inversamente proporcional à área: 40 ÷ 2 = 20 mΩ, aproximadamente.'),
        aproxima(),
      ] },
      { card: { title: 'Retorno e desacoplamento', body: 'Toda corrente precisa de um caminho de retorno. Um plano de terra contínuo próximo da trilha ajuda a manter pequeno o laço de corrente, especialmente em sinais rápidos. Evite cruzar fendas no plano. Coloque o capacitor de desacoplamento junto aos pinos de alimentação e terra do CI, com conexões curtas.', tip: 'O desenho mostra uma distância ilustrativa, não a geometria completa do circuito de desacoplamento.' }, exercises: [
        mcq('Onde colocar o capacitor de desacoplamento de um CI?', ['Junto aos pinos de alimentação e terra do CI', 'No canto distante sem conexão de terra curta', 'Fora da placa', 'Sobre o conector de saída'], 0, 'A proximidade reduz o laço e a indutância das conexões de alimentação e retorno.'),
        tf('Uma fenda sob uma trilha rápida pode forçar o retorno a contorná-la.', true, 'A descontinuidade pode aumentar a área do laço e prejudicar o comportamento do sinal.'),
        mcq('Qual alteração melhora o caminho de retorno de um sinal rápido?', ['Manter plano de referência contínuo sob a trilha', 'Abrir uma fenda longa sob toda a trilha', 'Interromper a referência de terra', 'Afastar indefinidamente o retorno'], 0, 'O plano contínuo oferece um caminho próximo ao sinal.'),
        gen((rng) => { const n = randInt(rng, 4, 9); return num(`Um laço ilustrativo tem ida de ${n} mm e retorno de ${n} mm. Qual o comprimento total em mm?`, 2 * n, `${n} + ${n} = ${2 * n} mm.`, { unit: 'mm' }); }),
        mcq('Ache o erro: trilha rápida cruza uma fenda do plano de referência.', ['O retorno precisa contornar a fenda', 'A trilha necessariamente é um resistor', 'A máscara conecta as redes', 'O capacitor substitui o plano em toda a placa'], 0, 'A fenda interrompe o caminho próximo do retorno; reposicione a trilha ou preserve o plano.'),
        match('Associe a medida ao efeito desejado.', [['Desacoplamento junto ao CI', 'Encurtar conexões locais'], ['Plano contínuo', 'Oferecer retorno próximo'], ['Evitar fenda sob sinal', 'Evitar desvio do retorno']], 'Cada medida ajuda a controlar o laço e o caminho da corrente.'),
        tf('O plano de terra elimina a necessidade de avaliar a corrente e a continuidade do retorno.', false, 'A geometria e as correntes reais ainda precisam ser analisadas.'),
      ] },
    ] },
    { id: 'of-pcb-regras', title: 'Regras de projeto e fabricação', parts: [
      { card: { title: 'Regras e DRC', body: 'Configure no KiCad larguras, espaçamentos, furos e demais limites compatíveis com a fábrica e o circuito. O DRC compara o layout com as regras configuradas e destaca problemas como curto, espaçamento insuficiente e conexão pendente. Analise cada aviso e rode novamente após corrigir.', visual: comparacao('folga') }, exercises: [
        mcq('O DRC compara o layout com...', ['As regras configuradas para o projeto', 'A previsão do tempo', 'Apenas o nome do arquivo', 'O preço de cada componente'], 0, 'O DRC verifica restrições do layout conforme a configuração.'),
        tf('Um DRC limpo garante fabricação mesmo quando as regras configuradas são mais permissivas que as da fábrica.', false, 'As regras precisam refletir a capacidade contratada da fábrica.'),
        mcq('Duas redes diferentes estão mais próximas que a folga mínima. Qual é a correção?', ['Aumentar a separação ou mudar o roteamento', 'Ignorar a violação', 'Unir as duas redes', 'Remover o contorno'], 0, 'A separação deve respeitar o limite aplicável entre redes distintas.'),
        gen((rng) => { const n = randInt(rng, 2, 8); return num(`O DRC mostrou ${n + 2} violações e você corrigiu 2. Quantas ainda faltam revisar?`, n, `${n + 2} - 2 = ${n} violações.`); }),
        match('Associe a violação à revisão.', [['Curto', 'Separar redes distintas'], ['Conexão pendente', 'Completar ligação necessária'], ['Furo fora do limite', 'Adequar diâmetro à fabricação']], 'Corrija a causa de cada violação antes de repetir o DRC.'),
        mcq('A regra exige folga mínima de 0,20 mm e a folga medida é 0,15 mm. Quanto falta, em mm?', ['0,05', '0,35', '0,20', '0,15'], 0, 'A diferença é 0,20 − 0,15 = 0,05 mm.'),
        ajustaComparacao('folga'),
      ] },
      { card: { title: 'Limites e revisão', body: 'A folga elétrica deve atender à tensão, ao ambiente e às normas aplicáveis, além da capacidade da fábrica. Dimensões mínimas de trilha, furação e anel anular dependem do processo. A máscara de solda protege cobre, mas não substitui a análise de isolação elétrica.' }, exercises: [
        mcq('O anel anular é...', ['A faixa de cobre ao redor de um furo no pad', 'A borda externa da caixa', 'Uma camada de serigrafia', 'O arquivo da lista de materiais'], 0, 'É o cobre remanescente entre o furo e a borda do pad.'),
        tf('A capacidade mínima de fabricação é a única consideração para folga entre redes de alta tensão.', false, 'Tensão, ambiente, isolação e normas aplicáveis também importam.'),
        num('Um pad circular tem diâmetro de 1,2 mm e furo central de 0,6 mm. Qual a largura radial do anel em mm, com uma casa decimal?', 0.3, t`$(1,2-0,6)/2=0,3,\text{mm}$.`, { unit: 'mm', tol: 0.05 }),
        gen((rng) => { const d = randInt(rng, 2, 6); return num(`Um pad tem diâmetro de ${d + 2} mm e furo central de ${d} mm. Qual a largura radial do anel em mm?`, 1, `(${d + 2} − ${d}) ÷ 2 = 1 mm.`, { unit: 'mm' }); }),
        mcq('O fabricante exige furo mínimo de 0,3 mm; o projeto usa 0,2 mm. O que fazer?', ['Adequar o projeto ou contratar processo capaz e revisar as regras', 'Enviar sem verificar', 'Alterar só o nome do projeto', 'Usar a serigrafia como furo'], 0, 'O furo precisa ser compatível com o processo contratado e com o projeto.'),
        order('Ordene a revisão de fabricação.', ['Consultar limites da fábrica', 'Configurar regras do projeto', 'Executar e corrigir o DRC', 'Revisar arquivos de fabricação'], 'As regras devem ser configuradas antes do DRC, e os arquivos exportados ainda exigem inspeção.'),
        tf('A máscara de solda dispensa considerar distâncias de isolação e normas.', false, 'A máscara não substitui a avaliação de isolação elétrica e ambiental.'),
      ] },
    ] },
    { id: 'of-pcb-mont', title: 'Gerber, BOM e montagem', parts: [
      { card: { title: 'Pacote de fabricação', body: 'Exporte Gerbers das camadas necessárias: cobre, máscara de solda, serigrafia e contorno conforme as instruções da fábrica. Exporte também a furação, frequentemente em Excellon, distinguindo furos metalizados e não metalizados quando solicitado. Abra os arquivos gerados em um visualizador independente e confira alinhamento, face e contorno.', visual: comparacao('camada') }, exercises: [
        mcq('Qual arquivo normalmente descreve as posições e diâmetros de furos?', ['Arquivo de furação', 'BOM', 'Imagem 3D', 'Lista de redes impressa'], 0, 'O arquivo de furação contém as operações de furo e deve ser conferido com os Gerbers.'),
        tf('A camada de máscara de solda normalmente descreve aberturas na máscara.', true, 'As aberturas expõem regiões como pads; confira a interpretação no visualizador e na fábrica.'),
        match('Associe a camada ao uso.', [['Cobre', 'Trilhas e pads condutores'], ['Máscara', 'Aberturas na proteção do cobre'], ['Serigrafia', 'Marcações de montagem']], 'As camadas têm funções distintas e precisam estar alinhadas.'),
        gen((rng) => { const n = randInt(rng, 2, 7); return num(`O pacote tem ${n} arquivos Gerber e 2 arquivos de furação. Quantos arquivos ao todo?`, n + 2, `${n} + 2 = ${n + 2} arquivos.`); }),
        mcq('Ao inspecionar os Gerbers, o contorno aparece deslocado em relação ao cobre. O que fazer?', ['Corrigir a exportação e conferir novamente', 'Enviar assim mesmo', 'Apagar o arquivo de furos', 'Ignorar porque o DRC passou'], 0, 'Alinhamento e origem devem ser consistentes entre camadas e furação.'),
        order('Ordene o preparo dos arquivos.', ['Finalizar e revisar o layout', 'Exportar camadas e furação', 'Abrir os arquivos no visualizador', 'Conferir o pacote contra as exigências da fábrica'], 'A inspeção deve usar os arquivos efetivamente exportados e as exigências da fábrica.'),
        ajustaComparacao('camada'),
      ] },
      { card: { title: 'BOM, painel e custo', body: 'A BOM lista referências, quantidades, valores e códigos de componentes; para montagem automática, o arquivo de posição informa coordenadas, lado e rotação conforme a convenção do montador. Panelização reúne placas para fabricação ou montagem; combine bordas, separação e método de corte com o fornecedor. Compare custo total, frete e quantidade útil.', tip: 'Inspecione polaridade, orientação e soldas antes de energizar; valide primeiro a alimentação.' }, exercises: [
        mcq('A BOM é...', ['A lista de materiais e componentes', 'Uma camada de cobre', 'O plano de terra', 'Um tipo de furo'], 0, 'A lista de materiais identifica componentes e quantidades para aquisição e montagem.'),
        tf('Um arquivo de posição para montagem pode precisar de lado e rotação do componente.', true, 'Coordenadas, lado e rotação devem seguir a convenção do montador.'),
        mcq('O que é panelização?', ['Agrupar placas para fabricação ou montagem', 'Trocar todas as trilhas por fios', 'Substituir a BOM por Gerbers', 'Energizar a placa pela primeira vez'], 0, 'O painel reúne unidades e pode incluir bordas e recursos definidos com o fornecedor.'),
        gen((rng) => { const n = randInt(rng, 2, 8); return num(`Um painel tem 2 fileiras de ${n} placas. Quantas placas há no painel?`, 2 * n, `2 × ${n} = ${2 * n} placas.`); }),
        num(t`Um lote de 10 placas úteis custa R\$ 80 incluindo frete. Qual o custo por placa em reais?`, 8, t`$80/10=8$: R\$ 8 por placa.`, { unit: 'R$' }),
        mcq('O arquivo de montagem gira um CI 180° por convenção incompatível. Como evitar o erro?', ['Conferir orientação e convenção com o montador', 'Ignorar a marca de pino 1', 'Apagar a referência do CI', 'Trocar a máscara de cor'], 0, 'Verifique o pino 1, a face e a rotação no arquivo e na visualização do montador.'),
        order('Ordene a primeira verificação da placa montada.', ['Inspecionar soldas e polaridade', 'Verificar curtos na alimentação com a placa desligada', 'Energizar com limitação de corrente', 'Medir alimentação antes dos testes funcionais'], 'Inspeção e teste sem energia precedem a energização controlada e as medições.'),
      ] },
    ] },
  ],
};
