import { useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/utils/utils';
import { useMetadataContext } from '@/context';

import { EntityDot } from './EntityBadge';

export type Row = Record<string, unknown>;

interface ResultTableProps {
  items: Row[];
  error?: string | null;
  /** Fixed entity type when every row is the same kind (an entity query). */
  entityType?: string;
  /** More pages available on the server; omit to hide the control entirely. */
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  /** Rendered inside the detail drawer for the clicked row. */
  renderDetail?: (item: Row) => ReactNode;
  emptyMessage?: string;
}

const PAGE_SIZES = [25, 50, 100, 250];

function formatCell(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);

  return String(value);
}

function cellTone(value: unknown): string {
  if (value === null || value === undefined) return 'text-code-null';
  if (typeof value === 'number') return 'text-code-number';
  if (typeof value === 'boolean') return 'text-code-boolean';

  return '';
}

export function ResultTable({
  items,
  error,
  entityType,
  hasMore,
  isLoadingMore,
  onLoadMore,
  renderDetail,
  emptyMessage = 'No items found',
}: ResultTableProps) {
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Row | null>(null);

  const { table } = useMetadataContext();
  const typeProperty = table?.typeIndex?.partitionKey;

  const columns = useMemo(() => {
    const seen = new Set<string>();

    items.forEach((item) => Object.keys(item).forEach((key) => seen.add(key)));

    return [...seen];
  }, [items]);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);

  const visible = useMemo(
    () => items.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [items, safePage, pageSize],
  );

  /** Rows can be mixed-type (a partition or scan), so fall back to the type column. */
  const rowType = (row: Row): string | undefined =>
    entityType ?? (typeProperty ? (row[typeProperty] as string | undefined) : undefined);

  if (error) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4">
        <p className="text-sm font-medium text-destructive">Error</p>
        <p className="mt-1 text-sm text-destructive/80">{error}</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-md border border-dashed bg-surface p-8 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="tabular">
            {items.length} loaded
            {hasMore ? ' · more available' : ''}
          </span>

          <div className="flex items-center gap-2">
            <span>Rows</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(0);
              }}
            >
              <SelectTrigger className="h-7 w-[74px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border">
          <div className="scrollbar-slim max-h-[52vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="border-b">
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visible.map((row, index) => {
                  const type = rowType(row);

                  return (
                    <tr
                      // eslint-disable-next-line react/no-array-index-key
                      key={index}
                      onClick={() => setSelected(row)}
                      className="cursor-pointer border-b transition-colors last:border-0 hover:bg-accent/60"
                    >
                      {columns.map((column, columnIndex) => (
                        <td
                          key={column}
                          className={cn(
                            'max-w-[240px] truncate px-3 py-1.5 font-mono text-xs',
                            cellTone(row[column]),
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            {columnIndex === 0 && type && <EntityDot type={type} />}
                            {formatCell(row[column])}
                          </span>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="tabular px-2 text-xs text-muted-foreground">
              {safePage + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {hasMore && onLoadMore && (
            <Button variant="outline" size="sm" onClick={onLoadMore} disabled={isLoadingMore}>
              {isLoadingMore && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Fetch next page
            </Button>
          )}
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent
          className="w-full sm:max-w-3xl"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <SheetHeader>
            <SheetTitle>Item details</SheetTitle>
          </SheetHeader>
          {selected && <div className="mt-4">{renderDetail?.(selected)}</div>}
        </SheetContent>
      </Sheet>
    </>
  );
}
