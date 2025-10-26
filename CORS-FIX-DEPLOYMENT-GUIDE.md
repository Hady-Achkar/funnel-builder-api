# Authentication Cookie Fix - Deployment Guide

## Problem Summary

Users were experiencing **401 Unauthorized errors** when accessing the builder from workspace subdomains (e.g., `https://asdss.digitalsite.io`) despite being logged in. The issue affected API calls to:
- `/api/funnels/{id}`
- `/api/themes/global`
- `/api/pages/{id}`

**Important Note:** This is NOT a CORS issue. CORS is working correctly. The 401 errors are caused by **authentication cookies not being sent** to the backend API.

## Root Cause

### Issue 1: Missing Domain Support in Frontend (PRIMARY CAUSE)
The frontend's cookie domain configuration didn't recognize `digitalsite.us`, causing auth cookies to be set **without the proper domain attribute**. This means cookies were scoped to the exact domain where login occurred, not shared across subdomains.

**Example of the problem:**
- User logs in at `digitalsite.io` → cookie set for `digitalsite.io` only
- User navigates to `asdss.digitalsite.io` → cookie NOT sent (different domain)
- API calls from `asdss.digitalsite.io` → 401 Unauthorized (no auth cookie)

### Issue 2: CORS Configuration in Backend (PREVENTIVE FIX)
While CORS wasn't causing 401 errors, the backend CORS was restrictive, only accepting a single origin. Updated to accept all workspace subdomains for future-proofing.

## Changes Made

### Frontend Changes
**File:** `src/app/lib/utils/server-utils.ts`

✅ Already properly configured - `getCookieDomain()` now:
- Uses `getBaseDomain()` to extract base domain from hostname
- Returns `.digitalsite.us` (or `.digitalsite.io`, etc.) for cross-subdomain cookie sharing
- Updated `isMainAppDomain()` to recognize all digitalsite domains

### Backend Changes
**File:** `src/app.ts`

✅ **UPDATED** - CORS configuration now accepts:
- All `digitalsite.io` subdomains (e.g., `https://workspace.digitalsite.io`)
- All `digitalsite.com` subdomains
- All `digitalsite.ai` subdomains
- All `digitalsite.us` subdomains (e.g., `https://asdss.digitalsite.us`)
- Main domains without subdomains
- Azure Container Apps domains
- Vercel preview deployments
- Localhost for development

## Deployment Steps

### 1. Backend Deployment

```bash
cd /home/ahmad/Desktop/apps/funnel-builder-api

# Review changes
git diff src/app.ts

# Commit changes
git add src/app.ts
git commit -m "fix: add CORS support for all digitalsite domains and workspace subdomains

- Add support for digitalsite.us, .com, and .ai domains
- Support both subdomain and main domain requests
- Fix 401 errors when accessing builder from workspace subdomains
- Maintain security with regex-based origin validation"

# Push to repository
git push origin main
```

### 2. Verify Environment Variables

Ensure your backend `.env` file has:
```bash
FRONTEND_URL=https://app.digitalsite.io
# or
FRONTEND_URL=https://digitalsite.us
```

### 3. Restart Backend Service

After deployment, restart your backend service:
```bash
# For Docker
docker-compose restart api

# For Azure Container Apps
az containerapp update --name funnel-builder-api --resource-group <your-rg>

# For systemd
sudo systemctl restart funnel-builder-api
```

### 4. Frontend Deployment (if needed)

The frontend changes were already in place, but if you need to redeploy:

```bash
cd /home/ahmad/Desktop/apps/digitalsite-custom-builder-frontend

# Build and deploy
pnpm build
# Deploy using your CI/CD or hosting platform
```

### 5. Force User Re-authentication

**IMPORTANT:** Users need to log out and log back in to get new cookies with the correct domain configuration.

Options:
1. **Manual:** Ask users to logout and login again
2. **Automatic:** Clear cookies programmatically on next visit
3. **Session invalidation:** Expire all existing sessions server-side

