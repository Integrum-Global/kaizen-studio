/**
 * DelegationWizard Validation Schema
 *
 * Zod schemas for trust delegation wizard validation
 */

import { z } from "zod";
import { CapabilityType } from "../../../types";

/**
 * Step 1: Source agent selection
 */
export const sourceAgentSchema = z.object({
  sourceAgentId: z
    .string()
    .min(1, "Source agent is required")
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      "Must be a valid UUID"
    ),
});

/**
 * Step 2: Target agent selection
 */
export const targetAgentSchema = z.object({
  targetAgentId: z
    .string()
    .min(1, "Target agent is required")
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      "Must be a valid UUID"
    ),
});

/**
 * Step 3: Capability selection
 */
export const delegatedCapabilitySchema = z.object({
  capability: z.string().min(1, "Capability URI is required"),
  capability_type: z.nativeEnum(CapabilityType),
  constraints: z.array(z.string()).default([]),
  scope: z.record(z.string(), z.any()).optional(),
});

export const capabilitySelectionSchema = z.object({
  capabilities: z
    .array(delegatedCapabilitySchema)
    .min(1, "At least one capability must be delegated"),
});

/**
 * Step 4: Constraints and limits
 */
export const constraintsSchema = z.object({
  globalConstraints: z.array(z.string()).default([]),
  maxDelegationDepth: z.number().min(0).max(10).default(1),
  allowFurtherDelegation: z.boolean().default(false),
});

/**
 * Step 5: Review and expiration
 */
export const reviewSchema = z.object({
  expiresAt: z.string().nullable().default(null),
  justification: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

/**
 * Complete delegation form schema
 */
export const delegationFormSchema = z.object({
  ...sourceAgentSchema.shape,
  ...targetAgentSchema.shape,
  ...capabilitySelectionSchema.shape,
  ...constraintsSchema.shape,
  ...reviewSchema.shape,
});

export type SourceAgentData = z.infer<typeof sourceAgentSchema>;
export type TargetAgentData = z.infer<typeof targetAgentSchema>;
export type DelegatedCapabilityData = z.infer<typeof delegatedCapabilitySchema>;
export type CapabilitySelectionData = z.infer<typeof capabilitySelectionSchema>;
export type ConstraintsData = z.infer<typeof constraintsSchema>;
export type ReviewData = z.infer<typeof reviewSchema>;
export type DelegationFormData = z.infer<typeof delegationFormSchema>;
