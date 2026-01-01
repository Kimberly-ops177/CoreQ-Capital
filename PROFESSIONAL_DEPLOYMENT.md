# Professional Deployment Guide - Core Q Capital

This guide will help you deploy Core Q Capital with a professional setup including custom domain, SSL certificates, and professional email.

## Table of Contents
- [Domain Registration](#domain-registration)
- [Professional Email Setup](#professional-email-setup)
- [Railway Deployment (Recommended)](#railway-deployment)
- [DNS Configuration](#dns-configuration)
- [SSL Certificate Setup](#ssl-certificate-setup)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Professional Touches](#professional-touches)
- [Monitoring & Uptime](#monitoring--uptime)
- [Cost Summary](#cost-summary)

---

## Domain Registration

### Option 1: International .com Domain

**Recommended Registrars:**
- **Namecheap** (namecheap.com) - $10-12/year
- **Google Domains** (domains.google) - $12/year
- **Cloudflare Registrar** (cloudflare.com) - At-cost pricing (~$9/year)

**Steps:**
1. Visit your chosen registrar
2. Search for available domains (e.g., coreqcapital.com, coreqloans.com)
3. Add to cart and complete purchase
4. Enable domain privacy protection (usually free)
5. Keep registrar login credentials secure

### Option 2: Kenya .co.ke Domain

**For local presence:**
- **KENIC** (kenic.or.ke) - ~KSH 1,000/year
- Must provide KRA PIN and business registration

**Steps:**
1. Visit kenic.or.ke
2. Search for available .co.ke domains
3. Provide required documentation
4. Complete payment via M-Pesa
5. Domain typically approved within 24-48 hours

**Recommended:** Get both .com for international presence and .co.ke for local credibility.

---

## Professional Email Setup

### Option 1: Google Workspace (Recommended)

**Cost:** $6/user/month
**Features:** Professional email, 30GB storage, Google Meet, Drive

**Setup Steps:**
1. Go to workspace.google.com
2. Click "Get Started"
3. Enter your domain name (coreqcapital.com)
4. Create admin account (admin@coreqcapital.com)
5. Choose Business Starter plan
6. Verify domain ownership via DNS TXT record
7. Configure MX records (provided by Google)

**Professional Email Addresses:**
- admin@coreqcapital.com (administrative)
- loans@coreqcapital.com (loan inquiries)
- support@coreqcapital.com (customer support)
- noreply@coreqcapital.com (automated emails)

### Option 2: Zoho Mail (Budget-Friendly)

**Cost:** FREE for up to 5 users (Lite plan)
**Features:** 5GB/user, webmail, mobile apps

**Setup Steps:**
1. Go to zoho.com/mail
2. Sign up for free plan
3. Add your domain
4. Verify domain via CNAME record
5. Configure MX records
6. Create email accounts

---

## Railway Deployment

### Step 1: Initial Setup

1. **Create Railway Account**
   ```bash
   # Visit railway.app
   # Sign up with GitHub account
   ```

2. **Install Railway CLI** (optional but recommended)
   ```bash
   npm i -g @railway/cli
   railway login
   ```

3. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select your Core Q Capital repository

### Step 2: Database Setup

1. **Add MySQL Database**
   - In your Railway project, click "New"
   - Select "Database" → "MySQL"
   - Railway will automatically provision a MySQL instance
   - Note the connection details from the "Variables" tab

2. **Database Environment Variables** (auto-configured by Railway)
   ```
   MYSQL_URL
   MYSQL_HOST
   MYSQL_PORT
   MYSQL_DATABASE
   MYSQL_USER
   MYSQL_PASSWORD
   ```

### Step 3: Backend Service Configuration

1. **Add Backend Service**
   - Click "New" → "GitHub Repo"
   - Select backend directory (if monorepo, use root path filter: `/backend`)
   - Railway will auto-detect Node.js

2. **Configure Environment Variables**

   Go to Backend service → Variables tab, add:

   ```env
   # Server
   NODE_ENV=production
   PORT=5000

   # Database (use Railway's MySQL variables)
   DB_HOST=${{MySQL.MYSQL_HOST}}
   DB_USER=${{MySQL.MYSQL_USER}}
   DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
   DB_NAME=${{MySQL.MYSQL_DATABASE}}
   DB_PORT=${{MySQL.MYSQL_PORT}}

   # JWT (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
   JWT_SECRET=your_generated_64_character_hex_secret_here

   # Email Configuration
   EMAIL_SERVICE=gmail
   EMAIL_USER=noreply@coreqcapital.com
   EMAIL_PASSWORD=your_google_app_password_here

   # SMS - Africa's Talking (Production)
   AFRICASTALKING_USERNAME=your_africastalking_username
   AFRICASTALKING_API_KEY=your_production_api_key
   AFRICASTALKING_SENDER_ID=COREQ

   # Business Rules
   GRACE_PERIOD_DAYS=7
   DAILY_PENALTY_RATE=3

   # Company Info
   COMPANY_NAME=Core Q Capital
   ADMIN_EMAIL=admin@coreqcapital.com

   # Notifications
   RUN_NOTIFICATIONS_ON_STARTUP=false
   ```

3. **Configure Build Settings**
   - Root Directory: `/backend` (if monorepo)
   - Build Command: `npm install`
   - Start Command: `node index.js`

4. **Enable Health Checks**
   - Railway will automatically monitor your backend
   - Ensure your backend has a `/api/health` endpoint

### Step 4: Frontend Service Configuration

1. **Add Frontend Service**
   - Click "New" → "GitHub Repo"
   - Select frontend directory (root path filter: `/frontend`)
   - Railway will auto-detect Vite/React

2. **Configure Environment Variables**
   ```env
   NODE_ENV=production
   VITE_API_URL=https://api.coreqcapital.com
   ```

3. **Configure Build Settings**
   - Root Directory: `/frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: Railway auto-detects for static sites
   - Output Directory: `dist`

4. **Install Nginx (for production serving)**

   Add `nginx.conf` to frontend directory (already created in Docker setup).

   Update `package.json` to use `serve` or configure Railway to use Nginx:
   ```json
   {
     "scripts": {
       "start": "npx serve -s dist -l 80"
     }
   }
   ```

### Step 5: Custom Domain Setup

1. **Generate Railway Domain**
   - Each service gets a `.railway.app` subdomain
   - Backend: `coreq-backend-production.up.railway.app`
   - Frontend: `coreq-frontend-production.up.railway.app`

2. **Add Custom Domain to Frontend**
   - Go to Frontend service → Settings → Domains
   - Click "Custom Domain"
   - Enter: `www.coreqcapital.com`
   - Railway will provide CNAME record

3. **Add Custom Domain to Backend**
   - Go to Backend service → Settings → Domains
   - Click "Custom Domain"
   - Enter: `api.coreqcapital.com`
   - Railway will provide CNAME record

---

## DNS Configuration

### Configure DNS Records at Your Registrar

Log into your domain registrar (Namecheap, Google Domains, etc.) and add these DNS records:

#### For Root Domain (coreqcapital.com)

**Option A: CNAME Flattening (if supported)**
```
Type: CNAME
Name: @
Value: coreq-frontend-production.up.railway.app
TTL: Automatic
```

**Option B: A Record (if CNAME not supported for root)**
```
Type: A
Name: @
Value: [Railway's IP - check Railway dashboard]
TTL: Automatic
```

#### For WWW Subdomain
```
Type: CNAME
Name: www
Value: coreq-frontend-production.up.railway.app
TTL: Automatic
```

#### For API Subdomain
```
Type: CNAME
Name: api
Value: coreq-backend-production.up.railway.app
TTL: Automatic
```

#### For Email (if using Google Workspace)
```
Type: MX
Priority: 1
Value: ASPMX.L.GOOGLE.COM

Type: MX
Priority: 5
Value: ALT1.ASPMX.L.GOOGLE.COM

Type: MX
Priority: 5
Value: ALT2.ASPMX.L.GOOGLE.COM

Type: MX
Priority: 10
Value: ALT3.ASPMX.L.GOOGLE.COM

Type: MX
Priority: 10
Value: ALT4.ASPMX.L.GOOGLE.COM
```

#### SPF Record (Email Security)
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com ~all
```

#### DKIM Record (Email Authentication)
```
Type: TXT
Name: google._domainkey
Value: [Provided by Google Workspace during setup]
```

### DNS Propagation

- DNS changes can take 1-48 hours to propagate globally
- Use https://dnschecker.org to check propagation status
- Test with: `nslookup coreqcapital.com` or `dig coreqcapital.com`

---

## SSL Certificate Setup

### Automatic SSL with Railway

**Railway provides automatic SSL certificates via Let's Encrypt:**

1. Once custom domain is added to Railway
2. Railway automatically provisions SSL certificate
3. Certificate auto-renews every 90 days
4. No manual configuration needed

**Verify SSL:**
```bash
# Check certificate
curl -vI https://api.coreqcapital.com

# Should show:
# - SSL certificate from Let's Encrypt
# - Valid certificate chain
# - TLS 1.2 or higher
```

### Force HTTPS

Update your frontend to always use HTTPS:

**Update frontend/.env.production:**
```env
VITE_API_URL=https://api.coreqcapital.com
```

**Add HTTPS redirect in nginx.conf** (already configured):
```nginx
# This is already in your nginx.conf
server {
    listen 80;
    server_name _;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

---

## Post-Deployment Configuration

### 1. Update Frontend API URL

**frontend/.env.production:**
```env
VITE_API_URL=https://api.coreqcapital.com
```

**Rebuild frontend:**
```bash
cd frontend
npm run build
git add .env.production
git commit -m "Update API URL for production"
git push origin main
```

Railway will automatically redeploy.

### 2. Configure Backend CORS

**backend/index.js** - Update CORS configuration:
```javascript
const cors = require('cors');

const allowedOrigins = [
  'https://coreqcapital.com',
  'https://www.coreqcapital.com',
  process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : null
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS policy violation'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
```

### 3. Test Production Deployment

**Test Checklist:**
```bash
# 1. Test domain access
curl https://coreqcapital.com
curl https://www.coreqcapital.com
curl https://api.coreqcapital.com/api/health

# 2. Test login
# Visit https://www.coreqcapital.com/login
# Login with admin credentials

# 3. Test loan creation
# Create a test loan
# Verify email/SMS notifications

# 4. Test agreement workflow
# Upload signed agreement
# Approve as admin
# Verify loan appears in all tabs

# 5. Test payments
# Record a payment
# Verify calculations

# 6. Test reports
# Generate daily report
# Check data accuracy
```

### 4. Update Email Configuration

**Configure Gmail App Password:**
1. Go to Google Account settings
2. Security → 2-Step Verification → App passwords
3. Generate password for "Mail"
4. Update Railway environment variable `EMAIL_PASSWORD`

**Test email sending:**
```bash
# Should send notifications from noreply@coreqcapital.com
```

### 5. Configure SMS Production Account

**Africa's Talking Production Setup:**
1. Log into https://account.africastalking.com
2. Go to "Apps" → "Sandbox" → "Go Live"
3. Complete business verification
4. Purchase SMS credits
5. Update Railway environment variables:
   ```env
   AFRICASTALKING_USERNAME=YourProductionUsername
   AFRICASTALKING_API_KEY=YourProductionAPIKey
   ```

---

## Professional Touches

### 1. Favicon and Branding

**Add favicon to frontend:**
```bash
# Replace frontend/public/favicon.ico with your logo
# Recommended: Use https://realfavicongenerator.net/
```

**Add to frontend/index.html:**
```html
<head>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <title>Core Q Capital - Loan Management System</title>
  <meta name="description" content="Professional loan management for Core Q Capital">
</head>
```

### 2. Custom Error Pages

**Create frontend/public/404.html:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Page Not Found - Core Q Capital</title>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 50px;
    }
    h1 { color: #1890ff; }
  </style>
</head>
<body>
  <h1>404 - Page Not Found</h1>
  <p>The page you're looking for doesn't exist.</p>
  <a href="/">Return to Dashboard</a>
</body>
</html>
```

### 3. Status Page

**Setup UptimeRobot status page:**
1. Create monitors (covered in Monitoring section)
2. Go to "Public Status Pages"
3. Create page: status.coreqcapital.com
4. Add CNAME record to DNS
5. Customize branding with logo and colors

### 4. Professional Email Signature

**Example signature for team:**
```
---
[Your Name]
[Position] | Core Q Capital

📧 email@coreqcapital.com
📱 +254 XXX XXX XXX
🌐 www.coreqcapital.com

Professional Loan Management Solutions
```

### 5. Privacy Policy & Terms

**Create basic legal pages:**
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/contact` - Contact information

Use templates from:
- https://www.termsfeed.com/privacy-policy/generator/
- https://www.termsandconditionsgenerator.com/

---

## Monitoring & Uptime

### 1. UptimeRobot (Free Tier)

**Setup monitors:**
1. Sign up at uptimerobot.com (FREE)
2. Create monitors:
   - Website: https://www.coreqcapital.com (every 5 mins)
   - API: https://api.coreqcapital.com/api/health (every 5 mins)
   - Database: Custom HTTP monitor for backend health check

3. **Configure alerts:**
   - Email: admin@coreqcapital.com
   - SMS: Your phone number
   - Alert when down for 2 minutes

4. **Create public status page:**
   - Share at: status.coreqcapital.com

### 2. Railway Monitoring

**Built-in Railway metrics:**
- Go to each service → Metrics
- Monitor: CPU, Memory, Network, Deployment history
- Set up deployment notifications in Settings

### 3. Error Tracking with Sentry (Optional)

**Setup Sentry for error tracking:**

1. **Sign up at sentry.io** (FREE tier: 5K errors/month)

2. **Install Sentry in backend:**
   ```bash
   npm install @sentry/node
   ```

3. **Configure backend/index.js:**
   ```javascript
   const Sentry = require('@sentry/node');

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 1.0
   });

   // Add error handler
   app.use(Sentry.Handlers.errorHandler());
   ```

4. **Add to Railway environment:**
   ```env
   SENTRY_DSN=your_sentry_dsn_here
   ```

### 4. Log Management

**Railway provides built-in logs:**
- View in Railway dashboard → Service → Deployments → Logs
- Use `console.log()` strategically for important events
- Logs retention: 7 days on free tier

**Production logging best practices:**
```javascript
// Good logging
console.log(`[${new Date().toISOString()}] Loan #${loanId} created by user ${userId}`);
console.error(`[ERROR] Payment processing failed for loan #${loanId}:`, error.message);

// Avoid logging sensitive data
// Bad: console.log('Password:', password);
// Good: console.log('User authenticated successfully');
```

### 5. Database Backups

**Railway automatic backups:**
- Paid plans include automatic daily backups
- Free tier: Manual backups recommended

**Manual backup setup:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Create backup script
railway run mysqldump -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE > backup_$(date +%Y%m%d).sql

# Schedule weekly backups (add to cron or GitHub Actions)
```

**Backup to cloud storage:**
```bash
# Example: Backup to Google Drive or Dropbox
# Use rclone or similar tool
rclone copy backup.sql gdrive:/backups/coreq/
```

---

## Cost Summary

### Professional Setup (Recommended)

| Service | Cost | Frequency |
|---------|------|-----------|
| Domain (.com) | $10-12 | /year |
| Professional Email (Zoho Free) | $0 | FREE |
| Railway Hobby Plan | $5 | /month |
| Railway MySQL Database | $7 | /month |
| Africa's Talking SMS | Pay-as-you-go | KSH 0.80/SMS |
| UptimeRobot Monitoring | $0 | FREE |
| Sentry Error Tracking | $0 | FREE (5K/month) |

**Total Monthly Cost:** ~$12-15/month + SMS costs

**Total Annual Cost:** ~$154-192/year + SMS costs

### Enterprise Setup (Optional)

| Service | Cost | Frequency |
|---------|------|-----------|
| Domain (.com + .co.ke) | $22 | /year |
| Google Workspace (3 users) | $18 | /month |
| Railway Pro Plan | $20 | /month |
| Railway MySQL (larger) | $15 | /month |
| Cloudflare Pro (DDoS protection) | $20 | /month |
| Sentry Team | $29 | /month |

**Total Monthly Cost:** ~$102/month
**Total Annual Cost:** ~$1,246/year

---

## Deployment Timeline

### Week 1: Domain & Email Setup
- Day 1-2: Register domain
- Day 3-4: Configure email (Google Workspace/Zoho)
- Day 5-7: Verify email, test sending

### Week 2: Railway Deployment
- Day 1: Set up Railway account, create project
- Day 2-3: Deploy backend, configure database
- Day 4-5: Deploy frontend, configure environment
- Day 6-7: Testing and debugging

### Week 3: DNS & SSL
- Day 1-2: Configure DNS records
- Day 3-4: Wait for DNS propagation
- Day 5-6: Verify SSL certificates
- Day 7: Final testing with custom domain

### Week 4: Professional Touches
- Day 1-2: Set up monitoring (UptimeRobot)
- Day 3-4: Configure error tracking (Sentry)
- Day 5-6: Create status page
- Day 7: Final testing and go-live

**Total Time to Production: 3-4 weeks**

---

## Professional Launch Checklist

### Security
- [ ] HTTPS enabled on all domains
- [ ] SSL certificates verified and auto-renewing
- [ ] Strong JWT secret configured
- [ ] Database password rotated from default
- [ ] Firewall rules configured (Railway handles this)
- [ ] CORS properly configured for production domain
- [ ] No sensitive data in logs
- [ ] .env files not committed to git

### Branding
- [ ] Custom domain active (coreqcapital.com)
- [ ] Professional email configured (@coreqcapital.com)
- [ ] Favicon and logo added
- [ ] Custom error pages created
- [ ] Professional email signatures

### Monitoring
- [ ] UptimeRobot monitors active
- [ ] Email alerts configured
- [ ] Error tracking (Sentry) active
- [ ] Database backups scheduled
- [ ] Status page published

### Legal & Compliance
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Company information accurate
- [ ] Contact page available

### Testing
- [ ] All features tested on production
- [ ] Email notifications working
- [ ] SMS notifications working (if applicable)
- [ ] Loan workflow end-to-end tested
- [ ] Reports generating correctly
- [ ] Mobile responsiveness verified

### Documentation
- [ ] Admin user guide created
- [ ] Employee training completed
- [ ] API documentation (if needed)
- [ ] Backup/restore procedures documented

---

## Support & Maintenance

### Daily Tasks
- Check Railway dashboard for errors
- Review UptimeRobot alerts
- Monitor SMS credit balance

### Weekly Tasks
- Review Sentry error reports
- Check database size and performance
- Backup database manually (if on free tier)

### Monthly Tasks
- Review Railway usage and costs
- Update dependencies (`npm audit`)
- Review and rotate API keys if needed
- Check SSL certificate expiration (auto-renews but verify)

### Quarterly Tasks
- Security audit
- Performance optimization
- User feedback review
- Feature planning

---

## Getting Help

**Railway Support:**
- Documentation: docs.railway.app
- Discord: railway.app/discord
- Status: status.railway.app

**Technical Issues:**
- Check Railway logs first
- Review Sentry error reports
- Test API endpoints with Postman
- Check DNS propagation

**Emergency Contacts:**
- Railway Status: status.railway.app
- Your domain registrar support
- Email provider support

---

## Next Steps

1. **Choose your domain name** - Check availability at Namecheap
2. **Register domain** - Complete purchase
3. **Set up Railway account** - Sign up with GitHub
4. **Configure email** - Choose Google Workspace or Zoho
5. **Follow deployment steps** - Use this guide section by section
6. **Test thoroughly** - Use the testing checklist
7. **Go live!** - Launch professionally

---

**Questions or issues?** Review the [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for step-by-step guidance.

**Ready to deploy?** Start with [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) for local testing, then proceed with Railway deployment.
