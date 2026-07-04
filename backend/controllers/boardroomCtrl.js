import { generateText, parseJSONResponse } from '../services/aiGateway.js';
import { getDB } from '../config/db.js';
import { queryMemory } from '../config/vectorDb.js';

// Persona System Prompts defining constraints and roles for the 10 agents
const AGENT_PERSONAS = {
  CEO: {
    name: 'CEO (Chief Executive & Orchestrator)',
    avatar: '💼',
    role: 'Presides over board votes, sets high-level targets, handles escalation.',
    prompt: 'You are the CEO Agent. You analyze corporate growth targets, coordinate department alignments, and deliver final executive decisions. You weigh operational capability and budget constraints. Ensure decisions are strategically sound.'
  },
  CFO: {
    name: 'CFO (Financial Risk & Margin Controller)',
    avatar: '📊',
    role: 'Enforces strict burn-rate guardrails, analyzes Unit Economics (LTV, CAC).',
    prompt: 'You are the CFO Agent. You are extremely conservative, hate burning money, and demand strict unit economics (high LTV/CAC ratio, short payback period). You reject things that blow the budget or have unclear ROI.'
  },
  CMO: {
    name: 'CMO (Demand Generation & Marketing)',
    avatar: '📣',
    role: 'Generates advertising copy, designs funnel loops, tracks acquisition.',
    prompt: 'You are the CMO Agent. You focus on brand reach, click-through rates, and acquisition funnels. You advocate for marketing budgets and creative advertising solutions to scale customer acquisition.'
  },
  CSO: {
    name: 'CSO (Sales Pipeline Architect)',
    avatar: '📈',
    role: 'Qualifies leads, maps pipeline friction, optimizes deal stages.',
    prompt: 'You are the CSO Agent. You care about lead velocity, sales conversion rates, sales outreach pipelines, and reducing friction in deal pipelines.'
  },
  COO: {
    name: 'COO (Operational Performance Auditor)',
    avatar: '⚙️',
    role: 'Scans system logs for execution friction, monitors resource limits.',
    prompt: 'You are the COO Agent. You monitor system latency, task velocities, operational overheads, and team bandwidth. You highlight bottlenecks and require clear execution timelines.'
  },
  RD: {
    name: 'R&D / Innovation (Market & Competitor Sentinel)',
    avatar: '🔬',
    role: 'Monitors competitor pricing, scans scientific journals, tracks patents.',
    prompt: 'You are the R&D Agent. You track scientific credibility, patent risks, clinical studies validity, and long-term research relevance. You reject claims that lack academic support.'
  },
  DATA_ANALYST: {
    name: 'Data Analyst (Vector Database Sentinel)',
    avatar: '💾',
    role: 'Monitors indexing latency, parses semantic vectors, retrieves logs.',
    prompt: 'You are the Data Analyst Agent. You evaluate database health, prompt grounding ratios, and term vector weights. You ensure RAG context matches are accurate.'
  },
  CS: {
    name: 'Customer Success (Retention & Churn Shield)',
    avatar: '🛡️',
    role: 'Protects user retention, flags churn warning indicators.',
    prompt: 'You are the Customer Success Agent. You care about user happiness, Net Promoter Scores (NPS), patient churn risks, and boarding friction. You reject features that damage user satisfaction.'
  },
  HR: {
    name: 'HR & Talent (Capacity Optimizer)',
    avatar: '👥',
    role: 'Monitors staff burnouts, optimizes engineering bandwidth allocations.',
    prompt: 'You are the HR Agent. You evaluate developer burnout risk, clinical workforce capacity limits, and onboarding velocity. You prevent projects from overloading the engineering team.'
  },
  LEGAL: {
    name: 'Legal & Risk (Compliance & Ethics Board)',
    avatar: '⚖️',
    role: 'Ensures strict HIPAA compliance, reviews audit trails, flags liability.',
    prompt: 'You are the Legal Agent. You enforce HIPAA compliance, medical privacy, liability risks, and regulatory approvals. You veto or reject any campaign or proposal that violates audits.'
  }
};

