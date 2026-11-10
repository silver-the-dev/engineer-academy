import React from 'react';
import type { UnitDef } from '../../types';
import { code, gen, inter, match, mcq, num, order, plot, tf } from '../../helpers';
import { PolylineW } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { fmt, randInt } from '../../../lib/random';

const t = String.raw;

// O eixo horizontal conta intervalos de bit; a linha ociosa e o stop são altos.
const uartLab = () => plot({
  view: { xMin: -1, xMax: 12, yMin: -0.4, yMax: 1.5 }, grid: false,
  params: [{ key: 'byte', label: 'byte', min: 0, max: 15, step: 1, value: 5, color: C.p2 }],
  render: ({ p }: any) => {
    const bits = Array.from({ length: 8 }, (_, i) => (p.byte >> i) & 1);
    const parity = bits.reduce((a, b) => a + b, 0) % 2;
    const levels = [1, 0, ...bits, parity, 1];
    const pts: [number, number][] = [[-1, levels[0]]];
    levels.forEach((v, i) => { if (i) pts.push([i - 1, levels[i - 1]], [i - 1, v]); pts.push([i, v]); });
    return <PolylineW pts={pts} color={C.p2} width={3} />;
  },
  info: ({ p }: any) => `8E1: repouso, start, 8 dados LSB primeiro, paridade par, stop. Byte = ${p.byte}.`,
}, 200);

// Um byte genérico, transmitido MSB primeiro; os controles alteram os dados.
const byteLab = (label: string) => plot({
  view: { xMin: 0, xMax: 8, yMin: -0.4, yMax: 1.5 }, grid: false,
  params: [{ key: 'valor', label, min: 0, max: 15, step: 1, value: 3, color: C.p3 }],
  render: ({ p }: any) => {
    const bits = Array.from({ length: 8 }, (_, i) => (p.valor >> (7 - i)) & 1);
    const pts: [number, number][] = [[0, bits[0]]];
    bits.forEach((b, i) => { if (i) pts.push([i, bits[i - 1]], [i, b]); pts.push([i + 1, b]); });
    return <PolylineW pts={pts} color={C.p3} width={3} />;
  },
  info: ({ p }: any) => `Da esquerda para a direita, MSB primeiro: ${p.valor.toString(2).padStart(8, '0')}.`,
}, 200);

const spiLab = () => plot({
  view: { xMin: 0, xMax: 4, yMin: -0.4, yMax: 1.5 }, grid: false,
  params: [
    { key: 'cpol', label: 'CPOL', min: 0, max: 1, step: 1, value: 0, color: C.p2 },
    { key: 'cpha', label: 'CPHA', min: 0, max: 1, step: 1, value: 0, color: C.p3 },
  ],
  render: ({ p }: any) => {
    const a = p.cpol, b = 1 - a;
    const pts: [number, number][] = [[0, a]];
    for (let i = 1; i <= 8; i++) {
      const previous = i % 2 ? a : b;
      pts.push([i / 2, previous], [i / 2, 1 - previous]);
    }
    return <PolylineW pts={pts} color={C.p2} width={3} />;
  },
  info: ({ p }: any) => `Repouso: ${p.cpol}. Modo ${2 * p.cpol + p.cpha}: amostre na ${p.cpha ? 'segunda' : 'primeira'} borda de cada ciclo.`,
}, 200);

const setByte = (target: number, context: string) => inter(
  `Ajuste o controle para representar ${target} ${context}.`, 'plot', byteLab('valor').props,
  (v) => v.p.valor === target, `valor = ${target}`,
  `O controle determina o byte; ${target} em binário é ${target.toString(2).padStart(8, '0')}, da esquerda para a direita.`,
);
const countGen = (thing: string, factor: number, unit: string) => gen((rng) => {
  const n = randInt(rng, 2, 8);
  return num(`Cada ${thing} usa ${factor} ${unit}. Para ${n}, quantos ${unit} são necessários?`, n * factor,
    `${n} × ${factor} = ${n * factor} ${unit}.`, { unit });
});

