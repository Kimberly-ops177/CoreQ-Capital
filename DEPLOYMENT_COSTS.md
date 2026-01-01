# Deployment Cost Breakdown - Core Q Capital

This document provides a detailed breakdown of all costs associated with deploying and running Core Q Capital professionally.

---

## 🎯 Recommended Professional Setup

This is the **best balance of cost and professionalism** for a production business application.

### Monthly Costs

| Service | Plan | Monthly Cost | Annual Cost | Purpose |
|---------|------|--------------|-------------|---------|
| **Railway Hobby** | Hosting | $5.00 | $60.00 | Application hosting |
| **Railway MySQL** | Database | $7.00 | $84.00 | Database hosting |
| **Zoho Mail** | FREE (Lite) | $0.00 | $0.00 | Professional email (5 users) |
| **UptimeRobot** | FREE | $0.00 | $0.00 | Uptime monitoring |
| **Africa's Talking SMS** | Pay-as-you-go | ~$2-5* | ~$24-60* | SMS notifications |

**Subtotal Monthly: $14-17/month**

### Annual Costs

| Service | Annual Cost | Purpose |
|---------|-------------|---------|
| **Domain (.com)** | $12.00 | coreqcapital.com |
| **Domain Privacy** | $0.00 (FREE with Namecheap) | WHOIS protection |
| **SSL Certificate** | $0.00 (FREE with Railway) | HTTPS encryption |

**Subtotal Annual: $12.00**

### Total Cost

```
Monthly:  $14-17
Annual:   $180-216 ($12 domain + $168-204 monthly × 12)
```

**✅ This is what we recommend you start with!**

\* *SMS costs depend on usage. Estimate: 50-100 SMS/month at KSH 0.80 each ≈ $2-5/month*

---

## 💰 Cost Comparison by Setup Type

### 1. Basic Professional (Recommended)

**Best for:** Small to medium loan operations, professional appearance needed

| Item | Cost |
|------|------|
| Monthly | $14-17 |
| Annual | $180-216 |

**Includes:**
- ✅ Custom domain with SSL
- ✅ Professional email (5 users)
- ✅ Full application hosting
- ✅ MySQL database
- ✅ Uptime monitoring
- ✅ Automatic deployments
- ✅ SMS notifications (pay per use)

**Limitations:**
- Railway Hobby: $5 credit/month (usually enough for low-medium traffic)
- MySQL: 1GB storage (expandable)
- Email: 5 users max on free tier
- SMS: Pay per message

---

### 2. Enhanced Professional

**Best for:** Growing operations, need more resources

| Service | Monthly | Annual |
|---------|---------|--------|
| Railway Pro | $20 | $240 |
| MySQL (larger) | $15 | $180 |
| Google Workspace (3 users) | $18 | $216 |
| Domain | - | $12 |
| SMS (higher volume) | $10 | $120 |
| **Total** | **$63** | **$768** |

**Additional benefits:**
- More Railway compute credits
- Larger database (5GB+)
- Google Workspace (Gmail, Meet, Drive)
- Higher SMS volume
- Priority support

---

### 3. Enterprise Setup

**Best for:** Large operations, maximum reliability

| Service | Monthly | Annual |
|---------|---------|--------|
| Railway Pro | $20 | $240 |
| MySQL (production) | $30 | $360 |
| Google Workspace (5+ users) | $30 | $360 |
| Cloudflare Pro (DDoS) | $20 | $240 |
| Sentry Team (errors) | $29 | $348 |
| Domain + backup | - | $25 |
| SMS (high volume) | $20 | $240 |
| **Total** | **$149** | **$1,813** |

**Additional benefits:**
- Maximum uptime and reliability
- Advanced DDoS protection
- Team error tracking
- Multiple domains
- Backup systems
- Dedicated support

---

## 📊 Detailed Service Breakdown

### Domain Registration

| Registrar | .com Price | .co.ke Price | Notes |
|-----------|-----------|--------------|-------|
| **Namecheap** | $10-12/year | - | Recommended, includes FREE privacy |
| **Google Domains** | $12/year | - | Easy integration with Google services |
| **KENIC** | - | ~KSH 1,000/year | Required for .co.ke, needs business docs |
| **Cloudflare** | $9/year | - | At-cost pricing, best value |

**Recommendation:** Start with Namecheap .com ($12/year), add .co.ke later if needed.

---

