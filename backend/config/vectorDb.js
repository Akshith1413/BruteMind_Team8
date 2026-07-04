import { getDB } from './db.js';

// Local temporary document cache in memory (fallback)
let documentIndex = [];

/**
 * Sync document segments from MongoDB or memory
 */
export async function syncMemoryIndex() {
  try {
    const db = getDB();
    let segments = await db.collection('memory_segments').find({}).toArray();
    
    // Seed default clinical guidelines if database collection is empty
    if (segments.length === 0) {
      console.log('[RAG Memory] Database index is empty. Seeding default clinical guidelines...');
      const defaultDocs = [
        {
          id: 'default_guideline_01',
          filename: 'default_clinical_governance.txt',
          content: 'Clinical gene therapy modeling for Cohort Alpha and Cohort Delta requires strict monitoring. Neural synchronization targets should hover between 95% and 99%. Budget overheads for biotechnology modeling must allocate at least 40% of funds to clean-room equipment maintenance.',
          terms: tokenize('Clinical gene therapy modeling for Cohort Alpha and Cohort Delta requires strict monitoring. Neural synchronization targets should hover between 95% and 99%. Budget overheads for biotechnology modeling must allocate at least 40% of funds to clean-room equipment maintenance.'),
          created_at: new Date()
        },
        {
          id: 'default_guideline_02',
          filename: 'default_regulatory_compliance.txt',
          content: 'Any genomic engineering or patient onboarding directive must secure a full Legal review audit. Marketing campaigns targeting biotech audiences must not publish untested clinical stats without a verified board sign-off to ensure HIPAA compliance.',
          terms: tokenize('Any genomic engineering or patient onboarding directive must secure a full Legal review audit. Marketing campaigns targeting biotech audiences must not publish untested clinical stats without a verified board sign-off to ensure HIPAA compliance.'),
          created_at: new Date()
        }
      ];
      await db.collection('memory_segments').insertMany(defaultDocs);
      segments = await db.collection('memory_segments').find({}).toArray();
    }

    documentIndex = segments;
    console.log(`[RAG Memory] Synced ${documentIndex.length} semantic vectors from database.`);
  } catch (err) {
    console.warn('[RAG Memory] MongoDB connection unavailable during sync. Using local cache.');
  }
}

/**
 * Ingest document file contents, slice into chunks, and index them
 * @param {string} filename Name of file
 * @param {string} content Raw text content
 */
export async function ingestDocument(filename, content) {
  const chunks = content
    .split(/\n\s*\n/) // Split by double newlines (paragraphs)
    .map(c => c.trim())
    .filter(c => c.length > 20); // Filter out trivial chunks

  const segments = chunks.map((chunk, idx) => ({
    id: `${filename}_chunk_${idx}`,
    filename,
    content: chunk,
    terms: tokenize(chunk),
    created_at: new Date()
  }));

  try {
    const db = getDB();
    await db.collection('memory_segments').insertMany(segments);
    await syncMemoryIndex();
  } catch (err) {
    console.warn('[RAG Memory] Failed to save chunks to MongoDB. Indexing in memory cache only.');
    documentIndex.push(...segments);
  }

  console.log(`[RAG Memory] Ingested "${filename}" - created ${segments.length} chunks.`);
  return segments.length;
}

/**
 * Query index using TF-IDF similarity algorithm
 * @param {string} query Search terms
 * @param {number} limit Maximum results to return
 * @returns {Array} List of matched document fragments
 */
export function queryMemory(query, limit = 3) {
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0 || documentIndex.length === 0) return [];

  // TF-IDF Calculation
  const docCount = documentIndex.length;
  
  // Calculate document frequencies (DF) for each query term
  const df = {};
  queryTerms.forEach(term => {
    let count = 0;
    documentIndex.forEach(doc => {
      if (doc.terms.includes(term)) count++;
    });
    df[term] = count;
  });

  const scoredDocs = documentIndex.map(doc => {
    let score = 0;
    
    queryTerms.forEach(term => {
      // Term Frequency (TF) in current doc
      const tf = doc.terms.filter(t => t === term).length;
      if (tf > 0) {
        // Inverse Document Frequency (IDF)
        const idf = Math.log((docCount + 1) / (df[term] + 1)) + 1;
        score += tf * idf;
      }
    });

    return { ...doc, score };
  });

  // Sort and filter results
  return scoredDocs
    .filter(doc => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(doc => ({
      filename: doc.filename,
      content: doc.content,
      score: parseFloat(doc.score.toFixed(3))
    }));
}

/**
 * Tokenization and basic stop-words filter
 */
function tokenize(text) {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'about']);
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

// Refactor: sync default seeder check

// Refactor: default guidelines formatting
