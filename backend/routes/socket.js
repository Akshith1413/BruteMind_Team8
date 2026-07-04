import { generateTelemetryTick, runMonteCarloSimulation } from '../controllers/telemetryCtrl.js';
import { runBoardroomDebate } from '../controllers/boardroomCtrl.js';
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

export default function registerSocketCoordinator(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    let telemetryIntervalId = null;
    let telemetryState = { heartRate: 72, neuralSync: 98.4, genomicDepth: 4.2 };

    // Real-time Physiological/ECG Telemetry Stream
    socket.on('telemetry_stream_start', () => {
      if (telemetryIntervalId) clearInterval(telemetryIntervalId);

      telemetryIntervalId = setInterval(() => {
        telemetryState = generateTelemetryTick(telemetryState);
        socket.emit('telemetry_tick', telemetryState);

        // Emergency Crisis Warning Alert Trigger
        if (telemetryState.systemHealth < 80) {
          socket.emit('crisis_alert', {
            title: 'SYSTEM OVERHEAT / DEGRADE ALERT',
            value: telemetryState.systemHealth,
            message: `Emergency crisis triggered! Neural synchronization has degraded to ${telemetryState.neuralSync}%, destabilizing standard physiological ECG telemetry complexes.`
          });
        }
      }, 1000);
    });

    socket.on('telemetry_stream_stop', () => {
      if (telemetryIntervalId) {
        clearInterval(telemetryIntervalId);
        telemetryIntervalId = null;
      }
    });

    // Monte Carlo Projections Socket Ingress
    socket.on('run_monte_carlo', (levers) => {
      try {
        const results = runMonteCarloSimulation(levers);
        socket.emit('simulation_result', results);
      } catch (err) {
        socket.emit('simulation_error', { error: err.message });
      }
    });

    // Swarm Consensus Boardroom Debates Ingress
    socket.on('boardroom_debate_trigger', async (context) => {
      try {
        console.log(`[Socket.io] Client triggered boardroom debate swarm: ${JSON.stringify(context)}`);
        await runBoardroomDebate(context, (packet) => {
          socket.emit('boardroom_debate_packet', packet);
        });
      } catch (err) {
        console.error('Boardroom socket trigger error:', err);
        socket.emit('boardroom_error', { error: err.message });
      }
    });

    // Animated Synthetic Buyer Sandbox Ticks Ingress
    socket.on('trigger_buyer_simulation', async (campaignId) => {
      try {
        console.log(`[Socket.io] Client triggered buyer simulation: ${campaignId}`);
        const db = getDB();
        
        // Fetch target campaign
        const campaign = await db.collection('campaigns').findOne({ _id: new ObjectId(campaignId) });
        if (!campaign) {
          socket.emit('buyer_sim_error', { error: 'Target campaign not found' });
          return;
        }

        // Seed default buyers if empty
        const buyerCount = await db.collection('buyer_personas').countDocuments();
        if (buyerCount === 0) {
          const seedBuyers = [];
          const roles = ['Biotech Venture Investor', 'Clinical Director', 'Molecular Biochemist', 'Health System CIO', 'SaaS Operations Director', 'Hospital Procurement Officer', 'Laboratory Director', 'Oncology Department Head', 'Hospital Network CFO', 'Genetic Counselor'];
          const channels = ['LinkedIn', 'Direct Email', 'SEO Outbound', 'Clinical Seminars'];
          const painPoints = ['regulatory audits', 'onboarding delays', 'system budget constraints', 'data security', 'patient churn', 'hipaa validation'];

          for (let i = 1; i <= 30; i++) {
            seedBuyers.push({
              id: `buyer_${i}`,
              role: roles[i % roles.length],
              channelPreference: channels[i % channels.length],
              painPoint: painPoints[i % painPoints.length],
              budgetCap: 5000 + (i * 1000),
              attentionSpan: parseFloat((0.2 + (i * 0.02)).toFixed(2))
            });
          }
          await db.collection('buyer_personas').insertMany(seedBuyers);
        }

        const buyers = await db.collection('buyer_personas').find({}).toArray();
        let conversions = 0;
        let impressions = 0;
        const simulationTicks = [];

        // Run sequential animated streaming ticks with 120ms delay
        for (let idx = 0; idx < buyers.length; idx++) {
          const buyer = buyers[idx];
          impressions++;
          
          let probability = 0.05;
          if (campaign.channels.includes(buyer.channelPreference)) {
            probability += 0.15;
          }
          const hasPainPointMatch = campaign.copyTemplate.toLowerCase().includes(buyer.painPoint.toLowerCase());
          if (hasPainPointMatch) {
            probability += 0.10;
          }
          if (campaign.budget <= buyer.budgetCap) {
            probability += 0.05;
          }

          const roll = Math.random();
          const converted = roll <= probability;
          if (converted) conversions++;

          const tickResult = {
            index: idx + 1,
            buyerId: buyer.id,
            role: buyer.role,
            probability: parseFloat(probability.toFixed(2)),
            converted,
            reason: converted 
              ? `Channel match (${buyer.channelPreference}) & pain point addressed.` 
              : `Mismatched marketing channel or attention timeout.`
          };

          simulationTicks.push(tickResult);

          // Emit individual tick to trigger frontend animation
          socket.emit('buyer_sim_tick', tickResult);
          
          // 120ms delay
          await new Promise(resolve => setTimeout(resolve, 120));
        }

        const conversionRate = parseFloat((conversions / impressions).toFixed(2));
        const revenueGenerated = conversions * 2500;

        const report = {
          campaignId: new ObjectId(campaignId),
          campaignName: campaign.campaignName,
          totalImpressions: impressions,
          conversions,
          conversionRate,
          revenueGenerated,
          ticks: simulationTicks,
          timestamp: new Date()
        };

        await db.collection('campaign_simulations').insertOne(report);
        socket.emit('buyer_sim_complete', report);

      } catch (err) {
        console.error('Buyer simulation socket error:', err);
        socket.emit('buyer_sim_error', { error: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
      if (telemetryIntervalId) clearInterval(telemetryIntervalId);
    });
  });
}

// Refactor: telemetry stream logs

// Refactor: courtroom packets check
