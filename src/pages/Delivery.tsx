import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { db, ref, onValue, push, set } from "@/lib/firebase";
import { Plus, Truck, Calendar, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";

interface Delivery {
  id: string;
  companyName: string;
  address: string;
  deliveryDate: string;
  items: number;
  status: string;
}

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetails, setShowDetails] = useState<Delivery | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ companyName: "", address: "", deliveryDate: "", items: "" });

  useEffect(() => {
    const deliveriesRef = ref(db, "deliveries");
    onValue(deliveriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({
          id, companyName: val.companyName || "", address: val.address || "To be determined",
          deliveryDate: val.deliveryDate || "", items: Number(val.items || 0), status: val.status || "Pending",
        }));
        setDeliveries(list);
      } else setDeliveries([]);
    });
  }, []);

  const handleAdd = async () => {
    if (!form.companyName || !form.deliveryDate) { toast.error("Please fill required fields"); return; }
    try {
      const deliveriesRef = ref(db, "deliveries");
      const newRef = push(deliveriesRef);
      await set(newRef, { ...form, items: Number(form.items) || 0, status: "Pending" });
      toast.success("Delivery scheduled");
      setShowDialog(false);
      setForm({ companyName: "", address: "", deliveryDate: "", items: "" });
    } catch { toast.error("Failed to schedule delivery"); }
  };

  const total = deliveries.length;
  const today = deliveries.filter((d) => d.deliveryDate === new Date().toISOString().split("T")[0]).length;
  const completed = deliveries.filter((d) => d.status === "Delivered").length;
  const filtered = deliveries.filter((d) => d.companyName.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Delivery Management</h1>
            <p className="text-muted-foreground">Manage delivery status and good receiver notes</p>
          </div>
          <Button onClick={() => setShowDialog(true)}><Plus className="h-4 w-4 mr-1" /> Schedule Delivery</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-primary"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Deliveries</p><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">All records</p></div><Truck className="h-5 w-5 text-muted-foreground" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Today's Deliveries</p><p className="text-2xl font-bold">{today}</p><p className="text-xs text-muted-foreground">Scheduled today</p></div><Calendar className="h-5 w-5 text-muted-foreground" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold text-primary">{completed}</p><p className="text-xs text-muted-foreground">Successfully delivered</p></div><MapPin className="h-5 w-5 text-muted-foreground" /></div></CardContent></Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search deliveries..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Button variant="outline">Filter by Status</Button>
              <Button variant="outline">Sort by Date</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Deliveries</CardTitle><p className="text-sm text-muted-foreground">Manage delivery status and good receiver notes</p></CardHeader>
          <CardContent className="space-y-4">
            {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No deliveries found</p>}
            {filtered.map((delivery) => (
              <Card key={delivery.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{delivery.companyName}</h3>
                        <Badge className={delivery.status === "Delivered" ? "bg-primary text-primary-foreground" : ""}>{delivery.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Address: {delivery.address}</p>
                      <p className="text-sm text-muted-foreground">Date: {delivery.deliveryDate}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-primary font-bold text-lg">{delivery.items}</span>
                        <p className="text-xs text-muted-foreground">Items</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setShowDetails(delivery)}>Details</Button>
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
          <DialogHeader><DialogTitle>Schedule Delivery</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Company Name *</Label><Input placeholder="Enter company name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
            <div className="space-y-2"><Label>Delivery Address *</Label><Textarea placeholder="Enter delivery address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="space-y-2"><Label>Delivery Date *</Label><Input type="date" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} /></div>
            <div className="space-y-2"><Label>Items *</Label><Input type="number" placeholder="Enter number of items" value={form.items} onChange={(e) => setForm({ ...form, items: e.target.value })} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Submit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDetails} onOpenChange={() => setShowDetails(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delivery Details</DialogTitle></DialogHeader>
          {showDetails && (
            <div className="space-y-4">
              <div><Label className="font-bold">Company Name</Label><p>{showDetails.companyName}</p></div>
              <div><Label className="font-bold">Address</Label><p>{showDetails.address}</p></div>
              <div><Label className="font-bold">Delivery Date</Label><p>{showDetails.deliveryDate}</p></div>
              <div><Label className="font-bold">Status</Label><div className="mt-1"><Badge className="bg-primary text-primary-foreground">{showDetails.status}</Badge></div></div>
              <div><Label className="font-bold">Items</Label><p>{showDetails.items}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
