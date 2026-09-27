import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import { inventoryService } from '../services/inventoryService';
import { productService } from '../services/productService';

/** Everything whose numbers change when stock moves. */
export function invalidateStock(queryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.all }),
  ]);
}

export function useProductSearch(q) {
  return useQuery({
    queryKey: queryKeys.products.search(q),
    queryFn: () => productService.search(q),
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}

export function useLedger(params, options = {}) {
  return useQuery({
    queryKey: queryKeys.inventory.ledger(params),
    queryFn: () => inventoryService.ledger(params),
    placeholderData: keepPreviousData,
    ...options,
  });
}

function useStockMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => invalidateStock(queryClient),
  });
}

export const useStockIn = () => useStockMutation(inventoryService.stockIn);
export const useStockOut = () => useStockMutation(inventoryService.stockOut);
export const useStockAdjustment = () => useStockMutation(inventoryService.adjust);
