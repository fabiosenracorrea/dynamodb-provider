import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchMetadata, execute, type ExecuteRequest, type Metadata } from './api';

export const queryKeys = {
  metadata: ['metadata'] as const,
};

export function useMetadata() {
  return useQuery({
    queryKey: queryKeys.metadata,
    queryFn: fetchMetadata,
  });
}

export function useExecute() {
  return useMutation({
    mutationFn: (request: ExecuteRequest) => execute(request),
  });
}

// Helper to convert entity array to record for component convenience
export function entitiesToRecord(metadata: Metadata) {
  return Object.fromEntries(metadata.entities.map((entity) => [entity.type, entity]));
}

// Helper to convert collection array to record for component convenience
export function collectionsToRecord(metadata: Metadata) {
  return Object.fromEntries(
    metadata.collections.map((collection) => [collection.name, collection]),
  );
}
