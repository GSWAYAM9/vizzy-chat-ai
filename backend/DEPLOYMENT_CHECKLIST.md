# Backend Deployment Checklist

## Pre-Deployment (Before Running deploy.sh)

### Preparation
- [ ] Hostinger account with VPS or Business Hosting
- [ ] SSH access credentials ready
- [ ] PostgreSQL database created in Hostinger control panel
- [ ] Database name, user, password noted
- [ ] Domain name or server IP address ready
- [ ] Repository pushed to GitHub with backend code

### Environment Setup
- [ ] Create `.env` file from `.env.example`
- [ ] Update all database credentials
- [ ] Set DJANGO_SECRET_KEY (use `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`)
- [ ] Set ALLOWED_HOSTS with your domain
- [ ] Update CORS_ALLOWED_ORIGINS
- [ ] Configure Google OAuth credentials (if using authentication)

## Deployment Steps (for Hostinger)

### Automated Deployment (Recommended)
```bash
chmod +x backend/deploy.sh
sudo backend/deploy.sh
```

- [ ] Connect to Hostinger server via SSH
- [ ] Download deploy script
- [ ] Run with sudo
- [ ] Follow interactive prompts
- [ ] Configure .env when prompted
- [ ] Create superuser (optional)

### Manual Deployment Steps (if needed)
- [ ] Install system dependencies
- [ ] Clone repository
- [ ] Create virtual environment
- [ ] Install Python packages
- [ ] Configure PostgreSQL connection
- [ ] Run migrations
- [ ] Collect static files
- [ ] Configure Gunicorn service
- [ ] Configure Celery service
- [ ] Configure Nginx
- [ ] Setup SSL certificate

## Post-Deployment Verification

### Service Status
- [ ] Gunicorn running: `systemctl status gunicorn`
- [ ] Celery running: `systemctl status celery`
- [ ] Nginx running: `systemctl status nginx`
- [ ] Redis running: `systemctl status redis-server`
- [ ] PostgreSQL connected successfully

### API Endpoints
- [ ] Test health check: `curl http://your-ip/health` (should return 200)
- [ ] Test authentication: `curl -X POST http://your-ip/api/auth/login/google`
- [ ] Test profile endpoint: `curl http://your-ip/api/profile/me` (with token)
- [ ] Test media upload: `curl -X POST http://your-ip/api/media/upload` (with token + file)
- [ ] Test collection list: `curl http://your-ip/api/collections` (with token)

### Files & Storage
- [ ] Media directory created and writable: `ls -la /var/www/vizzy-chat-ai/backend/media`
- [ ] Static files collected: `ls /var/www/vizzy-chat-ai/backend/staticfiles`
- [ ] Logs directory exists: `ls /var/www/vizzy-chat-ai/backend/logs`
- [ ] Uploaded images accessible: Check URL returned from upload endpoint

### Security
- [ ] Firewall enabled and configured: `ufw status`
- [ ] SSH only on port 22: `ufw show added`
- [ ] HTTP (80) open: Check firewall rules
- [ ] HTTPS (443) open: Check firewall rules
- [ ] DEBUG=False in production .env
- [ ] Strong Django SECRET_KEY set

