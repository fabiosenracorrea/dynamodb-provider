/* eslint-disable @typescript-eslint/no-explicit-any */

import { DBSet, DynamodbExecutor } from './dynamoDB';

export type { DBSet };

export class DynamoDBSet extends DynamodbExecutor {
  createSet<T extends string[] | number[]>(items: T): DBSet<T[number], 'v2' | 'v3'> {
    return this._createSet(items);
  }
}
