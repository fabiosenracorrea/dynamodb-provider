/* eslint-disable @typescript-eslint/no-explicit-any */

import { UpdateParams } from './types';

export function validateUpdateParams({
  key,
  atomicOperations,
  remove,
  values,
  conditions,
}: UpdateParams<any>): void {
  const actualConditions = conditions || [];

  const propertiesInvolvedInEachOp = [
    Object.keys(values || {}),
    remove || [],
    (atomicOperations || []).map(({ property }) => property),
  ];

  const uniqueProperties = new Set(propertiesInvolvedInEachOp.flat(2));

  const allPropertiesMentioned = propertiesInvolvedInEachOp.reduce(
    (acc, next) => acc + next.length,
    0,
  );

  const malformed = [
    // dynamodb Key is 1-2 prop long
    ![1, 2].includes(Object.keys(key).length),

    // Cant update key values
    Object.keys(key).some((prop) => uniqueProperties.has(prop)),

    // did not pass any update ref
    [values, remove, atomicOperations].every((params) => !params),

    // Duplicate mention across update methods
    uniqueProperties.size !== allPropertiesMentioned,

    // no prop resulting to update
    uniqueProperties.size === 0,

    // multiple conditions on the same property
    // (enhance in the future to allow for this)
    actualConditions.length !==
      new Set(actualConditions.map(({ property }) => property)).size,
  ].some(Boolean);

  // To do: change error to explicity say which reason
  if (malformed) throw new Error('Malformed Update params');
}
