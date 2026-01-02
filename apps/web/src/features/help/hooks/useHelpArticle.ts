import { useMemo } from "react";
import { helpArticles } from "../data/articles";

export function useHelpArticle(articleId: string | null) {
  const article = useMemo(() => {
    if (!articleId) return null;
    return helpArticles.find((a) => a.id === articleId) || null;
  }, [articleId]);

  return {
    article,
    isLoading: false,
    error: null,
  };
}
