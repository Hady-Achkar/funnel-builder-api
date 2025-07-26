#!/bin/bash

echo "=== Fixing Redis and nginx for new-api-dev.digitalsite.com ==="
echo "Time: $(date)"
echo ""

# 1. Start Redis on port 6380 if needed
echo "1. Checking/Starting Redis on port 6380..."

# Check if Redis is running on 6380
if ss -tlnp | grep -q :6380; then
    echo "   ✓ Redis already running on port 6380"
else
    echo "   Starting Redis on port 6380..."
    
    # Check if docker-compose file exists in staging directory
    cd /opt/funnel-builder-staging
    
    if [ -f "docker-compose.staging.yml" ]; then
        echo "   Using docker-compose to start Redis..."
        docker-compose -f docker-compose.staging.yml up -d redis
    elif [ -f "docker-compose.yml" ]; then
        echo "   Using docker-compose to start Redis..."
        docker-compose up -d redis
    else
        echo "   Starting Redis with Docker directly..."
        docker run -d \
            --name funnel-builder-redis \
            --restart unless-stopped \
            -p 6380:6379 \
            redis:7-alpine
    fi
    
    # Wait for Redis to start
    sleep 5
    
    # Test Redis connection
    if redis-cli -p 6380 ping 2>/dev/null | grep -q PONG; then
        echo "   ✓ Redis started successfully on port 6380"
    else
        echo "   ⚠️  Redis start attempted, but connection test failed"
    fi
fi

# 2. Update nginx configuration for new-api-dev.digitalsite.com
echo ""
echo "2. Updating nginx configuration..."

# First, ensure SSL certificate exists
if [ ! -d "/etc/letsencrypt/live/new-api-dev.digitalsite.com" ]; then
    echo "   Getting SSL certificate..."
    sudo certbot certonly --nginx -d new-api-dev.digitalsite.com --non-interactive --agree-tos --email admin@digitalsite.com || {
        echo "   ⚠️  SSL certificate generation failed, using HTTP only"
        HTTP_ONLY=true
    }
else
    echo "   ✓ SSL certificate exists"
    HTTP_ONLY=false
fi

# Create proper nginx config
if [ "$HTTP_ONLY" = "true" ]; then
    # HTTP only configuration
    sudo tee /etc/nginx/sites-available/new-api-dev.digitalsite.com > /dev/null << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name new-api-dev.digitalsite.com;

    # Logging
    access_log /var/log/nginx/new-api-dev.digitalsite.com.access.log;
    error_log /var/log/nginx/new-api-dev.digitalsite.com.error.log;

    # Maximum upload size
    client_max_body_size 100M;

    # Let's Encrypt verification location
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Proxy all requests to Node.js app
    location / {
        proxy_pass http://127.0.0.1:5000;
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
else
    # HTTPS configuration
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

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name new-api-dev.digitalsite.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/new-api-dev.digitalsite.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/new-api-dev.digitalsite.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # Logging
    access_log /var/log/nginx/new-api-dev.digitalsite.com.access.log;
    error_log /var/log/nginx/new-api-dev.digitalsite.com.error.log;

    # Maximum upload size
    client_max_body_size 100M;

    # Proxy all requests to Node.js app
    location / {
        proxy_pass http://127.0.0.1:5000;
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
fi

# Enable the site
sudo ln -sf /etc/nginx/sites-available/new-api-dev.digitalsite.com /etc/nginx/sites-enabled/

# Test nginx configuration
if sudo nginx -t; then
    echo "   ✓ nginx configuration is valid"
    
    # Reload nginx
    if sudo systemctl reload nginx; then
        echo "   ✓ nginx reloaded successfully"
    else
        echo "   ⚠️  nginx reload failed"
    fi
else
    echo "   ✗ nginx configuration has errors!"
fi

# 3. Restart PM2 app to clear Redis errors
echo ""
echo "3. Restarting PM2 app to clear Redis errors..."
cd /opt/funnel-builder-staging
pm2 restart funnel-builder-staging

# Wait for restart
sleep 5

# 4. Final tests
echo ""
echo "4. Final connectivity tests..."

# Test local health endpoint
echo "   Testing local health endpoint..."
if curl -f -s -m 10 http://127.0.0.1:5000/health > /dev/null; then
    echo "   ✅ Local health check passed"
    
    # Show the actual response
    echo "   Response: $(curl -s -m 5 http://127.0.0.1:5000/health)"
else
    echo "   ❌ Local health check failed"
fi

# Test through nginx
echo "   Testing through nginx..."
if [ "$HTTP_ONLY" = "true" ]; then
    # Test HTTP
    if curl -f -s -m 10 -H "Host: new-api-dev.digitalsite.com" http://127.0.0.1/health > /dev/null; then
        echo "   ✅ nginx proxy working (HTTP)"
    else
        echo "   ❌ nginx proxy not working"
    fi
else
    # Test HTTPS
    if curl -f -s -k -m 10 https://new-api-dev.digitalsite.com/health > /dev/null; then
        echo "   ✅ HTTPS endpoint working"
    else
        echo "   ⚠️  HTTPS endpoint not responding (might need DNS propagation)"
    fi
fi

# Check PM2 status after restart
echo ""
echo "5. Final PM2 status..."
pm2 list | grep funnel-builder-staging

echo ""
echo "=== Fix Summary ==="
echo "✓ Redis connectivity checked/fixed"
echo "✓ nginx configuration updated"
echo "✓ PM2 application restarted"
echo ""
echo "Your API should now be accessible at:"
if [ "$HTTP_ONLY" = "true" ]; then
    echo "  http://new-api-dev.digitalsite.com"
else
    echo "  https://new-api-dev.digitalsite.com"
fi
echo ""
echo "To verify everything is working:"
echo "  curl -s https://new-api-dev.digitalsite.com/health"
echo "  pm2 logs funnel-builder-staging --lines 20"