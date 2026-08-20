import { Toaster as Sonner } from 'sonner';

import { useTheme } from './theme';

export function Toaster() {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'bg-popover text-popover-foreground border rounded-md text-sm',
          description: 'text-muted-foreground',
          error: 'text-destructive',
        },
      }}
    />
  );
}
