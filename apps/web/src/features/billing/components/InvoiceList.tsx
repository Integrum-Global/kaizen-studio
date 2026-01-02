import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, Receipt } from "lucide-react";
import { useInvoices } from "../hooks";
import type { Invoice, InvoiceStatus } from "../types";

interface InvoiceListProps {
  maxItems?: number;
  onViewInvoice?: (invoice: Invoice) => void;
}

const statusColors: Record<
  InvoiceStatus,
  "default" | "destructive" | "secondary" | "outline"
> = {
  draft: "outline",
  pending: "secondary",
  paid: "default",
  failed: "destructive",
  cancelled: "outline",
};

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPeriod(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startMonth = startDate.toLocaleDateString("en-US", { month: "short" });
  const endMonth = endDate.toLocaleDateString("en-US", { month: "short" });
  const year = endDate.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${year}`;
  }
  return `${startMonth} - ${endMonth} ${year}`;
}

export function InvoiceList({ maxItems, onViewInvoice }: InvoiceListProps) {
  const { data, isLoading } = useInvoices();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  let invoices = data?.records || [];
  if (maxItems) {
    invoices = invoices.slice(0, maxItems);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Invoices
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No invoices yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-background rounded">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{invoice.number}</span>
                      <Badge variant={statusColors[invoice.status]}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatPeriod(invoice.periodStart, invoice.periodEnd)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </p>
                    {invoice.paidAt && (
                      <p className="text-xs text-muted-foreground">
                        Paid {formatDate(invoice.paidAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewInvoice?.(invoice)}
                    >
                      View
                    </Button>
                    {invoice.downloadUrl && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={invoice.downloadUrl} download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
