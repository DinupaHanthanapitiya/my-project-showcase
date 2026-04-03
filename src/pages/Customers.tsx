import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { db, ref, onValue, push, set } from "@/lib/firebase";
import { Plus, Users, UserCheck, CreditCard } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";

interface Customer {
  id: string;
  name: string;
  email?: string;
  address?: string;
  telephone?: string;
  branches?: string[];
  isActive: boolean;
  outstandingBalance: number;
  pendingInvoices: any[];
}

const branchOptions = ["Branch 1", "Branch 2", "Branch 3", "Branch 4", "Branch 5", "Branch 6"];

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", address: "", telephone: "", branches: [] as string[] });

  useEffect(() => {
    const customersRef = ref(db, "customers");
    onValue(customersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          name: val.name || "",
          email: val.email || "",
          address: val.address || "",
          telephone: val.telephone || "",
          branches: val.branches || [],
          isActive: val.isActive !== false,
          outstandingBalance: Number(val.outstandingBalance || 0),
          pendingInvoices: val.pendingInvoices ? Object.values(val.pendingInvoices) : [],
        }));
        setCustomers(list);
      } else {
        setCustomers([]);
      }
    });
  }, []);

  const handleAdd = async () => {
    if (!form.name) { toast.error("Customer name is required"); return; }
    try {
      const customersRef = ref(db, "customers");
      const newRef = push(customersRef);
      await set(newRef, { ...form, isActive: true, outstandingBalance: 0 });
      toast.success("Customer added");
      setShowDialog(false);
      setForm({ name: "", email: "", address: "", telephone: "", branches: [] });
    } catch { toast.error("Failed to add customer"); }
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.isActive).length;
  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Customer Management</h1>
            <p className="text-muted-foreground">Manage your customer accounts and outstanding balances</p>
          </div>
          <Button onClick={() => setShowDialog(true)}><Plus className="h-4 w-4 mr-1" /> Add Customer</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Customers</p><p className="text-2xl font-bold">{totalCustomers}</p><p className="text-xs text-muted-foreground">Registered customers</p></div><Users className="h-5 w-5 text-muted-foreground" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Active Accounts</p><p className="text-2xl font-bold">{activeCustomers}</p><p className="text-xs text-muted-foreground">Active customers</p></div><UserCheck className="h-5 w-5 text-muted-foreground" /></div></CardContent></Card>
          <Card className="md:col-span-2"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Outstanding</p><p className="text-2xl font-bold text-primary">Rs. {totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p><p className="text-xs text-muted-foreground">{customers.filter(c => c.outstandingBalance > 0).length} accounts with balance</p></div><CreditCard className="h-5 w-5 text-muted-foreground" /></div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
            <p className="text-sm text-muted-foreground">Manage your customer accounts and track outstanding balances</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {customers.length === 0 && <p className="text-center text-muted-foreground py-8">No customers yet. Add your first customer.</p>}
            {customers.map((customer) => (
              <Card key={customer.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{customer.name}</h3>
                        <Badge variant={customer.isActive ? "default" : "secondary"}>{customer.isActive ? "Active" : "Inactive"}</Badge>
                      </div>
                      {customer.telephone && <p className="text-sm text-muted-foreground">Contact: {customer.telephone}</p>}
                      {customer.email && <p className="text-sm text-muted-foreground">Email: {customer.email}</p>}
                      {customer.pendingInvoices.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium flex items-center gap-1"><FileIcon className="h-4 w-4" /> Pending Invoices</p>
                          {customer.pendingInvoices.map((inv: any, i: number) => (
                            <div key={i} className="flex items-center justify-between mt-1 px-2 py-1 bg-muted rounded text-sm">
                              <span>{inv.number} | Due: {inv.dueDate}</span>
                              <span className="text-primary font-medium">Rs. {Number(inv.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">OUTSTANDING BALANCE</p>
                      <p className={`text-xl font-bold ${customer.outstandingBalance > 0 ? "text-primary" : "text-foreground"}`}>
                        Rs. {customer.outstandingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                      {customer.pendingInvoices.length > 0 && <p className="text-xs text-muted-foreground">{customer.pendingInvoices.length} pending invoice</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <p className="text-sm text-muted-foreground">Enter the customer information below. A unique ID will be generated automatically.</p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Customer Name</Label><Input placeholder="Enter customer name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email <span className="text-muted-foreground">(Optional)</span></Label><Input placeholder="Enter email address (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Address <span className="text-muted-foreground">(Optional)</span></Label><Textarea placeholder="Enter customer address (optional)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="space-y-2"><Label>Telephone No.</Label><Input placeholder="Enter telephone number" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Branches <span className="text-muted-foreground">(Optional)</span></Label>
              <div className="space-y-2">
                {branchOptions.map((branch) => (
                  <div key={branch} className="flex items-center gap-2">
                    <Checkbox
                      checked={form.branches.includes(branch)}
                      onCheckedChange={(checked) => {
                        setForm({
                          ...form,
                          branches: checked ? [...form.branches, branch] : form.branches.filter((b) => b !== branch),
                        });
                      }}
                    />
                    <span className="text-sm">{branch}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Submit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function FileIcon({ className }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>;
}
