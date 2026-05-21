const ExcelJS = require('exceljs');

async function inspectRows() {
  const filePath = 'd:\\Cloning OPTERA\\ASET 2024, 2025, 2026.xlsx';
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    console.log('--- Printing Rows 90 to 110 ---');
    for (let r = 90; r <= 110; r++) {
      const row = worksheet.getRow(r);
      const name = row.getCell(2).value; // Nama Aset
      console.log(`Row ${r}: "${name}"`);
    }
  } catch (err) {
    console.error(err);
  }
}

inspectRows();
