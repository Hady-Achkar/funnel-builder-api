#!/bin/bash

# Deployment verification script
# Usage: ./verify-deployment.sh [staging|production]

ENV=${1:-staging}
PORT=3001
HOST="localhost"

if [ "$ENV" = "production" ]; then
  PORT=3000
fi

echo "=== Deployment Verification for $ENV ==="
echo "Testing on $HOST:$PORT"
echo ""

# 1. Check if port is listening
echo "1. Checking port $PORT..."
if netstat -tln | grep -q ":$PORT "; then
  echo "✓ Port $PORT is listening"
else
  echo "✗ Port $PORT is not listening"
  echo "  Checking with lsof..."
  sudo lsof -i :$PORT || echo "  No process found on port $PORT"
fi
echo ""

# 2. Check PM2 status
echo "2. Checking PM2 status..."
if [ "$ENV" = "production" ]; then
  pm2 describe funnel-builder || echo "✗ PM2 process 'funnel-builder' not found"
else
  pm2 describe funnel-builder-staging || echo "✗ PM2 process 'funnel-builder-staging' not found"
fi
echo ""

# 3. Test health endpoint
echo "3. Testing health endpoint..."
HEALTH_URL="http://$HOST:$PORT/health"
echo "   GET $HEALTH_URL"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$HEALTH_URL" 2>/dev/null)
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✓ Health check passed (HTTP $HTTP_STATUS)"
  echo "   Response: $BODY"
else
  echo "✗ Health check failed (HTTP $HTTP_STATUS)"
  echo "   Response: $BODY"
fi
echo ""

# 4. Test root endpoint
echo "4. Testing root endpoint..."
ROOT_URL="http://$HOST:$PORT/"
echo "   GET $ROOT_URL"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$ROOT_URL" 2>/dev/null)
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:" | head -1)

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "404" ]; then
  echo "✓ Server is responding (HTTP $HTTP_STATUS)"
  echo "   Response: $BODY"
else
  echo "✗ Server not responding properly (HTTP $HTTP_STATUS)"
fi
echo ""

# 5. Check database connectivity
echo "5. Checking database connectivity..."
if [ "$ENV" = "staging" ]; then
  DB_PORT=5433
else
  DB_PORT=5432
fi

if nc -z localhost $DB_PORT 2>/dev/null; then
  echo "✓ PostgreSQL is listening on port $DB_PORT"
else
  echo "✗ PostgreSQL is not listening on port $DB_PORT"
fi
echo ""

# 6. Check Redis connectivity
echo "6. Checking Redis connectivity..."
if [ "$ENV" = "staging" ]; then
  REDIS_PORT=6380
else
  REDIS_PORT=6379
fi

if nc -z localhost $REDIS_PORT 2>/dev/null; then
  echo "✓ Redis is listening on port $REDIS_PORT"
else
  echo "✗ Redis is not listening on port $REDIS_PORT"
fi
echo ""

# 7. Check Docker containers (if applicable)
echo "7. Checking Docker containers..."
if command -v docker &> /dev/null; then
  if [ "$ENV" = "staging" ]; then
    docker ps | grep -E "(postgres|redis)" | grep -E "(5433|6380)" || echo "✗ Expected Docker containers not found"
  else
    docker ps | grep -E "(postgres|redis)" || echo "✗ Expected Docker containers not found"
  fi
else
  echo "  Docker not installed"
fi
echo ""

# 8. Summary
echo "=== Summary ==="
ISSUES=0

# Count issues
netstat -tln | grep -q ":$PORT " || ((ISSUES++))
[ "$HTTP_STATUS" = "200" ] || ((ISSUES++))
nc -z localhost $DB_PORT 2>/dev/null || ((ISSUES++))
nc -z localhost $REDIS_PORT 2>/dev/null || ((ISSUES++))

if [ $ISSUES -eq 0 ]; then
  echo "✅ All checks passed! Deployment appears to be successful."
else
  echo "⚠️  Found $ISSUES issue(s). Please check the output above."
fi

echo ""
echo "For more detailed debugging, run: ./scripts/debug-pm2.sh"