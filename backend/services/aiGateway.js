import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDB } from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

let genAI = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

/**
 * Log AI latency, provider used, and fallback status to MongoDB
 */
export async function logAIDiagnostic(provider, latencyMs, success, error = null) {
  try {
    const db = getDB();
    await db.collection('diagnostics').insertOne({
      provider,
      latencyMs,
      success,
      error: error ? error.message || String(error) : null,
      timestamp: new Date()
    });
  } catch (err) {
    console.warn('[AI Diagnostics] Failed to write metrics to MongoDB:', err.message);
  }
}

/**
 * Generate text using primary Gemini model with fallback to NVIDIA NIM
 */
export async function generateText(systemPrompt, userPrompt) {
  const startTime = Date.now();

  // Try Gemini First
  if (GEMINI_API_KEY && genAI) {
    try {
      console.log('[AI Gateway] Attempting generation via Google Gemini...');
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
      const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
      const text = result.response.text();
      
      const latency = Date.now() - startTime;
      await logAIDiagnostic('GEMINI', latency, true);
      return text;
    } catch (err) {
      console.warn('[AI Gateway] Gemini API call failed or rate-limited. Falling back to NVIDIA NIM...', err);
      await logAIDiagnostic('GEMINI', Date.now() - startTime, false, err);
    }
  }

  // Fallback to NVIDIA NIM
  if (NVIDIA_API_KEY) {
    try {
      console.log('[AI Gateway] Attempting generation via NVIDIA NIM (llama-3.1-70b-instruct)...');
      const nimStartTime = Date.now();
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NVIDIA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta/llama-3.1-70b-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`NVIDIA NIM returned status: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices[0].message.content;
      
      const latency = Date.now() - nimStartTime;
      await logAIDiagnostic('NVIDIA_NIM', latency, true);
      console.log('[AI Gateway] NVIDIA NIM generation successful.');
      return text;
    } catch (err) {
      console.error('[AI Gateway] Fallback to NVIDIA NIM failed:', err);
      await logAIDiagnostic('NVIDIA_NIM', Date.now() - startTime, false, err);
      throw new Error(`AI Generation Error: Both Gemini and NVIDIA NIM backends failed. Details: ${err.message}`);
    }
  }

  throw new Error('AI Generation Error: No configured API keys found for Gemini or NVIDIA NIM.');
}

/**
 * Regular Expression parser to extract clean JSON blocks from conversational model outputs
 */
export function parseJSONResponse(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (err) {
    console.error('Failed to parse JSON response. Raw text:', text);
    throw new Error('Model response did not contain valid JSON content.');
  }
}

// Refactor: optimize NIM request payload headers

// Refactor: model string constant check

// Refactor: error logging mapping

// Refactor: regex JSON parser robustness
