/**
 * ESAConfigPanel Component
 *
 * Main configuration panel for Enterprise Security Authority
 * Allows configuring ESA agent, enforcement mode, default capabilities, and system constraints
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Save, RotateCcw, Zap, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  useESAConfig,
  useUpdateESAConfig,
  useTestESAConnection,
  useDiscoverAgents,
} from "../../hooks";
import { CapabilityEditor } from "../TrustManagement/CapabilityEditor";
import { ConstraintEditor } from "../TrustManagement/ConstraintEditor";
import { AuthoritySelector } from "../TrustManagement/AuthoritySelector";
import { ESAStatusIndicator } from "./ESAStatusIndicator";
import { esaConfigSchema, type ESAConfigFormData } from "./schema";
import {
  EnforcementMode,
  CapabilityType,
  type ESAConfig,
} from "../../types";
import type { CapabilityFormData } from "../TrustManagement/EstablishTrustForm/schema";

interface ESAConfigPanelProps {
  onSuccess?: () => void;
}

export function ESAConfigPanel({ onSuccess }: ESAConfigPanelProps) {
  const { toast } = useToast();
  const { data: esaConfig, isPending: isLoadingConfig } = useESAConfig();
  const { mutate: updateConfig, isPending: isUpdating } = useUpdateESAConfig();
  const { mutate: testConnection, isPending: isTesting } =
    useTestESAConnection();
  const { data: agents } = useDiscoverAgents({});

  const [hasChanges, setHasChanges] = useState(false);

  const form = useForm<ESAConfigFormData>({
    resolver: zodResolver(esaConfigSchema) as any,
    defaultValues: {
      agentId: "",
      authorityId: "",
      enforcementMode: EnforcementMode.AUDIT_ONLY,
      isActive: false,
      defaultCapabilities: [],
      systemConstraints: [],
    },
  });

  // Populate form with existing config
  useEffect(() => {
    if (esaConfig) {
      // Parse string capabilities into CapabilityFormData
      const capabilities: CapabilityFormData[] = esaConfig.default_capabilities.map(
        (capString) => {
          // Parse capability string format: "type:action:resource"
          const parts = capString.split(":");
          const type = parts[0] as CapabilityType;
          return {
            capability: capString,
            capability_type: type || CapabilityType.ACCESS,
            constraints: [],
          };
        }
      );

      form.reset({
        agentId: esaConfig.agent_id,
        authorityId: esaConfig.authority_id,
        enforcementMode: esaConfig.enforcement_mode,
        isActive: esaConfig.is_active,
        defaultCapabilities: capabilities,
        systemConstraints: esaConfig.system_constraints || [],
      });
      setHasChanges(false);
    }
  }, [esaConfig, form]);

  // Track form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = (data: ESAConfigFormData) => {
    // Convert CapabilityFormData to string array
    const defaultCapabilities: string[] = data.defaultCapabilities.map(
      (cap) => cap.capability
    );

    const updatePayload: Partial<ESAConfig> = {
      agent_id: data.agentId,
      authority_id: data.authorityId,
      enforcement_mode: data.enforcementMode,
      is_active: data.isActive,
      default_capabilities: defaultCapabilities,
      system_constraints: data.systemConstraints,
    };

    updateConfig(updatePayload, {
      onSuccess: () => {
        toast({
          title: "Configuration saved",
          description: "ESA configuration has been updated successfully.",
        });
        setHasChanges(false);
        onSuccess?.();
      },
      onError: (error: any) => {
        toast({
          title: "Failed to save configuration",
          description: error?.message || "An error occurred while saving.",
          variant: "destructive",
        });
      },
    });
  };

  const handleReset = () => {
    if (esaConfig) {
      const capabilities: CapabilityFormData[] = esaConfig.default_capabilities.map(
        (capString) => {
          const parts = capString.split(":");
          const type = parts[0] as CapabilityType;
          return {
            capability: capString,
            capability_type: type || CapabilityType.ACCESS,
            constraints: [],
          };
        }
      );

      form.reset({
        agentId: esaConfig.agent_id,
        authorityId: esaConfig.authority_id,
        enforcementMode: esaConfig.enforcement_mode,
        isActive: esaConfig.is_active,
        defaultCapabilities: capabilities,
        systemConstraints: esaConfig.system_constraints || [],
      });
      setHasChanges(false);
    }
  };

  const handleTestConnection = () => {
    testConnection(undefined, {
      onSuccess: (result) => {
        if (result.success) {
          toast({
            title: "Connection successful",
            description: result.message,
          });
        } else {
          toast({
            title: "Connection failed",
            description: result.message,
            variant: "destructive",
          });
        }
      },
      onError: (error: any) => {
        toast({
          title: "Connection test failed",
          description: error?.message || "An error occurred during testing.",
          variant: "destructive",
        });
      },
    });
  };

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Indicator */}
      {esaConfig && (
        <ESAStatusIndicator
          isActive={esaConfig.is_active}
          enforcementMode={esaConfig.enforcement_mode}
          healthStatus={esaConfig.health_status}
          lastHealthCheck={esaConfig.last_check_at}
        />
      )}

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>ESA Configuration</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTesting || !esaConfig?.agent_id}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* ESA Agent Selection */}
              <FormField
                control={form.control}
                name="agentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ESA Agent</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isUpdating}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ESA agent..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {agents?.map((agent) => (
                          <SelectItem
                            key={agent.agent_id}
                            value={agent.agent_id}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{agent.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {agent.agent_id}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the agent that will act as the Enterprise Security
                      Authority
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Authority Binding */}
              <FormField
                control={form.control}
                name="authorityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authority Binding</FormLabel>
                    <FormControl>
                      <AuthoritySelector
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      The organizational authority that grants trust to the ESA
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Enforcement Mode & Active Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="enforcementMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enforcement Mode</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isUpdating}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={EnforcementMode.AUDIT_ONLY}>
                            <div className="flex flex-col">
                              <span>Audit Only</span>
                              <span className="text-xs text-muted-foreground">
                                Monitor without enforcing
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value={EnforcementMode.ENFORCE}>
                            <div className="flex flex-col">
                              <span>Enforce</span>
                              <span className="text-xs text-muted-foreground">
                                Actively enforce policies
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How ESA handles trust violations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-between">
                      <div>
                        <FormLabel>ESA Status</FormLabel>
                        <FormDescription>
                          Enable or disable ESA operations
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="flex items-center gap-2 mt-2">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isUpdating}
                          />
                          <Badge
                            variant={field.value ? "default" : "secondary"}
                          >
                            {field.value ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Default Capabilities */}
              <FormField
                control={form.control}
                name="defaultCapabilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Capabilities</FormLabel>
                    <FormDescription>
                      Capabilities granted to all agents by default
                    </FormDescription>
                    <FormControl>
                      <CapabilityEditor
                        capabilities={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* System Constraints */}
              <FormField
                control={form.control}
                name="systemConstraints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System-Wide Constraints</FormLabel>
                    <FormDescription>
                      Constraints that apply to all trust operations
                    </FormDescription>
                    <FormControl>
                      <ConstraintEditor
                        constraints={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isUpdating || !hasChanges}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button type="submit" disabled={isUpdating || !hasChanges}>
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Configuration
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
