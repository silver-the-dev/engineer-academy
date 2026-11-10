import { createContext } from 'react';

/** Screens may suspend offscreen widgets without losing their assembly or scope. */
export const CircuitActivity = createContext(true);
