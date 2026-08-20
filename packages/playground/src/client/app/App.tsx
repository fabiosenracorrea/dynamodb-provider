import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { useMetadataContext } from '@/context';
import { EmptyState } from '@/components/shared';
import { EntityView, PartitionView, CollectionView } from '@/features';

import { Shell } from './Shell';
import { CommandPalette } from './CommandPalette';

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading playground…</span>
      </div>
    </div>
  );
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="flex h-screen items-center justify-center p-4">
      <div className="max-w-md rounded-lg border border-destructive/30 bg-destructive/10 p-6">
        <h2 className="font-semibold text-destructive">Failed to load playground</h2>
        <p className="mt-2 text-sm text-destructive/80">{error}</p>
      </div>
    </div>
  );
}

function EntityRoute() {
  const { name } = useParams<{ name: string }>();
  const { getEntity } = useMetadataContext();

  const entity = name ? getEntity(name) : undefined;

  if (!entity) return <EmptyState />;

  return <EntityView key={entity.type} entityType={entity.type} />;
}

function CollectionRoute() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { getCollection } = useMetadataContext();

  const collection = name ? getCollection(name) : undefined;

  if (!collection) return <EmptyState />;

  return (
    <CollectionView
      key={collection.name}
      collectionName={collection.name}
      onSelectEntity={(entityType) => navigate(`/entity/${entityType}`)}
    />
  );
}

function PartitionRoute() {
  const { name } = useParams<{ name: string }>();
  const { getPartitionGroup } = useMetadataContext();

  const partition = name ? getPartitionGroup(name) : undefined;

  if (!partition) return <EmptyState />;

  return <PartitionView key={partition.id} partitionId={partition.id} />;
}

export function App() {
  const { isLoading, error } = useMetadataContext();

  if (error) {
    return <ErrorScreen error={error instanceof Error ? error.message : 'Unknown error'} />;
  }

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <CommandPalette />

      <Shell>
        <Routes>
          <Route path="/" element={<EmptyState />} />
          <Route path="/entity/:name" element={<EntityRoute />} />
          <Route path="/collection/:name" element={<CollectionRoute />} />
          <Route path="/partition/:name" element={<PartitionRoute />} />
        </Routes>
      </Shell>
    </>
  );
}
