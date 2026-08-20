import { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEntities } from '@/context';
import { SearchInput } from './SearchInput';
import { EntityDot } from '@/components/shared';
import { SidebarItem } from './SidebarItem';
import { SortPopover, applySortOrder, type SortOrder } from './SortPopover';

interface EntityListProps {
  selectedEntity: string | null;
  onSelect: (name: string) => void;
}

export function EntityList({ selectedEntity, onSelect }: EntityListProps) {
  const entities = useEntities();
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');

  const filteredAndSortedEntities = useMemo(() => {
    let result = entities;

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (entity) =>
          entity.name.toLowerCase().includes(lower) || entity.type.toLowerCase().includes(lower),
      );
    }

    return applySortOrder(result, sortOrder, (e) => e.name);
  }, [entities, search, sortOrder]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-2 p-2">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search entities..." />
        </div>
        <SortPopover value={sortOrder} onChange={setSortOrder} />
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2 pt-0">
          {filteredAndSortedEntities.map((entity) => (
            <SidebarItem
              key={entity.type}
              name={entity.type}
              leading={<EntityDot type={entity.type} />}
              meta={entity.indexes.length ? `${entity.indexes.length} idx` : undefined}
              isSelected={selectedEntity === entity.type}
              onClick={() => onSelect(entity.type)}
            />
          ))}

          {filteredAndSortedEntities.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No entities found</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