### SSL Certificate
- [ ] SSL certificate installed (Let's Encrypt via Certbot)
- [ ] Auto-renewal configured: `systemctl status certbot.timer`
- [ ] HTTPS working: `curl -I https://your-domain.com`
- [ ] HTTP redirects to HTTPS: `curl -I http://your-domain.com`

### Database
- [ ] PostgreSQL connection works: `psql -h your-db-host -U deckoviz_user -d deckoviz_db -c "SELECT 1;"`
- [ ] Migrations applied: `python manage.py showmigrations` (all should have ✓)
- [ ] Tables created: Query database
- [ ] Backups configured: `ls /var/backups/deckoviz`

## Mobile Developer Handoff

### Documentation Ready
- [ ] IMAGE_UPLOAD_GUIDE.md copied to mobile team
- [ ] API_DOCUMENTATION.md shared
- [ ] QUICK_REFERENCE.md available
- [ ] MOBILE_DEVELOPER_GUIDE.md shared
- [ ] Example cURL commands in documentation
- [ ] Swift code examples included
- [ ] Kotlin code examples included

### API Access
- [ ] Backend URL documented: `https://your-domain.com/api/`
- [ ] Test authentication endpoint provided
- [ ] Sample access token generated for testing
- [ ] Rate limits documented
- [ ] Error response format documented
- [ ] Pagination format documented

### Setup Instructions
- [ ] Mobile team has backend URL
- [ ] Mobile team understands Bearer token auth
- [ ] Mobile team knows how to upload images (multipart, not Base64)
- [ ] Mobile team has example API calls
- [ ] Mobile team knows pagination format
- [ ] Contact info for support provided

## Monitoring Setup

### Logs
- [ ] Gunicorn logs accessible: `/var/www/vizzy-chat-ai/backend/logs/gunicorn-error.log`
- [ ] Django logs accessible: `/var/www/vizzy-chat-ai/backend/logs/django.log`
- [ ] Nginx logs accessible: `/var/log/nginx/error.log`
- [ ] Log rotation configured

### Backups
- [ ] Database backup script running: Check cron jobs
- [ ] Backups stored: `/var/backups/deckoviz/`
- [ ] Verify backup integrity: Try restoring one
- [ ] Backup retention policy set (keep last 7 days)

### Alerts
- [ ] Monitor disk space: `df -h`
- [ ] Monitor memory: `free -h`
- [ ] Monitor CPU: `top`
- [ ] Setup alerts for service crashes (optional)

## Performance Optimization

### Caching
- [ ] Redis running: `redis-cli ping`
- [ ] Celery configured for Redis: Check settings.py
- [ ] Task queue working: Try submitting a task

### Static Files
- [ ] Gzip compression enabled in Nginx
- [ ] Browser caching headers set
- [ ] Static files served by Nginx (not Django)
- [ ] Cache busting in place for versioned files

### Database
- [ ] Indexes created on frequently searched columns
- [ ] Query optimization analyzed
- [ ] Connection pooling configured (if needed)

## Maintenance

### Regular Tasks (Daily)
- [ ] Check service status: `systemctl status gunicorn celery nginx`
- [ ] Check error logs: `tail /var/www/vizzy-chat-ai/backend/logs/gunicorn-error.log`
- [ ] Monitor disk usage: `df -h`

### Regular Tasks (Weekly)
- [ ] Verify backups are running
- [ ] Check database integrity
- [ ] Review API usage patterns
- [ ] Monitor performance metrics

### Regular Tasks (Monthly)
- [ ] Update system packages: `apt update && apt upgrade`
- [ ] Review and optimize slow queries
- [ ] Analyze API error rates
- [ ] Update SSL certificates (if approaching expiry)

### Regular Tasks (Quarterly)
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Database cleanup and optimization
- [ ] Disaster recovery test

## Troubleshooting Quick Reference

### Service won't start
```bash
# Check for errors
journalctl -u gunicorn -n 50
# Verify configuration
python manage.py check
```

### Database connection fails
```bash
# Test connection
psql -h your-db-host -U deckoviz_user -d deckoviz_db
# Check credentials in .env
cat .env | grep DB_
```

### Static files not loading
```bash
# Recollect static files
python manage.py collectstatic --clear --noinput
# Restart Nginx
systemctl restart nginx
```

### Image uploads failing
```bash
# Check permissions
ls -la /var/www/vizzy-chat-ai/backend/media
# Check file size limit in Nginx
grep client_max_body_size /etc/nginx/sites-available/deckoviz
```

### Celery tasks not processing
```bash
# Check Celery status
systemctl status celery
# Check Redis connection
redis-cli ping
# Restart Celery
systemctl restart celery
```

## Final Sign-Off

When complete, verify:
- [ ] All services running and healthy
- [ ] All endpoints responding correctly
- [ ] Uploads working with optimized multipart
- [ ] Database connected and populated
- [ ] SSL certificate installed
- [ ] Backups running
- [ ] Logs being written
- [ ] Mobile team ready with documentation
- [ ] Performance meets expectations
- [ ] Security checklist passed

---

**Deployment Status:** Ready for production

**Backend URL:** https://your-domain.com/api/
**Admin Panel:** https://your-domain.com/admin/
**API Documentation:** See backend/API_DOCUMENTATION.md

**Support Contact:** [Your name/email]
**Last Updated:** 2024-03-14
