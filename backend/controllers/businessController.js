import { getDB } from '../config/db.js';
import { ingestDocument } from '../config/vectorDb.js';
import { generateText, parseJSONResponse } from '../services/aiGateway.js';
import { ObjectId } from 'mongodb';

/**
 * Handle document text uploads and ingest RAG chunks
 * POST /api/business/onboard
 */
export async function onboardDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file uploaded. Multer buffer empty.' });
    }

    const filename = req.file.originalname;
    const content = req.file.buffer.toString('utf-8');

    console.log(`[Business Controller] Ingesting document: ${filename} (${req.file.size} bytes)`);
    const chunksCreated = await ingestDocument(filename, content);

    return res.status(200).json({
      message: 'Document onboarding and RAG tokenization successful.',
      filename,
      chunksCreated
    });
  } catch (error) {
    console.error('Error onboarding document:', error);
    return res.status(500).json({ error: 'Internal Server Error during document ingestion.' });
  }
}

/**
 * Compile clinical/business dashboard metrics
 * GET /api/business/dashboard-stats
 */
export async function getDashboardStats(req, res) {
  try {
    const db = getDB();
    
    // Aggregation queries on MongoDB collections
    const totalUsers = await db.collection('users').countDocuments();
    const totalSessions = await db.collection('boardroom_sessions').countDocuments();
    const totalMemorySegments = await db.collection('memory_segments').countDocuments();
    const totalCampaigns = await db.collection('campaigns').countDocuments();

    // Fetch boardroom sessions to calculate ratios
    const sessions = await db.collection('boardroom_sessions').find({}).toArray();
    const approvals = sessions.filter(s => s.verdict === 'APPROVED').length;
    const approvalRatio = totalSessions > 0 ? parseFloat((approvals / totalSessions).toFixed(2)) : 0;

    // Simulate system performance indicators
    const diagnosticHealthScore = totalSessions > 0 
      ? Math.round(80 + (approvals / totalSessions) * 20) 
      : 95;

    // Aggregate campaign simulation sandbox metrics
    const simulations = await db.collection('campaign_simulations').find({}).toArray();
    const totalSimulations = simulations.length;
    const totalSimulatedRevenue = simulations.reduce((acc, s) => acc + (s.revenueGenerated || 0), 0);
    const avgConversionRate = totalSimulations > 0 
      ? parseFloat((simulations.reduce((acc, s) => acc + (s.conversionRate || 0), 0) / totalSimulations).toFixed(2))
      : 0;

    return res.status(200).json({
      stats: {
        totalClinicians: totalUsers,
        totalDebatesRun: totalSessions,
        ragMemorySegments: totalMemorySegments,
        marketingCampaigns: totalCampaigns,
        consensusApprovalRatio: approvalRatio,
        systemHealthIndex: diagnosticHealthScore,
        totalSimulationsRun: totalSimulations,
        simulatedRevenue: totalSimulatedRevenue,
        avgConversionRate
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ error: 'Internal Server Error compiling dashboard stats.' });
  }
}

/**
 * Generate marketing campaigns and compliance signatures
 * POST /api/business/campaigns
 */
export async function createCampaign(req, res) {
  try {
    const { campaignName, targetAudience, channels, budget } = req.body;

    if (!campaignName || !targetAudience || !channels) {
      return res.status(400).json({ error: 'Missing campaign fields: campaignName, targetAudience, channels are required.' });
    }

    console.log(`[Business Controller] Generating campaign: ${campaignName}`);

    const systemPrompt = `You are a professional marketing director. You collaborate with legal and financial boards. Generate target ad copy templates and budget CAC estimations.\n\nYou must return a JSON response block in this exact format:\n{\n  "copyTemplate": "The ad copy text...",\n  "cacScore": 75,\n  "complianceRating": "APPROVED" or "NEEDS_REVIEW"\n}`;
    const userPrompt = `Campaign Name: "${campaignName}"\nAudience: "${targetAudience}"\nChannels: "${JSON.stringify(channels)}"\nBudget: $${budget || 1000}`;

    const rawOutput = await generateText(systemPrompt, userPrompt);
    const parsed = parseJSONResponse(rawOutput);

    const db = getDB();
    const newCampaign = {
      campaignName,
      targetAudience,
      channels,
      budget: budget || 1000,
      copyTemplate: parsed.copyTemplate || 'Ad copy draft placeholder.',
      cacScore: parsed.cacScore || 50,
      complianceRating: parsed.complianceRating || 'APPROVED',
      created_at: new Date()
    };

    const result = await db.collection('campaigns').insertOne(newCampaign);
    newCampaign._id = result.insertedId;

    return res.status(201).json({
      message: 'Campaign created successfully.',
      campaign: newCampaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return res.status(500).json({ error: 'Internal Server Error compiling campaign copy.' });
  }
}

/**
 * Retrieve campaigns from database
 * GET /api/business/campaigns
 */
export async function getCampaigns(req, res) {
  try {
    const db = getDB();
    const campaigns = await db.collection('campaigns').find({}).sort({ created_at: -1 }).toArray();
    return res.status(200).json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return res.status(500).json({ error: 'Internal Server Error pulling campaigns.' });
  }
}

/**
 * Compile AI gateway performance latency diagnostics
 * GET /api/business/diagnostics
 */
export async function getAIDiagnostics(req, res) {
  try {
    const db = getDB();
    const metrics = await db.collection('diagnostics').find({}).sort({ timestamp: -1 }).limit(100).toArray();

    if (metrics.length === 0) {
      return res.status(200).json({
        totalRequests: 0,
        averageLatencyMs: 0,
        successRate: 1,
        fallbackFrequency: 0,
        recentLogs: []
      });
    }

    const totalRequests = metrics.length;
    const totalLatency = metrics.reduce((acc, m) => acc + (m.latencyMs || 0), 0);
    const successCount = metrics.filter(m => m.success === true).length;
    const fallbackCount = metrics.filter(m => m.provider === 'NVIDIA_NIM').length;

    return res.status(200).json({
      totalRequests,
      averageLatencyMs: Math.round(totalLatency / totalRequests),
      successRate: parseFloat((successCount / totalRequests).toFixed(2)),
      fallbackFrequency: fallbackCount,
      recentLogs: metrics.slice(0, 10)
    });
  } catch (error) {
    console.error('Error fetching diagnostics:', error);
    return res.status(500).json({ error: 'Internal Server Error compiling diagnostics metrics.' });
  }
}

/**
 * Simulate campaign across 30 seeded buyer personas
 * POST /api/business/campaigns/:id/simulate
 */
export async function simulateCampaign(req, res) {
  try {
    const campaignId = req.params.id;
    const db = getDB();
    
    // Fetch target campaign
    const campaign = await db.collection('campaigns').findOne({ _id: new ObjectId(campaignId) });
    if (!campaign) {
      return res.status(404).json({ error: 'Target campaign not found.' });
    }

    // Seed 30 buyer personas if not seeded yet
    const buyerCount = await db.collection('buyer_personas').countDocuments();
    if (buyerCount === 0) {
      console.log('[Buyer Sandbox] Seeded 30 synthetic buyer personas successfully.');
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

    // Calculate purchase conversion matrix
    buyers.forEach(buyer => {
      impressions++;
      
      // Channel overlap boost
      let probability = 0.05;
      if (campaign.channels.includes(buyer.channelPreference)) {
        probability += 0.15;
      }
      
      // Pain-point copy matching boost
      const hasPainPointMatch = campaign.copyTemplate.toLowerCase().includes(buyer.painPoint.toLowerCase());
      if (hasPainPointMatch) {
        probability += 0.10;
      }
      
      // Budget matching boost
      if (campaign.budget <= buyer.budgetCap) {
        probability += 0.05;
      }

      // stochastic validation roll
      const roll = Math.random();
      const converted = roll <= probability;
      if (converted) conversions++;

      simulationTicks.push({
        buyerId: buyer.id,
        role: buyer.role,
        probability: parseFloat(probability.toFixed(2)),
        converted,
        reason: converted 
          ? `Matched preferred channel ${buyer.channelPreference} and pain points.` 
          : `Insufficient attention span or mismatched marketing channel.`
      });
    });

    const conversionRate = parseFloat((conversions / impressions).toFixed(2));
    const revenueGenerated = conversions * 2500; // standard simulated customer lifetime value

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
    console.log(`[Buyer Sandbox] Campaign simulation complete. Conversions: ${conversions}/30`);

    return res.status(200).json({
      message: 'Campaign simulation completed successfully.',
      report
    });
  } catch (error) {
    console.error('Error simulating campaign:', error);
    return res.status(500).json({ error: 'Internal Server Error during sandbox simulation.' });
  }
}
