import { useMemo, type CSSProperties } from 'react';
import { cn } from '@/utils/utils';

interface JsonViewProps {
  value: unknown;
  className?: string;
  style?: CSSProperties;
}

type Token = { text: string; kind: string };

const TOKEN_CLASS: Record<string, string> = {
  key: 'text-code-key',
  string: 'text-code-string',
  number: 'text-code-number',
  boolean: 'text-code-boolean',
  null: 'text-code-null',
  punctuation: 'text-muted-foreground',
};

/**
 * Regex over serialized JSON rather than a walk of the value: it keeps key order and
 * indentation exactly as `JSON.stringify` produced them, which is what makes the
 * output diffable by eye.
 */
const TOKEN_PATTERN =
  /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false)\b|\b(null)\b/g;

function tokenize(json: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;

  for (const match of json.matchAll(TOKEN_PATTERN)) {
    const [full, key, string, number, boolean, nullish] = match;
    const start = match.index ?? 0;

    if (start > lastIndex) {
      tokens.push({ text: json.slice(lastIndex, start), kind: 'punctuation' });
    }

    if (key !== undefined) {
      tokens.push({ text: key, kind: 'key' });
      tokens.push({ text: full.slice(key.length), kind: 'punctuation' });
    } else if (string !== undefined) {
      tokens.push({ text: string, kind: 'string' });
    } else if (number !== undefined) {
      tokens.push({ text: number, kind: 'number' });
    } else if (boolean !== undefined) {
      tokens.push({ text: boolean, kind: 'boolean' });
    } else if (nullish !== undefined) {
      tokens.push({ text: nullish, kind: 'null' });
    }

    lastIndex = start + full.length;
  }

  if (lastIndex < json.length) {
    tokens.push({ text: json.slice(lastIndex), kind: 'punctuation' });
  }

  return tokens;
}

export function JsonView({ value, className, style }: JsonViewProps) {
  const tokens = useMemo(() => {
    try {
      return tokenize(JSON.stringify(value, null, 2) ?? 'undefined');
    } catch {
      return [{ text: String(value), kind: 'punctuation' }];
    }
  }, [value]);

  return (
    <pre
      className={cn(
        'font-mono text-xs leading-relaxed p-3 rounded-md bg-surface border overflow-auto scrollbar-slim',
        className,
      )}
      style={style}
    >
      {tokens.map((token, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <span key={i} className={TOKEN_CLASS[token.kind]}>
          {token.text}
        </span>
      ))}
    </pre>
  );
}
