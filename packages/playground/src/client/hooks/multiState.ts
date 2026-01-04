import { Dispatch, StateSetter, useCallback, useMemo, useReducer, useRef } from 'react';
import { omit } from '@/utils/object';
import { AnyFunction, OnlyOptional } from '@/types';

/*
 **
 ** ---------> Memorization is VITAL for these <---------------------
 **
 */

type OrUpdater<State, T> = T | ((old: State) => T);

type IncompleteState<State> = { [key in keyof State]?: OrUpdater<State, State[key]> };

type UpdateState<State> = IncompleteState<State> | ((old: State) => State);
// type UpdateState<State> = IncompleteState<State>;

export type MultiStateDispatchAction<DefaultValues> = Dispatch<
  UpdateState<DefaultValues>
>;

const REMOVAL_KEY = `${Math.random()}__remove`;

function executeMergeUpdate<State extends object>(
  state: State,
  action: Partial<UpdateState<State>>,
): State {
  const updatedState = Object.fromEntries(
    Object.entries(action).map(([key, value]) => {
      const updated = typeof value === 'function' ? value(state) : value;

      return [key, updated];
    }),
  );

  const updated = {
    ...state,
    ...updatedState,
  };

  const propToRemove = action[REMOVAL_KEY as keyof UpdateState<State>];

  return (
    propToRemove ? omit(updated, [propToRemove as keyof UpdateState<State>]) : updated
  ) as State;
}

export function resolveState<State extends object>(
  state: State,
  action: UpdateState<State>,
): State {
  if (typeof action === 'function') return action(state);

  const noChange = Object.entries(action).every(([key, value]) =>
    key === REMOVAL_KEY ? false : state[key as keyof State] === value,
  );

  if (noChange) return state;

  return executeMergeUpdate(state, action);
}

export type MultiStateHook<State> = {
  values: State;
  dispatch: Dispatch<UpdateState<State>>;
  resetDefault: () => void;
  peek: () => State;
  remove: (key: keyof OnlyOptional<State>) => void;

  set: <Key extends keyof State>(
    key: Key,
    value: State[Key] | ((old: State[Key]) => State[Key]),
  ) => void;

  getSetter: <Key extends keyof State>(key: Key) => StateSetter<State[Key]>;
};

export function useMultiState<State extends object>(
  defaultValues: State,
): MultiStateHook<State> {
  const [values, dispatch] = useReducer(resolveState, defaultValues);

  const resetDefault = useCallback(() => {
    dispatch(() => defaultValues);
    // on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stateRef = useRef(values);

  stateRef.current = values;

  const peek = useCallback(() => {
    return stateRef.current;
  }, []);

  const remove = useCallback((prop: keyof OnlyOptional<State>) => {
    dispatch({
      [REMOVAL_KEY]: prop,
    });
  }, []);

  const set: MultiStateHook<State>['set'] = useCallback((prop, value) => {
    dispatch({
      [prop]:
        typeof value === 'function'
          ? (old: State) => (value as AnyFunction)(old[prop])
          : value,
    });
  }, []);

  const getSetter: MultiStateHook<State>['getSetter'] = useCallback((prop) => {
    return (value) =>
      dispatch({
        [prop]:
          typeof value === 'function'
            ? (old: State) => (value as AnyFunction)(old[prop])
            : value,
      });
  }, []);

  return useMemo(
    () => ({
      values,
      dispatch,
      resetDefault,
      peek,
      set,
      remove,
      getSetter,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values],
  ) as MultiStateHook<State>;
}
