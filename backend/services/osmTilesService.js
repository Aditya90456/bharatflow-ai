import fetch from 'node-fetch';

// OpenStreetMap Tiles Service
// Provides free map tiles from OpenStreetMap and other OSM-based providers

class OSMTilesService {
    constructor() {
        // OSM tile servers (completely free, no API key required)
        this.tileServers = {
            // Standard OSM
            osm: {
                url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
                description: 'Standard OpenStreetMap tiles'
            },
            
            // CartoDB (now CARTO) - Clean styles
            cartodb_light: {
                url: 'https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
                attribution: '© OpenStreetMap contributors, © CARTO',
                maxZoom: 18,
                description: 'Light theme map tiles'
            },
            
            cartodb_dark: {
                url: 'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
                attribution: '© OpenStreetMap contributors, © CARTO',
                maxZoom: 18,
                description: 'Dark theme map tiles'
            },
            
            // OpenTopoMap - Topographic style
            topo: {
                url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
                attribution: '© OpenStreetMap contributors, © OpenTopoMap',
                maxZoom: 17,
                description: 'Topographic style map tiles'
            },
            
            // Stamen (now Stadia Maps) - Artistic styles
            stamen_toner: {
                url: 'https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
                attribution: '© OpenStreetMap contributors, © Stamen Design',
                maxZoom: 18,
                description: 'High contrast black and white'
            },
            
            // Humanitarian OSM Team
            hot: {
                url: 'https://tile-a.openstreetmap.fr/hot/{z}/{x}/{y}.png',
                attribution: '© OpenStreetMap contributors, © Humanitarian OSM Team',
                maxZoom: 18,
                description: 'Humanitarian style highlighting hospitals, schools'
            }
        };
        
        // Cache for tile requests
        this.tileCache = new Map();
        this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours for tiles
        
        // Rate limiting (be respectful to free services)
        this.lastRequest = new Map();
        this.minInterval = 100; // 100ms between requests per server
    }

    // Get map tile from OSM providers
    async getOSMTile(provider, zoom, x, y) {
        const server = this.tileServers[provider];
        if (!server) {
            throw new Error(`Unknown OSM provider: ${provider}`);
        }

        // Check rate limiting
        if (!this.canMakeRequest(provider)) {
            throw new Error(`Rate limit exceeded for ${provider}`);
        }

        const cacheKey = `${provider}_${zoom}_${x}_${y}`;
        const cached = this.getCachedTile(cacheKey);
        if (cached) return cached;

        // Check zoom level limits
        if (zoom > server.maxZoom) {
            throw new Error(`Zoom level ${zoom} exceeds maximum ${server.maxZoom} for ${provider}`);
        }

        const url = server.url
            .replace('{z}', zoom)
            .replace('{x}', x)
            .replace('{y}', y);
        
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'BharatFlow-AI-Traffic-System/1.0'
                }
            });
            
            if (!response.ok) {
                throw new Error(`OSM tile request failed: ${response.status}`);
            }

            const tileBuffer = await response.buffer();
            
            // Cache the tile
            this.setCachedTile(cacheKey, tileBuffer);
            
            // Record request time for rate limiting
            this.recordRequest(provider);
            
            return tileBuffer;
        } catch (error) {
            console.error(`OSM tile error for ${provider}:`, error);
            throw error;
        }
    }

    // Get multiple tiles for a bounding box
    async getOSMTilesForBounds(provider, zoom, bounds) {
        const { north, south, east, west } = bounds;
        
        // Convert lat/lng to tile coordinates
        const tiles = this.getTileCoordinates(north, south, east, west, zoom);
        
        // Limit the number of tiles to prevent abuse
        if (tiles.length > 100) {
            throw new Error(`Too many tiles requested: ${tiles.length}. Maximum is 100.`);
        }
        
        const tilePromises = tiles.map(({ x, y }) => 
            this.getOSMTile(provider, zoom, x, y)
                .then(buffer => ({ x, y, buffer }))
                .catch(error => ({ x, y, error }))
        );

        return await Promise.all(tilePromises);
    }

    // Convert lat/lng bounds to tile coordinates
    getTileCoordinates(north, south, east, west, zoom) {
        const tiles = [];
        
        const minTileX = this.lonToTileX(west, zoom);
        const maxTileX = this.lonToTileX(east, zoom);
        const minTileY = this.latToTileY(north, zoom);
        const maxTileY = this.latToTileY(south, zoom);

        for (let x = minTileX; x <= maxTileX; x++) {
            for (let y = minTileY; y <= maxTileY; y++) {
                tiles.push({ x, y });
            }
        }

        return tiles;
    }

    // Convert longitude to tile X coordinate
    lonToTileX(lon, zoom) {
        return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
    }

    // Convert latitude to tile Y coordinate
    latToTileY(lat, zoom) {
        const latRad = lat * Math.PI / 180;
        return Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * Math.pow(2, zoom));
    }

    // Get available OSM providers
    getAvailableProviders() {
        return Object.keys(this.tileServers).map(key => ({
            id: key,
            name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            ...this.tileServers[key]
        }));
    }

    // Get provider info
    getProviderInfo(provider) {
        return this.tileServers[provider];
    }

    // Rate limiting
    canMakeRequest(provider) {
        const lastRequest = this.lastRequest.get(provider) || 0;
        return Date.now() - lastRequest >= this.minInterval;
    }

    recordRequest(provider) {
        this.lastRequest.set(provider, Date.now());
    }

    // Cache management
    getCachedTile(key) {
        const cached = this.tileCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.buffer;
        }
        return null;
    }

    setCachedTile(key, buffer) {
        this.tileCache.set(key, {
            buffer,
            timestamp: Date.now()
        });

        // Limit cache size (keep last 2000 tiles for OSM)
        if (this.tileCache.size > 2000) {
            const firstKey = this.tileCache.keys().next().value;
            this.tileCache.delete(firstKey);
        }
    }

    // Generate tile URL for frontend use
    getTileUrl(provider, zoom, x, y) {
        const server = this.tileServers[provider];
        if (!server) return null;
        
        return server.url
            .replace('{z}', zoom)
            .replace('{x}', x)
            .replace('{y}', y);
    }

    // Get tiles for Indian cities with appropriate zoom levels
    getIndianCityBounds() {
        return {
            'Bangalore': { 
                bounds: { north: 13.1727, south: 12.7727, east: 77.7946, west: 77.3946 },
                defaultZoom: 12
            },
            'Mumbai': { 
                bounds: { north: 19.2760, south: 18.8760, east: 73.0777, west: 72.6777 },
                defaultZoom: 11
            },
            'Delhi': { 
                bounds: { north: 28.8139, south: 28.4139, east: 77.4090, west: 77.0090 },
                defaultZoom: 11
            },
            'Chennai': { 
                bounds: { north: 13.2827, south: 12.8827, east: 80.4707, west: 80.0707 },
                defaultZoom: 12
            },
            'Hyderabad': { 
                bounds: { north: 17.5850, south: 17.1850, east: 78.6867, west: 78.2867 },
                defaultZoom: 12
            },
            'Kolkata': { 
                bounds: { north: 22.7726, south: 22.3726, east: 88.5639, west: 88.1639 },
                defaultZoom: 12
            },
            'Pune': { 
                bounds: { north: 18.7204, south: 18.3204, east: 73.0567, west: 72.6567 },
                defaultZoom: 12
            }
        };
    }
}

export default new OSMTilesService();