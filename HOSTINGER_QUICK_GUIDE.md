# Vizzy Chat AI - Hostinger VPS Deployment Quick Guide

## What This Script Does

The automated deployment script (`deploy-hostinger.sh`) will:

1. ✓ Update system packages
2. ✓ Install Node.js 18 and npm
3. ✓ Install pnpm package manager
4. ✓ Install Nginx web server
5. ✓ Install PM2 (process manager for 24/7 uptime)
6. ✓ Clone your GitHub repository
7. ✓ Create environment configuration
8. ✓ Install project dependencies
9. ✓ Build the Next.js application
10. ✓ Start application with PM2
11. ✓ Configure Nginx reverse proxy
12. ✓ Install SSL certificate (HTTPS)
13. ✓ Set up automatic SSL renewal

**Total Time: ~15-20 minutes**

---

## Step-by-Step Instructions

### Step 1: Gather Your Credentials

Before running the script, collect these from your accounts:

**Database URL (Neon):**
- Go to https://console.neon.tech
- Find your connection string
- Copy the full URL: `postgresql://...`

**Groq API Key:**
- Go to https://console.groq.com
- Create/copy your API key
- Format: `gsk_...`

**Stability AI Key:**
- Go to https://platform.stability.ai/account/keys
- Create/copy your API key
- Format: `sk_...`

**Your Domain/IP:**
- If you have a domain: `example.com`
- If using IP: `123.45.67.89`

---

### Step 2: Download the Deployment Script

The script is in your GitHub repo: `deploy-hostinger.sh`

```bash
# Option A: Clone the entire repo on your VPS
git clone https://github.com/GSWAYAM9/vizzy-chat-ai.git
cd vizzy-chat-ai

# Option B: Download just the script
wget https://raw.githubusercontent.com/GSWAYAM9/vizzy-chat-ai/main/deploy-hostinger.sh
```

---

### Step 3: SSH Into Your Hostinger VPS

```bash
ssh root@YOUR_SERVER_IP
# or
ssh -i /path/to/ssh/key root@YOUR_SERVER_IP
```

After connecting:
```bash
cd /root
```

---

### Step 4: Make Script Executable

```bash
chmod +x deploy-hostinger.sh
```

---

### Step 5: Run the Deployment Script

```bash
bash deploy-hostinger.sh
```

The script will run and show progress. This takes 15-20 minutes.

---

### Step 6: Configure Environment Variables

After the script completes, edit the `.env.local` file:

```bash
sudo nano /home/vizzy-chat-ai/.env.local
```

Replace these placeholders with your actual credentials:
- `YOUR_DATABASE_URL_HERE` → Your Neon database URL
- `YOUR_GROQ_API_KEY_HERE` → Your Groq API key
- `YOUR_STABILITY_AI_KEY_HERE` → Your Stability AI key
- `https://YOUR_DOMAIN_HERE` → Your domain or IP

**Save the file:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

---

### Step 7: Configure Nginx with Your Domain

Edit the Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/vizzy-chat-ai
```

Replace `YOUR_DOMAIN_HERE` with your actual domain, then save.

**Restart Nginx:**
```bash
sudo systemctl restart nginx
```

---

### Step 8: Get SSL Certificate

The script already ran Certbot, but if you need to manually do it:

```bash
sudo certbot --nginx -d your-domain.com --non-interactive --agree-tos -m your-email@example.com
```

---

### Step 9: Verify Application is Running

```bash
pm2 status
pm2 logs vizzy-chat-ai
```

You should see the application running on port 3000.

---

### Step 10: Access Your Application

**Option A: Using Your Domain**
```
https://your-domain.com
```

**Option B: Using Your Server IP**
```
https://YOUR_SERVER_IP
```

If HTTPS doesn't work yet, try HTTP first:
```
http://YOUR_SERVER_IP:3000
```

---

## Common Commands

### View Application Logs
```bash
pm2 logs vizzy-chat-ai
```

### Restart Application
```bash
pm2 restart vizzy-chat-ai
```

### Stop Application
```bash
pm2 stop vizzy-chat-ai
```

### Start Application
```bash
pm2 start vizzy-chat-ai
```

### View PM2 Status
```bash
pm2 status
pm2 list
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### View Application Process
```bash
ps aux | grep node
```

---

## Troubleshooting

### Application won't start
```bash
pm2 logs vizzy-chat-ai
# Check the error message
# Usually it's missing environment variables
```

### Port already in use
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Nginx connection refused
```bash
sudo systemctl status nginx
sudo nginx -t  # Test configuration
```

### SSL certificate issues
```bash
sudo certbot renew --dry-run
sudo systemctl restart nginx
```

### Database connection error
```bash
# Check DATABASE_URL in .env.local
nano /home/vizzy-chat-ai/.env.local
# Verify the connection string is correct
pm2 restart vizzy-chat-ai
```

---

## Monitoring & Maintenance

### View server resources
```bash
top
free -h
df -h
```

### Update application code
```bash
cd /home/vizzy-chat-ai
git pull origin main
pnpm install
pnpm run build
pm2 restart vizzy-chat-ai
```

### Update SSL certificate
The script sets up automatic renewal. To manually renew:
```bash
sudo certbot renew
```

### Check SSL certificate expiration
```bash
sudo certbot certificates
```

---

## Support

If you encounter issues:

1. Check application logs: `pm2 logs vizzy-chat-ai`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check system resources: `top`
4. Verify environment variables are set correctly
5. Check database connectivity with your credentials

---

## Security Best Practices

1. Change default SSH port from 22
2. Disable password authentication, use SSH keys only
3. Set up firewall rules (ufw):
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```
4. Keep system updated: `sudo apt update && sudo apt upgrade`
5. Use strong passwords for all services
6. Regularly backup your database

---

**Your Vizzy Chat AI application is now deployed and running on Hostinger!**
