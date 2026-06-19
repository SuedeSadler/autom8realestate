export default async function handler(req, res) {
  const kvUrl   = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) {
    return res.status(500).json({ error: 'KV not configured', kvUrl: !!kvUrl, kvToken: !!kvToken });
  }

  const testKey = 'kv_test_key';
  const testVal = 'https://hcti.io/v1/image/test-123';

  try {
    // Write
    const writeRes = await fetch(`${kvUrl}/set/${testKey}/${encodeURIComponent(testVal)}/ex/300`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    const writeData = await writeRes.json();

    // Read back immediately
    const readRes = await fetch(`${kvUrl}/get/${testKey}`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    const readData = await readRes.json();

    return res.status(200).json({
      kvUrl: kvUrl.substring(0, 40) + '...',
      write: writeData,
      read: readData,
      match: decodeURIComponent(readData.result || '') === testVal
    });
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
