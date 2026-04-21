const fs = require('fs');
const path = require('path');

// THE RESURRECTION DISCOVERY SCRIPT
// This script recursively scans the entire server to find the real backend entry point.

console.log('--- RESURRECTION DISCOVERY STARTING ---');
const rootDir = __dirname;
console.log(`Scanning from: ${rootDir}`);

function findEntryPoint(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Skip node_modules and common ignore folders
            if (file === 'node_modules' || file === '.git' || file === '.next') continue;
            
            const found = findEntryPoint(fullPath);
            if (found) return found;
        } else if (file === 'main.js') {
            // We are looking for a main.js that is inside a 'dist' folder
            // and is definitely part of the apps/backend build
            if (fullPath.includes('dist') && (fullPath.includes('apps/backend') || fullPath.includes('apps\\backend'))) {
                return fullPath;
            }
        }
    }
    return null;
}

try {
    const foundPath = findEntryPoint(rootDir);

    if (foundPath) {
        console.log(`--- RESURRECTION: FOUND ENTRY POINT AT ${foundPath} ---`);
        console.log('Launching BLITZR-PRIME Backend...');
        require(foundPath);
    } else {
        console.error('❌ FATAL ERROR: Resurrection scanner failed to find the entry point.');
        console.log('--- SERVER BLUEPRINT (DIAGNOSTICS) ---');
        // Simple 2-level deep print to see where folders are
        const topLevel = fs.readdirSync(rootDir);
        topLevel.forEach(f => {
            console.log(`[DIR] /${f}`);
            try {
               if (fs.statSync(path.join(rootDir, f)).isDirectory()) {
                   fs.readdirSync(path.join(rootDir, f)).forEach(sub => console.log(`  |-- /${sub}`));
               }
            } catch(e) {}
        });
        process.exit(1);
    }
} catch (err) {
    console.error('CRITICAL SYSTEM FAILURE during resurrection scan:', err);
    process.exit(1);
}
