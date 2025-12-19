import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';

// Lazy load components for better initial load performance
const LandingPage = lazy(() => import('./components/LandingPage').then(module => ({ default: module.LandingPage })));
const FeaturesPage = lazy(() => import('./components/PublicPages').then(module => ({ default: module.FeaturesPage })));
const LiveMapPage = lazy(() => import('./components/PublicPages').then(module => ({ default: module.LiveMapPage })));
const PublicDataPage = lazy(() => import('./components/PublicPages').then(module => ({ default: module.PublicDataPage })));
const ApiDocsPage = lazy(() => import('./components/PublicPages').then(module => ({ default: module.ApiDocsPage })));
const AiFeaturesPage = lazy(() => import('./components/PublicPages').then(module => ({ default: module.AiFeaturesPage })));
const RealtimeAiPage = lazy(() => import('./components/PublicPages').then(module => ({ default: module.RealtimeAiPage })));
const JunctionsAiPage = lazy(() => import('./components/PublicPages').then(module => ({ default: module.JunctionsAiPage })));
const MlDesignPage = lazy(() => import('./components/PublicPages').then(module => ({ default: module.MlDesignPage })));
const HldPage = lazy(() => import('./components/PublicPages').then(module => ({ default: module.HldPage })));

// Core dashboard components - load immediately for better UX
import { SimulationSection } from './components/SimulationSection';
import { CameraFeed } from './components/CameraFeed';
import { StatsCard } from './components/StatsCard';
import { VehicleDetails } from './components/VehicleDetails';
import { IntersectionDetails, IntelFeed, IncidentDetails, OverviewPanel } from './components/SidePanels';
import { ResponsibleAiModal } from './components/ResponsibleAiModal';
import { DataHub } from './components/DataHub';
import { analyzeTraffic, analyzeIncident, getRealWorldIntel, interpretSearchQuery } from './services/geminiService';
import { Incident, Intersection, Car, LightState, TrafficStats, GeminiAnalysis, GeminiIncidentAnalysis, RealWorldIntel, Road, SearchResult, CongestedJunctionInfo, VehicleType, AiSearchAction } from './types';
import { GRID_SIZE, INITIAL_GREEN_DURATION, CITY_CONFIGS, CITY_COORDINATES, BLOCK_SIZE, ROAD_NAMES, MAX_SPEED } from './constants';
import { 
  ArrowLeftOnRectangleIcon, ChartPieIcon, AdjustmentsHorizontalIcon, TruckIcon, SparklesIcon, VideoCameraIcon, GlobeAltIcon,
  ClockIcon, BoltIcon, CloudIcon, SignalIcon, ExclamationTriangleIcon, CircleStackIcon, MapPinIcon, CodeBracketIcon
} from '@heroicons/react/24/outline';

type ViewState = 'LANDING' | 'DASHBOARD' | 'FEATURES' | 'PUBLIC_MAP' | 'PUBLIC_DATA' | 'API_DOCS' | 'AI_FEATURES' | 'REALTIME_AI' | 'JUNCTIONS_AI' | 'ML_DESIGN' | 'HLD';
type ActiveTab = 'OVERVIEW' | 'JUNCTION' | 'UNIT' | 'INTEL' | 'CCTV' | 'INCIDENT' | 'DATA_HUB';

