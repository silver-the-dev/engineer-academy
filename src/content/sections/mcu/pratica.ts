import { codePuzzle as puzzle, functionLab as fn, type PracticeByLesson } from '../../codePractice';

export const mcuPractice: PracticeByLesson = {
  'mc-ard-arq': [
    puzzle('Monte o esqueleto do Arduino. Primeiro vem a inicialização única, depois a rotina de leitura repetida.',
      ['void setup() {', '  inicializar();', '}', 'void loop() {', '  lerSensor();', '}'], ['  inicializar(); lerSensor();'], 'setup roda uma vez. loop é chamado repetidamente.'),
  ],
  'mc-ard-gpio': [
    puzzle('Monte a inicialização do LED no pino 13. Configure como saída antes de escrever nível alto.',
      ['void setup() {', '  pinMode(13, OUTPUT);', '  digitalWrite(13, HIGH);', '}'], ['  pinMode(13, INPUT);', '  digitalWrite(13, LOW);'], 'Configure a direção antes de escrever o nível.'),
  ],
  'mc-ard-adc': [
    fn('Simule a lógica do brilho. Converta uma leitura de 0 a 1023 em PWM de 0 a 255, usando divisão inteira por 4.',
      'brilho(int adc)', 'return adc;', 'return adc / 4;', [[[0], 0], [[511], 127], [[512], 128], [[1023], 255]], 'A divisão inteira descarta a fração e agrupa quatro códigos de ADC por nível PWM.'),
  ],
  'mc-ard-tempo': [
    fn('Um LED deve alternar a partir de 500 ms desde a última troca. Implemente a decisão para tempos simulados sem volta do contador.',
      'alternar(int agora, int anterior)', 'return agora >= 500;', 'return agora - anterior >= 500;', [[[499, 0], 0], [[1500, 1000], 1], [[1499, 1000], 0], [[900, 400], 1]], 'O que interessa é a diferença entre agora e a referência, incluindo exatamente 500 ms.'),
  ],
  'mc-ard-int': [
    fn('Simule o filtro do botão. Aceite uma transição se o nível mudou e o novo nível ficou estável por pelo menos 20 ms.',
      'aceita(int antigo, int novo, int ms)', 'return antigo != novo;', 'return antigo != novo && ms >= 20;', [[[0, 1, 19], 0], [[0, 1, 20], 1], [[1, 1, 25], 0], [[1, 0, 30], 1]], 'As duas condições precisam valer: nível diferente e tempo mínimo de estabilidade.'),
  ],
  'mc-sens-anal': [
    fn('Simule o controle de luz: devolva 1 se o código do ADC estiver abaixo de 250. O limite de 250 ainda deve devolver 0.',
      'luz(int adc)', 'return adc > 250;', 'return adc < 250;', [[[0], 1], [[249], 1], [[250], 0], [[1023], 0]], 'O exercício usa um sensor cuja leitura diminui no escuro. A comparação estrita exclui 250.'),
  ],
  'mc-sens-dig': [
    fn('Converta a ida e volta do ultrassom em centímetros inteiros. Use a aproximação de 58 microssegundos por centímetro.',
      'distancia(int tempo)', 'return tempo * 58;', 'return tempo / 58;', [[[58], 1], [[580], 10], [[1161], 20]], 'A constante já considera o percurso de ida e volta. Divida o tempo por 58.'),
  ],
  'mc-sens-motor': [
    puzzle('Monte a partida de uma ponte H com pinos configurados. Com a ponte desabilitada, defina o sentido A alto e B baixo e então aplique PWM.',
      ['analogWrite(EN, 0);', 'digitalWrite(A, HIGH);', 'digitalWrite(B, LOW);', 'analogWrite(EN, velocidade);'],
      ['digitalWrite(B, HIGH);', 'analogWrite(EN, 255);'], 'Desabilitar a ponte antes de definir o sentido evita uma partida durante a troca de níveis.'),
  ],
  'mc-sens-carga': [
    puzzle('Monte o trecho para controlar um MOSFET ativo em nível alto, com pino já configurado. Primeiro desligue; só ligue quando a proteção permitir.',
      ['digitalWrite(GATE, LOW);', 'if (protecaoOk) {', '  digitalWrite(GATE, HIGH);', '}'],
      ['if (!protecaoOk) {', '  digitalWrite(GATE, LOW);'], 'A saída parte desligada e só recebe HIGH dentro da condição de segurança.'),
  ],
  'mc-sens-alim': [
    fn('Calcule a carga consumida em mA·s num ciclo de 10 s: 80 mA durante ativo segundos e 2 mA no resto.',
      'carga(int ativo)', 'return 80 * ativo;', 'return 80 * ativo + 2 * (10 - ativo);', [[[0], 20], [[1], 98], [[5], 410], [[10], 800]], 'Some a contribuição de cada fase: corrente multiplicada pela sua duração.'),
  ],
  'mc-com-uart': [
    puzzle('Monte a configuração e o envio de uma linha pela serial. Configure 9600 bit/s e envie o valor seguido de nova linha.',
      ['Serial.begin(9600);', 'Serial.println(valor);'], ['Serial.begin(115200);', 'Serial.print(valor);'], 'A taxa deve coincidir nos dois lados. println encerra a linha.'),
  ],
  'mc-com-i2c': [
    puzzle('Monte a escrita de um valor no registrador reg do dispositivo com endereço de 7 bits 0x48. Envie o registrador antes do valor.',
      ['Wire.beginTransmission(0x48);', 'Wire.write(reg);', 'Wire.write(valor);', 'Wire.endTransmission();'],
      ['Wire.beginTransmission(0x90);', 'Wire.requestFrom(0x48, 1);'], 'A biblioteca recebe o endereço de 7 bits. Encerre a transmissão depois dos dois bytes.'),
  ],
  'mc-com-spi': [
    puzzle('Com a transação SPI já configurada, selecione o periférico por CS ativo baixo, transfira um byte e libere CS.',
      ['digitalWrite(CS, LOW);', 'SPI.transfer(dado);', 'digitalWrite(CS, HIGH);'],
      ['SPI.transfer(0);', 'digitalRead(CS);'], 'O periférico precisa estar selecionado durante a transferência inteira.'),
  ],
  'mc-com-disp': [
    puzzle('O display LCD já foi iniciado. Apague a tela, posicione na primeira coluna da segunda linha e escreva a mensagem.',
      ['lcd.clear();', 'lcd.setCursor(0, 1);', 'lcd.print("Pronto");'],
      ['lcd.setCursor(1, 0);', 'lcd.print("Erro");'], 'setCursor recebe coluna e linha, ambas a partir de zero.'),
  ],
  'mc-com-debug': [
    fn('Decodifique o bit mais baixo de um byte capturado no analisador. A função deve devolver apenas 0 ou 1.',
      'bit0(int byte)', 'return byte >> 1;', 'return byte & 1;', [[[0], 0], [[1], 1], [[164], 0], [[255], 1]], 'A máscara 1 apaga todos os bits exceto o menos significativo.'),
  ],
  'mc-iot-esp': [
    puzzle('Monte a leitura de um sensor no ESP32. Primeiro configure a resolução de 12 bits; depois obtenha o código bruto.',
      ['analogReadResolution(12);', 'int bruto = analogRead(pino);'], ['analogReadResolution(8);', 'int bruto = digitalRead(pino);'], 'Em 12 bits, o código bruto tem 4096 valores possíveis.'),
  ],
  'mc-iot-wifi': [
    puzzle('Organize a lógica de publicação MQTT: mantenha o cliente ativo, confira a conexão e publique somente se estiver conectado.',
      ['mqtt.loop();', 'if (mqtt.connected()) {', '  mqtt.publish("sensor/valor", mensagem);', '}'],
      ['if (!mqtt.connected()) {', '  mqtt.subscribe("sensor/valor");'], 'loop mantém a sessão; publish envia ao tópico. Esta montagem não usa a rede.'),
  ],
  'mc-iot-energia': [
    fn('Em um período de 100 ms, estime a corrente média inteira: 100 mA enquanto ativo, 0 mA durante o sono neste modelo simplificado.',
      'media(int ativo_ms)', 'return 100;', 'return 100 * ativo_ms / 100;', [[[0], 0], [[5], 5], [[25], 25], [[100], 100]], 'Divida a carga do intervalo pela sua duração total.'),
  ],
  'mc-iot-rtos': [
    puzzle('Monte a tarefa consumidora. Em cada iteração, espere uma mensagem da fila e processe somente se a leitura deu certo.',
      ['for (;;) {', '  if (xQueueReceive(fila, &valor, portMAX_DELAY) == pdTRUE) {', '    processar(valor);', '  }', '}'],
      ['  if (xQueueReceive(fila, &valor, 0) == pdFALSE) {', '    processar(0);'], 'A fila permite aguardar dados sem ficar consultando o estado em um laço ocupado.'),
  ],
  'mc-iot-prod': [
    fn('Escreva um autoteste para a leitura simulada do sensor. Retorne 1 para qualquer código de ADC entre 0 e 4095, incluindo as duas extremidades.',
      'validar(int leitura)', 'return leitura >= 0;', 'return leitura >= 0 && leitura <= 4095;', [[[-1], 0], [[0], 1], [[4095], 1], [[4096], 0]], 'Cheque os limites inferior e superior. Os testes incluem os valores de borda e os imediatamente fora.'),
  ],
};
