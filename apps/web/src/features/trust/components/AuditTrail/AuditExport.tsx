/**
 * AuditExport Component
 *
 * Export audit trail data to CSV or JSON format
 */

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { AuditAnchor } from "../../types";

interface AuditExportProps {
  events: AuditAnchor[];
  isLoading?: boolean;
  filename?: string;
}

type ExportFormat = "csv" | "json";

export function AuditExport({
  events,
  isLoading = false,
  filename = "audit-trail",
}: AuditExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToCSV = (data: AuditAnchor[]): string => {
    const headers = [
      "ID",
      "Agent ID",
      "Action",
      "Resource",
      "Result",
      "Timestamp",
      "Trust Chain Hash",
      "Parent Anchor ID",
      "Signature",
    ];

    const rows = data.map((event) => [
      event.id,
      event.agent_id,
      event.action,
      event.resource || "",
      event.result,
      event.timestamp,
      event.trust_chain_hash,
      event.parent_anchor_id || "",
      event.signature,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return csvContent;
  };

  const exportToJSON = (data: AuditAnchor[]): string => {
    return JSON.stringify(data, null, 2);
  };

  const downloadFile = (content: string, format: ExportFormat) => {
    const mimeTypes: Record<ExportFormat, string> = {
      csv: "text/csv;charset=utf-8;",
      json: "application/json;charset=utf-8;",
    };

    const blob = new Blob([content], { type: mimeTypes[format] });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];

    link.href = url;
    link.download = `${filename}-${dateStr}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: ExportFormat) => {
    if (events.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no audit events to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      // Simulate a small delay for UX
      await new Promise((resolve) => setTimeout(resolve, 300));

      const content =
        format === "csv" ? exportToCSV(events) : exportToJSON(events);
      downloadFile(content, format);

      toast({
        title: "Export complete",
        description: `Exported ${events.length} audit events to ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export audit data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const isDisabled = isLoading || isExporting || events.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isDisabled}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
          {events.length > 0 && (
            <span className="ml-1 text-muted-foreground">
              ({events.length})
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
