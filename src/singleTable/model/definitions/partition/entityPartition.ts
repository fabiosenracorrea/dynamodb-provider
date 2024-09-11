/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableConfig } from 'singleTable/adaptor';

import { AnyObject } from 'types';

import { RegisterEntityParams, SingleTableEntity } from '../entity';
import { EntityKeyResolvers } from '../key';

import { FullPartitionKeys, ParamMatchArgs } from './keySwap';
import { CreatePartitionParams, PartitionEntry, PartitionKeyGetters } from './params';

// remove getPartitionKey/getRangeKey from params + use param swap

type PartitionEntityCreateParams<
  TableConfig extends SingleTableConfig,
  Params extends CreatePartitionParams<any>,
  Entry extends PartitionEntry<Params>,
  Entity extends AnyObject,
> = Omit<RegisterEntityParams<TableConfig, Entity>, keyof EntityKeyResolvers> &
  ParamMatchArgs<PartitionKeyGetters<Params, Entry>, Entity>;

type PartitionEntityParams<
  Getters extends EntityKeyResolvers<any>,
  Entity,
  CreateParams extends PartitionEntityCreateParams<any, any, any, any>,
> = CreateParams & FullPartitionKeys<Getters, Entity, CreateParams>;

export type PartitionEntityCreator<
  TableConfig extends SingleTableConfig,
  Params extends CreatePartitionParams<any>,
  Entry extends PartitionEntry<Params>,
  Entity,
> = Entity extends AnyObject
  ? {
      entity<T extends PartitionEntityCreateParams<TableConfig, Params, Entry, Entity>>(
        params: T,
      ): SingleTableEntity<
        TableConfig,
        Entity,
        T & FullPartitionKeys<PartitionKeyGetters<Params, Entry>, Entity, T>
      >;
    }
  : unknown;
