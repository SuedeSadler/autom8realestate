export default async function handler(req, res) {
  const { jobId } = req.query;
  if (!jobId) return res.status(400).json({ error: 'jobId required' });

  const kvUrl   = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) {
    return res.status(500).json({ error: 'KV store not configured' });
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    const r = await fetch(`${kvUrl}/get/${jobId}`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    const data = await r.json();

    console.log('KV get result for', jobId, ':', JSON.stringify(data));

    // data.result is the plain URL string stored by complete.js
    if (data.result && typeof data.result === 'string') {
      // strip leading = if n8n sent the expression prefix
      const flyerUrl = data.result.startsWith('=') ? data.result.slice(1) : data.result;
      if (flyerUrl.startsWith('http')) {
        return res.status(200).json({ ready: true, flyerUrl });
      }
    }

    return res.status(200).json({ ready: false });
  } catch(err) {
    return res.status(502).json({ error: 'Upstash read failed', detail: err.message });
  }
}