export function createId(): string {
  return crypto.randomUUID();
}

export function getPropertyKeys(item: Record<string, unknown>): string[] {
  return Object.keys(item).filter((key) => !['_pk', '_sk', '_type', '_c', '_m'].includes(key));
}

export function validateJson(value: string): {
  valid: boolean;
  error?: string;
  parsed?: unknown;
} {
  if (!value.trim()) {
    return { valid: false, error: 'Value is required' };
  }
  try {
    const parsed = JSON.parse(value);
    return { valid: true, parsed };
  } catch {
    return { valid: false, error: 'Invalid JSON' };
  }
}

export function parseValue(str: string): unknown {
  if (str === 'null') return null;
  if (str === 'true') return true;
  if (str === 'false') return false;
  const num = Number(str);
  if (!Number.isNaN(num) && str.trim() !== '') return num;
  return str;
}

export function formatJsonPreview(value: unknown): string {
  if (typeof value === 'string') return `"${value}"`;
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
