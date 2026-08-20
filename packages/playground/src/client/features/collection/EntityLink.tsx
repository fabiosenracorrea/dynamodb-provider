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
      className="group flex w-full max-w-sm items-center justify-between rounded-md border p-2 text-left transition-colors hover:bg-accent"
    >
      <div className="flex items-center gap-2">
        <span className="font-medium">{entity.name}</span>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
