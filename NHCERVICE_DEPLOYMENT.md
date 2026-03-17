# nhcservice.in Deployment Fix - Profile Page Not Working

The profile page shows "Could not verify email" because the frontend cannot reach the backend API. nhcservice.in is hosted on **nginx** (not Netlify), so the `_redirects` proxy does not apply.

## Fix: Add API Proxy to Nginx

Add this to your nginx server block for nhcservice.in:

```nginx
location /api/ {
    proxy_pass https://cycle-harmony-v2.onrender.com/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

### Also Required: Update Render Backend CORS

Add nhcservice.in to your backend's allowed origins:

1. Go to [Render Dashboard](https://dashboard.render.com) → **cycle-harmony-v2** (or your backend service)
2. **Environment** → Edit `ALLOWED_ORIGINS`
3. Add `https://nhcservice.in,https://www.nhcservice.in` (include with existing values, comma-separated)
4. Save - Render will auto-redeploy

### Nginx Steps

1. SSH into your server
2. Edit nginx config: `sudo nano /etc/nginx/sites-available/nhcservice` (or your config path)
3. Inside the `server { ... }` block for nhcservice.in, add the `location /api/` block above **before** any `location /` block
4. Test config: `sudo nginx -t`
5. Reload nginx: `sudo systemctl reload nginx`

---

## Alternative: Build with Direct API URL

If you prefer the frontend to call the backend directly (no nginx proxy):

1. Build with the API URL:
   ```bash
   VITE_API_URL=https://cycle-harmony-v2.onrender.com/api npm run build
   ```

2. Add nhcservice.in to Render backend:
   - Go to [Render Dashboard](https://dashboard.render.com) → cycle-harmony-v2 service
   - Environment → Add/Edit `ALLOWED_ORIGINS`
   - Add: `https://nhcservice.in,https://www.nhcservice.in` (comma-separated with your other origins)

3. Deploy the new build to your server

---

## Update Your Deploy Script

Your current deploy (from text.txt):
```bash
git pull origin main && npm run build && sudo rm -rf /var/www/nhcservice/* && sudo cp -r dist/* /var/www/nhcservice/ && sudo systemctl reload nginx
```

**If using nginx proxy** (recommended - no rebuild needed):
- Just add the nginx `location /api/` block and reload nginx
- Your existing build will work

**If using direct API URL**:
```bash
git pull origin main && VITE_API_URL=https://cycle-harmony-v2.onrender.com/api npm run build && sudo rm -rf /var/www/nhcservice/* && sudo cp -r dist/* /var/www/nhcservice/ && sudo systemctl reload nginx
```
