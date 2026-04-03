import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db, ref, onValue, push, set, update, remove } from "@/lib/firebase";
import { Plus, Package, AlertTriangle, Eye, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";

interface InventoryItem {
  id: string;
  styleNo: string;
  itemName?: string;
  description?: string;
  unitPrice: number;
  stock: number;
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [form, setForm] = useState({ styleNo: "", itemName: "", description: "", unitPrice: "" });

  useEffect(() => {
    const itemsRef = ref(db, "inventory");
    onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({
          id, styleNo: val.styleNo || "", itemName: val.itemName || "", description: val.description || "",
          unitPrice: Number(val.unitPrice || 0), stock: Number(val.stock || 0),
        }));
        setItems(list);
      } else setItems([]);
    });
  }, []);

  const handleAdd = async () => {
    if (!form.styleNo) { toast.error("Style No is required"); return; }
    try {
      const itemsRef = ref(db, "inventory");
      const newRef = push(itemsRef);
      await set(newRef, { ...form, unitPrice: Number(form.unitPrice) || 0, stock: 0 });
      toast.success("Item added");
      setShowDialog(false);
      setForm({ styleNo: "", itemName: "", description: "", unitPrice: "" });
    } catch { toast.error("Failed to add item"); }
  };

  const handleAdjustStock = async (item: InventoryItem, delta: number) => {
    const newStock = item.stock + delta;
    if (newStock < 0) return;
    try {
      await update(ref(db, `inventory/${item.id}`), { stock: newStock });
    } catch { toast.error("Failed to adjust stock"); }
  };

  const handleDelete = async (id: string) => {
    try { await remove(ref(db, `inventory/${id}`)); toast.success("Item deleted"); } catch { toast.error("Failed to delete"); }
  };

  const filtered = items
    .filter((i) => i.styleNo.toLowerCase().includes(search.toLowerCase()) || (i.itemName || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortAsc ? a.stock - b.stock : b.stock - a.stock);

  const totalItems = items.length;
  const lowStock = items.filter((i) => i.stock <= 5).length;
  const totalValue = items.reduce((sum, i) => sum + i.unitPrice * i.stock, 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Inventory Management</h1>
            <p className="text-muted-foreground">Track and manage your fabric inventory</p>
          </div>
          <Button onClick={() => setShowDialog(true)}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Items</p><p className="text-2xl font-bold">{totalItems}</p><p className="text-xs text-muted-foreground">Different fabric types</p></div><Package className="h-5 w-5 text-muted-foreground" /></div></CardContent></Card>
          <Card className="border-primary"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Low Stock Items</p><p className="text-2xl font-bold">{lowStock}</p></div><AlertTriangle className="h-5 w-5 text-primary" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-primary">Total Value</p><p className="text-2xl font-bold text-primary"><Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-primary">Total Value</p><p className="text-2xl font-bold text-primary">LKR {totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p><p className="text-xs text-muted-foreground">Current inventory value</p></div><Package className="h-5 w-5 text-muted-foreground" /></div></CardContent></Card></p><p className="text-xs text-muted-foreground">Current inventory value</p></div><Package className="h-5 w-5 text-muted-foreground" /></div></CardContent></Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Button variant="outline" onClick={() => setSortAsc(!sortAsc)}>Sort by Stock ({sortAsc ? "Low→High" : "High→Low"})</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Inventory Items</CardTitle><p className="text-sm text-muted-foreground">Manage your fabric inventory and stock levels</p></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Style No</TableHead><TableHead>Item</TableHead><TableHead>Description</TableHead>
                  <TableHead>Unit Price</TableHead><TableHead>Stock</TableHead><TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.styleNo}</TableCell>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>Rs. {item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell><span className={item.stock <= 5 ? "text-primary font-bold" : ""}>{item.stock} units</span></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleAdjustStock(item, 1)}>Adjust</Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No items found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Item</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Style No</Label><Input placeholder="STY-001" value={form.styleNo} onChange={(e) => setForm({ ...form, styleNo: e.target.value })} /></div>
            <div className="space-y-2"><Label>Item Name (Optional)</Label><Input placeholder="Cotton Fabric - White" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description (Optional)</Label><Input placeholder="High quality cotton fabric" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>Unit Price (Optional)</Label><Input type="number" placeholder="12.50" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
