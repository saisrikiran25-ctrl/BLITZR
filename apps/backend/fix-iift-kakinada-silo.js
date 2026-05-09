/**
 * SURGICAL FIX: IIFT Kakinada Silo Reassignment
 * 
 * Problem: priyanshuprasad@iift.edu selected "IIFT Kakinada" during signup but was
 * routed into a new blank institution silo instead of the existing IIFT Kakinada one.
 * 
 * This script:
 *   1. Audits all iift.edu institutions in the DB.
 *   2. Identifies the canonical IIFT Kakinada institution_id.
 *   3. Finds what institution Priyansha was assigned to.
 *   4. Reassigns Priyansha to the correct IIFT Kakinada institution_id.
 *   5. Optionally purges the orphan/blank institution row if it was a ghost silo
 *      with no other users.
 * 
 * Run with:
 *   $env:DATABASE_URL="<your_production_db_url>"; node fix-iift-kakinada-silo.js
 */

'use strict';

const { Client } = require('pg');

const TARGET_EMAIL = process.argv[2] || 'priyanshuprasad_ipm25@iift.edu';
const TARGET_DOMAIN = TARGET_EMAIL.split('@')[1];
const TARGET_CAMPUS_NAME = 'IIFT Kakinada'; // The canonical institution name as stored in the DB

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('\n❌ ERROR: DATABASE_URL environment variable is not set.');
    console.error('   Run: $env:DATABASE_URL="<your_prod_db_url>"; node fix-iift-kakinada-silo.js\n');
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for DigitalOcean managed databases
});

