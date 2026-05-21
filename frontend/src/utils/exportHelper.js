import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Helper to export table data to a beautifully formatted Excel file.
 * @param {string} title - The title of the sheet/report.
 * @param {Array<string>} headers - Header column labels.
 * @param {Array<Array<any>>} data - The rows of data matching the headers.
 * @param {string} filename - Output file name (defaults to 'report.xlsx').
 */
export const exportToExcel = async (title, headers, data, filename = 'report.xlsx') => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title.substring(0, 30));

    // Title Row
    const titleRow = worksheet.addRow([title]);
    titleRow.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFF1416C' } };
    worksheet.mergeCells(1, 1, 1, headers.length);
    worksheet.addRow([]); // Blank row

    // Headers Row
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF181C32' } // Dark charcoal color
      };
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'medium', color: { argb: 'FF181C32' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
      };
    });

    // Data Rows
    data.forEach((row, rowIndex) => {
      const dataRow = worksheet.addRow(row);
      dataRow.height = 20;
      const isEven = rowIndex % 2 === 0;

      dataRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 9 };
        cell.alignment = { vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
        // Zebra striping
        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' }
          };
        }
      });
    });

    // Auto-fit Column Widths
    worksheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const valStr = cell.value ? String(cell.value) : '';
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      });
      column.width = Math.min(Math.max(maxLen + 4, 12), 40);
    });

    // Save File
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
  } catch (error) {
    console.error('Error generating Excel file:', error);
  }
};

/**
 * Helper to export table data to a highly professional PDF document.
 * @param {string} title - The title of the document.
 * @param {Array<string>} headers - Header column labels.
 * @param {Array<Array<any>>} data - The rows of data matching the headers.
 * @param {string} filename - Output file name (defaults to 'report.pdf').
 */
export const exportToPDF = (title, headers, data, filename = 'report.pdf') => {
  try {
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape A4 format
    const totalPagesExp = '{total_pages_count}';

    // Header and Footer styling
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(24, 28, 50); // Brand primary color (#181C32)
    doc.text(title, 14, 15);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(126, 130, 153); // Muted secondary text
    doc.text(`Generated on: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, 14, 20);

    // Auto-table plugin
    doc.autoTable({
      head: [headers],
      body: data,
      startY: 25,
      theme: 'striped',
      headStyles: {
        fillColor: [24, 28, 50], // Deep charcoal
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [63, 66, 84],
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { top: 25, right: 14, bottom: 15, left: 14 },
      didDrawPage: (dataPage) => {
        // Page Number Footer
        const str = `Page ${doc.internal.getNumberOfPages()} of ${totalPagesExp}`;
        doc.setFontSize(8);
        doc.setTextColor(161, 165, 183);
        doc.text(str, dataPage.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    if (typeof doc.putTotalPages === 'function') {
      doc.putTotalPages(totalPagesExp);
    }

    doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF file:', error);
  }
};
