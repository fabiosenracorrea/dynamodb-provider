import { AnyObject } from 'types/general';
import {
  BasicRangeKeyConfig,
  BetweenRangeKeyConfig,
  CollectionListParams,
} from '../../../provider/utils';

type BasicRangeConfig = {
  value: string;
  operation: Extract<
    BasicRangeKeyConfig<AnyObject>['operation'],
    'lower_than' | 'lower_or_equal_than' | 'bigger_than' | 'bigger_or_equal_than'
  >;
};

type BetweenRangeConfig = Omit<BetweenRangeKeyConfig<AnyObject>, 'name'>;

export interface ListItemTypeParams
  extends Pick<
    CollectionListParams<AnyObject>,
    'fullRetrieval' | 'paginationToken' | 'limit' | 'retrieveOrder'
  > {
  type: string;

  dateRange?: BasicRangeConfig | BetweenRangeConfig;
}

export interface ListItemTypeResult<Entity = AnyObject> {
  items: Entity[];

  paginationToken: string;
}
