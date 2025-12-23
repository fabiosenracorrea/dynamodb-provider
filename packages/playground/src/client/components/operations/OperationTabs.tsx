import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface OperationTab {
  id: string;
  label: string;
  content: React.ReactNode;
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
    <TabsList className="h-8 p-1 bg-muted/50 rounded-lg">
      {tabs.map((tab) => (
        <TabsTrigger
          key={tab.id}
          value={tab.id}
          className="text-xs px-3 h-6 data-[state=active]:bg-background data-[state=active]:shadow-sm"
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
