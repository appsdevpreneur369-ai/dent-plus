// Pure rules for the auto-opening booking popup (unit-tested).

export type PopupConfig = {
  enabled: boolean;
  delaySeconds: number;
  oncePerSession: boolean;
  showOnMobile: boolean;
  excludedPaths: string[];
};

/** What happened this browsing session (sessionStorage). Any value stops a second auto-open when oncePerSession. */
export type PopupSessionState = 'closed' | 'opened' | 'booked' | null;

export function normalizePath(pathname: string): string {
  const p = (pathname || '/').split(/[?#]/)[0];
  return p.length > 1 ? p.replace(/\/+$/, '') : p;
}

export function isExcludedPath(pathname: string, excluded: string[]): boolean {
  const p = normalizePath(pathname);
  return excluded.some((e) => p === e || p.startsWith(`${e}/`));
}

export type AutoOpenInput = {
  config: PopupConfig;
  pathname: string;
  isMobile: boolean;
  sessionState: PopupSessionState;
  /** Already shown/closed during this page's lifetime (applies even when oncePerSession is false). */
  shownThisPage: boolean;
};

export function canAutoOpen({ config, pathname, isMobile, sessionState, shownThisPage }: AutoOpenInput): boolean {
  if (!config.enabled) return false;
  if (shownThisPage) return false;
  if (isExcludedPath(pathname, config.excludedPaths)) return false;
  if (isMobile && !config.showOnMobile) return false;
  if (sessionState === 'booked') return false;
  if (config.oncePerSession && sessionState !== null) return false;
  return true;
}

export const autoOpenDelayMs = (config: PopupConfig) => Math.max(1, config.delaySeconds) * 1000;
