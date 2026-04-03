import jsPDF from "jspdf";
import "jspdf-autotable";

interface SalesOrderData {
  orderNumber: string;
  invoiceNumber: string;
  customerName: string;
  customerAddress?: string;
  orderDate: string;
  items: Array<{
    styleNo: string;
    description?: string;
    quantity: number;
    branch?: string;
    price: number;
    total: number;
    remarks?: string;
  }>;
  total: number;
  notes?: string;
}

export function generateSalesOrderPDF(order: SalesOrderData) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  // === HEADER: Company Info ===
  // Logo text (top left)
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("SEVINRO", 20, 25);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("DISTRIBUTORS", 20, 30);

  // Orange accent line under logo
  doc.setDrawColor(255, 165, 0);
  doc.setLineWidth(0.5);

  // Company address (top right)
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");
  doc.text("No - 136/A, Akarawita, Gampaha", pageWidth - 20, 20, { align: "right" });
  doc.text("Te: 071 39 69 580, 0777 52 90 58", pageWidth - 20, 26, { align: "right" });

  // === TITLE ===
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Sales Order Form", pageWidth / 2, 55, { align: "center" });

  // === TO / Invoice info ===
  const infoY = 75;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("TO:-", 20, infoY);
  doc.setFont("helvetica", "normal");
  doc.text(order.customerName, 38, infoY);

  if (order.customerAddress || order.notes) {
    doc.text(order.customerAddress || order.notes || "", 20, infoY + 7);
  }

  // Right side info
  doc.setFontSize(10);
  doc.text(`Invoice No - ${order.invoiceNumber}`, pageWidth - 20, infoY, { align: "right" });
  doc.text(`Order No - ${order.orderNumber}`, pageWidth - 20, infoY + 7, { align: "right" });
  doc.text(`Date - ${order.orderDate}`, pageWidth - 20, infoY + 14, { align: "right" });

  // === TABLE ===
  const tableStartY = infoY + 25;

  const tableHeaders = [["No", "Style No", "Description", "Qty", "Branch", "Price", "Total", "Remarks"]];

  const tableData = order.items.map((item, index) => [
    String(index + 1),
    item.styleNo || "",
    item.description || "",
    String(item.quantity),
    item.branch || "",
    item.price.toFixed(2),
    `RS ${item.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    item.remarks || "",
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: tableHeaders,
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [255, 165, 0],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
      halign: "center",
      valign: "middle",
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: [30, 30, 30],
      valign: "middle",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 15 },
      1: { halign: "center", cellWidth: 22 },
      2: { cellWidth: 35 },
      3: { halign: "center", cellWidth: 18 },
      4: { halign: "center", cellWidth: 25 },
      5: { halign: "right", cellWidth: 25 },
      6: { halign: "right", cellWidth: 30 },
      7: { cellWidth: 20 },
    },
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.3,
    },
    margin: { left: 20, right: 20 },
  });

  // === TOTAL ===
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Total Amount", pageWidth - 80, finalY);
  doc.text(`RS  ${order.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, pageWidth - 20, finalY, { align: "right" });

  // === SIGNATURE LINES ===
  const sigY = finalY + 60;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  // Left signature line
  doc.line(20, sigY, 85, sigY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Authorized By", 35, sigY + 7);

  // Right signature line
  doc.line(pageWidth - 85, sigY, pageWidth - 20, sigY);
  doc.text("Customer Signature", pageWidth - 75, sigY + 7);

  // Save
  doc.save(`Sales_Order_${order.orderNumber}_${order.customerName.replace(/\s+/g, "_")}.pdf`);
}
