# Deckoviz Backend Deployment Guide

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Static files collected
- [ ] Tests passing locally
- [ ] Secret key changed from development
- [ ] DEBUG = False
- [ ] ALLOWED_HOSTS configured
- [ ] CORS origins configured
- [ ] SSL/HTTPS enabled

### Environment Variables Required

```env
# Django
DJANGO_SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
ENVIRONMENT=production

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=deckoviz_prod
DB_USER=db_user
DB_PASSWORD=secure_password
DB_HOST=db.your-domain.com
DB_PORT=5432

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret

# CORS
CORS_ALLOWED_ORIGINS=https://your-frontend.com,https://app.deckoviz.com

# Celery & Redis
CELERY_BROKER_URL=redis://redis-host:6379/0
CELERY_RESULT_BACKEND=redis://redis-host:6379/0

# AI Services
RUNWARE_API_KEY=your-runware-key
STABILITY_API_KEY=your-stability-key

# Email Configuration (optional)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-email-password
```

## Deployment Options

### Option 1: Heroku Deployment

```bash
# Login to Heroku
heroku login

# Create Heroku app
heroku create deckoviz-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Add Redis
heroku addons:create heroku-redis:premium-0

# Configure environment variables
heroku config:set DJANGO_SECRET_KEY=your-key
heroku config:set DEBUG=False
# ... set other variables

# Deploy
git push heroku main

# Run migrations
heroku run python manage.py migrate

# Create superuser
heroku run python manage.py createsuperuser
```

### Option 2: AWS Deployment (EC2 + RDS)

```bash
# 1. Launch EC2 instance (Ubuntu 20.04)
# 2. Connect via SSH
ssh -i your-key.pem ubuntu@your-instance-ip

# 3. Install dependencies
sudo apt-get update
sudo apt-get install python3-pip python3-venv postgresql-client redis-tools nginx gunicorn

# 4. Clone repository
git clone https://github.com/deckoviz/backend.git
cd backend

# 5. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 6. Install Python packages
pip install -r requirements.txt

# 7. Configure environment
nano .env
# Add all production variables

# 8. Run migrations
python manage.py migrate

# 9. Collect static files
python manage.py collectstatic --noinput

# 10. Create systemd service for Gunicorn
sudo nano /etc/systemd/system/gunicorn.service
```

### Gunicorn Service File

```ini
[Unit]
Description=Deckoviz Backend Gunicorn Application
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/backend
ExecStart=/home/ubuntu/backend/venv/bin/gunicorn \
    --workers 4 \
    --bind unix:/home/ubuntu/backend/gunicorn.sock \
    --timeout 60 \
    deckoviz_backend.wsgi

Restart=always

[Install]
WantedBy=multi-user.target
```

### Nginx Configuration

```nginx
upstream deckoviz_backend {
    server unix:/home/ubuntu/backend/gunicorn.sock;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://deckoviz_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /home/ubuntu/backend/staticfiles/;
    }

    location /media/ {
        alias /home/ubuntu/backend/media/;
    }
}
```

### Option 3: Docker Deployment

```bash
# Build image
docker build -t deckoviz-backend:latest .

# Tag for registry
docker tag deckoviz-backend:latest your-registry/deckoviz-backend:latest

# Push to registry
docker push your-registry/deckoviz-backend:latest

# Run container
docker run -d \
  --name deckoviz-backend \
  -p 8000:8000 \
  -e DJANGO_SECRET_KEY=your-key \
  -e DEBUG=False \
  -e DB_HOST=db-host \
  # ... other env vars
  your-registry/deckoviz-backend:latest
```

### Dockerfile Example

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "deckoviz_backend.wsgi"]
```

## Database Setup (RDS)

```bash
# Create RDS instance via AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier deckoviz-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password your-password \
  --allocated-storage 20

# Run migrations
python manage.py migrate --database default

# Create backup
pg_dump -h your-rds-endpoint -U admin deckoviz_db > backup.sql
```

## Redis Setup

```bash
# Via AWS ElastiCache
aws elasticache create-cache-cluster \
  --cache-cluster-id deckoviz-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1

# Or Docker
docker run -d --name deckoviz-redis -p 6379:6379 redis:7-alpine
```

## Monitoring & Logging

### CloudWatch Monitoring

```python
# Add to settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/deckoviz/django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['file', 'console'],
        'level': 'INFO',
    },
}
```

### Health Check Endpoint

```python
# Add to api/views.py
from django.http import JsonResponse

def health_check(request):
    """Simple health check endpoint"""
    return JsonResponse({
        'status': 'healthy',
        'database': 'connected',
        'cache': 'connected'
    })
```

## SSL/HTTPS Setup

### Using Let's Encrypt with Certbot

```bash
sudo apt-get install certbot python3-certbot-nginx

sudo certbot certonly --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

## Backup & Recovery

### Database Backup

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/deckoviz"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
```

### Restore from Backup

```bash
gunzip -c backup.sql.gz | psql -h $DB_HOST -U $DB_USER $DB_NAME
```

## Performance Optimization

### Caching Strategy

```python
# Add to settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://redis-host:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Use cache decorator
from django.views.decorators.cache import cache_page

@cache_page(60 * 5)  # 5 minutes
def expensive_view(request):
    pass
```

### Database Query Optimization

```python
# Use select_related and prefetch_related
collections = Collection.objects.select_related(
    'user'
).prefetch_related(
    'media'
).all()
```

### Static Files CDN

```python
# Use CloudFront or similar CDN for static files
STATIC_URL = 'https://d123.cloudfront.net/static/'
```

## Troubleshooting

### Common Issues

**502 Bad Gateway**
```bash
# Check Gunicorn logs
sudo journalctl -u gunicorn -n 20

# Restart Gunicorn
sudo systemctl restart gunicorn
```

**Database Connection Issues**
```bash
# Test connection
psql -h your-rds-endpoint -U admin -d deckoviz_db -c "SELECT 1;"

# Check security groups (AWS)
```

**Redis Connection Issues**
```bash
# Test Redis
redis-cli -h your-redis-host ping

# Restart Redis
sudo systemctl restart redis
```

## Monitoring Dashboard

Set up monitoring using:
- **CloudWatch** for AWS metrics
- **Sentry** for error tracking
- **New Relic** for APM
- **DataDog** for comprehensive monitoring

## Rollback Procedure

```bash
# If deployment fails
git revert <commit-hash>
git push heroku main  # or push to your deployment target

# Or rollback database migrations
python manage.py migrate api <migration-number>
```

## Post-Deployment

- [ ] Test all endpoints
- [ ] Verify Google OAuth
- [ ] Check email notifications
- [ ] Monitor error logs
- [ ] Run performance tests
- [ ] Verify backups working
- [ ] Setup monitoring alerts
- [ ] Document deployment steps

## Support & Escalation

For deployment issues, contact DevOps team or check:
- Application logs: `/var/log/deckoviz/`
- System logs: `systemctl status gunicorn`
- Database logs: AWS RDS console
