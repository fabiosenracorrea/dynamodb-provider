import { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEntities } from '@/context';
import { SearchInput } from './SearchInput';
import { SidebarItem } from './SidebarItem';

interface EntityListProps {
  selectedEntity: string | null;
  onSelect: (name: string) => void;
}

export function EntityList({ selectedEntity, onSelect }: EntityListProps) {
  const entities = useEntities();
  const [search, setSearch] = useState('');

  const filteredEntities = useMemo(() => {
    if (!search) return entities;

    const lower = search.toLowerCase();
    return entities.filter(
      (entity) =>
        entity.name.toLowerCase().includes(lower) || entity.type.toLowerCase().includes(lower),
    );
  }, [entities, search]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search entities..."
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 pt-0 space-y-1">
          {filteredEntities.map((entity) => (
            <SidebarItem
              key={entity.type}
              name={entity.type}
              type={entity.type}
              subtitle={
                entity.indexes.length > 0 ? `${entity.indexes.length} indexes` : undefined
              }
              isSelected={selectedEntity === entity.type}
              onClick={() => onSelect(entity.type)}
            />
          ))}

          {filteredEntities.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No entities found
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
