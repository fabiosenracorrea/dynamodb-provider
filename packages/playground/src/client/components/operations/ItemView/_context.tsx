import { createContext, useContext, type ReactNode } from 'react';

interface ItemViewContextValue {
  item: Record<string, unknown>;
  entityType: string;
  onItemDeleted?: () => void;
  onItemUpdated?: (updatedItem: Record<string, unknown>) => void;
}

const ItemViewContext = createContext<ItemViewContextValue | undefined>(undefined);

export function useItemContext() {
  const context = useContext(ItemViewContext);
  if (!context) {
    throw new Error('useItemViewContext must be used within ItemViewProvider');
  }
  return context;
}

interface ItemViewProviderProps extends ItemViewContextValue {
  children: ReactNode;
}

export function ItemViewProvider({
  item,
  entityType,
  onItemDeleted,
  onItemUpdated,
  children,
}: ItemViewProviderProps) {
  return (
    <ItemViewContext.Provider
      value={{
        item,
        entityType,
        onItemDeleted,
        onItemUpdated,
      }}
    >
      {children}
    </ItemViewContext.Provider>
  );
}
