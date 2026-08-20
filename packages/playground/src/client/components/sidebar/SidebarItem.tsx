import type { ReactNode } from 'react';

import { cn } from '@/utils/utils';

interface SidebarItemProps {
  name: string;
  /** Right-aligned detail — index count, member entities, etc. */
  meta?: string;
  subtitle?: string;
  leading?: ReactNode;
  isSelected: boolean;
  onClick: () => void;
}

export function SidebarItem({
  name,
  meta,
  subtitle,
  leading,
  isSelected,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-md px-2 py-1.5 text-left transition-colors',
        isSelected ? 'bg-accent' : 'hover:bg-accent/60',
      )}
    >
      <div className="flex items-center gap-2">
        {leading}

        <span
          className={cn(
            'truncate font-mono text-xs',
            isSelected ? 'text-foreground' : 'text-foreground/85',
          )}
        >
          {name}
        </span>

        {meta && (
          <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{meta}</span>
        )}
      </div>

      {subtitle && (
        <p className="mt-0.5 truncate pl-0.5 text-[10px] text-muted-foreground">{subtitle}</p>
      )}
    </button>
  );
}
