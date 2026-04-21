const fs = require('fs');
const path = require('path');

// THE NUCLEAR DISCOVERY SCRIPT
// This script finds the backend entry point no matter where DigitalOcean puts it.

const possiblePaths = [
    path.join(__dirname, 'apps', 'backend', 'dist', 'apps', 'backend', 'src', 'main.js'),
    path.join(__dirname, 'apps', 'backend', 'dist', 'src', 'main.js'),
    path.join(__dirname, 'apps', 'backend', 'dist', 'main.js'),
    path.join(__dirname, 'dist', 'main.js')
];

console.log('--- NUCLEAR DISCOVERY STARTING ---');
console.log('Scanning for entry point...');

let foundPath = null;

for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        foundPath = p;
        break;
    }
}

if (foundPath) {
    console.log(`--- NUCLEAR DISCOVERY: FOUND ENTRY POINT AT ${foundPath} ---`);
    console.log('Launching BLITZR-PRIME Backend...');
    require(foundPath);
} else {
    console.error('❌ FATAL ERROR: Deployment failed to find the application entry point.');
    console.error('Searched locations:');
    possiblePaths.forEach(p => console.error(`  - ${p}`));
    process.exit(1);
}
