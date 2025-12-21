import { SearchResultItem, SearchContext } from '../types';

export interface OSMLocation {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type: 'city' | 'suburb' | 'road' | 'junction' | 'landmark' | 'building';
  importance: number;
  boundingBox?: [number, number, number, number]; // [minLat, minLng, maxLat, maxLng]
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export interface OSMSearchOptions {
  limit?: number;
  countryCode?: string;
  viewBox?: [number, number, number, number];
  bounded?: boolean;
  addressDetails?: boolean;
  extraTags?: boolean;
}

export class OSMLocationService {
  private readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
  private readonly OVERPASS_BASE_URL = 'https://overpass-api.de/api/interpreter';
  private cache = new Map<string, OSMLocation[]>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests (Nominatim policy)

  // Indian city bounds for better search results
  private readonly INDIAN_CITY_BOUNDS = {
    'Bangalore': [12.7727, 77.3946, 13.1727, 77.7946],
    'Mumbai': [18.8760, 72.6777, 19.2760, 73.0777],
    'Delhi': [28.4139, 77.0090, 28.8139, 77.4090],
    'Chennai': [12.8827, 80.0707, 13.2827, 80.4707],
    'Hyderabad': [17.1850, 78.2867, 17.5850, 78.6867],
    'Kolkata': [22.3726, 88.1639, 22.7726, 88.5639],
    'Pune': [18.3204, 72.6567, 18.7204, 73.0567]
  } as const;

