#!/bin/bash

# Comprehensive diagnostic script for startup issues

echo "=== Startup Diagnostics ==="
echo "Date: $(date)"
echo "Directory: $(pwd)"
echo ""

# 1. Check Node.js
echo "1. Node.js Version:"
node --version || echo "Node.js not found!"
echo ""

# 2. Check environment
echo "2. Environment Check:"
if [ -f .env.staging ]; then
    echo "✓ .env.staging found"
    # Load env vars
    set -a
    source .env.staging
    set +a
    echo "  NODE_ENV: $NODE_ENV"
    echo "  PORT: $PORT"
    echo "  DATABASE_URL: ${DATABASE_URL:0:50}..."
    echo "  REDIS_URL: ${REDIS_URL:0:30}..."
else
    echo "✗ .env.staging not found!"
fi
echo ""

# 3. Check build files
echo "3. Build Files:"
if [ -f dist/index.js ]; then
    echo "✓ dist/index.js found"
    echo "  Size: $(du -h dist/index.js | cut -f1)"
    echo "  First line: $(head -1 dist/index.js)"
else
    echo "✗ dist/index.js not found!"
fi
echo ""

# 4. Check dependencies
echo "4. Critical Dependencies:"
deps=("express" "@prisma/client" "dotenv" "redis" "jsonwebtoken" "bcryptjs" "cors" "helmet")
missing=0
for dep in "${deps[@]}"; do
    if [ -d "node_modules/$dep" ]; then
        echo "✓ $dep"
    else
        echo "✗ $dep MISSING!"
        ((missing++))
    fi
done
echo "Missing dependencies: $missing"
echo ""

# 5. Check Prisma client
echo "5. Prisma Client:"
if [ -d "src/generated/prisma-client" ]; then
    echo "✓ Prisma client found at src/generated/prisma-client"
    echo "  Files: $(ls src/generated/prisma-client | wc -l)"
else
    echo "✗ Prisma client not found!"
    echo "  Searching for Prisma client..."
    find . -name "index.d.ts" -path "*/prisma-client/*" 2>/dev/null | head -5
fi
echo ""

# 6. Test database connection
echo "6. Database Connection Test:"
if command -v psql &> /dev/null; then
    export PGPASSWORD="${DATABASE_URL##*@}"
    PGPASSWORD="${PGPASSWORD%%/*}"
    psql -h localhost -p 5433 -U staging_user -d funnel_builder_staging -c "SELECT version();" 2>&1 | head -3 || echo "✗ Database connection failed"
else
    # Try with Node.js
    node -e "
    const { Client } = require('pg');
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    client.connect()
      .then(() => {
        console.log('✓ Database connection successful');
        return client.end();
      })
      .catch(err => console.log('✗ Database connection failed:', err.message));
    " 2>&1 || echo "✗ Could not test database connection"
fi
echo ""

# 7. Test Redis connection
echo "7. Redis Connection Test:"
if command -v redis-cli &> /dev/null; then
    redis-cli -p 6380 ping && echo "✓ Redis connection successful" || echo "✗ Redis connection failed"
else
    node -e "
    const redis = require('redis');
    const client = redis.createClient({ url: process.env.REDIS_URL });
    client.connect()
      .then(() => {
        console.log('✓ Redis connection successful');
        return client.quit();
      })
      .catch(err => console.log('✗ Redis connection failed:', err.message));
    " 2>&1 || echo "✗ Could not test Redis connection"
fi
echo ""

# 8. Try direct startup
echo "8. Direct Startup Test:"
echo "Running: NODE_ENV=staging node dist/index.js"
timeout 10s env NODE_ENV=staging PORT=3001 node dist/index.js 2>&1 | head -20
echo ""

# 9. Check PM2
echo "9. PM2 Status:"
pm2 list
echo ""

# 10. Recent error logs
echo "10. Recent Error Logs:"
if [ -f logs/error.log ]; then
    echo "=== logs/error.log (last 20 lines) ==="
    tail -20 logs/error.log
elif [ -f logs/pm2-error.log ]; then
    echo "=== logs/pm2-error.log (last 20 lines) ==="
    tail -20 logs/pm2-error.log
else
    echo "No error logs found in logs directory"
    echo "PM2 logs location:"
    pm2 describe funnel-builder-staging 2>/dev/null | grep "error log path" || echo "PM2 process not found"
fi

echo ""
echo "=== Diagnostics Complete ==="
echo ""
echo "Common fixes:"
echo "1. Missing dependencies: pnpm install --prod"
echo "2. Missing Prisma client: npx prisma generate"
echo "3. Database issues: Check Docker containers with 'docker ps'"
echo "4. Port conflicts: lsof -i :3001"
echo "5. Environment issues: Check .env.staging file"