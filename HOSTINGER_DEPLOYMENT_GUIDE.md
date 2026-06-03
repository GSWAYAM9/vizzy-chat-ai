# Vizzy Chat AI - Hostinger VPS Deployment Guide

## Prerequisites
- Hostinger VPS account with SSH access
- Domain name (optional, but recommended)
- Basic terminal/command line knowledge
- Git credentials (for cloning the repository)

---

## Step 1: Connect to Your Hostinger VPS via SSH

### On Windows (Using PuTTY or Windows Terminal):
```bash
ssh root@YOUR_SERVER_IP
```

### On Mac/Linux:
```bash
ssh root@YOUR_SERVER_IP
```

Replace `YOUR_SERVER_IP` with your actual server IP address from Hostinger control panel.

When prompted, enter your Hostinger password: `serving9009hosts`

---

## Step 2: Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

---

## Step 3: Install Node.js and npm

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify installation:
```bash
node --version
npm --version
```

---

## Step 4: Install Git (if not already installed)

```bash
sudo apt install -y git
```

---

## Step 5: Install pnpm (Package Manager)

```bash
npm install -g pnpm
pnpm --version
```

---

## Step 6: Clone Your Repository

Create a directory for your app:
```bash
mkdir -p /var/www
cd /var/www
```

Clone your repository:
```bash
git clone https://github.com/GSWAYAM9/vizzy-chat-ai.git
cd vizzy-chat-ai
```

If git prompts for credentials, use your GitHub username and personal access token (not your password).

---

## Step 7: Set Up Environment Variables

Create a `.env.local` file in your project root:

```bash
nano .env.local
```

Add the following environment variables (get these from Vercel project settings):

```env
# Database
DATABASE_URL=your_neon_database_url

# Groq API
GROQ_API_KEY=your_groq_api_key

# Stability AI
STABILITY_AI_API_KEY=your_stability_api_key

# Other Keys
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Server URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**To find these values:**
1. Go to Vercel project settings
2. Go to "Settings" → "Environment Variables"
3. Copy each variable's value

Save and exit: Press `Ctrl+X`, then `Y`, then `Enter`

---

## Step 8: Install Dependencies

```bash
pnpm install
```

---

## Step 9: Build the Application

```bash
pnpm run build
```

If the build completes without errors, you're ready to run the app!

---

## Step 10: Install PM2 (Process Manager)

PM2 keeps your app running 24/7 and restarts it if it crashes:

```bash
sudo npm install -g pm2
```

---

## Step 11: Start Your Application with PM2

```bash
cd /var/www/vizzy-chat-ai
pm2 start pnpm --name "vizzy-chat" -- start
```

Verify it's running:
```bash
pm2 status
```

Make PM2 auto-start on reboot:
```bash
pm2 startup
pm2 save
```

---

## Step 12: Install and Configure Nginx (Reverse Proxy)

```bash
sudo apt install -y nginx
```

Create a new Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/vizzy-chat
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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
```

Replace `yourdomain.com` with your actual domain.

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/vizzy-chat /etc/nginx/sites-enabled/
```

Test Nginx configuration:
```bash
sudo nginx -t
```

Restart Nginx:
```bash
sudo systemctl restart nginx
```

---

## Step 13: Set Up SSL Certificate (HTTPS)

Install Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

Generate SSL certificate:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts and choose to automatically redirect HTTP to HTTPS.

Verify SSL renewal:
```bash
sudo certbot renew --dry-run
```

---

## Step 14: Configure Your Domain (If Using Custom Domain)

1. Log into your domain registrar
2. Find DNS settings
3. Add an A record pointing to your Hostinger server IP:
   - Type: A
   - Name: @ (or leave blank)
   - Value: YOUR_SERVER_IP

4. Add a CNAME record for www:
   - Type: CNAME
   - Name: www
   - Value: yourdomain.com

Wait 15-30 minutes for DNS to propagate.

---

## Step 15: Verify Your Deployment

1. Open your browser and visit: `https://yourdomain.com`
2. You should see your Vizzy Chat AI application
3. Test the authentication and image generation features

---

## Useful Commands for Managing Your App

### View logs:
```bash
pm2 logs vizzy-chat
```

### Restart the app:
```bash
pm2 restart vizzy-chat
```

### Stop the app:
```bash
pm2 stop vizzy-chat
```

### View all running processes:
```bash
pm2 status
```

### View real-time monitoring:
```bash
pm2 monit
```

---

## Troubleshooting

### App not starting?
```bash
pm2 logs vizzy-chat
```
Check the logs for errors.

### Build failed?
- Make sure all environment variables are set correctly
- Delete `node_modules` and `.next` folders:
  ```bash
  rm -rf node_modules .next
  pnpm install
  pnpm run build
  ```

### Port 3000 already in use?
```bash
sudo lsof -i :3000
sudo kill -9 PID
```

### Nginx not proxying correctly?
```bash
sudo nginx -t
sudo systemctl status nginx
```

### SSL certificate not working?
```bash
sudo certbot renew --force-renewal
sudo systemctl restart nginx
```

---

## Maintenance & Updates

### Update your app from GitHub:
```bash
cd /var/www/vizzy-chat-ai
git pull origin main
pnpm install
pnpm run build
pm2 restart vizzy-chat
```

### Update Node.js packages:
```bash
pnpm update
pnpm run build
pm2 restart vizzy-chat
```

---

## Performance Optimization

### Increase PM2 memory limit:
```bash
pm2 delete vizzy-chat
pm2 start pnpm --name "vizzy-chat" --max-memory-restart 1G -- start
pm2 save
```

### Enable Nginx caching:
```bash
sudo nano /etc/nginx/sites-available/vizzy-chat
```
Add before `location /`:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=vizzy_cache:10m max_size=1g inactive=60m;
```

---

## Security Notes

1. **Change your SSH password** - Use a strong, unique password
2. **Disable root login** - Configure SSH key authentication
3. **Set up firewall**:
   ```bash
   sudo ufw enable
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   ```
4. **Regular backups** - Back up your database and files
5. **Monitor logs** - Check for suspicious activity:
   ```bash
   sudo tail -f /var/log/auth.log
   ```

---

## Support & Help

- **Hostinger Support**: suraj@deckoviz.com (your account email)
- **Next.js Documentation**: https://nextjs.org/docs
- **PM2 Documentation**: https://pm2.keymetrics.io/
- **Nginx Documentation**: https://nginx.org/en/docs/

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `pm2 status` | Check app status |
| `pm2 logs vizzy-chat` | View application logs |
| `pm2 restart vizzy-chat` | Restart the app |
| `sudo systemctl status nginx` | Check Nginx status |
| `sudo certbot renew` | Renew SSL certificate |
| `git pull && pnpm install && pnpm run build && pm2 restart vizzy-chat` | Update app |

---

Good luck with your deployment! 🚀
