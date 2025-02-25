/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableConfig } from 'singleTable/adaptor';

import { AnyObject } from 'types';

import { RangeQueryInputProps } from '../range';
import { EntityIndexInputParams } from './indexParams';
import { AutoGenParams } from './autoGen';
import { EntityKeyResolvers } from '../key';
import { EntityParseParams } from './parsers';

/**
 * Ensures we properly match constant strings if they are
 * defined within the entity type
 */
type EntityType<
  TableConfig extends SingleTableConfig,
  Entity extends AnyObject = AnyObject,
> = TableConfig['typeIndex'] extends { partitionKey: string }
  ? Entity[TableConfig['typeIndex']['partitionKey']] extends string
    ? Entity[TableConfig['typeIndex']['partitionKey']]
    : string
  : string;

type RawEntityRegisterParams<
  TableConfig extends SingleTableConfig,
  Entity extends AnyObject = AnyObject,
> = {
  /**
   * Entity type
   *
   * Should be unique across all entities you define within a single table
   *
   * If you have enforced an `typeIndex` config, this value will be added
   * to your entity to the value corresponding to your `typeIndex.partitionKey`
   * column
   *
   * This definition will occur on both creations and updates
   */
  type: EntityType<TableConfig, SingleTableConfig>;

  /**
   * Define params that should be auto generated `onCreate` and/or `onUpdate`
   */
  autoGen?: AutoGenParams<Entity>;
};

export type RegisterEntityParams<
  TableConfig extends SingleTableConfig,
  Entity extends AnyObject = AnyObject,
> = EntityKeyResolvers<Entity> &
  RangeQueryInputProps &
  EntityIndexInputParams<TableConfig, Entity> &
  EntityParseParams<Entity> &
  RawEntityRegisterParams<TableConfig, Entity>;
