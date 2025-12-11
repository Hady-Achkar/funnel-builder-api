import psl, { ParsedDomain } from 'psl';
import {
  HostnameSchema,
  SubdomainSchema,
  DomainPartsSchema,
  DomainParts
} from '../../../../types/domain/shared';

export function validateHostname(hostname: unknown): string {
  return HostnameSchema.parse(hostname);
}

export function validateSubdomain(subdomain: unknown): string {
  return SubdomainSchema.parse(subdomain);
}

export function parseDomain(hostname: string): DomainParts {
  const parsed = psl.parse(hostname);

  if (typeof (parsed as ParsedDomain).domain !== 'string') {
    throw new Error('Invalid hostname format');
  }

  const { subdomain, domain, tld } = parsed as ParsedDomain;
  const rootDomain = domain!;

  const result = {
    subdomain: subdomain || undefined,
    domain: domain!,
    tld: tld!,
    rootDomain,
  };

  return DomainPartsSchema.parse(result);
}

// Re-export schemas and types for convenience
export { HostnameSchema, SubdomainSchema, DomainPartsSchema };
export type { DomainParts };