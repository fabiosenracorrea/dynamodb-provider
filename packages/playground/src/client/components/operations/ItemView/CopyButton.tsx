import { useState, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { useItemContext } from './_context';

interface CopyButtonProps {
  variant?: 'outline' | 'ghost' | 'default';
  tooltipSide?: 'left' | 'right' | 'top' | 'bottom';
  showTooltip?: boolean;
}

export function CopyButton({
  variant = 'outline',
  tooltipSide = 'left',
  showTooltip = true,
}: CopyButtonProps) {
  const { item } = useItemContext();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(item, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const button = (
    <Button variant={variant} size="icon" className="h-8 w-8" onClick={handleCopy}>
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  if (!showTooltip) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side={tooltipSide}>
        <p>Copy JSON</p>
      </TooltipContent>
    </Tooltip>
  );
}
