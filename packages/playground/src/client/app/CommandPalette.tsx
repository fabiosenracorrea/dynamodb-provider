import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, Layers, Search, Table2 } from 'lucide-react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/utils';
import { useMetadataContext } from '@/context';
import { EntityDot } from '@/components/shared';

interface Command {
  id: string;
  label: string;
  hint?: string;
  group: string;
  to: string;
  entityType?: string;
}

const GROUP_ICON: Record<string, typeof Boxes> = {
  Entities: Boxes,
  Partitions: Layers,
  Collections: Table2,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(0);

  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);

  const { entities, collections, partitionGroups } = useMetadataContext();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const commands = useMemo<Command[]>(
    () => [
      ...entities.map((entity) => ({
        id: `entity-${entity.type}`,
        label: entity.type,
        hint: `${entity.indexes.length} index${entity.indexes.length === 1 ? '' : 'es'}`,
        group: 'Entities',
        to: `/entity/${encodeURIComponent(entity.type)}`,
        entityType: entity.type,
      })),
      ...partitionGroups.map((group) => ({
        id: `partition-${group.id}`,
        label: group.pattern,
        hint: group.entities.join(', '),
        group: 'Partitions',
        to: `/partition/${encodeURIComponent(group.id)}`,
      })),
      ...collections.map((collection) => ({
        id: `collection-${collection.name}`,
        label: collection.name,
        hint: collection.originEntityType ?? 'no root entity',
        group: 'Collections',
        to: `/collection/${encodeURIComponent(collection.name)}`,
      })),
    ],
    [entities, collections, partitionGroups],
  );

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return commands;

    return commands.filter(({ label, hint, group }) =>
      `${label} ${hint ?? ''} ${group}`.toLowerCase().includes(term),
    );
  }, [commands, search]);

  useEffect(() => setActive(0), [search]);

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const select = (command: Command) => {
    navigate(command.to);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((current) => Math.min(results.length - 1, current + 1));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) => Math.max(0, current - 1));
    }

    if (event.key === 'Enter' && results[active]) {
      event.preventDefault();
      select(results[active]);
    }
  };

  let lastGroup = '';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to an entity, partition or collection…"
            className="h-11 border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div ref={listRef} className="scrollbar-slim max-h-80 overflow-auto p-1">
          {!results.length && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nothing matches “{search}”
            </p>
          )}

          {results.map((command, index) => {
            const showGroup = command.group !== lastGroup;
            lastGroup = command.group;
            const Icon = GROUP_ICON[command.group] ?? Boxes;

            return (
              <div key={command.id}>
                {showGroup && (
                  <p className="px-2 pb-1 pt-3 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {command.group}
                  </p>
                )}

                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => select(command)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm',
                    index === active ? 'bg-accent' : 'hover:bg-accent/50',
                  )}
                >
                  {command.entityType ? (
                    <EntityDot type={command.entityType} />
                  ) : (
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  )}

                  <span className="truncate font-mono text-xs">{command.label}</span>

                  {command.hint && (
                    <span className="ml-auto truncate pl-3 text-[11px] text-muted-foreground">
                      {command.hint}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
