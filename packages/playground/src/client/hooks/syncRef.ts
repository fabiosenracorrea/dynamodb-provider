import { MutableRefObject, useEffect, useRef } from 'react';

/**
 * The intention to this hook is to be used to cheat
 * useCallback/memo refs when using in hooks that receive in-line params
 * and ensure referential safety
 *
 * Example = if we have
 *
 *```ts
 *function useLoad({ onLoad }: { onLoad?: () => void }): any {
 *  const load = useCallback(() => {
 *    // call api
 *    onLoad?.(result) <----------
 *  }, [...internal refs properly memorized])
 *}
 * ```
 *
 * The common usage could be:
 *
 * ```ts
 *   function Component() {
 *     // some state
 *
 *     useLoad({
 *       onLoad: () => // do something...
 *     })
 *   }
 * ```
 *
 *  So if we don't this we could trigger lots lof re-renders due to those inline callbacks
 */
export function useSyncRef<Params = undefined>(
  ...params: Params extends undefined ? [] : [Params]
): MutableRefObject<Params extends undefined ? undefined : Params> {
  const [state] = params;

  const ref = useRef(state);

  // as doc
  // https://react.dev/reference/react/useRef#referencing-a-value-with-a-ref
  useEffect(() => {
    ref.current = state;
  });

  return ref as MutableRefObject<Params extends undefined ? undefined : Params>;
}
