import { normalizeSection, type Section, type SectionDef } from '../types';
import { aritmetica } from './fund/aritmetica';
import { elementar } from './fund/elementar';
import { algebra1 } from './fund/algebra1';
import { fatoracao, equacoes } from './fund/fatoracao';
import { algebra2 } from './fund/algebra2';
import { funcoes } from './fund/funcoes';
import { combinatoria } from './fund/combinatoria';
import { geometria } from './fund/geometria';
import { trigonometria } from './fund/trigonometria';
import { logica } from './fund/logica';
import { geoPlana } from './fund/geoplana';
import { geoEspacial } from './fund/geoespacial';
import { binomio } from './fund/binomio';
import { matrizes } from './fund/matrizes';
import { financeira } from './fund/financeira';
import { classesFuncoes } from './pre/funcoes';
import { trigAvancada } from './pre/trigonometria';
import { geoAnalitica } from './pre/geoanalitica';
import { expLog } from './pre/explog';
import { trigTransf } from './pre/trigtransf';
import { complexos, polinomiais } from './pre/complexos';
import { funcoesCalc, limites } from './calc/limites';
import { derivadas, aplicacoes } from './calc/derivadas';
import { taxas } from './calc/taxas';
import { integrais, integralDefinida } from './calc/integrais';
import { tecnicas } from './calc/tecnicas';
import { aplIntegral } from './calc/aplintegral';
import { sequencias, potencias } from './calc/series';
import { variaveis, duplas } from './calc/variaveis';
import { curvas, otimMulti } from './calc/multivar';
import { vetoresGeo, vetoresAlg } from './gaal/vetores';
import { escalar, vetorial } from './gaal/produtos';
import { reta, plano, transformacoes } from './gaal/retaplano';
import { superficies } from './gaal/superficies';
import { multiplas } from './vet/multiplas';
import { campos } from './vet/campos';
import { teoremas } from './vet/teoremas';
import { edo1 } from './edo/primeira';
import { edo2 } from './edo/segunda';
import { laplace } from './edo/laplace';
import { fourier } from './edo/fourier';
import { erros, zeros, sistemasNum } from './num/numerico1';
import { interpolacao, ajuste, integracaoNum, edos } from './num/numerico2';
import { conceitos, tabelas, posicao, dispersao } from './est/estatistica1';
import { probabilidade, pesquisa, distribuicoes, regressao } from './est/estatistica2';

const DEFS: SectionDef[] = [
  {
    id: 'fund',
    title: 'Fundamentos',
    subtitle: 'Competências básicas: lógica, álgebra, matrizes, funções, finanças, contagem, geometria e trigonometria',
    color: '#FF9F1C',
    emoji: '🧱',
    units: [aritmetica, elementar, algebra1, logica, fatoracao, equacoes, algebra2, matrizes, funcoes, financeira, combinatoria, binomio, geometria, geoPlana, geoEspacial, trigonometria],
  },
  {
    id: 'pre',
    title: 'Pré-Cálculo',
    subtitle: 'Funções, exponenciais e logaritmos, trigonometria, complexos, polinômios e geometria analítica',
    color: '#FFD166',
    emoji: '📐',
    units: [classesFuncoes, expLog, trigAvancada, trigTransf, complexos, polinomiais, geoAnalitica],
  },
  {
    id: 'calc',
    title: 'Cálculo',
    subtitle: 'Cálculo 1 a 3: limites, derivadas, integrais, séries e várias variáveis',
    color: '#7C5CFF',
    emoji: '∫',
    units: [funcoesCalc, limites, derivadas, taxas, aplicacoes, integrais, integralDefinida, tecnicas, aplIntegral, sequencias, potencias, curvas, variaveis, otimMulti, duplas],
  },
  {
    id: 'gaal',
    title: 'GA e Álgebra Linear',
    subtitle: 'Vetores, produtos, retas, planos e transformações',
    color: '#00B4D8',
    emoji: '🧭',
    units: [vetoresGeo, vetoresAlg, escalar, vetorial, reta, plano, superficies, transformacoes],
  },
  {
    id: 'vet',
    title: 'Cálculo Vetorial',
    subtitle: 'Integrais múltiplas, campos vetoriais e os teoremas de Green, Stokes e Gauss',
    color: '#B5179E',
    emoji: '🌀',
    units: [multiplas, campos, teoremas],
  },
  {
    id: 'edo',
    title: 'Equações Diferenciais',
    subtitle: 'EDOs de 1ª e 2ª ordem, Laplace e Fourier',
    color: '#E76F51',
    emoji: '🌊',
    units: [edo1, edo2, laplace, fourier],
  },
  {
    id: 'num',
    title: 'Cálculo Numérico',
    subtitle: 'Erros, raízes, sistemas, interpolação, integração e EDOs',
    color: '#2BD576',
    emoji: '💻',
    units: [erros, zeros, sistemasNum, interpolacao, ajuste, integracaoNum, edos],
  },
  {
    id: 'est',
    title: 'Probabilidade e Estatística',
    subtitle: 'Dados, gráficos, medidas, probabilidade e pesquisas',
    color: '#FF5A9E',
    emoji: '📊',
    units: [conceitos, tabelas, posicao, dispersao, probabilidade, pesquisa, distribuicoes, regressao],
  },
];

export const SECTIONS: Section[] = DEFS.map(normalizeSection);
