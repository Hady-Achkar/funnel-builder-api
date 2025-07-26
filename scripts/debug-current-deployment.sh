#!/bin/bash

# Debug the current deployment to see what's preventing startup

echo "=== Debugging Current Deployment ==="
echo "Time: $(date)"
echo ""

cd /opt/funnel-builder-staging || {
    echo "ERROR: Cannot access /opt/funnel-builder-staging"
    exit 1
}

echo "1. Current PM2 Status:"
pm2 list
echo ""

echo "2. PM2 Process Details:"
pm2 describe funnel-builder-staging 2>/dev/null || echo "Process not found"
echo ""

echo "3. Recent PM2 Error Logs:"
if pm2 logs funnel-builder-staging --lines 20 --nostream 2>/dev/null; then
    echo "PM2 logs shown above"
else
    echo "No PM2 logs available"
fi
echo ""

echo "4. Direct Error Log Check:"
if [ -f logs/error.log ]; then
    echo "=== Last 30 lines of error.log ==="
    tail -n 30 logs/error.log
else
    echo "No error.log file found"
fi
echo ""

echo "5. Environment Check:"
if [ -f .env.staging ]; then
    echo "✓ .env.staging exists"
    echo "Environment variables:"
    grep -E '^(NODE_ENV|PORT|DATABASE_URL|REDIS_URL|CLOUDFLARE_)' .env.staging | head -10
else
    echo "✗ .env.staging missing"
fi
echo ""

echo "6. File Structure Check:"
echo "dist/ directory:"
ls -la dist/ | head -5
echo ""
echo "Prisma client locations:"
[ -d "src/generated/prisma-client" ] && echo "✓ src/generated/prisma-client exists" || echo "✗ src/generated/prisma-client missing"
[ -d "dist/generated/prisma-client" ] && echo "✓ dist/generated/prisma-client exists" || echo "✗ dist/generated/prisma-client missing"
echo ""

echo "7. Node Modules Check:"
echo "Critical dependencies:"
deps=("express" "@prisma/client" "dotenv" "redis" "jsonwebtoken")
for dep in "${deps[@]}"; do
    if [ -d "node_modules/$dep" ]; then
        echo "✓ $dep"
    else
        echo "✗ $dep MISSING"
    fi
done
echo ""

echo "8. Direct Startup Test:"
echo "Testing: NODE_ENV=staging PORT=3001 timeout 5s node dist/index.js"
if [ -f .env.staging ]; then
    export $(cat .env.staging | grep -v '^#' | xargs)
fi
timeout 5s node dist/index.js 2>&1 | head -20
echo ""

echo "9. Port Check:"
echo "Processes on port 3001:"
lsof -i :3001 2>/dev/null || echo "No processes on port 3001"
echo ""

echo "10. Docker Services Check:"
echo "Docker containers:"
docker ps | grep -E "(postgres|redis)" | head -5 || echo "No matching containers"
echo ""

echo "=== Debug Complete ==="
echo ""
echo "To fix issues manually:"
echo "1. Stop PM2: pm2 delete funnel-builder-staging"
echo "2. Run fix script: ./scripts/fix-cloudflare-startup.sh"
echo "3. Check logs: pm2 logs funnel-builder-staging"