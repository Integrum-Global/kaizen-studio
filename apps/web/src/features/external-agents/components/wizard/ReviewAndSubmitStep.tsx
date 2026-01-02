import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import type { WizardFormData } from "../ExternalAgentRegistrationWizard";

interface ReviewAndSubmitStepProps {
  formData: WizardFormData;
  onEditStep: (step: number) => void;
}

export function ReviewAndSubmitStep({ formData, onEditStep }: ReviewAndSubmitStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review and Submit</h3>
        <p className="text-sm text-muted-foreground">
          Review your configuration before submitting
        </p>
      </div>

      <div className="space-y-4">
        <Section title="Provider" onEdit={() => onEditStep(1)}>
          <Badge variant="outline" className="capitalize">{formData.provider}</Badge>
        </Section>

        <Section title="Basic Information" onEdit={() => onEditStep(2)}>
          <div className="space-y-1 text-sm">
            <p><strong>Name:</strong> {formData.name}</p>
            {formData.description && <p><strong>Description:</strong> {formData.description}</p>}
            {formData.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {formData.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
            )}
          </div>
        </Section>

        <Section title="Authentication" onEdit={() => onEditStep(3)}>
          <p className="text-sm capitalize">{formData.authConfig?.type.replace("_", " ")}</p>
        </Section>

        <Section title="Platform Configuration" onEdit={() => onEditStep(4)}>
          <div className="text-sm space-y-1">
            {formData.platformConfig && Object.entries(formData.platformConfig).map(([key, value]) => (
              <p key={key}><strong className="capitalize">{key.replace("_", " ")}:</strong> {typeof value === "string" && value.includes("secret") ? "••••••••" : value}</p>
            ))}
          </div>
        </Section>

        <Section title="Governance Settings" onEdit={() => onEditStep(5)}>
          <div className="text-sm space-y-1">
            {Object.keys(formData.governanceConfig).length === 0 ? (
              <p className="text-muted-foreground">No governance limits set</p>
            ) : (
              Object.entries(formData.governanceConfig).map(([key, value]) => (
                <p key={key}><strong className="capitalize">{key.replace("_", " ")}:</strong> {value}</p>
              ))
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">{title}</h4>
        <Button variant="ghost" size="sm" onClick={onEdit}><Edit className="h-4 w-4 mr-1" /> Edit</Button>
      </div>
      {children}
    </div>
  );
}
