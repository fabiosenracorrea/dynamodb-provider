/* eslint-disable @typescript-eslint/no-explicit-any */

import { DBSet, DynamodbExecutor } from './dynamoDB';

export type { DBSet };

export class DynamoDBSet extends DynamodbExecutor {
  createSet(items: string[] | number[]): DBSet {
    return this.createSet(items);
  }
}
