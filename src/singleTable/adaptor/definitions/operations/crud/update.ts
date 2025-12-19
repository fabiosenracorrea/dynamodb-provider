/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

import { AnyObject, StringKey } from 'types';

import { omitUndefined } from 'utils/object';
import { toTruthyList } from 'utils/array';

import { UpdateParams } from 'provider';

import { SingleTableConfig } from '../../config';
import { getPrimaryKey, SingleTableKeyReference } from '../../key';
import { BaseSingleTableOperator } from '../../executor';
import { isValidNumericIndexRef, transformIndexReferences } from '../../tableIndex';
import { resolveProps } from '../../parsers';
import { AtomicIndexUpdate, ParamsByTableConfigForUpdate } from './types';

export type SingleTableUpdateParams<
  Entity,
  TableConfig extends SingleTableConfig = SingleTableConfig,
  PKs extends StringKey<Entity> | unknown = unknown,
> = SingleTableKeyReference &
  Partial<ParamsByTableConfigForUpdate<TableConfig>> &
  Omit<UpdateParams<Entity, PKs>, 'table' | 'key'>;

type RefConfig = Required<SingleTableConfig>;

export class SingleTableUpdater extends BaseSingleTableOperator {
  private getAllTableProperties(): string[] {
    const props = [
      this.config.partitionKey,
      this.config.rangeKey,
      this.config.expiresAt,
      this.config.typeIndex?.partitionKey,
      this.config.typeIndex?.rangeKey,
      ...Object.values(this.config.indexes ?? {})
        .map(({ partitionKey, rangeKey }) => [partitionKey, rangeKey])
        .flat(),
    ];

    return toTruthyList(props);
  }

  private validateInternalRef(properties: Set<string>) {
    const check = this.config.blockInternalPropUpdate ?? true;

    if (!check) return;

    const badRefs = this.getAllTableProperties().filter((prop) => properties.has(prop));

    if (!badRefs.length) return;

    throw new Error(
      `Invalid Update Detected: Internal prop referenced: ${badRefs.join(', ')}.`,
    );
  }

  private validateAtomicIndexes(references?: AtomicIndexUpdate<any>[]) {
    if (!references?.length) return;

    const ok = references.every(({ index }) =>
      isValidNumericIndexRef(index, this.config),
    );

    if (!ok) throw new Error('Invalid atomic index reference detected');
  }

  private validateUpdateProps({
    values,
    atomicOperations,
    remove,
    atomicIndexes,
  }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SingleTableUpdateParams<any> & {
    atomicIndexes?: AtomicIndexUpdate<any>[];
  }) {
    const allPropertiesMentioned = new Set([
      ...Object.keys(values || []),
      ...(remove || []),
      ...(atomicOperations || []).map(({ property }) => property),
    ]);

    const includesPK = [this.config.partitionKey, this.config.rangeKey].some((prop) =>
      allPropertiesMentioned.has(prop),
    );

    if (includesPK)
      throw new Error(`Update contained references to ${this.config.table}'s PKs`);

    this.validateAtomicIndexes(atomicIndexes);

    this.validateInternalRef(allPropertiesMentioned);

    const badUpdate = this.config.badUpdateValidation?.(allPropertiesMentioned);

    if (badUpdate)
      throw new Error(
        typeof badUpdate === 'string' ? badUpdate : 'Custom update validation failed',
      );
  }

  private resolveAtomic(
    params: SingleTableUpdateParams<any, RefConfig>,
  ): SingleTableUpdateParams<any, RefConfig>['atomicOperations'] {
    const {
      atomicOperations = [],

      atomicIndexes = [],
    } = params as SingleTableUpdateParams<any, RefConfig> & {
      atomicIndexes?: AtomicIndexUpdate<any>[];
    };

    const mixed = [
      ...atomicOperations,
      ...atomicIndexes.map(({ index, ...rest }) => ({
        ...rest,
        property: this.config.indexes![index].rangeKey as any,
      })),
    ];

    if (!mixed.length) return;

    return mixed;
  }

  getUpdateParams<Entity = AnyObject>(
    params: SingleTableUpdateParams<Entity, RefConfig>,
  ): UpdateParams<Entity> {
    this.validateUpdateProps(params);

    const {
      conditions,
      expiresAt,
      indexes,
      remove,
      values,
      returnUpdatedProperties,
      type,
    } = params;

    const addValues = !!(
      (params.indexes && this.config.indexes) ||
      (params.expiresAt && this.config.expiresAt) ||
      (params.type && this.config.typeIndex)
    );

    return omitUndefined({
      table: this.config.table,

      key: getPrimaryKey(params, this.config),

      atomicOperations: this.resolveAtomic(params),
      conditions,
      remove,
      returnUpdatedProperties,

      values: (addValues
        ? {
            ...params.values,

            ...(expiresAt ? { [this.config.expiresAt!]: expiresAt } : {}),

            ...(type ? { [this.config.typeIndex!.partitionKey]: type } : {}),

            ...(indexes ? transformIndexReferences(indexes as any, this.config) : {}),
          }
        : values) as UpdateParams<Entity>['values'],
    });
  }

  async update<Entity, PKs extends StringKey<Entity> | unknown = unknown>(
    params: SingleTableUpdateParams<Entity, RefConfig, PKs>,
  ): Promise<Partial<Entity> | undefined> {
    const result = await this.db.update(this.getUpdateParams(params as any));

    if (params.returnUpdatedProperties && result)
      return resolveProps(result, this.config, this.parser) as Partial<Entity>;
  }
}
