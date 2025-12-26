import { useState } from 'react';
import { ArrowDownAZ, ArrowUpAZ, ArrowUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type SortOrder = 'default' | 'asc' | 'desc';

const SORT_OPTIONS: Array<{ value: SortOrder; label: string; icon: typeof ArrowUpDown }> = [
  { value: 'default', label: 'Default', icon: ArrowUpDown },
  { value: 'asc', label: 'A to Z', icon: ArrowDownAZ },
  { value: 'desc', label: 'Z to A', icon: ArrowUpAZ },
];

interface SortPopoverProps {
  value: SortOrder;
  onChange: (value: SortOrder) => void;
}

export function SortPopover({ value, onChange }: SortPopoverProps) {
  const [open, setOpen] = useState(false);

  const currentSort = SORT_OPTIONS.find((opt) => opt.value === value)!;
  const SortIcon = currentSort.icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label="Sort items"
        >
          <SortIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-36">
        <div className="space-y-1">
          {SORT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = value === option.value;
            return (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-left">{option.label}</span>
                {isSelected && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function applySortOrder<T>(
  items: T[],
  sortOrder: SortOrder,
  getName: (item: T) => string,
): T[] {
  if (sortOrder === 'default') return items;

  return [...items].sort((a, b) => {
    const nameA = getName(a);
    const nameB = getName(b);
    return sortOrder === 'asc'
      ? nameA.localeCompare(nameB)
      : nameB.localeCompare(nameA);
  });
}
