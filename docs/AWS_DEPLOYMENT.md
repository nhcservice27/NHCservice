# AWS Deployment Guide - Cycle Harmony Laddus

This guide walks you through deploying the Cycle Harmony project to AWS.

## Architecture

- **Frontend**: AWS Amplify (React/Vite app)
- **Backend**: AWS Elastic Beanstalk (Node.js/Express API)
- **Database**: MongoDB Atlas (already configured - no AWS deployment needed)

---

## Prerequisites

- AWS Account
- AWS CLI installed and configured (`aws configure`)
- Git repository (GitHub, GitLab, or Bitbucket) connected to your project
- MongoDB Atlas connection string (already in your `.env`)

---

## Part 1: Deploy Backend to Elastic Beanstalk

### Step 1: Install EB CLI (if not installed)

```bash
pip install awsebcli
```

### Step 2: Initialize Elastic Beanstalk

```bash
cd cycle-harmony-laddus-main
eb init
```

When prompted:
- **Region**: Choose your region (e.g., `us-east-1`)
- **Application name**: `cycle-harmony-api`
- **Platform**: Node.js
- **Platform version**: Node.js 18 or 20
- **SSH**: Yes (optional, for debugging)

### Step 3: Create Environment and Deploy

```bash
eb create cycle-harmony-prod
```

### Step 4: Configure Environment Variables

In AWS Console → Elastic Beanstalk → Your Application → Configuration → Software → Environment properties, add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | production |
| `MONGODB_URI` | your-mongodb-atlas-connection-string |
| `JWT_SECRET` | your-secure-random-jwt-secret |
| `ALLOWED_ORIGINS` | https://YOUR-AMPLIFY-URL.amplifyapp.com |
| `FRONTEND_BASE_URL` | https://YOUR-AMPLIFY-URL.amplifyapp.com |
| `EMAIL_USER` | your-gmail-for-nodemailer |
| `EMAIL_PASS` | your-gmail-app-password |
| `EMAIL_HOST` | smtp.gmail.com |
| `EMAIL_PORT` | 587 |
| `RAZORPAY_KEY_ID` | your-razorpay-key |
| `RAZORPAY_KEY_SECRET` | your-razorpay-secret |
| `TELEGRAM_BOT_TOKEN` | your-telegram-token |
| `TELEGRAM_CHAT_ID` | your-telegram-chat-id |
| `GEMINI_API_KEY` | your-gemini-api-key |

**Important**: Add your Amplify URL to `ALLOWED_ORIGINS` and `FRONTEND_BASE_URL` after deploying the frontend (Step 2).

### Step 5: Get Your Backend URL

After deployment, note your API URL (e.g., `http://cycle-harmony-prod.xxx.us-east-1.elasticbeanstalk.com`).

---

## Part 2: Deploy Frontend to AWS Amplify

### Step 1: Push Code to Git

Ensure your code is in GitHub, GitLab, or Bitbucket.

### Step 2: Create Amplify App

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click **New app** → **Host web app**
3. Connect your Git provider and select the repository
4. Select the branch (e.g., `main`)

### Step 3: Configure Build Settings

Amplify will auto-detect the `amplify.yml` in your repo. If not, use:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
  singlePageApp:
    enabled: true
```

### Step 4: Add Environment Variables

In Amplify Console → App settings → Environment variables, add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | https://YOUR-EB-URL/api |

Replace `YOUR-EB-URL` with your Elastic Beanstalk URL. For HTTPS, you'll need to add a custom domain with SSL to your EB environment, or use the EB URL (HTTP) for testing.

### Step 5: Deploy

Click **Save and deploy**. Amplify will build and deploy your frontend.

### Step 6: Get Your Frontend URL

After deployment, your app will be at `https://main.xxxxx.amplifyapp.com` (or your custom domain).

---

## Part 3: Connect Frontend and Backend

### Update Backend CORS and URLs

1. Go to Elastic Beanstalk → Configuration → Environment properties
2. Update:
   - `ALLOWED_ORIGINS`: Add your Amplify URL (e.g., `https://main.xxxxx.amplifyapp.com`)
   - `FRONTEND_BASE_URL`: Your Amplify URL (for password reset links)

### Update Frontend API URL

1. Go to Amplify → App settings → Environment variables
2. Set `VITE_API_URL` to your backend API URL (e.g., `https://your-eb-url/api`)
3. Redeploy the frontend (Amplify will trigger a new build)

---

## Part 4: HTTPS for Backend (Recommended)

Elastic Beanstalk gives you HTTP by default. For production:

1. **Option A - Load Balancer SSL**:
   - Add a certificate in AWS Certificate Manager (ACM)
   - Configure your EB environment's load balancer to use HTTPS
   - Add a custom domain (e.g., `api.yourdomain.com`)

2. **Option B - Use AWS API Gateway** (advanced):
   - Put API Gateway in front of your EB backend for SSL termination

---

## Alternative: S3 + CloudFront for Frontend

If you prefer S3 instead of Amplify:

```bash
# Build frontend
npm run build

# Create S3 bucket and upload (replace BUCKET_NAME)
aws s3 sync dist/ s3://BUCKET_NAME --delete

# Enable static website hosting
aws s3 website s3://BUCKET_NAME --index-document index.html --error-document index.html
```

Then create a CloudFront distribution pointing to the S3 bucket for HTTPS and CDN.

---

## Quick Reference - URLs After Deployment

| Component | URL |
|-----------|-----|
| Frontend (Amplify) | https://main.xxxxx.amplifyapp.com |
| Backend API (EB) | http://your-app.region.elasticbeanstalk.com |
| Health Check | http://your-app.region.elasticbeanstalk.com/health |

---

## Troubleshooting

### Backend not starting
- Check EB logs: `eb logs`
- Verify all required env vars are set (especially `MONGODB_URI`, `JWT_SECRET`)
- Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0) or add EB's outbound IPs

### CORS errors
- Add your exact frontend URL (with https) to `ALLOWED_ORIGINS`
- No trailing slash in the URL

### Password reset link wrong
- Set `FRONTEND_BASE_URL` to your Amplify URL in EB environment variables
