import { SingleTableParams } from 'singleTable/adaptor';

import { FromEntity, SingleTableFromEntity } from './fromEntity';
import { FromCollection, SingleTableFromCollection } from './fromCollection';
import { ExtendableCollection, ExtendableSingleTableEntity } from '../definitions';

export * from './fromCollection';
export * from './fromEntity';

export type From<
  Target extends ExtendableSingleTableEntity | ExtendableCollection,
  Params extends SingleTableParams,
> = Target extends ExtendableSingleTableEntity
  ? FromEntity<Target, Params>
  : Target extends ExtendableCollection
  ? FromCollection<Target>
  : never;

export class SchemaFrom<SingleParams extends SingleTableParams> {
  private entityRepo: SingleTableFromEntity<SingleParams>;

  private collectionRepo: SingleTableFromCollection<SingleParams>;

  constructor(params: SingleParams) {
    this.entityRepo = new SingleTableFromEntity(params);

    this.collectionRepo = new SingleTableFromCollection(params);
  }

  fromEntity<Registered extends ExtendableSingleTableEntity>(
    entity: Registered,
  ): FromEntity<Registered, SingleParams> {
    return this.entityRepo.fromEntity(entity);
  }

  fromCollection<Collection extends ExtendableCollection>(
    collection: Collection,
  ): FromCollection<Collection> {
    return this.collectionRepo.fromCollection(collection);
  }

  from<Target extends ExtendableSingleTableEntity | ExtendableCollection>(
    target: Target,
  ): From<Target, SingleParams> {
    const result =
      target.__dbType === 'ENTITY' ? this.fromEntity(target) : this.fromCollection(target);

    return result as unknown as From<Target, SingleParams>;
  }
}
