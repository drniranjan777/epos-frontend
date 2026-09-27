import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import { auditService, dashboardService, reportService } from '../services/reportService';
import { settingsService } from '../services/settingsService';
import { roleService, userService } from '../services/userService';

// ---- Users & roles ----
export function useUsers(params) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => userService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useSaveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => (id ? userService.update(id, data) : userService.create(data)),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.roles.all }),
      ]),
  });
}

export function useRoles(options = {}) {
  return useQuery({ queryKey: queryKeys.roles.all, queryFn: roleService.list, ...options });
}

export function usePermissionList() {
  return useQuery({
    queryKey: queryKeys.roles.permissions,
    queryFn: roleService.permissions,
    staleTime: Infinity,
  });
}

export function useSaveRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => (id ? roleService.update(id, data) : roleService.create(data)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.roles.all }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: roleService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.roles.all }),
  });
}

// ---- Settings ----
export function useCompanySettings() {
  return useQuery({
    queryKey: queryKeys.settings.company,
    queryFn: settingsService.get,
    staleTime: 5 * 60_000,
  });
}

export function useStates() {
  return useQuery({
    queryKey: queryKeys.settings.states,
    queryFn: settingsService.states,
    staleTime: Infinity,
  });
}

function useSettingsMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (settings) => queryClient.setQueryData(queryKeys.settings.company, settings),
  });
}

export const useUpdateSettings = () => useSettingsMutation(settingsService.update);
export const useUploadLogo = () => useSettingsMutation(settingsService.uploadLogo);
export const useRemoveLogo = () => useSettingsMutation(settingsService.removeLogo);

// ---- Dashboard, reports, audit ----
export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: dashboardService.summary,
    refetchInterval: 60_000,
  });
}

export function useDashboardMovement(range) {
  return useQuery({
    queryKey: queryKeys.dashboard.movement(range),
    queryFn: () => dashboardService.movement(range),
    placeholderData: keepPreviousData,
  });
}

export function useStockValuation(params) {
  return useQuery({
    queryKey: queryKeys.reports.valuation(params),
    queryFn: () => reportService.stockValuation(params),
    placeholderData: keepPreviousData,
  });
}

export function useMovementReport(params) {
  return useQuery({
    queryKey: queryKeys.reports.movement(params),
    queryFn: () => reportService.movement(params),
    enabled: Boolean(params.from && params.to),
    placeholderData: keepPreviousData,
  });
}

export function useAuditLogs(params) {
  return useQuery({
    queryKey: queryKeys.audit.list(params),
    queryFn: () => auditService.list(params),
    placeholderData: keepPreviousData,
  });
}
