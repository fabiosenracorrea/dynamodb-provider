/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnyObject } from 'types/general';
import { SingleTableCreateItemParams } from '../../definitions';

export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

export type SubSet<
  Params extends AnyObject | undefined = undefined,
  Entity = AnyObject,
> = Params extends undefined ? undefined : Entity extends Params ? Params : never;

export type EntityParamsOnly<Entity = undefined> = Entity extends undefined
  ? any
  : { [Key in keyof Entity]: Entity[Key] };

// // https://stackoverflow.com/questions/50374908/transform-union-type-to-intersection-type
// type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
//   ? I
//   : never;

export type EntityCreateTableParams = Omit<
  SingleTableCreateItemParams<AnyObject>,
  'key' | 'item' | 'indexes' | 'type'
>;

// undefined & Record<string, string> = never, we don't want this
export type SafeObjectUnion<PossibleUndefinedObject> = PossibleUndefinedObject extends undefined
  ? object
  : PossibleUndefinedObject;

export type EmptyObject = Record<string, unknown>;
