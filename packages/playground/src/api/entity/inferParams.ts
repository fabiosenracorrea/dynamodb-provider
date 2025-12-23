// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;

export function inferParams(fn: AnyFn): string[] {
  const params: string[] = [];
  const seen = new Set<string>();

  const record = (key: string) => {
    if (!seen.has(key)) {
      seen.add(key);
      params.push(key);
    }
  };

  // A "safe" placeholder value that won't explode if the function tries to chain
  // (e.g. p.user.id, String(p.id), p.id?.toString(), etc.)
  const makeSentinel = () =>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    new Proxy(() => {}, {
      get(_t, prop) {
        if (prop === Symbol.toPrimitive) return () => undefined;
        if (prop === 'valueOf') return () => undefined;
        if (prop === 'toString') return () => 'undefined';
        return makeSentinel();
      },
      apply() {
        return undefined;
      },
    });

  const paramsProxy = new Proxy(Object.create(null), {
    get(_t, prop) {
      if (typeof prop === 'string') record(prop);
      return makeSentinel();
    },
    has(_t, prop) {
      if (typeof prop === 'string') record(prop);
      return false;
    },
    ownKeys() {
      return [];
    },
    getOwnPropertyDescriptor() {
      return undefined;
    },
  });

  // Use case 1: no params
  if (fn.length === 0) return [];

  // Use case 2/3: call once; if it’s not an object param, it simply won’t record any keys.
  try {
    fn(paramsProxy);
  } catch {
    // ignore errors; we only care what was accessed before it threw
  }

  return params;
}
