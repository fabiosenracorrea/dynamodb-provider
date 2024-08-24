import { IfAny } from 'types/general';
import { ExtendableRegisteredEntity } from '../defined';
import { EmptyObject } from '../entity/helpers';

export type EntityKeyParams<Registered extends ExtendableRegisteredEntity> = IfAny<
  Parameters<Registered['getKey']>[0],
  EmptyObject,
  Parameters<Registered['getKey']>[0]
>;
