export default async function handler(req, res) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    return res.status(500).json({ error: 'N8N_WEBHOOK_URL not set' });
  }

  const isDemo      = req.query.SOURCE === 'demo';
  const adminToken  = req.headers['x-admin-token'];

  // Validate admin token if present
  const expectedToken = adminToken
    ? Buffer.from(`${process.env.ADMIN_PIN}:${process.env.ADMIN_PIN}:admin`).toString('base64')
    : null;
  const isAdmin = adminToken && adminToken === expectedToken;

  // Apply render limit only to real, non-admin submissions
  if (!isDemo && !isAdmin) {
    const usageCount = parseInt(req.headers['x-usage-count'] || '0', 10);
    if (usageCount >= 2) {
      return res.status(429).json({ error: 'Render limit reached', limit: 2 });
    }
  }

  const jobId  = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const params = new URLSearchParams({ ...req.query, JOB_ID: jobId });
  const url    = `${webhookUrl}?${params.toString()}`;

  try {
    const n8nRes = await fetch(url, { method: 'GET' });
    const text   = await n8nRes.text();
    res.status(n8nRes.status).json({ ok: n8nRes.ok, jobId });
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach n8n webhook', detail: err.message });
  }
}