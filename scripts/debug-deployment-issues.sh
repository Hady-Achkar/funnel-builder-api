#!/bin/bash

# Comprehensive Deployment Debugging Script
# This script diagnoses PM2 startup issues, port problems, and provides actionable solutions

set -e
trap 'echo "Script interrupted"; exit 1' INT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_PATH="/opt/funnel-builder-staging"
APP_NAME="funnel-builder-staging"
TARGET_PORT=3001

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

echo_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

echo_error() {
    echo -e "${RED}✗ $1${NC}"
}

echo_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a service is running
service_running() {
    systemctl is-active --quiet "$1" 2>/dev/null
}

# Function to check if a port is open
port_open() {
    nc -z localhost "$1" 2>/dev/null
}

echo_header "Deployment Issues Diagnostic Tool"
echo "Time: $(date)"
echo "Target Application: $APP_NAME"
echo "Target Port: $TARGET_PORT"
echo "Deployment Path: $DEPLOYMENT_PATH"
echo ""

# 1. Basic System Check
echo_header "1. System Status Check"

if command_exists pm2; then
    echo_success "PM2 is installed"
    pm2 --version
else
    echo_error "PM2 is not installed"
    echo "  Fix: npm install -g pm2"
fi

if command_exists node; then
    echo_success "Node.js is available"
    node --version
else
    echo_error "Node.js is not installed"
fi

if command_exists docker; then
    echo_success "Docker is available"
    docker --version
else
    echo_warning "Docker is not installed"
fi

