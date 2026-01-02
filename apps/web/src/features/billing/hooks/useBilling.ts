import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billingApi } from "../api";
import type { UpgradeRequest } from "../types";

/**
 * Query key factory for billing
 */
export const billingKeys = {
  all: ["billing"] as const,
  plans: () => [...billingKeys.all, "plans"] as const,
  summary: () => [...billingKeys.all, "summary"] as const,
  usage: () => [...billingKeys.all, "usage"] as const,
  quotas: () => [...billingKeys.all, "quotas"] as const,
  invoices: () => [...billingKeys.all, "invoices"] as const,
  invoice: (id: string) => [...billingKeys.invoices(), id] as const,
  paymentMethods: () => [...billingKeys.all, "payment-methods"] as const,
};

/**
 * Hook to get all available plans
 */
export function usePlans() {
  return useQuery({
    queryKey: billingKeys.plans(),
    queryFn: () => billingApi.getPlans(),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}

/**
 * Hook to get billing summary
 */
export function useBillingSummary() {
  return useQuery({
    queryKey: billingKeys.summary(),
    queryFn: () => billingApi.getSummary(),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to get current usage
 */
export function useUsage() {
  return useQuery({
    queryKey: billingKeys.usage(),
    queryFn: () => billingApi.getUsage(),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get quotas
 */
export function useQuotas() {
  return useQuery({
    queryKey: billingKeys.quotas(),
    queryFn: () => billingApi.getQuotas(),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get invoices
 */
export function useInvoices() {
  return useQuery({
    queryKey: billingKeys.invoices(),
    queryFn: () => billingApi.getInvoices(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get single invoice
 */
export function useInvoice(id: string) {
  return useQuery({
    queryKey: billingKeys.invoice(id),
    queryFn: () => billingApi.getInvoice(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to upgrade subscription
 */
export function useUpgrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpgradeRequest) => billingApi.upgrade(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.summary() });
      queryClient.invalidateQueries({ queryKey: billingKeys.plans() });
      queryClient.invalidateQueries({ queryKey: billingKeys.quotas() });
    },
  });
}

/**
 * Hook to cancel subscription
 */
export function useCancel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => billingApi.cancel(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.summary() });
    },
  });
}

/**
 * Hook to get payment methods
 */
export function usePaymentMethods() {
  return useQuery({
    queryKey: billingKeys.paymentMethods(),
    queryFn: () => billingApi.getPaymentMethods(),
    staleTime: 5 * 60 * 1000,
  });
}
