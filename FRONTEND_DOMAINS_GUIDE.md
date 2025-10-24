# Frontend Integration Guide: Complete Domains Flow

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Domain Types](#domain-types)
4. [API Endpoints](#api-endpoints)
5. [Complete Workflows](#complete-workflows)
6. [TypeScript Interfaces](#typescript-interfaces)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

---

## Overview

This guide covers the complete domain management flow for your frontend application, including:
- Creating subdomains (e.g., `mysite.mydigitalsite.io`)
- Creating custom domains (e.g., `www.example.com`)
- Verifying domain ownership
- Getting DNS setup instructions
- Connecting domains to sites/funnels
- Fetching public site data by domain

All endpoints require authentication unless specified otherwise.

---

## Authentication

All domain management endpoints (except public site fetching) require a JWT token in the `Authorization` header:

```typescript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
```

---

## Domain Types

### Subdomain
- Pattern: `{subdomain}.mydigitalsite.io`
- Automatically created and verified
- No DNS configuration needed
- Immediately active after creation

### Custom Domain
- Pattern: Any valid domain (e.g., `www.example.com`, `shop.mybrand.com`)
- Requires DNS configuration
- Multi-step verification process
- Takes time for DNS propagation

---

## API Endpoints

### 1. Create Subdomain

**Endpoint:** `POST /api/domains/create-subdomain`

**Request:**
```typescript
{
  subdomain: string;      // Lowercase, alphanumeric, hyphens allowed
  workspaceSlug: string;  // Workspace identifier
}
```

**Response:**
```typescript
{
  message: string;
  domain: {
    id: number;
    hostname: string;              // e.g., "mysite.mydigitalsite.io"
    type: "SUBDOMAIN";
    status: "ACTIVE";              // Immediately active
    sslStatus: "ACTIVE";           // SSL immediately active
    isVerified: true;
    isActive: true;
    cloudflareRecordId: string | null;
    createdAt: string;             // ISO date
    updatedAt: string;             // ISO date
  }
}
```

**Example:**
```typescript
async function createSubdomain(subdomain: string, workspaceSlug: string) {
  const response = await fetch('/api/domains/create-subdomain', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ subdomain, workspaceSlug })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Usage
const result = await createSubdomain('my-awesome-site', 'my-workspace');
console.log(result.domain.hostname); // "my-awesome-site.mydigitalsite.io"
```

**Validation Rules:**
- Subdomain must be 1-63 characters
- Only lowercase letters, numbers, and hyphens
- Cannot start or end with a hyphen
- Cannot contain consecutive hyphens (`--`)
- Must be unique across the platform

---

### 2. Create Custom Domain

**Endpoint:** `POST /api/domains/create-custom-domain`

**Request:**
```typescript
{
  hostname: string;       // Full domain (e.g., "www.example.com")
  workspaceSlug: string;  // Workspace identifier
}
```

**Response:**
```typescript
{
  message: string;
  domain: {
    id: number;
    hostname: string;              // e.g., "www.example.com"
    type: "CUSTOM_DOMAIN";
    status: "PENDING";             // Initial status
    sslStatus: null;               // SSL not yet configured
    isVerified: false;
    isActive: false;
    verificationToken: string | null;
    customHostnameId: string;
    ownershipVerification: {
      type: string;
      name: string;
      value: string;
    };
    cnameVerificationInstructions: any;
    createdAt: string;
    updatedAt: string;
  };
  setupInstructions: {
    records: Array<{
      type: "TXT" | "CNAME";
      name: string;               // DNS record name
      value: string;              // DNS record value
      purpose: string;            // Human-readable description
    }>;
  };
}
```

**Example:**
```typescript
async function createCustomDomain(hostname: string, workspaceSlug: string) {
  const response = await fetch('/api/domains/create-custom-domain', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ hostname, workspaceSlug })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Usage
const result = await createCustomDomain('www.example.com', 'my-workspace');

// Show DNS instructions to user
result.setupInstructions.records.forEach(record => {
  console.log(`Add ${record.type} record:`);
  console.log(`Name: ${record.name}`);
  console.log(`Value: ${record.value}`);
  console.log(`Purpose: ${record.purpose}`);
});
```

**Validation Rules:**
- Must be a valid hostname format
- Cannot use reserved domains
- Must be unique across the platform

---

### 3. Get DNS Instructions

**Endpoint:** `GET /api/domains/dns-instructions/:id`

**URL Parameters:**
- `id` (number): Domain ID

**Response:**
```typescript
{
  domain: {
    id: number;
    hostname: string;
    type: "SUBDOMAIN" | "CUSTOM_DOMAIN";
    status: "PENDING" | "VERIFIED" | "ACTIVE" | "FAILED" | "SUSPENDED";
    sslStatus: "PENDING" | "ACTIVE" | "ERROR" | "EXPIRED" | null;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
  };
  dnsRecords: {
    ownership?: {
      type: "TXT" | "CNAME" | "A";
      name: string;
      value: string;
      purpose: string;
      status: "pending" | "verified" | "active" | "failed";
      required: boolean;
    };
    traffic?: {
      type: "TXT" | "CNAME" | "A";
      name: string;
      value: string;
      purpose: string;
      status: "pending" | "verified" | "active" | "failed";
      required: boolean;
    };
    ssl?: Array<{
      type: "TXT" | "CNAME" | "A";
      name: string;
      value: string;
      purpose: string;
      status: "pending" | "verified" | "active" | "failed";
      required: boolean;
    }>;
  };
  instructions: string;        // Human-readable instructions
  totalRecords: number;        // Total DNS records needed
  completedRecords: number;    // Records already verified
  progress: {
    percentage: number;        // 0-100
    nextStep?: string;         // What to do next
  };
}
```

**Example:**
```typescript
async function getDNSInstructions(domainId: number) {
  const response = await fetch(`/api/domains/dns-instructions/${domainId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Usage
const instructions = await getDNSInstructions(123);

console.log(`Progress: ${instructions.progress.percentage}%`);
console.log(`Completed: ${instructions.completedRecords}/${instructions.totalRecords} records`);

if (instructions.progress.nextStep) {
  console.log(`Next: ${instructions.progress.nextStep}`);
}

// Display DNS records to user
if (instructions.dnsRecords.ownership) {
  const record = instructions.dnsRecords.ownership;
  console.log(`Ownership Record (${record.status}):`);
  console.log(`Type: ${record.type}`);
  console.log(`Name: ${record.name}`);
  console.log(`Value: ${record.value}`);
}
```

---

### 4. Verify Domain

**Endpoint:** `POST /api/domains/verify/:id`

**URL Parameters:**
- `id` (number): Domain ID

**Request:** Empty body `{}`

**Response:**
```typescript
{
  message: string;               // Status message
  domain: {
    id: number;
    hostname: string;
    type: "SUBDOMAIN" | "CUSTOM_DOMAIN";
    status: "PENDING" | "VERIFIED" | "ACTIVE" | "FAILED";
    sslStatus: "PENDING" | "ACTIVE" | "ERROR" | "EXPIRED" | null;
    isVerified: boolean;
    isActive: boolean;
    verificationToken: string | null;
    customHostnameId: string | null;
    overallStatus: string | null;
    createdAt: string;
    updatedAt: string;
  };
  isFullyActive: boolean;        // true if domain is fully ready
  nextStep: {                    // SSL validation record (if needed)
    txt_name?: string;
    txt_value?: string;
    http_url?: string;
    http_body?: string;
    cname_target?: string;
    cname_name?: string;
  } | null;
}
```

**Example:**
```typescript
async function verifyDomain(domainId: number) {
  const response = await fetch(`/api/domains/verify/${domainId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Usage - Poll until domain is active
async function waitForDomainActivation(domainId: number, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await verifyDomain(domainId);

    console.log(`Attempt ${i + 1}: ${result.message}`);

    if (result.isFullyActive) {
      console.log('Domain is fully active!');
      return result;
    }

    if (result.domain.status === 'FAILED') {
      throw new Error('Domain verification failed');
    }

    // Wait 5 seconds before next attempt
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new Error('Domain verification timeout');
}
```

---

### 5. Get All Domains

**Endpoint:** `GET /api/domains/:workspaceSlug`

**URL Parameters:**
- `workspaceSlug` (string): Workspace identifier

**Query Parameters:**
```typescript
{
  page?: number;          // Default: 1
  limit?: number;         // Default: 10, Max: 100
  search?: string;        // Search by hostname
  sortBy?: "createdAt" | "hostname" | "status" | "type";  // Default: "createdAt"
  sortOrder?: "asc" | "desc";  // Default: "desc"
  filters?: {
    status?: "PENDING" | "VERIFIED" | "ACTIVE" | "FAILED" | "SUSPENDED";
    type?: "SUBDOMAIN" | "CUSTOM_DOMAIN";
    hostname?: string;
  };
}
```

**Response:**
```typescript
{
  domains: Array<{
    id: number;
    hostname: string;
    type: "SUBDOMAIN" | "CUSTOM_DOMAIN";
    status: "PENDING" | "VERIFIED" | "ACTIVE" | "FAILED" | "SUSPENDED";
    workspaceId: number;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    status?: string;
    type?: string;
    hostname?: string;
  };
}
```

**Example:**
```typescript
async function getAllDomains(
  workspaceSlug: string,
  options?: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: { status?: string; type?: string; };
  }
) {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.search) params.append('search', options.search);
  if (options?.filters?.status) params.append('filters[status]', options.filters.status);
  if (options?.filters?.type) params.append('filters[type]', options.filters.type);

  const response = await fetch(
    `/api/domains/${workspaceSlug}?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Usage
const result = await getAllDomains('my-workspace', {
  page: 1,
  limit: 20,
  filters: { status: 'ACTIVE' }
});

console.log(`Found ${result.pagination.total} domains`);
result.domains.forEach(domain => {
  console.log(`${domain.hostname} - ${domain.status}`);
});
```

---

### 6. Connect Domain to Funnel

**Endpoint:** `POST /api/domain-funnel/connect`

**Request:**
```typescript
{
  funnelId: number;      // Site/Funnel ID
  domainId: number;      // Domain ID
}
```

**Response:**
```typescript
{
  message: string;       // Success message
}
```

**Example:**
```typescript
async function connectDomainToFunnel(funnelId: number, domainId: number) {
  const response = await fetch('/api/domain-funnel/connect', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ funnelId, domainId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Usage
const result = await connectDomainToFunnel(456, 123);
console.log(result.message); // "Domain connected successfully"
```

**Requirements:**
- Domain must be ACTIVE
- Domain must be in the same workspace as the funnel
- User must have CONNECT_DOMAINS permission

---

### 7. Get Domain Connections

**Endpoint:** `GET /api/domain-funnel/connections/:workspaceSlug`

**URL Parameters:**
- `workspaceSlug` (string): Workspace identifier

**Response:**
```typescript
{
  connections: Array<{
    id: number;
    domainId: number;
    funnelId: number;
    isActive: boolean;
    createdAt: string;
    domain: {
      id: number;
      hostname: string;
      type: string;
      status: string;
    };
    funnel: {
      id: number;
      name: string;
      slug: string;
      status: string;
    };
  }>;
}
```

**Example:**
```typescript
async function getDomainConnections(workspaceSlug: string) {
  const response = await fetch(
    `/api/domain-funnel/connections/${workspaceSlug}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Usage
const connections = await getDomainConnections('my-workspace');
connections.connections.forEach(conn => {
  console.log(`${conn.domain.hostname} → ${conn.funnel.name}`);
});
```

---

### 8. Get Funnel Connection

**Endpoint:** `GET /api/domain-funnel/:funnelId/connection`

**URL Parameters:**
- `funnelId` (number): Funnel ID

**Response:**
```typescript
{
  connection: {
    id: number;
    domainId: number;
    funnelId: number;
    isActive: boolean;
    createdAt: string;
    domain: {
      id: number;
      hostname: string;
      type: string;
      status: string;
    };
  } | null;
}
```

**Example:**
```typescript
async function getFunnelConnection(funnelId: number) {
  const response = await fetch(
    `/api/domain-funnel/${funnelId}/connection`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Usage
const { connection } = await getFunnelConnection(456);
if (connection) {
  console.log(`Connected to: ${connection.domain.hostname}`);
} else {
  console.log('No domain connected');
}
```

---

### 9. Get Public Site by Domain

**Endpoint:** `GET /api/sites/public`

**Query Parameters:**
```typescript
{
  hostname: string;      // Full domain hostname
}
```

**Authentication:** NOT REQUIRED (Public endpoint)

**Response:**
```typescript
{
  site: {
    id: number;
    name: string;
    slug: string;
    status: "LIVE" | "SHARED";
    workspaceId: number;
    createdAt: string;
    updatedAt: string;
    pages: Array<{
      id: number;
      name: string;
      linkingId: string | null;
      content: string | null;        // JSON string
      order: number;
      type: "PAGE" | "RESULT";
      seoTitle: string | null;
      seoDescription: string | null;
      seoKeywords: string | null;
    }>;
    settings: {
      favicon: string | null;
      language: string | null;
      passwordProtected: boolean;
      socialPreview: {
        title: string | null;
        description: string | null;
        image: string | null;
      };
    };
    customTheme: {
      primaryColor: string;
      secondaryColor: string;
      fontFamily: string;
      backgroundColor: string;
      textColor: string;
      buttonColor: string;
      buttonTextColor: string;
      borderColor: string;
      optionColor: string;
      borderRadius: string;
    } | null;
  };
}
```

**Example:**
```typescript
async function getPublicSite(hostname: string) {
  const response = await fetch(
    `/api/sites/public?hostname=${encodeURIComponent(hostname)}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Usage - NO AUTH TOKEN NEEDED
const site = await getPublicSite('mysite.mydigitalsite.io');

console.log(`Site: ${site.site.name}`);
console.log(`Pages: ${site.site.pages.length}`);

// Render pages
site.site.pages.forEach(page => {
  console.log(`Page ${page.order}: ${page.name}`);
  const pageContent = JSON.parse(page.content || '{}');
  // Render page content
});
```

**Error Cases:**
- `404`: Domain not found
- `404`: Domain not active
- `404`: Domain SSL not active
- `404`: No site connected to domain
- `404`: Site not found
- `403`: Site is not published (DRAFT or ARCHIVED)

---

### 10. Delete Domain

**Endpoint:** `DELETE /api/domains/:id`

**URL Parameters:**
- `id` (number): Domain ID

**Response:**
```typescript
{
  message: string;       // Success message
}
```

**Example:**
```typescript
async function deleteDomain(domainId: number) {
  const response = await fetch(`/api/domains/${domainId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Usage
const result = await deleteDomain(123);
console.log(result.message);
```

---

## Complete Workflows

### Workflow 1: Creating and Using a Subdomain

```typescript
async function setupSubdomain() {
  try {
    // Step 1: Create subdomain
    const domain = await createSubdomain('my-store', 'my-workspace');
    console.log(`✓ Created: ${domain.domain.hostname}`);

    // Step 2: Domain is immediately active - no verification needed
    console.log(`✓ Status: ${domain.domain.status}`); // "ACTIVE"

    // Step 3: Connect to funnel
    const connection = await connectDomainToFunnel(456, domain.domain.id);
    console.log(`✓ Connected to funnel`);

    // Step 4: Site is now live!
    console.log(`✓ Site live at: https://${domain.domain.hostname}`);

    return domain.domain;
  } catch (error) {
    console.error('Setup failed:', error.message);
    throw error;
  }
}
```

### Workflow 2: Creating and Verifying a Custom Domain

```typescript
async function setupCustomDomain() {
  try {
    // Step 1: Create custom domain
    const result = await createCustomDomain('www.example.com', 'my-workspace');
    const domainId = result.domain.id;

    console.log('📋 DNS Setup Instructions:');
    result.setupInstructions.records.forEach((record, i) => {
      console.log(`\nRecord ${i + 1}: ${record.purpose}`);
      console.log(`  Type:  ${record.type}`);
      console.log(`  Name:  ${record.name}`);
      console.log(`  Value: ${record.value}`);
    });

    console.log('\n⏳ Waiting for user to add DNS records...');

    // Step 2: Check DNS instructions periodically
    const checkDNS = setInterval(async () => {
      const instructions = await getDNSInstructions(domainId);
      console.log(`Progress: ${instructions.progress.percentage}%`);

      if (instructions.progress.percentage === 100) {
        clearInterval(checkDNS);
        console.log('✓ All DNS records verified');
      }
    }, 10000); // Check every 10 seconds

    // Step 3: Verify domain
    const verified = await waitForDomainActivation(domainId);
    console.log(`✓ Domain active: ${verified.domain.hostname}`);

    // Step 4: Connect to funnel
    await connectDomainToFunnel(456, domainId);
    console.log('✓ Connected to funnel');

    return verified.domain;
  } catch (error) {
    console.error('Setup failed:', error.message);
    throw error;
  }
}
```

### Workflow 3: User Journey - Domain Selection UI

```typescript
interface DomainSetupState {
  step: 'select-type' | 'configure' | 'verify' | 'connect' | 'done';
  domainType: 'subdomain' | 'custom' | null;
  domain: any | null;
  error: string | null;
}

class DomainSetupFlow {
  private state: DomainSetupState = {
    step: 'select-type',
    domainType: null,
    domain: null,
    error: null
  };

  async selectDomainType(type: 'subdomain' | 'custom') {
    this.state.domainType = type;
    this.state.step = 'configure';
  }

  async createDomain(hostname: string, workspaceSlug: string) {
    try {
      if (this.state.domainType === 'subdomain') {
        // Subdomain flow
        const result = await createSubdomain(hostname, workspaceSlug);
        this.state.domain = result.domain;
        this.state.step = 'connect'; // Skip verify step
        return result;
      } else {
        // Custom domain flow
        const result = await createCustomDomain(hostname, workspaceSlug);
        this.state.domain = result.domain;
        this.state.step = 'verify';
        return result;
      }
    } catch (error) {
      this.state.error = error.message;
      throw error;
    }
  }

  async verifyCustomDomain() {
    if (!this.state.domain) throw new Error('No domain created');

    try {
      const result = await waitForDomainActivation(this.state.domain.id);
      this.state.domain = result.domain;
      this.state.step = 'connect';
      return result;
    } catch (error) {
      this.state.error = error.message;
      throw error;
    }
  }

  async connectToFunnel(funnelId: number) {
    if (!this.state.domain) throw new Error('No domain created');

    try {
      await connectDomainToFunnel(funnelId, this.state.domain.id);
      this.state.step = 'done';
    } catch (error) {
      this.state.error = error.message;
      throw error;
    }
  }

  getState() {
    return this.state;
  }
}

// Usage in React component
function DomainSetupWizard() {
  const [flow] = useState(() => new DomainSetupFlow());
  const [state, setState] = useState(flow.getState());

  const handleCreateDomain = async (hostname: string) => {
    await flow.createDomain(hostname, 'my-workspace');
    setState(flow.getState());
  };

  const handleVerify = async () => {
    await flow.verifyCustomDomain();
    setState(flow.getState());
  };

  const handleConnect = async (funnelId: number) => {
    await flow.connectToFunnel(funnelId);
    setState(flow.getState());
  };

  // Render UI based on state.step
}
```

---

## TypeScript Interfaces

```typescript
// Domain Types
type DomainType = "SUBDOMAIN" | "CUSTOM_DOMAIN";
type DomainStatus = "PENDING" | "VERIFIED" | "ACTIVE" | "FAILED" | "SUSPENDED";
type SslStatus = "PENDING" | "ACTIVE" | "ERROR" | "EXPIRED";

// Subdomain
interface CreateSubdomainRequest {
  subdomain: string;
  workspaceSlug: string;
}

interface SubdomainResponse {
  message: string;
  domain: {
    id: number;
    hostname: string;
    type: DomainType;
    status: DomainStatus;
    sslStatus: SslStatus;
    isVerified: boolean;
    isActive: boolean;
    cloudflareRecordId: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

// Custom Domain
interface CreateCustomDomainRequest {
  hostname: string;
  workspaceSlug: string;
}

interface DNSRecord {
  type: "TXT" | "CNAME";
  name: string;
  value: string;
  purpose: string;
}

interface CustomDomainResponse {
  message: string;
  domain: {
    id: number;
    hostname: string;
    type: DomainType;
    status: DomainStatus;
    sslStatus: SslStatus | null;
    isVerified: boolean;
    isActive: boolean;
    verificationToken: string | null;
    customHostnameId: string;
    ownershipVerification: any;
    cnameVerificationInstructions: any;
    createdAt: string;
    updatedAt: string;
  };
  setupInstructions: {
    records: DNSRecord[];
  };
}

// DNS Instructions
interface DNSInstructionsResponse {
  domain: {
    id: number;
    hostname: string;
    type: DomainType;
    status: DomainStatus;
    sslStatus: SslStatus | null;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
  };
  dnsRecords: {
    ownership?: DNSRecordDetail;
    traffic?: DNSRecordDetail;
    ssl?: DNSRecordDetail[];
  };
  instructions: string;
  totalRecords: number;
  completedRecords: number;
  progress: {
    percentage: number;
    nextStep?: string;
  };
}

interface DNSRecordDetail {
  type: "TXT" | "CNAME" | "A";
  name: string;
  value: string;
  purpose: string;
  status: "pending" | "verified" | "active" | "failed";
  required: boolean;
}

// Verification
interface VerifyDomainResponse {
  message: string;
  domain: {
    id: number;
    hostname: string;
    type: DomainType;
    status: DomainStatus;
    sslStatus: SslStatus | null;
    isVerified: boolean;
    isActive: boolean;
    verificationToken: string | null;
    customHostnameId: string | null;
    overallStatus: string | null;
    createdAt: string;
    updatedAt: string;
  };
  isFullyActive: boolean;
  nextStep: {
    txt_name?: string;
    txt_value?: string;
    http_url?: string;
    http_body?: string;
    cname_target?: string;
    cname_name?: string;
  } | null;
}

// Domain List
interface GetAllDomainsResponse {
  domains: Array<{
    id: number;
    hostname: string;
    type: DomainType;
    status: DomainStatus;
    workspaceId: number;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    status?: DomainStatus;
    type?: DomainType;
    hostname?: string;
  };
}

// Connection
interface ConnectDomainRequest {
  funnelId: number;
  domainId: number;
}

interface ConnectDomainResponse {
  message: string;
}

// Public Site
interface PublicSiteResponse {
  site: {
    id: number;
    name: string;
    slug: string;
    status: string;
    workspaceId: number;
    createdAt: string;
    updatedAt: string;
    pages: Array<{
      id: number;
      name: string;
      linkingId: string | null;
      content: string | null;
      order: number;
      type: "PAGE" | "RESULT";
      seoTitle: string | null;
      seoDescription: string | null;
      seoKeywords: string | null;
    }>;
    settings: {
      favicon: string | null;
      language: string | null;
      passwordProtected: boolean;
      socialPreview: {
        title: string | null;
        description: string | null;
        image: string | null;
      };
    };
    customTheme: {
      primaryColor: string;
      secondaryColor: string;
      fontFamily: string;
      backgroundColor: string;
      textColor: string;
      buttonColor: string;
      buttonTextColor: string;
      borderColor: string;
      optionColor: string;
      borderRadius: string;
    } | null;
  };
}
```

---

## Error Handling

### Common Error Responses

All errors follow this format:

```typescript
{
  error: string;        // Error message
  errors?: any;         // Validation errors (if applicable)
  stack?: string;       // Stack trace (development only)
}
```

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (no auth token)
- `403`: Forbidden (no permission or site not published)
- `404`: Not Found (domain, funnel, etc.)
- `409`: Conflict (duplicate domain)
- `500`: Internal Server Error

### Error Handling Best Practices

```typescript
async function handleDomainOperation<T>(
  operation: () => Promise<T>,
  errorContext: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Response) {
      const errorData = await error.json();

      switch (error.status) {
        case 400:
          throw new Error(`Validation error: ${errorData.error}`);
        case 401:
          throw new Error('Please log in to continue');
        case 403:
          throw new Error('You do not have permission for this action');
        case 404:
          throw new Error(`${errorContext}: Resource not found`);
        case 409:
          throw new Error('This domain already exists');
        default:
          throw new Error(`${errorContext}: ${errorData.error}`);
      }
    }
    throw error;
  }
}

// Usage
try {
  const domain = await handleDomainOperation(
    () => createSubdomain('my-site', 'workspace'),
    'Create subdomain'
  );
} catch (error) {
  console.error(error.message);
  // Show error to user
}
```

### Specific Error Cases

#### Subdomain Creation
- `400`: Invalid subdomain format
- `409`: Subdomain already exists
- `403`: Workspace limit reached

#### Custom Domain Creation
- `400`: Invalid hostname format
- `409`: Domain already exists
- `403`: Workspace limit reached

#### Domain Verification
- `404`: Domain not found
- `400`: Domain not configured correctly
- `403`: No permission to verify

#### Domain Connection
- `404`: Domain or funnel not found
- `400`: Domain not active
- `403`: No permission to connect

#### Public Site Fetching
- `404`: Domain not found
- `404`: Domain not active
- `404`: SSL not active
- `404`: No site connected
- `404`: Site not found
- `403`: Site not published

---

## Best Practices

### 1. Polling for Domain Verification

When verifying custom domains, use exponential backoff:

```typescript
async function pollDomainVerification(
  domainId: number,
  options = {
    maxAttempts: 20,
    initialDelay: 5000,
    maxDelay: 60000
  }
) {
  let delay = options.initialDelay;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      const result = await verifyDomain(domainId);

      if (result.isFullyActive) {
        return result;
      }

      if (result.domain.status === 'FAILED') {
        throw new Error('Domain verification failed');
      }

      console.log(`Attempt ${attempt}: ${result.message}`);

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));

      // Increase delay (exponential backoff)
      delay = Math.min(delay * 1.5, options.maxDelay);
    } catch (error) {
      if (attempt === options.maxAttempts) {
        throw error;
      }
    }
  }

  throw new Error('Domain verification timeout');
}
```

### 2. Caching Domain Data

Cache domain data to reduce API calls:

```typescript
class DomainCache {
  private cache = new Map<number, { data: any; timestamp: number }>();
  private ttl = 60000; // 1 minute

  get(domainId: number) {
    const cached = this.cache.get(domainId);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(domainId);
      return null;
    }

    return cached.data;
  }

  set(domainId: number, data: any) {
    this.cache.set(domainId, { data, timestamp: Date.now() });
  }

  invalidate(domainId: number) {
    this.cache.delete(domainId);
  }

  clear() {
    this.cache.clear();
  }
}

const domainCache = new DomainCache();

async function getDomainWithCache(domainId: number) {
  const cached = domainCache.get(domainId);
  if (cached) return cached;

  const domain = await getDNSInstructions(domainId);
  domainCache.set(domainId, domain);
  return domain;
}
```

### 3. User Feedback During Setup

Provide clear feedback during domain setup:

```typescript
interface DomainSetupProgress {
  step: 'creating' | 'configuring' | 'verifying' | 'connecting' | 'done';
  message: string;
  progress: number; // 0-100
  action?: string;
}

async function setupDomainWithProgress(
  hostname: string,
  type: 'subdomain' | 'custom',
  onProgress: (progress: DomainSetupProgress) => void
) {
  try {
    // Step 1: Create
    onProgress({
      step: 'creating',
      message: 'Creating domain...',
      progress: 10
    });

    const domain = type === 'subdomain'
      ? await createSubdomain(hostname, 'workspace')
      : await createCustomDomain(hostname, 'workspace');

    // Step 2: Configure (custom domains only)
    if (type === 'custom') {
      onProgress({
        step: 'configuring',
        message: 'DNS configuration required',
        progress: 30,
        action: 'Add DNS records'
      });

      // Wait for user to configure DNS...
    }

    // Step 3: Verify (custom domains only)
    if (type === 'custom') {
      onProgress({
        step: 'verifying',
        message: 'Verifying domain...',
        progress: 60
      });

      await waitForDomainActivation(domain.domain.id);
    }

    // Step 4: Connect
    onProgress({
      step: 'connecting',
      message: 'Connecting to site...',
      progress: 90
    });

    // Connection logic...

    // Done
    onProgress({
      step: 'done',
      message: 'Domain setup complete!',
      progress: 100
    });

    return domain;
  } catch (error) {
    throw error;
  }
}
```

### 4. Real-time DNS Progress

Show real-time DNS setup progress:

```typescript
async function monitorDNSProgress(
  domainId: number,
  onUpdate: (instructions: DNSInstructionsResponse) => void
) {
  const interval = setInterval(async () => {
    try {
      const instructions = await getDNSInstructions(domainId);
      onUpdate(instructions);

      if (instructions.progress.percentage === 100) {
        clearInterval(interval);
      }
    } catch (error) {
      console.error('Failed to fetch DNS instructions:', error);
    }
  }, 10000); // Check every 10 seconds

  return () => clearInterval(interval);
}

// Usage in React
function DNSSetupMonitor({ domainId }: { domainId: number }) {
  const [instructions, setInstructions] = useState<DNSInstructionsResponse | null>(null);

  useEffect(() => {
    const cleanup = monitorDNSProgress(domainId, setInstructions);
    return cleanup;
  }, [domainId]);

  if (!instructions) return <div>Loading...</div>;

  return (
    <div>
      <h3>DNS Setup Progress: {instructions.progress.percentage}%</h3>
      <p>{instructions.completedRecords} / {instructions.totalRecords} records configured</p>

      {instructions.dnsRecords.ownership && (
        <DNSRecordCard record={instructions.dnsRecords.ownership} />
      )}

      {instructions.progress.nextStep && (
        <div className="next-step">
          <strong>Next:</strong> {instructions.progress.nextStep}
        </div>
      )}
    </div>
  );
}
```

### 5. Handling Public Site Errors

When fetching public sites, handle errors gracefully:

```typescript
async function loadPublicSite(hostname: string) {
  try {
    const site = await getPublicSite(hostname);
    return site;
  } catch (error) {
    if (error.message.includes('Domain not found')) {
      // Show 404 page
      return { error: 'not_found' };
    }

    if (error.message.includes('not published')) {
      // Show "coming soon" page
      return { error: 'not_published' };
    }

    if (error.message.includes('SSL')) {
      // Show SSL configuration page
      return { error: 'ssl_error' };
    }

    // Generic error
    return { error: 'unknown' };
  }
}
```

---

## Summary

This guide covers the complete domain management flow:

1. **Subdomain Creation**: Instant, no configuration needed
2. **Custom Domain Creation**: Multi-step process with DNS setup
3. **Domain Verification**: Automated verification with polling
4. **DNS Instructions**: Real-time progress tracking
5. **Domain Connection**: Link domains to sites/funnels
6. **Public Site Access**: Fetch published site data by domain

### Quick Reference

| Task | Endpoint | Auth Required | Time to Complete |
|------|----------|---------------|------------------|
| Create Subdomain | POST /domains/create-subdomain | Yes | Instant |
| Create Custom Domain | POST /domains/create-custom-domain | Yes | Depends on DNS |
| Verify Domain | POST /domains/verify/:id | Yes | Varies |
| Get DNS Instructions | GET /domains/dns-instructions/:id | Yes | Instant |
| Connect to Funnel | POST /domain-funnel/connect | Yes | Instant |
| Get Public Site | GET /sites/public | No | Instant |

For support or questions, please refer to the API documentation or contact the development team.
