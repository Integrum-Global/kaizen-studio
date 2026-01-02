import { useHelpStore } from "../store/helpStore";

export function useHelp() {
  const {
    isOpen,
    searchQuery,
    selectedCategory,
    selectedArticleId,
    recentArticles,
    openHelp,
    closeHelp,
    setSearchQuery,
    setSelectedCategory,
    setSelectedArticleId,
    clearRecentArticles,
  } = useHelpStore();

  return {
    isOpen,
    searchQuery,
    selectedCategory,
    selectedArticleId,
    recentArticles,
    openHelp,
    closeHelp,
    setSearchQuery,
    setSelectedCategory,
    setSelectedArticleId,
    clearRecentArticles,
  };
}
