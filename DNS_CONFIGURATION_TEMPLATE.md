# DNS Configuration Template

Use this template when configuring DNS records at your domain registrar (Namecheap, Google Domains, etc.)

## Your Domain Information

```
Domain: coreqcapital.com (or your chosen domain)
Registrar: [Namecheap / Google Domains / Other]
Email Provider: Zoho Mail (FREE)
Hosting: Railway.app
```

---

## DNS Records to Configure

### 1. Website Records (Frontend)

#### Root Domain (coreqcapital.com)

**Option A: If your registrar supports CNAME Flattening**
```
Type: CNAME
Host: @
Target: coreq-frontend-production.up.railway.app
TTL: Automatic (or 3600)
```

**Option B: If CNAME Flattening not supported (use A record)**
```
Type: A
Host: @
Target: [Railway IP address - get from Railway dashboard]
TTL: Automatic (or 3600)
```

#### WWW Subdomain
```
Type: CNAME
Host: www
Target: coreq-frontend-production.up.railway.app
TTL: Automatic (or 3600)
```

### 2. API Records (Backend)

```
Type: CNAME
Host: api
Target: coreq-backend-production.up.railway.app
TTL: Automatic (or 3600)
```

---

## Email Configuration (Zoho Mail)

### MX Records (Mail Exchange)

**Priority 10 (Primary):**
```
Type: MX
Host: @ (or blank)
Target: mx.zoho.com
Priority: 10
TTL: Automatic (or 3600)
```

**Priority 20 (Secondary):**
```
Type: MX
Host: @ (or blank)
Target: mx2.zoho.com
Priority: 20
TTL: Automatic (or 3600)
```

**Priority 50 (Tertiary):**
```
Type: MX
Host: @ (or blank)
Target: mx3.zoho.com
Priority: 50
TTL: Automatic (or 3600)
```

### SPF Record (Sender Policy Framework)

Prevents email spoofing:
```
Type: TXT
Host: @ (or blank)
Value: v=spf1 include:zoho.com ~all
TTL: Automatic (or 3600)
```

### DKIM Record (DomainKeys Identified Mail)

Email authentication - **Get this value from Zoho Mail control panel:**
```
Type: TXT
Host: zoho._domainkey
Value: [Provided by Zoho during setup - looks like "v=DKIM1; k=rsa; p=MIGfMA0GCSq..."]
TTL: Automatic (or 3600)
```

### DMARC Record (Optional but Recommended)

Email policy enforcement:
```
Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@coreqcapital.com
TTL: Automatic (or 3600)
```

---

## Optional: Status Page Subdomain

If using UptimeRobot status page:
```
Type: CNAME
Host: status
Target: stats.uptimerobot.com
TTL: Automatic (or 3600)
```

If using custom status page:
```
Type: CNAME
Host: status
Target: [your-status-page-provider-url]
TTL: Automatic (or 3600)
```

---

## Complete DNS Configuration Table

Copy this table and fill in your specific values:

| Type | Host | Target/Value | Priority | TTL |
|------|------|--------------|----------|-----|
| A or CNAME | @ | [Frontend Railway URL or IP] | - | Auto |
| CNAME | www | coreq-frontend-production.up.railway.app | - | Auto |
| CNAME | api | coreq-backend-production.up.railway.app | - | Auto |
| MX | @ | mx.zoho.com | 10 | Auto |
| MX | @ | mx2.zoho.com | 20 | Auto |
| MX | @ | mx3.zoho.com | 50 | Auto |
| TXT | @ | v=spf1 include:zoho.com ~all | - | Auto |
| TXT | zoho._domainkey | [Get from Zoho] | - | Auto |
| TXT | _dmarc | v=DMARC1; p=none; rua=mailto:admin@coreqcapital.com | - | Auto |

---

## Provider-Specific Instructions

### Namecheap

