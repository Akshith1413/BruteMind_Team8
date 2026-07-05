import { generateText, parseJSONResponse } from '../services/aiGateway.js';

const handleEngineRequest = async (res, engineName, systemPrompt, userPrompt) => {
  try {
    console.log(`[Engines Controller] Running ${engineName}...`);
    const rawOutput = await generateText(systemPrompt, userPrompt);
    const parsed = parseJSONResponse(rawOutput);
    
    return res.status(200).json({
      message: `${engineName} execution successful.`,
      result: parsed
    });
  } catch (error) {
    console.error(`Error in ${engineName}:`, error);
    return res.status(500).json({ error: `Internal Server Error executing ${engineName}.` });
  }
};

/**
 * 1. Strategy Engine
 * Does market research, brand positioning, pricing suggestions and helps design sales/marketing strategies.
 */
export async function strategyEngine(req, res) {
  const { productName, industry, targetAudience, description } = req.body;
  
  if (!productName || !industry) {
    return res.status(400).json({ error: 'productName and industry are required.' });
  }

  const systemPrompt = `You are a Chief Strategy Officer and Market Analyst AI. 
Provide a strategic analysis including market research, brand positioning, and pricing suggestions.
You must return a JSON response block in this exact format:
{
  "marketResearch": "Insights on current market trends...",
  "brandPositioning": "How the brand should be positioned...",
  "pricingSuggestions": "Recommended pricing models...",
  "overallStrategy": "High level sales and marketing strategy overview..."
}`;

  const userPrompt = `Product: ${productName}\nIndustry: ${industry}\nAudience: ${targetAudience || 'General'}\nDescription: ${description || 'N/A'}`;
  
  return handleEngineRequest(res, 'Strategy Engine', systemPrompt, userPrompt);
}

/**
 * 2. Marketing Engine
 * Suggests and designs 360 marketing strategies to promote the product/business.
 */
export async function marketingEngine(req, res) {
  const { productName, industry, budget } = req.body;
  
  if (!productName) {
    return res.status(400).json({ error: 'productName is required.' });
  }

  const systemPrompt = `You are a Chief Marketing Officer AI.
Design a 360-degree marketing strategy to promote a product.
You must return a JSON response block in this exact format:
{
  "digitalMarketing": ["Social media strategy...", "SEO strategy..."],
  "contentStrategy": "Suggested content themes and calendar...",
  "prAndOutreach": "Public relations and influencer strategy...",
  "budgetAllocation": "Suggested breakdown of the marketing budget..."
}`;

  const userPrompt = `Product: ${productName}\nIndustry: ${industry || 'General'}\nBudget: $${budget || 'Variable'}`;
  
  return handleEngineRequest(res, 'Marketing Engine', systemPrompt, userPrompt);
}

/**
 * 3. Lead Gen Engine
 * Brings in leads and helps convert them. Suggests digital marketing, whatsapp, physical marketing.
 */
export async function leadGenEngine(req, res) {
  const { productName, targetAudience } = req.body;
  
  if (!productName) {
    return res.status(400).json({ error: 'productName is required.' });
  }

  const systemPrompt = `You are a Lead Generation Specialist AI.
Provide strategies to acquire and convert leads effectively across digital and physical channels.
You must return a JSON response block in this exact format:
{
  "digitalLeadGen": "Strategies for capturing digital leads (ads, landing pages)...",
  "whatsappCampaign": "A drafted template and strategy for WhatsApp marketing...",
  "physicalMarketing": "Ideas for physical/offline marketing and events...",
  "conversionHooks": ["Hook 1", "Hook 2"]
}`;

  const userPrompt = `Product: ${productName}\nTarget Audience: ${targetAudience || 'General'}`;
  
  return handleEngineRequest(res, 'Lead Gen Engine', systemPrompt, userPrompt);
}

/**
 * 4. Sale Engine
 * Helps to convert leads, build sales funnels, helps to do sales.
 */
export async function salesEngine(req, res) {
  const { productName, averageDealSize } = req.body;
  
  if (!productName) {
    return res.status(400).json({ error: 'productName is required.' });
  }

  const systemPrompt = `You are a Sales Director AI.
Design a robust sales funnel and provide conversion tactics.
You must return a JSON response block in this exact format:
{
  "salesFunnel": {
    "top": "Awareness strategies...",
    "middle": "Consideration strategies...",
    "bottom": "Decision/Conversion strategies..."
  },
  "objectionHandling": ["Common objection 1 and how to handle it", "Common objection 2..."],
  "closingTechniques": "Recommended closing strategies based on deal size..."
}`;

  const userPrompt = `Product: ${productName}\nAverage Deal Size: ${averageDealSize || 'Unknown'}`;
  
  return handleEngineRequest(res, 'Sales Engine', systemPrompt, userPrompt);
}

/**
 * 5. Analytics Engine
 * Dashboards, Forecasting, Competitive insights, portfolio, roadmaps.
 */
export async function analyticsEngine(req, res) {
  const { industry, competitors } = req.body;
  
  if (!industry) {
    return res.status(400).json({ error: 'industry is required.' });
  }

  const systemPrompt = `You are a Data & Analytics AI.
Provide forecasting, competitive insights, and strategic roadmap recommendations.
You must return a JSON response block in this exact format:
{
  "forecasting": "Projected growth and revenue models...",
  "competitiveInsights": "Analysis of the competitive landscape...",
  "productRoadmap": "Recommended 6-12 month strategic milestones...",
  "keyMetrics": ["Metric 1 to track", "Metric 2 to track"]
}`;

  const userPrompt = `Industry: ${industry}\nCompetitors: ${competitors ? JSON.stringify(competitors) : 'General market'}`;
  
  return handleEngineRequest(res, 'Analytics Engine', systemPrompt, userPrompt);
}

/**
 * 6. Customer Success Engine
 * CRM workflows, Support portal templates, Chatbot AI flows.
 */
export async function customerSuccessEngine(req, res) {
  const { productName } = req.body;
  
  if (!productName) {
    return res.status(400).json({ error: 'productName is required.' });
  }

  const systemPrompt = `You are a Customer Success Manager AI.
Provide strategies for CRM, support portals, and AI chatbot workflows.
You must return a JSON response block in this exact format:
{
  "crmWorkflows": "Recommended automated follow-up and retention sequences...",
  "supportPortal": "Key categories and articles to include in the help center...",
  "chatbotFlow": "A conversational flow for the AI chatbot to handle basic inquiries...",
  "retentionStrategy": "Strategies to minimize churn and maximize LTV..."
}`;

  const userPrompt = `Product: ${productName}`;
  
  return handleEngineRequest(res, 'Customer Success Engine', systemPrompt, userPrompt);
}
