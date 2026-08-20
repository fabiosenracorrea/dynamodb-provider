import { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePartitionGroups, useTable } from '@/context';
import { SearchInput } from './SearchInput';
import { SidebarItem } from './SidebarItem';
import { SortPopover, applySortOrder, type SortOrder } from './SortPopover';

interface PartitionListProps {
  selectedPartition: string | null;
  onSelect: (id: string) => void;
}

export function PartitionList({ selectedPartition, onSelect }: PartitionListProps) {
  const partitionGroups = usePartitionGroups();
  const table = useTable();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');

  // Get all available index names from table config
  const indexNames = useMemo(() => {
    if (!table) return [];
    return Object.keys(table.indexes ?? {});
  }, [table]);

  const filteredAndSortedPartitions = useMemo(() => {
    let result = partitionGroups;

    // Apply source filter
    if (filter === 'table') {
      result = result.filter((p) => p.sourceType === 'main');
    } else if (filter !== 'all') {
      // Filter by specific index name
      result = result.filter((p) => p.source === filter);
    }

    // Apply search filter
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.pattern.toLowerCase().includes(lower) ||
          p.source.toLowerCase().includes(lower) ||
          p.entities.some((e) => e.toLowerCase().includes(lower)),
      );
    }

    return applySortOrder(result, sortOrder, (p) => p.pattern);
  }, [partitionGroups, filter, search, sortOrder]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-2 p-2">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search partitions..." />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-9 w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="table">Table</SelectItem>
            {indexNames.map((indexName) => (
              <SelectItem key={indexName} value={indexName}>
                {indexName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SortPopover value={sortOrder} onChange={setSortOrder} />
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2 pt-0">
          {filteredAndSortedPartitions.map((partition) => (
            <SidebarItem
              key={partition.id}
              name={partition.pattern}
              meta={partition.source}
              subtitle={partition.entities.join(', ')}
              isSelected={selectedPartition === partition.id}
              onClick={() => onSelect(partition.id)}
            />
          ))}

          {filteredAndSortedPartitions.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {partitionGroups.length === 0
                ? 'No shared partitions found'
                : 'No partitions match your search'}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
