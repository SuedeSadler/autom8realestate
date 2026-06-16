export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const kvUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!kvUrl || !kvToken) {
    return res.status(500).json({ error: 'Upstash not configured' });
  }

  const { jobId, flyerUrl } = req.body;
  if (!jobId || !flyerUrl) {
    return res.status(400).json({ error: 'jobId and flyerUrl required' });
  }

  try {
    // Upstash REST: SET key value EX seconds
    const r = await fetch(`${kvUrl}/set/${jobId}/${encodeURIComponent(flyerUrl)}/ex/3600`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    const data = await r.json();
    return res.status(200).json({ ok: true, data });
  } catch(err) {
    return res.status(502).json({ error: 'Upstash write failed', detail: err.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } }
};
