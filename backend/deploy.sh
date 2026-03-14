#!/bin/bash

# Deckoviz Backend Deployment Script for Hostinger
# This script automates the deployment process

set -e

echo "================================================"
echo "Deckoviz Backend Deployment Script"
echo "================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Define paths
APP_DIR="/var/www/vizzy-chat-ai/backend"
VENV_DIR="$APP_DIR/venv"

echo -e "${YELLOW}Step 1: Installing system dependencies...${NC}"
apt update && apt upgrade -y
apt install -y python3 python3-pip python3-venv postgresql-client nginx supervisor redis-server build-essential libpq-dev git

echo -e "${YELLOW}Step 2: Creating application directory...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

echo -e "${YELLOW}Step 3: Cloning repository...${NC}"
if [ ! -d ".git" ]; then
    git clone https://github.com/your-org/vizzy-chat-ai.git .
fi
git pull origin main

echo -e "${YELLOW}Step 4: Setting up Python virtual environment...${NC}"
if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv $VENV_DIR
fi
source $VENV_DIR/bin/activate

echo -e "${YELLOW}Step 5: Installing Python dependencies...${NC}"
pip install --upgrade pip
pip install -r requirements.txt

echo -e "${YELLOW}Step 6: Creating .env file...${NC}"
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}Please edit .env file with your configuration${NC}"
        read -p "Press Enter after configuring .env..."
    fi
fi

echo -e "${YELLOW}Step 7: Setting up directories...${NC}"
mkdir -p media tmp logs staticfiles
chmod -R 755 media tmp logs

echo -e "${YELLOW}Step 8: Running database migrations...${NC}"
python manage.py migrate

echo -e "${YELLOW}Step 9: Collecting static files...${NC}"
python manage.py collectstatic --noinput

echo -e "${YELLOW}Step 10: Creating superuser (optional)...${NC}"
read -p "Do you want to create a superuser? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    python manage.py createsuperuser
fi

echo -e "${YELLOW}Step 11: Configuring Gunicorn service...${NC}"
cat > /etc/systemd/system/gunicorn.service << EOF
[Unit]
Description=Deckoviz Django Application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=$APP_DIR
ExecStart=$VENV_DIR/bin/gunicorn \\
    --workers 4 \\
    --worker-class sync \\
    --bind 127.0.0.1:8000 \\
    --timeout 60 \\
    --access-logfile $APP_DIR/logs/gunicorn-access.log \\
    --error-logfile $APP_DIR/logs/gunicorn-error.log \\
    deckoviz_backend.wsgi:application

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable gunicorn
systemctl start gunicorn

echo -e "${YELLOW}Step 12: Configuring Celery service...${NC}"
cat > /etc/systemd/system/celery.service << EOF
[Unit]
Description=Celery Service
After=network.target

[Service]
Type=forking
User=www-data
Group=www-data
WorkingDirectory=$APP_DIR
Environment="PATH=$VENV_DIR/bin"
ExecStart=$VENV_DIR/bin/celery -A deckoviz_backend worker -l info

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable celery
systemctl start celery

echo -e "${YELLOW}Step 13: Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/deckoviz << 'NGINX_EOF'
upstream deckoviz_app {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    listen [::]:80;
    server_name _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://deckoviz_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /static/ {
        alias $APP_DIR/staticfiles/;
        expires 30d;
    }

    location /media/ {
        alias $APP_DIR/media/;
        expires 7d;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/deckoviz /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

echo -e "${YELLOW}Step 14: Setting up firewall...${NC}"
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

echo -e "${YELLOW}Step 15: Verifying services...${NC}"
echo "Checking Gunicorn..."
systemctl status gunicorn --no-pager | head -n 5

echo "Checking Celery..."
systemctl status celery --no-pager | head -n 5

echo "Checking Nginx..."
systemctl status nginx --no-pager | head -n 5

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Backend URL: http://your-server-ip/api/"
echo ""
echo "Next steps:"
echo "1. Update your .env file with production settings"
echo "2. Setup SSL certificate: certbot certonly --nginx -d your-domain.com"
echo "3. Update Nginx configuration with your domain and SSL cert"
echo "4. Configure database backups"
echo "5. Monitor logs: tail -f $APP_DIR/logs/gunicorn-error.log"
echo ""
