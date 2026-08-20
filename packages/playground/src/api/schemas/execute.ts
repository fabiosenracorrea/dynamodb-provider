import { z } from 'zod';

export const executeRequestSchema = z.object({
  target: z.enum(['entity', 'collection', 'table']),
  /** Entity type, collection name, or empty for table-level operations. */
  name: z.string().default(''),
  operation: z.string().min(1),
  /** Entity index NAME for entity queries; physical table index for table queries. */
  index: z.string().optional(),
  /** A named `rangeQuery` declared on the entity or on its index. */
  rangeQuery: z.string().optional(),
  params: z.record(z.string(), z.unknown()).default({}),
});

export type ExecuteRequest = z.infer<typeof executeRequestSchema>;
