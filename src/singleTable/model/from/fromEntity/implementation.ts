/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SingleTableParams } from 'singleTable/adaptor';
import type { AnyEntity } from 'singleTable/model';
import type { FromEntity } from './definitions';

import { SingleTableFromEntityMethods } from './methods';

export class SingleTableFromEntity<SingleParams extends SingleTableParams> {
  private config: SingleParams;

  constructor(params: SingleParams) {
    this.config = params;
  }

  fromEntity<Entity extends AnyEntity>(
    entity: Entity,
  ): FromEntity<Entity, SingleParams> {
    return new SingleTableFromEntityMethods(entity, this.config).buildMethods();
  }
}
