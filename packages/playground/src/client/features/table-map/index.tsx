import { useMemo } from 'react';

import { useMetadataContext } from '@/context';

import { TableSummary } from './TableSummary';
import { EntityRow } from './EntityRow';
import { CollectionsSection, ConfigWarnings, PartitionsSection } from './Sections';
import { deriveWarnings } from './warnings';

export function TableMap() {
  const { metadata, entities } = useMetadataContext();

  const warnings = useMemo(() => (metadata ? deriveWarnings(metadata) : []), [metadata]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <TableSummary />

      <section className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Entities ({entities.length})
        </h2>

        <div className="space-y-2">
          {entities.map((entity) => (
            <EntityRow key={entity.type} entity={entity} />
          ))}
        </div>
      </section>

      <PartitionsSection />
      <CollectionsSection />
      <ConfigWarnings warnings={warnings} />
    </div>
  );
}
