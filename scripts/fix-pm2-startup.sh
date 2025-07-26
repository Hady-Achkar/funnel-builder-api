#!/bin/bash

# Script to fix PM2 startup issues

echo "=== PM2 Startup Fix Script ==="
echo ""

cd /opt/funnel-builder-staging || exit 1

# 1. Stop and delete existing PM2 process
echo "1. Cleaning up PM2 processes..."
pm2 stop funnel-builder-staging 2>/dev/null || true
pm2 delete funnel-builder-staging 2>/dev/null || true

# 2. Clean logs
echo "2. Cleaning old logs..."
rm -rf logs/*
mkdir -p logs

# 3. Check environment variables
echo "3. Loading environment variables..."
if [ -f .env.staging ]; then
    set -a
    source .env.staging
    set +a
    echo "Environment loaded from .env.staging"
else
    echo "ERROR: .env.staging not found!"
    exit 1
fi

# 4. Verify dependencies
echo "4. Verifying dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    pnpm install --prod --frozen-lockfile
fi

# 5. Generate Prisma client
echo "5. Generating Prisma client..."
npx prisma generate

# 6. Check database connection
echo "6. Testing database connection..."
npx prisma db push --skip-generate || echo "Database connection test failed"

# 7. Test direct startup
echo "7. Testing direct Node.js startup..."
echo "Running: NODE_ENV=staging PORT=3001 node dist/index.js"
timeout 10s env NODE_ENV=staging PORT=3001 node dist/index.js

echo ""
echo "8. If the above test worked, try starting with PM2:"
echo ""

# 8. Create simple PM2 config
cat > pm2-simple.json << EOF
{
  "apps": [{
    "name": "funnel-builder-staging",
    "script": "./dist/index.js",
    "cwd": "/opt/funnel-builder-staging",
    "env": {
      "NODE_ENV": "staging",
      "PORT": "3001",
      "DATABASE_URL": "$DATABASE_URL",
      "REDIS_URL": "$REDIS_URL",
      "JWT_SECRET": "$JWT_SECRET"
    },
    "error_file": "./logs/error.log",
    "out_file": "./logs/out.log",
    "log_file": "./logs/combined.log",
    "time": true,
    "max_restarts": 3,
    "min_uptime": "10s"
  }]
}
EOF

echo "9. Starting with simple PM2 config..."
pm2 start pm2-simple.json

echo ""
echo "10. Checking PM2 status..."
pm2 list
pm2 logs funnel-builder-staging --lines 20

echo ""
echo "=== Troubleshooting Tips ==="
echo "1. Check logs: tail -f logs/error.log"
echo "2. Check PM2 logs: pm2 logs funnel-builder-staging"
echo "3. Restart PM2: pm2 restart funnel-builder-staging"
echo "4. Monitor: pm2 monit"
echo "5. If still failing, check:"
echo "   - Database is accessible: psql $DATABASE_URL -c 'SELECT 1;'"
echo "   - Redis is accessible: redis-cli -p 6380 ping"
echo "   - All environment variables are set correctly"