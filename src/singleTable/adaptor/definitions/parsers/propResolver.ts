import { AnyObject } from 'types';

import { SingleTableConfig } from '../config';
import { cleanInternalProps } from './propRemoval';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PostCleanUp<E> = (item: E) => any;

export function resolveProps<E extends AnyObject>(
  obj: E,
  config: SingleTableConfig,
  parser?: PostCleanUp<E>,
): E {
  const internalRemoved = cleanInternalProps(obj, config);

  return parser?.(internalRemoved) ?? internalRemoved;
}

export function resolvePropsFromList<E extends AnyObject>(
  list: E[],
  config: SingleTableConfig,
  parser?: PostCleanUp<E>,
): E[] {
  return list.map((item) => resolveProps(item, config, parser));
}
