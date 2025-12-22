import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MapPinIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  SignalIcon,
  WifiIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { StatusBadge } from './ui/StatusBadge';

interface LiveTrafficMapProps {
  city: string;
  onTrafficUpdate?: (data: any) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showIncidents?: boolean;
  showPredictions?: boolean;
}

interface TrafficData {
  source: string;
  timestamp: number;
  currentSpeed: number;
  freeFlowSpeed: number;
  congestionLevel: number;
  confidence: number;
  coordinates: { lat: number; lng: number };
  incidents: Array<{
    id: string;
    type: string;
    description: string;
    severity: string;
    location: { lat: number; lng: number };
    timestamp: number;
  }>;
  isRushHour?: boolean;
  isWeekend?: boolean;
}

interface MapTile {
  x: number;
  y: number;
  data: string | null;
  error?: string;
}

export const LiveTrafficMap: React.FC<LiveTrafficMapProps> = ({
  city,
  onTrafficUpdate,
  autoRefresh = true,
  refreshInterval = 30000,
  showIncidents: initialShowIncidents = true,
  showPredictions = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [mapTiles, setMapTiles] = useState<MapTile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mapProvider, setMapProvider] = useState('cartodb_light');
  const [zoom, setZoom] = useState(12);
  const [showTrafficOverlay, setShowTrafficOverlay] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showIncidents, setShowIncidents] = useState(initialShowIncidents);
  
  // City coordinates and bounds
  const cityData = {
    'Bangalore': { 
      center: { lat: 12.9716, lng: 77.5946 },
      bounds: { north: 13.1727, south: 12.7727, east: 77.7946, west: 77.3946 }
    },
    'Mumbai': { 
      center: { lat: 19.0760, lng: 72.8777 },
      bounds: { north: 19.2760, south: 18.8760, east: 73.0777, west: 72.6777 }
    },
    'Delhi': { 
      center: { lat: 28.6139, lng: 77.2090 },
      bounds: { north: 28.8139, south: 28.4139, east: 77.4090, west: 77.0090 }
    },
    'Chennai': { 
      center: { lat: 13.0827, lng: 80.2707 },
      bounds: { north: 13.2827, south: 12.8827, east: 80.4707, west: 80.0707 }
    },
    'Hyderabad': { 
      center: { lat: 17.3850, lng: 78.4867 },
      bounds: { north: 17.5850, south: 17.1850, east: 78.6867, west: 78.2867 }
    },
    'Kolkata': { 
      center: { lat: 22.5726, lng: 88.3639 },
      bounds: { north: 22.7726, south: 22.3726, east: 88.5639, west: 88.1639 }
    },
    'Pune': { 
      center: { lat: 18.5204, lng: 73.8567 },
      bounds: { north: 18.7204, south: 18.3204, east: 73.0567, west: 72.6567 }
    }
  };

  const currentCityData = cityData[city as keyof typeof cityData];

  // Fetch OSM tiles for the city
  const fetchOSMTiles = useCallback(async () => {
    if (!currentCityData) return;

    try {
      const response = await fetch('/api/osm/bounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: mapProvider,
          zoom: zoom,
          bounds: currentCityData.bounds
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch OSM tiles: ${response.status}`);
      }

      const data = await response.json();
      setMapTiles(data.tiles || []);
    } catch (error) {
      console.error('OSM tiles error:', error);
      setError('Failed to load map tiles');
    }
  }, [currentCityData, mapProvider, zoom]);

  // Fetch real-time traffic data
  const fetchTrafficData = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/traffic/realtime/${city}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTrafficData(data);
      setLastUpdate(Date.now());
      
      if (onTrafficUpdate) {
        onTrafficUpdate(data);
      }
    } catch (err) {
      console.error('Failed to fetch traffic data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch traffic data');
    } finally {
      setIsLoading(false);
    }
  }, [city, onTrafficUpdate, isLoading]);

  // Start streaming real-time data
  const startStreaming = useCallback(() => {
    if (isStreaming) return;
    
    setIsStreaming(true);
    setError(null);
    
    const eventSource = new EventSource(`/api/traffic/stream/${city}?interval=${refreshInterval}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          setError(data.error);
        } else {
          setTrafficData(data);
          setLastUpdate(Date.now());
          if (onTrafficUpdate) {
            onTrafficUpdate(data);
          }
        }
      } catch (err) {
        console.error('Error parsing stream data:', err);
      }
    };
    
    eventSource.onerror = () => {
      setError('Connection lost. Retrying...');
      setIsStreaming(false);
      eventSource.close();
      
      setTimeout(() => {
        if (autoRefresh) {
          startStreaming();
        }
      }, 5000);
    };
    
    return () => {
      eventSource.close();
      setIsStreaming(false);
    };
  }, [city, refreshInterval, onTrafficUpdate, autoRefresh, isStreaming]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
  }, []);

  // Convert lat/lng to canvas coordinates
  const latLngToCanvas = useCallback((lat: number, lng: number, canvasWidth: number, canvasHeight: number) => {
    if (!currentCityData) return { x: 0, y: 0 };
    
    const bounds = currentCityData.bounds;
    const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * canvasWidth;
    const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * canvasHeight;
    
    return { x, y };
  }, [currentCityData]);

  // Draw map tiles on canvas
  const drawMapTiles = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw tiles if available
    mapTiles.forEach((tile) => {
      if (tile.data) {
        const img = new Image();
        img.onload = () => {
          const tileSize = 256;
          const tilesPerRow = Math.ceil(width / tileSize);
          const tileX = (tile.x % tilesPerRow) * tileSize;
          const tileY = Math.floor(tile.x / tilesPerRow) * tileSize;
          
          ctx.drawImage(img, tileX, tileY, tileSize, tileSize);
        };
        img.src = `data:image/png;base64,${tile.data}`;
      }
    });
  }, [mapTiles]);

  // Draw traffic heatmap overlay
  const drawTrafficHeatmap = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!trafficData || !showHeatmap) return;
    
    const { coordinates, congestionLevel } = trafficData;
    const center = latLngToCanvas(coordinates.lat, coordinates.lng, width, height);
    
    // Create radial gradient for traffic intensity
    const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 100);
    
    const intensity = congestionLevel / 100;
    if (intensity > 0.8) {
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)'); // Red
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0.1)');
    } else if (intensity > 0.6) {
      gradient.addColorStop(0, 'rgba(245, 158, 11, 0.8)'); // Orange
      gradient.addColorStop(1, 'rgba(245, 158, 11, 0.1)');
    } else if (intensity > 0.4) {
      gradient.addColorStop(0, 'rgba(234, 179, 8, 0.8)'); // Yellow
      gradient.addColorStop(1, 'rgba(234, 179, 8, 0.1)');
    } else {
      gradient.addColorStop(0, 'rgba(34, 197, 94, 0.8)'); // Green
      gradient.addColorStop(1, 'rgba(34, 197, 94, 0.1)');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw traffic flow lines (simulated)
    ctx.strokeStyle = intensity > 0.6 ? '#ef4444' : intensity > 0.4 ? '#f59e0b' : '#22c55e';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // Draw some traffic flow indicators
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72) * Math.PI / 180;
      const startX = center.x + Math.cos(angle) * 20;
      const startY = center.y + Math.sin(angle) * 20;
      const endX = center.x + Math.cos(angle) * 80;
      const endY = center.y + Math.sin(angle) * 80;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  }, [trafficData, showHeatmap, latLngToCanvas]);

  // Draw traffic incidents
  const drawIncidents = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!trafficData?.incidents || !showIncidents) return;
    
    trafficData.incidents.forEach((incident) => {
      const pos = latLngToCanvas(incident.location.lat, incident.location.lng, width, height);
      
      // Draw incident marker
      ctx.fillStyle = incident.severity === 'HIGH' ? '#ef4444' : 
                     incident.severity === 'MEDIUM' ? '#f59e0b' : '#eab308';
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw incident icon
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('!', pos.x, pos.y + 4);
      
      // Draw pulsing effect for high severity
      if (incident.severity === 'HIGH') {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 12 + Math.sin(Date.now() / 200) * 3, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
  }, [trafficData, showIncidents, latLngToCanvas]);

  // Main canvas drawing function
  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvas;
    
    // Draw base map
    drawMapTiles(ctx, width, height);
    
    // Draw traffic overlay
    if (showTrafficOverlay) {
      drawTrafficHeatmap(ctx, width, height);
    }
    
    // Draw incidents
    drawIncidents(ctx, width, height);
    
    // Draw city center marker
    if (currentCityData) {
      const center = latLngToCanvas(
        currentCityData.center.lat, 
        currentCityData.center.lng, 
        width, 
        height
      );
      
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(center.x, center.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 6, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }, [drawMapTiles, drawTrafficHeatmap, drawIncidents, showTrafficOverlay, currentCityData, latLngToCanvas]);

  // Initialize and update map
  useEffect(() => {
    fetchOSMTiles();
  }, [fetchOSMTiles]);

  useEffect(() => {
    fetchTrafficData();
    
    if (autoRefresh && !isStreaming) {
      const interval = setInterval(fetchTrafficData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchTrafficData, autoRefresh, refreshInterval, isStreaming]);

  useEffect(() => {
    drawMap();
  }, [drawMap, mapTiles, trafficData]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        drawMap();
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawMap]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getCongestionColor = (level: number) => {
    if (level >= 80) return 'text-red-400';
    if (level >= 60) return 'text-orange-400';
    if (level >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPinIcon className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">Live Traffic Map - {city}</h2>
          {trafficData && (
            <div className="px-2 py-1 rounded-full text-xs font-mono border border-cyan-500/30 bg-cyan-500/20 text-cyan-400">
              {trafficData.source.toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTrafficOverlay(!showTrafficOverlay)}
            className={showTrafficOverlay ? 'text-cyan-400' : 'text-gray-400'}
          >
            <SignalIcon className="w-4 h-4 mr-1" />
            Traffic
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowIncidents(!showIncidents)}
            className={showIncidents ? 'text-red-400' : 'text-gray-400'}
          >
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            Incidents
          </Button>
          
          {isStreaming ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={stopStreaming}
              className="text-red-400 hover:text-red-300"
            >
              <NoSymbolIcon className="w-4 h-4 mr-1" />
              Stop
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={startStreaming}
              className="text-green-400 hover:text-green-300"
            >
              <WifiIcon className="w-4 h-4 mr-1" />
              Stream
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchTrafficData}
            disabled={isLoading}
            className="text-cyan-400 hover:text-cyan-300"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Map Controls */}
      <Card variant="cyber" className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Map Style:</span>
              <select
                value={mapProvider}
                onChange={(e) => setMapProvider(e.target.value)}
                className="bg-surface border border-white/20 rounded px-2 py-1 text-sm text-white"
              >
                <option value="osm">OpenStreetMap</option>
                <option value="cartodb_light">Light Theme</option>
                <option value="cartodb_dark">Dark Theme</option>
                <option value="topo">Topographic</option>
                <option value="stamen_toner">High Contrast</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Zoom:</span>
              <input
                type="range"
                min="10"
                max="16"
                value={zoom}
                onChange={(e) => setZoom(parseInt(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-white w-8">{zoom}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={showHeatmap ? 'text-orange-400' : 'text-gray-400'}
            >
              {showHeatmap ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
              Heatmap
            </Button>
          </div>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card variant="cyber" className="border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-3 p-4">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-red-400 font-medium">Map Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Map Canvas */}
      <Card variant="cyber" className="p-0 overflow-hidden">
        <div className="relative w-full h-96 bg-surface">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ imageRendering: 'pixelated' }}
          />
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center">
                <ArrowPathIcon className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
                <p className="text-gray-400">Loading map data...</p>
              </div>
            </div>
          )}
          
          {/* Stream Status */}
          {isStreaming && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/70 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-mono">LIVE</span>
            </div>
          )}
          
          {/* Traffic Stats Overlay */}
          {trafficData && (
            <div className="absolute bottom-4 left-4 bg-black/70 p-3 rounded-lg">
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Speed:</span>
                  <span className="text-white">{trafficData.currentSpeed} km/h</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Congestion:</span>
                  <span className={getCongestionColor(trafficData.congestionLevel)}>
                    {trafficData.congestionLevel}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Incidents:</span>
                  <span className={trafficData.incidents.length > 0 ? 'text-red-400' : 'text-green-400'}>
                    {trafficData.incidents.length}
                  </span>
                </div>
                {lastUpdate && (
                  <div className="text-xs text-gray-500">
                    Updated: {formatTimestamp(lastUpdate)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Incidents List */}
      {trafficData && trafficData.incidents.length > 0 && showIncidents && (
        <Card variant="cyber" className="p-4">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
            Active Incidents ({trafficData.incidents.length})
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {trafficData.incidents.map((incident) => (
              <div key={incident.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface/50 border border-white/10">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  incident.severity === 'HIGH' ? 'bg-red-400' :
                  incident.severity === 'MEDIUM' ? 'bg-orange-400' : 'bg-yellow-400'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{incident.type}</span>
                    <StatusBadge 
                      status={incident.severity === 'HIGH' ? 'offline' : incident.severity === 'MEDIUM' ? 'warning' : 'idle'}
                    >
                      {incident.severity}
                    </StatusBadge>
                  </div>
                  <p className="text-sm text-gray-300">{incident.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimestamp(incident.timestamp)} • 
                    {incident.location.lat.toFixed(4)}, {incident.location.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Map Legend */}
      <Card variant="cyber" className="p-4">
        <h3 className="text-sm font-bold text-white mb-3">Map Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="text-gray-300">Free Flow (&lt;40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span className="text-gray-300">Light Traffic (40-60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-400"></div>
            <span className="text-gray-300">Heavy Traffic (60-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <span className="text-gray-300">Severe Congestion (&gt;80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400 border border-white"></div>
            <span className="text-gray-300">City Center</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400 flex items-center justify-center text-white text-xs">!</div>
            <span className="text-gray-300">Traffic Incident</span>
          </div>
        </div>
      </Card>
    </div>
  );
};