import { useEffect, useState, useCallback } from 'react';

// Preferência por navegador: mostrar ou não os campos que dependem do sistema de regras (D&D).
// Padrão: ocultos, porque o foco do app é organizar a história.
const KEY = 'lumen_show_rules';
const EVENT = 'lumen-rules-changed';

const read = (): boolean => {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
};

export function useShowRules(): [boolean, (v: boolean) => void] {
  const [show, setShow] = useState<boolean>(read);

  useEffect(() => {
    const sync = () => setShow(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);

  const set = useCallback((v: boolean) => {
    try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* ignora */ }
    setShow(v);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [show, set];
}
