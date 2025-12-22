import { useState, useMemo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SearchInput } from './SearchInput'
import { SidebarItem } from './SidebarItem'
import type { TableMetadata } from '@/lib/api'

export interface PartitionInfo {
  id: string
  name: string
  type: 'main' | 'index'
  partitionKey: string
  rangeKey: string
}

interface PartitionListProps {
  table: TableMetadata
  selectedPartition: string | null
  onSelect: (id: string) => void
}

export function PartitionList({ table, selectedPartition, onSelect }: PartitionListProps) {
  const [search, setSearch] = useState('')

  const partitions = useMemo<PartitionInfo[]>(() => {
    const result: PartitionInfo[] = [
      {
        id: 'main',
        name: 'Main Table',
        type: 'main',
        partitionKey: table.partitionKey,
        rangeKey: table.rangeKey,
      },
    ]

    Object.entries(table.indexes).forEach(([indexName, indexConfig]) => {
      result.push({
        id: indexName,
        name: indexName,
        type: 'index',
        partitionKey: indexConfig.partitionKey,
        rangeKey: indexConfig.rangeKey,
      })
    })

    return result
  }, [table])

  const filteredPartitions = useMemo(() => {
    if (!search) return partitions

    const lower = search.toLowerCase()
    return partitions.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.partitionKey.toLowerCase().includes(lower) ||
        p.rangeKey.toLowerCase().includes(lower)
    )
  }, [partitions, search])

  return (
    <div className="flex flex-col h-full">
      <div className="p-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search partitions..." />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 pt-0 space-y-1">
          {filteredPartitions.map((partition) => (
            <SidebarItem
              key={partition.id}
              name={partition.name}
              type={partition.type === 'main' ? 'TABLE' : 'GSI'}
              subtitle={`${partition.partitionKey} / ${partition.rangeKey}`}
              isSelected={selectedPartition === partition.id}
              onClick={() => onSelect(partition.id)}
            />
          ))}

          {filteredPartitions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No partitions found</p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
