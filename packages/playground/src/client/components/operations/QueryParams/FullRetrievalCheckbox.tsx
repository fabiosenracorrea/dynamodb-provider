interface FullRetrievalCheckboxProps {
  selected: boolean;
  onChange: (v: boolean) => void;
}

export function FullRetrievalCheckbox({
  onChange,
  selected,
}: FullRetrievalCheckboxProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="fullRetrieval"
        checked={selected}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-input"
      />
      <label htmlFor="fullRetrieval" className="text-sm">
        Full retrieval
      </label>
    </div>
  );
}
