# Render Deployment Guide

Deploy your EduSync Backend to Render.com with PostgreSQL database in minutes.

## Prerequisites

- GitHub account with the repository
- Render.com account (free tier available)
- Environment variables ready

## Step-by-Step Deployment

### 1. Prepare Repository

Ensure these files are in your GitHub repo:
- `package.json` ✓
- `tsconfig.json` ✓
- `Dockerfile` ✓
- `prisma/schema.prisma` ✓
- `.env.example` ✓
- All source files in `src/` ✓

### 2. Connect to Supabase

Since the project uses Supabase for database and authentication, you do not need to create a database on Render. Ensure your Supabase project is set up and you have your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` ready.

### 3. Deploy Backend Service

1. Click "New" → "Web Service"
2. Click "Deploy an existing repo"
3. Connect your GitHub account
4. Select your `pdd-teju-backend` repository
5. Fill in:
   - **Name**: `edusync-api` (or your choice)
   - **Region**: Same as database
   - **Branch**: `main` (or your branch)
   - **Runtime**: `Docker`
   - **Plan**: Free (can upgrade later)

### 4. Configure Environment Variables

In Render dashboard, go to your Web Service → Environment → Add Environment Variable:

```
PORT=5000
NODE_ENV=production
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
YOUTUBE_API_KEY=<optional-your-youtube-key>
GITHUB_TOKEN=<optional-your-github-token>
CORS_ORIGIN=https://your-frontend.com,https://your-mobile.com
API_CACHE_TTL=3600
MAX_RECOMMENDATIONS=12
```

### 5. Deploy

1. Click "Create Web Service"
2. Render will:
   - Build Docker image
   - Deploy to production
3. Wait for "Your service is live" message (~5-10 minutes)

### 6. Verify Deployment

Visit your service URL + `/api/health`:
```
https://your-service.render.com/api/health
```

Should see:
```json
{
  "success": true,
  "message": "EduSync Backend is running",
  "timestamp": "2024-01-08T10:00:00Z"
}
```

---

### Post-Deployment Checklist

- [ ] Health endpoint works: `/api/health`
- [ ] Ensure Supabase Auth works from frontend
- [ ] Can submit survey: `POST /api/survey/submit`
- [ ] Get recommendations: `GET /api/recommendations`
- [ ] Database has data: Check Supabase Dashboard

### Inspect Database on Production

Use the [Supabase Dashboard](https://supabase.com/dashboard) to view tables (users, surveys, recommendations, etc.) and configure your project.

---

## Monitoring

### View Logs

In Render dashboard:
1. Click your Web Service
2. Go to "Logs" tab
3. See real-time logs

### Common Issues

#### Build fails
- Check `npm run build` works locally
- Verify all dependencies in package.json
- Check Node version (should be 18+)

#### Database connection error
- Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct
- Check CORS_ORIGIN includes your frontend

---

## Environment Variables Reference

| Variable | Required | Example |
|----------|----------|---------|
| PORT | Yes | 5000 |
| NODE_ENV | Yes | production |
| SUPABASE_URL | Yes | https://your-project.supabase.co |
| SUPABASE_SERVICE_ROLE_KEY | Yes | eyJhbGci... |
| YOUTUBE_API_KEY | No | AIzaSyD... |
| GITHUB_TOKEN | No | ghp_... |
| CORS_ORIGIN | Yes | https://app.com |
| API_CACHE_TTL | No | 3600 |
| MAX_RECOMMENDATIONS | No | 12 |

---

## Scaling on Render

### Upgrade Plan

As traffic grows:

1. Go to Web Service → Settings → Plan
2. Options:
   - **Free**: No charge, sleeps after 15 min inactivity
   - **Starter**: $7/month, always on
   - **Standard**: $21/month, more CPU/RAM
   - **Pro**: $115+/month, auto-scaling

### Auto-scaling

Enable in Settings:
```
Max instances: 5
Memory per instance: 512 MB
CPU per instance: 0.5
```

---

## Custom Domain

1. Go to Web Service → Settings → Custom Domain
2. Enter your domain (e.g., `api.edusync.com`)
3. Add DNS records shown by Render
4. Wait for SSL certificate (~5 min)

Example DNS record:
```
api.edusync.com CNAME render.com
```

---

## Backup Database

Since the database is hosted on Supabase, backups are managed through the Supabase Dashboard. 
1. Go to your Supabase Project Settings → Database → Backups.
2. Supabase provides daily automatic backups.

---

## Stopping/Deleting Service

### Pause Service
- Settings → Plan → "Free (Paused)"
- Resumes automatically when needed
- Database retains data

### Delete Service
- Settings → Delete
- **WARNING**: Deletes all data

---

## Troubleshooting

### Deployment stuck?
```bash
# Check build logs in Render dashboard
# Rebuild by pushing new commit to GitHub
git commit --allow-empty -m "Rebuild"
git push
```

### Database issues?
- Verify your Supabase URL and Service Role Key in Render Environment Variables.

### Can't connect from local?
- Use Internal URL in Render services only
- Use External URL for local connections
- External URL slower, for local testing only

### CORS errors?
- Update CORS_ORIGIN in environment variables
- Format: `https://domain.com,https://mobile.com`
- Restart web service

---

## Performance Tips

1. **Caching**: API responses cached 1 hour
2. **Database**: Add indexes to frequently queried columns
3. **Pagination**: Implement for large result sets
4. **Monitoring**: Enable Render monitoring in dashboard
5. **Logs**: Stream logs to external service for long-term storage

---

## Support

- [Render Documentation](https://render.com/docs)
- [Render Discord Community](https://discord.gg/render)
- [EduSync GitHub Issues](https://github.com/your-repo/issues)

---

## Next Steps

1. ✅ Deployed API
2. Deploy React web frontend
3. Deploy React Native mobile app
4. Set up CI/CD for auto-deployment on Git push
5. Configure monitoring & alerts
6. Set up custom domain & SSL

**Your API is now live and ready! 🚀**

