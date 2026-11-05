import type { Section } from '../types';
import { elementar } from './fund/elementar';
import { algebra1 } from './fund/algebra1';
import { algebra2 } from './fund/algebra2';
import { funcoes } from './fund/funcoes';
import { combinatoria } from './fund/combinatoria';
import { geometria } from './fund/geometria';
import { trigonometria } from './fund/trigonometria';

export const SECTIONS: Section[] = [
  {
    id: 'fund',
    title: 'Fundamentos',
    subtitle: 'Competências básicas: álgebra, funções, geometria e trigonometria',
    color: '#FF9F1C',
    emoji: '🧱',
    units: [elementar, algebra1, algebra2, funcoes, combinatoria, geometria, trigonometria],
  },
];
