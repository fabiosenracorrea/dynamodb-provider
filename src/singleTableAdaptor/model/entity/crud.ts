/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject, RemoveTableProperties } from 'types/general';
import { SingleTableCreateItemParams, SingleTableUpdateParams } from '../../definitions';
import { AutoGenFieldConfig } from './autoGen';
import { RegisterEntityParams } from './register';
import { EntityKeyParams } from './key';

export type EntityCreateTableParams = Omit<
  SingleTableCreateItemParams<AnyObject>,
  'key' | 'item' | 'indexes' | 'type'
>;

type OnlyCreationProps<GenConfig extends AutoGenFieldConfig<any>> = {
  [Key in keyof GenConfig]: GenConfig[Key] extends { onCreation: true } ? Key : never;
}[keyof GenConfig];

type MakeGenPropsPartial<
  CreationProps,
  GenConfig extends AutoGenFieldConfig<any> | undefined,
> = GenConfig extends AutoGenFieldConfig<any>
  ? Omit<CreationProps, OnlyCreationProps<GenConfig>> & {
      [Key in OnlyCreationProps<GenConfig>]?: Key extends keyof CreationProps
        ? CreationProps[Key]
        : any;
    }
  : CreationProps;

export type CRUDProps<Entity extends AnyObject, Params extends RegisterEntityParams<Entity>> = {
  getCreationParams: (
    item: RemoveTableProperties<
      MakeGenPropsPartial<Entity & EntityKeyParams<Params>, Params['autoGen']>
    >,

    config?: EntityCreateTableParams,
  ) => SingleTableCreateItemParams<Entity>;

  getUpdateParams: (
    params: EntityKeyParams<Params> &
      Pick<
        SingleTableUpdateParams<RemoveTableProperties<Entity>>,
        | 'atomicOperations'
        | 'conditions'
        | 'remove'
        | 'values'
        | 'unixExpiresAt'
        | 'returnUpdatedProperties'
      >,
  ) => SingleTableUpdateParams<Entity>;
};
