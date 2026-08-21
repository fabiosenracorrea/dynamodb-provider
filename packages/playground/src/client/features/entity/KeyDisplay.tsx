import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMetadataContext } from '@/context';
import type { KeyPiece } from '@/utils/api';
import { buildKeyPattern, partitionGroupId } from '@/utils/keys';

interface KeyDisplayProps {
  label: string;
  pieces: KeyPiece[];
  compact?: boolean;
  source?: string; // 'TABLE' or index name - only for partition keys
  isPartitionKey?: boolean;
}

export function KeyDisplay({
  label,
  pieces,
  compact = false,
  source,
  isPartitionKey = false,
}: KeyDisplayProps) {
  const navigate = useNavigate();
  const { table, getPartitionGroup } = useMetadataContext();

  // Look up partition group if this is a partition key. Must build the id exactly as
  // MetadataContext does, hence the shared helpers.
  const partitionGroup =
    isPartitionKey && source
      ? getPartitionGroup(
          partitionGroupId(source, buildKeyPattern(pieces, table?.keySeparator ?? '#')),
        )
      : undefined;

  const handlePartitionClick = () => {
    if (partitionGroup) {
      navigate(`/partition/${encodeURIComponent(partitionGroup.id)}`);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      <span className="min-w-[90px] text-muted-foreground">{label}:</span>
      <div className="flex items-center gap-1 rounded bg-muted/50 px-2 py-1 font-mono">
        {pieces.map((piece, idx) => (
          <TooltipProvider key={idx}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-0.5">
                  {idx > 0 && (
                    <span className="mx-0.5 text-muted-foreground">
                      {table?.keySeparator ?? '#'}
                    </span>
                  )}
                  {piece.type === 'CONSTANT' ? (
                    <span className="flex items-center gap-0.5 text-key-constant">
                      {piece.value}
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-key-variable">
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

      {partitionGroup && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handlePartitionClick}
                className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Users className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
                <span className={compact ? 'text-[10px]' : 'text-xs'}>
                  {partitionGroup.entities.length}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="mb-1 font-medium">
                {partitionGroup.entities.length} entities share this partition
              </p>
              <p className="text-xs text-muted-foreground">{partitionGroup.entities.join(', ')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
