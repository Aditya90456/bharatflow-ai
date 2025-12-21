import express from 'express';
import { DatabaseService } from '../database.js';

const router = express.Router();

// In-memory storage for live location streams
const liveLocationStreams = new Map();
const locationUpdateBuffer = new Map();

// Helper function to generate realistic vehicle movement
function generateVehicleMovement(city, count = 50) {
  const vehicles = [];
  const cityBounds = {
    'Bangalore': { minX: 0, maxX: 800, minY: 0, maxY: 600 },
    'Mumbai': { minX: 0, maxX: 900, minY: 0, maxY: 700 },
    'Delhi': { minX: 0, maxX: 1000, minY: 0, maxY: 800 },
    'Chennai': { minX: 0, maxX: 750, minY: 0, maxY: 550 },
    'Hyderabad': { minX: 0, maxX: 850, minY: 0, maxY: 650 },
    'Kolkata': { minX: 0, maxX: 700, minY: 0, maxY: 500 },
    'Pune': { minX: 0, maxX: 600, minY: 0, maxY: 450 }
  };

  const bounds = cityBounds[city] || cityBounds['Bangalore'];
  const vehicleTypes = ['CAR', 'AUTO', 'BUS', 'POLICE'];
  const directions = ['N', 'S', 'E', 'W'];

  for (let i = 0; i < count; i++) {
    const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
    const isPolice = vehicleType === 'POLICE';
    
    vehicles.push({
      id: `LIVE-${city}-${i + 1}`,
      type: vehicleType,
      x: Math.random() * (bounds.maxX - bounds.minX) + bounds.minX,
      y: Math.random() * (bounds.maxY - bounds.minY) + bounds.minY,
      speed: Math.random() * 5 + 1, // 1-6 speed units
      direction: directions[Math.floor(Math.random() * directions.length)],
      isBrokenDown: Math.random() < 0.02, // 2% chance of breakdown
      mission: isPolice ? {
        type: Math.random() > 0.7 ? 'RESPONSE' : 'PATROL',
        targetId: null
      } : null,
      timestamp: Date.now(),
      lastUpdate: Date.now()
    });
  }

  return vehicles;
}

// Update vehicle positions with realistic movement
function updateVehiclePositions(vehicles, city) {
  const cityBounds = {
    'Bangalore': { minX: 0, maxX: 800, minY: 0, maxY: 600 },
    'Mumbai': { minX: 0, maxX: 900, minY: 0, maxY: 700 },
    'Delhi': { minX: 0, maxX: 1000, minY: 0, maxY: 800 },
    'Chennai': { minX: 0, maxX: 750, minY: 0, maxY: 550 },
    'Hyderabad': { minX: 0, maxX: 850, minY: 0, maxY: 650 },
    'Kolkata': { minX: 0, maxX: 700, minY: 0, maxY: 500 },
    'Pune': { minX: 0, maxX: 600, minY: 0, maxY: 450 }
  };

  const bounds = cityBounds[city] || cityBounds['Bangalore'];
  const now = Date.now();

  return vehicles.map(vehicle => {
    if (vehicle.isBrokenDown) {
      // Broken down vehicles don't move
      return { ...vehicle, speed: 0, lastUpdate: now };
    }

    let { x, y, direction, speed } = vehicle;
    
    // Add some randomness to movement
    const speedVariation = (Math.random() - 0.5) * 0.5;
    const actualSpeed = Math.max(0.5, speed + speedVariation);
    
    // Move based on direction
    switch (direction) {
      case 'N':
        y -= actualSpeed;
        if (y < bounds.minY) {
          y = bounds.maxY;
          direction = Math.random() > 0.5 ? 'E' : 'W';
        }
        break;
      case 'S':
        y += actualSpeed;
        if (y > bounds.maxY) {
          y = bounds.minY;
          direction = Math.random() > 0.5 ? 'E' : 'W';
        }
        break;
      case 'E':
        x += actualSpeed;
        if (x > bounds.maxX) {
          x = bounds.minX;
          direction = Math.random() > 0.5 ? 'N' : 'S';
        }
        break;
      case 'W':
        x -= actualSpeed;
        if (x < bounds.minX) {
          x = bounds.maxX;
          direction = Math.random() > 0.5 ? 'N' : 'S';
        }
        break;
    }

    // Occasionally change direction at intersections
    if (Math.random() < 0.05) { // 5% chance
      const directions = ['N', 'S', 'E', 'W'];
      direction = directions[Math.floor(Math.random() * directions.length)];
    }

    // Occasionally break down
    const isBrokenDown = vehicle.isBrokenDown || (Math.random() < 0.0001); // Very low chance

    return {
      ...vehicle,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      direction,
      speed: isBrokenDown ? 0 : actualSpeed,
      isBrokenDown,
      lastUpdate: now
    };
  });
}