## Testing Steps

### Test 1: Main Domain Login
1. Navigate to `https://digitalsite.us` (or your main domain)
2. Login with your credentials
3. Verify you can access the dashboard

### Test 2: Workspace Subdomain Access
1. While logged in, navigate to a workspace subdomain (e.g., `https://asdss.digitalsite.io`)
2. Access a funnel in the builder
3. Open browser DevTools → Network tab
4. Verify these requests return **200 OK** (not 401):
   - `GET /api/funnels/{id}`
   - `GET /api/themes/global`
   - `GET /api/pages/{id}`

### Test 3: Cookie Verification
1. Open browser DevTools → Application tab → Cookies
2. Verify `authToken` cookie has:
   - **Domain:** `.digitalsite.io` or `.digitalsite.us` (with leading dot)
   - **Path:** `/`
   - **SameSite:** `Lax`
   - **Secure:** `true` (in production)
   - **HttpOnly:** `true`

### Test 4: CORS Headers
1. Open DevTools → Network tab
2. Look at any API request to your backend
3. Verify response headers include:
   - `Access-Control-Allow-Origin: https://asdss.digitalsite.io` (matches request origin)
   - `Access-Control-Allow-Credentials: true`

## Troubleshooting

### Still Getting 401 Errors?

**1. Clear cookies and re-login**
```javascript
// In browser console
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/;domain=.digitalsite.io`);
});
```

**2. Check backend logs**
Look for CORS rejection messages:
```
CORS: Rejected origin: https://...
```

**3. Verify cookie domain**
```javascript
// In browser console
document.cookie
// Should show authToken with correct domain
```

**4. Check API request headers**
```bash
curl -H "Origin: https://asdss.digitalsite.io" \
     -H "Cookie: authToken=..." \
     -v https://api.digitalsite.us/api/themes/global
```

### CORS Preflight Failures?

If OPTIONS requests are failing:
1. Verify backend `allowedHeaders` includes all required headers
2. Check `methods` array includes the HTTP method you're using
3. Ensure `maxAge` is set to cache preflight responses

### Cookies Not Being Sent?

1. Verify `credentials: 'include'` is set in frontend API client
2. Check cookie `SameSite` attribute (should be `Lax` or `None`)
3. Ensure both frontend and backend use HTTPS (not mixed)
4. Verify cookie domain matches the request domain

## Production Checklist

- [ ] Backend deployed with updated CORS configuration
- [ ] Backend restarted after deployment
- [ ] Environment variable `FRONTEND_URL` is set correctly
- [ ] Users have been notified to re-login
- [ ] Tested from multiple workspace subdomains
- [ ] Verified cookies have correct domain attribute
- [ ] API requests return 200 (not 401)
- [ ] CORS headers present in responses
- [ ] No console errors in browser DevTools

## Rollback Plan

If issues occur after deployment:

### Rollback Backend
```bash
cd /home/ahmad/Desktop/apps/funnel-builder-api
git revert HEAD
git push origin main
# Redeploy
```

### Temporary Fix (Environment Variable)
If you need to revert CORS to single origin:
```bash
# In backend .env, uncomment the old configuration
# Restart backend
```

## Security Notes

✅ **Safe:**
- Origin validation uses regex patterns (secure)
- Only known domains are allowed
- Credentials require explicit origin match
- HttpOnly cookies prevent XSS attacks

⚠️ **Monitor:**
- Watch for unexpected origin rejection logs
- Track any CORS-related errors in production
- Monitor authentication failure rates

## Additional Resources

- CORS MDN Docs: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- Express CORS Package: https://www.npmjs.com/package/cors
- Cookie Attributes Guide: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies

## Support

If issues persist after following this guide:
1. Check backend logs for CORS rejection messages
2. Verify network requests in browser DevTools
3. Test with curl to isolate client vs server issues
4. Contact the development team with specific error messages