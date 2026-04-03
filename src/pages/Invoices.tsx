import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { db, ref, onValue, push, set } from "@/lib/firebase";
import { ArrowLeft, Plus, Upload, Trash2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";

interface InvoiceItem {
  itemCode: string;
  description: string;
  quantity: number;
  branch: string;
  price: number;
  total: number;
}

interface Customer {
  id: string;
  name: string;
}

export default function Invoices() {
  const [showStyleForm, setShowStyleForm] = useState(false);
  const [newStyleCode, setNewStyleCode] = useState("");
  const [newStyleDesc, setNewStyleDesc] = useState("");
  const [newStylePrice, setNewStylePrice] = useState("");

  const handleAddStyleCode = () => {
    if (!newStyleCode || !newStyleDesc) { toast.error("Code and Description are required"); return; }
    const price = Number(newStylePrice) || 0;
    const nonEmpty = items.filter(i => i.itemCode || i.description);
    setItems([...nonEmpty, { itemCode: newStyleCode, description: newStyleDesc, quantity: 1, branch: "Branch 1", price, total: price }]);
    setNewStyleCode(""); setNewStyleDesc(""); setNewStylePrice("");
    setShowStyleForm(false);
    toast.success("Style code added");
  };

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [branch, setBranch] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([{ itemCode: "AU001", description: "", quantity: 0, branch: "Branch 1", price: 0, total: 0 }]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkParsedItems, setBulkParsedItems] = useState<InvoiceItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const invoicesRef = ref(db, "invoices");
    onValue(invoicesRef, (snapshot) => {
      const data = snapshot.val();
      const count = data ? Object.keys(data).length : 0;
      const num = 10037 + count;
      setInvoiceNumber(String(num));
      setOrderNumber(`OR${num}`);
    });

    const customersRef = ref(db, "customers");
    onValue(customersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCustomers(Object.entries(data).map(([id, val]: [string, any]) => ({ id, name: val.name || "" })));
      }
    });
  }, []);

  const handleParseBulk = () => {
    if (!bulkFile) { toast.error("Please select a file"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) { toast.error("File must have a header row and at least one data row"); return; }
        const header = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
        const styleIdx = header.findIndex(h => ["styleno", "style", "itemcode", "code", "sku"].includes(h));
        const descIdx = header.findIndex(h => ["description", "desc", "name", "item"].includes(h));
        const priceIdx = header.findIndex(h => ["unitprice", "price", "rate", "amount"].includes(h));
        const qtyIdx = header.findIndex(h => ["quantity", "qty", "units"].includes(h));

        const parsed: InvoiceItem[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map(c => c.trim());
          const itemCode = styleIdx >= 0 ? cols[styleIdx] || "" : cols[0] || "";
          const description = descIdx >= 0 ? cols[descIdx] || "" : cols[1] || "";
          const price = Number(priceIdx >= 0 ? cols[priceIdx] : cols[2]) || 0;
          const quantity = Number(qtyIdx >= 0 ? cols[qtyIdx] : 1) || 1;
          parsed.push({ itemCode, description, quantity, branch: "Branch 1", price, total: quantity * price });
        }
        setBulkParsedItems(parsed);
        toast.success(`Parsed ${parsed.length} items`);
      } catch { toast.error("Failed to parse file"); }
    };
    reader.readAsText(bulkFile);
  };

  const handleImportItems = () => {
    if (bulkParsedItems.length === 0) { toast.error("No items to import"); return; }
    const nonEmpty = items.filter(i => i.itemCode || i.description);
    setItems([...nonEmpty, ...bulkParsedItems]);
    setBulkOpen(false);
    setBulkFile(null);
    setBulkParsedItems([]);
    toast.success(`Imported ${bulkParsedItems.length} items`);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    if (field === "quantity" || field === "price") {
      newItems[index].total = newItems[index].quantity * newItems[index].price;
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { itemCode: "", description: "", quantity: 0, branch: "Branch 1", price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);

  const handleCreate = async () => {
    if (!selectedCustomer) { toast.error("Please select a customer"); return; }
    try {
      const invoicesRef = ref(db, "invoices");
      const newRef = push(invoicesRef);
      const customerName = customers.find((c) => c.id === selectedCustomer)?.name || "";
      await set(newRef, {
        invoiceNumber, date, customerId: selectedCustomer, customerName, branch, orderNumber,
        items, total: subtotal, status: "Pending",
      });
      toast.success("Invoice created");
      navigate("/");
    } catch { toast.error("Failed to create invoice"); }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Back to Dashboard</button>
          <h1 className="text-2xl font-bold">Create Invoice</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Invoice Details</CardTitle><p className="text-sm text-muted-foreground">Basic invoice information</p></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Invoice Number</Label><Input value={invoiceNumber} readOnly className="bg-muted" /></div>
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-muted" /></div>
              </div>
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Branch</Label><Input placeholder="e.g., Branch 1" value={branch} onChange={(e) => setBranch(e.target.value)} /></div>
              <div className="space-y-2"><Label>Order Number</Label><Input value={orderNumber} readOnly className="bg-muted" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Invoice Summary</CardTitle><p className="text-sm text-muted-foreground">Total amounts and payment details</p></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span><span className="text-primary font-medium">RS {subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="font-bold">Total:</span><span className="font-bold text-lg">RS {subtotal.toLocaleString()}</span></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div><CardTitle>Invoice Items</CardTitle><p className="text-sm text-muted-foreground">Add products and services</p></div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}><Upload className="h-4 w-4 mr-1" /> Bulk Import</Button>
                <Button variant="outline" size="sm">Add Item Code</Button>
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quick Select</TableHead><TableHead>Item Code *</TableHead><TableHead>Description *</TableHead>
                  <TableHead>Quantity *</TableHead><TableHead>Branch</TableHead><TableHead>Price (RS) *</TableHead>
                  <TableHead>Total</TableHead><TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell><Select><SelectTrigger className="w-28"><SelectValue placeholder="Select item" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem></SelectContent></Select></TableCell>
                    <TableCell><Input value={item.itemCode} onChange={(e) => updateItem(i, "itemCode", e.target.value)} className="w-20" /></TableCell>
                    <TableCell><Input placeholder="Item description" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} /></TableCell>
                    <TableCell><Input type="number" value={item.quantity || ""} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} className="w-20" /></TableCell>
                    <TableCell><Input value={item.branch} onChange={(e) => updateItem(i, "branch", e.target.value)} className="w-24" /></TableCell>
                    <TableCell><Input type="number" value={item.price || ""} onChange={(e) => updateItem(i, "price", Number(e.target.value))} className="w-24" /></TableCell>
                    <TableCell className="font-medium">RS {item.total.toLocaleString()}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/")}>Cancel</Button>
          <Button onClick={handleCreate}>Create Invoice</Button>
        </div>

        <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Bulk Import Invoice Items</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-md border p-3">
                <FileSpreadsheet className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Upload a CSV or Excel file with columns: Style No, Description, Unit Price. The system will intelligently detect column names regardless of format.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Select File</Label>
                <div className="flex gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={(e) => { setBulkFile(e.target.files?.[0] || null); setBulkParsedItems([]); }}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={handleParseBulk} disabled={!bulkFile}>
                    <Upload className="h-4 w-4 mr-1" /> Parse
                  </Button>
                </div>
              </div>
              {bulkParsedItems.length > 0 && (
                <p className="text-sm text-primary font-medium">{bulkParsedItems.length} items ready to import</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setBulkOpen(false); setBulkFile(null); setBulkParsedItems([]); }}>Cancel</Button>
              <Button onClick={handleImportItems} disabled={bulkParsedItems.length === 0} className="bg-orange-400 hover:bg-orange-500 text-white">Import Items</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
