import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMetadataContext } from '@/context';
import { EntityList } from './EntityList';
import { CollectionList } from './CollectionList';
import { PartitionList } from './PartitionList';
import { HistoryList } from './HistoryList';

export type SelectionType = 'entity' | 'collection' | 'partition';

/** History is a view, not a selection, so it lives alongside the selection types. */
type TabValue = SelectionType | 'history';

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
  const [activeTab, setActiveTab] = useState<TabValue>('entity');

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
        onValueChange={(v) => setActiveTab(v as TabValue)}
        className="flex flex-1 flex-col"
      >
        <TabsList className="mx-2 mt-2 grid h-8 grid-cols-4">
          <TabsTrigger value="entity" className="text-[11px]">
            Entities
          </TabsTrigger>
          <TabsTrigger value="collection" className="text-[11px]" disabled={!hasCollections}>
            Collections
          </TabsTrigger>
          <TabsTrigger value="partition" className="text-[11px]">
            Partitions
          </TabsTrigger>
          <TabsTrigger value="history" className="text-[11px]">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entity" className="m-0 flex-1">
          <EntityList
            selectedEntity={selection?.type === 'entity' ? selection.name : null}
            onSelect={handleEntitySelect}
          />
        </TabsContent>

        <TabsContent value="collection" className="m-0 flex-1">
          <CollectionList
            selectedCollection={selection?.type === 'collection' ? selection.name : null}
            onSelect={handleCollectionSelect}
          />
        </TabsContent>

        <TabsContent value="partition" className="m-0 flex-1">
          <PartitionList
            selectedPartition={selection?.type === 'partition' ? selection.name : null}
            onSelect={handlePartitionSelect}
          />
        </TabsContent>

        <TabsContent value="history" className="m-0 min-h-0 flex-1">
          <HistoryList />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
