# Hostinger Django Backend Deployment Guide

## Prerequisites
- Hostinger VPS or Business Hosting with SSH access
- PostgreSQL database created in Hostinger
- Python 3.9+ installed on server
- SSH client access

## Step 1: Connect to Your Hostinger Server

```bash
ssh root@your_server_ip
# or with a specific user
ssh username@your_server_ip
```

## Step 2: Install System Dependencies

```bash
# Update package manager
apt update && apt upgrade -y

# Install Python and pip
apt install python3 python3-pip python3-venv -y

# Install PostgreSQL client
apt install postgresql-client -y

# Install Nginx (web server)
apt install nginx -y

# Install supervisor (process manager)
apt install supervisor -y

# Install Redis (for Celery task queue)
apt install redis-server -y

# Install other dependencies
apt install build-essential libpq-dev -y
```

## Step 3: Clone Repository and Setup

```bash
# Navigate to desired directory
cd /var/www

# Clone your repository
git clone https://github.com/your-org/vizzy-chat-ai.git
cd vizzy-chat-ai/backend

# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

## Step 4: Configure Environment Variables

Create `.env` file in `/var/www/vizzy-chat-ai/backend/`:

```bash
# Django Settings
DEBUG=False
DJANGO_SECRET_KEY=your-super-secret-key-here-change-this-in-production
ALLOWED_HOSTS=your-domain.com,www.your-domain.com,your_server_ip

# Database Configuration (PostgreSQL)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=deckoviz_db
DB_USER=deckoviz_user
DB_PASSWORD=your-secure-db-password
DB_HOST=your-hostinger-db-host
DB_PORT=5432

# Media Files
MEDIA_URL=/media/
MEDIA_ROOT=/var/www/vizzy-chat-ai/backend/media
FILE_UPLOAD_TEMP_DIR=/var/www/vizzy-chat-ai/backend/tmp

# Static Files
STATIC_URL=/static/
STATIC_ROOT=/var/www/vizzy-chat-ai/backend/staticfiles

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

# CORS (Update with your frontend domain)
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Google OAuth (if using authentication)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Step 5: Create Database

If using Hostinger's managed PostgreSQL:

```bash
# Connect to Hostinger's PostgreSQL
psql -h your-db-host -U postgres -c "CREATE DATABASE deckoviz_db;"
psql -h your-db-host -U postgres -c "CREATE USER deckoviz_user WITH PASSWORD 'your-secure-password';"
psql -h your-db-host -U postgres -c "ALTER ROLE deckoviz_user SET client_encoding TO 'utf8';"
psql -h your-db-host -U postgres -c "ALTER ROLE deckoviz_user SET default_transaction_isolation TO 'read committed';"
psql -h your-db-host -U postgres -c "ALTER ROLE deckoviz_user SET default_transaction_deferrable TO on;"
psql -h your-db-host -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE deckoviz_db TO deckoviz_user;"
```

## Step 6: Initialize Database

```bash
cd /var/www/vizzy-chat-ai/backend

# Activate virtual environment
source venv/bin/activate

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Create necessary directories
mkdir -p media tmp logs
chmod -R 755 media tmp logs
```

## Step 7: Configure Gunicorn

Create `/etc/systemd/system/gunicorn.service`:

```ini
[Unit]
Description=Deckoviz Django Application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/vizzy-chat-ai/backend
ExecStart=/var/www/vizzy-chat-ai/backend/venv/bin/gunicorn \
    --workers 4 \
    --worker-class sync \
    --bind 127.0.0.1:8000 \
    --timeout 60 \
    --access-logfile /var/www/vizzy-chat-ai/backend/logs/gunicorn-access.log \
    --error-logfile /var/www/vizzy-chat-ai/backend/logs/gunicorn-error.log \
    deckoviz_backend.wsgi:application

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start Gunicorn:

```bash
systemctl daemon-reload
systemctl enable gunicorn
systemctl start gunicorn
systemctl status gunicorn
```

## Step 8: Configure Celery (Background Tasks)

Create `/etc/systemd/system/celery.service`:

```ini
[Unit]
Description=Celery Service
After=network.target

