import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonEditor } from './JsonEditor';
import { ResultsView } from './ResultsView';
import { useExecute } from '@/utils/hooks';
import type { ExecuteRequest } from '@/utils/api';

interface OperationFormProps {
  target: ExecuteRequest['target'];
  name: string;
  operation: string;
  index?: string;
  description?: string;
  placeholder?: string;
  buttonLabel?: string;
}

export function OperationForm({
  target,
  name,
  operation,
  index,
  description,
  placeholder = '{\n  \n}',
  buttonLabel = 'Execute',
}: OperationFormProps) {
  const [params, setParams] = useState(placeholder);
  const [parseError, setParseError] = useState<string | null>(null);
  const mutation = useExecute();

  const handleExecute = () => {
    setParseError(null);

    let parsedParams: Record<string, unknown>;
    try {
      parsedParams = JSON.parse(params);
    } catch {
      setParseError('Invalid JSON');
      return;
    }

    mutation.mutate({
      target,
      name,
      operation,
      index,
      params: parsedParams,
    });
  };

  const result = mutation.data?.success ? mutation.data.data : null;
  const error = parseError ?? (mutation.data?.success === false ? mutation.data.error : null);

  return (
    <div className="space-y-4">
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      <div>
        <label className="text-sm font-medium mb-1.5 block">Parameters (JSON)</label>
        <JsonEditor value={params} onChange={setParams} placeholder={placeholder} />
      </div>

      <Button onClick={handleExecute} disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {buttonLabel}
      </Button>

      {(result !== null || error) && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Result</h4>
          <ResultsView data={result} error={error ?? undefined} />
        </div>
      )}
    </div>
  );
}
