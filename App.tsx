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
import { Navbar } from './components/Navbar';
import { analyzeTraffic, analyzeIncident, getRealWorldIntel, interpretSearchQuery } from './services/geminiService';
import { Incident, Intersection, Car, LightState, TrafficStats, GeminiAnalysis, GeminiIncidentAnalysis, RealWorldIntel, Road, SearchResult, CongestedJunctionInfo, VehicleType, AiSearchAction } from './types';
import { GRID_SIZE, INITIAL_GREEN_DURATION, CITY_CONFIGS, CITY_COORDINATES, BLOCK_SIZE, ROAD_NAMES, MAX_SPEED } from './constants';
import { 
  ArrowLeftOnRectangleIcon, ChartPieIcon, AdjustmentsHorizontalIcon, TruckIcon, SparklesIcon, VideoCameraIcon, GlobeAltIcon,
  ClockIcon, BoltIcon, CloudIcon, SignalIcon, ExclamationTriangleIcon, CircleStackIcon, MapPinIcon, CodeBracketIcon
} from '@heroicons/react/24/outline';

type ViewState = 'LANDING' | 'DASHBOARD' | 'FEATURES' | 'PUBLIC_MAP' | 'PUBLIC_DATA' | 'API_DOCS' | 'AI_FEATURES' | 'REALTIME_AI' | 'JUNCTIONS_AI' | 'ML_DESIGN' | 'HLD';
type ActiveTab = 'OVERVIEW' | 'JUNCTION' | 'UNIT' | 'INTEL' | 'CCTV' | 'INCIDENT' | 'DATA_HUB';



export const App: React.FC = () => {
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

  const handleNavigate = (page: string) => {
    setViewState(page as ViewState);
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
      <Navbar 
        onNavigate={handleNavigate}
        showSearch={true}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleAiSearch}
        isSearching={isAiSearching}
      />
      <div className="w-screen h-screen font-sans flex p-3 gap-3 overflow-hidden text-gray-200 pt-16">
        {/* LEFT PANEL - PREMIUM GOVERNMENT DESIGN */}
        <div className="w-[320px] flex flex-col gap-4 flex-shrink-0">
            <header className="h-24 flex-shrink-0 flex items-center justify-between p-6 rounded-3xl bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-indigo-900/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-blue-500/20 relative overflow-hidden">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-r from-saffron/5 via-transparent to-green-500/5 animate-pulse"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-saffron via-white to-green-500"></div>
              
              <div className="flex items-center gap-4 cursor-pointer relative z-10" onClick={() => handleNavigate('LANDING')}>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-saffron via-orange-500 to-red-600 flex items-center justify-center shadow-2xl shadow-saffron/40 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <GlobeAltIcon className="w-7 h-7 text-white relative z-10 drop-shadow-lg" />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-xl font-display font-black tracking-wider leading-none text-white drop-shadow-lg">
                        BHARAT<span className="text-saffron animate-pulse">FLOW</span>
                      </span>
                      <span className="text-[11px] font-mono text-cyan-300 tracking-[0.2em] uppercase opacity-90">
                        🇮🇳 AI Command Center
                      </span>
                  </div>
              </div>
              <button onClick={() => handleNavigate('LANDING')} className="p-3 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-110 relative z-10">
                  <ArrowLeftOnRectangleIcon className="w-6 h-6 text-white/80 hover:text-white" />
              </button>
           </header>

           {/* PREMIUM STATS GRID */}
           <div className="grid grid-cols-2 gap-4">
               <div className="bg-gradient-to-br from-blue-900/40 via-indigo-900/30 to-purple-900/40 backdrop-blur-xl rounded-2xl p-4 border border-blue-400/20 shadow-xl hover:shadow-blue-500/20 transition-all duration-300 group relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 <div className="flex items-center justify-between relative z-10">
                   <div>
                     <p className="text-blue-300 text-xs font-mono uppercase tracking-wider mb-1">Active Units</p>
                     <p className="text-2xl font-black text-white">{stats.totalCars}</p>
                   </div>
                   <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                     <TruckIcon className="w-5 h-5 text-blue-400"/>
                   </div>
                 </div>
               </div>
               
               <div className="bg-gradient-to-br from-emerald-900/40 via-green-900/30 to-teal-900/40 backdrop-blur-xl rounded-2xl p-4 border border-emerald-400/20 shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 group relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 <div className="flex items-center justify-between relative z-10">
                   <div>
                     <p className="text-emerald-300 text-xs font-mono uppercase tracking-wider mb-1">Avg Speed</p>
                     <p className="text-2xl font-black text-white">{stats.avgSpeed.toFixed(1)}<span className="text-sm text-emerald-300 ml-1">km/h</span></p>
                   </div>
                   <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                     <BoltIcon className="w-5 h-5 text-emerald-400"/>
                   </div>
                 </div>
               </div>
               
               <div className={`bg-gradient-to-br backdrop-blur-xl rounded-2xl p-4 border shadow-xl transition-all duration-300 group relative overflow-hidden ${
                 stats.congestionLevel > 70 
                   ? 'from-red-900/40 via-rose-900/30 to-pink-900/40 border-red-400/20 hover:shadow-red-500/20' 
                   : stats.congestionLevel > 40 
                   ? 'from-amber-900/40 via-yellow-900/30 to-orange-900/40 border-amber-400/20 hover:shadow-amber-500/20'
                   : 'from-green-900/40 via-emerald-900/30 to-teal-900/40 border-green-400/20 hover:shadow-green-500/20'
               }`}>
                 <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                   stats.congestionLevel > 70 ? 'from-red-500/10' : stats.congestionLevel > 40 ? 'from-amber-500/10' : 'from-green-500/10'
                 } to-transparent`}></div>
                 <div className="flex items-center justify-between relative z-10">
                   <div>
                     <p className={`text-xs font-mono uppercase tracking-wider mb-1 ${
                       stats.congestionLevel > 70 ? 'text-red-300' : stats.congestionLevel > 40 ? 'text-amber-300' : 'text-green-300'
                     }`}>Congestion</p>
                     <p className="text-2xl font-black text-white">{stats.congestionLevel}%</p>
                   </div>
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                     stats.congestionLevel > 70 ? 'bg-red-500/20' : stats.congestionLevel > 40 ? 'bg-amber-500/20' : 'bg-green-500/20'
                   }`}>
                     <SignalIcon className={`w-5 h-5 ${
                       stats.congestionLevel > 70 ? 'text-red-400' : stats.congestionLevel > 40 ? 'text-amber-400' : 'text-green-400'
                     }`}/>
                   </div>
                 </div>
               </div>
               
               <div className="bg-gradient-to-br from-orange-900/40 via-red-900/30 to-rose-900/40 backdrop-blur-xl rounded-2xl p-4 border border-orange-400/20 shadow-xl hover:shadow-orange-500/20 transition-all duration-300 group relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 <div className="flex items-center justify-between relative z-10">
                   <div>
                     <p className="text-orange-300 text-xs font-mono uppercase tracking-wider mb-1">Incidents</p>
                     <p className="text-2xl font-black text-white">{stats.incidents}</p>
                   </div>
                   <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                     <ExclamationTriangleIcon className="w-5 h-5 text-orange-400"/>
                   </div>
                 </div>
               </div>
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