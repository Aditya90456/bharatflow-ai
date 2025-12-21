# Environment Configuration Guide

## Overview

BharatFlow uses environment variables for configuration, allowing you to customize behavior without changing code. This guide explains all available configuration options.

## Quick Start

### 1. Copy Template File
```bash
cd backend
cp .env.template .env.local
```

### 2. Add Your API Key
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Start Server
```bash
npm run dev
```

That's it! The system will work with default settings.

## Configuration Sections

### 🤖 AI & Machine Learning APIs

#### Required Configuration

**GEMINI_API_KEY** (Required)
- **Purpose**: Powers all AI features (traffic analysis, incident assessment, search)
- **Get from**: https://aistudio.google.com/app/apikey
- **Free tier**: Yes (with rate limits)
- **Example**: `GEMINI_API_KEY=AIzaSyD...`

**API_KEY** (Alternative name)
- **Purpose**: Same as GEMINI_API_KEY (for compatibility)
- **Example**: `API_KEY=AIzaSyD...`

### 🚦 Real-Time Traffic APIs

All traffic APIs are **optional**. Without them, the system uses intelligent simulation.

#### TomTom Traffic API (Recommended)

**TOMTOM_API_KEY**
- **Purpose**: Real-time traffic flow, speed, and incidents
- **Get from**: https://developer.tomtom.com/
- **Free tier**: 2,500 requests/day
- **Coverage**: Excellent global coverage including India
- **Best for**: Most comprehensive traffic data
- **Example**: `TOMTOM_API_KEY=abc123...`

#### Mapbox Traffic API

**MAPBOX_API_KEY**
- **Purpose**: Traffic-aware routing and congestion data
- **Get from**: https://account.mapbox.com/
- **Free tier**: 100,000 requests/month (best free tier!)
- **Coverage**: Good global coverage
- **Best for**: High-volume applications
- **Example**: `MAPBOX_API_KEY=pk.eyJ1...`

#### HERE Traffic API

**HERE_API_KEY**
- **Purpose**: Real-time traffic flow and incidents
- **Get from**: https://developer.here.com/
- **Free tier**: 250,000 transactions/month
- **Coverage**: Good global coverage
- **Best for**: Enterprise applications
- **Example**: `HERE_API_KEY=xyz789...`

#### Google Maps API (Future)

**GOOGLE_MAPS_API_KEY**
- **Purpose**: Traffic layer and directions
- **Get from**: https://console.cloud.google.com/
- **Free tier**: $200 credit/month
- **Coverage**: Best India coverage
- **Best for**: Maximum accuracy in India
- **Example**: `GOOGLE_MAPS_API_KEY=AIza...`

### ⚙️ Application Configuration

**NODE_ENV**
- **Purpose**: Environment mode
- **Values**: `development`, `production`
- **Default**: `development`
- **Example**: `NODE_ENV=production`

**PORT**
- **Purpose**: Server port number
- **Default**: `3001`
- **Example**: `PORT=3001`

**HOST**
- **Purpose**: Server host address
- **Default**: `localhost`
- **Example**: `HOST=0.0.0.0` (for Docker)

**CORS_ORIGIN**
- **Purpose**: Allowed CORS origins (production)
- **Default**: All origins in dev, restricted in prod
- **Example**: `CORS_ORIGIN=https://bharatflow.com`

### 💾 Database Configuration

**DB_PATH**
- **Purpose**: SQLite database file location
- **Default**: `./bharatflow.db`
- **Example**: `DB_PATH=/data/bharatflow.db`

**DB_BACKUP_ENABLED**
- **Purpose**: Enable automatic database backups
- **Default**: `true`
- **Example**: `DB_BACKUP_ENABLED=true`

**DB_BACKUP_INTERVAL**
- **Purpose**: Backup frequency
- **Default**: `24h`
- **Example**: `DB_BACKUP_INTERVAL=12h`

### 🚦 Traffic Data Configuration

**TRAFFIC_CACHE_DURATION**
- **Purpose**: How long to cache API responses (milliseconds)
- **Default**: `300000` (5 minutes)
- **Recommendation**: 5-10 minutes for cost optimization
- **Example**: `TRAFFIC_CACHE_DURATION=600000` (10 minutes)

**TRAFFIC_RATE_LIMIT_PER_MINUTE**
- **Purpose**: Maximum API calls per minute
- **Default**: `15`
- **Recommendation**: 10-20 for free tiers
- **Example**: `TRAFFIC_RATE_LIMIT_PER_MINUTE=20`

