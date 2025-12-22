import type { PlaygroundConfig, ExecuteRequest, ExecuteResponse } from '../types.js'

export async function executeOperation(
  config: PlaygroundConfig,
  request: ExecuteRequest
): Promise<ExecuteResponse> {
  try {
    const { target, name, operation, index, params } = request

    if (target === 'entity') {
      return await executeEntityOperation(config, name, operation, index, params)
    }

    if (target === 'collection') {
      return await executeCollectionOperation(config, name, operation, params)
    }

    if (target === 'table') {
      return await executeTableOperation(config, operation, params)
    }

    return { success: false, error: `Unknown target: ${target}` }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

async function executeEntityOperation(
  config: PlaygroundConfig,
  entityName: string,
  operation: string,
  index: string | undefined,
  params: Record<string, unknown>
): Promise<ExecuteResponse> {
  const entity = config.entities[entityName]
  if (!entity) {
    return { success: false, error: `Entity not found: ${entityName}` }
  }

  const schema = config.table.schema.from(entity) as Record<string, unknown>

  // Handle index operations
  if (index) {
    const queryIndex = schema.queryIndex as Record<string, unknown> | undefined
    if (!queryIndex || !queryIndex[index]) {
      return { success: false, error: `Index not found: ${index}` }
    }

    const indexOps = queryIndex[index] as Record<string, (...args: unknown[]) => Promise<unknown>>

    if (operation === 'query' || operation === 'custom') {
      const result = await indexOps.custom(params)
      return { success: true, data: result }
    }

    // Named range query on index
    if (typeof indexOps[operation] === 'function') {
      const result = await indexOps[operation](params)
      return { success: true, data: result }
    }

    return { success: false, error: `Unknown index operation: ${operation}` }
  }

  // Regular entity operations
  switch (operation) {
    case 'get': {
      const result = await (schema.get as (params: unknown) => Promise<unknown>)(params)
      return { success: true, data: result }
    }

    case 'create': {
      const result = await (schema.create as (params: unknown) => Promise<unknown>)(params)
      return { success: true, data: result }
    }

    case 'update': {
      const result = await (schema.update as (params: unknown) => Promise<unknown>)(params)
      return { success: true, data: result }
    }

    case 'delete': {
      await (schema.delete as (params: unknown) => Promise<void>)(params)
      return { success: true, data: { deleted: true } }
    }

    case 'listAll': {
      const result = await (schema.listAll as (params?: unknown) => Promise<unknown>)(params)
      return { success: true, data: result }
    }

    case 'query':
    case 'custom': {
      const query = schema.query as Record<string, unknown>
      const result = await (query.custom as (params: unknown) => Promise<unknown>)(params)
      return { success: true, data: result }
    }

    default: {
      // Try as a named range query
      const query = schema.query as Record<string, unknown> | undefined
      if (query && typeof query[operation] === 'function') {
        const result = await (query[operation] as (params: unknown) => Promise<unknown>)(params)
        return { success: true, data: result }
      }
      return { success: false, error: `Unknown operation: ${operation}` }
    }
  }
}

async function executeCollectionOperation(
  config: PlaygroundConfig,
  collectionName: string,
  operation: string,
  params: Record<string, unknown>
): Promise<ExecuteResponse> {
  if (!config.collections) {
    return { success: false, error: 'No collections configured' }
  }

  const collection = config.collections[collectionName]
  if (!collection) {
    return { success: false, error: `Collection not found: ${collectionName}` }
  }

  const schema = config.table.schema.from(collection) as Record<string, unknown>

  switch (operation) {
    case 'get': {
      const result = await (schema.get as (params: unknown) => Promise<unknown>)(params)
      return { success: true, data: result }
    }

    default:
      return { success: false, error: `Unknown collection operation: ${operation}` }
  }
}

async function executeTableOperation(
  config: PlaygroundConfig,
  operation: string,
  params: Record<string, unknown>
): Promise<ExecuteResponse> {
  switch (operation) {
    case 'query': {
      const result = await config.table.query(params)
      return { success: true, data: result }
    }

    default:
      return { success: false, error: `Unknown table operation: ${operation}` }
  }
}
