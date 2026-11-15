import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { code, fill, gen, match, mcq, multi, num, order, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { randInt } from '../../../lib/random';
import { Pt } from '../../../components/plot/Plot';
import { C } from '../../../theme';

// Os controles revelam o estado do programa, sem executar Rust no app.
const trace = (states: string[]): VisualSpec => ({
  name: 'stepper',
  props: {
    steps: states.length,
    view: { xMin: -0.5, xMax: states.length - 0.5, yMin: -1, yMax: 1 },
    render: (k: number) => <Pt x={k} y={0} color={C.gold} r={7} />,
    info: (k: number) => states[k],
  },
});

const argsMain = `use std::env;

fn main() {
    let args: Vec<String> =
        env::args().collect();
    match args.get(1) {
        Some(query) => {
            println!("Busca: {query}");
        }
        None => {
            eprintln!("Falta a busca");
        }
    }
}`;

const config = `pub struct Config {
    pub query: String,
    pub file_path: String,
    pub ignore_case: bool,
}

impl Config {
    pub fn build(
        args: &[String],
    ) -> Result<Self, &'static str> {
        if args.len() != 3 {
            return Err(
                "Use: BUSCA ARQUIVO",
            );
        }
        let ignore_case = std::env::var(
            "IGNORE_CASE",
        ).is_ok();
        Ok(Self {
            query: args[1].clone(),
            file_path: args[2].clone(),
            ignore_case,
        })
    }
}`;

const readMain = `use std::fs;
use std::io;

fn main() -> io::Result<()> {
    let text =
        fs::read_to_string("a.txt")?;
    for line in text.lines() {
        if line.contains("rust") {
            println!("{line}");
        }
    }
    Ok(())
}`;

const writeMain = `use std::fs;
use std::io;

fn main() -> io::Result<()> {
    let text =
        fs::read_to_string("a.txt")?;
    let mut output = String::new();
    for line in text.lines() {
        if line.contains("rust") {
            output.push_str(line);
            output.push('\\n');
        }
    }
    fs::write("achados.txt", output)?;
    Ok(())
}`;

const search = `pub fn search<'a>(
    query: &str,
    text: &'a str,
) -> Vec<&'a str> {
    let mut found = Vec::new();
    for line in text.lines() {
        if line.contains(query) {
            found.push(line);
        }
    }
    found
}`;

const searchCi = `pub fn search_ci<'a>(
    query: &str,
    text: &'a str,
) -> Vec<&'a str> {
    let query = query.to_lowercase();
    let mut found = Vec::new();
    for line in text.lines() {
        let lower = line.to_lowercase();
        if lower.contains(&query) {
            found.push(line);
        }
    }
    found
}`;

const tests = `#[cfg(test)]
mod tests {
    use super::{search, search_ci};

    #[test]
    fn sensitive() {
        let text = "Rust\\nrust\\nC";
        assert_eq!(
            search("rust", text),
            vec!["rust"],
        );
    }

    #[test]
    fn insensitive() {
        let text = "Rust\\nrust\\nC";
        assert_eq!(
            search_ci("rUsT", text),
            vec!["Rust", "rust"],
        );
    }
}`;

const run = `use std::error::Error;
use std::fs;

pub fn run(
    config: Config,
) -> Result<(), Box<dyn Error>> {
    let text =
        fs::read_to_string(
            &config.file_path,
        )?;
    let found = if config.ignore_case {
        search_ci(&config.query, &text)
    } else {
        search(&config.query, &text)
    };
    for line in found {
        println!("{line}");
    }
    Ok(())
}`;

const finalMain = `use minigrep::{Config, run};
use std::{env, process};

fn main() {
    let args: Vec<String> =
        env::args().collect();
    let config = match Config::build(
        &args,
    ) {
        Ok(config) => config,
        Err(e) => {
            eprintln!(
                "Argumentos: {e}",
            );
            process::exit(2);
        }
    };
    if let Err(e) = run(config) {
        eprintln!("Aplicação: {e}");
        process::exit(1);
    }
}`;

const clapToml = `[dependencies.clap]
version = "4"
features = ["derive"]`;

const clapArgs = `use clap::Parser;

#[derive(Parser)]
#[command(name = "minigrep")]
struct Args {
    query: String,
    file_path: String,
    #[arg(short = 'i', long)]
    ignore_case: bool,
}`;

const clapMain = `use minigrep::{Config, run};
use std::{env, process};

fn main() {
    let args = Args::parse();
    let config = Config {
        query: args.query,
        file_path: args.file_path,
        ignore_case: args.ignore_case
            || env::var("IGNORE_CASE")
                .is_ok(),
    };
    if let Err(e) = run(config) {
        eprintln!("Aplicação: {e}");
        process::exit(1);
    }
}`;

const serdeToml = `[dependencies.serde]
version = "1"
features = ["derive"]

[dependencies.serde_json]
version = "1"`;

const report = `use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Report {
    pub matches: Vec<String>,
}`;

const jsonRun = `use std::error::Error;
use std::fs;

pub fn run(
    config: Config,
) -> Result<(), Box<dyn Error>> {
    let text = fs::read_to_string(
        &config.file_path,
    )?;
    let found = if config.ignore_case {
        search_ci(&config.query, &text)
    } else {
        search(&config.query, &text)
    };
    if config.json {
        let report = Report {
            matches: found.into_iter()
                .map(str::to_owned)
                .collect(),
        };
        let json =
            serde_json::to_string(
                &report,
            )?;
        println!("{json}");
    } else {
        for line in found {
            println!("{line}");
        }
    }
    Ok(())
}`;

export const rustCli: UnitDef = {
  id: 'rp-cli',
  title: 'Projeto: ferramenta de linha de comando',
  icon: '⌨️',
  subtitle: 'Construa um minigrep: terminal, arquivos, testes e JSON',
  source: 'The Rust Programming Language, edição 2024, cap. 12 (https://doc.rust-lang.org/book/ch12-00-an-io-project.html); std (https://doc.rust-lang.org/std/); clap derive (https://docs.rs/clap/latest/clap/_derive/_tutorial/); Serde (https://serde.rs/derive.html). Desafio 50 Dias — Rust: itens 25, 28, 42 e Projeto 1.',
  extra: true,
  guide: 'O projeto chama-se `minigrep`, com edição 2024. Comece coletando argumentos, valide sua quantidade e monte uma configuração dona das strings. Leia o arquivo como UTF-8; percorra linhas e devolva as que contêm a busca. A busca simples distingue maiúsculas; a alternativa normaliza cópias para comparar e devolve as linhas originais. Leia `IGNORE_CASE` no ambiente, sem modificá-lo no programa. Separe a lógica testável na biblioteca e a interface no binário. Propague falhas com `Result` e `?`; envie dados para stdout, diagnósticos para stderr. Neste projeto, sucesso (até sem resultados) sai com 0, erro de execução com 1 e argumentos inválidos com 2. Depois substitua o parser manual por clap com derive; serialize um relatório com serde e serde_json. O app não executa Rust: os exemplos completos, os testes e os desafios são para rodar com Cargo no computador.',
  lessons: [
    {
      id: 'rp-cli-args', title: 'Argumentos e variáveis de ambiente', parts: [
        {
          card: [
            {
              title: 'Primeiro passo: receber a busca',
              body: 'Crie `minigrep` com Cargo. No terminal, o separador de dois hífens entrega os argumentos seguintes ao programa. `std::env::args` produz strings; `collect` reúne todas em um vetor. O elemento 0 costuma identificar o executável; o primeiro argumento do usuário está em 1. Use `get` para tratar a ausência sem panic. Nesta primeira versão só mostramos a busca; acrescentaremos o caminho logo depois.',
              visual: code(argsMain, [4, 5, 6], 'src/main.rs — versão inicial'),
              tip: 'Assumimos argumentos Unicode válidos. Para caminhos que não sejam Unicode, a biblioteca padrão oferece `args_os`; isso fica fora deste projeto.',
            },
            {
              title: 'Veja os argumentos chegarem',
              body: 'Avance para acompanhar uma execução com busca rust e arquivo dados.txt. Os dois hífens são consumidos pelo Cargo.',
              visual: trace([
                'Terminal → Cargo → minigrep. O Cargo separa suas opções dos argumentos da aplicação.',
                'Vetor: índice 0 = executável; índice 1 = rust; índice 2 = dados.txt. Comprimento: 3.',
                'get(1) devolve Some com um empréstimo da string rust; o vetor continua dono dela.',
                'stdout recebe Busca: rust e uma quebra de linha.',
              ]),
            },
          ],
          exercises: [
            mcq('Na execução mostrada, qual argumento é a busca?', ['rust', 'dados.txt', '--', 'run'], 0, 'O Cargo consome run e o separador. A aplicação recebe seu nome, a busca rust e o caminho dados.txt.', { visual: code('cargo run -- rust dados.txt', [], 'Terminal') }),
            num('Quantos elementos são coletados nessa execução usual?', 3, 'São o identificador do executável mais os dois argumentos do usuário: três elementos.', { visual: code('cargo run -- motor dados.txt', [], 'Terminal') }),
            tf('Acessar um índice ausente com get devolve None.', true, 'get retorna Option com um empréstimo. None permite mostrar uma mensagem; indexar diretamente poderia causar panic.'),
            match('Associe cada etapa à sua função:', [['args', 'produzir os argumentos'], ['collect', 'reunir em uma coleção'], ['get', 'consultar sem indexação que causa panic']], 'args cria o iterador, collect o consome formando o vetor e get consulta um elemento por índice.'),
            gen((rng) => {
              const n = randInt(rng, 1, 5);
              const values = ['"minigrep"', ...Array.from({ length: n }, (_, i) => `"arg${i + 1}"`)];
              return num('Este vetor simula os argumentos coletados. Que comprimento é impresso?', n + 1, `Há o nome do executável e ${n} argumentos do usuário: ${n + 1} elementos.`, { visual: code(`fn main() {
    let args = vec![
${values.map((v) => `        ${v},`).join('\n')}
    ];
    println!("{}", args.len());
}`, [], 'Simulação sem depender do terminal') });
            }),
            mcq('Sem argumento do usuário, qual é o comportamento da versão inicial?', ['escreve Falta a busca em stderr', 'imprime um índice', 'gera E0308', 'sempre entra em Some'], 0, 'O vetor usual só tem o executável. get(1) devolve None e o ramo correspondente chama eprintln. Isso é um caso de execução, não um erro de compilação.', { visual: code(argsMain, [10, 11], 'Sem busca') }),
            fill('Qual operação reúne os argumentos no vetor?', 'Depois de obter o iterador, use ___.', ['collect'], ['contains', 'lines', 'exit'], 'collect consome os elementos do iterador e constrói a coleção indicada pelo tipo Vec<String>.'),
            codePuzzle('Monte o programa que ignora o executável e mostra a quantidade de argumentos do usuário. Mantenha o iterador antes do vetor.', [
              'fn main() {',
              '    let iter = std::env::args();',
              '    let user = iter.skip(1);',
              '    let args: Vec<_> = user.collect();',
              '    println!("{}", args.len());',
              '}',
            ], ['    let user = iter.skip(0);', '    let args: Vec<_> = user;', '    println!("{}", args);'], 'args produz o iterador. skip(1) retira o primeiro item; collect cria o vetor antes de len ser usado. A ordem segue as dependências dos nomes.'),
          ],
        },
        {
          card: [
            {
              title: 'Configuração válida antes da busca',
              body: 'Exija exatamente três elementos: executável, busca e arquivo. `Config::build` recebe o vetor emprestado, valida a quantidade e clona somente as duas strings necessárias. `Result` distingue uma configuração válida de uma instrução de uso. Coloque esta definição acima de main. Na lição de erros ligaremos os dois com tratamento explícito.',
              visual: code(config, [11, 12, 20, 21, 22], 'Config e seu construtor'),
            },
            {
              title: 'Ambiente escolhe o modo',
              body: '`env::var` lê o ambiente durante a execução. Aqui qualquer valor Unicode presente em `IGNORE_CASE` ativa o modo, inclusive vazio e 0; não estamos interpretando um booleano. Ausência ou valor não Unicode desativa. Apenas lemos a variável; ajuste-a no terminal, sem chamar set_var dentro de Rust.',
              visual: table(['Ambiente', 'is_ok', 'Modo'], [
                ['ausente', 'false', 'distingue caixa'],
                ['IGNORE_CASE=1', 'true', 'ignora caixa'],
                ['IGNORE_CASE=0', 'true', 'ignora caixa'],
                ['IGNORE_CASE vazio', 'true', 'ignora caixa'],
              ]),
            },
            {
              title: 'No seu computador',
              body: 'Projeto 1 do roteiro: crie o pacote e use edição 2024. Adicione Config e teste build com vetores de 1, 3 e 4 itens; apenas o de 3 deve produzir Ok. Rode o programa inicial com e sem busca. Pronto quando a busca aparecer no caso válido, a ausência produzir a mensagem, cargo test passar e cargo clippy -- -D warnings não apontar avisos. No Bash, compare IGNORE_CASE ausente e presente em novas execuções; no PowerShell configure pelo ambiente do shell.',
              visual: code('cargo new minigrep --edition 2024\ncd minigrep\ncargo run -- rust dados.txt\nIGNORE_CASE=1 cargo run -- RUST a.txt\ncargo test\ncargo fmt\ncargo clippy -- -D warnings', [], 'Terminal — linha de ambiente em Bash'),
            },
          ],
          exercises: [
            mcq('Por que validar a quantidade antes de acessar os índices?', ['para não acessar um índice inexistente', 'para converter o arquivo em UTF-8', 'para ordenar o vetor', 'para remover o executável do disco'], 0, 'Com tamanho exatamente 3, os índices 1 e 2 existem. A validação deve acontecer antes desses acessos.', { visual: code(config, [11, 12, 20, 21, 22], 'Construtor') }),
            tf('Com IGNORE_CASE igual à string 0, is_ok retorna false.', false, 'O resultado é Ok contendo a string 0, por isso is_ok é true. Essa convenção verifica presença Unicode, não o conteúdo do valor.'),
            match('Associe resultado e significado:', [['Ok(Config)', 'configuração pronta'], ['Err com instrução de uso', 'quantidade inválida'], ['clone das strings', 'dados próprios sem consumir o vetor']], 'O Result separa sucesso de erro. clone cria strings da configuração, enquanto args continua disponível ao chamador.'),
            gen((rng) => {
              const n = randInt(rng, 1, 5);
              return mcq('Este é o início do construtor. O que ele faz com esse tamanho?', [n === 3 ? 'continua a construção' : 'retorna Err', n === 3 ? 'retorna Err' : 'continua a construção', 'remove o último item', 'sempre causa panic'], 0, `A condição compara ${n} com 3. ${n === 3 ? 'São iguais: o if não executa e a construção continua.' : 'São diferentes: a função devolve Err antes de indexar.'}`, { visual: code(`let size = ${n};
if size != 3 {
    return Err("Use: BUSCA ARQUIVO");
}`, [], 'Trecho de Config::build') });
            }),
            multi('Quais estados ativam nossa convenção de ignorar caixa? Considere valores Unicode.', ['variável com valor 1', 'variável com valor 0', 'variável ausente', 'variável com valor vazio'], [0, 1, 3], 'var retorna Ok para qualquer valor Unicode presente, mesmo vazio. Somente o caso ausente listado retorna Err.'),
            mcq('Este trecho compila? Qual é a correção?', ['não: E0308; extrair ou testar o Result', 'sim: var já devolve bool', 'não: E0382; clonar o nome', 'sim: String vira bool automaticamente'], 0, 'E0308: mismatched types. O compilador espera bool e encontra Result<String, VarError>. Aqui corrija aplicando is_ok ao resultado.', { visual: code('fn main() {\n    let enabled: bool =\n        std::env::var("IGNORE_CASE");\n    println!("{enabled}");\n}', [2, 3], 'Erro intencional') }),
            order('Ordene a construção segura da configuração:', ['receber a slice de argumentos', 'conferir o tamanho', 'copiar busca e caminho válidos', 'devolver Ok com os campos'], 'Primeiro vem a entrada, depois a validação que protege os índices, a cópia dos dados e a construção do resultado de sucesso.'),
            codePuzzle('Monte uma leitura do ambiente que decide o rótulo do modo, sem alterar o ambiente.', [
              'fn main() {',
              '    let raw =\n        std::env::var("IGNORE_CASE");',
              '    let ignore = raw.is_ok();',
              '    let label = if ignore {\n        "livre"\n    } else {\n        "exata"\n    };',
              '    println!("{label}");',
              '}',
            ], ['    let ignore: bool = raw;', '    let ignore = raw.is_err();'], 'Leia a variável, converta Result em bool com is_ok, escolha o rótulo e imprima. Ausência dá exata e presença Unicode dá livre; o programa não modifica o ambiente.'),
          ],
        },
      ],
    },
    {
      id: 'rp-cli-arq', title: 'Lendo e escrevendo arquivos', parts: [
        {
          card: [
            {
              title: 'Do caminho ao texto',
              body: 'Agora vamos prototipar o processamento em main com o arquivo a.txt e a busca rust fixos. `fs::read_to_string` lê todo o arquivo como UTF-8 e retorna um Result. O operador `?` entrega a String quando há sucesso; em caso de falha devolve o erro da função. Por isso main retorna `io::Result<()>`. No sucesso, devolva Ok com o valor vazio. `lines` percorre linhas sem seus terminadores; contains procura um trecho e distingue caixa.',
              visual: code(readMain, [4, 5, 6, 7, 8], 'src/main.rs — protótipo de leitura'),
            },
            {
              title: 'Acompanhe o filtro',
              body: 'Suponha a.txt com três linhas: Rust, rust e C. Avance e veja qual passa pela busca minúscula.',
              visual: trace([
                'Arquivo no disco: Rust / rust / C. read_to_string → Ok(String dona do texto no heap).',
                'Primeira slice emprestada: Rust. contains rust → false. Nada é impresso.',
                'Segunda slice: rust. contains rust → true. stdout recebe rust e uma quebra de linha.',
                'Terceira slice: C. false. O laço termina; Ok(()) sinaliza sucesso e a String pode ser liberada.',
              ]),
            },
          ],
          exercises: [
            mcq('Qual é o tipo de sucesso de read_to_string?', ['String', 'Vec de arquivos', 'bool', 'File'], 0, 'O Result contém uma String com o texto completo quando a leitura e a validação UTF-8 têm sucesso.'),
            num('Quantas linhas este texto fornece?', 3, 'Há três linhas. A quebra final termina a terceira e não acrescenta uma quarta linha vazia.', { visual: code('fn main() {\n    let text = "a\\nb\\nc\\n";\n    let n = text.lines().count();\n    println!("{n}");\n}', [], 'lines') }),
            tf('Um arquivo existente com bytes inválidos em UTF-8 pode causar Err em read_to_string.', true, 'Existir não basta: a função também precisa ler os bytes e convertê-los em uma String UTF-8 válida.'),
            fill('Complete a responsabilidade do operador de propagação:', 'No sucesso ele extrai o valor; na falha ele ___ da função atual.', ['retorna o erro'], ['repete a leitura para sempre', 'retorna zero', 'imprime o arquivo'], 'O operador ? propaga a falha ao chamador. Ele não imprime automaticamente uma mensagem.'),
            gen((rng) => {
              const n = randInt(rng, 2, 6);
              const text = Array.from({ length: n }, (_, i) => i % 2 === 0 ? 'motor' : 'sensor').join('\\n');
              return num('Quantas linhas contêm motor?', Math.ceil(n / 2), `As linhas ímpares contêm motor. Entre ${n} linhas, são ${Math.ceil(n / 2)} correspondências.`, { visual: code(`fn main() {
    let text = concat!(
${text.split('\\n').map((s) => `        "${s}\\n",`).join('\n')}
    );
    let n = text.lines()
        .filter(|s| s.contains("motor"))
        .count();
    println!("{n}");
}`, [], 'Conteúdo sorteado') });
            }),
            mcq('O arquivo não existe. O que o ? faz nesta função?', ['devolve o erro ao chamador', 'cria automaticamente um arquivo vazio', 'continua com uma String vazia', 'gera um erro de compilação'], 0, 'A leitura devolve Err de I/O. O ? encerra a função com esse erro e a linha de impressão não roda.', { visual: code('fn load() -> std::io::Result<()> {\n    let s = std::fs::read_to_string(\n        "inexistente.txt",\n    )?;\n    println!("{s}");\n    Ok(())\n}', [2, 3, 4], 'Suponha caminho inexistente') }),
            mcq('Qual linha destacada tem o defeito e qual diagnóstico explica?', ['linha 3: E0308, tipos incompatíveis', 'linha 1: E0382, valor movido', 'linha 5: E0499, empréstimo duplo', 'nenhuma: a leitura entrega String diretamente'], 0, 'E0308: mismatched types. read_to_string devolve Result<String, io::Error>, mas text foi declarado String. Acrescente ? após a chamada de leitura para extrair o sucesso e propagar a falha.', { visual: code('fn main() -> std::io::Result<()> {\n    let text: String =\n        std::fs::read_to_string("a");\n    println!("{text}");\n    Ok(())\n}', [1, 3, 5], 'Erro intencional') }),
            codePuzzle('Dentro de main que retorna std::io::Result<()>, monte o trecho que lê o caminho e imprime a primeira linha, se existir.', [
              'let path = "dados.txt";',
              'let text =\n    std::fs::read_to_string(path)?;',
              'let first = text.lines().next();',
              'if let Some(line) = first {',
              '    println!("{line}");',
              '}',
            ], ['let text: String =\n    std::fs::read_to_string(path);', 'let first = text.lines().count();'], 'O caminho alimenta a leitura; a String vive enquanto first a empresta. next devolve Option e o if let imprime somente uma linha existente. Depois desse trecho, main ainda deve devolver Ok(()).'),
          ],
        },
        {
          card: [
            {
              title: 'Gravar somente as linhas encontradas',
              body: 'O item 42 do roteiro começa com texto em arquivo. Vamos guardar as correspondências: uma String acumula cada linha original e uma quebra de linha; fs::write grava tudo de uma vez. Se o destino já existe, seu conteúdo é substituído. Use um destino diferente da entrada. O ? da escrita também pode devolver um erro, por exemplo por falta de permissão.',
              visual: code(writeMain, [7, 10, 11, 14], 'src/main.rs — exportação em texto'),
            },
            {
              title: 'Entrada e saída têm donos',
              body: 'As slices line emprestam text. output é outra String, que recebe cópias dos caracteres escolhidos. A escrita abaixo consome output; se precisar usá-la depois, passe um empréstimo para write.',
              visual: table(['Valor', 'Papel'], [
                ['text: String', 'dono do conteúdo lido'],
                ['line: &str', 'visão de uma linha de text'],
                ['output: String', 'dono do texto filtrado'],
                ['write com &output', 'empresta os bytes para gravar'],
              ]),
            },
            {
              title: 'No seu computador',
              body: 'Continue minigrep, conforme o item 42 e Projeto 1. Crie a.txt com as linhas Rust, rust e C; use o protótipo de exportação e depois troque o caminho fixo pelo recebido em Config. Pronto quando achados.txt contiver apenas rust e uma quebra final, uma segunda execução substituir o arquivo sem duplicar linhas e um caminho inexistente devolver erro. Como extensão do item 25, leia um arquivo de inteiros, aplique parse por linha com ? e devolva a soma em Result. Rode os comandos de qualidade sem avisos.',
              visual: code('cargo run -- rust a.txt\ncargo test\ncargo fmt\ncargo clippy -- -D warnings', [], 'Terminal — mesmo pacote minigrep'),
            },
          ],
          exercises: [
            tf('fs::write acrescenta automaticamente ao fim de um arquivo existente.', false, 'write substitui o conteúdo inteiro. Acrescentar exige outra estratégia, como abrir um arquivo com a opção append.'),
            mcq('Que bytes de texto ficam no destino, supondo sucesso?', ['rust seguido de uma quebra de linha', 'Rust seguido de rust', 'C seguido de uma quebra de linha', 'arquivo sempre vazio'], 0, 'contains distingue caixa: só rust passa. push_str copia a linha; push acrescenta a quebra.', { visual: code('let text = "Rust\\nrust\\nC";\nlet mut output = String::new();\nfor line in text.lines() {\n    if line.contains("rust") {\n        output.push_str(line);\n        output.push(\'\\n\');\n    }\n}\nstd::fs::write("achados.txt", output)?;', [], 'Trecho em main com retorno de I/O') }),
            fill('Qual operação acrescenta o conteúdo de uma slice à String?', 'Para copiar os caracteres da linha, use ___.', ['push_str'], ['read_to_string', 'exit', 'is_ok'], 'push_str recebe uma slice e copia seus caracteres para a String. push recebe um único char.'),
            gen((rng) => {
              const n = randInt(rng, 2, 6);
              return num('Quantos bytes são acumulados? Cada linha copiada é ASCII.', 4 * n, `Cada repetição acrescenta três bytes de sol e um byte de quebra: ${n} vezes 4 = ${4 * n} bytes.`, { visual: code(`fn main() {
    let mut out = String::new();
    for _ in 0..${n} {
        out.push_str("sol");
        out.push('\\n');
    }
    println!("{}", out.len());
}`, [], 'Buffer sorteado') });
            }),
            match('Associe a operação ao efeito:', [['read_to_string', 'carrega texto UTF-8'], ['push_str', 'copia uma slice para a String'], ['write', 'substitui o conteúdo do destino']], 'A leitura cria a String de entrada, a acumulação monta a saída em memória e a gravação escreve o resultado no disco.'),
            mcq('Por que a impressão depois da escrita não compila?', ['E0382: out foi movida para write', 'E0308: write exige um inteiro', 'E0499: há dois empréstimos mutáveis', 'compila e sempre imprime vazio'], 0, 'E0382: borrow of moved value: `out`. write recebeu a String por valor. Passe &out na escrita para emprestar e poder continuar usando a String.', { visual: code('fn main() -> std::io::Result<()> {\n    let out = String::from("rust");\n    std::fs::write("out.txt", out)?;\n    println!("{out}");\n    Ok(())\n}', [3, 4], 'Erro intencional de posse') }),
            order('Ordene a exportação segura do resultado:', ['ler a entrada sem modificá-la', 'filtrar linhas em memória', 'montar o texto de saída', 'gravar em um destino diferente'], 'Primeiro preserve os dados de entrada. Depois selecione linhas, construa o buffer e grave o destino; falhas de I/O devem ser propagadas.'),
            codePuzzle('Monte uma função que grava e relê o mesmo caminho, devolvendo o texto lido. A entrada é um texto curto de teste.', [
              'fn roundtrip()\n    -> std::io::Result<String>\n{',
              '    let path = "copia.txt";',
              '    std::fs::write(path, "rust\\n")?;',
              '    let text =\n        std::fs::read_to_string(path)?;',
              '    Ok(text)',
              '}',
            ], ['    Ok(text);', '    let text =\n        std::fs::read_to_string(path);', '    std::fs::write(path, 42)?;'], 'O teste manual exige gravar antes de reler. Os dois ? propagam falhas. A última expressão Ok(text), sem ponto e vírgula, entrega a String ao chamador.'),
          ],
        },
      ],
    },
    {
      id: 'rp-cli-estr', title: 'Separando lib.rs e main.rs', parts: [
        {
          card: [
            {
              title: 'Busca pura na biblioteca',
              body: 'Separe a lógica de busca da leitura de arquivos. Crie src/lib.rs no pacote minigrep e mova Config para lá, mantendo os itens públicos que o binário usa. Acrescente search: ela recebe texto e busca emprestados, não acessa disco e devolve slices das linhas originais. O lifetime a liga o resultado ao texto, que precisa continuar vivo. A busca não precisa viver tanto quanto o texto.',
              visual: code(search, [1, 3, 4, 8, 11], 'src/lib.rs — além de Config'),
            },
            {
              title: 'Duas crates, um pacote',
              body: 'Neste pacote, lib.rs define a crate de biblioteca minigrep; main.rs define a crate binária e importa sua API pelo nome do pacote. Não declare mod lib no binário. Este main de demonstração usa somente a busca pura; a orquestração completa virá com run.',
              visual: code('use minigrep::search;\n\nfn main() {\n    let text = "motor\\nsensor";\n    for line in search("motor", text) {\n        println!("{line}");\n    }\n}', [1, 5], 'src/main.rs — ligado à biblioteca'),
            },
            {
              title: 'Memória da busca',
              body: 'Avance para seguir search com busca motor e texto motor / sensor. O resultado guarda referências; não duplica as linhas.',
              visual: trace([
                'Chamador: String text possui os bytes motor / sensor no heap. query aponta para a busca.',
                'search recebe &str para o texto; found começa como vetor vazio, sem mover a String.',
                'A linha motor contém a busca: found recebe uma slice apontando para os bytes originais.',
                'Retorno: o vetor possui suas referências; os bytes continuam pertencendo a text. Não descarte text enquanto usar as slices.',
              ]),
            },
          ],
          exercises: [
            mcq('Onde deve ficar a busca que será chamada por testes e pelo binário?', ['src/lib.rs', 'Cargo.lock', 'target/debug', 'um comentário em Cargo.toml'], 0, 'A biblioteca expõe a lógica reutilizável. O binário cuida da interface e chama funções públicas da biblioteca.'),
            mcq('O que o main de demonstração imprime?', ['motor', 'sensor', 'motor e sensor', 'minigrep'], 0, 'A busca é motor. Somente a primeira linha contém esse trecho, então apenas motor é impresso.', { visual: code('use minigrep::search;\nfn main() {\n    let text = "motor\\nsensor";\n    for line in search("motor", text) {\n        println!("{line}");\n    }\n}', [], 'Com a biblioteca mostrada') }),
            tf('search precisa abrir um arquivo para poder ser testada.', false, 'Ela recebe o texto como &str. Um teste fornece uma string literal, sem criar arquivo nem depender do sistema de arquivos.'),
            match('Associe cada elemento à sua responsabilidade:', [['main.rs', 'interface do executável'], ['lib.rs', 'API reutilizável'], ['pub', 'expor um item ao binário'], ['lifetime do retorno', 'ligar as slices ao texto original']], 'O pacote reúne binário e biblioteca. A visibilidade permite chamar a API, e o lifetime expressa a validade das referências retornadas.'),
            gen((rng) => {
              const n = randInt(rng, 2, 7);
              return num('Com search da biblioteca, qual comprimento é impresso?', n, `O texto contém ${n} linhas iguais a rust, cada uma contendo a busca. search devolve ${n} slices.`, { visual: code(`use minigrep::search;
fn main() {
    let text = "rust\\n".repeat(${n});
    let found = search("rust", &text);
    println!("{}", found.len());
}`, [], 'Binário no mesmo pacote') });
            }),
            fill('Qual palavra permite chamar search a partir da outra crate do pacote?', 'A função da biblioteca precisa ser ___.', ['pub'], ['mut', 'dyn', 'unsafe'], 'Itens privados não são parte da API acessível à crate binária. pub expõe search sem exigir expor seus detalhes internos.'),
            order('Ordene a refatoração sem mudar o resultado:', ['definir a função search na biblioteca', 'tornar search pública', 'importar search no binário', 'chamar a função com busca e texto'], 'Primeiro crie a API, dê a visibilidade necessária, traga o nome ao binário e só então delegue o processamento.'),
            codePuzzle('Monte o main que lê um arquivo e usa a biblioteca minigrep. Use os nomes completos, sem imports adicionais.', [
              'fn main() -> std::io::Result<()> {',
              '    let text =\n        std::fs::read_to_string("a")?;',
              '    let found =\n        minigrep::search("rust", &text);',
              '    println!("{}", found.len());',
              '    Ok(())',
              '}',
            ], ['    let found =\n        minigrep::search("rust", text);', '    Ok(());'], 'A leitura cria a String; search recebe um empréstimo e devolve slices. found não pode preceder text. O main retorna Ok(()) para sinalizar sucesso.'),
          ],
        },
        {
          card: [
            {
              title: 'Teste antes de ampliar o modo de busca',
              body: 'Acrescente search_ci em lib.rs, ao lado de search. Ela converte uma cópia da busca e uma cópia de cada linha para minúsculas. A linha devolvida continua original, com sua caixa preservada. É a estratégia didática do livro: não é uma implementação completa de case folding Unicode nem remove acentos.',
              visual: code(searchCi, [5, 8, 9, 10], 'src/lib.rs — busca sem distinguir caixa'),
            },
            {
              title: 'Um teste por comportamento',
              body: 'Anexe este módulo a lib.rs. O teste sensitive impede que a busca comum passe a aceitar Rust quando pedimos rust. O teste insensitive verifica que rUsT encontra as duas grafias e mantém a ordem do arquivo. Testes não precisam alterar variáveis globais do ambiente: aqui testamos diretamente as duas funções.',
              visual: code(tests, [9, 19], 'src/lib.rs — módulo de testes'),
            },
            {
              title: 'No seu computador',
              body: 'No pacote já criado, complete a separação de responsabilidades do Projeto 1 e os testes do item 28. Mantenha Config, search e search_ci em lib.rs e um main que as chama. Pronto quando os dois testes mostrados passarem, houver também um teste sem correspondências e outro com duas correspondências na ordem original, sem ler arquivo nos testes de busca. Rode fmt e clippy sem avisos. Se começar esta etapa em outro computador, crie minigrep com edição 2024 e copie as definições anteriores.',
              visual: code('cargo test\ncargo test insensitive\ncargo fmt\ncargo clippy -- -D warnings', [], 'Terminal — teste a biblioteca'),
            },
          ],
          exercises: [
            mcq('Qual lista search_ci devolve para essa entrada?', ['Rust e rust, nessa ordem', 'rust e rust, sempre minúsculas', 'somente Rust', 'lista vazia'], 0, 'A comparação usa cópias minúsculas, mas found recebe line, a slice original. Assim a caixa original e a ordem são preservadas.', { visual: code('let text = "Rust\\nrust\\nC";\nlet found = search_ci("rUsT", text);', [], 'Trecho usando search_ci') }),
            tf('O lifetime do retorno de search precisa ficar ligado à busca query.', false, 'As slices retornadas apontam para text. A busca apenas orienta a comparação e não fornece os bytes das linhas devolvidas.'),
            fill('Qual macro compara resultado real e resultado esperado no teste?', 'Use ___ para verificar a igualdade.', ['assert_eq!'], ['println!', 'eprintln!', 'format!'], 'assert_eq! falha o teste quando os dois valores são diferentes. Imprimir valores não verifica a igualdade.'),
            gen((rng) => {
              const n = randInt(rng, 2, 5);
              return num('Quantas linhas a busca sem distinguir caixa encontra?', n, `Cada uma das ${n} linhas é RUST, que vira rust na comparação e contém a busca normalizada.`, { visual: code(`use minigrep::search_ci;
fn main() {
    let text = "RUST\\n".repeat(${n});
    let found =
        search_ci("rUsT", &text);
    println!("{}", found.len());
}`, [], 'Busca com quantidade sorteada') });
            }),
            mcq('Qual teste falta para impedir que uma busca ausente devolva linhas indevidas?', ['buscar zzz em Rust e esperar vetor vazio', 'buscar Rust e esperar Rust', 'imprimir o conteúdo do arquivo', 'conferir o nome do pacote'], 0, 'Um caso sem correspondências verifica o ramo em que nenhuma linha é inserida. Os outros casos não garantem esse comportamento.'),
            multi('Quais verificações ajudam a preservar o contrato da busca?', ['não modificar a caixa das linhas retornadas', 'preservar a ordem das correspondências', 'sempre ordenar as linhas alfabeticamente', 'retornar vazio quando não há correspondência'], [0, 1, 3], 'A função devolve as linhas originais na ordem em que aparecem. Ordenar mudaria o contrato; ausência deve produzir vetor vazio.'),
            codePuzzle('Anexe este teste a lib.rs, onde search já existe. Import e abertura da função estão unidos; os dois fechamentos também formam um bloco.', [
              '#[cfg(test)]\nmod empty_tests {',
              '    use super::search;\n\n    #[test]\n    fn no_match() {',
              '        let found =\n            search("zzz", "Rust");',
              '        assert!(found.is_empty());',
              '    }\n}',
            ], ['        assert!(!found.is_empty());', '        assert!(found);'], 'O teste fornece uma busca ausente e verifica is_empty. O import dá acesso à função no módulo pai; a anotação test permite ao Cargo descobrir o caso.'),
            mcq('A implementação devolve sempre um vetor vazio. O teste insensitive mostrado tem qual resultado?', ['compila, mas o teste falha na igualdade', 'gera E0308 antes de testar', 'passa porque o texto é válido', 'é ignorado por cargo test'], 0, 'O vetor vazio tem o tipo correto, então compila. A comparação com duas linhas falha na execução do teste. Isso revela um defeito de lógica, não um erro de compilação.'),
          ],
        },
      ],
    },
    {
      id: 'rp-cli-erros', title: 'Erros para o usuário e códigos de saída', parts: [
        {
          card: [
            {
              title: 'run conecta configuração, leitura e busca',
              body: 'Adicione run à biblioteca junto das definições anteriores. Ela recebe a configuração pronta, lê o arquivo e escolhe search ou search_ci. O retorno aceita erros por meio de Box<dyn Error>, para a futura serialização também poder usar ?. O sucesso não carrega dados: sua saída já foi impressa. Uma busca sem correspondências também é sucesso neste projeto.',
              visual: code(run, [6, 11, 12, 13, 15, 20], 'src/lib.rs — juntar as peças'),
              tip: 'Result relata falhas esperadas. Evite unwrap e expect fora de testes: arquivo ausente deve virar mensagem de uso da ferramenta, não panic.',
            },
            {
              title: 'Siga os dois caminhos de run',
              body: 'Escolha os passos para separar propagação de erro e processamento normal.',
              visual: trace([
                'Config válida entra em run. Ainda não há resultado da busca.',
                'Leitura falhou → ? devolve Err imediatamente. A biblioteca não decide o código de saída.',
                'Alternativa: leitura Ok → a String fica viva em run; ignore_case escolhe uma das duas funções.',
                'As slices são impressas enquanto a String existe. O laço termina e run devolve Ok(()).',
              ]),
            },
          ],
          exercises: [
            mcq('Qual função deve decidir se usa search_ci?', ['run com base em Config', 'fs::read_to_string', 'o compilador olhando o nome do arquivo', 'o destrutor de String'], 0, 'A configuração já contém o booleano. run escolhe a busca correspondente depois de ler o texto.'),
            tf('run deve chamar process::exit quando a leitura falha.', false, 'A biblioteca deve propagar Err. A interface em main decide como explicar o erro e qual status devolver ao sistema.'),
            fill('Complete a sequência de propagação:', 'Leitura falha, o operador ? devolve ___ para main.', ['Err'], ['Ok'], 'O erro da leitura é convertido para o tipo de erro do retorno e propagado. A busca não começa.'),
            match('Associe contrato e significado:', [['Result<(), erro>', 'sucesso sem valor útil ou falha'], ['Box<dyn Error>', 'erro encapsulado de tipos diferentes'], ['Ok(())', 'execução concluída sem falha']], 'O primeiro parâmetro de Result é o sucesso; aqui é (). O Box permite representar erros distintos que implementam Error.'),
            gen((rng) => {
              const n = randInt(rng, 2, 6);
              const ignore = randInt(rng, 0, 1) === 1;
              return num('As funções de busca são as da biblioteca. Qual contagem é impressa?', ignore ? n : 0, `${ignore ? 'O modo sem distinguir caixa encontra' : 'O modo sensível não encontra'} RUST com a busca rust. ${ignore ? `Há ${n} linhas e todas passam.` : 'Logo a contagem é zero.'}`, { visual: code(`use minigrep::{search, search_ci};
fn main() {
    let text = "RUST\\n".repeat(${n});
    let ignore = ${ignore};
    let found = if ignore {
        search_ci("rust", &text)
    } else {
        search("rust", &text)
    };
    println!("{}", found.len());
}`, [], 'Escolha sorteada de modo') });
            }),
            mcq('Este main compila? Como corrigir o erro destacado?', ['não: E0277; main precisa retornar Result', 'sim: ? imprime o erro sozinho', 'não: E0382; clone o caminho', 'não: E0499; remova um empréstimo mutável'], 0, 'E0277: the `?` operator can only be used in a function that returns `Result` or `Option` (or another type that implements `FromResidual`). Este main retorna (). Faça main retornar um Result compatível e termine com Ok(()), ou trate o Result com match.', { visual: code('fn main() {\n    let text = std::fs::read_to_string(\n        "dados.txt",\n    )?;\n    println!("{text}");\n}', [4], 'Erro intencional de propagação') }),
            order('Ordene o caminho bem-sucedido de run:', ['receber Config validada', 'ler o arquivo propagando falhas', 'escolher a busca pelo modo', 'imprimir as linhas encontradas', 'devolver Ok com valor vazio'], 'A configuração define entrada e modo. A leitura precisa ter sucesso antes da busca; a função só sinaliza sucesso depois de apresentar os resultados.'),
            codePuzzle('Monte run reduzida que lê o caminho e retorna a quantidade de linhas. O tipo de erro fica restrito a I/O nesta versão.', [
              'fn run(path: &str)\n    -> std::io::Result<usize>\n{',
              '    let text =\n        std::fs::read_to_string(path)?;',
              '    let lines = text.lines();',
              '    let count = lines.count();',
              '    Ok(count)',
              '}',
            ], ['    Ok(count);', '    let text =\n        std::fs::read_to_string(path);'], 'A leitura extrai String com ?. lines a empresta e count consome o iterador para produzir usize. Ok(count) entrega o número ou a leitura já terá devolvido um erro.'),
          ],
        },
        {
          card: [
            {
              title: 'main fala com o usuário',
              body: 'Substitua o main pelo tratamento completo. Argumentos inválidos produzem mensagem de uso e status 2. Falha em run produz diagnóstico e status 1. No sucesso, chegar ao fim de main significa status 0. eprintln envia o diagnóstico a stderr, separado das correspondências em stdout. São convenções deste projeto: não copiamos a convenção do grep em que nenhuma correspondência tem status 1.',
              visual: code(finalMain, [12, 13, 15, 19, 20], 'src/main.rs — versão sem crates externas'),
              tip: 'process::exit encerra o processo imediatamente e não roda os destrutores da pilha. Aqui ele fica na borda do programa; evite usá-lo na lógica da biblioteca. Uma alternativa é retornar ExitCode de main.',
            },
            {
              title: 'Dois canais, um status',
              body: 'Depois de gerar o binário, redirecione os canais. A saída de compilação do Cargo também usa stderr; chamar o executável diretamente ajuda a inspecionar só a ferramenta.',
              visual: table(['Caso', 'stdout', 'stderr / status'], [
                ['linhas encontradas', 'linhas', 'vazio / 0'],
                ['nenhuma linha', 'vazio', 'vazio / 0'],
                ['argumentos inválidos', 'vazio', 'uso / 2'],
                ['arquivo ausente', 'vazio', 'diagnóstico / 1'],
              ]),
            },
            {
              title: 'No seu computador',
              body: 'Conclua o núcleo do Projeto 1. Rode os quatro casos da tabela. Pronto quando os resultados forem somente para stdout, os dois erros forem somente para stderr e os status forem 0, 0, 2 e 1. No Bash, consulte o status logo após cada execução com o comando abaixo; no PowerShell consulte a variável LASTEXITCODE do shell. Teste também IGNORE_CASE=1 com busca RUST sobre uma linha rust. Mantenha zero unwrap/expect fora de testes, cargo test passando e clippy sem avisos.',
              visual: code('cargo build\n./target/debug/minigrep > out.txt\necho $?\ncat out.txt\n# No Windows: target/debug/minigrep.exe\ncargo fmt\ncargo clippy -- -D warnings', [], 'Terminal Bash — caso sem argumentos'),
            },
          ],
          exercises: [
            mcq('Qual macro escreve o diagnóstico no canal de erros?', ['eprintln!', 'println!', 'format!', 'vec!'], 0, 'eprintln! escreve em stderr e termina a linha. println! envia dados a stdout; format! cria uma String.'),
            num('Com argumentos inválidos, qual é o status do main mostrado?', 2, 'O ramo Err de Config::build termina o processo com process::exit(2). run nem é chamada.', { visual: code(finalMain, [15], 'Contrato de status') }),
            tf('Apenas escrever com eprintln altera o status para falha.', false, 'eprintln só escreve no canal de erros. É o exit com código não zero, ou outro retorno apropriado de main, que sinaliza falha ao sistema.'),
            match('Associe cada situação ao resultado deste projeto:', [['nenhuma correspondência', 'status 0 sem linhas'], ['erro de arquivo', 'status 1 com diagnóstico'], ['falta a busca', 'status 2 com instrução de uso']], 'Ausência de resultados é uma busca concluída. Falha de I/O e erro de argumentos são categorias diferentes da interface.'),
            gen((rng) => {
              const status = randInt(rng, 1, 2);
              return num('Qual código o sistema recebe?', status, `process::exit recebe ${status}, que é entregue ao sistema. A instrução de impressão apenas escreve em stderr.`, { visual: code(`fn main() {
    let status = ${status};
    eprintln!("Falha na execução");
    std::process::exit(status);
}`, [], 'Saída antecipada') });
            }),
            mcq('O binário é chamado sem argumentos e stdout vai para out.txt. O que fica nesse arquivo?', ['nenhuma mensagem da aplicação', 'Argumentos: Use: BUSCA ARQUIVO', 'Aplicação: arquivo ausente', 'o código 2 impresso como texto'], 0, 'A validação escreve em stderr e sai com 2. O redirecionamento de stdout não captura stderr nem transforma o status em texto.', { visual: code('./target/debug/minigrep > out.txt', [], 'Terminal Bash com o main mostrado') }),
            codePuzzle('Monte um main de demonstração que trata um Result conhecido. O erro precisa ser escrito antes da saída com status 1.', [
              'fn main() {',
              '    let result: Result<(), &str> =\n        Err("sem acesso");',
              '    if let Err(e) = result {',
              '        eprintln!("Erro: {e}");',
              '        std::process::exit(1);',
              '    }\n}',
            ], ['        println!("Erro: {e}");', '        std::process::exit(0);'], 'O valor é Err, então if let extrai a mensagem. eprintln a envia ao canal correto antes que exit encerre o processo; código 0 seria sucesso indevido.'),
            mcq('Qual teste de integração verifica que um erro não contamina dados redirecionados?', ['executar com arquivo ausente e conferir stdout vazio, stderr não vazio e status 1', 'conferir apenas se stdout contém qualquer texto', 'executar com arquivo válido e ignorar o status', 'comparar só o tamanho do executável'], 0, 'Os três sinais fazem parte do contrato: nenhum dado de resultado, diagnóstico disponível e falha sinalizada ao chamador. O texto exato do erro de I/O varia com o sistema.'),
          ],
        },
      ],
    },
    {
      id: 'rp-cli-crates', title: 'clap e serde na prática', parts: [
        {
          card: [
            {
              title: 'O parser cresce sem ifs manuais',
              body: 'No mesmo pacote minigrep, acrescente estas tabelas ao Cargo.toml. A feature derive habilita a macro do clap. Os exemplos desta etapa usam clap 4; Cargo resolve uma versão compatível e registra a resolução no lockfile. Não são dependências do app Expo: são do programa Rust que você está construindo.',
              visual: code(clapToml, [], 'Cargo.toml — acrescentar uma vez'),
            },
            {
              title: 'A struct descreve a interface',
              body: 'Coloque Args e o import de Parser acima de main. query e file_path são posicionais obrigatórios. O bool ignore_case recebe uma flag curta i e uma longa ignore-case; ausente vale false. Args::parse lê os argumentos e cuida da ajuda e dos erros de uso. Não passe o vetor manual junto: este parser substitui Config::build na interface.',
              visual: code(clapArgs, [3, 8, 9], 'src/main.rs — argumentos declarativos'),
            },
            {
              title: 'Adapte Args à configuração existente',
              body: 'Use este main junto da definição de Args. O modo é ativado pela flag OU pela variável de ambiente. Uma flag ausente não anula um ambiente presente. Mantenha Config na biblioteca como dado da aplicação, mas remova seu build manual se não o for mais usar.',
              visual: code(clapMain, [5, 9, 10, 11], 'src/main.rs — reaproveita run'),
            },
            {
              title: 'Veja a interface virar dados',
              body: 'Avance numa execução com -i, busca rust e arquivo dados.txt, sem IGNORE_CASE no ambiente.',
              visual: trace([
                'Terminal → -i rust dados.txt. clap recebe argumentos, reconhece a flag e confere os dois posicionais.',
                'Args: query = rust; file_path = dados.txt; ignore_case = true.',
                'Ambiente ausente dá false. Combinação true OU false → Config.ignore_case = true.',
                'run recebe Config e reutiliza search_ci. Nenhum detalhe do clap entra na função de busca.',
              ]),
            },
          ],
          exercises: [
            mcq('Qual feature é necessária para a macro que gera o parser?', ['derive', 'json', 'unsafe', 'nightly'], 0, 'A feature derive do clap habilita as macros usadas por derive(Parser). Não exige Rust nightly.', { visual: code(clapToml, [3], 'Cargo.toml') }),
            mcq('Qual campo recebe dados.txt nesta execução?', ['file_path', 'query', 'ignore_case', 'name'], 0, 'A flag não ocupa um posicional. rust preenche query; o argumento seguinte preenche file_path.', { visual: code('cargo run -- -i rust dados.txt', [], 'Terminal com Args mostrado') }),
            tf('Sem a flag e sem IGNORE_CASE, Config.ignore_case fica false.', true, 'O bool do clap vale false quando a flag está ausente. var.is_ok também é false para a variável ausente; false OU false continua false.'),
            fill('Qual trait deve estar no escopo para chamar Args::parse?', 'Importe a trait ___ do clap.', ['Parser'], ['Serialize', 'Display', 'Iterator'], 'Parser oferece parse e try_parse_from. O import também disponibiliza o derive Parser usado na declaração.'),
            gen((rng) => {
              const flag = randInt(rng, 0, 1) === 1;
              const present = randInt(rng, 0, 1) === 1;
              return mcq('Este trecho simula flag e presença Unicode do ambiente. O que é impresso?', [String(flag || present), String(!(flag || present)), 'IGNORE_CASE', 'Err'], 0, `Flag ${flag} e presença ${present}: o OU lógico resulta em ${flag || present}. Basta um dos dois ser true.`, { visual: code(`fn main() {
    let flag = ${flag};
    let present = ${present};
    let ignore = flag || present;
    println!("{ignore}");
}`, [], 'Combinação sorteada') });
            }),
            match('Associe a entrada ao papel no parser:', [['primeiro posicional', 'query'], ['segundo posicional', 'file_path'], ['-i ou --ignore-case', 'flag de comparação'], ['--help', 'ajuda gerada']], 'A ordem define os posicionais; atributos definem as flags. clap também gera ajuda sem criar esse campo em Args.'),
            mcq('Que teste evita encerrar o processo ao testar argumentos incompletos?', ['usar Args::try_parse_from e verificar is_err', 'chamar process::exit no teste', 'usar parse e ignorar tudo', 'testar apenas search_ci'], 0, 'try_parse_from devolve Result em vez de encerrar por erro de uso. Forneça também o nome do programa como primeiro item; a falta de file_path deve ser Err.', { visual: code('#[test]\nfn missing_path() {\n    let result = Args::try_parse_from(\n        ["minigrep", "rust"],\n    );\n    assert!(result.is_err());\n}', [], 'Anexe ao arquivo com Args e Parser') }),
            codePuzzle('Com Args já no módulo pai, monte o teste que verifica a flag i. Os imports estão unidos à abertura da função; os fechamentos também formam um bloco.', [
              '#[cfg(test)]\nmod cli_tests {',
              '    use super::Args;\n    use clap::Parser;\n\n    #[test]\n    fn flag() {',
              '        let input = [\n            "minigrep", "-i",\n            "rust", "a.txt",\n        ];',
              '        let args =\n            Args::try_parse_from(input)\n                .unwrap();',
              '        assert!(args.ignore_case);',
              '    }\n}',
            ], ['        assert!(!args.ignore_case);', '        let args =\n            Args::try_parse_from(input);'], 'try_parse_from recebe uma entrada controlada; unwrap é permitido aqui dentro do teste e revela uma falha do parser como teste falho. A flag i deve ativar o bool.'),
          ],
        },
        {
          card: [
            {
              title: 'Relatório que outra ferramenta entende',
              body: 'Acrescente estas dependências ao Cargo.toml, mantendo clap. Serialize transforma dados em uma representação; Deserialize permite reconstruir dados. serde define as traits e macros; serde_json implementa o formato JSON. O item 42 do roteiro pede justamente salvar e recuperar dados estruturados.',
              visual: code(serdeToml, [], 'Cargo.toml — acrescentar às tabelas anteriores'),
            },
            {
              title: 'Um tipo de relatório na biblioteca',
              body: 'Acrescente Report em lib.rs. matches possui as strings, o que simplifica a leitura de volta do JSON. Em Args acrescente o campo json com o atributo long; em Config acrescente um bool público json. No literal de Config de main acrescente o valor vindo de args.json. A flag fica desativada por padrão. A versão abaixo de run substitui a anterior.',
              visual: code(report, [], 'src/lib.rs — tipo do relatório'),
            },
            {
              title: 'Ligue a flag nas três estruturas',
              body: 'Estes são trechos para inserir nas declarações e no literal já mostrados. Ao adotar clap, remova Config::build antigo e seus testes: agora a validação da linha de comando pertence a Args. Deixe os testes das funções de busca.',
              visual: code('// Dentro de Args:\n#[arg(long)]\njson: bool,\n\n// Dentro de Config:\npub json: bool,\n\n// No literal Config de main:\njson: args.json,', [], 'Inserções — não é um arquivo completo'),
            },
            {
              title: 'run escolhe texto ou JSON',
              body: 'No modo JSON, transforme as slices em Strings e serialize um único Report. O ? propaga erros de serialização pelo mesmo retorno de run. No modo texto, preserve a saída anterior. Não imprima mensagens de progresso em stdout: elas quebrariam o documento JSON. Com busca rust no texto Rust / rust, sem ignorar caixa, o campo matches contém apenas a string rust.',
              visual: code(jsonRun, [16, 18, 19, 23, 26], 'src/lib.rs — substituir run'),
            },
            {
              title: 'No seu computador',
              body: 'Finalize o Projeto 1 com clap e amplie com o JSON do item 42. No pacote minigrep, adicione as dependências, adapte Args/Config e substitua run. Use dados.txt com Rust, rust e C. Pronto quando --help sair com 0, faltar o arquivo posicional sair com 2 e --json --ignore-case com busca rUsT produzir um objeto cujo matches seja ["Rust","rust"]. Acrescente um teste de ida e volta com to_string e from_str, conferindo o vetor recuperado; uma busca ausente em modo JSON deve produzir matches vazio. Preserve erro de I/O em stderr com status 1; rode todos os comandos de qualidade. Buscas recursivas, cores e .gitignore ficam como expansões posteriores do roteiro.',
              visual: code('cargo run -- --help\ncargo run -- rust dados.txt --json\ncargo run -- -i rUsT dados.txt --json\ncargo test\ncargo fmt\ncargo clippy -- -D warnings', [], 'Terminal — versão final'),
            },
          ],
          exercises: [
            match('Associe cada componente à sua função:', [['Serialize', 'dados Rust para uma representação'], ['Deserialize', 'representação para dados Rust'], ['serde_json', 'formato JSON'], ['flag json', 'escolher a apresentação do resultado']], 'As traits descrevem conversões; serde_json fornece o formato. A flag escolhe o modo de saída e não altera a regra de busca.'),
            mcq('Com Report no escopo, qual linha aparece antes da quebra final?', ['{"matches":["rust"]}', '{matches:[rust]}', '["rust"]', 'Report { matches: ["rust"] }'], 0, 'to_string serializa a struct como objeto JSON compacto. O nome do campo e a string ficam entre aspas; println acrescenta somente a quebra final.', { visual: code('fn main() -> Result<(),\n    Box<dyn std::error::Error>>\n{\n    let report = Report {\n        matches: vec!["rust".into()],\n    };\n    let json =\n        serde_json::to_string(&report)?;\n    println!("{json}");\n    Ok(())\n}', [], 'Com o tipo Report mostrado') }),
            tf('É seguro montar JSON concatenando manualmente as linhas encontradas entre aspas.', false, 'Linhas podem conter aspas, barras e caracteres de controle. O serializador faz os escapes e preserva um JSON válido.'),
            gen((rng) => {
              const n = randInt(rng, 1, 5);
              return num('Quantos itens o campo matches terá depois de serializar e desserializar?', n, `O relatório tem ${n} strings. A ida e volta preserva os itens, portanto o vetor recuperado tem comprimento ${n}.`, { visual: code(`#[test]
fn roundtrip() {
    let report = Report {
        matches: vec!["rust".into(); ${n}],
    };
    let json = serde_json::to_string(
        &report,
    ).unwrap();
    let back: Report =
        serde_json::from_str(&json)
            .unwrap();
    assert_eq!(back.matches.len(), ${n});
}`, [], 'Teste com Report no escopo') });
            }),
            fill('Qual função recupera Report a partir do texto JSON?', 'Na leitura do JSON, use ___.', ['serde_json::from_str'], ['std::env::args', 'std::fs::write', 'serde_json::to_string'], 'from_str interpreta o texto e produz o tipo indicado, por exemplo Report. O resultado pode ser Err se o documento ou seus campos não forem válidos.'),
            mcq('Falta derivar Serialize. Qual é o problema deste programa?', ['E0277: Report não implementa Serialize', 'E0382: o relatório foi movido duas vezes', 'E0308: matches precisa ser bool', 'compila porque to_string ignora o tipo'], 0, 'E0277: the trait bound `Report: serde::Serialize` is not satisfied. to_string exige Serialize no tipo recebido. Importe serde::Serialize e acrescente derive(Serialize) à struct.', { visual: code('struct Report {\n    matches: Vec<String>,\n}\nfn main() {\n    let r = Report {\n        matches: vec![],\n    };\n    let result =\n        serde_json::to_string(&r);\n    println!("{}", result.is_ok());\n}', [1, 9], 'Erro intencional — dependências presentes') }),
            codePuzzle('Dentro de uma função que retorna Result<(), Box<dyn std::error::Error>>, monte a ida e volta. Report já deriva as duas traits. Depois do trecho, devolva Ok(()).', [
              'let report = Report {',
              '    matches: vec!["rust".into()],',
              '};',
              'let json =\n    serde_json::to_string(&report)?;',
              'let back: Report =\n    serde_json::from_str(&json)?;',
              'println!("{}", back.matches.len());',
            ], ['let json =\n    serde_json::to_string(report)?;', 'let back: Report =\n    serde_json::from_str(&json);', 'println!("{}", json.matches.len());'], 'Crie os dados, serialize por empréstimo e interprete o texto como Report. Ambos os ? propagam erros. O vetor recuperado contém uma string, então a saída é 1 e uma quebra de linha.'),
            mcq('Qual teste final detecta texto extra que tornaria a saída JSON inválida?', ['ler stdout inteiro com from_str e verificar matches', 'procurar apenas a palavra rust com contains', 'conferir que stderr tem a ajuda', 'exigir status 1 em toda busca vazia'], 0, 'Interpretar stdout inteiro como Report exige um documento JSON válido e permite conferir os dados. Uma linha de progresso antes do objeto faria a leitura falhar; contains não detectaria isso.'),
          ],
        },
      ],
    },
  ],
};
