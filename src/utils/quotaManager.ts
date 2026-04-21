export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server';
  const str = `${navigator.userAgent}_${window.screen.width}x${window.screen.height}`;
  
  // Simple djb2 hash
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
  }
  return hash.toString(16);
}

const QUOTA_KEY = 'aeth_quota_v1';

interface QuotaData {
  scans: { timestamp: number }[];
  premiumScans: { timestamp: number }[];
}

function loadQuota(): QuotaData {
  if (typeof window === 'undefined') return { scans: [], premiumScans: [] };
  try {
    const data = localStorage.getItem(QUOTA_KEY);
    return data ? JSON.parse(data) : { scans: [], premiumScans: [] };
  } catch {
    return { scans: [], premiumScans: [] };
  }
}

function saveQuota(data: QuotaData) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(QUOTA_KEY, JSON.stringify(data));
  }
}

export function checkQuota(tier: 'free' | 'premium'): { allowed: boolean, status: 'ok' | 'limit_reached' | 'rate_limited', remaining: number, resetAt?: Date } {
  const data = loadQuota();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  // 1. Hourly abuse protection
  const recentHourlyScans = tier === 'free' 
    ? data.scans.filter(s => now - s.timestamp < oneHour)
    : data.premiumScans.filter(s => now - s.timestamp < oneHour);

  if (recentHourlyScans.length >= 20) {
    return { allowed: false, status: 'rate_limited', remaining: 0 };
  }

  // 2. Tier Specific Logic
  if (tier === 'free') {
    // 3 scans per rolling 30 days
    const recent30DaysScans = data.scans.filter(s => now - s.timestamp < thirtyDays);
    if (recent30DaysScans.length >= 3) {
      const oldestScan = recent30DaysScans[0];
      const resetAt = oldestScan ? new Date(oldestScan.timestamp + thirtyDays) : new Date(now + thirtyDays);
      return { allowed: false, status: 'limit_reached', remaining: 0, resetAt };
    }
    return { allowed: true, status: 'ok', remaining: 3 - recent30DaysScans.length };
  } else {
    // Premium: Essentially unlimited, but we still track for safety (setting high limit 1000)
    const recent30DaysScans = data.premiumScans.filter(s => now - s.timestamp < thirtyDays);
    if (recent30DaysScans.length >= 1000) {
      return { allowed: false, status: 'limit_reached', remaining: 0 };
    }
    return { allowed: true, status: 'ok', remaining: 1000 - recent30DaysScans.length };
  }
}

export function recordScan(tier: 'free' | 'premium'): void {
  const data = loadQuota();
  const now = Date.now();
  if (tier === 'free') {
    data.scans.push({ timestamp: now });
  } else {
    data.premiumScans.push({ timestamp: now });
  }
  saveQuota(data);
}

export function getRemainingScans(tier: 'free' | 'premium'): number {
  return checkQuota(tier).remaining;
}

export function clearQuotaForTesting(): void {
  localStorage.removeItem(QUOTA_KEY);
}
