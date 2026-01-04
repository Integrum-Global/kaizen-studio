/**
 * Value Chains Feature
 *
 * Enterprise value chains spanning multiple departments.
 * Level 3 (Value Chain Owner) experience.
 */

// Components
export {
  ValueChainCard,
  DepartmentFlowVisualization,
  EnterpriseOverview,
} from './components';

// Hooks
export {
  useValueChains,
  useValueChain,
  useEnterpriseMetrics,
  useCreateValueChain,
  useUpdateValueChain,
  useDeleteValueChain,
  valueChainKeys,
} from './hooks';

// API
export {
  fetchValueChains,
  fetchValueChain,
  fetchEnterpriseMetrics,
  createValueChain,
  updateValueChain,
  deleteValueChain,
} from './api';

// Types
export type {
  ValueChain,
  Department,
  TrustStatus,
  TrustHealth,
  ValueChainMetrics,
  EnterpriseMetrics,
  ValueChainCardProps,
  DepartmentFlowVisualizationProps,
  EnterpriseOverviewProps,
  ValueChainsFilter,
  ValueChainsResponse,
  EnterpriseMetricsResponse,
} from './types';
