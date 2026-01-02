/**
 * ESA Configuration Form Schema
 *
 * Zod validation schema for ESA configuration form
 */

import { z } from "zod";
import { EnforcementMode, CapabilityType } from "../../types";

export const esaConfigSchema = z.object({
  agentId: z.string().min(1, "Agent ID is required"),
  authorityId: z.string().min(1, "Authority is required"),
  enforcementMode: z.nativeEnum(EnforcementMode),
  isActive: z.boolean(),
  defaultCapabilities: z.array(
    z.object({
      capability: z.string().min(1, "Capability is required"),
      capability_type: z.nativeEnum(CapabilityType),
      constraints: z.array(z.string()).optional().default([]),
      scope: z.record(z.string(), z.any()).optional(),
    })
  ),
  systemConstraints: z.array(z.string()),
});

export type ESAConfigFormData = z.infer<typeof esaConfigSchema>;
