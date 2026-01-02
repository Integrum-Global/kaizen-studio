import { Tabs, TabsList, TabsTrigger } from "@/components/ui";
import type { HelpCategory } from "../types";

interface HelpCategoryNavProps {
  selectedCategory: HelpCategory | "all";
  onCategoryChange: (category: HelpCategory | "all") => void;
}

const categories: { value: HelpCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "getting-started", label: "Getting Started" },
  { value: "agents", label: "Agents" },
  { value: "pipelines", label: "Pipelines" },
  { value: "deployments", label: "Deployments" },
  { value: "admin", label: "Admin" },
  { value: "troubleshooting", label: "Troubleshooting" },
];

export function HelpCategoryNav({
  selectedCategory,
  onCategoryChange,
}: HelpCategoryNavProps) {
  return (
    <Tabs
      value={selectedCategory}
      onValueChange={(value) => onCategoryChange(value as HelpCategory | "all")}
    >
      <TabsList className="grid w-full grid-cols-7">
        {categories.map((category) => (
          <TabsTrigger key={category.value} value={category.value}>
            {category.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
