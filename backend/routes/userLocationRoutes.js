import express from 'express';
import { DatabaseService } from '../database.js';

const router = express.Router();

// Initialize database tables for user locations
async function initializeUserLocationTables() {
  const db = DatabaseService.getInstance();
  
  // User locations table
  await db.run(`
    CREATE TABLE IF NOT EXISTS user_locations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      accuracy REAL,
      speed REAL,
      heading REAL,
      vehicle_type TEXT DEFAULT 'CAR',
      status TEXT DEFAULT 'STOPPED',
      timestamp INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // GPS tracking table for historical data
  await db.run(`
    CREATE TABLE IF NOT EXISTS gps_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      accuracy REAL,
      speed REAL,
      heading REAL,
      timestamp INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // User preferences table
  await db.run(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      avoid_tolls BOOLEAN DEFAULT 0,
      avoid_highways BOOLEAN DEFAULT 0,
      prefer_fastest_route BOOLEAN DEFAULT 1,
      notification_enabled BOOLEAN DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  console.log('User location tables initialized');
}

// Initialize tables on startup
initializeUserLocationTables().catch(console.error);

// POST /api/user-locations - Add or update user location
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      name,
      lat,
      lng,
      accuracy,
      speed,
      heading,
      vehicleType = 'CAR',
      status = 'STOPPED'
    } = req.body;

    if (!userId || !name || lat === undefined || lng === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: userId, name, lat, lng'
      });
    }

    const db = DatabaseService.getInstance();
    const timestamp = Date.now();
    const locationId = `user-${userId}-${timestamp}`;

    // Insert or update user location
    await db.run(`
      INSERT OR REPLACE INTO user_locations 
      (id, user_id, name, lat, lng, accuracy, speed, heading, vehicle_type, status, timestamp, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [locationId, userId, name, lat, lng, accuracy, speed, heading, vehicleType, status, timestamp, timestamp]);

    // Also save to GPS tracking for historical data
    await db.run(`
      INSERT INTO gps_tracking 
      (user_id, lat, lng, accuracy, speed, heading, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, lat, lng, accuracy, speed, heading, timestamp]);

    const userLocation = {
      id: locationId,
      userId,
      name,
      lat,
      lng,
      accuracy,
      speed,
      heading,
      vehicleType,
      status,
      timestamp
    };

    res.json({
      success: true,
      userLocation,
      message: 'User location saved successfully'
    });

  } catch (error) {
    console.error('Error saving user location:', error);
    res.status(500).json({
      error: 'Failed to save user location',
      details: error.message
    });
  }
});

// GET /api/user-locations/:userId - Get user's current location
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = DatabaseService.getInstance();

    const userLocation = await db.get(`
      SELECT * FROM user_locations 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `, [userId]);

    if (!userLocation) {
      return res.status(404).json({
        error: 'User location not found'
      });
    }

    res.json({
      success: true,
      userLocation: {
        id: userLocation.id,
        userId: userLocation.user_id,
        name: userLocation.name,
        lat: userLocation.lat,
        lng: userLocation.lng,
        accuracy: userLocation.accuracy,
        speed: userLocation.speed,
        heading: userLocation.heading,
        vehicleType: userLocation.vehicle_type,
        status: userLocation.status,
        timestamp: userLocation.timestamp
      }
    });

  } catch (error) {
    console.error('Error fetching user location:', error);
    res.status(500).json({
      error: 'Failed to fetch user location',
      details: error.message
    });
  }
});

