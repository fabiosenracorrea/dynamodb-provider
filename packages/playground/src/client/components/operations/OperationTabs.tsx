import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface OperationTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface OperationTabsProps {
  tabs: OperationTab[];
  defaultTab?: string;
}

export function OperationTabs({ tabs, defaultTab }: OperationTabsProps) {
  return (
    <Tabs defaultValue={defaultTab || tabs[0]?.id} className="w-full">
      <TabsList className="w-full justify-start">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
