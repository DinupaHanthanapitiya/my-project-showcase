import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db, ref, onValue } from "@/lib/firebase";
import { TrendingUp, DollarSign, BarChart3, Eye, FileText, Package, X } from "lucide-react";
import Layout from "@/components/Layout";

interface InvoiceData {
  id: string;
  invoiceNumber?: string;
  invoiceNo?: string;
  customerName?: string;
  date?: string;
  total?: number;
  grandTotal?: number;
  amount?: number;
  paidAmount?: number;
  status?: string;
}

interface InventoryItem {
  id: string;
  styleNo?: string;
  itemName?: string;
  description?: string;
  unitPrice: number;
  stock: number;
}

export default function Reports() {
  const [totalSales, setTotalSales] = useState(0);
  const [outstandingAmount, setOutstandingAmount] = useState(0);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [activeCustomers, setActiveCustomers] = useState(0);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [ordersCount, setOrdersCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [viewReport, setViewReport] = useState<string | null>(null);

  useEffect(() => {
    const invoicesRef = ref(db, "invoices");
    onValue(invoicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let sales = 0;
        let outstanding = 0;
        const list: InvoiceData[] = [];
        Object.entries(data).forEach(([id, inv]: [string, any]) => {
          const total = Number(inv.total || inv.grandTotal || inv.amount || 0);
          const paid = Number(inv.paidAmount || 0);
          sales += total;
          if (inv.status !== "Paid") outstanding += Math.max(0, total - paid);
          list.push({ id, ...inv, total });
        });
        setTotalSales(sales);
        setOutstandingAmount(outstanding);
        setInvoices(list);
      }
    });

    const inventoryRef = ref(db, "inventory");
    onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let value = 0;
        let lowStock = 0;
        const list: InventoryItem[] = [];
        Object.entries(data).forEach(([id, item]: [string, any]) => {
          const price = Number(item.unitPrice || 0);
          const stock = Number(item.stock || 0);
          value += price * stock;
          if (stock <= 5) lowStock++;
          list.push({ id, styleNo: item.styleNo, itemName: item.itemName, description: item.description, unitPrice: price, stock });
        });
        setInventoryValue(value);
        setLowStockCount(lowStock);
        setInventory(list);
      }
    });

    const customersRef = ref(db, "customers");
    onValue(customersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setActiveCustomers(Object.values(data).filter((c: any) => c.isActive !== false).length);
      }
    });

    const ordersRef = ref(db, "salesOrders");
    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      setOrdersCount(data ? Object.keys(data).length : 0);
    });
  }, []);

  const fmt = (n: number) => `LKR ${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const paidInvoices = invoices.filter((i) => i.status === "Paid");
  const unpaidInvoices = invoices.filter((i) => i.status !== "Paid");
  const lowStockItems = inventory.filter((i) => i.stock <= 5);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Reports & Analytics</h1>
            <p className="text-muted-foreground">Business insights and financial reports</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-primary"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-primary">Total Sales</p><p className="text-2xl font-bold">{fmt(totalSales)}</p><p className="text-xs text-muted-foreground">{invoices.length} invoices</p></div><TrendingUp className="h-5 w-5 text-primary" /></div></CardContent></Card>
          <Card className="border-primary"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-primary">Outstanding</p><p className="text-2xl font-bold">{fmt(outstandingAmount)}</p><p className="text-xs text-muted-foreground">{unpaidInvoices.length} unpaid invoices</p></div><DollarSign className="h-5 w-5 text-primary" /></div></CardContent></Card>
          <Card className="border-primary"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-primary">Inventory Value</p><p className="text-2xl font-bold">{fmt(inventoryValue)}</p><p className="text-xs text-muted-foreground">{inventory.length} items in stock</p></div><Package className="h-5 w-5 text-primary" /></div></CardContent></Card>
          <Card className="border-primary"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-primary">Active Customers</p><p className="text-2xl font-bold">{activeCustomers}</p><p className="text-xs text-muted-foreground">Customer accounts</p></div><TrendingUp className="h-5 w-5 text-primary" /></div></CardContent></Card>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><DollarSign className="h-5 w-5" /><CardTitle>Financial Overview</CardTitle></div>
              <p className="text-sm text-muted-foreground">Key financial metrics</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary text-primary-foreground">
                <div><p className="font-medium">Total Revenue</p><p className="text-sm opacity-80">All invoice totals</p></div>
                <span className="font-bold">{fmt(totalSales)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary text-primary-foreground">
                <div><p className="font-medium">Outstanding Balance</p><p className="text-sm opacity-80">Total amount due</p></div>
                <span className="font-bold">{fmt(outstandingAmount)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary text-primary-foreground">
                <div><p className="font-medium">Paid Amount</p><p className="text-sm opacity-80">Total collected</p></div>
                <span className="font-bold">{fmt(totalSales - outstandingAmount)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /><CardTitle>Business Metrics</CardTitle></div>
              <p className="text-sm text-muted-foreground">Key performance indicators</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary text-primary-foreground">
                <div><p className="font-medium">Active Customers</p><p className="text-sm opacity-80">Total customer base</p></div>
                <span className="font-bold">{activeCustomers}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary text-primary-foreground">
                <div><p className="font-medium">Orders Processed</p><p className="text-sm opacity-80">Total sales orders</p></div>
                <span className="font-bold">{ordersCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary text-primary-foreground">
                <div><p className="font-medium">Low Stock Items</p><p className="text-sm opacity-80">Items with ≤ 5 quantity</p></div>
                <span className="font-bold">{lowStockCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Reports */}
        <Card>
          <CardHeader><CardTitle>Available Reports</CardTitle><p className="text-sm text-muted-foreground">View comprehensive business reports with live data</p></CardHeader>
          <CardContent className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2"><h3 className="font-semibold">Sales Report</h3><Badge>Financial</Badge></div>
                    <p className="text-sm text-muted-foreground">All invoices with amounts and payment status</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setViewReport("sales")}><Eye className="h-4 w-4 mr-1" /> View</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2"><h3 className="font-semibold">Outstanding Invoice Report</h3><Badge>Financial</Badge></div>
                    <p className="text-sm text-muted-foreground">Unpaid and partially paid invoices</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setViewReport("outstanding")}><Eye className="h-4 w-4 mr-1" /> View</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2"><h3 className="font-semibold">Inventory Report</h3><Badge variant="secondary">Inventory</Badge></div>
                    <p className="text-sm text-muted-foreground">Current stock levels and low inventory alerts</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setViewReport("inventory")}><Eye className="h-4 w-4 mr-1" /> View</Button>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>

      {/* Sales Report Dialog */}
      <Dialog open={viewReport === "sales"} onOpenChange={() => setViewReport(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary">Sales Report</DialogTitle>
            <p className="text-sm text-muted-foreground">{invoices.length} invoices · Total: {fmt(totalSales)}</p>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm">{inv.invoiceNumber || inv.invoiceNo || inv.id}</TableCell>
                  <TableCell>{inv.customerName || "-"}</TableCell>
                  <TableCell>{inv.date || "-"}</TableCell>
                  <TableCell>
                    <Badge className={inv.status === "Paid" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                      {inv.status || "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{fmt(Number(inv.total || 0))}</TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No invoices found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Outstanding Report Dialog */}
      <Dialog open={viewReport === "outstanding"} onOpenChange={() => setViewReport(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary">Outstanding Invoice Report</DialogTitle>
            <p className="text-sm text-muted-foreground">{unpaidInvoices.length} unpaid invoices · Outstanding: {fmt(outstandingAmount)}</p>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Pending</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unpaidInvoices.map((inv) => {
                const total = Number(inv.total || 0);
                const paid = Number(inv.paidAmount || 0);
                const pending = Math.max(0, total - paid);
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">{inv.invoiceNumber || inv.invoiceNo || inv.id}</TableCell>
                    <TableCell>{inv.customerName || "-"}</TableCell>
                    <TableCell>{inv.date || "-"}</TableCell>
                    <TableCell>
                      <Badge className={paid > 0 ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                        {paid > 0 ? "Partial" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{fmt(total)}</TableCell>
                    <TableCell className="text-right">{fmt(paid)}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{fmt(pending)}</TableCell>
                  </TableRow>
                );
              })}
              {unpaidInvoices.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No outstanding invoices</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Inventory Report Dialog */}
      <Dialog open={viewReport === "inventory"} onOpenChange={() => setViewReport(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary">Inventory Report</DialogTitle>
            <p className="text-sm text-muted-foreground">{inventory.length} items · Value: {fmt(inventoryValue)} · {lowStockCount} low stock alerts</p>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Style No</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => (
                <TableRow key={item.id} className={item.stock <= 5 ? "bg-destructive/5" : ""}>
                  <TableCell className="font-mono text-sm">{item.styleNo || "-"}</TableCell>
                  <TableCell>{item.itemName || "-"}</TableCell>
                  <TableCell>{item.description || "-"}</TableCell>
                  <TableCell className="text-right">{fmt(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">
                    <span className={item.stock <= 5 ? "text-destructive font-bold" : ""}>{item.stock} units</span>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{fmt(item.unitPrice * item.stock)}</TableCell>
                </TableRow>
              ))}
              {inventory.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No inventory items found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