**TRAFFIC_FALLBACK_ENABLED**
- **Purpose**: Enable simulation fallback when APIs fail
- **Default**: `true`
- **Recommendation**: Always keep enabled
- **Example**: `TRAFFIC_FALLBACK_ENABLED=true`

**TRAFFIC_STREAM_INTERVAL**
- **Purpose**: Default streaming update interval (milliseconds)
- **Default**: `30000` (30 seconds)
- **Recommendation**: 30-60 seconds for balance
- **Example**: `TRAFFIC_STREAM_INTERVAL=60000` (1 minute)

**SUPPORTED_CITIES**
- **Purpose**: Comma-separated list of supported cities
- **Default**: `Bangalore,Mumbai,Delhi,Chennai,Hyderabad,Kolkata,Pune`
- **Example**: `SUPPORTED_CITIES=Bangalore,Mumbai,Delhi`

### 📝 Logging & Monitoring

**LOG_LEVEL**
- **Purpose**: Logging verbosity
- **Values**: `error`, `warn`, `info`, `debug`
- **Default**: `info`
- **Example**: `LOG_LEVEL=debug`

**API_LOGGING_ENABLED**
- **Purpose**: Log all API requests/responses
- **Default**: `true`
- **Example**: `API_LOGGING_ENABLED=false`

**PERFORMANCE_MONITORING**
- **Purpose**: Track performance metrics
- **Default**: `true`
- **Example**: `PERFORMANCE_MONITORING=true`

### 🔒 Security Configuration

**API_RATE_LIMIT_WINDOW**
- **Purpose**: Rate limit time window (milliseconds)
- **Default**: `900000` (15 minutes)
- **Example**: `API_RATE_LIMIT_WINDOW=600000` (10 minutes)

**API_RATE_LIMIT_MAX_REQUESTS**
- **Purpose**: Max requests per window
- **Default**: `100`
- **Example**: `API_RATE_LIMIT_MAX_REQUESTS=200`

**MAX_REQUEST_SIZE**
- **Purpose**: Maximum request body size
- **Default**: `10mb`
- **Example**: `MAX_REQUEST_SIZE=5mb`

**MAX_URL_LENGTH**
- **Purpose**: Maximum URL length
- **Default**: `2048`
- **Example**: `MAX_URL_LENGTH=4096`

### 🎛️ Feature Flags

Enable or disable features without code changes.

**REAL_TRAFFIC_ENABLED**
- **Purpose**: Enable real-time traffic features
- **Default**: `true`
- **Example**: `REAL_TRAFFIC_ENABLED=false`

**AI_ANALYSIS_ENABLED**
- **Purpose**: Enable AI traffic analysis
- **Default**: `true`
- **Example**: `AI_ANALYSIS_ENABLED=true`

**STREAMING_ENABLED**
- **Purpose**: Enable real-time streaming
- **Default**: `true`
- **Example**: `STREAMING_ENABLED=true`

**MULTI_CITY_ENABLED**
- **Purpose**: Enable multi-city monitoring
- **Default**: `true`
- **Example**: `MULTI_CITY_ENABLED=true`

**INCIDENT_TRACKING_ENABLED**
- **Purpose**: Enable incident tracking
- **Default**: `true`
- **Example**: `INCIDENT_TRACKING_ENABLED=true`

**HISTORICAL_ANALYTICS_ENABLED**
- **Purpose**: Enable historical data analysis
- **Default**: `true`
- **Example**: `HISTORICAL_ANALYTICS_ENABLED=true`

**EXPERIMENTAL_ML_PREDICTIONS**
- **Purpose**: Enable experimental ML features
- **Default**: `false`
- **Example**: `EXPERIMENTAL_ML_PREDICTIONS=true`

**EXPERIMENTAL_ROUTE_OPTIMIZATION**
- **Purpose**: Enable experimental routing
- **Default**: `false`
- **Example**: `EXPERIMENTAL_ROUTE_OPTIMIZATION=true`

### 🛠️ Development Settings

Only used when `NODE_ENV=development`

**DEV_MOCK_APIS**
- **Purpose**: Use mock API responses
- **Default**: `false`
- **Example**: `DEV_MOCK_APIS=true`

**DEV_EXTENDED_LOGGING**
- **Purpose**: Verbose logging in development
- **Default**: `true`
- **Example**: `DEV_EXTENDED_LOGGING=true`

