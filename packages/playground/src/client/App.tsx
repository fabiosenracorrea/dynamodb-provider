import { useEffect, useState, useMemo } from 'react'
import { fetchMetadata, type Metadata } from '@/lib/api'
import { Sidebar, type Selection, type SelectionType } from '@/components/sidebar'
import {
  EntityOperations,
  CollectionOperations,
  PartitionOperations,
  EmptyState,
} from '@/components/operations'
import type { PartitionInfo } from '@/components/sidebar'
import { Loader2 } from 'lucide-react'

export function App() {
  const [metadata, setMetadata] = useState<Metadata | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [activeTab, setActiveTab] = useState<SelectionType>('entity')

  useEffect(() => {
    fetchMetadata()
      .then(setMetadata)
      .catch((err) => setError(err.message))
  }, [])

  // Build partition info for selected partition
  const partitionInfo = useMemo<PartitionInfo | null>(() => {
    if (!metadata || selection?.type !== 'partition') return null

    const partitionId = selection.name

    if (partitionId === 'main') {
      return {
        id: 'main',
        name: 'Main Table',
        type: 'main',
        partitionKey: metadata.table.partitionKey,
        rangeKey: metadata.table.rangeKey,
      }
    }

    const indexConfig = metadata.table.indexes[partitionId]
    if (indexConfig) {
      return {
        id: partitionId,
        name: partitionId,
        type: 'index',
        partitionKey: indexConfig.partitionKey,
        rangeKey: indexConfig.rangeKey,
      }
    }

    return null
  }, [metadata, selection])

  // Handle tab change - clear selection when switching tabs
  const handleTabChange = (tab: SelectionType) => {
    setActiveTab(tab)
    setSelection(null)
  }

  if (error) {
    return <ErrorScreen error={error} />
  }

  if (!metadata) {
    return <LoadingScreen />
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        metadata={metadata}
        selection={selection}
        onSelect={setSelection}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <main className="flex-1 overflow-auto p-6">
        <OperationsPanel
          selection={selection}
          metadata={metadata}
          partitionInfo={partitionInfo}
        />
      </main>
    </div>
  )
}

interface OperationsPanelProps {
  selection: Selection | null
  metadata: Metadata
  partitionInfo: PartitionInfo | null
}

function OperationsPanel({ selection, metadata, partitionInfo }: OperationsPanelProps) {
  if (!selection) {
    return <EmptyState />
  }

  switch (selection.type) {
    case 'entity': {
      const entity = metadata.entities[selection.name]
      if (!entity) return <EmptyState />
      return <EntityOperations name={selection.name} entity={entity} />
    }

    case 'collection': {
      const collection = metadata.collections[selection.name]
      if (!collection) return <EmptyState />
      return <CollectionOperations name={selection.name} collection={collection} />
    }

    case 'partition': {
      if (!partitionInfo) return <EmptyState />
      return <PartitionOperations partition={partitionInfo} />
    }

    default:
      return <EmptyState />
  }
}

function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading playground...</span>
      </div>
    </div>
  )
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="h-screen flex items-center justify-center p-4">
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 max-w-md">
        <h2 className="text-destructive font-semibold mb-2">Failed to load playground</h2>
        <p className="text-destructive/80 text-sm">{error}</p>
      </div>
    </div>
  )
}
