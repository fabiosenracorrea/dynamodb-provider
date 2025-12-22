import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { OperationForm } from './OperationForm';
import type { PartitionInfo } from '@/components/sidebar';

interface PartitionOperationsProps {
  partition: PartitionInfo;
}

export function PartitionOperations({ partition }: PartitionOperationsProps) {
  const isMainTable = partition.type === 'main';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{partition.name}</CardTitle>
            <CardDescription>
              {isMainTable ? 'Main table partition' : 'Global Secondary Index'}
            </CardDescription>
          </div>
          <span className="text-xs bg-secondary px-2 py-1 rounded">
            {isMainTable ? 'TABLE' : 'GSI'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-muted rounded-md text-sm">
          <p>
            <span className="text-muted-foreground">Partition Key:</span>{' '}
            <span className="font-mono">{partition.partitionKey}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Range Key:</span>{' '}
            <span className="font-mono">{partition.rangeKey}</span>
          </p>
        </div>

        <OperationForm
          target="table"
          name={partition.id}
          operation="query"
          description="Execute a raw table query on this partition."
          placeholder={`{\n  "partition": ["ENTITY", "id"],\n  "range": {\n    "operation": "begins_with",\n    "value": "PREFIX"\n  },\n  "limit": 10\n}`}
          buttonLabel="Execute Query"
        />
      </CardContent>
    </Card>
  );
}