**DEV_HOT_RELOAD**
- **Purpose**: Enable hot reload
- **Default**: `true`
- **Example**: `DEV_HOT_RELOAD=true`

**DEV_DEBUG_MODE**
- **Purpose**: Enable debug features
- **Default**: `true`
- **Example**: `DEV_DEBUG_MODE=true`

### 🚀 Production Settings

Only used when `NODE_ENV=production`

**PROD_COMPRESSION_ENABLED**
- **Purpose**: Enable response compression
- **Default**: `true`
- **Example**: `PROD_COMPRESSION_ENABLED=true`

**PROD_CACHE_STATIC_ASSETS**
- **Purpose**: Cache static assets
- **Default**: `true`
- **Example**: `PROD_CACHE_STATIC_ASSETS=true`

**PROD_MINIFY_RESPONSES**
- **Purpose**: Minify JSON responses
- **Default**: `true`
- **Example**: `PROD_MINIFY_RESPONSES=true`

**PROD_SECURITY_HEADERS**
- **Purpose**: Add security headers
- **Default**: `true`
- **Example**: `PROD_SECURITY_HEADERS=true`

## Configuration Examples

### Minimal Configuration (Development)
```env
GEMINI_API_KEY=your_key_here
NODE_ENV=development
```

### Recommended Configuration (Development)
```env
GEMINI_API_KEY=your_key_here
MAPBOX_API_KEY=your_mapbox_token
NODE_ENV=development
LOG_LEVEL=debug
TRAFFIC_CACHE_DURATION=300000
```

### Production Configuration
```env
GEMINI_API_KEY=your_key_here
TOMTOM_API_KEY=your_tomtom_key
MAPBOX_API_KEY=your_mapbox_token
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
CORS_ORIGIN=https://bharatflow.com
LOG_LEVEL=warn
TRAFFIC_CACHE_DURATION=600000
API_RATE_LIMIT_MAX_REQUESTS=200
```

### High-Volume Configuration
```env
GEMINI_API_KEY=your_key_here
MAPBOX_API_KEY=your_mapbox_token
TRAFFIC_CACHE_DURATION=600000
TRAFFIC_RATE_LIMIT_PER_MINUTE=30
TRAFFIC_STREAM_INTERVAL=60000
API_RATE_LIMIT_MAX_REQUESTS=500
```

## Best Practices

### 1. Security
- ✅ Never commit `.env.local` to version control
- ✅ Use different API keys for dev and production
- ✅ Rotate API keys regularly
- ✅ Use environment-specific configurations

### 2. Performance
- ✅ Increase cache duration to reduce API calls
- ✅ Adjust rate limits based on your API tier
- ✅ Enable compression in production
- ✅ Monitor API usage and costs

### 3. Development
- ✅ Use debug logging during development
- ✅ Test with simulation mode first
- ✅ Add real APIs one at a time
- ✅ Monitor console for configuration issues

### 4. Production
- ✅ Use production-grade API keys
- ✅ Enable all security features
- ✅ Set appropriate rate limits
- ✅ Configure proper CORS origins
- ✅ Enable database backups

## Troubleshooting

### Server Won't Start
- Check if `.env.local` exists
- Verify GEMINI_API_KEY is set
- Check for syntax errors in .env file
- Ensure port is not already in use

### Traffic APIs Not Working
- Verify API keys are correct
- Check API key permissions
- Monitor rate limits
- Check console for error messages
- System will fallback to simulation automatically

### High API Costs
- Increase TRAFFIC_CACHE_DURATION
- Reduce TRAFFIC_RATE_LIMIT_PER_MINUTE
- Increase TRAFFIC_STREAM_INTERVAL
- Use Mapbox (best free tier)

### Performance Issues
- Enable compression
- Increase cache duration
- Reduce logging in production
- Optimize rate limits

## Environment Variables Priority

1. `.env.local` (highest priority)
2. `.env`
3. System environment variables
4. Default values in code

## Getting Help

- **Setup Issues**: Check backend/README.md
- **Traffic APIs**: See backend/REAL_TRAFFIC_API_GUIDE.md
- **API Quota**: See backend/API_QUOTA_GUIDE.md
- **General Help**: Check console logs for detailed error messages

## Summary

The environment configuration system provides:
- ✅ Flexible configuration without code changes
- ✅ Secure API key management
- ✅ Feature flags for easy testing
- ✅ Environment-specific settings
- ✅ Sensible defaults for quick start
- ✅ Production-ready optimizations

Start with minimal configuration and add features as needed!