async function run() {
    await client.connect();
    console.log('✅ Connected to production database.\n');

    try {
        // ─── STEP 1: Audit all iift.edu institutions ────────────────────────────
        console.log('══════════════════════════════════════════════════════════');
        console.log('STEP 1 — All institutions for iift.edu:');
        console.log('══════════════════════════════════════════════════════════');
        const allIIFT = await client.query(
            `SELECT institution_id, name, short_code, email_domain, verified
             FROM institutions
             WHERE email_domain = $1
             ORDER BY name`,
            [TARGET_DOMAIN]
        );
        console.table(allIIFT.rows);

        if (allIIFT.rows.length === 0) {
            console.error(`❌ FATAL: No institutions found for domain "${TARGET_DOMAIN}". Check your institutions table.`);
            return;
        }

        console.log('\nSTEP 1.5 - User distribution across IIFT campuses:');
        console.log('====================================================');
        const distributionRes = await client.query(`
            SELECT i.name, i.institution_id, COUNT(u.user_id) as user_count 
            FROM institutions i 
            LEFT JOIN users u ON u.institution_id = i.institution_id 
            WHERE i.email_domain = 'iift.edu' 
            GROUP BY i.name, i.institution_id
        `);
        console.table(distributionRes.rows);

        // ─── STEP 2: Find the canonical IIFT Kakinada institution ───────────────
        console.log('\nSTEP 2 - Finding canonical IIFT Kakinada institution...');
        
        // Try exact name match first, then partial
        let canonicalInst = allIIFT.rows.find(r =>
            r.name.toLowerCase().includes('kakinada')
        );

        if (!canonicalInst) {
            console.error(`❌ ERROR: Could not find an institution with "Kakinada" in the name for domain ${TARGET_DOMAIN}.`);
            console.error('   Available institutions listed above. Check names and retry.');
            return;
        }

        console.log(`✅ Canonical IIFT Kakinada institution found:`);
        console.log(`   ID:         ${canonicalInst.institution_id}`);
        console.log(`   Name:       ${canonicalInst.name}`);
        console.log(`   Short Code: ${canonicalInst.short_code}`);
        console.log(`   Verified:   ${canonicalInst.verified}`);

        // ─── STEP 3: Find Priyansha's current state ──────────────────────────────
        console.log(`\nSTEP 3 — Fetching user: ${TARGET_EMAIL}`);
        const userRes = await client.query(
            `SELECT u.user_id, u.email, u.username, u.institution_id, u.college_domain,
                    i.name AS current_institution_name, i.short_code AS current_short_code
             FROM users u
             LEFT JOIN institutions i ON u.institution_id = i.institution_id
             WHERE u.email = $1`,
            [TARGET_EMAIL]
        );

        if (userRes.rows.length === 0) {
            console.error(`❌ ERROR: User "${TARGET_EMAIL}" not found in the database.`);
            return;
        }

        const user = userRes.rows[0];
        console.log('   Current user state:');
        console.table([user]);

        if (user.institution_id === canonicalInst.institution_id) {
            console.log('\n✅ User is ALREADY in the correct IIFT Kakinada silo. No fix needed.');
            return;
        }

        const wrongInstitutionId = user.institution_id;

        // ─── STEP 4: Count how many users are in the wrong institution ───────────
        console.log(`\nSTEP 4 — Auditing the wrong institution silo (${wrongInstitutionId})...`);
        const wrongInstUsers = await client.query(
            `SELECT u.user_id, u.email, u.username
             FROM users u
             WHERE u.institution_id = $1`,
            [wrongInstitutionId]
        );
        console.log(`   Users currently in this wrong silo: ${wrongInstUsers.rows.length}`);
        console.table(wrongInstUsers.rows);

        // ─── STEP 5: Apply the fix ────────────────────────────────────────────────
        console.log(`\nSTEP 5 — Reassigning ${TARGET_EMAIL} to IIFT Kakinada silo...`);
        
        await client.query('BEGIN');
        try {
            // Update the user's institution_id and college_domain to the canonical one
            const updateRes = await client.query(
                `UPDATE users
                 SET institution_id = $1,
                     college_domain  = $2,
                     updated_at      = NOW()
                 WHERE email = $3
                 RETURNING user_id, email, institution_id, college_domain`,
                [canonicalInst.institution_id, canonicalInst.short_code, TARGET_EMAIL]
            );
            console.log('   ✅ User updated:');
            console.table(updateRes.rows);

            // ─── STEP 6: Optionally purge the orphan ghost institution ───────────
            // Only delete if the wrong institution had ONLY this one user AND
            // the institution is different from all canonical ones.
            if (wrongInstitutionId && wrongInstitutionId !== canonicalInst.institution_id) {
                const remainingUsersInWrong = await client.query(
                    `SELECT COUNT(*) AS count FROM users WHERE institution_id = $1`,
                    [wrongInstitutionId]
                );
                const remaining = parseInt(remainingUsersInWrong.rows[0].count, 10);

                if (remaining === 0) {
                    // Safe to check details of this institution
                    const wrongInstDetails = await client.query(
                        `SELECT institution_id, name, short_code, verified FROM institutions WHERE institution_id = $1`,
                        [wrongInstitutionId]
                    );
                    
                    if (wrongInstDetails.rows.length > 0) {
                        const wrongInst = wrongInstDetails.rows[0];
                        console.log(`\nSTEP 6 — Ghost silo detected (0 users remaining):`);
                        console.table([wrongInst]);
                        console.log(`   ⚠️  NOT auto-deleting to preserve audit trail. Run this manually to purge:`);
                        console.log(`       DELETE FROM institutions WHERE institution_id = '${wrongInstitutionId}';`);
                    }
                } else {
                    console.log(`\nSTEP 6 — ${remaining} other user(s) still in institution ${wrongInstitutionId}. NOT purging.`);
                }
            }

            await client.query('COMMIT');
            console.log('\n✅✅✅ FIX COMPLETE. priyanshuprasad@iift.edu is now in the IIFT Kakinada silo. ✅✅✅\n');

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('\n❌ ROLLBACK — Error during fix:', err.message);
            throw err;
        }

        // ─── FINAL VERIFICATION ───────────────────────────────────────────────────
        console.log('FINAL VERIFICATION — User state after fix:');
        const verifyRes = await client.query(
            `SELECT u.user_id, u.email, u.username, u.institution_id, u.college_domain,
                    i.name AS institution_name, i.short_code
             FROM users u
             LEFT JOIN institutions i ON u.institution_id = i.institution_id
             WHERE u.email = $1`,
            [TARGET_EMAIL]
        );
        console.table(verifyRes.rows);

    } finally {
        await client.end();
        console.log('🔌 Disconnected from database.');
    }
}

run().catch(err => {
    console.error('FATAL:', err.message);
    process.exit(1);
});
