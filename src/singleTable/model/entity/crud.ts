/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  SingleTableCreateItemParams,
  SingleTableUpdateParams,
} from 'singleTable/adaptor/definitions';
import { SingleTableParams } from 'singleTable/adaptor';

import { AnyObject } from 'types';

import { AutoGenParams } from './autoGen';
import { RegisterEntityParams } from './params';
import { EntityKeyParams } from '../key';

type UpdateCallProps<TableConfig extends SingleTableParams, Entity extends AnyObject> = Pick<
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
  TableConfig extends SingleTableParams,
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
