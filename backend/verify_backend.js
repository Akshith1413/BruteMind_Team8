import { io } from 'socket.io-client';

const HOST = 'http://127.0.0.1:5000';
const testEmail = `inspector.clinician.${Math.floor(Math.random() * 10000)}@healos.ai`;
const testPin = '4321';
let userToken = null;
let campaignId = null;

async function runTests() {
  console.log('======================================================');
  // Dynamic header block
  console.log('   AETHERIS OS / HEALOS - CORE BACKEND INTEGRATION TEST');
  console.log('======================================================\n');

  try {
    // ----------------------------------------------------
    // TEST 1: Clinical Auth Gateway
    // ----------------------------------------------------
    console.log('[Test 1/5] Testing Clinician Authentication Gateway...');
    console.log(` -> Registering clinician profile: ${testEmail}...`);
    
    const regResponse = await fetch(`${HOST}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Chief Diagnostics Officer',
        email: testEmail,
        specialty: 'Immunology Research',
        pin: testPin
      })
    });

    const regData = await regResponse.json();
    if (!regResponse.ok) {
      throw new Error(`Auth Registration failed: ${regData.error}`);
    }

    userToken = regData.user.token;
    console.log(' ✅ Registration Successful!');
    console.log(` -> Authenticating and obtaining JWT token...`);

    const loginResponse = await fetch(`${HOST}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        pin: testPin
      })
    });

    const loginData = await loginResponse.json();
    if (!loginResponse.ok) {
      throw new Error(`Auth Login failed: ${loginData.error}`);
    }
    console.log(' ✅ Login Successful! Token acquired.\n');

    // ----------------------------------------------------
    // TEST 2: AI Campaign Creator (Gemini & NIM Fallback)
    // ----------------------------------------------------
    console.log('[Test 2/5] Testing AI Campaign Copy Creator (AI Gateway)...');
    console.log(' -> Generating marketing campaign copy template & compliance score...');
    
    const campaignResponse = await fetch(`${HOST}/api/business/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        campaignName: 'Cohort Alpha Vaccine Outbound',
        targetAudience: 'Clinical Immunologists',
        channels: ['LinkedIn', 'Direct Email'],
        budget: 5000
      })
    });

    const campaignData = await campaignResponse.json();
    if (!campaignResponse.ok) {
      throw new Error(`Campaign creation failed: ${campaignData.error}`);
    }

    campaignId = campaignData.campaign._id;
    console.log(' ✅ Campaign generated successfully via AI Gateway!');
    console.log(` -> Generated Copy: "${campaignData.campaign.copyTemplate.substring(0, 80)}..."`);
    console.log(` -> Estimated CAC: $${campaignData.campaign.cacScore}`);
    console.log(` -> Compliance Verdict: ${campaignData.campaign.complianceRating}\n`);

    // ----------------------------------------------------
    // TEST 3: REST Monte Carlo Stress Projections & Stats
    // ----------------------------------------------------
    console.log('[Test 3/5] Testing REST Monte Carlo & Dashboard Analytics...');
    console.log(' -> Querying Monte Carlo stress projection timeline...');
    
    const mcResponse = await fetch(`${HOST}/api/business/stress-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        baseValue: 200,
        iterations: 100,
        steps: 6,
        growthRate: 0.08,
        riskFactor: 0.15
      })
    });

    const mcData = await mcResponse.json();
    if (!mcResponse.ok) {
      throw new Error(`Monte Carlo REST simulation failed: ${mcData.error}`);
    }

    console.log(' ✅ Monte Carlo Stress Test completed successfully!');
    console.log(` -> Baseline Projection (Months 0-3):`, mcData.report.projections.baseline.slice(0, 4));
    console.log(` -> Optimistic Projection (Months 0-3):`, mcData.report.projections.optimistic.slice(0, 4));

    console.log(' -> Querying compiled dashboard telemetry aggregates...');
    const statsResponse = await fetch(`${HOST}/api/business/dashboard-stats`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    const statsData = await statsResponse.json();
    if (!statsResponse.ok) {
      throw new Error(`Stats fetch failed: ${statsData.error}`);
    }
    console.log(' ✅ Dashboard telemetry compiled successfully:');
    console.log(` -> Total Clinicians Registered: ${statsData.stats.totalClinicians}`);
    console.log(` -> Swarm Consensus Debates: ${statsData.stats.totalDebatesRun}`);
    console.log(` -> Indexed RAG Segments: ${statsData.stats.ragMemorySegments}`);
    console.log(` -> Simulated Sandbox Revenue: $${statsData.stats.simulatedRevenue}\n`);

    // ----------------------------------------------------
    // TEST 4: Socket.io Telemetry & RAG Boardroom Swarm
    // ----------------------------------------------------
    console.log('[Test 4/5] Connecting to WebSockets (Telemetry & Swarm Debates)...');
    const socket = io(HOST);

    socket.on('connect', () => {
      console.log(` ✅ WebSocket connection established (ID: ${socket.id}).`);
      
      // Start physiological ECG wave streaming
      console.log(' -> Starting physiological ECG telemetry stream...');
      socket.emit('telemetry_stream_start');

      // Trigger RAG Swarm Debate (will query default clinical rules seeder)
      console.log(' -> Triggering RAG-grounded boardroom debate for Cohort Delta...');
      socket.emit('boardroom_debate_trigger', {
        directive: 'Initiate gene therapy modeling for target Cohort Delta',
        businessDNA: { name: 'HealOS Lab Unit', sector: 'Biotech', capital: 50000 }
      });
    });

    socket.on('telemetry_tick', (tick) => {
      console.log(` [Telemetry Stream] HR: ${tick.heartRate} bpm | Neural Sync: ${tick.neuralSync}% | System Health: ${tick.systemHealth}%`);
      console.log(` [Telemetry Stream] Synthesized 50-point ECG Wave representation: [${tick.heartWave.slice(0, 5).join(', ')}, ...]`);
      
      // Stop stream after receiving first tick
      socket.emit('telemetry_stream_stop');
      console.log(' -> Telemetry stream stopped.');
    });

    socket.on('boardroom_debate_packet', (packet) => {
      if (packet.status === 'AGENT_SPEECH') {
        console.log(`   [Swarm Board] ${packet.name} speaking... (Grounded by RAG: ${packet.opinion.toLowerCase().includes('delta') || packet.opinion.toLowerCase().includes('monitoring')})`);
      } else if (packet.status === 'DEBATE_COMPLETE' || packet.status === 'NEGOTIATION_START') {
        console.log(` ✅ Boardroom Swarm Debate verdict compiled: ${packet.verdict || 'VETO_NEGOTIATION'}\n`);
        
        // ----------------------------------------------------
        // TEST 5: Animated Synthetic Buyer Sandbox Ticks
        // ----------------------------------------------------
        console.log('[Test 5/5] Testing Animated Synthetic Buyer Sandbox (WebSocket)...');
        console.log(` -> Deploying campaign to sandbox (Simulating 30 prospects)...`);
        socket.emit('trigger_buyer_simulation', campaignId);
      }
    });

    socket.on('buyer_sim_tick', (tick) => {
      console.log(`   [Prospect Tick #${tick.index}/30]: ${tick.role} | Converted: ${tick.converted ? '✅ YES' : '❌ NO'} (Prob: ${tick.probability})`);
    });

    socket.on('buyer_sim_complete', (report) => {
      console.log(' ✅ Sandbox simulation complete!');
      console.log(` -> Total Conversions: ${report.conversions}/30 (${report.conversionRate * 100}% rate)`);
      console.log(` -> Simulated Revenue generated: $${report.revenueGenerated}`);
      console.log('\n======================================================');
      console.log('   ALL CORE BACKEND INTEGRATION PHASES PASSED SUCCESSFULLY');
      console.log('======================================================');
      socket.close();
      process.exit(0);
    });

    socket.on('boardroom_error', (err) => {
      console.error('Boardroom Swarm error packet:', err);
      socket.close();
      process.exit(1);
    });

    socket.on('buyer_sim_error', (err) => {
      console.error('Buyer Simulator error packet:', err);
      socket.close();
      process.exit(1);
    });

  } catch (error) {
    console.error('\n ❌ E2E Integration test failed:', error.message);
    process.exit(1);
  }
}

runTests();
