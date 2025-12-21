# Real-Time Traffic API Integration Guide

## Overview

BharatFlow now supports real-time traffic data integration from multiple traffic API providers. This feature provides live traffic conditions, congestion levels, incidents, and speed data for major Indian cities.

## Supported Traffic APIs

### 1. TomTom Traffic API (Primary)
- **Website**: https://developer.tomtom.com/
- **Features**: Real-time traffic flow, incidents, speed data
- **Coverage**: Global including India
- **Free Tier**: 2,500 requests/day
- **Pricing**: Pay-as-you-go after free tier

### 2. Mapbox Traffic API (Secondary)  
- **Website**: https://docs.mapbox.com/api/navigation/
- **Features**: Traffic-aware routing, congestion annotations
- **Coverage**: Global including India
- **Free Tier**: 100,000 requests/month
- **Pricing**: $0.60 per 1,000 requests after free tier

### 3. HERE Traffic API (Tertiary)
- **Website**: https://developer.here.com/
- **Features**: Real-time traffic flow, incidents
- **Coverage**: Global including India  
- **Free Tier**: 250,000 transactions/month
- **Pricing**: Pay-per-use after free tier

### 4. Google Maps Traffic (Future)
- **Website**: https://developers.google.com/maps
- **Features**: Traffic layer, directions with traffic
- **Coverage**: Excellent India coverage
- **Pricing**: Pay-per-use

## Setup Instructions

### 1. Get API Keys

Choose one or more providers and sign up for API keys:

**TomTom:**
1. Go to https://developer.tomtom.com/
2. Create account and get API key
3. Add to `.env.local`: `TOMTOM_API_KEY=your_key_here`

**Mapbox:**
1. Go to https://account.mapbox.com/
2. Create account and get access token
3. Add to `.env.local`: `MAPBOX_API_KEY=your_token_here`

**HERE:**
1. Go to https://developer.here.com/
2. Create account and get API key
3. Add to `.env.local`: `HERE_API_KEY=your_key_here`

### 2. Update Environment File

Add your API keys to `backend/.env.local`:

```env
GEMINI_API_KEY=your_gemini_key

# Traffic API Keys (add the ones you have)
TOMTOM_API_KEY=your_tomtom_api_key_here
MAPBOX_API_KEY=your_mapbox_api_key_here  
HERE_API_KEY=your_here_api_key_here
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

The `node-fetch` dependency is already included for API calls.

## API Endpoints

### Real-Time Traffic Data

**GET** `/api/traffic/realtime/:city`
- Get current traffic data for a specific city
- Returns: speed, congestion, incidents, confidence level

**POST** `/api/traffic/realtime/multi`
- Get traffic data for multiple cities
- Body: `{ "cities": ["Bangalore", "Mumbai", "Delhi"] }`

**GET** `/api/traffic/patterns/:city`
- Get historical traffic patterns
- Query: `?hours=24` (default 24 hours)

**GET** `/api/traffic/incidents/:city`
- Get active traffic incidents for a city
- Returns: incident type, location, severity, description

**GET** `/api/traffic/stream/:city`
- Server-Sent Events stream for real-time updates
- Query: `?interval=30000` (update interval in ms)

## Data Structure

### Traffic Data Response
```json
{
  "source": "tomtom",
  "timestamp": 1640995200000,
  "currentSpeed": 25,
  "freeFlowSpeed": 50,
  "congestionLevel": 75,
  "confidence": 0.85,
  "coordinates": { "lat": 12.9716, "lng": 77.5946 },
  "incidents": [
    {
      "id": "INC-123",
      "type": "ACCIDENT",
      "description": "Multi-vehicle collision",
      "severity": "HIGH",
      "location": { "lat": 12.9716, "lng": 77.5946 },
      "timestamp": 1640995200000
    }
  ],
  "isRushHour": true,
  "isWeekend": false
}
```

### Incident Types
- `ACCIDENT` - Traffic accidents
- `BREAKDOWN` - Vehicle breakdowns
- `CONSTRUCTION` - Road construction/maintenance

### Severity Levels
- `LOW` - Minor impact on traffic
- `MEDIUM` - Moderate traffic delays
- `HIGH` - Significant traffic disruption

## Fallback System

When no API keys are configured or APIs are unavailable, the system automatically generates intelligent simulated data based on:

- **Time of day** - Rush hour patterns (7-10 AM, 5-8 PM)
- **Day of week** - Weekend vs weekday patterns
- **City characteristics** - Different congestion patterns per city
- **Random variations** - Realistic traffic fluctuations

## Rate Limiting & Caching

- **Rate Limiting**: 1 second minimum between API calls per provider
- **Caching**: 5-minute cache for API responses
- **Fallback**: Automatic fallback to simulated data on API failures

## Usage Examples

### Frontend Integration

```typescript
// Get real-time traffic for Bangalore
const response = await fetch('/api/traffic/realtime/Bangalore');
const trafficData = await response.json();

