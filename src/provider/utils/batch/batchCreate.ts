/* eslint-disable @typescript-eslint/no-explicit-any */

import { StringKey } from 'types';

import { BatchMutateParams, BatchMutator } from './batchMutate';

export interface BatchCreateParams<
  Entity,
  PKs extends StringKey<Entity> | unknown = unknown,
> extends Omit<BatchMutateParams<Entity, PKs>, 'deletes' | 'creations'> {
  items: NonNullable<BatchMutateParams<Entity, PKs>['creations']>;
}

export type BatchCreateResult<
  Entity,
  PKs extends StringKey<Entity> | unknown = unknown,
> = {
  unprocessed?: BatchMutateParams<Entity, PKs>['creations'];
};

export class BatchCreator extends BatchMutator {
  async batchCreate<Entity, PKs extends StringKey<Entity> | unknown = unknown>({
    items: creations,
    ...params
  }: BatchCreateParams<Entity, PKs>): Promise<BatchCreateResult<Entity, PKs>> {
    const { unprocessed } = await this.batchMutate({
      ...params,
      creations,
    });

    return {
      unprocessed: unprocessed?.creations,
    };
  }
}
