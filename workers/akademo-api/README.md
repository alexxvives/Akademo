# AKADEMO API Worker

Backend API for AKADEMO platform built with Hono and deployed on Cloudflare Workers.

## Features

- Authentication (login, register, email verification)
- Class management
- Student enrollment
- Live streaming with Zoom
- Video management with Bunny Stream
- Document storage with R2
- Notifications
- Analytics

## Development

```bash
npm run dev      # Start development server
npm run deploy   # Deploy to production
npm run tail     # View production logs
```

## Deployment

The API is deployed at: https://akademo-api.alexxvives.workers.dev

## Environment Variables

All secrets configured via Wrangler:
- BUNNY_STREAM_API_KEY
- BUNNY_STREAM_TOKEN_KEY
- ZOOM_ACCOUNT_ID
- ZOOM_CLIENT_ID
- ZOOM_CLIENT_SECRET
- ZOOM_WEBHOOK_SECRET
- RESEND_API_KEY