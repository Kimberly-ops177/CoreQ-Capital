# Professional Setup - Quick Start Guide

This is your fast-track guide to getting Core Q Capital live with a professional setup.

## 🎯 Goal
Deploy Core Q Capital with:
- ✅ Custom domain (e.g., coreqcapital.com)
- ✅ Professional email (admin@coreqcapital.com)
- ✅ HTTPS/SSL certificates
- ✅ Professional appearance

## ⏱️ Time Required
- **Minimal Setup:** 1-2 days
- **Full Professional Setup:** 2-3 weeks (including DNS propagation)

---

## Step 1: Domain Registration (Day 1)

### Option A: Quick International Domain
1. Go to [Namecheap.com](https://www.namecheap.com)
2. Search for your desired domain (e.g., coreqcapital.com)
3. Add to cart ($10-12/year)
4. Enable WhoisGuard (free privacy protection)
5. Complete purchase

### Option B: Kenya Domain (.co.ke)
1. Visit [KENIC](https://www.kenic.or.ke)
2. Search for .co.ke domain
3. Provide KRA PIN and business docs
4. Pay via M-Pesa (~KSH 1,000/year)

**✅ Checkpoint:** Domain registered, login credentials saved securely

---

## Step 2: Professional Email Setup (Day 1-2)

### Recommended: Zoho Mail (FREE)

1. **Sign up for Zoho Mail**
   - Go to [zoho.com/mail](https://www.zoho.com/mail/)
   - Click "GET STARTED"
   - Choose "Mail Lite" (FREE for up to 5 users)

2. **Add Your Domain**
   - Enter your domain (coreqcapital.com)
   - Verify ownership via TXT record

3. **Configure DNS Records**

   Go to your domain registrar (Namecheap) → DNS Management → Add these records:

   **MX Records:**
   ```
   Priority: 10   |  Value: mx.zoho.com
   Priority: 20   |  Value: mx2.zoho.com
   Priority: 50   |  Value: mx3.zoho.com
   ```

   **SPF Record (TXT):**
   ```
   Type: TXT
   Host: @
   Value: v=spf1 include:zoho.com ~all
   ```

   **DKIM Record (TXT):**
   ```
   Type: TXT
   Host: zoho._domainkey
   Value: [Provided by Zoho during setup]
   ```

4. **Create Email Accounts**
   - admin@coreqcapital.com (administrator)
   - noreply@coreqcapital.com (automated emails)
   - loans@coreqcapital.com (customer inquiries)

**✅ Checkpoint:** Email working, can send/receive from @coreqcapital.com

---

## Step 3: Railway Deployment Setup (Day 2-3)

### 3.1: Create Railway Account

1. Visit [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign up with GitHub
4. Connect your GitHub account

### 3.2: Push Code to GitHub (if not already done)

```bash
cd "c:\Users\USER\Documents\CORE-Q VIBE-CODED"

# Initialize git if needed
git init
git add .
git commit -m "Initial commit - Core Q Capital"

# Create repo on GitHub and push
git remote add origin https://github.com/yourusername/coreq-capital.git
git branch -M main
git push -u origin main
```

### 3.3: Create Railway Project

1. **New Project from GitHub**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your Core Q Capital repository

2. **Add MySQL Database**
   - Click "+ New" → "Database" → "Add MySQL"
   - Railway auto-provisions database
   - Note: Database credentials are auto-configured

### 3.4: Configure Backend Service

1. **Add Backend Service**
   - Click "+ New" → "GitHub Repo"
   - Root directory: `/backend`
   - Build command: `npm install`
   - Start command: `node index.js`

2. **Add Environment Variables**

   Go to Backend service → Variables tab:

   ```env
   NODE_ENV=production
   PORT=5000

   # Database (use Railway's references)
   DB_HOST=${{MySQL.MYSQL_HOST}}
   DB_USER=${{MySQL.MYSQL_USER}}
   DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
   DB_NAME=${{MySQL.MYSQL_DATABASE}}
   DB_PORT=${{MySQL.MYSQL_PORT}}

   # JWT Secret (generate new one!)
   JWT_SECRET=REPLACE_WITH_OUTPUT_FROM_GENERATE_SECRETS_SCRIPT

   # Email (use your Zoho email)
   EMAIL_SERVICE=gmail
   EMAIL_USER=noreply@coreqcapital.com
   EMAIL_PASSWORD=YOUR_ZOHO_APP_PASSWORD

   # SMS - Africa's Talking
   AFRICASTALKING_USERNAME=sandbox
   AFRICASTALKING_API_KEY=YOUR_API_KEY
   AFRICASTALKING_SENDER_ID=COREQ

   # Business Rules
   GRACE_PERIOD_DAYS=7
   DAILY_PENALTY_RATE=3

   # Company Info
   COMPANY_NAME=Core Q Capital
   ADMIN_EMAIL=admin@coreqcapital.com

   RUN_NOTIFICATIONS_ON_STARTUP=false
   ```

3. **Generate JWT Secret**
   ```bash
   cd backend
   node generate-secrets.js
   # Copy the JWT_SECRET output
   ```

4. **Get Zoho App Password**
   - Log into Zoho Mail
   - Settings → Security → App Passwords
   - Generate new password for "Railway Backend"
   - Use this as EMAIL_PASSWORD

### 3.5: Configure Frontend Service

1. **Add Frontend Service**
   - Click "+ New" → "GitHub Repo"
   - Root directory: `/frontend`
   - Build command: `npm install && npm run build`
   - Start command: `npx serve -s dist -l $PORT`

2. **Add Environment Variables**

   Frontend service → Variables tab:
   ```env
   NODE_ENV=production
   VITE_API_URL=https://api.coreqcapital.com
   ```

   Note: We'll update this after getting the backend URL

**✅ Checkpoint:** Services deployed to Railway, apps running on .railway.app domains

---

## Step 4: Custom Domain Configuration (Day 3-4)

### 4.1: Get Railway URLs

1. **Backend Service**
   - Go to Backend → Settings → Domains
   - Note the Railway URL (e.g., `coreq-backend-production.up.railway.app`)

2. **Frontend Service**
   - Go to Frontend → Settings → Domains
   - Note the Railway URL (e.g., `coreq-frontend-production.up.railway.app`)

### 4.2: Add Custom Domains in Railway

1. **Backend API Domain**
   - Backend service → Settings → Domains
   - Click "Custom Domain"
   - Enter: `api.coreqcapital.com`
   - Railway will show CNAME target

2. **Frontend Domain**
   - Frontend service → Settings → Domains
   - Click "Custom Domain"
   - Enter: `www.coreqcapital.com`
   - Railway will show CNAME target

### 4.3: Configure DNS Records

Go to Namecheap (or your registrar) → Domain List → Manage → Advanced DNS

**Add these records:**

```
# Root domain → Frontend
Type: CNAME Flattening or A Record
Host: @
Value: [Frontend Railway URL or IP]
TTL: Automatic

# WWW → Frontend
Type: CNAME
Host: www
Value: coreq-frontend-production.up.railway.app
TTL: Automatic

# API → Backend
Type: CNAME
Host: api
Value: coreq-backend-production.up.railway.app
TTL: Automatic
```

**Note:** If CNAME flattening isn't supported for root (@), use an A record with Railway's IP.

### 4.4: Update Frontend Environment

Once DNS is configured, update frontend environment:

1. Go to Railway → Frontend service → Variables
2. Update `VITE_API_URL` to: `https://api.coreqcapital.com`
3. Redeploy frontend (Railway auto-deploys on change)

**✅ Checkpoint:** Custom domains working, SSL certificates auto-provisioned

---

## Step 5: SSL Certificate Verification (Day 4)

### Automatic SSL with Railway

Railway automatically provisions SSL certificates via Let's Encrypt when you add a custom domain.

**Verify SSL is working:**

```bash
# Test API
curl -I https://api.coreqcapital.com/api/health

# Should return:
# HTTP/2 200
# ... SSL certificate info ...

# Test Frontend
curl -I https://www.coreqcapital.com

# Should return:
# HTTP/2 200
# ... SSL certificate info ...
```

**Check in browser:**
1. Visit https://www.coreqcapital.com
2. Click padlock icon in address bar
3. Verify certificate is valid and issued by Let's Encrypt

**✅ Checkpoint:** HTTPS working on all domains, green padlock showing

---

## Step 6: Testing & Verification (Day 5)

### 6.1: Test Complete Workflow

1. **Login**
   - Visit https://www.coreqcapital.com
   - Login with admin credentials
   - Verify dashboard loads

2. **Create Test Loan**
   - Create a borrower
   - Add collateral
   - Create loan application
   - Download unsigned agreement

3. **Test Email**
   - Trigger an email notification
   - Check if email arrives from noreply@coreqcapital.com
   - Verify professional sender name

4. **Upload & Approve Agreement**
   - Upload signed agreement
   - Approve as admin
   - Verify loan appears in all tabs

5. **Test Payment**
   - Record a payment
   - Verify calculations are correct

### 6.2: Mobile Testing

1. Open https://www.coreqcapital.com on mobile
2. Test responsive design
3. Test all major features

### 6.3: Performance Testing

```bash
# Test page load speed
curl -w "@curl-format.txt" -o /dev/null -s https://www.coreqcapital.com

# Or use online tools:
# - GTmetrix.com
# - Google PageSpeed Insights
```

**✅ Checkpoint:** All features working on production domain

---

## Step 7: Monitoring Setup (Day 5)

### 7.1: UptimeRobot (FREE)

1. **Sign up**
   - Visit [uptimerobot.com](https://uptimerobot.com)
   - Create free account

2. **Add Monitors**

   **Monitor 1: Website**
   - Monitor Type: HTTP(s)
   - Friendly Name: Core Q Website
   - URL: https://www.coreqcapital.com
   - Monitoring Interval: 5 minutes

   **Monitor 2: API Health**
   - Monitor Type: HTTP(s)
   - Friendly Name: Core Q API
   - URL: https://api.coreqcapital.com/api/health
   - Monitoring Interval: 5 minutes

3. **Configure Alerts**
   - Alert Contacts: Add your email (admin@coreqcapital.com)
   - Alert When: Down for 2+ minutes
   - Alert Methods: Email, SMS (optional)

4. **Public Status Page**
   - Go to "Status Pages"
   - Create new page
   - Subdomain: `coreq-status` (e.g., coreq-status.uptimerobot.com)
   - Or use custom domain: status.coreqcapital.com

**✅ Checkpoint:** Monitoring active, receiving uptime reports

### 7.2: Error Tracking (Optional but Recommended)

**Sentry.io - FREE tier:**
1. Sign up at [sentry.io](https://sentry.io)
2. Create new project → Node.js
3. Follow integration steps in PROFESSIONAL_DEPLOYMENT.md

---

## Step 8: Professional Touches (Day 6-7)

### 8.1: Favicon

1. Create or download company logo
2. Generate favicon using [realfavicongenerator.net](https://realfavicongenerator.net)
3. Replace files in `frontend/public/`
4. Commit and push to trigger redeploy

### 8.2: Email Signatures

Create professional signatures for your team:

```
---
[Name]
[Position] | Core Q Capital

📧 [email]@coreqcapital.com
📱 +254 XXX XXX XXX
🌐 www.coreqcapital.com

Professional Loan Management Solutions
```

### 8.3: Update Company Branding

Update these in the frontend:
- Page titles
- Meta descriptions
- Footer information
- About/Contact pages

**✅ Checkpoint:** Professional appearance complete

---

## Step 9: Production Launch (Day 7)

### Pre-Launch Checklist

```
Security:
☐ HTTPS working on all domains
☐ SSL certificates valid
☐ Strong passwords set
☐ JWT secret is cryptographically strong
☐ No .env files in git
☐ CORS configured for production domain

Functionality:
☐ Login/logout working
☐ Loan creation working
☐ Agreement workflow complete
☐ Payments recording correctly
☐ Email notifications sending
☐ SMS notifications configured
☐ Reports generating

Professional Setup:
☐ Custom domain active
☐ Professional email working
☐ Favicon displaying
☐ Mobile responsive
☐ Fast page loads

Monitoring:
☐ UptimeRobot active
☐ Alerts configured
☐ Status page published
☐ Error tracking (optional)

Documentation:
☐ Team trained
☐ Admin guide available
☐ Backup procedures documented
```

### Go Live! 🚀

1. **Announce to Team**
   - Send email from admin@coreqcapital.com
   - Share new URLs
   - Provide login credentials

2. **Update Bookmarks**
   - Replace old localhost URLs
   - Use https://www.coreqcapital.com

3. **Monitor Closely**
   - Watch Railway logs for first few hours
   - Check UptimeRobot dashboard
   - Respond to any alerts immediately

---

## Cost Summary

### Minimal Professional Setup (What you need)

| Item | Cost | Notes |
|------|------|-------|
| Domain (.com) | $12/year | Namecheap |
| Email (Zoho) | FREE | Up to 5 users |
| Railway Hobby | $5/month | App hosting |
| Railway MySQL | $7/month | Database |
| Monitoring (UptimeRobot) | FREE | 50 monitors |

**Total: ~$12/month (~$156/year)**

Plus SMS costs: ~KSH 0.80 per SMS (pay as you go with Africa's Talking)

---

## Quick Reference URLs

After setup, bookmark these:

### Production URLs
- **Website:** https://www.coreqcapital.com
- **API:** https://api.coreqcapital.com
- **Status Page:** Your UptimeRobot status page URL

### Admin Panels
- **Railway Dashboard:** https://railway.app/dashboard
- **Domain Management:** Your registrar (Namecheap, etc.)
- **Email Admin:** https://mail.zoho.com/zm/
- **Uptime Monitoring:** https://uptimerobot.com/dashboard
- **Africa's Talking:** https://account.africastalking.com

### Email Addresses
- admin@coreqcapital.com
- noreply@coreqcapital.com
- loans@coreqcapital.com

---

## Troubleshooting

### Domain not resolving?
- Wait 24-48 hours for DNS propagation
- Check DNS with: `nslookup coreqcapital.com`
- Verify CNAME records are correct

### SSL certificate not working?
- Railway auto-provisions after DNS resolves
- Can take 1-2 hours after DNS is active
- Check Railway dashboard for SSL status

### Email not sending?
- Verify Zoho app password is correct
- Check Railway environment variables
- Test email credentials in Zoho directly

### API not connecting?
- Check CORS configuration in backend
- Verify VITE_API_URL in frontend environment
- Check Railway logs for errors

### Need help?
- Check [PROFESSIONAL_DEPLOYMENT.md](./PROFESSIONAL_DEPLOYMENT.md) for detailed guide
- Review Railway documentation: docs.railway.app
- Check Railway community: railway.app/discord

---

## Next Steps After Launch

### Week 1 Post-Launch
- Monitor usage and performance
- Collect user feedback
- Address any issues immediately

### Month 1
- Review costs and usage
- Optimize database queries if needed
- Consider upgrading Railway plan if needed

### Ongoing
- Regular backups (weekly recommended)
- Security updates (`npm audit`)
- Monitor uptime and errors
- Plan new features

---

**Ready to start?** Begin with Step 1 (Domain Registration) and work through each step sequentially.

**Questions?** Refer to the comprehensive [PROFESSIONAL_DEPLOYMENT.md](./PROFESSIONAL_DEPLOYMENT.md) guide.

**Good luck with your professional launch! 🚀**
