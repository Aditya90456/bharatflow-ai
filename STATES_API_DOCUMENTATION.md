# Indian States and Areas API Documentation

## Overview
Comprehensive API for accessing data about all Indian states, union territories, cities, and traffic information.

## Base URL
```
http://localhost:3001/api/states
```

## Endpoints

### 1. Get All States and Union Territories
```http
GET /api/states
```

**Query Parameters:**
- `type` (optional): Filter by "state" or "union_territory"
- `search` (optional): Search by name, capital, or city names
- `bounds` (optional): JSON object with geographical bounds `{"north": 30, "south": 20, "east": 80, "west": 70}`

**Response:**
```json
{
  "success": true,
  "count": 36,
  "data": {
    "Karnataka": {
      "code": "KA",
      "capital": "Bengaluru",
      "type": "state",
      "coordinates": { "lat": 15.3173, "lng": 75.7139 },
      "population": 61095297,
      "area": 191791,
      "districts": 31,
      "majorCities": [...],
      "trafficHotspots": [...]
    }
  }
}
```

### 2. Get Only States
```http
GET /api/states/states
```

### 3. Get Only Union Territories
```http
GET /api/states/union-territories
```

### 4. Get Specific State/UT by Name or Code
```http
GET /api/states/{identifier}
```

**Examples:**
- `/api/states/Karnataka` (by name)
- `/api/states/KA` (by code)

### 5. Get Cities of a State
```http
GET /api/states/{identifier}/cities
```

**Query Parameters:**
- `limit` (optional): Limit number of results
- `minPopulation` (optional): Filter cities by minimum population

**Example:**
```http
GET /api/states/Maharashtra/cities?minPopulation=1000000&limit=5
```

### 6. Get Traffic Hotspots for a State
```http
GET /api/states/{identifier}/traffic-hotspots
```

**Query Parameters:**
- `severity` (optional): Filter by "HIGH", "MEDIUM", or "LOW"
- `type` (optional): Filter by type (e.g., "COMMERCIAL", "HIGHWAY", "TRANSPORT")

### 7. Get All Traffic Hotspots
```http
GET /api/states/traffic-hotspots/all
```

**Query Parameters:**
- `severity` (optional): Filter by severity level
- `type` (optional): Filter by hotspot type
- `state` (optional): Filter by state name or code

### 8. Search States and Cities
```http
GET /api/states/search/{term}
```

**Query Parameters:**
- `includeStates` (optional): Include states in results (default: true)
- `includeCities` (optional): Include cities in results (default: true)

**Example:**
```http
GET /api/states/search/Mumbai?includeStates=true&includeCities=true
```

### 9. Get Statistics Overview
```http
GET /api/states/stats/overview
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStates": 28,
    "totalUnionTerritories": 8,
    "totalPopulation": 1380004385,
    "totalArea": 3287263,
    "totalMajorCities": 245,
    "trafficHotspots": {
      "total": 89,
      "bySeverity": {
        "HIGH": 34,
        "MEDIUM": 41,
        "LOW": 14
      },
      "byType": {
        "COMMERCIAL": 25,
        "HIGHWAY": 18,
        "TRANSPORT": 15,
        "INDUSTRIAL": 8,
        "TOURIST": 12,
        "URBAN": 6,
        "RELIGIOUS": 3,
        "AIRPORT": 2
      }
    },
    "largestStateByArea": {
      "name": "Rajasthan",
      "area": 342239
    },
    "mostPopulousState": {
      "name": "Uttar Pradesh",
      "population": 199812341
    }
  }
}
```

## Data Structure

### State/Union Territory Object
```json
{
  "code": "KA",
  "capital": "Bengaluru",
  "type": "state",
  "coordinates": { "lat": 15.3173, "lng": 75.7139 },
  "bounds": { 
    "north": 18.4574, "south": 11.5945, 
    "east": 78.5885, "west": 74.0894 
  },
  "population": 61095297,
  "area": 191791,
  "districts": 31,
  "majorCities": [
    {
      "name": "Bengaluru",
      "lat": 12.9716,
      "lng": 77.5946,
      "population": 12764935
    }
  ],
  "trafficHotspots": [
    {
      "name": "Electronic City",
      "severity": "HIGH",
      "type": "COMMERCIAL"
    }
  ]
}
```

### Traffic Hotspot Types
- **COMMERCIAL**: Business districts, markets
- **HIGHWAY**: Major highways and expressways
- **TRANSPORT**: Railway stations, bus terminals
- **INDUSTRIAL**: Industrial areas, factories
- **TOURIST**: Tourist attractions, beaches
- **URBAN**: City centers, residential areas
- **RELIGIOUS**: Temples, religious sites
- **AIRPORT**: Airport areas
- **BRIDGE**: Major bridges
- **JUNCTION**: Traffic intersections
- **ISLAND**: Island roads

### Severity Levels
- **HIGH**: Severe congestion, frequent delays
- **MEDIUM**: Moderate congestion during peak hours
- **LOW**: Occasional congestion

## Error Responses

### 404 Not Found
```json
{
  "success": false,
  "error": "State or Union Territory not found",
  "identifier": "XYZ"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid bounds format. Expected JSON with north, south, east, west properties"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to fetch states data",
  "message": "Detailed error message"
}
```

## Usage Examples

### Get all states in South India (by bounds)
```javascript
const bounds = {
  "north": 20,
  "south": 8,
  "east": 80,
  "west": 74
};

fetch(`/api/states?bounds=${JSON.stringify(bounds)}`)
  .then(response => response.json())
  .then(data => console.log(data));
```

### Find high-traffic commercial areas
```javascript
fetch('/api/states/traffic-hotspots/all?severity=HIGH&type=COMMERCIAL')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Search for cities starting with "Ban"
```javascript
fetch('/api/states/search/Ban?includeCities=true&includeStates=false')
  .then(response => response.json())
  .then(data => console.log(data));
```

## Testing

Run the test script to verify all endpoints:
```bash
node test-states-api.js
```

## Coverage

The API includes data for:
- **28 States**: All Indian states with comprehensive city and traffic data
- **8 Union Territories**: Including Delhi, Chandigarh, Puducherry, etc.
- **245+ Major Cities**: Population, coordinates, and demographic data
- **89 Traffic Hotspots**: Real traffic congestion points across India
- **Geographic Bounds**: Precise latitude/longitude boundaries for each region

## Performance

- Response times typically under 100ms for single state queries
- Bulk operations (all states) under 500ms
- Built-in caching for static geographical data
- Efficient filtering and search algorithms