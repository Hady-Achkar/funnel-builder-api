import psl, { ParsedDomain } from 'psl';

export function validateHostname(hostname: unknown): string {
  if (typeof hostname !== 'string') {
    throw new Error('Hostname must be a string');
  }
  const trimmed = hostname.trim().toLowerCase();
  if (!trimmed) {
    throw new Error('Hostname cannot be empty');
  }
  if (trimmed.length > 253) {
    throw new Error('Hostname exceeds maximum length of 253 characters');
  }
  const labels = trimmed.split('.');
  if (labels.length < 2) {
    throw new Error('Hostname must have at least one subdomain and a TLD');
  }
  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,}$/.test(tld)) {
    throw new Error('Invalid TLD format');
  }
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    if (!label) {
      throw new Error('Domain labels cannot be empty');
    }
    if (label.length > 63) {
      throw new Error(`Domain label "${label}" exceeds maximum length of 63 characters`);
    }
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) {
      throw new Error(`Invalid domain label: "${label}". Labels must start and end with letter/number and contain only letters, numbers or hyphens`);
    }
  }
  return trimmed;
}

export function validateSubdomain(sub: unknown): string {
  if (typeof sub !== 'string') {
    throw new Error('Subdomain must be a string');
  }
  const trimmed = sub.trim().toLowerCase();
  if (!trimmed) {
    throw new Error('Subdomain cannot be empty');
  }
  if (trimmed.length > 63) {
    throw new Error('Subdomain exceeds maximum length of 63 characters');
  }
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(trimmed)) {
    throw new Error('Invalid subdomain format. Subdomains must start and end with letter/number and contain only letters, numbers or hyphens');
  }
  const reservedNames = ['www', 'mail', 'admin', 'api', 'ftp', 'smtp', 'pop', 'ns1', 'ns2', 'cpanel', 'webmail'];
  if (reservedNames.includes(trimmed)) {
    throw new Error(`"${trimmed}" is a reserved subdomain name and cannot be used`);
  }
  return trimmed;
}

export function parseDomain(hostname: string): { subdomain?: string; domain: string; tld: string; rootDomain: string } {
  const parsed = psl.parse(hostname);
  
  if (typeof (parsed as ParsedDomain).domain !== 'string') {
    throw new Error('Invalid hostname format');
  }
  
  const { subdomain, domain, tld } = parsed as ParsedDomain;
  const rootDomain = domain!;
  
  return { 
    subdomain: subdomain || undefined, 
    domain: domain!, 
    tld: tld!, 
    rootDomain 
  };
}