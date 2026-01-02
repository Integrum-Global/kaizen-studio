import { ChevronRight, FileText } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import type { HelpSearchResult } from "../types";

interface HelpArticleListProps {
  results: HelpSearchResult[];
  selectedArticleId: string | null;
  onArticleSelect: (articleId: string) => void;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export function HelpArticleList({
  results,
  selectedArticleId,
  onArticleSelect,
  isEmpty = false,
  emptyMessage = "No articles found",
}: HelpArticleListProps) {
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.map(({ article }) => (
        <Card
          key={article.id}
          className={`cursor-pointer transition-colors hover:bg-accent ${
            selectedArticleId === article.id ? "bg-accent" : ""
          }`}
          onClick={() => onArticleSelect(article.id)}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{article.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {article.category.replace("-", " ")}
                </Badge>
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {article.content.substring(0, 150)}...
              </p>
            </div>
            <ChevronRight className="ml-4 h-5 w-5 flex-shrink-0 text-muted-foreground" />
          </div>
        </Card>
      ))}
    </div>
  );
}
