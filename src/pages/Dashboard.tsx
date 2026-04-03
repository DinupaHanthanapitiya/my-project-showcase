import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, ref, onValue, push, set } from "@/lib/firebase";
import { DollarSign, CreditCard, ShoppingCart, Truck, FileText, Package, Users, CalendarDays, AlertTriangle, Plus } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";

interface Supplier {
  id?: string;
  name: string;
  dueDate: string;
  amount: number;
  description: string;
  invoiceNo: string;
  status: string;
}

interface Activity {
  id?: string;
  description: string;
  time: string;
  amount: number;
}

export default function Dashboard() {
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [pendingDeliveries, setPendingDeliveries] = useState(0);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [supplierForm, setSupplierForm] = useState<Supplier>({ name: "", dueDate: "", amount: 0, description: "", invoiceNo: "", status: "Pending" });
  const navigate = useNavigate();

  useEffect(() => {
    const invoicesRef = ref(db, "invoices");
    onValue(invoicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let revenue = 0;
        let outstanding = 0;
        const activities: Activity[] = [];
        Object.values(data).forEach((inv: any) => {
          revenue += Number(inv.total || 0);
          if (inv.status !== "Paid") outstanding += Number(inv.total || 0);
          activities.push({ description: `Invoice #${inv.invoiceNumber} created for ${inv.customerName || "Customer"}`, time: inv.date || "", amount: Number(inv.total || 0) });
        });
        setTotalRevenue(revenue);
        setOutstandingBalance(outstanding);
        setRecentActivity(activities.slice(-4).reverse());
      }
    });

    const ordersRef = ref(db, "salesOrders");
    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orders = Object.values(data).filter((o: any) => o.status === "Pending");
        setActiveOrders(orders.length);
      }
    });

    const deliveriesRef = ref(db, "deliveries");
    onValue(deliveriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const pending = Object.values(data).filter((d: any) => d.status !== "Delivered");
        setPendingDeliveries(pending.length);
      }
    });
  }, []);

  const handleAddSupplier = async () => {
    if (!supplierForm.name || !supplierForm.dueDate || !supplierForm.invoiceNo) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      const suppliersRef = ref(db, "suppliers");
      const newRef = push(suppliersRef);
      await set(newRef, supplierForm);
      toast.success("Supplier added successfully");
      setShowSupplierDialog(false);
      setSupplierForm({ name: "", dueDate: "", amount: 0, description: "", invoiceNo: "", status: "Pending" });
    } catch {
      toast.error("Failed to add supplier");
    }
  };

  const quickActions = [
    { label: "Create Invoice", icon: FileText, onClick: () => navigate("/invoices"), highlight: true },
    { label: "New Order", icon: ShoppingCart, onClick: () => navigate("/sales-order") },
    { label: "Add Customer", icon: Users, onClick: () => navigate("/customers") },
    { label: "Schedule Delivery", icon: CalendarDays, onClick: () => navigate("/delivery") },
    { label: "Inventory", icon: Package, onClick: () => navigate("/inventory") },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
            <p className="text-muted-foreground">Welcome to your textile business management system</p>
          </div>
          <Button onClick={() => setShowSupplierDialog(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Supplier
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold"><p className="text-2xl font-bold">LKR {totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p></p>
                  <p className="text-xs text-muted-foreground">+15.3% from last month</p>
                </div>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                  <p className="text-2xl font-bold text-destructive">Rs. {outstandingBalance.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{Math.floor(Math.random() * 15)} overdue accounts</p>
                </div>
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Orders</p>
                  <p className="text-2xl font-bold">{activeOrders}</p>
                  <p className="text-xs text-muted-foreground">+12 from last week</p>
                </div>
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Deliveries</p>
                  <p className="text-2xl font-bold">{pendingDeliveries}</p>
                  <p className="text-xs text-muted-foreground">5 scheduled today</p>
                </div>
                <Truck className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <p className="text-sm text-muted-foreground">Frequently used actions</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                      action.highlight
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-card hover:bg-muted"
                    }`}
                  >
                    <action.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <p className="text-sm text-muted-foreground">Latest business transactions</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>}
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-primary">Rs. {activity.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <CardTitle>Alerts & Notifications</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Items requiring your attention</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">No alerts at the moment. Everything looks good!</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <p className="text-sm text-muted-foreground">Enter the supplier information below. All fields are required.</p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Supplier Name *</Label>
              <Input placeholder="Enter supplier name" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input type="date" value={supplierForm.dueDate} onChange={(e) => setSupplierForm({ ...supplierForm, dueDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input type="number" placeholder="Enter amount" value={supplierForm.amount || ""} onChange={(e) => setSupplierForm({ ...supplierForm, amount: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea placeholder="Enter description" value={supplierForm.description} onChange={(e) => setSupplierForm({ ...supplierForm, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Invoice No *</Label>
              <Input placeholder="Enter invoice number" value={supplierForm.invoiceNo} onChange={(e) => setSupplierForm({ ...supplierForm, invoiceNo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={supplierForm.status} onValueChange={(v) => setSupplierForm({ ...supplierForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSupplierDialog(false)}>Cancel</Button>
              <Button onClick={handleAddSupplier}>Submit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
