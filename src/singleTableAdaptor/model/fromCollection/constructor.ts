import { ExtendablePartitionCollection } from '../partitionCollection';
import { GetCollectionParams, GetCollectionResult } from './get';

export type FromCollection<Registered extends ExtendablePartitionCollection> = {
  get(...params: GetCollectionParams<Registered>): Promise<GetCollectionResult<Registered>>;
};

export interface FromCollectionMethods {
  fromCollection<Registered extends ExtendablePartitionCollection>(
    entity: Registered,
  ): FromCollection<Registered>;
}
