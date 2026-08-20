import { cn } from '@/utils/utils';
import { entityColor, entityTint } from '@/utils/entityColor';

interface EntityDotProps {
  type: string;
  className?: string;
}

export function EntityDot({ type, className }: EntityDotProps) {
  return (
    <span
      className={cn('inline-block h-2 w-2 shrink-0 rounded-full', className)}
      style={{ backgroundColor: entityColor(type) }}
      aria-hidden
    />
  );
}

interface EntityBadgeProps {
  type: string;
  className?: string;
  muted?: boolean;
}

export function EntityBadge({ type, className, muted }: EntityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-[11px] leading-none',
        className,
      )}
      style={
        muted
          ? undefined
          : { backgroundColor: entityTint(type), color: entityColor(type) }
      }
    >
      <EntityDot type={type} />
      {type}
    </span>
  );
}
