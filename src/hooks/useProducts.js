import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import { productService } from '../services/productService';
import { invalidateStock } from './useInventory';

export function useProducts(params) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productService.get(id),
    enabled: Boolean(id),
  });
}

export function useSaveProduct(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => (id ? productService.update(id, data) : productService.create(data)),
    onSuccess: () => invalidateStock(queryClient),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productService.remove,
    onSuccess: () => invalidateStock(queryClient),
  });
}
