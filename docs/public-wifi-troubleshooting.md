# Public WiFi Accessibility Troubleshooting

## Issue
Website not accessible on some public WiFi networks while working fine on other connections.

## Common Causes & Solutions

### 1. **DNS Blocking**
Many public WiFi networks (schools, hotels, cafes) use DNS filtering to block certain domains.

**Solution:**
- User can try changing DNS settings to:
  - Google DNS: `8.8.8.8` / `8.8.4.4`
  - Cloudflare DNS: `1.1.1.1` / `1.0.0.1`
- On mobile: Use private DNS (Android) or DNS configuration (iOS)

### 2. **Firewall/Content Filtering**
Corporate or institutional networks often block:
- Cloudflare Workers domains (`*.workers.dev`)
- Custom domains hosted on Cloudflare
- Certain ports or protocols

**Symptoms:**
- Main domain (`akademo-edu.com`) may load but API calls fail
- API endpoint (`akademo-api.alexxvives.workers.dev`) blocked

**Solution:**
- Contact network administrator to whitelist domains
- Use VPN to bypass network restrictions
- Mobile hotspot as alternative connection

### 3. **SSL/TLS Certificate Issues**
Some networks perform SSL inspection which can cause certificate errors.

**Solution:**
- Check if network requires certificate trust
- Verify browser doesn't show certificate warnings
- Try different browser (some handle proxied connections better)

### 4. **Port Restrictions**
Public WiFi may block non-standard ports or restrict HTTPS traffic.

**Verification:**
```bash
# Test if domain is reachable
ping akademo-edu.com

# Test HTTPS connectivity
curl -I https://akademo-edu.com
curl -I https://akademo-api.alexxvives.workers.dev
```

### 5. **Geographic Restrictions**
Some Cloudflare features may have regional limitations.

**Check:**
- Test from different geographic location
- Verify Cloudflare's service status: https://www.cloudflarestatus.com

## User Workarounds

### Immediate Solutions:
1. **Use mobile data** instead of public WiFi
2. **Use VPN** to bypass network restrictions:
   - Free: ProtonVPN, Windscribe
   - Paid: NordVPN, ExpressVPN
3. **Try different browser** (Chrome, Firefox, Safari, Edge)
4. **Clear browser cache** and cookies
5. **Disable browser extensions** that might interfere

### For Network Administrators:
Whitelist these domains:
- `akademo-edu.com`
- `akademo-api.alexxvives.workers.dev`
- `*.cloudflare.com` (for CDN assets)
- `*.bunnycdn.com` (for video streaming)

## Technical Diagnosis

### User-Side Testing:
```bash
# Test DNS resolution
nslookup akademo-edu.com
nslookup akademo-api.alexxvives.workers.dev

# Test connectivity
traceroute akademo-edu.com
curl -v https://akademo-edu.com

# Check browser console for errors
# Open DevTools (F12) → Console tab → Look for:
# - ERR_NAME_NOT_RESOLVED
# - ERR_CONNECTION_REFUSED
# - ERR_SSL_PROTOCOL_ERROR
```

### Developer Diagnosis:
```bash
# Check Cloudflare Analytics for blocked requests
# Dashboard → Analytics → Security

# Verify all endpoints are accessible
curl https://akademo-api.alexxvives.workers.dev
curl https://akademo-edu.com

# Check DNS propagation
dig akademo-edu.com
dig akademo-api.alexxvives.workers.dev
```

## Platform-Side Mitigations

### Current Setup:
✅ Cloudflare CDN (global distribution)  
✅ HTTPS with valid SSL certificate  
✅ Domain name (akademo-edu.com) vs IP address  
✅ Workers deployed to multiple edge locations  

### Potential Improvements:
1. **Fallback API Domain**: Add `api.akademo-edu.com` as alternative to `*.workers.dev`
2. **Local Storage Caching**: Cache API responses for offline access
3. **Service Worker**: Implement progressive web app (PWA) for offline functionality
4. **Multiple CDN Providers**: Add fallback to AWS CloudFront or Fastly
5. **Status Page**: Create public status page showing service availability

## Reporting Issues

If you encounter accessibility problems:
1. Note the network name/location
2. Screenshot any error messages
3. Check browser console for specific errors
4. Try alternative connection (mobile data)
5. Report to support with details above

## References

- [Cloudflare Network Status](https://www.cloudflarestatus.com)
- [DNS Configuration Guide](https://developers.cloudflare.com/1.1.1.1/setup/)
- [Browser DevTools](https://developer.chrome.com/docs/devtools/)

---

**Last Updated**: January 31, 2026  
**Maintainer**: AKADEMO Development Team
