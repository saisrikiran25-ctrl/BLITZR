/**
 * Formatting utilities for the BLITZR frontend.
 * All monetary values displayed in monospaced font with fixed precision.
 */

/**
 * Format Creds: ₠ 400.00
 */
export function formatCreds(amount: number): string {
    return `₠ ${amount.toFixed(2)}`;
}

/**
 * Format Chips: ¤ 400.00
 */
export function formatChips(amount: number): string {
    return `¤ ${amount.toFixed(2)}`;
}

/**
 * Format price with fixed precision.
 * All prices now use exactly 2 decimal places.
 * Format: ₠ 0.25 (Prices are always CREDs)
 */
export function formatPrice(price: number): string {
    return `₠ ${price.toFixed(2)}`;
}

/**
 * Format percentage change with + sign for positive.
 */
export function formatPctChange(pct: number): string {
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
}

/**
 * Format large numbers with K/M suffixes.
 */
export function formatCompact(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toFixed(0);
}

/**
 * Format a timestamp to relative time (e.g., "2m ago").
 */
export function formatTimeAgo(timestamp: string): string {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
