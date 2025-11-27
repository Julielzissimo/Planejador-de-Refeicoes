import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppData, DAYS_OF_WEEK } from '../types';

export const generatePDF = (data: AppData, shoppingList: string[]) => {
  const doc = new jsPDF();
  const brandColor: [number, number, number] = [16, 185, 129]; // Emerald 500

  // --- Header ---
  doc.setFontSize(22);
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Planejador de Refeições", 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.setFont("helvetica", "normal");
  doc.text(`Semana de: ${new Date().toLocaleDateString('pt-BR')}`, 105, 28, { align: "center" });

  // --- Calendar Table ---
  
  const tableHead = [['', ...data.categories.map(c => c.name)]];
  const tableBody = DAYS_OF_WEEK.map((day, dayIndex) => {
    const row = [day];
    data.categories.forEach(cat => {
      const key = `${dayIndex}-${cat.id}`;
      const entry = data.plan[key];
      // Format: Dish Name
      let cellContent = '-';
      if (entry && entry.dishName) {
        cellContent = entry.dishName;
      }
      row.push(cellContent);
    });
    return row;
  });

  autoTable(doc, {
    startY: 35,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: { 
      fillColor: brandColor,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      minCellHeight: 12
    },
    styles: { 
      fontSize: 9, 
      cellPadding: 4,
      overflow: 'linebreak',
      valign: 'middle',
      lineColor: [220, 220, 220],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 25, fillColor: [249, 250, 251] }
    }
  });

  // --- Shopping List Section (Redesigned) ---
  
  let finalY = (doc as any).lastAutoTable.finalY + 20;
  
  // Check if we need a new page for the list
  if (finalY > 230) {
    doc.addPage();
    finalY = 25;
  }

  // Shopping List Header
  doc.setFontSize(16);
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Lista de Compras", 14, finalY);
  
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.setFont("helvetica", "normal");
  doc.text(`${shoppingList.length} itens consolidados`, 14, finalY + 6);

  // Decorative separator
  doc.setDrawColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.setLineWidth(0.5);
  doc.line(14, finalY + 10, 196, finalY + 10);

  if (shoppingList.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text("Nenhum item na lista para esta semana.", 14, finalY + 20);
  } else {
    // Transform flat list into a 2-column matrix
    const listRows = [];
    
    for (let i = 0; i < shoppingList.length; i += 2) {
      const item1 = shoppingList[i] || "";
      const item2 = shoppingList[i + 1] || "";
      listRows.push([item1, item2]);
    }

    autoTable(doc, {
      startY: finalY + 15,
      body: listRows,
      theme: 'plain', // Use plain to control borders manually via didDrawCell if needed, or stick to simple
      showHead: 'never',
      styles: {
        fontSize: 11,
        cellPadding: { top: 3, bottom: 3, left: 10, right: 2 }, // Extra left padding for checkbox
        valign: 'middle',
        textColor: 50,
      },
      columnStyles: {
        0: { cellWidth: 91 },
        1: { cellWidth: 91 }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 249] // Very subtle green tint
      },
      didDrawCell: (data) => {
        // Draw visual checkbox for body cells with content
        if (data.section === 'body' && data.cell.raw) {
            const size = 3.5;
            const x = data.cell.x + 3;
            // Center vertically
            const y = data.cell.y + (data.cell.height / 2) - (size / 2);
            
            doc.setDrawColor(160); // Gray border
            doc.setLineWidth(0.2);
            // Draw rounded square
            doc.roundedRect(x, y, size, size, 0.5, 0.5, 'S');
        }
      }
    });
  }

  doc.save('planejamento-refeicoes-v2.pdf');
};