import { useMetadataContext } from '@/context';

interface FactProps {
  label: string;
  value?: string | null;
}

function Fact({ label, value }: FactProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="font-mono text-xs">
        {value ?? <span className="text-muted-foreground">not set</span>}
      </span>
    </div>
  );
}

export function TableSummary() {
  const { table } = useMetadataContext();

  if (!table) return null;

  const indexes = Object.entries(table.indexes ?? {});

  return (
    <section className="rounded-lg border bg-surface p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="font-mono text-lg font-semibold">{table.table}</h1>
        <span className="text-xs text-muted-foreground">single table</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Fact label="Partition key" value={table.partitionKey} />
        <Fact label="Range key" value={table.rangeKey} />
        <Fact label="Separator" value={table.keySeparator ?? '#'} />
        <Fact label="TTL" value={table.expiresAt} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {table.typeIndex ? (
          <span className="rounded border bg-background px-2 py-1 font-mono text-[11px]">
            <span className="text-muted-foreground">typeIndex </span>
            {table.typeIndex.name}
            <span className="text-muted-foreground">
              {' '}
              ({table.typeIndex.partitionKey} / {table.typeIndex.rangeKey})
            </span>
          </span>
        ) : (
          <span className="rounded border border-dashed px-2 py-1 text-[11px] text-muted-foreground">
            no typeIndex
          </span>
        )}

        {indexes.map(([name, config]) => (
          <span key={name} className="rounded border bg-background px-2 py-1 font-mono text-[11px]">
            {name}
            <span className="text-muted-foreground">
              {' '}
              ({config.partitionKey} / {config.rangeKey})
            </span>
            {config.numeric && <span className="text-key-variable"> numeric</span>}
          </span>
        ))}
      </div>
    </section>
  );
}
