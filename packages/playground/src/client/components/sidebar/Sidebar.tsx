import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const { collections } = useMetadataContext();
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
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-surface">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as SelectionType)}
        className="flex-1 flex flex-col"
      >
        <TabsList className="mx-2 mt-2 grid h-8 grid-cols-3">
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

    </aside>
  );
}
