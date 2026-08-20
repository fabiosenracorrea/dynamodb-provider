import { ChevronDown, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { Separator } from '@/components/ui/separator';

import type { KeyPiece, PartitionGroup, EntityMetadata } from '@/utils/api';
import { useMetadataContext } from '@/context';

interface PartitionEntityListProps {
  partition: PartitionGroup;
}

function formatKeyPieces(pieces: KeyPiece[]): string {
  return pieces.map((p) => (p.type === 'CONSTANT' ? p.value : `{${p.value}}`)).join('#');
}

function getRangeKeyForEntity(
  entity: EntityMetadata | undefined,
  partition: PartitionGroup,
): string | null {
  if (!entity) return null;

  if (partition.sourceType === 'main') {
    return formatKeyPieces(entity.rangeKey);
  }

  const idx = entity.indexes.find((i) => i.index === partition.source);
  return idx ? formatKeyPieces(idx.rangeKey) : null;
}

export function PartitionEntityList({ partition }: PartitionEntityListProps) {
  const { getEntity } = useMetadataContext();

  const [showEntities, setShowEntities] = useState(true);

  const navigate = useNavigate();

  const goToEntity = (entityType: string) => {
    navigate(`/entity/${entityType}`);
  };

  return (
    <CardContent className="pt-0">
      <Collapsible open={showEntities} onOpenChange={setShowEntities}>
        <CollapsibleTrigger className="flex w-full items-center gap-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showEntities ? '' : '-rotate-90'}`}
          />
          <span className="font-medium">Entities in this partition</span>
          <Badge variant="outline" className="ml-auto text-xs">
            {partition.entities.length}
          </Badge>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="pt-2">
            <Separator className="mb-3" />
            <div className="space-y-1">
              {partition.entities.map((entityType) => {
                const entity = getEntity(entityType);
                const rangeKey = getRangeKeyForEntity(entity, partition);

                return (
                  <button
                    key={entityType}
                    onClick={() => goToEntity(entityType)}
                    className="group flex w-full items-center justify-between rounded-md p-2 text-left transition-colors hover:bg-accent"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{entity?.name ?? entityType}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {entityType}
                        </span>
                      </div>
                      {rangeKey && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {rangeKey}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </CardContent>
  );
}
