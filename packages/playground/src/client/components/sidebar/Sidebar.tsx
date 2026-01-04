import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Database } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMetadataContext } from '@/context';
import { EntityList } from './EntityList';
import { CollectionList } from './CollectionList';
import { PartitionList } from './PartitionList';

export type SelectionType = 'entity' | 'collection' | 'partition';

export interface Selection {
  type: SelectionType;
  name: string;
}

function parseSelection(pathname: string): Selection | null {
  const match = pathname.match(/^\/(entity|collection|partition)\/(.+)$/);
  if (!match) return null;
  return { type: match[1] as SelectionType, name: decodeURIComponent(match[2]) };
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { table, collections } = useMetadataContext();
  const hasCollections = collections.length > 0;

  const selection = parseSelection(location.pathname);

  // Local state for tab - syncs when selection changes
  const [activeTab, setActiveTab] = useState<SelectionType>('entity');

  // Sync tab with selection when navigating to an item
  useEffect(() => {
    if (selection) {
      setActiveTab(selection.type);
    }
  }, [selection?.type]);

  const handleEntitySelect = (name: string) => {
    navigate(`/entity/${encodeURIComponent(name)}`);
  };

  const handleCollectionSelect = (name: string) => {
    navigate(`/collection/${encodeURIComponent(name)}`);
  };

  const handlePartitionSelect = (name: string) => {
    navigate(`/partition/${encodeURIComponent(name)}`);
  };

  return (
    <aside className="w-72 border-r bg-muted/30 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <h1 className="font-semibold">Playground</h1>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as SelectionType)}
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
            selectedEntity={selection?.type === 'entity' ? selection.name : null}
            onSelect={handleEntitySelect}
          />
        </TabsContent>

        <TabsContent value="collection" className="flex-1 m-0">
          <CollectionList
            selectedCollection={selection?.type === 'collection' ? selection.name : null}
            onSelect={handleCollectionSelect}
          />
        </TabsContent>

        <TabsContent value="partition" className="flex-1 m-0">
          <PartitionList
            selectedPartition={selection?.type === 'partition' ? selection.name : null}
            onSelect={handlePartitionSelect}
          />
        </TabsContent>
      </Tabs>

      {/* Table Info Footer */}
      <div className="p-3 border-t bg-muted/50 text-xs text-muted-foreground">
        <p>
          PK: <span className="font-mono">{table?.partitionKey}</span>
        </p>
        <p>
          SK: <span className="font-mono">{table?.rangeKey}</span>
        </p>
      </div>
    </aside>
  );
}
