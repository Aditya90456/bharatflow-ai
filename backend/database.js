import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
let db = null;

export async function initializeDatabase() {
  try {
    db = await open({
      filename: path.join(__dirname, 'bharatflow.db'),
      driver: sqlite3.Database
    });

    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');

    // Create tables
    await createTables();
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

async function createTables() {
  // Cities table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Intersections table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS intersections (
      id TEXT PRIMARY KEY,
      city_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      grid_x INTEGER NOT NULL,
      grid_y INTEGER NOT NULL,
      green_duration INTEGER DEFAULT 150,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (city_id) REFERENCES cities (id)
    )
  `);

  // Traffic incidents table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      city_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('BREAKDOWN', 'ACCIDENT', 'CONSTRUCTION')),
      location_x REAL NOT NULL,
      location_y REAL NOT NULL,
      description TEXT,
      severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
      status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED', 'ARCHIVED')),
      blocks_segment_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (city_id) REFERENCES cities (id)
    )
  `);

  // Traffic analytics table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS traffic_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_vehicles INTEGER NOT NULL,
      avg_speed REAL NOT NULL,
      congestion_level INTEGER NOT NULL,
      carbon_emission REAL NOT NULL,
      active_incidents INTEGER NOT NULL,
      FOREIGN KEY (city_id) REFERENCES cities (id)
    )
  `);

  // Junction performance table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS junction_performance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      intersection_id TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      ns_queue_length INTEGER NOT NULL,
      ew_queue_length INTEGER NOT NULL,
      light_state_ns TEXT NOT NULL,
      light_state_ew TEXT NOT NULL,
      green_duration INTEGER NOT NULL,
      FOREIGN KEY (intersection_id) REFERENCES intersections (id)
    )
  `);

  // AI analysis logs table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ai_analysis_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id INTEGER NOT NULL,
      analysis_type TEXT NOT NULL CHECK (analysis_type IN ('TRAFFIC', 'INCIDENT', 'JUNCTION')),
      input_data TEXT NOT NULL,
      ai_response TEXT NOT NULL,
      suggestions_applied BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (city_id) REFERENCES cities (id)
    )
  `);

  // Vehicle tracking table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS vehicle_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id TEXT NOT NULL,
      city_id INTEGER NOT NULL,
      vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('CAR', 'AUTO', 'BUS', 'POLICE')),
      location_x REAL NOT NULL,
      location_y REAL NOT NULL,
      speed REAL NOT NULL,
      direction TEXT NOT NULL CHECK (direction IN ('N', 'S', 'E', 'W')),
      is_broken_down BOOLEAN DEFAULT FALSE,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (city_id) REFERENCES cities (id)
    )
  `);

  // Create indexes for better performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_incidents_city_status ON incidents (city_id, status);
    CREATE INDEX IF NOT EXISTS idx_traffic_analytics_city_timestamp ON traffic_analytics (city_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_junction_performance_intersection_timestamp ON junction_performance (intersection_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_ai_analysis_city_type ON ai_analysis_logs (city_id, analysis_type);
    CREATE INDEX IF NOT EXISTS idx_vehicle_tracking_city_timestamp ON vehicle_tracking (city_id, timestamp);
  `);

  // Insert default cities
  await insertDefaultCities();
}

async function insertDefaultCities() {
  const cities = [
    { name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
    { name: 'Mumbai', latitude: 19.0760, longitude: 72.8777 },
    { name: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
    { name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
    { name: 'Hyderabad', latitude: 17.3850, longitude: 78.4867 },
    { name: 'Kolkata', latitude: 22.5726, longitude: 88.3639 },
    { name: 'Pune', latitude: 18.5204, longitude: 73.8567 }
  ];

  for (const city of cities) {
    await db.run(
      'INSERT OR IGNORE INTO cities (name, latitude, longitude) VALUES (?, ?, ?)',
      [city.name, city.latitude, city.longitude]
    );
  }
}

// Database operations
export class DatabaseService {
  static async getCityId(cityName) {
    const result = await db.get('SELECT id FROM cities WHERE name = ?', [cityName]);
    return result?.id;
  }

  static async saveIncident(incident, cityName) {
    const cityId = await this.getCityId(cityName);
    if (!cityId) throw new Error(`City ${cityName} not found`);

    await db.run(`
      INSERT INTO incidents (id, city_id, type, location_x, location_y, description, severity, blocks_segment_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      incident.id,
      cityId,
      incident.type,
      incident.location.x,
      incident.location.y,
      incident.description,
      incident.severity,
      incident.blocksSegmentId || null
    ]);
  }

  static async getActiveIncidents(cityName) {
    const cityId = await this.getCityId(cityName);
    if (!cityId) return [];

    return await db.all(`
      SELECT * FROM incidents 
      WHERE city_id = ? AND status = 'ACTIVE'
      ORDER BY created_at DESC
    `, [cityId]);
  }

  static async resolveIncident(incidentId) {
    await db.run(`
      UPDATE incidents 
      SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [incidentId]);
  }

  static async saveTrafficAnalytics(stats, cityName) {
    const cityId = await this.getCityId(cityName);
    if (!cityId) throw new Error(`City ${cityName} not found`);

    await db.run(`
      INSERT INTO traffic_analytics (city_id, total_vehicles, avg_speed, congestion_level, carbon_emission, active_incidents)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      cityId,
      stats.totalCars,
      stats.avgSpeed,
      stats.congestionLevel,
      stats.carbonEmission,
      stats.incidents
    ]);
  }

  static async getTrafficAnalytics(cityName, hours = 24) {
    const cityId = await this.getCityId(cityName);
    if (!cityId) return [];

    return await db.all(`
      SELECT * FROM traffic_analytics 
      WHERE city_id = ? AND timestamp >= datetime('now', '-${hours} hours')
      ORDER BY timestamp DESC
    `, [cityId]);
  }

  static async saveJunctionPerformance(intersectionId, queueData, lightState, greenDuration) {
    await db.run(`
      INSERT INTO junction_performance (intersection_id, ns_queue_length, ew_queue_length, light_state_ns, light_state_ew, green_duration)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      intersectionId,
      queueData.ns || 0,
      queueData.ew || 0,
      lightState.ns,
      lightState.ew,
      greenDuration
    ]);
  }

  static async getJunctionPerformance(intersectionId, hours = 24) {
    return await db.all(`
      SELECT * FROM junction_performance 
      WHERE intersection_id = ? AND timestamp >= datetime('now', '-${hours} hours')
      ORDER BY timestamp DESC
    `, [intersectionId]);
  }

  static async logAIAnalysis(cityName, analysisType, inputData, aiResponse, suggestionsApplied = false) {
    const cityId = await this.getCityId(cityName);
    if (!cityId) throw new Error(`City ${cityName} not found`);

    await db.run(`
      INSERT INTO ai_analysis_logs (city_id, analysis_type, input_data, ai_response, suggestions_applied)
      VALUES (?, ?, ?, ?, ?)
    `, [
      cityId,
      analysisType,
      JSON.stringify(inputData),
      JSON.stringify(aiResponse),
      suggestionsApplied
    ]);
  }

  static async getAIAnalysisHistory(cityName, analysisType = null, limit = 50) {
    const cityId = await this.getCityId(cityName);
    if (!cityId) return [];

    let query = `
      SELECT * FROM ai_analysis_logs 
      WHERE city_id = ?
    `;
    const params = [cityId];

    if (analysisType) {
      query += ' AND analysis_type = ?';
      params.push(analysisType);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    return await db.all(query, params);
  }

  static async trackVehicle(vehicleId, cityName, vehicleData) {
    const cityId = await this.getCityId(cityName);
    if (!cityId) throw new Error(`City ${cityName} not found`);

    await db.run(`
      INSERT INTO vehicle_tracking (vehicle_id, city_id, vehicle_type, location_x, location_y, speed, direction, is_broken_down)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      vehicleId,
      cityId,
      vehicleData.type,
      vehicleData.x,
      vehicleData.y,
      vehicleData.speed,
      vehicleData.dir,
      vehicleData.isBrokenDown || false
    ]);
  }

  static async getVehicleHistory(vehicleId, hours = 24) {
    return await db.all(`
      SELECT * FROM vehicle_tracking 
      WHERE vehicle_id = ? AND timestamp >= datetime('now', '-${hours} hours')
      ORDER BY timestamp DESC
    `, [vehicleId]);
  }

  static async getDashboardStats(cityName) {
    const cityId = await this.getCityId(cityName);
    if (!cityId) return null;

    const [
      latestAnalytics,
      activeIncidents,
      totalIncidents24h,
      aiAnalysisCount
    ] = await Promise.all([
      db.get('SELECT * FROM traffic_analytics WHERE city_id = ? ORDER BY timestamp DESC LIMIT 1', [cityId]),
      db.get('SELECT COUNT(*) as count FROM incidents WHERE city_id = ? AND status = "ACTIVE"', [cityId]),
      db.get('SELECT COUNT(*) as count FROM incidents WHERE city_id = ? AND created_at >= datetime("now", "-24 hours")', [cityId]),
      db.get('SELECT COUNT(*) as count FROM ai_analysis_logs WHERE city_id = ? AND created_at >= datetime("now", "-24 hours")', [cityId])
    ]);

    return {
      latestAnalytics,
      activeIncidents: activeIncidents.count,
      totalIncidents24h: totalIncidents24h.count,
      aiAnalysisCount: aiAnalysisCount.count
    };
  }
}

export function getDatabase() {
  return db;
}