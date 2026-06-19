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
    // Use simple GET-style SET command: /set/key/value/ex/seconds
    const encodedUrl = encodeURIComponent(flyerUrl);
    const r = await fetch(`${kvUrl}/set/${jobId}/${encodedUrl}/ex/3600`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    const data = await r.json();
    console.log('KV set result:', JSON.stringify(data));

    // Verify it was stored
    const check = await fetch(`${kvUrl}/get/${jobId}`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    const checkData = await check.json();
    console.log('KV verify read:', JSON.stringify(checkData));

    return res.status(200).json({ ok: true, data, verified: checkData.result !== null });
  } catch(err) {
    return res.status(502).json({ error: 'Upstash write failed', detail: err.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } }
};