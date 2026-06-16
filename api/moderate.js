export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiUser   = process.env.SIGHTENGINE_API_USER;
  const apiSecret = process.env.SIGHTENGINE_API_SECRET;

  if (!apiUser || !apiSecret) {
    return res.status(500).json({ error: 'Sightengine credentials not set' });
  }

  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    // Convert base64 data URI to a Blob-compatible buffer for multipart upload
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const mimeMatch  = imageBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType   = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const buffer     = Buffer.from(base64Data, 'base64');

    // Build multipart form — Sightengine accepts raw image upload
    const boundary = '----SightEngineBoundary' + Date.now();
    const CRLF = '\r\n';

    const metaPart =
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="api_user"${CRLF}${CRLF}${apiUser}${CRLF}` +
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="api_secret"${CRLF}${CRLF}${apiSecret}${CRLF}` +
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="models"${CRLF}${CRLF}nudity,violence,offensive${CRLF}` +
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="media"; filename="upload.jpg"${CRLF}` +
      `Content-Type: ${mimeType}${CRLF}${CRLF}`;

    const closePart = `${CRLF}--${boundary}--${CRLF}`;

    const metaBuf  = Buffer.from(metaPart, 'utf-8');
    const closeBuf = Buffer.from(closePart, 'utf-8');
    const body     = Buffer.concat([metaBuf, buffer, closeBuf]);

    const seRes = await fetch('https://api.sightengine.com/1.0/check.json', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
      body,
    });

    const data = await seRes.json();

    if (data.status !== 'success') {
      console.error('Sightengine error:', data);
      return res.status(502).json({ error: 'Sightengine error', detail: data.error?.message });
    }

    const flags = [];

    // Nudity — raw score 0-1, reject above 0.5
    const nudityScore = data.nudity?.raw ?? 0;
    if (nudityScore > 0.5) flags.push(`nudity (${Math.round(nudityScore * 100)}%)`);

    // Violence — reject above 0.5
    const violenceScore = data.violence?.prob ?? 0;
    if (violenceScore > 0.5) flags.push(`violence (${Math.round(violenceScore * 100)}%)`);

    // Offensive — reject above 0.5
    const offensiveScore = data.offensive?.prob ?? 0;
    if (offensiveScore > 0.5) flags.push(`offensive content (${Math.round(offensiveScore * 100)}%)`);

    if (flags.length > 0) {
      return res.status(200).json({
        safe: false,
        reason: `Image flagged for: ${flags.join(', ')}`,
        scores: { nudityScore, violenceScore, offensiveScore },
      });
    }

    return res.status(200).json({ safe: true });

  } catch (err) {
    console.error('Moderation error:', err);
    // Fail open — if moderation is down, don't block the user
    return res.status(200).json({ safe: true, warning: 'Moderation check failed, proceeding' });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } }
};
