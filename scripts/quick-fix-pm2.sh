#!/bin/bash

# Quick fix for PM2 startup issues

echo "=== Quick PM2 Fix ==="
cd /opt/funnel-builder-staging

# 1. Stop and remove broken process
pm2 stop funnel-builder-staging 2>/dev/null || true
pm2 delete funnel-builder-staging 2>/dev/null || true

# 2. Ensure logs directory
mkdir -p logs

# 3. Load environment
if [ -f .env.staging ]; then
    export $(cat .env.staging | grep -v '^#' | xargs)
fi

# 4. Generate Prisma client if missing
if [ ! -d "src/generated/prisma-client" ]; then
    echo "Generating Prisma client..."
    npx prisma generate
fi

# 5. Start with simple command
echo "Starting with PM2..."
pm2 start dist/index.js \
    --name funnel-builder-staging \
    --interpreter node \
    --cwd /opt/funnel-builder-staging \
    --error logs/error.log \
    --output logs/out.log \
    --time \
    -- --max-old-space-size=1024

# 6. Wait and check
sleep 5
pm2 list

# 7. Test health
curl -s http://localhost:3001/health && echo "✓ App is running!" || echo "✗ App not responding"

# 8. Show logs if failed
if ! pm2 describe funnel-builder-staging | grep -q "online"; then
    echo "=== Recent logs ==="
    pm2 logs funnel-builder-staging --lines 30 --nostream
fi

pm2 save