import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, match, mcq, multi, num, order, plot, tf } from '../../helpers';
import { FnCurve, Pt } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { randInt } from '../../../lib/random';

const t = String.raw;

// Modelos didáticos: os controles não substituem a medição de um circuito real.
const bancadaPlot = (label: string, max: number, initial: number, slope: number, yMax: number) => plot({
  view: { xMin: 0, xMax: max, yMin: 0, yMax },
  params: [{ key: 'x', label, min: 0, max, step: 1, value: initial, color: C.p2 }],
  render: ({ p }: any) => <><FnCurve f={(x: number) => slope * x} color={C.p5} /><Pt x={p.x} y={slope * p.x} color={C.gold} /></>,
  info: ({ p }: any) => t`Ajuste ${label}: $${p.x}$ · valor no eixo vertical: $${slope * p.x}$`,
}, 220);
const segurancaLab = () => bancadaPlot('V', 10, 2, 1, 10);
const fonteLab = () => bancadaPlot('V', 10, 2, 1, 10);
const dadosLab = () => bancadaPlot('V', 10, 2, 1, 10);
const protoLab = () => bancadaPlot('nós', 6, 1, 1, 6);

export const bancada: UnitDef = {
  id: 'of-banc', title: 'Bancada, segurança e instrumentos', icon: '🧰',
  subtitle: 'Preparar, medir, consultar e montar com método',
  source: 'Passo 2 — Eletrônica Completa, Fase 0: preparação',
  guide: t`Trabalhe em bancada seca, organizada e com alimentação isolada de baixa tensão. Desligue, isole e confirme ausência de tensão antes de alterar a montagem; capacitores podem manter carga. Limite de corrente reduz consequências, mas não torna um circuito seguro por si só.

Em instrumentos, confira função, bornes, categoria e limites; resistência e continuidade só com circuito desenergizado. Na fonte, defina tensão e limite antes de conectar. No osciloscópio aterrado, a garra de terra não é uma ponta flutuante.

No datasheet, compare condições recomendadas, limites absolutos, encapsulamento e vista da pinagem. Na protoboard, confirme as conexões internas e trilhos divididos. Registre previsto e medido. Para contas: $I=V/R$, $P=VI$ e margem de tensão $V_{\max}-V_{\text{uso}}$.`,
  lessons: [
    { id: 'of-banc-seg', title: 'Segurança elétrica na bancada', parts: [
      { card: { title: 'Antes de energizar', body: t`Use fonte isolada própria para eletrônica e comece com tensões baixas, como $5\,\text{V}$, em circuitos adequados. Não ligue a rede diretamente à protoboard. Baixa tensão não elimina risco: baterias podem fornecer corrente de curto intensa e aquecer fios. Não há valor universal de tensão ou corrente inofensivo: percurso, duração, umidade e fonte importam.

Desligue e desconecte antes de mudar fios; confira tensão ausente com instrumento adequado e verificado. Capacitores podem continuar carregados: siga procedimento apropriado antes de tocar. Nunca provoque curto numa bateria de lítio.`, visual: segurancaLab(), tip: 'O gráfico representa apenas um ajuste de tensão, não um limite de segurança para o corpo.' }, exercises: [
        mcq('Antes de mudar a fiação, qual é o primeiro passo?', ['Desligar e desconectar a alimentação', 'Aumentar a tensão', 'Tocar nos fios para testar', 'Pôr o multímetro em corrente'], 0, 'Desligue e desconecte a alimentação; depois confirme ausência de tensão e energia armazenada.'),
        tf('Uma bateria de baixa tensão pode aquecer fios durante um curto.', true, 'Uma bateria pode fornecer corrente elevada num curto, mesmo em baixa tensão.'),
        mcq('Onde deve ficar a rede elétrica neste aprendizado?', ['Atrás de uma fonte adequada e isolada', 'Diretamente nos trilhos da protoboard', 'Ligada ao corpo da bancada', 'Nas pontas de um amperímetro'], 0, 'Use uma fonte adequada e isolada; não conecte a rede diretamente à montagem.'),
        inter('No modelo, ajuste a fonte para 5 V antes de conectar uma carga de 5 V.', 'plot', segurancaLab().props, (v) => v?.p.x === 5, 'Ajuste V para 5.', 'O controle deve indicar 5 V; isso não dispensa conferir a fonte real e os limites da carga.'),
        gen((rng) => { const v = randInt(rng, 2, 9); return num(t`Uma fonte isolada está ajustada em $${v}\,\text{V}$. Em um resistor ideal de $1\,\text{k}\Omega$, qual a corrente em mA?`, v, t`$I=V/R=${v}/1000\,\text{A}=${v}\,\text{mA}$. Isso é uma conta do circuito, não um limite seguro para uma pessoa.`, { unit: 'mA', tol: 0.001 }); }),
        multi('Quais atitudes são adequadas antes de tocar numa montagem desligada?', ['Desconectar a fonte', 'Verificar ausência de tensão', 'Considerar carga armazenada', 'Supor que todo capacitor descarrega instantaneamente'], [0, 1, 2], 'Desconecte, verifique e trate energia armazenada; um capacitor pode manter tensão após o desligamento.'),
        order('Ordene a preparação para alterar uma montagem.', ['Desligar e desconectar a alimentação', 'Verificar ausência de tensão e energia armazenada', 'Alterar e inspecionar a fiação', 'Reenergizar após conferir'], 'A sequência evita trabalhar energizado e permite inspecionar antes de aplicar energia.'),
      ] },
      { card: { title: 'Limite de corrente e ESD', body: t`Ajuste o limite da fonte conforme o circuito e o manual: ele reduz corrente sustentada em certas falhas, mas não protege contra toda descarga nem garante segurança pessoal. Capacitores na saída podem liberar energia. Uma corrente de alguns miliampères pelo corpo já pode ser perigosa conforme as condições; não use pessoas como carga de teste.

Para componentes sensíveis a ESD, use área e pulseira antiestáticas corretamente aterradas conforme as instruções; manuseie pelas bordas e guarde em embalagem dissipativa. ESD e proteção contra choque são problemas distintos.`, tip: 'Desligue antes de mover componentes; pulseira ESD não é proteção para trabalho energizado.' }, exercises: [
        tf('O limite de corrente da fonte elimina todos os riscos de choque.', false, 'Ele pode reduzir corrente sustentada, mas não elimina energia armazenada nem todos os riscos.'),
        mcq('Para reduzir descarga eletrostática em um CI sensível, o mais adequado é…', ['Usar área e pulseira ESD corretamente conectadas', 'Esfregar o CI em tecido sintético', 'Tocar os pinos repetidamente', 'Guardar o CI solto em saco plástico comum'], 0, 'Uma estação ESD apropriada equaliza potenciais e reduz descargas no componente.'),
        match('Associe a preocupação à medida.', [['ESD', 'Manusear pelas bordas'], ['Curto em bateria', 'Evitar unir os terminais'], ['Capacitor', 'Verificar carga armazenada']], 'Cada medida trata um mecanismo diferente: descarga no componente, corrente de curto ou energia armazenada.'),
        mcq('Uma fonte entrou em limitação de corrente inesperadamente. O que fazer?', ['Desligar e investigar a montagem', 'Elevar o limite até desaparecer', 'Tocar nos terminais', 'Ignorar e deixar aquecer'], 0, 'Desligue e investigue curto, ligação ou carga incompatível antes de reenergizar.'),
        gen((rng) => { const i = randInt(rng, 2, 8); return num(t`Uma carga consome $${i}\,\text{mA}$ a $5\,\text{V}$. Qual sua potência em mW?`, 5 * i, t`$P=VI=5\cdot ${i}=${5 * i}\,\text{mW}$.`, { unit: 'mW', tol: 0.001 }); }),
        tf('Uma pulseira ESD substitui procedimentos de segurança contra choque elétrico.', false, 'A pulseira protege componentes contra ESD; não autoriza trabalhar energizado.'),
        mcq('Por que um limite de corrente não controla toda energia disponível?', ['Capacitores podem armazenar energia e descarregar', 'Porque a corrente nunca aquece fios', 'Porque a fonte mede resistência automaticamente', 'Porque ESD elimina tensão'], 0, 'Capacitores carregados podem fornecer um pulso de corrente independentemente do ajuste da fonte.'),
      ] },
    ] },
    { id: 'of-banc-inst', title: 'Multímetro, fonte e osciloscópio', parts: [
      { card: { title: 'Procedimento de medição', body: t`Confira pontas, bornes, função, faixa e limites do instrumento. Para tensão, use o borne de tensão e conecte as pontas em paralelo aos pontos de interesse. Para corrente, use o borne e a faixa corretos e insira o instrumento em série após desligar o circuito. Nunca coloque o amperímetro diretamente nos terminais de uma fonte.

Resistência e continuidade: desenergize, verifique carga armazenada e, quando necessário, isole o componente. Uma leitura em circuito pode incluir caminhos paralelos.`, visual: fonteLab() }, exercises: [
        mcq('Antes de medir resistência, você deve…', ['Desenergizar e verificar carga armazenada', 'Aplicar a tensão máxima', 'Colocar as pontas no borne de corrente', 'Unir os polos de uma bateria'], 0, 'O ohmímetro aplica seu próprio sinal de teste; circuito energizado pode danificar o instrumento e alterar a leitura.'),
        match('Associe a função à ligação.', [['Tensão', 'Em paralelo'], ['Corrente', 'Em série'], ['Continuidade', 'Circuito desenergizado']], 'Tensão compara dois pontos; corrente passa pelo instrumento; continuidade exige circuito sem energia.'),
        tf('Medir corrente diretamente entre os polos de uma fonte pode causar um curto.', true, 'O amperímetro tem baixa resistência e pode permitir corrente muito alta.'),
        mcq('Uma resistência medida na placa ficou menor que o valor esperado. Uma causa possível é…', ['Existirem caminhos em paralelo', 'O instrumento sempre somar todas as resistências', 'Continuidade medir apenas tensão da rede', 'O resistor ter perdido uma unidade de medida'], 0, 'Outros caminhos em paralelo podem reduzir a resistência equivalente vista pelas pontas.'),
        gen((rng) => { const n = randInt(rng, 2, 8); return num(t`A leitura prevista é $${n}\,\text{V}$ e a medida foi $${n - 1}\,\text{V}$. Qual a diferença absoluta em V?`, 1, t`$|${n}-${n - 1}|=1\,\text{V}$. Registre condições e investigue a diferença.`, { unit: 'V', tol: 0.001 }); }),
        order('Ordene o procedimento para inserir o amperímetro em série.', ['Desligar a alimentação', 'Abrir o ramo e verificar borne e faixa', 'Inserir o instrumento em série', 'Energizar e ler'], 'Primeiro desligue; depois configure e insira o instrumento no ramo, antes de energizar.'),
        mcq('Depois de medir corrente, antes de medir tensão, qual cuidado evita erro?', ['Mover a ponta para o borne de tensão e selecionar V', 'Manter a ponta no borne de corrente', 'Selecionar continuidade no circuito energizado', 'Unir as pontas à bateria'], 0, 'Retorne a ponta ao borne de tensão e confira a função e faixa antes de conectar.'),
      ] },
      { card: { title: 'Fonte e osciloscópio', body: t`Com a saída da fonte desligada, ajuste tensão e limite de corrente compatíveis com a carga, confira a polaridade e só então conecte e habilite a saída. Se a fonte indicar limitação inesperada, desligue e investigue.

No osciloscópio de bancada comum, a garra de referência costuma estar ligada ao terra de proteção e as terras dos canais são comuns. Conectá-la a ponto energizado que não seja o terra adequado pode causar curto. Confira manual, limites e atenuação da ponta; não remova o terra de proteção.`, tip: 'Para medições que exigem isolamento ou diferença entre pontos, use técnica e equipamento apropriados conforme o fabricante.' }, exercises: [
        mcq('Antes de conectar a fonte à carga, ajuste…', ['Tensão e limite de corrente adequados', 'Somente o brilho do visor', 'A resistência do cabo com rede ligada', 'A tensão acima do limite da carga'], 0, 'Ajuste tensão e limite de corrente com saída desligada e confira a polaridade.'),
        tf('A garra de terra de um osciloscópio de bancada comum pode estar ligada ao terra de proteção.', true, 'Em muitos modelos a garra e o terra de proteção são comuns; confirme no manual.'),
        mcq('A garra de terra do osciloscópio deve ser conectada…', ['Ao ponto de referência apropriado após verificar a ligação ao terra', 'A qualquer ponto da rede', 'Sempre ao terminal positivo', 'Sem verificar o circuito'], 0, 'A garra pode estar aterrada: confirme o caminho elétrico antes de conectar.'),
        inter('Ajuste o modelo de fonte para 4 V, saída ainda desligada.', 'plot', fonteLab().props, (v) => v?.p.x === 4, 'Ajuste V para 4.', 'O controle indica 4 V. Na bancada, confira ainda limite, polaridade e especificação da carga.'),
        gen((rng) => { const a = randInt(rng, 2, 7); return num(t`Na tela do osciloscópio, uma altura de $${a}$ divisões a $2\,\text{V/div}$ representa quantos V? Considere a atenuação já configurada.`, 2 * a, t`Altura vezes escala: $${a}\cdot 2=${2 * a}\,\text{V}$.`, { unit: 'V', tol: 0.001 }); }),
        tf('Retirar o terra de proteção do osciloscópio é uma forma recomendada de evitar curto.', false, 'Nunca remova o terra de proteção; use instrumento e método apropriados conforme o fabricante.'),
        mcq('A ponta está em 10×, mas o canal foi configurado para 1×. O que fazer?', ['Corrigir a configuração conforme a ponta e conferir o manual', 'Ignorar a diferença', 'Ligar a garra ao ponto de maior tensão', 'Aumentar a tensão até a tela encher'], 0, 'A atenuação da ponta deve corresponder à configuração do canal para a leitura ser correta.'),
      ] },
    ] },
    { id: 'of-banc-esq', title: 'Esquemáticos e datasheets', parts: [
      { card: { title: 'Do desenho às conexões', body: t`O esquemático mostra relações elétricas, não a posição física dos componentes. Fios no mesmo nó estão eletricamente conectados. Um ponto de junção indica conexão; cruzamentos sem ponto seguem a convenção do desenho. Rótulos iguais podem identificar o mesmo nó mesmo sem fio desenhado entre eles.

Terra (GND) pode ser apenas referência de $0\,\text{V}$ do circuito: não presuma que todo GND é isolado ou conectado ao terra de proteção.`, visual: dadosLab(), tip: 'O controle ilustra uma diferença de potencial em relação à referência, não o desenho físico dos fios.' }, exercises: [
        mcq('Qual é a principal informação de um esquemático?', ['Como os componentes estão eletricamente ligados', 'A posição exata de cada peça na mesa', 'A cor obrigatória dos jumpers', 'O fabricante de toda ferramenta'], 0, 'O esquemático descreve nós e ligações; a montagem física pode ter outro arranjo.'),
        tf('Dois pontos com o mesmo nome de nó em um esquemático podem estar conectados sem um fio desenhado entre eles.', true, 'Rótulos iguais identificam a mesma rede elétrica segundo a convenção do projeto.'),
        mcq('Em um desenho que usa ponto de junção, o ponto indica…', ['Conexão elétrica entre os fios', 'Um resistor invisível', 'Ausência de corrente em todos os fios', 'Um componente sempre aterrado'], 0, 'O ponto marca a junção dos condutores; confira a convenção do desenho.'),
        inter('Ajuste o modelo para uma diferença de 3 V em relação à referência de 0 V.', 'plot', dadosLab().props, (v) => v?.p.x === 3, 'Ajuste V para 3.', 'Uma diferença de potencial de 3 V em relação a 0 V corresponde ao ajuste de 3 V no modelo.'),
        gen((rng) => { const a = randInt(rng, 3, 9); const b = randInt(rng, 1, 2); return num(t`Um nó está em $${a}\,\text{V}$ e outro em $${b}\,\text{V}$ em relação ao mesmo GND. Qual a tensão do primeiro em relação ao segundo, em V?`, a - b, t`Subtraia potenciais na ordem pedida: $${a}-${b}=${a - b}\,\text{V}$.`, { unit: 'V', tol: 0.001 }); }),
        mcq('O símbolo GND garante, sozinho, isolação da rede?', ['Não; é preciso verificar o circuito e a fonte', 'Sim, em qualquer equipamento', 'Sim, desde que o fio seja preto', 'Sim, se o multímetro estiver desligado'], 0, 'GND indica referência ou rede definida no projeto; sua ligação física depende do equipamento.'),
        match('Associe a representação ao significado.', [['Ponto de junção', 'Fios conectados'], ['Rótulos de nó iguais', 'Mesma rede'], ['GND', 'Referência definida no circuito']], 'Os símbolos identificam a conectividade e a referência, não necessariamente a posição física.'),
      ] },
      { card: { title: 'Ler o datasheet', body: t`Localize o código completo, fabricante e encapsulamento. Leia a pinagem e observe se a figura é vista superior ou inferior; o mesmo nome de componente pode ter variantes. Confirme alimentação, polaridade e condições de operação recomendadas.

**Limites absolutos máximos** são limites de estresse, não valores normais de operação nem garantia de funcionamento. Compare também tensão, corrente, potência e temperatura nas condições indicadas; deixe margem.`, tip: 'Uma pinagem memorizada para outro encapsulamento não substitui o desenho do fabricante.' }, exercises: [
        mcq('O limite absoluto máximo é…', ['Um limite de estresse, não uma condição normal garantida', 'A tensão recomendada em qualquer situação', 'A tensão mínima de funcionamento', 'A corrente que sempre deve circular'], 0, 'Limites absolutos definem estresse permitido nas condições indicadas; use a faixa recomendada para operar.'),
        tf('O sentido da vista do desenho de pinagem importa.', true, 'Vista superior e inferior podem inverter a posição aparente dos pinos; siga a identificação no datasheet.'),
        mcq('Antes de confiar numa pinagem, confira…', ['Código, encapsulamento e orientação da vista', 'Somente a cor do corpo', 'A posição aleatória de um pino', 'Somente o preço da peça'], 0, 'Variantes e encapsulamentos podem ter pinagens diferentes; confirme o documento correspondente.'),
        gen((rng) => { const max = randInt(rng, 7, 10); const use = randInt(rng, 2, 5); return num(t`Um componente tem limite absoluto de $${max}\,\text{V}$ e a tensão proposta é $${use}\,\text{V}$. Qual a diferença em V?`, max - use, t`A diferença é $${max}-${use}=${max - use}\,\text{V}$. Estar abaixo do absoluto não comprova operação adequada: confira a faixa recomendada.`, { unit: 'V', tol: 0.001 }); }),
        mcq('Uma tensão está abaixo do máximo absoluto, mas acima da faixa recomendada. Qual conclusão?', ['A operação não está garantida nas condições recomendadas', 'O funcionamento é garantido', 'A pinagem deixa de importar', 'A peça necessariamente funciona para sempre'], 0, 'A faixa recomendada define condições de uso; o limite absoluto não assegura desempenho.'),
        order('Ordene a consulta antes de ligar um CI.', ['Identificar código e encapsulamento', 'Conferir vista e pinagem', 'Consultar condições recomendadas e limites', 'Revisar a montagem antes de alimentar'], 'Identifique a peça e sua vista, confira as condições e revise as conexões antes de alimentar.'),
        mcq('Um datasheet limita potência conforme a temperatura. Qual atitude é correta?', ['Verificar a condição térmica e a dissipação prevista', 'Usar o limite de temperatura ambiente para qualquer montagem', 'Ignorar o aquecimento se a tensão estiver correta', 'Inverter os terminais para reduzir potência'], 0, 'A potência admissível pode cair com a temperatura; avalie as condições e a dissipação.'),
      ] },
    ] },
    { id: 'of-banc-proto', title: 'Protoboard e boas práticas', parts: [
      { card: { title: 'Como as trilhas se conectam', body: t`Numa protoboard comum, grupos de cinco furos em cada lado da canaleta central formam nós separados; o padrão varia entre modelos. A canaleta permite instalar um CI DIP com uma fileira de pinos de cada lado. Trilhos laterais podem estar interrompidos no meio: confira com continuidade sem alimentação, em vez de presumir.

As marcações + e − são apenas rótulos: a polaridade é definida pela ligação real da fonte.`, visual: protoLab(), tip: 'O controle representa uma contagem de nós, não uma imagem das conexões da sua protoboard.' }, exercises: [
        mcq('Em uma protoboard comum, qual região separa as duas metades da área central?', ['A canaleta central', 'A cor dos jumpers', 'O rótulo do fabricante', 'O número da linha sozinho'], 0, 'A canaleta separa os grupos centrais e permite instalar CIs DIP atravessando-a.'),
        tf('Todo trilho lateral de toda protoboard é contínuo de ponta a ponta.', false, 'Alguns trilhos são interrompidos; confira o modelo com teste de continuidade desenergizado.'),
        mcq('Como instalar normalmente um CI DIP na área central?', ['Atravessando a canaleta central', 'Com todos os pinos no mesmo grupo de furos', 'Ligado diretamente à rede', 'Com as duas fileiras no mesmo nó'], 0, 'Ao atravessar a canaleta, as fileiras de pinos ficam em grupos separados.'),
        inter('No modelo, ajuste a contagem para 4 nós distintos.', 'plot', protoLab().props, (v) => v?.p.x === 4, 'Ajuste nós para 4.', 'O controle indica quatro nós; conexões reais devem ser verificadas na placa.'),
        gen((rng) => { const n = randInt(rng, 2, 6); return num(t`Há $${n}$ grupos independentes, cada um com 5 furos conectados. Quantos furos há nesses grupos?`, n * 5, t`$${n}\cdot 5=${n * 5}$ furos; grupos independentes continuam sendo nós distintos.`, { tol: 0.001 }); }),
        mcq('Dois terminais de um resistor entram no mesmo grupo de cinco furos. O que ocorre?', ['Ficam ligados ao mesmo nó e o resistor é contornado', 'O resistor passa a limitar toda a corrente da fonte', 'A resistência dobra', 'Os furos deixam de estar conectados'], 0, 'Os terminais compartilham o mesmo nó; não há diferença de potencial ideal no resistor.'),
        mcq('Como confirmar se um trilho lateral é dividido?', ['Com continuidade e circuito desenergizado', 'Tocando os polos da fonte', 'Pondo o amperímetro entre os polos', 'Supondo que a linha colorida seja contínua'], 0, 'Desenergize e teste continuidade entre os pontos do trilho; a marca impressa não garante ligação.'),
      ] },
      { card: { title: 'Montagem e diagnóstico', body: t`Traduza o esquemático em nós, não em distâncias. Monte com a alimentação desligada, confira polaridade de fonte e componentes, valor de resistores e pinagem dos CIs. Inspecione fios soltos, terminais adjacentes e possíveis curtos entre alimentação e GND; teste continuidade com a montagem desenergizada.

Energize por etapas com limite apropriado e compare tensões previstas e medidas. Se houver aquecimento, cheiro ou corrente inesperada, desligue e investigue antes de substituir peças.`, tip: 'Documente o circuito, as condições de teste e o par previsto versus medido.' }, exercises: [
        mcq('Antes de energizar uma montagem nova, qual revisão ajuda a evitar danos?', ['Conferir nós, polaridade e possíveis curtos', 'Aumentar o limite ao máximo', 'Ignorar a pinagem se o CI encaixou', 'Mover jumpers com a saída ligada'], 0, 'Compare ligações e polaridades com o esquemático e procure curtos antes de ligar.'),
        tf('As cores impressas nos trilhos definem automaticamente a polaridade elétrica.', false, 'As cores são rótulos; a polaridade depende da conexão efetiva da fonte.'),
        mcq('O LED não acende. Qual investigação inicial é adequada?', ['Desligar e conferir polaridade, resistor e conexões', 'Retirar o resistor e ligar direto à fonte', 'Aumentar indefinidamente a tensão', 'Unir os trilhos de alimentação'], 0, 'Desligue e compare montagem, polaridade e conexões com o esquemático antes de testar novamente.'),
        gen((rng) => { const n = randInt(rng, 2, 8); return num(t`Em um registro, o valor previsto é $${n}\,\text{V}$ e o medido é $${n + 1}\,\text{V}$. Qual a diferença absoluta em V?`, 1, t`$|${n + 1}-${n}|=1\,\text{V}$. Uma diferença pede investigação das condições e conexões.`, { unit: 'V', tol: 0.001 }); }),
        multi('Quais itens fazem parte de um diagnóstico inicial com a montagem desligada?', ['Inspecionar fios e polaridades', 'Conferir valores e pinagem', 'Testar continuidade quando adequado', 'Provocar curto na bateria'], [0, 1, 2], 'Inspeção e continuidade desenergizada ajudam a localizar falhas; provocar curto é perigoso.'),
        order('Ordene uma primeira energização disciplinada.', ['Montar com alimentação desligada', 'Inspecionar e verificar conexões', 'Ajustar fonte e limite de corrente', 'Energizar e comparar com o previsto'], 'Monte e inspecione sem energia, prepare a fonte e só então energize e compare leituras.'),
        mcq('Ao sentir cheiro de aquecimento inesperado, o que fazer?', ['Desligar e investigar antes de continuar', 'Tocar imediatamente no componente quente', 'Aumentar a corrente disponível', 'Deixar ligado para ver se melhora'], 0, 'Interrompa a alimentação e investigue com cuidado após a montagem esfriar.'),
      ] },
    ] },
  ],
};
