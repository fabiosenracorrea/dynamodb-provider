import { StringKey } from 'types';
import { SingleTableKeyReference, TableIndex } from '../../config';
import { GetItemParams, UpdateParams } from '../../../provider/utils';

import { AsSingleTableParams } from './helpers';

export type SingleTableGetParams<
  Entity,
  PKs extends StringKey<Entity> | unknown = unknown,
> = AsSingleTableParams<GetItemParams<Entity, PKs>, 'table' | 'key'>;

export type SingleTableCreateItemParams<Entity> = {
  item: Entity;

  key: SingleTableKeyReference;

  type: string;

  unixExpiresAt?: number;

  indexes?: {
    [key in TableIndex]?: SingleTableKeyReference;
  };
};

export type UpdateIndexMapping = {
  [key in TableIndex]?: Partial<SingleTableKeyReference>;
};

export type SingleTableUpdateParams<
  Entity,
  PKs extends StringKey<Entity> | unknown = unknown,
> = AsSingleTableParams<UpdateParams<Entity, PKs>, 'table' | 'key'> & {
  unixExpiresAt?: number;

  indexes?: UpdateIndexMapping;
};
