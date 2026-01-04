import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border border-slate-200 bg-white p-4 text-slate-950 [&>svg]:text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:[&>svg]:text-slate-50',
  {
    variants: {
      variant: {
        default: '',
        destructive:
          'border-red-500/50 text-red-500 dark:border-red-500 [&>svg]:text-red-500 dark:text-red-500 dark:[&>svg]:text-red-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  );
}

function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
