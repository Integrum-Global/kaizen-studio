/**
 * Dialog showing all available keyboard shortcuts
 */

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { useShortcutsStore } from "../store/shortcuts";
import { ShortcutBadge } from "./ShortcutBadge";
import type { ShortcutCategory, Shortcut } from "../types/shortcuts";
import { cn } from "@/lib/utils";

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog displaying all keyboard shortcuts grouped by category
 *
 * @example
 * ```tsx
 * const [showShortcuts, setShowShortcuts] = useState(false);
 *
 * // Triggered by Ctrl+/ or ?
 * <ShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
 * ```
 */
export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<ShortcutCategory>("general");

  // Get shortcuts map from store and convert to array
  const shortcuts = useShortcutsStore((state) => state.shortcuts);
  const allShortcuts = useMemo(
    () => Array.from(shortcuts.values()),
    [shortcuts]
  );

  // Group shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const groups: Record<ShortcutCategory, Shortcut[]> = {
      general: [],
      navigation: [],
      canvas: [],
      editing: [],
    };

    allShortcuts.forEach((shortcut) => {
      if (!groups[shortcut.category]) {
        groups[shortcut.category] = [];
      }
      groups[shortcut.category].push(shortcut);
    });

    // Sort shortcuts within each category by description
    Object.keys(groups).forEach((category) => {
      groups[category as ShortcutCategory].sort((a, b) =>
        a.description.localeCompare(b.description)
      );
    });

    return groups;
  }, [allShortcuts]);

  // Filter shortcuts based on search query
  const filteredShortcuts = useMemo(() => {
    if (!searchQuery) {
      return groupedShortcuts;
    }

    const query = searchQuery.toLowerCase();
    const filtered: Record<ShortcutCategory, Shortcut[]> = {
      general: [],
      navigation: [],
      canvas: [],
      editing: [],
    };

    Object.entries(groupedShortcuts).forEach(([category, shortcuts]) => {
      filtered[category as ShortcutCategory] = shortcuts.filter(
        (shortcut) =>
          shortcut.description.toLowerCase().includes(query) ||
          shortcut.keys.some((key) => key.toLowerCase().includes(query))
      );
    });

    return filtered;
  }, [groupedShortcuts, searchQuery]);

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<ShortcutCategory, number> = {
      general: 0,
      navigation: 0,
      canvas: 0,
      editing: 0,
    };

    Object.entries(filteredShortcuts).forEach(([category, shortcuts]) => {
      counts[category as ShortcutCategory] = shortcuts.length;
    });

    return counts;
  }, [filteredShortcuts]);

  // Category labels
  const categoryLabels: Record<ShortcutCategory, string> = {
    general: "General",
    navigation: "Navigation",
    canvas: "Canvas",
    editing: "Editing",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Boost your productivity with keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs
          value={selectedCategory}
          onValueChange={(value) =>
            setSelectedCategory(value as ShortcutCategory)
          }
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-4">
            {(Object.keys(categoryLabels) as ShortcutCategory[]).map(
              (category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="relative"
                >
                  {categoryLabels[category]}
                  {categoryCounts[category] > 0 && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      ({categoryCounts[category]})
                    </span>
                  )}
                </TabsTrigger>
              )
            )}
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            {(Object.keys(categoryLabels) as ShortcutCategory[]).map(
              (category) => (
                <TabsContent key={category} value={category} className="mt-0">
                  {filteredShortcuts[category].length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery
                        ? "No shortcuts found"
                        : "No shortcuts in this category"}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredShortcuts[category].map((shortcut) => (
                        <ShortcutRow key={shortcut.id} shortcut={shortcut} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              )
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Single row displaying a shortcut
 */
function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-3 px-4 rounded-md",
        "hover:bg-muted/50 transition-colors"
      )}
    >
      <div className="flex-1">
        <p className="text-sm font-medium">{shortcut.description}</p>
        {shortcut.context && shortcut.context !== "global" && (
          <p className="text-xs text-muted-foreground capitalize">
            {shortcut.context} context
          </p>
        )}
      </div>
      <ShortcutBadge keys={shortcut.keys} />
    </div>
  );
}
