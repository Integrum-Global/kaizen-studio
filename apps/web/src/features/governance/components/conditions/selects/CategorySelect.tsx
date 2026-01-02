/**
 * Category selector for condition builder
 * Allows selection of WHO (user), WHAT (resource), WHEN (time), WHERE (context)
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Box, Clock, Globe } from "lucide-react";
import type { ConditionCategory } from "../types";
import { categories } from "../data/categories";

interface CategorySelectProps {
  value: ConditionCategory | "";
  onChange: (category: ConditionCategory) => void;
  disabled?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  User,
  Box,
  Clock,
  Globe,
};

export function CategorySelect({ value, onChange, disabled }: CategorySelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as ConditionCategory)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => {
          const Icon = iconMap[category.icon];
          return (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                <div className="flex flex-col">
                  <span>{category.label}</span>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
