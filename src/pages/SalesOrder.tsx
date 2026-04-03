import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db, ref, onValue } from "@/lib/firebase";
import { FileDown } from "lucide-react";
import Layout from "@/components/Layout";
import { generateSalesOrderPDF } from "@/lib/generateSalesOrderPDF";

interface OrderItem {
  styleNo: string;
  description?: string;
  quantity: number;
  branch?: string;
  price: number;
  total: number;
  remarks?: string;
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  invoiceNumber?: string;
  customerName: string;
  customerAddress?: string;
  orderDate: string;
  deliveryDate: string;
  itemCount: number;
  total: number;
  status: string;
  notes?: string;
  items: OrderItem[];
}

export default function SalesOrder() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);

  useEffect(() => {
    const ordersRef = ref(db, "salesOrders");
    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: [string, any]) => {
          const rawItems = val.items ? (Array.isArray(val.items) ? val.items : Object.values(val.items)) : [];
          const items: OrderItem[] = rawItems.map((item: any) => ({
            styleNo: item.styleNo || item.itemCode || "",
            description: item.description || "",
            quantity: Number(item.quantity || item.qty || 0),
            branch: item.branch || "",
            price: Number(item.price || item.unitPrice || 0),
            total: Number(item.total || 0),
            remarks: item.remarks || "",
          }));

          return {
            id,
            orderNumber: val.orderNumber || "",
            invoiceNumber: val.invoiceNumber || "",
            customerName: val.customerName || "",
            customerAddress: val.customerAddress || val.address || "",
            orderDate: val.orderDate || "",
            deliveryDate: val.deliveryDate || "",
            itemCount: items.length || Number(val.itemCount || val.items?.length || 0),
            total: Number(val.total || 0),
            status: val.status || "Pending",
            notes: val.notes || "",
            items,
          };
        });
        setOrders(list.reverse());
      } else setOrders([]);
    });
  }, []);

  const handleDownloadPDF = async (order: SalesOrder) => {
    await generateSalesOrderPDF({
      orderNumber: order.orderNumber,
      invoiceNumber: order.invoiceNumber || "",
      customerName: order.customerName,
      customerAddress: order.customerAddress,
      orderDate: order.orderDate,
      items: order.items,
      total: order.total,
      notes: order.notes,
    });
  };

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
                      <p className="text-sm">Items: {order.itemCount} items · <span className="text-primary font-medium">RS {order.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></p>
                      {order.notes && <p className="text-sm text-muted-foreground">Notes: {order.notes}</p>}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(order)}>
                      <FileDown className="h-4 w-4 mr-1" /> Download PDF
                    </Button>
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
