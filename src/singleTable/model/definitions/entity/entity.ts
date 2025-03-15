/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableConfig } from 'singleTable/adaptor';

import { AnyObject } from 'types';

import { KeyValue, SingleTableKeyReference } from 'singleTable/adaptor/definitions';
import { RangeQueryResultProps } from '../range';
import { KeyResolvers } from '../key';

import { RegisterEntityParams } from './params';
import { EntityCRUDProps, ExtendableCRUDProps } from './crud';
import { EntityIndexResultProps, ExtendibleIndexProps } from './indexParams';
import { EntityParseProps, ResolvedEntity } from './parsers';

type RawEntity<
  Entity extends AnyObject,
  Params extends RegisterEntityParams<any, any>,
> = KeyResolvers<Pick<Params, 'getPartitionKey' | 'getRangeKey' | 'type'>> & {
  /**
   * This is a helper property used solely internally for ease-of-map types
   *
   * Do not access
   */
  __entity: ResolvedEntity<Entity, Params>;

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
  EntityParseProps<Entity, Params> &
  EntityCRUDProps<TableConfig, Entity, Params> &
  EntityIndexResultProps<TableConfig, Params> &
  RangeQueryResultProps<Params>;

/**
 * Due to the complex nature of our entity obj, we rely on making this
 * as generic as possible, and ts infer will do the rest
 */
export type ExtendableSingleTableEntity = Omit<
  SingleTableEntity<any, any, RegisterEntityParams<any, any>>,
  | 'getPartitionKey'
  | 'getRangeKey'
  | 'getKey'
  | 'getUpdateParams'
  | 'getCreationParams'
  | 'getValidationParams'
  | 'transactCreateParams'
  | 'transactUpdateParams'
  | 'transactDeleteParams'
  | 'transactValidateParams'
  | 'parser'
> & {
  getPartitionKey: (...params: any[]) => KeyValue;
  getRangeKey: (...params: any[]) => KeyValue;
  getKey: (...params: any[]) => SingleTableKeyReference;

  parser?: (e: any) => any;
} & ExtendableCRUDProps &
  Partial<ExtendibleIndexProps>;
// * DEV NOTE: After any modification to the entity obj,
// * make sure to test if TS accepts it. This can be
// * looked at schema.fromEntity(modifiedEntity)
