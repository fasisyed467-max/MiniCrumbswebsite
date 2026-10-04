// Returns the preparation time to display, or '' when none is set.
// Empty values and leftover zero values (e.g. "0", "0 Minutes") count as "not set".
export function getPrepTime(value: unknown): string {
  const text = String(value ?? '').trim();
  if (!text || /^0+(\.0+)?(\s*[a-z]*)?$/i.test(text)) return '';
  return text;
}
