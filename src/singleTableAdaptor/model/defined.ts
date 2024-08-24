/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyObject } from 'types/general';
import { IndexMapping, RegisterEntityParams, RegisteredEntity } from './entity';

export interface DefinedMethods<Entity extends AnyObject> {
  registerEntity<Params extends RegisterEntityParams<Entity>>(
    params: Params,
  ): RegisteredEntity<Entity, Params>;
}

export type ExtendableRegisteredEntity = RegisteredEntity<AnyObject, RegisterEntityParams<any>>;

export type ExtendableWithIndexRegisteredEntity = RegisteredEntity<
  AnyObject,
  RegisterEntityParams<any> & { indexes: IndexMapping }
>;
