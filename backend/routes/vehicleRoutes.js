import express from 'express';
import { DatabaseService } from '../database.js';

const router = express.Router();

// Track vehicle position
router.post('/', async (req, res) => {
  try {
    const { vehicleId, city, vehicleData } = req.body;
    
    if (!vehicleId || !city || !vehicleData) {
      return res.status(400).json({ error: 'Missing required fields: vehicleId, city, vehicleData' });
    }

    await DatabaseService.trackVehicle(vehicleId, city, vehicleData);
    res.status(201).json({ success: true, message: 'Vehicle position tracked' });
  } catch (error) {
    console.error('Track vehicle error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get vehicle tracking history
router.get('/:vehicleId/history', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { hours = 24 } = req.query;
    
    const history = await DatabaseService.getVehicleHistory(vehicleId, parseInt(hours));
    res.status(200).json(history);
  } catch (error) {
    console.error('Get vehicle history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all recent vehicle positions for a city
router.get('/city/:city/recent', async (req, res) => {
  try {
    const { city } = req.params;
    const { minutes = 5 } = req.query;
    
    const cityId = await DatabaseService.getCityId(city);
    if (!cityId) {
      return res.status(404).json({ error: 'City not found' });
    }

    // Get recent vehicle positions (last 5 minutes by default)
    const db = await import('../database.js').then(m => m.getDatabase());
    const recentVehicles = await db.all(`
      SELECT DISTINCT vehicle_id, vehicle_type, location_x, location_y, speed, direction, is_broken_down, 
             MAX(timestamp) as last_seen
      FROM vehicle_tracking 
      WHERE city_id = ? AND timestamp >= datetime('now', '-${parseInt(minutes)} minutes')
      GROUP BY vehicle_id
      ORDER BY last_seen DESC
    `, [cityId]);

    res.status(200).json(recentVehicles);
  } catch (error) {
    console.error('Get recent vehicles error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update vehicle status (e.g., breakdown)
router.patch('/:vehicleId/status', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { city, isBrokenDown, vehicleType, location, speed, direction } = req.body;
    
    if (!city) {
      return res.status(400).json({ error: 'City is required' });
    }

    // Create updated vehicle data
    const vehicleData = {
      type: vehicleType || 'CAR',
      x: location?.x || 0,
      y: location?.y || 0,
      speed: speed || 0,
      dir: direction || 'N',
      isBrokenDown: isBrokenDown || false
    };

    await DatabaseService.trackVehicle(vehicleId, city, vehicleData);
    res.status(200).json({ success: true, message: 'Vehicle status updated' });
  } catch (error) {
    console.error('Update vehicle status error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get vehicle statistics for a city
router.get('/city/:city/stats', async (req, res) => {
  try {
    const { city } = req.params;
    const { hours = 1 } = req.query;
    
    const cityId = await DatabaseService.getCityId(city);
    if (!cityId) {
      return res.status(404).json({ error: 'City not found' });
    }

    const db = await import('../database.js').then(m => m.getDatabase());
    
    // Get vehicle statistics
    const [totalVehicles, avgSpeed, vehicleTypes, brokenDownCount] = await Promise.all([
      db.get(`
        SELECT COUNT(DISTINCT vehicle_id) as count 
        FROM vehicle_tracking 
        WHERE city_id = ? AND timestamp >= datetime('now', '-${parseInt(hours)} hours')
      `, [cityId]),
      
      db.get(`
        SELECT AVG(speed) as avg_speed 
        FROM vehicle_tracking 
        WHERE city_id = ? AND timestamp >= datetime('now', '-${parseInt(hours)} hours')
      `, [cityId]),
      
      db.all(`
        SELECT vehicle_type, COUNT(DISTINCT vehicle_id) as count 
        FROM vehicle_tracking 
        WHERE city_id = ? AND timestamp >= datetime('now', '-${parseInt(hours)} hours')
        GROUP BY vehicle_type
      `, [cityId]),
      
      db.get(`
        SELECT COUNT(DISTINCT vehicle_id) as count 
        FROM vehicle_tracking 
        WHERE city_id = ? AND is_broken_down = 1 AND timestamp >= datetime('now', '-${parseInt(hours)} hours')
      `, [cityId])
    ]);

    res.status(200).json({
      totalVehicles: totalVehicles.count || 0,
      avgSpeed: Math.round((avgSpeed.avg_speed || 0) * 100) / 100,
      vehicleTypes: vehicleTypes,
      brokenDownCount: brokenDownCount.count || 0
    });
  } catch (error) {
    console.error('Get vehicle stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;