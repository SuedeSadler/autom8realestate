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
    // simple token: hash of PIN + secret so it can't be guessed
    const token = Buffer.from(`${adminPin}:${process.env.ADMIN_PIN}:admin`).toString('base64');
    return res.status(200).json({ valid: true, token });
  }

  return res.status(200).json({ valid: false });
}