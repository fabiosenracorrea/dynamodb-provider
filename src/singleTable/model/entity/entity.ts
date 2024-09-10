/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableParams } from 'singleTable/adaptor';

import { AnyObject } from 'types';

import { RangeQueryResultProps } from '../range';

import { RegisterEntityParams } from './params';
import { EntityCRUDProps } from './crud';
import { EntityIndexResultProps } from './indexParams';
import { KeyResolvers } from '../key';

export type RawEntity<Entity, Params extends RegisterEntityParams<any, any>> = KeyResolvers<
  Pick<Params, 'getPartitionKey' | 'getRangeKey' | 'type'>
> & {
  /**
   * This is a helper property used solely internally for ease-of-map types
   *
   * Do not access
   */
  __entity: Entity;
};

export type SingleTableEntity<
  TableConfig extends SingleTableParams,
  Entity extends AnyObject,
  Params extends RegisterEntityParams<TableConfig, Entity>,
> = RawEntity<Entity, Params> &
  EntityCRUDProps<TableConfig, Entity, Params> &
  EntityIndexResultProps<TableConfig, Params> &
  RangeQueryResultProps<Params>;
