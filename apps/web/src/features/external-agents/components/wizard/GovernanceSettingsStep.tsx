import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WizardFormData } from "../ExternalAgentRegistrationWizard";

interface GovernanceSettingsStepProps {
  formData: WizardFormData;
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>;
}

export function GovernanceSettingsStep({ formData, setFormData }: GovernanceSettingsStepProps) {
  const updateGovernance = (key: string, value: number | string) => {
    setFormData((prev) => ({
      ...prev,
      governanceConfig: { ...prev.governanceConfig, [key]: value },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Governance Settings</h3>
        <p className="text-sm text-muted-foreground">
          Set budget limits and rate limits (optional)
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium">Budget Limits</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max-cost-per-invocation">Max Cost Per Invocation</Label>
              <Input id="max-cost-per-invocation" type="number" min="0" step="0.01" value={formData.governanceConfig?.max_cost_per_invocation ?? ""} onChange={(e) => updateGovernance("max_cost_per_invocation", parseFloat(e.target.value))} placeholder="1.00" />
            </div>
            <div>
              <Label htmlFor="max-monthly-cost">Max Monthly Cost</Label>
              <Input id="max-monthly-cost" type="number" min="0" step="0.01" value={formData.governanceConfig?.max_monthly_cost ?? ""} onChange={(e) => updateGovernance("max_monthly_cost", parseFloat(e.target.value))} placeholder="100.00" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Rate Limits</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="requests-per-minute">Per Minute</Label>
              <Input id="requests-per-minute" type="number" min="0" value={formData.governanceConfig?.requests_per_minute ?? ""} onChange={(e) => updateGovernance("requests_per_minute", parseInt(e.target.value))} placeholder="10" />
            </div>
            <div>
              <Label htmlFor="requests-per-hour">Per Hour</Label>
              <Input id="requests-per-hour" type="number" min="0" value={formData.governanceConfig?.requests_per_hour ?? ""} onChange={(e) => updateGovernance("requests_per_hour", parseInt(e.target.value))} placeholder="100" />
            </div>
            <div>
              <Label htmlFor="requests-per-day">Per Day</Label>
              <Input id="requests-per-day" type="number" min="0" value={formData.governanceConfig?.requests_per_day ?? ""} onChange={(e) => updateGovernance("requests_per_day", parseInt(e.target.value))} placeholder="1000" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
