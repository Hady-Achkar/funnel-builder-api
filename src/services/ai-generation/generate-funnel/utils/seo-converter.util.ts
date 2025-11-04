export function convertSeoKeywordsToString(
  keywords: string | string[] | undefined | null
): string {
  if (!keywords) return "[]";
  if (Array.isArray(keywords)) {
    // Store as JSON string to preserve array structure
    return JSON.stringify(keywords);
  }
  // If it's already a string, check if it's JSON or comma-separated
  if (typeof keywords === "string") {
    try {
      // Try parsing as JSON
      const parsed = JSON.parse(keywords);
      if (Array.isArray(parsed)) {
        return keywords; // Already valid JSON array string
      }
    } catch {
      // Not JSON, treat as comma-separated string and convert to JSON array
      const keywordsArray = keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
      return JSON.stringify(keywordsArray);
    }
  }
  return "[]";
}

export function convertSeoKeywordsToArray(keywords: string | null): string[] {
  if (!keywords) return [];

  // Try parsing as JSON first
  try {
    const parsed = JSON.parse(keywords);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Fall back to comma-separated parsing for backward compatibility
    return keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
  }

  return [];
}
