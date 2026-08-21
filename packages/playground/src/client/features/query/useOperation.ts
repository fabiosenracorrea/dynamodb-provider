import { useCallback, useRef, useState } from 'react';

import { execute, type ExecuteMeta, type ExecuteRequest, type ExecuteResponse } from '@/utils/api';
import { recordRun } from './history';

type Row = Record<string, unknown>;

function toRows(data: unknown): Row[] {
  if (Array.isArray(data)) return data as Row[];

  if (data && typeof data === 'object' && 'items' in data) {
    return ((data as { items: unknown[] }).items ?? []) as Row[];
  }

  return [];
}

interface OperationState {
  /** Accumulated across pages; a fresh `run` replaces it. */
  items: Row[];
  /** Whatever the last response returned, for non-list operations. */
  data: unknown;
  error: string | null;
  meta: ExecuteMeta | null;
  paginationToken?: string;
  hasRun: boolean;
}

const EMPTY: OperationState = {
  items: [],
  data: undefined,
  error: null,
  meta: null,
  paginationToken: undefined,
  hasRun: false,
};

/**
 * Runs an operation and keeps its pages. DynamoDB paginates by cursor, so "next page"
 * is another round trip that appends — the table's own paging is just a view over
 * what has been fetched so far.
 */
export function useOperation() {
  const [state, setState] = useState<OperationState>(EMPTY);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // The request that produced the current page, so `loadMore` can repeat it.
  const lastRequest = useRef<ExecuteRequest | null>(null);

  const apply = useCallback((response: ExecuteResponse, append: boolean) => {
    setState((current) => {
      if (!response.success) {
        return {
          ...current,
          error: response.error ?? 'Unknown error',
          meta: response.meta ?? null,
          hasRun: true,
        };
      }

      const rows = toRows(response.data);

      return {
        items: append ? [...current.items, ...rows] : rows,
        data: response.data,
        error: null,
        meta: response.meta ?? null,
        paginationToken: response.paginationToken,
        hasRun: true,
      };
    });
  }, []);

  const run = useCallback(
    async (request: ExecuteRequest) => {
      lastRequest.current = request;
      setIsRunning(true);

      try {
        const response = await execute(request);

        apply(response, false);
        recordRun(request, response);

        return response;
      } finally {
        setIsRunning(false);
      }
    },
    [apply],
  );

  const loadMore = useCallback(async () => {
    const request = lastRequest.current;

    if (!request || !state.paginationToken) return;

    setIsLoadingMore(true);

    try {
      apply(
        await execute({
          ...request,
          params: { ...request.params, paginationToken: state.paginationToken },
        }),
        true,
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [apply, state.paginationToken]);

  const reset = useCallback(() => {
    lastRequest.current = null;
    setState(EMPTY);
  }, []);

  return {
    ...state,
    isRunning,
    isLoadingMore,
    hasMore: !!state.paginationToken,
    run,
    loadMore,
    reset,
  };
}
