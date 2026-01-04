import 'react';

declare module 'react' {
  export type AnyChangeEvent = ChangeEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >;

  export type StateSetter<State> = Dispatch<SetStateAction<State>>;
}
