import React, { useState, useEffect } from 'react';
import { SimulationDesigner } from './SimulationDesigner';
import { Intersection, Road, Car, Incident, TrafficStats, LightState } from '../types';

export const SimulationDesignerDemo: React.FC = () => {
  const [intersections, setIntersections] = useState<Intersection[]>([]);
  const [roads, setRoads] = useState<Road[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<TrafficStats>({
    totalCars: 0,
    avgSpeed: 35,
    congestionLevel: 25,
    carbonEmission: 0,
    incidents: 0
  });

  // Initialize demo data
  useEffect(() => {
    // Create sample intersections with big junction names
    const sampleIntersections: Intersection[] = [
      {
        id: 'INT-0-0',
        label: 'MG Road Junction',
        x: 0,
        y: 0,
        lightState: { ns: LightState.GREEN, ew: LightState.RED },
        timer: 30,
        greenDuration: 45
      },
      {
        id: 'INT-1-0',
        label: 'Brigade Road Cross',
        x: 1,
        y: 0,
        lightState: { ns: LightState.RED, ew: LightState.GREEN },
        timer: 25,
        greenDuration: 40
      },
      {
        id: 'INT-2-0',
        label: 'Commercial Street Junction',
        x: 2,
        y: 0,
        lightState: { ns: LightState.GREEN, ew: LightState.RED },
        timer: 35,
        greenDuration: 50
      },
      {
        id: 'INT-0-1',
        label: 'Residency Road Junction',
        x: 0,
        y: 1,
        lightState: { ns: LightState.RED, ew: LightState.GREEN },
        timer: 20,
        greenDuration: 35
      },
      {
        id: 'INT-1-1',
        label: 'Trinity Circle',
        x: 1,
        y: 1,
        lightState: { ns: LightState.GREEN, ew: LightState.RED },
        timer: 40,
        greenDuration: 55
      },
      {
        id: 'INT-2-1',
        label: 'Richmond Circle',
        x: 2,
        y: 1,
        lightState: { ns: LightState.RED, ew: LightState.GREEN },
        timer: 15,
        greenDuration: 30
      }
    ];

    // Create sample roads with prominent names
    const sampleRoads: Road[] = [
      {
        id: 'INT-0-0_INT-1-0',
        name: 'MG Road',
        intersection1Id: 'INT-0-0',
        intersection2Id: 'INT-1-0'
      },
      {
        id: 'INT-1-0_INT-2-0',
        name: 'Brigade Road',
        intersection1Id: 'INT-1-0',
        intersection2Id: 'INT-2-0'
      },
      {
        id: 'INT-0-1_INT-1-1',
        name: 'Residency Road',
        intersection1Id: 'INT-0-1',
        intersection2Id: 'INT-1-1'
      },
      {
        id: 'INT-1-1_INT-2-1',
        name: 'Museum Road',
        intersection1Id: 'INT-1-1',
        intersection2Id: 'INT-2-1'
      },
      {
        id: 'INT-0-0_INT-0-1',
        name: 'Kasturba Road',
        intersection1Id: 'INT-0-0',
        intersection2Id: 'INT-0-1'
      },
      {
        id: 'INT-1-0_INT-1-1',
        name: 'Church Street',
        intersection1Id: 'INT-1-0',
        intersection2Id: 'INT-1-1'
      },
      {
        id: 'INT-2-0_INT-2-1',
        name: 'Cunningham Road',
        intersection1Id: 'INT-2-0',
        intersection2Id: 'INT-2-1'
      }
    ];

    // Create sample vehicles
    const sampleCars: Car[] = [
      {
        id: 'CAR-1',
        x: 150,
        y: 150,
        dir: 'E',
        speed: 35,
        targetIntersectionId: 'INT-1-0',
        state: 'MOVING',
        type: 'CAR',
        width: 12,
        length: 20
      },
      {
        id: 'BUS-1',
        x: 250,
        y: 50,
        dir: 'S',
        speed: 25,
        targetIntersectionId: 'INT-1-1',
        state: 'MOVING',
        type: 'BUS',
        width: 16,
        length: 35
      },
      {
        id: 'AUTO-1',
        x: 50,
        y: 250,
        dir: 'N',
        speed: 30,
        targetIntersectionId: 'INT-0-0',
        state: 'MOVING',
        type: 'AUTO',
        width: 10,
        length: 15
      },
      {
        id: 'POLICE-1',
        x: 350,
        y: 150,
        dir: 'W',
        speed: 45,
        targetIntersectionId: 'INT-2-1',
        state: 'MOVING',
        type: 'POLICE',
        width: 12,
        length: 20,
        mission: { type: 'PATROL', targetId: null }
      }
    ];

    // Create sample incidents
    const sampleIncidents: Incident[] = [
      {
        id: 'INC-1',
        type: 'BREAKDOWN',
        location: { x: 200, y: 100 },
        description: 'Vehicle breakdown on Brigade Road',
        severity: 'MEDIUM',
        timestamp: Date.now() - 300000,
        blocksSegmentId: 'INT-1-0_INT-2-0'
      }
    ];

    setIntersections(sampleIntersections);
    setRoads(sampleRoads);
    setCars(sampleCars);
    setIncidents(sampleIncidents);
    setStats(prev => ({
      ...prev,
      totalCars: sampleCars.length,
      incidents: sampleIncidents.length
    }));
  }, []);

  const handleIntersectionClick = (intersection: Intersection) => {
    console.log('Intersection clicked:', intersection.label);
    // You can add custom logic here, like opening a details panel
  };

  const handleRoadClick = (road: Road) => {
    console.log('Road clicked:', road.name);
    // You can add custom logic here, like showing road details
  };

  const handleAddIntersection = (x: number, y: number) => {
    const newIntersection: Intersection = {
      id: `INT-${x}-${y}`,
      label: `New Junction ${x}-${y}`,
      x,
      y,
      lightState: { ns: LightState.GREEN, ew: LightState.RED },
      timer: 30,
      greenDuration: 45
    };
    
    setIntersections(prev => [...prev, newIntersection]);
    console.log('Added new intersection:', newIntersection.label);
  };

  const handleAddRoad = (fromId: string, toId: string) => {
    const newRoad: Road = {
      id: `${fromId}_${toId}`,
      name: `New Road ${fromId}-${toId}`,
      intersection1Id: fromId,
      intersection2Id: toId
    };
    
    setRoads(prev => [...prev, newRoad]);
    console.log('Added new road:', newRoad.name);
  };

  return (
    <div className="w-full h-screen bg-gray-900">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-white mb-4">
          Traffic Simulation Designer - Enhanced UI Demo
        </h1>
        <p className="text-gray-300 mb-6">
          This demo shows the enhanced SimulationDesigner with big road names and prominent junction displays.
          Click on intersections and roads to interact with them, or use the design tools to add new elements.
        </p>
      </div>
      
      <SimulationDesigner
        intersections={intersections}
        roads={roads}
        cars={cars}
        incidents={incidents}
        stats={stats}
        onIntersectionClick={handleIntersectionClick}
        onRoadClick={handleRoadClick}
        onAddIntersection={handleAddIntersection}
        onAddRoad={handleAddRoad}
      />
    </div>
  );
};