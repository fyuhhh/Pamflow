const ExcelJS = require('exceljs');
const path = require('path');

async function readHeaders() {
  const workbook = new ExcelJS.Workbook();
  const filePath = path.join('d:', 'Cloning OPTERA', 'Checklist NVR_Ordered.xlsx');
  
  try {
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);
    const headerRow = worksheet.getRow(1);
    
    console.log('Headers found:');
    headerRow.eachCell((cell, colNumber) => {
      console.log(`${colNumber}: ${cell.value}`);
    });
  } catch (err) {
    console.error('Error reading file:', err);
  }
}

readHeaders();
