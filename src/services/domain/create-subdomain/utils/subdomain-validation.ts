export function validateSubdomainName(subdomain: string): string {
  // Normalize and trim
  const normalized = subdomain.toLowerCase().trim();

  // Check length (3-63 characters for DNS label)
  if (normalized.length < 3 || normalized.length > 63) {
    throw new Error("Subdomain must be between 3 and 63 characters");
  }

  // Check valid characters (alphanumeric and hyphens only)
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(normalized)) {
    throw new Error(
      "Subdomain can only contain lowercase letters, numbers, and hyphens. It must start and end with a letter or number."
    );
  }

  // Check for consecutive hyphens
  if (normalized.includes("--")) {
    throw new Error("Subdomain cannot contain consecutive hyphens");
  }

  // Reserved names
  const reserved = [
    "www",
    "api",
    "app",
    "admin",
    "mail",
    "ftp",
    "localhost",
    "test",
    "staging",
    "prod",
    "production",
    "dev",
    "development",
  ];

  if (reserved.includes(normalized)) {
    throw new Error(`Subdomain '${normalized}' is reserved`);
  }

  return normalized;
}
