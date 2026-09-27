import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import { customerService } from '../services/customerService';

export function useCustomers(params, options = {}) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => customerService.list(params),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useCustomer(id) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => customerService.get(id),
    enabled: Boolean(id),
  });
}

export function useSaveCustomer(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => (id ? customerService.update(id, data) : customerService.create(data)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customerService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
  });
}
