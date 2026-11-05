import type { Section } from '../types';
import { elementar } from './fund/elementar';

export const SECTIONS: Section[] = [
  {
    id: 'fund',
    title: 'Fundamentos',
    subtitle: 'Competências básicas: álgebra, funções, geometria e trigonometria',
    color: '#FF9F1C',
    emoji: '🧱',
    units: [elementar],
  },
];
