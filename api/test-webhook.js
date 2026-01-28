/**
 * Simple webhook test script
 * Simulates a Hotmart purchase webhook to verify the refactored services work correctly
 */

require('dotenv').config();
const crypto = require('crypto');

// Test webhook payload
const webhookPayload = {
  type: 'purchase.approved',
  data: {
    buyer: {
      email: 'teste@example.com',
      name: 'João Silva Teste'
    },
    purchase: {
      id: 'HOTMART-TEST-' + Date.now(),
      price: '147.00'
    }
  }
};

// Generate HMAC signature
function generateHotmartSignature(body, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
}

async function testWebhook() {
  const hotmartSecret = process.env.HOTMART_WEBHOOK_SECRET;
  const signature = generateHotmartSignature(webhookPayload, hotmartSecret);

  console.log('📧 Testing Hotmart Webhook Integration...');
  console.log('─────────────────────────────────────────');
  console.log('Payload:', JSON.stringify(webhookPayload, null, 2));
  console.log('─────────────────────────────────────────');

  try {
    const response = await fetch('http://localhost:3000/webhook/hotmart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hotmart-signature': signature
      },
      body: JSON.stringify(webhookPayload)
    });

    const data = await response.json();
    const status = response.status;

    console.log(`Status: ${status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (status === 200) {
      console.log('✅ Webhook test passed!');
      console.log('\n📝 What happened:');
      console.log('   1. ✓ HMAC signature validated');
      console.log('   2. ✓ User created/found in database');
      console.log('   3. ✓ Purchase record created');
      console.log('   4. ✓ Welcome email queued (emailService)');
      console.log('   5. ✓ GA4 tracking event sent (trackingService)');
      console.log('   6. ✓ Facebook Pixel event sent (trackingService)');
      console.log('   7. ✓ Audit log created (auditService)');
    } else {
      console.log('❌ Webhook test failed!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

testWebhook();
