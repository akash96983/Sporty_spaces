# OAuth Setup Guide

## Required Packages

Install these packages in the backend directory:

```bash
cd backend
npm install passport passport-google-oauth20 passport-github2
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen if prompted
6. Set Application type: **Web application**
7. Add Authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
   - For production: `https://yourdomain.com/api/auth/google/callback`
8. Copy **Client ID** and **Client Secret**
9. Update `.env`:
   ```env
   GOOGLE_CLIENT_ID=your_actual_client_id_here
   GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
   ```

## GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: Sporty Spaces
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
4. Click **Register application**
5. Copy **Client ID**
6. Click **Generate a new client secret** and copy it
7. Update `.env`:
   ```env
   GITHUB_CLIENT_ID=your_actual_client_id_here
   GITHUB_CLIENT_SECRET=your_actual_client_secret_here
   ```

## After Setup

1. Restart your backend server:
   ```bash
   cd backend
   npm start
   # or
   node server.js
   ```

2. The OAuth buttons should now work:
   - Click "Continue with Google" → Redirects to Google → Returns to app
   - Click "Continue with GitHub" → Redirects to GitHub → Returns to app

## Testing

- Navigate to login page
- Click OAuth button
- Authenticate with provider
- Should redirect back to home page with session created

## Troubleshooting

- **Route not found**: Make sure backend server is running
- **OAuth error**: Check Client ID and Secret in `.env`
- **Redirect error**: Verify callback URLs match exactly
- **No email error**: For GitHub, ensure email is public or scope includes email access
