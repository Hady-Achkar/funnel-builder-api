#!/bin/bash

# PM2 Staging Startup Script with Error Handling

set -e

echo "=== PM2 Staging Startup Script ==="
echo "Time: $(date)"
echo ""

# Navigate to app directory
cd /opt/funnel-builder-staging || {
    echo "ERROR: Cannot access /opt/funnel-builder-staging"
    exit 1
}

# 1. Clean up old PM2 process
echo "1. Cleaning up old PM2 processes..."
pm2 delete funnel-builder-staging 2>/dev/null || true
pm2 flush # Clear all logs

# 2. Ensure logs directory exists
echo "2. Creating logs directory..."
mkdir -p logs
touch logs/error.log logs/out.log logs/combined.log
chmod 755 logs
chmod 644 logs/*.log

# 3. Load environment variables
echo "3. Loading environment variables..."
if [ -f .env.staging ]; then
    export $(cat .env.staging | grep -v '^#' | xargs)
    echo "✓ Environment loaded from .env.staging"
else
    echo "✗ ERROR: .env.staging not found!"
    exit 1
fi

# 4. Verify critical files
echo "4. Verifying critical files..."
[ -f "dist/index.js" ] || { echo "✗ dist/index.js not found!"; exit 1; }
[ -f "package.json" ] || { echo "✗ package.json not found!"; exit 1; }
[ -d "node_modules" ] || { echo "✗ node_modules not found!"; exit 1; }
echo "✓ All critical files present"

# 5. Check if Prisma client exists, generate if not
echo "5. Checking Prisma client..."
if [ ! -d "src/generated/prisma-client" ]; then
    echo "Generating Prisma client..."
    npx prisma generate || {
        echo "✗ Failed to generate Prisma client"
        exit 1
    }
fi
echo "✓ Prisma client ready"

# 6. Test database connection
echo "6. Testing database connection..."
node -e "
const { PrismaClient } = require('./src/generated/prisma-client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✓ Database connection successful');
    return prisma.\$disconnect();
  })
  .catch(err => {
    console.error('✗ Database connection failed:', err.message);
    process.exit(1);
  });
" || {
    echo "Database connection test failed. Checking Docker containers..."
    docker ps | grep postgres || echo "PostgreSQL container not running"
    exit 1
}

# 7. Create PM2 configuration inline
echo "7. Creating PM2 configuration..."
cat > pm2-staging.json << EOF
{
  "apps": [{
    "name": "funnel-builder-staging",
    "script": "./dist/index.js",
    "cwd": "$(pwd)",
    "interpreter": "node",
    "instances": 1,
    "exec_mode": "fork",
    "env": {
      "NODE_ENV": "staging",
      "PORT": "3001",
      "DATABASE_URL": "${DATABASE_URL}",
      "REDIS_URL": "${REDIS_URL}",
      "JWT_SECRET": "${JWT_SECRET}",
      "API_DOMAIN": "new-api-dev.digitalsite.com",
      "API_URL": "https://new-api-dev.digitalsite.com",
      "CLOUDFLARE_API_TOKEN": "${CLOUDFLARE_API_TOKEN:-}",
      "CLOUDFLARE_ACCOUNT_ID": "${CLOUDFLARE_ACCOUNT_ID:-}",
      "CLOUDFLARE_ZONE_ID": "${CLOUDFLARE_ZONE_ID:-}",
      "CLOUDFLARE_SAAS_TARGET": "${CLOUDFLARE_SAAS_TARGET:-}",
      "PLATFORM_MAIN_DOMAIN": "${PLATFORM_MAIN_DOMAIN:-digitalsite.ai}"
    },
    "error_file": "./logs/pm2-error.log",
    "out_file": "./logs/pm2-out.log",
    "log_file": "./logs/pm2-combined.log",
    "merge_logs": true,
    "time": true,
    "autorestart": true,
    "max_restarts": 3,
    "min_uptime": "5s",
    "watch": false
  }]
}
EOF

# 8. Start with PM2
echo "8. Starting application with PM2..."
pm2 start pm2-staging.json

# 9. Wait for startup
echo "9. Waiting for application to start..."
sleep 5

# 10. Check status
echo "10. Checking PM2 status..."
pm2 list
pm2 describe funnel-builder-staging || true

# 11. Test application
echo "11. Testing application..."
for i in {1..3}; do
    if curl -f -s http://localhost:3001/health > /dev/null; then
        echo "✓ Health check passed!"
        break
    else
        echo "Health check attempt $i/3 failed, waiting..."
        sleep 3
    fi
done

# 12. Show logs if failed
if ! pm2 describe funnel-builder-staging | grep -q "online"; then
    echo ""
    echo "⚠️  Application failed to start. Recent logs:"
    echo "=== Error logs ==="
    tail -n 30 logs/pm2-error.log 2>/dev/null || true
    echo "=== PM2 logs ==="
    pm2 logs funnel-builder-staging --lines 30 --nostream
    exit 1
fi

# 13. Save PM2 process list
pm2 save
pm2 startup systemd -u $USER --hp $HOME || true

echo ""
echo "✅ PM2 startup complete!"
echo "Application running at: http://localhost:3001"
echo "Domain: https://new-api-dev.digitalsite.com"
echo ""
echo "Useful commands:"
echo "  pm2 logs funnel-builder-staging  # View logs"
echo "  pm2 restart funnel-builder-staging  # Restart"
echo "  pm2 monit  # Monitor"