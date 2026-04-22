const fs = require('fs');
const path = require('path');
const Module = require('module');

// ─────────────────────────────────────────────────────────────────────
// MODULE ALIAS INJECTION
// The compiled backend requires('@blitzr/shared') which npm workspace
// symlinks normally resolve. On DigitalOcean the symlink resolution
// can fail. We intercept the require() call and redirect it to the
// copy of shared that is ALREADY compiled inside the backend's own
// dist folder — 100% reliable, no npm symlinks involved.
// ─────────────────────────────────────────────────────────────────────
const sharedPath = path.join(
    __dirname,
    'apps', 'backend', 'dist', 'packages', 'shared', 'src', 'index.js'
);

const _originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
    if (request === '@blitzr/shared' || request.startsWith('@blitzr/shared/')) {
        const subPath = request.slice('@blitzr/shared'.length);
        const resolved = path.join(
            __dirname,
            'apps', 'backend', 'dist', 'packages', 'shared', 'src',
            subPath || 'index.js'
        );
        return _originalResolve.call(this, resolved, parent, isMain, options);
    }
    return _originalResolve.call(this, request, parent, isMain, options);
};

// ─────────────────────────────────────────────────────────────────────
// ENTRY POINT LAUNCH
// ─────────────────────────────────────────────────────────────────────
const entryPoint = path.join(
    __dirname,
    'apps', 'backend', 'dist', 'apps', 'backend', 'src', 'main.js'
);

console.log('--- BLITZR DEPLOYMENT STARTING ---');

if (!fs.existsSync(sharedPath)) {
    console.error('❌ FATAL: Shared package not found at:', sharedPath);
    process.exit(1);
}
console.log('✅ @blitzr/shared aliased to:', sharedPath);

if (!fs.existsSync(entryPoint)) {
    console.error('❌ FATAL: Backend entry point not found at:', entryPoint);
    process.exit(1);
}
console.log('✅ Entry point found. Launching BLITZR-PRIME Backend...');

require(entryPoint);
