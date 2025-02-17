/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  SingleTableConditionCheckTransaction,
  SingleTableCreateItemParams,
  SingleTableCreateTransaction,
  SingleTableDeleteTransaction,
  SingleTableUpdateParams,
  SingleTableUpdateTransaction,
} from 'singleTable/adaptor/definitions';
import { SingleTableConfig } from 'singleTable/adaptor';

import { AnyObject, MakePartial } from 'types';

import { omitUndefined } from 'utils/object';
import { EntityKeyParams, KeyResolvers } from '../key';

import { addAutoGenParams, AutoGenParams } from './autoGen';
import { RegisterEntityParams } from './params';
import { GenericIndexMappingFns } from './indexParams';

type UnixExpiresAtProps = {
  /**
   * The UNIX timestamp expiration of this item
   */
  expiresAt?: number;
};

type UpdateCallProps<TableConfig extends SingleTableConfig, Entity extends AnyObject> = Pick<
  SingleTableUpdateParams<Entity, TableConfig>,
  'atomicOperations' | 'conditions' | 'remove' | 'values' | 'returnUpdatedProperties'
> &
  (TableConfig extends { expiresAt: string } ? UnixExpiresAtProps : unknown);

type OnCreateConfig = Required<AutoGenParams<any>>['onCreate'];

type WithOptionalCreationProps<CreationProps, CreateConfig extends OnCreateConfig> = MakePartial<{
  [K in keyof CreationProps]: K extends keyof CreateConfig
    ? CreationProps[K] | undefined
    : CreationProps[K];
}>;

// If autoGen && onCreate => get onCreate props and make optional
type MakeGenPropsPartial<
  CreationProps,
  GenConfig extends RegisterEntityParams<any, any>['autoGen'],
> = GenConfig extends AutoGenParams<any>
  ? GenConfig['onCreate'] extends OnCreateConfig
    ? WithOptionalCreationProps<CreationProps, GenConfig['onCreate']>
    : CreationProps
  : CreationProps;

type BaseCRUDProps<
  TableConfig extends SingleTableConfig,
  Entity extends AnyObject,
  Params extends RegisterEntityParams<any, any>,
> = {
  getCreationParams: (
    item: MakeGenPropsPartial<Entity & EntityKeyParams<Params>, Params['autoGen']>,

    ...config: TableConfig extends { expiresAt: string } ? [UnixExpiresAtProps?] : []
  ) => SingleTableCreateItemParams<Entity, TableConfig>;

  getUpdateParams: (
    params: EntityKeyParams<Params> & UpdateCallProps<TableConfig, Entity>,
  ) => SingleTableUpdateParams<Entity>;
};

type TransactCRUDProps<
  TableConfig extends SingleTableConfig,
  Entity extends AnyObject,
  Params extends RegisterEntityParams<any, any>,
> = {
  transactCreateParams: (
    ...params: Parameters<BaseCRUDProps<TableConfig, Entity, Params>['getCreationParams']>
  ) => Pick<SingleTableCreateTransaction<TableConfig, Entity>, 'create'>;

  transactUpdateParams: (
    ...params: Parameters<BaseCRUDProps<TableConfig, Entity, Params>['getUpdateParams']>
  ) => Pick<SingleTableUpdateTransaction<TableConfig, Entity>, 'update'>;

  transactDeleteParams: (
    params: EntityKeyParams<Params>,
  ) => Pick<SingleTableDeleteTransaction<Entity>, 'erase'>;

  transactValidateParams: (
    params: EntityKeyParams<Params>,
  ) => Pick<SingleTableConditionCheckTransaction<Entity>, 'validate'>;
};

// fromEntity was acting up
export type ExtendableCRUDProps = {
  getCreationParams: (...params: any[]) => SingleTableCreateItemParams<any, any>;
  getUpdateParams: (params: any) => SingleTableUpdateParams<any>;

  transactCreateParams: (...param: any[]) => Pick<SingleTableCreateTransaction<any, any>, 'create'>;
  transactUpdateParams: (...param: any[]) => Pick<SingleTableUpdateTransaction<any, any>, 'update'>;
  transactDeleteParams: (...param: any[]) => Pick<SingleTableDeleteTransaction<any>, 'erase'>;
  transactValidateParams: (
    ...param: any[]
  ) => Pick<SingleTableConditionCheckTransaction<any>, 'validate'>;
};

export type EntityCRUDProps<
  TableConfig extends SingleTableConfig,
  Entity extends AnyObject,
  Params extends RegisterEntityParams<any, any>,
> = BaseCRUDProps<TableConfig, Entity, Params> & TransactCRUDProps<TableConfig, Entity, Params>;

type CrudParamsGenerator<
  TableConfig extends SingleTableConfig,
  Entity extends AnyObject,
  Params extends RegisterEntityParams<TableConfig, Entity>,
> = Pick<Params, 'type' | 'autoGen'> & KeyResolvers<Params> & Partial<GenericIndexMappingFns>;

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
  }: CrudParamsGenerator<TableConfig, Entity, Params>,
): EntityCRUDProps<TableConfig, Entity, Params> {
  const getKey = entityGetKey as GenericGetKey;

  const getCreationParams = (
    item: any,
    config = {},
  ): SingleTableCreateItemParams<Entity, TableConfig> => {
    const actualItem = addAutoGenParams(item, autoGen?.onCreate);

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
    const { atomicOperations, conditions, remove, values, returnUpdatedProperties, expiresAt } =
      updateParams;

    const resolvedValues = addAutoGenParams(values ?? {}, autoGen?.onUpdate);

    return omitUndefined({
      atomicOperations,
      conditions,
      remove,
      returnUpdatedProperties,
      expiresAt,

      ...getKey(updateParams),

      values: resolvedValues,

      indexes: getUpdatedIndexMapping?.({
        ...updateParams,
        ...values,
      }),
    });
  };

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
      validate: {
        ...(params as AnyObject),
        ...getKey(params),
      },
    }),
  } as EntityCRUDProps<TableConfig, Entity, Params>;
}
