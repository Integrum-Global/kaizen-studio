import { useMemo } from "react";
import { helpArticles } from "../data/articles";
import type { HelpSearchResult, HelpCategory } from "../types";

interface UseHelpSearchOptions {
  query: string;
  category?: HelpCategory | "all";
}

export function useHelpSearch({ query, category }: UseHelpSearchOptions) {
  const searchResults = useMemo(() => {
    let filtered = helpArticles;

    // Filter by category
    if (category && category !== "all") {
      filtered = filtered.filter((article) => article.category === category);
    }

    // If no search query, return all filtered articles
    if (!query.trim()) {
      return filtered.map((article) => ({
        article,
        score: 1,
      }));
    }

    // Search and score articles
    const queryLower = query.toLowerCase();
    const results: HelpSearchResult[] = [];

    for (const article of filtered) {
      let score = 0;

      // Title match (highest weight)
      if (article.title.toLowerCase().includes(queryLower)) {
        score += 10;
      }

      // Keyword match (medium weight)
      const keywordMatches = article.keywords.filter((keyword) =>
        keyword.toLowerCase().includes(queryLower)
      );
      score += keywordMatches.length * 5;

      // Content match (lower weight)
      if (article.content.toLowerCase().includes(queryLower)) {
        score += 2;
      }

      // Category match (bonus)
      if (article.category.toLowerCase().includes(queryLower)) {
        score += 3;
      }

      // Fuzzy matching for typos (basic)
      const titleWords = article.title.toLowerCase().split(" ");
      const queryWords = queryLower.split(" ");
      for (const qWord of queryWords) {
        for (const tWord of titleWords) {
          if (tWord.startsWith(qWord) || qWord.startsWith(tWord)) {
            score += 1;
          }
        }
      }

      if (score > 0) {
        results.push({ article, score });
      }
    }

    // Sort by score descending
    return results.sort((a, b) => b.score - a.score);
  }, [query, category]);

  return {
    results: searchResults,
    hasResults: searchResults.length > 0,
    isEmpty: searchResults.length === 0 && query.trim().length > 0,
  };
}
