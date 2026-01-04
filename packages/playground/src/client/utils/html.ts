import { FormEvent } from 'react';

export function openOnNewTab(href: string, target = '_blank') {
  const link = document.createElement('a');

  link.setAttribute('href', href);
  link.setAttribute('target', target);

  link.click();
}

type OnSubmitHandler = (e: FormEvent) => void;

/**
 * Automatically stop the default form behavior
 * to refresh the page on submit
 */
export function wrapFormAction(action: OnSubmitHandler): OnSubmitHandler {
  return (e) => {
    e.preventDefault();
    action(e);
  };
}
