# PA Salatiga Monitoring - Deployment Guide

## Environment Variables

### Required Environment Variables for Vercel:

```
DB_HOST=167.172.88.142
DB_USER=generator_monitoring
DB_PASSWORD=}Pqm;?_0bgg()mv!
DB_NAME=monitoring_db
DB_PORT=3306
NEXTAUTH_SECRET=pa-salatiga-monitoring-secret-key-2025
NEXTAUTH_URL=https://your-domain.vercel.app
```

## Deployment Steps

### 1. Vercel Deployment

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard:
   - Go to Project Settings > Environment Variables
   - Add all variables listed above
   
### 2. Database Setup

The application connects to remote MySQL database:
- Host: `167.172.88.142`
- User: `generator_monitoring`  
- Password: `}Pqm;?_0bgg()mv!`
- Database: `monitoring_db`
- Port: `3306`

### 3. Domain Configuration

Update `NEXTAUTH_URL` environment variable with your Vercel domain:
```
NEXTAUTH_URL=https://your-app-name.vercel.app
```

## Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in the database credentials
3. Run `npm run dev`

## Features

- ✅ Remote MySQL Database Integration
- ✅ Environment Variable Configuration  
- ✅ Production-Ready Settings
- ✅ Auto-deployment with Vercel
- ✅ Loading Skeletons
- ✅ Performance Optimizations
- ✅ Error Handling & Fallbacks