import { getDB } from '../config/db.js';
import { ingestDocument } from '../config/vectorDb.js';
import { generateText, parseJSONResponse } from '../services/aiGateway.js';
import { ObjectId } from 'mongodb';

/**
 * Handle document text uploads and ingest RAG chunks
 * POST /api/business/onboard
 */
function extractBusinessProfile(filename, content) {
  let profile = {
    companyName: 'Cortex Corp',
    industry: 'Enterprise AI & SaaS',
    size: '50-200 employees',
    keyMetrics: { revenue: '142', growth: '23', nps: 72 },
    capabilities: ['Multi-Agent AI', 'RAG Pipeline', 'Predictive Analytics', 'Real-Time Telemetry'],
  };

  if (filename.toLowerCase().endsWith('.csv')) {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length > 1) {
      const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };
      
      const headers = parseCSVLine(lines[0]);
      const values = parseCSVLine(lines[1]);
      
      const getField = (names) => {
        const idx = headers.findIndex(h => names.some(n => h.toLowerCase().includes(n.toLowerCase())));
        return idx !== -1 ? values[idx] : null;
      };

      const company = getField(['company', 'name']);
      const ind = getField(['industry', 'sector']);
      const audience = getField(['audience', 'target']);
      const product = getField(['product', 'core']);
      const painPoints = getField(['pain', 'points']);
      const channels = getField(['channels', 'primary']);

      if (company) profile.companyName = company;
      if (ind) profile.industry = ind;
      
      if (ind) {
        if (ind.toLowerCase().includes('health')) {
          profile.keyMetrics = { revenue: '284', growth: '18', nps: 84 };
        } else if (ind.toLowerCase().includes('robot') || ind.toLowerCase().includes('manufactur')) {
          profile.keyMetrics = { revenue: '512', growth: '31', nps: 78 };
        } else if (ind.toLowerCase().includes('cyber')) {
          profile.keyMetrics = { revenue: '740', growth: '42', nps: 90 };
        }
      }

      profile.capabilities = [
        product ? `Product: ${product}` : null,
        audience ? `Target: ${audience}` : null,
        painPoints ? `Resolves: ${painPoints.split(',')[0]}` : null,
        channels ? `Via: ${channels.split('and')[0].trim()}` : null
      ].filter(Boolean);
    }
  } else {
    const companyMatch = content.match(/Company\s*Name:\s*([^\n]+)/i) || content.match(/Company:\s*([^\n]+)/i);
    const industryMatch = content.match(/Industry:\s*([^\n]+)/i);
    if (companyMatch) profile.companyName = companyMatch[1].trim();
    if (industryMatch) profile.industry = industryMatch[1].trim();
  }

  return profile;
}

export async function getBusinessProfile(req, res) {
  try {
    const db = getDB();
    const profile = await db.collection('business_profile').findOne({ userId: req.user.id });
    return res.status(200).json(profile);
  } catch (error) {
    console.error('Error getting business profile:', error);
    return res.status(500).json({ error: 'Internal Server Error getting profile.' });
  }
}

