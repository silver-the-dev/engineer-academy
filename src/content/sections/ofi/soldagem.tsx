import React from 'react';
import type { UnitDef } from '../../types';
import { gen, inter, match, mcq, num, order, plot, tf } from '../../helpers';
import { PolygonW, RectW, Seg } from '../../../components/plot/Plot';
import { C } from '../../../theme';
import { randInt } from '../../../lib/random';

const t = String.raw;

// Corte esquemático: a forma é uma ilustração, não um teste automático de qualidade.
const junta = () => plot({
  view: { xMin: -3, xMax: 3, yMin: -1, yMax: 3 }, grid: false,
  params: [{ key: 'modo', label: 'perfil', min: 0, max: 1, step: 1, value: 0, format: (v: number) => v ? 'boa' : 'fria' }],
  render: ({ p }: any) => <>
    <RectW x={-2.7} y={-0.5} w={5.4} h={0.5} color={C.p3} opacity={0.6} />
    <RectW x={-0.22} y={0} w={0.44} h={2.6} color={C.textMuted} opacity={0.9} />
    {p.modo ? <PolygonW pts={[[-1.8, 0], [-0.65, 0.2], [-0.22, 1.25], [0.22, 1.25], [0.65, 0.2], [1.8, 0]]} color={C.p2} opacity={0.7} /> : <PolygonW pts={[[-0.65, 0.15], [-0.8, 0.7], [-0.5, 1.2], [0.5, 1.2], [0.8, 0.7], [0.65, 0.15]]} color={C.danger} opacity={0.7} />}
    <Seg x1={-2.7} y1={0} x2={2.7} y2={0} color={C.gold} width={3} />
  </>,
  info: ({ p }: any) => p.modo ? 'Perfil ilustrativo: solda molha ilha e terminal.' : 'Perfil ilustrativo: massa arredondada com má molhagem.',
}, 220);

const exercicioJunta = (enunciado: string) => inter(enunciado, 'plot', junta().props, (v) => v.p.modo === 1, 'Selecione boa.', 'O perfil bom se espalha e molha a ilha e o terminal; aparência é indício, não prova elétrica.');

const contagem = (item: string) => gen((rng) => {
  const total = randInt(rng, 8, 15);
  const ruins = randInt(rng, 2, 5);
  return num(`De ${total} ${item}, ${ruins} precisam de correção. Quantas já passaram na inspeção?`, total - ruins,
    `${total} − ${ruins} = ${total - ruins} aprovadas.`, { unit: 'unidades', tol: 0 });
});

