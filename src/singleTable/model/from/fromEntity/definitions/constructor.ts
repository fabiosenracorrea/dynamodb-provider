import type { AnyEntity } from 'singleTable/model';
import type { SingleTableConfig } from 'singleTable/adaptor/definitions';
import type {
  CreateEntityParams,
  DeleteEntityParams,
  EntityBatchGetParams,
  EntityGetParams,
  UpdateEntityParams,
  UpdateReturn,
} from './crud';
import type { ListEntityParams, ListEntityResult } from './list';
import type { QueryMethods } from './query';

export type ListEntityMethods<
  Registered extends AnyEntity,
  SingleConfig extends SingleTableConfig,
> = undefined extends SingleConfig['typeIndex']
  ? object
  : {
      listAll(): Promise<Array<Registered['__entity']>>;

      list(params?: ListEntityParams): Promise<ListEntityResult<Registered['__entity']>>;
    };

export type FromEntity<
  Registered extends AnyEntity,
  SingleConfig extends SingleTableConfig,
> = {
  get(
    ...params: EntityGetParams<Registered>
  ): Promise<Registered['__entity'] | undefined>;

  batchGet(
    params: EntityBatchGetParams<Registered>,
  ): Promise<Array<Registered['__entity']>>;

  create(...params: CreateEntityParams<Registered>): Promise<Registered['__entity']>;

  delete(...params: DeleteEntityParams<Registered>): Promise<void>;

  update<Params extends UpdateEntityParams<Registered>>(
    params: Params,
  ): Promise<UpdateReturn<Registered, Params>>;
} & QueryMethods<Registered> &
  ListEntityMethods<Registered, SingleConfig>;

export interface FromEntityMethods<SingleConfig extends SingleTableConfig> {
  fromEntity<Registered extends AnyEntity>(
    entity: Registered,
  ): FromEntity<Registered, SingleConfig>;
}
