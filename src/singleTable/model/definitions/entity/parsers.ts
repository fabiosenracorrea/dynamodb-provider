import { AnyFunction, AnyObject, IsNever, PrettifyObject } from 'types';

export type EntityParseParams<Entity extends AnyObject> = {
  /**
   * Add / modify any props from the entity you may want.
   *
   * The result of this call with merge with the data returned from the table,
   * **it takes procedure here**
   *
   * When applied inside a collection operation, it's resolved after the collection is built,
   * meaning any parser configured there can impact what this function receives. Or have it not
   * called altogether, if the remaining result is not an object
   */
  extend?: (entity: Entity) => AnyObject;
};

type Extended<Entity extends AnyObject, ExtendResult> = PrettifyObject<
  IsNever<Extract<keyof Entity, keyof ExtendResult>> extends true
    ? Entity & ExtendResult
    : Omit<Entity, Extract<keyof Entity, keyof ExtendResult>> & ExtendResult
>;

export type ResolvedEntity<
  Entity extends AnyObject,
  Params extends EntityParseParams<Entity>,
> = Params['extend'] extends AnyFunction ? Extended<Entity, ReturnType<Params['extend']>> : Entity;

export type EntityParser<E extends AnyObject, Parsers extends EntityParseParams<E>> = (
  entity: E,
) => ResolvedEntity<E, Parsers>;

export type EntityParseProps<
  Entity extends AnyObject,
  Params extends EntityParseParams<Entity>,
> = Params['extend'] extends AnyFunction
  ? {
      /**
       * Add / modify any props from the entity you may want.
       *
       * The result of this call will merge with the data returned from the table,
       * **it takes procedure here**
       *
       * When applied inside a collection operation, it's resolved after the collection is built,
       * meaning any parser configured there can impact what this function receives. Or have it not
       * called altogether, if the remaining result is not an object
       */
      parser: EntityParser<Entity, Params>;
    }
  : {
      parser?: never;
    };

// This is simply a preparation for the other parsers that we will have
export function getEntityParserProps<
  Entity extends AnyObject,
  Parsers extends EntityParseParams<Entity>,
>({ extend }: Parsers): EntityParseProps<Entity, Parsers> {
  if (!extend) return {} as EntityParseProps<Entity, Parsers>;

  return {
    parser: (entity: Entity) => ({
      ...entity,
      ...extend(entity),
    }),
  } as EntityParseProps<Entity, Parsers>;
}
