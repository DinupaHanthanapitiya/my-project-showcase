import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign, Calendar, Globe, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoiceItem {
  name?: string;
  description?: string;
  qty?: number;
  quantity?: number;
  price?: number;
  rate?: number;
  total?: number;
  amount?: number;
}

interface Invoice {
  id: string;
  invoiceNo?: string;
  invoiceNumber?: string;
  date?: string;
  dueDate?: string;
  total?: number;
  grandTotal?: number;
  amount?: number;
  paidAmount?: number;
  status?: string;
  items?: InvoiceItem[] | Record<string, InvoiceItem>;
  customerName?: string;
  customer?: string;
}

interface InvoiceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  invoices: Invoice[];
}

export default function InvoiceHistoryDialog({ open, onOpenChange, customerName, invoices }: InvoiceHistoryDialogProps) {
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  const totalInvoices = invoices.length;
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
  const totalPending = invoices.reduce((sum, inv) => {
    const amount = Number(inv.total || inv.grandTotal || inv.amount || 0);
    const paid = Number(inv.paidAmount || 0);
    return sum + Math.max(0, amount - paid);
  }, 0);

  const getItemsList = (inv: Invoice): InvoiceItem[] => {
    if (!inv.items) return [];
    if (Array.isArray(inv.items)) return inv.items;
    return Object.values(inv.items);
  };

  const getInvoiceAmount = (inv: Invoice) => Number(inv.total || inv.grandTotal || inv.amount || 0);
  const getInvoicePending = (inv: Invoice) => Math.max(0, getInvoiceAmount(inv) - Number(inv.paidAmount || 0));
  const getStatus = (inv: Invoice) => {
    const pending = getInvoicePending(inv);
    if (pending <= 0) return "paid";
    if (Number(inv.paidAmount || 0) > 0) return "partial";
    return "pending";
  };

  const formatAmount = (n: number) => {
    const formatted = n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `LKR ${formatted}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-background z-10 px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-primary">Invoice History</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">All invoices for <strong>{customerName}</strong></p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <Card className="border">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <FileText className="h-3.5 w-3.5" />
                  TOTAL INVOICES
                </div>
                <p className="text-2xl font-bold">{totalInvoices}</p>
              </CardContent>
            </Card>
            <Card className="border">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  PAID
                </div>
                <p className="text-lg font-bold">{formatAmount(totalPaid)}</p>
              </CardContent>
            </Card>
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 text-xs text-primary mb-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  PENDING
                </div>
                <p className="text-lg font-bold text-primary">{formatAmount(totalPending)}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Invoice List */}
        <div className="px-6 py-4 space-y-3">
          {invoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No invoices found for this customer.</p>
          ) : (
            invoices.map((inv) => {
              const items = getItemsList(inv);
              const status = getStatus(inv);
              const invNo = inv.invoiceNo || inv.invoiceNumber || inv.id;
              const isExpanded = expandedInvoice === inv.id;
              const visibleItems = isExpanded ? items : items.slice(0, 3);
              const hiddenCount = items.length - 3;

              return (
                <Card key={inv.id} className={`border-2 ${status === "pending" ? "border-primary/40" : status === "partial" ? "border-yellow-400/40" : "border-green-400/40"}`}>
                  <CardContent className="p-4">
                    {/* Invoice Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs">{invNo}</Badge>
                        <Badge
                          className={`text-xs ${
                            status === "paid"
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : status === "partial"
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                              : "bg-red-100 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          {status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">AMOUNT</p>
                        <p className={`text-xl font-bold ${status !== "paid" ? "text-primary" : "text-green-600"}`}>
                          {formatAmount(getInvoiceAmount(inv))}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Date: {inv.date || inv.dueDate || "-"}</span>
                      <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> {items.length} items</span>
                    </div>

                    {/* Items */}
                    {items.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">ITEMS</p>
                        <div className="space-y-1">
                          {visibleItems.map((item, idx) => {
                            const itemName = item.name || item.description || "Item";
                            const qty = item.qty || item.quantity || 0;
                            const price = item.price || item.rate || 0;
                            const itemTotal = item.total || item.amount || qty * price;
                            return (
                              <div key={idx} className="flex items-center justify-between py-1.5 px-2 bg-muted/30 rounded text-sm">
                                <span className="font-medium">{itemName}</span>
                                <span className="flex items-center gap-2 text-muted-foreground">
                                  Qty: {qty} &nbsp;@ Rs. {price.toLocaleString()} &nbsp;
                                  <span className="font-semibold text-foreground">Rs. {Number(itemTotal).toLocaleString("en-IN")}</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {items.length > 3 && (
                          <button
                            className="text-xs text-primary mt-2 w-full text-center hover:underline flex items-center justify-center gap-1"
                            onClick={() => setExpandedInvoice(isExpanded ? null : inv.id)}
                          >
                            {isExpanded ? (
                              <>Show less <ChevronUp className="h-3 w-3" /></>
                            ) : (
                              <>+ {hiddenCount} more items <ChevronDown className="h-3 w-3" /></>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
