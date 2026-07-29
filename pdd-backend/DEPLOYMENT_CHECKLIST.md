# Deployment Checklist

Complete this checklist before deploying EduSync Backend to production.

## Pre-Deployment (Local Development)

### Code Quality
- [ ] All TypeScript compiles without errors: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] Code is formatted: `npm run format`
- [ ] All endpoints tested locally
- [ ] No hardcoded secrets in codebase
- [ ] Git history is clean and meaningful commits

### Testing
- [ ] Unit tests pass (if added): `npm test`
- [ ] API endpoints tested with sample data
- [ ] All error scenarios tested
- [ ] CORS works with your frontend URL
- [ ] Authentication/JWT flow works end-to-end

### Database
- [ ] Database schema matches Prisma schema
- [ ] All migrations created and tested
- [ ] Database indices created for performance
- [ ] Backup strategy planned

### Documentation
- [ ] README.md is complete and accurate
- [ ] API documentation is up-to-date
- [ ] Environment variables documented
- [ ] Deployment instructions clear
- [ ] Team has access to documentation

---

## Environment Setup

### Production Environment Variables
- [ ] `JWT_SECRET` - Strong random string (≥32 characters)
- [ ] `JWT_EXPIRE` - Set appropriately (e.g., "7d")
- [ ] `NODE_ENV` - Set to "production"
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `CORS_ORIGIN` - Updated to match your domain(s)
- [ ] `YOUTUBE_API_KEY` - (Optional) Production key with quota
- [ ] `GITHUB_TOKEN` - (Optional) Production token
- [ ] `API_CACHE_TTL` - Set based on requirements
- [ ] `PORT` - Configured for your platform (default 5000)

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Render Deployment (Recommended)

### Database Setup
- [ ] PostgreSQL database created on Render
- [ ] Database URL copied (internal URL for services)
- [ ] Database user and password configured
- [ ] Database backup policy reviewed

### Application Setup
- [ ] GitHub repository is public or properly connected
- [ ] Render Web Service created
- [ ] All environment variables configured
- [ ] Build and deploy logs reviewed
- [ ] No build errors in Render dashboard

### Post-Deployment Verification
- [ ] Health endpoint responds: `/api/health/health`
- [ ] Can register new user
- [ ] Can login with registered user
- [ ] Can submit survey
- [ ] Can get recommendations
- [ ] Database has sample data
- [ ] Response times acceptable
- [ ] No error messages in logs

### Custom Domain (Optional)
- [ ] Domain configured on Render
- [ ] DNS records updated correctly
- [ ] SSL certificate issued
- [ ] HTTPS works correctly
- [ ] Domain is accessible externally

---

## Security Checklist

### Authentication
- [ ] JWT tokens are properly validated
- [ ] Password hashing uses bcrypt
- [ ] Passwords are minimum 6 characters
- [ ] Tokens expire after configured time
- [ ] Only password hashes stored, never plain passwords

### API Security
- [ ] CORS configured for allowed origins only
- [ ] No sensitive data in error messages
- [ ] SQL injection prevented (using Prisma ORM)
- [ ] Rate limiting configured (if applicable)
- [ ] HTTPS enforced for API endpoints
- [ ] Authorization middleware applied to protected routes

### Database Security
- [ ] Database credentials not in version control
- [ ] Database backups encrypted
- [ ] Database user has minimal permissions
- [ ] Sensitive data encrypted at rest (if applicable)
- [ ] Database connection uses encryption (SSL/TLS)

### Secrets Management
- [ ] API keys stored in environment variables
- [ ] No secrets in .env file tracked in Git
- [ ] `.env` added to `.gitignore`
- [ ] Production secrets managed securely
- [ ] Secret rotation plan established

---

## Performance & Monitoring

### Performance
- [ ] Response times under 500ms for most endpoints
- [ ] Database queries optimized with indices
- [ ] Caching strategy implemented
- [ ] Pagination implemented for large result sets
- [ ] Connection pooling configured

### Monitoring
- [ ] Error logging configured
- [ ] Response time monitoring enabled
- [ ] Database performance monitored
- [ ] API metrics tracked
- [ ] Alerts configured for:
  - High error rate
  - High response time
  - Database connection failures
  - Disk space low
  - Memory usage high

