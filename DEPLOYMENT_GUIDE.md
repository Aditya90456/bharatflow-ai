# BharatFlow Deployment Guide

## Render Deployment

### Quick Fix for Port Binding Issue

The port binding error you're seeing is now fixed. The server has been updated to:

1. **Bind to `0.0.0.0` in production** - Required for Render
2. **Use `process.env.PORT`** - Render provides this automatically
3. **Added health check endpoint** - Available at `/` for Render to verify service

### Deployment Steps

1. **Connect your GitHub repo to Render**
2. **Create a new Web Service**
3. **Use these settings:**
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && NODE_ENV=production npm start`
   - **Environment:** Node.js
   - **Plan:** Free (or paid for better performance)

### Environment Variables

Set these in your Render dashboard:

```
NODE_ENV=production
GEMINI_API_KEY=your_gemini_api_key_here
```

### Alternative: Using render.yaml

If you prefer infrastructure as code, the `render.yaml` file is already configured. Just:

1. Push your code to GitHub
2. Connect the repo to Render
3. Render will automatically use the `render.yaml` configuration

### Verification

Once deployed, your service should:
- ✅ Bind to the correct port (no more port binding errors)
- ✅ Respond to health checks at `/`
- ✅ Serve your API endpoints at `/api/*`

### Troubleshooting

If you still see port binding issues:

1. **Check the logs** in Render dashboard
2. **Verify NODE_ENV=production** is set
3. **Ensure the start command** includes the backend directory

### Local Testing

Test the production configuration locally:

```bash
cd backend
NODE_ENV=production npm start
```

The server should bind to `0.0.0.0:3001` instead of `localhost:3001`.

## Docker Deployment (Alternative)

If you prefer Docker:

```bash
cd backend
docker build -t bharatflow-backend .
docker run -p 3001:3001 -e NODE_ENV=production bharatflow-backend
```

## Next Steps

1. Deploy the backend first
2. Update your frontend to point to the deployed backend URL
3. Deploy the frontend (can use Vercel, Netlify, or Render static sites)