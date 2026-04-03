import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoUrl from "@/assets/sevinro-logo-pdf.png";

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

async function loadImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export async function generateSalesOrderPDF(order: SalesOrderData) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginLeft = 15;
  const marginRight = 15;
  const tableWidth = pageWidth - marginLeft - marginRight; // 180mm

  // Load logo
  let logoBase64: string | null = null;
  try {
    logoBase64 = await loadImageAsBase64(logoUrl);
  } catch (e) {
    console.warn("Could not load logo", e);
  }

  // Column widths proportional to fill full table width (180mm)
  // No | Style No | Description | Qty | Branch | Price | Total | Remarks
  const colWidths = [12, 22, 40, 16, 24, 22, 28, 16];
  const totalColWidth = colWidths.reduce((a, b) => a + b, 0);
  // Scale to fit tableWidth exactly
  const scale = tableWidth / totalColWidth;
  const scaledColWidths = colWidths.map(w => w * scale);

  const FIRST_PAGE_ROWS = 10;
  const OTHER_PAGE_ROWS = 20;

  // Prepare all item rows
  const allRows = order.items.map((item, index) => [
    String(index + 1),
    item.styleNo || "",
    item.description || "",
    String(item.quantity),
    item.branch || "",
    item.price > 0 ? item.price.toFixed(2) : "0.00",
    `LKR ${item.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    item.remarks || "",
  ]);

  // Split into chunks: first page 10 rows, then 20 per page
  const chunks: string[][][] = [];
  if (allRows.length <= FIRST_PAGE_ROWS) {
    chunks.push(padRows(allRows, FIRST_PAGE_ROWS));
  } else {
    chunks.push(padRows(allRows.slice(0, FIRST_PAGE_ROWS), FIRST_PAGE_ROWS));
    let remaining = allRows.slice(FIRST_PAGE_ROWS);
    while (remaining.length > 0) {
      const chunk = remaining.slice(0, OTHER_PAGE_ROWS);
      chunks.push(padRows(chunk, OTHER_PAGE_ROWS));
      remaining = remaining.slice(OTHER_PAGE_ROWS);
    }
  }

  const tableHeaders = [["No", "Style No", "Description", "Qty", "Branch", "Price", "Total", "Remarks"]];

  const columnStylesObj: Record<number, any> = {};
  scaledColWidths.forEach((w, i) => {
    const base: any = { cellWidth: w };
    if (i === 0) base.halign = "center";
    if (i === 1) base.halign = "center";
    if (i === 3) base.halign = "center";
    if (i === 4) base.halign = "center";
    if (i === 5) base.halign = "right";
    if (i === 6) base.halign = "right";
    columnStylesObj[i] = base;
  });

  // === RENDER EACH PAGE ===
  for (let pageIdx = 0; pageIdx < chunks.length; pageIdx++) {
    if (pageIdx > 0) doc.addPage();

    let startY: number;

    if (pageIdx === 0) {
      // === HEADER (first page only) ===
      // Logo image
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", marginLeft, 10, 35, 20);
      } else {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text("SEVINRO", marginLeft, 25);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text("DISTRIBUTORS", marginLeft, 30);
      }

      // Company address (top right)
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "normal");
      doc.text("No - 136/A, Akarawita, Gampaha", pageWidth - marginRight, 18, { align: "right" });
      doc.text("Te: 071 39 69 580, 0777 52 90 58", pageWidth - marginRight, 24, { align: "right" });

      // === TITLE ===
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Sales Order Form", pageWidth / 2, 50, { align: "center" });

      // === TO / Invoice info ===
      const infoY = 65;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("TO:-", marginLeft, infoY);
      doc.setFont("helvetica", "normal");
      doc.text(order.customerName, marginLeft + 18, infoY);

      if (order.customerAddress || order.notes) {
        doc.text(order.customerAddress || order.notes || "", marginLeft, infoY + 7);
      }

      // Right side info
      doc.setFontSize(10);
      doc.text(`Invoice No - ${order.invoiceNumber || "-"}`, pageWidth - marginRight, infoY, { align: "right" });
      doc.text(`Order No - ${order.orderNumber || "-"}`, pageWidth - marginRight, infoY + 7, { align: "right" });
      doc.text(`Date - ${order.orderDate}`, pageWidth - marginRight, infoY + 14, { align: "right" });

      startY = infoY + 25;
    } else {
      startY = 20;
    }

    // === TABLE ===
    autoTable(doc, {
      startY,
      head: tableHeaders,
      body: chunks[pageIdx],
      theme: "grid",
      headStyles: {
        fillColor: [255, 165, 0],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        halign: "center",
        valign: "middle",
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [30, 30, 30],
        valign: "middle",
        minCellHeight: 8,
      },
      columnStyles: columnStylesObj,
      styles: {
        lineColor: [200, 200, 200],
        lineWidth: 0.3,
      },
      margin: { left: marginLeft, right: marginRight },
    });

    // === TOTAL & SIGNATURE on last page only ===
    if (pageIdx === chunks.length - 1) {
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Total Amount", pageWidth - 80, finalY);
      doc.text(
        `LKR  ${order.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        pageWidth - marginRight,
        finalY,
        { align: "right" }
      );

      // Signature lines at bottom
      const sigY = pageHeight - 40;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);

      doc.line(marginLeft, sigY, marginLeft + 65, sigY);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Authorized By", marginLeft + 15, sigY + 7);

      doc.line(pageWidth - marginRight - 65, sigY, pageWidth - marginRight, sigY);
      doc.text("Customer Signature", pageWidth - marginRight - 55, sigY + 7);
    }
  }

  // Save
  doc.save(`Sales_Order_${order.orderNumber}_${order.customerName.replace(/\s+/g, "_")}.pdf`);
}

function padRows(rows: string[][], targetCount: number): string[][] {
  const padded = [...rows];
  while (padded.length < targetCount) {
    padded.push(["", "", "", "", "", "", "", ""]);
  }
  return padded;
}
