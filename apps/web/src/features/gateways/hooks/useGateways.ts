import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gatewaysApi } from "../api";
import type {
  GatewayFilter,
  GatewayEnvironment,
  CreatePromotionRequest,
  CreateScalingPolicyRequest,
  ManualScaleRequest,
} from "../types";

/**
 * Query key factory for gateways
 */
export const gatewayKeys = {
  all: ["gateways"] as const,
  lists: () => [...gatewayKeys.all, "list"] as const,
  list: (filters?: GatewayFilter) => [...gatewayKeys.lists(), filters] as const,
  details: () => [...gatewayKeys.all, "detail"] as const,
  detail: (id: string) => [...gatewayKeys.details(), id] as const,
  health: (id: string) => [...gatewayKeys.all, "health", id] as const,
  promotions: () => [...gatewayKeys.all, "promotions"] as const,
  promotionsFor: (gatewayId?: string) =>
    [...gatewayKeys.promotions(), gatewayId] as const,
  promotionTargets: (env: GatewayEnvironment) =>
    [...gatewayKeys.all, "promotion-targets", env] as const,
  scalingPolicies: () => [...gatewayKeys.all, "scaling-policies"] as const,
  scalingPoliciesFor: (gatewayId?: string) =>
    [...gatewayKeys.scalingPolicies(), gatewayId] as const,
  scalingEvents: () => [...gatewayKeys.all, "scaling-events"] as const,
  scalingEventsFor: (gatewayId?: string) =>
    [...gatewayKeys.scalingEvents(), gatewayId] as const,
};

/**
 * Hook to get all gateways with optional filters
 */
export function useGateways(filters?: GatewayFilter) {
  return useQuery({
    queryKey: gatewayKeys.list(filters),
    queryFn: () => gatewaysApi.getAll(filters),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get a single gateway by ID
 */
export function useGateway(id: string) {
  return useQuery({
    queryKey: gatewayKeys.detail(id),
    queryFn: () => gatewaysApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get gateway health metrics
 */
export function useGatewayHealth(gatewayId: string) {
  return useQuery({
    queryKey: gatewayKeys.health(gatewayId),
    queryFn: () => gatewaysApi.getHealth(gatewayId),
    enabled: !!gatewayId,
    staleTime: 10 * 1000, // Refresh health more frequently
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}

/**
 * Hook to get promotion history
 */
export function usePromotions(gatewayId?: string) {
  return useQuery({
    queryKey: gatewayKeys.promotionsFor(gatewayId),
    queryFn: () => gatewaysApi.getPromotions(gatewayId),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to get available promotion targets
 */
export function usePromotionTargets(sourceEnvironment: GatewayEnvironment) {
  return useQuery({
    queryKey: gatewayKeys.promotionTargets(sourceEnvironment),
    queryFn: () => gatewaysApi.getPromotionTargets(sourceEnvironment),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to create a promotion request
 */
export function useCreatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreatePromotionRequest) =>
      gatewaysApi.createPromotion(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gatewayKeys.promotions() });
    },
  });
}

/**
 * Hook to approve or reject a promotion
 */
export function useUpdatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "approve" | "reject";
    }) => gatewaysApi.updatePromotion(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gatewayKeys.promotions() });
      queryClient.invalidateQueries({ queryKey: gatewayKeys.lists() });
    },
  });
}

/**
 * Hook to get scaling policies
 */
export function useScalingPolicies(gatewayId?: string) {
  return useQuery({
    queryKey: gatewayKeys.scalingPoliciesFor(gatewayId),
    queryFn: () => gatewaysApi.getScalingPolicies(gatewayId),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to create a scaling policy
 */
export function useCreateScalingPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateScalingPolicyRequest) =>
      gatewaysApi.createScalingPolicy(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: gatewayKeys.scalingPoliciesFor(data.gatewayId),
      });
    },
  });
}

/**
 * Hook to update a scaling policy
 */
export function useUpdateScalingPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CreateScalingPolicyRequest> & { enabled?: boolean };
    }) => gatewaysApi.updateScalingPolicy(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: gatewayKeys.scalingPolicies(),
      });
    },
  });
}

/**
 * Hook to delete a scaling policy
 */
export function useDeleteScalingPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => gatewaysApi.deleteScalingPolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: gatewayKeys.scalingPolicies(),
      });
    },
  });
}

/**
 * Hook to get scaling events
 */
export function useScalingEvents(gatewayId?: string) {
  return useQuery({
    queryKey: gatewayKeys.scalingEventsFor(gatewayId),
    queryFn: () => gatewaysApi.getScalingEvents(gatewayId),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to trigger manual scaling
 */
export function useManualScale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ManualScaleRequest) => gatewaysApi.scale(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: gatewayKeys.scalingEventsFor(data.gatewayId),
      });
      queryClient.invalidateQueries({
        queryKey: gatewayKeys.detail(data.gatewayId),
      });
      queryClient.invalidateQueries({ queryKey: gatewayKeys.lists() });
    },
  });
}