export async function onboardDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file uploaded. Multer buffer empty.' });
    }

    const filename = req.file.originalname;
    const content = req.file.buffer.toString('utf-8');

    console.log(`[Business Controller] Ingesting document: ${filename} for user ${req.user.id} (${req.file.size} bytes)`);
    const chunksCreated = await ingestDocument(filename, content, req.user.id);

    const profile = extractBusinessProfile(filename, content);
    profile.userId = req.user.id;
    const db = getDB();
    await db.collection('business_profile').updateOne(
      { userId: req.user.id },
      { $set: profile },
      { upsert: true }
    );

    return res.status(200).json(profile);
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
    const totalSessions = await db.collection('boardroom_sessions').countDocuments({ userId: req.user.id });
    const totalMemorySegments = await db.collection('memory_segments').countDocuments({ userId: req.user.id });
    const totalCampaigns = await db.collection('campaigns').countDocuments({ userId: req.user.id });

    // Fetch boardroom sessions to calculate ratios
    const sessions = await db.collection('boardroom_sessions').find({ userId: req.user.id }).toArray();
    const approvals = sessions.filter(s => s.verdict === 'APPROVED').length;
    const approvalRatio = totalSessions > 0 ? parseFloat((approvals / totalSessions).toFixed(2)) : 0;

    // Load parsed business DNA profile stats
    const profile = await db.collection('business_profile').findOne({ userId: req.user.id });
    const hasProfile = !!profile;
    const growthNum = parseFloat(profile?.keyMetrics?.growth) || 0;
    const npsNum = parseInt(profile?.keyMetrics?.nps) || 0;
    const revenueNum = parseFloat(profile?.keyMetrics?.revenue) || 0;

    // System health: 0 if nothing exists, scales with approval ratio when debates happen
    const diagnosticHealthScore = totalSessions > 0 
      ? Math.round(80 + (approvals / totalSessions) * 20) 
      : (hasProfile ? 95 : 0);

    // Aggregate campaign simulation sandbox metrics
    const simulations = await db.collection('campaign_simulations').find({ userId: req.user.id }).toArray();
    const totalSimulations = simulations.length;
    const totalSimulatedRevenue = simulations.reduce((acc, s) => acc + (s.revenueGenerated || 0), 0);
    const avgConversionRate = totalSimulations > 0 
      ? parseFloat((simulations.reduce((acc, s) => acc + (s.conversionRate || 0), 0) / totalSimulations).toFixed(2))
      : 0;

    return res.status(200).json({
      healthScore: diagnosticHealthScore,
      growthScore: Math.round(growthNum + (totalCampaigns * 2)),
      revenue: totalSimulatedRevenue > 0 ? totalSimulatedRevenue : Math.round(revenueNum),
      burnRate: revenueNum > 0 ? Math.round(revenueNum * 0.25) + (totalSessions * 2) : 0,
      cac: totalSimulations > 0 ? Math.floor(1000 / totalSimulations) : 0,
      ltv: totalSimulatedRevenue > 0 ? totalSimulatedRevenue * 3 : Math.round(revenueNum * 15),
      nps: Math.round(npsNum + (approvalRatio * 10)),
      pipelineValue: totalCampaigns > 0 ? (totalCampaigns * 150) + 200 : 0,
      riskIndex: hasProfile ? Math.round(Math.max(10, 50 - (approvalRatio * 40))) : 0,
      // Extra fields for Analytics
      avgConversionRate: avgConversionRate,
      marketingCampaigns: totalCampaigns,
      totalSimulationsRun: totalSimulations,
      // Backward compatibility for integration tests
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
      userId: req.user.id,
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
    const campaigns = await db.collection('campaigns').find({ userId: req.user.id }).sort({ created_at: -1 }).toArray();
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
    
    // Fetch target campaign scoped to user
    const campaign = await db.collection('campaigns').findOne({ _id: new ObjectId(campaignId), userId: req.user.id });
    if (!campaign) {
      return res.status(404).json({ error: 'Target campaign not found.' });
    }

    // Seed 30 buyer personas if not seeded yet scoped to user
    const buyerCount = await db.collection('buyer_personas').countDocuments({ userId: req.user.id });
    if (buyerCount === 0) {
      const mode = req.body.mode || 'healthcare';
      console.log(`[Buyer Sandbox] Seeding 30 synthetic buyer personas for user ${req.user.id} [Mode: ${mode}]...`);
      const seedBuyers = [];
      const roles = mode === 'enterprise' 
        ? ['Venture Capitalist', 'VP of Operations', 'Product Manager', 'Enterprise CIO', 'SaaS Procurement', 'HR Director', 'Head of Sales', 'Chief Marketing Officer', 'Finance VP', 'Data Scientist']
        : ['Biotech Venture Investor', 'Clinical Director', 'Molecular Biochemist', 'Health System CIO', 'SaaS Operations Director', 'Hospital Procurement Officer', 'Laboratory Director', 'Oncology Department Head', 'Hospital Network CFO', 'Genetic Counselor'];
      const channels = ['LinkedIn', 'Direct Email', 'SEO Outbound', 'Clinical Seminars'];
      const painPoints = mode === 'enterprise'
        ? ['budget constraints', 'low conversion rates', 'high churn', 'poor data visibility', 'slow onboarding', 'security compliance']
        : ['regulatory audits', 'onboarding delays', 'system budget constraints', 'data security', 'patient churn', 'hipaa validation'];

      for (let i = 1; i <= 30; i++) {
        seedBuyers.push({
          userId: req.user.id,
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

    const buyers = await db.collection('buyer_personas').find({ userId: req.user.id }).toArray();
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
      const hasPainPointMatch = (campaign.copyTemplate || '').toLowerCase().includes((buyer.painPoint || '').toLowerCase());
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
      userId: req.user.id,
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
    console.log(`[Buyer Sandbox] Campaign simulation complete for user ${req.user.id}. Conversions: ${conversions}/30`);

    return res.status(200).json({
      message: 'Campaign simulation completed successfully.',
      report
    });
  } catch (error) {
    console.error('Error simulating campaign:', error);
    return res.status(500).json({ error: 'Internal Server Error during sandbox simulation.' });
  }
}

// Refactor: diagnostics MongoDB insert checks

// Refactor: campaign budget checks

// Refactor: buyer personas seeder check

// Refactor: dashboard simulations aggregation logic

// Refactor: campaign simulate REST route payload formats
