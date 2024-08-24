import { ExtendableRegisteredEntity } from '../defined';
import {
  CreateEntityParams,
  DeleteEntityParams,
  EntityBatchGetParams,
  EntityGetParams,
  UpdateEntityParams,
} from './crud';
import { ListEntityParams, ListEntityResult } from './list';
import { QueryMethods } from './query';

export type FromEntity<Registered extends ExtendableRegisteredEntity> = {
  get(...params: EntityGetParams<Registered>): Promise<Registered['__entity'] | undefined>;

  batchGet(params: EntityBatchGetParams<Registered>): Promise<Array<Registered['__entity']>>;

  create(...params: CreateEntityParams<Registered>): Promise<Registered['__entity']>;

  delete(params: DeleteEntityParams<Registered>): Promise<void>;

  update(params: UpdateEntityParams<Registered>): Promise<void>;

  listAll(): Promise<Array<Registered['__entity']>>;

  listByCreation(params?: ListEntityParams): Promise<ListEntityResult<Registered['__entity']>>;
} & QueryMethods<Registered>;

export interface FromEntityMethods {
  fromEntity<Registered extends ExtendableRegisteredEntity>(
    entity: Registered,
  ): FromEntity<Registered>;
}
