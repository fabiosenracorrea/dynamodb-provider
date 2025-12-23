import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  className,
  placeholder = 'Search...',
}: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('pl-8 h-9', className)}
      />
    </div>
  );
}
