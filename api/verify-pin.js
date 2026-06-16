export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin) {
    return res.status(500).json({ error: 'ADMIN_PIN not configured' });
  }

  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ error: 'No PIN provided' });
  }

  if (pin === adminPin) {
    return res.status(200).json({ valid: true });
  }

  return res.status(200).json({ valid: false });
}
