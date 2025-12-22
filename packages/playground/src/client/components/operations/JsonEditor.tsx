import { cn } from '@/lib/utils';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function JsonEditor({
  value,
  onChange,
  placeholder,
  rows = 10,
  className,
}: JsonEditorProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      spellCheck={false}
      className={cn(
        'w-full font-mono text-sm p-3 rounded-md border border-input bg-background',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'placeholder:text-muted-foreground resize-none',
        className,
      )}
    />
  );
}
