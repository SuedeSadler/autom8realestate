# Autom8 Real Estate — Listing Automation Demo

A full-stack automation demo that launches a real estate listing campaign in one click. Fill in a property listing, hit launch, and the system automatically generates a listing flyer, emails the vendor, posts to Facebook, sends the agent an SMS, and updates a CRM — all at once.

---

## How it works

1. User fills in the listing form on the web page
2. On submit, the form fires a webhook to an n8n automation workflow
3. n8n orchestrates all downstream actions in parallel
4. A listing flyer is generated via htmlcsstoimage and stored
5. The flyer URL is sent back to the web page via a polling system
6. The flyer appears in the success card on the page in real time

### Demo mode
Clicking **Quick fill** populates the form with pre-filled demo data. The full workflow still fires in n8n — including emails and social posting — but the flyer step uses a pre-generated image stored in Cloudinary rather than calling the htmlcsstoimage API. This preserves the monthly render quota.

### Render limit
Real submissions (custom listings) are limited to **2 flyer renders per session** to manage the htmlcsstoimage free tier quota. An admin PIN can be entered to bypass this limit for testing.

---

## Tech stack

### Frontend
- **Plain HTML / CSS / JavaScript** — no framework
- **Tabler Icons** — icon set via CDN
- Hosted as a static file on **Vercel**

### Backend (Vercel Serverless Functions)
| File | Purpose |
|------|---------|
| `api/trigger.js` | Receives form submission, generates a unique job ID, forwards to n8n webhook |
| `api/verify-pin.js` | Validates admin PIN server-side — PIN never exposed to client |
| `api/moderate.js` | Runs uploaded images through Sightengine before upload |
| `api/upload-image.js` | Uploads property and agent photos to Cloudinary |
| `api/complete.js` | Receives flyer URL from n8n and stores it in Upstash Redis |
| `api/status.js` | Polled by the browser every 2 seconds to check if the flyer is ready |
| `api/send-flyer.js` | Sends the generated flyer to a user-supplied email via Resend |
| `api/kv-test.js` | Dev utility to verify Upstash read/write is working |

### Automation
- **n8n** — self-hosted workflow orchestration
- Webhook trigger → Map Placeholders → IF (demo vs real) → parallel actions

### Storage & Infrastructure
- **Vercel** — hosting and serverless functions
- **Upstash Redis** (via Vercel KV) — temporary key-value store for job polling
- **Cloudinary** — image storage and delivery (property photos, agent photos, pre-generated demo flyer)

---

## Connected APIs

| Service | Purpose | Notes |
|---------|---------|-------|
| **n8n** | Workflow automation engine | Self-hosted, triggered via webhook |
| **htmlcsstoimage (hcti)** | Generates listing flyer from HTML template | 50 renders/month on free tier |
| **Cloudinary** | Image hosting and delivery | Unsigned upload preset required |
| **Sightengine** | Image moderation — detects nudity, violence, offensive content | 500 checks/month free |
| **Resend** | Transactional email — sends flyer copy to user | Requires verified sending domain |
| **Gmail** (via n8n) | Sends vendor notification email | Connected via n8n OAuth2 credential |
| **Facebook Graph API** (via n8n) | Posts listing to Facebook page | Requires page access token |
| **Twilio** (via n8n) | Sends agent SMS notification | Requires Twilio phone number |
| **Monday.com** (via n8n) | Updates listing status to Campaign Active | Optional — can be removed if not used |

---

## Environment variables

Set these in Vercel → Project Settings → Environment Variables:

```
N8N_WEBHOOK_URL               # Your n8n production webhook URL
ADMIN_PIN                     # PIN for bypassing render limits during testing
CLOUDINARY_CLOUD_NAME         # Your Cloudinary cloud name
CLOUDINARY_UPLOAD_PRESET      # Unsigned upload preset name
SIGHTENGINE_API_USER          # Sightengine API user
SIGHTENGINE_API_SECRET        # Sightengine API secret
RESEND_API_KEY                # Resend API key
KV_REST_API_URL               # Auto-added by Vercel when Upstash is connected
KV_REST_API_TOKEN             # Auto-added by Vercel when Upstash is connected
```

---

## Project structure

```
listing-launcher/
├── api/
│   ├── trigger.js            # Webhook proxy + job ID generation
│   ├── verify-pin.js         # Server-side PIN validation
│   ├── moderate.js           # Sightengine image moderation
│   ├── upload-image.js       # Cloudinary image upload proxy
│   ├── complete.js           # Stores flyer URL in Upstash on n8n callback
│   ├── status.js             # Browser polling endpoint
│   ├── send-flyer.js         # Resend email sender
│   └── kv-test.js            # Upstash connectivity test
├── public/
│   └── index.html            # Full frontend — form, canvas, workflow animation
├── vercel.json               # Routing config
└── README.md
```

---

## n8n workflow

```
Webhook
  └── Map Placeholders (code node)
        └── IF (IS_DEMO = true?)
              ├── TRUE  → HTTP Request (POST /api/complete with pre-saved flyer URL)
              └── FALSE → Build Flyer HTML (code node)
                            └── HTTP Request (POST hcti.io → generate flyer)
                                  └── HTTP Request (POST /api/complete with flyer URL)
```

Additional parallel branches from Map Placeholders (not shown above):
- Gmail node → vendor email
- Facebook Graph API node → social post
- Twilio node → agent SMS
- Monday.com node → status update

---

## How the flyer polling works

1. Browser submits form → `/api/trigger` generates `job_xxx_yyy` and passes it to n8n
2. Browser polls `/api/status?jobId=job_xxx_yyy&t={timestamp}` every 2 seconds
3. n8n completes the flyer, calls `POST /api/complete` with `{ jobId, flyerUrl }`
4. `/api/complete` stores `flyerUrl` in Upstash Redis under the `jobId` key (1 hour TTL)
5. Next poll from the browser finds the URL → returns `{ ready: true, flyerUrl }`
6. Browser displays the flyer image in the success card

---

## Local development

This project is designed to run on Vercel. For local testing:

1. Install [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
2. Run `vercel env pull` to pull environment variables
3. Run `vercel dev` to start the local dev server
4. The page will be available at `http://localhost:3000`

Note: n8n webhook callbacks to `/api/complete` won't work locally unless you expose your local server via a tunnel (e.g. ngrok).