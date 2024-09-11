/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableConfig } from 'singleTable/adaptor';

import { AnyObject } from 'types';

import { RegisterEntityParams, SingleTableEntity } from '../entity';
import { EntityKeyResolvers } from '../key';

import { FullPartitionKeys, ParamMatchArgs } from './keySwap';
import { CreatePartitionParams, PartitionEntry, PartitionKeyGetters } from './params';

// remove getPartitionKey/getRangeKey from params + use param swap

export type PartitionEntityCreateParams<
  TableConfig extends SingleTableConfig,
  Entity extends AnyObject,
  Params extends CreatePartitionParams<any>,
  Entry extends PartitionEntry<Params>,
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
      entity<T extends PartitionEntityCreateParams<TableConfig, Entity, Params, Entry>>(
        params: T,
      ): SingleTableEntity<
        TableConfig,
        Entity,
        // TS was freaking out with the T & key params
        PartitionEntityParams<
          PartitionKeyGetters<Params, Entry>,
          Entity,
          T
        > extends RegisterEntityParams<TableConfig, any>
          ? PartitionEntityParams<PartitionKeyGetters<Params, Entry>, Entity, T>
          : never
      >;
    }
  : unknown;
