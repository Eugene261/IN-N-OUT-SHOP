# 🚀 IN-N-OUT Store Deployment Guide

## Overview

This guide covers deploying the IN-N-OUT Store e-commerce platform to production environments using Docker, cloud services, and traditional hosting.

## 📋 Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- MongoDB database (local or cloud)
- Domain name (for production)
- SSL certificate (for HTTPS)

## 🔧 Environment Setup

### 1. Copy Environment Template

```bash
cp env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your production values:

```env
# Production Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/innout_store

# Production URLs
CLIENT_URL=https://yourdomain.com
SERVER_URL=https://api.yourdomain.com

# Production Email (SendGrid recommended)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-production-sendgrid-key

# Production Payment
PAYSTACK_SECRET_KEY=sk_live_your-live-paystack-key

# Strong JWT Secret
JWT_SECRET=your-super-secure-jwt-secret-256-bits-minimum
```

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Clone the repository
git clone https://github.com/your-username/innout-store.git
cd innout-store

# Copy and configure environment
cp env.example .env
# Edit .env with your values

# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Individual Service Deployment

```bash
# Build backend
cd server
docker build -t innout-backend .

# Build frontend
cd ../client
docker build -t innout-frontend .

# Run with custom network
docker network create innout-network

# Run MongoDB
docker run -d --name innout-mongodb \
  --network innout-network \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  mongo:7.0

# Run backend
docker run -d --name innout-backend \
  --network innout-network \
  -p 5000:5000 \
  --env-file .env \
  innout-backend

# Run frontend
docker run -d --name innout-frontend \
  --network innout-network \
  -p 3000:80 \
  innout-frontend
```

## ☁️ Cloud Deployment Options

### 1. AWS Deployment

#### Using AWS ECS (Elastic Container Service)

```bash
# Install AWS CLI and configure
aws configure

# Create ECS cluster
aws ecs create-cluster --cluster-name innout-cluster

# Build and push to ECR
aws ecr create-repository --repository-name innout-backend
aws ecr create-repository --repository-name innout-frontend

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push images
docker tag innout-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/innout-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/innout-backend:latest
```

#### Using AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize Elastic Beanstalk
eb init

# Create environment
eb create production

# Deploy
eb deploy
```

### 2. Google Cloud Platform

```bash
# Install gcloud CLI
gcloud auth login

# Set project
gcloud config set project your-project-id

# Build and push to Container Registry
gcloud builds submit --tag gcr.io/your-project-id/innout-backend ./server
gcloud builds submit --tag gcr.io/your-project-id/innout-frontend ./client

# Deploy to Cloud Run
gcloud run deploy innout-backend \
  --image gcr.io/your-project-id/innout-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### 3. DigitalOcean App Platform

```yaml
# app.yaml
name: innout-store
services:
- name: backend
  source_dir: /server
  github:
    repo: your-username/innout-store
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: MONGODB_URI
    value: ${DATABASE_URL}

- name: frontend
  source_dir: /client
  github:
    repo: your-username/innout-store
    branch: main
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs

databases:
- name: innout-db
  engine: MONGODB
  version: "5"
```

## 🌐 Traditional VPS Deployment

### 1. Server Setup (Ubuntu 20.04+)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install Nginx
sudo apt install nginx -y

# Install PM2 for process management
sudo npm install -g pm2

# Install Docker (optional)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. Application Deployment

```bash
# Clone repository
git clone https://github.com/your-username/innout-store.git
cd innout-store

# Setup backend
cd server
npm install --production
cp ../env.example .env
# Edit .env with production values

# Setup frontend
cd ../client
npm install
npm run build

# Start services with PM2
cd ../server
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Nginx Configuration

```nginx
# /etc/nginx/sites-available/innout-store
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # Frontend
    location / {
        root /path/to/innout-store/client/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
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
```

## 🔒 SSL Certificate Setup

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring Setup

### 1. PM2 Monitoring

```bash
# Install PM2 Plus
pm2 install pm2-server-monit

# Link to PM2 Plus dashboard
pm2 link <secret-key> <public-key>
```

### 2. Health Checks

```bash
# Add health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
if [ $response != "200" ]; then
    echo "Health check failed with status: $response"
    pm2 restart innout-backend
fi
EOF

chmod +x health-check.sh

# Add to crontab
echo "*/5 * * * * /path/to/health-check.sh" | crontab -
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd server && npm ci
        cd ../client && npm ci
        
    - name: Run tests
      run: |
        cd server && npm test
        
    - name: Build frontend
      run: cd client && npm run build
      
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /path/to/innout-store
          git pull origin main
          cd server && npm ci --production
          cd ../client && npm ci && npm run build
          pm2 restart all
```

## 🛡️ Security Checklist

- [ ] Use HTTPS with valid SSL certificate
- [ ] Set strong JWT secret (256+ bits)
- [ ] Configure firewall (UFW/iptables)
- [ ] Use environment variables for secrets
- [ ] Enable MongoDB authentication
- [ ] Set up regular backups
- [ ] Configure rate limiting
- [ ] Use non-root user for application
- [ ] Keep dependencies updated
- [ ] Monitor logs for suspicious activity

## 📦 Database Backup

### Automated MongoDB Backup

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
DB_NAME="innout_store"

mkdir -p $BACKUP_DIR

mongodump --db $DB_NAME --out $BACKUP_DIR/backup_$DATE

# Compress backup
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR backup_$DATE
rm -rf $BACKUP_DIR/backup_$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.tar.gz"
```

## 🔧 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   sudo lsof -i :5000
   sudo kill -9 <PID>
   ```

2. **MongoDB connection failed**
   ```bash
   sudo systemctl status mongod
   sudo systemctl start mongod
   ```

3. **PM2 process not starting**
   ```bash
   pm2 logs
   pm2 restart all
   ```

4. **Nginx configuration error**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Log Locations

- Application logs: `~/.pm2/logs/`
- Nginx logs: `/var/log/nginx/`
- MongoDB logs: `/var/log/mongodb/`
- System logs: `/var/log/syslog`

## 📞 Support

For deployment issues:
1. Check the logs first
2. Verify environment variables
3. Test health endpoints
4. Review security settings
5. Contact support with specific error messages

---

**Last Updated**: January 2025  
**Version**: 2.0  
**Status**: Production Ready ✅ 