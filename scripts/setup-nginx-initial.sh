#!/bin/bash

# Initial nginx setup script for automated deployment
# This runs without SSL first, then SSL can be added manually

set -e

DOMAIN="new-api-dev.digitalsite.com"
APP_PORT="3001"

echo "=== Initial Nginx Setup for $DOMAIN ==="
echo ""

# 1. Install nginx
echo "1. Installing nginx..."
sudo apt-get update
sudo apt-get install -y nginx

# 2. Create directories
echo "2. Creating directories..."
sudo mkdir -p /var/www/certbot
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled
sudo mkdir -p /var/log/nginx

# 3. Create initial HTTP-only configuration
echo "3. Creating initial nginx configuration..."
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null <<EOF
# HTTP server configuration
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Logging
    access_log /var/log/nginx/$DOMAIN.access.log;
    error_log /var/log/nginx/$DOMAIN.error.log;

    # Maximum upload size
    client_max_body_size 100M;

    # Let's Encrypt verification location
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Proxy all requests to Node.js app
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /nginx-health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# 4. Enable the site
echo "4. Enabling site..."
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default || true

# 5. Test configuration
echo "5. Testing nginx configuration..."
sudo nginx -t

# 6. Start/reload nginx
echo "6. Starting nginx..."
sudo systemctl enable nginx
sudo systemctl restart nginx

# 7. Configure firewall
echo "7. Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 'Nginx HTTP' || true
    sudo ufw allow 'Nginx HTTPS' || true
    sudo ufw allow OpenSSH || true
    echo "y" | sudo ufw enable || true
fi

echo ""
echo "=== Initial Nginx Setup Complete! ==="
echo ""
echo "The application is now accessible at:"
echo "  http://$DOMAIN"
echo ""
echo "To add SSL certificate, run:"
echo "  sudo certbot --nginx -d $DOMAIN"
echo ""
echo "Or use the full SSL setup script:"
echo "  ./scripts/setup-ssl.sh"
echo ""