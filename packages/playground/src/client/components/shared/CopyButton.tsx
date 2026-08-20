import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CopyButtonProps {
  /** Copied verbatim when a string, otherwise serialized as pretty JSON. */
  value: unknown;
  label?: string;
  variant?: 'outline' | 'ghost' | 'default';
  tooltipSide?: 'left' | 'right' | 'top' | 'bottom';
  showTooltip?: boolean;
  className?: string;
}

export function CopyButton({
  value,
  label = 'Copy JSON',
  variant = 'outline',
  tooltipSide = 'left',
  showTooltip = true,
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);

    await navigator.clipboard.writeText(text);

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const button = (
    <Button
      variant={variant}
      size="icon"
      className={className ?? 'h-8 w-8'}
      onClick={handleCopy}
      aria-label={label}
    >
      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
    </Button>
  );

  if (!showTooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side={tooltipSide}>
        <p>{copied ? 'Copied' : label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
