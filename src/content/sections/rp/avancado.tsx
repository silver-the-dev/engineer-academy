import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { code, fill, gen, match, mcq, multi, num, order, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { randInt } from '../../../lib/random';
import { Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';

// Duas células e uma ligação; os botões revelam a mudança de estado.
const trace = (states: { left: string; right: string; detail: string }[]): VisualSpec => ({
  name: 'stepper',
  props: {
    steps: states.length,
    height: 140,
    view: { xMin: -2, xMax: 3, yMin: -1, yMax: 1 },
    render: (k: number) => <>
      <Seg x1={-1} y1={0} x2={1} y2={0} color={C.cyan} />
      <Pt x={-1} y={0} label={states[k].left} color={C.gold} />
      <Pt x={1} y={0} label={states[k].right} color={C.success} />
    </>,
    info: (k: number) => states[k].detail,
  },
});

const square = `macro_rules! square {
    ($x:expr) => {{
        let v = $x;
        v * v
    }};
}
fn main() {
    println!("{}", square!(3 + 1));
}`;

const sum = `macro_rules! sum {
    ($($x:expr),*) => {
        0 $(+ $x)*
    };
}
fn main() {
    println!("{}", sum!(2, 3, 4));
}`;

const rawRead = `fn main() {
    let mut n = 7;
    let p = &raw mut n;
    // SAFETY: n vive e p pode escrever.
    unsafe { *p += 2; }
    println!("{n}");
}`;

const swapRaw = `/// # Safety
/// a e b: válidos, alinhados,
/// inicializados, graváveis; sem
/// acessos concorrentes conflitantes.
unsafe fn swap_raw(
    a: *mut i32,
    b: *mut i32,
) {
    // SAFETY: contrato do chamador.
    unsafe { core::ptr::swap(a, b); }
}
fn main() {
    let mut a = 2;
    let mut b = 9;
    // SAFETY: dois locais exclusivos.
    unsafe {
        swap_raw(
            &raw mut a,
            &raw mut b,
        );
    }
    println!("{a} {b}");
}`;

const foreignAbs = `use core::ffi::c_int;
unsafe extern "C" {
    fn abs(n: c_int) -> c_int;
}
fn main() {
    // SAFETY: -12 cabe em c_int;
    // seu módulo também cabe.
    let n = unsafe { abs(-12) };
    println!("{n}");
}`;

const sample = `#[repr(C)]
struct Sample {
    channel: u8,
    value: u32,
}
fn main() {
    let s = Sample {
        channel: 1,
        value: 7,
    };
    println!(
        "{} {}", s.channel, s.value
    );
}`;

const exportSum = `use core::ffi::c_int;
// SAFETY: símbolo único na biblioteca.
#[unsafe(no_mangle)]
pub extern "C" fn ea_sum(
    a: c_int,
    b: c_int,
) -> c_int {
    a.saturating_add(b)
}`;

const millivolts = `#![no_std]
pub fn millivolts(raw: u16) -> u32 {
    let raw = u32::from(raw.min(4095));
    raw * 3300 / 4095
}`;

const panicHandler = `#![no_std]
use core::panic::PanicInfo;
#[panic_handler]
fn panic(_: &PanicInfo<'_>) -> ! {
    loop {
        core::hint::spin_loop();
    }
}`;

export const rustAvancado: UnitDef = {
  id: 'rp-avanc', title: 'Rust avançado', icon: '🧨',
  subtitle: 'Expansão de código, fronteiras com C e sistemas sem std',
  source: 'Desafio 50 Dias — Rust: módulos 6 e 7, exercícios 40, 45 e 46; projeto 3. The Rust Programming Language, cap. 20: https://doc.rust-lang.org/book/ch20-05-macros.html e https://doc.rust-lang.org/book/ch20-01-unsafe-rust.html. Edição 2024: https://doc.rust-lang.org/edition-guide/rust-2024/unsafe-extern.html e https://doc.rust-lang.org/edition-guide/rust-2024/unsafe-attributes.html. Complementos: https://doc.rust-lang.org/reference/behavior-considered-undefined.html, https://doc.rust-lang.org/reference/type-layout.html, https://doc.rust-lang.org/reference/panic.html, https://doc.rust-lang.org/cargo/reference/build-scripts.html, https://doc.rust-lang.org/embedded-book/intro/no-std.html e https://docs.rs/embedded-hal/1.0.0/embedded_hal/.',
  guide: 'Macros declarativas casam padrões de tokens e expandem código; uma expressão capturada pode ser avaliada várias vezes se for repetida na expansão. Guarde-a num temporário quando precisar avaliá-la uma vez. Repetição aceita zero ou mais itens com * e um ou mais com +. A partir do exercício 45, unsafe permite operações específicas, mantendo a checagem de tipos e de referências. Documente validade, alinhamento, inicialização, aliasing e duração de cada acesso cru. Na fronteira com C, confira assinatura, ABI, layout, posse e ligação. A edição 2024 marca blocos externos e atributos de símbolos com unsafe. no_std troca a biblioteca implícita std por core: não fornece sistema operacional, alocador nem inicialização da placa. Uma biblioteca de lógica pode ser testada no PC; o firmware integra runtime, panic handler e HAL. embedded-hal define contratos para drivers portáveis, e a HAL concreta implementa esses contratos para a placa.',
  extra: true,
  lessons: [
    {
      id: 'rp-avanc-macro', title: 'Macros declarativas', parts: [
        {
          card: [
            {
              title: 'Exercício 40: código que gera código',
              body: 'Uma função recebe valores; uma macro declarativa casa padrões de tokens e gera código durante a compilação. O ponto de exclamação distingue a chamada. A captura de fragmento expr aceita uma expressão inteira. No exemplo, o bloco interno cria um temporário e devolve seu quadrado, sem ponto e vírgula na última expressão. A saída é 16. A macro precisa estar em escopo antes desta chamada.',
              visual: code(square, [2, 3, 4], 'main.rs · edição 2024'),
              tip: 'Como no desafio 40, teste uma expressão com efeito colateral. Repetir a captura duas vezes no corpo também repete sua avaliação; a macro não guarda o valor automaticamente.',
            },
            {
              title: 'Veja a avaliação única',
              body: 'Avance para acompanhar a expressão do exemplo. Há uma avaliação da soma; depois o valor inteiro é usado duas vezes na multiplicação.',
              visual: trace([
                { left: '3 + 1', right: 'entrada', detail: 'A macro recebe os tokens da expressão; ainda não é um valor passado a uma função.' },
                { left: '3 + 1', right: 'v = 4', detail: 'Na execução, o temporário recebe 4. A expressão capturada foi avaliada uma vez.' },
                { left: 'v = 4', right: '16', detail: 'Multiplicar v por v usa duas cópias do inteiro 4, sem repetir a expressão original.' },
              ]),
            },
          ],
          exercises: [
            mcq('O que acontece com uma chamada de macro declarativa?', ['Ela é expandida em código na compilação.', 'Ela é interpretada só depois do main.', 'Ela desliga a checagem de tipos.', 'Ela transforma qualquer texto em inteiro.'], 0, 'O compilador casa o padrão e expande a macro. O código resultante continua sujeito às regras de Rust.'),
            num('Qual número o programa imprime?', 16, 'A soma 3 + 1 produz 4; o temporário guarda 4 e a multiplicação resulta em 16.', { visual: code(square, [8], 'Preveja a saída') }),
            fill('Complete a descrição da captura:', 'O fragmento expr reconhece uma ___.', ['expressão'], ['biblioteca nativa', 'thread', 'região do heap'], 'Uma soma, uma chamada de função ou um bloco que devolve valor podem ser expressões capturadas pela macro.'),
            tf('Usar a mesma captura duas vezes na expansão garante avaliação única.', false, 'A expansão insere a expressão em cada ocorrência. Se ela chama uma função, essa função pode ser chamada duas vezes; guarde o resultado num temporário.'),
            match('Associe cada etapa ao que ela faz:', [['Casamento', 'Reconhece a estrutura da entrada'], ['Expansão', 'Produz código Rust'], ['Execução', 'Calcula os valores do programa']], 'A macro reconhece tokens e gera código antes da execução; os valores deste exemplo são calculados quando o programa roda.'),
            gen((rng) => {
              const n = randInt(rng, 2, 8);
              return num('Com square definida no card, qual número será impresso?', (n + 1) ** 2, `O temporário recebe ${n} + 1 = ${n + 1}; o quadrado é ${(n + 1) ** 2}.`, {
                visual: code(`fn main() {
    println!("{}", square!(${n} + 1));
}`, [2], 'Use a macro square do card'),
              });
            }),
            codePuzzle('Monte o programa: defina inc antes de usá-la e imprima 10.', [
              'fn main() {',
              '    macro_rules! inc {',
              '        ($x:expr) => { $x + 1 };',
              '    }',
              '    let n = inc!(4);',
              '    let out = n * 2;',
              '    println!("{out}");',
              '}',
            ], ['    let n = inc(4);', '        ($x:expr) => { $x - 1 };'], 'A macro local expande a soma 4 + 1. Só depois dessa definição n recebe 5, out recebe 10 e a impressão usa out.'),
            mcq('Esta macro compila, mas repete a avaliação. Quais números saem na última linha?', ['6 3', '4 2', '9 3', '4 3'], 0, 'next é chamada duas vezes: na primeira n passa de 1 para 2; na segunda passa para 3. O produto é 2 vezes 3 = 6 e n termina em 3. O temporário do card evita esse efeito.', {
              visual: code(`macro_rules! bad_square {
    ($x:expr) => { $x * $x };
}
fn next(n: &mut i32) -> i32 {
    *n += 1;
    *n
}
fn main() {
    let mut n = 1;
    let out = bad_square!(next(&mut n));
    println!("{out} {n}");
}`, [2, 10], 'Erro de lógica, não de compilação'),
            }),
          ],
        },
        {
          card: [
            {
              title: 'Repetição: uma lista de expressões',
              body: 'O padrão captura expressões separadas por vírgulas. O asterisco permite zero ou mais repetições; o sinal de mais exigiria pelo menos uma. A expansão repete a soma com cada expressão. A identidade 0 também permite a lista vazia. Este padrão não aceita vírgula final: ela precisaria de um padrão opcional adicional. A saída do exemplo é 9.',
              visual: code(sum, [2, 3], 'main.rs · repetição'),
            },
            {
              title: 'Da chamada à soma',
              body: 'As três capturas geram três parcelas. A expansão não roda um laço para descobrir quantos argumentos existem: essa quantidade já está no código gerado.',
              visual: table(['Etapa', 'Estado'], [['Entrada', 'Três expressões: 2; 3; 4'], ['Expansão', 'Zero mais as três parcelas'], ['Execução', 'Acumulado: 0 → 2 → 5 → 9']]),
            },
            {
              title: 'No seu computador',
              body: 'Base: desafio 40. Crie o projeto e implemente square com temporário e sum com repetição. Escreva next para incrementar um contador. Pronto quando square aplicado à chamada de next avaliar a chamada uma vez, o caso de 3 + 1 produzir 16 e a soma de 2, 3 e 4 produzir 9. Cubra também soma vazia em testes. Use edição 2024; não precisa de crates externas.',
              visual: code(`cargo new macros_lab
cd macros_lab
cargo run
cargo test
cargo fmt
cargo fmt --check
cargo clippy -- -D warnings`, [], 'Terminal · critérios de qualidade'),
              tip: 'Se o Clippy sugerir uma simplificação aritmética para a expansão, ajuste a macro, por exemplo usando um array e seu iterador. O comportamento e a avaliação única devem continuar cobertos por testes.',
            },
          ],
          exercises: [
            num('Quantas expressões a chamada captura?', 3, 'Há três expressões separadas por vírgulas: o inteiro 2, a soma 3 + 4 e o inteiro 5. A soma interna é uma captura só.', { visual: code('let n = sum!(2, 3 + 4, 5);', [], 'Trecho de main · macro do card') }),
            tf('No padrão mostrado, o asterisco aceita uma lista vazia.', true, 'O asterisco significa zero ou mais repetições. Com nenhuma captura, a expansão contém somente a identidade inteira 0.'),
            match('Associe a notação ao papel na repetição:', [['Asterisco', 'Zero ou mais ocorrências'], ['Sinal de mais', 'Uma ou mais ocorrências'], ['Vírgula separadora', 'Divide expressões capturadas']], 'O operador da repetição determina a quantidade; o separador determina o token entre duas ocorrências.'),
            num('Com sum definida no card, qual número aparece?', 0, 'Não há expressões capturadas, então a repetição não acrescenta parcelas e sobra 0.', { visual: code('fn main() {\n    println!("{}", sum!());\n}', [2], 'Lista vazia') }),
            multi('Quais afirmações sobre esta macro são verdadeiras?', ['Ela aceita uma expressão que seja uma soma.', 'Ela recebe necessariamente três argumentos.', 'O código expandido precisa ter tipos compatíveis.', 'Ela executa antes da compilação para ler o teclado.'], [0, 2], 'Uma soma também é uma expressão. A quantidade de argumentos varia, e as parcelas geradas precisam aceitar as operações usadas. A macro não lê valores do teclado durante a expansão.'),
            gen((rng) => {
              const a = randInt(rng, 2, 7);
              const b = randInt(rng, 3, 9);
              return num('Usando sum do card, qual é a saída?', a + b + 1, `A expansão soma 0, ${a}, ${b} e 1, obtendo ${a + b + 1}.`, { visual: code(`fn main() {
    let n = sum!(${a}, ${b}, 1);
    println!("{n}");
}`, [2], 'Repetição com valores sorteados') });
            }),
            codePuzzle('Monte uma macro local de soma e imprima 7.', [
              'fn main() {',
              '    macro_rules! sum {',
              '        ($($x:expr),*) => {0 $(+$x)*};',
              '    }',
              '    let n = sum!(2, 5);',
              '    let out = n.to_string();',
              '    println!("{out}");',
              '}',
            ], ['    let n = sum!(2; 5);', '        ($x:expr) => {0};'], 'A vírgula da chamada precisa corresponder ao separador do padrão. A repetição expande as duas parcelas, n vale 7 e sua representação textual é impressa.'),
            mcq('Ao adaptar a macro para aceitar pelo menos um argumento, qual mudança no padrão atende ao objetivo?', ['Trocar o operador da repetição de asterisco para mais.', 'Apagar a captura de expressão.', 'Adicionar uma thread.', 'Trocar todas as vírgulas por pontos.'], 0, 'O operador mais exige uma ou mais capturas. Isso rejeita a chamada vazia já no casamento do padrão, antes da execução.'),
          ],
        },
      ],
    },
    {
      id: 'rp-avanc-unsafe', title: 'unsafe e ponteiros crus', parts: [
        {
          card: [
            {
              title: 'Exercício 45: uma fronteira explícita',
              body: 'O roteiro só libera unsafe a partir do exercício 45, depois de posse e empréstimos. Os operadores raw criam ponteiros crus sem exigir unsafe. Para ler ou escrever o alvo por desreferenciação, é necessário um bloco unsafe. No exemplo, n continua vivo e exclusivo durante a escrita; a saída é 9. Um ponteiro cru não mantém seu alvo vivo nem o libera automaticamente.',
              visual: code(rawRead, [3, 5], 'main.rs · acesso justificado'),
            },
            {
              title: 'O endereço não é o valor',
              body: 'Avance e observe a célula apontada. A criação de p não copia n; a escrita por p altera a mesma célula.',
              visual: trace([
                { left: 'n = 7', right: 'sem p', detail: 'Uma variável local possui o inteiro 7.' },
                { left: 'p', right: 'n = 7', detail: 'p guarda um ponteiro para n. A validade do acesso ainda é responsabilidade de quem o fizer.' },
                { left: 'p', right: 'n = 9', detail: 'A desreferenciação escreve 7 + 2 = 9 enquanto a variável permanece viva e gravável.' },
              ]),
            },
          ],
          exercises: [
            mcq('Qual operação deste programa exige unsafe?', ['Escrever no alvo de p por desreferenciação.', 'Criar a variável inteira.', 'Criar p com o operador raw.', 'Imprimir n depois da escrita.'], 0, 'Criar o ponteiro cru é permitido em código seguro. O acesso ao alvo exige justificar as condições de validade.'),
            num('Qual número aparece na saída?', 9, 'p aponta para n. Somar 2 ao alvo muda n de 7 para 9; a impressão lê esse valor.', { visual: code(rawRead, [5, 6], 'Siga o mesmo objeto') }),
            tf('Um ponteiro cru pode ser nulo; isso não autoriza desreferenciá-lo.', true, 'A existência do valor de ponteiro nulo é permitida. Tentar acessar um inteiro por ele viola as condições de validade e causa comportamento indefinido.'),
            match('Associe cada conceito à responsabilidade:', [['Ponteiro cru', 'Não garante a duração do alvo'], ['Referência válida', 'Deve cumprir as regras de empréstimo'], ['Comentário SAFETY', 'Registra por que o acesso é válido']], 'Um endereço cru não carrega a garantia de lifetime de uma referência. O comentário documenta a prova humana; ele não muda o comportamento do compilador.'),
            mcq('A leitura destacada compila?', ['Não: E0133, falta um bloco unsafe.', 'Sim: criar p já autoriza qualquer leitura.', 'Não: E0382, o inteiro foi movido.', 'Sim: todo ponteiro cru é uma referência.'], 0, 'E0133: "dereference of raw pointer is unsafe and requires unsafe block". Mantenha n vivo, confira as condições do ponteiro e coloque a leitura num bloco unsafe. Não há move inválido de i32.', {
              visual: code(`fn main() {
    let n = 4;
    let p = &raw const n;
    let out = *p;
    println!("{out}");
}`, [4], 'Código incorreto · E0133'),
            }),
            gen((rng) => {
              const a = randInt(rng, 3, 12);
              const b = randInt(rng, 2, 6);
              return num('Quanto vale n ao final?', a + b, `p aponta para o local n; a escrita soma ${b} a ${a}, resultando em ${a + b}. Não há outra referência nem outro acesso concorrente.`, { visual: code(`fn main() {
    let mut n = ${a};
    let p = &raw mut n;
    // SAFETY: local vivo e exclusivo.
    unsafe { *p += ${b}; }
    println!("{n}");
}`, [5], 'Acesso a um local válido') });
            }),
            multi('Antes de ler um i32 por ponteiro cru, quais condições precisam ser garantidas?', ['Alvo vivo, alinhado e inicializado.', 'Regras de acesso e aliasing respeitadas.', 'Somente que o endereço seja diferente de zero.', 'Acesso dentro da memória válida do alvo.'], [0, 1, 3], 'Não ser nulo é insuficiente: um endereço pode estar desalinhado, liberado ou fora da alocação. A leitura também precisa respeitar as regras de aliasing e concorrência.'),
            codePuzzle('Monte uma escrita válida por ponteiro cru que imprima 8.', [
              'fn main() {',
              '    let mut n = 5;',
              '    let p = &raw mut n;',
              '    unsafe { *p += 3; }',
              '    let out = n;',
              '    println!("{out}");',
              '}',
            ], ['    *p += 3;', '    let p = &raw const n;'], 'Crie o local gravável, obtenha seu ponteiro e só então escreva dentro do bloco unsafe. O inteiro torna-se 8 antes de ser copiado para out e impresso.'),
          ],
        },
        {
          card: [
            {
              title: 'Cinco superpoderes, contrato preservado',
              body: 'As cinco operações são: desreferenciar ponteiro cru; chamar função ou método unsafe; acessar ou modificar static mut; implementar trait unsafe; acessar campo de union. unsafe não desliga a checagem de tipos nem a de empréstimos de referências. Posse, imutabilidade e verificação de limites na indexação segura continuam valendo. Uma função unsafe declara obrigações do chamador; na edição 2024, operações unsafe no corpo devem ter blocos explícitos para evitar o lint unsafe_op_in_unsafe_fn.',
              visual: code(swapRaw, [5, 10, 17], 'Troca crua · saída: 9 2'),
              tip: 'core::ptr::swap aceita sobreposição; aqui os dois locais são distintos. Em código de aplicação, prefira `std::mem::swap` com referências. Escrever num campo de union pode ser seguro; ler seus bits como um tipo exige justificar a validade. O exemplo cru serve para estudar e isolar a fronteira.',
            },
            {
              title: 'Um contrato por operação',
              body: 'Não use a palavra unsafe como uma explicação completa. Registre a condição concreta que o compilador não verifica para aquela operação.',
              visual: table(['Operação', 'Exemplo de obrigação'], [['Ler ponteiro', 'Alvo inicializado e válido'], ['Chamar função unsafe', 'Cumprir seu contrato documentado'], ['Usar static mut', 'Evitar acessos conflitantes'], ['Implementar trait unsafe', 'Cumprir invariantes da trait'], ['Ler union', 'Interpretar bits como valor válido']]),
            },
            {
              title: 'No seu computador',
              body: 'Base: desafio 45. Crie o projeto, implemente swap_raw com contrato de segurança e envolva a chamada numa função segura que recebe duas referências mutáveis. Teste dois locais com valores 2 e 9. Pronto quando a saída for 9 2, os testes cobrirem valores iguais e negativos, e formatação e Clippy passarem. Não use unwrap nem expect fora de testes. Miri é uma extensão opcional em nightly: em cópia separada, o caso de leitura fora do array deve ser diagnosticado; restaure o caso válido antes de entregar.',
              visual: code(`cargo new raw_lab
cd raw_lab
cargo run
cargo test
cargo fmt
cargo fmt --check
cargo clippy -- -D warnings`, [], 'Terminal · implementação isolada'),
            },
          ],
          exercises: [
            mcq('Qual destas operações é um dos cinco superpoderes?', ['Implementar uma trait unsafe.', 'Desligar o sistema de tipos.', 'Usar uma String depois do move.', 'Criar duas referências mutáveis conflitantes.'], 0, 'Implementar uma trait unsafe exige assumir e demonstrar invariantes adicionais. As regras de tipos, posse e referências continuam em vigor.'),
            tf('Uma função unsafe libera automaticamente todas as operações unsafe do corpo, sem avisos na edição 2024.', false, 'O lint unsafe_op_in_unsafe_fn avisa por padrão na edição 2024. Use blocos explícitos dentro da função; a assinatura declara o contrato do chamador e o bloco marca a operação interna.'),
            mcq('Por que este programa continua sendo rejeitado?', ['E0499: dois empréstimos mutáveis usados juntos.', 'E0133: não é possível criar referências em unsafe.', 'E0382: i32 nunca pode ser copiado.', 'Ele compila porque unsafe desliga empréstimos.'], 0, 'E0499: "cannot borrow `n` as mutable more than once at a time". a continua em uso na impressão quando b é criado. Termine o uso de a antes de criar b, ou use um único empréstimo; o bloco unsafe não muda essa regra.', {
              visual: code(`fn main() {
    let mut n = 1;
    unsafe {
        let a = &mut n;
        let b = &mut n;
        println!("{} {}", *a, *b);
    }
}`, [4, 5, 6], 'Código incorreto · E0499'),
            }),
            match('Associe o recurso à obrigação que ele introduz:', [['Chamada unsafe', 'O chamador verifica as precondições'], ['API segura sobre unsafe', 'A implementação protege todo uso seguro'], ['Miri', 'Procura violações nas execuções analisadas']], 'Uma API segura precisa impedir que seus usuários seguros provoquem comportamento indefinido. Miri ajuda a encontrar violações, mas passar em um teste não prova todos os usos possíveis.'),
            gen((rng) => {
              const a = randInt(rng, 1, 8);
              const b = randInt(rng, 10, 19);
              return num('Usando swap_raw do card, qual valor fica em a?', b, `A troca grava o antigo b, ${b}, em a e o antigo a, ${a}, em b. Os locais são distintos, vivos e graváveis.`, { visual: code(`fn main() {
    let mut a = ${a};
    let mut b = ${b};
    // SAFETY: locais vivos exclusivos.
    unsafe {
        swap_raw(
            &raw mut a,
            &raw mut b,
        );
    }
    println!("{a}");
}`, [6], 'Acrescente swap_raw do card') });
            }),
            order('Ordene uma revisão de segurança antes de publicar uma API:', ['Definir as precondições do acesso', 'Garantir as precondições na API segura', 'Isolar e justificar o bloco unsafe', 'Testar casos e revisar invariantes'], 'Primeiro estabeleça o que precisa ser verdade; a API deve impor essas condições. O bloco pequeno registra a operação e sua justificativa, e testes e revisão procuram falhas.'),
            codePuzzle('Monte uma chamada segura no programa: trocar os dois locais com std::mem::swap e imprimir 11.', [
              'fn main() {',
              '    let mut pair = (4, 11);',
              '    let (a, b) = &mut pair;',
              '    std::mem::swap(a, b);',
              '    let out = pair.0;',
              '    println!("{out}");',
              '}',
            ], ['    std::mem::swap(*a, *b);', '    let (a, b) = &pair;'], 'O padrão empresta campos distintos da tupla. A função segura recebe referências mutáveis, troca 4 e 11, e os empréstimos terminam antes da leitura de pair.0.'),
            multi('Quais decisões tornam uma abstração sobre ponteiros mais segura?', ['Manter o bloco unsafe pequeno e justificado.', 'Expor um ponteiro arbitrário numa função segura que sempre o lê.', 'Impor o contrato por referências ou validações suficientes.', 'Revisar a duração do objeto e o direito de liberar memória.'], [0, 2, 3], 'Uma função segura não pode confiar que todo ponteiro arbitrário será válido. Referências com lifetimes adequados e invariantes privadas ajudam a impor condições; a revisão cobre duração, aliasing e propriedade.'),
          ],
        },
      ],
    },
    {
      id: 'rp-avanc-ffi', title: 'Conversando com C', parts: [
        {
          card: [
            {
              title: 'Exercício 46: assinatura, ABI e ligação',
              body: 'FFI conecta linguagens. Este exemplo usa a função abs do runtime C em um PC com esse símbolo disponível, como no Linux. O bloco unsafe extern declara assinaturas; a ABI C descreve a convenção de chamada. Declarar não implementa nem procura uma biblioteca automaticamente. c_int acompanha o int do alvo. A chamada é unsafe por padrão; a saída é 12. O módulo do menor int com sinal não cabe no retorno, então esse caso fica fora do contrato.',
              visual: code(foreignAbs, [2, 3, 8], 'main.rs · runtime C do host'),
              tip: 'Na edição 2024, o bloco externo precisa da palavra unsafe. Alguns itens podem ser declarados safe com justificativa completa; aqui mantemos a chamada explicitamente unsafe.',
            },
            {
              title: 'Siga a fronteira',
              body: 'Avance para separar o trabalho do compilador, do ligador e da execução. A assinatura declarada precisa concordar com a definição real em C.',
              visual: trace([
                { left: 'Rust', right: 'assinatura', detail: 'O compilador conhece os tipos e a ABI declarados pelo autor do bloco externo.' },
                { left: 'ligador', right: 'símbolo C', detail: 'O ligador resolve abs na biblioteca do host. Uma declaração sozinha não contém seu código.' },
                { left: 'n = -12', right: '12', detail: 'A execução chama C com -12; o resultado 12 cabe no tipo e volta para Rust.' },
              ]),
            },
          ],
          exercises: [
            mcq('O que a ABI C especifica?', ['A convenção usada na chamada entre as linguagens.', 'Uma conversão automática de toda struct.', 'O tempo de vida de qualquer ponteiro.', 'Um coletor de lixo para a biblioteca.'], 0, 'A ABI define como a chamada é realizada no alvo. Ela não resolve layout de todo tipo, duração dos dados ou propriedade da memória.'),
            num('No ambiente descrito no card, qual é a saída?', 12, 'abs devolve o módulo de -12. Tanto a entrada quanto o resultado são representáveis em c_int.', { visual: code(foreignAbs, [8, 9], 'Runtime C disponível') }),
            tf('A declaração externa também contém a implementação C da função.', false, 'Ela informa ao compilador uma assinatura. A implementação precisa existir e ser resolvida na ligação; assinaturas incompatíveis podem causar comportamento indefinido.'),
            match('Associe cada item ao papel:', [['c_int', 'Tipo correspondente ao int do alvo'], ['Bloco externo', 'Declara os símbolos e suas assinaturas'], ['Ligador', 'Resolve símbolos nas bibliotecas']], 'O tipo acompanha a ABI do alvo; o bloco declara o contrato; o ligador encontra a definição real. Nenhum deles valida sozinho o contrato completo.'),
            mcq('Com a declaração de abs do card, por que esta chamada é rejeitada?', ['E0133: a função externa requer um bloco unsafe.', 'E0499: existem dois empréstimos mutáveis.', 'E0382: o número -7 foi movido.', 'Ela é segura porque qualquer assinatura C é confiável.'], 0, 'E0133: "call to unsafe function `abs` is unsafe and requires unsafe block". A declaração externa sem marcador safe torna abs unsafe de chamar; coloque a chamada num bloco depois de conferir a assinatura e a entrada representável.', {
              visual: code(`use core::ffi::c_int;
unsafe extern "C" {
    fn abs(n: c_int) -> c_int;
}
fn main() {
    let n = abs(-7);
    println!("{n}");
}`, [6], 'Código incorreto · E0133'),
            }),
            gen((rng) => {
              const n = randInt(rng, 2, 20);
              return num('Com abs declarada como no card e runtime C disponível, qual é a saída?', n, `O argumento é -${n}; seu módulo ${n} cabe em c_int. A função C retorna ${n}.`, { visual: code(`fn main() {
    // SAFETY: assinatura C e valor ok.
    let n = unsafe { abs(-${n}) };
    println!("{n}");
}`, [3], 'Use a declaração externa do card') });
            }),
            codePuzzle('Com abs e c_int declarados no card, monte main para imprimir 8.', [
              'fn main() {',
              '    let input: c_int = -8;',
              '    let out = unsafe { abs(input) };',
              '    let text = out.to_string();',
              '    println!("{text}");',
              '}',
            ], ['    let out = abs(input);', '    let input: c_int = "-8";'], 'A entrada tem o tipo C adequado. A chamada unsafe produz 8, que vira texto e é impresso. O programa deve incluir a declaração externa e o import apresentados no card.'),
            mcq('Sua libhash foi declarada corretamente, mas o ligador relata símbolo ausente. Qual ação trata essa etapa?', ['Compilar a biblioteca e informar busca e nome para a ligação.', 'Adicionar unsafe em todas as linhas.', 'Trocar todos os retornos por String.', 'Remover a função main.'], 0, 'O build.rs pode emitir instruções rustc-link-search e rustc-link-lib ao Cargo. A biblioteca compilada precisa ter arquitetura e ABI compatíveis com o alvo; adicionar unsafe não cria o símbolo.'),
          ],
        },
        {
          card: [
            {
              title: 'Layout de dados também é contrato',
              body: 'repr(C) escolhe o layout C para esta struct: respeita a ordem dos campos e as regras de alinhamento do alvo, que podem inserir padding. Isso não torna qualquer campo compatível com C: String e Vec não viram interfaces C estáveis. Uma struct equivalente do outro lado precisa usar tipos e disposição compatíveis. O programa imprime 1 7.',
              visual: code(sample, [1, 3, 4], 'main.rs · dados compartilháveis'),
            },
            {
              title: 'Bytes com alinhamento de u32 igual a 4',
              body: 'Neste alvo hipotético usual, os três bytes após channel são padding. Não são três campos úteis nem devem ser lidos como bytes inicializados. O tamanho final é 8 bytes. Em outro alvo, consulte o layout real.',
              visual: table(['Deslocamento', 'Uso'], [['0', 'channel: 1 byte'], ['1 a 3', 'padding: 3 bytes'], ['4 a 7', 'value: 4 bytes']]),
            },
            {
              title: 'Exportar Rust para C na edição 2024',
              body: 'Aqui temos uma definição, em src/lib.rs: a ABI C define como chamar, e o atributo no_mangle preserva o nome do símbolo. A edição 2024 exige o marcador unsafe no atributo: o autor deve evitar colisão de nomes globais. Isso não torna a função unsafe de chamar em Rust. A soma saturada evita panic por overflow, inclusive na fronteira C.',
              visual: code(exportSum, [3, 4, 8], 'lib.rs · não precisa de crate externa'),
            },
            {
              title: 'Biblioteca C e build.rs',
              body: 'Salve o primeiro visual como ea.c; o próximo card contém o script da raiz. O script informa ao Cargo onde buscar a biblioteca estática já compilada. Os valores pequenos do exemplo não excedem o intervalo de int.',
              visual: code(`int ea_add(int a, int b) {
    return a + b;
}`, [], 'ea.c · fonte C'),
            },
            {
              title: 'Indicações ao ligador',
              body: 'Salve como build.rs, na mesma pasta de Cargo.toml. O Cargo executa esse script antes de compilar o pacote. O ponto indica a raiz onde você criou libea.a.',
              visual: code(`fn main() {
    println!(
        "cargo::rustc-link-search=."
    );
    let lib = "static=ea";
    println!(
        "cargo::rustc-link-lib={lib}"
    );
}`, [], 'build.rs'),
            },
            {
              title: 'O chamador do desafio',
              body: 'Salve como src/main.rs. A declaração precisa corresponder à definição C. Com a biblioteca ligada, a chamada retorna 3 + 4 e a saída é 7.',
              visual: code(`use core::ffi::c_int;
unsafe extern "C" {
    fn ea_add(
        a: c_int,
        b: c_int,
    ) -> c_int;
}
fn main() {
    // SAFETY: assinatura e valores ok.
    let n = unsafe { ea_add(3, 4) };
    println!("{n}");
}`, [2, 10], 'src/main.rs'),
            },
            {
              title: 'No seu computador',
              body: 'Base: desafio 46. Em um PC Unix com cc e ar, crie o projeto e os três arquivos dos cards anteriores. Compile ea.c para libea.a na raiz do pacote. Execute o Cargo. Pronto quando cargo run imprimir 7, cargo fmt --check e cargo clippy -- -D warnings passarem. Depois, se você tem a libhash do curso de C, repita o processo usando as assinaturas do header real: o wrapper deve tratar falha de criação e liberar o recurso em Drop exatamente uma vez, sem expor unsafe aos usuários.',
              visual: code(`cargo new ffi_lab
cd ffi_lab
cc -c ea.c -o ea.o
ar rcs libea.a ea.o
cargo run
cargo fmt
cargo fmt --check
cargo clippy -- -D warnings`, [], 'Terminal · não usa crates externas'),
            },
          ],
          exercises: [
            mcq('O que repr(C) oferece para Sample?', ['Layout de struct pelas regras C do alvo.', 'Remoção obrigatória de todo padding.', 'Serialização portátil entre processadores.', 'Liberação automática de ponteiros C.'], 0, 'repr(C) estabelece o layout C do alvo. Alinhamento, endianness e tipos ainda dependem do alvo; não é um formato universal para arquivos.'),
            num('No alvo da tabela, quantos bytes separam o início de channel do início de value?', 4, 'channel começa no deslocamento 0. Após seu byte há três bytes de padding, então value começa no deslocamento 4.', { visual: table(['Campo', 'Deslocamento'], [['channel', 0], ['padding', '1 a 3'], ['value', 4]]) }),
            tf('O marcador unsafe no atributo no_mangle torna automaticamente a função unsafe de chamar.', false, 'O marcador do atributo trata da segurança do símbolo global. A segurança de chamada é declarada separadamente na assinatura da função.', { visual: code(exportSum, [3, 4], 'Atributo e assinatura são contratos distintos') }),
            match('Associe cada contrato ao recurso apropriado:', [['Convenção de chamada', 'ABI extern C'], ['Layout da struct', 'Representação C'], ['Nome do símbolo exportado', 'Atributo no_mangle marcado unsafe'], ['Recurso C com dono único', 'Wrapper com liberação em Drop']], 'Essas decisões são independentes: ABI, layout, símbolo e propriedade precisam ser corretos ao mesmo tempo. Drop pode encapsular a rotina de liberação da biblioteca original.'),
            gen((rng) => {
              const a = randInt(rng, 2, 12);
              const b = randInt(rng, 3, 15);
              return num('Com ea_sum do card, qual número é impresso nesta chamada feita em Rust?', a + b, `A função usa soma saturada; ${a} + ${b} = ${a + b} está longe dos limites de c_int, então não há saturação. O atributo de exportação não exige bloco unsafe no chamador Rust.`, { visual: code(`fn main() {
    let n = ea_sum(${a}, ${b});
    println!("{n}");
}`, [2], 'Acrescente ea_sum do card') });
            }),
            order('Ordene o ciclo de posse de um recurso C no wrapper:', ['Chamar a função de criação', 'Verificar o retorno e tratar a falha', 'Guardar o recurso válido em campo privado', 'Usar o recurso através da API segura', 'Liberar uma única vez em Drop'], 'Não construa um dono válido a partir de falha. O campo privado mantém a posse; métodos preservam o contrato e Drop chama a liberação da mesma biblioteca, uma vez.'),
            codePuzzle('Acrescente ea_sum do card e monte main para imprimir soma: 7.', [
              'fn main() {',
              '    let a = 3;',
              '    let b = a + 1;',
              '    let n = ea_sum(a, b);',
              '    let text = format!("soma: {n}");',
              '    println!("{text}");',
              '}',
            ], ['    let n = ea_sum(a, &b);', '    let text = format!("soma: n");'], 'As dependências fixam a ordem: b usa a; n chama a função com dois inteiros; text interpola n. A função definida em Rust é segura de chamar e devolve 7.'),
            multi('Quais escolhas são adequadas para uma interface C auditável?', ['Conferir o header e os tipos reais do alvo.', 'Passar String por valor e presumir que equivale a char *.', 'Definir quem aloca, quem libera e por quanto tempo os dados vivem.', 'Impedir que panic atravesse uma fronteira que não admite unwinding.'], [0, 2, 3], 'Tipos de Rust não são automaticamente tipos C. A interface precisa definir representação e posse. Um panic numa função Rust com ABI C que não permite unwinding aborta o processo; projete o contrato para não depender disso como recuperação.'),
          ],
        },
      ],
    },
    {
      id: 'rp-avanc-nostd', title: 'no_std e Rust embarcado', parts: [
        {
          card: [
            {
              title: 'A lógica que cabe fora do desktop',
              body: 'no_std retira a biblioteca std implícita e usa core. Tipos numéricos, slices, Option, Result e iteradores continuam disponíveis. Arquivos, threads do sistema e println não vêm de core. Esta biblioteca converte uma leitura ADC de 12 bits em milivolts de 0 a 3300, limitando entradas maiores que 4095. A aritmética u32 comporta o produto. Não há main nem saída: uma biblioteca devolve o valor ao chamador.',
              visual: code(millivolts, [1, 3, 4], 'src/lib.rs · biblioteca reutilizável'),
              tip: 'no_std não significa necessariamente sem heap. A crate alloc pode fornecer Vec e String quando houver um alocador adequado; core sozinho não os fornece.',
            },
            {
              title: 'Estado sem alocação dinâmica',
              body: 'Um array de tamanho fixo cabe na memória local sem pedir memória ao heap. Isso facilita prever o consumo de RAM do firmware.',
              visual: table(['Objeto', 'Memória dos elementos'], [['4 amostras u16 em array', '8 bytes, sem heap'], ['Slice dessas amostras', 'Empresta o mesmo armazenamento'], ['Vec de amostras', 'Precisa de alocação dinâmica']]),
            },
            {
              title: 'Da amostra ao valor físico',
              body: 'Avance para acompanhar a amostra 2048. A divisão é inteira: a fração é descartada, sem arredondar para o mais próximo.',
              visual: trace([
                { left: 'ADC', right: '2048', detail: 'A entrada é uma amostra inteira. A limitação mantém 2048 porque ela está entre 0 e 4095.' },
                { left: 'u32', right: '6758400', detail: 'A conversão vem antes da multiplicação: 2048 vezes 3300 = 6758400, que cabe em u32.' },
                { left: '÷4095', right: '1650 mV', detail: '6758400 dividido por 4095 dá quociente inteiro 1650; esse é o retorno da função.' },
              ]),
            },
          ],
          exercises: [
            mcq('Qual recurso está disponível em core sem alocador?', ['Option e slices.', 'Arquivos do sistema operacional.', 'Threads nativas do sistema.', 'Vec com crescimento automático.'], 0, 'Option e slices não exigem alocação dinâmica. Arquivos e threads dependem de integração com o sistema; Vec precisa do suporte de alocação.'),
            tf('Uma biblioteca no_std pode ser usada por um programa de PC que usa std.', true, 'A lógica independente de plataforma pode ser compartilhada. O programa do PC fornece a entrada e a saída, enquanto a biblioteca continua usando core.'),
            num('Que valor millivolts do card devolve para a leitura máxima?', 3300, 'A entrada 4095 permanece 4095. O produto por 3300, dividido por 4095, resulta em 3300 milivolts.', { visual: code(`fn main() {
    let mv = adc_core::millivolts(4095);
    println!("{mv}");
}`, [2], 'Consumidor com dependência local adc_core') }),
            match('Associe cada camada ao que oferece:', [['core', 'Tipos e operações sem exigir alocador'], ['alloc', 'Coleções dinâmicas com alocador'], ['std', 'Integração com recursos do sistema']], 'core é a base independente de sistema. alloc acrescenta tipos donos de memória dinâmica, mas precisa de um alocador para usá-los; std fornece recursos do ambiente hospedado.'),
            gen((rng) => {
              const step = randInt(rng, 0, 3);
              const raw = step * 1365;
              return num(`Que valor em milivolts a biblioteca devolve para a amostra ${raw}?`, step * 1100, `${raw} vezes 3300 dividido por 4095 resulta em ${step * 1100}. Como 1365 é um terço de 4095, cada passo equivale a 1100 milivolts.`, { visual: code(millivolts, [4], 'Conversão ADC sem std') });
            }),
            num('Quantos bytes são usados pelos elementos deste array?', 8, 'São quatro elementos u16, cada um de 2 bytes: 4 vezes 2 = 8. Isso mede os elementos do array, sem contar outras variáveis da função.', { visual: code(`fn main() {
    let samples = [0_u16; 4];
    let bytes = core::mem::size_of_val(
        &samples,
    );
    println!("{bytes}");
}`, [2, 3], 'Programa host · core também funciona com std') }),
            codePuzzle('Monte src/lib.rs sem std: limite o ADC e converta para milivolts.', [
              '#![no_std]',
              'pub fn millivolts(raw: u16) -> u32 {',
              '    let limited = raw.min(4095);',
              '    let wide = u32::from(limited);',
              '    let product = wide * 3300;',
              '    product / 4095',
              '}',
            ], ['    let product = limited * 3300;', '    product / 4095;'], 'A limitação preserva a faixa de 12 bits. A conversão para u32 precede o produto, evitando overflow em u16. A última expressão devolve o quociente; um ponto e vírgula ali devolveria unidade.'),
            mcq('Por que esta lógica é uma boa ponte com o curso de Sistemas Embarcados do app?', ['Ela separa a conversão física do acesso específico ao ADC.', 'Ela já configura qualquer placa automaticamente.', 'Ela implementa um sistema de arquivos no sensor.', 'Ela obriga a gravar todos os registradores com ponteiros crus.'], 0, 'O curso de Sistemas Embarcados ensina a aquisição e os periféricos. A função recebe uma amostra pronta e pode ser testada no PC, enquanto a HAL da placa cuida da leitura real.'),
          ],
        },
        {
          card: [
            {
              title: 'Panic handler não é inicialização',
              body: 'Um programa final sem std precisa ter exatamente um panic handler no grafo ligado. A assinatura recebe PanicInfo e devolve o tipo nunca: não retorna. Este exemplo entra em espera ativa e não imprime nada. Ele é uma demonstração separada de handler, compilável como biblioteca; não adicione este handler à biblioteca de conversão usada pelo programa host. Um firmware ainda precisa de entrada, inicialização, linker script e suporte do alvo.',
              visual: code(panicHandler, [3, 4, 6], 'lib.rs separado · demonstração de handler'),
              tip: 'Um runtime ou uma biblioteca de panic da plataforma pode fornecer o handler. Não defina outro se já houver um. O atributo no_std sozinho não cria um binário gravável na placa.',
            },
            {
              title: 'embedded-hal: contratos, HAL: implementação',
              body: 'embedded-hal 1.0 define traits de operações bloqueantes para GPIO digital, I²C, SPI, PWM e atraso. A HAL concreta configura e controla os periféricos da placa; um driver genérico usa essas traits. As operações podem retornar Result, então o driver precisa tratar falhas. Não adicionaremos dependências nesta unidade: o código abaixo é uma interface didática local inspirada nessa separação, não uma cópia da API de embedded-hal.',
              visual: code(`#![no_std]
pub trait Output {
    type Error;
    fn high(&mut self)
        -> Result<(), Self::Error>;
}
pub fn enable<P: Output>(
    pin: &mut P,
) -> Result<(), P::Error> {
    pin.high()
}`, [2, 4, 10], 'lib.rs alternativo · sem crates externas'),
            },
            {
              title: 'Do driver ao pino',
              body: 'Esta organização conecta o Rust aos temas de GPIO, barramentos e sensores do curso de Sistemas Embarcados. Uma implementação simulada pode testar a decisão no PC; outra implementação controla a placa.',
              visual: table(['Camada', 'Responsabilidade'], [['Aplicação', 'Decide quando medir ou acender'], ['Driver', 'Usa contratos de operações'], ['HAL da placa', 'Implementa acesso aos periféricos'], ['Runtime e suporte do alvo', 'Inicialização e imagem do firmware']]),
            },
            {
              title: 'Dependência local do host',
              body: 'Em host_demo/Cargo.toml, use esta entrada na seção de dependências existente. A biblioteca local não acrescenta crates externas. Mantenha edition igual a 2024 nos dois manifestos.',
              visual: code(`[dependencies]
adc_core = { path = "../adc_core" }`, [], 'host_demo/Cargo.toml · trecho TOML'),
            },
            {
              title: 'A lógica funciona no PC',
              body: 'O host usa std para imprimir; a biblioteca adc_core usa core para calcular. Assim, a parte numérica pode ser validada antes de ligar um ADC físico. Para 5000, a função limita a entrada a 4095 e devolve 3300.',
              visual: code(`fn main() {
    let mv = adc_core::millivolts(2048);
    println!("{mv}");
}`, [2], 'host_demo/src/main.rs · saída: 1650'),
            },
            {
              title: 'No seu computador',
              body: 'Preparação para o projeto 3 do roteiro: firmware com LED, botão e sensor. Crie adc_core como biblioteca e host_demo como programa, com uma dependência local no manifesto de host_demo. Copie a função millivolts do card anterior para adc_core/src/lib.rs e o main do card anterior para host_demo/src/main.rs. Pronto quando cargo run no host imprimir 1650, testes cobrirem 0, 4095 e 5000, e o Clippy passar nos dois pacotes. Não é preciso placa nem crate externa. Depois leve essa lógica ao curso de Sistemas Embarcados e escolha a HAL e o runtime específicos da placa para o firmware real.',
              visual: code(`cargo new adc_core --lib
cargo new host_demo
cd adc_core
cargo test
cargo fmt
cargo fmt --check
cargo clippy -- -D warnings
cd ../host_demo
cargo run
cargo fmt
cargo fmt --check
cargo clippy -- -D warnings`, [], 'Terminal · dois pacotes locais'),
            },
          ],
          exercises: [
            mcq('O retorno nunca do panic handler indica o quê?', ['A função não devolve o controle normalmente.', 'A função sempre devolve zero.', 'A função sempre imprime o erro.', 'A função configura o clock automaticamente.'], 0, 'O handler deve divergir, por exemplo ficando em um laço ou reiniciando a placa. Ele não substitui a configuração e inicialização do hardware.'),
            tf('Uma biblioteca no_std de cálculo precisa definir seu próprio panic handler para cada função.', false, 'O programa final sem std precisa de um único handler no grafo ligado. Uma biblioteca reutilizável comum deixa essa decisão para o ambiente que a integra.'),
            match('Associe a camada ao contrato:', [['Trait de embedded-hal', 'Define uma operação portátil'], ['HAL concreta', 'Realiza a operação no periférico'], ['Driver genérico', 'Usa operações sem fixar a placa'], ['Panic handler', 'Define o destino de um panic']], 'A abstração permite reutilizar drivers; o código específico da placa implementa os contratos. O handler cuida de panic, não da configuração normal dos periféricos.'),
            mcq('Se high falha, o que enable devolve nesta interface didática?', ['O mesmo Err recebido do pino.', 'Ok sempre, escondendo a falha.', 'Um número com a tensão medida.', 'Um panic obrigatório.'], 0, 'A chamada é a última expressão da função; seu Result é devolvido sem alteração. O chamador escolhe como tratar o erro. O exemplo não usa a crate embedded-hal.', {
              visual: code(`pub trait Output {
    type Error;
    fn high(&mut self)
        -> Result<(), Self::Error>;
}
pub fn enable<P: Output>(
    pin: &mut P,
) -> Result<(), P::Error> {
    pin.high()
}`, [9], 'Biblioteca didática · retorno de erro'),
            }),
            gen((rng) => {
              const n = randInt(rng, 2, 8);
              return num('Um teste host simula pulsos. Qual é o contador impresso?', n * 2, `O laço tem ${n} iterações e cada uma conta duas transições: ligar e desligar. Portanto o contador vale ${2 * n}. O teste não mede tempo físico nem acessa uma placa.`, { visual: code(`fn main() {
    let mut edges = 0;
    for _ in 0..${n} {
        edges += 2;
    }
    println!("{edges}");
}`, [3, 4], 'Modelo host de transições digitais') });
            }),
            order('Ordene um plano para levar a lógica do PC ao microcontrolador:', ['Testar a lógica independente da placa', 'Selecionar alvo, runtime e HAL compatíveis', 'Integrar os periféricos e o panic handler', 'Gerar a imagem para o alvo e gravar', 'Conferir LED, botão e sensor na placa'], 'Os testes host verificam a lógica. A integração acrescenta suporte de hardware e inicialização; depois é necessário gerar a imagem correta, gravar e validar efeitos físicos.'),
            codePuzzle('Monte um programa host: represente ligar e desligar como estados e imprima false.', [
              'fn main() {',
              '    let on = true;',
              '    let states = [on, !on];',
              '    let final_state = states[1];',
              '    let text = final_state.to_string();',
              '    println!("{text}");',
              '}',
            ], ['    let final_state = states[0];', '    let states = [on, on];'], 'O array representa primeiro ligado e depois desligado. O índice 1 seleciona false. É um teste host de estado lógico, sem prometer que um pino físico já foi acionado.'),
            multi('O que ainda precisa ser escolhido para transformar a biblioteca em firmware real?', ['Suporte de inicialização e ligação para o alvo.', 'Configuração dos pinos e periféricos pela HAL apropriada.', 'Um handler de panic compatível e único.', 'Uma chamada a println de std como requisito de toda placa.'], [0, 1, 2], 'Firmware exige suporte de alvo, configuração e tratamento de panic. println de std não está disponível no bare metal comum; saída de diagnóstico depende do transporte e do ambiente escolhidos.'),
          ],
        },
      ],
    },
  ],
};
