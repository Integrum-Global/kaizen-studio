import { ArrowLeft } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import type { HelpArticle } from "../types";
import type { ReactNode } from "react";

interface HelpArticleViewProps {
  article: HelpArticle;
  onBack: () => void;
}

export function HelpArticleView({ article, onBack }: HelpArticleViewProps) {
  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    const lines = content.split("\n");
    const elements: ReactNode[] = [];
    let codeBlock = false;
    let codeContent: string[] = [];
    let listItems: string[] = [];
    let elementKey = 0;

    const getNextKey = () => `element-${elementKey++}`;

    const flushCodeBlock = () => {
      if (codeContent.length > 0) {
        elements.push(
          <pre
            key={getNextKey()}
            className="my-4 overflow-x-auto rounded-md bg-muted p-4"
          >
            <code className="text-sm">{codeContent.join("\n")}</code>
          </pre>
        );
        codeContent = [];
      }
    };

    const flushListItems = () => {
      if (listItems.length > 0) {
        const listKey = getNextKey();
        elements.push(
          <ul key={listKey} className="my-4 ml-6 list-disc space-y-2">
            {listItems.map((item, idx) => (
              <li key={`${listKey}-item-${idx}`} className="text-sm">
                {item}
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line) => {
      // Code blocks
      if (line.trim().startsWith("```")) {
        if (codeBlock) {
          flushCodeBlock();
        }
        codeBlock = !codeBlock;
        return;
      }

      if (codeBlock) {
        codeContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith("# ")) {
        flushListItems();
        elements.push(
          <h1 key={getNextKey()} className="mb-4 text-2xl font-bold">
            {line.substring(2)}
          </h1>
        );
      } else if (line.startsWith("## ")) {
        flushListItems();
        elements.push(
          <h2 key={getNextKey()} className="mb-3 mt-6 text-xl font-semibold">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        flushListItems();
        elements.push(
          <h3 key={getNextKey()} className="mb-2 mt-4 text-lg font-semibold">
            {line.substring(4)}
          </h3>
        );
      }
      // List items
      else if (line.trim().startsWith("- ")) {
        listItems.push(line.substring(line.indexOf("- ") + 2));
      } else if (line.trim().match(/^\d+\. /)) {
        listItems.push(line.substring(line.indexOf(". ") + 2));
      }
      // Paragraphs
      else if (line.trim()) {
        flushListItems();
        // Handle inline code
        const parts = line.split("`");
        const paragraphKey = getNextKey();
        const content = parts.map((part, i) =>
          i % 2 === 1 ? (
            <code
              key={`${paragraphKey}-code-${i}`}
              className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
            >
              {part}
            </code>
          ) : (
            part
          )
        );

        elements.push(
          <p key={paragraphKey} className="mb-4 text-sm leading-relaxed">
            {content}
          </p>
        );
      } else {
        flushListItems();
      }
    });

    flushCodeBlock();
    flushListItems();

    return elements;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b p-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{article.title}</h2>
          <Badge variant="secondary" className="mt-1 text-xs">
            {article.category.replace("-", " ")}
          </Badge>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {renderContent(article.content)}
        </div>
      </div>
    </div>
  );
}