// Start streaming updates
const eventSource = new EventSource('/api/traffic/stream/Bangalore?interval=30000');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateTrafficDisplay(data);
};
```

### Multi-City Monitoring

```typescript
// Get traffic for multiple cities
const response = await fetch('/api/traffic/realtime/multi', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    cities: ['Bangalore', 'Mumbai', 'Delhi', 'Chennai'] 
  })
});
const multiCityData = await response.json();
```

## Supported Cities

- **Bangalore** (12.9716, 77.5946)
- **Mumbai** (19.0760, 72.8777)
- **Delhi** (28.6139, 77.2090)
- **Chennai** (13.0827, 80.2707)
- **Hyderabad** (17.3850, 78.4867)
- **Kolkata** (22.5726, 88.3639)
- **Pune** (18.5204, 73.8567)

## Performance Considerations

### API Quotas
- Monitor your API usage to avoid quota limits
- Use caching to reduce API calls
- Implement exponential backoff for failed requests

### Database Storage
- Traffic data is automatically saved to SQLite database
- Historical patterns are stored for analysis
- Incidents are logged with timestamps

### Real-Time Updates
- Use Server-Sent Events for live streaming
- Configurable update intervals (default 30 seconds)
- Automatic reconnection on connection loss

## Troubleshooting

### No Real Traffic Data
1. Check if API keys are correctly set in `.env.local`
2. Verify API key validity and quota limits
3. Check backend console for API error messages
4. System will automatically use simulated data as fallback

### High API Usage
1. Increase cache timeout in `realTrafficService.js`
2. Reduce update frequency for streaming endpoints
3. Implement request batching for multiple cities

### Connection Issues
1. Check network connectivity
2. Verify API endpoint URLs are accessible
3. Check for firewall or proxy issues

## Cost Optimization

### Free Tier Usage
- **TomTom**: 2,500 requests/day = ~104 requests/hour
- **Mapbox**: 100,000 requests/month = ~3,333 requests/day
- **HERE**: 250,000 transactions/month = ~8,333 requests/day

### Recommendations
1. Start with one provider (Mapbox has highest free tier)
2. Use 5-minute caching to reduce API calls
3. Monitor usage through provider dashboards
4. Implement usage alerts before hitting limits

## Future Enhancements

- **Google Maps Integration** - Better India coverage
- **Custom Traffic Sources** - Integration with local traffic authorities
- **ML Predictions** - Combine real data with ML forecasting
- **Historical Analysis** - Long-term traffic pattern analysis
- **Alert System** - Notifications for traffic incidents
- **Route Optimization** - Traffic-aware routing suggestions

## Support

For issues with:
- **API Integration**: Check provider documentation
- **BharatFlow Implementation**: Review backend logs
- **Performance**: Monitor API quotas and caching
- **Data Quality**: Verify API key permissions and coverage

The real-time traffic system is designed to be robust and will continue working even without API keys by using intelligent simulated data based on real traffic patterns.