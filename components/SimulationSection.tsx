import React, { useState, useEffect } from 'react';
import { RealTimeCanvas } from './RealTimeCanvas';
import { Intersection, Car, Incident, Road } from '../types';
import {
  PlayIcon,
  PauseIcon,
  GlobeAsiaAustraliaIcon,
  Squares2X2Icon,
  CpuChipIcon,
  MapIcon,
  SignalIcon,
  EyeIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { Tooltip } from './Tooltip';

interface RealTimeMovementSectionProps {
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

export const SimulationSection: React.FC<RealTimeMovementSectionProps> = ({
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
  const [realTimeMode, setRealTimeMode] = useState(true);
  const [dataStreamActive, setDataStreamActive] = useState(true);

  useEffect(() => {
    setHeaderPulse(true);
    const t = setTimeout(() => setHeaderPulse(false), 700);
    return () => clearTimeout(t);
  }, [isRunning]);

  const toggleRunning = () => setIsRunning(!isRunning);

  return (
    <main className="absolute inset-0 flex flex-col min-w-0 bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-indigo-900/95 backdrop-blur-xl rounded-3xl p-2 overflow-hidden transition-all duration-300 border border-white/10 shadow-2xl">
      {/* Premium Header with Real-Time Movement Aesthetics */}
      <header className={`h-20 flex items-center px-8 transition-all duration-500 relative overflow-hidden ${headerPulse ? 'pulse-glow' : ''}`}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-cyan-500/10 animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 animate-pulse"></div>
        
        <div className="flex items-center gap-6 w-full relative z-10">
          <div className="flex items-center gap-4">
            {/* Premium Title with Real-Time Branding */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <BoltIcon className="w-7 h-7 text-white relative z-10 drop-shadow-lg animate-pulse" />
              </div>
              <div className="flex flex-col">
                <div className="text-2xl font-display font-black tracking-wider leading-none text-white drop-shadow-lg bg-gradient-to-r from-emerald-300 via-cyan-200 to-blue-200 bg-clip-text text-transparent">
                  REAL-TIME MOVEMENT
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-300 font-mono tracking-wider">🚀 {currentCity} Live Canvas</span>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            {/* Real-Time Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDataStreamActive(!dataStreamActive)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                  dataStreamActive 
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' 
                    : 'bg-gray-500/20 border border-gray-500/30 text-gray-400'
                } backdrop-blur-sm`}
              >
                <SignalIcon className="w-4 h-4" />
                <span className="text-xs font-mono font-medium">DATA STREAM</span>
              </button>
              
              <button
                onClick={() => setRealTimeMode(!realTimeMode)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                  realTimeMode 
                    ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-300' 
                    : 'bg-gray-500/20 border border-gray-500/30 text-gray-400'
                } backdrop-blur-sm`}
              >
                <EyeIcon className="w-4 h-4" />
                <span className="text-xs font-mono font-medium">LIVE MODE</span>
              </button>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/30 backdrop-blur-sm">
                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse shadow-lg shadow-red-400/50"></div>
                <span className="text-red-300 text-xs font-mono font-medium">INCIDENTS</span>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                <span className="text-emerald-300 text-xs font-mono font-medium">STREAMING</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="flex-1 flex flex-col bg-gray-900 rounded-xl p-4 relative">
        <RealTimeCanvas
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
          realTimeMode={realTimeMode}
          dataStreamActive={dataStreamActive}
        />

        <div className="absolute right-6 bottom-6 flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-xl p-2 shadow-lg">
          <button
            onClick={toggleRunning}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-transform duration-200 ${
              isRunning ? 'bg-red-600 hover:scale-105' : 'bg-emerald-600 hover:scale-105'
            }`}
            type="button"
          >
            {isRunning ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
            <span className="hidden sm:inline">{isRunning ? 'Pause' : 'Stream'}</span>
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
              cvModeActive ? 'bg-emerald-400 text-black shadow-xl scale-105' : 'hover:bg-white/6'
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
