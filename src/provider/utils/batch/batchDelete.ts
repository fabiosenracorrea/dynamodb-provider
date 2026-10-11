/* eslint-disable @typescript-eslint/no-explicit-any */

import { StringKey } from 'types';

import { BatchMutateParams, BatchMutator } from './batchMutate';

export interface BatchDeleteParams<
  Entity,
  PKs extends StringKey<Entity> | unknown = unknown,
> extends Omit<BatchMutateParams<Entity, PKs>, 'deletes' | 'creations'> {
  items: NonNullable<BatchMutateParams<Entity, PKs>['deletes']>;
}

export type BatchDeleteResult<
  Entity,
  PKs extends StringKey<Entity> | unknown = unknown,
> = {
  unprocessed?: BatchMutateParams<Entity, PKs>['deletes'];
};

export class BatchDeleter extends BatchMutator {
  async batchDelete<Entity, PKs extends StringKey<Entity> | unknown = unknown>({
    items: deletes,
    ...params
  }: BatchDeleteParams<Entity, PKs>): Promise<BatchDeleteResult<Entity, PKs>> {
    const { unprocessed } = await this.batchMutate<Entity, PKs>({
      ...params,
      deletes,
    });

    return {
      unprocessed: unprocessed?.deletes,
    };
  }
}
