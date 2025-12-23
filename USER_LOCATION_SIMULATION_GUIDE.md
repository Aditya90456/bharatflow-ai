# User Location Simulation Guide

## Overview

The BharatFlow User Location Simulation system allows you to add real users to your traffic simulation, track their movements, and analyze how traffic affects real people. This feature bridges the gap between simulated traffic and real-world user experience.

## Features

### 🎯 Core Capabilities

- **Real GPS Integration** - Use actual device GPS for precise location
- **Manual Location Entry** - Set custom coordinates for testing
- **Random User Generation** - Create multiple users across the city
- **Real-time Movement** - Users move along generated routes
- **Journey Tracking** - Monitor user trips with ETA and progress
- **Interactive Visualization** - Click users to see detailed information

### 🚗 Vehicle Types Supported

- **Car** - Personal vehicles
- **Auto Rickshaw** - Three-wheelers
- **Bus** - Public transport
- **Police** - Emergency vehicles

### 📍 Location Methods

1. **GPS Location** - Automatic device location detection
2. **Manual Entry** - Input latitude/longitude coordinates
3. **Random in City** - Generate random locations within city bounds

## How to Use

### Adding Your Location

1. **Click "ADD USER" button** in the simulation controls
2. **Enter your name** in the modal
3. **Select vehicle type** (Car, Auto, Bus, Police)
4. **Choose location method:**
   - **GPS**: Automatically detect your location
   - **Manual**: Enter coordinates manually
   - **Random**: Generate random location in current city
5. **Click "Add My Location"** to confirm

### Adding Multiple Users

- **Click "RANDOM USERS"** to add 3 random users instantly
- Each user gets a random name, location, and vehicle type
- Users automatically start moving to random destinations

### Interacting with Users

- **Click any user marker** on the map to see details
- **View real-time information:**
  - Current coordinates
  - Vehicle type and speed
  - Journey progress and ETA
  - Location accuracy
  - Last update time

## Technical Implementation

### Frontend Components

```typescript
// Main simulation component
SimulationSection.tsx
├── UserLocationModal.tsx      // User input modal
├── UserLocationOverlay.tsx    // Map overlay for users
└── RealTimeCanvas.tsx         // Main canvas with user layer

// Core service
services/userLocationSimulation.ts
├── User management
├── Route generation
├── Real-time updates
└── Coordinate conversion
```

### Backend API Endpoints

```javascript
POST   /api/user-location           // Save user location
GET    /api/user-locations/:city    // Get all users in city
PUT    /api/user-location/:userId   // Update user location
DELETE /api/user-location/:userId   // Remove user
POST   /api/user-locations/nearby   // Find nearby users
```

### Data Flow

1. **User Input** → Modal collects name, vehicle, location
2. **Location Service** → Processes GPS/manual/random location
3. **Simulation Engine** → Generates routes and updates positions
4. **Canvas Overlay** → Renders users on traffic map
5. **Real-time Updates** → Continuous position updates

## Configuration

### Simulation Settings

```typescript
interface LocationSimulationConfig {
  enabled: boolean;           // Enable/disable simulation
  userCount: number;          // Max concurrent users
  updateInterval: number;     // Update frequency (ms)
  movementSpeed: number;      // Movement speed (pixels/frame)
  routeVariation: number;     // Route randomness (0-1)
}
```

### City Bounds

Predefined city boundaries for random user generation:

- **Bangalore**: 12.8-13.1°N, 77.4-77.8°E
- **Mumbai**: 19.0-19.3°N, 72.7-73.0°E
- **Delhi**: 28.4-28.8°N, 76.8-77.3°E
- **Chennai**: 12.9-13.2°N, 80.1-80.3°E
- **Hyderabad**: 17.2-17.6°N, 78.2-78.6°E
- **Kolkata**: 22.4-22.7°N, 88.2-88.5°E
- **Pune**: 18.4-18.7°N, 73.7-74.0°E

## User Interface

### Status Indicators

- **Green Pulse** - User is moving
- **Red Solid** - User is stopped
- **Yellow Pulse** - User is waiting
- **Blue Solid** - User has arrived

### Information Display

- **Accuracy Circle** - Shows GPS accuracy radius
- **Direction Arrow** - Shows movement direction (when moving)
- **Name Label** - User's name below marker
- **Detailed Popup** - Full information when selected

## Testing

### Manual Testing

1. **Start the backend server:**
   ```bash
   cd backend && npm start
   ```

2. **Start the frontend:**
   ```bash
   npm run dev
   ```

3. **Test user location features:**
   - Add your real location
   - Add manual test coordinates
   - Generate random users
   - Watch users move on the map

### API Testing

Run the test script:
```bash
node test-user-location.js
```

This tests all backend API endpoints for user location management.

## Privacy & Security

### GPS Permissions

- **User Consent** - Always ask permission before accessing GPS
- **Fallback Options** - Provide manual/random alternatives
- **Error Handling** - Graceful degradation when GPS unavailable

### Data Protection

- **No Storage** - Locations not permanently stored by default
- **Local Processing** - Most calculations happen client-side
- **Anonymization** - Only display names, no personal data

## Integration with Traffic System

### Real-time Impact

- **User locations affect traffic analysis**
- **Journey times reflect actual conditions**
- **Route suggestions consider current congestion**

### AI Analysis

- **Include user data in traffic optimization**
- **Predict user impact on traffic flow**
- **Generate personalized route recommendations**

## Troubleshooting

### Common Issues

**GPS Not Working:**
- Check browser permissions
- Try manual location entry
- Use random location as fallback

**Users Not Moving:**
- Verify simulation is running
- Check if destinations are set
- Restart location simulation service

**Coordinates Off-Map:**
- Ensure coordinates are within city bounds
- Check coordinate conversion logic
- Verify canvas dimensions

### Debug Information

Enable debug mode to see:
- Raw GPS coordinates
- Route calculation steps
- Canvas coordinate conversion
- Update frequency and timing

## Future Enhancements

### Planned Features

- **Real User Integration** - Connect with actual user devices
- **Group Management** - Handle multiple user groups
- **Historical Tracking** - Store and analyze user patterns
- **Route Optimization** - AI-powered route suggestions
- **Social Features** - User interaction and sharing

### API Extensions

- **WebSocket Support** - Real-time bidirectional communication
- **Geofencing** - Location-based triggers and alerts
- **Analytics** - User behavior and traffic correlation
- **Integration** - Connect with mapping services

## Support

For issues or questions about user location simulation:

1. **Check the console** for error messages
2. **Verify API endpoints** are responding
3. **Test with manual coordinates** first
4. **Check browser GPS permissions**
5. **Review network connectivity**

The user location simulation adds a human element to your traffic analysis, making BharatFlow more realistic and user-focused!