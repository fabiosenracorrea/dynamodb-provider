import type { Operation, OperationTarget } from '../core/operation';

import { entityGet } from './entity/get';
import { entityBatchGet } from './entity/batchGet';
import { entityCreate } from './entity/create';
import { entityUpdate } from './entity/update';
import { entityDelete } from './entity/remove';
import { entityList } from './entity/list';
import { entityQuery } from './entity/query';
import { collectionGet } from './collection/get';
import { tableQuery } from './table/query';
import { tableListType } from './table/listType';
import { tableScan } from './table/scan';
import { tableGetByKey } from './table/getByKey';

const ALL: Operation[] = [
  entityGet,
  entityBatchGet,
  entityCreate,
  entityUpdate,
  entityDelete,
  entityList,
  entityQuery,
  collectionGet,
  tableQuery,
  tableListType,
  tableScan,
  tableGetByKey,
];

const registry = new Map<string, Operation>(
  ALL.map((operation) => [`${operation.target}:${operation.operation}`, operation]),
);

export function findOperation(
  target: OperationTarget,
  operation: string,
): Operation | undefined {
  return registry.get(`${target}:${operation}`);
}

export function operationsFor(target: OperationTarget): string[] {
  return ALL.filter((operation) => operation.target === target).map(
    ({ operation }) => operation,
  );
}
