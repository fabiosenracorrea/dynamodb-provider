/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  SingleTableCreateItemParams,
  SingleTableUpdateParams,
} from 'singleTable/adaptor/definitions';
import { SingleTableConfig } from 'singleTable/adaptor';

import { AnyObject } from 'types';

import { EntityKeyParams, KeyResolvers } from '../key';

import { addAutoGenParams, AutoGenParams } from './autoGen';
import { RegisterEntityParams } from './params';
import { GenericIndexMappingFns } from './indexParams';

type UpdateCallProps<TableConfig extends SingleTableConfig, Entity extends AnyObject> = Pick<
  SingleTableUpdateParams<Entity, TableConfig>,
  'atomicOperations' | 'conditions' | 'remove' | 'values' | 'returnUpdatedProperties'
> &
  (TableConfig extends { expiresAt: string } ? { expiresAt: string } : unknown);

type OnCreateConfig = Required<AutoGenParams<any>>['onCreate'];

type MakeKeysOptional<E, Keys extends string | number | symbol> = Omit<E, Keys> &
  (Keys extends keyof E ? { [K in Keys]?: E[K] } : unknown);

type WithOptionalCreationProps<CreationProps, CreateConfig extends OnCreateConfig> = Omit<
  CreationProps,
  keyof CreateConfig
> &
  MakeKeysOptional<CreationProps, keyof CreateConfig>;

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

    ...config: TableConfig extends { expiresAt: string } ? [{ expiresAt: string }?] : []
  ) => SingleTableCreateItemParams<Entity>;

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
  type WantedParams = EntityCRUDProps<TableConfig, Entity, Params>;

  type CreationParams = Parameters<WantedParams['getCreationParams']>;

  const getCreationParams = (
    item: CreationParams[0],
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

  type UpdateParams = Parameters<WantedParams['getUpdateParams']>;

  const getUpdateParams = (updateParams: UpdateParams[0]): SingleTableUpdateParams<AnyObject> => {
    const values = addAutoGenParams(updateParams.values ?? {}, autoGen?.onUpdate);

    return {
      ...updateParams,

      ...getKey(updateParams),

      values,

      indexes: getUpdatedIndexMapping?.({
        ...updateParams,
        ...values,
      }),
    };
  };

  return {
    getUpdateParams,
    getCreationParams,
  } as WantedParams;
}
