# Funnel Builder API

A production-ready Express TypeScript application with CloudFlare integration, Redis caching, and comprehensive testing.

## Features

- **User Authentication** - JWT-based auth with bcrypt password hashing
- **Funnel Management** - Create and manage marketing funnels with pages
- **Domain Management** - Custom domains and subdomains with CloudFlare integration
- **Page Management** - Ordered pages with content and linking IDs
- **CloudFlare Integration** - Automatic DNS management and SSL certificates
- **Redis Caching** - Performance optimization with intelligent caching
- **Rate Limiting** - Built-in protection against abuse
- **Comprehensive Testing** - Unit, integration, and controller tests
- **Production Ready** - Error handling, logging, and graceful shutdown

## Architecture

- **Services Layer** - Business logic and data access
- **Controllers Layer** - Request/response handling
- **Routes Layer** - RESTful API endpoints
- **Middleware** - Authentication and validation
- **Types** - TypeScript interfaces and enums

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database**

   ```bash
   npm run db:migrate
   npm run db:generate
   ```

4. **Configure CloudFlare**
   - Get API token from CloudFlare dashboard
   - Add zone ID for your main domain
   - Configure SaaS target domain

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Server
PORT=4444
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key

# CloudFlare Configuration
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_ZONE_ID=your-cloudflare-zone-id
CLOUDFLARE_SAAS_TARGET=fallback.digitalsite.ai
PLATFORM_MAIN_DOMAIN=digitalsite.ai
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `DELETE /api/users/account` - Delete account

### Funnels

- `POST /api/funnels` - Create funnel
- `GET /api/funnels` - Get user funnels
- `GET /api/funnels/:id` - Get specific funnel
- `PUT /api/funnels/:id` - Update funnel
- `DELETE /api/funnels/:id` - Delete funnel

### Pages

- `POST /api/pages/funnels/:funnelId/pages` - Create page
- `GET /api/pages/funnels/:funnelId/pages` - Get funnel pages
- `GET /api/pages/:id` - Get page
- `PUT /api/pages/:id` - Update page
- `DELETE /api/pages/:id` - Delete page
- `PUT /api/pages/funnels/:funnelId/pages/reorder` - Reorder pages
- `GET /api/pages/link/:linkingId` - Public page access

### Domains

- `POST /api/domains/custom` - Create custom domain
- `POST /api/domains/subdomain` - Create subdomain
- `GET /api/domains` - Get user domains
- `GET /api/domains/:id` - Get specific domain
- `POST /api/domains/:id/verify` - Verify domain
- `DELETE /api/domains/:id` - Delete domain
- `GET /api/domains/:id/verification` - Get DNS instructions
- `POST /api/domains/:domainId/funnels/:funnelId/link` - Link funnel to domain
- `DELETE /api/domains/:domainId/funnels/:funnelId/link` - Unlink funnel
- `GET /api/domains/public/:hostname/funnels/:funnelId` - Public funnel access

## CloudFlare Integration

### Custom Domains

1. User provides hostname (e.g., `www.example.com`)
2. System creates CloudFlare custom hostname
3. Returns DNS instructions for user's domain provider
4. User adds TXT record for ownership verification
5. User adds CNAME record for traffic routing
6. System monitors verification status
7. SSL certificate auto-issued when verified

### Subdomains

1. User provides subdomain name (e.g., `mystore`)
2. System creates `mystore.digitalsite.ai`
3. CloudFlare A record created automatically
4. Subdomain immediately active with SSL

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npm run db:migrate
npm run db:generate
npm run db:studio
```

## Docker

```bash
# Build and run with Docker Compose
docker-compose up --build

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- User ownership verification for all operations
- CloudFlare DDoS protection and WAF
- Automatic SSL certificate management

## Production Considerations

- Set strong JWT secret
- Configure CloudFlare properly
- Set up monitoring and logging
- Configure rate limiting
- Set up database backups
- Use environment-specific configurations
