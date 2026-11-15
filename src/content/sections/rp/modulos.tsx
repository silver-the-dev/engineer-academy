import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { code, fill, gen, match, mcq, multi, num, order, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { randInt } from '../../../lib/random';
import { Label, Pt, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';

// O controle percorre relações concretas: caminho, arquivo, build ou dependência.
const percurso = (nomes: string[], estados: string[]): VisualSpec => ({
  name: 'stepper',
  height: 180,
  props: {
    steps: estados.length,
    view: { xMin: -0.8, xMax: nomes.length - 0.2, yMin: -0.8, yMax: 0.8 },
    render: (k: number) => <>
      {nomes.slice(1).map((_, i) => <Seg key={`s${i}`} x1={i} y1={0} x2={i + 1} y2={0} color={C.textMuted} />)}
      {nomes.map((nome, i) => <React.Fragment key={nome}>
        <Pt x={i} y={0} color={i === k ? C.gold : C.textMuted} r={i === k ? 8 : 4} />
        <Label x={i} y={-0.35} text={nome} size={11} anchor="middle" />
      </React.Fragment>)}
    </>,
    info: (k: number) => estados[k],
  },
});

const modulo = `mod sensor {
    pub fn dobro(n: i32) -> i32 {
        n * 2
    }
}
use crate::sensor::dobro;
fn main() {
    println!("{}", dobro(6));
}`;

const privado = `mod conta {
    fn saldo() -> i32 {
        20
    }
}
fn main() {
    println!("{}", conta::saldo());
}`;

const pai = `mod banco {
    const TAXA: i32 = 2;
    pub mod conta {
        pub fn liquido(n: i32) -> i32 {
            n - super::TAXA
        }
    }
}
fn main() {
    let n = banco::conta::liquido(10);
    println!("{n}");
}`;

const interno = `mod calc {
    pub(crate) fn soma(n: i32) -> i32 {
        n + 1
    }
}
fn main() {
    println!("{}", calc::soma(4));
}`;

const mainArquivo = `mod conta;
use crate::conta::saldo;
fn main() {
    println!("{}", saldo());
}`;
const contaArquivo = `pub fn saldo() -> i32 {
    30
}`;
const libArquivo = `pub mod conta;`;
const mainBiblioteca = `use banco::conta::saldo;
fn main() {
    println!("{}", saldo());
}`;

const manifesto = `[package]
name = "medidor"
version = "0.1.0"
edition = "2024"

[dependencies]
serde = "1.0"`;
const features = `[features]
default = []
relatorio = []`;
const comFeature = `fn main() {
    let ativo =
        cfg!(feature = "relatorio");
    println!("{ativo}");
}`;
const workspace = `[workspace]
resolver = "3"
members = ["banco-core", "banco-cli"]`;
const dependenciaLocal = `[dependencies]
banco-core = { path = "../banco-core" }`;
const core = `pub fn saldo() -> i32 {
    100
}`;
const cli = `use banco_core::saldo;
fn main() {
    println!("{}", saldo());
}`;
const documentado = `/// Dobra uma contagem inteira.
///
/// # Examples
///
/// \`\`\`
/// assert_eq!(medidas::dobro(3), 6);
/// \`\`\`
pub fn dobro(n: i32) -> i32 {
    n * 2
}`;

export const rustModulos: UnitDef = {
  id: 'rp-mod', title: 'Módulos, crates e Cargo', icon: '📁',
  subtitle: 'Da função privada ao projeto com biblioteca e aplicação',
  source: 'The Rust Programming Language, edição 2024, caps. 7 e 14 (https://doc.rust-lang.org/book/); Cargo Book (https://doc.rust-lang.org/cargo/); Desafio 50 Dias — Rust, dias 1, 15, 42 e 48.',
  extra: true,
  guide: 'Um pacote tem Cargo.toml e pode conter uma biblioteca e várias crates binárias. A raiz de cada crate define sua árvore de módulos. `mod` declara, `pub` expõe, `use` abrevia; `crate::` parte da raiz da crate atual e `super::` sobe ao módulo pai. `pub(crate)` limita o acesso à própria crate. Arquivos não mudam essas regras. Cargo.toml declara requisitos e features; Cargo.lock registra a resolução exata. Para versões estáveis a partir de 1.0, o requisito 1.2.3 admite versões desde 1.2.3 até antes de 2.0.0; 0.2.3 vai até antes de 0.3.0. Build comum usa dev; --release usa release. Workspaces reúnem pacotes com um lockfile e um target compartilhados, mas dependências entre membros são explícitas. cargo doc gera HTML; cargo test verifica também exemplos de documentação da biblioteca.',
  lessons: [
    {
      id: 'rp-mod-mod', title: 'mod, pub e use', parts: [
        {
          card: [
            {
              title: 'Uma árvore dentro da crate',
              body: 'Módulos agrupam itens e controlam acesso. A crate é uma unidade compilada; o módulo é uma divisão dentro dela. Aqui `mod` define sensor, `pub` libera dobro ao código pai e `use` permite chamar a função pelo nome curto. O programa imprime 12. O módulo sensor pode continuar privado: main está no mesmo módulo que o declara.',
              visual: code(modulo, [1, 2, 6], 'src/main.rs'),
            },
            {
              title: 'Siga o caminho absoluto',
              body: 'Avance e veja cada componente do caminho até a função. O import encurta a escrita; não executa a função nem remove a checagem de privacidade.',
              visual: percurso(['crate', 'sensor', 'dobro'], [
                'crate: comece na raiz da crate atual, aqui src/main.rs.',
                'sensor: entre no módulo declarado pela raiz.',
                'dobro: encontre a função pública; só a chamada executa seu corpo.',
              ]),
            },
          ],
          exercises: [
            mcq('Qual palavra declara um módulo?', ['mod', 'use', 'let', 'impl'], 0, 'mod cria uma entrada na árvore de módulos; use apenas introduz um nome em um escopo.'),
            tf('Adicionar use a uma função privada torna essa função pública.', false, 'use respeita a visibilidade do item. Para permitir o acesso do pai, a declaração precisa da visibilidade adequada.'),
            num('Qual número este programa imprime?', 12, 'O import aponta para sensor::dobro. A chamada recebe 6 e calcula 6 × 2 = 12.', { visual: code(modulo, [8], 'src/main.rs') }),
            fill('Complete o nome do ponto de partida de um caminho absoluto dentro da crate:', '___', ['crate'], ['super', 'self'], 'crate identifica a raiz da crate atual; super identifica o pai e self, o módulo atual.'),
            match('Associe cada palavra à sua função:', [['mod', 'declarar módulo'], ['pub', 'expor item'], ['use', 'introduzir nome no escopo']], 'Declarar o módulo, definir visibilidade e encurtar caminhos são três tarefas diferentes.'),
            gen((rng) => {
              const n = randInt(rng, 3, 18);
              return num('Qual número sai na chamada ao módulo?', 2 * n, `dobro recebe ${n} e multiplica por 2: a saída é ${2 * n}.`, {
                visual: code(modulo.replace('dobro(6)', `dobro(${n})`), [8], 'src/main.rs'),
              });
            }),
            mcq('Compila? O que impede a chamada destacada?', ['E0603: a função saldo é privada', 'Compila e imprime 20', 'E0308: 20 não é inteiro', 'E0382: saldo perdeu a posse'], 0, 'Não compila: E0603, function `saldo` is private. O pai não acessa essa função privada do filho. Marque a função com pub (ou pub(crate) para uso interno).', { visual: code(privado, [2, 7], 'src/main.rs — erro intencional') }),
            {
              ...codePuzzle('O módulo mostrado já está na raiz. Monte somente main para imprimir 14.', [
                'fn main() {',
                '    let n = crate::sensor::N;',
                '    let dobro = n * 2;',
                '    println!("{dobro}");',
                '}',
              ], ['    let n = sensor.N;', '    let dobro = n * 2'], 'A constante pública vale 7. Primeiro leia N, depois calcule seu dobro e só então imprima 14. O acesso a itens de módulo usa dois-pontos duplos.'),
              visual: code('mod sensor {\n    pub const N: i32 = 7;\n}', [], 'Preâmbulo já fornecido'),
            },
          ],
        },
        {
          card: [
            {
              title: 'O pai e os limites da API',
              body: 'Dentro de conta, `super::` aponta para banco. Filhos podem acessar itens privados dos ancestrais: por isso TAXA não precisa de pub. Já o pai precisa que a função do filho seja visível. O exemplo imprime 8. `pub(crate)` permite uso em toda a crate, respeitando a acessibilidade do caminho, sem oferecer o item a outras crates.',
              visual: code(pai, [5, 11], 'src/main.rs'),
            },
            { title: 'Visibilidade interna', body: 'Este programa imprime 5. Uma aplicação externa à crate não ganha acesso à função soma só porque consegue depender do pacote. `pub` é parte do contrato público; exponha apenas o necessário.', visual: code(interno, [2], 'src/main.rs') },
            {
              title: 'No seu computador',
              body: 'Adaptação do dia 15: crie conta_mod com Cargo e edição 2024. Em um módulo conta no main.rs, implemente uma Conta pública com saldo privado e métodos públicos new, depositar, sacar e saldo. Trabalhe em centavos; saque inválido não altera o saldo. Deposite 100 e saque 30: imprima 70. Pronto quando rodar sem avisos, recusar acesso direto ao campo com E0616 num teste temporário, e voltar a compilar depois de remover esse acesso.',
              visual: code('cargo new conta_mod --edition 2024\ncd conta_mod\ncargo run\ncargo fmt\ncargo clippy -- -D warnings', [], 'Terminal — após implementar'),
            },
          ],
          exercises: [
            mcq('Dentro de banco::conta, a que módulo super se refere?', ['banco', 'crate externa', 'conta', 'std'], 0, 'super sobe exatamente um nível: de conta para banco.'),
            tf('Um módulo filho pode acessar um item privado definido em seu módulo ancestral.', true, 'A privacidade permite acesso no módulo que define o item e em seus descendentes; isso torna super::TAXA válido.'),
            num('Qual número o programa imprime?', 8, 'liquido recebe 10 e lê TAXA = 2 no pai. O resultado é 10 − 2 = 8.', { visual: code(pai, [5], 'src/main.rs') }),
            mcq('Qual visibilidade expressa a intenção de usar uma função em toda a própria crate sem exportá-la?', ['pub(crate)', 'pub', 'use', 'mod'], 0, 'pub(crate) limita a visibilidade à crate atual. O caminho até o item também precisa ser acessível.'),
            multi('Quais afirmações estão corretas?', ['use não executa a função importada', 'crate aponta para a raiz da crate atual', 'pub em um módulo torna todas as suas funções públicas', 'super sempre aponta para uma biblioteca externa'], [0, 1], 'use introduz um nome; crate identifica a raiz atual. Cada item tem sua própria visibilidade e super aponta para o módulo pai.'),
            gen((rng) => {
              const n = randInt(rng, 8, 25);
              const taxa = randInt(rng, 1, 5);
              return num('Qual saldo líquido será impresso?', n - taxa, `O filho acessa TAXA no pai: ${n} − ${taxa} = ${n - taxa}.`, {
                visual: code(pai.replace('= 2;', `= ${taxa};`).replace('liquido(10)', `liquido(${n})`), [5], 'src/main.rs'),
              });
            }),
            mcq('A função com pub(crate) compila nesta chamada?', ['Sim, imprime 5 na mesma crate', 'Não: pub(crate) proíbe main', 'Não: apenas testes podem chamá-la', 'Sim, mas imprime 4'], 0, 'main e calc pertencem à mesma crate. A função soma adiciona 1 a 4, portanto imprime 5.', { visual: code(interno, [7], 'src/main.rs') }),
            {
              ...codePuzzle('A função do preâmbulo já existe. Monte main para imprimir 11.', [
                'fn main() {',
                '    let base = crate::calc::soma(4);',
                '    let total = base + 6;',
                '    println!("{total}");',
                '}',
              ], ['    let base = super::calc::soma(4);', '    let total = base + 6'], 'Na raiz, crate::calc identifica o módulo. soma(4) devolve 5; total recebe 11 e é impresso. super não sobe a partir da raiz.'),
              visual: code('mod calc {\n    pub(crate) fn soma(n: i32) -> i32 {\n        n + 1\n    }\n}', [], 'Preâmbulo já fornecido'),
            },
          ],
        },
      ],
    },
    {
      id: 'rp-mod-arq', title: 'Organização em arquivos', parts: [
        {
          card: [
            { title: 'mod declara; o arquivo define', body: 'Na raiz src/main.rs, `mod conta;` busca a definição em src/conta.rs ou em src/conta/mod.rs. Escolha uma forma, sem criar as duas. Mover o código para outro arquivo preserva os caminhos e a privacidade. O par de arquivos abaixo imprime 30.', visual: code(mainArquivo, [1, 2], 'src/main.rs') },
            { title: 'O conteúdo do arquivo filho', body: 'Não escreva outro bloco mod conta dentro de conta.rs: a declaração na raiz já deu esse nome ao módulo. O arquivo guarda diretamente os itens que pertencem a ele.', visual: code(contaArquivo, [1], 'src/conta.rs') },
            {
              title: 'Da declaração à saída', body: 'Avance para ver como o compilador encontra o módulo. Um arquivo solto em src não entra automaticamente na árvore.',
              visual: percurso(['main.rs', 'conta.rs', 'saída'], [
                'main.rs declara conta; essa declaração conecta o módulo à crate.',
                'conta.rs fornece saldo, uma função pública que retorna 30.',
                'main chama saldo pelo import e imprime 30.',
              ]),
            },
          ],
          exercises: [
            mcq('Com mod conta na raiz src/main.rs, qual arquivo pode definir esse módulo?', ['src/conta.rs', 'src/saldo.txt', 'target/conta.rs', 'Cargo.lock'], 0, 'O caminho convencional é src/conta.rs; src/conta/mod.rs também é uma alternativa válida.'),
            tf('Basta criar src/conta.rs para que o módulo entre automaticamente na crate.', false, 'É preciso conectar o módulo à árvore, por exemplo com mod conta na raiz.'),
            num('Com o arquivo conta.rs do card, qual número este main imprime?', 30, 'mod carrega a definição e use encurta o caminho para saldo, que retorna 30.', { visual: code(mainArquivo, [4], 'src/main.rs') }),
            match('Associe os arquivos ao papel neste projeto:', [['src/main.rs', 'raiz binária com main'], ['src/conta.rs', 'definição do módulo conta'], ['Cargo.toml', 'manifesto do pacote']], 'A raiz declara o módulo, o arquivo do módulo define seus itens e o manifesto configura o pacote.'),
            mcq('O projeto só tem este main; faltam ambos os arquivos convencionais de conta. O que ocorre?', ['E0583: arquivo do módulo ausente', 'Compila e cria conta.rs', 'E0603: campo privado', 'Compila e ignora mod'], 0, 'E0583: file not found for module `conta`. Crie src/conta.rs ou src/conta/mod.rs com o conteúdo do módulo; use não cria arquivos.', { visual: code('mod conta;\nfn main() {}', [1], 'src/main.rs — erro intencional') }),
            gen((rng) => {
              const saldo = randInt(rng, 2, 9) * 10;
              return num('Este src/conta.rs é usado pelo main do card. Qual número aparece?', saldo, `main imprime o retorno de saldo. Nesta variante o retorno é ${saldo}.`, {
                visual: code(`pub fn saldo() -> i32 {\n    ${saldo}\n}`, [2], 'src/conta.rs — main igual ao card'),
              });
            }),
            order('Organize o trabalho para extrair o módulo, sem duplicar sua definição:', ['Escolher o módulo inline existente', 'Mover seu corpo para src/conta.rs', 'Substituir o bloco por mod conta;', 'Executar cargo check'], 'A extração conserva o corpo no arquivo filho e deixa uma única declaração na raiz; cargo check verifica o resultado.'),
            {
              ...codePuzzle('Com conta.rs do card retornando 30, monte main.rs para imprimir 35. A declaração já foi fornecida.', [
                'fn main() {',
                '    let n = crate::conta::saldo();',
                '    let finalizado = n + 5;',
                '    println!("{finalizado}");',
                '}',
              ], ['    let n = conta.saldo();', '    let finalizado = n + 5'], 'A declaração conecta o arquivo. O caminho retorna 30, a soma produz 35 e println mostra o resultado. O ponto não separa módulos.'),
              visual: code('mod conta;', [], 'Preâmbulo de src/main.rs'),
            },
          ],
        },
        {
          card: [
            { title: 'Pacote, biblioteca e executável', body: 'Um pacote possui Cargo.toml, pode ter várias crates binárias e no máximo uma crate de biblioteca. Com src/lib.rs e src/main.rs há duas crates no mesmo pacote. A biblioteca oferece código reutilizável; a binária tem main. Para um pacote chamado banco, o main abaixo usa a biblioteca pelo nome banco, e imprime 30.', visual: code(mainBiblioteca, [1], 'src/main.rs — pacote banco') },
            { title: 'A raiz da biblioteca', body: 'Use a função saldo de src/conta.rs do card anterior. A biblioteca precisa publicar conta para que sua crate binária irmã o alcance. No main, crate:: aponta para a raiz binária, não para lib.rs.', visual: code(libArquivo, [1], 'src/lib.rs — pacote banco') },
            { title: 'Um módulo com submódulos', body: 'Se src/conta.rs declara um submódulo taxas, sua definição convencional fica em src/conta/taxas.rs (ou src/conta/taxas/mod.rs). Se conta usa a forma src/conta/mod.rs, taxas continua nessa mesma pasta conta. Criar pastas organiza os arquivos; mod conecta a árvore.', visual: code('pub mod taxas;', [1], 'src/conta.rs — exemplo alternativo') },
            { title: 'Veja as fronteiras', body: 'Mesmo no mesmo pacote, main e lib são crates diferentes. Um item pub(crate) na biblioteca não pode ser chamado pela binária irmã.', visual: table(['Arquivo', 'Pertence a'], [['src/main.rs', 'crate binária banco'], ['src/lib.rs', 'crate biblioteca banco'], ['src/conta.rs via lib', 'biblioteca, módulo conta'], ['src/conta/taxas.rs', 'biblioteca, conta::taxas']]) },
            {
              title: 'No seu computador', body: 'Continue a Conta do dia 15: crie banco com Cargo. Extraia Conta para src/conta.rs; publique o módulo em lib.rs e importe o tipo no main pelo nome da biblioteca. Preserve saldo privado, publique apenas o construtor e as operações. Depois mova conta.rs para conta/mod.rs, removendo o original. Pronto: as duas organizações imprimem 70 após depósito de 100 e saque de 30; fmt e clippy passam. Não declare o mesmo módulo também no main.',
              visual: code('cargo new banco --edition 2024\ncd banco\ncargo check\ncargo run\ncargo fmt\ncargo clippy -- -D warnings', [], 'Terminal — após criar lib.rs e conta.rs'),
            },
          ],
          exercises: [
            mcq('Quantas crates convencionais há em um pacote com src/lib.rs e src/main.rs?', ['Duas: biblioteca e binária', 'Uma: ambos são módulos de main', 'Três: Cargo.toml também é crate', 'Nenhuma até publicar'], 0, 'lib.rs é a raiz da biblioteca e main.rs é a raiz binária: duas unidades compiladas no mesmo pacote.'),
            tf('A crate binária pode acessar um item pub(crate) da biblioteca irmã por estarem no mesmo pacote.', false, 'pub(crate) restringe à unidade compilada, não ao pacote. A binária consome a API pública da biblioteca.'),
            mcq('Neste main do pacote banco, qual caminho chama a biblioteca?', ['banco::conta::saldo', 'crate::conta::saldo', 'super::main::saldo', 'std::conta::saldo'], 0, 'O import começa pelo nome da biblioteca. crate:: começaria na raiz da própria crate binária.', { visual: code(mainBiblioteca, [1], 'src/main.rs') }),
            match('Associe cada declaração ao arquivo filho na organização sem mod.rs:', [['mod conta; em src/lib.rs', 'src/conta.rs'], ['mod taxas; em src/conta.rs', 'src/conta/taxas.rs'], ['mod moeda; em src/conta/taxas.rs', 'src/conta/taxas/moeda.rs']], 'Cada módulo acrescenta seu nome ao caminho dos próprios submódulos; o arquivo é conectado pela declaração no pai.'),
            mcq('Qual alternativa pode substituir src/conta.rs, sem manter o original?', ['src/conta/mod.rs', 'src/mod/conta.txt', 'target/conta/mod.rs', 'src/conta/main.toml'], 0, 'A forma conta/mod.rs define o mesmo módulo. Não mantenha simultaneamente conta.rs e conta/mod.rs.'),
            gen((rng) => {
              const n = randInt(rng, 2, 8);
              return num('Um pacote possui uma biblioteca e a quantidade sorteada de crates binárias abaixo. Quantas crates são compiladas, sem contar dependências?', n + 1, `Uma biblioteca mais ${n} binárias totalizam ${n + 1} crates. Módulos não acrescentam crates.`, {
                visual: table(['Alvo', 'Quantidade'], [['Biblioteca', 1], ['Binárias', n]]),
              });
            }),
            multi('Ao levar Conta para uma biblioteca usada pelo main, quais escolhas preservam o encapsulamento?', ['Publicar o tipo e os métodos necessários', 'Manter o campo saldo privado', 'Tornar todos os campos públicos', 'Trocar pub por use em lib.rs'], [0, 1], 'A API expõe operações e preserva os dados internos. use não substitui visibilidade pública; saldo privado evita alterações arbitrárias.'),
            {
              ...codePuzzle('A biblioteca banco oferece conta::saldo retornando 30. Monte main para imprimir 20 após uma taxa local.', [
                'fn main() {',
                '    let saldo = banco::conta::saldo();',
                '    let liquido = saldo - 10;',
                '    println!("{liquido}");',
                '}',
              ], ['    let saldo = crate::conta::saldo();', '    let liquido = saldo - 10'], 'O nome banco acessa a biblioteca. Dentro da binária, crate:: não acessaria sua irmã. A função retorna 30; subtraindo 10, imprimimos 20.'),
              visual: code(libArquivo, [], 'src/lib.rs — conta.rs igual ao card'),
            },
          ],
        },
      ],
    },
    {
      id: 'rp-mod-cargo', title: 'Cargo.toml, dependências e features', parts: [
        {
          card: [
            {
              title: 'O manifesto é a receita',
              body: 'Cargo.toml descreve o pacote e seus requisitos. A versão em package é a do seu projeto; edition escolhe as regras da linguagem, não a versão do compilador. dependencies lista bibliotecas externas. Este manifesto adiciona serde com requisito 1.0. Você também pode pedir ao Cargo que escreva essa dependência com cargo add.',
              visual: code(manifesto, [4, 7, 8], 'Cargo.toml — projeto medidor'),
            },
            {
              title: 'Requisito não é versão exata',
              body: 'Sem operador, o requisito usa a regra caret: 1.2.3 admite versões desde 1.2.3 até antes de 2.0.0. Antes de 1.0, o primeiro componente diferente de zero limita a compatibilidade: 0.2.3 admite versões até antes de 0.3.0. Cargo.lock registra as versões exatas resolvidas, inclusive dependências indiretas. Não edite o lockfile à mão; mantenha-o no controle de versão da aplicação. cargo build usa a resolução existente; cargo update tenta atualizá-la dentro dos requisitos.',
              visual: table(['Requisito', 'Faixa admitida'], [['1.2.3', '≥ 1.2.3 e < 2.0.0'], ['0.2.3', '≥ 0.2.3 e < 0.3.0'], ['=1.2.3', 'somente 1.2.3']]),
            },
            {
              title: 'Siga a dependência',
              body: 'Avance para distinguir o que você pede do que Cargo escolhe e compila. Em uma nova resolução, a versão escolhida ainda deve satisfazer o requisito e as demais restrições do projeto.',
              visual: percurso(['toml', 'lock', 'build'], [
                'Cargo.toml: o projeto pede serde compatível com 1.0.',
                'Cargo.lock: Cargo registra uma versão exata e as dependências indiretas.',
                'Build: Cargo compila usando essa resolução; --locked exige que o lockfile não mude.',
              ]),
            },
            { title: 'Adicionar com intenção', body: 'Este comando equivale a declarar serde com requisito 1.0 em dependencies. O acesso ao registro exige rede quando os dados e as crates ainda não estão no cache. O comando não cria módulos no seu código.', visual: code('cargo add serde@1.0', [], 'Terminal — dentro de medidor') },
          ],
          exercises: [
            mcq('Qual arquivo você edita para declarar uma dependência?', ['Cargo.toml', 'Cargo.lock', 'target/debug', 'src/main.lock'], 0, 'O manifesto Cargo.toml declara requisitos; Cargo mantém o lockfile com a resolução exata.'),
            mcq('O que edition escolhe no manifesto?', ['As regras da edição Rust 2024', 'A versão exata de serde', 'O número do release do projeto', 'O sistema operacional alvo'], 0, 'edition seleciona uma edição da linguagem. Não fixa a toolchain nem a versão da biblioteca.', { visual: code(manifesto, [4], 'Cargo.toml') }),
            tf('O requisito 1.2.3 sem operador obriga Cargo a usar exatamente a versão 1.2.3.', false, 'Sem operador, é um requisito caret: permite versões compatíveis a partir de 1.2.3 e abaixo de 2.0.0.'),
            multi('Para o requisito 1.2.3, quais versões estáveis satisfazem a faixa, consideradas isoladamente?', ['1.2.3', '1.9.0', '2.0.0', '1.2.2'], [0, 1], 'O limite inferior é 1.2.3 inclusive, e o superior é 2.0.0 exclusivo. A seleção real ainda depende das outras restrições do projeto.'),
            match('Associe cada elemento ao seu papel:', [['Cargo.toml', 'requisitos declarados'], ['Cargo.lock', 'resolução exata gerada'], ['cargo update', 'tentar renovar a resolução']], 'O manifesto define o que pode entrar; o lockfile registra o que entrou; update tenta escolher versões novas permitidas.'),
            gen((rng) => {
              const patch = randInt(rng, 1, 8);
              return mcq(`Para a dependência hipotética abaixo, qual versão satisfaz o requisito? Considere só a faixa, sem pré-releases.`,
                [`1.2.${patch + 1}`, '2.0.0', `1.2.${patch - 1}`, '0.9.0'], 0,
                `O requisito 1.2.${patch} permite versões desde 1.2.${patch} até antes de 2.0.0; portanto 1.2.${patch + 1} satisfaz a faixa. As outras estão fora dela.`,
                { visual: code(`[dependencies]\nmedidas = "1.2.${patch}"`, [], 'Cargo.toml — crate hipotética') });
            }),
            mcq('Qual versão satisfaz o requisito 0.2.3?', ['0.2.9', '0.3.0', '1.0.0', '0.2.2'], 0, 'No caso 0.2.3, Cargo permite versões desde 0.2.3 até antes de 0.3.0; 0.2.9 pertence a essa faixa.'),
            {
              ...codePuzzle('O manifesto mostrado define a versão 0.1.0. Cargo fornece CARGO_PKG_VERSION durante o build. Monte main para imprimir v0.1.0 com cargo run.', [
                'fn main() {',
                '    let v = env!("CARGO_PKG_VERSION");',
                '    let rotulo = format!("v{v}");',
                '    println!("{rotulo}");',
                '}',
              ], ['    let v = "1.0";', '    let rotulo = format!("{v}");'], 'env! lê uma variável de ambiente na compilação. Cargo fornece a versão do próprio pacote: 0.1.0. format! acrescenta o prefixo v e println imprime v0.1.0. O requisito 1.0 de serde não é a versão de medidor.'),
              visual: code(manifesto, [3, 8], 'Cargo.toml — execute pelo Cargo'),
            },
          ],
        },
        {
          card: [
            {
              title: 'Features mudam o build',
              body: 'Acrescente esta seção ao manifesto de medidor. Features são opções de compilação declaradas pelo pacote. relatorio não ativa nada extra por si só: nosso código vai consultar se ela foi habilitada. O default vazio mantém essa feature desligada. Na dependência serde, a feature derive habilita macros de derivação; ela é uma opção da biblioteca, diferente da nossa feature local.',
              visual: code(features, [2, 3], 'Acrescente ao Cargo.toml'),
            },
            {
              title: 'Observe a opção no programa',
              body: 'cfg! produz um booleano conhecido na compilação; os dois ramos de um if comum continuam sujeitos à checagem de tipos. Sem a opção de features, este main imprime false; com relatorio, imprime true. Para excluir um item inteiro da compilação, use o atributo cfg com a condição apropriada.',
              visual: code(comFeature, [3], 'src/main.rs — manifesto com relatorio'),
            },
            {
              title: 'Habilitar features de uma dependência',
              body: 'A forma expandida abaixo substitui a linha simples de serde do manifesto. Habilita derive e mantém as features padrão de serde. Para adicioná-la pelo terminal, use o comando no card de perfis.',
              visual: code('[dependencies.serde]\nversion = "1.0"\nfeatures = ["derive"]', [3], 'Cargo.toml — substitui serde = "1.0"'),
            },
            {
              title: 'Uma feature fornece código útil',
              body: 'Com serde e derive configurados como acima, a macro gera a implementação de Serialize para Leitura. Este programa imprime 7 lendo o campo; ele ainda não converte a leitura para JSON. A derivação prepara o tipo para serialização, assunto do desafio do dia 42.',
              visual: code('#[derive(serde::Serialize)]\nstruct Leitura {\n    valor: i32,\n}\nfn main() {\n    let leitura = Leitura { valor: 7 };\n    println!("{}", leitura.valor);\n}', [1], 'src/main.rs — exemplo alternativo'),
            },
            {
              title: 'Perfis dev e release',
              body: 'cargo build e cargo run usam dev, com pouca otimização para desenvolvimento. --release escolhe release, otimizado por padrão. Os artefatos normalmente ficam em target/debug e target/release. É possível ajustar opções em profile.dev e profile.release no manifesto; release não garante um arquivo menor em todo projeto.',
              visual: code('cargo add serde@1.0 --features derive\ncargo run\ncargo run --features relatorio\ncargo build --release', [], 'Terminal — projeto medidor'),
            },
            {
              title: 'No seu computador',
              body: 'Retome o dia 1 e a preparação do dia 42: crie medidor com edição 2024; adicione serde com derive e confira a tabela expandida do card. Defina relatorio e use o main do card. Pronto quando cargo run imprimir false e cargo run com relatorio imprimir true; compare os tamanhos dos executáveis dev e release sem pressupor qual será menor. Registre as versões escolhidas no Cargo.lock. Formatação e clippy devem passar também com a feature ativa.',
              visual: code('cargo new medidor --edition 2024\ncd medidor\ncargo add serde@1.0 --features derive\ncargo run --features relatorio\ncargo build --release\ncargo fmt\n# Ative relatorio também no clippy.\ncargo clippy --features relatorio -- \\\n    -D warnings', [], 'Terminal Bash — após implementar os cards'),
            },
          ],
          exercises: [
            mcq('Em qual momento uma feature de Cargo é selecionada?', ['Na compilação', 'Ao digitar no programa já em execução', 'Somente depois de publicar', 'Ao criar uma variável mut'], 0, 'A seleção de features faz parte do build; ela não funciona como entrada interativa do programa.'),
            tf('cargo build usa release por padrão.', false, 'O build comum usa dev. Para escolher release, acrescente --release.'),
            mcq('Com o manifesto do card e sem --features, qual saída vem deste main?', ['false', 'true', 'relatorio', '0'], 0, 'default está vazio e relatorio não foi habilitada. cfg! devolve false, que é o booleano impresso.', { visual: code(comFeature, [2, 3], 'src/main.rs') }),
            match('Associe comando e consequência:', [['cargo run --features relatorio', 'habilita a feature local e executa'], ['cargo build --release', 'compila com perfil release'], ['cargo doc --no-deps', 'gera documentação do pacote sem dependências']], 'Features, perfis e documentação são dimensões distintas: opção do pacote, configuração de build e saída HTML.'),
            fill('Complete o nome da feature de serde que fornece macros de derivação:', '___', ['derive'], ['relatorio', 'release'], 'derive é a feature de serde que habilita as macros de derivação. relatorio foi definida pelo nosso pacote; release é um perfil.'),
            gen((rng) => {
              const n = randInt(rng, 3, 20);
              const ligado = randInt(rng, 0, 1) === 1;
              return num(`Com relatorio ${ligado ? 'habilitada' : 'desabilitada'}, qual número sai?`, ligado ? n + 2 : n,
                `cfg! vale ${ligado ? 'true' : 'false'}; extra recebe ${ligado ? 2 : 0}. A saída é ${n} + ${ligado ? 2 : 0} = ${ligado ? n + 2 : n}.`, {
                  visual: code(`fn main() {\n    let on =\n        cfg!(feature = "relatorio");\n    let extra = if on { 2 } else { 0 };\n    println!("{}", ${n} + extra);\n}`, [3, 4], 'src/main.rs — manifesto com relatorio'),
                });
            }),
            mcq('Você quer desligar as features padrão do pacote medidor para um build. Qual opção de Cargo atende?', ['--no-default-features', '--release', '--locked', '--no-deps'], 0, 'A opção --no-default-features desliga a feature default do pacote selecionado. Ela não garante desligar defaults de dependências ativados por outros caminhos.'),
            {
              ...codePuzzle('No projeto com relatorio habilitada, monte main para imprimir 7.', [
                'fn main() {',
                '    let on =',
                '        cfg!(feature = "relatorio");',
                '    let n = if on { 7 } else { 3 };',
                '    println!("{n}");',
                '}',
              ], ['        cfg!(feature = "release");', '    let n = if on { 3 } else { 7 };'], 'A expressão cfg! conclui a atribuição de on. Com relatorio habilitada, on é true e o primeiro ramo escolhe 7. release é perfil, não esta feature.'),
              visual: code('cargo run --features relatorio', [], 'Comando usado com o manifesto do card'),
            },
          ],
        },
      ],
    },
    {
      id: 'rp-mod-ws', title: 'Workspaces, crates.io e documentação', parts: [
        {
          card: [
            {
              title: 'Um repositório, vários pacotes',
              body: 'Um workspace reúne pacotes que evoluem juntos. Este manifesto virtual fica na raiz banco e não tem package. Seus membros usam edição 2024 nos próprios manifestos; resolver 3 é explícito na raiz virtual. O workspace compartilha Cargo.lock e target. Pertencer ao mesmo workspace não cria dependências entre membros.',
              visual: code(workspace, [2, 3], 'banco/Cargo.toml — raiz virtual'),
            },
            {
              title: 'A seta é uma dependência explícita',
              body: 'banco-cli depende de banco-core por caminho relativo ao manifesto de banco-cli. O Cargo usa o nome com hífen no manifesto; no código Rust, a biblioteca aparece como banco_core. Esta é uma dependência local, sem exigir publicação no registro.',
              visual: code(dependenciaLocal, [2], 'banco/banco-cli/Cargo.toml — acrescente'),
            },
            { title: 'Biblioteca do core', body: 'A função pública retorna 100. O core concentra regras reutilizáveis e não precisa conhecer a interface da aplicação.', visual: code(core, [1], 'banco/banco-core/src/lib.rs') },
            { title: 'A aplicação chama a biblioteca', body: 'Com a dependência declarada, o CLI importa saldo e imprime 100. Execute a partir da raiz com cargo run -p banco-cli.', visual: code(cli, [1, 3], 'banco/banco-cli/src/main.rs') },
            {
              title: 'Percorra a fronteira entre crates',
              body: 'Avance do chamador ao resultado. O caminho de dependência liga os pacotes; a visibilidade pública permite a chamada entre suas crates.',
              visual: percurso(['CLI', 'core', 'saída'], [
                'CLI: seu manifesto declara banco-core com path relativo.',
                'Core: a biblioteca exporta saldo; pub(crate) seria insuficiente aqui.',
                'Saída: o CLI recebe 100 e o imprime. Cargo.lock e target ficam na raiz do workspace.',
              ]),
            },
          ],
          exercises: [
            mcq('O que os membros de um workspace compartilham por padrão?', ['Cargo.lock e diretório target', 'Uma única função main obrigatória', 'Todas as funções privadas', 'O mesmo src/main.rs'], 0, 'Os pacotes continuam separados, mas usam um lockfile e um diretório de artefatos na raiz do workspace.'),
            tf('Colocar dois pacotes em members faz um depender automaticamente do outro.', false, 'members descreve participação. A relação de dependência ainda precisa ser declarada em dependencies.'),
            num('Qual número o CLI imprime ao usar o core do card?', 100, 'banco_core::saldo retorna 100 e println mostra esse valor.', { visual: code(cli, [4], 'banco-cli/src/main.rs') }),
            match('Associe a grafia ao lugar em que é usada:', [['banco-core', 'nome do pacote em Cargo.toml'], ['banco_core::saldo', 'caminho da biblioteca no código Rust'], ['../banco-core', 'caminho relativo no manifesto do CLI']], 'O hífen do nome do pacote vira sublinhado no identificador da biblioteca; path se resolve a partir da pasta do manifesto que o declara.'),
            mcq('Por que saldo precisa ser pub no core?', ['O CLI chama a função de outra crate', 'pub aloca memória automaticamente', 'pub remove a necessidade de dependencies', 'Toda função Rust exige pub'], 0, 'Cada pacote tem sua crate. Uma função pub(crate) no core não atravessa a fronteira até a crate do CLI.'),
            gen((rng) => {
              const n = randInt(rng, 2, 9) * 25;
              return num('O CLI do card usa esta nova versão do core. Qual número imprime?', n, `O CLI chama saldo e imprime o retorno. Nesta variante saldo retorna ${n}.`, {
                visual: code(`pub fn saldo() -> i32 {\n    ${n}\n}`, [2], 'banco-core/src/lib.rs'),
              });
            }),
            mcq('Estando na raiz virtual, como executar somente o pacote banco-cli?', ['cargo run -p banco-cli', 'cargo run banco-core', 'cargo doc --open', 'cargo build --lib'], 0, '-p seleciona o pacote. cargo run -p banco-cli executa o binário desse pacote; build --lib apenas compila uma biblioteca.'),
            {
              ...codePuzzle('A dependência local já está declarada e saldo retorna 100. Monte o main do CLI para imprimir 70.', [
                'fn main() {',
                '    let saldo = banco_core::saldo();',
                '    let finalizado = saldo - 30;',
                '    println!("{finalizado}");',
                '}',
              ], ['    let saldo = banco-core::saldo();', '    let saldo = crate::saldo();'], 'O identificador da biblioteca usa sublinhado. O core fornece 100; o CLI subtrai 30 e imprime 70. crate::saldo procuraria a função na própria binária.'),
              visual: code(dependenciaLocal, [], 'banco-cli/Cargo.toml — dependência existente'),
            },
          ],
        },
        {
          card: [
            {
              title: 'Documentação que você testa',
              body: 'Crie uma biblioteca chamada medidas para este exemplo. Comentários com três barras documentam o item seguinte. cargo doc gera HTML em target/doc; --open abre o resultado e --no-deps omite a documentação das dependências. O exemplo Rust dentro da documentação é um doctest: cargo test compila e executa a verificação de que dobro(3) vale 6.',
              visual: code(documentado, [1, 6, 8], 'medidas/src/lib.rs'),
            },
            {
              title: 'Do projeto local ao registro',
              body: 'crates.io distribui pacotes que outros projetos podem declarar como dependência; docs.rs hospeda documentação de crates publicadas. Antes de publicar, escolha um nome disponível, defina descrição e licença adequadas, revise a API e confira o conteúdo empacotado. Publicar requer conta e autenticação; não é necessário publicar para usar um workspace local.',
              visual: code('cargo test\ncargo doc --no-deps --open\ncargo package --list\ncargo publish --dry-run', [], 'Terminal — preparação de uma biblioteca'),
            },
            {
              title: 'Documentar e publicar são ações diferentes',
              body: 'O dry-run verifica a preparação sem enviar a versão. cargo publish efetua o envio autenticado. Uma versão publicada não pode ser sobrescrita: correções exigem uma versão nova; yanking impede novas seleções normais daquela versão, mas preserva downloads usados por lockfiles existentes. Mantenha o número da versão coerente com as mudanças na API.',
              visual: table(['Ação', 'Resultado'], [['cargo doc', 'HTML local'], ['cargo test', 'testes e doctests'], ['publish --dry-run', 'preparação sem envio'], ['cargo publish', 'envio de nova versão']]),
            },
            {
              title: 'No seu computador',
              body: 'Preparação do projeto do dia 48: crie banco com workspace virtual, banco-core biblioteca e banco-cli binário. Declare a dependência local como nos cards; use edição 2024 nos dois pacotes. Leve a Conta da lição anterior ao core, com saldo privado e operações públicas. No CLI, deposite 100, saque 30 e imprima 70. Documente a operação saldo com um exemplo importando banco_core::Conta. Pronto quando o doctest, os testes do core e o clippy de todo o workspace passarem; abra a documentação. Mantenha zero unwrap fora de testes. Este desafio termina localmente, sem publicação.',
              visual: code('mkdir banco\ncd banco\n# Crie o manifesto da raiz.\ncargo new banco-core --lib\ncargo new banco-cli\n# Implemente os arquivos dos cards.\ncargo run -p banco-cli\ncargo test --workspace\ncargo fmt --all\ncargo clippy --workspace -- -D warnings\ncargo doc --workspace --no-deps --open', [], 'Terminal — confira edition 2024 nos membros'),
            },
          ],
          exercises: [
            mcq('Qual comentário documenta o item que vem logo depois?', ['///', '//', '/* comentário comum */', '# comentário'], 0, 'Três barras introduzem documentação do item seguinte; comentários comuns não viram documentação de API.'),
            tf('cargo doc publica automaticamente sua biblioteca em crates.io.', false, 'cargo doc gera HTML local. Publicação é outra operação e requer autenticação e preparo.'),
            mcq('Qual valor a chamada dentro do doctest precisa produzir para passar?', ['6', '3', '9', '0'], 0, 'dobro multiplica 3 por 2. assert_eq verifica que o resultado é 6, e cargo test executa essa verificação.', { visual: code(documentado, [6], 'medidas/src/lib.rs') }),
            match('Associe o destino ao papel:', [['crates.io', 'registro de pacotes'], ['docs.rs', 'documentação de crates publicadas'], ['target/doc', 'HTML gerado localmente']], 'O registro distribui pacotes, docs.rs oferece sua documentação e target/doc recebe o resultado de cargo doc no projeto.'),
            mcq('Qual comando testa os exemplos Rust da documentação de uma biblioteca?', ['cargo test', 'cargo doc --open', 'cargo run --release', 'cargo package --list'], 0, 'cargo test executa os doctests além dos testes do pacote. cargo doc gera HTML, mas não substitui essa execução.'),
            gen((rng) => {
              const n = randInt(rng, 2, 16);
              return num('Qual valor deve substituir ___ para este doctest passar? A função dobro é a do card.', 2 * n, `A biblioteca medidas exporta dobro; ${n} × 2 = ${2 * n}. Esse é o valor esperado na asserção.`, {
                visual: code(`/// \`\`\`\n/// assert_eq!(medidas::dobro(${n}), ___);\n/// \`\`\`\npub fn dobro(n: i32) -> i32 {\n    n * 2\n}`, [2], 'medidas/src/lib.rs — complete o exemplo'),
              });
            }),
            mcq('Você já publicou a versão 1.0.0 e corrigiu um detalhe compatível. Como distribuir a correção?', ['Publicar uma nova versão, como 1.0.1', 'Sobrescrever 1.0.0', 'Editar Cargo.lock dos usuários', 'Rodar cargo doc nos computadores dos usuários'], 0, 'Versões publicadas não são sobrescritas. Uma correção compatível pode receber um incremento de patch; a nova publicação preserva a versão anterior.'),
            codePuzzle('Monte a função pública para medidas::dobro. Com argumento 4, ela deve retornar 8; depois adicione sua documentação.', [
              'pub fn dobro(n: i32) -> i32 {',
              '    let base = n;',
              '    let total = base * 2;',
              '    total',
              '}',
            ], ['    total;', 'fn dobro(n: i32) -> i32 {'], 'A função pública pode ser usada no doctest por outra crate. As variáveis dependem das linhas anteriores, e total sem ponto e vírgula é o retorno. Com 4, o cálculo devolve 8.'),
          ],
        },
      ],
    },
  ],
};
