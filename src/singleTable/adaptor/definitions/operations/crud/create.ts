/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

import { AnyObject } from 'types';

import { CreateItemParams } from 'provider';
import { getPrimaryKey, SingleTableKeyReference } from '../../key';
import { SingleTableConfig } from '../../config';
import { BaseSingleTableOperator } from '../../executor';
import { resolveProps } from '../../parsers';
import { transformIndexReferences } from '../../tableIndex';

type IndexParams<TableConfig extends SingleTableConfig> =
  undefined extends TableConfig['indexes']
    ? {}
    : {
        /**
         * Explicity describe each relevant index value on this creation, if applicable
         */
        indexes?: {
          [key in keyof TableConfig['indexes']]?: SingleTableKeyReference;
        };
      };

type ExpiresAtParams<TableConfig extends SingleTableConfig> =
  undefined extends TableConfig['expiresAt']
    ? {}
    : {
        /**
         * The UNIX timestamp expiration of this item
         */
        expiresAt?: number;
      };

type TypeParams<TableConfig extends SingleTableConfig> =
  undefined extends TableConfig['typeIndex']
    ? {}
    : {
        /**
         * The entity type
         *
         * This will be assigned the to column described
         * in your config.typeIndex.partitionKey
         */
        type: string;
      };

export type SingleTableCreateItemParams<
  Entity = AnyObject,
  TableConfig extends SingleTableConfig = SingleTableConfig,
> = IndexParams<TableConfig> &
  ExpiresAtParams<TableConfig> &
  TypeParams<TableConfig> & {
    /**
     * Any actual property of your item
     */
    item: Entity;

    /**
     * The single table reference of your entity
     *
     * This is a separate prop to provide clarity and ease of understanding
     */
    key: SingleTableKeyReference;
  };

type RefConfig = Required<SingleTableConfig>;

export class SingleTableCreator extends BaseSingleTableOperator {
  private getTypeIndexProps(item: any, type: string): AnyObject {
    if (!this.config.typeIndex) return {};

    const { partitionKey, rangeKey, rangeKeyGenerator } = this.config.typeIndex;

    // This is specifically done to enable users to return `undefined` from generator and opt-out this property
    const rangeValue = rangeKeyGenerator
      ? rangeKeyGenerator(item, type)
      : new Date().toISOString();

    return {
      [partitionKey]: type,

      [rangeKey]: rangeValue,
    };
  }

  getCreateParams<Entity = any>({
    item,
    key,
    type,
    indexes,
    expiresAt,
  }: SingleTableCreateItemParams<Entity, RefConfig>): CreateItemParams<Entity> {
    return {
      table: this.config.table,

      item: {
        ...item,

        ...(expiresAt && this.config.expiresAt
          ? { [this.config.expiresAt]: expiresAt }
          : {}),

        ...(indexes ? transformIndexReferences(indexes as any, this.config) : {}),

        ...this.getTypeIndexProps(item, type),

        ...getPrimaryKey(key, this.config),
      },
    };
  }

  // We only need to extend config on our provider, this method here is not exposed to the application
  async create<Entity>(
    params: SingleTableCreateItemParams<Entity, Required<SingleTableConfig>>,
  ): Promise<Entity> {
    const created = await this.db.create<any>(this.getCreateParams(params as any));

    return resolveProps(created, this.config, this.parser);
  }
}
