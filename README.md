# Core Q Capital - Loan Management System

A professional loan management system with automated workflows, notifications, and comprehensive reporting.

## Features

- Loan application with agreement approval workflow
- Automated email & SMS notifications
- Payment recording and tracking
- Daily penalty calculations with grace periods
- Multi-location employee filtering
- Collateral status management
- Scheduled automated processing

## Tech Stack

**Backend:**
- Node.js + Express
- MySQL with Sequelize ORM
- JWT authentication
- node-cron for scheduling

**Frontend:**
- React with Vite
- Material-UI components
- Axios for API calls

**DevOps:**
- Docker containerization
- GitHub Actions CI/CD
- Nginx for production serving

## Quick Start

### Local Development

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your values
npm install
npm start

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Docker Deployment

```bash
# Generate secrets
node generate-secrets.js

# Configure environment
cp .env.docker .env
# Edit .env with generated secrets

# Build and run
docker-compose build
docker-compose up -d
```

## Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Docker Guide](DOCKER_GUIDE.md) - Docker setup and configuration
- [CI/CD Guide](CICD_GUIDE.md) - GitHub Actions pipeline
- [GitHub Secrets](GITHUB_SECRETS_SETUP.md) - Secrets configuration

## Project Structure

```
CORE-Q-VIBE-CODED/
├── backend/              # Node.js API server
├── frontend/             # React application
├── .github/workflows/    # CI/CD pipelines
├── docker-compose.yml    # Docker orchestration
└── docs/                 # Documentation
```

## Security

- Strong JWT secret generation
- SQL injection protection via Sequelize ORM
- Non-root Docker containers
- Environment variable management
- GitHub Secrets for sensitive data

## License

Private - Core Q Capital

## Support

For deployment assistance, see the documentation guides.
