export default async function handler(req, res) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    return res.status(500).json({ error: 'N8N_WEBHOOK_URL environment variable is not set' });
  }

  // Block demo data from ever hitting the real API
  if (req.query.SOURCE === 'demo') {
    return res.status(403).json({ error: 'Demo submissions do not trigger real renders.' });
  }

  // Check server-side usage count via a simple header the client sends
  // Real limiting is in the browser via localStorage — this is a backstop
  const usageCount = parseInt(req.headers['x-usage-count'] || '0', 10);
  if (usageCount >= 2) {
    return res.status(429).json({ error: 'Render limit reached', limit: 2 });
  }

  const params = new URLSearchParams(req.query);
  const url = `${webhookUrl}?${params.toString()}`;

  try {
    const n8nRes = await fetch(url, { method: 'GET' });
    const text = await n8nRes.text();
    res.status(n8nRes.status).send(text);
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach n8n webhook', detail: err.message });
  }
}