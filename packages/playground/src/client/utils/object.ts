/* eslint-disable @typescript-eslint/no-explicit-any */

import { AnyObject, StableOmit } from '@/types';

export function pick<Obj extends AnyObject, Key extends keyof Obj>(
  object: Obj,
  propsToKeep: Key[],
): Pick<Obj, Key> {
  const picked = Object.fromEntries(propsToKeep.map((prop) => [prop, object[prop]]));

  return picked as Pick<Obj, Key>;
}

export function omit<Obj extends AnyObject, Key extends keyof Obj>(
  object: Obj,
  propsToExclude: Key[],
): StableOmit<Obj, Key> {
  const curated = Object.fromEntries(
    Object.entries(object).filter(([prop]) => !propsToExclude.includes(prop as Key)),
  );

  return curated as StableOmit<Obj, Key>;
}
