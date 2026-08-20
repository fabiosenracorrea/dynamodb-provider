import type { Plugin, Connect } from 'vite';

import type { ResolvedPlaygroundConfig } from './types';
import { extractMetadata } from './api/metadata';
import { buildOperationContext, type OperationContext } from './api/core/operation';
import { handleRequest } from './api/router';

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

function apiMiddleware(ctx: OperationContext): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const path = req.url?.split('?')[0];

    if (!path?.startsWith('/api/')) return next();

    res.setHeader('Content-Type', 'application/json');

    const { status, body } = await handleRequest(ctx, {
      method: req.method ?? '',
      path,
      body: await parseBody(req).catch(() => ({})),
    });

    res.statusCode = status;
    res.end(JSON.stringify(body));
  };
}

export function playgroundPlugin(config: ResolvedPlaygroundConfig): Plugin {
  const ctx = buildOperationContext(config, extractMetadata(config));

  return {
    name: 'dynamodb-playground',

    configureServer(server) {
      server.middlewares.use(apiMiddleware(ctx));
    },
  };
}
