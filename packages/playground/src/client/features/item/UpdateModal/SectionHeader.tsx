import { Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SectionHeaderProps {
  title: string;
  count: number;
  onAdd: () => void;
  addLabel: string;
}

export function SectionHeader({ title, count, onAdd, addLabel }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{title}</span>
        {count > 0 && (
          <Badge variant="secondary" className="text-xs h-5">
            {count}
          </Badge>
        )}
      </div>
      <Button onClick={onAdd} variant="ghost" size="sm" className="h-7 text-xs">
        <Plus className="h-3 w-3 mr-1" />
        {addLabel}
      </Button>
    </div>
  );
}

// Section Components
