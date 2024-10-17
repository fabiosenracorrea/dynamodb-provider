/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableConfig } from 'singleTable/adaptor';

import { AnyObject } from 'types';

import { KeyValue, SingleTableKeyReference } from 'singleTable/adaptor/definitions';
import { RangeQueryResultProps } from '../range';
import { KeyResolvers } from '../key';

import { RegisterEntityParams } from './params';
import { EntityCRUDProps, ExtendableCRUDProps } from './crud';
import { EntityIndexResultProps } from './indexParams';

type RawEntity<Entity, Params extends RegisterEntityParams<any, any>> = KeyResolvers<
  Pick<Params, 'getPartitionKey' | 'getRangeKey' | 'type'>
> & {
  /**
   * This is a helper property used solely internally for ease-of-map types
   *
   * Do not access
   */
  __entity: Entity;

  /**
   * Specifies which DB instance this is
   */
  __dbType: 'ENTITY';
};

export type SingleTableEntity<
  TableConfig extends SingleTableConfig,
  Entity extends AnyObject,
  Params extends RegisterEntityParams<TableConfig, Entity>,
> = RawEntity<Entity, Params> &
  EntityCRUDProps<TableConfig, Entity, Params> &
  EntityIndexResultProps<TableConfig, Params> &
  RangeQueryResultProps<Params>;

// export type ExtendableSingleTableEntity = {
//   __dbType: 'ENTITY';
//   __entity: any;
//   type: string;

//   getPartitionKey: (...params: any[]) => KeyValue;
//   getRangeKey: (...params: any[]) => KeyValue;
//   getKey: (...params: any[]) => SingleTableKeyReference;

//   indexes?: any;

//   rangeQueries?: any;
// } & ExtendableCRUDProps &
//   Partial<GenericIndexMappingFns>;

export type ExtendableSingleTableEntity = Omit<
  SingleTableEntity<any, any, RegisterEntityParams<any, any>>,
  | 'getPartitionKey'
  | 'getRangeKey'
  | 'getKey'
  | 'getUpdateParams'
  | 'getCreationParams'
  | 'transactCreateParams'
  | 'transactUpdateParams'
  | 'transactDeleteParams'
  | 'transactValidateParams'
> & {
  getPartitionKey: (...params: any[]) => KeyValue;
  getRangeKey: (...params: any[]) => KeyValue;
  getKey: (...params: any[]) => SingleTableKeyReference;
} & ExtendableCRUDProps;
