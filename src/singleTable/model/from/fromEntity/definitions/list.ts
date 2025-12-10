import type { AnyObject } from 'types';
import type {
  BasicRangeKeyConfig,
  BetweenRangeKeyConfig,
  QueryConfigParams,
} from 'provider/utils';

type BasicRangeConfig = {
  value: string;
  operation: Extract<
    BasicRangeKeyConfig<AnyObject>['operation'],
    'lower_than' | 'lower_or_equal_than' | 'bigger_than' | 'bigger_or_equal_than'
  >;
};

type BetweenRangeConfig = Omit<BetweenRangeKeyConfig<AnyObject>, 'name'>;

export interface ListEntityParams extends QueryConfigParams<AnyObject> {
  range?: BasicRangeConfig | BetweenRangeConfig;
}

export interface ListEntityResult<Entity = AnyObject> {
  items: Entity[];

  paginationToken: string;
}
