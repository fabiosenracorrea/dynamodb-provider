/* eslint-disable @typescript-eslint/no-explicit-any */
import { Partition } from '../partition';
import { AtLeastOne, EmptyObject } from './helpers';

export type SingleCollectionRefConfig = Record<
  string, // prop name on the merged obj
  {
    // this is fine because TS will infer correctly when used as param
    entity: any;
    type: 'SINGLE' | 'MULTIPLE';
    /* add value extractor logic, with extra typing

      eg: pass User to the register Entity, and on the partition, appoint { permissions: { entity: UserPermissions, type: 'SINGLE', extractor: (data: UserPermissions) => type extends 'SINGLE' ? (string | number | any[] | object | boolean) : Obj[] } }

      ideia here is to get the { userId: string, permissions: string[] } UserPermissions type and make it to string[] to be added to the 'permissions' property of the merged User

    */
  }
>;

type ExtensionCollectionConfig = Record<
  string,
  {
    partition: Partition<any>;

    values: SingleCollectionRefConfig;
  }
>;

type FullCollectionConfig = {
  partition: SingleCollectionRefConfig;

  extension: ExtensionCollectionConfig;
};

// makes sure an empty object is not accepted and we get intellisense
export type BaseCollectionConfig = AtLeastOne<FullCollectionConfig>;

export type CollectionConfigProps<CollectionConfig extends BaseCollectionConfig | undefined> =
  CollectionConfig extends BaseCollectionConfig
    ? { collectionEntities: CollectionConfig }
    : EmptyObject;