# Check disk space
DISK_USAGE=$(df /opt 2>/dev/null | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo_error "Disk usage is high: ${DISK_USAGE}%"
else
    echo_success "Disk usage is normal: ${DISK_USAGE}%"
fi

# 2. PM2 Process Status
echo_header "2. PM2 Process Analysis"

if command_exists pm2; then
    echo "Current PM2 processes:"
    pm2 list
    echo ""
    
    if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
        echo_info "Detailed process information:"
        pm2 describe "$APP_NAME"
        echo ""
        
        # Check process status
        PM2_STATUS=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status" 2>/dev/null || echo "unknown")
        echo "Process status: $PM2_STATUS"
        
        if [ "$PM2_STATUS" = "online" ]; then
            echo_success "PM2 process is running"
        elif [ "$PM2_STATUS" = "errored" ]; then
            echo_error "PM2 process has errored"
        elif [ "$PM2_STATUS" = "stopped" ]; then
            echo_warning "PM2 process is stopped"
        else
            echo_warning "PM2 process status unknown: $PM2_STATUS"
        fi
    else
        echo_warning "PM2 process '$APP_NAME' not found"
    fi
else
    echo_error "PM2 not available for process check"
fi

# 3. Port Analysis
echo_header "3. Port $TARGET_PORT Analysis"

if port_open "$TARGET_PORT"; then
    echo_success "Port $TARGET_PORT is open and accepting connections"
    
    # Show what's using the port
    echo "Processes using port $TARGET_PORT:"
    lsof -i ":$TARGET_PORT" 2>/dev/null || echo "Unable to determine process details"
    
    # Test HTTP response
    echo ""
    echo "Testing HTTP response on port $TARGET_PORT:"
    if curl -s --max-time 5 "http://localhost:$TARGET_PORT/health" >/dev/null 2>&1; then
        echo_success "Health endpoint responds successfully"
        echo "Response:"
        curl -s --max-time 5 "http://localhost:$TARGET_PORT/health" | head -3
    else
        echo_warning "Health endpoint not responding or slow"
        echo "Testing basic connection:"
        timeout 5 curl -s "http://localhost:$TARGET_PORT/" 2>&1 | head -3 || echo "Connection failed"
    fi
else
    echo_error "Port $TARGET_PORT is not open or not accepting connections"
    
    echo ""
    echo "Checking if anything else is using the port:"
    lsof -i ":$TARGET_PORT" 2>/dev/null || echo "No processes found on port $TARGET_PORT"
    
    echo ""
    echo "Checking nearby ports:"
    for port in 3000 3002 8080; do
        if port_open "$port"; then
            echo_info "Port $port is open"
        fi
    done
fi

# 4. Application Directory Check
echo_header "4. Application Directory Analysis"

if [ -d "$DEPLOYMENT_PATH" ]; then
    echo_success "Deployment directory exists: $DEPLOYMENT_PATH"
    cd "$DEPLOYMENT_PATH" || {
        echo_error "Cannot access deployment directory"
        exit 1
    }
    
    # Check critical files
    echo ""
    echo "Critical files check:"
    
    if [ -f "dist/index.js" ]; then
        echo_success "Main application file exists: dist/index.js"
        FILE_SIZE=$(stat -f%z "dist/index.js" 2>/dev/null || stat -c%s "dist/index.js" 2>/dev/null || echo "unknown")
        echo "  File size: $FILE_SIZE bytes"
    else
        echo_error "Main application file missing: dist/index.js"
    fi
    
    if [ -f "ecosystem.staging.config.js" ]; then
        echo_success "PM2 config exists: ecosystem.staging.config.js"
    else
        echo_error "PM2 config missing: ecosystem.staging.config.js"
    fi
    
    if [ -f "package.json" ]; then
        echo_success "Package.json exists"
    else
        echo_error "Package.json missing"
    fi
    
    if [ -d "node_modules" ]; then
        echo_success "Node modules directory exists"
        MODULE_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
        echo "  Module count: $MODULE_COUNT"
    else
        echo_error "Node modules directory missing"
    fi
    
else
    echo_error "Deployment directory does not exist: $DEPLOYMENT_PATH"
    echo "  This might be a first-time deployment issue"
fi

# 5. Environment Configuration
echo_header "5. Environment Configuration"

if [ -d "$DEPLOYMENT_PATH" ]; then
    cd "$DEPLOYMENT_PATH"
    
    # Check environment files
    if [ -f ".env.staging" ]; then
        echo_success ".env.staging file exists"
        echo ""
        echo "Environment variables (non-sensitive):"
        grep -E '^(NODE_ENV|PORT|API_DOMAIN|API_URL)=' .env.staging 2>/dev/null || echo "No basic env vars found"
        
        # Check for required variables
        echo ""
        echo "Required environment variables check:"
        REQUIRED_VARS=("NODE_ENV" "PORT" "DATABASE_URL" "JWT_SECRET")
        for var in "${REQUIRED_VARS[@]}"; do
            if grep -q "^${var}=" .env.staging 2>/dev/null; then
                echo_success "$var is set"
            else
                echo_error "$var is missing"
            fi
        done
    else
        echo_warning ".env.staging file missing"
        echo "  This could cause environment variable issues"
    fi
    
    # Check ecosystem config
    if [ -f "ecosystem.staging.config.js" ]; then
        echo ""
        echo "PM2 ecosystem configuration:"
        echo "Port configured in PM2:"
        grep -A 5 "env_staging" ecosystem.staging.config.js | grep "PORT" || echo "Port not configured"
        
        echo "Working directory:"
        grep "cwd:" ecosystem.staging.config.js || echo "CWD not configured"
    fi
fi

# 6. Database and Dependencies
echo_header "6. Database and Dependencies Check"

if [ -d "$DEPLOYMENT_PATH" ]; then
    cd "$DEPLOYMENT_PATH"
    
    # Check Prisma
    echo "Prisma client status:"
    if [ -d "src/generated/prisma-client" ]; then
        echo_success "Prisma client exists in src/generated/prisma-client"
    elif [ -d "dist/generated/prisma-client" ]; then
        echo_success "Prisma client exists in dist/generated/prisma-client"
    elif [ -d "node_modules/.prisma/client" ]; then
        echo_success "Prisma client exists in node_modules/.prisma/client"
    else
        echo_error "Prisma client not found in expected locations"
        echo "  Try: cd $DEPLOYMENT_PATH && npx prisma generate"
    fi
    
    # Check critical dependencies
    echo ""
    echo "Critical dependencies:"
    DEPS=("express" "@prisma/client" "dotenv" "redis" "bcryptjs" "jsonwebtoken")
    for dep in "${DEPS[@]}"; do
        if [ -d "node_modules/$dep" ]; then
            echo_success "$dep installed"
        else
            echo_error "$dep missing"
        fi
    done
    
    # Database connection test
    echo ""
    echo "Database connection test:"
    if [ -f ".env.staging" ]; then
        DB_URL=$(grep "^DATABASE_URL=" .env.staging 2>/dev/null | cut -d'=' -f2- | tr -d '"')
        if [ -n "$DB_URL" ]; then
            echo "Database URL configured: ${DB_URL%%:*}://[credentials]@${DB_URL##*@}"
            
            # Test PostgreSQL connection if possible
            if command_exists psql; then
                if timeout 5 psql "$DB_URL" -c "SELECT 1;" >/dev/null 2>&1; then
                    echo_success "Database connection successful"
                else
                    echo_error "Database connection failed"
                fi
            else
                echo_info "psql not available for connection test"
            fi
        else
            echo_error "DATABASE_URL not found in .env.staging"
        fi
    fi
fi

# 7. Direct Node.js Startup Test
echo_header "7. Direct Application Startup Test"

if [ -d "$DEPLOYMENT_PATH" ] && [ -f "$DEPLOYMENT_PATH/dist/index.js" ]; then
    cd "$DEPLOYMENT_PATH"
    
    echo "Testing direct Node.js startup..."
    echo "Command: NODE_ENV=staging PORT=$TARGET_PORT timeout 10s node dist/index.js"
    echo ""
    
    # Load environment if available
    if [ -f ".env.staging" ]; then
        set -a
        source .env.staging
        set +a
    fi
    
    # Set basic environment
    export NODE_ENV=staging
    export PORT=$TARGET_PORT
    
    # Test startup with timeout
    if timeout 10s node dist/index.js 2>&1 | head -20; then
        echo ""
        echo_info "Application started successfully (or timed out after 10s)"
    else
        EXIT_CODE=$?
        echo ""
        if [ $EXIT_CODE -eq 124 ]; then
            echo_warning "Application startup timed out (may be running normally)"
        else
            echo_error "Application failed to start (exit code: $EXIT_CODE)"
        fi
    fi
else
    echo_error "Cannot test startup - application files not found"
fi

# 8. Service Dependencies
echo_header "8. Service Dependencies Check"

# Check PostgreSQL
echo "PostgreSQL status:"
if service_running postgresql; then
    echo_success "PostgreSQL service is running"
elif docker ps | grep -q postgres; then
    echo_success "PostgreSQL is running in Docker"
else
    echo_error "PostgreSQL is not running"
    echo "  Check: systemctl status postgresql"
    echo "  Or: docker ps | grep postgres"
fi

# Check Redis
echo ""
echo "Redis status:"
if service_running redis; then
    echo_success "Redis service is running"
elif service_running redis-server; then
    echo_success "Redis server is running"
elif docker ps | grep -q redis; then
    echo_success "Redis is running in Docker"
else
    echo_warning "Redis is not running (application may still work)"
    echo "  Check: systemctl status redis"
    echo "  Or: docker ps | grep redis"
fi

# Check Nginx
echo ""
echo "Nginx status:"
if service_running nginx; then
    echo_success "Nginx is running"
    
    # Check proxy configuration
    if [ -f "/etc/nginx/sites-enabled/new-api-dev.digitalsite.com" ]; then
        echo_success "Nginx site configuration exists"
        echo "Proxy configuration:"
        grep -A 2 -B 2 "proxy_pass.*:$TARGET_PORT" /etc/nginx/sites-enabled/new-api-dev.digitalsite.com 2>/dev/null || echo "Proxy to port $TARGET_PORT not found"
    else
        echo_warning "Nginx site configuration not found"
    fi
else
    echo_warning "Nginx is not running"
fi

# 9. PM2 Logs Analysis
echo_header "9. PM2 Logs Analysis"

if command_exists pm2 && pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    echo "Recent PM2 logs (last 30 lines):"
    pm2 logs "$APP_NAME" --lines 30 --nostream 2>/dev/null || echo "No PM2 logs available"
    
    echo ""
    echo "PM2 error logs:"
    if [ -f "$DEPLOYMENT_PATH/logs/pm2-error.log" ]; then
        echo "Last 20 lines of error log:"
        tail -n 20 "$DEPLOYMENT_PATH/logs/pm2-error.log"
    else
        echo "No PM2 error log found"
    fi
else
    echo_warning "Cannot analyze PM2 logs - process not found"
fi

# 10. Actionable Recommendations
echo_header "10. Actionable Recommendations"

echo "Based on the diagnostic results, here are the recommended actions:"
echo ""

# Generate specific recommendations based on findings
if ! command_exists pm2; then
    echo_error "CRITICAL: Install PM2"
    echo "  Run: npm install -g pm2"
    echo ""
fi

if [ ! -d "$DEPLOYMENT_PATH" ]; then
    echo_error "CRITICAL: Deployment directory missing"
    echo "  Run your deployment script to create $DEPLOYMENT_PATH"
    echo ""
fi

if [ -d "$DEPLOYMENT_PATH" ]; then
    cd "$DEPLOYMENT_PATH"
    
    if [ ! -f "dist/index.js" ]; then
        echo_error "CRITICAL: Application not built"
        echo "  Run: cd $DEPLOYMENT_PATH && npm run build"
        echo ""
    fi
    
    if [ ! -d "node_modules" ]; then
        echo_error "CRITICAL: Dependencies not installed"
        echo "  Run: cd $DEPLOYMENT_PATH && pnpm install --prod"
        echo ""
    fi
    
    if [ ! -f ".env.staging" ]; then
        echo_warning "Environment file missing"
        echo "  Create .env.staging with required variables"
        echo ""
    fi
fi

if ! port_open "$TARGET_PORT"; then
    echo_warning "Port $TARGET_PORT not responding"
    echo "  1. Check if PM2 process is running: pm2 list"
    echo "  2. Check PM2 logs: pm2 logs $APP_NAME"
    echo "  3. Restart PM2 process: pm2 restart $APP_NAME"
    echo "  4. Or reload PM2 config: cd $DEPLOYMENT_PATH && pm2 startOrReload ecosystem.staging.config.js --env staging"
    echo ""
fi

# Quick fix commands
echo_info "Quick fix commands:"
echo "1. Stop and restart PM2 process:"
echo "   pm2 delete $APP_NAME"
echo "   cd $DEPLOYMENT_PATH && pm2 start ecosystem.staging.config.js --env staging"
echo ""

echo "2. Full rebuild and restart:"
echo "   cd $DEPLOYMENT_PATH"
echo "   pnpm install --prod"
echo "   npm run build"
echo "   npx prisma generate"
echo "   pm2 startOrReload ecosystem.staging.config.js --env staging"
echo ""

echo "3. Check real-time logs:"
echo "   pm2 logs $APP_NAME --lines 50"
echo ""

echo "4. Test direct startup:"
echo "   cd $DEPLOYMENT_PATH"
echo "   NODE_ENV=staging PORT=$TARGET_PORT node dist/index.js"
echo ""

echo_header "Diagnostic Complete"
echo "Time: $(date)"
echo ""
echo "If issues persist after following recommendations:"
echo "1. Check system resources: htop or top"
echo "2. Check disk space: df -h"
echo "3. Check firewall: ufw status"
echo "4. Review application logs in detail"
echo "5. Consider restarting the server if all else fails"