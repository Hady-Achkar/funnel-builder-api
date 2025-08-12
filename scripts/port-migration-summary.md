# Port Migration Summary: 3001 → 5000

## ✅ **IMPORTANT: This ensures funnel-builder-api runs on port 5000, NOT Strapi!**

This migration changes the funnel-builder-api from port 3001 to port 5000 to avoid conflicts and clearly separate services:

- **Strapi Backend**: api-dev.digitalsite.com (port 1337) ✅ UNCHANGED
- **Frontend**: dev.digitalsite.com (port 3000) ✅ UNCHANGED
- **Funnel-Builder-API**: new-api-dev.digitalsite.com (port 5000) ✅ **NEW PORT**

## Files Updated:

### Configuration Files:

- `.env.example` - Updated PORT and API URLs
- `ecosystem.config.js` - Updated all port references
- `ecosystem.staging.config.js` - Updated staging port and health check

### Deployment Files:

- `.github/workflows/deploy-staging.yml` - Updated all port references in workflow
- `nginx/sites-available/new-api-dev.digitalsite.com` - Updated proxy_pass

### Scripts (Updated):

- `scripts/fix-nginx-and-deployment.sh` - Complete nginx + app deployment
- `scripts/fix-redis-and-nginx.sh` - Redis + nginx fix
- `scripts/immediate-fix.sh` - Quick PM2 restart

## To Deploy:

1. **Push changes** to GitHub (already done)
2. **Run deployment** - the GitHub Action will automatically use port 5000
3. **Or manually on server**:
   ```bash
   cd /opt/funnel-builder-staging
   git pull origin develop
   sudo ./scripts/fix-nginx-and-deployment.sh
   ```

## Verification:

After deployment, verify:

- `pm2 list` shows funnel-builder-staging on port 5000
- `curl http://localhost:5000/health` returns 200 OK
- `https://new-api-dev.digitalsite.com/health` works via nginx
- **Strapi continues running on port 1337** (unchanged)

## Port Allocation:

- 1337: Strapi Backend (api-dev.digitalsite.com)
- 3000: Next.js Frontend (dev.digitalsite.com)
- 5000: **Funnel-Builder-API (new-api-dev.digitalsite.com)** ← This is YOUR Node.js API
- 5433: PostgreSQL (staging database)
- 6380: Redis (staging cache)

This ensures your funnel-builder-api (Node.js + Express) runs separately from Strapi!
