import React from 'react';
import type { UnitDef, VisualSpec } from '../../types';
import { code, fill, gen, match, mcq, multi, num, order, table, tf } from '../../helpers';
import { codePuzzle } from '../../codePractice';
import { randInt } from '../../../lib/random';
import { Pt } from '../../../components/plot/Plot';
import { C } from '../../../theme';

// O passo selecionado mostra a mudança de estado, além da listagem.
const trace = (states: string[]): VisualSpec => ({
  name: 'stepper',
  props: {
    steps: states.length,
    view: { xMin: -0.5, xMax: states.length - 0.5, yMin: -1, yMax: 1 },
    render: (k: number) => <>{states.map((_, i) => <Pt key={i} x={i} y={0} r={i === k ? 8 : 4} color={i === k ? C.gold : C.textMuted} />)}</>,
    info: (k: number) => states[k],
  },
});

const unitTest = `fn depositar(s: &mut i64, v: i64) {
    *s += v;
}

#[cfg(test)]
mod tests {
    use super::depositar;

    #[test]
    fn deposito_aumenta_saldo() {
        let mut saldo = 0;
        depositar(&mut saldo, 100);
        assert_eq!(saldo, 100);
        assert!(saldo > 0);
    }
}`;

const panicTest = `#[test]
#[should_panic(expected = "limite")]
fn detecta_bug() {
    panic!("limite violado");
}`;

const resultTest = `#[test]
fn converte() -> Result<(), String> {
    let n = "42".parse::<i32>()
        .map_err(|e| e.to_string())?;
    assert_eq!(n, 42);
    Ok(())
}`;

const library = `pub fn depositar(
    s: i64,
    v: i64,
) -> i64 {
    s + v
}`;

const integration = `use banco::depositar;

#[test]
fn dois_depositos() {
    let saldo = depositar(0, 40);
    let saldo = depositar(saldo, 60);
    assert_eq!(saldo, 100);
}`;

const docTest = `/// Soma um depósito ao saldo.
///
/// \`\`\`
/// use banco::depositar;
/// let saldo = depositar(0, 100);
/// assert_eq!(saldo, 100);
/// \`\`\`
pub fn depositar(
    s: i64,
    v: i64,
) -> i64 {
    s + v
}`;

const commands = `cargo fmt
cargo fmt --check
cargo test
cargo clippy -- -D warnings`;

const unused = `fn main() {
    let saldo = 100;
    println!("Pronto");
}`;

const red = `pub fn depositar(
    s: i64,
    v: i64,
) -> i64 {
    s - v
}

#[test]
fn deposito() {
    assert_eq!(depositar(0, 100), 100);
}`;

const withdraw = `pub fn sacar(
    s: &mut i64,
    v: i64,
) -> Result<(), &'static str> {
    if v <= 0 || v > *s {
        return Err("saque invalido");
    }
    *s -= v;
    Ok(())
}`;

