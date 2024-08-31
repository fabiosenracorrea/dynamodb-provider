/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

import { AnyObject, StringKey } from 'types';

import { removeUndefinedProps } from 'utils/object';

import { UpdateParams } from 'provider';

import { SingleTableConfig } from '../../config';
import { getPrimaryKey, SingleTableKeyReference } from '../../key';
import { BaseSingleTableOperator } from '../../executor';
import { transformIndexReferences } from '../../tableIndex';

type IndexParams<TableConfig extends SingleTableConfig> = undefined extends TableConfig['indexes']
  ? {}
  : {
      /**
       * Explicity describe each relevant index value to update
       * You can chose to update just a partition/range
       */
      indexes?: {
        [key in keyof TableConfig['indexes']]?: Partial<SingleTableKeyReference>;
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

export type SingleTableUpdateParams<
  Entity,
  TableConfig extends SingleTableConfig = SingleTableConfig,
  PKs extends StringKey<Entity> | unknown = unknown,
> = SingleTableKeyReference &
  IndexParams<TableConfig> &
  ExpiresAtParams<TableConfig> &
  Omit<UpdateParams<Entity, PKs>, 'table' | 'key'>;

type RefConfig = Required<SingleTableConfig>;

export class SingleTableUpdater extends BaseSingleTableOperator {
  private validateUpdateProps({
    values,
    atomicOperations,
    remove,
  }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SingleTableUpdateParams<any>): void {
    const allPropertiesMentioned = new Set([
      ...Object.values(values || []),
      ...(remove || []),
      ...(atomicOperations || []).map(({ property }) => property),
    ]);

    const includesPK = [this.config.partitionKey, this.config.rangeKey].some((prop) =>
      allPropertiesMentioned.has(prop),
    );

    if (includesPK) throw new Error(`Update contained references to ${this.config.table}'s PKs`);

    const badUpdate = this.config.badUpdateValidation?.(allPropertiesMentioned);

    if (badUpdate)
      throw new Error(
        typeof badUpdate === 'string' ? badUpdate : 'Custom update validation failed',
      );
  }

  getUpdateParams<Entity = AnyObject>(
    params: SingleTableUpdateParams<Entity, RefConfig>,
  ): UpdateParams<Entity> {
    this.validateUpdateProps(params);

    const {
      conditions,
      expiresAt,
      indexes,
      atomicOperations,
      remove,
      values,
      returnUpdatedProperties,
    } = params;

    const addValues = !!(
      (params.indexes && this.config.indexes) ||
      (params.expiresAt && this.config.expiresAt)
    );

    return removeUndefinedProps({
      table: this.config.table,

      key: getPrimaryKey(params, this.config),

      atomicOperations,
      conditions,
      remove,
      returnUpdatedProperties,

      values: (addValues
        ? {
            ...params.values,

            ...(expiresAt ? { [this.config.expiresAt!]: expiresAt } : {}),

            ...(indexes ? transformIndexReferences(indexes as any, this.config) : {}),
          }
        : values) as UpdateParams<Entity>['values'],
    });
  }

  async update<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableUpdateParams<Entity, RefConfig, PKs>,
  ): Promise<Partial<Entity> | undefined> {
    return this.db.update(this.getUpdateParams(params as any));
  }
}
