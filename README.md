# Listing Launcher — Vercel Deploy

## File structure
```
listing-launcher/
├── api/
│   └── trigger.js      ← serverless function (proxies to n8n)
├── public/
│   └── index.html      ← the UI
├── vercel.json         ← routing config
└── README.md
```

## Deploy steps

1. Push this folder to a GitHub repo
2. Import the repo in vercel.com → Add New Project
3. In Project Settings → Environment Variables, add:
   - Key:   N8N_WEBHOOK_URL
   - Value: https://your-n8n.app/webhook/your-webhook-id
4. Deploy — done

## How it works

The browser calls `/api/trigger?LISTING_NAME=...&PRICE=...` (your own domain, no CORS issue).
The serverless function reads `N8N_WEBHOOK_URL` from the environment and forwards the request to n8n.
Your webhook URL is never exposed to the client.

## n8n side

In your Map Placeholders code node, access fields via:
  $json.query.LISTING_NAME
  $json.query.PRICE
  $json.query.BEDROOMS
  etc.
