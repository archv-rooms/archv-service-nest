const ALLOWED_APP_PREFIXES = ['archvroomsmobile://', 'exp+archv-rooms-mobile://'];

export function isAllowedAppUrl(url: unknown): url is string {
  return typeof url === 'string' && ALLOWED_APP_PREFIXES.some((prefix) => url.startsWith(prefix));
}

export function buildOAuthOptions(appUrl: unknown, extra: Record<string, unknown> = {}) {
  const options: Record<string, unknown> = { session: false, ...extra };

  if (isAllowedAppUrl(appUrl)) {
    options.state = Buffer.from(appUrl).toString('base64url');
  }

  return options;
}

export function readAppUrlFromState(state: unknown): string | null {
  if (!state) return null;

  try {
    const decoded = Buffer.from(String(state), 'base64url').toString();
    return isAllowedAppUrl(decoded) ? decoded : null;
  } catch (error) {
    return null;
  }
}

export function withParams(url: string, params: string) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params}`;
}
