/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  NumericIndex,
  SingleTableConditionCheckTransaction,
  SingleTableCreateParams,
  SingleTableCreateTransaction,
  SingleTableDeleteTransaction,
  SingleTableUpdateParams,
  SingleTableUpdateTransaction,
} from 'singleTable/adaptor/definitions';
import { SingleTableConfig } from 'singleTable/adaptor';

import { AnyObject, IsNever, MakePartial } from 'types';

import { omitUndefined } from 'utils/object';
import type { DeleteParams, ValidateTransactParams } from 'provider/utils';
import { BaseAtomicIndexUpdate } from 'singleTable/adaptor/definitions/operations/crud/types';
import type { EntityKeyParams, KeyResolvers } from '../key';

import { addAutoGenParams, type AutoGenParams } from './autoGen';
import type { RegisterEntityParams } from './params';
import type { GenericIndexMappingFns } from './indexParams';

type UnixExpiresAtProps = {
  /**
   * The UNIX timestamp expiration of this item
   */
  expiresAt?: number;
};

export type EntityCRUConfigParams<TableConfig extends SingleTableConfig> =
  TableConfig['typeIndex'] extends { partitionKey: string }
    ? {
        /**
         * By setting this to `true`, **EVERY UPDATE** from an entity will include the `type` value
         *
         * Useful if you use any logic that exclusively rely on `update` to create/mutate an item
         *
         * This is opt-in as will require more write capacity for every update operation
         *
         * **IMPORTANT** Only the `partitionKey` here will be populated
         */
        includeTypeOnEveryUpdate?: boolean;
      }
    : unknown;

export type AtomicIndexParams<
  TableConfig extends SingleTableConfig,
  // It could be the register params or the entity, we only care from the keyname
  IndexReference,
  //
  // SYSTEM:
  //
  __NUMERIC_INDEXES__ = NumericIndex<NonNullable<TableConfig['indexes']>>,
> = IsNever<__NUMERIC_INDEXES__> extends true
  ? unknown
  : IndexReference extends { indexes: Record<string, { index: string }> }
  ? { atomicIndexes?: BaseAtomicIndexUpdate<keyof IndexReference['indexes']>[] }
  : unknown;

type UpdateCallProps<
  TableConfig extends SingleTableConfig,
  Entity extends AnyObject,
> = Pick<
  SingleTableUpdateParams<Entity, TableConfig>,
  'atomicOperations' | 'conditions' | 'remove' | 'values' | 'returnUpdatedProperties'
> &
  (TableConfig extends { expiresAt: string } ? UnixExpiresAtProps : unknown) &
  EntityCRUConfigParams<TableConfig>;

type OnCreateConfig = Required<AutoGenParams<any, SingleTableConfig>>['onCreate'];

type WithOptionalCreationProps<
  CreationProps,
  CreateConfig extends OnCreateConfig,
> = MakePartial<{
  [K in keyof CreationProps]: K extends keyof CreateConfig
    ? CreationProps[K] | undefined
    : CreationProps[K];
}>;

// If autoGen && onCreate => get onCreate props and make optional
type MakeGenPropsPartial<
  CreationProps,
  GenConfig extends RegisterEntityParams<any, any>['autoGen'],
> = GenConfig extends { onCreate: any }
  ? WithOptionalCreationProps<CreationProps, GenConfig['onCreate']>
  : CreationProps;

type BaseCRUDProps<
  TableConfig extends SingleTableConfig,
  Entity extends AnyObject,
  Params extends RegisterEntityParams<any, any>,
> = {
  getCreationParams: (
    item: MakeGenPropsPartial<
      Entity & EntityKeyParams<Entity, Params>,
      Params['autoGen']
    >,

    ...config: TableConfig extends { expiresAt: string } ? [UnixExpiresAtProps?] : []
  ) => SingleTableCreateParams<Entity, TableConfig>;

  getUpdateParams: (
    params: EntityKeyParams<Entity, Params> &
      UpdateCallProps<TableConfig, Entity> &
      AtomicIndexParams<TableConfig, Params>,
  ) => SingleTableUpdateParams<Entity>;
};

type TransactParamResult<
  TableConfig extends SingleTableConfig,
  Entity extends AnyObject,
> = {
  crete: Pick<SingleTableCreateTransaction<TableConfig, Entity>, 'create'>;
  update: Pick<SingleTableUpdateTransaction<TableConfig, Entity>, 'update'>;
  erase: Pick<SingleTableDeleteTransaction<Entity>, 'erase'>;
  validate: Pick<SingleTableConditionCheckTransaction<Entity>, 'validate'>;
};

type TransactCRUDProps<
  TableConfig extends SingleTableConfig,
  Entity extends AnyObject,
  Params extends RegisterEntityParams<any, any>,
