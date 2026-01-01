# 🚀 Deployment Checklist - Core Q Capital

## Pre-Deployment (Do These First!)

### 1. Security Setup (15 minutes)
- [ ] Run `node generate-secrets.js`
- [ ] Update `backend/.env` with strong JWT_SECRET
- [ ] Change DB_PASSWORD from "1234" to strong password
- [ ] Update MySQL with new password
- [ ] Create Gmail App Password for EMAIL_PASSWORD
- [ ] Verify `.env` is in `.gitignore`

### 2. Code Quality (5 minutes)
- [ ] Remove any remaining debug code
- [ ] Check for hardcoded credentials
- [ ] Verify all console.logs are intentional
- [ ] Update company information in `.env`

### 3. Git Setup (10 minutes)
- [ ] Initialize git: `git init`
- [ ] Create .gitignore (already exists)
- [ ] First commit: `git add . && git commit -m "Initial commit"`
- [ ] Create GitHub repository
- [ ] Push to GitHub: `git push -u origin main`

## Deployment Setup

### Option A: Railway (Easiest - 15 minutes)

- [ ] Sign up at https://railway.app
- [ ] Connect GitHub account
- [ ] Create new project from GitHub repo
- [ ] Add MySQL database
- [ ] Configure environment variables (from .env)
- [ ] Deploy!

### Option B: AWS ECS (Professional - 1-2 hours)

- [ ] Set up AWS account
- [ ] Create ECR repositories
- [ ] Push Docker images
- [ ] Create RDS MySQL instance
- [ ] Set up ECS cluster
- [ ] Configure task definitions
- [ ] Deploy services
- [ ] Set up load balancer

### Option C: DigitalOcean (Balanced - 30 minutes)

- [ ] Sign up at DigitalOcean
- [ ] Create App from GitHub
- [ ] Add MySQL database
- [ ] Configure environment variables
- [ ] Deploy

## GitHub Actions Setup

### 1. Configure GitHub Secrets (10 minutes)

Go to: Repo → Settings → Secrets and variables → Actions

Add these secrets:

**Required:**
- [ ] `JWT_SECRET` (from generate-secrets.js)
- [ ] `DB_PASSWORD` (your strong password)
- [ ] `EMAIL_USER` (Gmail address)
- [ ] `EMAIL_PASSWORD` (Gmail app password)

**Platform-specific:**
- [ ] `RAILWAY_TOKEN` (if using Railway)
- [ ] `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` (if AWS)
- [ ] `DIGITALOCEAN_ACCESS_TOKEN` (if DO)

**Optional:**
- [ ] `AFRICASTALKING_API_KEY` (if using SMS)
- [ ] `AFRICASTALKING_USERNAME`

### 2. Enable GitHub Actions (2 minutes)
- [ ] Go to Actions tab
- [ ] Enable workflows
- [ ] Watch first build run

### 3. Create Branches (5 minutes)
```bash
# Create develop for staging
git checkout -b develop
git push -u origin develop

# Back to main
git checkout main
```

## Post-Deployment

### 1. Verify Deployment (10 minutes)
- [ ] Backend health: `https://your-domain.com/api/health`
- [ ] Frontend loads
- [ ] Can login
- [ ] Can create loan
- [ ] Database connected
- [ ] File uploads work

### 2. Configure Domain (15 minutes)
- [ ] Register domain (if needed)
- [ ] Point DNS to deployment
- [ ] Enable SSL/HTTPS
- [ ] Test with custom domain

### 3. Set Up Monitoring (30 minutes)
- [ ] Sign up for Sentry (error tracking)
- [ ] Add Sentry to backend
- [ ] Configure UptimeRobot (uptime monitoring)
- [ ] Set up log aggregation
- [ ] Configure alerts

### 4. Database Backups (15 minutes)
- [ ] Enable automatic backups on platform
- [ ] Test backup restoration
- [ ] Document backup schedule
- [ ] Set up backup notifications

### 5. Documentation (15 minutes)
- [ ] Document production URLs
- [ ] Save all credentials securely (password manager)
- [ ] Document deployment process
- [ ] Create runbook for common issues

## Testing Checklist

### Functional Testing
- [ ] User registration/login
- [ ] Create borrower
- [ ] Create collateral
- [ ] Create loan application
- [ ] Download unsigned agreement
- [ ] Upload signed agreement
- [ ] Admin approval workflow
- [ ] Record payment
- [ ] View reports
- [ ] Loan appears in tabs after approval

### Performance Testing
- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] Database queries optimized
- [ ] Image/file serving fast

### Security Testing
- [ ] HTTPS enabled
- [ ] JWT tokens working
- [ ] Unauthorized access blocked
- [ ] SQL injection protected
- [ ] XSS protection enabled
- [ ] CORS configured correctly

## Production Readiness

### Application
- [ ] All features working
- [ ] No critical bugs
- [ ] Error handling in place
- [ ] Loading states implemented
- [ ] User feedback for actions

### Infrastructure
- [ ] Auto-scaling configured
- [ ] Health checks passing
- [ ] Monitoring active
- [ ] Backups automated
- [ ] SSL certificates valid

### Operations
- [ ] CI/CD pipeline working
- [ ] Deployment documented
- [ ] Rollback plan tested
- [ ] Team has access
- [ ] Support plan in place

## Final Checks

- [ ] All secrets secured
- [ ] No .env files in Git
- [ ] Production credentials different from dev
- [ ] All team members notified
- [ ] Go-live date scheduled
- [ ] Celebration prepared! 🎉

## Timeline Estimate

**Quick Path (Railway):**
- Security setup: 15 min
- Git setup: 10 min
- Railway deployment: 15 min
- GitHub secrets: 10 min
- Testing: 20 min
**Total: ~1.5 hours**

**Professional Path (AWS):**
- Security setup: 15 min
- Git setup: 10 min
- AWS ECS setup: 1-2 hours
- GitHub secrets: 10 min
- Domain/SSL: 30 min
- Monitoring: 30 min
- Testing: 30 min
**Total: ~3-4 hours**

## Need Help?

Refer to:
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Complete instructions
- [DOCKER_GUIDE.md](DOCKER_GUIDE.md) - Docker help
- [CICD_GUIDE.md](CICD_GUIDE.md) - Pipeline help
- [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) - Secrets guide

---

**Ready to deploy?** Start with security setup!
