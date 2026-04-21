const fs = require('fs');
const path = require('path');

// THE CORRECT ENTRY POINT - confirmed from local build output
// TypeScript with NestJS in a monorepo outputs to: apps/backend/dist/apps/backend/src/main.js
// This is because the shared package (../../packages/shared) causes TypeScript to preserve the full path structure.

const entryPoint = path.join(__dirname, 'apps', 'backend', 'dist', 'apps', 'backend', 'src', 'main.js');

console.log('--- BLITZR DEPLOYMENT STARTING ---');
console.log(`Entry point: ${entryPoint}`);

if (fs.existsSync(entryPoint)) {
    console.log('✅ Entry point found. Launching BLITZR-PRIME Backend...');
    require(entryPoint);
} else {
    console.error('❌ FATAL: Entry point not found. The build likely failed.');
    console.error('Expected path:', entryPoint);
    
    // List the dist folder if it exists to help diagnose
    const distDir = path.join(__dirname, 'apps', 'backend', 'dist');
    if (fs.existsSync(distDir)) {
        console.log('Build output exists at:', distDir);
        const walk = (dir, depth = 0) => {
            if (depth > 4) return;
            const entries = fs.readdirSync(dir);
            entries.forEach(e => {
                const full = path.join(dir, e);
                const stat = fs.statSync(full);
                const indent = '  '.repeat(depth);
                if (stat.isDirectory()) {
                    console.log(`${indent}[dir] ${e}/`);
                    walk(full, depth + 1);
                } else {
                    console.log(`${indent}[file] ${e}`);
                }
            });
        };
        walk(distDir);
    } else {
        console.error('❌ No dist folder found at:', distDir);
        console.error('This means the build command (npm run backend:build) FAILED or was never run.');
        console.error('Check the BUILD LOGS tab (not Deploy Logs) in DigitalOcean for TypeScript compilation errors.');
    }
    
    process.exit(1);
}
