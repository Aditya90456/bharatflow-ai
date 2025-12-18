import React, { useState, useEffect } from 'react';
import { SimulationCanvas } from './SimulationCanvas';
import { Tooltip } from './Tooltip';
import { TrafficStats, Intersection, Car, Incident, Road, SearchResult } from '../types';
import { CITY_COORDINATES } from '../constants';
import { PlayIcon, PauseIcon, ArrowsPointingOutIcon, GlobeAsiaAustraliaIcon, Squares2X2Icon, CpuChipIcon, MagnifyingGlassIcon, MapIcon, ArrowsRightLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';

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
  stats: TrafficStats;
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
  searchResults: SearchResult[];
  onSearchResultSelect: (result: SearchResult) => void;
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
  stats,
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
  searchResults,
  onSearchResultSelect,
  isAiSearching,
  handleAiSearch,
  highlightedVehicleIds,
  highlightedIncidentIds,
  highlightedIntersectionId,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [headerPulse, setHeaderPulse] = useState(false);
  const cityCoords = CITY_COORDINATES[currentCity];

  const groupedResults = searchResults.reduce((acc, result) => {
    const type = result.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(result);
    return acc;
  }, {} as Record<SearchResult['type'], SearchResult[]>);

  const resultOrder: SearchResult['type'][] = ['CITY', 'INTERSECTION', 'ROAD'];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery) {
      e.preventDefault();
      handleAiSearch(searchQuery);
      setIsSearchFocused(false);
    }
  };

  useEffect(() => {
    setHeaderPulse(true);
    const t = setTimeout(() => setHeaderPulse(false), 700);
    return () => clearTimeout(t);
  }, [isRunning]);

  const toggleRunning = () => setIsRunning(!isRunning);

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
                onClick={() => { handleAiSearch(searchQuery); setIsSearchFocused(false); }}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-white/80 p-1 rounded-full hover:bg-white/8 transition-transform duration-200 active:scale-95"
                aria-label="AI Search"
                type="button"
              >
                <MagnifyingGlassIcon className={`h-4 w-4 ${isAiSearching ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-white/80">
                <span className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                <span>Incidents</span>
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

        <div className="absolute right-6 bottom-6 flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-xl p-2 shadow-lg transition-all duration-300">
          <button
            onClick={toggleRunning}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-transform duration-200 ${
              isRunning ? 'bg-red-600 hover:scale-105' : 'bg-green-600 hover:scale-105'
            }`}
            aria-label={isRunning ? 'Pause simulation' : 'Start simulation'}
            type="button"
          >
            {isRunning ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
            <span className="hidden sm:inline">{isRunning ? 'Pause' : 'Start'}</span>
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'GRID' ? 'SATELLITE' : 'GRID')}
            className="p-2 rounded-md text-white/90 hover:bg-white/6 transition-transform duration-200"
            title="Toggle view"
            type="button"
          >
            {viewMode === 'GRID' ? <MapIcon className="h-5 w-5" /> : <GlobeAsiaAustraliaIcon className="h-5 w-5" />}
          </button>

          <button
            onClick={() => setCvModeActive(!cvModeActive)}
            className={`p-2 rounded-md transition-all duration-200 ${cvModeActive ? 'bg-yellow-400 text-black shadow-xl scale-105' : 'hover:bg-white/6'}`}
            title="Toggle CV Mode"
            type="button"
          >
            <CpuChipIcon className="h-5 w-5" />
          </button>

          <Tooltip text="View detailed stats">
            <button className="p-2 rounded-md hover:bg-white/6 transition-colors duration-200" type="button">
              <Squares2X2Icon className="h-5 w-5 text-white/90" />
            </button>
          </Tooltip>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="hidden sm:block">
            <Tooltip text="View detailed stats">
              <button className="btn-secondary" type="button">Stats</button>
            </Tooltip>
          </div>
        </div>
      </section>

      <style jsx>{`
        .gradient-anim {
          background-size: 200% 200%;
          animation: gradientShift 6s ease infinite;
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .pulse-glow {
          box-shadow: 0 6px 30px rgba(99, 102, 241, 0.12), 0 2px 10px rgba(99, 102, 241, 0.08);
          transform: translateY(-2px);
        }
      `}</style>
    </main>
  );
};