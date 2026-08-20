import { useState } from 'react';
import { ChevronDown, Layers, Key, Link2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { useCollection, useMetadataContext } from '@/context';

import { CollectionLoading } from './LoadingCollection';
import { CollectionPartition } from './CollectionPartition';
import { EntityLink } from './EntityLink';
import { GetCollection } from './GetCollection';

interface CollectionOperationsProps {
  collectionName: string;
  onSelectEntity?: (entityType: string) => void;
}

function JoinsSection({
  joins,
  getEntity,
  onSelectEntity,
}: {
  joins: string[];
  getEntity: (type: string) => { name: string; type: string } | undefined;
  onSelectEntity?: (entityType: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-3">
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-foreground">
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
        <Link2 className="h-4 w-4" />
        Joined Entities
        <Badge variant="outline" className="ml-1 text-xs">
          {joins.length}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1 pl-6">
          {joins.map((joinName) => {
            const entity = getEntity(joinName);
            return (
              <button
                key={joinName}
                onClick={() => entity && onSelectEntity?.(entity.type)}
                className="group flex w-full items-center justify-between rounded-md p-2 text-left transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{joinName}</span>
                  {entity && (
                    <span className="font-mono text-xs text-muted-foreground">{entity.type}</span>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function CollectionView({ collectionName, onSelectEntity }: CollectionOperationsProps) {
  const collection = useCollection(collectionName);
  const { getEntity } = useMetadataContext();
  const [showMetadata, setShowMetadata] = useState(true);

  if (!collection) {
    return <CollectionLoading />;
  }

  const originEntity = collection.originEntityType ? getEntity(collection.originEntityType) : null;

  return (
    <div className="space-y-4">
      {/* Metadata Card */}
      <Collapsible open={showMetadata} onOpenChange={setShowMetadata}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer pb-3 transition-colors hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{collection.name}</CardTitle>
                    <CardDescription className="mt-0.5">
                      {collection.originEntityType && (
                        <span className="font-mono text-xs">
                          from {collection.originEntityType}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={collection.type === 'SINGLE' ? 'default' : 'secondary'}
                    className="font-mono text-xs"
                  >
                    {collection.type}
                  </Badge>
                  {collection.joins.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {collection.joins.length} {collection.joins.length === 1 ? 'join' : 'joins'}
                    </Badge>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      showMetadata ? '' : '-rotate-90'
                    }`}
                  />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <Separator />

              {/* Partition Key Structure */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-medium">
                  <Key className="h-4 w-4" />
                  <CollectionPartition pieces={collection.partitionKey} />
                </h4>
              </div>

              {/* Origin Entity */}
              {originEntity && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-medium">
                    <Link2 className="h-4 w-4" />
                    Origin Entity
                  </h4>
                  <div className="pl-6">
                    <EntityLink
                      entity={originEntity}
                      onClick={() => onSelectEntity?.(originEntity.type)}
                    />
                  </div>
                </div>
              )}

              {/* Joins */}
              {!!collection.joins.length && (
                <JoinsSection
                  joins={collection.joins}
                  getEntity={getEntity}
                  onSelectEntity={onSelectEntity}
                />
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Get Collection Form */}
      <GetCollection collectionName={collectionName} />
    </div>
  );
}
