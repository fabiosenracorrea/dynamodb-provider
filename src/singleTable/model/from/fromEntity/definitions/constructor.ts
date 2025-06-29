import type { ExtendableSingleTableEntity } from 'singleTable/model';
import type { SingleTableConfig } from 'singleTable/adaptor/definitions';
import type {
  CreateEntityParams,
  DeleteEntityParams,
  EntityBatchGetParams,
  EntityGetParams,
  UpdateEntityParams,
} from './crud';
import type { ListEntityParams, ListEntityResult } from './list';
import type { QueryMethods } from './query';

export type ListEntityMethods<
  Registered extends ExtendableSingleTableEntity,
  SingleConfig extends SingleTableConfig,
> = undefined extends SingleConfig['typeIndex']
  ? object
  : {
      listAll(): Promise<Array<Registered['__entity']>>;

      list(params?: ListEntityParams): Promise<ListEntityResult<Registered['__entity']>>;
    };

export type FromEntity<
  Registered extends ExtendableSingleTableEntity,
  SingleConfig extends SingleTableConfig,
> = {
  get(...params: EntityGetParams<Registered>): Promise<Registered['__entity'] | undefined>;

  batchGet(params: EntityBatchGetParams<Registered>): Promise<Array<Registered['__entity']>>;

  create(...params: CreateEntityParams<Registered>): Promise<Registered['__entity']>;

  delete(params: DeleteEntityParams<Registered>): Promise<void>;

  update(params: UpdateEntityParams<Registered>): Promise<void>;
} & QueryMethods<Registered> &
  ListEntityMethods<Registered, SingleConfig>;

export interface FromEntityMethods<SingleConfig extends SingleTableConfig> {
  fromEntity<Registered extends ExtendableSingleTableEntity>(
    entity: Registered,
  ): FromEntity<Registered, SingleConfig>;
}
