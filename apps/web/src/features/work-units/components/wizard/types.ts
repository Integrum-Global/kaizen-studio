/**
 * Wizard Types
 *
 * Shared types for the WorkUnitCreateWizard components.
 */

import type { WorkUnitType, Capability } from '../../types';

/**
 * Form data for creating a new work unit
 */
export interface CreateWorkUnitFormData {
  // Step 1: Type
  type: WorkUnitType;

  // Step 2: Basic Info
  name: string;
  description: string;

  // Step 3: Capabilities
  capabilities: Capability[];

  // Step 4: Configuration
  workspaceId?: string;
  tags: string[];

  // Step 5: Trust Setup (Level 2+)
  trustSetup: TrustSetupOption;
  delegateeId?: string;
}

/**
 * Trust setup options based on user level
 * - Level 2: Can only request delegation
 * - Level 3: Can establish trust directly or delegate
 */
export type TrustSetupOption =
  | 'establish' // Level 3 only: Establish trust directly
  | 'delegate' // Level 2+: Request delegation from another user
  | 'skip'; // Save as pending trust

/**
 * Wizard step information
 */
export interface WizardStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

/**
 * Props for individual step components
 */
export interface StepProps {
  formData: CreateWorkUnitFormData;
  onChange: (updates: Partial<CreateWorkUnitFormData>) => void;
  errors?: Record<string, string>;
}

/**
 * Default form data for new work unit
 */
export const defaultFormData: CreateWorkUnitFormData = {
  type: 'atomic',
  name: '',
  description: '',
  capabilities: [],
  workspaceId: undefined,
  tags: [],
  trustSetup: 'skip',
  delegateeId: undefined,
};

/**
 * Available capability types
 */
export const CAPABILITY_TYPES = [
  { value: 'access', label: 'Access', description: 'Read or access data/resources' },
  { value: 'action', label: 'Action', description: 'Perform operations or modifications' },
  { value: 'delegation', label: 'Delegation', description: 'Delegate tasks to other units' },
] as const;

/**
 * Common capability presets
 */
export const CAPABILITY_PRESETS = [
  { id: 'extract', name: 'Extract', description: 'Extract data from documents', type: 'access' as const, constraints: [] },
  { id: 'validate', name: 'Validate', description: 'Validate data against rules', type: 'action' as const, constraints: [] },
  { id: 'transform', name: 'Transform', description: 'Transform data formats', type: 'action' as const, constraints: [] },
  { id: 'classify', name: 'Classify', description: 'Classify or categorize data', type: 'action' as const, constraints: [] },
  { id: 'route', name: 'Route', description: 'Route to appropriate destination', type: 'action' as const, constraints: [] },
  { id: 'archive', name: 'Archive', description: 'Archive data for storage', type: 'action' as const, constraints: [] },
  { id: 'notify', name: 'Notify', description: 'Send notifications', type: 'action' as const, constraints: [] },
  { id: 'approve', name: 'Approve', description: 'Approve or reject items', type: 'action' as const, constraints: [] },
];
