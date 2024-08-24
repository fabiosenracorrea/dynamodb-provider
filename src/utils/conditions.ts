/* eslint-disable @typescript-eslint/no-explicit-any */

interface Condition<Result> {
  is: any;
  then: Result | (() => Result);
}

export function cascadeEval<Result>(conditions: Condition<Result>[]): Result {
  const firstTrue = conditions.find(({ is }) => is);
  const [lastCondition] = conditions.slice().reverse();

  const matchCondition = firstTrue ? firstTrue.then : lastCondition?.then;

  return (
    typeof matchCondition === 'function' ? (matchCondition as () => Result)?.() : matchCondition
  ) as Result;
}

interface SwitchCondition<Ref> {
  is: Ref[] | Ref | true;
  then: any | (() => any);
}

export function quickSwitch<RefValue, Cond extends SwitchCondition<RefValue>>(
  ref: RefValue,
  conditions: Cond[],
): Cond['then'] extends () => any
  ? ReturnType<Extract<Cond['then'], () => any>> | Exclude<Cond['then'], () => any>
  : Exclude<Cond['then'], () => any> {
  const firstTrue = conditions.find(({ is }) =>
    Array.isArray(is) ? is.includes(ref) : ref === is,
  );

  const [lastCondition] = conditions.slice().reverse();

  const then = firstTrue?.then ?? lastCondition?.then;

  return (typeof then === 'function' ? (then as () => any)?.() : then) as Cond['then'];
}
