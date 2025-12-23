/* eslint-disable @typescript-eslint/no-explicit-any */
// metadata/inferKeyPieces.ts
import type { KeyPiece } from '../../types';

const VAR_SYMBOL = Symbol('VAR_SYMBOL');

type VarSentinel = {
  [VAR_SYMBOL]: string;
  toString(): string;
  valueOf(): unknown;
};

function makeVarToken(name: string) {
  // token helps if sentinel gets coerced into a string (template literal, String(x), etc.)
  return `__VAR__${name}__`;
}

function makeSentinel(name: string): VarSentinel {
  const token = makeVarToken(name);

  const base: any = {
    [VAR_SYMBOL]: name,
    toString: () => token,
    valueOf: () => token,
    [Symbol.toPrimitive]: () => token,
  };

  // allow chaining: params.user.id without crashing
  return new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop];
      return makeSentinel(`${name}.${String(prop)}`);
    },
    apply() {
      return token;
    },
  });
}

function isVarSentinel(x: unknown): x is VarSentinel {
  return !!x && typeof x === 'object' && VAR_SYMBOL in (x as any);
}

function normalizeKeyReturn(ret: unknown): unknown[] {
  if (Array.isArray(ret)) return ret;
  return [ret];
}

function stringifyConstant(v: unknown): { value: string; numeric?: boolean } {
  if (v === null) return { value: 'null' };
  if (v === undefined) return { value: 'undefined' };
  if (typeof v === 'number') return { value: String(v), numeric: true };
  return { value: String(v) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type KeyDef = (params: any) => any;

/**
 * For now if this works the return is detected as a CONSTANT, instead of variables
 *
 * We have to figure out how to identify what is actually a constant added
 * and what is a variable transformation
 *
 * eg:
 *  - ({ email }) => [email.toLowerCase()]
 *  - ({ timestamp }) => ['DATE', timestamp.slice(0, 10)]
 * ...etc
 */
function retryKeyReturn(getKey: KeyDef, detectedParams: Map<string, VarSentinel>) {
  try {
    // try to call it will all params having their keyname as values
    // eg params = { email: 'email' }
    const attemptParams = Object.fromEntries(
      Array.from(detectedParams.keys()).map((param) => [param, param]),
    );

    return getKey(attemptParams);
  } catch {
    // we need to try combinations of different types
  }
}

export function inferKeyPieces(getKey: KeyDef): KeyPiece[] {
  const used = new Map<string, VarSentinel>();

  const paramsProxy = new Proxy(Object.create(null), {
    get(_t, prop) {
      if (typeof prop !== 'string') return undefined;
      const existing = used.get(prop);
      if (existing) return existing;
      const s = makeSentinel(prop);
      used.set(prop, s);
      return s;
    },
    has(_t, prop) {
      // supports: "id" in params
      if (typeof prop === 'string' && !used.has(prop)) {
        used.set(prop, makeSentinel(prop));
      }
      return false;
    },
  });

  let ret: unknown;

  try {
    ret = getKey(paramsProxy);
  } catch {
    // If it throws during probing, we still try to interpret what we got.
    // We try to cast values to usual formats (string, numbers, etc)
    ret = retryKeyReturn(getKey, used);
  }

  const parts = normalizeKeyReturn(ret);

  return parts.map((p) => {
    // direct sentinel returned
    if (isVarSentinel(p)) {
      return { type: 'VARIABLE', value: p[VAR_SYMBOL] };
    }

    // sentinel got coerced into a string token
    if (typeof p === 'string' && p.startsWith('__VAR__') && p.endsWith('__')) {
      const name = p.slice('__VAR__'.length, -'__'.length);
      return { type: 'VARIABLE', value: name };
    }

    // otherwise constant
    const { value, numeric } = stringifyConstant(p);
    return { type: 'CONSTANT', value, numeric };
  });
}