  /**
   * Search for locations using Nominatim (OpenStreetMap's geocoding service)
   */
  async searchLocations(
    query: string, 
    city?: string, 
    options: OSMSearchOptions = {}
  ): Promise<OSMLocation[]> {
    const cacheKey = `${query}_${city}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.getCachedResults(cacheKey);
    if (cached) return cached;

    // Rate limiting for Nominatim
    await this.respectRateLimit();

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: (options.limit || 10).toString(),
      addressdetails: (options.addressDetails !== false).toString(),
      extratags: (options.extraTags || false).toString(),
      countrycodes: options.countryCode || 'in', // Default to India
    });

    // Add city context for better results
    if (city && this.INDIAN_CITY_BOUNDS[city as keyof typeof this.INDIAN_CITY_BOUNDS]) {
      const bounds = this.INDIAN_CITY_BOUNDS[city as keyof typeof this.INDIAN_CITY_BOUNDS];
      params.append('viewbox', bounds.join(','));
      params.append('bounded', '1');
    }

    // Add custom viewbox if provided
    if (options.viewBox) {
      params.set('viewbox', options.viewBox.join(','));
      params.set('bounded', (options.bounded !== false).toString());
    }

    try {
      const response = await fetch(`${this.NOMINATIM_BASE_URL}/search?${params}`, {
        headers: {
          'User-Agent': 'BharatFlow-AI-Traffic-System/1.0 (contact@bharatflow.ai)'
        }
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();
      const locations = this.parseNominatimResults(data);
      
      // Cache results
      this.setCachedResults(cacheKey, locations);
      
      return locations;
    } catch (error) {
      console.error('OSM location search error:', error);
      // Return fallback results based on query
      return this.getFallbackResults(query, city);
    }
  }

  /**
   * Get detailed information about a specific location
   */
  async getLocationDetails(osmId: string, osmType: 'node' | 'way' | 'relation'): Promise<OSMLocation | null> {
    await this.respectRateLimit();

    const params = new URLSearchParams({
      osm_type: osmType[0].toUpperCase(), // N, W, or R
      osm_id: osmId,
      format: 'json',
      addressdetails: '1',
      extratags: '1'
    });

    try {
      const response = await fetch(`${this.NOMINATIM_BASE_URL}/lookup?${params}`, {
        headers: {
          'User-Agent': 'BharatFlow-AI-Traffic-System/1.0 (contact@bharatflow.ai)'
        }
      });

      if (!response.ok) {
        throw new Error(`Nominatim lookup error: ${response.status}`);
      }

      const data = await response.json();
      return data.length > 0 ? this.parseNominatimResults(data)[0] : null;
    } catch (error) {
      console.error('OSM location details error:', error);
      return null;
    }
  }

  /**
   * Search for traffic-related locations (junctions, roads, traffic signals)
   */
  async searchTrafficLocations(query: string, city?: string): Promise<OSMLocation[]> {
    const trafficQuery = `${query} (junction OR intersection OR traffic signal OR road)`;
    return this.searchLocations(trafficQuery, city, {
      limit: 15,
      extraTags: true
    });
  }

  /**
   * Get nearby locations around a coordinate
   */
  async getNearbyLocations(
    lat: number, 
    lng: number, 
    radius: number = 1000, // meters
    types: string[] = ['amenity', 'highway', 'public_transport']
  ): Promise<OSMLocation[]> {
    const cacheKey = `nearby_${lat}_${lng}_${radius}_${types.join(',')}`;
    const cached = this.getCachedResults(cacheKey);
    if (cached) return cached;

    // Use Overpass API for nearby search
    const overpassQuery = this.buildOverpassQuery(lat, lng, radius, types);
    
    try {
      const response = await fetch(this.OVERPASS_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'BharatFlow-AI-Traffic-System/1.0'
        },
        body: `data=${encodeURIComponent(overpassQuery)}`
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();
      const locations = this.parseOverpassResults(data);
      
      this.setCachedResults(cacheKey, locations);
      return locations;
    } catch (error) {
      console.error('Nearby locations search error:', error);
      return [];
    }
  }

  /**
   * Convert OSM locations to search results for the search engine
   */
  convertToSearchResults(locations: OSMLocation[], context: SearchContext): SearchResultItem[] {
    return locations.map((location, index) => ({
      id: location.id,
      type: 'location',
      title: location.name,
      description: this.formatLocationDescription(location),
      relevanceScore: Math.max(0.1, location.importance || (1 - index * 0.1)),
      highlightedTerms: this.extractHighlightTerms(location.name, context),
      actionable: true,
      navigationTarget: `/map/${location.lat},${location.lng}`,
      metadata: {
        coordinates: { lat: location.lat, lng: location.lng },
        type: location.type,
        address: location.address,
        boundingBox: location.boundingBox
      }
    }));
  }

  /**
   * Generate simulation data for a location
   */
  generateLocationSimulation(location: OSMLocation): {
    trafficDensity: number;
    avgSpeed: number;
    incidents: number;
    congestionLevel: number;
  } {
    // Simulate traffic based on location type and time
    const hour = new Date().getHours();
    const isRushHour = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;

    let baseCongestion = 0.3;
    
    // Adjust based on location type
    switch (location.type) {
      case 'junction':
        baseCongestion = 0.6;
        break;
      case 'road':
        baseCongestion = 0.4;
        break;
      case 'city':
        baseCongestion = 0.5;
        break;
      default:
        baseCongestion = 0.3;
    }

    // Time-based adjustments
    if (isRushHour && !isWeekend) baseCongestion *= 1.5;
    else if (isRushHour && isWeekend) baseCongestion *= 1.2;
    else if (!isWeekend) baseCongestion *= 1.1;

    // Add randomness
    const congestionLevel = Math.min(100, Math.max(0, 
      (baseCongestion + (Math.random() - 0.5) * 0.3) * 100
    ));

    const avgSpeed = Math.max(5, 50 * (1 - congestionLevel / 100));
    const trafficDensity = Math.round(congestionLevel * 2);
    const incidents = Math.random() < (congestionLevel / 200) ? Math.floor(Math.random() * 3) + 1 : 0;

    return {
      trafficDensity,
      avgSpeed: Math.round(avgSpeed),
      incidents,
      congestionLevel: Math.round(congestionLevel)
    };
  }

  private async respectRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => 
        setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
  }

  private parseNominatimResults(data: any[]): OSMLocation[] {
    return data.map(item => ({
      id: `${item.osm_type}_${item.osm_id}`,
      name: item.name || item.display_name.split(',')[0],
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: this.mapOSMTypeToLocationType(item.type, item.class),
      importance: parseFloat(item.importance || '0'),
      boundingBox: item.boundingbox ? [
        parseFloat(item.boundingbox[0]),
        parseFloat(item.boundingbox[2]),
        parseFloat(item.boundingbox[1]),
        parseFloat(item.boundingbox[3])
      ] : undefined,
      address: item.address ? {
        road: item.address.road,
        suburb: item.address.suburb || item.address.neighbourhood,
        city: item.address.city || item.address.town || item.address.village,
        state: item.address.state,
        postcode: item.address.postcode,
        country: item.address.country
      } : undefined
    }));
  }

  private parseOverpassResults(data: any): OSMLocation[] {
    const elements = data.elements || [];
    return elements.map((element: any) => ({
      id: `${element.type}_${element.id}`,
      name: element.tags?.name || `${element.type} ${element.id}`,
      displayName: element.tags?.name || `${element.type} ${element.id}`,
      lat: element.lat || element.center?.lat || 0,
      lng: element.lon || element.center?.lon || 0,
      type: this.mapOSMTypeToLocationType(element.tags?.highway || element.tags?.amenity, ''),
      importance: 0.5,
      address: {
        road: element.tags?.['addr:street'],
        city: element.tags?.['addr:city'],
        postcode: element.tags?.['addr:postcode']
      }
    }));
  }

  private buildOverpassQuery(lat: number, lng: number, radius: number, types: string[]): string {
    const bbox = this.calculateBoundingBox(lat, lng, radius);
    const typeQueries = types.map(type => `["${type}"]`).join('');
    
    return `
      [out:json][timeout:25];
      (
        node${typeQueries}(${bbox.join(',')});
        way${typeQueries}(${bbox.join(',')});
        relation${typeQueries}(${bbox.join(',')});
      );
      out center meta;
    `;
  }

  private calculateBoundingBox(lat: number, lng: number, radius: number): [number, number, number, number] {
    const latOffset = radius / 111000; // Approximate meters to degrees
    const lngOffset = radius / (111000 * Math.cos(lat * Math.PI / 180));
    
    return [
      lat - latOffset,  // south
      lng - lngOffset,  // west
      lat + latOffset,  // north
      lng + lngOffset   // east
    ];
  }

  private mapOSMTypeToLocationType(type: string, osmClass: string): OSMLocation['type'] {
    if (type === 'city' || type === 'town' || type === 'village') return 'city';
    if (type === 'suburb' || type === 'neighbourhood') return 'suburb';
    if (type === 'primary' || type === 'secondary' || type === 'trunk' || osmClass === 'highway') return 'road';
    if (type === 'traffic_signals' || type === 'crossing') return 'junction';
    if (type === 'building') return 'building';
    return 'landmark';
  }

  private formatLocationDescription(location: OSMLocation): string {
    const parts = [];
    
    if (location.address?.road) parts.push(location.address.road);
    if (location.address?.suburb) parts.push(location.address.suburb);
    if (location.address?.city) parts.push(location.address.city);
    
    return parts.length > 0 ? parts.join(', ') : location.displayName;
  }

  private extractHighlightTerms(name: string, context: SearchContext): string[] {
    const terms = name.toLowerCase().split(/\s+/);
    return terms.filter(term => term.length > 2);
  }

  private getCachedResults(key: string): OSMLocation[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedResults(key: string, data: OSMLocation[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    
    // Limit cache size
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
  }

  private getFallbackResults(query: string, city?: string): OSMLocation[] {
    // Return some basic fallback results based on query
    const fallbacks: OSMLocation[] = [];
    
    if (query.toLowerCase().includes('junction') || query.toLowerCase().includes('signal')) {
      fallbacks.push({
        id: 'fallback_junction',
        name: `${query} (Simulated)`,
        displayName: `${query} - Traffic Junction`,
        lat: city ? this.getCityCenter(city).lat : 12.9716,
        lng: city ? this.getCityCenter(city).lng : 77.5946,
        type: 'junction',
        importance: 0.5
      });
    }
    
    return fallbacks;
  }

  private getCityCenter(city: string): { lat: number; lng: number } {
    const centers = {
      'Bangalore': { lat: 12.9716, lng: 77.5946 },
      'Mumbai': { lat: 19.0760, lng: 72.8777 },
      'Delhi': { lat: 28.6139, lng: 77.2090 },
      'Chennai': { lat: 13.0827, lng: 80.2707 },
      'Hyderabad': { lat: 17.3850, lng: 78.4867 },
      'Kolkata': { lat: 22.5726, lng: 88.3639 },
      'Pune': { lat: 18.5204, lng: 73.8567 }
    };
    
    return centers[city as keyof typeof centers] || centers['Bangalore'];
  }
}

export const osmLocationService = new OSMLocationService();