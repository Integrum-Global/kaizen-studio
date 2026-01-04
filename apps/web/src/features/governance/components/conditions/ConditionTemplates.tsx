/**
 * Quick template bar for common condition patterns
 * Displays common templates as horizontal buttons with "More Templates" option
 */

import { Button } from "@/components/ui/button";
import {
  Users,
  Clock,
  Shield,
  Bot,
  UserCog,
  Mail,
  Lock,
  Server,
  Beaker,
  CheckCircle,
  Calendar,
  CalendarOff,
  Network,
  MoreHorizontal,
} from "lucide-react";
import { getCommonTemplates } from "./data/templates";
import type { ConditionTemplate } from "./types";

interface ConditionTemplatesProps {
  onApplyTemplate: (template: ConditionTemplate) => void;
  onOpenModal: () => void;
  disabled?: boolean;
}

/**
 * Icon mapping for template icons
 */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Clock,
  Shield,
  Bot,
  UserCog,
  Mail,
  Lock,
  Server,
  Beaker,
  CheckCircle,
  Calendar,
  CalendarOff,
  Network,
};

export function ConditionTemplates({
  onApplyTemplate,
  onOpenModal,
  disabled,
}: ConditionTemplatesProps) {
  const commonTemplates = getCommonTemplates();

  return (
    <div className="flex flex-wrap gap-2">
      {commonTemplates.map((template) => {
        const Icon = iconMap[template.icon] || Shield;
        return (
          <Button
            key={template.id}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onApplyTemplate(template)}
            disabled={disabled}
            className="gap-2"
            title={template.description}
          >
            <Icon className="h-4 w-4" />
            {template.name}
          </Button>
        );
      })}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onOpenModal}
        disabled={disabled}
        className="gap-2"
      >
        <MoreHorizontal className="h-4 w-4" />
        More Templates
      </Button>
    </div>
  );
}
