#!/bin/bash

echo "=== URGENT: Fix new-api-dev.digitalsite.com to point to funnel-builder-api (port 5000) ==="
echo "Time: $(date)"
echo ""

echo "🚨 CRITICAL: This domain should run funnel-builder-api (Node.js), NOT Strapi!"
echo ""

# Check current nginx configuration
echo "1. Checking current nginx configuration for new-api-dev.digitalsite.com..."
if [ -f "/etc/nginx/sites-available/new-api-dev.digitalsite.com" ]; then
    echo "   Current proxy configuration:"
    grep -n "proxy_pass" /etc/nginx/sites-available/new-api-dev.digitalsite.com || echo "   No proxy_pass found"
else
    echo "   ❌ nginx config file not found!"
fi

echo ""
echo "2. Checking what's actually running on each port..."
echo "   Port 1337 (Strapi): $(curl -s -m 5 http://localhost:1337/admin 2>/dev/null | head -c 50 || echo 'No response')"
echo "   Port 5000 (Funnel-API): $(curl -s -m 5 http://localhost:5000/health 2>/dev/null || echo 'No response')"

echo ""
echo "3. Updating nginx configuration to point to funnel-builder-api on port 5000..."

# Create the correct nginx configuration
sudo tee /etc/nginx/sites-available/new-api-dev.digitalsite.com > /dev/null << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name new-api-dev.digitalsite.com;

    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server - FUNNEL-BUILDER-API (NOT STRAPI!)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name new-api-dev.digitalsite.com;

    # SSL certificate files
    ssl_certificate /etc/letsencrypt/live/new-api-dev.digitalsite.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/new-api-dev.digitalsite.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/new-api-dev.digitalsite.com.access.log;
    error_log /var/log/nginx/new-api-dev.digitalsite.com.error.log;

    # Maximum upload size
    client_max_body_size 100M;

    # CRITICAL: Proxy to FUNNEL-BUILDER-API on port 5000 (NOT Strapi!)
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
}
EOF

echo "   ✅ nginx configuration updated to proxy to port 5000"

# Enable the site
sudo ln -sf /etc/nginx/sites-available/new-api-dev.digitalsite.com /etc/nginx/sites-enabled/

# Test nginx configuration
echo ""
echo "4. Testing nginx configuration..."
if sudo nginx -t; then
    echo "   ✅ nginx configuration is valid"
    
    # Reload nginx
    echo "   Reloading nginx..."
    if sudo systemctl reload nginx; then
        echo "   ✅ nginx reloaded successfully"
    else
        echo "   ❌ nginx reload failed"
        exit 1
    fi
else
    echo "   ❌ nginx configuration has errors!"
    exit 1
fi

# Check if funnel-builder-api is running on port 5000
echo ""
echo "5. Checking if funnel-builder-api is running on port 5000..."
if curl -f -s -m 10 http://localhost:5000/health > /dev/null; then
    echo "   ✅ funnel-builder-api is running on port 5000"
    echo "   Response: $(curl -s -m 5 http://localhost:5000/health)"
else
    echo "   ❌ funnel-builder-api is NOT running on port 5000!"
    echo "   Checking PM2 status..."
    pm2 list | grep funnel-builder
    
    echo "   Starting funnel-builder-api on port 5000..."
    cd /opt/funnel-builder-staging || exit 1
    
    # Update environment to use port 5000
    if [ -f ".env.staging" ]; then
        sed -i 's/PORT=3001/PORT=5000/g' .env.staging
        echo "   ✅ Updated .env.staging to use port 5000"
    fi
    
    # Restart PM2 with correct port
    pm2 stop funnel-builder-staging || true
    pm2 delete funnel-builder-staging || true
    
    export NODE_ENV=staging
    export PORT=5000
    pm2 start ecosystem.config.js --env staging
    pm2 save
    
    sleep 5
    
    # Test again
    if curl -f -s -m 10 http://localhost:5000/health > /dev/null; then
        echo "   ✅ funnel-builder-api now running on port 5000"
    else
        echo "   ❌ Still not working - check PM2 logs"
        pm2 logs funnel-builder-staging --lines 20
    fi
fi

# Final test through domain
echo ""
echo "6. Testing domain access..."
echo "   Testing: https://new-api-dev.digitalsite.com/health"
if curl -f -k -s -m 10 https://new-api-dev.digitalsite.com/health > /dev/null; then
    echo "   ✅ SUCCESS! Domain now points to funnel-builder-api"
    echo "   Response: $(curl -k -s -m 5 https://new-api-dev.digitalsite.com/health)"
else
    echo "   ⚠️  Domain test failed (might need a few seconds for changes to propagate)"
fi

echo ""
echo "=== VERIFICATION ==="
echo "✅ nginx configured to proxy new-api-dev.digitalsite.com → localhost:5000"
echo "✅ funnel-builder-api should be running on port 5000"
echo "✅ Strapi continues running on port 1337 (api-dev.digitalsite.com)"
echo ""
echo "Test commands:"
echo "  curl https://new-api-dev.digitalsite.com/health  # Should return funnel-builder-api health"
echo "  curl https://api-dev.digitalsite.com/admin      # Should return Strapi admin"
echo ""
echo "If domain still shows Strapi, wait 1-2 minutes for nginx reload to propagate."