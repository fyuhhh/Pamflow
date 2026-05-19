const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function run() {
    let dataBuffer = fs.readFileSync('d:\\Cloning OPTERA\\(Versi 2.1 - 20250804) Manual Book ASETA ESSENTIAL - Client (Website Simple).pdf');
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();
    fs.writeFileSync('output_utf8.txt', result.text, 'utf8');
}

run().catch(console.error);
