/**
 * Strict Ledger of known Indian Universities with multi-campus presence.
 * This guarantees 100% precision in Row-Level Multi-Tenancy routing and
 * prevents isolated ghost-towns caused by user typos (e.g. "Delhi" vs "New Delhi").
 */
export declare const CAMPUS_DICTIONARY: Record<string, string[]>;
/**
 * Validates a requested campus against the strict dictionary.
 *
 * Scenario A: Domain has mapped campuses. User MUST select one of them exact-match.
 * Scenario B: Domain is unknown. User bypasses campus selection, defaults to "main".
 */
export declare function resolveCampusDomain(domain: string, requestedCampus?: string): string;