/**
 * Consult an individual boardroom agent during debate
 */
async function consultAgent(roleKey, directive, groundingContext, pastOpinions = []) {
  const agent = AGENT_PERSONAS[roleKey];
  const systemPrompt = `${agent.prompt}\n\nGrounding Clinical/Corporate Context:\n${groundingContext}\n\nYou must return a JSON response block in this format:\n{\n  "opinion": "Your detailed reasoning here...",\n  "approved": 1 or 0\n}`;

  const userPrompt = `Directive: "${directive}"\n\nPast board opinions:\n${JSON.stringify(pastOpinions)}`;
  
  try {
    const rawResult = await generateText(systemPrompt, userPrompt);
    const parsed = parseJSONResponse(rawResult);
    return {
      name: agent.name,
      avatar: agent.avatar,
      opinion: parsed.opinion || 'No comment.',
      approved: parsed.approved === 1 ? 1 : 0
    };
  } catch (err) {
    console.error(`Error consulting agent ${roleKey}:`, err);
    return {
      name: agent.name,
      avatar: agent.avatar,
      opinion: `System consultation error: ${err.message}`,
      approved: 0
    };
  }
}

/**
 * Coordinate boardroom swarm consensus debate sequence
 */
export async function runBoardroomDebate(context, emitPacket) {
  const directive = context.directive || 'Initiate standard clinical operation';
  const businessDNA = context.businessDNA || {};
  console.log(`[Boardroom Engine] Initiating debate for: "${directive}"`);

  // Query RAG context using local TF-IDF memory index
  console.log('[Boardroom Engine] Querying TF-IDF RAG Memory...');
  const matchedDocs = queryMemory(directive, 3);
  let groundingContext = 'No document context matched this query.';
  if (matchedDocs.length > 0) {
    groundingContext = matchedDocs.map(d => `[Source: ${d.filename}] (Score: ${d.score}) ${d.content}`).join('\n\n');
    console.log(`[Boardroom Engine] Matched ${matchedDocs.length} grounding documents.`);
  } else {
    console.log('[Boardroom Engine] No relevant grounding documents found in RAG memory.');
  }

  const results = [];
  const votes = {};

  // Phase 1: Strategic Alignment (CMO, CFO, Legal)
  emitPacket({ status: 'STAGE_1_START', message: 'Stage 1: Strategic & Financial Risk Assessment...' });
  const stage1Roles = ['CMO', 'CFO', 'LEGAL'];
  for (const role of stage1Roles) {
    const speech = await consultAgent(role, directive, groundingContext, results);
    results.push(speech);
    votes[role] = speech.approved;
    emitPacket({ status: 'AGENT_SPEECH', name: speech.name, avatar: speech.avatar, opinion: speech.opinion, approved: speech.approved });
  }

  // Phase 2: Operations & Data Integration (CSO, COO, R&D, Data Analyst)
  emitPacket({ status: 'STAGE_2_START', message: 'Stage 2: Operations, Science, & Data Integration...' });
  const stage2Roles = ['CSO', 'COO', 'RD', 'DATA_ANALYST'];
  for (const role of stage2Roles) {
    const speech = await consultAgent(role, directive, groundingContext, results);
    results.push(speech);
    votes[role] = speech.approved;
    emitPacket({ status: 'AGENT_SPEECH', name: speech.name, avatar: speech.avatar, opinion: speech.opinion, approved: speech.approved });
  }

  // Phase 3: Final Verification (CS, HR, CEO)
  emitPacket({ status: 'STAGE_3_START', message: 'Stage 3: Customer Satisfaction & Executive Oversight...' });
  const stage3Roles = ['CS', 'HR', 'CEO'];
  for (const role of stage3Roles) {
    const speech = await consultAgent(role, directive, groundingContext, results);
    results.push(speech);
    votes[role] = speech.approved;
    emitPacket({ status: 'AGENT_SPEECH', name: speech.name, avatar: speech.avatar, opinion: speech.opinion, approved: speech.approved });
  }

  // Sum approvals
  const totalApprovals = Object.values(votes).reduce((sum, v) => sum + v, 0);
  const approvalRate = totalApprovals / 10;
  let verdict = approvalRate >= 0.6 ? 'APPROVED' : 'REJECTED';

  console.log(`[Boardroom Engine] Swarm consensus finished. Approvals: ${totalApprovals}/10. Verdict: ${verdict}`);

  // Veto Negotiation Loop
  if (verdict === 'REJECTED') {
    emitPacket({ status: 'NEGOTIATION_START', message: `Proposal rejected (${totalApprovals}/10 approvals). Activating CEO Veto Negotiation...` });
    console.log('[Boardroom Engine] Proposal rejected (0/10 approvals). Activating Veto Negotiation Loop...');
    
    // Gather all objecting agent opinions
    const objections = results.filter(r => r.approved === 0).map(r => `${r.name}: ${r.opinion}`).join('\n');
    
    const negotiationSystemPrompt = `You are the CEO Swarm Coordinator. Gather objections and draft a compromise directive resolving compliance, financial, and operational concerns. Return a JSON block:\n{\n  "compromiseDirective": "The revised directive text here...",\n  "rationale": "Why this resolves objections..."\n}`;
    const negotiationUserPrompt = `Original Directive: "${directive}"\n\nObjections:\n${objections}`;
    
    try {
      const negotiationOutput = await generateText(negotiationSystemPrompt, negotiationUserPrompt);
      const parsedCompromise = parseJSONResponse(negotiationOutput);
      const compromiseDirective = parsedCompromise.compromiseDirective || `${directive} (with compliance and margin guardrails)`;

      emitPacket({
        status: 'NEGOTIATION_COMPROMISE_PROPOSED',
        compromiseDirective,
        rationale: parsedCompromise.rationale || 'Compromise designed to pass threshold.'
      });

      // Re-voting sequence for objecting roles
      emitPacket({ status: 'RE_VOTING_START', message: 'Re-voting on compromise directive...' });
      const objectingRoles = Object.keys(votes).filter(k => votes[k] === 0);
      let newApprovals = totalApprovals;

      for (const role of objectingRoles) {
        const speech = await consultAgent(role, compromiseDirective, groundingContext, results);
        results.push({ ...speech, isReVote: true });
        votes[role] = speech.approved;
        newApprovals += speech.approved;
        emitPacket({ status: 'AGENT_SPEECH', name: `${speech.name} (Re-Vote)`, avatar: speech.avatar, opinion: speech.opinion, approved: speech.approved });
      }

      verdict = newApprovals >= 6 ? 'APPROVED' : 'REJECTED_AFTER_NEGOTIATION';
      emitPacket({ status: 'DEBATE_COMPLETE', verdict, totalApprovals: newApprovals });
      console.log(`[Boardroom Engine] Negotiation concluded. Verdict: ${verdict} (${newApprovals}/10 Approvals)`);
    } catch (err) {
      console.error('[Boardroom Engine] Veto Negotiation Loop failed:', err);
      emitPacket({ status: 'DEBATE_COMPLETE', verdict: 'REJECTED', totalApprovals });
    }
  } else {
    emitPacket({ status: 'DEBATE_COMPLETE', verdict, totalApprovals });
  }

  // Archive boardroom session in MongoDB Atlas
  try {
    const db = getDB();
    await db.collection('boardroom_sessions').insertOne({
      directive,
      verdict,
      totalApprovals,
      businessDNA,
      transcript: results,
      timestamp: new Date()
    });
    console.log('[Boardroom Engine] Swarm consensus session archived in MongoDB Atlas.');
  } catch (error) {
    console.error('[Boardroom Engine] Failed to archive session in MongoDB:', error);
  }
}

// Refactor: CEO vote threshold constant check

// Refactor: stage 1 assessment variables

// Refactor: negotiation loop objections mapping

// Refactor: boardroom session mongo documents structure
