import { io } from 'socket.io-client';

const HOST = 'http://127.0.0.1:5000';
const testEmail = `inspector.engines.${Math.floor(Math.random() * 10000)}@healos.ai`;
const testPin = '4321';
let userToken = null;

async function runEngineTests() {
  console.log('======================================================');
  console.log('   AETHERIS OS - 6 AI ENGINES INTEGRATION TEST');
  console.log('======================================================\n');

  try {
    console.log('[Auth] Registering and authenticating for token...');
    const regResponse = await fetch(`${HOST}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Strategy Officer',
        email: testEmail,
        specialty: 'Strategy & Ops',
        pin: testPin
      })
    });
    
    const loginResponse = await fetch(`${HOST}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, pin: testPin })
    });
    const loginData = await loginResponse.json();
    userToken = loginData.user.token;
    console.log(' ✅ Token acquired.\n');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    };

    // 1. Strategy Engine
    console.log('[Test 1/6] Strategy Engine...');
    const strategyRes = await fetch(`${HOST}/api/engines/strategy`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        productName: 'HealOS SaaS',
        industry: 'Healthcare IT',
        targetAudience: 'Hospital CIOs'
      })
    });
    const strategyData = await strategyRes.json();
    if (!strategyRes.ok) throw new Error(strategyData.error);
    console.log(' ✅ Strategy Engine Success!');
    console.log(`    - Keys: ${Object.keys(strategyData.result).join(', ')}\n`);

    // 2. Marketing Engine
    console.log('[Test 2/6] Marketing Engine...');
    const marketingRes = await fetch(`${HOST}/api/engines/marketing`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        productName: 'HealOS SaaS',
        industry: 'Healthcare IT',
        budget: 15000
      })
    });
    const marketingData = await marketingRes.json();
    if (!marketingRes.ok) throw new Error(marketingData.error);
    console.log(' ✅ Marketing Engine Success!');
    console.log(`    - Keys: ${Object.keys(marketingData.result).join(', ')}\n`);

    // 3. Lead Gen Engine
    console.log('[Test 3/6] Lead Gen Engine...');
    const leadGenRes = await fetch(`${HOST}/api/engines/lead-gen`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        productName: 'HealOS SaaS',
        targetAudience: 'Hospital CIOs'
      })
    });
    const leadGenData = await leadGenRes.json();
    if (!leadGenRes.ok) throw new Error(leadGenData.error);
    console.log(' ✅ Lead Gen Engine Success!');
    console.log(`    - Keys: ${Object.keys(leadGenData.result).join(', ')}\n`);

    // 4. Sales Engine
    console.log('[Test 4/6] Sales Engine...');
    const salesRes = await fetch(`${HOST}/api/engines/sales`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        productName: 'HealOS SaaS',
        averageDealSize: '$50,000'
      })
    });
    const salesData = await salesRes.json();
    if (!salesRes.ok) throw new Error(salesData.error);
    console.log(' ✅ Sales Engine Success!');
    console.log(`    - Keys: ${Object.keys(salesData.result).join(', ')}\n`);

    // 5. Analytics Engine
    console.log('[Test 5/6] Analytics Engine...');
    const analyticsRes = await fetch(`${HOST}/api/engines/analytics`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        industry: 'Healthcare IT',
        competitors: ['Epic', 'Cerner']
      })
    });
    const analyticsData = await analyticsRes.json();
    if (!analyticsRes.ok) throw new Error(analyticsData.error);
    console.log(' ✅ Analytics Engine Success!');
    console.log(`    - Keys: ${Object.keys(analyticsData.result).join(', ')}\n`);

    // 6. Customer Success Engine
    console.log('[Test 6/6] Customer Success Engine...');
    const csRes = await fetch(`${HOST}/api/engines/customer-success`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        productName: 'HealOS SaaS'
      })
    });
    const csData = await csRes.json();
    if (!csRes.ok) throw new Error(csData.error);
    console.log(' ✅ Customer Success Engine Success!');
    console.log(`    - Keys: ${Object.keys(csData.result).join(', ')}\n`);

    console.log('======================================================');
    console.log('   ALL 6 AI ENGINES INTEGRATED SUCCESSFULLY');
    console.log('======================================================');

  } catch (error) {
    console.error('\n ❌ Engine Integration test failed:', error.message);
  }
}

runEngineTests();
