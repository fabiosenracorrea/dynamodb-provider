import type { ReactNode } from 'react';

import { cn } from '@/utils/utils';

interface FieldProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
}

/**
 * Caption + control, wrapped so the two are actually associated — clicking the
 * caption focuses the input. Only for labelable controls; use `FieldCaption` when
 * the control is a button or a Radix trigger, which carry their own accessible name.
 */
export function Field({ label, children, className, labelClassName }: FieldProps) {
  return (
    <label className={cn('block', className)}>
      <span className={cn('mb-1.5 block text-sm font-medium', labelClassName)}>{label}</span>
      {children}
    </label>
  );
}

interface FieldCaptionProps {
  children: ReactNode;
  className?: string;
}

export function FieldCaption({ children, className }: FieldCaptionProps) {
  return <span className={cn('mb-1.5 block text-sm font-medium', className)}>{children}</span>;
}
