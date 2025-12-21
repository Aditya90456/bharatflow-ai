# Live Locations API 🚀

A comprehensive real-time vehicle tracking and movement API that powers the awesome Real-Time Movement Canvas with live data streams.

## 🌟 Features

- **Real-time vehicle tracking** with Server-Sent Events streaming
- **Multi-city support** with realistic vehicle movement simulation
- **Live traffic statistics** and congestion analysis
- **Incident management** affecting vehicle behavior
- **WebSocket-like streaming** for instant updates
- **RESTful API** for vehicle management
- **Automatic cleanup** of stale vehicle data
- **Canvas integration** with seamless data conversion

## 🚀 Quick Start

### 1. Start the Backend Server
```bash
cd backend
npm install
npm start
```

### 2. Test the API
```bash
node test-live-locations.js
```

### 3. Enable Live Mode in UI
- Toggle "LIVE MODE" button in the Real-Time Canvas
- Toggle "DATA STREAM" button to activate streaming
- Watch the connection status indicator (top-right corner)

## 📡 API Endpoints

### Get Live Vehicle Locations
```http
GET /api/live-locations/:city
```

**Parameters:**
- `city` - City name (Bangalore, Mumbai, Delhi, etc.)
- `includeHistory` - Include historical data (optional)
- `vehicleTypes` - Filter by vehicle types (optional)
- `limit` - Maximum number of vehicles (optional)

**Response:**
```json
{
  "city": "Bangalore",
  "timestamp": 1703123456789,
  "vehicleCount": 45,
  "vehicles": [
    {
      "id": "LIVE-Bangalore-1",
      "type": "CAR",
      "x": 234.56,
      "y": 123.45,
      "speed": 2.3,
      "direction": "N",
      "isBrokenDown": false,
      "mission": null,
      "timestamp": 1703123456789,
      "lastUpdate": 1703123456789
    }
  ],
  "bounds": {
    "minX": 0,
    "maxX": 800,
    "minY": 0,
    "maxY": 600
  }
}
```

### Real-Time Streaming
```http
GET /api/live-locations/:city/stream
```

**Parameters:**
- `interval` - Update interval in milliseconds (default: 2000)
- `vehicleTypes` - Filter by vehicle types (optional)

**Server-Sent Events Stream:**
```javascript
const eventSource = new EventSource('/api/live-locations/Bangalore/stream');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Live update:', data);
};
```

### Get Live Statistics
```http
GET /api/live-locations/:city/stats
```

**Response:**
```json
{
  "city": "Bangalore",
  "timestamp": 1703123456789,
  "totalVehicles": 45,
  "avgSpeed": 2.34,
  "vehicleTypes": {
    "CAR": 25,
    "AUTO": 12,
    "BUS": 5,
    "POLICE": 3
  },
  "brokenDownCount": 2,
  "policeUnits": 3,
  "congestionLevel": 23
}
```

### Add/Update Vehicle
```http
POST /api/live-locations/:city/vehicle
```

**Request Body:**
```json
{
  "vehicleId": "CUSTOM-001",
  "type": "POLICE",
  "x": 400,
  "y": 300,
  "speed": 3.5,
  "direction": "N",
  "isBrokenDown": false,
  "mission": {
    "type": "RESPONSE",
    "targetId": "INT-5-3"
  }
}
```

### Remove Vehicle
```http
DELETE /api/live-locations/:city/vehicle/:vehicleId
```

### Create Incident
```http
POST /api/live-locations/:city/incident
```

**Request Body:**
```json
{
  "type": "ACCIDENT",
  "location": { "x": 450, "y": 350 },
  "severity": "HIGH",
  "description": "Multi-vehicle collision"
}
```

### Get All Active Cities
```http
GET /api/live-locations
```

## 🎨 Canvas Integration

The Live Locations API seamlessly integrates with the Real-Time Movement Canvas:

### Frontend Service
```typescript
import { liveLocationsService } from '../services/liveLocationsService';

// Start live streaming
liveLocationsService.startLiveStream('Bangalore', (data) => {
  const vehicles = liveLocationsService.convertToCanvasFormat(data.vehicles);
  updateCanvas(vehicles);
});

// Get current locations
const locations = await liveLocationsService.getLiveLocations('Bangalore');
```

### Canvas Features
- **Live Data Indicator** - Shows connection status in real-time
- **Vehicle Count Display** - Shows number of live vehicles
- **Automatic Conversion** - Converts API data to canvas format
- **Seamless Switching** - Toggle between simulation and live data
- **Error Handling** - Graceful fallback to simulation mode

## 🏙️ Supported Cities

- **Bangalore** - 800x600 canvas area
- **Mumbai** - 900x700 canvas area  
- **Delhi** - 1000x800 canvas area
- **Chennai** - 750x550 canvas area
- **Hyderabad** - 850x650 canvas area
- **Kolkata** - 700x500 canvas area
- **Pune** - 600x450 canvas area

## 🚗 Vehicle Types

- **CAR** - Standard passenger vehicles
- **AUTO** - Auto-rickshaws (3-wheelers)
- **BUS** - Public transport buses
- **POLICE** - Police patrol vehicles with missions

## 📊 Real-Time Features

### Movement Simulation
- Realistic vehicle movement patterns
- Direction changes at intersections
- Speed variations based on traffic
- Breakdown simulation (2% chance)
- Police response missions

### Traffic Analysis
- Congestion level calculation
- Average speed monitoring
- Vehicle type distribution
- Incident impact analysis

### Data Streaming
- 2-second update intervals
- Automatic reconnection
- Error handling and fallbacks
- Connection status monitoring

## 🔧 Configuration

### Environment Variables
```bash
# API Configuration
VITE_API_URL=http://localhost:3001

# Server Configuration
PORT=3001
HOST=localhost
```

### Canvas Integration
```typescript
// Enable live data mode
const [realTimeMode, setRealTimeMode] = useState(true);
const [dataStreamActive, setDataStreamActive] = useState(true);

// The canvas automatically switches to live data when both are enabled
```

## 🎯 Use Cases

### Traffic Management
- Monitor real-time vehicle positions
- Analyze traffic patterns
- Respond to incidents quickly
- Optimize signal timing

### Emergency Response
- Track police vehicle locations
- Coordinate emergency responses
- Monitor incident impacts
- Analyze response times

### Urban Planning
- Study traffic flow patterns
- Identify congestion hotspots
- Plan infrastructure improvements
- Analyze vehicle type distributions

## 🚀 Performance

- **Sub-second updates** via Server-Sent Events
- **Automatic cleanup** of stale data every 5 minutes
- **Memory efficient** with configurable limits
- **Scalable architecture** supporting multiple cities
- **Graceful degradation** with fallback modes

## 🔍 Monitoring

### Connection Status
- **Connected** - Live data streaming active
- **Connecting** - Attempting to establish connection
- **Disconnected** - Using simulation data

### Health Checks
```http
GET /api/health
```

### Analytics
- Vehicle count tracking
- Speed analysis
- Congestion monitoring
- Incident impact assessment

## 🎉 Getting Started

1. **Start the backend server**
2. **Run the test script** to verify API functionality
3. **Open the Real-Time Canvas** in your browser
4. **Enable Live Mode and Data Stream** toggles
5. **Watch the magic happen** with real-time vehicle movement!

The Live Locations API transforms your traffic simulation into a living, breathing system with real-time data streams and awesome visual effects! 🌟