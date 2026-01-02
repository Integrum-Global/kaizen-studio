import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Info,
  AlertTriangle,
  XCircle,
  Bug,
  X,
} from "lucide-react";
import type { ExecutionLog, LogLevel } from "../types";
import { cn } from "@/lib/utils";

interface LogViewerProps {
  logs: ExecutionLog[];
  onLogClick?: (log: ExecutionLog) => void;
  className?: string;
}

const LOG_LEVEL_CONFIG = {
  info: {
    icon: Info,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    borderColor: "border-blue-200 dark:border-blue-800",
    badge: "default" as const,
  },
  warn: {
    icon: AlertTriangle,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    badge: "secondary" as const,
  },
  error: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950",
    borderColor: "border-red-200 dark:border-red-800",
    badge: "destructive" as const,
  },
  debug: {
    icon: Bug,
    color: "text-gray-500",
    bgColor: "bg-gray-50 dark:bg-gray-950",
    borderColor: "border-gray-200 dark:border-gray-800",
    badge: "outline" as const,
  },
};

export function LogViewer({ logs, onLogClick, className }: LogViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<Set<LogLevel>>(new Set());
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    if (!logsContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  const toggleLevelFilter = (level: LogLevel) => {
    setLevelFilter((prev) => {
      const newFilter = new Set(prev);
      if (newFilter.has(level)) {
        newFilter.delete(level);
      } else {
        newFilter.add(level);
      }
      return newFilter;
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setLevelFilter(new Set());
  };

  const filteredLogs = logs.filter((log) => {
    if (levelFilter.size > 0 && !levelFilter.has(log.level)) {
      return false;
    }
    if (
      searchQuery &&
      !log.message.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  };

  const hasActiveFilters = searchQuery || levelFilter.size > 0;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {(["info", "warn", "error", "debug"] as LogLevel[]).map((level) => (
            <Button
              key={level}
              type="button"
              variant={levelFilter.has(level) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleLevelFilter(level)}
              className="capitalize"
            >
              {level}
            </Button>
          ))}
        </div>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      <div
        ref={logsContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-1 border rounded-md p-2 bg-muted/30"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {logs.length === 0 ? "No logs yet" : "No logs match your filters"}
          </div>
        ) : (
          filteredLogs.map((log) => {
            const config = LOG_LEVEL_CONFIG[log.level];
            const Icon = config.icon;

            return (
              <div
                key={log.id}
                onClick={() => onLogClick?.(log)}
                className={cn(
                  "flex items-start gap-2 p-2 rounded-md border text-xs transition-colors",
                  config.bgColor,
                  config.borderColor,
                  onLogClick && "cursor-pointer hover:shadow-sm"
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 mt-0.5 flex-shrink-0",
                    config.color
                  )}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-muted-foreground">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <Badge
                      variant={config.badge}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {log.level.toUpperCase()}
                    </Badge>
                    {log.nodeId && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {log.nodeId}
                      </Badge>
                    )}
                  </div>
                  <div className="break-words">{log.message}</div>
                  {log.data && (
                    <pre className="mt-1 text-[10px] text-muted-foreground font-mono overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={logsEndRef} />
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <div>
          {filteredLogs.length} of {logs.length} log
          {logs.length !== 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-1">
          Auto-scroll:
          <Button
            type="button"
            variant={autoScroll ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoScroll(!autoScroll)}
            className="h-6 px-2 text-xs"
          >
            {autoScroll ? "ON" : "OFF"}
          </Button>
        </div>
      </div>
    </div>
  );
}
