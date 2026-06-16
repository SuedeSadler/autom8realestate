export default async function handler(req, res) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    return res.status(500).json({ error: 'N8N_WEBHOOK_URL environment variable is not set' });
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
