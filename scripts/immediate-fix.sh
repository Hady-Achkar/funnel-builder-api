#!/bin/bash

# Immediate fix for the current deployment issues

echo "=== Immediate Deployment Fix ==="
echo "Time: $(date)"
echo ""

cd /opt/funnel-builder-staging || exit 1

echo "1. Stopping broken PM2 process..."
pm2 stop funnel-builder-staging 2>/dev/null || true
pm2 delete funnel-builder-staging 2>/dev/null || true
pm2 flush

echo "2. Updating environment file with CloudFlare dummy values..."
cat > .env.staging << 'EOF'
# Staging Environment Variables
NODE_ENV=staging
PORT=3001

# Domain Configuration
API_DOMAIN=new-api-dev.digitalsite.com
API_URL=https://new-api-dev.digitalsite.com

# Database (using Docker Compose)
DATABASE_URL=postgresql://staging_user:staging_password_change_me@localhost:5433/funnel_builder_staging

# Authentication
JWT_SECRET=staging-jwt-secret-change-this-in-production

# Redis Cache
REDIS_URL=redis://localhost:6380

# CloudFlare API (dummy values for staging - CloudFlare not used in staging)
CLOUDFLARE_API_TOKEN=dummy-staging-token
CLOUDFLARE_ACCOUNT_ID=dummy-staging-account
CLOUDFLARE_ZONE_ID=dummy-staging-zone
CLOUDFLARE_SAAS_TARGET=dummy-staging-target.com
PLATFORM_MAIN_DOMAIN=digitalsite.ai
EOF

echo "3. Loading environment variables..."
export $(cat .env.staging | grep -v '^#' | xargs)

echo "4. Ensuring dependencies are installed..."
if [ ! -d "node_modules" ] || [ ! -d "node_modules/express" ]; then
    echo "Installing dependencies..."
    pnpm install --prod --frozen-lockfile
fi

echo "5. Ensuring Prisma client is generated and in correct location..."
npx prisma generate
mkdir -p dist/generated
cp -r src/generated/prisma-client dist/generated/ 2>/dev/null || true

echo "6. Testing direct startup first..."
echo "Command: NODE_ENV=staging PORT=3001 node dist/index.js"
timeout 3s node dist/index.js && echo "Direct startup test passed" || echo "Direct startup test completed"

echo "7. Starting with PM2..."
pm2 start dist/index.js \
    --name funnel-builder-staging \
    --cwd /opt/funnel-builder-staging \
    --interpreter node \
    --node-args "--max-old-space-size=1024" \
    --error logs/error.log \
    --output logs/out.log \
    --time

echo "8. Waiting for startup..."
sleep 8

echo "9. Checking status..."
pm2 list
echo ""

echo "10. Testing health endpoint..."
if curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ SUCCESS! Application is running"
    echo "Health check response:"
    curl -s http://localhost:3001/health
else
    echo "❌ Still not working. Checking logs..."
    echo ""
    echo "=== Recent PM2 logs ==="
    pm2 logs funnel-builder-staging --lines 30 --nostream
    echo ""
    echo "=== Error log ==="
    [ -f logs/error.log ] && tail -n 20 logs/error.log
fi

pm2 save

echo ""
echo "=== Fix Complete ==="
echo "If still not working, the application might have other startup issues."
echo "Check logs with: pm2 logs funnel-builder-staging"