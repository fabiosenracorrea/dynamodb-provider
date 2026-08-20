import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PropertySelectProps {
  properties: string[];
  usedProperties: Set<string>;
  value: string;
  isCustom: boolean;
  onValueChange: (value: string, isCustom: boolean) => void;
  placeholder?: string;
  currentProperty?: string;
}

export function PropertySelect({
  properties,
  usedProperties,
  value,
  isCustom,
  onValueChange,
  placeholder = 'Select property',
  currentProperty,
}: PropertySelectProps) {
  const availableProperties = properties.filter(
    (p) => p === currentProperty || !usedProperties.has(p),
  );

  if (isCustom) {
    return (
      <div className="flex gap-1">
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value, true)}
          placeholder="Custom property"
          className="h-9 flex-1 font-mono"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 px-2 text-xs"
          onClick={() => onValueChange('', false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v === '__custom__') {
          onValueChange('', true);
        } else {
          onValueChange(v, false);
        }
      }}
    >
      <SelectTrigger className="h-9 font-mono">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {availableProperties.map((prop) => (
          <SelectItem key={prop} value={prop} className="font-mono">
            {prop}
          </SelectItem>
        ))}
        {availableProperties.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">No available properties</div>
        )}
        <SelectItem value="__custom__" className="italic text-muted-foreground">
          Custom...
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

// Section Header Component
