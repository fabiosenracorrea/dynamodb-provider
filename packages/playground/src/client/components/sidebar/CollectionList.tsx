import { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchInput } from './SearchInput';
import { SidebarItem } from './SidebarItem';
import type { CollectionMetadata } from '@/lib/api';

interface CollectionListProps {
  collections: Record<string, CollectionMetadata>;
  selectedCollection: string | null;
  onSelect: (name: string) => void;
}

export function CollectionList({
  collections,
  selectedCollection,
  onSelect,
}: CollectionListProps) {
  const [search, setSearch] = useState('');

  const filteredCollections = useMemo(() => {
    const entries = Object.entries(collections);
    if (!search) return entries;

    const lower = search.toLowerCase();
    return entries.filter(
      ([name, collection]) =>
        name.toLowerCase().includes(lower) ||
        collection.type.toLowerCase().includes(lower) ||
        collection.originEntityType?.toLowerCase().includes(lower),
    );
  }, [collections, search]);

  if (Object.keys(collections).length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No collections configured</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search collections..."
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 pt-0 space-y-1">
          {filteredCollections.map(([name, collection]) => (
            <SidebarItem
              key={name}
              name={name}
              type={collection.type}
              subtitle={collection.originEntityType || undefined}
              isSelected={selectedCollection === name}
              onClick={() => onSelect(name)}
            />
          ))}

          {filteredCollections.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No collections found
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
