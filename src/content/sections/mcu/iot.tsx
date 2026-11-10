import type { UnitDef } from '../../types';
import { code, gen, inter, match, mcq, num, order, tf } from '../../helpers';
import { fnLab } from '../../visuals';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;

// Modelos idealizados para explorar relações antes de medir o hardware real.
const lab = (label: string, max: number, value: number, factor: number, yMax: number) => fnLab({
  f: (x, p) => factor * p.k * x,
  params: [{ key: 'k', label, min: 0, max, step: 1, value }],
  view: { xMin: 0, xMax: 1, yMin: 0, yMax },
  info: (p) => t`No extremo direito: $${fmt(factor * p.k)}$.`,
});
const adcLab = () => lab('código (milhares)', 4, 1, 1, 4);
const redeLab = () => lab('mensagens/min', 10, 2, 1, 10);
const energiaLab = () => lab('duty (%)', 10, 2, 1, 10);
const rtosLab = () => lab('períodos', 10, 2, 1, 10);
const produtoLab = () => lab('amostras', 10, 2, 1, 10);

export const iot: UnitDef = {
  id: 'mc-iot', title: 'ESP32 e Internet das Coisas', icon: '📶',
  subtitle: 'Do microcontrolador conectado ao produto',
  source: 'Roadmap Eletrônica — meses 10 a 12',
  guide: t`Confira a tensão dos pinos e adapte níveis. No modelo ideal de 12 bits há $4096$ códigos, de $0$ a $4095$. MQTT usa broker, tópicos e QoS; HTTP usa requisições e respostas. Para estimar bateria, $I_{méd}=dI_{ativo}+(1-d)I_{sono}$ e $T\approx C/I_{méd}$. Defina tarefas, filas, requisitos e testes antes de integrar o produto.`,
  lessons: [
    {
      id: 'mc-iot-esp', title: 'ESP32: o que muda em relação ao Arduino', parts: [
        {
          card: { title: 'Portar também é conferir tensões', body: t`Arduino é uma plataforma que inclui várias placas; compare aqui o Uno clássico de $5\,\text{V}$ com uma placa ESP32 típica de lógica $3,3\,\text{V}$. O ESP32 oferece Wi-Fi, Bluetooth e outros periféricos; pinos e recursos variam entre modelos. Antes de migrar, consulte o esquema da placa e os limites do chip. Um sinal de $5\,\text{V}$ não deve ser aplicado diretamente a uma entrada de $3,3\,\text{V}$ sem verificar tolerância. Use conversão de nível adequada e terra comum.`, visual: adcLab() },
          exercises: [
            mcq('Qual conectividade é comum no ESP32?', ['Wi-Fi e Bluetooth', 'Apenas cabo serial', 'Somente rádio AM', 'Nenhuma'], 0, 'Muitos ESP32 integram Wi-Fi e Bluetooth; confirme os recursos da variante.'),
            tf('Um pino de entrada de 3,3 V pode sempre receber 5 V diretamente.', false, 'A tolerância depende do componente; tensão acima do limite pode danificar a entrada.'),
            match('Associe a ação à finalidade:', [['Consultar o pinout', 'identificar funções e restrições'], ['Conversor de nível', 'adaptar tensões de sinal'], ['Terra comum', 'definir referência compartilhada']], 'Pinout informa os pinos; conversão adapta sinais e o terra comum estabelece a referência.'),
            num(t`Um divisor ideal tem $R_{alto}=10\,\text{k}\Omega$ e $R_{baixo}=20\,\text{k}\Omega$, alimentado por $4,5\,\text{V}$. Qual a saída em V, com uma casa decimal?`, 3, t`$V_{out}=4,5\cdot20/(10+20)=3,0\,\text{V}$.`, { unit: 'V', tol: 0.05 }),
            gen((rng) => { const v = randInt(rng, 2, 5) * 2; return num(t`Um divisor ideal de dois resistores iguais recebe $${v}\,\text{V}$. Qual a saída em V, sem casas decimais?`, v / 2, t`Resistores iguais dividem a tensão pela metade: $${v}/2=${v / 2}\,\text{V}$.`, { unit: 'V', tol: 0.5 }); }),
            mcq('Para um barramento bidirecional, qual abordagem é mais apropriada?', ['Usar conversor de nível adequado ao barramento', 'Ligar sempre 5 V diretamente', 'Remover o terra comum', 'Trocar sinais por alimentação'], 0, 'Um conversor adequado à direção, velocidade e tipo de saída do barramento adapta os níveis.'),
            tf('Ao migrar um projeto, os números e funções dos pinos devem ser conferidos.', true, 'Pinagem, ADC, PWM e restrições variam entre placas e modelos.'),
          ],
        },
        {
          card: [{ title: 'ADC ideal de 12 bits', body: t`Um ADC de $12$ bits representa $2^{12}=4096$ códigos, de $0$ a $4095$. Neste modelo didático, $c\approx4095V/V_{FS}$; na prática atenuação, calibração, não linearidade e faixa permitida dependem do chip. Não suponha que $3,3\,\text{V}$ seja sempre o fundo de escala.`, visual: code('const int pino = 34;\nvoid setup() {\n  Serial.begin(115200);\n}\nvoid loop() {\n  int leitura = analogRead(pino);\n  Serial.println(leitura);\n  delay(1000);\n}', [6], 'Leitura ilustrativa') }],
          exercises: [
            num('Quantos códigos existem em 12 bits? Responda em códigos inteiros.', 4096, t`$2^{12}=4096$ códigos.`, { unit: 'códigos', tol: 0.5 }),
            num('Qual é o maior código sem sinal em 12 bits? Responda em códigos inteiros.', 4095, t`Os códigos começam em zero: $4096-1=4095$.`, { unit: 'códigos', tol: 0.5 }),
            tf('Um ADC real pode exigir calibração para melhorar a estimativa de tensão.', true, 'Referência, atenuação e não linearidade afetam a leitura real.'),
            inter('No gráfico ideal, ajuste o controle para representar 3 milhares de códigos no extremo direito.', 'plot', adcLab().props, (v) => v.p.k === 3, 'Ajuste para 3.', 'Em x = 1, a altura coincide com o controle: 3 milhares.'),
            num(t`No modelo $c=4095V/V_{FS}$, com $V_{FS}=3,0\,\text{V}$ e $V=1,0\,\text{V}$, qual o código inteiro?`, 1365, t`$4095\cdot1/3=1365$.`, { unit: 'códigos', tol: 0.5 }),
            gen((rng) => { const n = randInt(rng, 1, 3); return num(t`Um ADC ideal de 12 bits usa $V_{FS}=4\,\text{V}$. Para $V=${n}\,\text{V}$, estime o código inteiro mais próximo.`, Math.round(4095 * n / 4), t`$c=4095\cdot${n}/4\approx${Math.round(4095 * n / 4)}$.`, { unit: 'códigos', tol: 0.5 }); }),
            mcq('Uma leitura analógica instável pede qual investigação?', ['Referência, ruído, faixa e aterramento', 'Supor que o sensor é digital', 'Aplicar 5 V sem verificar', 'Ignorar a calibração'], 0, 'Verifique o sinal e seus limites, alimentação, referência e ruído antes de interpretar o código.'),
          ],
        },
      ],
    },
    {
      id: 'mc-iot-wifi', title: 'Wi-Fi, HTTP e MQTT', parts: [
        {
          card: { title: 'Do rádio à aplicação', body: t`Wi-Fi conecta o dispositivo a uma rede. HTTP organiza requisições e respostas: um cliente pode pedir uma leitura a um servidor. Uma API remota exige conectividade além da rede local. Em HTTPS, TLS protege a comunicação quando certificados são validados. O gráfico mostra mensagens acumuladas em um minuto, supondo taxa constante; mova o controle.`, visual: redeLab() },
          exercises: [
            mcq('Qual componente faz uma requisição HTTP?', ['Cliente', 'Resistor', 'ADC', 'Capacitor'], 0, 'O cliente envia uma requisição e o servidor responde.'),
            tf('Estar conectado ao Wi-Fi garante acesso à internet.', false, 'A rede local pode estar sem rota ou acesso à internet.'),
            match('Associe:', [['Wi-Fi', 'acesso sem fio à rede'], ['HTTP', 'requisição e resposta'], ['TLS', 'proteção do canal com validação']], 'Wi-Fi fornece acesso à rede; HTTP organiza a troca e TLS protege o canal quando bem configurado.'),
            gen((rng) => { const n = randInt(rng, 2, 8); return num(t`Um sensor envia $${n}$ requisições por minuto durante $5$ minutos. Quantas requisições inteiras?`, n * 5, t`$${n}\cdot5=${n * 5}$ requisições.`, { unit: 'requisições', tol: 0.5 }); }),
            inter('Ajuste a taxa para 6 mensagens por minuto; no fim de um minuto o gráfico mostra 6 mensagens.', 'plot', redeLab().props, (v) => v.p.k === 6, 'Ajuste para 6.', 'Em um minuto, a quantidade é igual à taxa por minuto.'),
            mcq('Se a API não responde, o firmware deve:', ['tratar tempo limite e tentar novamente com espera', 'travar indefinidamente', 'ignorar qualquer erro', 'aumentar a tensão do pino'], 0, 'Timeout e nova tentativa espaçada evitam bloqueio indefinido e excesso de tráfego.'),
            tf('Desativar a validação de certificado elimina a autenticação confiável do servidor.', true, 'Sem validar o certificado, um intermediário pode se passar pelo servidor.'),
          ],
        },
        {
          card: { title: 'Publicar e assinar', body: t`No MQTT, clientes publicam mensagens em tópicos e um broker as encaminha aos assinantes correspondentes. QoS 0 entrega no máximo uma vez; QoS 1, pelo menos uma vez e pode duplicar; QoS 2 usa protocolo para entrega exatamente uma vez naquele trecho MQTT. A entrega fim a fim depende também da aplicação, sessão e configuração.`, visual: code('// Exemplo conceitual: biblioteca MQTT\ncliente.publish("casa/temp", "24");\ncliente.subscribe("casa/comando");', undefined, 'Tópicos') },
          exercises: [
            mcq('Quem encaminha mensagens MQTT aos assinantes?', ['Broker', 'ADC', 'Sensor analógico', 'Regulador'], 0, 'O broker recebe publicações e encaminha conforme as assinaturas.'),
            match('Associe o QoS à garantia do protocolo:', [['QoS 0', 'no máximo uma vez'], ['QoS 1', 'pelo menos uma vez'], ['QoS 2', 'exatamente uma vez no trecho']], 'QoS 0 não confirma entrega; QoS 1 permite duplicação; QoS 2 usa uma troca adicional para evitar duplicação no trecho.'),
            tf('QoS 1 pode resultar em mensagens duplicadas.', true, 'A retransmissão pode entregar a mesma mensagem mais de uma vez.'),
            gen((rng) => { const n = randInt(rng, 2, 9); return num(t`Um publicador envia $${n}$ leituras para cada um de $3$ assinantes conectados ao mesmo tópico. Sem perdas ou duplicatas, quantas entregas o broker faz?`, 3 * n, t`$${n}\cdot3=${3 * n}$ entregas.`, { unit: 'entregas', tol: 0.5 }); }),
            mcq('Qual tópico descreve melhor leituras de temperatura da sala?', ['casa/sala/temperatura', '5 V', 'analogRead()', '4095 Ω'], 0, 'Um caminho hierárquico identifica origem e grandeza sem confundi-las com valores.'),
            order('Ordene o caminho de uma leitura publicada:', ['Sensor mede', 'Cliente publica no tópico', 'Broker encaminha', 'Assinante recebe'], 'O dispositivo mede e publica; o broker encaminha ao cliente inscrito.'),
            mcq('Para um comando que não deve ser executado duas vezes com QoS 1, o que ajuda?', ['Identificador e tratamento de duplicatas na aplicação', 'Supor que duplicatas são impossíveis', 'Usar um tópico vazio', 'Desligar o broker'], 0, 'Identificadores e operações idempotentes permitem reconhecer retransmissões.'),
          ],
        },
      ],
    },
    {
      id: 'mc-iot-energia', title: 'Baterias e economia de energia', parts: [
        {
          card: { title: 'Corrente média e duty cycle', body: t`Capacidade em mAh é corrente vezes tempo. Se o sistema fica ativo por fração $d$ do ciclo, $I_{méd}=dI_{ativo}+(1-d)I_{sono}$. Use correntes medidas do conjunto, inclusive regulador e periféricos. No gráfico, o controle representa o duty em porcentagem; a altura no extremo direito corresponde à porcentagem.`, visual: energiaLab() },
          exercises: [
            mcq('O que representa 1 mAh?', ['1 mA durante 1 h', '1 mA por segundo', '1 V durante 1 h', '1 W por segundo'], 0, 'mAh é unidade de carga: corrente em mA multiplicada por tempo em horas.'),
            num('Um nó acorda 2 s a cada 100 s. Qual duty cycle em %, sem casas decimais?', 2, t`$d=2/100=0,02=2\%$.`, { unit: '%', tol: 0.5 }),
            tf('A corrente de sono deve entrar na média, mesmo que seja pequena.', true, 'Ela atua durante a parte do ciclo em que o dispositivo dorme.'),
            inter('Ajuste o duty para 5% no controle.', 'plot', energiaLab().props, (v) => v.p.k === 5, 'Ajuste para 5.', 'O controle está em porcentagem; 5 representa 5%.'),
            num(t`Um nó usa $100\,\text{mA}$ durante $10\%$ do ciclo e $1\,\text{mA}$ no restante. Qual a corrente média em mA, com uma casa decimal?`, 10.9, t`$0,1\cdot100+0,9\cdot1=10,9\,\text{mA}$.`, { unit: 'mA', tol: 0.05 }),
            gen((rng) => { const active = randInt(rng, 2, 9) * 10; return num(t`Um nó usa $${active}\,\text{mA}$ por $10\%$ do tempo e $0\,\text{mA}$ no restante, em modelo ideal. Qual a média em mA, sem casas decimais?`, active / 10, t`$I_{méd}=0,1\cdot${active}=${active / 10}\,\text{mA}$.`, { unit: 'mA', tol: 0.5 }); }),
            mcq('Para reduzir consumo médio sem perder leituras necessárias, uma possibilidade é:', ['reduzir o tempo ativo e medir o resultado', 'manter o rádio ligado permanentemente', 'ignorar a corrente de repouso', 'aumentar a frequência de envio sem avaliar'], 0, 'Menor tempo ativo pode reduzir a média; valide se ainda atende aos requisitos.'),
          ],
        },
        {
          card: { title: 'Deep sleep e autonomia', body: t`Em deep sleep, partes do sistema são desligadas e uma fonte configurada pode acordá-lo; os detalhes variam por modelo. Com capacidade utilizável $C$ em mAh e corrente média em mA, $T\approx C/I_{méd}$ em horas. É uma estimativa: temperatura, descarga, regulador, picos e capacidade útil alteram o resultado. Meça a autonomia.`, visual: code('// Pseudocódigo: ciclo de baixo consumo\nlerSensor();\nenviarLeitura();\nconfigurarDespertar();\nentrarEmSonoProfundo();', undefined, 'Ciclo de operação') },
          exercises: [
            tf('Deep sleep pode reduzir o consumo entre leituras.', true, 'Desligar partes do sistema durante a espera reduz o consumo, dependendo da implementação.'),
            num(t`Uma bateria fornece $1200\,\text{mAh}$ úteis e o nó consome em média $10\,\text{mA}$. Estime a autonomia em horas inteiras.`, 120, t`$T=1200/10=120\,\text{h}$.`, { unit: 'h', tol: 0.5 }),
            num(t`Quantos dias correspondem a $120\,\text{h}$? Responda em dias inteiros.`, 5, t`$120/24=5$ dias.`, { unit: 'dias', tol: 0.5 }),
            gen((rng) => { const i = randInt(rng, 2, 8); return num(t`Com $${i * 200}\,\text{mAh}$ úteis e corrente média de $${i}\,\text{mA}$, estime a autonomia em horas inteiras.`, 200, t`$T=${i * 200}/${i}=200\,\text{h}$.`, { unit: 'h', tol: 0.5 }); }),
            mcq('Por que medir o consumo da placa completa?', ['Regulador e periféricos também consomem', 'Só o processador consome', 'A bateria gera corrente fixa em qualquer carga', 'mAh mede tensão'], 0, 'LEDs, reguladores, sensores e perdas podem dominar o consumo em repouso.'),
            order('Ordene um ciclo periódico:', ['Acordar', 'Medir sensor', 'Transmitir leitura', 'Configurar despertar e dormir'], 'Ao acordar, mede-se e transmite-se; depois prepara-se o próximo despertar e entra-se em sono.'),
            mcq('Uma estimativa ideal de 120 h deve ser apresentada como:', ['previsão a validar por medição', 'garantia exata em qualquer temperatura', 'tensão da bateria', 'tempo independente da capacidade'], 0, 'A capacidade útil e o consumo real variam; a medição valida o orçamento.'),
          ],
        },
      ],
    },
    {
      id: 'mc-iot-rtos', title: 'Tarefas e noções de RTOS', parts: [
        {
          card: { title: 'Concorrência e prioridades', body: t`Um RTOS organiza tarefas e suas prioridades. Uma tarefa pronta de maior prioridade normalmente preemp­ta outra de menor prioridade no mesmo núcleo, conforme o escalonador; tarefas bloqueadas aguardam evento ou tempo. Prioridade alta não torna uma tarefa mais rápida e pode privar as demais de CPU. O gráfico conta execuções periódicas ideais ao longo de um intervalo.`, visual: rtosLab() },
          exercises: [
            mcq('O que uma tarefa bloqueada faz?', ['Aguarda uma condição ou prazo', 'Ocupa sempre toda a CPU', 'Apaga a memória', 'Muda a tensão do pino'], 0, 'Uma tarefa bloqueada não está pronta para executar enquanto aguarda evento ou tempo.'),
            tf('Uma tarefa sempre pronta e de alta prioridade pode impedir outra de baixa prioridade de executar.', true, 'No mesmo núcleo, a tarefa de menor prioridade pode sofrer inanição.'),
            num('Uma tarefa roda uma vez por segundo durante 10 segundos, começando após 1 s. Quantas execuções inteiras?', 10, 'Ela executa nos instantes 1, 2, ..., 10 s: 10 vezes.', { unit: 'execuções', tol: 0.5 }),
            inter('Ajuste o controle para 8 períodos no intervalo representado.', 'plot', rtosLab().props, (v) => v.p.k === 8, 'Ajuste para 8.', 'No extremo direito, o número de períodos é o valor do controle.'),
            gen((rng) => { const n = randInt(rng, 2, 9); return num(t`Uma tarefa periódica executa uma vez a cada $${n}\,\text{s}$, começando após o primeiro período. Quantas execuções em $${n * 4}\,\text{s}$?`, 4, t`$${n * 4}/${n}=4$ execuções.`, { unit: 'execuções', tol: 0.5 }); }),
            mcq('Qual tarefa merece prioridade conforme uma análise de prazo?', ['A que tem prazo crítico e precisa responder rapidamente', 'Sempre a que imprime mais texto', 'Sempre a criada primeiro', 'Sempre a que usa mais memória'], 0, 'Prioridades devem refletir prazos, tempo de execução e política do sistema.'),
            tf('Em um sistema com mais de um núcleo, a análise de concorrência deve considerar em qual núcleo cada tarefa pode executar.', true, 'Afinidade e disponibilidade de núcleos afetam o escalonamento.'),
          ],
        },
        {
          card: { title: 'Filas e cooperação', body: t`Uma fila permite que uma tarefa produtora passe dados a uma consumidora. Defina o que acontece se a fila estiver cheia ou vazia. Evite trabalho longo em interrupções; sinalize uma tarefa com a API apropriada ao contexto. Proteja dados compartilhados e evite esperas ocupadas.`, visual: code('// Pseudocódigo de duas tarefas\nvoid sensor() {\n  amostra = ler();\n  filaEnviar(amostra);\n  aguardarPeriodo();\n}\nvoid tela() {\n  valor = filaReceber();\n  atualizarTela(valor);\n}', undefined, 'Produtor e consumidor') },
          exercises: [
            mcq('Qual é o papel da fila entre sensor e tela?', ['Transferir amostras entre tarefas', 'Aumentar a tensão', 'Converter Wi-Fi em ADC', 'Substituir a bateria'], 0, 'A fila desacopla produção e consumo das amostras.'),
            tf('Uma fila finita pode encher se o produtor gerar dados mais rápido que o consumidor.', true, 'A diferença acumula itens até atingir a capacidade; é preciso definir a política para fila cheia.'),
            num('Uma fila vazia recebe 8 amostras e entrega 5. Quantas restam, em amostras inteiras?', 3, t`$8-5=3$ amostras.`, { unit: 'amostras', tol: 0.5 }),
            gen((rng) => { const n = randInt(rng, 5, 9); return num(t`Uma fila vazia recebe $${n}$ itens e entrega $2$. Quantos itens inteiros restam?`, n - 2, t`$${n}-2=${n - 2}$ itens.`, { unit: 'itens', tol: 0.5 }); }),
            order('Ordene o fluxo da amostra:', ['Sensor mede', 'Produtor envia à fila', 'Consumidor recebe da fila', 'Tela é atualizada'], 'O produtor mede e envia; o consumidor recebe e atualiza a tela.'),
            mcq('Uma interrupção precisa avisar uma tarefa. Qual prática ajuda?', ['Sinalizar com API própria para interrupção e sair rapidamente', 'Esperar a rede dentro da interrupção', 'Imprimir continuamente na interrupção', 'Desativar todas as tarefas'], 0, 'Uma sinalização apropriada transfere o trabalho mais longo para uma tarefa.'),
            mcq('Ao compartilhar dados mutáveis entre tarefas, qual cuidado é necessário?', ['Sincronizar acesso para evitar corrida', 'Supor acesso sempre simultâneo e seguro', 'Remover a fila sem análise', 'Aumentar a tensão do GPIO'], 0, 'Sincronização ou passagem de dados por fila evita leituras e escritas conflitantes.'),
          ],
        },
      ],
    },
    {
      id: 'mc-iot-prod', title: 'Do protótipo ao produto', parts: [
        {
          card: { title: 'Requisitos antes da montagem', body: t`Defina entradas, saídas, ambiente, alimentação, autonomia e critérios mensuráveis. Desenhe o caminho sensor → firmware → rede → interface e liste falhas possíveis. Um requisito verificável informa condição e limite; por exemplo, registrar uma leitura a cada 10 s. O gráfico representa a contagem de amostras durante um ensaio.`, visual: produtoLab() },
          exercises: [
            mcq('Qual é um requisito verificável?', ['Registrar uma leitura a cada 10 s', 'Ser muito bom', 'Ter desempenho mágico', 'Ser moderno'], 0, 'O intervalo de 10 s pode ser medido e comparado ao requisito.'),
            match('Associe o bloco à função:', [['Sensor', 'mede a grandeza'], ['Firmware', 'processa e transmite'], ['Interface', 'mostra dados ao usuário']], 'O sensor mede, o firmware trata os dados e a interface os apresenta.'),
            tf('A alimentação e a faixa de operação devem constar na especificação.', true, 'Elas determinam limites de projeto e condições dos testes.'),
            inter('Ajuste o gráfico para 7 amostras no fim do ensaio.', 'plot', produtoLab().props, (v) => v.p.k === 7, 'Ajuste para 7.', 'A contagem no fim do ensaio é igual ao ajuste.'),
            gen((rng) => { const n = randInt(rng, 2, 9); return num(t`Um ensaio tem $${n}$ ciclos com $4$ leituras por ciclo. Quantas leituras inteiras são esperadas?`, n * 4, t`$${n}\cdot4=${n * 4}$ leituras.`, { unit: 'leituras', tol: 0.5 }); }),
            order('Ordene o desenvolvimento inicial:', ['Definir necessidade', 'Escrever requisitos mensuráveis', 'Desenhar arquitetura', 'Implementar e testar'], 'A necessidade orienta requisitos; eles guiam arquitetura, implementação e testes.'),
            mcq('Qual decisão precisa considerar o ambiente de uso?', ['Escolha de caixa e proteção dos conectores', 'Nome da variável apenas', 'Ordem alfabética dos arquivos apenas', 'Cor do gráfico apenas'], 0, 'Umidade, temperatura, acesso e esforços orientam caixa e conectores.'),
          ],
        },
        {
          card: { title: 'Validar, recuperar e documentar', body: t`Um checklist de produto inclui revisão de esquemático e PCB (ERC/DRC), alimentação e proteção, integração mecânica, testes funcionais e de borda, consumo medido, falhas de rede e sensor, recuperação, segurança de credenciais, atualização e documentação. Registre condições, resultado esperado e medido; corrija e repita os testes.`, visual: code('// Pseudocódigo: recuperação\nif (!sensorValido()) {\n  registrarFalha();\n  sinalizarErro();\n}\nif (!redeDisponivel()) {\n  tentarDepois();\n}', undefined, 'Falhas previstas') },
          exercises: [
            mcq('O que um plano de testes deve registrar?', ['Condição, resultado esperado e resultado medido', 'Apenas o nome do produto', 'Somente testes aprovados', 'Somente a cor da caixa'], 0, 'Condições e resultados permitem reproduzir e avaliar cada teste.'),
            tf('Desligar a rede durante um teste ajuda a avaliar a recuperação.', true, 'A falha injetada permite observar timeout, reconexão e comportamento da interface.'),
            num('Em 20 testes, 17 passaram. Quantos falharam, em testes inteiros?', 3, t`$20-17=3$ testes falharam.`, { unit: 'testes', tol: 0.5 }),
            gen((rng) => { const total = randInt(rng, 12, 20); const falhas = randInt(rng, 1, 4); return num(t`Em $${total}$ testes, $${total - falhas}$ passaram. Quantos testes inteiros falharam?`, falhas, t`$${total}-${total - falhas}=${falhas}$ falhas.`, { unit: 'testes', tol: 0.5 }); }),
            match('Associe a verificação ao objetivo:', [['ERC/DRC', 'identificar problemas de projeto elétrico e layout'], ['Teste de consumo', 'confrontar autonomia prevista'], ['Falha de sensor', 'verificar detecção e resposta']], 'Cada verificação cobre um risco: projeto, energia ou comportamento diante de falha.'),
            order('Após detectar falha em teste, ordene as ações:', ['Registrar condições e resultado', 'Investigar a causa', 'Corrigir', 'Repetir o teste'], 'O registro permite reproduzir; depois investiga-se, corrige-se e verifica-se novamente.'),
            mcq('Qual conjunto facilita reproduzir o produto?', ['Esquemático, arquivos da placa, firmware e instruções', 'Somente uma foto', 'Somente o nome do sensor', 'Uma senha fixa publicada'], 0, 'Arquivos de hardware, firmware e instruções de montagem e teste permitem reproduzir e manter o projeto.'),
          ],
        },
      ],
    },
  ],
};
