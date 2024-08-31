import { StringKey } from 'types';
import { UpdateParams } from '../../../provider/utils';

import { AsSingleTableParams } from './helpers';

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
