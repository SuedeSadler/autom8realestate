export default async function handler(req, res) {
  const { jobId } = req.query;
  if (!jobId) return res.status(400).json({ error: 'jobId required' });

  const kvUrl   = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) {
    return res.status(500).json({ error: 'KV store not configured' });
  }

  try {
    const r = await fetch(`${kvUrl}/get/${jobId}`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    const data = await r.json();

    if (data.result) {
      return res.status(200).json({ ready: true, flyerUrl: decodeURIComponent(data.result) });
    }
    return res.status(200).json({ ready: false });
  } catch(err) {
    return res.status(502).json({ error: 'Upstash read failed', detail: err.message });
  }
}