import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { QueryConfig } from './QueryParams';

export interface SharedQueryState {
  /** 'main' or an entity index name. */
  target: string;
  partitionValues: Record<string, string>;
  config: QueryConfig;
}

const PARAM = 'q';

function encode(state: SharedQueryState): string {
  // btoa is latin1-only; percent-encoding first keeps non-ASCII key values intact.
  const json = JSON.stringify(state);

  return btoa(encodeURIComponent(json)).replace(/=+$/, '');
}

function decode(raw: string): SharedQueryState | null {
  try {
    return JSON.parse(decodeURIComponent(atob(raw))) as SharedQueryState;
  } catch {
    return null;
  }
}

/**
 * Mirrors the query builder's state into a single `?q=` param so a configured query
 * is a shareable link.
 *
 * One opaque param rather than a field per option: the state is nested (filters,
 * range params, key values) and a flat mapping would need its own escaping rules for
 * every shape. The UI is the editor — the URL only has to round-trip faithfully.
 */
export function useQueryUrlState(
  onRestore: (state: SharedQueryState) => void,
): (state: SharedQueryState) => void {
  const [searchParams, setSearchParams] = useSearchParams();

  const restored = useRef(false);
  const restoreRef = useRef(onRestore);
  restoreRef.current = onRestore;

  useEffect(() => {
    if (restored.current) return;

    restored.current = true;

    const raw = searchParams.get(PARAM);
    const state = raw && decode(raw);

    if (state) restoreRef.current(state);
    // Restore is a mount-time concern; later URL edits are the user's own navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useCallback(
    (state: SharedQueryState) => {
      setSearchParams(
        (current) => {
          current.set(PARAM, encode(state));

          return current;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );
}
