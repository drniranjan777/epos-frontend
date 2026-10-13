import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import { purchaseInvoiceService } from '../services/purchaseInvoiceService';

export function usePurchaseInvoices(params) {
  return useQuery({
    queryKey: queryKeys.purchaseInvoices.list(params),
    queryFn: () => purchaseInvoiceService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function usePurchaseInvoice(id) {
  return useQuery({
    queryKey: queryKeys.purchaseInvoices.detail(id),
    queryFn: () => purchaseInvoiceService.get(id),
    enabled: Boolean(id),
  });
}

export function useRecordPurchasePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paidAmount }) => purchaseInvoiceService.recordPayment(id, paidAmount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.purchaseInvoices.all }),
  });
}