[Service]
Type=forking
User=www-data
Group=www-data
WorkingDirectory=/var/www/vizzy-chat-ai/backend
Environment="PATH=/var/www/vizzy-chat-ai/backend/venv/bin"
ExecStart=/var/www/vizzy-chat-ai/backend/venv/bin/celery -A deckoviz_backend worker -l info

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start Celery:

```bash
systemctl daemon-reload
systemctl enable celery
systemctl start celery
systemctl status celery
```

## Step 9: Configure Nginx

Create `/etc/nginx/sites-available/deckoviz`:

```nginx
upstream deckoviz_app {
    server 127.0.0.1:8000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Certificate (use Let's Encrypt via Certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Client upload limits
    client_max_body_size 50M;

    location / {
        proxy_pass http://deckoviz_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Timeouts for large uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location /static/ {
        alias /var/www/vizzy-chat-ai/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /var/www/vizzy-chat-ai/backend/media/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Deny access to sensitive files
    location ~ /\.well-known {
        allow all;
    }
    
    location ~ /\. {
        deny all;
    }
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/deckoviz /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

## Step 10: Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Generate certificate
certbot certonly --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal (already configured with apt installation)
systemctl enable certbot.timer
systemctl start certbot.timer
```

## Step 11: Configure Firewall

```bash
# Enable UFW firewall
ufw enable

# Allow SSH
ufw allow ssh

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS
ufw allow 443/tcp

# Check firewall status
ufw status
```

## Step 12: Database Backups

Create backup script `/usr/local/bin/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/deckoviz"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -h your-db-host -U deckoviz_user deckoviz_db | \
  gzip > $BACKUP_DIR/deckoviz_db_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete
```

Make executable and add to crontab:

```bash
chmod +x /usr/local/bin/backup-db.sh
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-db.sh
```

## Step 13: Monitor Services

```bash
# Check Gunicorn status
systemctl status gunicorn

# Check Celery status
systemctl status celery

# Check Nginx status
systemctl status nginx

# Check Redis status
systemctl status redis-server

# View logs
tail -f /var/www/vizzy-chat-ai/backend/logs/gunicorn-error.log
tail -f /var/www/vizzy-chat-ai/backend/logs/django.log
```

## Step 14: Deploy Updates

```bash
cd /var/www/vizzy-chat-ai/backend
source venv/bin/activate

# Pull latest changes
git pull origin main

# Install new dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Restart services
systemctl restart gunicorn
systemctl restart celery
systemctl restart nginx
```

## Troubleshooting

### Check if application is running
```bash
curl http://127.0.0.1:8000/api/
```

### View Gunicorn logs
```bash
journalctl -u gunicorn -n 50 --no-pager
```

### View Celery logs
```bash
journalctl -u celery -n 50 --no-pager
```

### Restart all services
```bash
systemctl restart gunicorn celery nginx redis-server
```

### Database connection issues
```bash
# Test PostgreSQL connection
psql -h your-db-host -U deckoviz_user -d deckoviz_db -c "SELECT 1;"
```

## Performance Optimization

1. **Enable Redis caching** in Django settings
2. **Use CDN** for static files and media
3. **Enable Gzip compression** in Nginx (already configured)
4. **Monitor resources** with `htop` or similar
5. **Scale Gunicorn workers** based on CPU cores: `--workers $(nproc --all)`

## Security Checklist

- [ ] Change default passwords
- [ ] Enable firewall
- [ ] Setup SSL certificates
- [ ] Configure CORS properly
- [ ] Use strong Django secret key
- [ ] Enable HTTPS redirects
- [ ] Setup database backups
- [ ] Monitor logs regularly
- [ ] Keep system packages updated
- [ ] Setup fail2ban for brute force protection

---

For support, refer to Hostinger documentation or Django/Nginx community resources.
