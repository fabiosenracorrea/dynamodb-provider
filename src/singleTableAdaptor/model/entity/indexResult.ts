/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types/general';
import { SingleTableKeyReference, TableIndex } from '../../config';
import { SingleTableCreateItemParams, UpdateIndexMapping } from '../../definitions';
import { RangeQueryConfigProps } from './range';
import { RegisterEntityParams } from './register';
import { IndexMapping, IndexParams } from './indexes';

export type EntityCreateTableParams = Omit<
  SingleTableCreateItemParams<AnyObject>,
  'key' | 'item' | 'indexes' | 'type'
>;

export type EntityIndexConfig<IndexConfig extends IndexMapping> = {
  indexes: {
    [IndexName in keyof IndexConfig]: Omit<IndexConfig[IndexName], 'rangeQueries'> &
      RangeQueryConfigProps<IndexConfig[IndexName]['rangeQueries']> & {
        getIndexKey: (params: IndexParams<IndexConfig>) => SingleTableKeyReference;
      };
  };

  getCreationIndexMapping: (params: IndexParams<IndexConfig>) => {
    [key in TableIndex]?: SingleTableKeyReference;
  };

  getUpdatedIndexMapping: (params: IndexParams<IndexConfig>) => UpdateIndexMapping;
};

export type IndexProps<
  Entity extends AnyObject,
  Params extends RegisterEntityParams<Entity>,
> = Params['indexes'] extends IndexMapping ? EntityIndexConfig<Params['indexes']> : object;
