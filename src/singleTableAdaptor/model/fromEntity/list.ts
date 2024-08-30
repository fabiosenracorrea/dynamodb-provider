import { AnyObject } from 'types/general';
import {
  BasicRangeKeyConfig,
  BetweenRangeKeyConfig,
  QueryParams,
} from '../../../provider/utils';

type BasicRangeConfig = {
  value: string;
  operation: Extract<
    BasicRangeKeyConfig<AnyObject>['operation'],
    'lower_than' | 'lower_or_equal_than' | 'bigger_than' | 'bigger_or_equal_than'
  >;
};

type BetweenRangeConfig = Omit<BetweenRangeKeyConfig<AnyObject>, 'name'>;

export interface ListEntityParams
  extends Pick<
    QueryParams<AnyObject>,
    'fullRetrieval' | 'paginationToken' | 'limit' | 'retrieveOrder'
  > {
  dateRange?: BasicRangeConfig | BetweenRangeConfig;
}

export interface ListEntityResult<Entity = AnyObject> {
  items: Entity[];

  paginationToken: string;
}
