import React, { useState, useEffect } from 'react';
import { SimulationCanvas } from './SimulationCanvas'; 
import { Intersection, Car, Incident, Road } from '../types';
import {
  PlayIcon,
  PauseIcon,
  GlobeAsiaAustraliaIcon,
  Squares2X2Icon,
  CpuChipIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import { Tooltip } from './Tooltip';

interface SimulationSectionProps {
  currentCity: string;
  isRunning: boolean;
  setIsRunning: (val: boolean) => void;
  intersections: Intersection[];
  setIntersections: React.Dispatch<React.SetStateAction<Intersection[]>>;
  cars: Car[];
  setCars: React.Dispatch<React.SetStateAction<Car[]>>;
  onUpdateStats: (total: number, speed: number, queues: Record<string, number>) => void;
  onIntersectionSelect: (id: string) => void;
  onCarSelect: (id: string) => void;
  selectedCarId: string | null;
  viewMode: 'GRID' | 'SATELLITE';
  setViewMode: (mode: 'GRID' | 'SATELLITE') => void;
  cvModeActive: boolean;
  setCvModeActive: (active: boolean) => void;
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
}

export const SimulationSection: React.FC<SimulationSectionProps> = ({
  currentCity,
  isRunning,
  setIsRunning,
  intersections,
  setIntersections,
  cars,
  setCars,
  onUpdateStats,
  onIntersectionSelect,
  onCarSelect,
  selectedCarId,
  viewMode,
  setViewMode,
  cvModeActive,
  setCvModeActive,
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
}) => {
  const [headerPulse, setHeaderPulse] = useState(false);

  useEffect(() => {
    setHeaderPulse(true);
    const t = setTimeout(() => setHeaderPulse(false), 700);
    return () => clearTimeout(t);
  }, [isRunning]);

  const toggleRunning = () => setIsRunning(!isRunning);

  return (
    <main className="absolute inset-0 flex flex-col min-w-0 bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-indigo-900/95 backdrop-blur-xl rounded-3xl p-2 overflow-hidden transition-all duration-300 border border-white/10 shadow-2xl">
      {/* Premium Header with Indian Government Aesthetics */}
      <header className={`h-20 flex items-center px-8 transition-all duration-500 relative overflow-hidden ${headerPulse ? 'pulse-glow' : ''}`}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-saffron/10 via-transparent to-green-500/10 animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-saffron via-white to-green-500"></div>
        
        <div className="flex items-center gap-6 w-full relative z-10">
          <div className="flex items-center gap-4">
            {/* Premium Title with Government Branding */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-saffron via-orange-500 to-red-600 flex items-center justify-center shadow-2xl shadow-saffron/40 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <MapIcon className="w-7 h-7 text-white relative z-10 drop-shadow-lg" />
              </div>
              <div className="flex flex-col">
                <div className="text-2xl font-display font-black tracking-wider leading-none text-white drop-shadow-lg bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
                  NEURAL TRAFFIC GRID
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-cyan-300 font-mono tracking-wider">🇮🇳 {currentCity} Command Center</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">

            {/* Status Indicators */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/30 backdrop-blur-sm">
                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse shadow-lg shadow-red-400/50"></div>
                <span className="text-red-300 text-xs font-mono font-medium">INCIDENTS</span>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="text-green-300 text-xs font-mono font-medium">LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="flex-1 flex flex-col bg-gray-900 rounded-xl p-4 relative">
        <SimulationCanvas
          intersections={intersections}
          setIntersections={setIntersections}
          cars={cars}
          setCars={setCars}
          onUpdateStats={onUpdateStats}
          isRunning={isRunning}
          onIntersectionSelect={onIntersectionSelect}
          onCarSelect={onCarSelect}
          selectedCarId={selectedCarId}
          scenarioKey={currentCity}
          cvModeActive={cvModeActive}
          recentlyUpdatedJunctions={recentlyUpdatedJunctions}
          incidents={incidents}
          onIncidentSelect={onIncidentSelect}
          setIncidents={setIncidents}
          selectedIncidentId={selectedIncidentId}
          closedRoads={closedRoads}
          roads={roads}
          highlightedVehicleIds={highlightedVehicleIds}
          highlightedIncidentIds={highlightedIncidentIds}
          highlightedIntersectionId={highlightedIntersectionId}
        />

        <div className="absolute right-6 bottom-6 flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-xl p-2 shadow-lg">
          <button
            onClick={toggleRunning}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-transform duration-200 ${
              isRunning ? 'bg-red-600 hover:scale-105' : 'bg-green-600 hover:scale-105'
            }`}
            type="button"
          >
            {isRunning ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
            <span className="hidden sm:inline">{isRunning ? 'Pause' : 'Start'}</span>
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'GRID' ? 'SATELLITE' : 'GRID')}
            className="p-2 rounded-md text-white/90 hover:bg-white/6"
            type="button"
          >
            {viewMode === 'GRID' ? <MapIcon className="h-5 w-5" /> : <GlobeAsiaAustraliaIcon className="h-5 w-5" />}
          </button>

          <button
            onClick={() => setCvModeActive(!cvModeActive)}
            className={`p-2 rounded-md transition-all ${
              cvModeActive ? 'bg-yellow-400 text-black shadow-xl scale-105' : 'hover:bg-white/6'
            }`}
            type="button"
          >
            <CpuChipIcon className="h-5 w-5" />
          </button>

          <Tooltip text="View detailed stats">
            <button className="p-2 rounded-md hover:bg-white/6" type="button">
              <Squares2X2Icon className="h-5 w-5 text-white/90" />
            </button>
          </Tooltip>
        </div>
      </section>
    </main>
  );
};
