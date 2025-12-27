import type { Plugin, Connect } from 'vite';
import type { PlaygroundConfig } from './types';

import { extractMetadata } from './api/metadata';
import { routes } from './api';

function parseBody(req: Connect.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function apiMiddleware(
  config: PlaygroundConfig,
  metadata: ReturnType<typeof extractMetadata>,
): Connect.NextHandleFunction {
  return async (req, res, next) => {
    if (!req.url?.startsWith('/api/')) {
      return next();
    }

    res.setHeader('Content-Type', 'application/json');

    try {
      const handler = routes[req.method || '']?.[req.url || ''];

      const result = await handler?.({
        body: await parseBody(req),
        config,
        metadata,
      });

      if (result) return res.end(JSON.stringify(result));

      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Not found' }));
    } catch (err) {
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }),
      );
    }
  };
}

export function playgroundPlugin(config: PlaygroundConfig): Plugin {
  const metadata = extractMetadata(config);

  return {
    name: 'dynamodb-playground',
    configureServer(server) {
      server.middlewares.use(apiMiddleware(config, metadata));
    },
  };
}
