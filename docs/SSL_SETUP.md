# SSL and Domain Setup Guide

This guide explains how to set up SSL certificates and configure the domain `new-api-dev.digitalsite.com` for the staging environment.

## Prerequisites

1. Domain DNS is configured to point to your server's IP address
2. Server has ports 80 and 443 open
3. You have sudo access on the server

## Automatic Setup (During Deployment)

The deployment workflow automatically:
1. Installs nginx
2. Creates an HTTP-only configuration
3. Sets up reverse proxy to the application on port 3001

## Manual SSL Certificate Setup

After the initial deployment, SSH into the server and run:

```bash
cd /opt/funnel-builder-staging
sudo ./scripts/setup-ssl.sh
```

This script will:
1. Install Certbot
2. Obtain a Let's Encrypt SSL certificate
3. Configure nginx with HTTPS
4. Set up automatic certificate renewal
5. Configure security headers

## Domain Configuration

The application is configured to use:
- **Domain**: `new-api-dev.digitalsite.com`
- **Internal Port**: `3001`
- **Public Ports**: `80` (HTTP), `443` (HTTPS)

## File Locations

- **Nginx Config**: `/etc/nginx/sites-available/new-api-dev.digitalsite.com`
- **SSL Certificates**: `/etc/letsencrypt/live/new-api-dev.digitalsite.com/`
- **Nginx Logs**: `/var/log/nginx/new-api-dev.digitalsite.com.*.log`
- **Application**: `/opt/funnel-builder-staging/`

## Testing the Setup

1. **Test HTTP**: `curl http://new-api-dev.digitalsite.com/health`
2. **Test HTTPS**: `curl https://new-api-dev.digitalsite.com/health`
3. **Check Certificate**: `openssl s_client -connect new-api-dev.digitalsite.com:443 -servername new-api-dev.digitalsite.com`

## Certificate Renewal

Certificates auto-renew via systemd timer. To test renewal:

```bash
sudo certbot renew --dry-run
```

## Troubleshooting

### SSL Certificate Issues
```bash
# Check Certbot logs
sudo journalctl -u certbot

# Manually renew
sudo certbot renew

# Reconfigure nginx
sudo certbot --nginx -d new-api-dev.digitalsite.com
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/new-api-dev.digitalsite.com.error.log

# Restart nginx
sudo systemctl restart nginx
```

### Application Not Accessible
```bash
# Check if app is running
pm2 list

# Check if port 3001 is listening
sudo netstat -tlnp | grep :3001

# Check PM2 logs
pm2 logs funnel-builder-staging
```

## Security Headers

The nginx configuration includes:
- HSTS (Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Content Security Policy
- Referrer Policy

## Manual Nginx Configuration

If you need to manually configure nginx:

1. Create the configuration file:
```bash
sudo nano /etc/nginx/sites-available/new-api-dev.digitalsite.com
```

2. Copy the configuration from `nginx/sites-available/new-api-dev.digitalsite.com`

3. Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/new-api-dev.digitalsite.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. Obtain SSL certificate:
```bash
sudo certbot --nginx -d new-api-dev.digitalsite.com
```