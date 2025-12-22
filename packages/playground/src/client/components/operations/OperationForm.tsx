import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonEditor } from './JsonEditor';
import { ResultsView } from './ResultsView';
import { execute, type ExecuteRequest } from '@/lib/api';

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
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const parsedParams = JSON.parse(params);
      const response = await execute({
        target,
        name,
        operation,
        index,
        params: parsedParams,
      });

      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      <div>
        <label className="text-sm font-medium mb-1.5 block">Parameters (JSON)</label>
        <JsonEditor value={params} onChange={setParams} placeholder={placeholder} />
      </div>

      <Button onClick={handleExecute} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {buttonLabel}
      </Button>

      {(result !== null || error) && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Result</h4>
          <ResultsView data={result} error={error} />
        </div>
      )}
    </div>
  );
}
