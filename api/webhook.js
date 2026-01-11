import { kv } from '@vercel/kv';
const crypto = require('crypto');

// YOUR PAID PRODUCT IDs
const PAID_PRODUCT_IDS = [
  'prod_1vgh0MwjNAYGN',  // Your paid product
  // Add more product IDs here if you have multiple paid tiers
];

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
      const productId = data.product_id;
      const planId = data.plan_id;

      // CHECK IF THIS IS A PAID PRODUCT
      const isPaidProduct = PAID_PRODUCT_IDS.includes(productId);

      if (!isPaidProduct) {
        console.log(`Ignoring free tier purchase: ${licenseKey} (product: ${productId})`);
        return res.status(200).json({ 
          success: true, 
          message: 'Free tier membership - not activated' 
        });
      }

      // Store in KV database (only paid products)
      await kv.set(`license:${licenseKey}`, {
        membershipId,
        userId,
        productId,
        planId,
        status: 'active',
        activatedAt: new Date().toISOString()
      });

      console.log(`License activated: ${licenseKey} (product: ${productId})`);
    }

    // Handle membership deactivated (cancelled/expired)
    if (event === 'membership.deactivated') {
      const licenseKey = data.license_key;

      // Delete from KV database
      await kv.del(`license:${licenseKey}`);
      console.log(`License deactivated: ${licenseKey}`);
    }

    // Handle cancellation (but still active until period end)
    if (event === 'membership.cancel_at_period_end_changed') {
      const licenseKey = data.license_key;

      if (data.cancel_at_period_end === true) {
        // Update status in KV database
        const license = await kv.get(`license:${licenseKey}`);
        if (license) {
          license.status = 'pending_cancellation';
          await kv.set(`license:${licenseKey}`, license);
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
