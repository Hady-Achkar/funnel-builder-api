#!/bin/bash

# Azure VM Setup Script for Funnel Builder API
# This script sets up a fresh Ubuntu VM for deployment

set -e

echo "🚀 Setting up Azure VM for Funnel Builder API..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
echo "📦 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
echo "📦 Installing pnpm..."
sudo npm install -g pnpm

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install PostgreSQL
echo "📦 Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Install Redis
echo "📦 Installing Redis..."
sudo apt install -y redis-server

# Configure PostgreSQL
echo "🔧 Configuring PostgreSQL..."
sudo -u postgres createuser --createdb --pwprompt funnel_builder || echo "User already exists"
sudo -u postgres createdb funnel_builder_prod -O funnel_builder || echo "Database already exists"
sudo -u postgres createdb funnel_builder_staging -O funnel_builder || echo "Database already exists"

# Configure Redis
echo "🔧 Configuring Redis..."
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Create application directories
echo "📁 Creating application directories..."
sudo mkdir -p /opt/funnel-builder
sudo mkdir -p /opt/funnel-builder-staging
sudo mkdir -p /var/log/funnel-builder
sudo mkdir -p /var/log/funnel-builder-staging

# Set up user permissions
echo "🔐 Setting up permissions..."
sudo chown -R $USER:$USER /opt/funnel-builder
sudo chown -R $USER:$USER /opt/funnel-builder-staging
sudo chown -R $USER:$USER /var/log/funnel-builder
sudo chown -R $USER:$USER /var/log/funnel-builder-staging

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 3000/tcp # Production app
sudo ufw allow 3001/tcp # Staging app
sudo ufw --force enable

# Install Nginx (optional reverse proxy)
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Create basic Nginx configuration
echo "🔧 Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/funnel-builder > /dev/null << 'EOF'
# Production
server {
    listen 80;
    server_name _;  # Replace with your domain
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Staging (on different port or subdomain)
server {
    listen 8080;
    server_name _;  # Replace with your staging domain
    
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
    }
}
EOF

# Enable Nginx configuration
sudo ln -sf /etc/nginx/sites-available/funnel-builder /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
sudo systemctl enable nginx

# Set up PM2 to start on boot
echo "🔧 Setting up PM2 startup..."
pm2 startup
echo "Run the command above if this is the first time setting up PM2"

# Create environment file template
echo "📄 Creating environment file template..."
cat > /opt/funnel-builder/.env.example << 'EOF'
# Production Environment Variables
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://funnel_builder:password@localhost:5432/funnel_builder_prod

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secret (generate a secure secret)
JWT_SECRET=your-super-secure-jwt-secret-here

# CloudFlare Configuration
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_ZONE_ID=your-cloudflare-zone-id
CLOUDFLARE_SAAS_TARGET=fallback.yourdomain.com
PLATFORM_MAIN_DOMAIN=yourdomain.com
EOF

cat > /opt/funnel-builder-staging/.env.example << 'EOF'
# Staging Environment Variables
NODE_ENV=staging
PORT=3001

# Database
DATABASE_URL=postgresql://funnel_builder:password@localhost:5432/funnel_builder_staging

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secret (different from production)
JWT_SECRET=your-staging-jwt-secret-here

# CloudFlare Configuration (staging)
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_ZONE_ID=your-staging-cloudflare-zone-id
CLOUDFLARE_SAAS_TARGET=staging-fallback.yourdomain.com
PLATFORM_MAIN_DOMAIN=staging.yourdomain.com
EOF

# Set up log rotation
echo "📋 Setting up log rotation..."
sudo tee /etc/logrotate.d/funnel-builder > /dev/null << 'EOF'
/var/log/funnel-builder/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/funnel-builder-staging/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Create health check script
echo "🔍 Creating health check script..."
cat > /opt/health-check.sh << 'EOF'
#!/bin/bash

# Health check script for Funnel Builder API

check_service() {
    local service_name=$1
    local port=$2
    local url="http://localhost:$port/health"
    
    echo "Checking $service_name at $url..."
    
    if curl -f -s $url > /dev/null; then
        echo "✅ $service_name is healthy"
        return 0
    else
        echo "❌ $service_name is not responding"
        return 1
    fi
}

echo "🔍 Running health checks..."

# Check production
check_service "Production" 3000

# Check staging
check_service "Staging" 3001

# Check system services
echo "Checking system services..."

if systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL is not running"
fi

if systemctl is-active --quiet redis-server; then
    echo "✅ Redis is running"
else
    echo "❌ Redis is not running"
fi

if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
fi

echo "🔍 Health check completed!"
EOF

chmod +x /opt/health-check.sh

# Final instructions
echo ""
echo "🎉 Azure VM setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your environment variables in:"
echo "   - /opt/funnel-builder/.env (production)"
echo "   - /opt/funnel-builder-staging/.env (staging)"
echo ""
echo "2. Set up GitHub Secrets with the following values:"
echo "   For Production VM:"
echo "   - AZURE_PROD_HOST: $(curl -s ifconfig.me)"
echo "   - AZURE_PROD_USERNAME: $USER"
echo "   - AZURE_PROD_SSH_KEY: (your private SSH key)"
echo "   - AZURE_PROD_PORT: 22"
echo ""
echo "   For Staging VM (if different):"
echo "   - AZURE_STAGING_HOST: $(curl -s ifconfig.me)"
echo "   - AZURE_STAGING_USERNAME: $USER"
echo "   - AZURE_STAGING_SSH_KEY: (your private SSH key)"
echo "   - AZURE_STAGING_PORT: 22"
echo ""
echo "3. Configure your database passwords:"
echo "   sudo -u postgres psql -c \"ALTER USER funnel_builder PASSWORD 'your-secure-password';\""
echo ""
echo "4. Run health check: /opt/health-check.sh"
echo ""
echo "🔧 System Information:"
echo "   - Node.js: $(node --version)"
echo "   - pnpm: $(pnpm --version)"
echo "   - PM2: $(pm2 --version)"
echo "   - PostgreSQL: $(psql --version)"
echo "   - Redis: $(redis-server --version)"
echo "   - Nginx: $(nginx -v 2>&1)"
echo ""
echo "🌐 Nginx is configured to proxy:"
echo "   - Production: http://$(curl -s ifconfig.me):80 -> http://localhost:3000"
echo "   - Staging: http://$(curl -s ifconfig.me):8080 -> http://localhost:3001"
echo ""
echo "🔗 Useful commands:"
echo "   - Check app status: pm2 status"
echo "   - View app logs: pm2 logs"
echo "   - Restart apps: pm2 restart all"
echo "   - Health check: /opt/health-check.sh"
echo "   - View Nginx logs: sudo tail -f /var/log/nginx/access.log"