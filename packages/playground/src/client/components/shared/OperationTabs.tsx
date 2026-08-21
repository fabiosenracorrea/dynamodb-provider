import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface OperationTab {
  id: string;
  label: string;
  content: React.ReactNode;
  hide?: boolean;
}

interface OperationTabsProps {
  tabs: OperationTab[];
  defaultTab?: string;
  children?: React.ReactNode;
}

export function OperationTabs({ tabs, defaultTab, children }: OperationTabsProps) {
  const visible = tabs.filter((tab) => !tab.hide);

  // A hidden tab as the default would leave the whole panel blank.
  const initial = visible.some((tab) => tab.id === defaultTab) ? defaultTab : visible[0]?.id;

  return (
    <Tabs defaultValue={initial} className="w-full">
      {children}
    </Tabs>
  );
}

export function OperationTabsList({ tabs }: { tabs: OperationTab[] }) {
  return (
    <TabsList className="h-8 justify-start rounded-lg bg-muted/50 p-1">
      {tabs
        .filter((t) => !t.hide)
        .map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="h-6 px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            {tab.label}
          </TabsTrigger>
        ))}
    </TabsList>
  );
}

export function OperationTabsContent({ tabs }: { tabs: OperationTab[] }) {
  return (
    <>
      {/* Filtered like the trigger list — a hidden tab should not mount its content. */}
      {tabs
        .filter((tab) => !tab.hide)
        .map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-0">
            {tab.content}
          </TabsContent>
        ))}
    </>
  );
}
