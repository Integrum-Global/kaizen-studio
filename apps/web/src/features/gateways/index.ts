// Types
export type {
  GatewayEnvironment,
  GatewayStatus,
  PromotionStatus,
  ScalingMode,
  Gateway,
  GatewayHealth as GatewayHealthType,
  PromotionRequest,
  ScalingPolicy,
  ScalingEvent,
  GatewayFilter,
  GatewayResponse,
  PromotionHistoryResponse,
  ScalingEventResponse,
  CreatePromotionRequest,
  CreateScalingPolicyRequest,
  ManualScaleRequest,
} from "./types";

// API
export { gatewaysApi } from "./api";

// Hooks
export {
  gatewayKeys,
  useGateways,
  useGateway,
  useGatewayHealth,
  usePromotions,
  usePromotionTargets,
  useCreatePromotion,
  useUpdatePromotion,
  useScalingPolicies,
  useCreateScalingPolicy,
  useUpdateScalingPolicy,
  useDeleteScalingPolicy,
  useScalingEvents,
  useManualScale,
} from "./hooks";

// Components
export { GatewayCard } from "./components/GatewayCard";
export { GatewayList } from "./components/GatewayList";
export { GatewayHealth } from "./components/GatewayHealth";
export { GatewayDashboard } from "./components/GatewayDashboard";
export { PromotionDialog } from "./components/PromotionDialog";
export { PromotionHistory } from "./components/PromotionHistory";
export { ScalingPolicyEditor } from "./components/ScalingPolicyEditor";
export { ScalingPolicyList } from "./components/ScalingPolicyList";
export { ScalingEventTimeline } from "./components/ScalingEventTimeline";
export { ManualScaleControls } from "./components/ManualScaleControls";
