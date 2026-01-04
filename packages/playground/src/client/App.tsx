/* eslint-disable no-use-before-define */
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useMetadataContext } from '@/context';
import { Sidebar } from '@/components/sidebar';
import {
  EntityView,
  PartitionView,
  EmptyState,
  CollectionView,
} from '@/components/operations';

export function App() {
  const { isLoading, error } = useMetadataContext();

  if (error) {
    return (
      <ErrorScreen error={error instanceof Error ? error.message : 'Unknown error'} />
    );
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-auto p-6">
        <Routes>
          <Route path="/" element={<EmptyState />} />
          <Route path="/entity/:name" element={<EntityRoute />} />
          <Route path="/collection/:name" element={<CollectionRoute />} />
          <Route path="/partition/:name" element={<PartitionRoute />} />
        </Routes>
      </main>
    </div>
  );
}

function EntityRoute() {
  const { name } = useParams<{ name: string }>();
  const { getEntity } = useMetadataContext();

  if (!name) return <EmptyState />;

  const entity = getEntity(name);
  if (!entity) return <EmptyState />;

  return <EntityView key={entity.type} entityType={entity.type} />;
}

function CollectionRoute() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { getCollection } = useMetadataContext();

  if (!name) return <EmptyState />;

  const collection = getCollection(name);
  if (!collection) return <EmptyState />;

  const handleSelectEntity = (entityType: string) => {
    navigate(`/entity/${entityType}`);
  };

  return (
    <CollectionView
      key={collection.name}
      collectionName={collection.name}
      onSelectEntity={handleSelectEntity}
    />
  );
}

function PartitionRoute() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { getPartitionGroup } = useMetadataContext();

  if (!name) return <EmptyState />;

  const partition = getPartitionGroup(name);
  if (!partition) return <EmptyState />;

  const handleSelectEntity = (entityType: string) => {
    navigate(`/entity/${entityType}`);
  };

  return (
    <PartitionView
      key={partition.id}
      partitionId={partition.id}
      onSelectEntity={handleSelectEntity}
    />
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading playground...</span>
      </div>
    </div>
  );
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="h-screen flex items-center justify-center p-4">
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 max-w-md">
        <h2 className="text-destructive font-semibold mb-2">Failed to load playground</h2>
        <p className="text-destructive/80 text-sm">{error}</p>
      </div>
    </div>
  );
}
