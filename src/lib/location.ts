/**
 * Normalizes location names (village, block, district, state) to consistent title casing.
 * e.g., "kakinada" -> "Kakinada", "KAKINADA" -> "Kakinada", "kakinada rural" -> "Kakinada Rural"
 */
export function normalizeLocation(name: string | null | undefined): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Normalizes location names and returns null if empty/falsy.
 */
export function normalizeLocationNullable(name: string | null | undefined): string | null {
  const normalized = normalizeLocation(name);
  return normalized || null;
}
