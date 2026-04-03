import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db, ref, onValue } from "@/lib/firebase";
import { FileDown } from "lucide-react";
import Layout from "@/components/Layout";

interface SalesOrder {
  id: string;
  orderNumber: string;
  invoiceNumber?: string;
  customerName: string;
  orderDate: string;
  deliveryDate: string;
  items: number;
  total: number;
  status: string;
  notes?: string;
}

export default function SalesOrder() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);

  useEffect(() => {
    const ordersRef = ref(db, "salesOrders");
    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({
          id, orderNumber: val.orderNumber || "", invoiceNumber: val.invoiceNumber || "",
          customerName: val.customerName || "", orderDate: val.orderDate || "", deliveryDate: val.deliveryDate || "",
          items: Number(val.items || val.itemCount || 0), total: Number(val.total || 0),
          status: val.status || "Pending", notes: val.notes || "",
        }));
        setOrders(list.reverse());
      } else setOrders([]);
    });
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Create Sales Order</h1>
          <p className="text-muted-foreground">Create a new sales order for your customers</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Saved Sales Orders</CardTitle>
              <Badge variant="outline">{orders.length} Total</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {orders.length === 0 && <p className="text-center text-muted-foreground py-8">No sales orders yet</p>}
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{order.orderNumber}</span>
                        {order.invoiceNumber && <Badge variant="secondary">{order.invoiceNumber}</Badge>}
                        <Badge variant="outline">{order.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Customer: {order.customerName}</p>
                      <p className="text-sm text-muted-foreground">Order Date: {order.orderDate} &nbsp; Delivery: {order.deliveryDate}</p>
                      <p className="text-sm">Items: {order.items} items · <span className="text-primary font-medium">RS {order.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></p>
                      {order.notes && <p className="text-sm text-muted-foreground">Notes: {order.notes}</p>}
                    </div>
                    <Button variant="outline" size="sm"><FileDown className="h-4 w-4 mr-1" /> Download PDF</Button>
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
