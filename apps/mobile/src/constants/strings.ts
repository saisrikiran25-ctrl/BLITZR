/**
 * F1: Language Reframe — Global String Replacement
 *
 * All user-facing strings use this vocabulary. Do NOT use the old trading
 * finance terminology anywhere in the UI.
 *
 * Old → New mapping (from master doc):
 *   "Buy stock"       → "Boost Score"
 *   "Sell stock"      → "Reduce Position"
 *   "trading people"  → "campus index"
 *   "your stock price"→ "your Clout Score"
 *   "shareholders"    → "backers"
 *   "IPO yourself"    → "List your Profile"
 *   "Trading Floor"   → "Clout Exchange"
 *   "stock crashed"   → "score dropped"
 *   "pump"            → "boost"
 *   "dump"            → "exit"
 */
export const Strings = {
  // Navigation tabs
  tabCloutExchange: 'Clout Exchange',
  tabArena: 'Arena',
  tabRumorFeed: 'Rumor Feed',
  tabProfile: 'Profile',

  // Trading actions (F1)
  actionBuy: 'Boost Score',
  actionSell: 'Reduce Position',
  actionListProfile: 'List your Profile',

  // Market terminology (F1)
  campusIndex: 'campus index',
  cloutScore: 'Clout Score',
  backers: 'backers',
  scoreDropped: 'score dropped',
  boost: 'boost',
  exit: 'exit',

  // TOS screen (F2)
  tosTitle: 'Before You Enter the Market',
  tosBody:
    'BLITZR is a virtual game economy. Creds and Chips are virtual game currency with zero real-world monetary value. They cannot be exchanged for real money under any circumstances.',
  tosCheckboxLabel:
    'I understand that Creds and Chips are virtual game currency with no real-world monetary value.',
  tosCta: 'Enter BLITZR',

  // Disclaimer (F3)
  disclaimer:
    'BLITZR operates exclusively with virtual credits. No real monetary value. Not a financial product.',

  // Arena (F4)
  arenaScopeMyCampus: 'MY CAMPUS',
  arenaScopeRegional: 'REGIONAL',
  arenaScopeNational: 'NATIONAL',

  // National leaderboard (F5)
  nationalTopStocks: 'NATIONAL TOP STOCKS',
  crossCampusCta: 'CROSS-CAMPUS TRADING COMING SOON',

  // Rumor feed (F6)
  factualClaimBadge: '⚠  Factual Claim — tap flag to dispute',
  disputed: 'Disputed',

  // Credibility gate (F7)
  unlockFactualClaims: 'Unlock Factual Claims',
  credibilityGateBody:
    'Make accurate Arena predictions to unlock the ability to post factual claims. Your current Credibility Score: {score}/50',
  goToArena: 'Go to Arena',
};
