const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const pdfPath = 'C:\\Users\\Sai Kiran\\Downloads\\BLITZR\\UPDATE1.pdf';
const data = new Uint8Array(fs.readFileSync(pdfPath));

pdfjsLib.getDocument({data: data}).promise.then(async function(doc) {
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        text += '--- Page ' + i + ' ---\n' + strings.join(' ') + '\n\n';
    }
    fs.writeFileSync('C:\\Users\\Sai Kiran\\Downloads\\BLITZR\\UPDATE1_text.txt', text);
    console.log('PDF extraction successful!');
}).catch(err => {
    console.error('Extraction Error:', err);
});
