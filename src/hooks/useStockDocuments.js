import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import { branchService, movementService, transferService } from '../services/stockDocumentService';
import { invalidateStock } from './useInventory';

// ---- Stock entries (multi-item IN / OUT) ----
export function useMovements(params) {
  return useQuery({
    queryKey: queryKeys.movements.list(params),
    queryFn: () => movementService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useMovement(id) {
  return useQuery({
    queryKey: queryKeys.movements.detail(id),
    queryFn: () => movementService.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: movementService.create,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.movements.all }),
        invalidateStock(queryClient),
      ]),
  });
}

// ---- Transfers ----
export function useTransfers(params) {
  return useQuery({
    queryKey: queryKeys.transfers.list(params),
    queryFn: () => transferService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useTransfer(id) {
  return useQuery({
    queryKey: queryKeys.transfers.detail(id),
    queryFn: () => transferService.get(id),
    enabled: Boolean(id),
  });
}

/** Every transfer action can move stock, so stock caches are refreshed too. */
function useTransferMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.transfers.all }),
        invalidateStock(queryClient),
      ]),
  });
}

export const useRequestTransfer = () => useTransferMutation(transferService.request);
export const useApproveTransfer = () => useTransferMutation(transferService.approve);
export const useReceiveTransfer = () => useTransferMutation(transferService.receive);
export const useRejectTransfer = () =>
  useTransferMutation(({ id, reason }) => transferService.reject(id, reason));
export const useCancelTransfer = () =>
  useTransferMutation(({ id, reason }) => transferService.cancel(id, reason));

// ---- Branches ----
export function useBranchList(params, options = {}) {
  return useQuery({
    queryKey: queryKeys.branches.list(params),
    queryFn: () => branchService.list(params),
    staleTime: 5 * 60_000,
    ...options,
  });
}

export function useSaveBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) =>
      id ? branchService.update(id, data) : branchService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.branches.all }),
  });
}
