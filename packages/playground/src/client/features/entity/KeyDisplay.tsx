import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useMetadataContext } from '@/context';
import type { KeyPiece } from '@/utils/api';

function buildPattern(pieces: KeyPiece[]): string {
  return pieces
    .map((piece) => (piece.type === 'CONSTANT' ? piece.value : '{value}'))
    .join('#');
}

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

  // Look up partition group if this is a partition key
  const partitionGroup =
    isPartitionKey && source
      ? getPartitionGroup(`${source}|${buildPattern(pieces)}`)
      : undefined;

  const handlePartitionClick = () => {
    if (partitionGroup) {
      navigate(`/partition/${encodeURIComponent(partitionGroup.id)}`);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      <span className="text-muted-foreground min-w-[90px]">{label}:</span>
      <div className="flex items-center gap-1 font-mono bg-muted/50 rounded px-2 py-1">
        {pieces.map((piece, idx) => (
          <TooltipProvider key={idx}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-0.5">
                  {idx > 0 && (
                    <span className="text-muted-foreground mx-0.5">
                      {table?.keySeparator ?? '#'}
                    </span>
                  )}
                  {piece.type === 'CONSTANT' ? (
                    <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                      {piece.value}
                    </span>
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

      {partitionGroup && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handlePartitionClick}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Users className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
                <span className={compact ? 'text-[10px]' : 'text-xs'}>
                  {partitionGroup.entities.length}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium mb-1">
                {partitionGroup.entities.length} entities share this partition
              </p>
              <p className="text-xs text-muted-foreground">
                {partitionGroup.entities.join(', ')}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
