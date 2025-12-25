import React, { useState, useRef, useEffect } from 'react';
import { Intersection, Road, Car, Incident, TrafficStats } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface SimulationDesignerProps {
  intersections: Intersection[];
  roads: Road[];
  cars: Car[];
  incidents: Incident[];
  stats: TrafficStats;
  onIntersectionClick?: (intersection: Intersection) => void;
  onRoadClick?: (road: Road) => void;
  onAddIntersection?: (x: number, y: number) => void;
  onAddRoad?: (from: string, to: string) => void;
}

export const SimulationDesigner: React.FC<SimulationDesignerProps> = ({
  intersections,
  roads,
  cars,
  incidents,
  stats,
  onIntersectionClick,
  onRoadClick,
  onAddIntersection,
  onAddRoad
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedIntersection, setSelectedIntersection] = useState<string | null>(null);
  const [selectedRoad, setSelectedRoad] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'add-intersection' | 'add-road'>('view');
  const [hoveredElement, setHoveredElement] = useState<{ type: 'intersection' | 'road', id: string } | null>(null);

  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 800;
  const GRID_SIZE = 100;
  const INTERSECTION_SIZE = 20;
  const ROAD_WIDTH = 8;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      drawSimulation();
    }
  }, [intersections, roads, cars, incidents, selectedIntersection, selectedRoad, hoveredElement]);

  const drawSimulation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    drawGrid(ctx);
    
    // Draw roads first (behind everything)
    drawRoads(ctx);
    
    // Draw intersections
    drawIntersections(ctx);
    
    // Draw vehicles
    drawVehicles(ctx);
    
    // Draw incidents
    drawIncidents(ctx);
    
    // Draw labels and names
    drawLabels(ctx);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
  };

  const drawRoads = (ctx: CanvasRenderingContext2D) => {
    roads.forEach(road => {
      const int1 = intersections.find(i => i.id === road.intersection1Id);
      const int2 = intersections.find(i => i.id === road.intersection2Id);
      
      if (!int1 || !int2) return;

      const x1 = int1.x * GRID_SIZE + GRID_SIZE / 2;
      const y1 = int1.y * GRID_SIZE + GRID_SIZE / 2;
      const x2 = int2.x * GRID_SIZE + GRID_SIZE / 2;
      const y2 = int2.y * GRID_SIZE + GRID_SIZE / 2;

      // Road background
      ctx.strokeStyle = selectedRoad === road.id ? '#4ade80' : 
                       hoveredElement?.type === 'road' && hoveredElement.id === road.id ? '#60a5fa' : '#666';
      ctx.lineWidth = ROAD_WIDTH;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Road lanes
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      
      ctx.setLineDash([]);
    });
  };

  const drawIntersections = (ctx: CanvasRenderingContext2D) => {
    intersections.forEach(intersection => {
      const x = intersection.x * GRID_SIZE + GRID_SIZE / 2;
      const y = intersection.y * GRID_SIZE + GRID_SIZE / 2;

      // Intersection circle
      ctx.fillStyle = selectedIntersection === intersection.id ? '#fbbf24' : 
                     hoveredElement?.type === 'intersection' && hoveredElement.id === intersection.id ? '#60a5fa' : '#ef4444';
      
      ctx.beginPath();
      ctx.arc(x, y, INTERSECTION_SIZE, 0, 2 * Math.PI);
      ctx.fill();

      // Traffic light indicator
      const nsColor = intersection.lightState.ns === 'GREEN' ? '#22c55e' : 
                     intersection.lightState.ns === 'YELLOW' ? '#eab308' : '#ef4444';
      const ewColor = intersection.lightState.ew === 'GREEN' ? '#22c55e' : 
                     intersection.lightState.ew === 'YELLOW' ? '#eab308' : '#ef4444';

      // NS light
      ctx.fillStyle = nsColor;
      ctx.fillRect(x - 3, y - 15, 6, 8);
      
      // EW light
      ctx.fillStyle = ewColor;
      ctx.fillRect(x - 15, y - 3, 8, 6);

      // Timer display
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(intersection.timer.toString(), x, y + 35);
    });
  };

  const drawVehicles = (ctx: CanvasRenderingContext2D) => {
    cars.forEach(car => {
      const colors = {
        CAR: '#3b82f6',
        AUTO: '#f59e0b',
        BUS: '#10b981',
        POLICE: '#ef4444'
      };

      ctx.fillStyle = car.isBrokenDown ? '#6b7280' : colors[car.type];
      
      ctx.save();
      ctx.translate(car.x, car.y);
      
      // Rotate based on direction
      const rotations = { N: -Math.PI/2, S: Math.PI/2, E: 0, W: Math.PI };
      ctx.rotate(rotations[car.dir]);
      
      ctx.fillRect(-car.width/2, -car.length/2, car.width, car.length);
      
      if (car.isBrokenDown) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-2, -2, 4, 4);
      }
      
      ctx.restore();
    });
  };

  const drawIncidents = (ctx: CanvasRenderingContext2D) => {
    incidents.forEach(incident => {
      const colors = {
        BREAKDOWN: '#f59e0b',
        ACCIDENT: '#ef4444',
        CONSTRUCTION: '#8b5cf6'
      };

      ctx.fillStyle = colors[incident.type];
      ctx.beginPath();
      ctx.arc(incident.location.x, incident.location.y, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Warning symbol
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('!', incident.location.x, incident.location.y + 3);
    });
  };

  const drawLabels = (ctx: CanvasRenderingContext2D) => {
    // Draw big road names
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';

    roads.forEach(road => {
      const int1 = intersections.find(i => i.id === road.intersection1Id);
      const int2 = intersections.find(i => i.id === road.intersection2Id);
      
      if (!int1 || !int2) return;

      const x1 = int1.x * GRID_SIZE + GRID_SIZE / 2;
      const y1 = int1.y * GRID_SIZE + GRID_SIZE / 2;
      const x2 = int2.x * GRID_SIZE + GRID_SIZE / 2;
      const y2 = int2.y * GRID_SIZE + GRID_SIZE / 2;

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      // Road name with outline for visibility
      ctx.strokeText(road.name, midX, midY - 15);
      ctx.fillText(road.name, midX, midY - 15);
    });

    // Draw junction names
    ctx.font = 'bold 14px Arial';
    intersections.forEach(intersection => {
      const x = intersection.x * GRID_SIZE + GRID_SIZE / 2;
      const y = intersection.y * GRID_SIZE + GRID_SIZE / 2;

      // Junction label with background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      const textWidth = ctx.measureText(intersection.label).width;
      ctx.fillRect(x - textWidth/2 - 5, y - 45, textWidth + 10, 20);

      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(intersection.label, x, y - 30);
    });
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (mode === 'add-intersection') {
      const gridX = Math.floor(x / GRID_SIZE);
      const gridY = Math.floor(y / GRID_SIZE);
      onAddIntersection?.(gridX, gridY);
      return;
    }

    // Check intersection clicks
    for (const intersection of intersections) {
      const intX = intersection.x * GRID_SIZE + GRID_SIZE / 2;
      const intY = intersection.y * GRID_SIZE + GRID_SIZE / 2;
      const distance = Math.sqrt((x - intX) ** 2 + (y - intY) ** 2);
      
      if (distance <= INTERSECTION_SIZE) {
        setSelectedIntersection(intersection.id);
        setSelectedRoad(null);
        onIntersectionClick?.(intersection);
        return;
      }
    }

    // Check road clicks
    for (const road of roads) {
      const int1 = intersections.find(i => i.id === road.intersection1Id);
      const int2 = intersections.find(i => i.id === road.intersection2Id);
      
      if (!int1 || !int2) continue;

      const x1 = int1.x * GRID_SIZE + GRID_SIZE / 2;
      const y1 = int1.y * GRID_SIZE + GRID_SIZE / 2;
      const x2 = int2.x * GRID_SIZE + GRID_SIZE / 2;
      const y2 = int2.y * GRID_SIZE + GRID_SIZE / 2;

      // Check if click is near the road line
      const distance = distanceToLine(x, y, x1, y1, x2, y2);
      if (distance <= ROAD_WIDTH) {
        setSelectedRoad(road.id);
        setSelectedIntersection(null);
        onRoadClick?.(road);
        return;
      }
    }

    // Clear selection if clicking empty space
    setSelectedIntersection(null);
    setSelectedRoad(null);
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let newHovered: { type: 'intersection' | 'road', id: string } | null = null;

    // Check intersection hover
    for (const intersection of intersections) {
      const intX = intersection.x * GRID_SIZE + GRID_SIZE / 2;
      const intY = intersection.y * GRID_SIZE + GRID_SIZE / 2;
      const distance = Math.sqrt((x - intX) ** 2 + (y - intY) ** 2);
      
      if (distance <= INTERSECTION_SIZE) {
        newHovered = { type: 'intersection', id: intersection.id };
        break;
      }
    }

    // Check road hover if no intersection hovered
    if (!newHovered) {
      for (const road of roads) {
        const int1 = intersections.find(i => i.id === road.intersection1Id);
        const int2 = intersections.find(i => i.id === road.intersection2Id);
        
        if (!int1 || !int2) continue;

        const x1 = int1.x * GRID_SIZE + GRID_SIZE / 2;
        const y1 = int1.y * GRID_SIZE + GRID_SIZE / 2;
        const x2 = int2.x * GRID_SIZE + GRID_SIZE / 2;
        const y2 = int2.y * GRID_SIZE + GRID_SIZE / 2;

        const distance = distanceToLine(x, y, x1, y1, x2, y2);
        if (distance <= ROAD_WIDTH) {
          newHovered = { type: 'road', id: road.id };
          break;
        }
      }
    }

    setHoveredElement(newHovered);
  };

  const distanceToLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  return (
    <div className="w-full h-full bg-gray-900 p-4">
      <div className="flex gap-4 mb-4">
        <Card className="p-4 bg-gray-800 border-gray-700">
          <h3 className="text-lg font-bold text-white mb-2">Design Tools</h3>
          <div className="flex gap-2">
            <Button
              variant={mode === 'view' ? 'default' : 'outline'}
              onClick={() => setMode('view')}
              className="text-sm"
            >
              View
            </Button>
            <Button
              variant={mode === 'add-intersection' ? 'default' : 'outline'}
              onClick={() => setMode('add-intersection')}
              className="text-sm"
            >
              Add Junction
            </Button>
            <Button
              variant={mode === 'add-road' ? 'default' : 'outline'}
              onClick={() => setMode('add-road')}
              className="text-sm"
            >
              Add Road
            </Button>
          </div>
        </Card>

        <Card className="p-4 bg-gray-800 border-gray-700">
          <h3 className="text-lg font-bold text-white mb-2">Traffic Stats</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
            <div>Vehicles: {stats.totalCars}</div>
            <div>Avg Speed: {stats.avgSpeed.toFixed(1)} km/h</div>
            <div>Congestion: {stats.congestionLevel}%</div>
            <div>Incidents: {stats.incidents}</div>
          </div>
        </Card>
      </div>

      <Card className="p-4 bg-gray-800 border-gray-700">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          className="border border-gray-600 cursor-crosshair bg-gray-900"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </Card>

      {selectedIntersection && (
        <Card className="mt-4 p-4 bg-gray-800 border-gray-700">
          <h3 className="text-lg font-bold text-white mb-2">Selected Junction</h3>
          {(() => {
            const intersection = intersections.find(i => i.id === selectedIntersection);
            return intersection ? (
              <div className="text-gray-300">
                <p><strong>Name:</strong> {intersection.label}</p>
                <p><strong>Position:</strong> ({intersection.x}, {intersection.y})</p>
                <p><strong>NS Light:</strong> {intersection.lightState.ns}</p>
                <p><strong>EW Light:</strong> {intersection.lightState.ew}</p>
                <p><strong>Timer:</strong> {intersection.timer}s</p>
              </div>
            ) : null;
          })()}
        </Card>
      )}

      {selectedRoad && (
        <Card className="mt-4 p-4 bg-gray-800 border-gray-700">
          <h3 className="text-lg font-bold text-white mb-2">Selected Road</h3>
          {(() => {
            const road = roads.find(r => r.id === selectedRoad);
            return road ? (
              <div className="text-gray-300">
                <p><strong>Name:</strong> {road.name}</p>
                <p><strong>Connects:</strong> {road.intersection1Id} ↔ {road.intersection2Id}</p>
              </div>
            ) : null;
          })()}
        </Card>
      )}
    </div>
  );
};