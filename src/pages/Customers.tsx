import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db, ref, onValue, push, set, update, remove } from "@/lib/firebase";
import { Plus, Users, UserCheck, CreditCard, Search, Pencil, Trash2, Eye, EyeOff, Phone, Mail, MapPin, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import InvoiceHistoryDialog from "@/components/InvoiceHistoryDialog";

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
  allInvoices: any[];
}

const branchOptions = ["Branch 1", "Branch 2", "Branch 3", "Branch 4", "Branch 5", "Branch 6"];

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [form, setForm] = useState({ name: "", email: "", address: "", telephone: "", branches: [] as string[] });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [invoiceHistoryCustomer, setInvoiceHistoryCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const customersRef = ref(db, "customers");
    const invoicesRef = ref(db, "invoices");

    let customersData: any = null;
    let invoicesData: any = null;

    const buildCustomers = () => {
      if (customersData === null) return;
      const invoicesByCustomer: Record<string, { total: number; invoices: any[]; allInvoices: any[] }> = {};

      if (invoicesData) {
        Object.entries(invoicesData).forEach(([invId, inv]: [string, any]) => {
          const custName = (inv.customerName || inv.customer || "").toLowerCase().trim();
          if (!custName) return;
          const amount = Number(inv.total || inv.grandTotal || inv.amount || 0);
          const paid = Number(inv.paidAmount || 0);
          const outstanding = amount - paid;
          if (!invoicesByCustomer[custName]) {
            invoicesByCustomer[custName] = { total: 0, invoices: [], allInvoices: [] };
          }
          // Store full invoice data for history
          invoicesByCustomer[custName].allInvoices.push({ id: invId, ...inv });
          if (outstanding > 0) {
            invoicesByCustomer[custName].total += outstanding;
            invoicesByCustomer[custName].invoices.push({
              id: invId,
              number: inv.invoiceNo || inv.invoiceNumber || invId,
              dueDate: inv.dueDate || inv.date || "-",
              amount: outstanding,
            });
          }
        });
      }

      const list = Object.entries(customersData).map(([id, val]: [string, any]) => {
        const custName = (val.name || "").toLowerCase().trim();
        const invoiceInfo = invoicesByCustomer[custName] || { total: 0, invoices: [], allInvoices: [] };
        return {
          id,
          name: val.name || "",
          email: val.email || "",
          address: val.address || "",
          telephone: val.telephone || "",
          branches: val.branches || [],
          isActive: val.isActive !== false,
          outstandingBalance: invoiceInfo.total,
          pendingInvoices: invoiceInfo.invoices,
          allInvoices: invoiceInfo.allInvoices,
        };
      });
      setCustomers(list);
    };

    const unsubCustomers = onValue(customersRef, (snapshot) => {
      customersData = snapshot.val() || {};
      buildCustomers();
    });

    const unsubInvoices = onValue(invoicesRef, (snapshot) => {
      invoicesData = snapshot.val() || {};
      buildCustomers();
    });

    return () => {
      unsubCustomers();
      unsubInvoices();
    };
  }, []);

  const handleAdd = async () => {
    if (!form.name) { toast.error("Customer name is required"); return; }
    try {
      const customersRef = ref(db, "customers");
      const newRef = push(customersRef);
      await set(newRef, { ...form, isActive: true });
      toast.success("Customer added");
      setShowDialog(false);
      setForm({ name: "", email: "", address: "", telephone: "", branches: [] });
    } catch { toast.error("Failed to add customer"); }
  };

  const handleEdit = async () => {
    if (!editingCustomer || !form.name) { toast.error("Customer name is required"); return; }
    try {
      const custRef = ref(db, `customers/${editingCustomer.id}`);
      await update(custRef, { ...form });
      toast.success("Customer updated");
      setEditingCustomer(null);
      setShowDialog(false);
      setForm({ name: "", email: "", address: "", telephone: "", branches: [] });
    } catch { toast.error("Failed to update customer"); }
  };

  const handleDelete = async (id: string) => {
    try {
      const custRef = ref(db, `customers/${id}`);
      await remove(custRef);
      toast.success("Customer deleted");
      setDeleteConfirm(null);
    } catch { toast.error("Failed to delete customer"); }
  };

  const handleToggleActive = async (customer: Customer) => {
    try {
      const custRef = ref(db, `customers/${customer.id}`);
      await update(custRef, { isActive: !customer.isActive });
      toast.success(`Customer ${customer.isActive ? "deactivated" : "activated"}`);
    } catch { toast.error("Failed to update status"); }
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      email: customer.email || "",
      address: customer.address || "",
      telephone: customer.telephone || "",
      branches: customer.branches || [],
    });
    setShowDialog(true);
  };

  const openAddDialog = () => {
    setEditingCustomer(null);
    setForm({ name: "", email: "", address: "", telephone: "", branches: [] });
    setShowDialog(true);
  };

  const filtered = customers.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.telephone || "").includes(search);
    const matchesFilter = filterActive === "all" || (filterActive === "active" ? c.isActive : !c.isActive);
    return matchesSearch && matchesFilter;
  });

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
          <Button onClick={openAddDialog}><Plus className="h-4 w-4 mr-1" /> Add Customer</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-2xl font-bold">{totalCustomers}</p>
                  <p className="text-xs text-muted-foreground">Registered customers</p>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Accounts</p>
                  <p className="text-2xl font-bold">{activeCustomers}</p>
                  <p className="text-xs text-muted-foreground">Active customers</p>
                </div>
                <UserCheck className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Outstanding</p>
                  <p className="text-2xl font-bold text-primary"><p className="text-2xl font-bold text-primary">LKR {totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p></p>
                  <p className="text-xs text-muted-foreground">{customers.filter(c => c.outstandingBalance > 0).length} accounts with balance</p>
                </div>
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "active", "inactive"] as const).map((f) => (
              <Button
                key={f}
                variant={filterActive === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterActive(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {/* Customer Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customers ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No customers found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((customer) => (
                    <>
                      <TableRow key={customer.id} className="cursor-pointer" onClick={() => setExpandedCustomer(expandedCustomer === customer.id ? null : customer.id)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              {customer.branches && customer.branches.length > 0 && (
                                <p className="text-xs text-muted-foreground">{customer.branches.join(", ")}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {customer.telephone && (
                              <p className="text-sm flex items-center gap-1"><Phone className="h-3 w-3" />{customer.telephone}</p>
                            )}
                            {customer.email && (
                              <p className="text-sm flex items-center gap-1"><Mail className="h-3 w-3" />{customer.email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={customer.isActive ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); handleToggleActive(customer); }}
                          >
                            {customer.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className={`font-semibold ${customer.outstandingBalance > 0 ? "text-primary" : "text-foreground"}`}>
                            Rs. {customer.outstandingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                          {customer.pendingInvoices.length > 0 && (
                            <p className="text-xs text-muted-foreground">{customer.pendingInvoices.length} pending</p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" title="Invoice History" onClick={(e) => { e.stopPropagation(); setInvoiceHistoryCustomer(customer); }}>
                              <FileText className="h-4 w-4 text-primary" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditDialog(customer); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(customer.id); }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            {expandedCustomer === customer.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedCustomer === customer.id && (
                        <TableRow key={`${customer.id}-expanded`}>
                          <TableCell colSpan={5} className="bg-muted/30">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2">
                              {customer.address && (
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground">Address</p>
                                    <p className="text-sm">{customer.address}</p>
                                  </div>
                                </div>
                              )}
                              {customer.branches && customer.branches.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Branches</p>
                                  <div className="flex flex-wrap gap-1">
                                    {customer.branches.map((b) => (
                                      <Badge key={b} variant="outline" className="text-xs">{b}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {customer.pendingInvoices.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Pending Invoices</p>
                                  <div className="space-y-1">
                                    {customer.pendingInvoices.map((inv: any, i: number) => (
                                      <div key={i} className="flex items-center justify-between text-sm bg-background rounded px-2 py-1">
                                        <span>{inv.number} | Due: {inv.dueDate}</span>
                                        <span className="text-primary font-medium">Rs. {Number(inv.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {!customer.address && (!customer.branches || customer.branches.length === 0) && customer.pendingInvoices.length === 0 && (
                                <p className="text-sm text-muted-foreground col-span-3">No additional details available.</p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) setEditingCustomer(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {editingCustomer ? "Update customer information below." : "Enter the customer information below."}
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Name</Label>
              <Input placeholder="Enter customer name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-muted-foreground">(Optional)</span></Label>
              <Input placeholder="Enter email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Address <span className="text-muted-foreground">(Optional)</span></Label>
              <Textarea placeholder="Enter customer address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telephone No.</Label>
              <Input placeholder="Enter telephone number" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>
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
              <Button variant="outline" onClick={() => { setShowDialog(false); setEditingCustomer(null); }}>Cancel</Button>
              <Button onClick={editingCustomer ? handleEdit : handleAdd}>
                {editingCustomer ? "Update" : "Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this customer? This action cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice History Dialog */}
      <InvoiceHistoryDialog
        open={!!invoiceHistoryCustomer}
        onOpenChange={(open) => { if (!open) setInvoiceHistoryCustomer(null); }}
        customerName={invoiceHistoryCustomer?.name || ""}
        invoices={invoiceHistoryCustomer?.allInvoices || []}
      />
    </Layout>
  );
}
