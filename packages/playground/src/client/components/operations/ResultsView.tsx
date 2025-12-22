import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ResultsViewProps {
  data: unknown;
  error?: string | null;
}

export function ResultsView({ data, error }: ResultsViewProps) {
  const [copied, setCopied] = useState(false);

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm font-medium text-destructive">Error</p>
        <p className="text-sm text-destructive/80 mt-1">{error}</p>
      </div>
    );
  }

  const formatted = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <pre className="json-view">{formatted}</pre>
    </div>
  );
}
