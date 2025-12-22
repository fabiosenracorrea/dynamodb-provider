import { MousePointerClick } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      <div className="rounded-full bg-muted p-4 mb-4">
        <MousePointerClick className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold mb-2">No Selection</h2>
      <p className="text-muted-foreground max-w-sm">
        Select an entity, collection, or partition from the sidebar to view and execute operations.
      </p>
    </div>
  )
}
