import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { code, fill, gen, match, mcq, multi, num, order, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { CodeBlock } from '../../../components/visuals/Code';
import { TableView } from '../../../components/visuals/Misc';
import { randInt } from '../../../lib/random';

const compileStepper = (): VisualSpec => {
  const rows = [
    ['1. Fonte (.rs)', 'Texto escrito por você', 'src/main.rs'],
    ['2. Front-end rustc', 'Checa tipos e posse (E0xxx)', 'AST / MIR validado'],
    ['3. Back-end LLVM', 'Otimiza e gera binário', 'Código de máquina'],
    ['4. Execução', 'Roda direto na CPU sem GC', 'Saída no terminal'],
  ];
  const infos = [
    'Passo 1: você escreve `src/main.rs` em texto puro. Nada roda ainda.',
    'Passo 2: o `rustc` analisa sintaxe, tipos e regras de memória **antes** de gerar o programa.',
    'Passo 3: aprovado na checagem, o compilador traduz tudo para instruções nativas do processador.',
    'Passo 4: o sistema operacional executa o binário direto na CPU, sem interpretador nem coletor de lixo.',
  ];
  return {
    name: 'stepper',
    props: {
      steps: 4,
      labels: ['1. Fonte', '2. Verificação', '3. Binário', '4. Execução'],
      render: (k: number, width: number) => (
        <TableView
          width={width}
          head={['Etapa', 'O que acontece', 'Resultado']}
          rows={rows}
          highlight={[k]}
        />
      ),
      info: (k: number) => infos[k],
    },
  };
};

const cargoWorkflowStepper = (): VisualSpec => {
  const rows = [
    ['cargo check', 'Muito rápida', 'Nenhum (só valida)', 'Achar erros enquanto programa'],
    ['cargo fmt', 'Instantânea', 'Reescreve .rs', 'Padronizar 4 espaços e estilo'],
    ['cargo clippy', 'Rápida', 'Nenhum (analisa)', 'Caçar maus hábitos e avisos'],
    ['cargo build --release', 'Mais lenta', 'target/release/', 'Binário final super otimizado'],
  ];
  const infos = [
    '1. `cargo check` confere tipos e empréstimos sem gastar tempo gerando o executável.',
    '2. `cargo fmt` formata todo o projeto automaticamente segundo o padrão oficial.',
    '3. `cargo clippy -- -D warnings` aponta melhorias e trata qualquer aviso como erro.',
    '4. `cargo build --release` aplica otimizações pesadas para rodar em velocidade máxima.',
  ];
  return {
    name: 'stepper',
    props: {
      steps: 4,
      labels: ['1. check', '2. fmt', '3. clippy', '4. release'],
      render: (k: number, width: number) => (
        <TableView
          width={width}
          head={['Comando', 'Velocidade', 'Saída', 'Objetivo']}
          rows={rows}
          highlight={[k]}
        />
      ),
      info: (k: number) => infos[k],
    },
  };
};

const printlnStepper = (): VisualSpec => {
  const src = [
    'fn main() {',
    '    let volts = 12;',
    '    let pins = [2, 4];',
    '    println!("V = {} V", volts);',
    '    println!("Pinos: {:?}", pins);',
    '}',
  ].join('\n');
  const highlights = [[1], [2], [3], [4], [5]];
  const memRows = [
    [['—', '—', '(nenhuma linha impressa)']],
    [['volts: i32', '12', '(nenhuma linha impressa)']],
    [
      ['volts: i32', '12', '(nenhuma linha impressa)'],
      ['pins: [i32; 2]', '[2, 4]', '(nenhuma linha impressa)'],
    ],
    [
      ['volts: i32', '12', 'V = 12 V'],
      ['pins: [i32; 2]', '[2, 4]', ''],
    ],
    [
      ['volts: i32', '12', 'V = 12 V'],
      ['pins: [i32; 2]', '[2, 4]', 'Pinos: [2, 4]'],
    ],
  ];
  const infos = [
    'A execução começa na abertura de `fn main()`.',
    'Na linha 2, `volts` guarda o inteiro `12` na pilha (stack).',
    'Na linha 3, `pins` guarda o array `[2, 4]` na pilha.',
    'Na linha 4, `{}` usa a formatação `Display` e imprime `V = 12 V`.',
    'Na linha 5, `{:?}` usa a formatação `Debug` para inspecionar o array: `Pinos: [2, 4]`.',
  ];
  return {
    name: 'stepper',
    props: {
      steps: 5,
      labels: ['Início', 'Linha 2', 'Linha 3', 'Linha 4 ({})', 'Linha 5 ({:?})'],
      render: (k: number, width: number) => (
        <>
          <CodeBlock width={width} code={src} highlight={highlights[k]} title="src/main.rs" />
          <TableView
            width={width}
            head={['Variável (pilha)', 'Valor', 'Saída no terminal']}
            rows={memRows[k]}
          />
        </>
      ),
      info: (k: number) => infos[k],
    },
  };
};

const errorAnatomyStepper = (): VisualSpec => {
  const diag = [
    'error[E0384]: cannot assign twice to',
    '              immutable variable `x`',
    ' --> src/main.rs:3:5',
    '  |',
    '2 |     let x = 5;',
    '  |         - first assignment to `x`',
    '3 |     x = 6;',
    '  |     ^^^^^ cannot assign twice',
    '  |',
    'help: consider making this mutable',
    '  |',
    '2 |     let mut x = 5;',
    '  |         +++',
  ].join('\n');
  const hl = [
    [1, 2],
    [3],
    [5, 6, 7, 8],
    [10, 12, 13],
  ];
  const infos = [
    '1. **Código e resumo**: `E0384` identifica a regra violada (reatribuir variável imutável). Você pode rodar `rustc --explain E0384`.',
    '2. **Localização exata**: `--> src/main.rs:3:5` aponta o arquivo, a linha 3 e a coluna 5.',
    '3. **Histórico visual**: o traço `-` na linha 2 mostra onde `x` nasceu imutável, e `^^^^^` na linha 3 mostra a tentativa ilegal de mudá-lo.',
    '4. **Sugestão pronta (`help:`)**: o compilador mostra exatamente o que acrescentar (`mut` na linha 2) para o código compilar.',
  ];
  return {
    name: 'stepper',
    props: {
      steps: 4,
      labels: ['1. Código E0384', '2. Arquivo:Linha', '3. Setas ^^^', '4. Dica help:'],
      render: (k: number, width: number) => (
        <CodeBlock width={width} code={diag} highlight={hl[k]} title="Saída do rustc" />
      ),
      info: (k: number) => infos[k],
    },
  };
};

export const rustInicio: UnitDef = {
  id: 'rb-inicio',
  title: 'Primeiros passos com Rust e Cargo',
  icon: '🚀',
  subtitle: 'Por que Rust, ferramentas Cargo, primeiro programa e mensagens do compilador',
  source: 'The Rust Programming Language (Edição 2024) · Cap. 1 — Getting Started',
  extra: true,
  guide: [
    '• **Compilação antecipada (AOT)**: o `rustc` traduz arquivos `.rs` diretamente para código de máquina nativo, sem precisar de máquina virtual nem coletor de lixo (GC).',
    '• **Segurança em tempo de compilação**: erros que em C causam comportamento indefinido em produção (ponteiro pendurado, uso após liberação, corrida de dados) são barrados pelo compilador antes de gerar o executável.',
    '• **Ecossistema Cargo**: `cargo new` cria o pacote (`Cargo.toml` + `src/main.rs`), `cargo check` valida rápido, `cargo run` compila e executa, `cargo build --release` otimiza, `cargo fmt` formata e `cargo clippy -- -D warnings` exige zero avisos.',
    '• **Anatomia básica**: todo executável começa em `fn main()`. A macro `println!` (com `!`) usa `{}` para exibição (`Display`) e `{:?}` para depuração (`Debug`).',
    '• **Lendo o compilador**: diagnósticos trazem código `E0xxx` (consultável com `rustc --explain E0xxx`), posição `--> arquivo:linha:coluna`, sublinhado `^^^` e sugestão `help:`.',
  ].join('\n'),
  lessons: [
    {
      id: 'rb-inicio-pq',
      title: 'Por que Rust',
      parts: [
        {
          card: [
            {
              title: 'O que é compilar um programa',
              body: [
                'O processador do seu computador ou microcontrolador só entende instruções binárias (código de máquina).',
                '',
                'Assim como o C, o **Rust** é uma linguagem de **compilação antecipada** (*ahead-of-time*): o compilador `rustc` lê o seu arquivo `.rs` e gera um executável nativo completo antes de você rodar o programa.',
                '',
                'Se você copiar esse executável para outro computador compatível, ele roda sozinho — mesmo que aquela máquina não tenha o Rust instalado.',
              ].join('\n'),
              visual: code(
                [
                  'fn main() {',
                  '    // Traduzido para código nativo',
                  '    println!("Olá, engenharia!");',
                  '}',
                ].join('\n'),
                [1, 3],
                'main.rs',
              ),
              tip: 'Diferente de linguagens interpretadas linha a linha, em Rust nenhum código executável é gerado se houver qualquer erro de sintaxe, de tipo ou de memória.',
            },
            {
              title: 'Do código-fonte à execução',
              body: 'Avance pelos passos abaixo para ver como o arquivo `.rs` vira um programa rodando direto no processador.',
              visual: compileStepper(),
            },
          ],
          exercises: [
            mcq(
              'O que significa dizer que o Rust usa compilação antecipada (*ahead-of-time*)?',
              [
                'O código `.rs` é traduzido para um executável nativo antes de o programa rodar',
                'Cada linha é traduzida apenas no instante em que o usuário clica na tela',
                'O programa precisa do navegador web aberto para traduzir as funções',
                'O código-fonte não passa por verificação antes de ir para o processador',
              ],
              0,
              'Na compilação antecipada (AOT), o compilador `rustc` analisa todo o programa e gera o binário nativo de máquina antes da execução começar.',
            ),
            tf(
              'Para executar um binário já compilado em Rust em outro computador do mesmo sistema, é obrigatório instalar o `rustc` nessa outra máquina.',
              false,
              'Como o `rustc` gera um executável nativo autônomo, ele pode rodar diretamente no sistema operacional alvo sem que o compilador esteja instalado lá.',
            ),
            mcq(
              'Nos comandos de terminal mostrados abaixo, qual nome representa o arquivo de código-fonte editado pelo programador?',
              ['`hello.rs`', '`rustc`', '`./hello`', '`main`'],
              0,
              'Arquivos de código-fonte em Rust usam a extensão `.rs`. O comando `rustc hello.rs` lê o fonte `hello.rs` e gera o executável `hello`.',
              {
                visual: code('rustc hello.rs\n./hello', [1], 'Terminal'),
              },
            ),
            order(
              'Ordene o caminho de um programa em Rust desde a escrita até aparecer na tela:',
              [
                'Escrever o código-fonte no arquivo .rs',
                'Analisar tipos e regras de memória no compilador',
                'Gerar o arquivo executável com código de máquina',
                'Executar o binário no sistema operacional',
              ],
              'Primeiro escrevemos o fonte `.rs`; depois o `rustc` verifica todas as regras, gera o binário nativo e só então o sistema executa o programa.',
            ),
            fill(
              'Complete a frase sobre o processo de tradução:',
              'O compilador ___ analisa o arquivo `.rs` e gera instruções em código de ___ para o processador.',
              ['rustc', 'máquina'],
              ['cargo', 'texto', 'internet'],
              'Quem traduz o código Rust para instruções nativas (código de máquina) é o compilador `rustc`.',
            ),
            match(
              'Associe cada elemento ao seu papel no funcionamento de um programa em Rust:',
              [
                ['Arquivo .rs', 'Código-fonte legível escrito pelo programador'],
                ['rustc', 'Compilador que valida e traduz o código'],
                ['Binário nativo', 'Executável em código de máquina'],
                ['fn main', 'Ponto de entrada onde a execução começa'],
              ],
              'Você edita o `.rs`, o `rustc` o transforma num binário nativo e a CPU inicia a execução por `fn main`.',
            ),
            codePuzzle(
              'Monte um programa completo em Rust que guarda `"Sistema pronto"` na variável `status` e o imprime na tela:',
              [
                'fn main() {',
                '    let status = "Sistema pronto";',
                '    println!("{}", status);',
                '}',
              ],
              [
                'int main(void) {',
                '    printf("%s\\n", status);',
                '    println("{}", status);',
              ],
              'Em Rust o ponto de entrada é `fn main() { ... }`, variáveis nascem com `let` e a saída usa a macro `println!` (com `!`) e chaves `{}`.',
            ),
            gen((rng) => {
              const base = randInt(rng, 10, 40) * 10;
              const step = randInt(rng, 2, 9) * 5;
              const k = randInt(rng, 2, 5);
              const ans = base + k * step;
              return num(
                'Qual número inteiro este programa imprime quando é compilado e executado?',
                ans,
                `Primeiro calculamos a multiplicação: ${k} × ${step} = ${k * step}. Somando à base ${base}, obtemos ${ans}.`,
                {
                  visual: code(
                    [
                      'fn main() {',
                      `    let base = ${base};`,
                      `    let step = ${step};`,
                      `    let mv = base + ${k} * step;`,
                      '    println!("{}", mv);',
                      '}',
                    ].join('\n'),
                    [4, 5],
                    'main.rs',
                  ),
                },
              );
            }),
          ],
        },
        {
          card: [
            {
              title: 'Velocidade de C, segurança no compilador',
              body: [
                'Na engenharia, costumávamos escolher entre dois extremos:',
                '• **C e C++**: controle total da memória e velocidade máxima, mas um descuido cria ponteiros pendurados, leitura fora de vetor ou vazamentos que só explodem em produção.',
                '• **Linguagens com Coletor de Lixo (GC)** (Java, Python, Go): evitam acessos inválidos vigiando e limpando a memória enquanto o programa roda, pagando custo de tempo e memória.',
                '',
                'O **Rust** resolve esse dilema movendo a verificação para o **compilador**: cada valor tem um único dono (*ownership*), a memória é liberada automaticamente no fim do escopo e variáveis são **imutáveis por padrão** (`let`). Para permitir alteração, você declara explicitamente `let mut`.',
              ].join('\n'),
              visual: code(
                [
                  'fn main() {',
                  '    let mut volts = 12;',
                  '    volts = 24;',
                  '    println!("Tensão: {} V", volts);',
                  '}',
                ].join('\n'),
                [2, 3],
                'Mutabilidade explícita',
              ),
              tip: 'Se você escrever `let volts = 12;` sem `mut` e tentar fazer `volts = 24;`, o programa nem compila. Menos estado mudando por acidente significa menos bugs!',
            },
            {
              title: 'Comparativo: C, Coletor de Lixo e Rust',
              body: 'Veja na tabela como o Rust combina o desempenho do código nativo de C com a segurança que antes exigia coletor de lixo.',
              visual: table(
                ['Critério', 'C', 'Com GC', 'Rust'],
                [
                  ['Limpeza de memória', 'Manual (free)', 'Pausas do GC', 'Automática no escopo'],
                  ['Ponteiro pendurado', 'Bug em execução', 'Evitado pelo GC', 'Não compila'],
                  ['Custo em execução', 'Zero', 'Consome CPU/RAM', 'Zero'],
                  ['Variáveis por padrão', 'Mutáveis', 'Mutáveis', 'Imutáveis (let)'],
                ],
                [1, 2],
              ),
            },
            {
              title: 'No seu computador 💻',
              body: [
                'Hora de testar o compilador direto na sua máquina:',
                '1. Instale o Rust pelo `rustup` (toolchain `stable`) e confira no terminal com `rustc --version`.',
                '2. Crie um arquivo `ola.rs` com uma variável `let mut v = 10;`, altere para `v = 15;` e imprima com `println!("v = {}", v);`.',
                '3. Compile na edição 2024 e rode os comandos abaixo.',
                '',
                '**Critério de pronto**: o terminal mostra a versão estável do `rustc` e `./ola` imprime exatamente `v = 15`. Depois, apague o `mut`, tente compilar de novo e veja o compilador barrar a alteração!',
              ].join('\n'),
              visual: code(
                [
                  'rustc --version',
                  'rustc --edition 2024 ola.rs',
                  './ola',
                ].join('\n'),
                [2, 3],
                'Terminal',
              ),
            },
          ],
          exercises: [
            mcq(
              'Como o Rust garante segurança de memória sem precisar de um coletor de lixo (Garbage Collector) rodando junto com o programa?',
              [
                'Verificando posse e empréstimos em tempo de compilação e liberando valores no fim do escopo',
                'Pausando o programa a cada segundo para varrer variáveis antigas na memória RAM',
                'Proibindo o uso de memória dinâmica (heap) em qualquer programa da linguagem',
                'Ignorando erros de memória durante a compilação e reiniciando o programa se ele travar',
              ],
              0,
              'O verificador de empréstimos (*borrow checker*) do `rustc` valida os acessos em tempo de compilação e insere a liberação exata no fim do escopo de cada dono, com custo zero em execução.',
            ),
            tf(
              'Em Rust, uma variável criada com `let x = 10;` pode ter seu valor alterado livremente nas linhas seguintes sem usar nenhuma palavra-chave extra.',
              false,
              'Variáveis em Rust são imutáveis por padrão. Para permitir que `x` receba outro valor depois, é obrigatório declarar `let mut x = 10;`.',
            ),
            mcq(
              'Por que o compilador do Rust recusa o programa abaixo na linha 3?',
              [
                'Porque `volts` foi declarada sem `mut` e portanto é imutável',
                'Porque o número `15` não cabe numa variável inteira em Rust',
                'Porque falta escrever `#include <stdio.h>` no topo do arquivo',
                'Porque `println!` só aceita valores negativos',
              ],
              0,
              'Na linha 2, `let volts = 12;` cria uma ligação imutável. Tentar reatribuir `volts = 15;` na linha 3 gera erro de compilação (`E0384`). Basta usar `let mut volts = 12;`.',
              {
                visual: code(
                  [
                    'fn main() {',
                    '    let volts = 12;',
                    '    volts = 15;',
                    '    println!("{}", volts);',
                    '}',
                  ].join('\n'),
                  [3],
                  'src/main.rs',
                ),
              },
            ),
            fill(
              'Complete a comparação entre C e Rust:',
              'Um ponteiro pendurado que em C causaria comportamento indefinido na execução vira um erro de ___ apontado pelo ___ em Rust.',
              ['compilação', 'compilador'],
              ['execução', 'usuário', 'coletor'],
              'O Rust move a caça a bugs de memória do tempo de execução (com ASan ou depurador) para o tempo de compilação.',
            ),
            multi(
              'Quais das afirmações abaixo são garantias reais do Rust em código seguro (sem `unsafe`)?',
              [
                'Memória liberada automaticamente quando o dono sai de escopo, sem pausas de coletor de lixo',
                'Bloqueio em tempo de compilação de referências penduradas (*dangling references*)',
                'Prevenção de corridas de dados (*data races*) entre threads já na compilação',
                'Correção automática de fórmulas de física digitadas errado pelo engenheiro',
              ],
              [0, 1, 2],
              'O compilador garante memória válida, liberação determinística e ausência de *data races*, mas a lógica matemática do problema continua sendo responsabilidade do programador.',
            ),
            match(
              'Relacione o recurso de C ao equivalente seguro usado em Rust (conforme o Mapa C → Rust):',
              [
                ['malloc / free manual', 'Ownership e liberação automática no fim do escopo'],
                ['Ponteiro pendurado', 'Recusado ao compilar pelo borrow checker'],
                ['Ponteiro NULL', 'Enum Option<T> (não existe valor nulo)'],
                ['Variável mutável por padrão', 'Imutável com let; mutável só com let mut'],
              ],
              'Rust substitui convenções manuais de C por regras checadas pelo compilador antes de gerar o binário.',
            ),
            codePuzzle(
              'Monte o programa que declara a rotação mutável `rpm` começando em `1000`, soma `500` a ela e imprime o valor final:',
              [
                'fn main() {',
                '    let mut rpm = 1000;',
                '    rpm = rpm + 500;',
                '    println!("RPM: {}", rpm);',
                '}',
              ],
              [
                '    let rpm = 1000;',
                '    int rpm = 1000;',
                '    printf("RPM: %d", rpm);',
              ],
              'Precisamos de `let mut rpm = 1000;` para que a atualização `rpm = rpm + 500;` na linha seguinte seja aceita pelo compilador.',
            ),
            gen((rng) => {
              const a = randInt(rng, 3, 9);
              const k = randInt(rng, 2, 5);
              const m = randInt(rng, 1, 8);
              const ans = a * k + m;
              return num(
                'Qual valor final da corrente `amps` é impresso por este programa?',
                ans,
                '`amps` começa em ' +
                  `${a} e é mutável (\`let mut\`). Na linha 3, recebe ${a} × ${k} + ${m} = ${ans}, que é impresso na linha 4.`,
                {
                  visual: code(
                    [
                      'fn main() {',
                      `    let mut amps = ${a};`,
                      `    amps = amps * ${k} + ${m};`,
                      '    println!("{}", amps);',
                      '}',
                    ].join('\n'),
                    [2, 3],
                    'src/main.rs',
                  ),
                },
              );
            }),
          ],
        },
      ],
    },
    {
      id: 'rb-inicio-cargo',
      title: 'rustup e Cargo',
      parts: [
        {
          card: [
            {
              title: 'Uma ferramenta só: rustup e Cargo',
              body: [
                'Em C e C++, você precisava combinar compilador (`gcc`), gerador de build (`make` ou `cmake`), formatador e bibliotecas baixadas à mão.',
                '',
                'Em Rust, tudo vem integrado:',
                '• **`rustup`**: instala e atualiza as versões do Rust (como a *toolchain* `stable` e a documentação offline `rustup doc`).',
                '• **`cargo`**: é o gerenciador de projetos, compilador, baixador de pacotes (*crates*), executor de testes e verificador de qualidade.',
                '',
                'Ao rodar `cargo new ola`, o Cargo cria uma pasta `ola/` pronta para usar, com o manifesto `Cargo.toml` (configurado na **edição 2024**) e o código inicial em `src/main.rs`.',
              ].join('\n'),
              visual: code(
                [
                  '[package]',
                  'name = "ola"',
                  'version = "0.1.0"',
                  'edition = "2024"',
                  '',
                  '[dependencies]',
                ].join('\n'),
                [2, 4],
                'Cargo.toml',
              ),
              tip: 'Nunca misture arquivos `.rs` soltos na raiz do projeto: o Cargo espera que o código-fonte fique organizado dentro da subpasta `src/`.',
            },
            {
              title: 'Mapa da pasta criada pelo Cargo',
              body: 'Quando você cria e compila um projeto com o Cargo, cada arquivo e pasta tem um papel bem definido:',
              visual: table(
                ['Caminho', 'Papel no projeto'],
                [
                  ['Cargo.toml', 'Manifesto: nome, versão, edição 2024 e dependências'],
                  ['src/main.rs', 'Código-fonte principal do seu programa'],
                  ['target/debug/', 'Executável rápido para desenvolvimento e testes'],
                  ['target/release/', 'Executável otimizado para velocidade máxima'],
                  ['Cargo.lock', 'Trava versões exatas das dependências (gerado sozinho)'],
                ],
                [0, 1],
              ),
            },
          ],
          exercises: [
            mcq(
              'Qual comando cria um novo pacote executável chamado `ola` já com `Cargo.toml` e `src/main.rs`?',
              ['`cargo new ola`', '`rustc new ola`', '`rustup init ola`', '`cargo run ola`'],
              0,
              'O comando `cargo new ola` cria a pasta `ola/` com o manifesto `Cargo.toml`, a subpasta `src/` contendo `main.rs` e já inicializa um repositório Git.',
            ),
            tf(
              'Em um projeto gerenciado pelo Cargo, o arquivo `Cargo.toml` fica na raiz do projeto e o código principal fica em `src/main.rs`.',
              true,
              'Essa convenção é padrão em todo o ecossistema Rust: configuração no `Cargo.toml` da raiz e código-fonte dentro de `src/`.',
            ),
            mcq(
              'O que configura a linha 4 destacada no arquivo `Cargo.toml` abaixo?',
              [
                'A edição da linguagem Rust (2024) usada para compilar o pacote',
                'O ano em que o computador do usuário foi fabricado',
                'O número máximo de variáveis permitidas no programa',
                'A porta de rede em que o servidor vai rodar',
              ],
              0,
              'O campo `edition = "2024"` indica ao Cargo e ao `rustc` que o projeto usa as regras e recursos da edição 2024 do Rust.',
              {
                visual: code(
                  [
                    '[package]',
                    'name = "sensor"',
                    'version = "0.1.0"',
                    'edition = "2024"',
                    '',
                    '[dependencies]',
                  ].join('\n'),
                  [4],
                  'Cargo.toml',
                ),
              },
            ),
            match(
              'Associe cada ferramenta ou arquivo do ecossistema Rust à sua função:',
              [
                ['rustup', 'Instala e atualiza a toolchain do Rust'],
                ['Cargo.toml', 'Declara nome, edição e crates externas do projeto'],
                ['src/main.rs', 'Guarda a função principal do executável'],
                ['Cargo.lock', 'Registra as versões exatas usadas na compilação'],
              ],
              '`rustup` cuida da instalação do Rust; no projeto, você edita `Cargo.toml` e `src/main.rs`, enquanto o Cargo mantém o `Cargo.lock`.',
            ),
            fill(
              'Complete os comandos para atualizar a toolchain e abrir o livro oficial offline:',
              'Para atualizar o Rust rodamos `rustup ___`, e para abrir a documentação instalada no navegador usamos `rustup ___`.',
              ['update', 'doc'],
              ['build', 'new', 'clean'],
              '`rustup update` baixa a versão estável mais nova do compilador, e `rustup doc` abre os livros e a documentação padrão sem precisar de internet.',
            ),
            order(
              'Ordene os comandos de terminal para criar um projeto chamado `radar`, entrar na pasta dele e rodá-lo:',
              ['cargo new radar', 'cd radar', 'cargo run'],
              'Primeiro criamos a pasta do pacote com `cargo new radar`, entramos nela com `cd radar` e então executamos `cargo run`.',
            ),
            codePuzzle(
              'Monte o `src/main.rs` de um pacote recém-criado que define a versão `major = 1`, calcula `minor = major + 3` e imprime `"v1.4"`:',
              [
                'fn main() {',
                '    let major = 1;',
                '    let minor = major + 3;',
                '    println!("v{}.{}", major, minor);',
                '}',
              ],
              [
                '    let minor = major + 3',
                '    println("v{}.{}", major, minor);',
                '    int major = 1;',
              ],
              'Primeiro declaramos `major`, depois calculamos `minor` usando `major` (ambos terminados com `;`) e por fim chamamos `println!` com dois marcadores `{}`.',
            ),
            gen((rng) => {
              const n = randInt(rng, 3, 8);
              const kb = randInt(rng, 2, 9) * 4;
              const ans = n * kb;
              return num(
                'Ao executar `cargo run` num projeto cujo `src/main.rs` é o código abaixo, que número aparece na saída?',
                ans,
                `O programa multiplica \`buffers\` (${n}) por \`size_kb\` (${kb}), imprimindo ${n} × ${kb} = ${ans}.`,
                {
                  visual: code(
                    [
                      'fn main() {',
                      `    let buffers = ${n};`,
                      `    let size_kb = ${kb};`,
                      '    let total = buffers * size_kb;',
                      '    println!("{}", total);',
                      '}',
                    ].join('\n'),
                    [4, 5],
                    'src/main.rs',
                  ),
                },
              );
            }),
          ],
        },
        {
          card: [
            {
              title: 'check, build, run e qualidade',
              body: [
                'No dia a dia, você vai usar cinco comandos do Cargo o tempo todo:',
                '• **`cargo check`**: verifica se o código compila **sem gerar o binário**. É muito mais rápido que `build` para checar se você acertou os tipos!',
                '• **`cargo run`**: compila (se algo mudou) e já roda o executável.',
                '• **`cargo build`** vs. **`cargo build --release`**: o `build` comum compila rápido em `target/debug/`; já `--release` otimiza fundo o código de máquina e grava em `target/release/`.',
                '• **`cargo fmt`** e **`cargo clippy -- -D warnings`**: o `fmt` alinha e formata seu código; o `clippy` é o *linter* que aponta armadilhas e, com `-- -D warnings`, recusa qualquer aviso (como `-Wall -Wextra -Werror` em C).',
              ].join('\n'),
              visual: code(
                [
                  'cargo check',
                  'cargo fmt',
                  'cargo clippy -- -D warnings',
                  'cargo run',
                  'cargo build --release',
                ].join('\n'),
                [1, 3, 5],
                'Comandos do Cargo',
              ),
              tip: 'Para adicionar uma biblioteca externa (*crate*) ao projeto, basta rodar `cargo add nome_da_crate`: o Cargo atualiza o `Cargo.toml` e baixa tudo sozinho.',
            },
            {
              title: 'Fluxo de trabalho com o Cargo',
              body: 'Navegue pelos passos para comparar o papel e a velocidade de cada ferramenta do Cargo.',
              visual: cargoWorkflowStepper(),
            },
            {
              title: 'No seu computador 💻',
              body: [
                'Faça o **Exercício 1 do Desafio 50 Dias**:',
                '1. Rode `cargo new ola`, entre na pasta `cd ola` e execute `cargo run`.',
                '2. Abra o `Cargo.toml` e o `src/main.rs` no seu editor com `rust-analyzer`.',
                '3. Rode `cargo build` e depois `cargo build --release`, e compare os executáveis gerados em `target/debug/ola` e `target/release/ola`.',
                '4. Rode `cargo fmt` e `cargo clippy -- -D warnings`.',
                '',
                '**Critério de pronto**: `cargo run` imprime `Hello, world!`, os binários existem nas pastas `target/debug` e `target/release`, e o `clippy` termina sem nenhum aviso ou erro.',
              ].join('\n'),
              visual: code(
                [
                  'cargo new ola',
                  'cd ola',
                  'cargo run',
                  'cargo build --release',
                  'cargo clippy -- -D warnings',
                ].join('\n'),
                [3, 4, 5],
                'Exercício 1 — Cargo',
              ),
            },
          ],
          exercises: [
            mcq(
              'Qual comando do Cargo é ideal para conferir rapidamente se o seu código está válido, pois pula a etapa de geração do executável?',
              ['`cargo check`', '`cargo run`', '`cargo build --release`', '`cargo new`'],
              0,
              '`cargo check` executa toda a verificação de tipos, sintaxe e *borrow checker*, mas não gasta tempo gerando código de máquina final.',
            ),
            tf(
              'O comando `cargo build --release` demora mais para compilar do que `cargo build`, mas gera um executável mais rápido na pasta `target/release/`.',
              true,
              'O perfil `release` ativa otimizações agressivas do compilador para que o binário final rode na velocidade máxima em produção.',
            ),
            mcq(
              'Na linha 2 destacada abaixo, qual é o efeito de passar `-- -D warnings` para o `cargo clippy`?',
              [
                'Faz qualquer aviso de qualidade ou código suspeito ser tratado como erro de compilação',
                'Desativa todos os avisos e ignora erros de sintaxe do projeto',
                'Apaga a pasta `target/` para liberar espaço em disco',
                'Executa o programa ignorando a função `main`',
              ],
              0,
              'A flag `-D warnings` (*deny warnings*) instrui o analisador a falhar se houver qualquer aviso, mantendo o padrão de zero avisos do curso.',
              {
                visual: code(
                  [
                    'cargo fmt',
                    'cargo clippy -- -D warnings',
                  ].join('\n'),
                  [2],
                  'Qualidade no terminal',
                ),
              },
            ),
            match(
              'Ligue cada comando do Cargo ao que ele faz no projeto:',
              [
                ['cargo check', 'Valida tipos e empréstimos sem gerar binário'],
                ['cargo run', 'Compila (se preciso) e executa o programa'],
                ['cargo fmt', 'Formata o código-fonte com o estilo padrão'],
                ['cargo clippy', 'Analisa o código em busca de erros comuns e melhorias'],
              ],
              'Esse quarteto (`check`, `fmt`, `clippy` e `run`) acompanha todo o ciclo de desenvolvimento em Rust.',
            ),
            fill(
              'Complete as pastas onde o Cargo salva os executáveis:',
              'Por padrão, `cargo build` grava o binário em `target/___`, enquanto `cargo build --release` grava em `target/___`.',
              ['debug', 'release'],
              ['src', 'main', 'bin'],
              'O perfil padrão é `debug` (compilação rápida com símbolos de depuração) e o perfil otimizado é `release`.',
            ),
            multi(
              'O que acontece quando você altera `src/main.rs` e roda `cargo run` no terminal?',
              [
                'O Cargo percebe que o arquivo mudou e recompila o projeto automaticamente',
                'Assim que a compilação termina sem erros, o executável é iniciado no terminal',
                'Se houver um erro de compilação, o Cargo mostra o diagnóstico e não roda o binário antigo',
                'O Cargo publica o seu código automaticamente na internet para todos baixarem',
              ],
              [0, 1, 2],
              '`cargo run` compila incrementalmente o que mudou e só executa o programa se a compilação for bem-sucedida. Tudo acontece localmente.',
            ),
            codePuzzle(
              'Monte a sequência de terminal para: 1) criar o projeto `motor`, 2) entrar na pasta, 3) checar sem gerar binário, 4) validar com o linter sem avisos e 5) rodar:',
              [
                'cargo new motor',
                'cd motor',
                'cargo check',
                'cargo clippy -- -D warnings',
                'cargo run',
              ],
              ['gcc motor.rs -o motor', 'cargo check --delete'],
              'Criamos o pacote com `cargo new motor`, entramos na pasta com `cd motor`, validamos com `cargo check` e `cargo clippy -- -D warnings`, e executamos com `cargo run`.',
            ),
            gen((rng) => {
              const debugMs = randInt(rng, 40, 90);
              const factor = randInt(rng, 4, 8);
              const releaseMs = randInt(rng, 5, 12);
              const saved = debugMs * factor - releaseMs * factor;
              return num(
                'O programa abaixo compara o tempo total (em ms) de um cálculo repetido. Qual número `cargo run` imprime?',
                saved,
                `Calculamos \`fast\` = ${releaseMs} × ${factor} = ${releaseMs * factor} e \`slow\` = ${debugMs} × ${factor} = ${debugMs * factor}. A diferença \`slow - fast\` é ${saved}.`,
                {
                  visual: code(
                    [
                      'fn main() {',
                      `    let slow = ${debugMs} * ${factor};`,
                      `    let fast = ${releaseMs} * ${factor};`,
                      '    println!("{}", slow - fast);',
                      '}',
                    ].join('\n'),
                    [2, 3, 4],
                    'src/main.rs',
                  ),
                },
              );
            }),
          ],
        },
      ],
    },
    {
      id: 'rb-inicio-hello',
      title: 'Anatomia de um programa',
      parts: [
        {
          card: [
            {
              title: 'Por dentro do src/main.rs',
              body: [
                'Vamos dissecar cada pedaço do programa mínimo em Rust:',
                '• **`fn main()`**: a palavra `fn` declara uma função. `main` é especial: é sempre a primeira função a rodar em todo programa executável. Os parênteses `()` indicam que ela não recebe parâmetros.',
                '• **Chaves `{ }`**: delimitam onde o corpo da função começa e termina. Em Rust, o estilo padrão (`cargo fmt`) usa **4 espaços** de indentação.',
                '• **`println!("...");`**: o ponto de exclamação **`!`** avisa que `println!` é uma **macro**, e não uma função comum. O ponto e vírgula **`;`** encerra a instrução.',
                '• **Fim do `main`**: diferente de C, não é preciso escrever `#include <stdio.h>` nem `return 0;` no fim.',
              ].join('\n'),
              visual: code(
                [
                  'fn main() {',
                  '    println!("Olá, Rust!");',
                  '}',
                ].join('\n'),
                [1, 2],
                'src/main.rs',
              ),
              tip: 'Por que `println!` é uma macro e não uma função? Porque funções em Rust têm número e tipo fixos de argumentos, enquanto a macro `println!` aceita quantos valores você quiser e verifica os marcadores `{}` em tempo de compilação!',
            },
            {
              title: 'Do C para o Rust: Olá, mundo',
              body: 'Se você já fez o curso de C, compare lado a lado o que mudou na estrutura básica:',
              visual: table(
                ['Elemento', 'Em C', 'Em Rust'],
                [
                  ['Ponto de entrada', 'int main(void)', 'fn main()'],
                  ['Cabeçalho para imprimir', '#include <stdio.h>', 'Nenhum (já vem pronto)'],
                  ['Imprimir pulando linha', 'printf("Oi\\n");', 'println!("Oi");'],
                  ['Imprimir sem pular linha', 'printf("Oi");', 'print!("Oi");'],
                  ['Encerrar com sucesso', 'return 0;', 'Automático ao fechar }'],
                ],
                [0, 2],
              ),
            },
          ],
          exercises: [
            mcq(
              'Em `println!("Olá!");`, o que indica o ponto de exclamação `!` logo antes do parêntese?',
              [
                'Que estamos invocando uma macro do Rust, e não uma função comum',
                'Que a mensagem será impressa em letras maiúsculas no terminal',
                'Que o programa deve abortar com erro após mostrar a mensagem',
                'Que a variável dentro dos parênteses será apagada da memória',
              ],
              0,
              'Em Rust, todo identificador seguido de `!` na chamada (como `println!`, `print!` e `vec!`) é uma macro, que expande e valida o código durante a compilação.',
            ),
            tf(
              'Assim como em `printf` do C, a macro `println!` exige que você escreva `\\n` no final do texto para quebrar a linha.',
              false,
              'O `ln` de `println!` (*print line*) já acrescenta a quebra de linha automaticamente no final. Quando não quiser pular linha, use `print!`.',
            ),
            mcq(
              'Qual é a saída produzida pelo programa abaixo?',
              [
                '`Motor` na primeira linha e `Ligado` na segunda linha',
                '`MotorLigado` tudo junto na mesma linha',
                '`"Motor"` e `"Ligado"` com as aspas na tela',
                'Nada, pois falta `return 0;` antes de fechar a chave',
              ],
              0,
              'Cada chamada de `println!` escreve o conteúdo entre aspas (sem mostrar as aspas) e avança para a linha de baixo.',
              {
                visual: code(
                  [
                    'fn main() {',
                    '    println!("Motor");',
                    '    println!("Ligado");',
                    '}',
                  ].join('\n'),
                  [2, 3],
                  'src/main.rs',
                ),
              },
            ),
            fill(
              'Complete as regras da estrutura principal em Rust:',
              'A palavra-chave ___ define uma função, o programa começa em ___ e o padrão do `rustfmt` indenta o bloco com ___ espaços.',
              ['fn', 'main', '4'],
              ['int', 'void', '2', '8'],
              'Funções começam com `fn`, o ponto de entrada é `main` e a indentação oficial do Rust usa 4 espaços.',
            ),
            mcq(
              'Observe o uso de `print!` (linha 2) e `println!` (linha 3). Qual texto aparece na primeira linha da saída?',
              ['` Setor A: OK` (ou seja, `Setor A: OK` na mesma linha)', '`Setor A: ` apenas', '`OK` apenas', 'Erro de compilação porque `print!` não existe'],
              0,
              'Na linha 2, `print!("Setor A: ");` imprime o texto e permanece na mesma linha. Na linha 3, `println!("OK");` completa a linha formando `Setor A: OK` e só depois quebra a linha.',
              {
                visual: code(
                  [
                    'fn main() {',
                    '    print!("Setor A: ");',
                    '    println!("OK");',
                    '}',
                  ].join('\n'),
                  [2, 3],
                  'print! vs println!',
                ),
              },
            ),
            order(
              'Ordene os elementos que abrem a função principal e encerram sua única instrução:',
              [
                'fn main() {',
                '    println!("Iniciando...");',
                '}',
              ],
              'Abrimos `fn main() {`, executamos a instrução `println!` terminada em `;` com 4 espaços de recuo, e fechamos o bloco com `}`.',
            ),
            codePuzzle(
              'Monte um programa completo que guarda `"Bateria OK"` em `msg` e imprime `"Status: Bateria OK"`:',
              [
                'fn main() {',
                '    let msg = "Bateria OK";',
                '    println!("Status: {}", msg);',
                '}',
              ],
              [
                'int main(void) {',
                '    println("Status: {}", msg);',
                '    let msg = "Bateria OK"',
              ],
              'Toda instrução dentro de `main` termina com `;` e a macro `println!` precisa do ponto de exclamação `!`.',
            ),
            gen((rng) => {
              const n = randInt(rng, 2, 6);
              const lines = Array.from({ length: n }, (_, i) => `    println!("Passo ${i + 1}");`);
              return num(
                'Quantas linhas de texto são impressas no terminal quando este programa executa?',
                n,
                `Há ${n} chamadas seguidas à macro \`println!\`, e cada uma imprime exatamente uma linha antes de quebrar para a próxima.`,
                {
                  visual: code(['fn main() {', ...lines, '}'].join('\n'), [], 'src/main.rs'),
                },
              );
            }),
          ],
        },
        {
          card: [
            {
              title: 'As chaves {} (Display) e {:?} (Debug)',
              body: [
                'Em C, você precisava lembrar `%d`, `%ld`, `%f`, `%s` — e errar o especificador no `printf` lia lixo da memória.',
                '',
                'Em Rust, o compilador já conhece o tipo de cada variável! Na string do `println!`, usamos chaves:',
                '• **`{}` (`Display`)**: formatação limpa para o usuário final (números, textos). Você pode passar o valor após a vírgula (`println!("{} V", v);`) ou pôr o nome da variável direto nas chaves (`println!("{v} V");`).',
                '• **`{:?}` (`Debug`)**: formatação técnica para o programador inspecionar estruturas compostas, como arrays `[1, 2, 3]` ou tuplas `(10, 20)`, que não aceitam `{}` por padrão.',
              ].join('\n'),
              visual: code(
                [
                  'fn main() {',
                  '    let v = 5;',
                  '    let rgb = [255, 128, 0];',
                  '    println!("Tensão: {v} V");',
                  '    println!("Cor: {:?}", rgb);',
                  '}',
                ].join('\n'),
                [4, 5],
                'Display {} vs Debug {:?}',
              ),
              tip: 'Se você precisar imprimir uma chave literal `{` ou `}` no texto, basta duplicá-la: `println!("Conjunto: {{1, 2}}");` imprime `Conjunto: {1, 2}`.',
            },
            {
              title: 'Execução passo a passo do println!',
              body: 'Use os botões **◀** e **▶** para acompanhar como as variáveis ficam na pilha e o que cada marcador (`{}` e `{:?}`) envia para o terminal.',
              visual: printlnStepper(),
            },
            {
              title: 'No seu computador 💻',
              body: [
                'No seu projeto `ola`, edite o `src/main.rs` para testar os marcadores de formatação:',
                '1. Crie um inteiro `let volts = 12;`, uma tupla `let pos = (4, 8);` e um array `let pins = [1, 3, 5];`.',
                '2. Imprima `volts` com `{}` (ou `{volts}`) e imprima `pos` e `pins` usando `{:?}`.',
                '3. Rode `cargo run` e `cargo clippy -- -D warnings`.',
                '',
                '**Critério de pronto**: o terminal exibe os três valores formatados (`12`, `(4, 8)` e `[1, 3, 5]`) e o `clippy` termina sem nenhum aviso.',
              ].join('\n'),
              visual: code(
                [
                  'fn main() {',
                  '    let volts = 12;',
                  '    let pos = (4, 8);',
                  '    let pins = [1, 3, 5];',
                  '    println!("{volts} V | {:?}", pos);',
                  '    println!("Pinos: {:?}", pins);',
                  '}',
                ].join('\n'),
                [5, 6],
                'src/main.rs',
              ),
            },
          ],
          exercises: [
            mcq(
              'O que o programa abaixo imprime no terminal?',
              ['`4 e 9`', '`a e b`', '`{} e {}`', '`9 e 4`'],
              0,
              'Cada par de chaves `{}` é substituído, na ordem em que aparece, pelos argumentos passados após a string de formato: primeiro `4`, depois `9`.',
              {
                visual: code(
                  [
                    'fn main() {',
                    '    let a = 4;',
                    '    let b = 9;',
                    '    println!("{} e {}", a, b);',
                    '}',
                  ].join('\n'),
                  [4],
                  'src/main.rs',
                ),
              },
            ),
            mcq(
              'Na linha 3 destacada, por que usamos `{:?}` em vez de `{}` para imprimir `nums`?',
              [
                'Porque arrays como `[10, 20, 30]` usam a formatação de inspeção `Debug` (`{:?}`) e não implementam `Display` (`{}`)',
                'Porque `{:?}` soma automaticamente todos os elementos do array antes de imprimir',
                'Porque números inteiros nunca podem ser impressos com `{}` em Rust',
                'Porque `{:?}` converte os números para ponto flutuante',
              ],
              0,
              'Tipos compostos como arrays `[T; N]` e tuplas não têm uma única forma óbvia de exibição para o usuário final (`Display`), mas implementam `Debug` para inspeção com `{:?}`.',
              {
                visual: code(
                  [
                    'fn main() {',
                    '    let nums = [10, 20, 30];',
                    '    println!("{:?}", nums);',
                    '}',
                  ].join('\n'),
                  [3],
                  'Imprimindo um array',
                ),
              },
            ),
            tf(
              'Em Rust (edição 2024), você pode colocar o nome de uma variável diretamente dentro das chaves, como em `println!("Ganho: {gain}");`, para imprimir o valor de `gain`.',
              true,
              'A interpolação direta de variáveis dentro de `{nome}` ou `{nome:?}` é suportada nativamente pelas macros de formatação do Rust.',
              {
                visual: code(
                  [
                    'fn main() {',
                    '    let gain = 15;',
                    '    println!("Ganho: {gain}");',
                    '}',
                  ].join('\n'),
                  [3],
                  'Interpolação em {}',
                ),
              },
            ),
            fill(
              'Complete sobre os dois marcadores de formatação mais usados:',
              'O marcador ___ chama a trait `Display` (texto limpo para o usuário), enquanto ___ chama a trait `Debug` (inspeção para o programador).',
              ['{}', '{:?}'],
              ['%d', '%s', '{!}'],
              'Em Rust você não decora letras por tipo numérico (`%d`, `%f`): usa `{}` para `Display` e `{:?}` para `Debug`.',
            ),
            match(
              'Associe cada chamada de `println!` à saída exata que ela produz no terminal:',
              [
                ['println!("{}", 42);', '42'],
                ['println!("{:?}", [1, 2]);', '[1, 2]'],
                ['println!("{:?}", "Oi");', '"Oi" (mostra as aspas)'],
                ['println!("{{ok}}");', '{ok} (chaves literais)'],
              ],
              'Com `{}` vemos o valor limpo; com `{:?}` vemos a estrutura de depuração (incluindo colchetes de arrays e aspas de strings); e `{{` / `}}` escapam chaves literais.',
            ),
            mcq(
              'O que acontece ao tentar compilar o programa abaixo com `cargo check`?',
              [
                'Não compila: o `rustc` aponta que há 2 marcadores `{}` na string, mas apenas 1 valor foi passado',
                'Compila normalmente e imprime `10 e 0`',
                'Compila normalmente e imprime lixo da memória no segundo `{}` (como em C)',
                'Compila e imprime `10 e 10` repetindo o argumento',
              ],
              0,
              'Como `println!` é uma macro checada em compilação, qualquer diferença entre o número de `{}` e os argumentos fornecidos impede a compilação na hora.',
              {
                visual: code(
                  [
                    'fn main() {',
                    '    println!("{} e {}", 10);',
                    '}',
                  ].join('\n'),
                  [2],
                  'Argumento faltando',
                ),
              },
            ),
            codePuzzle(
              'Monte o programa que define `base = 10`, cria o array `pins = [base, base + 5]` e o imprime com a formatação de depuração:',
              [
                'fn main() {',
                '    let base = 10;',
                '    let pins = [base, base + 5];',
                '    println!("{:?}", pins);',
                '}',
              ],
              [
                '    println!("{}", pins);',
                '    println!("{:?}", pins)',
                '    let base = 10',
              ],
              'Primeiro criamos `base`, depois usamos `base` para montar o array `pins` e por fim imprimimos `pins` com `{:?}` (já que arrays exigem `Debug`).',
            ),
            gen((rng) => {
              const a = randInt(rng, 2, 7);
              const b = randInt(rng, 3, 8);
              const ans = a * b + a;
              return num(
                'Qual número inteiro aparece na saída quando este programa é executado?',
                ans,
                `O argumento calcula \`a * b + a\` = ${a} × ${b} + ${a} = ${a * b} + ${a} = ${ans}, e o marcador \`{}\` imprime esse inteiro.`,
                {
                  visual: code(
                    [
                      'fn main() {',
                      `    let a = ${a};`,
                      `    let b = ${b};`,
                      '    println!("{}", a * b + a);',
                      '}',
                    ].join('\n'),
                    [4],
                    'src/main.rs',
                  ),
                },
              );
            }),
          ],
        },
      ],
    },
    {
      id: 'rb-inicio-erros',
      title: 'Lendo o compilador',
      parts: [
        {
          card: [
            {
              title: 'O compilador trabalha para você',
              body: [
                'Em muitas linguagens, mensagens de erro parecem charadas. No Rust, ler os diagnósticos do `rustc` faz parte do estudo: eles foram desenhados para ensinar.',
                '',
                'Toda mensagem de erro traz quatro pistas:',
                '1. **Código `E0xxx` e resumo**: ex. `error[E0384]: cannot assign twice to immutable variable`. Você pode rodar `rustc --explain E0384` para ver um guia completo no terminal.',
                '2. **Seta `-->`**: indica `arquivo:linha:coluna` exatos do problema (`src/main.rs:3:5`).',
                '3. **Marcações `-` e `^^^`**: mostram onde a variável nasceu e onde a regra foi quebrada.',
                '4. **Sugestão `help:`**: mostra o código pronto que corrige o defeito!',
              ].join('\n'),
              visual: code(
                [
                  'error[E0384]: cannot assign twice to',
                  '              immutable variable `x`',
                  ' --> src/main.rs:3:5',
                  '2 |     let x = 5;',
                  '3 |     x = 6;',
                  '  |     ^^^^^ cannot assign twice',
                  'help: consider making this mutable',
                  '2 |     let mut x = 5;',
                ].join('\n'),
                [1, 3, 7, 8],
                'Diagnóstico E0384',
              ),
              tip: 'Não tenha medo de ver tela vermelha no `cargo check`: em Rust, cada erro de compilação é um bug que deixou de ir para produção.',
            },
            {
              title: 'Dissecando a mensagem de erro',
              body: 'Avance pelos 4 passos abaixo para ver como ler cada bloco da mensagem do `rustc`.',
              visual: errorAnatomyStepper(),
            },
          ],
          exercises: [
            mcq(
              'Na saída do compilador mostrada abaixo, em qual linha e coluna do arquivo `src/main.rs` ocorreu o erro?',
              ['Linha 4, coluna 5', 'Linha 5, coluna 4', 'Linha 384, coluna 1', 'Linha 1, coluna 4'],
              0,
              'A seta `--> src/main.rs:4:5` segue sempre o formato `arquivo:linha:coluna`: portanto, linha 4 e coluna 5.',
              {
                visual: code(
                  [
                    'error[E0384]: cannot assign twice to',
                    '              immutable variable `v`',
                    ' --> src/main.rs:4:5',
                  ].join('\n'),
                  [3],
                  'Localização do erro',
                ),
              },
            ),
            mcq(
              'Qual comando do terminal exibe uma explicação oficial com exemplos de código sobre o erro `E0384`?',
              [
                '`rustc --explain E0384`',
                '`cargo new E0384`',
                '`rustup update E0384`',
                '`cargo fmt --error E0384`',
              ],
              0,
              '`rustc --explain <CÓDIGO>` abre no próprio terminal a documentação detalhada daquele erro, com um exemplo que falha e outro corrigido.',
            ),
            tf(
              'Na mensagem de erro do `rustc`, a seção iniciada por `help:` sugere uma alteração concreta no código para resolver o problema.',
              true,
              'As linhas `help:` do compilador Rust mostram frequentemente a linha exata já reescrita (por exemplo, adicionando `mut` ou `!`).',
            ),
            mcq(
              'Ao compilar o programa abaixo, o `rustc` emite `error[E0423]: expected function, found macro println`. O que o `help:` sugere fazer na linha 2?',
              [
                'Usar `!` para invocar a macro: `println!("Ativo");`',
                'Trocar `println` por `printf`',
                'Apagar as aspas da palavra `"Ativo"`',
                'Trocar `fn main()` por `int main()`',
              ],
              0,
              'Sem o `!`, o compilador procura uma função chamada `println`, encontra a macro de mesmo nome (`E0423`) e sugere em `help: use ! to invoke the macro: println!`.',
              {
                visual: code(
                  [
                    'fn main() {',
                    '    println("Ativo");',
                    '}',
                  ].join('\n'),
                  [2],
                  'Erro E0423',
                ),
              },
            ),
            fill(
              'Complete a leitura do diagnóstico `error[E0425]: cannot find value `rpm` in this scope`:',
              'O código ___ identifica o tipo de erro, e a mensagem informa que a variável `rpm` não foi ___ neste escopo.',
              ['E0425', 'encontrada'],
              ['Cargo.toml', 'compilada', 'otimizada'],
              '`E0425` (*cannot find value in this scope*) aparece quando você usa o nome de uma variável que ainda não foi declarada ou teve o nome digitado com erro.',
            ),
            order(
              'Ordene as 4 partes de um diagnóstico do `rustc` na sequência em que aparecem de cima para baixo no terminal:',
              [
                'Cabeçalho error[E0xxx] com o resumo do problema',
                'Seta --> com arquivo, linha e coluna',
                'Trecho numerado do código com sublinhado ^^^',
                'Dica help: mostrando como corrigir a linha',
              ],
              'O compilador sempre começa pelo código e resumo (`error[E0xxx]`), aponta onde está (`-->`), desenha o trecho com `^^^` e fecha com a sugestão `help:`.',
            ),
            codePuzzle(
              'O compilador apontou `E0384` (variável `count` sem `mut`) e `E0423` (`println` sem `!`). Monte o programa já **corrigido**:',
              [
                'fn main() {',
                '    let mut count = 1;',
                '    count = count + 1;',
                '    println!("{}", count);',
                '}',
              ],
              [
                '    let count = 1;',
                '    println("{}", count);',
                '    mut let count = 1;',
              ],
              'Adicionamos `mut` em `let mut count = 1;` (resolvendo o `E0384`) e colocamos o `!` em `println!` (resolvendo o `E0423`).',
            ),
            gen((rng) => {
              const pad = randInt(rng, 1, 4);
              const setup = Array.from({ length: pad }, (_, i) => `    let a${i + 1} = ${i + 10};`);
              const errLine = pad + 3;
              return num(
                'No código numerado abaixo, `x` foi criada sem `mut` e reatribuída depois. Em qual número de linha o `rustc` apontará `^^^^^ cannot assign twice to immutable variable` (`E0384`)?',
                errLine,
                `A variável \`x\` nasce imutável na linha ${pad + 2}, e a tentativa ilegal de reatribuição \`x = 99;\` está na linha ${errLine}. É exatamente essa linha que recebe o sublinhado \`^^^^^\`.`,
                {
                  visual: code(
                    [
                      'fn main() {',
                      ...setup,
                      '    let x = 10;',
                      '    x = 99;',
                      '    println!("{}", x);',
                      '}',
                    ].join('\n'),
                    [],
                    'src/main.rs',
                  ),
                },
              );
            }),
          ],
        },
        {
          card: [
            {
              title: 'Os erros mais comuns de quem começa',
              body: [
                'Ao escrever seus primeiros programas, você vai encontrar principalmente estes cinco códigos do `rustc`:',
                '• **`E0423`**: esqueceu o `!` ao chamar uma macro (`println("Oi")` em vez de `println!("Oi")`).',
                '• **`E0425`**: usou um nome de variável que não existe ou foi digitado errado (`cannot find value`).',
                '• **`E0384`**: tentou mudar o valor de uma variável criada sem `mut` (`cannot assign twice`).',
                '• **`E0308`**: entregou um tipo onde o compilador esperava outro (`mismatched types`, ex.: atribuir `"dez"` a um `i32`).',
                '• **`E0277`**: tentou imprimir com `{}` um tipo que só aceita `{:?}` (`doesn\'t implement Display`).',
              ].join('\n'),
              visual: code(
                [
                  'fn main() {',
                  '    let mut port: i32 = 80;',
                  '    port = "oitenta"; // E0308: tipo!',
                  '    let pair = (1, 2);',
                  '    println!("{}", pair); // E0277',
                  '}',
                ].join('\n'),
                [3, 5],
                'Exemplos de E0308 e E0277',
              ),
              tip: 'Quando você erra uma letra no nome de uma variável (`E0425`), o próprio `help:` procura nomes parecidos no escopo e pergunta: `help: a local variable with a similar name exists`!',
            },
            {
              title: 'Tabela de consulta rápida: códigos E0xxx',
              body: 'Guarde este resumo para identificar rapidamente o que o compilador está pedindo:',
              visual: table(
                ['Código', 'Mensagem do rustc', 'Correção típica'],
                [
                  ['E0423', 'expected function, found macro', 'Colocar ! na macro (println!)'],
                  ['E0425', 'cannot find value in this scope', 'Corrigir o nome ou declarar com let'],
                  ['E0384', 'cannot assign twice to immutable', 'Declarar com let mut'],
                  ['E0308', 'mismatched types', 'Usar valor compatível com o tipo'],
                  ['E0277', "doesn't implement Display", 'Trocar {} por {:?} no println!'],
                ],
                [2, 3, 4],
              ),
            },
            {
              title: 'No seu computador 💻',
              body: [
                'Treine a leitura do compilador no seu projeto `ola`:',
                '1. No `src/main.rs`, provoque de propósito um `E0423` (apague o `!` de `println!`), rode `cargo check` e leia o `help:`.',
                '2. Corrija o `!`, crie `let x = 5;` e na linha de baixo escreva `x = 6;`. Rode `cargo check` para ver o `E0384`.',
                '3. No terminal, execute `rustc --explain E0384` e `rustc --explain E0308`.',
                '4. Corrija com `let mut x = 5;`, imprima `x` e valide tudo com `cargo clippy -- -D warnings` e `cargo run`.',
                '',
                '**Critério de pronto**: você inspecionou os erros no terminal, corrigiu o código e `cargo clippy -- -D warnings` passou sem nenhum aviso ou erro.',
              ].join('\n'),
              visual: code(
                [
                  'cargo check',
                  'rustc --explain E0384',
                  'cargo clippy -- -D warnings',
                  'cargo run',
                ].join('\n'),
                [1, 2, 3],
                'Treino de diagnóstico',
              ),
            },
          ],
          exercises: [
            mcq(
              'O programa abaixo falha na linha 3. Qual código de erro o `rustc` emite e qual dica aparece no `help:`?',
              [
                '`E0425` (`cannot find value senor_mv`), sugerindo o nome parecido `sensor_mv`',
                '`E0384` (`cannot assign twice`), sugerindo adicionar `mut`',
                '`E0308` (`mismatched types`), dizendo que `3300` é texto',
                '`E0277`, pedindo para remover o `println!`',
              ],
              0,
              'Na linha 2 a variável foi declarada como `sensor_mv`, mas na linha 3 foi digitada sem o `s` (`senor_mv`). O `rustc` aponta `E0425` e sugere `sensor_mv`.',
              {
                visual: code(
                  [
                    'fn main() {',
                    '    let sensor_mv = 3300;',
                    '    println!("{}", senor_mv);',
                    '}',
                  ].join('\n'),
                  [3],
                  'Erro de digitação',
                ),
              },
            ),
            mcq(
              'Por que a linha 3 destacada abaixo não compila e gera `error[E0308]: mismatched types`?',
              [
                'Porque `port` foi declarada com o tipo inteiro `i32`, mas na linha 3 tentamos atribuir o texto `"oitenta"` (`&str`)',
                'Porque `port` não tem a palavra-chave `mut` na linha 2',
                'Porque o número `8080` é grande demais para o tipo `i32`',
                'Porque variáveis em Rust não podem mudar de valor na função `main`',
              ],
              0,
              'Mesmo sendo mutável (`let mut`), uma variável em Rust tem tipo estático fixo: `port` é `i32` e jamais pode receber uma string `"oitenta"` (`expected i32, found &str`, erro `E0308`).',
              {
                visual: code(
                  [
                    'fn main() {',
                    '    let mut port: i32 = 8080;',
                    '    port = "oitenta";',
                    '    println!("{}", port);',
                    '}',
                  ].join('\n'),
                  [3],
                  'Erro E0308',
                ),
              },
            ),
            mcq(
              'Na linha 3 destacada, o compilador recusa o código com `error[E0277]: (i32, i32) doesn\'t implement std::fmt::Display`. Como corrigir?',
              [
                'Trocando `{}` por `{:?}` na string do `println!` para usar a formatação `Debug`',
                'Apagando o ponto de exclamação `!` de `println!`',
                'Trocando `let pair` por `int pair`',
                'Removendo o ponto e vírgula do final da linha 2',
              ],
              0,
              'Tuplas como `(5, 10)` não implementam `Display` (`{}`), mas implementam `Debug`. Como o próprio `note:` do compilador avisa, basta usar `{:?}`.',
              {
                visual: code(
                  [
                    'fn main() {',
                    '    let pair = (5, 10);',
                    '    println!("{}", pair);',
                    '}',
                  ].join('\n'),
                  [3],
                  'Erro E0277',
                ),
              },
            ),
            match(
              'Ligue cada código de erro do `rustc` à causa correspondente no programa:',
              [
                ['E0423', 'Chamou a macro println! sem o ponto de exclamação !'],
                ['E0425', 'Usou um nome de variável que não existe no escopo'],
                ['E0384', 'Tentou alterar uma variável declarada sem mut'],
                ['E0308', 'Entregou um valor de tipo diferente do esperado'],
              ],
              'Reconhecer `E0423`, `E0425`, `E0384` e `E0308` de bate-pronto acelera muito a leitura do terminal.',
            ),
            multi(
              'Analise o código abaixo. Quais defeitos impedem este programa de compilar?',
              [
                'Na linha 3, `limit` recebe novo valor sem ter sido declarada com `let mut` na linha 2 (`E0384`)',
                'Na linha 4, `println` foi escrito sem o `!` que invoca a macro (`E0423`)',
                'Na linha 2, o número `100` deveria estar obrigatoriamente entre aspas',
                'Falta a instrução `return 0;` após a linha 4',
              ],
              [0, 1],
              'Há dois erros de compilação: `limit` precisava ser `let mut limit = 100;` (`E0384`) e `println` precisava do `!` (`println!("{}", limit);`, `E0423`).',
              {
                visual: code(
                  [
                    'fn main() {',
                    '    let limit = 100;',
                    '    limit = 200;',
                    '    println("{}", limit);',
                    '}',
                  ].join('\n'),
                  [2, 3, 4],
                  'Dois erros no mesmo arquivo',
                ),
              },
            ),
            fill(
              'Complete a explicação sobre o erro ao imprimir um array com `{}`:',
              'Ao passar um array para `println!("{}", arr)`, o compilador aponta o erro ___ e sugere usar o marcador ___ em seu lugar.',
              ['E0277', '{:?}'],
              ['E0384', '{}', '%d'],
              '`E0277` indica que o tipo não implementa a trait exigida (`Display` para `{}`), sugerindo `{:?}` (`Debug`).',
            ),
            codePuzzle(
              'O rascunho tinha três erros (`E0308`, `E0384` e `E0277`). Monte a versão **correta** que calcula `sum`, monta a tupla `pair` e a imprime:',
              [
                'fn main() {',
                '    let mut sum: i32 = 10;',
                '    sum = sum + 20;',
                '    let pair = (sum, 50);',
                '    println!("{:?}", pair);',
                '}',
              ],
              [
                '    let sum: i32 = "10";',
                '    let sum: i32 = 10;',
                '    println!("{}", pair);',
              ],
              'Usamos `let mut sum: i32 = 10;` (tipo inteiro `i32` e mutável), somamos `20`, criamos a tupla `pair` usando `sum` e imprimimos a tupla com `{:?}`.',
            ),
            gen((rng) => {
              const a = randInt(rng, 10, 45);
              const b = randInt(rng, 15, 50);
              const ans = a + b;
              return num(
                'Após aplicar a sugestão `help: consider making this binding mutable: mut total` no código abaixo, qual número ele imprime ao rodar?',
                ans,
                `Com \`let mut total: i32 = ${a};\`, a reatribuição na linha 3 passa a compilar e calcula ${a} + ${b} = ${ans}.`,
                {
                  visual: code(
                    [
                      'fn main() {',
                      `    let mut total: i32 = ${a};`,
                      `    total = total + ${b};`,
                      '    println!("{}", total);',
                      '}',
                    ].join('\n'),
                    [2, 3],
                    'Código corrigido',
                  ),
                },
              );
            }),
          ],
        },
      ],
    },
  ],
};
