# PM2 Troubleshooting Guide

## Common PM2 Startup Issues and Solutions

### Issue: PM2 Process in "errored" state

**Symptoms:**

- PM2 shows process as "errored"
- Multiple restarts (e.g., "restarts: 9")
- Application not listening on port

**Solutions:**

1. **Check Error Logs**

```bash
# View PM2 logs
pm2 logs funnel-builder-staging --lines 100

# Check error log file directly
tail -f /opt/funnel-builder-staging/logs/error.log

# Get log file location
pm2 describe funnel-builder-staging | grep "error log path"
```

2. **Missing Dependencies**

```bash
cd /opt/funnel-builder-staging
pnpm install --prod --frozen-lockfile
```

3. **Missing Prisma Client**

```bash
# The app expects Prisma client at src/generated/prisma-client
npx prisma generate
```

4. **Database Connection Issues**

```bash
# Check if PostgreSQL is running
docker ps | grep postgres
netstat -tln | grep 5433

# Test connection
psql postgresql://staging_user:staging_password_change_me@localhost:5433/funnel_builder_staging -c "SELECT 1;"
```

5. **Redis Connection Issues**

```bash
# Check if Redis is running
docker ps | grep redis
redis-cli -p 6380 ping
```

### Quick Fix Steps

1. **Run the quick fix script:**

```bash
cd /opt/funnel-builder-staging
sudo ./scripts/quick-fix-pm2.sh
```

2. **Or manually fix:**

```bash
# Stop broken process
pm2 delete funnel-builder-staging

# Load environment
source .env.staging

# Generate Prisma client
npx prisma generate

# Start with simple config
pm2 start dist/index.js --name funnel-builder-staging

# Check status
pm2 list
```

### Diagnostic Commands

```bash
# Full diagnostics
./scripts/diagnose-startup.sh

# PM2 specific debug
./scripts/debug-pm2.sh

# Test direct startup (shows actual error)
NODE_ENV=staging PORT=3001 node dist/index.js
```

### Common Error Messages and Fixes

1. **"Cannot find module './generated/prisma-client'"**
   - Run: `npx prisma generate`

2. **"ECONNREFUSED 127.0.0.1:5433"**
   - PostgreSQL not running
   - Run: `docker-compose -f docker-compose.staging.yml up -d`

3. **"ECONNREFUSED 127.0.0.1:6380"**
   - Redis not running
   - Run: `docker-compose -f docker-compose.staging.yml up -d`

4. **"EADDRINUSE :::3001"**
   - Port already in use
   - Find process: `lsof -i :3001`
   - Kill process: `kill -9 <PID>`

5. **"Cannot find module 'express'"**
   - Dependencies not installed
   - Run: `pnpm install --prod`

### PM2 Best Practices

1. **Always check logs first:**
   - `pm2 logs` - Real-time logs
   - `pm2 describe <app>` - Process details
   - `pm2 monit` - CPU/Memory monitoring

2. **Use proper ecosystem file:**
   - Development: `ecosystem.config.js`
   - Staging: `ecosystem.staging.config.js`
   - Production: Use environment-specific config

3. **Save PM2 process list:**

   ```bash
   pm2 save
   pm2 startup
   ```

4. **Clean restart:**
   ```bash
   pm2 delete all
   pm2 start ecosystem.staging.config.js --env staging
   ```

### Environment Variables

Ensure all required environment variables are set:

- `NODE_ENV=staging`
- `PORT=3001`
- `DATABASE_URL=postgresql://...`
- `REDIS_URL=redis://...`
- `JWT_SECRET=...`

### Testing the Application

1. **Health Check:**

```bash
curl http://localhost:3001/health
```

2. **Via Domain:**

```bash
curl https://new-api-dev.digitalsite.com/health
```

3. **Check Process:**

```bash
ps aux | grep node
netstat -tlnp | grep 3001
```

### Emergency Recovery

If nothing works:

1. Backup current deployment
2. Re-deploy from GitHub Actions
3. Or manually:

```bash
cd /opt/funnel-builder-staging
git pull
pnpm install --prod
pnpm run build
npx prisma generate
pm2 restart funnel-builder-staging
```
