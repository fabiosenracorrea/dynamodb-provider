/* eslint-disable @typescript-eslint/no-explicit-any */
import { SingleTableParams } from 'singleTable/adaptor';
import { ExtendableSingleTableEntity } from 'singleTable/model';
import { FromEntity } from './definitions';
import { SingleTableFromEntityMethods } from './methods';

export class SingleTableFromEntity<SingleParams extends SingleTableParams> {
  private config: SingleParams;

  constructor(params: SingleParams) {
    this.config = params;
  }

  fromEntity<Entity extends ExtendableSingleTableEntity>(
    entity: Entity,
  ): FromEntity<Entity, SingleParams> {
    return new SingleTableFromEntityMethods(entity, this.config).buildMethods();
  }
}
