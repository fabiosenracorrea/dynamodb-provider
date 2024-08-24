import {
  BasicRangeKeyConfig,
  BetweenRangeKeyConfig,
  CollectionListParams,
} from '../../../provider/utils';

import { KeyValue, TableIndex } from '../../config';

// if we did simply Omit<RangeKeyConfig, 'name'>
// TS would not require the other params for some reason
export type DefinedNameRangeKeyConfig =
  | (Omit<BasicRangeKeyConfig<unknown>, 'name' | 'value'> & {
      value: KeyValue | BasicRangeKeyConfig<unknown>['value'];
    })
  | (Omit<BetweenRangeKeyConfig<unknown>, 'name' | 'high' | 'low'> & {
      low: KeyValue | BetweenRangeKeyConfig<unknown>['low'];
      high: KeyValue | BetweenRangeKeyConfig<unknown>['high'];
    });

export type SingleTableCollectionListParams<Entity> = Omit<
  CollectionListParams<Entity>,
  'index' | 'hashKey' | 'rangeKey' | 'table'
> & {
  index?: TableIndex;

  partition: KeyValue;

  range?: DefinedNameRangeKeyConfig;
};