// GET /api/live-locations/:city - Get current live vehicle locations
router.get('/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { includeHistory = false, vehicleTypes, limit = 100 } = req.query;

    // Check if we have live data for this city
    let vehicles = liveLocationStreams.get(city);
    
    if (!vehicles) {
      // Generate initial vehicle data
      vehicles = generateVehicleMovement(city, parseInt(limit));
      liveLocationStreams.set(city, vehicles);
    }

    // Filter by vehicle types if specified
    let filteredVehicles = vehicles;
    if (vehicleTypes) {
      const types = vehicleTypes.split(',').map(t => t.toUpperCase());
      filteredVehicles = vehicles.filter(v => types.includes(v.type));
    }

    // Include historical data if requested
    let historicalData = null;
    if (includeHistory === 'true') {
      try {
        const cityId = await DatabaseService.getCityId(city);
        if (cityId) {
          const db = await import('../database.js').then(m => m.getDatabase());
          historicalData = await db.all(`
            SELECT vehicle_id, vehicle_type, location_x, location_y, speed, direction, 
                   is_broken_down, timestamp
            FROM vehicle_tracking 
            WHERE city_id = ? AND timestamp >= datetime('now', '-1 hour')
            ORDER BY timestamp DESC
            LIMIT 500
          `, [cityId]);
        }
      } catch (error) {
        console.warn('Failed to fetch historical data:', error);
      }
    }

    res.json({
      city,
      timestamp: Date.now(),
      vehicleCount: filteredVehicles.length,
      vehicles: filteredVehicles,
      historicalData,
      bounds: {
        'Bangalore': { minX: 0, maxX: 800, minY: 0, maxY: 600 },
        'Mumbai': { minX: 0, maxX: 900, minY: 0, maxY: 700 },
        'Delhi': { minX: 0, maxX: 1000, minY: 0, maxY: 800 },
        'Chennai': { minX: 0, maxX: 750, minY: 0, maxY: 550 },
        'Hyderabad': { minX: 0, maxX: 850, minY: 0, maxY: 650 },
        'Kolkata': { minX: 0, maxX: 700, minY: 0, maxY: 500 },
        'Pune': { minX: 0, maxX: 600, minY: 0, maxY: 450 }
      }[city] || { minX: 0, maxX: 800, minY: 0, maxY: 600 }
    });
  } catch (error) {
    console.error('Get live locations error:', error);
    res.status(500).json({ error: 'Failed to fetch live locations' });
  }
});

