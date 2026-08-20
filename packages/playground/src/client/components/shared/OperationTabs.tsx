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
  return (
    <Tabs defaultValue={defaultTab || tabs[0]?.id} className="w-full">
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
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-0">
          {tab.content}
        </TabsContent>
      ))}
    </>
  );
}
