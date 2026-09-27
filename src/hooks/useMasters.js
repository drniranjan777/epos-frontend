import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import { masterServices } from '../services/masterService';

const MASTER_STALE_TIME = 5 * 60_000;

/** @param {'categories'|'brands'|'units'|'gstRates'|'adjustmentCodes'} name */
export function useMasterList(name, params, options = {}) {
  return useQuery({
    queryKey: queryKeys.masters.list(name, params),
    queryFn: () => masterServices[name].list(params),
    staleTime: MASTER_STALE_TIME,
    ...options,
  });
}

/** Active records only, for dropdowns. */
export const useActiveMasterList = (name) => useMasterList(name, { isActive: true });

export function useSaveMaster(name) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) =>
      id ? masterServices[name].update(id, data) : masterServices[name].create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.masters.all }),
  });
}

export function useDeleteMaster(name) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => masterServices[name].remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.masters.all }),
  });
}
