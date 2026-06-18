export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const kvUrl   = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) {
    return res.status(500).json({ error: 'KV store not configured' });
  }

  const { jobId, flyerUrl } = req.body;
  if (!jobId || !flyerUrl) {
    return res.status(400).json({ error: 'jobId and flyerUrl required' });
  }

  try {
    // Upstash REST SET command: POST /pipeline with array of commands
    const r = await fetch(`${kvUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['SET', jobId, flyerUrl],
        ['EXPIRE', jobId, 3600],
      ]),
    });
    const data = await r.json();
    console.log('KV set result:', JSON.stringify(data));
    return res.status(200).json({ ok: true, data });
  } catch(err) {
    return res.status(502).json({ error: 'Upstash write failed', detail: err.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } }
};