1. **Login to Namecheap**
2. Go to **Domain List**
3. Click **Manage** next to your domain
4. Go to **Advanced DNS** tab
5. Click **Add New Record**
6. Add each record from the table above

**Important Namecheap Notes:**
- Use `@` for root domain
- Use `www` for www subdomain
- For CNAME on root (@), you may need to use "CNAME Record" type or "URL Redirect"
- If CNAME on @ doesn't work, get Railway's IP and use A record

### Google Domains

1. **Login to domains.google.com**
2. Click on your domain
3. Go to **DNS** tab
4. Scroll to **Custom resource records**
5. Add each record

**Important Google Domains Notes:**
- Leave name blank for root (@)
- Use `www` for www subdomain
- Google Domains supports CNAME flattening

### Cloudflare

1. **Login to Cloudflare**
2. Select your domain
3. Go to **DNS** tab
4. Click **Add record**
5. Add each record

**Important Cloudflare Notes:**
- Cloudflare proxies CNAME/A records by default (orange cloud)
- For email (MX, TXT), ensure proxy is OFF (grey cloud)
- For API subdomain, you can enable proxy for DDoS protection
- Cloudflare supports CNAME flattening

---

## Railway-Specific Values

### How to Get Your Railway URLs

1. **Login to Railway Dashboard**
2. Go to your project
3. Click on **Backend service**
4. Go to **Settings** → **Domains**
5. Copy the Railway-generated URL (e.g., `coreq-backend-production.up.railway.app`)
6. Repeat for **Frontend service**

### How to Add Custom Domain in Railway

1. **For Backend (API):**
   - Backend service → Settings → Domains
   - Click **+ Custom Domain**
   - Enter: `api.coreqcapital.com`
   - Railway will show the CNAME target

2. **For Frontend (Website):**
   - Frontend service → Settings → Domains
   - Click **+ Custom Domain**
   - Enter: `www.coreqcapital.com` and `coreqcapital.com`
   - Railway will show the CNAME target

---

## Verification Steps

### 1. Check DNS Propagation

Use online tools or command line:

```bash
# Check A record
nslookup coreqcapital.com

# Check CNAME
nslookup www.coreqcapital.com

# Check MX records
nslookup -type=MX coreqcapital.com

# Check TXT records (SPF)
nslookup -type=TXT coreqcapital.com
```

**Online tools:**
- https://dnschecker.org
- https://mxtoolbox.com
- https://whatsmydns.net

### 2. Verify Email Configuration

**Test MX records:**
```bash
nslookup -type=MX coreqcapital.com
```

Should return:
```
coreqcapital.com    mail exchanger = 10 mx.zoho.com
coreqcapital.com    mail exchanger = 20 mx2.zoho.com
coreqcapital.com    mail exchanger = 50 mx3.zoho.com
```

**Test SPF:**
```bash
nslookup -type=TXT coreqcapital.com
```

Should include: `v=spf1 include:zoho.com ~all`

### 3. Verify Website Access

```bash
# Test root domain
curl -I https://coreqcapital.com

# Test www
curl -I https://www.coreqcapital.com

# Test API
curl https://api.coreqcapital.com/api/health
```

All should return HTTP 200 OK with SSL certificate.

---

## Troubleshooting

### DNS Not Propagating

**Issue:** Changes not reflecting after 24 hours

**Solutions:**
1. Verify records are correct in registrar control panel
2. Check TTL values (lower TTL = faster propagation)
3. Clear local DNS cache:
   ```bash
   # Windows
   ipconfig /flushdns

   # Mac/Linux
   sudo dscacheutil -flushcache
   ```
4. Use different DNS checker (dnschecker.org)
5. Contact registrar support

### CNAME on Root Domain Not Working

**Issue:** Registrar doesn't support CNAME on @ (root)

**Solutions:**
1. **Use ALIAS record** (if available)
2. **Use A record** instead:
   - Get IP from Railway or use `nslookup coreq-frontend-production.up.railway.app`
   - Add A record pointing to that IP