// GET /api/live-locations/:city/stream - Server-Sent Events stream for real-time updates
router.get('/:city/stream', (req, res) => {
  const { city } = req.params;
  const { interval = 2000, vehicleTypes } = req.query; // Default 2 second updates

  // Set headers for Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Initialize vehicles if not exists
  if (!liveLocationStreams.has(city)) {
    const vehicles = generateVehicleMovement(city, 80);
    liveLocationStreams.set(city, vehicles);
  }

  // Send initial data
  let vehicles = liveLocationStreams.get(city);
  let filteredVehicles = vehicles;
  
  if (vehicleTypes) {
    const types = vehicleTypes.split(',').map(t => t.toUpperCase());
    filteredVehicles = vehicles.filter(v => types.includes(v.type));
  }

  res.write(`data: ${JSON.stringify({
    type: 'initial',
    city,
    timestamp: Date.now(),
    vehicleCount: filteredVehicles.length,
    vehicles: filteredVehicles
  })}\n\n`);

  // Set up interval for streaming updates
  const streamInterval = setInterval(() => {
    try {
      // Update vehicle positions
      vehicles = updateVehiclePositions(vehicles, city);
      liveLocationStreams.set(city, vehicles);

      // Filter vehicles if needed
      filteredVehicles = vehicles;
      if (vehicleTypes) {
        const types = vehicleTypes.split(',').map(t => t.toUpperCase());
        filteredVehicles = vehicles.filter(v => types.includes(v.type));
      }

      // Send update
      res.write(`data: ${JSON.stringify({
        type: 'update',
        city,
        timestamp: Date.now(),
        vehicleCount: filteredVehicles.length,
        vehicles: filteredVehicles,
        stats: {
          totalVehicles: vehicles.length,
          avgSpeed: vehicles.reduce((sum, v) => sum + v.speed, 0) / vehicles.length,
          brokenDownCount: vehicles.filter(v => v.isBrokenDown).length,
          policeUnits: vehicles.filter(v => v.type === 'POLICE').length
        }
      })}\n\n`);
    } catch (error) {
      console.error('Stream update error:', error);
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: 'Stream update failed',
        timestamp: Date.now()
      })}\n\n`);
    }
  }, parseInt(interval));

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(streamInterval);
    console.log(`Live locations stream closed for ${city}`);
  });

  req.on('end', () => {
    clearInterval(streamInterval);
    console.log(`Live locations stream ended for ${city}`);
  });
});

// POST /api/live-locations/:city/vehicle - Add or update a specific vehicle
router.post('/:city/vehicle', async (req, res) => {
  try {
    const { city } = req.params;
    const { vehicleId, type, x, y, speed, direction, isBrokenDown, mission } = req.body;

    if (!vehicleId || !type || x === undefined || y === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: vehicleId, type, x, y' 
      });
    }

    // Get or create vehicles array for city
    let vehicles = liveLocationStreams.get(city) || [];
    
    // Find existing vehicle or create new one
    const existingIndex = vehicles.findIndex(v => v.id === vehicleId);
    const vehicleData = {
      id: vehicleId,
      type: type.toUpperCase(),
      x: parseFloat(x),
      y: parseFloat(y),
      speed: parseFloat(speed) || 0,
      direction: direction || 'N',
      isBrokenDown: Boolean(isBrokenDown),
      mission: mission || null,
      timestamp: Date.now(),
      lastUpdate: Date.now()
    };

    if (existingIndex >= 0) {
      vehicles[existingIndex] = vehicleData;
    } else {
      vehicles.push(vehicleData);
    }

    liveLocationStreams.set(city, vehicles);

    // Also save to database for historical tracking
    try {
      await DatabaseService.trackVehicle(vehicleId, city, {
        type: vehicleData.type,
        x: vehicleData.x,
        y: vehicleData.y,
        speed: vehicleData.speed,
        dir: vehicleData.direction,
        isBrokenDown: vehicleData.isBrokenDown
      });
    } catch (dbError) {
      console.warn('Failed to save vehicle to database:', dbError);
    }

    res.json({
      success: true,
      message: 'Vehicle location updated',
      vehicle: vehicleData
    });
  } catch (error) {
    console.error('Update vehicle location error:', error);
    res.status(500).json({ error: 'Failed to update vehicle location' });
  }
});

// DELETE /api/live-locations/:city/vehicle/:vehicleId - Remove a vehicle
router.delete('/:city/vehicle/:vehicleId', (req, res) => {
  try {
    const { city, vehicleId } = req.params;
    
    let vehicles = liveLocationStreams.get(city) || [];
    const initialLength = vehicles.length;
    
    vehicles = vehicles.filter(v => v.id !== vehicleId);
    liveLocationStreams.set(city, vehicles);

    const removed = initialLength > vehicles.length;

    res.json({
      success: true,
      message: removed ? 'Vehicle removed' : 'Vehicle not found',
      removed,
      remainingCount: vehicles.length
    });
  } catch (error) {
    console.error('Remove vehicle error:', error);
    res.status(500).json({ error: 'Failed to remove vehicle' });
  }
});

// GET /api/live-locations/:city/stats - Get live traffic statistics
router.get('/:city/stats', (req, res) => {
  try {
    const { city } = req.params;
    const vehicles = liveLocationStreams.get(city) || [];

    if (vehicles.length === 0) {
      return res.json({
        city,
        timestamp: Date.now(),
        totalVehicles: 0,
        avgSpeed: 0,
        vehicleTypes: {},
        brokenDownCount: 0,
        policeUnits: 0,
        congestionLevel: 0
      });
    }

    // Calculate statistics
    const totalVehicles = vehicles.length;
    const avgSpeed = vehicles.reduce((sum, v) => sum + v.speed, 0) / totalVehicles;
    const brokenDownCount = vehicles.filter(v => v.isBrokenDown).length;
    const policeUnits = vehicles.filter(v => v.type === 'POLICE').length;

    // Vehicle type distribution
    const vehicleTypes = {};
    vehicles.forEach(v => {
      vehicleTypes[v.type] = (vehicleTypes[v.type] || 0) + 1;
    });

    // Simple congestion calculation based on slow-moving vehicles
    const slowVehicles = vehicles.filter(v => v.speed < 2 && !v.isBrokenDown).length;
    const congestionLevel = Math.min(100, (slowVehicles / totalVehicles) * 100);

    res.json({
      city,
      timestamp: Date.now(),
      totalVehicles,
      avgSpeed: Math.round(avgSpeed * 100) / 100,
      vehicleTypes,
      brokenDownCount,
      policeUnits,
      congestionLevel: Math.round(congestionLevel),
      activeStreams: liveLocationStreams.size
    });
  } catch (error) {
    console.error('Get live stats error:', error);
    res.status(500).json({ error: 'Failed to get live statistics' });
  }
});

// POST /api/live-locations/:city/incident - Create incident affecting vehicle movement
router.post('/:city/incident', (req, res) => {
  try {
    const { city } = req.params;
    const { type, location, severity, description } = req.body;

    if (!type || !location || !severity) {
      return res.status(400).json({ 
        error: 'Missing required fields: type, location, severity' 
      });
    }

    const vehicles = liveLocationStreams.get(city) || [];
    const incidentRadius = severity === 'HIGH' ? 100 : severity === 'MEDIUM' ? 50 : 25;

    // Affect nearby vehicles
    let affectedCount = 0;
    const updatedVehicles = vehicles.map(vehicle => {
      const distance = Math.sqrt(
        Math.pow(vehicle.x - location.x, 2) + Math.pow(vehicle.y - location.y, 2)
      );

      if (distance <= incidentRadius && !vehicle.isBrokenDown) {
        affectedCount++;
        return {
          ...vehicle,
          speed: Math.max(0.5, vehicle.speed * 0.3), // Slow down significantly
          lastUpdate: Date.now()
        };
      }

      return vehicle;
    });

    liveLocationStreams.set(city, updatedVehicles);

    res.json({
      success: true,
      message: 'Incident created and vehicles affected',
      incident: {
        type,
        location,
        severity,
        description,
        timestamp: Date.now()
      },
      affectedVehicles: affectedCount
    });
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// GET /api/live-locations/cities - Get all cities with active live location streams
router.get('/', (req, res) => {
  try {
    const cities = Array.from(liveLocationStreams.keys()).map(city => {
      const vehicles = liveLocationStreams.get(city) || [];
      return {
        city,
        vehicleCount: vehicles.length,
        lastUpdate: Math.max(...vehicles.map(v => v.lastUpdate || 0)),
        activeStreams: 1 // This would be more complex in a real system
      };
    });

    res.json({
      cities,
      totalCities: cities.length,
      totalVehicles: cities.reduce((sum, c) => sum + c.vehicleCount, 0)
    });
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({ error: 'Failed to get cities' });
  }
});

// Cleanup old vehicle data periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutes

  for (const [city, vehicles] of liveLocationStreams.entries()) {
    const activeVehicles = vehicles.filter(v => (now - v.lastUpdate) < maxAge);
    if (activeVehicles.length !== vehicles.length) {
      liveLocationStreams.set(city, activeVehicles);
      console.log(`Cleaned up ${vehicles.length - activeVehicles.length} stale vehicles in ${city}`);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

export default router;