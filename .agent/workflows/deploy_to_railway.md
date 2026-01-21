---
description: Deploy the Marketing Agent Suite to Railway
---

This guide will help you deploy your application to [Railway](https://railway.app/), which is excellent for Node.js applications.

## Prerequisites

- A GitHub account
- A Railway account (login with GitHub recommended)

## Step 1: Push Code to GitHub

First, you need to push your code to a new GitHub repository.

1. Create a new repository on GitHub (e.g., `marketing-agent-suite`).
2. Initialize git and push your code:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/marketing-agent-suite.git
git push -u origin main
```

## Step 2: Deploy on Railway

1. Go to your [Railway Dashboard](https://railway.app/dashboard).
2. Click **"New Project"**.
3. Select **"Deploy from GitHub repo"**.
4. Select your `marketing-agent-suite` repository.
5. Click **"Deploy Now"**.

## Step 3: Configure Environment Variables

Your app needs the `PERPLEXITY_API_KEY` to work.

1. Click on your new project card in Railway.
2. Click on the **"Variables"** tab.
3. Click **"New Variable"**.
4. **Variable Name:** `PERPLEXITY_API_KEY`
5. **Value:** Paste your API key (the one starting with `pplx-...`).
   - _Note: You can find this key in your local `.env` file if you forgot it._
6. Click **"Add"**.

Railway will automatically redeploy your app with the new environment variable.

## Step 4: Verify Deployment

1. Once the deployment says **"Active"**, click on the generated URL (usually `https://marketing-agent-suite-production.up.railway.app`).
2. Run the "Persona Agent" to verify the API is working correctly.

## Troubleshooting

- **Build Failures:** Check the "Build Logs" tab. Ensure `package.json` has `node server.js` as the `start` script.
- **API Errors:** Check the "Deploy Logs" tab. Verify your `PERPLEXITY_API_KEY` is set correctly in the Variables tab.
