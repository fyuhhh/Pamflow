const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('d:\\Cloning OPTERA\\(Versi 2.1 - 20250804) Manual Book ASETA ESSENTIAL - Client (Website Simple).pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('output.txt', data.text);
    console.log('PDF parsed and saved to output.txt');
}).catch(err => {
    console.error('Error parsing PDF:', err);
});
