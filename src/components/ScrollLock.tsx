import React, { createContext, useCallback, useContext, useState } from 'react';

/** Lets draggable widgets disable the parent ScrollView while dragging. */
const Ctx = createContext<(locked: boolean) => void>(() => {});

export function useScrollLock() {
  return useContext(Ctx);
}

export function useScrollLockState(): [boolean, (l: boolean) => void] {
  const [locked, setLocked] = useState(false);
  const set = useCallback((l: boolean) => setLocked(l), []);
  return [locked, set];
}

export function ScrollLockProvider({ setLocked, children }: { setLocked: (l: boolean) => void; children: React.ReactNode }) {
  return <Ctx.Provider value={setLocked}>{children}</Ctx.Provider>;
}
