import type { PlaygroundConfig, ExecuteRequest, ExecuteResponse } from '../types';

// Set to true to use mock data for testing UX
const USE_MOCK_DATA = true;

// Generate mock item data
function generateMockItem(index: number): Record<string, unknown> {
  const statuses = ['active', 'pending', 'completed', 'cancelled'];
  const types = ['standard', 'premium', 'enterprise'];
  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];

  return {
    id: `item-${String(index).padStart(4, '0')}`,
    pk: `USER#${1000 + (index % 50)}`,
    sk: `ORDER#${Date.now() - index * 100000}`,
    userId: `user-${1000 + (index % 50)}`,
    name: names[index % names.length],
    email: `${names[index % names.length].toLowerCase()}@example.com`,
    status: statuses[index % statuses.length],
    type: types[index % types.length],
    amount: Math.round(Math.random() * 10000) / 100,
    quantity: Math.floor(Math.random() * 10) + 1,
    createdAt: new Date(Date.now() - index * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - index * 3600000).toISOString(),
    metadata: {
      source: 'api',
      version: '1.0',
      tags: ['tag1', 'tag2'],
    },
  };
}

// Generate mock list data
function generateMockList(count: number): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, i) => generateMockItem(i));
}

export async function executeOperation(
  config: PlaygroundConfig,
  request: ExecuteRequest,
): Promise<ExecuteResponse> {
  try {
    const { target, name, operation, index, params } = request;

    if (target === 'entity') {
      return await executeEntityOperation(config, name, operation, index, params);
    }

    if (target === 'collection') {
      return await executeCollectionOperation(config, name, operation, params);
    }

    if (target === 'table') {
      return await executeTableOperation(config, operation, params);
    }

    return { success: false, error: `Unknown target: ${target}` };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

async function executeEntityOperation(
  config: PlaygroundConfig,
  entityType: string,
  operation: string,
  index: string | undefined,
  params: Record<string, unknown>,
): Promise<ExecuteResponse> {
  const entity = config.entities.find((e) => e.type === entityType);

  if (!entity) {
    return { success: false, error: `Entity not found: ${entityType}` };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schema = config.table.schema.from(entity) as any;

  // Handle index operations
  if (index) {
    if (USE_MOCK_DATA) {
      const limit = (params.limit as number) || 25;
      const mockCount = Math.floor(Math.random() * 80) + 20;
      return { success: true, data: generateMockList(mockCount).slice(0, limit) };
    }

    const queryIndex = schema.queryIndex as Record<string, unknown> | undefined;
    if (!queryIndex || !queryIndex[index]) {
      return { success: false, error: `Index not found: ${index}` };
    }

    const indexOps = queryIndex[index] as Record<
      string,
      (...args: unknown[]) => Promise<unknown>
    >;

    if (operation === 'query' || operation === 'custom') {
      const result = await indexOps.custom(params);
      return { success: true, data: result };
    }

    // Named range query on index
    if (typeof indexOps[operation] === 'function') {
      const result = await indexOps[operation](params);
      return { success: true, data: result };
    }

    return { success: false, error: `Unknown index operation: ${operation}` };
  }

  // Regular entity operations
  switch (operation) {
    case 'get': {
      if (USE_MOCK_DATA) {
        // Randomly return an item or null (not found)
        const found = Math.random() > 0.3;
        return { success: true, data: found ? generateMockItem(1) : null };
      }
      const result = await schema.get(params);
      return { success: true, data: result };
    }

    case 'batchGet': {
      const keys = params.keys as Record<string, unknown>[];
      if (!keys || !Array.isArray(keys)) {
        return { success: false, error: 'batchGet requires a keys array' };
      }

      if (USE_MOCK_DATA) {
        // Return mock items for each key, with some randomly missing
        const results = keys
          .map((_, idx) => {
            const found = Math.random() > 0.2;
            return found ? generateMockItem(idx) : null;
          })
          .filter(Boolean);
        return { success: true, data: results };
      }

      // Fetch all items in parallel
      const results = await Promise.all(
        keys.map((key) => schema.get(key).catch(() => null)),
      );
      // Filter out nulls (not found items)
      const items = results.filter((item) => item !== null);
      return { success: true, data: items };
    }

    case 'create': {
      if (USE_MOCK_DATA) {
        return { success: true, data: { ...generateMockItem(0), ...params } };
      }
      const result = await schema.create(params);
      return { success: true, data: result };
    }

    case 'update': {
      if (USE_MOCK_DATA) {
        return { success: true, data: { ...generateMockItem(0), ...params } };
      }
      const result = await schema.update(params);
      return { success: true, data: result };
    }

    case 'delete': {
      if (USE_MOCK_DATA) {
        return { success: true, data: { deleted: true } };
      }
      await schema.delete(params);
      return { success: true, data: { deleted: true } };
    }

    case 'list':
    case 'listAll': {
      if (USE_MOCK_DATA) {
        const limit = (params.limit as number) || 25;
        const mockCount = Math.floor(Math.random() * 80) + 20; // 20-100 items
        return { success: true, data: generateMockList(mockCount).slice(0, limit) };
      }
      const result = await schema.listAll(params);
      return { success: true, data: result };
    }

    case 'query':
    case 'custom': {
      if (USE_MOCK_DATA) {
        const limit = (params.limit as number) || 25;
        const mockCount = Math.floor(Math.random() * 80) + 20; // 20-100 items
        return { success: true, data: generateMockList(mockCount).slice(0, limit) };
      }
      const result = await schema.query.custom(params);
      return { success: true, data: result };
    }

    default: {
      if (USE_MOCK_DATA) {
        // For any named range query, return mock list
        const limit = (params.limit as number) || 25;
        const mockCount = Math.floor(Math.random() * 80) + 20;
        return { success: true, data: generateMockList(mockCount).slice(0, limit) };
      }
      // Try as a named range query
      const query = schema.query as Record<string, unknown> | undefined;
      if (query && typeof query[operation] === 'function') {
        const result = await query[operation](params);
        return { success: true, data: result };
      }
      return { success: false, error: `Unknown operation: ${operation}` };
    }
  }
}

async function executeCollectionOperation(
  config: PlaygroundConfig,
  collectionName: string,
  operation: string,
  params: Record<string, unknown>,
): Promise<ExecuteResponse> {
  if (!config.collections) {
    return { success: false, error: 'No collections configured' };
  }

  const collection = config.collections[collectionName];

  if (!collection) {
    return { success: false, error: `Collection not found: ${collectionName}` };
  }

  if (USE_MOCK_DATA) {
    if (operation === 'get') {
      const mockCount = Math.floor(Math.random() * 30) + 10;
      return { success: true, data: generateMockList(mockCount) };
    }
  }

  const schema = config.table.schema.from(collection) as Record<string, unknown>;

  switch (operation) {
    case 'get': {
      const result = await (schema.get as (_: unknown) => Promise<unknown>)(params);
      return { success: true, data: result };
    }

    default:
      return { success: false, error: `Unknown collection operation: ${operation}` };
  }
}

async function executeTableOperation(
  config: PlaygroundConfig,
  operation: string,
  params: Record<string, unknown>,
): Promise<ExecuteResponse> {
  switch (operation) {
    case 'query': {
      if (USE_MOCK_DATA) {
        const limit = (params.limit as number) || 25;
        const mockCount = Math.floor(Math.random() * 80) + 20;
        return { success: true, data: generateMockList(mockCount).slice(0, limit) };
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await config.table.query(params as any);
      return { success: true, data: result };
    }

    default:
      return { success: false, error: `Unknown table operation: ${operation}` };
  }
}
