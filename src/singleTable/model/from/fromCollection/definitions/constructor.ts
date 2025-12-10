import type { AnyCollection } from 'singleTable/model';

import type { GetCollectionParams, GetCollectionResult } from './get';

export type FromCollection<Registered extends AnyCollection> = {
  /**
   * Retrieve your collection
   *
   * IMPORTANT: Currently, this only supports full retrievals, meaning
   * the data fetch will continue as long as the collection query keeps
   * yielding items
   */
  get(
    ...params: GetCollectionParams<Registered>
  ): Promise<GetCollectionResult<Registered>>;
};

export interface FromCollectionMethods {
  fromCollection<Registered extends AnyCollection>(
    entity: Registered,
  ): FromCollection<Registered>;
}
