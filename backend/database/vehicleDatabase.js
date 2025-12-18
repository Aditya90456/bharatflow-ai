const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize database connection
const dbPath = path.resolve(__dirname, '../data/vehicles.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to the database:', err.message);
  } else {
    console.log('Connected to the vehicle database.');
  }
});

// Create vehicles table if not exists
const createTableQuery = `
CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  model TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL
);
`;

db.run(createTableQuery, (err) => {
  if (err) {
    console.error('Failed to create vehicles table:', err.message);
  } else {
    console.log('Vehicles table is ready.');
  }
});

// Insert a new vehicle
function insertVehicle(vehicle, callback) {
  const query = `INSERT INTO vehicles (type, model, manufacturer, year, status) VALUES (?, ?, ?, ?, ?)`;
  const params = [vehicle.type, vehicle.model, vehicle.manufacturer, vehicle.year, vehicle.status];
  db.run(query, params, function (err) {
    callback(err, this?.lastID);
  });
}

// Fetch all vehicles
function fetchAllVehicles(callback) {
  const query = `SELECT * FROM vehicles`;
  db.all(query, [], (err, rows) => {
    callback(err, rows);
  });
}

// Update vehicle status
function updateVehicleStatus(id, status, callback) {
  const query = `UPDATE vehicles SET status = ? WHERE id = ?`;
  db.run(query, [status, id], function (err) {
    callback(err, this?.changes);
  });
}

// Delete a vehicle
function deleteVehicle(id, callback) {
  const query = `DELETE FROM vehicles WHERE id = ?`;
  db.run(query, [id], function (err) {
    callback(err, this?.changes);
  });
}

module.exports = {
  insertVehicle,
  fetchAllVehicles,
  updateVehicleStatus,
  deleteVehicle,
  db // Exporting db for advanced queries
};