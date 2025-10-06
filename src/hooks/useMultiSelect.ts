import { useState, useCallback } from 'react';

export function useMultiSelect<T extends { id: number }>() {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const toggleItem = useCallback((id: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      // Se desmarcou um item, desmarcar "Selecionar Todos"
      if (newSet.has(id) === false) {
        setSelectAll(false);
      }
      return newSet;
    });
  }, []);

  const toggleAll = useCallback((items: T[]) => {
    if (selectAll) {
      // Desmarcar todos
      setSelectedItems(new Set());
      setSelectAll(false);
    } else {
      // Selecionar todos
      setSelectedItems(new Set(items.map(item => item.id)));
      setSelectAll(true);
    }
  }, [selectAll]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
    setSelectAll(false);
  }, []);

  const isSelected = useCallback((id: number) => {
    return selectedItems.has(id);
  }, [selectedItems]);

  return {
    selectedItems,
    selectAll,
    toggleItem,
    toggleAll,
    clearSelection,
    isSelected,
    selectedCount: selectedItems.size
  };
}