### Logging
- [ ] Logs captured and stored
- [ ] Log levels configured (error, warn, info)
- [ ] Sensitive data not logged
- [ ] Log retention policy set
- [ ] Log aggregation service configured (optional)

---

## Deployment Instructions

### Step-by-Step Render Deployment

1. **Create PostgreSQL Database**
   - Go to Render dashboard
   - New → PostgreSQL
   - Configure and create
   - Copy internal URL

2. **Deploy Backend Service**
   - New → Web Service
   - Connect GitHub repository
   - Configure environment variables (see above)
   - Create service
   - Wait for deployment

3. **Run Migrations**
   - Migrations run automatically on first deploy
   - Or run manually via Render shell:
     ```bash
     npm run prisma:migrate
     ```

4. **Verify Deployment**
   - Check `/api/health/health` endpoint
   - Test full user flow
   - Check logs for errors

5. **Update Frontend**
   - Set API base URL to your Render service URL
   - Test all API calls
   - Deploy frontend

---

## Backup & Disaster Recovery

### Database Backup
- [ ] Automatic backups configured
- [ ] Backup retention: minimum 7 days
- [ ] Test restore procedures
- [ ] Backup encryption enabled
- [ ] Backup storage location secure

### Disaster Recovery Plan
- [ ] RTO (Recovery Time Objective) defined: _____ minutes
- [ ] RPO (Recovery Point Objective) defined: _____ hours
- [ ] Runbook for recovery documented
- [ ] Team trained on recovery procedures
- [ ] Failover process tested

### Data Protection
- [ ] Personal data encrypted
- [ ] GDPR compliance reviewed (if applicable)
- [ ] Data retention policy established
- [ ] Data deletion procedures documented

---

## Post-Deployment (First 24 Hours)

- [ ] Monitor for errors and warnings
- [ ] Check database growth
- [ ] Verify API response times
- [ ] Test all critical user flows
- [ ] Review logs for anomalies
- [ ] Monitor resource usage
- [ ] Verify backups are running

---

## Ongoing Maintenance

### Weekly
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Verify backups completed

### Monthly
- [ ] Update dependencies for security patches
- [ ] Review API usage metrics
- [ ] Optimize slow queries if any
- [ ] Review and rotate API keys if needed

### Quarterly
- [ ] Full security audit
- [ ] Load testing
- [ ] Disaster recovery drill
- [ ] Review and update documentation

---

## Rollback Plan

If deployment has critical issues:

1. **Immediate Rollback**
   ```bash
   git revert <commit-hash>
   git push
   # Render will auto-deploy previous version
   ```

2. **Database Rollback**
   - Restore from backup if schema changed
   - Contact Render support for recovery

3. **Notification**
   - Notify team/users of issue
   - Communicate rollback status
   - Prepare post-mortem

---

## Sign-Off

- Deployed by: _________________ Date: _______
- Reviewed by: _________________ Date: _______
- Approved by: _________________ Date: _______

### Issues Found & Fixed
1. ___________________________________
2. ___________________________________
3. ___________________________________

### Notes
_________________________________
_________________________________
_________________________________

---

## Post-Deployment Contact

- On-call Engineer: ________________________
- Emergency Contact: ______________________
- Status Page: ____________________________
- Documentation: __________________________

---

## Quick Reference

### Render Dashboard
- Service URL: https://dashboard.render.com
- API Endpoint: https://your-service.render.com/api
- Health Check: https://your-service.render.com/api/health/health

### Database Access
```bash
# SSH into service and access database:
psql <internal-database-url>

# Or use Prisma Studio:
npm run prisma:studio
```

### Common Issues
- **Deployment fails**: Check logs in Render dashboard
- **Database connection error**: Verify DATABASE_URL matches
- **CORS errors**: Update CORS_ORIGIN in environment
- **Cannot access API**: Check CORS and CORS_ORIGIN configuration

---

**Deployment Completed Successfully ✅**

Remember to:
1. Share this checklist with your team
2. Document any deviations
3. Keep this updated for future deployments
4. Review and update quarterly

