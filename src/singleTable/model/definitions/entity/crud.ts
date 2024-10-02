/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  SingleTableCreateItemParams,
  SingleTableUpdateParams,
} from 'singleTable/adaptor/definitions';
import { SingleTableConfig } from 'singleTable/adaptor';

import { AnyObject, MakePartial } from 'types';

import { removeUndefinedProps } from 'utils/object';
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

// Using this type was glitching TS inside a partition entity creation with autoGen
// for whatever reason this complex type works
// type MakeKeysOptional<E, Keys extends string | number | symbol> = Omit<E, Keys> &
//   (Keys extends keyof E ? { [K in Keys]?: E[K] } : unknown);

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

export type EntityCRUDProps<
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

type CrudParamsGenerator<
  TableConfig extends SingleTableConfig,
  Entity extends AnyObject,
  Params extends RegisterEntityParams<TableConfig, Entity>,
> = Pick<Params, 'type' | 'autoGen'> & KeyResolvers<Params> & Partial<GenericIndexMappingFns>;

export function getCRUDParamGetters<
  TableConfig extends SingleTableConfig,
  Entity extends AnyObject,
  Params extends RegisterEntityParams<TableConfig, Entity>,
>(
  tableConfig: TableConfig,
  {
    type,
    getKey,
    getCreationIndexMapping,
    getUpdatedIndexMapping,
    autoGen,
  }: CrudParamsGenerator<TableConfig, Entity, Params>,
): EntityCRUDProps<TableConfig, Entity, Params> {
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

    return removeUndefinedProps({
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
  } as EntityCRUDProps<TableConfig, Entity, Params>;
}