export const soldagem: UnitDef = {
  id: 'of-sold', title: 'Soldagem e prototipagem', icon: '🔥',
  subtitle: 'Juntas confiáveis, retrabalho e montagem definitiva',
  source: 'Passo 2 — Eletrônica Completa · Fase 8: Soldagem e Prototipagem Física',
  guide: t`Aqueça **ilha e terminal**, alimente a junta e deixe-a imóvel ao esfriar. Fluxo favorece a molhagem; uma junta boa cobre as duas superfícies sem excesso. Inspecione e teste continuidade e ausência de curtos com a placa desligada. Planeje conexões, conectores e fixação antes de montar.`,
  lessons: [
    {
      id: 'of-sold-ferr', title: 'Ferro, solda e fluxo', parts: [
        {
          card: { title: 'Ferramentas e calor', body: t`O ferro transfere calor à junta; a solda é a liga de adição e o fluxo ajuda a remover óxidos e a molhar o metal. Use ponta limpa e estanhada, suporte e extração localizada dos fumos. Não toque na ponta; lave as mãos após manusear solda, especialmente com chumbo.

Como ponto de partida, muitas montagens manuais usam cerca de $320$–$350\,°\text{C}$ com liga Sn/Pb e $350$–$380\,°\text{C}$ com liga sem chumbo. Ajuste conforme liga, ponta, massa térmica e fabricante: temperatura da ponta não é temperatura de fusão da liga.`, visual: junta() },
          exercises: [
            mcq('Qual ferramenta aquece a junta?', ['Ferro de solda', 'Multímetro', 'Alicate de corte', 'Régua'], 0, 'A ponta do ferro transfere calor para as peças.'),
            tf('O fluxo ajuda a remover óxidos e favorece a molhagem.', true, 'O fluxo atua nas superfícies durante o aquecimento; não substitui limpeza e técnica.'),
            mcq('Onde repousar o ferro quente entre juntas?', ['No suporte apropriado', 'Sobre os fios', 'Na borda da mesa', 'Na placa plástica'], 0, 'O suporte mantém a ponta quente afastada de pessoas e materiais.'),
            exercicioJunta('No desenho esquemático, selecione o perfil de boa molhagem.'),
            contagem('juntas'),
            mcq('Uma junta grande não aquece bem na temperatura indicada. Qual ajuste faz sentido primeiro?', ['Usar ponta adequada e melhorar o contato térmico', 'Encostar a solda só na ponta e pingar', 'Eliminar o fluxo sempre', 'Aumentar a temperatura ao máximo sem limite'], 0, 'Uma ponta com área e capacidade térmica adequadas melhora a transferência; siga os limites dos componentes.'),
            order('Ordene a preparação segura.', ['Ligar a extração de fumos', 'Colocar o ferro no suporte e aquecer', 'Limpar e estanhar a ponta', 'Aquecer a junta'], 'Ventile, aqueça o ferro no suporte, prepare a ponta e só então aqueça a junta.'),
          ],
        },
        {
          card: { title: 'Liga, fluxo e cuidados', body: t`A liga Sn63/Pb37 funde perto de $183\,°\text{C}$; ligas sem chumbo comuns fundem acima disso, conforme a composição. A ponta precisa estar mais quente para transferir energia, mas calor excessivo ou prolongado pode danificar ilhas e componentes. Use fluxo adequado à eletrônica e siga as instruções de limpeza do fabricante; fluxo ácido para encanamento é inadequado.` },
          exercises: [
            mcq('Para que serve estanhar a ponta limpa?', ['Melhorar contato térmico e proteger a ponta', 'Isolar eletricamente a junta', 'Substituir o suporte', 'Resfriar o ferro'], 0, 'Uma fina camada de solda protege a ponta e melhora a transferência térmica.'),
            tf('Fluxo ácido de encanamento é uma boa escolha para placas eletrônicas.', false, 'Resíduos corrosivos podem danificar a placa; use fluxo apropriado para eletrônica.'),
            match('Associe cada item à função.', [['Fluxo', 'Auxilia a molhagem'], ['Liga', 'Forma a união metálica'], ['Suporte', 'Acomoda o ferro quente']], 'Cada item resolve uma necessidade diferente: superfície, união ou segurança.'),
            num(t`Uma ponta está a $340\,°\text{C}$ e a liga funde a $183\,°\text{C}$. Qual a diferença em °C, sem arredondar?`, 157, t`$340-183=157\,°\text{C}$. Isso não significa que a junta esteja a essa temperatura.`, { unit: '°C', tol: 0 }),
            contagem('pontas inspecionadas'),
            mcq('A solda forma uma bola e não se espalha numa ilha oxidada. Qual ação é adequada?', ['Limpar a superfície e usar fluxo adequado', 'Manter a ponta encostada indefinidamente', 'Forçar o terminal com alicate', 'Cobrir a bola com fita'], 0, 'Óxido atrapalha a molhagem; limpe e use fluxo apropriado antes de refazer com calor controlado.'),
            order('Depois do uso, ordene os cuidados.', ['Desligar o ferro', 'Deixar esfriar no suporte', 'Guardar quando frio', 'Lavar as mãos'], 'Desligue e deixe esfriar no suporte; guarde frio e lave as mãos após manusear materiais.'),
          ],
        },
      ],
    },
    {
      id: 'of-sold-pth', title: 'Soldagem de componentes PTH', parts: [
        {
          card: { title: 'Faça a junta', body: t`No PTH/THT os terminais atravessam a placa. Insira e confira valor e polaridade; apoie a ponta no terminal **e** na ilha. Aplique solda à junta aquecida, retire o fio de solda e depois o ferro. Não mova até solidificar. Uma junta bem molhada costuma formar perfil suave e côncavo; fosca isoladamente não prova defeito, pois a liga influencia a aparência.`, visual: junta() },
          exercises: [
            mcq('No PTH, onde passam os terminais?', ['Pelos furos da placa', 'Somente pela superfície', 'Dentro da caixa do ferro', 'Pela ponta da pinça'], 0, 'PTH usa terminais que atravessam furos na placa.'),
            tf('Aqueça terminal e ilha para que a solda molhe ambos.', true, 'As duas superfícies precisam receber calor para formar a junta.'),
            exercicioJunta('Selecione a ilustração do perfil de junta bem molhada.'),
            order('Ordene uma soldagem PTH.', ['Inserir e conferir o componente', 'Aquecer ilha e terminal', 'Alimentar solda na junta', 'Retirar solda e ferro e deixar imóvel'], 'Confira a peça, aqueça ambas as superfícies, alimente a liga e deixe solidificar sem movimento.'),
            contagem('terminais'),
            mcq('Uma junta apresenta uma bola que não aderiu à ilha. Qual é o diagnóstico provável?', ['Molhagem insuficiente', 'Conexão garantida', 'Polaridade correta', 'Furo perfeitamente preenchido'], 0, 'A bola sem aderência sugere falta de molhagem; limpe, aplique fluxo e refaça sem sobreaquecer.'),
            mcq('A junta se move enquanto solidifica e fica irregular. O que fazer?', ['Inspecionar e refazer com fluxo e calor controlado', 'Aceitar sempre porque conduziu uma vez', 'Cortar a ilha', 'Aplicar cola para garantir contato'], 0, 'Movimento durante a solidificação pode fragilizar a junta; refaça e deixe imóvel.'),
          ],
        },
        {
          card: { title: 'Montagem e dessoldagem', body: t`Em geral monte primeiro componentes baixos, depois os altos e conectores; confira orientação antes de soldar. Corte terminais com óculos, segurando o recorte. Para retirar uma peça com a placa desligada e capacitores descarregados, aqueça a solda e remova-a com sugador ou malha com fluxo. Só solte o terminal quando estiver livre: puxar a frio pode arrancar a ilha.` },
          exercises: [
            mcq('Que peças normalmente entram primeiro?', ['Componentes baixos', 'Conectores mais altos', 'Caixa fechada', 'Cabos energizados'], 0, 'Peças baixas apoiam melhor a placa ao virá-la; adapte a ordem ao conjunto.'),
            tf('Puxar um terminal preso pela solda pode arrancar a ilha.', true, 'Remova a solda e libere todos os terminais antes de retirar a peça.'),
            match('Associe a ferramenta ao uso.', [['Malha dessoldadora', 'Absorver solda fundida'], ['Sugador', 'Remover solda por sucção'], ['Alicate de corte', 'Cortar terminais excedentes']], 'Malha e sugador retiram solda; o alicate corta terminais depois da soldagem.'),
            contagem('furos'),
            order('Ordene a retirada de um componente PTH.', ['Desligar e descarregar o circuito', 'Aquecer e retirar a solda dos terminais', 'Verificar se os terminais estão livres', 'Retirar a peça sem força'], 'Desenergize, remova a solda, confira os terminais e retire sem forçar a placa.'),
            mcq('Após usar sugador, um pino continua preso. Qual ação evita dano?', ['Reaquecer e remover a solda restante', 'Puxar a peça até sair', 'Cortar a trilha', 'Energizar a placa'], 0, 'Ainda há ligação mecânica: retire a solda restante e confirme que o pino está livre.'),
            mcq('Uma ponte indesejada liga duas ilhas vizinhas. O que fazer?', ['Remover excesso com fluxo e malha; testar curto', 'Adicionar mais solda', 'Ignorar se o LED acender', 'Fechar a caixa imediatamente'], 0, 'A malha remove excesso; com placa desligada, confira que a ponte desapareceu eletricamente.'),
          ],
        },
      ],
    },
    {
      id: 'of-sold-smd', title: 'SMD e retrabalho', parts: [
        {
          card: { title: 'SMD com ferro', body: t`SMD é montado sobre ilhas superficiais. Para um resistor 0805, estanhe uma ilha, segure a peça alinhada com pinça, aqueça essa ilha para fixá-la e solde o outro lado. Para SOIC, confira a marca de pino 1, fixe cantos opostos e solde os demais pinos com fluxo. A lupa ajuda a encontrar pontes e falta de molhagem.`, visual: junta() },
          exercises: [
            mcq('Onde fica um componente SMD?', ['Sobre ilhas na superfície', 'Atravessando necessariamente a placa', 'Dentro da protoboard', 'Dentro do ferro'], 0, 'SMD usa terminais ou contatos montados na superfície.'),
            tf('No SOIC, confira a orientação do pino 1 antes de soldar.', true, 'A marca identifica a orientação; confira também o desenho da placa e o datasheet.'),
            order('Ordene a montagem manual de um 0805.', ['Estanhar uma ilha', 'Alinhar a peça com pinça e fixar nessa ilha', 'Soldar o outro terminal', 'Inspecionar as duas juntas'], 'A primeira ilha fixa o alinhamento; depois solde o outro lado e inspecione ambos.'),
            exercicioJunta('Compare os perfis esquemáticos e selecione a boa molhagem.'),
            contagem('juntas SMD'),
            mcq('Um SOIC apresenta solda unindo dois pinos vizinhos que devem ser separados. Qual defeito?', ['Ponte de solda', 'Junta isolada normal', 'Desacoplamento', 'Marcação de pino 1'], 0, 'Uma ponte cria conexão indesejada; remova o excesso e teste os pinos.'),
            mcq('Um 0805 está desalinhado após fixar um lado. Qual procedimento?', ['Reaquecer a junta e realinhar com pinça sem forçar', 'Empurrar a frio até a ilha ceder', 'Acrescentar solda sobre a peça', 'Testar energizado com a pinça'], 0, 'Aqueça a junta apenas o necessário e realinhe; evite arrancar a ilha.'),
          ],
        },
        {
          card: { title: 'Retrabalho sem arrancar ilhas', body: t`Desligue, descarregue e proteja componentes próximos. Escolha ponta, fluxo e ferramenta conforme a peça; uma malha limpa pode retirar excesso. Em peças de vários pinos todos os terminais devem estar livres ou simultaneamente fundidos com ferramenta apropriada antes de levantar a peça. Não faça alavanca na placa. Após esfriar, inspecione e teste conexões e curtos.` },
          exercises: [
            mcq('Antes do retrabalho, qual é a primeira condição?', ['Circuito desligado e descarregado', 'Placa energizada', 'Peça puxada com força', 'Caixa fechada'], 0, 'Desligue a alimentação e descarregue capacitores antes de trabalhar.'),
            tf('É seguro fazer alavanca numa ilha enquanto um pino permanece soldado.', false, 'A força pode arrancar a ilha; libere todos os terminais antes de remover a peça.'),
            mcq('Qual ferramenta absorve solda excedente por capilaridade?', ['Malha dessoldadora', 'Régua', 'Escova seca', 'Suporte do ferro'], 0, 'A malha aquecida, com fluxo apropriado, absorve a solda.'),
            contagem('pinos'),
            order('Ordene um retrabalho de ponte.', ['Desligar e descarregar', 'Aplicar fluxo e remover excesso com malha', 'Deixar esfriar e inspecionar', 'Testar continuidade e ausência de curto'], 'Desenergize, remova o excesso, inspecione e teste as conexões esperadas e indesejadas.'),
            mcq('Após retirar um CI, uma ilha levantou parcialmente. Qual decisão?', ['Interromper e avaliar reparo da conexão antes de montar', 'Colar o CI e ignorar a trilha', 'Puxar a ilha para fora', 'Ligar tensão para ver se fuma'], 0, 'Uma ilha levantada pode romper a conexão; avalie e repare antes de energizar.'),
            mcq('A lupa mostra juntas aceitáveis, mas o circuito falha. Próximo passo?', ['Verificar continuidade, curtos e orientação com a placa desligada', 'Concluir que a inspeção visual garante funcionamento', 'Elevar a tensão sem limite', 'Refazer todas as juntas sem diagnóstico'], 0, 'Aparência não garante conexão elétrica nem orientação correta; faça testes dirigidos.'),
          ],
        },
      ],
    },
    {
      id: 'of-sold-placa', title: 'Da protoboard à placa definitiva', parts: [
        {
          card: { title: 'Planeje as conexões', body: t`A protoboard permite experimentar; a placa perfurada exige planejar cada nó a partir do esquemático. Há placas com ilhas isoladas e outras com tiras conectadas: confira o padrão real e corte trilhas quando necessário. Posicione peças, desenhe fios e pontes intencionais e confira alimentação e polaridade antes de soldar.`, visual: junta() },
          exercises: [
            mcq('Qual documento define as conexões elétricas a preservar?', ['Esquemático', 'Cor da caixa', 'Tamanho da ponta', 'Preço dos fios'], 0, 'O esquemático identifica nós e ligações que devem ser transferidos à placa.'),
            tf('Toda placa perfurada tem o mesmo padrão de cobre.', false, 'Existem ilhas isoladas e tiras; inspecione e teste o padrão da placa usada.'),
            mcq('Em uma placa de ilhas isoladas, como ligar ilhas distintas do mesmo nó?', ['Com fio ou ponte de solda intencional adequada', 'Apenas aproximando os componentes', 'Pintando as ilhas', 'Supor que todos os furos estão ligados'], 0, 'Ilhas isoladas precisam de condutor entre elas para pertencer ao mesmo nó.'),
            exercicioJunta('Ao preparar a montagem, escolha no desenho a junta bem molhada.'),
            contagem('conexões'),
            order('Ordene a passagem para placa perfurada.', ['Conferir o circuito na protoboard', 'Planejar posições e conexões pelo esquemático', 'Montar e soldar', 'Inspecionar e testar antes de energizar'], 'Teste o protótipo, planeje a placa, monte e confira conexões e curtos antes de ligar.'),
            mcq('Uma tira de cobre une dois nós que devem ser independentes. Como corrigir?', ['Cortar a tira no ponto planejado e verificar isolamento', 'Adicionar outra ponte entre os nós', 'Ignorar a ligação', 'Aumentar a tensão'], 0, 'Interrompa a tira onde necessário e confirme com multímetro que os nós ficaram isolados.'),
          ],
        },
        {
          card: { title: 'Cabos, conectores e caixa', body: t`Prepare fios com comprimento e decapagem adequados. Na emenda soldada, coloque o termorretrátil antes, faça união mecânica, solde e isole após esfriar. Em terminais crimpados use terminal e ferramenta compatíveis; não estanhe o condutor para uma crimpagem comum. Confira travamento, tração moderada e continuidade. Fixe a placa com espaçadores e proteja cabos com passa-fios e alívio de tração. Trabalhe com alimentação de baixa tensão isolada.`, },
          exercises: [
            mcq('Para que serve o alívio de tração?', ['Evitar que puxões cheguem às conexões', 'Aumentar a tensão da fonte', 'Substituir isolamento', 'Aquecer a solda'], 0, 'O alívio de tração transfere o esforço do cabo à caixa, protegendo terminais e juntas.'),
            tf('O termorretrátil deve ser colocado no fio antes de fechar uma emenda soldada.', true, 'Depois de emendar, pode não ser possível inserir o tubo; aqueça-o após a junta esfriar.'),
            match('Associe o teste ou proteção ao objetivo.', [['Tração moderada', 'Verificar retenção mecânica'], ['Continuidade', 'Verificar caminho elétrico'], ['Passa-fios', 'Proteger o cabo na passagem pela caixa']], 'Uma conexão confiável precisa de retenção, caminho elétrico e proteção do cabo.'),
            contagem('cabos'),
            order('Ordene uma emenda soldada isolada.', ['Passar o termorretrátil no fio', 'Decapar e unir mecanicamente', 'Soldar e deixar esfriar', 'Posicionar e contrair o termorretrátil'], 'Passe o tubo antes, una os fios, solde e, depois de frio, isole a emenda.'),
            mcq('O terminal crimpado passa continuidade, mas sai facilmente ao puxar. Qual diagnóstico?', ['Retenção mecânica insuficiente; refazer a crimpagem', 'Conector aprovado', 'Circuito necessariamente em curto', 'Solda fria na placa'], 0, 'Continuidade não comprova retenção; use terminal e alicate compatíveis e refaça.'),
            mcq('Antes de ligar a placa na caixa, qual conjunto de verificações é mais útil?', ['Fixação, isolamento, polaridade, continuidade e ausência de curto', 'Apenas cor da caixa', 'Apenas brilho das juntas', 'Somente medir o comprimento do cabo'], 0, 'Verifique segurança mecânica e elétrica com a placa desligada; depois compare o teste funcional ao protótipo.'),
          ],
        },
      ],
    },
  ],
};
