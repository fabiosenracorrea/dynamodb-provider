import { ArrowRight } from 'lucide-react';

export function EntityLink({
  entity,
  onClick,
}: {
  entity: { name: string; type: string };
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between p-2 rounded-md border hover:bg-accent transition-colors text-left group w-full max-w-sm"
    >
      <div className="flex items-center gap-2">
        <span className="font-medium">{entity.name}</span>
        <span className="text-xs text-muted-foreground font-mono">{entity.type}</span>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
