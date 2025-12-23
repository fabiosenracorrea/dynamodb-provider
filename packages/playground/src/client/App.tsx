import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import type { Metadata } from '@/utils/api';
import { useMetadata } from '@/utils/hooks';
import {
  Sidebar,
  type Selection,
  type SelectionType,
  PartitionInfo,
} from '@/components/sidebar';
import {
  EntityOperations,
  CollectionOperations,
  PartitionOperations,
  EmptyState,
} from '@/components/operations';

export function App() {
  const { data: metadata, error, isLoading } = useMetadata();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [activeTab, setActiveTab] = useState<SelectionType>('entity');

  // Build partition info for selected partition
  const partitionInfo = useMemo<PartitionInfo | null>(() => {
    if (!metadata || selection?.type !== 'partition') return null;

    const partitionId = selection.name;

    if (partitionId === 'main') {
      return {
        id: 'main',
        name: 'Main Table',
        type: 'main',
        partitionKey: metadata.table.partitionKey,
        rangeKey: metadata.table.rangeKey,
      };
    }

    const indexConfig = metadata.table.indexes[partitionId];
    if (indexConfig) {
      return {
        id: partitionId,
        name: partitionId,
        type: 'index',
        partitionKey: indexConfig.partitionKey,
        rangeKey: indexConfig.rangeKey,
      };
    }

    return null;
  }, [metadata, selection]);

  // Handle tab change - clear selection when switching tabs
  const handleTabChange = (tab: SelectionType) => {
    setActiveTab(tab);
    setSelection(null);
  };

  if (error) {
    return <ErrorScreen error={error instanceof Error ? error.message : 'Unknown error'} />;
  }

  if (isLoading || !metadata) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        metadata={metadata}
        selection={selection}
        onSelect={setSelection}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <main className="flex-1 overflow-auto p-6">
        <OperationsPanel
          selection={selection}
          metadata={metadata}
          partitionInfo={partitionInfo}
        />
      </main>
    </div>
  );
}

interface OperationsPanelProps {
  selection: Selection | null;
  metadata: Metadata;
  partitionInfo: PartitionInfo | null;
}

function OperationsPanel({ selection, metadata, partitionInfo }: OperationsPanelProps) {
  if (!selection) {
    return <EmptyState />;
  }

  switch (selection.type) {
    case 'entity': {
      const entity = metadata.entities.find((e) => e.type === selection.name);
      if (!entity) return <EmptyState />;
      return <EntityOperations entity={entity} />;
    }

    case 'collection': {
      const collection = metadata.collections.find((c) => c.name === selection.name);
      if (!collection) return <EmptyState />;
      return <CollectionOperations collection={collection} />;
    }

    case 'partition': {
      if (!partitionInfo) return <EmptyState />;
      return <PartitionOperations partition={partitionInfo} />;
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
