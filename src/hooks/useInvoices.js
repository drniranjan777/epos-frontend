import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import { invoiceService } from '../services/invoiceService';
import { invalidateStock } from './useInventory';

export function useInvoices(params) {
  return useQuery({
    queryKey: queryKeys.invoices.list(params),
    queryFn: () => invoiceService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useInvoice(id) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: () => invoiceService.get(id),
    enabled: Boolean(id),
  });
}

/** Invoices affect stock (finalize/cancel), so stock-related caches are refreshed too. */
function useInvoiceMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all }),
        invalidateStock(queryClient),
      ]),
  });
}

export const useSaveInvoice = (id) =>
  useInvoiceMutation((data) =>
    id ? invoiceService.update(id, data) : invoiceService.create(data),
  );
export const useFinalizeInvoice = () => useInvoiceMutation(invoiceService.finalize);
export const useCancelInvoice = () =>
  useInvoiceMutation(({ id, reason }) => invoiceService.cancel(id, reason));
export const useDeleteInvoice = () => useInvoiceMutation(invoiceService.remove);
