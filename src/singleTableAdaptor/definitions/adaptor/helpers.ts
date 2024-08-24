import { SingleTableKeyReference } from '../../config';

export type AsSingleTableParams<Params, RemoveKeys extends keyof Params> = Omit<
  Params,
  RemoveKeys
> &
  SingleTableKeyReference;
