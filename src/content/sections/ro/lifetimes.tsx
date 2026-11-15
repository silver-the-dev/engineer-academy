import type { UnitDef } from '../../types';
import { code, fill, gen, match, mcq, num, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { randInt } from '../../../lib/random';

// Exemplos completos, salvo quando o título diz "assinatura" ou "trecho".
// Os exemplos de comprimento usam ASCII: str::len mede bytes, não letras.
const longest = `fn longest<'a>(
    x: &'a str,
    y: &'a str,
) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}`;

const missing = `fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
fn main() {}`;

const dangling = `fn main() {
    let r;
    {
        let n = 12;
        r = &n;
    }
    println!("{r}");
}`;

const localReturn = `fn make<'a>() -> &'a str {
    let s = String::from("sensor");
    s.as_str()
}
fn main() {}`;

const first = `fn first<'a>(
    x: &'a str,
    _y: &str,
) -> &'a str {
    x
}`;

const overlap = `${longest}
fn main() {
    let a = String::from("motor");
    {
        let b = String::from("fio");
        let r = longest(&a, &b);
        println!("{r}");
    }
}`;

const outside = `${longest}
fn main() {
    let a = String::from("motor");
    let r;
    {
        let b = String::from("fio");
        r = longest(&a, &b);
    }
    println!("{r}");
}`;

const ownedReturn = `fn make() -> String {
    let s = String::from("sensor");
    s
}
fn main() {
    let name = make();
    println!("{name}");
}`;

const elided = `fn word(s: &str) -> &str {
    s.split(' ').next().unwrap_or("")
}
fn main() {
    let s = String::from("motor ativo");
    println!("{}", word(&s));
}`;

const method = `struct Label {
    text: String,
}
impl Label {
    fn show(&self, _tip: &str) -> &str {
        &self.text
    }
}
fn main() {
    let label = Label {
        text: String::from("motor"),
    };
    println!("{}", label.show("nome"));
}`;

const excerpt = `struct Excerpt<'a> {
    text: &'a str,
}
fn main() {
    let s = String::from("motor ativo");
    let e = Excerpt { text: &s[..5] };
    println!("{}", e.text);
}`;

const staticBad = `fn main() {
    let s = String::from("motor");
    let r: &'static str = &s;
    println!("{r}");
}`;

export const rustLifetimes: UnitDef = {
  id: 'ro-life', title: 'Lifetimes', icon: '⏳',
  subtitle: 'Descreva por quanto tempo uma referência pode ser usada',
  source: 'The Rust Programming Language, edição 2024, capítulo 10.3 — https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html · Roteiro Desafio 50 dias Rust, exercícios 10 e 11.',
  extra: true,
  guide: 'Uma referência só pode ser usada enquanto os dados apontados forem válidos. Lifetimes descrevem relações entre referências; não prolongam valores, não copiam dados e não acrescentam um cronômetro em execução. Em longest, as duas entradas e o retorno compartilham uma região válida comum. Elisão: cada referência de entrada ganha uma lifetime própria; uma única lifetime de entrada passa às saídas; em métodos com várias entradas, a lifetime do empréstimo de self passa às saídas. Se ainda houver ambiguidade, anote a relação. Structs que guardam referências precisam declarar essa relação. Referências estáticas podem apontar para dados válidos durante todo o programa, como literais de string; uma String local não se torna estática por uma anotação.',
  lessons: [
    {
      id: 'ro-life-pq', title: 'Por que lifetimes existem',
      parts: [
        {
          card: [
            {
              title: 'A referência precisa de dados vivos',
              body: 'Em C, guardar o endereço de uma variável local e usá-lo depois que ela deixa de existir pode acessar memória inválida. Rust verifica esse risco antes de executar. Aqui, o dono do número continua vivo quando a referência é usada. O programa imprime 12. Toda referência tem uma lifetime, mesmo sem anotação escrita.',
              visual: code(`fn main() {
    let n = 12;
    let r = &n;
    println!("{r}");
}`, [2, 3, 4], 'Referência válida'),
            },
            {
              title: 'Veja a janela de validade',
              body: 'Leia de cima para baixo. Declarar a variável r fora de um bloco não mantém o dado n vivo. O que importa é haver dados válidos em todos os usos do empréstimo.',
              visual: table(['Momento', 'n', 'r'], [
                ['Criar n', 'Válido', 'Ainda não existe'],
                ['Emprestar &n', 'Válido', 'Aponta para n'],
                ['Imprimir r', 'Válido', 'Uso permitido'],
                ['Sair de main', 'Fim do escopo', 'Sem novos usos'],
              ]),
            },
          ],
          exercises: [
            mcq('O que uma lifetime permite verificar?', ['Se o dado ainda é válido em cada uso da referência', 'Quantos segundos o programa leva', 'A capacidade do processador', 'Quantas cópias uma String fará'], 0, 'A análise compara a validade dos dados com os usos das referências; não mede tempo de relógio.'),
            tf('Toda referência tem uma lifetime, mesmo quando não escrevemos seu nome.', true, 'A ausência de anotação não elimina a validade limitada de uma referência. Muitas relações podem ser inferidas.'),
            num('O que o programa imprime?', 12, 'r empresta n e n ainda está vivo no println. A formatação mostra o valor apontado: 12.', { visual: code(`fn main() {
    let n = 12;
    let r = &n;
    println!("{r}");
}`, [4], 'Leia a referência') }),
            match('Associe cada elemento ao papel:', [['Dono do dado', 'Mantém o valor sob sua responsabilidade'], ['Referência', 'Empresta acesso ao dado'], ['Borrow checker', 'Verifica os usos dos empréstimos']], 'O dono controla o valor, a referência oferece acesso emprestado e o borrow checker confere se esse acesso é válido.'),
            gen((rng) => {
              const n = randInt(rng, 10, 90);
              return num('Qual número aparece na saída?', n, `r aponta para n, que contém ${n} e permanece válido até a impressão. Não há cópia explícita nem mudança de valor.`, { visual: code(`fn main() {
    let n = ${n};
    let r = &n;
    println!("{r}");
}`, [4], 'Um empréstimo válido') });
            }),
            codePuzzle('Monte o programa que empresta o texto e imprime motor.', [
              'fn main() {',
              '    let s = String::from("motor");',
              '    let r = s.as_str();',
              '    println!("{r}");',
              '}',
            ], ['    drop(s); r.len();', '    let r = &missing;'], 'Crie a String antes de emprestar seu conteúdo, depois use r enquanto s ainda está vivo. A saída é motor. Destruir s antes do uso invalidaria o empréstimo.'),
            mcq('O programa com bloco interno compila?', ['Não: n deixa de existir antes do uso de r', 'Sim: r fora do bloco prolonga n', 'Sim: inteiros locais são estáticos', 'Não: println não aceita referências'], 0, 'E0597: `n` does not live long enough. n termina no bloco interno, mas r é usado depois. Mova n para o escopo externo ou imprima r dentro do bloco.', { visual: code(dangling, [4, 5, 7], 'Não compila — E0597') }),
          ],
        },
        {
          card: [
            {
              title: 'Nomear não prolonga',
              body: 'O nome de lifetime é um parâmetro da assinatura. Ele descreve um contrato; não manda o programa manter uma alocação viva. O trecho abaixo é incorreto: s pertence a make e é destruída ao retornar. Nem um nome genérico no retorno salva a referência. O compilador aponta E0515. Se a função cria o texto, devolva a String e transfira sua posse.',
              visual: code(localReturn, [1, 2, 3], 'Não compila — E0515'),
            },
            {
              title: 'Transfira o valor criado',
              body: 'Agora make devolve a String inteira. A responsabilidade pelo texto passa para name, no chamador. O programa imprime sensor. Retornar um valor com posse e retornar uma referência são contratos diferentes.',
              visual: code(ownedReturn, [1, 3, 6], 'Retorno com posse'),
            },
            {
              title: 'No seu computador',
              body: 'Prepare o exercício 11 do roteiro: use cargo new lifetime_scope e confira edition = "2024" em Cargo.toml. Reproduza o erro do bloco interno desta lição e rode cargo check: espere E0597. Corrija movendo o dono para o escopo externo. Depois implemente make retornando String. Pronto quando cargo run imprimir sensor, o exemplo corrigido compilar e cargo clippy -- -D warnings passar sem avisos. Guarde o caso incorreto apenas como comentário.',
              visual: code('cargo new lifetime_scope\ncd lifetime_scope\ncargo check\ncargo run\ncargo clippy -- -D warnings', [], 'Terminal — desafio local'),
            },
          ],
          exercises: [
            tf('Escrever um nome de lifetime muda o instante em que uma String local é destruída.', false, 'A anotação descreve restrições. A destruição segue a posse e os escopos; nenhum nome de lifetime estende a vida do valor.'),
            mcq('Quem passa a possuir o texto retornado no programa correto?', ['name, no chamador', 'Uma referência invisível dentro de make', 'O compilador para sempre', 'Ninguém: o texto já foi destruído'], 0, 'make move a String para o chamador. name recebe a posse e pode usá-la até que seja movida ou destruída.', { visual: code(ownedReturn, [3, 6], 'Siga a posse') }),
            fill('Complete o diagnóstico conceitual:', 'A anotação descreve uma ___ entre referências; ela não prolonga o valor.', ['relação'], ['cópia', 'alocação', 'contagem de segundos'], 'A informação liga a validade das referências. Criar uma cópia ou manter um dono vivo é uma decisão diferente.'),
            gen((rng) => {
              const n = randInt(rng, 2, 8);
              const s = 'x'.repeat(n);
              return num('Quantos bytes tem a String recebida pelo chamador?', n, `make devolve uma String com ${n} caracteres ASCII x. Cada x ocupa um byte; a String pertence ao chamador e len retorna ${n}.`, { visual: code(`fn make() -> String {
    String::from("${s}")
}
fn main() {
    let s = make();
    println!("{}", s.len());
}`, [5, 6], 'Retornar a posse') });
            }),
            codePuzzle('Monte a função make que devolve a posse de uma String com sensor.', [
              'fn make() -> String {',
              '    let s = String::from("sensor");',
              '    s',
              '}',
            ], ['    s.as_str()', '    &s'], 'O retorno é String e a expressão final s transfere sua posse. s.as_str() e &s emprestariam um dado local. Esta função não imprime; quem a chamar receberá sensor.'),
            mcq('Qual correção resolve a origem do erro mostrado?', ['Retornar String e mover s', 'Trocar o nome da lifetime', 'Declarar r fora da função', 'Adicionar uma segunda referência local'], 0, 'E0515: cannot return value referencing local variable `s`. A String local será destruída; retornar sua posse resolve. Uma anotação diferente não cria um dono para os dados.', { visual: code(localReturn, [3], 'Retorno inválido') }),
            mcq('Uma função precisa devolver uma referência a dados criados dentro dela. Qual decisão de projeto é adequada?', ['Devolver o valor com posse ou receber os dados do chamador', 'Prometer qualquer lifetime sem mudar o código', 'Desligar o borrow checker no Cargo.toml', 'Colocar o nome da variável entre aspas'], 0, 'O chamador pode fornecer os dados que continuarão vivos, ou receber o valor criado com posse. A assinatura deve representar um fluxo de memória válido.'),
          ],
        },
      ],
    },
    {
      id: 'ro-life-anot', title: 'Anotações em funções',
      parts: [
        {
          card: [
            {
              title: 'longest: de qual entrada vem a saída?',
              body: 'O exercício 11 do roteiro compara dois textos e devolve o mais longo. Chamaremos a função de longest, como no livro. Sem anotações, duas referências de entrada deixam a saída ambígua e ocorre E0106. Não basta o compilador ler o if: a assinatura precisa declarar a relação. O exemplo usa len, que mede bytes; aqui só usamos ASCII.',
              visual: code(missing, [1], 'Não compila — E0106'),
            },
            {
              title: 'Uma região comum, não vidas idênticas',
              body: 'Declare o parâmetro de lifetime após o nome da função e use-o depois de cada &. As duas entradas precisam ser válidas durante uma região comum, e o resultado pode ser usado nessa região. Os donos não precisam ter nascido juntos nem morrer juntos. O código escolhe x só quando é estritamente maior; no empate escolhe y.',
              visual: code(longest, [1, 2, 3, 4], 'Função correta — sem impressão'),
            },
            {
              title: 'O contrato em um desenho',
              body: 'A saída pode apontar para qualquer entrada. Para usar o retorno de longest, respeite a região em que ambos os empréstimos são válidos.',
              visual: table(['Referência', 'Papel no contrato'], [
                ['x', 'Válida durante a região comum'],
                ['y', 'Válida durante a região comum'],
                ['retorno', 'Uso permitido nessa região'],
              ]),
            },
          ],
          exercises: [
            mcq('Por que a versão sem anotação é rejeitada?', ['A assinatura não relaciona o retorno às duas entradas', 'Rust proíbe retornar slices', 'len só funciona em números', 'Toda comparação exige String por valor'], 0, 'E0106: missing lifetime specifier. Há duas lifetimes de entrada e nenhuma regra de elisão escolhe a saída. Declare uma relação comum nas entradas e no retorno.', { visual: code(missing, [1], 'Assinatura ambígua') }),
            tf('Usar o mesmo parâmetro de lifetime exige que as duas Strings donas sejam criadas na mesma linha.', false, 'A relação exige uma região de validade comum para os empréstimos. Os donos podem ter escopos e tempos de criação diferentes.'),
            mcq('Qual é a saída do programa?', ['motor', 'fio', 'motorfio', '3'], 0, 'motor tem 5 bytes ASCII e fio tem 3. Como 5 > 3, longest retorna x e o println mostra motor.', { visual: code(`${longest}
fn main() {
    let r = longest("motor", "fio");
    println!("{r}");
}`, [], 'Compare os comprimentos') }),
            match('Associe cada decisão da função ao resultado:', [['x tem mais bytes', 'Devolve x'], ['Comprimentos iguais', 'Devolve y'], ['Anotação de lifetime', 'Descreve a validade do empréstimo']], 'O if decide qual referência retornar. A assinatura descreve onde essa referência poderá ser usada; não decide qual texto é maior.'),
            gen((rng) => {
              const a = randInt(rng, 2, 8);
              const b = randInt(rng, 2, 8);
              return num('Quantos bytes tem o texto retornado?', Math.max(a, b), `Os textos ASCII têm ${a} e ${b} bytes. longest devolve o maior; no empate devolve o segundo, com o mesmo comprimento. len imprime ${Math.max(a, b)}.`, { visual: code(`${longest}
fn main() {
    let r = longest(
        "${'a'.repeat(a)}", "${'b'.repeat(b)}",
    );
    println!("{}", r.len());
}`, [], 'longest com dados variados') });
            }),
            codePuzzle('Monte longest: devolva x se tiver mais bytes e y nos demais casos.', [
              "fn longest<'a>(",
              "    x: &'a str, y: &'a str,",
              ") -> &'a str {",
              '    if x.len() > y.len() {',
              '        x',
              '    } else { y }',
              '}',
            ], ['    } else { y.len() }', ") -> &'static str {"], 'O parâmetro de lifetime liga ambas as entradas ao retorno. O corpo devolve o maior em bytes e escolhe y no empate. len retorna usize, não uma slice. A função só retorna uma slice; não imprime nem aloca outro texto.'),
            mcq('Qual é a saída no empate?', ['bb', 'aa', 'aabb', 'O programa falha ao compilar'], 0, 'As duas slices têm 2 bytes. A condição usa > e é falsa no empate: o ramo else devolve y, que contém bb.', { visual: code(`${longest}
fn main() {
    println!("{}", longest("aa", "bb"));
}`, [], 'Atenção ao empate') }),
          ],
        },
        {
          card: [
            {
              title: 'Use o resultado na interseção',
              body: 'a vive no escopo externo; b vive só no interno. O resultado é impresso enquanto ambos estão vivos: a saída é motor. Se você levar esse uso para depois do bloco interno, o contrato de longest será violado, mesmo sabendo visualmente que motor é maior. A verificação da chamada respeita a assinatura.',
              visual: code(overlap, [14, 15, 16], 'Uso dentro da região comum'),
            },
            {
              title: 'Quando só a primeira entrada importa',
              body: 'Esta outra função sempre retorna x. Só x e o retorno compartilham o parâmetro de lifetime; a segunda entrada tem validade independente e nem é usada. O prefixo _ indica isso. Não imponha uma relação com y quando o resultado não depende dela.',
              visual: code(first, [2, 3, 4], 'first — função correta'),
            },
            {
              title: 'No seu computador',
              body: 'Faça o exercício 11: cargo new longest_lab, edição 2024. Implemente longest e teste motor/fio, aa/bb e dois textos vazios. Pronto quando cargo run imprimir motor, bb e 0 (o comprimento do último resultado), uma saída por linha. Apague temporariamente as anotações e confirme E0106 com cargo check; restaure-as. Reproduza também o uso fora do bloco e confirme E0597, depois corrija o escopo. Termine com cargo clippy -- -D warnings sem avisos.',
              visual: code('cargo new longest_lab\ncd longest_lab\ncargo check\ncargo run\ncargo clippy -- -D warnings', [], 'Terminal — roteiro 11'),
            },
          ],
          exercises: [
            mcq('No exemplo correto, quando r é usado?', ['Enquanto a e b ainda estão vivos', 'Depois de b ser destruída', 'Antes de a ser criada', 'Depois do fim de main'], 0, 'A impressão fica dentro do bloco que possui b. Os dois empréstimos fornecidos a longest continuam válidos.', { visual: code(overlap, [14, 15, 16], 'Região comum') }),
            tf('longest pode ter seu resultado usado após b morrer só porque o texto de a é visivelmente maior.', false, 'A chamada usa o contrato da assinatura, que relaciona o retorno às duas entradas. Não se especializa a regra de validade com base no tamanho desses textos.'),
            mcq('O que acontece ao deslocar a impressão para fora?', ['E0597: b não vive o suficiente', 'Imprime motor sem restrições', 'E0106: faltou declarar a lifetime', 'Copia b automaticamente para o heap'], 0, 'E0597: `b` does not live long enough. O retorno é relacionado às duas entradas; b é destruída antes do uso. Mova a impressão para dentro do bloco ou mantenha b viva no escopo externo.', { visual: code(outside, [15, 16, 18], 'Não compila — E0597') }),
            gen((rng) => {
              const n = randInt(rng, 3, 8);
              return num('Qual comprimento o programa imprime depois do bloco?', n, `first devolve só um empréstimo de a. O contrato não liga a saída a b, então b pode terminar antes da impressão. a contém ${n} bytes ASCII.`, { visual: code(`${first}
fn main() {
    let a = String::from("${'x'.repeat(n)}");
    let r;
    {
        let b = String::from("curto");
        r = first(&a, &b);
    }
    println!("{}", r.len());
}`, [], 'Entradas independentes') });
            }),
            match('Associe a intenção à decisão de assinatura:', [['Pode devolver qualquer entrada', 'Relacionar ambas ao retorno'], ['Sempre devolve a primeira', 'Relacionar a primeira ao retorno'], ['Cria uma String nova', 'Retornar o valor com posse']], 'O contrato deve representar a origem possível do resultado. Um valor criado localmente precisa sair com posse, em vez de deixar uma referência pendurada.'),
            codePuzzle('Monte first: a saída deve depender só de x; a segunda entrada fica independente.', [
              "fn first<'a>(",
              "    x: &'a str, _y: &str,",
              ") -> &'a str {",
              '    x',
              '}',
            ], ["    x: &'a str, _y: &'a str,", '    _y'], 'Só x e o retorno recebem o mesmo parâmetro de lifetime. A segunda entrada não limita a validade da saída. A função retorna x sem imprimir.'),
            mcq('Você precisa guardar o texto escolhido mesmo depois de ambos os donos originais terminarem. Qual solução atende ao objetivo?', ['Criar uma String própria a partir do resultado antes de sair do bloco', 'Trocar todos os nomes de lifetime pelo mesmo nome', 'Declarar só a variável de referência no escopo externo', 'Adicionar uma anotação estática à referência local'], 0, 'Copiar o texto para uma String própria enquanto a slice ainda é válida dá ao resultado seu próprio dono. Renomear ou deslocar apenas a referência não mantém os dados originais vivos.'),
          ],
        },
      ],
    },
    {
      id: 'ro-life-elisao', title: 'Regras de elisão',
      parts: [
        {
          card: [
            {
              title: 'Regras 1 e 2: uma entrada de referência',
              body: 'Regra 1: cada referência de entrada sem anotação ganha uma lifetime própria. Regra 2: se houver exatamente uma lifetime de entrada, ela será atribuída a todas as referências de saída sem anotação. A função word recebe uma slice e retorna uma slice dela. A assinatura pode omitir os nomes; a saída do programa é motor. Um parâmetro inteiro adicional não introduz outra lifetime.',
              visual: code(elided, [1, 2], 'Elisão — roteiro 10'),
            },
            {
              title: 'Aplique às assinaturas',
              body: 'Conte as referências de entrada, não a quantidade total de parâmetros. Sem saída emprestada, não há lifetime de retorno para resolver. Se sobrarem várias entradas candidatas a uma saída e não houver self, as regras não escolhem por você.',
              visual: table(['Entradas', 'Saída', 'Decisão'], [
                ['Uma referência', 'Referência', 'Regra 2 resolve'],
                ['Uma referência e um inteiro', 'Referência', 'Regra 2 resolve'],
                ['Duas referências', 'Número', 'Sem saída a relacionar'],
                ['Duas referências, sem self', 'Referência', 'Anotar a relação'],
              ]),
            },
          ],
          exercises: [
            mcq('A assinatura de word precisa de nomes explícitos de lifetime?', ['Não: uma única entrada de referência determina a saída', 'Sim: toda função precisa deles', 'Sim: str nunca permite elisão', 'Não: a saída vira estática automaticamente'], 0, 'As regras 1 e 2 atribuem à saída a lifetime da única referência de entrada. A slice continua emprestada de s; não vira estática.', { visual: code(elided, [1], 'Precisa anotar?') }),
            fill('Complete a segunda regra:', 'Exatamente ___ lifetime de entrada é atribuída às saídas elididas.', ['uma'], ['duas', 'três', 'zero'], 'Com uma única lifetime de entrada não existe escolha ambígua para a referência de saída.'),
            mcq('Precisa anotar lifetimes nesta assinatura?', ['Não: n não acrescenta uma lifetime de referência', 'Sim: há dois parâmetros, sempre', 'Sim: usize é uma referência', 'Não: toda saída é estática'], 0, 'Há uma única referência de entrada, s. A regra 2 relaciona o retorno a ela. n é recebido por valor e não introduz outra lifetime.', { visual: code(`fn prefix(s: &str, n: usize) -> &str {
    &s[..n]
}
fn main() {
    println!("{}", prefix("motor", 2));
}`, [1], 'Compila e imprime mo') }),
            tf('A elisão elimina a verificação de empréstimos no corpo da função.', false, 'Elisão só permite omitir nomes previsíveis na assinatura. O corpo continua obrigado a devolver referências válidas e compatíveis com ela.'),
            gen((rng) => {
              const n = randInt(rng, 1, 6);
              return num('Qual comprimento o prefixo tem?', n, `n vale ${n}; a string contém 8 bytes ASCII, então o corte 0..n é válido e tem ${n} bytes. A única referência de entrada determina a lifetime de saída.`, { visual: code(`fn prefix(s: &str, n: usize) -> &str {
    &s[..n]
}
fn main() {
    let r = prefix("abcdefgh", ${n});
    println!("{}", r.len());
}`, [1, 5], 'Elisão com parâmetro por valor') });
            }),
            codePuzzle('Monte uma função que empresta o prefixo. Os chamadores devem fornecer um corte válido em UTF-8.', [
              'fn prefix(',
              '    s: &str, n: usize,',
              ') -> &str {',
              '    &s[..n]',
              '}',
            ], ['    s[..n]', ") -> &'static str {"], 'A função devolve uma referência para o intervalo de bytes 0..n da entrada. A regra 2 resolve a saída. n deve estar dentro do comprimento e numa fronteira UTF-8; os exemplos usam ASCII.'),
            mcq('Duas entradas emprestadas, mas retorno numérico: precisa anotar?', ['Não: não existe referência de saída a relacionar', 'Sim: toda dupla de referências exige a mesma lifetime', 'Sim: usize guarda um empréstimo', 'Não: as duas entradas viram uma só referência'], 0, 'A regra 1 dá validade independente às entradas. len retorna um número, não uma referência, então a assinatura não tem saída emprestada ambígua. O programa imprime 5.', { visual: code(`fn total(x: &str, y: &str) -> usize {
    x.len() + y.len()
}
fn main() {
    println!("{}", total("ab", "cde"));
}`, [1], 'Precisa anotar?') }),
          ],
        },
        {
          card: [
            {
              title: 'Regra 3: o empréstimo de self',
              body: 'Quando há várias lifetimes de entrada e uma pertence a &self ou &mut self, a regra 3 atribui a lifetime desse empréstimo às saídas elididas. Não é a lifetime de um campo escolhido por adivinhação. Em show, o retorno empresta o texto de label, e _tip é independente. A saída é motor. Essa regra ajuda métodos, mas não resolve longest, que não recebe self.',
              visual: code(method, [5, 6], 'Método com duas entradas'),
            },
            {
              title: 'No seu computador',
              body: 'Conecte os exercícios 10 e 11 do roteiro: cargo new elision_lab, edição 2024. Implemente word para obter a primeira palavra de "motor ativo" e um método show numa Label dona de uma String. Pronto quando cargo run imprimir motor duas vezes, uma por linha. Escreva, em comentários, quais regras resolvem cada assinatura. Acrescente longest: confirme que ela precisa de anotação explícita. Termine com cargo clippy -- -D warnings sem avisos.',
              visual: code('cargo new elision_lab\ncd elision_lab\ncargo run\ncargo clippy -- -D warnings', [], 'Terminal — elisão aplicada'),
            },
          ],
          exercises: [
            mcq('Qual entrada determina a saída elidida de show?', ['O empréstimo de self', 'A referência _tip', 'O texto mais longo', 'Nenhuma: a saída é sempre estática'], 0, 'A regra 3 dá preferência ao empréstimo de self quando há várias lifetimes de entrada num método. O corpo devolve &self.text.', { visual: code(method, [5, 6], 'Aplique a terceira regra') }),
            match('Associe cada regra à sua ação:', [['Regra 1', 'Dar lifetime própria a cada referência de entrada'], ['Regra 2', 'Usar a única lifetime de entrada nas saídas'], ['Regra 3', 'Usar a lifetime do empréstimo de self nas saídas']], 'A primeira trata entradas; a segunda resolve uma única candidata; a terceira resolve métodos com receptor emprestado quando há várias entradas.'),
            mcq('Nesta função livre, precisa anotar mesmo que o corpo sempre retorne x?', ['Sim: duas entradas e nenhum self deixam o retorno ambíguo', 'Não: a primeira entrada vence por ordem', 'Não: Rust usa a última entrada por padrão', 'Não: o corpo substitui o contrato da assinatura'], 0, 'E0106: missing lifetime specifier. As regras não escolhem entre x e _y em funções livres. Relacione explicitamente x ao retorno, como na função first.', { visual: code(`fn first(x: &str, _y: &str) -> &str {
    x
}
fn main() {}`, [1], 'Não compila — E0106') }),
            gen((rng) => {
              const n = randInt(rng, 2, 7);
              return num('Quantos bytes o método devolve?', n, `A regra 3 relaciona o retorno ao empréstimo de self; o método devolve text, que contém ${n} bytes ASCII. O comprimento de _tip não interfere.`, { visual: code(`struct Label { text: String }
impl Label {
    fn show(&self, _tip: &str) -> &str {
        &self.text
    }
}
fn main() {
    let label = Label {
        text: String::from("${'x'.repeat(n)}"),
    };
    let r = label.show("dica");
    println!("{}", r.len());
}`, [], 'Regra 3 em ação') });
            }),
            codePuzzle('Dentro de impl Label, monte show: devolva text e mantenha _tip independente.', [
              'fn show(',
              '    &self,',
              '    _tip: &str,',
              ') -> &str {',
              '    &self.text',
              '}',
            ], ['    _tip', ") -> &'static str {"], 'A regra 3 liga a saída a &self. &self.text empresta o conteúdo do campo String. Retornar _tip exigiria outra relação explícita; a referência recebida como dica não acompanha necessariamente self.'),
            tf('A terceira regra também considera um receptor mutável emprestado.', true, 'A regra vale para &self e &mut self. Em ambos os casos é a lifetime do empréstimo do receptor que determina as saídas elididas.'),
            mcq('O novo método deve devolver a dica recebida, independente de self. Qual é a decisão correta?', ['Anotar a relação entre a dica e o retorno', 'Confiar na elisão que sempre escolhe self', 'Tornar o campo text mutável', 'Renomear show e manter o mesmo contrato'], 0, 'A elisão escolheria o empréstimo de self. Para retornar a referência da dica independentemente dele, declare um parâmetro de lifetime no método e use-o na dica e no retorno.'),
          ],
        },
      ],
    },
    {
      id: 'ro-life-struct', title: 'Structs com referências e static',
      parts: [
        {
          card: [
            {
              title: 'Uma struct pode guardar um empréstimo',
              body: 'Excerpt guarda uma slice de um texto que pertence a outra variável. Declare o parâmetro de lifetime na struct e use-o no campo. A instância não ganha posse da String e não copia os caracteres. O texto precisa continuar válido enquanto o campo emprestado for usado. A saída é motor, os primeiros 5 bytes ASCII de s.',
              visual: code(excerpt, [1, 2, 6, 7], 'Vista sobre um texto'),
            },
            {
              title: 'Quem mantém cada coisa?',
              body: 'O campo guarda acesso ao buffer; não é responsável por manter o buffer alocado. Se precisar de uma struct independente da origem, considere um campo String com posse.',
              visual: table(['Elemento', 'Responsabilidade'], [
                ['s: String', 'Possui o buffer do texto'],
                ['e: Excerpt', 'Guarda uma referência a parte de s'],
                ['e.text', 'Só pode ser usado com s válida'],
                ['Fim de s', 'O empréstimo não pode ser usado depois'],
              ]),
            },
          ],
          exercises: [
            mcq('Quem é dono dos caracteres usados por e.text?', ['A String s', 'A struct e faz uma cópia automática', 'O parâmetro de lifetime aloca os caracteres', 'O campo text sempre aponta para um literal'], 0, 'e guarda uma slice do conteúdo de s. A String s continua responsável pelo buffer; a struct só empresta acesso.', { visual: code(excerpt, [6], 'Dono e vista') }),
            tf('Declarar uma lifetime na struct transforma seu campo emprestado em String com posse.', false, 'O campo continua sendo uma referência. A anotação descreve a dependência da validade dos dados externos; não copia nem transfere posse.'),
            mcq('Qual é a saída do exemplo?', ['motor', 'ativo', 'motor ativo', '5'], 0, 'O corte 0..5 seleciona os primeiros cinco bytes de motor ativo. Esses bytes formam motor, e o println mostra e.text.', { visual: code(excerpt, [6, 7], 'Leia a slice') }),
            fill('Complete a decisão de projeto:', 'Para a struct manter seu próprio texto, use um campo com ___.', ['posse'], ['cronômetro', 'anotação estática obrigatória', 'endereço inválido'], 'Um campo String pode possuir o texto. Um campo de referência só empresta dados que outro dono precisa manter válidos.'),
            gen((rng) => {
              const n = randInt(rng, 2, 7);
              return num('Quantos bytes o campo emprestado contém?', n, `O campo text recebe o intervalo 0..${n} de uma string ASCII de 8 bytes. A slice tem ${n} bytes e s segue viva na impressão.`, { visual: code(`struct Excerpt<'a> {
    text: &'a str,
}
fn main() {
    let s = String::from("abcdefgh");
    let e = Excerpt { text: &s[..${n}] };
    println!("{}", e.text.len());
}`, [6], 'Uma vista de tamanho variável') });
            }),
            codePuzzle('Com Excerpt já definida como no card, monte um main que imprime motor sem copiar o texto.', [
              'fn main() {',
              '    let s = String::from("motor");',
              '    let e = Excerpt { text: &s };',
              '    println!("{}", e.text);',
              '}',
            ], ['    drop(s); e.text.len();', '    let e = Excerpt { text: s };'], 's é criada antes do empréstimo. O campo text recebe uma referência, e e.text é usado enquanto s está viva. A saída é motor; passar s por valor não corresponde ao tipo do campo.'),
            mcq('É possível usar e.text depois deste bloco interno?', ['Não: E0597, pois s foi destruída', 'Sim: a struct prolonga s', 'Sim: toda slice de String é estática', 'Não: structs não podem guardar referências'], 0, 'E0597: `s` does not live long enough. e.text é usado após o fim de s. Mantenha a String no escopo externo, use e no bloco interno ou redesenhe a struct para possuir uma String.', { visual: code(`struct Excerpt<'a> {
    text: &'a str,
}
fn main() {
    let e;
    {
        let s = String::from("motor");
        e = Excerpt { text: &s };
    }
    println!("{}", e.text);
}`, [7, 8, 10], 'Não compila — E0597') }),
          ],
        },
        {
          card: [
            {
              title: 'Dados que podem valer pelo programa todo',
              body: 'Um literal de string fica nos dados do executável e pode fornecer uma referência estática. A variável local name ainda pode sair de escopo: quem tem validade por todo o programa são os dados referenciados. O programa imprime motor. Aqui tratamos de referências estáticas, não de declarar variáveis globais com a palavra-chave static.',
              visual: code(`fn main() {
    let name: &'static str = "motor";
    println!("{name}");
}`, [2], 'Literal com referência estática'),
            },
            {
              title: 'Uma promessa não fabrica dados eternos',
              body: 'Trocar o tipo da referência de uma String local para estático não mantém o buffer vivo. Este programa falha com E0597: s não vive o suficiente para essa exigência. Remova a exigência desnecessária, mantenha o dono vivo, ou devolva uma String quando a função cria o texto. Use uma referência estática apenas quando os dados realmente satisfazem o contrato.',
              visual: code(staticBad, [2, 3], 'Não compila — E0597'),
            },
            {
              title: 'No seu computador',
              body: 'Amplie o exercício 11: cargo new excerpt_lab, edição 2024. Defina Excerpt com um campo emprestado, crie a String "motor ativo" em main e imprima motor por meio da struct. Depois imprima sensor usando um literal anotado com referência estática. Pronto quando cargo run imprimir motor e sensor, uma por linha, e cargo clippy -- -D warnings não emitir avisos. Como experimento separado, exija referência estática de uma String local e confirme E0597 com cargo check; retire esse erro do programa final.',
              visual: code('cargo new excerpt_lab\ncd excerpt_lab\ncargo check\ncargo run\ncargo clippy -- -D warnings', [], 'Terminal — empréstimo ou posse?'),
            },
          ],
          exercises: [
            mcq('Por que o literal motor aceita uma referência estática?', ['Seus dados ficam disponíveis durante todo o programa', 'Porque name é variável global', 'Porque cinco letras recebem tratamento especial', 'Porque println prolonga qualquer referência'], 0, 'Os dados do literal fazem parte do programa. name pode ser local; a validade dos dados apontados é que permite a referência estática.'),
            tf('Anotar uma referência como estática impede a destruição de uma String local.', false, 'A anotação impõe uma exigência e o compilador verifica se ela é satisfeita. Não altera a posse nem a destruição da String.'),
            match('Associe cada origem à decisão adequada:', [['Literal de string', 'Pode fornecer referência estática'], ['Texto criado e devolvido por uma função', 'Pode sair como String com posse'], ['Slice de String do chamador', 'Relacionar a validade ao empréstimo recebido']], 'Literais têm dados disponíveis por todo o programa. Strings novas podem transferir posse. Slices de dados locais dependem do dono original.'),
            gen((rng) => {
              const n = randInt(rng, 2, 8);
              return num('Quantos bytes a referência estática permite ler neste programa?', n, `O literal contém ${n} caracteres ASCII x, portanto len imprime ${n}. A lifetime não muda o conteúdo nem seu comprimento.`, { visual: code(`fn main() {
    let s: &'static str = "${'x'.repeat(n)}";
    println!("{}", s.len());
}`, [2, 3], 'Literal sorteado') });
            }),
            codePuzzle('Monte um main que associa um literal a uma referência estática e imprime sensor.', [
              'fn main() {',
              '    let name: &\'static str = "sensor";',
              '    println!("{name}");',
              '}',
            ], ['    let name: &\'static str = &local;', '    println!("{missing}");'], 'O literal sensor tem dados disponíveis durante todo o programa. Primeiro associe a referência a name e depois a use na impressão. A saída é sensor.'),
            mcq('O que ocorre ao exigir esta referência estática?', ['E0597: s não satisfaz a duração exigida', 'A String passa a existir para sempre', 'A anotação copia o texto para o executável', 'Imprime motor porque s ainda está viva nesse ponto'], 0, 'E0597: `s` does not live long enough. A exigência estática vale para o contrato completo, mesmo que a impressão aconteça antes do fim de main. Remova a exigência e use uma referência local, ou mantenha a posse como String.', { visual: code(staticBad, [3], 'Promessa impossível para s') }),
            mcq('Você criou uma String lendo dados e quer devolvê-la. O compilador reclama de uma referência local. Qual solução ataca a causa?', ['Retornar a String com posse', 'Prometer referência estática ao mesmo buffer local', 'Trocar o nome da lifetime várias vezes', 'Apenas declarar a referência em outra linha'], 0, 'Devolva a posse do buffer ao chamador. Prometer uma duração maior não mantém a String local viva; a interface precisa refletir quem será responsável pelos dados.'),
          ],
        },
      ],
    },
  ],
};
