import { useSyncExternalStore } from 'react';

import type { ExecuteRequest, ExecuteResponse } from '@/utils/api';

export interface HistoryEntry {
  id: string;
  at: number;
  request: ExecuteRequest;
  /** Human label: `TASK · queryIndex.ByStatus.byDueDate` */
  label: string;
  ok: boolean;
  count?: number;
  durationMs?: number;
  error?: string;
}

const STORAGE_KEY = 'playground-history';
const LIMIT = 50;

function load(): HistoryEntry[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);

    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

let entries: HistoryEntry[] = load();
const listeners = new Set<() => void>();

function persist(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // A full or unavailable sessionStorage should never break the app.
  }

  listeners.forEach((listener) => listener());
}

function describe({ target, name, operation, index, rangeQuery }: ExecuteRequest): string {
  if (target !== 'entity') {
    return `${target}.${operation}${index ? ` · ${index}` : ''}`;
  }

  const root = index ? `queryIndex.${index}` : operation;
  const leaf = operation === 'query' ? `.${rangeQuery ?? 'custom'}` : '';

  return `${name} · ${root}${leaf}`;
}

export function recordRun(request: ExecuteRequest, response: ExecuteResponse): void {
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    request,
    label: describe(request),
    ok: response.success,
    count: response.meta?.count,
    durationMs: response.meta?.durationMs,
    error: response.error,
  };

  entries = [entry, ...entries].slice(0, LIMIT);
  persist();
}

export function clearHistory(): void {
  entries = [];
  persist();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

export function useHistory(): HistoryEntry[] {
  return useSyncExternalStore(
    subscribe,
    () => entries,
    () => entries,
  );
}
