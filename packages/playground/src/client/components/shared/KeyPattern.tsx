import { cn } from '@/utils/utils';
import { useMetadataContext } from '@/context';
import type { KeyPiece } from '@/utils/api';

interface KeyPatternProps {
  pieces: KeyPiece[];
  className?: string;
}

/**
 * A key as the schema declares it: constants literal, variables named. Deliberately
 * chrome-free so it can sit inline in dense rows — `KeyDisplay` wraps this with a
 * caption and tooltips for the detail views.
 */
export function KeyPattern({ pieces, className }: KeyPatternProps) {
  const { table } = useMetadataContext();
  const separator = table?.keySeparator ?? '#';

  if (!pieces.length) return <span className="text-muted-foreground">—</span>;

  return (
    <span className={cn('font-mono text-xs', className)}>
      {pieces.map((piece, index) => (
        // Key pieces are positional; there is no stabler identity than the index.
        // eslint-disable-next-line react/no-array-index-key
        <span key={index}>
          {index > 0 && <span className="text-muted-foreground/60">{separator}</span>}

          {piece.type === 'CONSTANT' ? (
            <span className="text-key-constant">{piece.value}</span>
          ) : (
            <span className="text-key-variable">
              {piece.value}
              {piece.numeric && <span className="text-muted-foreground"> (n)</span>}
            </span>
          )}
        </span>
      ))}
    </span>
  );
}
