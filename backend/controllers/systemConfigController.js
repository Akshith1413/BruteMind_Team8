import { getDB } from '../config/db.js';

/**
 * Get the current model routing configuration
 * GET /api/system/config
 */
export async function getSystemConfig(req, res) {
  try {
    const db = getDB();
    let config = await db.collection('system_config').findOne({ key: 'system_config' });
    
    if (!config) {
      config = {
        key: 'system_config',
        routingMode: 'auto', // 'offline' | 'auto' | 'manual'
        manualProvider: 'nvidia', // 'nvidia' | 'groq'
        updatedAt: new Date()
      };
      await db.collection('system_config').insertOne(config);
    }
    
    return res.status(200).json(config);
  } catch (error) {
    console.error('[System Config] Error fetching configuration:', error);
    return res.status(500).json({ error: 'Internal Server Error fetching config.' });
  }
}

/**
 * Update the model routing configuration
 * POST /api/system/config
 */
export async function updateSystemConfig(req, res) {
  try {
    const { routingMode, manualProvider } = req.body;
    
    if (!routingMode || !['offline', 'auto', 'manual'].includes(routingMode)) {
      return res.status(400).json({ error: 'Invalid routing mode selection. Must be auto, offline, or manual.' });
    }
    
    if (routingMode === 'manual' && (!manualProvider || !['nvidia', 'groq'].includes(manualProvider))) {
      return res.status(400).json({ error: 'Manual provider selection must be nvidia or groq.' });
    }

    const db = getDB();
    const updated = {
      routingMode,
      manualProvider: manualProvider || 'nvidia',
      updatedAt: new Date()
    };

    await db.collection('system_config').updateOne(
      { key: 'system_config' },
      { $set: updated },
      { upsrap: true, upsert: true }
    );

    console.log(`[System Config] Routing mode updated globally to: ${routingMode} (${manualProvider || 'N/A'})`);
    return res.status(200).json({ message: 'System model routing configuration updated successfully.', config: updated });
  } catch (error) {
    console.error('[System Config] Error updating configuration:', error);
    return res.status(500).json({ error: 'Internal Server Error updating config.' });
  }
}
