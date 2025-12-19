import React, { useState, useEffect } from 'react';
import { SimulationCanvas } from './SimulationCanvas'; 
import { Intersection, Car, Incident, Road, SearchResult } from '../types';
import {
  PlayIcon,
  PauseIcon,
  GlobeAsiaAustraliaIcon,
  Squares2X2Icon,
  CpuChipIcon,
  MagnifyingGlassIcon,
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
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isAiSearching: boolean;
  handleAiSearch: (query: string) => void;
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
  searchQuery,
  setSearchQuery,
  isAiSearching,
  handleAiSearch,
  highlightedVehicleIds,
  highlightedIncidentIds,
  highlightedIntersectionId,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [headerPulse, setHeaderPulse] = useState(false);

  useEffect(() => {
    setHeaderPulse(true);
    const t = setTimeout(() => setHeaderPulse(false), 700);
    return () => clearTimeout(t);
  }, [isRunning]);

  const toggleRunning = () => setIsRunning(!isRunning);

  const triggerSearch = () => {
    if (!searchQuery.trim()) return;
    handleAiSearch(searchQuery);
    setIsSearchFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerSearch();
    }
  };

  return (
    <main className="absolute inset-0 flex flex-col min-w-0 glass rounded-2xl p-1.5 overflow-hidden transition-all duration-300">
      <header className={`h-16 shadow-md flex items-center px-6 transition-all duration-500 ${headerPulse ? 'pulse-glow' : ''}`}>
        <div className="flex items-center gap-4 w-full">
          <div className="flex items-center gap-3">
            <div className="text-white text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent gradient-anim">
              Traffic Simulation
            </div>
            <div className="text-xs text-white/70">• {currentCity}</div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Search city, intersection, road..."
                className={`transition-all duration-300 text-sm rounded-full px-3 py-2 placeholder:text-white/60 bg-white/6 text-white outline-none focus:ring-2 focus:ring-blue-400 ${
                  isSearchFocused ? 'w-64 shadow-lg scale-105' : 'w-40'
                }`}
              />

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // 🔑 prevents blur race
                  triggerSearch();
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-white/80 p-1 rounded-full hover:bg-white/8 transition-transform duration-200 active:scale-95"
                aria-label="AI Search"
              >
                <MagnifyingGlassIcon className={`h-4 w-4 ${isAiSearching ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-1 text-xs text-white/80">
              <span className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
              <span>Incidents</span>
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
