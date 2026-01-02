export interface HelpArticle {
  id: string;
  title: string;
  category: HelpCategory;
  content: string;
  keywords: string[];
}

export type HelpCategory =
  | "getting-started"
  | "agents"
  | "pipelines"
  | "deployments"
  | "admin"
  | "troubleshooting";

export interface HelpSearchResult {
  article: HelpArticle;
  score: number;
}

export interface HelpState {
  recentArticles: string[];
  searchQuery: string;
  isOpen: boolean;
  selectedCategory: HelpCategory | "all";
  selectedArticleId: string | null;
}