export const rustTestes: UnitDef = {
  id: 'rp-test', title: 'Testes e qualidade', icon: '✅',
  subtitle: 'Comportamento verificável, documentação viva e zero avisos',
  source: 'The Rust Programming Language, edição 2024, cap. 11 e seção 12.4 (TDD); rustdoc Book: Documentation tests; documentação oficial de Clippy e rustfmt. Desafio 50 Dias — Rust, módulo 4, exercício 28.',
  guide: 'Um teste prepara dados, executa uma ação e verifica o efeito. `assert!` exige uma condição verdadeira; `assert_eq!` compara valores. Testes de unidade ficam junto do código, em um módulo condicionado a testes; integração usa a API pública por arquivos em `tests/`; doc tests mantêm exemplos executáveis na documentação. Filtrar testes ajuda a investigar, mas a entrega exige a suíte inteira. TDD: observar a falha, implementar, refatorar e testar de novo. Use `cargo fmt --check`, `cargo test` e `cargo clippy -- -D warnings`. Regra deste desafio: zero avisos e nenhum `unwrap` ou `expect` fora de testes.',
  extra: true,
  lessons: [
    {
      id: 'rp-test-unit', title: 'Testes de unidade', parts: [
        {
          card: [
            {
              title: 'Preparar, agir e conferir',
              body: 'Um teste é uma função marcada com `#[test]`. Em `src/lib.rs`, o módulo `tests` costuma receber `#[cfg(test)]`: ele entra na compilação de testes e fica fora do build comum. `use super::depositar` acessa a função no módulo pai, mesmo privada. O teste passa se terminar sem panic. `assert_eq!` compara os valores e `assert!` verifica uma condição booleana.',
              visual: code(unitTest, [5, 9, 12, 13, 14], 'src/lib.rs · cargo test'),
              tip: 'Como no assert de C, uma condição falsa causa falha. Aqui o executor do Cargo reúne os resultados dos testes.',
            },
            {
              title: 'Veja o saldo mudar',
              body: 'Avance nos pontos: os três últimos mostram preparação, ação e verificação do teste acima.',
              visual: trace(['O Cargo descobre a função marcada como teste.', 'Preparar: saldo vale 0.', 'Agir: depósito de 100 deixa saldo em 100.', 'Conferir: igualdade com 100 e saldo positivo são verdadeiros.']),
            },
          ],
          exercises: [
            mcq('Qual atributo marca uma função como teste?', ['`#[test]`', '`#[derive(Debug)]`', '`#[allow(unused)]`', '`#[inline]`'], 0, '`#[test]` permite que o executor descubra a função. O nome tests é uma convenção para o módulo, não o marcador da função.'),
            num('Qual saldo o teste confere depois do depósito?', 100, 'O saldo começa em zero e recebe mais 100; a igualdade esperada é com 100.', { visual: code(unitTest, [11, 12, 13]) }),
            tf('O módulo tests filho pode testar uma função privada do módulo pai.', true, 'As regras de privacidade permitem ao módulo filho acessar itens do ancestral. O import com super traz a função do pai para o escopo.'),
            match('Ligue cada ferramenta ao papel:', [['`assert!`', 'verificar um bool'], ['`assert_eq!`', 'comparar valores'], ['`#[cfg(test)]`', 'incluir apenas na configuração de testes']], 'O atributo controla compilação; as duas macros verificam resultados durante a execução.'),
            gen((rng) => {
              const s = randInt(rng, 1, 8) * 10;
              const v = randInt(rng, 1, 9) * 10;
              return num('Que número deve substituir o comentário na comparação para o teste passar?', s + v, `O saldo começa em ${s} e aumenta ${v}: o valor esperado é ${s + v}.`, { visual: code(`#[test]\nfn deposito() {\n    let mut saldo = ${s};\n    saldo += ${v};\n    assert_eq!(saldo, /* esperado */ 0);\n}`, [5], 'Compila, mas a comparação falha') });
            }),
            { ...fill('Complete a descrição do atributo mostrado:', 'O módulo é compilado na configuração de ___.', ['testes'], ['release', 'documentação apenas', 'execução comum'], 'A condição test é ativada ao compilar o executável de testes; um build comum não inclui esse módulo.'), visual: code(unitTest, [5]) },
            mcq('O teste abaixo compila? Qual é o diagnóstico principal?', ['Não: E0308, assert exige bool.', 'Sim: números não nulos são true.', 'Não: E0382, saldo foi movido.', 'Sim: assert compara com zero.'], 0, 'E0308: `mismatched types`, expected `bool`, found integer. Rust não converte inteiro em bool. Corrija passando uma comparação, como verificar se o saldo é positivo.', { visual: code(`#[test]\nfn saldo_valido() {\n    let saldo = 100;\n    assert!(saldo);\n}`, [4], 'Erro de tipo intencional') }),
            codePuzzle('Monte um teste: prepare o saldo, deposite 25 e confira o total. Preserve a sequência preparar → agir → conferir.', ['#[test]', 'fn deposito() {', '    let mut saldo = 0;', '    saldo += 25;', '    assert_eq!(saldo, 25);', '}'], ['    let saldo = 0;', '    assert_eq!(saldo, 0);'], 'O atributo vem antes da função. A variável precisa ser mutável; depois da soma o saldo é 25, que deve ser verificado.'),
          ],
        },
        {
          card: [
            {
              title: 'Panic esperado e Result',
              body: 'Um teste com `#[should_panic]` passa quando há panic; com `expected`, a mensagem precisa conter o texto indicado. Use isso para contratos que realmente prometem panic. Entrada inválida esperada costuma retornar `Err`, que você testa como valor. O trecho demonstra só o mecanismo do executor.',
              visual: code(panicTest, [2], 'Teste de panic intencional'),
            },
            {
              title: 'O teste também pode devolver Result',
              body: 'Aqui `?` propaga uma falha de conversão como `Err`; o executor marca o teste como falho. `Ok(())` significa sucesso se nenhuma asserção falhou. Não combine um teste que devolve `Result` com `#[should_panic]`: escreva um teste separado que retorna a unidade.',
              visual: code(resultTest, [2, 3, 4, 6], 'src/lib.rs · teste de conversão'),
            },
            {
              title: 'No seu computador',
              body: 'Base: exercício 28 do roteiro. Crie `cargo new --lib banco_unit`, entre na pasta e implemente uma Conta com saldo privado, métodos de depósito e saque retornando Result. Teste depósito de 100, saque maior que o saldo com `is_err` e saldo preservado após rejeição. Acrescente um teste que retorna Result e usa `?`. Pronto: todos passam em `cargo test`; `cargo fmt --check` e `cargo clippy -- -D warnings` terminam sem avisos. Nenhum unwrap ou expect fora de testes.',
              visual: code(`cargo new --lib banco_unit
cd banco_unit
cargo test
cargo fmt
cargo fmt --check
cargo clippy -- -D warnings`, [], 'Terminal · edição 2024 no Cargo.toml'),
            },
          ],
          exercises: [
            mcq('Qual resultado tem o teste de panic mostrado?', ['Passa: a mensagem contém limite.', 'Falha: todo panic reprova.', 'Não compila: panic é proibido em teste.', 'É ignorado pelo executor.'], 0, 'O atributo inverte a expectativa: esse teste deve causar panic e a mensagem contém o trecho limite.', { visual: code(panicTest) }),
            tf('Um Result com Err provoca, por si só, um panic.', false, 'Err é um valor. Um teste comum deve verificar o erro com uma asserção; um teste que retorna Result pode propagar Err para o executor.'),
            mcq('Como verificar uma operação rejeitada que devolve Result?', ['Conferir is_err com assert.', 'Marcar sempre com should_panic.', 'Apagar o resultado.', 'Trocar o retorno por impressão.'], 0, 'is_err informa se o valor é Err; a asserção exige essa condição. should_panic procuraria um panic, que o retorno Err não produz.'),
            mcq('Se a conversão de 42 der certo, como termina esse teste?', ['Com Ok e aprovação.', 'Com Err e aprovação.', 'Com panic obrigatório.', 'Sem ser executado.'], 0, 'O parse produz 42, a igualdade é verdadeira e a última expressão devolve Ok(()).', { visual: code(resultTest) }),
            gen((rng) => {
              const n = randInt(rng, 10, 90);
              return num('Que inteiro o teste compara com o valor convertido?', n, `O texto contém os dígitos de ${n}; parse para i32 produz exatamente ${n}. O ponto de interrogação só propaga se houver erro.`, { visual: code(`#[test]\nfn le() -> Result<(), String> {\n    let n = "${n}".parse::<i32>()\n        .map_err(|e| e.to_string())?;\n    assert_eq!(n, ${n});\n    Ok(())\n}`) });
            }),
            multi('Marque as duas condições necessárias para o teste de panic mostrado passar:', ['Ocorre um panic.', 'A mensagem contém limite.', 'A função devolve Err.', 'A função termina normalmente.'], [0, 1], 'Com expected, apenas ocorrer panic não basta: o texto esperado deve aparecer como trecho da mensagem.', { visual: code(panicTest) }),
            order('Ordene a investigação de um teste que falhou:', ['Ler o nome do teste que falhou', 'Comparar resultado obtido e esperado', 'Corrigir a causa no código ou na expectativa', 'Executar novamente o teste'], 'Primeiro localize a falha e confronte o contrato. Só então corrija e confirme a mudança executando de novo.'),
            codePuzzle('Monte um teste com Result: produza o valor, propague o erro, confira e finalize com sucesso.', ['#[test]', 'fn valor() -> Result<(), String> {', '    let r: Result<i32, String> = Ok(8);', '    let n = r?;', '    assert_eq!(n, 8);', '    Ok(())', '}'], ['    Err("falha".to_string())', '    assert_eq!(n, 9);'], 'A variável r deve existir antes do ?. O valor n só existe depois da extração; a asserção vem antes do retorno Ok, que é a expressão final sem ponto e vírgula.'),
          ],
        },
      ],
    },
    {
      id: 'rp-test-integ', title: 'Testes de integração e doc tests', parts: [
        {
          card: [
            {
              title: 'Olhar de quem usa a biblioteca',
              body: 'Crie o pacote com `cargo new --lib banco`. A API fica em `src/lib.rs`; um teste em `tests/fluxo.rs` usa a crate banco como um cliente externo. Cada arquivo diretamente em tests vira uma crate de teste separada. Ele acessa a API pública; não precisa de `#[cfg(test)]` nesse arquivo.',
              visual: code(library, [], 'banco/src/lib.rs'),
            },
            {
              title: 'Juntar duas chamadas',
              body: 'No arquivo separado, importe a função pública. `cargo test --test fluxo` escolhe o alvo do arquivo fluxo; `cargo test deposito` filtra nomes que contêm deposito. Para seleção exata, use o nome completo do teste com `-- --exact`. Esses comandos têm papéis diferentes.',
              visual: code(integration, [1, 5, 6, 7], 'banco/tests/fluxo.rs'),
            },
            {
              title: 'Um percurso pela fronteira pública',
              body: 'Avance para acompanhar os dois depósitos sem acessar a implementação da função.',
              visual: trace(['O teste importa banco como crate externa.', 'Primeira chamada: saldo 0 recebe 40 e retorna 40.', 'Segunda chamada: saldo 40 recebe 60 e retorna 100.', 'A asserção compara o resultado público com 100.']),
            },
          ],
          exercises: [
            mcq('Onde fica o arquivo do teste de integração apresentado?', ['tests/fluxo.rs', 'target/fluxo.rs', 'src/main.toml', 'Cargo.lock'], 0, 'O diretório tests na raiz do pacote guarda os testes de integração descobertos pelo Cargo.'),
            num('Qual saldo final é verificado em fluxo.rs?', 100, 'A primeira chamada retorna 40 e a segunda soma 60 a esse resultado, chegando a 100.', { visual: code(integration) }),
            tf('Um teste de integração pode chamar diretamente qualquer função privada da biblioteca.', false, 'Ele é uma crate externa; só consegue usar o que a biblioteca expõe publicamente. Testes de unidade no módulo filho têm outra relação de privacidade.'),
            match('Associe comando e seleção:', [['cargo test --test fluxo', 'alvo tests/fluxo.rs'], ['cargo test deposito', 'nomes contendo deposito'], ['cargo test --lib', 'testes de unidade da biblioteca']], 'O seletor de alvo escolhe um executável de testes. O filtro por nome escolhe testes dentro dos alvos selecionados.'),
            gen((rng) => {
              const a = randInt(rng, 2, 8) * 10;
              const b = randInt(rng, 1, 6) * 10;
              return num('Usando a API pública apresentada, qual saldo o teste deve esperar?', a + b, `depositar devolve a soma: primeiro ${a}, depois ${a} + ${b} = ${a + b}.`, { visual: code(`use banco::depositar;\n\n#[test]\nfn soma() {\n    let s = depositar(0, ${a});\n    let s = depositar(s, ${b});\n    assert_eq!(s, ${a + b});\n}`, [], 'tests/fluxo.rs · biblioteca acima') });
            }),
            mcq('Há três testes: deposito_simples, deposito_duplo e saque. Sem outros testes, quantos nomes passam pelo filtro?', ['Dois', 'Três', 'Um', 'Nenhum'], 0, 'O filtro deposito é uma busca por trecho do nome. Os dois primeiros nomes contêm esse trecho e saque fica de fora.', { visual: code('cargo test deposito', [], 'Terminal') }),
            mcq('Qual comando executa só tests/fluxo.rs e, nele, só o nome exato dois_depositos?', ['cargo test --test fluxo dois_depositos -- --exact', 'cargo test --doc', 'cargo test --lib', 'cargo build --release'], 0, 'O alvo é escolhido por --test; o nome é o filtro; --exact é uma opção do executor e por isso vem depois do separador --.'),
            codePuzzle('Monte tests/fluxo.rs usando a biblioteca banco acima. O primeiro bloco abre o arquivo e a função; faça duas chamadas dependentes e confira o total.', ['use banco::depositar;\n#[test]\nfn fluxo() {', '    let s = depositar(0, 40);', '    let s = depositar(s, 60);', '    assert_eq!(s, 100);', '}'], ['use super::depositar;', '    assert_eq!(s, 60);'], 'O import vem no topo deste arquivo. O segundo depósito precisa do saldo devolvido pelo primeiro; a asserção só pode conferir o total depois das duas chamadas.'),
          ],
        },
        {
          card: [
            {
              title: 'Exemplo que também verifica',
              body: 'Comentários `///` documentam o item seguinte. Um bloco Rust entre três crases vira doc test: o rustdoc compila e executa o exemplo. A asserção confere o resultado; apenas imprimir não verificaria o valor. O import usa o nome da crate como um usuário da biblioteca.',
              visual: code(docTest, [3, 4, 5, 6, 7], 'banco/src/lib.rs · cargo test --doc'),
            },
            {
              title: 'Três pontos de observação',
              body: 'Os testes se complementam. `cargo test` inclui os doc tests da biblioteca na execução padrão; `cargo test --doc` permite rodá-los isoladamente. Exemplos marcados como ignorados não dão a mesma garantia de execução.',
              visual: table(['Tipo', 'O que observa'], [['Unidade', 'Função ou módulo de perto'], ['Integração', 'API pública em conjunto'], ['Doc test', 'Exemplo público executável']]),
            },
            {
              title: 'No seu computador',
              body: 'Continue o exercício 28: crie `cargo new --lib banco` ou use uma biblioteca equivalente. Coloque a Conta em src/lib.rs. Em tests/fluxo.rs, use apenas a API pública para depositar 100 e rejeitar saque de 1000 sem alterar saldo. Documente um método público com um bloco Rust executável em ///. Pronto: `cargo test --test fluxo`, `cargo test --doc` e a suíte completa passam; formatação conferida e `cargo clippy -- -D warnings` sem avisos. Mantenha unwrap e expect restritos aos testes.',
              visual: code(`cargo new --lib banco
cd banco
cargo test --test fluxo
cargo test --doc
cargo test
cargo fmt
cargo fmt --check
cargo clippy -- -D warnings`, [], 'Terminal · após escrever os arquivos'),
            },
          ],
          exercises: [
            mcq('Qual comando seleciona os exemplos de documentação da biblioteca?', ['cargo test --doc', 'cargo doc --open', 'cargo fmt', 'cargo run'], 0, 'cargo test --doc executa doc tests. Gerar ou abrir a documentação com cargo doc não substitui a execução dos exemplos.'),
            tf('No exemplo mostrado, retirar a asserção mantém uma verificação automática do saldo esperado.', false, 'O exemplo ainda poderia compilar e executar com um saldo errado. A asserção é o que torna a expectativa de valor verificável.', { visual: code(docTest, [6]) }),
            num('Qual é o valor esperado pelo doc test?', 100, 'O exemplo público chama depositar com saldo zero e valor 100, então a soma esperada é 100.', { visual: code(docTest) }),
            { ...fill('Complete a função dos comentários de três barras:', 'Eles geram ___ para o item seguinte.', ['documentação'], ['um executável extra obrigatório', 'uma variável global', 'um import privado'], '/// é comentário de documentação do item que vem em seguida; os blocos Rust dessa documentação podem ser testados.'), visual: code(docTest, [1]) },
            gen((rng) => {
              const s = randInt(rng, 1, 9);
              const v = randInt(rng, 2, 8);
              return num('Que total esse doc test compara com a soma?', s + v, `O exemplo usa saldo ${s} e depósito ${v}. O total esperado é ${s + v}.`, { visual: code(`/// \`\`\`\n/// use banco::depositar;\n/// let s = depositar(${s}, ${v});\n/// assert_eq!(s, ${s + v});\n/// \`\`\`\npub fn depositar(\n    s: i64,\n    v: i64,\n) -> i64 {\n    s + v\n}`, [], 'banco/src/lib.rs') });
            }),
            match('Associe o local à perspectiva do teste:', [['módulo tests em src/lib.rs', 'detalhe interno'], ['arquivo tests/fluxo.rs', 'cliente externo da API'], ['bloco Rust em ///', 'exemplo da documentação']], 'A localização determina o contexto: módulo filho, crate externa ou exemplo compilado pelo rustdoc.'),
            mcq('A função pública mudou de comportamento. Qual cuidado protege quem copia a documentação?', ['Manter o exemplo fiel ao contrato e rodar os doc tests.', 'Ignorar todos os exemplos.', 'Remover as asserções.', 'Rodar apenas cargo fmt.'], 0, 'A documentação precisa descrever o contrato atual e ser executada. Um exemplo que só foi formatado ainda pode estar incorreto.'),
            codePuzzle('Monte um doc test para a nova função soma em banco/src/lib.rs. Use a declaração antes da asserção; os dois últimos blocos definem a função documentada.', ['/// ```', '/// let n = banco::soma(2, 3);', '/// assert_eq!(n, 5);', '/// ```\npub fn soma(s: i64, v: i64) -> i64 {', '    s + v', '}'], ['/// assert_eq!(n, 6);', '    s - v'], 'O bloco de documentação abre com três crases; o nome n precisa ser definido antes da comparação. O fechamento do bloco e a assinatura estão juntos para ligar a documentação à função correta.'),
          ],
        },
      ],
    },
    {
      id: 'rp-test-ferr', title: 'clippy, rustfmt e avisos', parts: [
        {
          card: [
            {
              title: 'Cada ferramenta responde uma pergunta',
              body: '`cargo fmt` aplica rustfmt ao projeto. `cargo fmt --check` verifica a formatação sem reescrever os arquivos. `cargo test` confere os comportamentos cobertos pelos testes. Clippy analisa padrões e sugere melhorias; no desafio, `cargo clippy -- -D warnings` transforma avisos habilitados em erros e deve terminar com sucesso.',
              visual: code(commands, [], 'Terminal · portas de qualidade'),
              tip: 'O separador -- encaminha os argumentos seguintes ao Clippy. A regra -D warnings inclui avisos do compilador; não ativa todo lint opcional existente.',
            },
            {
              title: 'Do texto à entrega',
              body: 'Avance e veja o que cada etapa consegue detectar. Sucesso em uma etapa não substitui as outras.',
              visual: trace(['Arquivo salvo: ainda não sabemos se há problemas.', 'rustfmt confere o estilo do texto.', 'Os testes executam os casos que você escreveu.', 'Clippy analisa padrões; zero avisos habilitados permite passar esta etapa.']),
            },
          ],
          exercises: [
            mcq('Qual comando reescreve a formatação dos fontes Rust?', ['cargo fmt', 'cargo test', 'cargo build --release', 'cargo doc'], 0, 'cargo fmt aplica rustfmt. Ele ajusta o estilo; não implementa a regra de negócio nem cria testes.'),
            mcq('Qual comando verifica formatação sem alterar os fontes?', ['cargo fmt --check', 'cargo fmt', 'cargo run', 'cargo clean'], 0, 'O modo --check retorna falha se a formatação divergir, permitindo conferir o projeto sem editar os arquivos.'),
            tf('O comando clippy com -D warnings transforma avisos habilitados em erro.', true, 'D é deny: o diagnóstico passa a bloquear a execução bem-sucedida do comando. Isso também inclui avisos de rustc.'),
            match('Relacione ferramenta e objetivo:', [['rustfmt', 'padronizar formatação'], ['executor de testes', 'executar casos e asserções'], ['Clippy', 'analisar padrões do código']], 'As verificações são complementares: aparência consistente, comportamento coberto e análise estática.'),
            gen((rng) => {
              const n = randInt(rng, 2, 8);
              const f = randInt(rng, 1, n - 1);
              return num(`Uma rodada tem ${n} testes: ${f} falham e os outros passam. Quantos passam?`, n - f, `Subtraia as falhas do total: ${n} menos ${f} é ${n - f}. Mesmo assim a rodada completa falha, pois há pelo menos um teste reprovado.`);
            }),
            mcq('Para onde vai -D warnings no comando mostrado?', ['Para a ferramenta de análise após o separador.', 'Para o programa como entrada de teclado.', 'Para o nome do pacote.', 'Para o arquivo Cargo.lock.'], 0, 'O separador -- encerra as opções do Cargo e encaminha os argumentos seguintes à ferramenta chamada.', { visual: code('cargo clippy -- -D warnings', [], 'Terminal') }),
            mcq('Todos os testes passam, mas fmt --check falha. Qual é a ação adequada?', ['Rodar cargo fmt e repetir a conferência.', 'Apagar os testes.', 'Trocar a resposta esperada.', 'Publicar sem conferir o estilo.'], 0, 'Os testes não cuidam da formatação. Aplique rustfmt e confirme novamente; depois complete as demais verificações da entrega.'),
            codePuzzle('Monte o teste que confere uma string aparada. Primeiro declare o texto, depois derive a visão e verifique. Esse é um caso executado por cargo test.', ['#[test]', 'fn trim_text() {', '    let text = " Rust ";', '    let clean = text.trim();', '    assert_eq!(clean, "Rust");', '}'], ['    assert_eq!(clean, " Rust ");', '    let clean = text.len();'], 'trim devolve uma visão sem os espaços das pontas. A cadeia de dependências é text, clean e asserção. Formatar este teste não muda a resposta esperada.'),
          ],
        },
        {
          card: [
            {
              title: 'Aviso pede uma decisão',
              body: 'Este programa compila e imprime Pronto, mas a variável saldo não é usada: o compilador emite o lint `unused_variables`. Com `-D warnings`, esse aviso bloqueia a verificação. Se o saldo importa, use-o; se a declaração é sobra, remova-a. Prefixo com sublinhado é para um valor intencionalmente não usado, com motivo claro.',
              visual: code(unused, [2], 'Compila com aviso · src/main.rs'),
            },
            {
              title: 'Corrigir sem mudar o contrato',
              body: 'Uma condição já produz bool, então devolva a própria comparação. As duas versões da função abaixo compilam e têm o mesmo resultado. Clippy pode apontar `needless_bool` na primeira. Os nomes dos lints são diferentes de códigos E0xxx de erros de tipo.',
              visual: code(`pub fn positive(n: i32) -> bool {
    if n > 0 { true } else { false }
}

pub fn positive_clean(n: i32) -> bool {
    n > 0
}`, [2, 6], 'Antes e depois · src/lib.rs'),
            },
            {
              title: 'No seu computador',
              body: 'No projeto do exercício 28, adicione uma variável local não usada de propósito e observe a diferença entre build comum e Clippy com avisos negados. Corrija a causa e remova esse experimento. Confira também testes com `cargo clippy --all-targets -- -D warnings`. Pronto: formatação conferida, suíte inteira passando e os dois comandos Clippy sem avisos. A regra do módulo 4 proíbe unwrap e expect fora de testes; o comando padrão de Clippy sozinho não garante essa regra.',
              visual: code(`cargo build
cargo fmt
cargo fmt --check
cargo test
cargo clippy -- -D warnings
cargo clippy --all-targets -- -D warnings`, [], 'Terminal · no pacote da Conta'),
            },
          ],
          exercises: [
            mcq('O que o programa mostrado imprime na saída padrão?', ['Pronto', '100', 'saldo', 'Não chega a executar.'], 0, 'O aviso não impede um build comum. A única impressão contém Pronto; o saldo declarado não participa dela.', { visual: code(unused) }),
            mcq('Qual é a origem do aviso no programa?', ['saldo é declarado e nunca lido.', 'println exige uma variável.', 'O inteiro 100 é inválido.', 'main precisa retornar Result.'], 0, 'A variável local não é usada. O lint é unused_variables; não se trata de um erro de tipo E0308.', { visual: code(unused, [2]) }),
            tf('Eliminar avisos garante que não há bugs de regra de negócio.', false, 'A análise estática não conhece todos os requisitos. Uma implementação pode estar bem formatada e sem avisos, mas calcular o saldo errado.'),
            gen((rng) => {
              const n = randInt(rng, -5, 5);
              return mcq('O que a função devolve para a entrada mostrada no teste?', ['true', 'false', 'Err', 'panic'], n > 0 ? 0 : 1, `${n} ${n > 0 ? 'é' : 'não é'} maior que zero. A comparação devolve ${n > 0 ? 'true' : 'false'} sem precisar de if.`, { visual: code(`fn positive(n: i32) -> bool {\n    n > 0\n}\n\n#[test]\nfn entrada() {\n    assert_eq!(positive(${n}), ${n > 0});\n}`) });
            }),
            multi('Quais duas atitudes atendem à regra deste desafio?', ['Corrigir avisos antes da entrega.', 'Evitar unwrap e expect no código de produção.', 'Supor que Clippy padrão proíbe todo unwrap.', 'Colocar allow em tudo para silenciar.'], [0, 1], 'A regra exige zero avisos e restringe extrações que podem causar panic. Clippy padrão não habilita todos os lints opcionais; revise o uso de unwrap e expect separadamente.'),
            mcq('Qual troca preserva o contrato de positive para todos os i32?', ['Devolver diretamente a comparação com zero.', 'Devolver sempre true.', 'Trocar maior por maior ou igual.', 'Remover o parâmetro e sortear o resultado.'], 0, 'O ramo true é escolhido exatamente quando a comparação é verdadeira. Devolver essa comparação preserva inclusive o caso zero.'),
            codePuzzle('Monte a função de teste sem variável sobrando. Verifique que o texto vazio fica vazio após trim.', ['#[test]', 'fn empty_trim() {', '    let text = String::new();', '    let clean = text.trim();', '    assert!(clean.is_empty());', '}'], ['    assert!(!clean.is_empty());', '    let clean = text.len();'], 'String::new cria texto vazio; trim devolve uma visão vazia. is_empty produz o bool exigido por assert e todos os valores declarados são usados.'),
            mcq('Por que acrescentar --all-targets à verificação Clippy?', ['Para incluir também alvos como os testes.', 'Para executar doc tests automaticamente.', 'Para formatar todos os arquivos.', 'Para provar cobertura completa dos requisitos.'], 0, 'A opção amplia os alvos analisados, incluindo os testes. Analisar código de teste não equivale a executá-lo nem a medir cobertura.', { visual: code('cargo clippy --all-targets -- -D warnings', [], 'Terminal') }),
          ],
        },
      ],
    },
    {
      id: 'rp-test-tdd', title: 'Desenvolvendo guiado por testes', parts: [
        {
          card: [
            {
              title: 'Vermelho: uma falha que ensina',
              body: 'TDD começa por escrever um teste do comportamento desejado e vê-lo falhar pelo motivo esperado. O código mostrado compila, mas subtrai o depósito e faz a comparação falhar: o resultado é menos 100. Isso é falha de execução da asserção, sem código E0xxx de compilação. Corrija a soma e veja o teste ficar verde; depois refatore preservando o comportamento.',
              visual: code(red, [5, 10], 'src/lib.rs · implementação com bug'),
            },
            {
              title: 'Acompanhe o ciclo',
              body: 'Avance: a expectativa fica fixa enquanto a implementação muda. O último passo prepara o próximo requisito.',
              visual: trace(['Vermelho: depósito de 100 retorna menos 100; o teste falha.', 'Verde: corrigir subtração para soma faz o teste passar.', 'Refatorar: melhorar nomes e organização com a suíte verde.', 'Novo ciclo: acrescentar o caso de dois depósitos acumulados.']),
            },
          ],
          exercises: [
            mcq('No começo de um ciclo TDD, qual é a meta?', ['Observar um teste falhar pelo motivo esperado.', 'Escrever toda a aplicação.', 'Apagar as asserções.', 'Mudar a expectativa até ficar verde.'], 0, 'Uma falha observada demonstra que o teste detecta o comportamento ainda ausente. É preciso entender a causa antes de implementar.'),
            num('Que valor a implementação com bug devolve para depositar(0, 100)?', -100, 'A função calcula saldo menos valor: zero menos 100 é menos 100. O teste exige mais 100 e por isso falha.', { visual: code(red, [5]) }),
            tf('A comparação que falha nesse exemplo é um erro E0308.', false, 'Os tipos são compatíveis e a compilação termina. A falha ocorre quando assert_eq compara valores diferentes durante a execução.', { visual: code(red, [10]) }),
            order('Ordene um ciclo TDD:', ['Escrever e observar o teste falhar', 'Implementar o comportamento necessário', 'Executar e ver o teste passar', 'Refatorar e executar a suíte novamente'], 'Vermelho confirma a lacuna; verde confirma a implementação; refatoração melhora a estrutura sem mudar a regra verificada.'),
            gen((rng) => {
              const s = randInt(rng, 2, 8) * 10;
              const v = randInt(rng, 1, 9) * 10;
              return num('Que valor o teste correto deve esperar, em vez do resultado da implementação com bug?', s + v, `O contrato é somar o depósito: ${s} + ${v} = ${s + v}. A implementação mostrada subtrai e deve ser corrigida; não adapte o contrato ao bug.`, { visual: code(`fn depositar(s: i64, v: i64) -> i64 {\n    s - v\n}\n\n#[test]\nfn deposito() {\n    assert_eq!(depositar(${s}, ${v}), ${s + v});\n}`, [2], 'Compila; teste falha pelo bug') });
            }),
            mcq('Depois de corrigir a soma, qual teste amplia melhor a proteção contra sobrescrever o saldo?', ['Dois depósitos seguidos acumulam o total.', 'Sempre comparar 1 com 1.', 'Verificar só que a função existe.', 'Exigir que cargo fmt imprima o saldo.'], 0, 'Um segundo depósito sobre saldo já existente detecta uma implementação que devolve apenas o último valor em vez de acumular.'),
            { ...fill('Complete o objetivo da refatoração:', 'Melhorar a estrutura preservando o ___ observado.', ['comportamento'], ['bug', 'número de avisos', 'nome do executável'], 'Refatorar preserva o contrato. Rode a suíte depois da reorganização para procurar regressões.'), visual: code(library, [5], 'Implementação corrigida') },
            codePuzzle('Monte o teste contra sobrescrever o saldo: o segundo depósito usa o resultado do primeiro. A biblioteca banco fornece a soma correta.', ['#[test]', 'fn acumula() {', '    let s = banco::depositar(0, 30);', '    let s = banco::depositar(s, 20);', '    assert_eq!(s, 50);', '}'], ['    let s = banco::depositar(0, 20);', '    assert_eq!(s, 20);'], 'Use em tests/fluxo.rs de banco. O primeiro saldo é 30, o segundo é 30 + 20 = 50. Reiniciar o saldo em zero perderia o histórico.'),
          ],
        },
        {
          card: [
            {
              title: 'Proteger o saldo quando há erro',
              body: 'Amplie o exercício 28: o saque deve rejeitar valor não positivo ou maior que o saldo, sem alterar a conta. Primeiro teste esses casos. A função abaixo valida antes de modificar; só um saque válido chega à subtração. Valores estão em centavos inteiros, evitando comparar dinheiro em ponto flutuante.',
              visual: code(withdraw, [5, 6, 8], 'src/lib.rs · núcleo do saque'),
            },
            {
              title: 'Teste de regressão',
              body: 'Um teste de regressão guarda o caso que revelou um bug. Esta função de teste fica no módulo tests em src/lib.rs, junto da função sacar apresentada. Uma rejeição deve preservar tanto o tipo do resultado quanto o saldo. Não compartilhe uma conta mutável global entre os testes: prepare uma conta nova em cada um.',
              visual: code(`#[test]
fn rejeita_sem_alterar() {
    let mut s = 100;
    let r = super::sacar(&mut s, 1000);
    assert!(r.is_err());
    assert_eq!(s, 100);
}`, [5, 6], 'Dentro de mod tests'),
            },
            {
              title: 'No seu computador',
              body: 'Crie `cargo new --lib conta_tdd` e faça o exercício 28 por ciclos. Modele Conta com saldo privado; deposite 100, saque 40 e confira 60. Rejeite zero, valor negativo e saque de 1000, mantendo o saldo. Aceite sacar exatamente o saldo. Para cada regra, observe primeiro uma falha útil, implemente e refatore. Pronto: testes independentes de unidade, um fluxo em tests/ e um doc test passam na suíte completa; `cargo fmt --check` e `cargo clippy -- -D warnings` têm sucesso sem avisos. Não use unwrap nem expect fora dos testes.',
              visual: code(`cargo new --lib conta_tdd
cd conta_tdd
cargo test rejeita
cargo test
cargo fmt
cargo fmt --check
cargo clippy -- -D warnings
cargo clippy --all-targets -- -D warnings`, [], 'Terminal · escreva os testes por ciclos'),
            },
          ],
          exercises: [
            mcq('Para sacar 1000 de um saldo 100, qual é o contrato?', ['Devolver Err e manter saldo 100.', 'Devolver Ok e manter saldo 100.', 'Devolver Err e deixar saldo negativo.', 'Causar panic para toda entrada inválida.'], 0, 'A operação é recusada antes de modificar o estado. Erro esperado é representado por Result; a conta não pode perder saldo após a rejeição.', { visual: code(withdraw) }),
            num('Após sacar validamente 40 de 100, qual saldo deve ser verificado?', 60, 'As condições de rejeição são falsas: 40 é positivo e não supera 100. A subtração deixa 60 e a função devolve Ok.'),
            tf('Conferir somente is_err garante que o saldo ficou intacto.', false, 'Uma implementação com bug poderia alterar o saldo e ainda devolver Err. Por isso o teste precisa verificar também o estado posterior.'),
            multi('Quais duas entradas devem ser rejeitadas quando o saldo é 100?', ['Zero', 'Menos 1', 'Quarenta', 'Cem'], [0, 1], 'Valores não positivos são rejeitados. Quarenta é válido; cem também é, pois sacar exatamente o saldo deve zerar a conta.'),
            gen((rng) => {
              const s = randInt(rng, 3, 9) * 10;
              const v = s + randInt(rng, 1, 5) * 10;
              return num('Qual saldo deve restar depois desse saque recusado?', s, `O saque ${v} supera o saldo ${s}; a função retorna antes da subtração. O estado continua ${s}.`, { visual: code(`#[test]\nfn rejeita() {\n    let mut s = ${s};\n    let r = super::sacar(&mut s, ${v});\n    assert!(r.is_err());\n    assert_eq!(s, ${s});\n}`, [4, 5, 6], 'Dentro de mod tests · sacar acima') });
            }),
            mcq('Qual caso distingue a condição correta da versão que rejeita v >= saldo?', ['Sacar exatamente todo o saldo.', 'Sacar valor negativo.', 'Sacar acima do saldo.', 'Sacar zero.'], 0, 'O contrato aceita igualdade. Um teste que saca todo o saldo deve retornar Ok e deixar zero; a comparação >= rejeitaria esse caso indevidamente.'),
            codePuzzle('Monte um teste de regressão dentro de mod tests, usando sacar acima. Combine Err e saldo preservado na condição ok, depois confira essa condição.', ['#[test]', 'fn rejeita() {', '    let mut s = 100;', '    let r = super::sacar(&mut s, 1000);', '    let ok = r.is_err() && s == 100;', '    assert!(ok);', '}'], ['    let ok = r.is_ok() && s == 100;', '    assert!(!ok);'], 'O saldo existe antes do empréstimo mutável. A condição ok depende do resultado r e do saldo após a chamada; a asserção exige que ambos atendam ao contrato.'),
            mcq('Um teste filtrado passou após uma refatoração. O que falta para encerrar a entrega?', ['Rodar suíte completa, formatação e análise com zero avisos.', 'Apagar os casos de fronteira.', 'Considerar todos os demais testes aprovados.', 'Mover unwrap para a implementação.'], 0, 'Um filtro deixa testes de fora. A entrega exige conferir toda a suíte, incluindo integração e documentação, e completar as verificações de qualidade do desafio.'),
          ],
        },
      ],
    },
  ],
};
