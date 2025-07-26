#!/bin/bash

# Immediate fix for Prisma client path issue

echo "=== Fixing Prisma Client Path Issue ==="
echo ""

cd /opt/funnel-builder-staging || exit 1

# 1. Stop PM2
echo "1. Stopping PM2 process..."
pm2 stop funnel-builder-staging 2>/dev/null || true
pm2 delete funnel-builder-staging 2>/dev/null || true

# 2. Create the expected directory structure
echo "2. Creating directory structure..."
mkdir -p dist/generated

# 3. Copy Prisma client to where dist/index.js expects it
echo "3. Copying Prisma client to correct location..."
if [ -d "src/generated/prisma-client" ]; then
    cp -r src/generated/prisma-client dist/generated/
    echo "✓ Prisma client copied to dist/generated/prisma-client"
else
    echo "✗ Source Prisma client not found at src/generated/prisma-client"
    echo "  Generating Prisma client..."
    npx prisma generate
    # Try copying again
    if [ -d "src/generated/prisma-client" ]; then
        cp -r src/generated/prisma-client dist/generated/
        echo "✓ Prisma client generated and copied"
    else
        echo "✗ Failed to generate Prisma client"
        exit 1
    fi
fi

# 4. Verify the fix
echo "4. Verifying fix..."
if [ -f "dist/generated/prisma-client/index.js" ]; then
    echo "✓ Prisma client index.js found at correct location"
else
    echo "✗ Prisma client index.js not found"
    echo "  Contents of dist/generated:"
    ls -la dist/generated/ 2>/dev/null || echo "  Directory not found"
fi

# 5. Load environment
echo "5. Loading environment..."
if [ -f .env.staging ]; then
    export $(cat .env.staging | grep -v '^#' | xargs)
fi

# 6. Test direct startup
echo "6. Testing direct startup..."
timeout 5s node dist/index.js || echo "Direct startup test completed"

# 7. Start with PM2
echo "7. Starting with PM2..."
pm2 start dist/index.js \
    --name funnel-builder-staging \
    --cwd /opt/funnel-builder-staging \
    --error logs/error.log \
    --output logs/out.log \
    --time

# 8. Wait and check
sleep 5
echo ""
echo "8. Checking status..."
pm2 list
pm2 describe funnel-builder-staging | grep status || true

# 9. Test health endpoint
echo ""
echo "9. Testing health endpoint..."
curl -s http://localhost:3001/health && echo -e "\n✅ Application is running!" || echo -e "\n❌ Health check failed"

# 10. Show logs if needed
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo ""
    echo "Recent logs:"
    pm2 logs funnel-builder-staging --lines 20 --nostream
fi

pm2 save

echo ""
echo "=== Fix Complete ==="
echo "The Prisma client has been copied to: dist/generated/prisma-client"
echo "This is where the compiled code expects to find it."