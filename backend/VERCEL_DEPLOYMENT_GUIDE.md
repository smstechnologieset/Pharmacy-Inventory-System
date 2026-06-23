# Firebase & Vercel Deployment Guide

## Problem

The backend deployment on Vercel fails because it cannot find
`serviceAccountKey.json`. This file:

- Should NOT be committed to git (it's a secret)
- Doesn't exist on Vercel servers (serverless environment)
- Needs to be provided via environment variables instead

## Solution

The Firebase config now supports both:

1. **Local Development**: Reads from `serviceAccountKey.json` file
2. **Vercel/Production**: Reads from `FIREBASE_SERVICE_ACCOUNT_JSON` environment
   variable

## Setup Instructions for Vercel

### Step 1: Get Your Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **Settings ⚙️** → **Service Accounts**
4. Click **Generate New Private Key**
5. A JSON file will download - **keep this safe!**

### Step 2: Convert JSON to Environment Variable

You have two options:

#### Option A: Full JSON String (Recommended)

```bash
# Copy the entire serviceAccountKey.json content
# On Windows PowerShell:
$content = Get-Content "path\to\serviceAccountKey.json" -Raw
# On Mac/Linux:
cat path/to/serviceAccountKey.json
```

Copy the entire content as a single-line JSON string.

#### Option B: Minify JSON

Use an online tool to minify the JSON (remove all newlines and extra spaces).

### Step 3: Add to Vercel

1. Go to your Vercel project settings
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value**: Paste the full JSON (minified or as-is)
4. Set scope to: **Production, Preview, Development**
5. Click **Save**

### Step 4: Add Other Required Variables

Also add these environment variables to Vercel:

```
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
```

### Step 5: Redeploy

1. Go to **Deployments**
2. Click **Redeploy** on the latest deployment
3. Wait for the build to complete

## Local Development Setup

For local development, keep using `serviceAccountKey.json`:

1. Place your Firebase credentials file at: `backend/serviceAccountKey.json`
2. Make sure it's in `.gitignore` (never commit this file!)

```gitignore
# .gitignore
backend/serviceAccountKey.json
```

## Verify Setup

Test your endpoint to confirm Firebase is working:

```bash
# Local
curl http://localhost:5000/api/notifications/vapid-public-key

# Vercel
curl https://your-vercel-domain.com/api/notifications/vapid-public-key
```

**Success Response:**

```json
{
  "publicKey": "your-vapid-public-key"
}
```

**Error Response (if Firebase not configured):**

```json
{
  "success": false,
  "error": {
    "status": 500,
    "message": "VAPID_PUBLIC_KEY not configured"
  }
}
```

## Troubleshooting

### Error: "FIREBASE_SERVICE_ACCOUNT_JSON" is not valid JSON

- Make sure the entire JSON is on one line (no newlines)
- Remove any comments from the JSON
- Use a JSON validator to check the syntax

### Error: "Service account key file not found"

- ✅ For Vercel: Set the `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable
- ✅ For Local: Place `serviceAccountKey.json` in the backend folder

### Error: "Permission denied" on Firestore operations

- Check that your Firebase service account has proper permissions
- In Firebase Console → Firestore Database → Rules, ensure rules allow
  operations
- See `FIRESTORE_RULES.md` for recommended rules

## Best Practices

1. **Never commit `serviceAccountKey.json`** to git
2. **Use environment variables** for all deployment platforms
3. **Rotate keys regularly** in Firebase Console
4. **Use different service accounts** for development and production (optional)
5. **Set proper Firestore rules** to restrict access based on authentication

## Converting JSON to Single Line

If you need to convert a multi-line JSON to a single line:

**Using Node.js:**

```javascript
const fs = require("fs");
const content = JSON.stringify(
  JSON.parse(fs.readFileSync("serviceAccountKey.json")),
);
console.log(content);
```

**Using Python:**

```python
import json
with open('serviceAccountKey.json') as f:
    content = json.dumps(json.load(f), separators=(',', ':'))
print(content)
```

Then copy the output and paste into Vercel.

## Environment Variables Summary

| Variable                        | Required | Local    | Vercel | Example                          |
| ------------------------------- | -------- | -------- | ------ | -------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | ✅       | No\*     | ✅     | `{"type":"service_account",...}` |
| `VAPID_PUBLIC_KEY`              | ✅       | ✅       | ✅     | `BIaOFXxc...`                    |
| `VAPID_PRIVATE_KEY`             | ✅       | ✅       | ✅     | `JIPPjuVC...`                    |
| `VAPID_SUBJECT`                 | ✅       | ✅       | ✅     | `mailto:your@email.com`          |
| `FRONTEND_URL`                  | ✅       | ✅       | ✅     | `http://localhost:5173`          |
| `NODE_ENV`                      | ❌       | Optional | ✅     | `production`                     |

\*For local development, use `serviceAccountKey.json` file instead.

## Still Having Issues?

1. Check Vercel deployment logs: **Deployments** → **Click deployment** →
   **Logs**
2. Verify all environment variables are set
3. Ensure the JSON is valid (no extra quotes or commas)
4. Redeploy after making changes (environment variables take effect on new
   deployments)
