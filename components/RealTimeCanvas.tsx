import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { GRID_SIZE, BLOCK_SIZE, ROAD_WIDTH, CAR_SIZE, YELLOW_DURATION, MAX_SPEED, ACCELERATION, DECELERATION, getCanvasSize } from '../constants';
import { Intersection, Car, LightState, VehicleType, Incident, Road } from '../types';
import { liveLocationsService } from '../services/liveLocationsService';

interface RealTimeCanvasProps {
  intersections: Intersection[];
  setIntersections: React.Dispatch<React.SetStateAction<Intersection[]>>;
  cars: Car[];
  setCars: React.Dispatch<React.SetStateAction<Car[]>>;
  onUpdateStats: (totalCars: number, avgSpeed: number, queueMap: Record<string, number>) => void;
  isRunning: boolean;
  onIntersectionSelect: (id: string) => void;
  onCarSelect: (id: string) => void;
  selectedCarId: string | null;
  scenarioKey: string;
  cvModeActive: boolean;
  recentlyUpdatedJunctions: Set<string>;
  incidents: Incident[];
  onIncidentSelect: (id: string) => void;
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
  selectedIncidentId: string | null;
  closedRoads: Set<string>;
  roads: Road[];
  highlightedVehicleIds: Set<string> | null;
  highlightedIncidentIds: Set<string> | null;
  highlightedIntersectionId?: string | null;
  realTimeMode: boolean;
  dataStreamActive: boolean;
}

interface OSMTileData {
  x: number;
  y: number;
  zoom: number;
  imageData: HTMLImageElement | null;
  loading: boolean;
}

