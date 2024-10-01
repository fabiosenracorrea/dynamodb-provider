import { ExtendableRegisteredEntity } from 'singleTable/model';
import { SingleTableConfig } from 'singleTable/adaptor/definitions';
import {
  CreateEntityParams,
  DeleteEntityParams,
  EntityBatchGetParams,
  EntityGetParams,
  UpdateEntityParams,
} from './crud';
import { ListEntityParams, ListEntityResult } from './list';
import { QueryMethods } from './query';

type ListMethods<
  Registered extends ExtendableRegisteredEntity,
  SingleConfig extends SingleTableConfig,
> = undefined extends SingleConfig['typeIndex']
  ? unknown
  : {
      listAll(): Promise<Array<Registered['__entity']>>;

      list(params?: ListEntityParams): Promise<ListEntityResult<Registered['__entity']>>;
    };

export type FromEntity<
  Registered extends ExtendableRegisteredEntity,
  SingleConfig extends SingleTableConfig,
> = {
  get(...params: EntityGetParams<Registered>): Promise<Registered['__entity'] | undefined>;

  batchGet(params: EntityBatchGetParams<Registered>): Promise<Array<Registered['__entity']>>;

  create(...params: CreateEntityParams<Registered>): Promise<Registered['__entity']>;

  delete(params: DeleteEntityParams<Registered>): Promise<void>;

  update(params: UpdateEntityParams<Registered>): Promise<void>;
} & QueryMethods<Registered> &
  ListMethods<Registered, SingleConfig>;

export interface FromEntityMethods<SingleConfig extends SingleTableConfig> {
  fromEntity<Registered extends ExtendableRegisteredEntity>(
    entity: Registered,
  ): FromEntity<Registered, SingleConfig>;
}
