import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useMetadataContext } from '@/context';
import { Sidebar, type Selection, type SelectionType } from '@/components/sidebar';
import {
  EntityOperations,
  CollectionOperations,
  PartitionOperations,
  EmptyState,
} from '@/components/operations';

export function App() {
  const { isLoading, error } = useMetadataContext();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [activeTab, setActiveTab] = useState<SelectionType>('entity');

  const handleTabChange = (tab: SelectionType) => {
    setActiveTab(tab);
    setSelection(null);
  };

  const handleSelectEntity = (entityType: string) => {
    setActiveTab('entity');
    setSelection({ type: 'entity', name: entityType });
  };

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
      <Sidebar
        selection={selection}
        onSelect={setSelection}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <main className="flex-1 overflow-auto p-6">
        <OperationsPanel selection={selection} onSelectEntity={handleSelectEntity} />
      </main>
    </div>
  );
}

interface OperationsPanelProps {
  selection: Selection | null;
  onSelectEntity: (entityType: string) => void;
}

function OperationsPanel({ selection, onSelectEntity }: OperationsPanelProps) {
  const { getEntity, getCollection, getPartitionGroup } = useMetadataContext();

  if (!selection) {
    return <EmptyState />;
  }

  switch (selection.type) {
    case 'entity': {
      const entity = getEntity(selection.name);
      if (!entity) return <EmptyState />;
      return <EntityOperations key={entity.type} entityType={entity.type} />;
    }

    case 'collection': {
      const collection = getCollection(selection.name);
      if (!collection) return <EmptyState />;
      return (
        <CollectionOperations key={collection.name} collectionName={collection.name} />
      );
    }

    case 'partition': {
      const partition = getPartitionGroup(selection.name);
      if (!partition) return <EmptyState />;
      return (
        <PartitionOperations
          key={partition.id}
          partitionId={partition.id}
          onSelectEntity={onSelectEntity}
        />
      );
    }

    default:
      return <EmptyState />;
  }
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
