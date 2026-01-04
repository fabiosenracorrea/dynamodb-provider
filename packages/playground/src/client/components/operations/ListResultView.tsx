import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ItemDetailView } from './ItemView';

interface ListResultViewProps {
  data: unknown;
  error?: string | null;
  entityType?: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function ListResultView({ data, error, entityType }: ListResultViewProps) {
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedItem, setSelectedItem] = useState<Record<string, unknown> | null>(null);

  // Extract items array from data
  const items = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data as Record<string, unknown>[];
    if (typeof data === 'object' && data !== null && 'items' in data) {
      return (data as { items: unknown[] }).items as Record<string, unknown>[];
    }
    return [];
  }, [data]);

  // Get all unique keys from all items for table headers
  const columns = useMemo(() => {
    const keySet = new Set<string>();
    items.forEach((item) => {
      Object.keys(item).forEach((key) => keySet.add(key));
    });
    return Array.from(keySet);
  }, [items]);

  // Pagination
  const totalPages = Math.ceil(items.length / pageSize);
  const paginatedItems = useMemo(() => {
    const start = currentPage * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  // Reset to first page when page size changes
  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(0);
  };

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm font-medium text-destructive">Error</p>
        <p className="text-sm text-destructive/80 mt-1">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-muted bg-muted/30 p-6 text-center text-muted-foreground">
        <p className="text-sm font-medium">No items found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Results count and page size */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{items.length} items</span>
          <div className="flex items-center gap-2">
            <span>Show</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>per page</span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelectedItem(item)}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="px-3 py-2 font-mono text-xs max-w-[200px] truncate"
                      >
                        {formatCellValue(item[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(0)}
                disabled={currentPage === 0}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(totalPages - 1)}
                disabled={currentPage >= totalPages - 1}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Item Detail Sheet */}
      <Sheet
        open={selectedItem !== null}
        onOpenChange={(open) => !open && setSelectedItem(null)}
      >
        <SheetContent
          className="sm:max-w-3xl w-full"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <SheetHeader>
            <SheetTitle>Item Details</SheetTitle>
          </SheetHeader>
          {selectedItem && (
            <div className="mt-4">
              <ItemDetailView
                item={selectedItem}
                entityType={entityType}
                maxHeight="calc(100vh - 150px)"
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function formatCellValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
