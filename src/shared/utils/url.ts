/**
 * Appends a query parameter to a URL, handling existing parameters correctly
 */
export function appendQueryParam(
  url: string,
  key: string,
  value: string,
): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${key}=${value}`;
}

/**
 * Removes a specific query parameter from a URL while preserving others
 */
export function removeQueryParam(url: string, paramToRemove: string): string {
  const [base, query] = url.split('?');
  if (!query) {
    return base;
  }

  const params = query
    .split('&')
    .filter((param) => !param.startsWith(`${paramToRemove}=`));
  return params.length ? `${base}?${params.join('&')}` : base;
}
