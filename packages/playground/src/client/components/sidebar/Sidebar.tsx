import { Database } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EntityList } from './EntityList';
import { CollectionList } from './CollectionList';
import { PartitionList } from './PartitionList';
import type { Metadata } from '@/utils/api';

export type SelectionType = 'entity' | 'collection' | 'partition';

export interface Selection {
  type: SelectionType;
  name: string;
}

interface SidebarProps {
  metadata: Metadata;
  selection: Selection | null;
  onSelect: (selection: Selection | null) => void;
  activeTab: SelectionType;
  onTabChange: (tab: SelectionType) => void;
}

export function Sidebar({
  metadata,
  selection,
  onSelect,
  activeTab,
  onTabChange,
}: SidebarProps) {
  const hasCollections = Object.keys(metadata.collections).length > 0;

  const handleEntitySelect = (name: string) => {
    onSelect({ type: 'entity', name });
  };

  const handleCollectionSelect = (name: string) => {
    onSelect({ type: 'collection', name });
  };

  const handlePartitionSelect = (name: string) => {
    onSelect({ type: 'partition', name });
  };

  return (
    <aside className="w-72 border-r bg-muted/30 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <div>
            <h1 className="font-semibold">Playground</h1>
            <p className="text-xs text-muted-foreground">{metadata.table.name}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => onTabChange(v as SelectionType)}
        className="flex-1 flex flex-col"
      >
        <TabsList className="mx-2 mt-2 grid grid-cols-3">
          <TabsTrigger value="entity" className="text-xs">
            Entities
          </TabsTrigger>
          <TabsTrigger value="collection" className="text-xs" disabled={!hasCollections}>
            Collections
          </TabsTrigger>
          <TabsTrigger value="partition" className="text-xs">
            Partitions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entity" className="flex-1 m-0">
          <EntityList
            entities={metadata.entities}
            selectedEntity={selection?.type === 'entity' ? selection.name : null}
            onSelect={handleEntitySelect}
          />
        </TabsContent>

        <TabsContent value="collection" className="flex-1 m-0">
          <CollectionList
            collections={metadata.collections}
            selectedCollection={selection?.type === 'collection' ? selection.name : null}
            onSelect={handleCollectionSelect}
          />
        </TabsContent>

        <TabsContent value="partition" className="flex-1 m-0">
          <PartitionList
            table={metadata.table}
            selectedPartition={selection?.type === 'partition' ? selection.name : null}
            onSelect={handlePartitionSelect}
          />
        </TabsContent>
      </Tabs>

      {/* Table Info Footer */}
      <div className="p-3 border-t bg-muted/50 text-xs text-muted-foreground">
        <p>
          PK: <span className="font-mono">{metadata.table.partitionKey}</span>
        </p>
        <p>
          SK: <span className="font-mono">{metadata.table.rangeKey}</span>
        </p>
      </div>
    </aside>
  );
}
