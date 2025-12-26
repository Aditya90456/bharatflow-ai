import express from 'express';
import { DatabaseService } from '../database.js';

const router = express.Router();

// Detect traffic jams using AI analysis
router.post('/detect', async (req, res) => {
  try {
    const { city, intersectionData, trafficData } = req.body;
    
    if (!city || !intersectionData) {
      return res.status(400).json({ error: 'Missing required fields: city, intersectionData' });
    }

    // Basic jam detection logic (can be enhanced with ML)
    const jams = [];
    
    for (const intersection of intersectionData) {
      const totalQueue = (intersection.nsQueue || 0) + (intersection.ewQueue || 0);
      const avgSpeed = trafficData?.avgSpeed || 0;
      
      // Simple heuristic: high queue + low speed = jam
      if (totalQueue > 15 && avgSpeed < 2) {
        jams.push({
          intersectionId: intersection.id,
          label: intersection.label,
          severity: totalQueue > 25 ? 'HIGH' : 'MEDIUM',
          queueLength: totalQueue,
          estimatedDelay: Math.round(totalQueue * 0.5), // minutes
          timestamp: new Date().toISOString()
        });
      }
    }

    // Store jam detection results
    for (const jam of jams) {
      await DatabaseService.recordIncident(city, {
        type: 'TRAFFIC_JAM',
        severity: jam.severity,
        location: jam.label,
        description: `Traffic jam detected with ${jam.queueLength} vehicles queued`,
        metadata: jam
      });
    }

    res.status(200).json({
      success: true,
      jamsDetected: jams.length,
      jams: jams
    });
  } catch (error) {
    console.error('Jam detection error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current traffic jams for a city
router.get('/city/:city/current', async (req, res) => {
  try {
    const { city } = req.params;
    
    const cityId = await DatabaseService.getCityId(city);
    if (!cityId) {
      return res.status(404).json({ error: 'City not found' });
    }

    const db = await import('../database.js').then(m => m.getDatabase());
    
    // Get recent traffic jam incidents (last 30 minutes)
    const jams = await db.all(`
      SELECT * FROM incidents 
      WHERE city_id = ? 
        AND incident_type = 'TRAFFIC_JAM' 
        AND timestamp >= datetime('now', '-30 minutes')
        AND status = 'ACTIVE'
      ORDER BY timestamp DESC
    `, [cityId]);

    res.status(200).json(jams);
  } catch (error) {
    console.error('Get current jams error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear/resolve a traffic jam
router.patch('/:jamId/resolve', async (req, res) => {
  try {
    const { jamId } = req.params;
    const { resolvedBy } = req.body;

    const db = await import('../database.js').then(m => m.getDatabase());
    
    await db.run(`
      UPDATE incidents 
      SET status = 'RESOLVED', 
          resolved_at = datetime('now'),
          resolved_by = ?
      WHERE id = ? AND incident_type = 'TRAFFIC_JAM'
    `, [resolvedBy || 'SYSTEM', jamId]);

    res.status(200).json({ success: true, message: 'Traffic jam resolved' });
  } catch (error) {
    console.error('Resolve jam error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;