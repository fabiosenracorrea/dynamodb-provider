import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OperationForm } from './OperationForm'
import type { CollectionMetadata } from '@/lib/api'

interface CollectionOperationsProps {
  name: string
  collection: CollectionMetadata
}

export function CollectionOperations({ name, collection }: CollectionOperationsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>
              {collection.type} collection
              {collection.originEntityType && ` from ${collection.originEntityType}`}
            </CardDescription>
          </div>
          <CollectionBadges collection={collection} />
        </div>
      </CardHeader>
      <CardContent>
        <OperationForm
          target="collection"
          name={name}
          operation="get"
          description="Retrieve the collection with all joined entities."
          placeholder={`{\n  "partitionId": "example-id"\n}`}
          buttonLabel="Get Collection"
        />
      </CardContent>
    </Card>
  )
}

function CollectionBadges({ collection }: { collection: CollectionMetadata }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs bg-secondary px-2 py-1 rounded">{collection.type}</span>
      {collection.joins.length > 0 && (
        <span className="text-xs bg-secondary px-2 py-1 rounded">
          {collection.joins.length} {collection.joins.length === 1 ? 'join' : 'joins'}
        </span>
      )}
    </div>
  )
}
