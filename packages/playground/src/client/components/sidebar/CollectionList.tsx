import { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCollections } from '@/context';
import { SearchInput } from './SearchInput';
import { SidebarItem } from './SidebarItem';
import { SortPopover, applySortOrder, type SortOrder } from './SortPopover';

interface CollectionListProps {
  selectedCollection: string | null;
  onSelect: (name: string) => void;
}

export function CollectionList({ selectedCollection, onSelect }: CollectionListProps) {
  const collections = useCollections();
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');

  const filteredAndSortedCollections = useMemo(() => {
    let result = collections;

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (collection) =>
          collection.name.toLowerCase().includes(lower) ||
          collection.originEntityType?.toLowerCase().includes(lower),
      );
    }

    return applySortOrder(result, sortOrder, (c) => c.name);
  }, [collections, search, sortOrder]);

  if (collections.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No collections configured</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 flex gap-2">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search collections..."
          />
        </div>
        <SortPopover value={sortOrder} onChange={setSortOrder} />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 pt-0 space-y-1">
          {filteredAndSortedCollections.map((collection) => (
            <SidebarItem
              key={collection.name}
              name={collection.name}
              type="Collection"
              subtitle={collection.originEntityType || undefined}
              isSelected={selectedCollection === collection.name}
              onClick={() => onSelect(collection.name)}
            />
          ))}

          {filteredAndSortedCollections.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No collections found
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
