/**
 * Get IP addresses from Cloudflare DNS records
 * Shows all A records and their IPs for each zone
 */

import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_ZONE_ID = process.env.CF_ZONE_ID;
const WORKSPACE_ZONE_ID = process.env.WORKSPACE_ZONE_ID;

if (!CF_API_TOKEN) {
  console.error('Error: CF_API_TOKEN not found in .env');
  process.exit(1);
}

const cf = axios.create({
  baseURL: 'https://api.cloudflare.com/client/v4',
  headers: {
    'Authorization': `Bearer ${CF_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

interface DNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  proxied: boolean;
  ttl: number;
}

async function getARecords(zoneId: string, zoneName: string) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 Zone: ${zoneName}`);
    console.log(`   Zone ID: ${zoneId}`);
    console.log('='.repeat(60));

    const response = await cf.get(`/zones/${zoneId}/dns_records`, {
      params: {
        type: 'A',
        per_page: 100
      }
    });

    const records: DNSRecord[] = response.data.result;

    if (records.length === 0) {
      console.log('   No A records found.');
      return;
    }

    console.log(`\n   Found ${records.length} A record(s):\n`);

    // Group records by IP
    const ipGroups = new Map<string, string[]>();

    records.forEach(record => {
      const ip = record.content;
      if (!ipGroups.has(ip)) {
        ipGroups.set(ip, []);
      }
      ipGroups.get(ip)!.push(record.name);
    });

    // Display grouped by IP
    ipGroups.forEach((names, ip) => {
      console.log(`   IP: ${ip}`);
      names.forEach(name => {
        const proxied = records.find(r => r.name === name)?.proxied ? '🟠 Proxied' : '⚪ DNS Only';
        console.log(`      └─ ${name} (${proxied})`);
      });
      console.log('');
    });

  } catch (error: any) {
    console.error(`   ❌ Error fetching records: ${error.response?.data?.errors?.[0]?.message || error.message}`);
  }
}

async function main() {
  console.log('\n🌐 Fetching IP addresses from Cloudflare DNS records...\n');

  // Zone 1: digitalsite.app
  if (CF_ZONE_ID) {
    await getARecords(CF_ZONE_ID, 'digitalsite.app (CF_ZONE_ID)');
  } else {
    console.log('⚠️  CF_ZONE_ID not found in .env');
  }

  // Zone 2: digitalsite.io
  if (WORKSPACE_ZONE_ID) {
    await getARecords(WORKSPACE_ZONE_ID, 'digitalsite.io (WORKSPACE_ZONE_ID)');
  } else {
    console.log('⚠️  WORKSPACE_ZONE_ID not found in .env');
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Done!');
  console.log('='.repeat(60));

  console.log('\n💡 Tip: The most common IP in each zone is usually your origin server IP.\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
