import { PlaygroundError, toErrorMessage, toErrorStatus } from './lib/errors';
import type { OperationContext } from './lib/operation';
import { executeRoute } from './routes/execute';
import { resolveKeysRoute } from './routes/resolveKeys';
import { connectionRoute } from './routes/connection';

export interface ApiResponse {
  status: number;
  body: unknown;
}

type Handler = (ctx: OperationContext, body: unknown) => unknown | Promise<unknown>;

const routes: Record<string, Record<string, Handler>> = {
  GET: {
    '/api/metadata': (ctx) => ctx.metadata,
    '/api/connection': (ctx) => connectionRoute(ctx),
  },

  POST: {
    '/api/execute': (ctx, body) => executeRoute(ctx, body),
    '/api/resolve-keys': (ctx, body) => resolveKeysRoute(ctx, body),
  },
};

export async function handleRequest(
  ctx: OperationContext,
  { method, path, body }: { method: string; path: string; body: unknown },
): Promise<ApiResponse> {
  try {
    const handler = routes[method]?.[path];

    if (!handler) throw PlaygroundError.notFound(`No route for ${method} ${path}`);

    const data = await handler(ctx, body);

    return { status: 200, body: { success: true, ...(data as object) } };
  } catch (error) {
    return {
      status: toErrorStatus(error),
      body: {
        success: false,
        error: toErrorMessage(error),
        ...(error instanceof PlaygroundError && error.details
          ? { issues: error.details }
          : {}),
      },
    };
  }
}
