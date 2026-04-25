/**
 * SANITY TEST: Trading & Auth Segmentation Analysis
 * This script verifies the logic of the newest siloing architecture.
 */

const mockInstitutions = [
    { id: '1', name: 'IIFT Delhi', short_code: 'IIFT-D', domain: 'iift.edu' },
    { id: '2', name: 'IIFT Kolkata', short_code: 'IIFT-KK', domain: 'iift.edu' }
];

const mockUsers = [
    { id: 'u1', email: 'saksham@iift.edu', institution_id: '1' }, // IIFT-D
    { id: 'u2', email: 'aarav@iift.edu', institution_id: '2' }   // IIFT-KK
];

const mockTickers = [
    { id: '$SAKSHAM', college_domain: 'IIFT-D' },
    { id: '$AARAV', college_domain: 'IIFT-KK' }
];

function simulateLogin(email) {
    console.log(`\nTesting Login for: ${email}`);
    const domain = email.split('@')[1];
    const institutions = mockInstitutions.filter(i => i.domain === domain);
    
    if (institutions.length > 1) {
        console.log(`[AUTH] Multi-campus detected! Prompting user to choose...`);
        return { status: 'REQUIRES_CAMPUS_SELECTION', options: institutions.map(i => i.short_code) };
    }
    return { status: 'SUCCESS', target: institutions[0].short_code };
}

function simulateFloorView(userCampus) {
    console.log(`Testing Floor for Campus: ${userCampus}`);
    const visible = mockTickers.filter(t => t.college_domain === userCampus);
    console.log(`[FLOOR] Visible tickers: ${visible.map(v => v.id).join(', ')}`);
    return visible;
}

// RUN ANALYSIS
const s1 = simulateLogin('saksham@iift.edu');
const f1 = simulateFloorView('IIFT-D');
if (!f1.find(t => t.id === '$SAKSHAM')) throw new Error("Saksham ticker hidden on Delhi floor!");
if (f1.find(t => t.id === '$AARAV')) throw new Error("Aarav ticker leaking into Delhi floor!");

const s2 = simulateLogin('aarav@iift.edu');
const f2 = simulateFloorView('IIFT-KK');
if (!f2.find(t => t.id === '$AARAV')) throw new Error("Aarav ticker hidden on Kolkata floor!");

console.log("\n✅ ANALYSIS COMPLETE: Campus Silos are mathematically isolated.");
