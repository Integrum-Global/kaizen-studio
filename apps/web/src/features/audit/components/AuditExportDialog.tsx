import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { format as formatDate } from "date-fns";
import { useExportAuditLogs } from "../hooks";
import { useToast } from "@/hooks/use-toast";
import type { ExportFormat } from "../types";

interface AuditExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditExportDialog({
  open,
  onOpenChange,
}: AuditExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const exportLogs = useExportAuditLogs();
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      await exportLogs.mutateAsync({
        format: exportFormat,
        filters: {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        },
      });
      toast({
        title: "Success",
        description: "Audit logs exported successfully",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export audit logs",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Audit Logs</DialogTitle>
          <DialogDescription>
            Choose export format and date range for audit logs
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Format</label>
            <Select
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as ExportFormat)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range (Optional)</label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate
                      ? formatDate(startDate, "MMM dd, yyyy")
                      : "Start Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? formatDate(endDate, "MMM dd, yyyy") : "End Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exportLogs.isPending}>
            <Download className="mr-2 h-4 w-4" />
            {exportLogs.isPending ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
