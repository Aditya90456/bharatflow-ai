import express from 'express';
import gpsApiService from '../services/gpsApiService.js';

const router = express.Router();

// Get current GPS location
router.post('/location', async (req, res) => {
  try {
    const { deviceId, options = {} } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }

    const location = await gpsApiService.getCurrentLocation(deviceId, options);
    
    res.json({
      deviceId,
      location,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('GPS location error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start GPS tracking
router.post('/tracking/start', async (req, res) => {
  try {
    const { deviceId, options = {} } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }

    const trackingSession = await gpsApiService.startTracking(deviceId, options);
    
    res.json({
      success: true,
      tracking: trackingSession
    });

  } catch (error) {
    console.error('GPS tracking start error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop GPS tracking
router.post('/tracking/stop', async (req, res) => {
  try {
    const { deviceId } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }

    const result = await gpsApiService.stopTracking(deviceId);
    
    res.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('GPS tracking stop error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tracking status
router.get('/tracking/status/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const status = gpsApiService.getTrackingStatus(deviceId);
    
    res.json({
      deviceId,
      status
    });

  } catch (error) {
    console.error('GPS tracking status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all tracking sessions
router.get('/tracking/sessions', async (req, res) => {
  try {
    const sessions = gpsApiService.getAllTrackingSessions();
    
    res.json({
      totalSessions: sessions.length,
      sessions
    });

  } catch (error) {
    console.error('GPS tracking sessions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reverse geocoding
router.post('/geocode/reverse', async (req, res) => {
  try {
    const { lat, lng, provider = 'auto' } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const address = await gpsApiService.reverseGeocode(lat, lng, provider);
    
    res.json({
      coordinates: { lat, lng },
      address,
      provider
    });

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get GPS location history
router.get('/history/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { hours = 24, limit = 1000 } = req.query;
    
    const db = await import('../database.js').then(m => m.getDatabase());
    
    const timeLimit = Date.now() - (parseInt(hours) * 60 * 60 * 1000);
    
    const locations = await db.all(`
      SELECT * FROM gps_locations 
      WHERE device_id = ? AND timestamp >= ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `, [deviceId, timeLimit, parseInt(limit)]);

    const processedLocations = locations.map(loc => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
      accuracy: loc.accuracy,
      altitude: loc.altitude,
      speed: loc.speed,
      heading: loc.heading,
      timestamp: loc.timestamp,
      address: JSON.parse(loc.address || '{}'),
      qualityScore: loc.quality_score
    }));

    res.json({
      deviceId,
      timeRange: `${hours} hours`,
      totalLocations: processedLocations.length,
      locations: processedLocations
    });

  } catch (error) {
    console.error('GPS history error:', error);
    res.status(500).json({ error: 'Failed to get GPS history' });
  }
});

// Get GPS statistics
router.get('/stats/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { hours = 24 } = req.query;
    
    const db = await import('../database.js').then(m => m.getDatabase());
    
    const timeLimit = Date.now() - (parseInt(hours) * 60 * 60 * 1000);
    
    const [locationCount, avgAccuracy, avgSpeed, qualityStats] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM gps_locations WHERE device_id = ? AND timestamp >= ?', [deviceId, timeLimit]),
      db.get('SELECT AVG(accuracy) as avg_accuracy FROM gps_locations WHERE device_id = ? AND timestamp >= ?', [deviceId, timeLimit]),
      db.get('SELECT AVG(speed) as avg_speed FROM gps_locations WHERE device_id = ? AND timestamp >= ? AND speed IS NOT NULL', [deviceId, timeLimit]),
      db.get('SELECT AVG(quality_score) as avg_quality FROM gps_locations WHERE device_id = ? AND timestamp >= ?', [deviceId, timeLimit])
    ]);

    res.json({
      deviceId,
      timeRange: `${hours} hours`,
      statistics: {
        totalLocations: locationCount.count || 0,
        averageAccuracy: Math.round((avgAccuracy.avg_accuracy || 0) * 100) / 100,
        averageSpeed: Math.round((avgSpeed.avg_speed || 0) * 100) / 100,
        averageQuality: Math.round((qualityStats.avg_quality || 0) * 100) / 100
      }
    });

  } catch (error) {
    console.error('GPS stats error:', error);
    res.status(500).json({ error: 'Failed to get GPS statistics' });
  }
});

// Batch location request for multiple devices
router.post('/locations/batch', async (req, res) => {
  try {
    const { deviceIds, options = {} } = req.body;
    
    if (!deviceIds || !Array.isArray(deviceIds)) {
      return res.status(400).json({ error: 'Device IDs array is required' });
    }

    const locations = await Promise.all(
      deviceIds.map(async (deviceId) => {
        try {
          const location = await gpsApiService.getCurrentLocation(deviceId, options);
          return {
            deviceId,
            location,
            success: true
          };
        } catch (error) {
          return {
            deviceId,
            error: error.message,
            success: false
          };
        }
      })
    );

    const successful = locations.filter(l => l.success);
    const failed = locations.filter(l => !l.success);

    res.json({
      totalRequested: deviceIds.length,
      successful: successful.length,
      failed: failed.length,
      locations: successful,
      errors: failed
    });

  } catch (error) {
    console.error('Batch GPS location error:', error);
    res.status(500).json({ error: 'Failed to get batch locations' });
  }
});

export default router;