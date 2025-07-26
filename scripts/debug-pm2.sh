#!/bin/bash

echo "=== PM2 Debug Script ==="
echo "Date: $(date)"
echo ""

echo "1. PM2 Status:"
pm2 list
echo ""

echo "2. PM2 Process Details:"
pm2 describe funnel-builder-staging || pm2 describe funnel-builder
echo ""

echo "3. Node.js Version:"
node --version
echo ""

echo "4. Current Directory:"
pwd
echo ""

echo "5. Environment Variables:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL: ${DATABASE_URL:0:30}..." # Show only first 30 chars for security
echo "REDIS_URL: ${REDIS_URL:0:20}..." # Show only first 20 chars for security
echo ""

echo "6. Checking Port Usage:"
sudo netstat -tlnp | grep :300 || echo "No process on ports 3000-3009"
echo ""

echo "7. Recent PM2 Logs:"
pm2 logs --lines 50 --nostream
echo ""

echo "8. System Resources:"
echo "Memory:"
free -h
echo ""
echo "Disk:"
df -h /
echo ""

echo "9. Node Processes:"
ps aux | grep node | grep -v grep
echo ""

echo "10. PM2 Error Logs (if exist):"
if [ -f logs/error.log ]; then
  echo "Last 50 lines of error.log:"
  tail -n 50 logs/error.log
elif [ -f /var/log/funnel-builder-staging/error.log ]; then
  echo "Last 50 lines of system error.log:"
  tail -n 50 /var/log/funnel-builder-staging/error.log
else
  echo "No error logs found"
fi
echo ""

echo "11. Checking Dependencies:"
if [ -f package.json ]; then
  echo "Critical dependencies check:"
  [ -d "node_modules/express" ] && echo "✓ Express installed" || echo "✗ Express missing"
  [ -d "node_modules/@prisma/client" ] && echo "✓ Prisma client installed" || echo "✗ Prisma client missing"
  [ -d "node_modules/dotenv" ] && echo "✓ Dotenv installed" || echo "✗ Dotenv missing"
  [ -d "node_modules/redis" ] && echo "✓ Redis installed" || echo "✗ Redis missing"
  [ -d "node_modules/jsonwebtoken" ] && echo "✓ JWT installed" || echo "✗ JWT missing"
  [ -d "node_modules/bcryptjs" ] && echo "✓ Bcryptjs installed" || echo "✗ Bcryptjs missing"
  [ -d "node_modules/cors" ] && echo "✓ CORS installed" || echo "✗ CORS missing"
  [ -d "node_modules/helmet" ] && echo "✓ Helmet installed" || echo "✗ Helmet missing"
else
  echo "package.json not found!"
fi
echo ""

echo "12. Testing Database Connection:"
if command -v psql &> /dev/null; then
  echo "Testing PostgreSQL connection..."
  PGPASSWORD="${DATABASE_URL##*:}" psql -h localhost -p 5433 -U staging_user -d funnel_builder_staging -c "SELECT 1;" 2>&1 || echo "Database connection failed"
else
  echo "psql command not found, skipping database test"
fi
echo ""

echo "13. Testing Redis Connection:"
if command -v redis-cli &> /dev/null; then
  echo "Testing Redis connection..."
  redis-cli -p 6380 ping || echo "Redis connection failed"
else
  echo "redis-cli command not found, skipping Redis test"
fi

echo ""
echo "=== Debug Complete ==="