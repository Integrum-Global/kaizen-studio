import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { useHelp, useHelpSearch, useHelpArticle } from "../hooks";
import { useHelpStore } from "../store/helpStore";
import { HelpSearchInput } from "./HelpSearchInput";
import { HelpCategoryNav } from "./HelpCategoryNav";
import { HelpArticleList } from "./HelpArticleList";
import { HelpArticleView } from "./HelpArticleView";

export function HelpDialog() {
  const {
    isOpen,
    searchQuery,
    selectedCategory,
    selectedArticleId,
    closeHelp,
    setSearchQuery,
    setSelectedCategory,
    setSelectedArticleId,
  } = useHelp();

  const { results, isEmpty } = useHelpSearch({
    query: searchQuery,
    category: selectedCategory,
  });

  const { article } = useHelpArticle(selectedArticleId);

  // Handle F1 keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        if (!isOpen) {
          useHelpStore.getState().openHelp();
        } else {
          closeHelp();
        }
      }

      // Escape to close or go back
      if (e.key === "Escape" && isOpen && selectedArticleId) {
        e.preventDefault();
        setSelectedArticleId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedArticleId, closeHelp, setSelectedArticleId]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeHelp();
      setSelectedArticleId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl p-0">
        {!article ? (
          <>
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>Help Center</DialogTitle>
              <DialogDescription>
                Search our documentation or browse by category
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 px-6">
              <HelpSearchInput value={searchQuery} onChange={setSearchQuery} />
              <HelpCategoryNav
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </div>
            <div className="max-h-[calc(85vh-240px)] overflow-y-auto p-6 pt-4">
              <HelpArticleList
                results={results}
                selectedArticleId={selectedArticleId}
                onArticleSelect={setSelectedArticleId}
                isEmpty={isEmpty}
                emptyMessage={
                  searchQuery
                    ? "No articles found matching your search"
                    : "No articles available"
                }
              />
            </div>
          </>
        ) : (
          <HelpArticleView
            article={article}
            onBack={() => setSelectedArticleId(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