3. **Transfer to Cloudflare** (supports CNAME flattening)

### Email Not Receiving

**Issue:** Can't receive emails at @coreqcapital.com

**Solutions:**
1. Verify MX records are correct (`nslookup -type=MX`)
2. Wait 24-48 hours for full propagation
3. Check Zoho Mail control panel for domain verification status
4. Test with mail-tester.com
5. Verify no old MX records exist

### SSL Certificate Not Provisioning

**Issue:** Railway not generating SSL certificate

**Solutions:**
1. Wait 1-2 hours after DNS propagates
2. Verify DNS is resolving correctly (`nslookup`)
3. Check Railway dashboard for SSL status
4. Remove and re-add custom domain in Railway
5. Contact Railway support

---

## DNS Configuration Checklist

Before you start:
- [ ] Domain purchased and active
- [ ] Access to domain registrar DNS management
- [ ] Railway services deployed and running
- [ ] Railway custom domains noted down
- [ ] Zoho Mail account created

During configuration:
- [ ] Root domain (@ or blank) configured
- [ ] WWW subdomain configured
- [ ] API subdomain configured
- [ ] All 3 MX records added
- [ ] SPF record (TXT) added
- [ ] DKIM record (TXT) added with Zoho value
- [ ] DMARC record (TXT) added (optional)

After configuration:
- [ ] DNS propagation checked (dnschecker.org)
- [ ] Website accessible at https://coreqcapital.com
- [ ] Website accessible at https://www.coreqcapital.com
- [ ] API accessible at https://api.coreqcapital.com
- [ ] SSL certificates showing as valid
- [ ] Email receiving working
- [ ] Email sending working

---

## Example: Complete Namecheap Configuration

Here's what your Namecheap Advanced DNS page should look like:

```
┌──────────┬──────────────────┬───────────────────────────────────────────┬──────────┬─────┐
│   Type   │      Host        │              Value                        │ Priority │ TTL │
├──────────┼──────────────────┼───────────────────────────────────────────┼──────────┼─────┤
│ A Record │        @         │ 123.45.67.89 (Railway IP)                │    -     │Auto │
│ CNAME    │       www        │ coreq-frontend-production.up.railway.app  │    -     │Auto │
│ CNAME    │       api        │ coreq-backend-production.up.railway.app   │    -     │Auto │
│ MX       │        @         │ mx.zoho.com                               │    10    │Auto │
│ MX       │        @         │ mx2.zoho.com                              │    20    │Auto │
│ MX       │        @         │ mx3.zoho.com                              │    50    │Auto │
│ TXT      │        @         │ v=spf1 include:zoho.com ~all              │    -     │Auto │
│ TXT      │zoho._domainkey   │ v=DKIM1; k=rsa; p=MIGfMA0...             │    -     │Auto │
│ TXT      │     _dmarc       │ v=DMARC1; p=none; rua=mailto:admin@...    │    -     │Auto │
└──────────┴──────────────────┴───────────────────────────────────────────┴──────────┴─────┘
```

---

## Quick Reference Commands

```bash
# Check all DNS records
dig coreqcapital.com ANY

# Check specific record types
dig coreqcapital.com A
dig www.coreqcapital.com CNAME
dig api.coreqcapital.com CNAME
dig coreqcapital.com MX
dig coreqcapital.com TXT

# Trace DNS resolution
dig +trace coreqcapital.com

# Check from specific DNS server
dig @8.8.8.8 coreqcapital.com
```

---

**Need help?** Refer to:
- [PROFESSIONAL_DEPLOYMENT.md](./PROFESSIONAL_DEPLOYMENT.md) - Full deployment guide
- [PROFESSIONAL_SETUP_QUICKSTART.md](./PROFESSIONAL_SETUP_QUICKSTART.md) - Quick start guide
- Your domain registrar's support documentation
- Railway documentation: docs.railway.app
- Zoho Mail help: help.zoho.com/portal/en/kb/mail
