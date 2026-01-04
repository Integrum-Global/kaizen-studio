/**
 * Full template browser modal
 * Shows all templates organized by category with search and preview
 */

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Search,
  Check,
} from "lucide-react";
import { templates, templateCategories } from "./data/templates";
import { translateCondition } from "./data/translations";
import type { ConditionTemplate, PolicyCondition } from "./types";

interface ConditionTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyTemplate: (template: ConditionTemplate) => void;
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

/**
 * Category icon mapping
 */
const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Clock,
  Shield,
  Server,
};

/**
 * Get preview text for a template's conditions
 */
function getTemplatePreview(conditions: Partial<PolicyCondition>[]): string[] {
  return conditions.map((condition) => {
    // Create a full condition for translation
    const fullCondition: PolicyCondition = {
      id: "preview",
      category: condition.category || "user",
      attribute: condition.attribute || "",
      operator: condition.operator || "equals",
      value: condition.value ?? "",
    };
    return translateCondition(fullCondition);
  });
}

export function ConditionTemplatesModal({
  open,
  onOpenChange,
  onApplyTemplate,
}: ConditionTemplatesModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<ConditionTemplate | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Filter by category
    if (activeCategory !== "all") {
      filtered = filtered.filter((t) => t.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, activeCategory]);

  // Handle apply
  const handleApply = () => {
    if (selectedTemplate) {
      onApplyTemplate(selectedTemplate);
      onOpenChange(false);
      setSelectedTemplate(null);
      setSearchQuery("");
    }
  };

  // Handle close
  const handleClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setSelectedTemplate(null);
      setSearchQuery("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Condition Templates</DialogTitle>
          <DialogDescription>
            Choose a template to quickly add common condition patterns
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="all">All</TabsTrigger>
              {templateCategories.map((cat) => {
                const Icon = categoryIconMap[cat.icon] || Shield;
                return (
                  <TabsTrigger key={cat.id} value={cat.id} className="gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {cat.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Template Grid */}
            <TabsContent value={activeCategory} className="mt-4">
              <ScrollArea className="h-[300px] pr-4">
                {filteredTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <Search className="h-8 w-8 mb-2 opacity-50" />
                    <p>No templates found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredTemplates.map((template) => {
                      const Icon = iconMap[template.icon] || Shield;
                      const isSelected = selectedTemplate?.id === template.id;
                      return (
                        <Card
                          key={template.id}
                          className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
                            isSelected
                              ? "border-primary bg-accent"
                              : "border-border"
                          }`}
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-md ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">
                                  {template.name}
                                </span>
                                {template.isCommon && (
                                  <Badge variant="secondary" className="text-xs">
                                    Common
                                  </Badge>
                                )}
                                {isSelected && (
                                  <Check className="h-4 w-4 text-primary ml-auto shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {template.description}
                              </p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Preview Panel */}
          {selectedTemplate && (
            <Card className="p-4 bg-muted/50">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Preview:</span>
                  <Badge variant="outline">{selectedTemplate.name}</Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  {getTemplatePreview(selectedTemplate.conditions).map(
                    (preview, index) => (
                      <p key={index}>
                        <span className="text-muted-foreground/60 mr-2">
                          {index + 1}.
                        </span>
                        {preview}
                      </p>
                    )
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!selectedTemplate}>
            Apply Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
