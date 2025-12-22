import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMetadata, execute, type ExecuteRequest, type Metadata } from '@/utils/api';

// Query keys
export const queryKeys = {
  metadata: ['metadata'] as const,
};

// Metadata hook
export function useMetadata() {
  return useQuery({
    queryKey: queryKeys.metadata,
    queryFn: fetchMetadata,
    staleTime: Infinity, // Metadata doesn't change during session
  });
}

// Execute mutation hook
export function useExecute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: execute,
    onSuccess: () => {
      // Optionally invalidate queries after mutations
      // queryClient.invalidateQueries({ queryKey: queryKeys.metadata })
    },
  });
}

// Helper hook for entity operations
export function useEntityOperation(entityName: string) {
  const mutation = useExecute();

  const executeOp = (
    operation: string,
    params: Record<string, unknown>,
    index?: string,
  ) => {
    return mutation.mutateAsync({
      target: 'entity',
      name: entityName,
      operation,
      index,
      params,
    });
  };

  return {
    execute: executeOp,
    ...mutation,
  };
}

// Helper hook for collection operations
export function useCollectionOperation(collectionName: string) {
  const mutation = useExecute();

  const executeOp = (operation: string, params: Record<string, unknown>) => {
    return mutation.mutateAsync({
      target: 'collection',
      name: collectionName,
      operation,
      params,
    });
  };

  return {
    execute: executeOp,
    ...mutation,
  };
}

// Helper hook for table operations
export function useTableOperation() {
  const mutation = useExecute();

  const executeOp = (
    operation: string,
    params: Record<string, unknown>,
    partitionId?: string,
  ) => {
    return mutation.mutateAsync({
      target: 'table',
      name: partitionId || 'main',
      operation,
      params,
    });
  };

  return {
    execute: executeOp,
    ...mutation,
  };
}