export const comunicacao: UnitDef = {
  id: 'mc-com', title: 'Comunicação e periféricos', icon: '🔗',
  subtitle: 'UART, I²C, SPI, displays e diagnóstico',
  source: 'Roteiro Eletrônica 12 meses · mês 7 — Comunicação, Protocolos e Displays',
  guide: t`UART assíncrona: $T_{bit}=1/baud$; em 8N1 são 10 bits por byte. I²C: endereço de 7 bits seguido de R/W e ACK no nono clock. SPI: CPOL define repouso e CPHA a borda de amostragem. Confira tensões, terra comum e configuração antes de decodificar sinais.`,
  lessons: [
    {
      id: 'mc-com-uart', title: 'UART', parts: [
        { card: { title: 'Quadro UART bit a bit', body: t`UART é assíncrona: não há clock compartilhado. Em **8E1**, a linha em repouso fica em 1; vêm start 0, oito bits de dados do menos significativo ao mais significativo, paridade par e stop 1. Paridade par completa uma quantidade par de bits 1 nos dados e na paridade. Mova o byte e acompanhe os intervalos no gráfico.`, visual: uartLab(), example: 'Para 5, os dados são 1, 0, 1, 0, 0, 0, 0, 0; a paridade par é 0.' },
          exercises: [
            mcq('Qual nível indica o start UART usual?', ['0', '1', 'alta impedância', 'alternado'], 0, 'O transmissor leva a linha de repouso alto para baixo no start.'),
            tf('Os dados UART usuais saem pelo bit menos significativo primeiro.', true, 'O bit 0 sai antes do bit 7.'),
            order('Ordene os campos de um quadro 8E1 após o repouso.', ['Start', '8 dados', 'Paridade', 'Stop'], 'O start precede os dados, a paridade e o stop.'),
            num('Em 8E1, quantos bits há no quadro, incluindo start e stop?', 11, '1 + 8 + 1 + 1 = 11 bits.', { unit: 'bits' }),
            mcq('No byte 5, qual é a sequência dos quatro primeiros bits de dados transmitidos?', ['1, 0, 1, 0', '0, 1, 0, 1', '0, 0, 0, 1', '1, 1, 0, 0'], 0, '5 = 00000101 em ordem usual; da direita para a esquerda saem 1, 0, 1, 0.'),
            gen((rng) => { const n = randInt(rng, 1, 15); const parity = n.toString(2).split('1').length - 1; return num(`Em 8E1, qual bit de paridade par completa o byte ${n}? Digite 0 ou 1.`, parity % 2, `O byte tem ${parity} bits 1; a paridade é ${parity % 2} para completar um total par.`); }),
            inter('Ajuste o byte UART para 9 e observe seus bits no gráfico.', 'plot', uartLab().props, (v) => v.p.byte === 9, 'byte = 9', '9 = 00001001: os bits 0 e 3 são 1; a paridade par é 0.'),
          ] },
        { card: [{ title: 'Velocidade e ligação', body: t`Em UART binária, o baud rate é a taxa de bits na linha: $T_{bit}=1/B$. Em 9600 baud, cada bit dura aproximadamente $104,17\,\mu\text{s}$. Em 8N1, cada byte ocupa 10 bits; sem intervalos, a vazão útil máxima é $B/10$ bytes/s. Cruze TX com RX e compartilhe GND, respeitando níveis de tensão.`, visual: code('void setup() {\n  Serial.begin(9600);\n}\nvoid loop() {\n  Serial.println("Oi");\n  delay(1000);\n}', [2], 'Arduino: UART') }],
          exercises: [
            mcq('Na ligação entre duas UARTs, TX de uma vai a qual pino da outra?', ['RX', 'TX', 'VCC', 'clock'], 0, 'O transmissor alimenta a entrada receptora RX; compartilhe também GND.'),
            tf('Duas UARTs com taxas ou formatos incompatíveis podem produzir dados corrompidos.', true, 'As duas pontas precisam concordar sobre baud, dados, paridade e stop.'),
            num('A 1000 baud, qual o tempo de bit em ms?', 1, '1/1000 s = 1 ms.', { unit: 'ms' }),
            num('A 9600 baud em 8N1, qual a vazão máxima sem pausas em bytes/s?', 960, 'Cada byte ocupa 10 bits; 9600/10 = 960 bytes/s.', { unit: 'bytes/s' }),
            countGen('quadro 8N1', 10, 'bits'),
            mcq('A 9600 baud, quanto dura aproximadamente um quadro 8N1?', ['1,04 ms', '0,104 ms', '10,4 ms', '96 ms'], 0, '10/9600 s = 1,0417 ms.'),
            mcq('O terminal mostra caracteres sem sentido apesar do GND comum. Qual ajuste conferir primeiro?', ['Baud e formato dos dois lados', 'Cor do fio', 'Tamanho da tela', 'Nome do arquivo'], 0, 'Baud ou formato diferentes deslocam a amostragem e alteram os dados.'),
          ] },
      ],
    },
    {
      id: 'mc-com-i2c', title: 'I²C', parts: [
        { card: { title: 'Endereço e reconhecimento', body: 'I²C usa SDA para dados e SCL para clock. Após START, o controlador envia endereço de 7 bits, MSB primeiro, seguido de R/W: 0 escreve e 1 lê. No nono clock o receptor confirma com ACK baixo; NACK é alto. STOP encerra a transação.', visual: byteLab('byte'), example: 'Endereço 0x3C: byte de escrita 0x78 e byte de leitura 0x79. APIs frequentemente recebem só 0x3C.' },
          exercises: [
            mcq('Qual linha transporta o clock I²C?', ['SCL', 'SDA', 'TX', 'CS'], 0, 'SCL é o clock; SDA transporta os dados.'),
            tf('No campo R/W, 1 solicita leitura.', true, 'R/W = 1 indica leitura do periférico pelo controlador.'),
            num('Quantos bits tem o endereço I²C comum, sem contar R/W?', 7, 'O endereço tem 7 bits; R/W ocupa o oitavo bit enviado.', { unit: 'bits' }),
            mcq('Qual nível representa ACK no nono clock?', ['Baixo', 'Alto', 'Alternado', 'Desconectado sempre'], 0, 'O receptor puxa SDA para baixo durante o nono clock para confirmar.'),
            order('Ordene uma escrita simples após START.', ['Endereço + W', 'ACK do endereço', 'Byte de dados', 'ACK dos dados', 'STOP'], 'O receptor confirma cada byte no nono clock antes do STOP.'),
            gen((rng) => { const a = randInt(rng, 8, 15); return num(`Endereço de 7 bits ${a} decimal: qual o byte de endereço de escrita em decimal?`, 2 * a, `Desloque o endereço uma posição e acrescente W = 0: 2 × ${a} = ${2 * a}.`); }),
            setByte(7, 'no byte observado, em decimal'),
          ] },
        { card: { title: 'Pull-ups e barramento', body: t`As saídas I²C usuais são dreno aberto: puxam a linha para baixo ou a liberam. Resistores de pull-up levam SDA e SCL ao nível alto. Em $3,3\,\text{V}$ com $3,3\,\text{k}\Omega$, a corrente ideal em nível baixo é $1\,\text{mA}$. A capacitância e a resistência influenciam a subida; confira limites dos dispositivos e tensão do barramento.`, visual: code('#include <Wire.h>\nvoid setup() {\n  Wire.begin();\n  Wire.beginTransmission(0x3C);\n  byte erro = Wire.endTransmission();\n}', [4, 5], 'Sonda de endereço') },
          exercises: [
            mcq('O que puxa SDA para alto quando todos a liberam?', ['Resistor de pull-up', 'Bit de stop sozinho', 'Resistor ao GND', 'Clock interno do display'], 0, 'O pull-up liga a linha à alimentação apropriada quando ninguém a puxa para baixo.'),
            tf('Dois periféricos I²C de mesmo endereço fixo podem responder juntos à mesma seleção.', true, 'Ambos reconhecem o mesmo endereço; é preciso mudar um endereço ou isolar o barramento.'),
            num('Em 3,3 V, com pull-up de 3,3 kΩ e nível baixo ideal de 0 V, qual corrente em mA?', 1, 'I = 3,3 V / 3,3 kΩ = 1 mA.', { unit: 'mA' }),
            gen((rng) => { const r = randInt(rng, 2, 6); return num(`Com 3 V e pull-up de ${r} kΩ, supondo nível baixo ideal, qual corrente em mA? Dê 2 casas decimais.`, 3 / r, `I = 3/${r} mA; arredondando, ${fmt(3 / r, 2)} mA.`, { unit: 'mA', tol: 0.005 }); }),
            mcq('Por que não usar um pull-up arbitrariamente pequeno?', ['Pode exceder a corrente que a saída consegue drenar', 'Elimina todo o clock', 'Troca o endereço', 'Inverte R/W'], 0, 'Resistência menor aumenta a corrente em nível baixo; respeite o limite do dispositivo.'),
            mcq('Um scanner não encontra o módulo. Qual conjunto verificar?', ['Alimentação, GND, SDA/SCL e pull-ups', 'Somente o nome da variável', 'Somente o monitor serial', 'Somente o formato do cartão'], 0, 'Sem alimentação, referência comum, conexões e níveis corretos não há resposta confiável.'),
            tf('Uma API que pede endereço de 7 bits deve receber 0x78 para um dispositivo de endereço 0x3C.', false, '0x78 é o byte de escrita na linha; a API de 7 bits recebe 0x3C.'),
          ] },
      ],
    },
    {
      id: 'mc-com-spi', title: 'SPI', parts: [
        { card: { title: 'Linhas e seleção', body: 'SPI usa SCK, dados do controlador para o periférico (MOSI), dados no sentido contrário (MISO) e seleção CS. Em geral cada periférico tem CS próprio, ativo em nível baixo. O clock é gerado pelo controlador; envio e recepção podem ocorrer simultaneamente.', visual: byteLab('dados') },
          exercises: [
            mcq('Qual linha leva dados do controlador ao periférico?', ['MOSI', 'MISO', 'SCK', 'CS'], 0, 'MOSI significa saída do controlador e entrada do periférico.'),
            tf('SPI pode enviar e receber bits simultaneamente.', true, 'MOSI e MISO são linhas separadas e podem operar no mesmo clock.'),
            match('Associe as linhas às funções.', [['SCK', 'Clock'], ['CS', 'Seleção'], ['MISO', 'Dados para o controlador']], 'SCK sincroniza; CS seleciona; MISO devolve dados.'),
            num('Quantos pulsos de clock transferem um byte SPI comum?', 8, 'Um pulso por bit: 8 pulsos por byte.', { unit: 'pulsos' }),
            countGen('byte SPI', 8, 'pulsos'),
            setByte(10, 'no byte MOSI de exemplo'),
            mcq('Dois dispositivos SPI comuns compartilham SCK, MOSI e MISO. Como selecioná-los separadamente?', ['Use um CS para cada dispositivo', 'Una seus CS e ative ambos', 'Remova o GND', 'Troque MOSI por alimentação'], 0, 'CS independente permite selecionar apenas o periférico desejado.'),
          ] },
        { card: { title: 'CPOL e CPHA', body: 'CPOL define o nível de repouso do clock; CPHA define a borda de amostragem: 0 na primeira borda após o repouso, 1 na segunda. Modo = 2 × CPOL + CPHA. No modo 0, o repouso é baixo e a amostragem ocorre na borda de subida. Ajuste os controles para explorar os quatro modos.', visual: spiLab(), tip: 'Primeira e segunda são relativas ao início do ciclo; não significam sempre subida e descida.' },
          exercises: [
            mcq('Com CPOL = 1, qual é o nível de repouso de SCK?', ['Alto', 'Baixo', 'Sempre alternado', 'Indefinido'], 0, 'CPOL = 1 mantém SCK alto em repouso.'),
            tf('CPHA = 0 amostra na primeira borda do ciclo.', true, 'A primeira borda parte do nível de repouso definido por CPOL.'),
            num('Qual é o número do modo com CPOL = 1 e CPHA = 0?', 2, 'Modo = 2 × 1 + 0 = 2.'),
            gen((rng) => { const cpol = randInt(rng, 0, 1), cpha = randInt(rng, 0, 1); return num(`Com CPOL = ${cpol} e CPHA = ${cpha}, qual é o modo SPI?`, 2 * cpol + cpha, `Modo = 2 × ${cpol} + ${cpha} = ${2 * cpol + cpha}.`); }),
            mcq('No modo 2, em qual borda ocorre a amostragem?', ['Descida', 'Subida', 'Em ambas', 'Sem borda'], 0, 'Modo 2 tem CPOL = 1 e CPHA = 0: primeira borda sai do alto para baixo.'),
            inter('Ajuste o gráfico para o modo 3.', 'plot', spiLab().props, (v) => v.p.cpol === 1 && v.p.cpha === 1, 'CPOL = 1 e CPHA = 1', 'Modo 3 = 2 × 1 + 1; o repouso é alto e a amostra ocorre na segunda borda.'),
            mcq('Controlador e periférico usam modos SPI diferentes. Qual efeito é possível?', ['Amostragem na borda errada e dados incorretos', 'Endereço I²C muda', 'A alimentação dobra', 'O byte sempre é corrigido'], 0, 'A borda de amostragem pode cair durante uma transição de dados; configure o modo exigido.'),
          ] },
      ],
    },
    {
      id: 'mc-com-disp', title: 'Displays e armazenamento', parts: [
        { card: [{ title: 'Display e RTC', body: 'Um OLED pode usar I²C ou SPI conforme o módulo. No I²C, display e RTC podem compartilhar SDA/SCL quando seus endereços não conflitam. Confira tensão, pinagem e controlador do display; bibliotecas e endereços dependem do módulo.', visual: byteLab('dados') }, { title: 'Atualização da tela', body: 'Atualize apenas quando houver novos dados ou em uma cadência definida. Um buffer permite compor a imagem antes de enviá-la, reduzindo cintilação em muitos displays.', visual: code('if (agora - anterior >= 1000) {\n  anterior = agora;\n  atualizarTela();\n}', undefined, 'Atualização periódica') }],
          exercises: [
            mcq('Para que serve um RTC?', ['Manter data e hora', 'Converter SPI em UART sempre', 'Alimentar o display', 'Substituir todos os sensores'], 0, 'O RTC mantém uma contagem de data e hora; alguns modelos têm bateria de backup.'),
            tf('OLED e RTC I²C podem compartilhar as linhas quando usam endereços diferentes.', true, 'O endereço seleciona o destinatário no barramento compartilhado.'),
            num('Uma tela de 16 colunas por 2 linhas tem quantas posições de caracteres?', 32, '16 × 2 = 32 posições.', { unit: 'posições' }),
            countGen('linha de 16 caracteres', 16, 'posições'),
            setByte(6, 'como byte de dados para o display'),
            mcq('Qual cuidado reduz cintilação ao atualizar um display?', ['Compor em buffer e atualizar na cadência necessária', 'Apagar e redesenhar continuamente sem necessidade', 'Retirar o GND', 'Enviar dados em tensão incompatível'], 0, 'Compor antes e atualizar somente quando necessário reduz redesenhos visíveis.'),
            mcq('O RTC com bateria compatível perde a hora após desligar a placa. O que verificar?', ['Bateria, configuração e alimentação de backup', 'Somente o tamanho do texto', 'Somente a cor do OLED', 'O baud da UART apenas'], 0, 'Uma bateria ausente ou descarregada, ou configuração inadequada, pode interromper a contagem.'),
          ] },
        { card: { title: 'EEPROM e cartão SD', body: 'EEPROM não volátil guarda dados após desligar, mas suas células têm vida útil de escrita limitada. Um cartão SD pode armazenar registros em arquivo, por exemplo CSV, acessado por SPI com CS próprio. Confirme tensão, inicialização, erros de escrita e fechamento do arquivo.', visual: code('File f = SD.open("dados.csv",\n                 FILE_WRITE);\nif (f) {\n  f.println("12:00,25.3");\n  f.close();\n}', [3, 5], 'Exemplo Arduino: SD') },
          exercises: [
            mcq('Qual memória mantém dados sem alimentação?', ['EEPROM', 'Registrador volátil', 'RAM comum', 'Pino de entrada'], 0, 'EEPROM é não volátil e conserva dados após desligar.'),
            tf('Células EEPROM têm limite de ciclos de escrita especificado pelo fabricante.', true, 'Evite regravar continuamente a mesma célula e consulte a especificação.'),
            num('Um registro ocupa 16 bytes. Quantos bytes ocupam 4 registros?', 64, '4 × 16 = 64 bytes, sem contar metadados.', { unit: 'bytes' }),
            countGen('registro de 12 bytes', 12, 'bytes'),
            mcq('Para que fechar um arquivo depois de escrever?', ['Finalizar a operação e permitir gravar dados pendentes', 'Alterar o endereço I²C', 'Aumentar a tensão do cartão', 'Criar clock UART'], 0, 'Fechar permite que a biblioteca finalize a gravação; ainda é necessário tratar falhas e alimentação.'),
            mcq('Qual linha separa dois campos em um CSV que usa vírgulas?', ['12:00,25.3', '12:00 25.3 sem separador definido', '12:0025.3', '12:00|25.3 sem configurar delimitador'], 0, 'Neste exemplo a vírgula separa os campos de horário e leitura.'),
            mcq('Em um registrador com RTC I²C e SD SPI, como evitar conflito de seleção?', ['Endereçar o RTC e usar CS apropriado para o SD', 'Ligar SDA ao CS sem configuração', 'Ativar todos os CS permanentemente', 'Eliminar o terra comum'], 0, 'O RTC é selecionado por endereço I²C; o SD por CS no barramento SPI.'),
          ] },
      ],
    },
    {
      id: 'mc-com-debug', title: 'Depuração e analisador lógico', parts: [
        { card: { title: 'Do sintoma à hipótese', body: 'Comece por alimentação, GND comum, tensão e pinagem; depois confira configuração de protocolo e código. Um analisador lógico registra níveis digitais ao longo do tempo. Ajuste limiar e taxa de amostragem conforme o sinal e o instrumento; ele não substitui o osciloscópio para medir detalhes analógicos.', visual: byteLab('amostra') },
          exercises: [
            mcq('Qual ferramenta registra vários sinais digitais ao longo do tempo?', ['Analisador lógico', 'Chave de fenda', 'Dissipador', 'Fusível'], 0, 'O analisador captura canais digitais e pode decodificar protocolos.'),
            tf('A referência GND do analisador deve estar ligada ao GND do circuito medido.', true, 'A referência comum permite interpretar os níveis em relação ao circuito.'),
            mcq('Qual instrumento é mais apropriado para inspecionar a forma analógica de uma borda?', ['Osciloscópio', 'Editor de texto', 'Compilador', 'Relógio RTC'], 0, 'O osciloscópio mostra tensão no tempo e ajuda a investigar subida, ruído e overshoot.'),
            gen((rng) => { const f = randInt(rng, 1, 5); return num(`Um sinal tem períodos de ${f} ms. Qual a duração de 4 períodos em ms?`, 4 * f, `4 × ${f} = ${4 * f} ms.`, { unit: 'ms' }); }),
            setByte(11, 'como valor da captura digital'),
            mcq('Um periférico não responde. Qual primeira verificação é mais útil?', ['Alimentação, GND e pinagem', 'Alterar todas as bibliotecas ao acaso', 'Aumentar o tamanho da fonte', 'Apagar os registros de erro'], 0, 'Sem alimentação, referência e conexões corretas, a comunicação não funciona.'),
            mcq('Por que uma captura com poucas amostras por bit pode enganar?', ['Pode perder transições e posicionar bordas incorretamente', 'Garante o valor analógico exato', 'Muda fisicamente o protocolo', 'Corrige automaticamente o ruído'], 0, 'A resolução temporal insuficiente pode ocultar pulsos ou deslocar as bordas detectadas.'),
          ] },
        { card: { title: 'Decodificando uma captura', body: 'Em UART, detecte o start baixo e amostre perto do centro de cada bit, lendo os oito dados LSB primeiro. Confira o stop alto e a taxa. O gráfico mostra 8E1, com paridade; em 8N1 não há esse bit. Para I²C, identifique START, endereço + R/W, ACK e STOP; em SPI, configure CPOL, CPHA e CS antes de interpretar.', visual: uartLab(), example: 'Dados amostrados na ordem 1, 0, 1, 0, 0, 0, 0, 0 formam 00000101 em ordem usual: decimal 5.' },
          exercises: [
            mcq('Após o start UART, onde é preferível amostrar cada bit?', ['Perto do centro do intervalo', 'Exatamente na transição', 'Antes do start', 'Somente no stop'], 0, 'No centro há mais margem contra erros de temporização e transições.'),
            tf('Um stop baixo quando se espera stop alto pode indicar erro de enquadramento.', true, 'O receptor esperava nível alto no intervalo de stop; configuração ou sinal pode estar errado.'),
            num('Dados UART amostrados LSB primeiro: 1, 1, 0, 0, 0, 0, 0, 0. Qual valor decimal?', 3, 'Os bits 0 e 1 valem 1: 1 + 2 = 3.'),
            gen((rng) => { const bit = randInt(rng, 0, 3); return num(`Uma captura UART tem somente o bit de dados ${bit} em 1; os demais são 0. Qual o valor decimal?`, 2 ** bit, `O peso do bit ${bit} é 2^${bit} = ${2 ** bit}.`); }),
            inter('Ajuste o quadro UART para o valor 10 e compare os dados LSB primeiro.', 'plot', uartLab().props, (v) => v.p.byte === 10, 'byte = 10', '10 = 00001010; saem 0, 1, 0, 1, 0, 0, 0, 0 e a paridade par é 0.'),
            mcq('No byte I²C 0x79, qual endereço de 7 bits e operação?', ['0x3C, leitura', '0x79, escrita', '0x3C, escrita', '0x78, leitura'], 0, '0x79 deslocado à direita dá 0x3C; o bit menos significativo 1 indica leitura.'),
            mcq('O decodificador SPI mostra bytes errados, mas há pulsos e CS. O que conferir?', ['Modo CPOL/CPHA, ordem dos bits e taxa de captura', 'Só a cor dos fios', 'Somente o nome do projeto', 'O valor da bateria do RTC'], 0, 'Uma borda ou ordem de bits incorreta muda a interpretação; captura insuficiente também perde informação.'),
          ] },
      ],
    },
  ],
};
