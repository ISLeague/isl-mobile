import { useState, useMemo } from 'react';

/**
 * Hook para implementar búsqueda/filtrado en listas
 */
export const useSearch = <T,>(
  data: T[],
  searchField: keyof T
) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    return data.filter(item => {
      const value = item[searchField];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return String(value).toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [data, searchQuery, searchField]);

  const clearSearch = () => setSearchQuery('');

  return { 
    searchQuery, 
    setSearchQuery, 
    filteredData,
    clearSearch,
    hasResults: filteredData.length > 0
  };
};
