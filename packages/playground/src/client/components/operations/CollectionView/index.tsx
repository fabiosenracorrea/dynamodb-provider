import { useState } from 'react';
import { ChevronDown, Layers, Key, Link2, ArrowRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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

export function CollectionView({
  collectionName,
  onSelectEntity,
}: CollectionOperationsProps) {
  const collection = useCollection(collectionName);
  const { getEntity } = useMetadataContext();
  const [showMetadata, setShowMetadata] = useState(true);

  if (!collection) {
    return <CollectionLoading />;
  }

  const originEntity = collection.originEntityType
    ? getEntity(collection.originEntityType)
    : null;

  return (
    <div className="space-y-4">
      {/* Metadata Card */}
      <Collapsible open={showMetadata} onOpenChange={setShowMetadata}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
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
                      {collection.joins.length}{' '}
                      {collection.joins.length === 1 ? 'join' : 'joins'}
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
            <CardContent className="pt-0 space-y-4">
              <Separator />

              {/* Partition Key Structure */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <CollectionPartition pieces={collection.partitionKey} />
                </h4>
              </div>

              {/* Origin Entity */}
              {originEntity && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
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
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors">
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
        <Link2 className="h-4 w-4" />
        Joined Entities
        <Badge variant="outline" className="text-xs ml-1">
          {joins.length}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-6 space-y-1">
          {joins.map((joinName) => {
            const entity = getEntity(joinName);
            return (
              <button
                key={joinName}
                onClick={() => entity && onSelectEntity?.(entity.type)}
                className="w-full flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors text-left group"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{joinName}</span>
                  {entity && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {entity.type}
                    </span>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
