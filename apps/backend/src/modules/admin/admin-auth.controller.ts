import { Controller, Post, Get, Body, Query, ForbiddenException } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { DataSource } from 'typeorm';

@Controller('admin')
export class AdminAuthController {
    constructor(
        private readonly adminAuthService: AdminAuthService,
        private readonly dataSource: DataSource,
    ) { }

    @Post('login')
    async login(@Body() body: { email: string; password: string }) {
        return this.adminAuthService.login(body.email, body.password);
    }

    /**
     * ────────────────────────────────────────────────────────────────
     * TEMPORARY HOTFIX — DELETE AFTER USE
     * Reassigns priyanshuprasad@iift.edu to the correct IIFT Kakinada silo.
     *
     * Usage: GET /admin/hotfix/iift-kakinada?key=blitzr-iift-fix-2026
     * ────────────────────────────────────────────────────────────────
     */
    @Get('hotfix/iift-kakinada')
    async fixIIFTKakinadaSilo(@Query('key') key: string) {
        if (key !== 'blitzr-iift-fix-2026') {
            throw new ForbiddenException('Invalid key');
        }

        const TARGET_EMAIL = 'priyanshuprasad@iift.edu';

        // 1. Find all IIFT institutions
        const iiftInsts = await this.dataSource.query(
            `SELECT institution_id, name, short_code FROM institutions WHERE email_domain = 'iift.edu' ORDER BY name`
        );

        // 2. Find the canonical IIFT Kakinada institution
        const canonical = iiftInsts.find((i: any) =>
            i.name.toLowerCase().includes('kakinada')
        );

        if (!canonical) {
            return {
                status: 'ERROR',
                message: 'Could not find IIFT Kakinada institution in DB',
                allIIFTInstitutions: iiftInsts,
            };
        }

        // 3. Find the user
        const userRes = await this.dataSource.query(
            `SELECT user_id, email, institution_id, college_domain FROM users WHERE email = $1`,
            [TARGET_EMAIL]
        );

        if (!userRes.length) {
            return { status: 'ERROR', message: `User ${TARGET_EMAIL} not found in database` };
        }

        const user = userRes[0];

        if (user.institution_id === canonical.institution_id) {
            return {
                status: 'ALREADY_CORRECT',
                message: 'User is already in the correct IIFT Kakinada silo. No action needed.',
                user,
                canonical,
            };
        }

        const wrongInstitutionId = user.institution_id;

        // 4. Apply the fix
        await this.dataSource.query(
            `UPDATE users SET institution_id = $1, college_domain = $2, updated_at = NOW() WHERE email = $3`,
            [canonical.institution_id, canonical.short_code, TARGET_EMAIL]
        );

        // 5. Check if the old silo is now empty
        const remaining = await this.dataSource.query(
            `SELECT COUNT(*) as count FROM users WHERE institution_id = $1`,
            [wrongInstitutionId]
        );
        const remainingCount = parseInt(remaining[0].count, 10);

        return {
            status: 'FIXED ✅',
            message: `priyanshuprasad@iift.edu has been moved to the IIFT Kakinada silo.`,
            movedTo: canonical,
            previousInstitutionId: wrongInstitutionId,
            usersStillInOldSilo: remainingCount,
            nextStep: remainingCount === 0
                ? `Old silo is now EMPTY. Safe to purge.`
                : `Old silo still has ${remainingCount} other user(s). Not purged.`,
            reminder: '⚠️  DELETE this hotfix endpoint from admin-auth.controller.ts now!',
        };
    }
}
