const crypto = require('crypto');

// In-memory storage (for production, use a database like Vercel KV or Upstash Redis)
const activeLicenses = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature from WHOP
    const signature = req.headers['x-whop-signature'];
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;

    const body = JSON.stringify(req.body);
    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== computedSignature) {
      console.log('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { event, data } = req.body;

    // Handle membership activated (purchase)
    if (event === 'membership.activated') {
      const licenseKey = data.license_key;
      const membershipId = data.id;
      const userId = data.user_id;

      activeLicenses.set(licenseKey, {
        membershipId,
        userId,
        status: 'active',
        activatedAt: new Date().toISOString()
      });

      console.log(`License activated: ${licenseKey}`);
    }

    // Handle membership deactivated (cancelled/expired)
    if (event === 'membership.deactivated') {
      const licenseKey = data.license_key;

      activeLicenses.delete(licenseKey);
      console.log(`License deactivated: ${licenseKey}`);
    }

    // Handle cancellation (but still active until period end)
    if (event === 'membership.cancel_at_period_end_changed') {
      const licenseKey = data.license_key;

      if (data.cancel_at_period_end === true) {
        // Mark as pending cancellation but keep active
        const license = activeLicenses.get(licenseKey);
        if (license) {
          license.status = 'pending_cancellation';
          activeLicenses.set(licenseKey, license);
        }
        console.log(`License pending cancellation: ${licenseKey}`);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
