import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OperationTabs, type OperationTab } from './OperationTabs'
import { OperationForm } from './OperationForm'
import type { EntityMetadata } from '@/lib/api'

interface EntityOperationsProps {
  name: string
  entity: EntityMetadata
}

export function EntityOperations({ name, entity }: EntityOperationsProps) {
  const tabs: OperationTab[] = [
    {
      id: 'get',
      label: 'Get',
      content: (
        <OperationForm
          target="entity"
          name={name}
          operation="get"
          description="Retrieve a single item by its primary key."
          placeholder={`{\n  "id": "example-id"\n}`}
          buttonLabel="Get Item"
        />
      ),
    },
    {
      id: 'create',
      label: 'Create',
      content: (
        <OperationForm
          target="entity"
          name={name}
          operation="create"
          description="Create a new item. Include all required fields."
          placeholder={`{\n  "id": "new-id",\n  "name": "Example"\n}`}
          buttonLabel="Create Item"
        />
      ),
    },
    {
      id: 'update',
      label: 'Update',
      content: (
        <OperationForm
          target="entity"
          name={name}
          operation="update"
          description="Update an existing item. Provide the key and values to update."
          placeholder={`{\n  "id": "example-id",\n  "values": {\n    "name": "Updated Name"\n  }\n}`}
          buttonLabel="Update Item"
        />
      ),
    },
    {
      id: 'delete',
      label: 'Delete',
      content: (
        <OperationForm
          target="entity"
          name={name}
          operation="delete"
          description="Delete an item by its primary key."
          placeholder={`{\n  "id": "example-id"\n}`}
          buttonLabel="Delete Item"
        />
      ),
    },
    {
      id: 'query',
      label: 'Query',
      content: (
        <OperationForm
          target="entity"
          name={name}
          operation="query"
          description="Query items by partition key. Optionally add range conditions."
          placeholder={`{\n  "partitionId": "example",\n  "limit": 10\n}`}
          buttonLabel="Execute Query"
        />
      ),
    },
    {
      id: 'listAll',
      label: 'List All',
      content: (
        <OperationForm
          target="entity"
          name={name}
          operation="listAll"
          description="List all items of this entity type. Use with caution on large tables."
          placeholder={`{\n  "limit": 100\n}`}
          buttonLabel="List All"
        />
      ),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription className="font-mono">{entity.type}</CardDescription>
          </div>
          <EntityBadges entity={entity} />
        </div>
      </CardHeader>
      <CardContent>
        <OperationTabs tabs={tabs} defaultTab="get" />
      </CardContent>
    </Card>
  )
}

function EntityBadges({ entity }: { entity: EntityMetadata }) {
  return (
    <div className="flex gap-2">
      {entity.indexes.length > 0 && (
        <span className="text-xs bg-secondary px-2 py-1 rounded">
          {entity.indexes.length} {entity.indexes.length === 1 ? 'index' : 'indexes'}
        </span>
      )}
      {entity.rangeQueries.length > 0 && (
        <span className="text-xs bg-secondary px-2 py-1 rounded">
          {entity.rangeQueries.length} range queries
        </span>
      )}
    </div>
  )
}
