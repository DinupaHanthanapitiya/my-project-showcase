import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db, ref, onValue } from "@/lib/firebase";
import { TrendingUp, DollarSign, BarChart3, Eye, FileText, Package } from "lucide-react";
import Layout from "@/components/Layout";

export default function Reports() {
  const [totalSales, setTotalSales] = useState(0);
  const [outstandingAmount, setOutstandingAmount] = useState(0);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [activeCustomers, setActiveCustomers] = useState(0);

  useEffect(() => {
    const invoicesRef = ref(db, "invoices");
    onValue(invoicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let sales = 0;
        let outstanding = 0;
        Object.values(data).forEach((inv: any) => {
          sales += Number(inv.total || 0);
          if (inv.status !== "Paid") outstanding += Number(inv.total || 0);
        });
        setTotalSales(sales);
        setOutstandingAmount(outstanding);
      }
    });

    const inventoryRef = ref(db, "inventory");
    onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let value = 0;
        Object.values(data).forEach((item: any) => {
          value += Number(item.unitPrice || 0) * Number(item.stock || 0);
        });
        setInventoryValue(value);
      }
    });

    const customersRef = ref(db, "customers");
    onValue(customersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const active = Object.values(data).filter((c: any) => c.isActive !== false).length;
        setActiveCustomers(active);
      }
    });
  }, []);

  const reports = [
    { name: "Monthly Sales Report", type: "Financial", description: "Comprehensive sales analysis for the current month", status: "Available" },
    { name: "Invoice Report", type: "Financial", description: "Outstanding invoices and payment status", status: "Available" },
    { name: "Inventory Report", type: "Inventory", description: "Current stock levels and low inventory alerts", status: "Available" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Reports & Analytics</h1>
            <p className="text-muted-foreground">Business insights and financial reports</p>
          </div>
          <Button><FileText className="h-4 w-4 mr-1" /> Generate Report</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-primary"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-primary">Total Sales (MTD)</p><p className="text-2xl font-bold">LKR {totalSales.toLocaleString()}</p><p className="text-xs text-muted-foreground">Sum of invoice totals this month</p></div><TrendingUp className="h-5 w-5 text-primary" /></div></CardContent></Card>
          <Card className="border-primary"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-primary">Outstanding Amount</p><p className="text-2xl font-bold">LKR {outstandingAmount.toLocaleString()}</p><p className="text-xs text-destructive">Live data</p><p className="text-xs text-muted-foreground">Sum of unpaid and partial invoices</p></div><TrendingUp className="h-5 w-5 text-primary" /></div></CardContent></Card>
          <Card className="border-primary"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-primary">Inventory Value</p><p className="text-2xl font-bold">LKR {inventoryValue.toLocaleString()}</p><p className="text-xs text-destructive">Live data</p><p className="text-xs text-muted-foreground">Total inventory quantity × cost price</p></div><TrendingUp className="h-5 w-5 text-primary" /></div></CardContent></Card>
          <Card className="border-primary"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-primary">Active Customers</p><p className="text-2xl font-bold">{activeCustomers}</p><p className="text-xs text-destructive">Live data</p><p className="text-xs text-muted-foreground">Count of active customers</p></div><TrendingUp className="h-5 w-5 text-primary" /></div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><DollarSign className="h-5 w-5" /><CardTitle>Financial Overview</CardTitle></div>
              <p className="text-sm text-muted-foreground">Key financial metrics and trends</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary text-primary-foreground">
                <div><p className="font-medium">Monthly Revenue</p><p className="text-sm opacity-80">Current month earnings</p></div>
                <span>0.0%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary text-primary-foreground">
                <div><p className="font-medium">Outstanding Balance</p><p className="text-sm opacity-80">Total amount due</p></div>
                <span>LKR {outstandingAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary text-primary-foreground">
                <div><p className="font-medium">Profit Margin</p><p className="text-sm opacity-80">Current month margin</p></div>
                <span>Live calculation</span>
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
                <span>Live data</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary text-primary-foreground">
                <div><p className="font-medium">Orders Processed</p><p className="text-sm opacity-80">This month</p></div>
                <span>Live data</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary text-primary-foreground">
                <div><p className="font-medium">Low Stock Items</p><p className="text-sm opacity-80">Items with ≤ 5 quantity</p></div>
                <span>Live data</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Available Reports</CardTitle><p className="text-sm text-muted-foreground">Generate and download comprehensive business reports</p></CardHeader>
          <CardContent className="space-y-4">
            {reports.map((report) => (
              <Card key={report.name}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{report.name}</h3>
                        <Badge variant={report.type === "Financial" ? "default" : "secondary"}>{report.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                      <p className="text-xs text-muted-foreground">Status: {report.status}</p>
                    </div>
                    <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" /> View</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