### Email Services

| Provider | Free Tier | Paid Tier | Features |
|----------|-----------|-----------|----------|
| **Zoho Mail** | FREE (5 users) | $1/user/month | 5GB/user, webmail, mobile apps |
| **Google Workspace** | - | $6/user/month | 30GB, Gmail, Meet, Drive, Calendar |
| **Microsoft 365** | - | $5/user/month | Outlook, Teams, OneDrive |
| **ProtonMail** | - | $5/user/month | Encrypted email, privacy-focused |

**Recommendation:** Start with Zoho FREE (perfect for 1-5 users), upgrade to Google Workspace when you need more features.

**Email calculation:**
- Free tier: $0 for up to 5 users
- If 3 users: $3/month (Zoho) or $18/month (Google)
- If 10 users: $10/month (Zoho) or $60/month (Google)

---

### Hosting (Railway.app)

#### Plans Comparison

| Feature | Hobby ($5/month) | Pro ($20/month) |
|---------|------------------|-----------------|
| **Credit** | $5/month | $20/month |
| **Overage** | $0.000231/GB-hour | $0.000231/GB-hour |
| **Projects** | Unlimited | Unlimited |
| **Team members** | 1 | Unlimited |
| **Custom domains** | Unlimited | Unlimited |
| **SSL** | FREE | FREE |
| **Support** | Community | Priority |

**How Railway pricing works:**
- You get monthly credits ($5 or $20)
- Resources consume credits based on usage
- Backend + Frontend + DB typically uses $10-12/month
- You're billed for what you use beyond the credit

**Typical usage (Core Q Capital):**
```
Backend:     $3-4/month  (512MB RAM, low CPU)
Frontend:    $1-2/month  (Static files, minimal)
MySQL DB:    $7-10/month (1GB storage, moderate queries)
Total:       $11-16/month
```

**Recommendation:** Start with Hobby ($5) + separate MySQL ($7) = $12/month total

---

### Database (MySQL)

| Storage | Monthly Cost | Suitable For |
|---------|--------------|--------------|
| **1GB** | $7 | Up to 1,000 loans |
| **5GB** | $15 | Up to 10,000 loans |
| **10GB** | $30 | Up to 50,000 loans |

**Database size estimation:**
- Each loan with borrower + collateral ≈ 2-5KB
- 1,000 loans ≈ 5MB
- 10,000 loans ≈ 50MB
- Plus documents and agreements: multiply by 3-5x

**Recommendation:** Start with 1GB ($7/month), upgrade as needed.

---

### SMS Services

#### Africa's Talking (Recommended for Kenya)

| Volume | Cost per SMS | Monthly Cost (estimate) |
|--------|--------------|-------------------------|
| **0-100** | KSH 0.80 | $0.50 - $5 |
| **100-500** | KSH 0.80 | $5 - $25 |
| **500-1000** | KSH 0.70 | $20 - $40 |
| **1000+** | KSH 0.60 | $35+ |

**Example scenarios:**
- 50 loans/month, 2 SMS each = 100 SMS = KSH 80 ≈ $0.50
- 100 loans/month, 3 SMS each = 300 SMS = KSH 240 ≈ $1.50
- 500 loans/month, 2 SMS each = 1000 SMS = KSH 800 ≈ $5.00

**Recommendation:** Budget $2-5/month initially, adjust based on actual usage.

#### Twilio (International alternative)

| Volume | Cost per SMS |
|--------|--------------|
| **Kenya** | $0.05 (KSH 6.50) |
| **US/Europe** | $0.0079 |

*Note: Africa's Talking is 8x cheaper for Kenya!*

---

### Monitoring & Tools

| Service | Free Tier | Paid Tier | Purpose |
|---------|-----------|-----------|---------|
| **UptimeRobot** | 50 monitors, 5min checks | $7/month (1min checks) | Uptime monitoring |
| **Sentry** | 5K errors/month | $29/month (50K errors) | Error tracking |
| **Google Analytics** | FREE | - | Website analytics |
| **LogRocket** | 1K sessions/month | $99/month | Session replay |
| **Cloudflare** | FREE | $20/month (Pro) | CDN, DDoS protection |

**Recommendation:**
- Essential: UptimeRobot FREE
- Nice to have: Sentry FREE tier
- Optional: Google Analytics (FREE)

---

### SSL Certificates

