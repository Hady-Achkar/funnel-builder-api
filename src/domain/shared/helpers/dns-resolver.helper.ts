import dns from 'dns';
import {
  DNSRecordType,
  DNSRecordTypeSchema,
  DNSResolutionResult,
  DNSResolutionResultSchema
} from '../types';

class DNSResolverHelper {
  private resolver: dns.Resolver;

  constructor() {
    this.resolver = new dns.Resolver();
    // Use Cloudflare and Google DNS servers for reliability
    this.resolver.setServers(['1.1.1.1', '8.8.8.8']);
  }

  async resolveRecords(hostname: string, recordType: DNSRecordType): Promise<DNSResolutionResult> {
    return new Promise((resolve) => {
      const result: DNSResolutionResult = {
        hostname,
        recordType,
        records: [],
        success: false,
      };

      const resolveMethod = this.getResolveMethod(recordType);
      
      resolveMethod.call(this.resolver, hostname, (err: NodeJS.ErrnoException | null, records: any) => {
        if (err) {
          result.success = false;
          result.error = err.message;
        } else {
          result.success = true;
          result.records = Array.isArray(records) ? records : [records];
        }
        
        resolve(DNSResolutionResultSchema.parse(result));
      });
    });
  }

  async verifyRecord(hostname: string, recordType: DNSRecordType, expectedValue: string): Promise<boolean> {
    try {
      const result = await this.resolveRecords(hostname, recordType);
      
      if (!result.success) {
        return false;
      }

      // Check if any of the resolved records match the expected value
      return result.records.some(record => 
        record.toLowerCase() === expectedValue.toLowerCase()
      );
    } catch (error) {
      console.error(`DNS verification error for ${hostname}:`, error);
      return false;
    }
  }

  private getResolveMethod(recordType: DNSRecordType) {
    switch (recordType) {
      case 'A':
        return this.resolver.resolve4;
      case 'AAAA':
        return this.resolver.resolve6;
      case 'CNAME':
        return this.resolver.resolveCname;
      case 'TXT':
        return this.resolver.resolveTxt;
      case 'MX':
        return this.resolver.resolveMx;
      case 'NS':
        return this.resolver.resolveNs;
      default:
        throw new Error(`Unsupported DNS record type: ${recordType}`);
    }
  }

  getResolver(): dns.Resolver {
    return this.resolver;
  }
}

// Singleton instance
let dnsResolverHelper: DNSResolverHelper | null = null;

export function getDNSResolverHelper(): DNSResolverHelper {
  if (!dnsResolverHelper) {
    dnsResolverHelper = new DNSResolverHelper();
  }
  return dnsResolverHelper;
}

// Re-export types for convenience
export type { DNSRecordType, DNSResolutionResult };
export { DNSRecordTypeSchema, DNSResolutionResultSchema };