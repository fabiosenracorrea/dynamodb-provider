import type { AtomicOperationType, ConditionOperation } from './constants';

export interface ValueRow {
  id: string;
  property: string;
  isCustom: boolean;
  value: string;
  jsonError?: string;
}

export interface RemoveRow {
  id: string;
  property: string;
  isCustom: boolean;
}

export interface AtomicOperationRow {
  id: string;
  type: AtomicOperationType;
  property: string;
  isCustom: boolean;
  value: string;
  jsonError?: string;
}

export interface ConditionRow {
  id: string;
  property: string;
  isCustom: boolean;
  operation: ConditionOperation;
  value: string;
  start: string;
  end: string;
  values: string;
  joinAs: 'and' | 'or';
}

export interface UpdateParams {
  values?: Record<string, unknown>;
  remove?: string[];
  atomicOperations?: Array<{
    type: string;
    property: string;
    value?: unknown;
    values?: unknown[];
  }>;
  conditions?: Array<{
    operation: string;
    property: string;
    value?: unknown;
    start?: unknown;
    end?: unknown;
    values?: unknown[];
    joinAs?: 'and' | 'or';
  }>;
}
