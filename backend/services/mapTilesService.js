import fetch from 'node-fetch';

// Mapbox Tiles Service
// Provides map tiles for visual map display

class MapTilesService {
    constructor() {
        this.apiKey = process.env.MAPBOX_API_KEY;
        this.baseUrl = 'https://api.mapbox.com/v4';
        
        // Cache for tile requests
        this.tileCache = new Map();
        this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours for tiles
    }

    // Get map tile
    async getMapTile(tileset, zoom, x, y, format = 'png') {
        if (!this.apiKey) {
            throw new Error('Mapbox API key not configured');
        }

        const cacheKey = `${tileset}_${zoom}_${x}_${y}_${format}`;
        const cached = this.getCachedTile(cacheKey);
        if (cached) return cached;

        const url = `${this.baseUrl}/${tileset}/${zoom}/${x}/${y}.${format}?access_token=${this.apiKey}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Tile request failed: ${response.status}`);
            }

            const tileBuffer = await response.buffer();
            
            // Cache the tile
            this.setCachedTile(cacheKey, tileBuffer);
            
            return tileBuffer;
        } catch (error) {
            console.error('Map tile error:', error);
            throw error;
        }
    }

    // Get multiple tiles for a bounding box
    async getTilesForBounds(tileset, zoom, bounds, format = 'png') {
        const { north, south, east, west } = bounds;
        
        // Convert lat/lng to tile coordinates
        const tiles = this.getTileCoordinates(north, south, east, west, zoom);
        
        const tilePromises = tiles.map(({ x, y }) => 
            this.getMapTile(tileset, zoom, x, y, format)
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

        // Limit cache size (keep last 1000 tiles)
        if (this.tileCache.size > 1000) {
            const firstKey = this.tileCache.keys().next().value;
            this.tileCache.delete(firstKey);
        }
    }

    // Get available tilesets
    getAvailableTilesets() {
        return {
            street: 'mapbox.streets',
            satellite: 'mapbox.satellite',
            hybrid: 'mapbox.streets-satellite',
            light: 'mapbox.light',
            dark: 'mapbox.dark',
            outdoors: 'mapbox.outdoors',
            traffic: 'mapbox.mapbox-traffic-v1'
        };
    }
}

export default new MapTilesService();