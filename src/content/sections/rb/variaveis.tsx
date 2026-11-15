import type { UnitDef } from '../../types';
import { code, fill, gen, match, mcq, num, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { randInt } from '../../../lib/random';

const t = String.raw;

export const rustVariaveis: UnitDef = {
  id: 'rb-var', title: 'Variáveis e tipos', icon: '📦',
  subtitle: 'Escolha o que pode mudar e como cada dado cabe na memória',
  source: 'The Rust Programming Language, edição 2024, §§3.1–3.2: https://doc.rust-lang.org/book/ch03-01-variables-and-mutability.html e https://doc.rust-lang.org/book/ch03-02-data-types.html. Complementos: Rust Reference, Numeric cast; std::convert e métodos dos inteiros. Desafio 50 Dias — Rust, módulo 1, desafio 2.',
  extra: true,
  guide: `**Variáveis:** \`let\` cria um vínculo imutável; \`mut\` permite reatribuir, mantendo o tipo. Shadowing usa outro \`let\` e cria um vínculo novo, que pode ter outro tipo. Uma \`const\` exige tipo explícito e expressão avaliável em compilação.

**Escalares:** inteiros com sinal \`i8\`, \`i16\`, \`i32\`, \`i64\`, \`i128\`; sem sinal \`u8\`, \`u16\`, \`u32\`, \`u64\`, \`u128\`. Com $n$ bits, a faixa com sinal é $-2^{n-1}$ a $2^{n-1}-1$; sem sinal, $0$ a $2^n-1$. \`isize\` e \`usize\` têm a largura dos ponteiros do alvo; índices de arrays usam \`usize\`. Sem outra restrição, inteiros assumem \`i32\` e floats, \`f64\`. \`f32\` e \`f64\` aproximam reais. \`bool\` ocupa 1 byte; \`char\`, 4 bytes e um valor escalar Unicode.

**Compostos:** tuplas têm posições de tipos possivelmente diferentes; arrays têm um tipo de elemento e comprimento fixo. Ambos começam no índice zero.

**Conversões e limites:** \`as\` pode perder informação. \`From\` representa conversões infalíveis; \`TryFrom\`, conversões que podem falhar. Nos perfis padrão do Cargo, overflow de soma, subtração e multiplicação em execução causa pânico em debug e wrapping em release. Expresse a intenção com métodos \`checked_\`, \`wrapping_\` e \`saturating_\`; não dependa do perfil para definir a regra do programa.`,
  lessons: [
    {
      id: 'rb-var-let', title: 'let, mut e imutabilidade', parts: [
        {
          card: [
            {
              title: 'Um nome para um valor',
              body: 'Uma declaração com `let` associa um nome a um valor. Por padrão, depois de inicializado, esse vínculo é imutável. Ler o valor ou calcular com ele não o altera. Aqui `next` recebe o resultado; `count` continua valendo 5. A macro de saída substitui cada nome entre chaves por seu valor.',
              visual: code(`fn main() {
    let count = 5;
    let next = count + 1;
    println!("{count} {next}");
}`, [2, 3], 'src/main.rs • saída: 5 6'),
            },
            {
              title: 'Veja os dois valores',
              body: 'Cada linha cria seu próprio vínculo. A soma lê o primeiro; não escreve nele. Compare com uma atribuição em C: calcular um resultado e armazená-lo em outro nome também preserva o original.',
              visual: table(['Após a linha', 'count', 'next'], [['2', 5, 'não existe'], ['3', 5, 6], ['4', 5, 6]]),
            },
          ],
          exercises: [
            mcq('Qual palavra introduz uma variável local em Rust?', ['let', 'var', 'auto', 'define'], 0, '`let` cria um vínculo local. Os outros nomes não são a palavra usada para essa declaração em Rust.'),
            tf('Calcular um novo valor a partir de uma variável imutável é permitido.', true, 'Imutabilidade impede reatribuir ao vínculo já inicializado. Ler e calcular com o valor é permitido.'),
            num('Qual número o programa imprime?', 12, 'O vínculo `base` recebe 12 e a macro imprime esse valor, seguido de uma quebra de linha.', { visual: code(`fn main() {
    let base = 12;
    println!("{base}");
}`, [3], 'Preveja a saída') }),
            fill('Complete a regra de leitura:', 'Sem mut, o vínculo inicializado é ___.', ['imutável'], ['aleatório', 'global', 'sempre negativo'], 'Uma vez inicializado, um vínculo declarado sem `mut` não permite outra atribuição.'),
            match('Associe cada etapa ao seu efeito:', [['Declarar e inicializar', 'Criar o nome com um valor'], ['Ler', 'Consultar o valor existente'], ['Calcular', 'Produzir um resultado'], ['Imprimir', 'Mostrar um valor no terminal']], 'Declarar cria o vínculo; ler consulta; calcular produz outro valor; imprimir o apresenta ao usuário.'),
            gen((rng) => {
              const a = randInt(rng, 3, 30);
              const b = randInt(rng, 2, 9);
              return num('O que será impresso?', a + b, `A soma é ${a} + ${b} = ${a + b}. Nenhuma atribuição é feita a \`base\`.`, { visual: code(`fn main() {
    let base = ${a};
    let total = base + ${b};
    println!("{total}");
}`, [3], 'Valores novos a cada tentativa') });
            }),
            mcq('O programa compila? Se não, qual é o motivo?', ['Não: reatribui ao vínculo imutável', 'Sim: imprime 6', 'Não: falta uma função main', 'Sim: imprime 5'], 0, 'E0384: “cannot assign twice to immutable variable `x`”. A linha 3 tenta reatribuir ao vínculo inicializado. Adicione `mut` na declaração se a intenção for atualizar o valor.', { visual: code(`fn main() {
    let x = 5;
    x = 6;
    println!("{x}");
}`, [3], 'Não compila • E0384') }),
            codePuzzle('Monte o programa que calcula o dobro de 6 e imprime 12.', [
              'fn main() {',
              '    let base = 6;',
              '    let doubled = base * 2;',
              '    println!("{doubled}");',
              '}',
            ], ['    let base = 8;', '    let doubled = base + 2;'], 'A declaração de `base` vem antes do cálculo que a usa. A impressão usa `doubled`, já calculado: 6 × 2 = 12. Os distratores mudariam a saída para 16 ou 8.'),
          ],
        },
        {
          card: [
            {
              title: 'Mutabilidade é uma escolha',
              body: 'Use `mut` quando o valor precisar ser atualizado. A operação de somar e atribuir muda o mesmo vínculo. `mut` permite trocar o valor, mas não o tipo: um inteiro continua inteiro. Todo valor também precisa ser inicializado antes da primeira leitura.',
              visual: code(`fn main() {
    let mut pulses = 5;
    pulses += 3;
    println!("{pulses}");
}`, [2, 3], 'src/main.rs • saída: 8'),
            },
            {
              title: 'No seu computador',
              body: 'Comece a prática de variáveis do desafio 2 do roteiro. Crie o projeto com o comando abaixo, entre na pasta e edite `src/main.rs`. Guarde 5 pulsos num vínculo mutável, imprima, some 3 e imprima novamente. Mantenha o ganho de 3 em outro vínculo imutável. Pronto quando `cargo run` mostrar 5 e 8, nessa ordem, em linhas separadas, e `cargo clippy -- -D warnings` passar. Rode `cargo fmt`. O fatorial do mesmo desafio será retomado na lição de overflow.',
              visual: code(`cargo new pulse_count
cd pulse_count
cargo run
cargo fmt
cargo clippy -- -D warnings`, [], 'Terminal • edição 2024 no Cargo.toml'),
            },
          ],
          exercises: [
            mcq('O que mut acrescenta a uma declaração let?', ['Permite atualizar o vínculo', 'Permite mudar qualquer tipo', 'Converte o número em float', 'Cria uma constante global'], 0, '`mut` autoriza atualizar o vínculo após a inicialização; o tipo permanece o mesmo.'),
            num('Qual é a saída após a atualização?', 9, 'O contador começa em 7. Somar e atribuir 2 faz o valor passar a 9.', { visual: code(`fn main() {
    let mut count = 7;
    count += 2;
    println!("{count}");
}`, [3], 'Acompanhe o estado') }),
            tf('Usar mut permite atribuir um bool a um vínculo de tipo i32.', false, 'A mutabilidade não muda o tipo. Um vínculo `i32` só recebe valores compatíveis com `i32`.'),
            match('Escolha o tipo de vínculo pela intenção:', [['Leitura fixa do sensor', 'Imutável'], ['Total atualizado a cada soma', 'Mutável'], ['Primeira atribuição de um valor', 'Inicialização'], ['Acesso antes de inicializar', 'Rejeitado pelo compilador']], 'Prefira imutabilidade para o que fica fixo, mutabilidade para atualizações e sempre inicialize antes de ler.'),
            gen((rng) => {
              const start = randInt(rng, 10, 40);
              const gain = randInt(rng, 2, 8);
              return num('Qual valor final será impresso?', start + gain * 2, `Duas atualizações somam ${gain} cada: ${start} + ${gain} + ${gain} = ${start + gain * 2}.`, { visual: code(`fn main() {
    let mut total = ${start};
    total += ${gain};
    total += ${gain};
    println!("{total}");
}`, [3, 4], 'Mesmo vínculo, novos valores') });
            }),
            mcq('Qual linha tenta trocar o tipo do vínculo?', ['Linha 3', 'Linha 1', 'Linha 2', 'Linha 4'], 0, 'E0308: “mismatched types”. `value` é `i32`, mas a linha 3 fornece `bool`. Mesmo com `mut`, o tipo fica fixo. Para guardar esse inteiro, atribua outro `i32`; para outro tipo, crie um novo vínculo.', { visual: code(`fn main() {
    let mut value: i32 = 5;
    value = true;
    println!("{value}");
}`, [2, 3, 4], 'Não compila • E0308') }),
            mcq('Por que esta leitura é rejeitada?', ['O vínculo ainda não foi inicializado', 'println exige mut', 'i32 não permite zero', 'Todo let exige const'], 0, "E0381: “used binding `count` isn't initialized”. Inicialize `count` antes da impressão. Declarar o tipo não atribui automaticamente zero.", { visual: code(`fn main() {
    let count: i32;
    println!("{count}");
}`, [2, 3], 'Não compila • E0381') }),
            codePuzzle('Monte o acumulador: comece em 4, some 3, dobre e imprima 14.', [
              'fn main() {',
              '    let mut total = 4;',
              '    total += 3;',
              '    total *= 2;',
              '    println!("{total}");',
              '}',
            ], ['    let total = 4;', '    total = true;'], 'O vínculo precisa de `mut`. Somar antes de dobrar é essencial: (4 + 3) × 2 = 14. Dobrar antes daria 11. Sem `mut`, a atualização produz E0384: “cannot assign twice to immutable variable `total`”. Atribuir `true` ao inteiro produz E0308: “mismatched types”.'),
          ],
        },
      ],
    },
    {
      id: 'rb-var-shadow', title: 'Shadowing e constantes', parts: [
        {
          card: [
            {
              title: 'Mesmo nome, novo vínculo',
              body: 'Repetir `let` com o mesmo nome cria outro vínculo: shadowing. O lado direito ainda usa o valor anterior; depois, o nome passa a indicar o novo. O novo vínculo pode até ter outro tipo. A medição vira uma decisão booleana, sem tornar o vínculo anterior mutável.',
              visual: code(`fn main() {
    let sample = 4;
    let sample = sample + 2;
    let sample = sample > 5;
    println!("{sample}");
}`, [3, 4], 'src/main.rs • saída: true'),
            },
            {
              title: 'Rastreie os vínculos',
              body: 'O nome é reaproveitado, mas cada declaração tem seu próprio tipo e valor. Shadowing não transforma um inteiro em booleano dentro do mesmo vínculo.',
              visual: table(['Após a linha', 'Tipo visível', 'Valor visível'], [['2', 'i32', '4'], ['3', 'i32', '6'], ['4', 'bool', 'true']]),
            },
          ],
          exercises: [
            mcq('O que caracteriza shadowing?', ['Outro let reutiliza o nome', 'Uma atribuição sem let', 'A remoção de mut', 'Uma conversão automática em texto'], 0, 'Shadowing declara um vínculo novo com o mesmo nome. Uma atribuição atualiza um vínculo existente.'),
            tf('Um novo vínculo por shadowing pode ter tipo diferente do anterior.', true, 'Cada vínculo tem seu próprio tipo. A regra de tipo fixo vale dentro do mesmo vínculo.'),
            num('Qual valor é impresso?', 15, 'O segundo `let` usa o valor anterior, 5, para calcular 5 × 3 = 15.', { visual: code(`fn main() {
    let x = 5;
    let x = x * 3;
    println!("{x}");
}`, [3], 'Novo vínculo') }),
            mcq('Qual tipo está associado ao nome spaces na última linha?', ['usize', 'bool', 'char', 'f64'], 0, '`len()` devolve um `usize`. O primeiro vínculo é texto; o segundo tem tipo `usize` e valor 3. A saída é 3.', { visual: code(`fn main() {
    let spaces = "   ";
    let spaces = spaces.len();
    println!("{spaces}");
}`, [3], 'De texto para comprimento') }),
            match('Associe a ação à regra:', [['Reatribuir com mut', 'Preserva o tipo do vínculo'], ['Declarar outro let', 'Pode escolher um novo tipo'], ['Usar o nome após shadowing', 'Encontra o vínculo mais recente'], ['Lado direito do novo let', 'Pode ler o vínculo anterior']], 'A nova declaração só passa a ocultar a anterior depois de avaliar o inicializador.'),
            gen((rng) => {
              const a = randInt(rng, 2, 12);
              const b = randInt(rng, 2, 5);
              return num('Qual é a saída?', (a + b) * 2, `Os vínculos sucessivos valem ${a}, depois ${a + b}, depois ${(a + b) * 2}.`, { visual: code(`fn main() {
    let x = ${a};
    let x = x + ${b};
    let x = x * 2;
    println!("{x}");
}`, [3, 4], 'Uma transformação por let') });
            }),
            mcq('Por que trocar let por uma atribuição não funciona aqui?', ['O vínculo mantém o tipo de texto', 'len só funciona em mut', 'A string precisa de aspas simples', 'usize é sempre negativo'], 0, 'E0308: “mismatched types”. `spaces` espera `&str`, mas `len()` fornece `usize`. Use outro `let` para criar um vínculo com o tipo novo.', { visual: code(`fn main() {
    let mut spaces = "   ";
    spaces = spaces.len();
    println!("{spaces}");
}`, [3], 'Não compila • E0308') }),
            codePuzzle('Monte a transformação: 3 vira 7 e depois true. Imprima true.', [
              'fn main() {',
              '    let reading = 3;',
              '    let reading = reading + 4;',
              '    let reading = reading > 5;',
              '    println!("{reading}");',
              '}',
            ], ['    reading = reading + 4;', '    reading = reading > 5;'], 'Cada transformação cria outro vínculo. A comparação precisa vir depois da soma, pois passa o tipo de inteiro para `bool`. Sem o novo `let`, a soma tenta reatribuir ao vínculo imutável (E0384: “cannot assign twice to immutable variable `reading`”); a atribuição do booleano ao inteiro tem tipos incompatíveis (E0308: “mismatched types”).'),
          ],
        },
        {
          card: [
            {
              title: 'Escopo e constantes',
              body: 'Um vínculo criado num bloco interno só esconde o externo até a chave de fechamento. Uma `const` define um valor com tipo explícito e expressão avaliável em compilação; não admite `mut`. Use nomes em MAIÚSCULAS_COM_SUBLINHADOS. Nem toda função pode ser chamada numa expressão constante: isso exige operações permitidas em avaliação constante.',
              visual: code(`const GAIN: i32 = 2;
fn main() {
    let x = 3;
    {
        let x = x * GAIN;
        println!("{x}");
    }
    println!("{x}");
}`, [5, 8], 'src/main.rs • saídas: 6 e 3'),
            },
            {
              title: 'No seu computador',
              body: 'Crie `shadow_scope`. Defina uma constante de ganho igual a 2, com tipo explícito. Dentro de `main`, associe 4 a um nome e use shadowing para somar 1. Num bloco interno, crie outro vínculo de mesmo nome multiplicando pelo ganho. Pronto quando `cargo run` imprimir 10 dentro do bloco e 5 fora, em linhas separadas. Rode `cargo fmt` e `cargo clippy -- -D warnings` sem avisos. Depois explique por que o valor externo não virou 10.',
              visual: code(`cargo new shadow_scope
cd shadow_scope
cargo run
cargo fmt
cargo clippy -- -D warnings`, [], 'Terminal • exercício de escopo'),
            },
          ],
          exercises: [
            mcq('Qual informação é obrigatória numa declaração const?', ['O tipo do valor', 'A palavra mut', 'Um valor lido do teclado', 'Uma alocação no heap'], 0, 'Constantes exigem anotação de tipo e um inicializador avaliável em compilação.'),
            tf('Uma constante pode depender de um valor que só será lido do usuário durante a execução.', false, 'O inicializador deve ser avaliável em compilação; uma entrada futura do usuário não está disponível nessa etapa.'),
            num('Qual é a última saída, depois do bloco?', 4, 'O vínculo interno vale 9 e só existe no bloco. Ao sair dele, `x` volta a designar o vínculo externo de valor 4.', { visual: code(`fn main() {
    let x = 4;
    {
        let x = x + 5;
        println!("{x}");
    }
    println!("{x}");
}`, [7], 'Duas saídas: observe a última') }),
            match('Associe cada ideia à propriedade:', [['const', 'Exige tipo explícito'], ['mut', 'Permite reatribuir um vínculo'], ['Shadowing interno', 'Termina ao sair do bloco'], ['Nome de constante', 'MAIÚSCULAS_COM_SUBLINHADOS']], 'Constantes têm tipo explícito; `mut` é para vínculos de variáveis; shadowing respeita escopos; maiúsculas são a convenção de nomes de constantes.'),
            gen((rng) => {
              const n = randInt(rng, 2, 12);
              const k = randInt(rng, 2, 5);
              return num('Qual é a primeira saída, dentro do bloco?', n * k, `O vínculo interno recebe ${n} × ${k} = ${n * k}; fora do bloco, a segunda saída seria ${n}.`, { visual: code(`const GAIN: i32 = ${k};
fn main() {
    let x = ${n};
    {
        let x = x * GAIN;
        println!("{x}");
    }
    println!("{x}");
}`, [5, 6], 'Escopo sorteado') });
            }),
            mcq('Qual é a saída deste cálculo com constante?', ['120', '60', '2', 'Não compila'], 0, 'A multiplicação de literais é uma expressão constante válida. `SECONDS` tem tipo explícito `u32` e valor 60 × 2 = 120.', { visual: code(`const SECONDS: u32 = 60 * 2;
fn main() {
    println!("{SECONDS}");
}`, [1], 'Constante calculada') }),
            fill('Complete a distinção:', 'Shadowing cria um vínculo ___; atribuição usa o vínculo ___.', ['novo', 'existente'], ['global', 'inexistente'], 'Mesmo nome não significa mesmo vínculo: um novo `let` declara outro; atribuir com `=` usa o que já existe.'),
            codePuzzle('Monte duas transformações por shadowing: 10 vira 15 e depois 30. Imprima 30.', [
              'fn main() {',
              '    let x = 10;',
              '    let x = x + 5;',
              '    let x = x * 2;',
              '    println!("{x}");',
              '}',
            ], ['    x = x + 5;', '    x = x * 2;'], 'Cada transformação precisa de outro `let`. A soma vem antes da multiplicação para produzir (10 + 5) × 2 = 30; invertê-las produziria 25. Os distratores retiram `let` e tentam reatribuir ao vínculo imutável: E0384, “cannot assign twice to immutable variable `x`”.'),
          ],
        },
      ],
    },
    {
      id: 'rb-var-escalar', title: 'Inteiros, floats, bool e char', parts: [
        {
          card: [
            {
              title: 'Bits, sinal e faixa',
              body: t`Inteiros com sinal usam o prefixo i; sem sinal, u. Existem larguras de 8, 16, 32, 64 e 128 bits: i8 até i128 e u8 até u128. Para $n$ bits, a faixa com sinal vai de $-2^{n-1}$ a $2^{n-1}-1$; sem sinal, de $0$ a $2^n-1$. Zero também pertence aos tipos sem sinal. O exemplo mostra os extremos de 8 bits.`,
              visual: code(`fn main() {
    println!("{} {}", i8::MIN, i8::MAX);
    println!("{} {}", u8::MIN, u8::MAX);
}`, [2, 3], 'Saídas: -128 127 e 0 255'),
            },
            {
              title: 'Escolha a largura',
              body: '`isize` e `usize` têm a largura dos ponteiros da arquitetura de destino: em alvos de 32 bits, têm 32 bits; em alvos de 64 bits, 64. `usize` é o tipo usado para índices de arrays e comprimentos. O sufixo de um literal escolhe seu tipo; o sublinhado só facilita a leitura, sem mudar o valor.',
              visual: table(['Bits', 'Com sinal', 'Sem sinal'], [[8, 'i8', 'u8'], [16, 'i16', 'u16'], [32, 'i32', 'u32'], [64, 'i64', 'u64'], [128, 'i128', 'u128'], ['ponteiro do alvo', 'isize', 'usize']]),
            },
            {
              title: 'Separar dígitos e fixar o tipo',
              body: 'Os 1.000 pulsos são armazenados como `u32`. O ponto usado na prosa em português não entra no literal Rust: escreva sublinhado para separar milhares. O sufixo pode aparecer junto ao número.',
              visual: code(`fn main() {
    let pulses = 1_000u32;
    println!("{pulses}");
}`, [2], 'src/main.rs • saída: 1000'),
            },
          ],
          exercises: [
            mcq('Qual tipo de 16 bits permite números negativos?', ['i16', 'u16', 'usize', 'bool'], 0, 'O prefixo `i` indica inteiro com sinal; 16 é sua largura em bits. `u16` não admite valores negativos.'),
            match('Associe o tipo à largura:', [['i8', '8 bits com sinal'], ['u32', '32 bits sem sinal'], ['i128', '128 bits com sinal'], ['usize', 'Largura dos ponteiros do alvo']], 'Os tipos de largura fixa trazem os bits no nome. `usize` acompanha a arquitetura de destino.'),
            num('Qual valor será impresso?', 2500, 'O sublinhado é separador visual e `u16` escolhe o tipo. O valor numérico é 2500 e cabe na faixa de `u16`.', { visual: code(`fn main() {
    let count = 2_500u16;
    println!("{count}");
}`, [2], 'Literal com sufixo') }),
            tf('u64 tem o dobro de bits de u32, mas não apenas o dobro de valores possíveis.', true, 'Com n bits existem 2 elevado a n padrões. Passar de 32 para 64 bits multiplica a quantidade de padrões por 2 elevado a 32, não por 2.'),
            gen((rng) => {
              const bits = [8, 16, 32][randInt(rng, 0, 2)];
              const signed = randInt(rng, 0, 1) === 1;
              const type = `${signed ? 'i' : 'u'}${bits}`;
              const max = 2 ** (bits - (signed ? 1 : 0)) - 1;
              return num(`Qual é o maior inteiro representável em ${type}?`, max, signed ? `Com sinal e ${bits} bits: 2 elevado a ${bits - 1}, menos 1, resulta em ${max}.` : `Sem sinal e ${bits} bits: 2 elevado a ${bits}, menos 1, resulta em ${max}.`, { visual: code(`fn main() {
    println!("{}", ${type}::MAX);
}`, [2], 'Calcule a saída pela faixa'), tol: 0 });
            }),
            gen((rng) => {
              const bits = [8, 16, 32][randInt(rng, 0, 2)];
              const min = -(2 ** (bits - 1));
              return num(`Qual é o menor inteiro representável em i${bits}?`, min, `O mínimo com sinal é o negativo de 2 elevado a ${bits - 1}: ${min}. Há um valor negativo a mais que positivo.`, { visual: code(`fn main() {
    println!("{}", i${bits}::MIN);
}`, [2], 'A outra ponta da faixa'), tol: 0 });
            }),
            mcq('Para uma temperatura inteira entre −50 e 100, qual é o menor tipo entre estes que guarda toda a faixa?', ['i8', 'u8', 'bool', 'char'], 0, '`i8` cobre de −128 a 127. `u8` não admite negativos, `bool` é lógico e `char` representa um valor escalar Unicode.'),
            codePuzzle('Monte a contagem: 1.000 pulsos, depois mais 24; imprima 1024 como u32.', [
              'fn main() {',
              '    let pulses = 1_000u32;',
              '    let total = pulses + 24;',
              '    println!("{total}");',
              '}',
            ], ['    let pulses = 100u32;', '    let total = pulses - 24;'], 'O literal 1000 cabe em `u32`; 24 é inferido no mesmo tipo pela soma. O resultado é 1024. Os distratores mudariam a saída para 124 ou 976.'),
          ],
        },
        {
          card: [
            {
              title: 'Reais aproximados, lógica e Unicode',
              body: '`f32` ocupa 32 bits e `f64`, 64; ambos usam ponto flutuante binário IEEE 754. Sem outra restrição, um literal com parte decimal assume `f64`. No código, o separador decimal é ponto. `bool` ocupa 1 byte e só vale `true` ou `false`. `char` ocupa sempre 4 bytes e guarda um valor escalar Unicode, escrito com aspas simples; não é o `char` de 1 byte de C. Nem todo símbolo visual composto cabe num único `char`.',
              visual: code(`fn main() {
    let volts: f32 = 2.5;
    let active: bool = true;
    let symbol: char = 'Ω';
    println!("{volts} {active}");
    println!("{symbol}");
}`, [2, 3, 4], 'Saídas: 2.5 true e Ω'),
            },
            {
              title: 'Dividir inteiros não cria fração',
              body: 'A divisão entre inteiros trunca em direção a zero. Entre floats, ela produz uma aproximação com parte fracionária. Um float tem precisão finita: por exemplo, um décimo não tem representação binária exata. Não trate todo decimal como uma medida exata.',
              visual: code(`fn main() {
    println!("{}", 5 / 2);
    println!("{}", 5.0 / 2.0);
    println!("{}", -5 / 2);
}`, [2, 3, 4], 'Saídas: 2, 2.5 e -2'),
            },
            {
              title: 'No seu computador',
              body: 'Crie `sensor_types`. Declare e use uma temperatura negativa em `i16`, uma contagem de 1.000 em `u32`, uma tensão de 2.5 em `f64`, um estado `true` em `bool` e o símbolo Ω em `char`. Imprima um valor por linha, nessa ordem: -12, 1000, 2.5, true, Ω. Pronto quando `cargo run` mostrar exatamente esses valores e `cargo clippy -- -D warnings` não apontar avisos. Rode `cargo fmt`. Explique por que `u16` não serviria para a temperatura escolhida.',
              visual: code(`cargo new sensor_types
cd sensor_types
cargo run
cargo fmt
cargo clippy -- -D warnings`, [], 'Terminal • relatório tipado'),
            },
          ],
          exercises: [
            match('Associe os tipos às representações:', [['f32', 'Float de 32 bits'], ['f64', 'Float de 64 bits'], ['bool', 'Lógico de 1 byte'], ['char', 'Escalar Unicode de 4 bytes']], 'Floats representam aproximações; `bool` representa lógica; `char` tem espaço fixo para um valor escalar Unicode.'),
            mcq('Qual é o tipo de uma variável inicializada só com o literal 2.5, sem outra restrição?', ['f64', 'f32', 'i32', 'char'], 0, 'O padrão de inferência para ponto flutuante é `f64`. Uma anotação ou o uso posterior pode restringir o tipo a `f32`.'),
            num('Quantos bytes ocupa este valor char?', 4, 'Todo `char` ocupa 4 bytes, inclusive quando o símbolo é ASCII. Isso difere da codificação UTF-8 de textos, que usa quantidade variável de bytes por valor escalar.', { visual: code(`use std::mem::size_of_val;
fn main() {
    let symbol = 'A';
    let bytes = size_of_val(&symbol);
    println!("{bytes}");
}`, [3, 4], 'size_of_val informa bytes') }),
            mcq('Qual é a saída, respeitando o ponto decimal do Rust?', ['2.5', '2', 'true', 'Não compila'], 0, 'Os dois operandos são floats. A divisão 5.0 por 2.0 resulta exatamente em 2.5, que a macro imprime com ponto.', { visual: code(`fn main() {
    let ratio = 5.0 / 2.0;
    println!("{ratio}");
}`, [2], 'Divisão em ponto flutuante') }),
            gen((rng) => {
              const den = randInt(rng, 2, 7);
              const q = randInt(rng, 2, 8);
              const value = q * den + 1;
              return num('Qual inteiro será impresso?', q, `${value} dividido por ${den} dá quociente ${q} e resto 1. A divisão inteira descarta a parte fracionária.`, { visual: code(`fn main() {
    let result = ${value} / ${den};
    println!("{result}");
}`, [2], 'Divisão inteira sorteada') });
            }),
            tf('Um char de Rust representa necessariamente uma letra visual completa, mesmo se formada por vários valores Unicode.', false, 'Um `char` representa exatamente um valor escalar Unicode. Uma letra com marca combinante ou um emoji composto pode exigir vários valores escalares.'),
            mcq('O programa compila com essa anotação?', ['Não: aspas duplas produzem texto', 'Sim: imprime A', 'Não: char só admite números', 'Sim: imprime 65'], 0, 'E0308: “mismatched types”. A anotação exige `char`, mas aspas duplas produzem `&str`. Corrija usando aspas simples em torno de A; a saída corrigida será A.', { visual: code(`fn main() {
    let symbol: char = "A";
    println!("{symbol}");
}`, [2], 'Não compila • E0308') }),
            codePuzzle('Monte a decisão: tensão 2.5, dobro 5.0; imprima true se o dobro supera 4.0.', [
              'fn main() {',
              '    let volts: f64 = 2.5;',
              '    let doubled = volts * 2.0;',
              '    let active = doubled > 4.0;',
              '    println!("{active}");',
              '}',
            ], ['    let active: bool = doubled;', '    let doubled = volts * 1.0;'], 'A multiplicação usa operandos compatíveis de ponto flutuante. A comparação produz `bool`, e 5.0 > 4.0 é `true`. Atribuir diretamente `doubled` a um `bool` produz E0308: “mismatched types”. Multiplicar por 1.0 compila, mas a decisão seria `false`.'),
          ],
        },
      ],
    },
    {
      id: 'rb-var-comp', title: 'Tuplas e arrays', parts: [
        {
          card: [
            {
              title: 'Uma tupla reúne tipos diferentes',
              body: 'Uma tupla tem comprimento fixo, e cada posição tem seu próprio tipo. Acesso por ponto usa índices literais começando em zero. A desestruturação dá nomes às posições; o sublinhado ignora uma posição. Aqui um código inteiro, uma medida e um estado lógico viajam juntos.',
              visual: code(`fn main() {
    let sensor = (7u8, 2.5, true);
    let (id, volts, active) = sensor;
    println!("{id} {volts} {active}");
    println!("{}", sensor.1);
}`, [2, 3, 5], 'Saídas: 7 2.5 true e 2.5'),
            },
            {
              title: 'Posições da tupla',
              body: 'A tupla preserva a ordem. O tipo da posição 0 não precisa ser igual ao da posição 1. A tupla vazia é chamada unit: seu valor e seu tipo são escritos `()`.',
              visual: table(['Posição', 'Tipo', 'Valor'], [[0, 'u8', '7'], [1, 'f64', '2.5'], [2, 'bool', 'true']]),
            },
          ],
          exercises: [
            mcq('Qual propriedade distingue uma tupla de um array?', ['As posições podem ter tipos diferentes', 'A tupla cresce automaticamente', 'Só aceita inteiros positivos', 'O primeiro índice é 1'], 0, 'Uma tupla pode agrupar tipos diferentes; arrays têm um único tipo de elemento. Os dois têm comprimento fixo.'),
            num('Qual posição é lida e qual número aparece? Digite apenas o número impresso.', 9, 'O índice após o ponto é zero. A posição 0 contém 9; a posição 1 contém 4.', { visual: code(`fn main() {
    let pair = (9, 4);
    println!("{}", pair.0);
}`, [3], 'Acesso à tupla') }),
            match('Associe cada conceito:', [['Primeira posição', 'Índice 0'], ['Desestruturação', 'Dar nomes às posições'], ['Tupla vazia', 'unit'], ['Comprimento da tupla', 'Fixo']], 'Os índices começam em zero; a desestruturação segue a ordem das posições; unit é a tupla sem elementos.'),
            mcq('Qual é a saída após desestruturar?', ['3.5', '8', 'true', 'Não compila'], 0, 'O padrão ignora as posições 0 e 2. `volts` recebe a posição 1, que contém 3.5.', { visual: code(`fn main() {
    let sensor = (8u8, 3.5, true);
    let (_, volts, _) = sensor;
    println!("{volts}");
}`, [3], 'Selecionar uma posição') }),
            gen((rng) => {
              const a = randInt(rng, 2, 20);
              const b = randInt(rng, 2, 10);
              return num('Qual total será impresso?', a + b, `A desestruturação atribui ${a} a \`left\` e ${b} a \`right\`. A soma vale ${a + b}.`, { visual: code(`fn main() {
    let pair = (${a}, ${b});
    let (left, right) = pair;
    println!("{}", left + right);
}`, [3, 4], 'Tupla sorteada') });
            }),
            tf('Uma tupla de três posições pode ganhar uma quarta posição por uma simples atualização do mesmo vínculo.', false, 'A quantidade e os tipos das posições fazem parte do tipo da tupla. Ser mutável não permite alterar esse tipo.'),
            mcq('Por que esta atribuição é rejeitada?', ['A segunda posição exige bool', 'Tuplas não permitem anotação de tipo', 'O primeiro número deveria ser negativo', 'Tuplas só aceitam floats'], 0, 'E0308: “mismatched types”. O tipo esperado para a segunda posição é `bool`, mas 1 é inteiro. Substitua 1 por `true` ou `false`, conforme o estado desejado.', { visual: code(`fn main() {
    let sensor: (u8, bool) = (7, 1);
    println!("{:?}", sensor);
}`, [2], 'Não compila • E0308') }),
            codePuzzle('Monte o programa que lê a segunda posição e imprime seu dobro: 12.', [
              'fn main() {',
              '    let pair = (4, 6);',
              '    let value = pair.1;',
              '    let doubled = value * 2;',
              '    println!("{doubled}");',
              '}',
            ], ['    let value = pair.0 + pair.1;', '    let value = pair.0;'], 'Tuplas usam ponto seguido do índice literal. A posição 1 vale 6; seu dobro é 12. Cada linha depende da anterior. Somar as duas posições levaria a 20; usar só a posição 0 levaria a 8.'),
          ],
        },
        {
          card: [
            {
              title: 'Array: mesmo tipo, tamanho fixo',
              body: 'O tipo de um array registra o elemento e o comprimento. O inicializador com repetição cria três zeros. Com `mut`, é possível mudar um elemento, preservando tipo e comprimento. Acesso usa colchetes, e o último índice válido é o comprimento menos um. Um índice inválido em execução causa pânico, sem ler memória arbitrária.',
              visual: code(`fn main() {
    let mut samples: [i32; 3] = [0; 3];
    samples[1] = 8;
    println!("{:?}", samples);
    println!("{}", samples.len());
}`, [2, 3], 'Saídas: [0, 8, 0] e 3'),
            },
            {
              title: 'Mapa do array após a escrita',
              body: 'Os elementos são contíguos. Atualizar o índice 1 não insere uma posição nova. Para índices calculados, Rust usa `usize`. Se o compilador provar que o acesso sai da faixa, ele também pode rejeitar o código antes de executar.',
              visual: table(['Índice', 'Antes', 'Depois'], [[0, 0, 0], [1, 0, 8], [2, 0, 0]]),
            },
            {
              title: 'No seu computador',
              body: 'Crie `sample_report`. Declare um array mutável de três temperaturas inteiras: 18, 20 e 22. Atualize a posição 1 para 24. Guarde numa tupla o comprimento e o elemento da posição 1; desestruture e imprima os dois. Pronto quando `cargo run` imprimir 3 24 numa linha e o array [18, 24, 22] na seguinte. Use formatação de depuração para o array. Rode `cargo fmt` e `cargo clippy -- -D warnings` sem avisos.',
              visual: code(`cargo new sample_report
cd sample_report
cargo run
cargo fmt
cargo clippy -- -D warnings`, [], 'Terminal • agrupar medições'),
            },
          ],
          exercises: [
            mcq('O que o comprimento de um array representa?', ['A quantidade fixa de elementos', 'O último índice válido', 'O tamanho sempre em bytes', 'A quantidade de elementos não nulos'], 0, 'O comprimento conta todos os elementos, inclusive zeros. O último índice válido é uma unidade menor.'),
            num('Qual número aparece na saída?', 6, 'O inicializador repete o valor 6 em quatro posições. O índice 2 é a terceira posição e também contém 6.', { visual: code(`fn main() {
    let values = [6; 4];
    println!("{}", values[2]);
}`, [2, 3], 'Array com repetição') }),
            match('Associe cada propriedade de array:', [['Tipo de elemento', 'Igual em todas as posições'], ['Comprimento', 'Parte do tipo'], ['Último índice válido', 'Comprimento menos um'], ['Índice calculado', 'Tipo usize']], 'Um array de comprimento N armazena N elementos do mesmo tipo, com índices de zero até N menos um.'),
            num('Qual valor é impresso depois da atualização?', 11, 'A posição 0 começa em 3 e recebe a soma 3 + 8 = 11. As demais posições ficam iguais.', { visual: code(`fn main() {
    let mut values = [3, 8, 5];
    let sum = values[0] + values[1];
    values[0] = sum;
    println!("{}", values[0]);
}`, [3, 4], 'Atualizar uma posição') }),
            gen((rng) => {
              const a = randInt(rng, 2, 20);
              const b = randInt(rng, 21, 40);
              const c = randInt(rng, 41, 60);
              const index = randInt(rng, 0, 2);
              return num('Qual elemento será impresso?', [a, b, c][index], `O índice ${index} seleciona a posição ${index + 1} na ordem visual: ${[a, b, c][index]}.`, { visual: code(`fn main() {
    let values = [${a}, ${b}, ${c}];
    let index: usize = ${index};
    println!("{}", values[index]);
}`, [3, 4], 'Índice sempre dentro da faixa') });
            }),
            tf('Um array mutável de três inteiros pode receber um array de quatro inteiros por simples atribuição.', false, 'O comprimento faz parte do tipo. Mutabilidade permite substituir valores por outros do mesmo tipo, não trocar o comprimento do array.'),
            mcq('O que impede a compilação?', ['O tipo exige 3 elementos, mas há 2', 'O valor zero é proibido', 'Arrays precisam de mut', 'i32 não pode ser elemento de array'], 0, 'E0308: “mismatched types”. O tipo anotado é um array de tamanho 3; o inicializador tem tamanho 2. Altere a anotação para 2 ou forneça o terceiro elemento.', { visual: code(`fn main() {
    let values: [i32; 3] = [1, 2];
    println!("{:?}", values);
}`, [2], 'Não compila • E0308') }),
            codePuzzle('Monte o programa: copie o primeiro valor mais 5 para a segunda posição e imprima 7.', [
              'fn main() {',
              '    let mut values = [2, 0];',
              '    values[1] = values[0] + 5;',
              '    let result = values[1];',
              '    println!("{result}");',
              '}',
            ], ['    let mut values = [3, 0];', '    values[1] = values[0] - 1;'], 'O array precisa de `mut`. Seus índices válidos são 0 e 1. A leitura do resultado vem depois da atualização, que armazena 2 + 5 = 7. Os distratores mudariam a saída para 8 ou 1.'),
          ],
        },
      ],
    },
    {
      id: 'rb-var-conv', title: 'Conversões, inferência e overflow', parts: [
        {
          card: [
            {
              title: 'Inferir não é converter',
              body: 'Rust deduz tipos pelo literal e pelo uso. Sem restrição, um inteiro assume `i32` e um float, `f64`. Uma anotação ou sufixo pode escolher outro tipo. Não há conversão numérica implícita na atribuição entre tipos diferentes. O operador `as` pede uma conversão explícita; converter antes de dividir permite obter a parte fracionária.',
              visual: code(`fn main() {
    let count = 5u16;
    let ratio = count as f64 / 2.0;
    println!("{ratio}");
}`, [2, 3], 'src/main.rs • saída: 2.5'),
            },
            {
              title: 'as pode perder informação',
              body: 'Converter inteiro para um inteiro menor descarta os bits altos; não valida a faixa. Aqui sobram os 8 bits baixos: 300 módulo 256 é 44. De float finito na faixa do destino para inteiro, `as` trunca em direção a zero. De inteiro para float, pode haver arredondamento quando falta precisão. Para conversões infalíveis, existe `From`; quando a conversão pode falhar, existe `TryFrom`. Veremos essas duas interfaces em detalhe depois: `as` não substitui validação.',
              visual: code(`fn main() {
    let large = 300u16;
    let small = large as u8;
    println!("{small}");
    println!("{}", -3.9f64 as i32);
}`, [3, 5], 'Saídas: 44 e -3'),
            },
            {
              title: 'Veja a ordem da operação',
              body: 'Uma conversão posterior não recupera a fração já descartada na divisão inteira. Para obter uma média fracionária, converta os operandos antes de dividir.',
              visual: table(['Etapa', 'Caminho inteiro', 'Caminho float'], [['Começo', '5 e 2', '5.0 e 2.0'], ['Divisão', '2', '2.5'], ['Converter resultado a f64', '2.0', '2.5']]),
            },
          ],
          exercises: [
            mcq('Sem anotação, sufixo ou outro uso que restrinja o tipo, qual é o padrão de um literal inteiro?', ['i32', 'u8', 'usize', 'f64'], 0, 'Na ausência de restrições, o inteiro assume `i32`. Não confunda o padrão dos inteiros com o dos floats, que é `f64`.'),
            mcq('Qual é o tipo inferido para count a partir da soma?', ['u16', 'i32', 'f64', 'bool'], 0, 'A soma exige operandos compatíveis. `step` é `u16`, então esse uso restringe `count` e o resultado a `u16`; a saída é 7.', { visual: code(`fn main() {
    let count = 5;
    let step = 2u16;
    let total = count + step;
    println!("{total}");
}`, [2, 3, 4], 'A inferência considera o uso') }),
            num('Qual inteiro aparece após a conversão?', -3, 'O float está na faixa de `i32`. A conversão descarta a parte fracionária em direção a zero: -3.9 vira -3, não -4.', { visual: code(`fn main() {
    let value = -3.9f64 as i32;
    println!("{value}");
}`, [2], 'Conversão explícita') }),
            match('Associe a ferramenta à ideia:', [['Inferência', 'Deduzir o tipo pelo contexto'], ['as', 'Converter, podendo perder informação'], ['From', 'Conversão infalível'], ['TryFrom', 'Conversão que pode falhar']], 'Inferir escolhe um tipo compatível; converter transforma o valor para outro tipo. `From` e `TryFrom` expressam contratos distintos de conversão.'),
            gen((rng) => {
              const high = randInt(rng, 1, 3);
              const low = randInt(rng, 2, 240);
              const value = high * 256 + low;
              return num('Qual valor será impresso após reduzir para u8?', low, `A conversão guarda os bits baixos: ${value} = ${high} × 256 + ${low}. O resto módulo 256 é ${low}.`, { visual: code(`fn main() {
    let wide = ${value}u16;
    let narrow = wide as u8;
    println!("{narrow}");
}`, [3], 'Truncamento de inteiro') });
            }),
            mcq('A anotação de destino faz uma conversão automática?', ['Não: o valor fornecido tem tipo u8', 'Sim: imprime 5', 'Sim: transforma em texto', 'Não: u16 não permite 5'], 0, 'E0308: “mismatched types”. O destino espera `u16`, mas `small` é `u8`. Uma conversão explícita de `small` para `u16` resolve; esse alargamento preserva o valor.', { visual: code(`fn main() {
    let small = 5u8;
    let wide: u16 = small;
    println!("{wide}");
}`, [3], 'Não compila • E0308') }),
            num('Qual número é impresso? Observe quando ocorre a conversão.', 2, 'A divisão inteira ocorre primeiro e produz 2. Só depois o resultado vira float. A macro imprime 2; a fração perdida não reaparece.', { visual: code(`fn main() {
    let ratio = (5 / 2) as f64;
    println!("{ratio}");
}`, [2], 'Converter tarde demais') }),
            codePuzzle('Monte a média de duas amostras com soma 7: converta antes da divisão e imprima 3.5.', [
              'fn main() {',
              '    let sum = 7u16;',
              '    let real = sum as f64;',
              '    let mean = real / 2.0;',
              '    println!("{mean}");',
              '}',
            ], ['    let real: f64 = sum;', '    let mean = (sum / 2) as f64;'], 'Converter 7 para `f64` antes da divisão preserva a fração: 7.0 / 2.0 = 3.5. Dividir os inteiros primeiro produziria 3. Anotar `f64` sem converter o valor `u16` causa E0308: “mismatched types”.'),
          ],
        },
        {
          card: [
            {
              title: 'Overflow: a regra deve ser explícita',
              body: 'Overflow ocorre quando o resultado de uma operação inteira não cabe no tipo. Para soma, subtração e multiplicação em execução, os perfis padrão do Cargo verificam overflow em debug e causam pânico; em release, usam wrapping em complemento de dois. Essas verificações são configuráveis: não use a escolha do perfil como regra do programa. Overflow que o compilador consegue detectar num cálculo constante pode ser rejeitado já na compilação.',
              visual: code(`use std::hint::black_box;
fn main() {
    let n = black_box(255u8);
    println!("{}", n + 1);
}`, [3, 4], 'Debug: pânico; release padrão: 0'),
            },
            {
              title: 'Três respostas possíveis ao limite',
              body: 'Os métodos deixam a política explícita nos dois perfis. `checked_add` devolve `Some(valor)` quando cabe ou `None` quando não cabe; são os dois casos de `Option`, que será estudado depois. `wrapping_add` volta ao começo da faixa; `saturating_add` prende no limite. As famílias `checked_`, `wrapping_` e `saturating_` também oferecem operações como subtração e multiplicação.',
              visual: code(`fn main() {
    let n = 250u8;
    println!("{:?}", n.checked_add(10));
    println!("{}", n.wrapping_add(10));
    let capped = n.saturating_add(10);
    println!("{capped}");
}`, [3, 4, 5, 6], 'Saídas: None, 4 e 255'),
            },
            {
              title: 'A política muda o significado',
              body: 'Um contador circular pode dar a volta; uma intensidade máxima pode saturar; uma soma de medições pode exigir rejeitar o resultado. Escolha pela necessidade, não para esconder o problema.',
              visual: table(['Método para 250 + 10 em u8', 'Resultado'], [['checked_add', 'None'], ['wrapping_add', '4'], ['saturating_add', '255']]),
            },
            {
              title: 'No seu computador',
              body: 'Retome o desafio 2 do roteiro: crie `factorial_limits`. Use um acumulador `u64` inicialmente igual a 1 e um laço que multiplique pelos inteiros de 1 até n, inclusive. O laço é uma antecipação da próxima unidade: ele percorre de 1 até n, incluindo n. Use a estrutura abaixo e experimente os limites. Pronto quando n = 20 imprimir 2432902008176640000, e n = 21 causar pânico de overflow com `cargo run` no perfil debug padrão. Em `cargo run --release`, com o perfil padrão sem verificações de overflow, 21! imprime 14197454024290336768. Depois substitua a multiplicação por `saturating_mul`: 21! deve imprimir 18446744073709551615 nos dois perfis. Finalize com `cargo fmt` e `cargo clippy -- -D warnings` sem avisos. Confira que Cargo.toml usa edição 2024.',
              visual: code(`// Após cargo new factorial_limits
fn main() {
    let n = 20u64;
    let mut product = 1u64;
    for factor in 1..=n {
        product *= factor;
    }
    println!("{product}");
}`, [3, 6], 'Base do desafio • troque n e a política'),
            },
          ],
          exercises: [
            mcq('No perfil debug padrão, o que acontece quando uma soma inteira em execução ultrapassa a faixa?', ['O programa entra em pânico', 'O tipo aumenta automaticamente', 'O valor vira float', 'O resultado sempre fica no máximo'], 0, 'Com as verificações de overflow do perfil debug padrão, a soma causa pânico quando o resultado não cabe. O tipo não aumenta automaticamente.'),
            mcq('E no perfil release padrão, sem verificações de overflow, quanto vale 255 + 1 em u8?', ['0', '255', '256', '−1'], 0, 'A soma dá a volta na faixa de 8 bits sem sinal: 256 módulo 256 é 0. Isso descreve soma em execução, não um literal inválido de `u8`.'),
            match('Associe a política ao comportamento em caso de overflow:', [['checked_add', 'Sinaliza ausência com None'], ['wrapping_add', 'Dá a volta na faixa'], ['saturating_add', 'Prende no limite da faixa'], ['Soma em debug padrão', 'Causa pânico em execução']], 'Os métodos explicitam políticas que não dependem de debug ou release. A soma comum depende das verificações configuradas.'),
            num('Qual número o método devolve e imprime?', 255, '250 + 20 excede 255. A soma saturante para no máximo de `u8`: 255.', { visual: code(`fn main() {
    let level = 250u8;
    let next = level.saturating_add(20);
    println!("{next}");
}`, [3], 'Uma intensidade com teto') }),
            mcq('Qual é a saída de depuração?', ['Some(15)', 'None', '15', 'Pânico'], 0, '10 + 5 cabe em `u8`, então `checked_add` devolve `Some(15)`. A formatação de depuração mostra o nome `Some` e seu conteúdo.', { visual: code(`fn main() {
    let next = 10u8.checked_add(5);
    println!("{:?}", next);
}`, [2], 'Checked quando cabe') }),
            gen((rng) => {
              const start = randInt(rng, 240, 250);
              const step = randInt(rng, 20, 40);
              const result = (start + step) % 256;
              return num('Qual valor será impresso com wrapping explícito?', result, `${start} + ${step} = ${start + step}. Tirando uma volta de 256, resta ${result}. O método explicita a mesma política nos dois perfis.`, { visual: code(`fn main() {
    let count = ${start}u8;
    let next = count.wrapping_add(${step});
    println!("{next}");
}`, [3], 'Contador circular sorteado') });
            }),
            mcq('O que este programa imprime?', ['None', '0', '255', 'Some(260)'], 0, 'O resultado matemático 260 não cabe em `u8`. `checked_add` sinaliza isso com `None`; ele não prende em 255 nem dá a volta.', { visual: code(`fn main() {
    let next = 250u8.checked_add(10);
    println!("{:?}", next);
}`, [2], 'Checked quando não cabe') }),
            codePuzzle('Monte o contador: 250 mais 10 com wrapping, depois dobre e imprima 8.', [
              'fn main() {',
              '    let count = 250u8;',
              '    let next = count.wrapping_add(10);',
              '    let doubled = next * 2;',
              '    println!("{doubled}");',
              '}',
            ], ['    let next = count.wrapping_add(9);', '    let next = count.wrapping_add(11);'], 'Wrapping de 250 + 10 em `u8` resulta em 4; dobrar dá 8 e cabe no tipo. Somar 9 daria 3 e o dobro 6; somar 11 daria 5 e o dobro 10. Só somar 10 produz a saída pedida.'),
          ],
        },
      ],
    },
  ],
};