| Provider | Cost | Notes |
|----------|------|-------|
| **Railway** | FREE | Auto-provisioned Let's Encrypt |
| **Cloudflare** | FREE | Universal SSL |
| **Let's Encrypt** | FREE | Manual setup required |
| **Commercial SSL** | $50-200/year | Not needed |

**Recommendation:** Use Railway's FREE SSL (automatic, no config needed).

---

## 💡 Cost Optimization Tips

### 1. Start Small, Scale Up
- Begin with Hobby plan + FREE email
- Monitor actual usage
- Upgrade only when needed

### 2. Use FREE Tiers
- Zoho Mail FREE (vs Google Workspace $18/month)
- UptimeRobot FREE (vs paid monitoring)
- Sentry FREE tier (vs paid error tracking)
- **Savings: $50+/month**

### 3. SMS Optimization
- Only send critical notifications
- Batch notifications where possible
- Use email for non-urgent updates
- **Savings: 50% of SMS costs**

### 4. Combine Services
- Railway includes: Hosting + SSL + Deployments + Monitoring
- Avoids separate services for each
- **Savings: $30+/month vs separate providers**

### 5. Annual Billing
- Many services offer discounts for annual payment
- Domain: Usually same price
- Google Workspace: 2 months free with annual
- **Savings: 10-20% annually**

---

## 📈 Growth Cost Projections

### Startup Phase (0-50 loans/month)

```
Domain:          $1/month (annual)
Railway:         $12/month
Email (Zoho):    $0/month
Monitoring:      $0/month
SMS:             $2/month
───────────────────────────
Total:           $15/month ≈ $180/year
```

### Growth Phase (50-200 loans/month)

```
Domain:          $1/month
Railway Pro:     $20/month
Email (Zoho):    $3/month (3 users)
Monitoring:      $0/month
SMS:             $10/month
───────────────────────────
Total:           $34/month ≈ $408/year
```

### Established Phase (200-500 loans/month)

```
Domain:          $1/month
Railway Pro:     $20/month
MySQL (5GB):     $15/month
Google Workspace: $18/month (3 users)
Monitoring:      $7/month (UptimeRobot paid)
SMS:             $25/month
───────────────────────────
Total:           $86/month ≈ $1,032/year
```

### Enterprise Phase (500+ loans/month)

```
Domain:          $2/month (multi-domain)
Railway Pro:     $20/month
MySQL (10GB):    $30/month
Google Workspace: $30/month (5 users)
Cloudflare Pro:  $20/month
Sentry Team:     $29/month
SMS:             $50/month
───────────────────────────
Total:           $181/month ≈ $2,172/year
```

---

## 🎯 Recommended Starting Budget

### Minimal Investment (Recommended)

**Setup Costs (One-time):**
- Domain registration: $12
- Initial testing SMS credits: $5
- **Total: $17**

**Monthly Recurring:**
- Railway + MySQL: $12
- Email: $0 (Zoho FREE)
- Monitoring: $0 (UptimeRobot FREE)
- SMS (actual usage): $2-5
- **Total: $14-17/month**

**First Year Total:**
```
Setup:      $17
Recurring:  $168-204 (12 months × $14-17)
───────────────────────
Total:      $185-221 for first year
```

### With Professional Email

**Monthly Recurring:**
- Railway + MySQL: $12
- Google Workspace (3 users): $18
- SMS: $5
- **Total: $35/month**

**First Year Total:**
```
Setup:      $17
Recurring:  $420 (12 months × $35)
───────────────────────
Total:      $437 for first year
```

---

## 💳 Payment Methods

### Railway
- Credit/Debit card
- Billing in USD
- Monthly invoices

### Domain Registrars
- Credit/Debit card
- PayPal
- Annual or multi-year prepay

### Google Workspace / Zoho
- Credit/Debit card
- Monthly or annual billing

### Africa's Talking
- M-Pesa
- Credit/Debit card
- Prepaid credits

---

## 📋 Cost Comparison: Railway vs Alternatives

### Railway.app (Recommended)

**Pros:**
- Simple pricing ($5-20/month)
- Includes SSL, deployments, monitoring
- Easy setup (15 minutes)
- Auto-scaling
- Great for startups

**Cons:**
- Credit-based billing
- Less control than VPS

**Total: $12-20/month**

### AWS (Alternative)

**Pros:**
- Maximum control
- Enterprise features
- Global infrastructure

