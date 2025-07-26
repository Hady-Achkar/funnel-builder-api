#!/bin/bash

# Fix CloudFlare startup issue by making CloudFlare optional

echo "=== Fixing CloudFlare Startup Issue ==="
cd /opt/funnel-builder-staging || exit 1

# 1. Stop PM2
echo "1. Stopping PM2 process..."
pm2 stop funnel-builder-staging 2>/dev/null || true
pm2 delete funnel-builder-staging 2>/dev/null || true

# 2. Load environment
echo "2. Loading environment..."
if [ -f .env.staging ]; then
    export $(cat .env.staging | grep -v '^#' | xargs)
fi

# 3. Set dummy CloudFlare values to prevent startup errors
echo "3. Setting dummy CloudFlare environment variables..."
export CLOUDFLARE_API_TOKEN="dummy-token-for-staging"
export CLOUDFLARE_ACCOUNT_ID="dummy-account-id"
export CLOUDFLARE_ZONE_ID="dummy-zone-id"
export CLOUDFLARE_SAAS_TARGET="dummy-target"
export PLATFORM_MAIN_DOMAIN="digitalsite.ai"

# 4. Copy Prisma client to correct location (in case it's missing)
echo "4. Ensuring Prisma client is in correct location..."
mkdir -p dist/generated
if [ -d "src/generated/prisma-client" ]; then
    cp -r src/generated/prisma-client dist/generated/
    echo "✓ Prisma client copied"
else
    echo "Generating Prisma client..."
    npx prisma generate
    cp -r src/generated/prisma-client dist/generated/
fi

# 5. Start with PM2 including CloudFlare env vars
echo "5. Starting with PM2..."
pm2 start dist/index.js \
    --name funnel-builder-staging \
    --cwd /opt/funnel-builder-staging \
    --error logs/error.log \
    --output logs/out.log \
    --time \
    --env NODE_ENV=staging \
    --env PORT=3001 \
    --env DATABASE_URL="$DATABASE_URL" \
    --env REDIS_URL="$REDIS_URL" \
    --env JWT_SECRET="$JWT_SECRET" \
    --env CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" \
    --env CLOUDFLARE_ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID" \
    --env CLOUDFLARE_ZONE_ID="$CLOUDFLARE_ZONE_ID" \
    --env CLOUDFLARE_SAAS_TARGET="$CLOUDFLARE_SAAS_TARGET" \
    --env PLATFORM_MAIN_DOMAIN="$PLATFORM_MAIN_DOMAIN"

# 6. Wait and check
echo "6. Waiting for startup..."
sleep 10

pm2 list
echo ""

# 7. Test health endpoint
echo "7. Testing health endpoint..."
if curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Application is running successfully!"
    curl -s http://localhost:3001/health
else
    echo "❌ Health check failed. Checking logs..."
    pm2 logs funnel-builder-staging --lines 20 --nostream
fi

pm2 save

echo ""
echo "=== Fix Complete ==="
echo "CloudFlare environment variables set to dummy values for staging."
echo "Application should now start without CloudFlare API token errors."