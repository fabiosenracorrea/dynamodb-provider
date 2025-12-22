import { cn } from '@/lib/utils';

interface SidebarItemProps {
  name: string;
  type: string;
  subtitle?: string;
  isSelected: boolean;
  onClick: () => void;
}

export function SidebarItem({
  name,
  type,
  subtitle,
  isSelected,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2 rounded-md transition-colors',
        'hover:bg-accent',
        isSelected && 'bg-accent',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm truncate">{name}</span>
        <span className="text-xs font-mono text-muted-foreground ml-2 shrink-0">
          {type}
        </span>
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
      )}
    </button>
  );
}
