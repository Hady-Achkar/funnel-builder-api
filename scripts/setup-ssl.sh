#!/bin/bash

# SSL Setup Script for new-api-dev.digitalsite.com
# This script sets up nginx and Let's Encrypt SSL certificate

set -e

DOMAIN="new-api-dev.digitalsite.com"
EMAIL="admin@digitalsite.com"  # Change this to your email

echo "=== SSL Setup for $DOMAIN ==="
echo ""

# 1. Install required packages
echo "1. Installing required packages..."
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

# 2. Create necessary directories
echo "2. Creating directories..."
sudo mkdir -p /var/www/certbot
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

# 3. Copy nginx configuration
echo "3. Setting up nginx configuration..."
if [ -f "nginx/sites-available/$DOMAIN" ]; then
    sudo cp nginx/sites-available/$DOMAIN /etc/nginx/sites-available/
else
    echo "Error: nginx configuration file not found!"
    echo "Creating basic configuration..."
    
    # Create a basic configuration for initial setup
    sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
fi

# 4. Enable the site
echo "4. Enabling site..."
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 5. Test nginx configuration
echo "5. Testing nginx configuration..."
sudo nginx -t

# 6. Reload nginx
echo "6. Reloading nginx..."
sudo systemctl reload nginx

# 7. Obtain SSL certificate
echo "7. Obtaining SSL certificate..."
echo "   Please make sure your domain $DOMAIN points to this server's IP address!"
echo ""
read -p "Press Enter to continue with SSL certificate generation..."

sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

# 8. Set up auto-renewal
echo "8. Setting up auto-renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# 9. Update nginx configuration with SSL
echo "9. Updating nginx configuration with SSL..."
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null <<'EOF'
# HTTP server - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name new-api-dev.digitalsite.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name new-api-dev.digitalsite.com;

    ssl_certificate /etc/letsencrypt/live/new-api-dev.digitalsite.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/new-api-dev.digitalsite.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    access_log /var/log/nginx/new-api-dev.digitalsite.com.access.log;
    error_log /var/log/nginx/new-api-dev.digitalsite.com.error.log;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /nginx-health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# 10. Test and reload nginx
echo "10. Testing and reloading nginx..."
sudo nginx -t
sudo systemctl reload nginx

# 11. Configure firewall
echo "11. Configuring firewall..."
sudo ufw allow 'Nginx Full' || echo "UFW not installed or already configured"
sudo ufw allow OpenSSH || echo "SSH already allowed"
sudo ufw --force enable || echo "Firewall already enabled"

echo ""
echo "=== SSL Setup Complete! ==="
echo ""
echo "Your site should now be accessible at:"
echo "  https://$DOMAIN"
echo ""
echo "Certificate auto-renewal is configured and will run automatically."
echo "To test renewal: sudo certbot renew --dry-run"
echo ""
echo "Nginx logs:"
echo "  Access: /var/log/nginx/$DOMAIN.access.log"
echo "  Error: /var/log/nginx/$DOMAIN.error.log"
echo ""