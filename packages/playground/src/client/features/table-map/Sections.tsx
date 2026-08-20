import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

import { EntityBadge } from '@/components/shared';
import { useMetadataContext } from '@/context';

import type { ConfigWarning } from './warnings';

export function PartitionsSection() {
  const navigate = useNavigate();
  const { partitionGroups } = useMetadataContext();

  if (!partitionGroups.length) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Shared partitions
      </h2>

      <div className="grid gap-2 sm:grid-cols-2">
        {partitionGroups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => navigate(`/partition/${encodeURIComponent(group.id)}`)}
            className="rounded-md border bg-background px-3 py-2 text-left transition-colors hover:border-foreground/20"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate font-mono text-xs">{group.pattern}</span>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                {group.source}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap gap-1">
              {group.entities.map((type) => (
                <EntityBadge key={type} type={type} />
              ))}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export function CollectionsSection() {
  const navigate = useNavigate();
  const { collections } = useMetadataContext();

  if (!collections.length) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Collections
      </h2>

      <div className="grid gap-2 sm:grid-cols-2">
        {collections.map((collection) => (
          <button
            key={collection.name}
            type="button"
            onClick={() => navigate(`/collection/${encodeURIComponent(collection.name)}`)}
            className="rounded-md border bg-background px-3 py-2 text-left transition-colors hover:border-foreground/20"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-xs font-medium">{collection.name}</span>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {collection.type === 'MULTIPLE' ? 'many' : 'one'}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {collection.originEntityType ? (
                <EntityBadge type={collection.originEntityType} />
              ) : (
                <span className="text-[11px] text-muted-foreground">no root entity</span>
              )}
              <span className="text-muted-foreground">+</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {collection.joins.join(', ')}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export function ConfigWarnings({ warnings }: { warnings: ConfigWarning[] }) {
  if (!warnings.length) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Configuration notes
      </h2>

      <div className="space-y-1.5">
        {warnings.map((warning) => (
          <div
            key={warning.id}
            className="flex gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
            <div>
              <p className="text-xs font-medium">{warning.title}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{warning.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