**Cons:**
- Complex pricing
- Requires DevOps knowledge
- Minimum ~$50/month

**Total: $50-150/month**

### DigitalOcean (Alternative)

**Pros:**
- Simple VPS pricing
- Good documentation
- Predictable costs

**Cons:**
- Manual setup required
- Need to manage servers
- No auto-scaling

**Total: $25-60/month** (VPS + database + SSL + monitoring)

### Heroku (Alternative)

**Pros:**
- Similar to Railway
- Well-established

**Cons:**
- More expensive
- Less modern
- Eco tier sleeps

**Total: $25-50/month**

**Winner: Railway** - Best balance of cost, features, and ease of use.

---

## 🔮 Hidden Costs to Consider

### 1. Development Time
- Initial setup: 2-3 days
- DNS configuration: 1 day
- Testing: 1-2 days
- **Value: Your time**

### 2. Learning Curve
- Railway platform: 2-4 hours
- DNS management: 1-2 hours
- Email setup: 1-2 hours
- **Value: Your learning investment**

### 3. Maintenance Time
- Weekly monitoring: 30 min/week
- Monthly updates: 2 hours/month
- Support: As needed
- **Value: Ongoing time investment**

### 4. Data Costs
- Database backups: Included in Railway
- Email storage: Included in plan
- Log storage: 7 days free on Railway
- **Cost: $0 with recommended setup**

---

## 💰 ROI Calculation

### Cost per Loan

**Scenario: 100 loans/month**

```
Monthly cost:     $17
Loans per month:  100
Cost per loan:    $0.17
```

**Scenario: 500 loans/month**

```
Monthly cost:     $35
Loans per month:  500
Cost per loan:    $0.07
```

### Break-Even Analysis

If each loan generates KSH 500 profit:
- At $17/month (KSH 2,210): Need 5 loans to break even
- At $35/month (KSH 4,550): Need 10 loans to break even

**The system pays for itself with minimal volume!**

---

## 📝 Budget Planning Template

### Monthly Budget

```
Infrastructure:
  Railway hosting:     $____
  MySQL database:      $____
  Domain (÷12):        $____
                      ──────
  Subtotal:           $____

Communication:
  Email service:       $____
  SMS (estimated):     $____
                      ──────
  Subtotal:           $____

Tools (optional):
  Monitoring:          $____
  Error tracking:      $____
  Analytics:           $____
                      ──────
  Subtotal:           $____

TOTAL MONTHLY:        $____
TOTAL ANNUAL:         $____ × 12
```

### Example Filled Budget

```
Infrastructure:
  Railway hosting:     $5
  MySQL database:      $7
  Domain (÷12):        $1
                      ──────
  Subtotal:           $13

Communication:
  Email service:       $0 (Zoho FREE)
  SMS (estimated):     $3
                      ──────
  Subtotal:           $3

Tools (optional):
  Monitoring:          $0 (UptimeRobot FREE)
  Error tracking:      $0 (Sentry FREE)
  Analytics:           $0 (Google FREE)
                      ──────
  Subtotal:           $0

TOTAL MONTHLY:        $16
TOTAL ANNUAL:         $192
```

---

## ✅ Final Recommendation

### Best Setup for Core Q Capital

**Monthly:**
```
Railway Hobby:        $5
MySQL Database:       $7
Zoho Email:           $0 (FREE)
UptimeRobot:          $0 (FREE)
SMS (pay-per-use):    $3
────────────────────────
Total:                $15/month
```

**Annual:**
```
Domain (.com):        $12/year
────────────────────────
Total:                $192/year
```

**Total First Year: ~$192**

This provides:
- ✅ Professional appearance
- ✅ Custom domain with SSL
- ✅ Professional email
- ✅ Full application functionality
- ✅ Uptime monitoring
- ✅ Scalability when needed

**Start with this, scale as you grow!**

---

## 📞 Questions?

- **"Is this affordable?"** → Yes! Less than $200/year is very reasonable for a professional business application.
- **"Can I start smaller?"** → Not really. This IS the minimal professional setup.
- **"When should I upgrade?"** → When you hit 50+ loans/month or need more team members.
- **"Are there hidden fees?"** → No. This covers everything needed for production.

---

**Ready to deploy?** See [PROFESSIONAL_SETUP_QUICKSTART.md](./PROFESSIONAL_SETUP_QUICKSTART.md) to get started!
