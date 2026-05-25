#!/bin/bash

# Vizzy Chat AI - Hostinger VPS Automated Deployment Script
# Run this script on your Hostinger VPS server

set -e  # Exit on error

echo "================================================"
echo "Vizzy Chat AI - Hostinger Deployment Script"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[i]${NC} $1"
}

# Step 1: Update system
print_info "Step 1: Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_status "System updated"

# Step 2: Install Node.js and npm
print_info "Step 2: Installing Node.js and npm..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
print_status "Node.js and npm installed"

# Step 3: Install pnpm
print_info "Step 3: Installing pnpm..."
npm install -g pnpm
pnpm --version
print_status "pnpm installed"

# Step 4: Install Nginx
print_info "Step 4: Installing Nginx..."
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
print_status "Nginx installed and started"

# Step 5: Install PM2 globally
print_info "Step 5: Installing PM2..."
sudo npm install -g pm2
pm2 --version
print_status "PM2 installed"

# Step 6: Clone repository
print_info "Step 6: Cloning your GitHub repository..."
cd /home
sudo git clone https://github.com/GSWAYAM9/vizzy-chat-ai.git vizzy-chat-ai
cd vizzy-chat-ai
print_status "Repository cloned"

# Step 7: Create .env.local file
print_info "Step 7: Creating environment configuration..."
sudo cat > .env.local << 'EOF'
# Database
DATABASE_URL=YOUR_DATABASE_URL_HERE

# Groq API
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE

# Stability AI
STABILITY_AI_API_KEY=YOUR_STABILITY_AI_KEY_HERE

# Next.js
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN_HERE

# Optional: Analytics or other services
NEXTAUTH_SECRET=$(openssl rand -base64 32)
EOF

print_status ".env.local created (UPDATE WITH YOUR KEYS!)"
print_error "IMPORTANT: Edit .env.local with your actual API keys:"
echo "  sudo nano .env.local"

# Step 8: Install dependencies
print_info "Step 8: Installing dependencies..."
sudo pnpm install
print_status "Dependencies installed"

# Step 9: Build application
print_info "Step 9: Building Next.js application..."
sudo pnpm run build
print_status "Application built successfully"

# Step 10: Start with PM2
print_info "Step 10: Starting application with PM2..."
sudo pm2 start "pnpm start" --name "vizzy-chat-ai"
sudo pm2 save
sudo pm2 startup
print_status "Application started with PM2"

# Step 11: Configure Nginx
print_info "Step 11: Configuring Nginx reverse proxy..."
sudo tee /etc/nginx/sites-available/vizzy-chat-ai > /dev/null << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN_HERE;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/vizzy-chat-ai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
print_status "Nginx configured"

# Step 12: Install SSL Certificate with Certbot
print_info "Step 12: Installing SSL certificate..."
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN_HERE --non-interactive --agree-tos -m your-email@example.com
print_status "SSL certificate installed"

# Step 13: Set up auto-renewal
print_info "Step 13: Setting up SSL auto-renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
print_status "SSL auto-renewal configured"

# Step 14: Check application status
print_info "Step 14: Checking application status..."
pm2 status
print_status "Application is running!"

echo ""
echo "================================================"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Edit your environment variables:"
echo "   sudo nano /home/vizzy-chat-ai/.env.local"
echo ""
echo "2. Update these placeholders in Nginx config:"
echo "   sudo nano /etc/nginx/sites-available/vizzy-chat-ai"
echo "   - Replace YOUR_DOMAIN_HERE with your domain"
echo "   sudo systemctl restart nginx"
echo ""
echo "3. Access your application:"
echo "   http://YOUR_DOMAIN_HERE (or http://YOUR_SERVER_IP)"
echo ""
echo "4. View application logs:"
echo "   pm2 logs vizzy-chat-ai"
echo ""
echo "5. Restart application after config changes:"
echo "   pm2 restart vizzy-chat-ai"
echo ""
echo "================================================"
