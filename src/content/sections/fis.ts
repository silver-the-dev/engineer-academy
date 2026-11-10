import type { SectionDef } from '../types';
import { medidas } from './mec/medidas';
import { cinematica } from './mec/cinematica';
import { quedaLivre } from './mec/queda';
import { vetoresFis } from './mec/vetores';
import { movimento2d } from './mec/mov2d';
import { leisNewton } from './mec/newton';
import { numeracao } from './dig/numeracao';
import { aritBinaria } from './dig/aritmetica';

/** Sections of the Física e Eletricidade course, in curriculum order. */
export const FIS_SECTIONS: SectionDef[] = [
  {
    id: 'mec',
    course: 'fis',
    title: 'Mecânica',
    subtitle: 'Medidas, movimento, vetores, leis de Newton e energia',
    color: '#FF6B6B',
    emoji: '🚀',
    units: [medidas, cinematica, quedaLivre, vetoresFis, movimento2d, leisNewton],
  },
  {
    id: 'dig',
    course: 'fis',
    title: 'Eletrônica Digital',
    subtitle: 'Numeração, portas lógicas, álgebra booleana, circuitos combinacionais e sequenciais',
    color: '#C77DFF',
    emoji: '💡',
    units: [numeracao, aritBinaria],
  },
];
