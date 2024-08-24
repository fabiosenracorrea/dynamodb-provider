/* eslint-disable @typescript-eslint/no-explicit-any */
import { cascadeEval } from './conditions';

const INDEX_OFFSET = 1;

export function getLastIndex(array: any[]): number {
  const lastIndex = array.length - INDEX_OFFSET;

  return lastIndex;
}

export function getFirstItem<E = any>(array: E[]): E | undefined {
  return array[0];
}

export function getLastItem<E = any>(array: E[]): E | undefined {
  return array[getLastIndex(array)];
}

export function getNextIndex(index: number): number {
  return index + 1;
}

export function ensureMaxArraySize<Entity = any>(items: Entity[], lengthLimit: number): Entity[][] {
  if (items.length <= lengthLimit) return [items];

  const numberOfSubArrays = Math.ceil(items.length / lengthLimit);

  const subArrays = Array.from({ length: numberOfSubArrays }).map((_, index) => {
    const start = index * lengthLimit;
    const end = (index + INDEX_OFFSET) * lengthLimit;

    return items.slice(start, end);
  });

  return subArrays;
}

export function toUniqueList<T>(list: T[]): T[] {
  return Array.from(new Set(list));
}

export function ensureArray<E>(item: E | E[]): E[] {
  return Array.isArray(item) ? item : [item];
}

export function removeFromList<E>(list: E[], ref: string | E, refProp: keyof E | 'id' = 'id'): E[] {
  const prop = refProp as keyof E;
  const removeRef = typeof ref === 'string' ? ref : ref[prop];

  return list.filter((item) => item[prop] !== removeRef);
}

export function getFromList<E>(
  list: E[],
  ref: string | E,
  path: ((item: E) => string) | keyof E | 'id' = 'id',
): E | undefined {
  if (!ref || !list?.length) return;

  const removeRef = cascadeEval([
    { is: typeof ref === 'string', then: ref },
    { is: typeof path === 'function', then: () => (path as (e: E) => string)(ref as E) },
    { is: true, then: (ref as E)[path as keyof E] as string },
  ]);

  return list.find(
    (item) => (typeof path === 'function' ? path(item) : item[path as keyof E]) === removeRef,
  );
}

export function updateList<E>(list: E[], ref: E, refProp: keyof E | 'id' = 'id'): E[] {
  const prop = refProp as keyof E;

  return list.map((item) => (item[prop] === ref[prop] ? ref : item));
}

export function toTruthyList<T>(list: T[]): NonNullable<T>[] {
  return list.filter(Boolean) as NonNullable<T>[];
}
