# 🚀 Docker Quick Start - Core Q Capital

## ✅ Prerequisites Checklist

- [ ] Docker Desktop installed and running
- [ ] Node.js installed (for generating secrets)
- [ ] Git repository initialized

## 🏃 5-Minute Setup

### 1. Generate Secrets (2 minutes)
```bash
node generate-secrets.js
```
Copy the output values - you'll need them next!

### 2. Configure Environment (2 minutes)
```bash
# Copy template
cp .env.docker .env

# Edit .env with your favorite editor
# Update these REQUIRED fields:
# - JWT_SECRET (paste from step 1)
# - DB_PASSWORD (paste from step 1)  
# - EMAIL_USER (your Gmail)
# - EMAIL_PASSWORD (Gmail app password)
```

### 3. Build & Run (1 minute)
```bash
# Build all containers
docker-compose build

# Start everything
docker-compose up -d

# Watch the logs
docker-compose logs -f
```

### 4. Verify (30 seconds)
Open your browser:
- Frontend: http://localhost
- Backend: http://localhost:5000/api/health
- Should see: "API is running" or "healthy"

## 🎯 Common Commands

```bash
# Stop everything
docker-compose down

# Restart after code changes
docker-compose up --build -d

# View logs for specific service
docker-compose logs -f backend

# Check status
docker-compose ps

# Access backend shell
docker-compose exec backend sh

# Access database
docker-compose exec db mysql -u root -p
```

## 🔧 Troubleshooting

**Port already in use?**
```bash
# Windows: Find process using port 5000
netstat -ano | findstr :5000
# Kill it: taskkill /PID <process_id> /F

# Mac/Linux: Find and kill
lsof -ti:5000 | xargs kill -9
```

**Database won't start?**
```bash
# Check logs
docker-compose logs db

# Reset database (WARNING: Deletes data!)
docker-compose down -v
docker-compose up -d
```

**Frontend not loading?**
```bash
# Check build succeeded
docker-compose logs frontend

# Verify Nginx config
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
```

## 📊 What's Running?

- **MySQL Database** (port 3306)
  - Persistent data in Docker volume
  - Auto-initializes on first run

- **Backend API** (port 5000)
  - Node.js/Express
  - Connects to MySQL
  - File uploads stored in volume

- **Frontend** (port 80)
  - React app built to static files
  - Served by Nginx
  - Production-optimized

## 🎓 Next Steps

1. ✅ Docker running locally
2. ⬜ Choose deployment platform (Railway/AWS/DigitalOcean)
3. ⬜ Set up CI/CD pipeline
4. ⬜ Deploy to production
5. ⬜ Configure custom domain
6. ⬜ Set up monitoring

**Ready to deploy?** See `DOCKER_GUIDE.md` for full instructions!

---

**Having issues?** Check:
1. Docker Desktop is running
2. No other services using ports 80, 5000, or 3306
3. .env file exists and has correct values
4. Generated strong secrets (not the default values!)