export const RealTimeCanvas: React.FC<RealTimeCanvasProps> = ({
  intersections,
  setIntersections,
  cars,
  setCars,
  onUpdateStats,
  isRunning,
  onIntersectionSelect,
  onCarSelect,
  selectedCarId,
  scenarioKey,
  cvModeActive,
  recentlyUpdatedJunctions,
  incidents,
  onIncidentSelect,
  setIncidents,
  selectedIncidentId,
  closedRoads,
  roads,
  highlightedVehicleIds,
  highlightedIncidentIds,
  highlightedIntersectionId,
  realTimeMode,
  dataStreamActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCountRef = useRef(0);
  const requestRef = useRef<number>(0);
  const confidenceMap = useRef<Map<string, number>>(new Map()).current;
  const particleSystemRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
  }>>([]);

  // Live data state
  const [liveDataEnabled, setLiveDataEnabled] = useState(false);
  const [liveVehicles, setLiveVehicles] = useState<Car[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  // OSM state
  const [osmProvider, setOsmProvider] = useState('osm');
  const [osmZoom, setOsmZoom] = useState(12);
  const [osmCenter, setOsmCenter] = useState({ lat: 12.9716, lng: 77.5946 }); // Bangalore
  const osmTilesRef = useRef<Map<string, OSMTileData>>(new Map());

  // City coordinates mapping
  const cityCoordinates = {
    'Bangalore': { lat: 12.9716, lng: 77.5946 },
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Delhi': { lat: 28.6139, lng: 77.2090 },
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Hyderabad': { lat: 17.3850, lng: 78.4867 },
    'Kolkata': { lat: 22.5726, lng: 88.3639 },
    'Pune': { lat: 18.5204, lng: 73.8567 }
  };

  // State and refs for panning
  const viewOffsetRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const dragStartPosRef = useRef({ x: 0, y: 0 });

  const physicsState = useRef({
    intersections: intersections,
    cars: cars,
    currentScenarioKey: scenarioKey,
    selectedCarId: selectedCarId,
    recentlyUpdatedJunctions: recentlyUpdatedJunctions,
    incidents: incidents,
    selectedIncidentId: selectedIncidentId,
    closedRoads: closedRoads,
    roads: roads,
    highlightedVehicleIds: highlightedVehicleIds,
    highlightedIncidentIds: highlightedIncidentIds,
    highlightedIntersectionId: highlightedIntersectionId,
  });

  useLayoutEffect(() => {
    if (scenarioKey !== physicsState.current.currentScenarioKey) {
       physicsState.current.intersections = intersections;
       physicsState.current.cars = cars;
       physicsState.current.currentScenarioKey = scenarioKey;
       // Reset view on scenario change
       viewOffsetRef.current = { x: 0, y: 0 };
    }
    physicsState.current.intersections = intersections;
    physicsState.current.cars = cars;
    physicsState.current.selectedCarId = selectedCarId;
    physicsState.current.recentlyUpdatedJunctions = recentlyUpdatedJunctions;
    physicsState.current.incidents = incidents;
    physicsState.current.selectedIncidentId = selectedIncidentId;
    physicsState.current.closedRoads = closedRoads;
    physicsState.current.roads = roads;
    physicsState.current.highlightedVehicleIds = highlightedVehicleIds;
    physicsState.current.highlightedIncidentIds = highlightedIncidentIds;
    physicsState.current.highlightedIntersectionId = highlightedIntersectionId;
  }, [intersections, cars, scenarioKey, selectedCarId, recentlyUpdatedJunctions, incidents, selectedIncidentId, closedRoads, roads, highlightedVehicleIds, highlightedIncidentIds, highlightedIntersectionId]);

  // Live data integration effect
  useEffect(() => {
    if (realTimeMode && dataStreamActive && isRunning) {
      setConnectionStatus('connecting');
      
      // Start live data stream
      liveLocationsService.startLiveStream(
        scenarioKey,
        (data) => {
          if (data.type === 'initial' || data.type === 'update') {
            const convertedVehicles = liveLocationsService.convertToCanvasFormat(data.vehicles);
            setLiveVehicles(convertedVehicles);
            setConnectionStatus('connected');
            setLiveDataEnabled(true);
          }
        },
        (error) => {
          console.error('Live data stream error:', error);
          setConnectionStatus('disconnected');
          setLiveDataEnabled(false);
        },
        {
          interval: 2000, // 2 second updates
          vehicleTypes: ['CAR', 'AUTO', 'BUS', 'POLICE']
        }
      );

      return () => {
        liveLocationsService.stopLiveStream();
        setConnectionStatus('disconnected');
        setLiveDataEnabled(false);
      };
    } else {
      liveLocationsService.stopLiveStream();
      setConnectionStatus('disconnected');
      setLiveDataEnabled(false);
    }
  }, [realTimeMode, dataStreamActive, isRunning, scenarioKey]);

  const getLaneCenter = (gridIdx: number, isVertical: boolean, isForward: boolean) => {
    const roadCenter = (gridIdx + 0.5) * BLOCK_SIZE;
    const offset = ROAD_WIDTH / 4;
    return isForward ? (isVertical ? roadCenter - offset : roadCenter - offset) : (isVertical ? roadCenter + offset : roadCenter + offset);
  };

  // OSM Tile Management
  const loadOSMTiles = async (lat: number, lng: number, zoom: number) => {
    const tileSize = 256;
    const canvasSize = getCanvasSize();
    
    // Calculate tile coordinates for the viewport
    const centerTileX = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
    const centerTileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    
    const tilesNeeded = Math.ceil(Math.max(canvasSize.width, canvasSize.height) / tileSize) + 2;
    
    for (let dx = -tilesNeeded; dx <= tilesNeeded; dx++) {
      for (let dy = -tilesNeeded; dy <= tilesNeeded; dy++) {
        const tileX = centerTileX + dx;
        const tileY = centerTileY + dy;
        const tileKey = `${osmProvider}_${zoom}_${tileX}_${tileY}`;
        
        if (!osmTilesRef.current.has(tileKey)) {
          osmTilesRef.current.set(tileKey, {
            x: tileX,
            y: tileY,
            zoom: zoom,
            imageData: null,
            loading: true
          });
          
          // Load tile asynchronously
          loadOSMTile(tileX, tileY, zoom, tileKey);
        }
      }
    }
  };

  const loadOSMTile = async (x: number, y: number, zoom: number, tileKey: string) => {
    try {
      const tileUrl = getOSMTileUrl(osmProvider, zoom, x, y);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const tileData = osmTilesRef.current.get(tileKey);
        if (tileData) {
          tileData.imageData = img;
          tileData.loading = false;
          osmTilesRef.current.set(tileKey, tileData);
        }
      };
      
      img.onerror = () => {
        const tileData = osmTilesRef.current.get(tileKey);
        if (tileData) {
          tileData.loading = false;
          osmTilesRef.current.set(tileKey, tileData);
        }
      };
      
      img.src = tileUrl;
    } catch (error) {
      console.error('Failed to load OSM tile:', error);
    }
  };

  const getOSMTileUrl = (provider: string, zoom: number, x: number, y: number): string => {
    const providers = {
      osm: `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
      cartodb_light: `https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/${zoom}/${x}/${y}.png`,
      cartodb_dark: `https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/${zoom}/${x}/${y}.png`,
      stamen_toner: `https://stamen-tiles.a.ssl.fastly.net/toner/${zoom}/${x}/${y}.png`
    };
    
    return providers[provider as keyof typeof providers] || providers.cartodb_dark;
  };

  const drawOSMBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Fill with dark background first
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    if (!realTimeMode) return;
    
    const tileSize = 256;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Calculate tile positions based on current view
    const pixelsPerDegree = Math.pow(2, osmZoom) * tileSize / 360;
    const centerPixelX = (osmCenter.lng + 180) * pixelsPerDegree;
    const centerPixelY = (1 - Math.log(Math.tan(osmCenter.lat * Math.PI / 180) + 1 / Math.cos(osmCenter.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, osmZoom) * tileSize;
    
    // Draw loaded tiles
    osmTilesRef.current.forEach((tileData: OSMTileData, tileKey: string) => {
      if (tileData.imageData && !tileData.loading) {
        const tilePixelX = tileData.x * tileSize;
        const tilePixelY = tileData.y * tileSize;
        
        const screenX = centerX + (tilePixelX - centerPixelX) + viewOffsetRef.current.x;
        const screenY = centerY + (tilePixelY - centerPixelY) + viewOffsetRef.current.y;
        
        // Only draw tiles that are visible
        if (screenX + tileSize > 0 && screenX < width && screenY + tileSize > 0 && screenY < height) {
          ctx.save();
          ctx.globalAlpha = 0.7; // Make tiles slightly transparent for overlay effect
          ctx.drawImage(tileData.imageData, screenX, screenY, tileSize, tileSize);
          ctx.restore();
        }
      }
    });
    
    // Add subtle grid overlay for better visibility
    if (dataStreamActive) {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 8]);
      
      for (let x = 0; x <= width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  };

  const spawnCar = (currentCars: Car[]): Car | null => {
    const edge = Math.floor(Math.random() * 4); 
    const laneIdx = Math.floor(Math.random() * GRID_SIZE);
    
    let x = 0, y = 0, dir: 'N'|'S'|'E'|'W' = 'S';
    
    if (edge === 0) { // Top (Southbound, Left)
      x = getLaneCenter(laneIdx, true, true);
      y = -CAR_SIZE * 3;
      dir = 'S';
    } else if (edge === 1) { // Right (Westbound, Bottom)
      x = GRID_SIZE * BLOCK_SIZE + CAR_SIZE * 3;
      y = getLaneCenter(laneIdx, false, false); 
      dir = 'W';
    } else if (edge === 2) { // Bottom (Northbound, Right)
      x = getLaneCenter(laneIdx, true, false);
      y = GRID_SIZE * BLOCK_SIZE + CAR_SIZE * 3;
      dir = 'N';
    } else { // Left (Eastbound, Top)
      x = -CAR_SIZE * 3;
      y = getLaneCenter(laneIdx, false, true);
      dir = 'E';
    }

    const r = Math.random();
    let type: VehicleType = 'CAR';
    let length = CAR_SIZE;
    let width = CAR_SIZE * 0.6;

    if (currentCars.filter(c => c.type === 'POLICE').length < 2 && r > 0.98) {
      type = 'POLICE';
      length = CAR_SIZE * 1.5;
      width = CAR_SIZE * 0.7;
    } else if (r > 0.92) {
      type = 'BUS';
      length = CAR_SIZE * 3.5;
      width = CAR_SIZE * 1.3;
    } else if (r > 0.65) {
      type = 'AUTO';
      length = CAR_SIZE * 0.8;
      width = CAR_SIZE * 0.7;
    }

    const isBlocked = currentCars.some(c => 
      Math.abs(c.x - x) < length * 3 && Math.abs(c.y - y) < length * 3
    );

    if (isBlocked) return null;

    return {
      id: Math.random().toString(36).substr(2, 9),
      x, y, dir,
      speed: MAX_SPEED * 0.5,
      targetIntersectionId: null,
      state: 'ACCELERATING',
      type, width, length,
      mission: type === 'POLICE' ? { type: 'PATROL', targetId: null } : null,
    };
  };

  const updateParticleSystem = () => {
    // Update existing particles
    particleSystemRef.current = particleSystemRef.current.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      particle.vx *= 0.98; // Friction
      particle.vy *= 0.98;
      return particle.life > 0;
    });

    // Add new particles for data streams
    if (dataStreamActive && frameCountRef.current % 3 === 0) {
      for (let i = 0; i < 2; i++) {
        particleSystemRef.current.push({
          x: Math.random() * GRID_SIZE * BLOCK_SIZE,
          y: Math.random() * GRID_SIZE * BLOCK_SIZE,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 60,
          maxLife: 60,
          color: Math.random() > 0.5 ? '#10B981' : '#06B6D4',
          size: Math.random() * 3 + 1,
        });
      }
    }

    // Add particles for moving vehicles
    if (realTimeMode) {
      physicsState.current.cars.forEach(car => {
        if (car.speed > 0.5 && frameCountRef.current % 5 === 0) {
          particleSystemRef.current.push({
            x: car.x + (Math.random() - 0.5) * car.width,
            y: car.y + (Math.random() - 0.5) * car.length,
            vx: (Math.random() - 0.5) * 1,
            vy: (Math.random() - 0.5) * 1,
            life: 30,
            maxLife: 30,
            color: car.type === 'POLICE' ? '#3B82F6' : '#10B981',
            size: 1,
          });
        }
      });
    }
  };

  const drawParticleSystem = (ctx: CanvasRenderingContext2D) => {
    particleSystemRef.current.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = particle.size * 2;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };

  const drawRealTimeBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Dynamic gradient background
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height));
    gradient.addColorStop(0, '#0F172A');
    gradient.addColorStop(0.5, '#1E293B');
    gradient.addColorStop(1, '#020617');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Animated grid overlay
    if (realTimeMode) {
      ctx.strokeStyle = `rgba(6, 182, 212, ${0.1 + Math.sin(frameCountRef.current / 60) * 0.05})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 8]);
      
      for (let x = 0; x <= width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // City blocks with enhanced visuals
    for(let x = 0; x <= GRID_SIZE; x++) {
      const xStart = x === 0 ? 0 : (x - 0.5) * BLOCK_SIZE + ROAD_WIDTH/2;
      const xEnd = x === GRID_SIZE ? width : (x + 0.5) * BLOCK_SIZE - ROAD_WIDTH/2;
      
      if (xEnd > xStart) {
        for(let y = 0; y <= GRID_SIZE; y++) {
          const yStart = y === 0 ? 0 : (y - 0.5) * BLOCK_SIZE + ROAD_WIDTH/2;
          const yEnd = y === GRID_SIZE ? height : (y + 0.5) * BLOCK_SIZE - ROAD_WIDTH/2;
          
          if (yEnd > yStart) {
             const w = xEnd - xStart;
             const h = yEnd - yStart;
             
             // Building gradient
             const buildingGradient = ctx.createLinearGradient(xStart, yStart, xStart + w, yStart + h);
             buildingGradient.addColorStop(0, '#1E293B');
             buildingGradient.addColorStop(1, '#0F172A');
             ctx.fillStyle = buildingGradient;
             ctx.fillRect(xStart, yStart, w, h);
             
             // Building outline
             ctx.strokeStyle = '#334155';
             ctx.lineWidth = 2;
             ctx.strokeRect(xStart + 5, yStart + 5, w - 10, h - 10);
             
             // Building details
             const bSize = Math.min(w, h) * 0.7;
             const bx = xStart + (w - bSize)/2;
             const by = yStart + (h - bSize)/2;
             
             ctx.fillStyle = '#475569';
             ctx.fillRect(bx, by, bSize, bSize);
             
             // Windows with lights
             const windowSize = 4;
             const windowSpacing = 12;
             for (let wx = bx + 8; wx < bx + bSize - 8; wx += windowSpacing) {
               for (let wy = by + 8; wy < by + bSize - 8; wy += windowSpacing) {
                 if (Math.random() > 0.3) { // Some windows are lit
                   ctx.fillStyle = '#FCD34D';
                   ctx.shadowColor = '#FCD34D';
                   ctx.shadowBlur = 4;
                   ctx.fillRect(wx, wy, windowSize, windowSize);
                   ctx.shadowBlur = 0;
                 } else {
                   ctx.fillStyle = '#1E293B';
                   ctx.fillRect(wx, wy, windowSize, windowSize);
                 }
               }
             }
             
             // Rooftop elements
             if ((x+y)%3 === 0) {
               ctx.fillStyle = '#10B981';
               ctx.shadowColor = '#10B981';
               ctx.shadowBlur = 8;
               ctx.beginPath();
               ctx.arc(bx + bSize*0.8, by + bSize*0.2, 3, 0, Math.PI*2);
               ctx.fill();
               ctx.shadowBlur = 0;
             }
          }
        }
      }
    }
  };

  const drawEnhancedRoads = (ctx: CanvasRenderingContext2D, width: number, height: number, carsOnRoads: Car[], currentClosedRoads: Set<string>) => {
    // Traffic density analysis
    const roadSegments: Record<string, { count: number; x: number, y: number, isVertical: boolean }> = {};
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            roadSegments[`road-${x}-${y}-h`] = { count: 0, x, y, isVertical: false };
            roadSegments[`road-${x}-${y}-v`] = { count: 0, x, y, isVertical: true };
        }
    }

    carsOnRoads.forEach(car => {
        const roadX = Math.floor(car.x / BLOCK_SIZE);
        const roadY = Math.floor(car.y / BLOCK_SIZE);
        const key = car.dir === 'N' || car.dir === 'S' ? `road-${roadX}-${roadY}-v` : `road-${roadX}-${roadY}-h`;
        if (roadSegments[key]) {
            roadSegments[key].count++;
        }
    });

    // Draw roads with enhanced visuals
    for (let x = 0; x < GRID_SIZE; x++) {
      const cx = (x + 0.5) * BLOCK_SIZE;
      
      // Road base
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = ROAD_WIDTH;
      ctx.beginPath(); 
      ctx.moveTo(cx, 0); 
      ctx.lineTo(cx, height); 
      ctx.stroke();
      
      // Lane dividers with animation
      ctx.strokeStyle = `rgba(156, 163, 175, ${0.3 + Math.sin(frameCountRef.current / 30) * 0.1})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([15, 25]);
      ctx.lineDashOffset = frameCountRef.current / 2;
      ctx.beginPath(); 
      ctx.moveTo(cx, 0); 
      ctx.lineTo(cx, height); 
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Road edges with glow
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.lineWidth = 1;
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 3;
      ctx.beginPath(); 
      ctx.moveTo(cx - ROAD_WIDTH/2, 0); 
      ctx.lineTo(cx - ROAD_WIDTH/2, height); 
      ctx.stroke();
      ctx.beginPath(); 
      ctx.moveTo(cx + ROAD_WIDTH/2, 0); 
      ctx.lineTo(cx + ROAD_WIDTH/2, height); 
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    for (let y = 0; y < GRID_SIZE; y++) {
      const cy = (y + 0.5) * BLOCK_SIZE;
      
      // Road base
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = ROAD_WIDTH;
      ctx.beginPath(); 
      ctx.moveTo(0, cy); 
      ctx.lineTo(width, cy); 
      ctx.stroke();
      
      // Lane dividers with animation
      ctx.strokeStyle = `rgba(156, 163, 175, ${0.3 + Math.sin(frameCountRef.current / 30) * 0.1})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([15, 25]);
      ctx.lineDashOffset = frameCountRef.current / 2;
      ctx.beginPath(); 
      ctx.moveTo(0, cy); 
      ctx.lineTo(width, cy); 
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Road edges with glow
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.lineWidth = 1;
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 3;
      ctx.beginPath(); 
      ctx.moveTo(0, cy - ROAD_WIDTH/2); 
      ctx.lineTo(width, cy - ROAD_WIDTH/2); 
      ctx.stroke();
      ctx.beginPath(); 
      ctx.moveTo(0, cy + ROAD_WIDTH/2); 
      ctx.lineTo(width, cy + ROAD_WIDTH/2); 
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // Traffic density visualization
    Object.values(roadSegments).forEach(seg => {
        if (seg.count > 1) {
            const congestionLevel = Math.min(seg.count / 6, 1);
            let color;
            if (congestionLevel > 0.7) {
                color = `rgba(239, 68, 68, ${0.2 + congestionLevel * 0.4})`;
            } else if (congestionLevel > 0.4) {
                color = `rgba(245, 158, 11, ${0.2 + congestionLevel * 0.3})`;
            } else {
                color = `rgba(16, 185, 129, ${0.1 + congestionLevel * 0.2})`;
            }
            
            ctx.fillStyle = color;
            ctx.shadowColor = color.includes('239') ? '#EF4444' : color.includes('245') ? '#F59E0B' : '#10B981';
            ctx.shadowBlur = 8;
            
            if (seg.isVertical) {
                const cx = (seg.x + 0.5) * BLOCK_SIZE;
                ctx.fillRect(cx - ROAD_WIDTH/2, seg.y * BLOCK_SIZE, ROAD_WIDTH, BLOCK_SIZE);
            } else {
                const cy = (seg.y + 0.5) * BLOCK_SIZE;
                ctx.fillRect(seg.x * BLOCK_SIZE, cy - ROAD_WIDTH/2, BLOCK_SIZE, ROAD_WIDTH);
            }
            ctx.shadowBlur = 0;
        }
    });

    // Closed roads with enhanced animation
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    for (const segmentId of currentClosedRoads) {
        const [id1, id2] = segmentId.split('_');
        const int1 = physicsState.current.intersections.find(i => i.id === id1);
        const int2 = physicsState.current.intersections.find(i => i.id === id2);
        if (int1 && int2) {
            const x1 = (int1.x + 0.5) * BLOCK_SIZE;
            const y1 = (int1.y + 0.5) * BLOCK_SIZE;
            const x2 = (int2.x + 0.5) * BLOCK_SIZE;
            const y2 = (int2.y + 0.5) * BLOCK_SIZE;

            ctx.save();
            
            // Animated warning stripes
            const pulse = Math.abs(Math.sin(frameCountRef.current / 20));
            ctx.strokeStyle = '#EF4444';
            ctx.setLineDash([20, 15]);
            ctx.lineDashOffset = frameCountRef.current;
            ctx.lineWidth = 10 + pulse * 6;
            ctx.shadowColor = '#EF4444';
            ctx.shadowBlur = 20;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            
            // White overlay stripes
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineDashOffset = frameCountRef.current + 20;
            ctx.lineWidth = 6;
            ctx.shadowBlur = 10;
            ctx.stroke();

            ctx.restore();
        }
    }
  };

  const drawEnhancedCars = (ctx: CanvasRenderingContext2D, carsToDraw: Car[]) => {
    carsToDraw.forEach(car => {
      ctx.save();
      ctx.translate(car.x, car.y);
      let angle = 0;
      if (car.dir === 'S') angle = Math.PI;
      if (car.dir === 'W') angle = -Math.PI / 2;
      if (car.dir === 'E') angle = Math.PI / 2;
      ctx.rotate(angle);

      // Enhanced shadow
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-car.width/2 + 3, -car.length/2 + 3, car.width, car.length);

      if (car.type === 'POLICE') {
        // Police car with enhanced details
        const gradient = ctx.createLinearGradient(-car.width/2, -car.length/2, car.width/2, car.length/2);
        gradient.addColorStop(0, '#F8FAFC');
        gradient.addColorStop(1, '#E2E8F0');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(-car.width/2, -car.length/2, car.width, car.length, 3);
        ctx.fill();

        // Police stripes
        ctx.fillStyle = '#1E40AF';
        ctx.fillRect(-car.width/2, -car.length/4, car.width, car.length/8);

        const sirenOn = car.mission?.type === 'RESPONSE';
        if (sirenOn) {
            const whichLight = Math.floor(frameCountRef.current / 8) % 2 === 0;
            const color = whichLight ? '#3B82F6' : '#EF4444';
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 25;
            ctx.beginPath();
            ctx.arc(-car.width/4, -car.length/3, car.width/4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(car.width/4, -car.length/3, car.width/4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
      } else if (car.type === 'AUTO') {
        // Auto-rickshaw with enhanced design
        const gradient = ctx.createLinearGradient(-car.width/2, -car.length/2, car.width/2, car.length/2);
        gradient.addColorStop(0, '#FCD34D');
        gradient.addColorStop(1, '#F59E0B');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, -car.length/2);
        ctx.lineTo(car.width/2, car.length/2);
        ctx.lineTo(-car.width/2, car.length/2);
        ctx.fill();
        
        // Passenger area
        ctx.fillStyle = '#1F2937';
        ctx.fillRect(-car.width/3, -car.length/4, car.width/1.5, car.length/2);
        
        // Headlight
        ctx.fillStyle = '#FBBF24';
        ctx.shadowColor = '#FBBF24';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, -car.length/2 + 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Regular cars and buses with enhanced visuals
        const isElectric = Math.random() > 0.8;
        let gradient;
        
        if (car.type === 'BUS') {
          gradient = ctx.createLinearGradient(-car.width/2, -car.length/2, car.width/2, car.length/2);
          gradient.addColorStop(0, '#DC2626');
          gradient.addColorStop(1, '#B91C1C');
        } else {
          gradient = ctx.createLinearGradient(-car.width/2, -car.length/2, car.width/2, car.length/2);
          if (isElectric) {
            gradient.addColorStop(0, '#10B981');
            gradient.addColorStop(1, '#059669');
          } else {
            gradient.addColorStop(0, '#E5E7EB');
            gradient.addColorStop(1, '#D1D5DB');
          }
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(-car.width/2, -car.length/2, car.width, car.length, car.type === 'BUS' ? 2 : 3);
        ctx.fill();
        
        // Windows
        ctx.fillStyle = '#1E293B';
        const glassMargin = car.type === 'BUS' ? 3 : 2;
        ctx.fillRect(-car.width/2 + glassMargin, -car.length/2 + 4, car.width - glassMargin*2, car.length * 0.4);
        
        // Headlights
        ctx.fillStyle = '#F8FAFC';
        ctx.shadowColor = '#F8FAFC';
        ctx.shadowBlur = 6;
        ctx.fillRect(-car.width/3, -car.length/2, car.width/6, 2);
        ctx.fillRect(car.width/6, -car.length/2, car.width/6, 2);
        ctx.shadowBlur = 0;
        
        // Electric car indicator
        if (isElectric) {
          ctx.fillStyle = '#10B981';
          ctx.shadowColor = '#10B981';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(0, car.length/3, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      
      // Breakdown hazard lights
      if (car.isBrokenDown) {
          const hazardOn = Math.floor(frameCountRef.current / 15) % 2 === 0;
          if (hazardOn) {
              ctx.fillStyle = '#F59E0B';
              ctx.shadowColor = '#F59E0B';
              ctx.shadowBlur = 15;
              const positions = [
                [-car.width/2 - 3, -car.length/2 - 3],
                [car.width/2 + 1, -car.length/2 - 3],
                [-car.width/2 - 3, car.length/2 + 1],
                [car.width/2 + 1, car.length/2 + 1]
              ];
              positions.forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
              });
              ctx.shadowBlur = 0;
          }
      }

      ctx.restore();
      
      // Enhanced highlighting effects
      if (physicsState.current.highlightedVehicleIds?.has(car.id)) {
          ctx.strokeStyle = '#06B6D4';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#06B6D4';
          ctx.shadowBlur = 20;
          const pulse = Math.abs(Math.sin(frameCountRef.current / 12)) * 6;
          ctx.beginPath();
          ctx.arc(car.x, car.y, car.length + 8 + pulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
      }

      if (physicsState.current.selectedCarId === car.id) {
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 4;
          ctx.setLineDash([8, 8]);
          ctx.lineDashOffset = frameCountRef.current / 2;
          const pulse = Math.abs(Math.sin(frameCountRef.current / 15)) * 8;
          ctx.shadowColor = '#10B981';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(car.x, car.y, car.length + 6 + pulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;
      }

      // Speed trails for real-time mode
      if (realTimeMode && car.speed > 1) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = car.type === 'POLICE' ? '#3B82F6' : '#10B981';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        const trailLength = car.speed * 3;
        let trailX = car.x;
        let trailY = car.y;
        
        if (car.dir === 'N') trailY += trailLength;
        if (car.dir === 'S') trailY -= trailLength;
        if (car.dir === 'E') trailX -= trailLength;
        if (car.dir === 'W') trailX += trailLength;
        
        ctx.beginPath();
        ctx.moveTo(car.x, car.y);
        ctx.lineTo(trailX, trailY);
        ctx.stroke();
        ctx.restore();
      }
    });
  };

  const drawEnhancedIntersections = (ctx: CanvasRenderingContext2D, intersectionsToDraw: Intersection[]) => {
    intersectionsToDraw.forEach(intersection => {
      const cx = (intersection.x + 0.5) * BLOCK_SIZE;
      const cy = (intersection.y + 0.5) * BLOCK_SIZE;
      
      // Intersection base with gradient
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, ROAD_WIDTH/2);
      gradient.addColorStop(0, '#374151');
      gradient.addColorStop(1, '#1F2937');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.rect(cx - ROAD_WIDTH/2, cy - ROAD_WIDTH/2, ROAD_WIDTH, ROAD_WIDTH);
      ctx.fill();
      
      const lightSize = 10;
      const lightOffset = ROAD_WIDTH/2 - lightSize - 2;

      const colors = {
        [LightState.RED]: '#EF4444',
        [LightState.YELLOW]: '#F59E0B',
        [LightState.GREEN]: '#10B981'
      };
      
      // Enhanced traffic lights with glow
      const nsColor = colors[intersection.lightState.ns];
      ctx.fillStyle = nsColor;
      ctx.shadowColor = nsColor;
      ctx.shadowBlur = intersection.lightState.ns !== LightState.RED ? 20 : 8;
      
      // NS Lights with housing
      ctx.fillStyle = '#1F2937';
      ctx.fillRect(cx - lightSize/2 - 2, cy - lightOffset - 2, lightSize + 4, lightSize + 4);
      ctx.fillRect(cx - lightSize/2 - 2, cy + lightOffset - lightSize - 2, lightSize + 4, lightSize + 4);
      
      ctx.fillStyle = nsColor;
      ctx.beginPath();
      ctx.arc(cx, cy - lightOffset + lightSize/2, lightSize/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy + lightOffset - lightSize/2, lightSize/2, 0, Math.PI * 2);
      ctx.fill();
      
      // EW Lights with housing
      const ewColor = colors[intersection.lightState.ew];
      ctx.fillStyle = '#1F2937';
      ctx.fillRect(cx - lightOffset - 2, cy - lightSize/2 - 2, lightSize + 4, lightSize + 4);
      ctx.fillRect(cx + lightOffset - lightSize - 2, cy - lightSize/2 - 2, lightSize + 4, lightSize + 4);
      
      ctx.fillStyle = ewColor;
      ctx.shadowColor = ewColor;
      ctx.shadowBlur = intersection.lightState.ew !== LightState.RED ? 20 : 8;
      ctx.beginPath();
      ctx.arc(cx - lightOffset + lightSize/2, cy, lightSize/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + lightOffset - lightSize/2, cy, lightSize/2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;

      // Enhanced highlighting
      if(physicsState.current.highlightedIntersectionId === intersection.id) {
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 4;
        const pulse = Math.abs(Math.sin(frameCountRef.current / 15)) * 12;
        ctx.shadowColor = '#10B981';
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(cx, cy, ROAD_WIDTH * 0.8 + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      if(physicsState.current.recentlyUpdatedJunctions.has(intersection.id)) {
        ctx.strokeStyle = '#06B6D4';
        ctx.lineWidth = 4;
        const pulse = 1 - (frameCountRef.current % 120) / 120;
        ctx.globalAlpha = pulse;
        ctx.shadowColor = '#06B6D4';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(cx, cy, ROAD_WIDTH * 0.9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      }
    });
  };

  const drawDataStreamOverlay = (ctx: CanvasRenderingContext2D) => {
    if (!dataStreamActive) return;
    
    ctx.font = '10px "JetBrains Mono"';
    ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
    
    // Data points floating around
    const time = frameCountRef.current / 60;
    for (let i = 0; i < 5; i++) {
      const x = (Math.sin(time + i) * 100) + (i * BLOCK_SIZE);
      const y = (Math.cos(time + i * 0.7) * 80) + (i * BLOCK_SIZE * 0.8);
      
      if (x > 0 && x < GRID_SIZE * BLOCK_SIZE && y > 0 && y < GRID_SIZE * BLOCK_SIZE) {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillText(`${Math.floor(Math.random() * 100)}%`, x, y);
        ctx.restore();
      }
    }
  };

  const drawLiveDataStatus = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!realTimeMode || !dataStreamActive) return;

    // Draw connection status indicator
    const statusX = width - 200;
    const statusY = 30;
    
    ctx.save();
    ctx.font = 'bold 12px "JetBrains Mono"';
    
    // Status background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(statusX - 10, statusY - 20, 180, 35);
    
    // Status indicator
    let statusColor = '#EF4444'; // Red for disconnected
    let statusText = 'DISCONNECTED';
    
    if (connectionStatus === 'connected') {
      statusColor = '#10B981'; // Green for connected
      statusText = 'LIVE DATA ACTIVE';
    } else if (connectionStatus === 'connecting') {
      statusColor = '#F59E0B'; // Yellow for connecting
      statusText = 'CONNECTING...';
    }
    
    // Pulsing dot
    const pulse = Math.abs(Math.sin(frameCountRef.current / 20));
    ctx.fillStyle = statusColor;
    ctx.shadowColor = statusColor;
    ctx.shadowBlur = 10 + pulse * 5;
    ctx.beginPath();
    ctx.arc(statusX, statusY, 4 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Status text
    ctx.fillStyle = statusColor;
    ctx.fillText(statusText, statusX + 15, statusY + 4);
    
    // Vehicle count if connected
    if (connectionStatus === 'connected' && liveVehicles.length > 0) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.font = '10px "JetBrains Mono"';
      ctx.fillText(`${liveVehicles.length} LIVE VEHICLES`, statusX + 15, statusY + 18);
    }
    
    ctx.restore();
  };

  // Rest of the component logic remains similar but with enhanced animations...
  const animate = () => {
    frameCountRef.current++;
    updateParticleSystem();
    
    // Similar physics logic as before but with enhanced visual effects
    let newCars = [...physicsState.current.cars];
    let newIntersections = [...physicsState.current.intersections];

    if (isRunning) {
      // Update intersection timers and light states (same logic)
      newIntersections = newIntersections.map(intersection => {
        let timer = intersection.timer - 1;
        let ns = intersection.lightState.ns;
        let ew = intersection.lightState.ew;

        if (intersection.overrideState) {
          ns = (intersection.overrideState === 'NS_GREEN') ? LightState.GREEN : LightState.RED;
          ew = (intersection.overrideState === 'EW_GREEN') ? LightState.GREEN : LightState.RED;
          if (intersection.overrideState === 'EMERGENCY_ALL_RED') {
            ns = LightState.RED; ew = LightState.RED;
          }
        } else {
            if (timer <= 0) {
                if (ns === LightState.GREEN) {
                    ns = LightState.YELLOW;
                    timer = YELLOW_DURATION;
                } else if (ns === LightState.YELLOW) {
                    ns = LightState.RED;
                    ew = LightState.GREEN;
                    timer = intersection.greenDuration;
                } else if (ew === LightState.GREEN) {
                    ew = LightState.YELLOW;
                    timer = YELLOW_DURATION;
                } else if (ew === LightState.YELLOW) {
                    ew = LightState.RED;
                    ns = LightState.GREEN;
                    timer = intersection.greenDuration;
                }
            }
        }
        return { ...intersection, timer, lightState: { ns, ew } };
      });

      // Spawn new cars
      if (frameCountRef.current % 25 === 0 && newCars.length < 120) {
        const car = spawnCar(newCars);
        if (car) newCars.push(car);
      }

      // Enhanced car physics with real-time effects
      const queueMap: Record<string, number> = {};
      
      newCars = newCars.map(car => {
        if (car.isBrokenDown) return car;

        let { x, y, dir, speed, state, targetIntersectionId, mission } = car;
        
        // Enhanced movement with smoother acceleration
        const gridX = Math.floor(x / BLOCK_SIZE);
        const gridY = Math.floor(y / BLOCK_SIZE);
        
        // Set initial target intersection
        if (!targetIntersectionId) {
          if (dir === 'S') targetIntersectionId = `INT-${gridX}-${gridY}`;
          if (dir === 'N') targetIntersectionId = `INT-${gridX}-${gridY-1}`;
          if (dir === 'E') targetIntersectionId = `INT-${gridX}-${gridY}`;
          if (dir === 'W') targetIntersectionId = `INT-${gridX-1}-${gridY}`;
        }

        let isApproachingRed = false;
        let carInFront: Car | null = null;

        const currentIntersection = physicsState.current.intersections.find(i => i.id === targetIntersectionId);
        
        if (currentIntersection) {
          const intX = (currentIntersection.x + 0.5) * BLOCK_SIZE;
          const intY = (currentIntersection.y + 0.5) * BLOCK_SIZE;
          const dist = Math.hypot(x - intX, y - intY);
          
          const stoppingDist = (speed * speed) / (2 * DECELERATION) + car.length;
          
          const isPoliceResponding = car.type === 'POLICE' && mission?.type === 'RESPONSE';

          if (dist < stoppingDist && !isPoliceResponding) {
            const lightState = (dir === 'N' || dir === 'S') ? currentIntersection.lightState.ns : currentIntersection.lightState.ew;
            if (lightState === LightState.RED || (lightState === LightState.YELLOW && dist < ROAD_WIDTH/2)) {
              isApproachingRed = true;
            }
          }

          if (dist < ROAD_WIDTH * 1.5) {
              const queueKey = `${currentIntersection.id}_${dir}`;
              if (!queueMap[queueKey]) queueMap[queueKey] = 0;
              queueMap[queueKey]++;
          }
        }
        
        // Car following logic
        carInFront = newCars.find(otherCar => {
           if (otherCar.id === car.id) return false;
           let dX = otherCar.x - x;
           let dY = otherCar.y - y;
           if (dir === 'N') return dY < 0 && dY > -50 && Math.abs(dX) < car.width;
           if (dir === 'S') return dY > 0 && dY < 50 && Math.abs(dX) < car.width;
           if (dir === 'E') return dX > 0 && dX < 50 && Math.abs(dY) < car.width;
           if (dir === 'W') return dX < 0 && dX > -50 && Math.abs(dY) < car.width;
           return false;
        }) ?? null;

        // Enhanced speed control
        if (isApproachingRed || carInFront) {
          state = 'STOPPED';
          speed = Math.max(0, speed - DECELERATION * 1.2);
        } else {
          state = 'MOVING';
          const targetSpeed = realTimeMode ? MAX_SPEED * 1.2 : MAX_SPEED;
          speed = Math.min(targetSpeed, speed + ACCELERATION);
        }
        
        // Movement
        if (dir === 'N') y -= speed;
        if (dir === 'S') y += speed;
        if (dir === 'E') x += speed;
        if (dir === 'W') x -= speed;

        return { ...car, x, y, dir, speed, state, targetIntersectionId, mission };
      }).filter(c => 
          c.x > -100 && c.x < GRID_SIZE * BLOCK_SIZE + 100 &&
          c.y > -100 && c.y < GRID_SIZE * BLOCK_SIZE + 100
      );

      setCars(liveDataEnabled && liveVehicles.length > 0 ? liveVehicles : newCars);
      setIntersections(newIntersections);

      const totalSpeed = newCars.reduce((sum, car) => sum + car.speed, 0);
      onUpdateStats(newCars.length, newCars.length > 0 ? totalSpeed / newCars.length : 0, queueMap);
    }

    // Enhanced drawing
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const { width, height } = getCanvasSize();
      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(viewOffsetRef.current.x, viewOffsetRef.current.y);
      
      drawRealTimeBackground(ctx, width, height);
      drawEnhancedRoads(ctx, width, height, newCars, physicsState.current.closedRoads);
      drawEnhancedIntersections(ctx, physicsState.current.intersections);
      drawEnhancedCars(ctx, newCars);
      drawParticleSystem(ctx);
      
      if (cvModeActive) {
        // Enhanced CV overlay with real-time data
        ctx.font = '12px "JetBrains Mono"';
        ctx.lineWidth = 2;
        newCars.forEach(car => {
          const key = car.id;
          if (!confidenceMap.has(key)) {
             confidenceMap.set(key, 0.85 + Math.random() * 0.15);
          }
          const confidence = confidenceMap.get(key)!;
          
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.4 + confidence * 0.4})`;
          ctx.shadowColor = '#10B981';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.rect(car.x - car.width * 1.2, car.y - car.length * 1.2, car.width * 2.4, car.length * 2.4);
          ctx.stroke();
          ctx.shadowBlur = 0;

          ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
          const text = `${car.type}:${(confidence*100).toFixed(0)}%`;
          const textWidth = ctx.measureText(text).width;
          ctx.fillRect(car.x - textWidth/2 - 4, car.y - car.length - 20, textWidth + 8, 16);
          ctx.fillStyle = 'black';
          ctx.fillText(text, car.x - textWidth/2, car.y - car.length - 6);
        });
      }
      
      drawDataStreamOverlay(ctx);
      drawLiveDataStatus(ctx, width, height);
      ctx.restore();
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning, cvModeActive, realTimeMode, dataStreamActive]);

  // Mouse interaction handlers (same as before)
  const processClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX - viewOffsetRef.current.x;
    const y = (event.clientY - rect.top) * scaleY - viewOffsetRef.current.y;

    const clickedCar = physicsState.current.cars.find(car => {
      const dist = Math.hypot(x - car.x, y - car.y);
      return dist < car.length;
    });

    if (clickedCar) {
      onCarSelect(clickedCar.id);
      return;
    }

    const clickedIntersection = physicsState.current.intersections.find(i => {
      const intX = (i.x + 0.5) * BLOCK_SIZE;
      const intY = (i.y + 0.5) * BLOCK_SIZE;
      const dist = Math.hypot(x - intX, y - intY);
      return dist < ROAD_WIDTH / 2;
    });

    if (clickedIntersection) {
      onIntersectionSelect(clickedIntersection.id);
      return;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    viewOffsetRef.current.x += dx;
    viewOffsetRef.current.y += dy;
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
        const dx = e.clientX - dragStartPosRef.current.x;
        const dy = e.clientY - dragStartPosRef.current.y;
        if (Math.hypot(dx, dy) < 5) {
            processClick(e);
        }
    }
    isDraggingRef.current = false;
    e.currentTarget.style.cursor = 'grab';
  };
  
  const handleMouseLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
      isDraggingRef.current = false;
      e.currentTarget.style.cursor = 'grab';
  };

  return (
    <canvas 
      ref={canvasRef} 
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className="bg-gradient-to-br from-slate-900 to-gray-900" 
      style={{ cursor: 'grab' }}
    />
  );
};