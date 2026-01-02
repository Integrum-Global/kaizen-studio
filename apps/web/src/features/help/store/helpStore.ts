import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HelpCategory } from "../types";

interface HelpState {
  recentArticles: string[];
  searchQuery: string;
  isOpen: boolean;
  selectedCategory: HelpCategory | "all";
  selectedArticleId: string | null;

  // Actions
  openHelp: (articleId?: string) => void;
  closeHelp: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: HelpCategory | "all") => void;
  setSelectedArticleId: (articleId: string | null) => void;
  addRecentArticle: (articleId: string) => void;
  clearRecentArticles: () => void;
}

export const useHelpStore = create<HelpState>()(
  persist(
    (set, get) => ({
      recentArticles: [],
      searchQuery: "",
      isOpen: false,
      selectedCategory: "all",
      selectedArticleId: null,

      openHelp: (articleId?: string) => {
        set({
          isOpen: true,
          selectedArticleId: articleId || null,
        });
      },

      closeHelp: () => {
        set({
          isOpen: false,
          searchQuery: "",
        });
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      setSelectedCategory: (category: HelpCategory | "all") => {
        set({ selectedCategory: category });
      },

      setSelectedArticleId: (articleId: string | null) => {
        const { addRecentArticle } = get();
        if (articleId) {
          addRecentArticle(articleId);
        }
        set({ selectedArticleId: articleId });
      },

      addRecentArticle: (articleId: string) => {
        const { recentArticles } = get();
        const filtered = recentArticles.filter((id) => id !== articleId);
        const updated = [articleId, ...filtered].slice(0, 5);
        set({ recentArticles: updated });
      },

      clearRecentArticles: () => {
        set({ recentArticles: [] });
      },
    }),
    {
      name: "kaizen-help-storage",
      partialize: (state) => ({
        recentArticles: state.recentArticles,
      }),
    }
  )
);

export default useHelpStore;
