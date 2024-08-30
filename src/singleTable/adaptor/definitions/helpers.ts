import { SingleTableKeyReference } from './key';

export type AsSingleTableParams<Params, RemoveKeys extends keyof Params> = Omit<
  Params,
  RemoveKeys
> &
  SingleTableKeyReference;