// Enhanced Boot Sequence Component with optimized loading
const SystemBoot: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentSystem, setCurrentSystem] = useState('');
  
  const bootLogs = useMemo(() => [
    { text: "INITIALIZING BHARATFLOW KERNEL v5.0.0...", system: "CORE", delay: 200 },
    { text: "ESTABLISHING QUANTUM LINK... [OK]", system: "NETWORK", delay: 250 },
    { text: "LOADING NEURAL TOPOLOGY: BANGALORE (TESTBED)", system: "AI", delay: 300 },
    { text: "SYNCING WITH IoT SENSOR GRID: 99.8% COMPLETE", system: "SENSORS", delay: 350 },
    { text: "CALIBRATING LHT PHYSICS ENGINE...", system: "PHYSICS", delay: 250 },
    { text: "STARTING AI TACTICAL ENGINE (GEMINI-2.5)...", system: "AI", delay: 400 },
    { text: "HOLOGRAPHIC INTERFACE READY...", system: "UI", delay: 200 },
    { text: "SYSTEM READY. COMMAND AWAITED.", system: "READY", delay: 300 }
  ], []);

  useEffect(() => {
    let delay = 0;
    const timeouts: NodeJS.Timeout[] = [];
    
    bootLogs.forEach((log, index) => {
      delay += log.delay + Math.random() * 100; // Reduced randomness for faster loading
      const timeout = setTimeout(() => {
        setLines(prev => [...prev, log.text]);
        setCurrentSystem(log.system);
        setProgress(((index + 1) / bootLogs.length) * 100);
        if (index === bootLogs.length - 1) {
          const finalTimeout = setTimeout(onComplete, 800); // Reduced final delay
          timeouts.push(finalTimeout);
        }
      }, delay);
      timeouts.push(timeout);
    });

    // Cleanup function to prevent memory leaks
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [onComplete, bootLogs]);

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center font-mono overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-cyber-grid opacity-30"></div>
      <div className="scanline-effect"></div>
      <div className="scanline-horizontal"></div>
      
      {/* Main Boot Interface */}
      <div className="relative w-full max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="cyber-glass rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-primary-500 flex items-center justify-center animate-pulse-glow">
                <GlobeAltIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold holographic">BHARATFLOW</h1>
                <p className="text-cyan-400 text-sm font-tech">NEURAL TRAFFIC CONTROL SYSTEM</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-cyan-400 font-tech text-sm">SYSTEM STATUS</div>
              <div className="text-success-400 font-bold animate-pulse-glow">{currentSystem}</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-muted mb-2">
              <span>INITIALIZATION PROGRESS</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-primary-500 transition-all duration-500 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-data-flow"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Boot Log Terminal */}
        <div className="cyber-glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyan-500/20">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-success-400 animate-pulse-glow"></div>
              <span className="text-cyan-400 font-tech text-sm">BOOT_SEQUENCE</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary-400 animate-pulse-glow"></div>
              <span className="text-cyan-400 font-tech text-sm">SECURE_CONN</span>
            </div>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-hidden">
            {lines.map((line, i) => (
              <div 
                key={i} 
                className="flex items-center space-x-2 animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="text-cyan-400 font-mono text-xs">[{String(i + 1).padStart(2, '0')}]</span>
                <p className="font-mono text-sm text-foreground overflow-hidden whitespace-nowrap animate-boot-text">
                  &gt; {line}
                  {i === lines.length - 1 && (
                    <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-blink"></span>
                  )}
                </p>
              </div>
            ))}
          </div>
          
          {/* System Indicators */}
          <div className="mt-6 pt-4 border-t border-cyan-500/20">
            <div className="grid grid-cols-4 gap-4">
              {['CORE', 'NETWORK', 'AI', 'SENSORS'].map((system, i) => (
                <div key={system} className="text-center">
                  <div className={`w-8 h-8 mx-auto rounded-full border-2 flex items-center justify-center mb-2 transition-all duration-300 ${
                    currentSystem === system || progress > (i + 1) * 25
                      ? 'border-success-400 bg-success-400/20 text-success-400 animate-pulse-glow' 
                      : 'border-muted text-muted'
                  }`}>
                    <div className="w-2 h-2 rounded-full bg-current"></div>
                  </div>
                  <div className="text-xs font-tech text-muted">{system}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Loading Animation */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 text-cyan-400">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i}
                  className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse-glow"
                  style={{ animationDelay: `${i * 0.2}s` }}
                ></div>
              ))}
            </div>
            <span className="font-tech text-sm">LOADING NEURAL INTERFACE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [viewState, setViewState] = useState<ViewState>('LANDING');

  const [currentCity, setCurrentCity] = useState("Bangalore");
  const [intersections, setIntersections] = useState<Intersection[]>([]);
  const [roads, setRoads] = useState<Road[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<TrafficStats>({ totalCars: 0, avgSpeed: 0, congestionLevel: 0, carbonEmission: 0, incidents: 0 });
  const [isRunning, setIsRunning] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('OVERVIEW');
  const [selectedIntersectionId, setSelectedIntersectionId] = useState<string | null>(null);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiAnalysis | null>(null);
  const [geminiIncidentAnalysis, setGeminiIncidentAnalysis] = useState<GeminiIncidentAnalysis | null>(null);
  const [realWorldIntel, setRealWorldIntel] = useState<RealWorldIntel | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isIntelLoading, setIsIntelLoading] = useState(false);
  const [isIncidentAnalyzing, setIsIncidentAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'SATELLITE'>('GRID');
  const [cvModeActive, setCvModeActive] = useState(false);
  const [responsibleAiModalOpen, setResponsibleAiModalOpen] = useState(false);
  const [recentlyUpdatedJunctions, setRecentlyUpdatedJunctions] = useState<Set<string>>(new Set());
  const [queueLengthMap, setQueueLengthMap] = useState<Record<string,number>>({});
  const [incidentCreatedMessage, setIncidentCreatedMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [highlightedVehicleIds, setHighlightedVehicleIds] = useState<Set<string> | null>(null);
  const [highlightedIncidentIds, setHighlightedIncidentIds] = useState<Set<string> | null>(null);
  const [highlightedIntersectionId, setHighlightedIntersectionId] = useState<string | null>(null);

  const analysisInputRef = useRef<CongestedJunctionInfo[] | null>(null);

  const generateIntersections = useCallback((city: string) => {
    const names = CITY_CONFIGS[city] || [];
    const arr: Intersection[] = [];
    let nameIdx = 0;
    
    // Pre-allocate array for better performance
    const totalIntersections = GRID_SIZE * GRID_SIZE;
    arr.length = totalIntersections;
    
    let index = 0;
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        arr[index++] = {
          id: `INT-${x}-${y}`,
          label: names[nameIdx++] || `Sector ${x}-${y}`,
          x,
          y,
          lightState: { ns: LightState.GREEN, ew: LightState.RED },
          timer: INITIAL_GREEN_DURATION,
          greenDuration: INITIAL_GREEN_DURATION
        };
      }
    }
    return arr;
  }, []);
  
  const generateRoads = useCallback((city: string): Road[] => {
      const roadNames = ROAD_NAMES[city] || ROAD_NAMES["Bangalore"];
      
      // Pre-calculate total roads for better performance
      const horizontalRoads = GRID_SIZE * (GRID_SIZE - 1);
      const verticalRoads = (GRID_SIZE - 1) * GRID_SIZE;
      const totalRoads = horizontalRoads + verticalRoads;
      
      const generatedRoads: Road[] = [];
      generatedRoads.length = totalRoads;
      
      let roadIndex = 0;
      let hIdx = 0;
      let vIdx = 0;

      for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
              if (x < GRID_SIZE - 1) {
                  const id1 = `INT-${x}-${y}`;
                  const id2 = `INT-${x + 1}-${y}`;
                  generatedRoads[roadIndex++] = { 
                    id: `${id1}_${id2}`, // Avoid sorting for better performance
                    name: roadNames.horizontal[hIdx % roadNames.horizontal.length], 
                    intersection1Id: id1, 
                    intersection2Id: id2 
                  };
              }
              if (y < GRID_SIZE - 1) {
                  const id1 = `INT-${x}-${y}`;
                  const id2 = `INT-${x}-${y + 1}`;
                  generatedRoads[roadIndex++] = { 
                    id: `${id1}_${id2}`, // Avoid sorting for better performance
                    name: roadNames.vertical[vIdx % roadNames.vertical.length], 
                    intersection1Id: id1, 
                    intersection2Id: id2 
                  };
              }
          }
          hIdx++;
          vIdx++;
      }
      return generatedRoads;
  }, []);


  useEffect(() => {
    setIntersections(generateIntersections(currentCity));
    setRoads(generateRoads(currentCity));
    setCars([]);
    setIncidents([]);
    setSelectedIntersectionId(null);
    setSelectedCarId(null);
    setGeminiAnalysis(null);
    setRealWorldIntel(null);
  }, [currentCity, generateIntersections, generateRoads]);

  const handleUpdateStats = useCallback((totalCars: number, avgSpeed: number, queueMap: Record<string, number>) => {
    setStats(prev => ({
      ...prev,
      totalCars,
      avgSpeed,
      congestionLevel: Math.min(100, Math.floor((totalCars / 80) * 100)),
      carbonEmission: prev.carbonEmission + (totalCars * 0.0001),
      incidents: incidents.length,
    }));
    setQueueLengthMap(queueMap);
  }, [incidents.length]);

  const handleNavigate = (page: ViewState) => {
    setViewState(page);
  };
  
  const handleIntersectionSelect = (id: string) => {
    setSelectedIntersectionId(id);
    setSelectedCarId(null);
    setSelectedIncidentId(null);
    setActiveTab('JUNCTION');
  };

  const handleCarSelect = (id: string) => {
    setSelectedCarId(id);
    setSelectedIntersectionId(null);
    setSelectedIncidentId(null);
    setActiveTab('UNIT');
  };

  const handleIncidentSelect = (id: string) => {
    setSelectedIncidentId(id);
    setSelectedIntersectionId(null);
    setSelectedCarId(null);
    setActiveTab('INCIDENT');
  };
  
  const handleAnalyzeTraffic = async () => {
    setIsAnalyzing(true);
    const congested: CongestedJunctionInfo[] = intersections.map(i => ({
        id: i.id,
        label: i.label,
        nsQueue: (queueLengthMap[`${i.id}_N`] || 0) + (queueLengthMap[`${i.id}_S`] || 0),
        ewQueue: (queueLengthMap[`${i.id}_E`] || 0) + (queueLengthMap[`${i.id}_W`] || 0),
    })).filter(i => i.nsQueue + i.ewQueue > 5).sort((a,b) => (b.nsQueue + b.ewQueue) - (a.nsQueue + a.ewQueue));
    
    analysisInputRef.current = congested;
    const result = await analyzeTraffic(congested, stats);
    setGeminiAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleApplySuggestions = () => {
    if (!geminiAnalysis) return;
    const updatedIds = new Set<string>();
    setIntersections(prev => 
      prev.map(i => {
        const change = geminiAnalysis.suggestedChanges.find(c => c.intersectionId === i.id);
        if (change) {
          updatedIds.add(i.id);
          return { ...i, greenDuration: change.newGreenDuration };
        }
        return i;
      })
    );
    setRecentlyUpdatedJunctions(updatedIds);
    setTimeout(() => setRecentlyUpdatedJunctions(new Set()), 10000);
  };

  const handleAnalyzeIncident = async (incident: Incident) => {
    setIsIncidentAnalyzing(true);
    const nearbyUnits = cars.filter(c => c.type === 'POLICE').length;
    const result = await analyzeIncident(incident, nearbyUnits);
    setGeminiIncidentAnalysis(result);
    setIsIncidentAnalyzing(false);
  };
  
  const handleGetIntel = async (query: string, useLocation: boolean) => {
      setIsIntelLoading(true);
      setRealWorldIntel(null);
      setIncidentCreatedMessage(null);
      let location: { latitude: number, longitude: number } | undefined;
      if (useLocation) {
          const cityCoords = CITY_COORDINATES[currentCity];
          if (cityCoords) {
              location = { latitude: cityCoords.lat, longitude: cityCoords.lng };
          }
      }
      const result = await getRealWorldIntel(query, currentCity, intersections.map(i => i.label), location);
      setRealWorldIntel(result);
      
      const incidentRegex = /INCIDENT::(.*?)::(.*?)::(.*)/;
      const match = result.intel.match(incidentRegex);
      if (match) {
          const [, intersectionLabel, type, description] = match;
          const targetIntersection = intersections.find(i => i.label === intersectionLabel.trim());
          if (targetIntersection) {
              const newIncident: Incident = {
                  id: `INC-AI-${Date.now()}`,
                  type: type.trim() as 'ACCIDENT' | 'CONSTRUCTION',
                  location: {
                      x: (targetIntersection.x + 0.5) * BLOCK_SIZE,
                      y: (targetIntersection.y + 0.5) * BLOCK_SIZE,
                  },
                  description: description.trim(),
                  severity: 'HIGH',
                  timestamp: Date.now(),
              };
              setIncidents(prev => [...prev, newIncident]);
              setIncidentCreatedMessage(`AI detected a ${type} at ${intersectionLabel} and created a new incident marker.`);
          }
      }

      setIsIntelLoading(false);
  };

  const handleAiSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsAiSearching(true);
    setHighlightedVehicleIds(null);
    setHighlightedIncidentIds(null);
    setHighlightedIntersectionId(null);

    const actions = await interpretSearchQuery(query, intersections, cars, incidents);
    
    if (actions && actions.length > 0) {
      const action = actions[0]; // Process first action
      if (action.name === 'select_object') {
        const { type, name_or_id } = action.args;
        const lowerName = name_or_id.toLowerCase();
        if (type === 'INTERSECTION') {
          const target = intersections.find(i => i.id.toLowerCase() === lowerName || i.label.toLowerCase().includes(lowerName));
          if (target) handleIntersectionSelect(target.id);
        } else if (type === 'CAR') {
          const target = cars.find(c => c.id.toLowerCase() === lowerName || c.type.toLowerCase() === lowerName);
          if (target) handleCarSelect(target.id);
        }
      } else if (action.name === 'find_all_units_of_type') {
          const { type } = action.args;
          const ids = new Set<string>();
          cars.forEach(c => {
            if (type === 'BROKEN_DOWN' && c.isBrokenDown) {
                ids.add(c.id);
            } else if (c.type === type) {
                ids.add(c.id);
            }
          });
          setHighlightedVehicleIds(ids);
      } else if (action.name === 'find_incidents_by_severity') {
          const { severity } = action.args;
          const ids = new Set<string>();
          incidents.forEach(i => {
              if (i.severity === severity) {
                  ids.add(i.id);
              }
          });
          setHighlightedIncidentIds(ids);
      } else if (action.name === 'find_most_congested_junction') {
          let maxCongestion = -1;
          let mostCongestedId = null;
          for (const i of intersections) {
              const congestion = (queueLengthMap[`${i.id}_N`] || 0) + (queueLengthMap[`${i.id}_S`] || 0) + (queueLengthMap[`${i.id}_E`] || 0) + (queueLengthMap[`${i.id}_W`] || 0);
              if (congestion > maxCongestion) {
                  maxCongestion = congestion;
                  mostCongestedId = i.id;
              }
          }
          if (mostCongestedId) {
              setHighlightedIntersectionId(mostCongestedId);
              setTimeout(() => setHighlightedIntersectionId(null), 10000);
          }
      }
    }
    
    setIsAiSearching(false);
    setSearchQuery('');
  };
  
  const handleSearchResultSelect = (result: SearchResult) => {
    setSearchQuery('');
    setSearchResults([]);
    if (result.type === 'INTERSECTION') {
        handleIntersectionSelect(result.id);
    }
  };

  useEffect(() => {
    if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        const results: SearchResult[] = [];
        intersections.forEach(i => {
            if (i.label.toLowerCase().includes(lowerQuery)) {
                results.push({ type: 'INTERSECTION', id: i.id, name: i.label });
            }
        });
        setSearchResults(results);
    } else {
        setSearchResults([]);
    }
  }, [searchQuery, intersections]);

  const selectedIntersection = useMemo(() => intersections.find(i => i.id === selectedIntersectionId), [intersections, selectedIntersectionId]);
  const selectedCar = useMemo(() => cars.find(c => c.id === selectedCarId), [cars, selectedCarId]);
  const selectedIncident = useMemo(() => incidents.find(i => i.id === selectedIncidentId), [incidents, selectedIncidentId]);

  // If a detail tab is active but no item is selected, revert to OVERVIEW
  useEffect(() => {
    if (activeTab === 'JUNCTION' && !selectedIntersection) setActiveTab('OVERVIEW');
    if (activeTab === 'UNIT' && !selectedCar) setActiveTab('OVERVIEW');
    if (activeTab === 'INCIDENT' && !selectedIncident) setActiveTab('OVERVIEW');
  }, [activeTab, selectedIntersection, selectedCar, selectedIncident]);
  
  const tabIcons: Record<ActiveTab, React.FC<any>> = {
    OVERVIEW: ChartPieIcon,
    JUNCTION: AdjustmentsHorizontalIcon,
    UNIT: TruckIcon,
    INTEL: SparklesIcon,
    INCIDENT: ExclamationTriangleIcon,
    CCTV: VideoCameraIcon,
    DATA_HUB: CircleStackIcon,
  };
  
  const TabButton: React.FC<{ tab: ActiveTab, label: string }> = ({ tab, label }) => {
    const Icon = tabIcons[tab];
    const isActive = activeTab === tab;
    return (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg text-xs transition-all ${isActive ? 'bg-primary text-white font-bold' : 'text-gray-400 hover:bg-surfaceHighlight'}`}
            title={label}
        >
            <Icon className="w-5 h-5" />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
  };
  
  if (isBooting) {
    return <SystemBoot onComplete={() => setIsBooting(false)} />;
  }

  const publicPageProps = { onNavigate: handleNavigate as (page: string) => void };
  switch (viewState) {
    case 'LANDING': return <LandingPage {...publicPageProps} />;
    case 'FEATURES': return <FeaturesPage {...publicPageProps} />;
    case 'PUBLIC_MAP': return <LiveMapPage {...publicPageProps} />;
    case 'PUBLIC_DATA': return <PublicDataPage {...publicPageProps} />;
    case 'API_DOCS': return <ApiDocsPage {...publicPageProps} />;
    case 'AI_FEATURES': return <AiFeaturesPage {...publicPageProps} />;
    case 'REALTIME_AI': return <RealtimeAiPage {...publicPageProps} />;
    case 'JUNCTIONS_AI': return <JunctionsAiPage {...publicPageProps} />;
    case 'ML_DESIGN': return <MlDesignPage {...publicPageProps} />;
    case 'HLD': return <HldPage {...publicPageProps} />;
  }

  return (
    <>
      <div className="animated-grid"></div>
      <div className="w-screen h-screen font-sans flex p-3 gap-3 overflow-hidden text-gray-200">
        {/* LEFT PANEL */}
        <div className="w-[300px] flex flex-col gap-3 flex-shrink-0">
            <header className="h-20 flex-shrink-0 flex items-center justify-between p-4 rounded-2xl glass">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigate('LANDING')}>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-saffron to-red-600 flex items-center justify-center shadow-lg shadow-saffron/20">
                      <GlobeAltIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                      <span className="text-lg font-tech font-bold tracking-widest leading-none text-white">BHARAT<span className="text-saffron">FLOW</span></span>
                      <span className="text-[10px] font-mono text-accent tracking-wider">AI COMMAND</span>
                  </div>
              </div>
              <button onClick={() => handleNavigate('LANDING')} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <ArrowLeftOnRectangleIcon className="w-5 h-5 text-gray-400" />
              </button>
           </header>

           <div className="grid grid-cols-2 gap-3">
               <StatsCard label="Active Units" value={stats.totalCars} icon={<TruckIcon className="w-5 h-5"/>} color="primary" />
               <StatsCard label="Avg. Speed" value={stats.avgSpeed.toFixed(1)} unit="px/f" icon={<BoltIcon className="w-5 h-5"/>} color="accent" />
               <StatsCard label="Congestion" value={`${stats.congestionLevel}%`} icon={<SignalIcon className="w-5 h-5"/>} color={stats.congestionLevel > 70 ? 'danger' : stats.congestionLevel > 40 ? 'warning' : 'success'}/>
               <StatsCard label="Incidents" value={stats.incidents} icon={<ExclamationTriangleIcon className="w-5 h-5"/>} color="saffron"/>
           </div>

           {/* MAIN TABBED PANEL */}
           <div className="flex-1 flex flex-col glass rounded-2xl p-1.5 min-h-0">
              <div className="flex items-center p-1 rounded-t-xl bg-surface/50 border-b border-white/5 flex-wrap gap-1">
                  <TabButton tab="OVERVIEW" label="Overview" />
                  <TabButton tab="INTEL" label="AI Intel" />
                  <TabButton tab="DATA_HUB" label="Data Hub" />
                  <TabButton tab="CCTV" label="CCTV" />
              </div>
              <div className="flex-1 bg-background/50 rounded-b-xl border border-white/5 min-h-0 overflow-hidden">
                  {activeTab === 'OVERVIEW' && <OverviewPanel stats={stats} currentCity={currentCity} totalJunctions={intersections.length} />}
                  {activeTab === 'INTEL' && <IntelFeed analysis={geminiAnalysis} isAnalyzing={isAnalyzing} onAnalyze={handleAnalyzeTraffic} onApply={handleApplySuggestions} realWorldIntel={realWorldIntel} isIntelLoading={isIntelLoading} onGetIntel={handleGetIntel} onOpenResponsibleAiModal={() => setResponsibleAiModalOpen(true)} incidentCreatedMessage={incidentCreatedMessage}/>}
                  {activeTab === 'CCTV' && <CameraFeed />}
                  {activeTab === 'DATA_HUB' && <DataHub incidents={incidents} cars={cars} roads={roads} onSelectCar={handleCarSelect} onSelectIncident={handleIncidentSelect} />}
              </div>
           </div>
        </div>

        {/* CENTER PANEL */}
        <div className="flex-1 relative min-w-0">
            <SimulationSection
              currentCity={currentCity}
              isRunning={isRunning}
              setIsRunning={setIsRunning}
              intersections={intersections}
              setIntersections={setIntersections}
              cars={cars}
              setCars={setCars}
              onUpdateStats={handleUpdateStats}
              onIntersectionSelect={handleIntersectionSelect}
              onCarSelect={handleCarSelect}
              selectedCarId={selectedCarId}
              viewMode={viewMode}
              setViewMode={setViewMode}
              cvModeActive={cvModeActive}
              setCvModeActive={setCvModeActive}
              recentlyUpdatedJunctions={recentlyUpdatedJunctions}
              incidents={incidents}
              onIncidentSelect={handleIncidentSelect}
              setIncidents={setIncidents}
              selectedIncidentId={selectedIncidentId}
              closedRoads={new Set(incidents.filter(i => i.blocksSegmentId).map(i => i.blocksSegmentId!))}
              roads={roads}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchResults={searchResults}
              onSearchResultSelect={handleSearchResultSelect}
              isAiSearching={isAiSearching}
              handleAiSearch={handleAiSearch}
              highlightedVehicleIds={highlightedVehicleIds}
              highlightedIncidentIds={highlightedIncidentIds}
              highlightedIntersectionId={highlightedIntersectionId}
            />
        </div>

        {/* RIGHT PANEL */}
        <div className="w-[350px] flex flex-col flex-shrink-0">
           <div className="flex-1 flex flex-col glass rounded-2xl p-1.5 min-h-0">
              <div className="flex-1 bg-background/50 rounded-xl border border-white/5 min-h-0 overflow-hidden">
                  {activeTab === 'JUNCTION' && selectedIntersection && <IntersectionDetails intersection={selectedIntersection} setIntersections={setIntersections} queueMap={queueLengthMap} />}
                  {activeTab === 'UNIT' && selectedCar && <VehicleDetails car={selectedCar} intersections={intersections} roads={roads} />}
                  {activeTab === 'INCIDENT' && selectedIncident && <IncidentDetails incident={selectedIncident} isAnalyzing={isIncidentAnalyzing} analysis={geminiIncidentAnalysis} onAnalyze={handleAnalyzeIncident} roads={roads} />}
                  {(activeTab !== 'JUNCTION' && activeTab !== 'UNIT' && activeTab !== 'INCIDENT' || (!selectedCar && !selectedIncident && !selectedIntersection)) && 
                      <div className="p-6 text-center h-full flex flex-col items-center justify-center text-gray-600">
                          <MapPinIcon className="w-16 h-16 mb-4"/>
                          <h4 className="font-bold text-gray-400">Selection Details</h4>
                          <p className="text-xs">Click an item on the simulation map to view its details here.</p>
                      </div>
                  }
              </div>
           </div>
        </div>
        
        <ResponsibleAiModal 
          isOpen={responsibleAiModalOpen} 
          onClose={() => setResponsibleAiModalOpen(false)}
          analysis={geminiAnalysis}
          analysisInput={analysisInputRef.current}
          stats={stats}
        />
      </div>
    </>
  );
};