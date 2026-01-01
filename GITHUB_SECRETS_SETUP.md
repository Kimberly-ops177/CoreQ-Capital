# GitHub Secrets Configuration Guide

## What Are GitHub Secrets?

GitHub Secrets are encrypted environment variables that store sensitive data like:
- API keys
- Database passwords
- Authentication tokens
- Service credentials

They are NEVER exposed in logs or code.

## Required Secrets

### Core Application Secrets

#### JWT_SECRET
**What**: Secret key for JWT token signing
**How to generate**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
**Value**: Copy the 128-character string

#### DB_PASSWORD
**What**: Production database password
**How to generate**:
```bash
node generate-secrets.js
```
**Value**: Use the strong password from output

### Email Configuration

#### EMAIL_USER
**What**: Gmail address for sending notifications
**Value**: `your-email@gmail.com`

#### EMAIL_PASSWORD
**What**: Gmail App-Specific Password
**How to get**:
1. Go to https://myaccount.google.com/apppasswords
2. Select app: Mail
3. Select device: Other (Custom name)
4. Enter: "Core Q Capital Production"
5. Click Generate
6. Copy the 16-character password

**Value**: The generated app password

### SMS Configuration (Optional)

#### AFRICASTALKING_API_KEY
**What**: Africa's Talking API key
**Where**: https://africastalking.com dashboard
**Value**: Your production API key

#### AFRICASTALKING_USERNAME
**What**: Your Africa's Talking username
**Value**: Your username (not "sandbox" in production)

## Platform-Specific Secrets

### For Railway Deployment

#### RAILWAY_TOKEN
**How to get**:
1. Go to https://railway.app
2. Click your profile → Account Settings
3. Scroll to "Tokens"
4. Click "Create New Token"
5. Give it a name: "GitHub Actions"
6. Copy the token

**Value**: The generated token

### For AWS Deployment

#### AWS_ACCESS_KEY_ID
#### AWS_SECRET_ACCESS_KEY
**How to get**:
1. AWS Console → IAM
2. Users → Your user
3. Security credentials
4. Create access key
5. Download credentials

#### AWS_REGION
**Value**: `us-east-1` (or your preferred region)

### For DigitalOcean Deployment

#### DIGITALOCEAN_ACCESS_TOKEN
**How to get**:
1. DigitalOcean dashboard
2. API → Tokens/Keys
3. Generate New Token
4. Name: "GitHub Actions CI/CD"
5. Select: Read + Write
6. Copy token

## How to Add Secrets to GitHub

### Step-by-Step

1. **Go to your GitHub repository**

2. **Click Settings** (top menu)

3. **In left sidebar**: Secrets and variables → Actions

4. **Click "New repository secret"**

5. **Add each secret**:
   - Name: `JWT_SECRET`
   - Value: [paste your generated secret]
   - Click "Add secret"

6. **Repeat for all secrets**

### Screenshot Guide

```
GitHub Repo
  → Settings
    → Secrets and variables
      → Actions
        → New repository secret
          → Name: JWT_SECRET
          → Value: your_secret_here
          → Add secret
```

## Verifying Secrets

### Check Secrets Are Set

1. Go to Settings → Secrets and variables → Actions
2. You should see all secret names (values are hidden)
3. Update date shows when last modified

### Test in Workflow

Secrets are accessed in workflows like:
```yaml
env:
  JWT_SECRET: secrets.JWT_SECRET
```

### Don't Print Secrets

Never do this in workflows:
```yaml
# WRONG - Never do this!
- run: echo secrets.JWT_SECRET
```

GitHub automatically masks secrets in logs, but don't try to print them.

## Security Best Practices

### Do:
✅ Generate strong, unique secrets
✅ Use different secrets for dev/staging/prod
✅ Rotate secrets periodically
✅ Use GitHub Secrets for all sensitive data
✅ Limit secret access to necessary workflows

### Don't:
❌ Commit secrets to code
❌ Share secrets in plain text
❌ Use the same secret across environments
❌ Use weak or default secrets
❌ Print secrets in logs

## Secrets Checklist

Before deploying, verify you have:

### Required (Must Have)
- [ ] JWT_SECRET
- [ ] DB_PASSWORD
- [ ] EMAIL_USER
- [ ] EMAIL_PASSWORD

### Platform (Choose One)
- [ ] RAILWAY_TOKEN (if using Railway)
- [ ] AWS credentials (if using AWS)
- [ ] DIGITALOCEAN_ACCESS_TOKEN (if using DO)

### Optional
- [ ] AFRICASTALKING_API_KEY (if using SMS)
- [ ] TWILIO credentials (if using Twilio)

## Updating Secrets

### To Update a Secret:
1. Go to Settings → Secrets and variables → Actions
2. Find the secret
3. Click "Update"
4. Paste new value
5. Click "Update secret"

### When to Update:
- Secret compromised
- Regular rotation (every 90 days recommended)
- Changing services/providers
- Moving to production

## Troubleshooting

### Workflow says "Secret not found"
- Check spelling matches exactly
- Ensure secret is added to repository
- Check if using organization secret vs repo secret

### Deployment fails with authentication error
- Verify secret value is correct
- Check if secret has expired
- Ensure no extra spaces in value

### Can't see secret value
- This is normal - secrets are encrypted
- Delete and recreate if you lost the value

## Next Steps

1. Generate all required secrets:
   ```bash
   node generate-secrets.js
   ```

2. Add secrets to GitHub (use steps above)

3. Verify secrets are set

4. Push code to trigger workflow

5. Check Actions tab to see deployment

---

**Security reminder**: NEVER commit real secrets to your repository!
