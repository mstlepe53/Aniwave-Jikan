/**
 * useFetch Hook
 *
 * A generic custom hook for fetching data with loading and error states.
 * Used as a fallback for components that don't use React Query.
 *
 * @param fetcher - Async function that returns the data
 * @param deps - Dependency array for refetching
 * @returns { data, loading, error, refetch }
 */
import { useState, useEffect, useCallback } from 'react';

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
    } catch {
      setState({ data: null, loading: false, error: 'Failed to load data.' });
    }
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { ...state, refetch: load };
}
