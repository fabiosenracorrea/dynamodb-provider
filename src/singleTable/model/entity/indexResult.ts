/* eslint-disable @typescript-eslint/no-explicit-any */

import { SingleTableKeyReference } from 'singleTable/adaptor/definitions';
import { SingleTableParams } from 'singleTable/adaptor';

import { IndexMapping, IndexParams, SingleTableConfigWithIndex } from '../indexes';
import { KeyResolvers } from '../key';
import { RangeQueryResultProps } from '../range';

type EntityIndexConfig<
  TableConfig extends SingleTableConfigWithIndex,
  IndexConfig extends IndexMapping<TableConfig>,
  TableIndex extends keyof TableConfig['indexes'] = keyof TableConfig['indexes'],
> = {
  indexes: {
    [IndexName in TableIndex]: Omit<IndexConfig[IndexName], 'rangeQueries'> &
      RangeQueryResultProps<IndexConfig[IndexName]['rangeQueries']> &
      KeyResolvers<IndexConfig[IndexName]>;
  };

  getCreationIndexMapping: (params: IndexParams<IndexConfig>) => {
    [key in TableIndex]?: Partial<SingleTableKeyReference>;
  };

  getUpdatedIndexMapping: (params: IndexParams<IndexConfig>) => {
    [key in TableIndex]?: Partial<SingleTableKeyReference>;
  };
};

export type EntityIndexParams<
  TableConfig extends SingleTableParams,
  Params extends { indexes?: IndexMapping },
> = TableConfig extends SingleTableConfigWithIndex
  ? Params['indexes'] extends IndexMapping<TableConfig>
    ? EntityIndexConfig<TableConfig, Params['indexes']>
    : unknown
  : unknown;
