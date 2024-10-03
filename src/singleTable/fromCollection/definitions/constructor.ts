import { ExtendableCollection } from 'singleTable/model';

import { GetCollectionParams, GetCollectionResult } from './get';

export type FromCollection<Registered extends ExtendableCollection> = {
  get(...params: GetCollectionParams<Registered>): Promise<GetCollectionResult<Registered>>;
};

export interface FromCollectionMethods {
  fromCollection<Registered extends ExtendableCollection>(
    entity: Registered,
  ): FromCollection<Registered>;
}
