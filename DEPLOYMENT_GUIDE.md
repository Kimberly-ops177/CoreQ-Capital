# Core Q Capital - Deployment Guide

## 🚨 CRITICAL: Security Checklist (Complete BEFORE Deployment)

### 1. Environment Variables Security

**IMMEDIATE ACTIONS REQUIRED:**

1. **Generate Strong JWT Secret**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   Copy the output and use it as your `JWT_SECRET` in `.env`

2. **Change Database Credentials**
   - Current password (`1234`) is NOT SECURE
   - Use a strong password with letters, numbers, and special characters
   - Update both `.env` and your MySQL database

3. **Secure Email Configuration**
   - Never use your actual Gmail password
   - Create an App-Specific Password: https://support.google.com/accounts/answer/185833
   - Update `EMAIL_PASSWORD` in `.env`

4. **Remove Hardcoded Phone Numbers**
   - Review all files for hardcoded phone numbers
   - Store test numbers in environment variables

### 2. Verify .gitignore Protection

**Check these files are NOT committed to Git:**
- ✓ `backend/.env` (contains secrets)
- ✓ `backend/node_modules/`
- ✓ `backend/uploads/agreements/` (uploaded files)
- ✓ `frontend/.env`
- ✓ `frontend/node_modules/`
- ✓ `frontend/dist/` (build output)

**Run this to check:**
```bash
git status
```

If you see `.env` or sensitive files, run:
```bash
git rm --cached backend/.env
git rm --cached frontend/.env
git commit -m "Remove sensitive files from Git"
```

### 3. Code Cleanup Status

✅ **Completed:**
- Removed debug console.logs from loanApplication.js
- Removed test routes
- Created `.env.example` template
- Updated `.gitignore` files

## 📦 Pre-Deployment Setup

### Backend Setup

1. **Copy Environment Template**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Configure Environment Variables**
   Edit `backend/.env` and fill in:
   - Database credentials
   - Strong JWT secret (generated above)
   - Email app password
   - SMS provider credentials (Africa's Talking or Twilio)

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Database Setup**
   ```bash
   # Make sure MySQL is running
   # Create database if it doesn't exist
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS coreq_loans;"
   
   # Run the application - Sequelize will sync tables
   npm start
   ```

5. **Test Backend**
   ```bash
   # Server should start on port 5000
   # Test health endpoint
   curl http://localhost:5000/api/health
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure API URL** (if needed)
   Create `frontend/.env`:
   ```
   VITE_API_URL=http://localhost:5000
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Test Production Build Locally**
   ```bash
   npm run preview
   ```

## 🚀 Deployment Options

### Option 1: Traditional VPS (DigitalOcean, Linode, AWS EC2)

**Best for:** Full control, learning experience

**Steps:**
1. Provision Ubuntu server (20.04 LTS or newer)
2. Install Node.js, MySQL, Nginx
3. Set up SSL with Let's Encrypt
4. Configure Nginx reverse proxy
5. Use PM2 for process management

**Detailed Guide:** See `DEPLOYMENT_VPS.md`

### Option 2: Platform as a Service (Render, Railway, Heroku)

**Best for:** Quick deployment, automatic scaling

**Recommended: Railway.app**
- Deploy backend and frontend separately
- Built-in MySQL database
- Automatic SSL certificates
- Free tier available

**Detailed Guide:** See `DEPLOYMENT_RAILWAY.md`

### Option 3: Containerized Deployment (Docker + AWS/Azure)

**Best for:** Professional portfolio, scalability

**Steps:**
1. Create Dockerfile for backend
2. Create Dockerfile for frontend
3. Set up docker-compose.yml
4. Deploy to AWS ECS or Azure Container Instances

**Detailed Guide:** See `DEPLOYMENT_DOCKER.md`

## 🔐 Production Environment Variables

### Backend (.env)

```bash
NODE_ENV=production
PORT=5000

# Database - Use production credentials
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_strong_production_password
DB_NAME=coreq_loans
DB_PORT=3306

# Security - MUST be different from development
JWT_SECRET=your_64_character_production_secret_here

# Email - Use production email
EMAIL_SERVICE=gmail
EMAIL_USER=notifications@coreqcapital.com
EMAIL_PASSWORD=your_app_specific_password

# SMS Provider
AFRICASTALKING_USERNAME=your_production_username
AFRICASTALKING_API_KEY=your_production_api_key
AFRICASTALKING_SENDER_ID=COREQ

# Business Rules (DO NOT CHANGE)
GRACE_PERIOD_DAYS=7
DAILY_PENALTY_RATE=3

# Disable test mode in production
RUN_NOTIFICATIONS_ON_STARTUP=false
```

### Frontend (.env.production)

```bash
VITE_API_URL=https://api.coreqcapital.com
```

## 📊 Post-Deployment Checklist

### Monitoring Setup
- [ ] Set up error tracking (Sentry recommended)
- [ ] Configure uptime monitoring (UptimeRobot)
- [ ] Set up database backups (daily minimum)
- [ ] Configure log rotation

### Security Hardening
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Configure CORS properly
- [ ] Set security headers (helmet.js)
- [ ] Rate limiting on API endpoints
- [ ] SQL injection protection (already using Sequelize ORM ✓)

### Performance Optimization
- [ ] Enable gzip compression
- [ ] Configure CDN for static assets
- [ ] Optimize database queries
- [ ] Set up Redis caching (optional)

### Testing
- [ ] Test loan creation workflow
- [ ] Test payment recording
- [ ] Test email notifications
- [ ] Test SMS notifications (if enabled)
- [ ] Test file uploads (signed agreements)
- [ ] Test admin approval workflow

## 🛠️ Maintenance & Operations

### Database Backups

**Automated Daily Backup:**
```bash
# Add to crontab (0 2 * * * = 2 AM daily)
0 2 * * * mysqldump -u username -ppassword coreq_loans > /backups/coreq_$(date +\%Y\%m\%d).sql
```

### Log Management

**View Application Logs:**
```bash
# If using PM2
pm2 logs

# If using systemd
journalctl -u coreq-backend -f
```

### Rollback Strategy

**If deployment fails:**
```bash
# Option 1: Git rollback
git revert HEAD
git push origin main

# Option 2: Restore database backup
mysql -u username -ppassword coreq_loans < /backups/coreq_20260101.sql
```

## 📞 Support & Resources

### Key Features Implemented
- ✅ Loan application with agreement workflow
- ✅ Payment recording system
- ✅ Automated email & SMS notifications
- ✅ Multi-location employee filtering
- ✅ Collateral status management
- ✅ Daily penalty calculation
- ✅ Grace period handling

### Known Configuration
- Backend Port: 5000
- Database: MySQL
- File Storage: Local filesystem (uploads/agreements, uploads/signed_agreements)
- Scheduler: node-cron (runs daily at midnight and noon)
- Notifications: Scheduled daily at 9:00 AM

### Contact
For deployment assistance or questions, refer to:
- Backend documentation: `backend/README.md`
- API documentation: Coming soon (consider adding Swagger)

---

**Last Updated:** 2026-01-01
**System Version:** 1.0.0
