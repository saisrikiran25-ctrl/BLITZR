const fs = require('fs');

function decode(str) {
    try { return decodeURIComponent(str); } catch(e) { return unescape(str); }
}
try {
    const jsonStr = fs.readFileSync('C:\\Users\\Sai Kiran\\Downloads\\BLITZR\\UPDATE1.json', 'utf8');
    const data = JSON.parse(jsonStr);
    const text = data.Pages.map(p => 
        p.Texts.map(t => decode(t.R[0].T)).join(' ')
    ).join('\n\n--- PAGE ---\n\n');
    
    fs.writeFileSync('C:\\Users\\Sai Kiran\\Downloads\\BLITZR\\UPDATE1_parsed.txt', text);
    console.log('Successfully wrote UPDATE1_parsed.txt');
} catch (e) {
    console.error('Error parsing JSON:', e);
}
