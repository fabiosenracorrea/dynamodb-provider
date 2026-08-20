import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useMetadataContext } from '@/context';
import type { KeyPiece } from '@/utils/api';

export function CollectionPartition({ pieces }: { pieces: KeyPiece[] }) {
  const { table } = useMetadataContext();

  return (
    <div className="flex w-fit items-center gap-1 rounded bg-muted/50 px-2 py-1 font-mono text-sm">
      {pieces.map((piece, idx) => (
        <TooltipProvider key={idx}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-0.5">
                {idx > 0 && (
                  <span className="mx-0.5 text-muted-foreground">{table?.keySeparator ?? '#'}</span>
                )}
                {piece.type === 'CONSTANT' ? (
                  <span className="text-amber-600 dark:text-amber-400">{piece.value}</span>
                ) : (
                  <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                    {piece.value}
                    {piece.numeric && (
                      <span className="text-[10px] text-muted-foreground">(n)</span>
                    )}
                  </span>
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {piece.type === 'CONSTANT' ? 'Constant value' : 'Dynamic variable'}
                {piece.numeric && ' (numeric)'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}
