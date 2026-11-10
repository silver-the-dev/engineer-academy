import type { SectionDef } from '../types';
import { medidas } from './mec/medidas';
import { cinematica } from './mec/cinematica';
import { quedaLivre } from './mec/queda';
import { vetoresFis } from './mec/vetores';
import { movimento2d } from './mec/mov2d';
import { leisNewton } from './mec/newton';
import { energia } from './mec/energia';
import { grandezas } from './ele/base';
import { leiOhm } from './ele/ohm';
import { associacao } from './ele/associacao';
import { kirchhoff } from './ele/kirchhoff';
import { teoremasCirc } from './ele/teoremas';
import { capacitores } from './ele/capacitores';
import { indutores } from './ele/indutores';
import { alternada } from './ele/alternada';
import { potenciaCA } from './ele/potenciaca';
import { transformadores } from './ele/transformadores';
import { eficiencia } from './ele/eficiencia';
import { campoEletrico } from './emg/campo';
import { potencialEletrico } from './emg/potencial';
import { magnetismo } from './emg/magnetismo';
import { inducao } from './emg/inducao';
import { diodos } from './eln/diodo';
import { ledZener } from './eln/led';
import { retificadores } from './eln/retificadores';
import { bjt } from './eln/bjt';
import { amplificadores } from './eln/amplificadores';
import { mosfet } from './eln/mosfet';
import { ampOp } from './eln/opamp';
import { filtros } from './eln/filtros';
import { osciladores } from './eln/osciladores';
import { numeracao } from './dig/numeracao';
import { aritBinaria } from './dig/aritmetica';
import { portas } from './dig/portas';
import { booleana } from './dig/booleana';
import { karnaugh } from './dig/karnaugh';
import { combinacionais } from './dig/combinacionais';
import { sequenciais } from './dig/sequenciais';
import { conversores } from './dig/conversores';
import { bancada } from './ofi/bancada';
import { soldagem } from './ofi/soldagem';
import { projetoPCB } from './ofi/pcb';
import { cFundamentos } from './lc/fundamentos';
import { cFluxo } from './lc/fluxo';
import { cFuncoes } from './lc/funcoes';
import { cDados } from './lc/dados';
import { cHardware } from './lc/hardware';
import { arduino } from './mcu/arduino';
import { sensoresAtuadores } from './mcu/sensores';
import { comunicacao } from './mcu/comunicacao';
import { iot } from './mcu/iot';

/** Sections of the Física e Eletricidade and Sistemas Embarcados courses, in curriculum order. */
export const FIS_SECTIONS: SectionDef[] = [
  {
    id: 'mec',
    course: 'fis',
    title: 'Mecânica',
    subtitle: 'Medidas, movimento, vetores, leis de Newton e energia',
    color: '#FF6B6B',
    emoji: '🚀',
    units: [medidas, cinematica, quedaLivre, vetoresFis, movimento2d, leisNewton, energia],
  },
  {
    id: 'ele',
    course: 'fis',
    title: 'Eletricidade',
    subtitle: 'Circuitos elétricos: Ohm, Kirchhoff, capacitores, indutores, corrente alternada e energia',
    color: '#FFE14D',
    emoji: '⚡',
    units: [grandezas, leiOhm, associacao, kirchhoff, teoremasCirc, capacitores, indutores, alternada, potenciaCA, transformadores, eficiencia],
  },
  {
    id: 'emg',
    course: 'fis',
    title: 'Eletromagnetismo',
    subtitle: 'Campo elétrico, potencial, campo magnético e indução',
    color: '#4CC9F0',
    emoji: '🧲',
    units: [campoEletrico, potencialEletrico, magnetismo, inducao],
  },
  {
    id: 'eln',
    course: 'fis',
    title: 'Eletrônica Analógica',
    subtitle: 'Diodos, fontes, transistores, amplificadores operacionais e filtros',
    color: '#80ED99',
    emoji: '🔌',
    units: [diodos, ledZener, retificadores, bjt, amplificadores, mosfet, ampOp, filtros, osciladores],
  },
  {
    id: 'dig',
    course: 'fis',
    title: 'Eletrônica Digital',
    subtitle: 'Numeração, portas lógicas, álgebra booleana, circuitos combinacionais e sequenciais',
    color: '#C77DFF',
    emoji: '💡',
    units: [numeracao, aritBinaria, portas, booleana, karnaugh, combinacionais, sequenciais, conversores],
  },
  {
    id: 'ofi',
    course: 'fis',
    title: 'Bancada, Soldagem e PCB',
    subtitle: 'Segurança e instrumentos, soldagem, prototipagem e projeto de placas',
    color: '#F9844A',
    emoji: '🛠️',
    units: [bancada, soldagem, projetoPCB],
  },
  {
    id: 'lc',
    course: 'emb',
    title: 'Linguagem C',
    subtitle: 'C do zero até o código que conversa com o hardware',
    color: '#90BE6D',
    emoji: '💻',
    units: [cFundamentos, cFluxo, cFuncoes, cDados, cHardware],
  },
  {
    id: 'mcu',
    course: 'emb',
    title: 'Microcontroladores',
    subtitle: 'Arduino, sensores e atuadores, comunicação serial, ESP32 e IoT',
    color: '#F4A261',
    emoji: '🤖',
    units: [arduino, sensoresAtuadores, comunicacao, iot],
  },
];