> = {
  getValidationParams: (
    params: EntityKeyParams<Entity, Params> &
      Omit<ValidateTransactParams<Entity>, 'key' | 'table'>,
  ) => TransactParamResult<TableConfig, Entity>['validate']['validate'];

  transactCreateParams: (
    ...params: Parameters<BaseCRUDProps<TableConfig, Entity, Params>['getCreationParams']>
  ) => TransactParamResult<TableConfig, Entity>['crete'];

  transactUpdateParams: (
    ...params: Parameters<BaseCRUDProps<TableConfig, Entity, Params>['getUpdateParams']>
  ) => TransactParamResult<TableConfig, Entity>['update'];

  transactDeleteParams: (
    params: EntityKeyParams<Entity, Params> & Omit<DeleteParams<Entity>, 'key' | 'table'>,
  ) => TransactParamResult<TableConfig, Entity>['erase'];

  transactValidateParams: (
    params: EntityKeyParams<Entity, Params> &
      Omit<ValidateTransactParams<Entity>, 'key' | 'table'>,
  ) => TransactParamResult<TableConfig, Entity>['validate'];
};

// fromEntity was acting up
export type ExtendableCRUDProps = {
  getCreationParams: (...params: any[]) => SingleTableCreateParams<any, any>;
  getUpdateParams: (params: any) => SingleTableUpdateParams<any>;
  getValidationParams: (
    ...param: any[]
  ) => Pick<SingleTableConditionCheckTransaction<any>, 'validate'>['validate'];

  transactCreateParams: (
    ...param: any[]
  ) => Pick<SingleTableCreateTransaction<any, any>, 'create'>;
  transactUpdateParams: (
    ...param: any[]
  ) => Pick<SingleTableUpdateTransaction<any, any>, 'update'>;
  transactDeleteParams: (
    ...param: any[]
  ) => Pick<SingleTableDeleteTransaction<any>, 'erase'>;
  transactValidateParams: (
    ...param: any[]
  ) => Pick<SingleTableConditionCheckTransaction<any>, 'validate'>;
};

export type EntityCRUDProps<
  TableConfig extends SingleTableConfig,
  Entity extends AnyObject,
  Params extends RegisterEntityParams<any, any>,
> = BaseCRUDProps<TableConfig, Entity, Params> &
  TransactCRUDProps<TableConfig, Entity, Params>;

type CrudParamsGenerator<
  TableConfig extends SingleTableConfig,
  Entity extends AnyObject,
  Params extends RegisterEntityParams<TableConfig, Entity>,
> = Pick<Params, 'type' | 'autoGen'> &
  KeyResolvers<Params> &
  Partial<GenericIndexMappingFns> & { indexes?: Record<string, { index: string }> };

type GenericGetKey = KeyResolvers<any>['getKey'];

export function getCRUDParamGetters<
  TableConfig extends SingleTableConfig,
  Entity extends AnyObject,
  Params extends RegisterEntityParams<TableConfig, Entity>,
>(
  tableConfig: TableConfig,
  {
    type,
    getKey: entityGetKey,
    getCreationIndexMapping,
    getUpdatedIndexMapping,
    autoGen,
    indexes,
  }: CrudParamsGenerator<TableConfig, Entity, Params>,
): EntityCRUDProps<TableConfig, Entity, Params> {
  const getKey = entityGetKey as GenericGetKey;

  const getCreationParams = (
    item: any,
    config = {},
  ): SingleTableCreateParams<Entity, TableConfig> => {
    const actualItem = addAutoGenParams({
      values: item,
      genConfig: autoGen?.onCreate,
      tableConfig,
    });

    return {
      ...config,

      key: getKey({ ...item, ...actualItem } as any),

      type: tableConfig.typeIndex ? type : undefined,

      item: actualItem,

      indexes: getCreationIndexMapping?.(actualItem),
      // tests covers this is good
    } as any;
  };

  const getUpdateParams = (updateParams: any): SingleTableUpdateParams<AnyObject> => {
    const {
      atomicOperations,
      conditions,
      remove,
      values,
      returnUpdatedProperties,
      expiresAt,
      includeTypeOnEveryUpdate,
      atomicIndexes = [],
    } = updateParams;

    const resolvedValues = addAutoGenParams({
      values: values ?? {},
      genConfig: autoGen?.onUpdate,
      tableConfig,
    });

    return omitUndefined({
      atomicOperations,
      conditions,
      remove,
      returnUpdatedProperties,
      expiresAt,

      ...getKey(updateParams),

      values: resolvedValues,

      type: tableConfig.typeIndex && includeTypeOnEveryUpdate ? type : undefined,

      atomicIndexes: atomicIndexes?.length
        ? (atomicIndexes as BaseAtomicIndexUpdate<string>[]).map(
            ({ index, ...rest }) => ({
              ...rest,
              // converts entity named index like "rank"
              // to the actual table name index that update params uses
              index: indexes?.[index].index,
            }),
          )
        : undefined,

      indexes: getUpdatedIndexMapping?.({
        ...updateParams,
        ...values,
      }),
    });
  };

  const getValidationParams = ({
    conditions,
    ...params
  }: any): TransactParamResult<TableConfig, Entity>['validate']['validate'] => ({
    conditions,
    ...getKey(params),
  });

  return {
    getUpdateParams,
    getCreationParams,

    transactCreateParams: (...params) => ({ create: getCreationParams(...params) }),

    transactUpdateParams: (param) => ({ update: getUpdateParams(param) }),

    transactDeleteParams: (params = {} as any) => ({
      erase: {
        ...(params as AnyObject),
        ...getKey(params),
      },
    }),

    transactValidateParams: (params = {} as any) => ({
      validate: getValidationParams(params),
    }),

    getValidationParams,
  } as EntityCRUDProps<TableConfig, Entity, Params>;
}
