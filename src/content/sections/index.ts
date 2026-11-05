import type { Section } from '../types';
import { elementar } from './fund/elementar';
import { algebra1 } from './fund/algebra1';
import { algebra2 } from './fund/algebra2';
import { funcoes } from './fund/funcoes';
import { combinatoria } from './fund/combinatoria';
import { geometria } from './fund/geometria';
import { trigonometria } from './fund/trigonometria';
import { funcoesCalc, limites } from './calc/limites';
import { derivadas, aplicacoes } from './calc/derivadas';
import { integrais, integralDefinida } from './calc/integrais';
import { variaveis, duplas } from './calc/variaveis';
import { vetoresGeo, vetoresAlg } from './gaal/vetores';
import { escalar, vetorial } from './gaal/produtos';
import { reta, plano, transformacoes } from './gaal/retaplano';
import { erros, zeros, sistemasNum } from './num/numerico1';
import { interpolacao, ajuste, integracaoNum, edos } from './num/numerico2';
import { conceitos, tabelas, posicao, dispersao } from './est/estatistica1';
import { probabilidade, pesquisa, distribuicoes, regressao } from './est/estatistica2';

export const SECTIONS: Section[] = [
  {
    id: 'fund',
    title: 'Fundamentos',
    subtitle: 'Competências básicas: álgebra, funções, geometria e trigonometria',
    color: '#FF9F1C',
    emoji: '🧱',
    units: [elementar, algebra1, algebra2, funcoes, combinatoria, geometria, trigonometria],
  },
  {
    id: 'calc',
    title: 'Cálculo',
    subtitle: 'Cálculo Diferencial e Integral: limites, derivadas e integrais',
    color: '#7C5CFF',
    emoji: '∫',
    units: [funcoesCalc, limites, derivadas, aplicacoes, integrais, integralDefinida, variaveis, duplas],
  },
  {
    id: 'gaal',
    title: 'GA e Álgebra Linear',
    subtitle: 'Vetores, produtos, retas, planos e transformações',
    color: '#00B4D8',
    emoji: '🧭',
    units: [vetoresGeo, vetoresAlg, escalar, vetorial, reta, plano, transformacoes],
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
