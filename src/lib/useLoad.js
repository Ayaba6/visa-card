import { useCallback, useEffect, useRef, useState } from 'react';

/** Charge des données asynchrones : const { data, loading, error, reload } = useLoad(() => api.cards(), []) */
export function useLoad(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const reload = useCallback(async () => {
    try {
      const result = await fnRef.current();
      setData(result);
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, loading, error, reload };
}

/** Préférence locale (ex. masquer le solde) — ne casse pas si le stockage est bloqué. */
export function useLocalPref(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });
  const update = useCallback(
    (v) => {
      setValue(v);
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {
        /* ignoré */
      }
    },
    [key],
  );
  return [value, update];
}
