const ExcelJS = require('exceljs');
const path = require('path');

async function readAllHeaders() {
  const workbook = new ExcelJS.Workbook();
  const filePath = path.join('d:', 'Cloning OPTERA', 'Checklist NVR_Ordered.xlsx');
  
  try {
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);
    const headerRow = worksheet.getRow(1);
    
    const headers = [];
    headerRow.eachCell((cell, colNumber) => {
      headers.push(`${colNumber}: ${cell.value}`);
    });
    console.log(JSON.stringify(headers, null, 2));
  } catch (err) {
    console.error('Error reading file:', err);
  }
}

readAllHeaders();
