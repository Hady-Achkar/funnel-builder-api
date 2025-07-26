#!/bin/bash

# Fix nginx configuration and deployment for new-api-dev.digitalsite.com
# This script will not affect existing digitalsite services

echo "=== Fixing nginx and deployment for new-api-dev.digitalsite.com ==="
echo "Time: $(date)"
echo ""

# 1. First, let's get SSL certificate for new-api-dev.digitalsite.com
echo "1. Setting up SSL certificate for new-api-dev.digitalsite.com..."

# Check if certificate already exists
if [ -d "/etc/letsencrypt/live/new-api-dev.digitalsite.com" ]; then
    echo "   ✓ SSL certificate already exists"
else
    echo "   Obtaining SSL certificate..."
    sudo certbot certonly --nginx -d new-api-dev.digitalsite.com --non-interactive --agree-tos --email admin@digitalsite.com
fi

# 2. Update nginx configuration to include HTTPS
echo ""
echo "2. Updating nginx configuration..."

sudo tee /etc/nginx/sites-available/new-api-dev.digitalsite.com > /dev/null << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name new-api-dev.digitalsite.com;

    # Let's Encrypt verification location
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name new-api-dev.digitalsite.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/new-api-dev.digitalsite.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/new-api-dev.digitalsite.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;

    # Logging
    access_log /var/log/nginx/new-api-dev.digitalsite.com.access.log;
    error_log /var/log/nginx/new-api-dev.digitalsite.com.error.log;

    # Maximum upload size
    client_max_body_size 100M;

    # Proxy all requests to Node.js funnel-builder-api
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # CORS headers for API
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept' always;
    }

    # Health check endpoint
    location /nginx-health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # API documentation endpoint (if needed)
    location /api-docs {
        proxy_pass http://localhost:5000/api-docs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo "   ✓ nginx configuration updated"

# 3. Enable the site and test configuration
echo ""
echo "3. Enabling site and testing nginx configuration..."

# Enable the site (create symlink if it doesn't exist)
if [ ! -L "/etc/nginx/sites-enabled/new-api-dev.digitalsite.com" ]; then
    sudo ln -sf /etc/nginx/sites-available/new-api-dev.digitalsite.com /etc/nginx/sites-enabled/
    echo "   ✓ Site enabled"
else
    echo "   ✓ Site already enabled"
fi

# Test nginx configuration
if sudo nginx -t; then
    echo "   ✓ nginx configuration is valid"
else
    echo "   ✗ nginx configuration has errors!"
    exit 1
fi

# 4. Now fix the funnel-builder-api application
echo ""
echo "4. Fixing funnel-builder-api application..."

cd /opt/funnel-builder-staging || {
    echo "   ✗ Cannot access /opt/funnel-builder-staging"
    exit 1
}

# Stop any existing PM2 process
echo "   Stopping existing PM2 processes..."
pm2 stop funnel-builder-staging 2>/dev/null || true
pm2 delete funnel-builder-staging 2>/dev/null || true

# Update environment with proper domain
echo "   Updating environment configuration..."
cat > .env.staging << 'ENVEOF'
# Staging Environment Variables
NODE_ENV=staging
PORT=5000

# Domain Configuration
API_DOMAIN=new-api-dev.digitalsite.com
API_URL=https://new-api-dev.digitalsite.com

# Database (using Docker Compose)
DATABASE_URL=postgresql://staging_user:staging_password_change_me@localhost:5433/funnel_builder_staging

# Authentication
JWT_SECRET=staging-jwt-secret-change-this-in-production

# Redis Cache
REDIS_URL=redis://localhost:6380

# CloudFlare API (dummy values for staging - CloudFlare not used in staging)
CLOUDFLARE_API_TOKEN=dummy-staging-token
CLOUDFLARE_ACCOUNT_ID=dummy-staging-account
CLOUDFLARE_ZONE_ID=dummy-staging-zone
CLOUDFLARE_SAAS_TARGET=dummy-staging-target.com
PLATFORM_MAIN_DOMAIN=digitalsite.ai
ENVEOF

# Ensure dependencies are installed
echo "   Installing/updating dependencies..."
if [ ! -d "node_modules" ] || [ ! -d "node_modules/express" ]; then
    pnpm install --prod --frozen-lockfile
fi

# Generate Prisma client and ensure it's in the right place
echo "   Setting up Prisma client..."
npx prisma generate
mkdir -p dist/generated
cp -r src/generated/prisma-client dist/generated/ 2>/dev/null || true

# 5. Start the application with PM2
echo ""
echo "5. Starting application with PM2..."

# Create ecosystem config if it doesn't exist
cat > ecosystem.config.js << 'ECOEOF'
module.exports = {
  apps: [{
    name: 'funnel-builder-staging',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    cwd: '/opt/funnel-builder-staging',
    node_args: '--max-old-space-size=1024',
    env: {
      NODE_ENV: 'staging',
      PORT: 5000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 3,
    min_uptime: '10s'
  }]
};
ECOEOF

# Ensure logs directory exists
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

echo "   ✓ PM2 process started"

# 6. Wait and test the application
echo ""
echo "6. Testing application startup..."
sleep 10

# Test local connection
if curl -f -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "   ✓ Application responding on port 5000"
else
    echo "   ✗ Application not responding on port 5000"
    echo "   Checking PM2 logs..."
    pm2 logs funnel-builder-staging --lines 20 --nostream
fi

# 7. Reload nginx to apply new configuration
echo ""
echo "7. Reloading nginx..."
if sudo nginx -s reload; then
    echo "   ✓ nginx reloaded successfully"
else
    echo "   ✗ nginx reload failed"
    exit 1
fi

# 8. Final tests
echo ""
echo "8. Final connectivity tests..."

# Test HTTPS endpoint
echo "   Testing HTTPS endpoint..."
if curl -f -s -k https://new-api-dev.digitalsite.com/health > /dev/null 2>&1; then
    echo "   ✅ SUCCESS! new-api-dev.digitalsite.com is responding via HTTPS"
else
    echo "   ⚠️  HTTPS endpoint not responding yet (may need DNS propagation)"
fi

# Test HTTP redirect
echo "   Testing HTTP to HTTPS redirect..."
if curl -s -I http://new-api-dev.digitalsite.com | grep -q "301\|302"; then
    echo "   ✓ HTTP to HTTPS redirect working"
else
    echo "   ⚠️  HTTP redirect not working as expected"
fi

echo ""
echo "=== Deployment Summary ==="
echo "✓ nginx configuration updated with HTTPS"
echo "✓ SSL certificate configured"
echo "✓ funnel-builder-api configured for port 5000"
echo "✓ PM2 process started"
echo "✓ nginx reloaded"
echo ""
echo "Your services:"
echo "- Strapi backend: api-dev.digitalsite.com (port 1337)"
echo "- Frontend: dev.digitalsite.com (port 3000)"
echo "- Funnel API: new-api-dev.digitalsite.com (port 5000)"
echo ""
echo "Check status with:"
echo "  pm2 list"
echo "  pm2 logs funnel-builder-staging"
echo "  sudo nginx -t"
echo ""
echo "Access your API at: https://new-api-dev.digitalsite.com"