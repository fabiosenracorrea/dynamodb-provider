/* eslint-disable @typescript-eslint/no-explicit-any */
import { extractMetadata } from './metadata';
import { resolveKeys } from './resolve-keys';
import { executeOperation } from './execute';

import type { PlaygroundConfig } from '../types';

interface RouteRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
  config: PlaygroundConfig;
  metadata: ReturnType<typeof extractMetadata>;
}

export const routes: Record<
  string,
  Record<string, (p: RouteRequest) => any | Promise<any>>
> = {
  GET: {
    '/api/metadata': ({ metadata }) => metadata,
  },

  POST: {
    '/api/execute': ({ body, config }) => executeOperation(config, body),

    '/api/resolve-keys': ({ body, config }) => resolveKeys(config, body),
  },
};
