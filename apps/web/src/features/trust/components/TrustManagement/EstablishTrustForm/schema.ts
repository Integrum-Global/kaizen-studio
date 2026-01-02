/**
 * EstablishTrustForm Validation Schema
 *
 * Zod schemas for trust establishment form validation
 */

import { z } from "zod";
import { CapabilityType } from "../../../types";

/**
 * Capability schema
 */
export const capabilitySchema = z.object({
  capability: z.string().min(1, "Capability URI is required"),
  capability_type: z.nativeEnum(CapabilityType),
  constraints: z.array(z.string()).default([]),
  scope: z.record(z.string(), z.any()).optional(),
});

/**
 * Establish trust form schema
 */
export const establishTrustFormSchema = z.object({
  agentId: z
    .string()
    .min(1, "Agent ID is required")
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      "Agent ID must be a valid UUID"
    ),
  authorityId: z.string().min(1, "Authority is required"),
  capabilities: z
    .array(capabilitySchema)
    .min(1, "At least one capability is required"),
  constraints: z.array(z.string()).default([]),
  expiresAt: z.string().nullable().default(null),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type EstablishTrustFormData = z.infer<typeof establishTrustFormSchema>;
export type CapabilityFormData = z.infer<typeof capabilitySchema>;
