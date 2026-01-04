import { Database } from 'lucide-react';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useEntity, useMetadataContext } from '@/context';

import {
  OperationTabs,
  OperationTabsList,
  OperationTabsContent,
  type OperationTab,
} from '../OperationTabs';
import { KeyParamsForm } from '../KeyParamsForm';
import { BatchGetForm } from '../BatchGetForm';
import { ListForm } from '../ListForm';
import { QueryForm } from '../QueryForm';

import { LoadingEntities } from './Loading';
import { EntitySchemaTab } from './Schema';

interface EntityViewProps {
  entityType: string;
}

export function EntityView({ entityType }: EntityViewProps) {
  const { table } = useMetadataContext();
  const entity = useEntity(entityType);

  if (!entity) {
    return <LoadingEntities />;
  }

  const tabs: OperationTab[] = [
    {
      id: 'schema',
      label: 'Schema',
      content: <EntitySchemaTab entity={entity} />,
    },
    {
      id: 'get',
      label: 'Get',
      content: (
        <KeyParamsForm
          target="entity"
          name={entity.type}
          operation="get"
          description="Retrieve a single item by its primary key."
          buttonLabel="Get Item"
          partitionKey={entity.partitionKey}
          rangeKey={entity.rangeKey}
        />
      ),
    },
    {
      id: 'batchGet',
      label: 'Batch Get',
      content: (
        <BatchGetForm
          target="entity"
          name={entity.type}
          description="Retrieve multiple items by their primary keys."
          partitionKey={entity.partitionKey}
          rangeKey={entity.rangeKey}
        />
      ),
    },
    {
      id: 'list',
      label: 'List',
      content: <ListForm target="entity" name={entity.type} />,
      hide: !table?.typeIndex,
    },
    {
      id: 'query',
      label: 'Query',
      content: (
        <QueryForm
          target="entity"
          name={entity.type}
          operation="query"
          description="Query items by partition key with optional range filtering."
          partitionKey={entity.partitionKey}
          rangeKey={entity.rangeKey}
          rangeQueries={entity.rangeQueries}
          indexes={entity.indexes}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <CardHeader className="p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{entity.name}</CardTitle>
              <CardDescription className="font-mono text-xs mt-0.5">
                type: {entity.type}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {entity.indexes.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {entity.indexes.length}{' '}
                {entity.indexes.length === 1 ? 'index' : 'indexes'}
              </Badge>
            )}
            <Badge variant="secondary" className="font-mono">
              Entity
            </Badge>
          </div>
        </div>
      </CardHeader>

      {/* Tabs */}
      <OperationTabs tabs={tabs} defaultTab="schema">
        <CardHeader className="p-2 pt-0">
          <OperationTabsList tabs={tabs} />
        </CardHeader>
        <CardContent className="p-2">
          <OperationTabsContent tabs={tabs} />
        </CardContent>
      </OperationTabs>
    </div>
  );
}
