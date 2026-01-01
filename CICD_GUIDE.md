# CI/CD Pipeline Guide - Core Q Capital

## What You Have

A professional GitHub Actions CI/CD pipeline that automatically:
- Tests your code on every pull request
- Builds Docker images
- Runs security checks
- Deploys to production when you push to main

## Files Created

- `.github/workflows/ci-cd.yml` - Main deployment pipeline
- `.github/workflows/pr-check.yml` - Pull request validation

## How It Works

### On Pull Request
```
1. Code Quality Check
   - Checks for console.log statements
   - Finds TODO comments
   
2. Security Scan
   - npm audit on dependencies
   - Checks for vulnerabilities

3. Build Test
   - Builds Docker images
   - Tests containers start correctly
   - Validates health checks

4. PR Summary
   - Shows results of all checks
```

### On Push to Main
```
1. Security Check (runs first)
2. Build Docker Images
3. Deploy to Production (if all pass)
```

### On Push to Develop
```
1. Security Check
2. Build Docker Images
3. Deploy to Staging
```

## Setup Instructions

### Step 1: Push to GitHub

```bash
# Initialize git if not done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit with CI/CD pipeline"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/coreq-capital.git
git branch -M main
git push -u origin main
```

### Step 2: Configure GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions

Add these secrets:

**Required for all deployments:**
- `JWT_SECRET` - Your production JWT secret
- `DB_PASSWORD` - Production database password

**For Railway deployment:**
- `RAILWAY_TOKEN` - Get from Railway dashboard

**For AWS deployment:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

**For DigitalOcean:**
- `DIGITALOCEAN_ACCESS_TOKEN`

### Step 3: Enable GitHub Actions

- Go to repo → Actions tab
- Enable workflows if prompted

### Step 4: Create Branches

```bash
# Create develop branch for staging
git checkout -b develop
git push -u origin develop

# Back to main
git checkout main
```

## Workflow Triggers

### Automatic
- **Push to main** → Deploy to production
- **Push to develop** → Deploy to staging
- **Open PR** → Run all checks

### Manual
You can also trigger manually:
- Go to Actions tab
- Select workflow
- Click "Run workflow"

## Deployment Configuration

### Railway (Recommended for Quick Start)

Add to `.github/workflows/ci-cd.yml` in deploy-production job:

```yaml
- name: Deploy to Railway
  run: |
    npm install -g @railway/cli
    railway up --service backend
    railway up --service frontend
  env:
    RAILWAY_TOKEN: secrets.RAILWAY_TOKEN
```

### AWS ECS

See `AWS_DEPLOYMENT.md` for detailed setup

### DigitalOcean App Platform

See `DIGITALOCEAN_DEPLOYMENT.md` for setup

## Monitoring Your Pipeline

### View Workflow Runs
1. Go to GitHub repo
2. Click "Actions" tab
3. See all workflow runs

### Check Deployment Status
- Green checkmark = Success
- Red X = Failed
- Yellow dot = In progress

### View Logs
1. Click on workflow run
2. Click on job name
3. Expand step to see logs

## Best Practices

### Branch Strategy
```
main (production)
  ↑
develop (staging)
  ↑
feature/* (pull requests)
```

### Commit Messages
```bash
git commit -m "feat: Add loan approval workflow"
git commit -m "fix: Resolve payment calculation bug"
git commit -m "docs: Update deployment guide"
```

### Before Merging PR
- All checks must pass (green)
- Code reviewed
- Tested locally

## Troubleshooting

### Workflow Fails on Build
```bash
# Check Docker build locally
docker-compose build

# If fails, fix errors and commit
git add .
git commit -m "fix: Docker build errors"
git push
```

### Security Audit Fails
```bash
# Update vulnerable packages
cd backend
npm audit fix

cd ../frontend
npm audit fix

# Commit updates
git add .
git commit -m "fix: Update vulnerable dependencies"
git push
```

### Deployment Fails
1. Check GitHub Actions logs
2. Verify secrets are set correctly
3. Check deployment platform status

## Next Steps

1. Push code to GitHub
2. Configure secrets
3. Watch first automated deployment
4. Set up production domain
5. Enable monitoring

---

Ready to push to GitHub and see your CI/CD in action!
