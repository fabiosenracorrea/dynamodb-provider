import type { Plugin, Connect } from 'vite';
import type { PlaygroundConfig, ExecuteRequest } from './types.js';
import { extractMetadata } from './api/metadata.js';
import { executeOperation } from './api/execute.js';

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
      // GET /api/metadata
      if (req.url === '/api/metadata' && req.method === 'GET') {
        res.end(JSON.stringify(metadata));
        return;
      }

      // POST /api/execute
      if (req.url === '/api/execute' && req.method === 'POST') {
        const body = await parseBody(req);
        const request = body as ExecuteRequest;
        const result = await executeOperation(config, request);
        res.end(JSON.stringify(result));
        return;
      }

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