// GET /api/user-locations - Get all active user locations
router.get('/', async (req, res) => {
  try {
    const { city, limit = 50, includeHistory = false } = req.query;
    const db = DatabaseService.getInstance();

    let query = `
      SELECT * FROM user_locations 
      WHERE timestamp > ? 
    `;
    const params = [Date.now() - 5 * 60 * 1000]; // Last 5 minutes

    if (city) {
      // Add city filtering logic if needed
      // For now, we'll return all users
    }

    query += ` ORDER BY timestamp DESC LIMIT ?`;
    params.push(parseInt(limit));

    const userLocations = await db.all(query, params);

    const formattedLocations = userLocations.map(loc => ({
      id: loc.id,
      userId: loc.user_id,
      name: loc.name,
      lat: loc.lat,
      lng: loc.lng,
      accuracy: loc.accuracy,
      speed: loc.speed,
      heading: loc.heading,
      vehicleType: loc.vehicle_type,
      status: loc.status,
      timestamp: loc.timestamp
    }));

    let historicalData = [];
    if (includeHistory === 'true') {
      historicalData = await db.all(`
        SELECT user_id, lat, lng, timestamp 
        FROM gps_tracking 
        WHERE timestamp > ? 
        ORDER BY timestamp DESC 
        LIMIT 1000
      `, [Date.now() - 24 * 60 * 60 * 1000]); // Last 24 hours
    }

    res.json({
      success: true,
      userLocations: formattedLocations,
      count: formattedLocations.length,
      historicalData,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error fetching user locations:', error);
    res.status(500).json({
      error: 'Failed to fetch user locations',
      details: error.message
    });
  }
});

// PUT /api/user-locations/:userId - Update user location
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const db = DatabaseService.getInstance();

    // Get current location
    const currentLocation = await db.get(`
      SELECT * FROM user_locations 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `, [userId]);

    if (!currentLocation) {
      return res.status(404).json({
        error: 'User location not found'
      });
    }

    // Build update query
    const allowedFields = ['name', 'lat', 'lng', 'accuracy', 'speed', 'heading', 'vehicle_type', 'status'];
    const updateFields = [];
    const updateValues = [];

    for (const [key, value] of Object.entries(updates)) {
      const dbField = key === 'vehicleType' ? 'vehicle_type' : key;
      if (allowedFields.includes(dbField)) {
        updateFields.push(`${dbField} = ?`);
        updateValues.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update'
      });
    }

    updateFields.push('updated_at = ?');
    updateValues.push(Date.now());
    updateValues.push(userId);

    await db.run(`
      UPDATE user_locations 
      SET ${updateFields.join(', ')} 
      WHERE user_id = ?
    `, updateValues);

    // Get updated location
    const updatedLocation = await db.get(`
      SELECT * FROM user_locations 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `, [userId]);

    res.json({
      success: true,
      userLocation: {
        id: updatedLocation.id,
        userId: updatedLocation.user_id,
        name: updatedLocation.name,
        lat: updatedLocation.lat,
        lng: updatedLocation.lng,
        accuracy: updatedLocation.accuracy,
        speed: updatedLocation.speed,
        heading: updatedLocation.heading,
        vehicleType: updatedLocation.vehicle_type,
        status: updatedLocation.status,
        timestamp: updatedLocation.timestamp
      },
      message: 'User location updated successfully'
    });

  } catch (error) {
    console.error('Error updating user location:', error);
    res.status(500).json({
      error: 'Failed to update user location',
      details: error.message
    });
  }
});

// DELETE /api/user-locations/:userId - Remove user location
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = DatabaseService.getInstance();

    await db.run('DELETE FROM user_locations WHERE user_id = ?', [userId]);
    
    res.json({
      success: true,
      message: 'User location removed successfully'
    });

  } catch (error) {
    console.error('Error removing user location:', error);
    res.status(500).json({
      error: 'Failed to remove user location',
      details: error.message
    });
  }
});

// GET /api/user-locations/:userId/history - Get user's GPS history
router.get('/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { hours = 24, limit = 1000 } = req.query;
    const db = DatabaseService.getInstance();

    const timeLimit = Date.now() - (parseInt(hours) * 60 * 60 * 1000);

    const gpsHistory = await db.all(`
      SELECT lat, lng, accuracy, speed, heading, timestamp 
      FROM gps_tracking 
      WHERE user_id = ? AND timestamp > ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `, [userId, timeLimit, parseInt(limit)]);

    res.json({
      success: true,
      userId,
      gpsHistory,
      count: gpsHistory.length,
      timeRange: {
        hours: parseInt(hours),
        from: timeLimit,
        to: Date.now()
      }
    });

  } catch (error) {
    console.error('Error fetching GPS history:', error);
    res.status(500).json({
      error: 'Failed to fetch GPS history',
      details: error.message
    });
  }
});

// POST /api/user-locations/:userId/preferences - Update user preferences
router.post('/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      avoidTolls = false,
      avoidHighways = false,
      preferFastestRoute = true,
      notificationEnabled = true
    } = req.body;

    const db = DatabaseService.getInstance();

    await db.run(`
      INSERT OR REPLACE INTO user_preferences 
      (user_id, avoid_tolls, avoid_highways, prefer_fastest_route, notification_enabled, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, avoidTolls, avoidHighways, preferFastestRoute, notificationEnabled, Date.now()]);

    res.json({
      success: true,
      preferences: {
        avoidTolls,
        avoidHighways,
        preferFastestRoute,
        notificationEnabled
      },
      message: 'User preferences updated successfully'
    });

  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({
      error: 'Failed to update user preferences',
      details: error.message
    });
  }
});

export default router;