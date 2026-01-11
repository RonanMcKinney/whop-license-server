import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Enable CORS for the indicator to call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { license_key } = req.body;

    if (!license_key) {
      return res.status(400).json({ valid: false, error: 'No license key provided' });
    }

    // Check KV database for license
    const license = await kv.get(`license:${license_key}`);

    if (!license) {
      return res.status(200).json({ 
        valid: false, 
        message: 'License key not found or inactive' 
      });
    }

    if (license.status === 'active' || license.status === 'pending_cancellation') {
      return res.status(200).json({ 
        valid: true,
        status: license.status
      });
    }

    return res.status(200).json({ 
      valid: false,
      message: 'License is not active'
    });

  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({ valid: false, error: 'Internal server error' });
  }
}
