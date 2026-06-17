export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cloudName    = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return res.status(500).json({ error: 'Cloudinary not configured' });
  }

  try {
    const { imageBase64, folder } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    const formData = new FormData();
    formData.append('file', imageBase64);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder || 'autom8-listings');

    const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await r.json();

    if (!r.ok || data.error) {
      return res.status(502).json({ error: 'Cloudinary upload failed', detail: data.error?.message });
    }

    return res.status(200).json({
      url: data.secure_url,
      publicId: data.public_id,
    });

  } catch (err) {
    return res.status(500).json({ error: 'Upload failed', detail: err.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '15mb' } }
};
