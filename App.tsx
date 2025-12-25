import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';

// Lazy load components for better performance
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
const RealTimeTrafficPage = lazy(() => import('./components/RealTimeTrafficPage').then(module => ({ default: module.RealTimeTrafficPage })));
const TrafficDashboard = lazy(() => import('./components/TrafficDashboard').then(module => ({ default: module.TrafficDashboard })));

// Core components
import { SimulationSection } from './components/SimulationSection';
import { SimulationDesignerDemo } from './components/SimulationDesignerDemo';
import { CameraFeed } from './components/CameraFeed';
import { VehicleDetails } from './components/VehicleDetails';
import { IntersectionDetails, IntelFeed, IncidentDetails, OverviewPanel } from './components/SidePanels';
import { ResponsibleAiModal } from './components/ResponsibleAiModal';
import { DataHub } from './components/DataHub';
import { Navbar } from './components/Navbar';
import { analyzeTraffic, analyzeIncident, getRealWorldIntel, interpretSearchQuery } from './services/geminiService';
import { Incident, Intersection, Car, LightState, TrafficStats, GeminiAnalysis, GeminiIncidentAnalysis, RealWorldIntel, Road, SearchResult, CongestedJunctionInfo } from './types';
import { GRID_SIZE, INITIAL_GREEN_DURATION, CITY_CONFIGS, CITY_COORDINATES, BLOCK_SIZE, ROAD_NAMES } from './constants';
import { 
  ArrowLeftOnRectangleIcon, ChartPieIcon, AdjustmentsHorizontalIcon, TruckIcon, SparklesIcon, VideoCameraIcon, GlobeAltIcon,
  ClockIcon, BoltIcon, SignalIcon, ExclamationTriangleIcon, CircleStackIcon, MapPinIcon,
  BuildingOffice2Icon, ArrowsRightLeftIcon, CpuChipIcon, Cog6ToothIcon, FireIcon, SunIcon, CloudArrowDownIcon
} from '@heroicons/react/24/outline';

type ViewState = 'LANDING' | 'DASHBOARD' | 'FEATURES' | 'PUBLIC_MAP' | 'PUBLIC_DATA' | 'API_DOCS' | 'AI_FEATURES' | 'REALTIME_AI' | 'JUNCTIONS_AI' | 'ML_DESIGN' | 'HLD' | 'REAL_TRAFFIC' | 'TRAFFIC_DASHBOARD' | 'SIMULATION_DESIGNER';
type ActiveTab = 'OVERVIEW' | 'JUNCTION' | 'UNIT' | 'INTEL' | 'CCTV' | 'INCIDENT' | 'DATA_HUB';

// 🌟 AWESOME DYNAMIC CITIES CONFIGURATION
const DYNAMIC_CITIES = {
  'Bangalore': {
    name: 'Bangalore',
    displayName: 'Bengaluru',
    state: 'Karnataka',
    population: '12.3M',
    coordinates: { lat: 12.9716, lng: 77.5946 },
    characteristics: {
      trafficDensity: 'High',
      avgSpeed: 35,
      congestionMultiplier: 1.2,
      aiOptimization: 85
    },
    theme: {
      primary: '#22c55e',
      gradient: 'from-green-500 to-emerald-600'
    },
    icon: CpuChipIcon,
    description: 'India\'s Silicon Valley - Tech hub with smart traffic systems',
    status: 'online'
  },
  'Mumbai': {
    name: 'Mumbai',
    displayName: 'Mumbai',
    state: 'Maharashtra', 
    population: '20.4M',
    coordinates: { lat: 19.0760, lng: 72.8777 },
    characteristics: {
      trafficDensity: 'Extreme',
      avgSpeed: 30,
      congestionMultiplier: 1.4,
      aiOptimization: 78
    },
    theme: {
      primary: '#f59e0b',
      gradient: 'from-amber-500 to-orange-600'
    },
    icon: BuildingOffice2Icon,
    description: 'Financial Capital - World\'s busiest suburban railway network',
    status: 'online'
  },
  'Delhi': {
    name: 'Delhi',
    displayName: 'New Delhi',
    state: 'Delhi',
    population: '32.9M',
    coordinates: { lat: 28.6139, lng: 77.2090 },
    characteristics: {
      trafficDensity: 'Very High',
      avgSpeed: 40,
      congestionMultiplier: 1.3,
      aiOptimization: 82
    },
    theme: {
      primary: '#ef4444',
      gradient: 'from-red-500 to-rose-600'
    },
    icon: FireIcon,
    description: 'National Capital - Complex government and commercial traffic',
    status: 'online'
  },
  'Chennai': {
    name: 'Chennai',
    displayName: 'Chennai',
    state: 'Tamil Nadu',
    population: '10.9M',
    coordinates: { lat: 13.0827, lng: 80.2707 },
    characteristics: {
      trafficDensity: 'High',
      avgSpeed: 38,
      congestionMultiplier: 1.1,
      aiOptimization: 80
    },
    theme: {
      primary: '#3b82f6',
      gradient: 'from-blue-500 to-indigo-600'
    },
    icon: CloudArrowDownIcon,
    description: 'Detroit of India - Major automotive and port traffic hub',
    status: 'online'
  },
  'Hyderabad': {
    name: 'Hyderabad',
    displayName: 'Hyderabad',
    state: 'Telangana',
    population: '10.0M',
    coordinates: { lat: 17.3850, lng: 78.4867 },
    characteristics: {
      trafficDensity: 'Moderate',
      avgSpeed: 42,
      congestionMultiplier: 1.0,
      aiOptimization: 88
    },
    theme: {
      primary: '#8b5cf6',
      gradient: 'from-violet-500 to-purple-600'
    },
    icon: Cog6ToothIcon,
    description: 'Cyberabad - Planned IT infrastructure with metro expansion',
    status: 'online'
  },
  'Kolkata': {
    name: 'Kolkata',
    displayName: 'Kolkata',
    state: 'West Bengal',
    population: '14.9M',
    coordinates: { lat: 22.5726, lng: 88.3639 },
    characteristics: {
      trafficDensity: 'High',
      avgSpeed: 32,
      congestionMultiplier: 1.15,
      aiOptimization: 75
    },
    theme: {
      primary: '#06b6d4',
      gradient: 'from-cyan-500 to-teal-600'
    },
    icon: ArrowsRightLeftIcon,
    description: 'Cultural Capital - Heritage trams and narrow road networks',
    status: 'online'
  },
  'Pune': {
    name: 'Pune',
    displayName: 'Pune',
    state: 'Maharashtra',
    population: '7.4M',
    coordinates: { lat: 18.5204, lng: 73.8567 },
    characteristics: {
      trafficDensity: 'Moderate',
      avgSpeed: 36,
      congestionMultiplier: 1.05,
      aiOptimization: 83
    },
    theme: {
      primary: '#f97316',
      gradient: 'from-orange-500 to-red-500'
    },
    icon: SunIcon,
    description: 'Oxford of the East - Student and IT professional traffic',
    status: 'online'
  }
};
export const App: React.FC = () => {
  // Core state
  const [viewState, setViewState] = useState<ViewState>('LANDING');
  const [currentCity, setCurrentCity] = useState("Bangalore");
  const [intersections, setIntersections] = useState<Intersection[]>([]);
  const [roads, setRoads] = useState<Road[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<TrafficStats>({ totalCars: 0, avgSpeed: 0, congestionLevel: 0, carbonEmission: 0, incidents: 0 });
  
  // UI state
  const [isRunning, setIsRunning] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('OVERVIEW');
  const [selectedIntersectionId, setSelectedIntersectionId] = useState<string | null>(null);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'GRID' | 'SATELLITE'>('GRID');
  const [cvModeActive, setCvModeActive] = useState(false);
  
  // AI state
  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiAnalysis | null>(null);
  const [geminiIncidentAnalysis, setGeminiIncidentAnalysis] = useState<GeminiIncidentAnalysis | null>(null);
  const [realWorldIntel, setRealWorldIntel] = useState<RealWorldIntel | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isIntelLoading, setIsIntelLoading] = useState(false);
  const [isIncidentAnalyzing, setIsIncidentAnalyzing] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  
  // Dynamic state
  const [cityTransition, setCityTransition] = useState(false);
  const [realTimeData, setRealTimeData] = useState<Record<string, any>>({});
  const [responsibleAiModalOpen, setResponsibleAiModalOpen] = useState(false);
  const [recentlyUpdatedJunctions, setRecentlyUpdatedJunctions] = useState<Set<string>>(new Set());
  const [queueLengthMap, setQueueLengthMap] = useState<Record<string,number>>({});
  const [incidentCreatedMessage, setIncidentCreatedMessage] = useState<string | null>(null);
  const [highlightedVehicleIds, setHighlightedVehicleIds] = useState<Set<string> | null>(null);
  const [highlightedIncidentIds, setHighlightedIncidentIds] = useState<Set<string> | null>(null);
  const [highlightedIntersectionId, setHighlightedIntersectionId] = useState<string | null>(null);

  const analysisInputRef = useRef<CongestedJunctionInfo[] | null>(null);

  // Get current city configuration
  const currentCityConfig = DYNAMIC_CITIES[currentCity as keyof typeof DYNAMIC_CITIES];
  // 🚀 ENHANCED CITY GENERATION
  const generateIntersections = useCallback((city: string) => {
    const names = CITY_CONFIGS[city] || [];
    const cityConfig = DYNAMIC_CITIES[city as keyof typeof DYNAMIC_CITIES];
    const arr: Intersection[] = [];
    let nameIdx = 0;
    
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const baseName = names[nameIdx++] || `${cityConfig?.displayName || city} Junction ${x}-${y}`;
        arr.push({
          id: `INT-${x}-${y}`,
          label: baseName,
          x,
          y,
          lightState: { ns: LightState.GREEN, ew: LightState.RED },
          timer: INITIAL_GREEN_DURATION,
          greenDuration: INITIAL_GREEN_DURATION
        });
      }
    }
    return arr;
  }, []);
  
  const generateRoads = useCallback((city: string): Road[] => {
    const roadNames = ROAD_NAMES[city] || ROAD_NAMES["Bangalore"];
    const cityConfig = DYNAMIC_CITIES[city as keyof typeof DYNAMIC_CITIES];
    const generatedRoads: Road[] = [];
    
    let roadIndex = 0;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (x < GRID_SIZE - 1) {
          const id1 = `INT-${x}-${y}`;
          const id2 = `INT-${x + 1}-${y}`;
          generatedRoads.push({ 
            id: `${id1}_${id2}`,
            name: roadNames.horizontal[roadIndex % roadNames.horizontal.length] || `${cityConfig?.displayName || city} Road ${roadIndex}`, 
            intersection1Id: id1, 
            intersection2Id: id2 
          });
          roadIndex++;
        }
        if (y < GRID_SIZE - 1) {
          const id1 = `INT-${x}-${y}`;
          const id2 = `INT-${x}-${y + 1}`;
          generatedRoads.push({ 
            id: `${id1}_${id2}`,
            name: roadNames.vertical[roadIndex % roadNames.vertical.length] || `${cityConfig?.displayName || city} Avenue ${roadIndex}`, 
            intersection1Id: id1, 
            intersection2Id: id2 
          });
          roadIndex++;
        }
      }
    }
    return generatedRoads;
  }, []);

  // 🌟 AWESOME CITY SWITCHING WITH REAL-TIME DATA
  const handleCityChange = useCallback(async (newCity: string) => {
    if (newCity === currentCity || cityTransition) return;
    
    setCityTransition(true);
    
    // Fetch real-time data for the new city
    try {
      const response = await fetch(`/api/traffic/realtime/${newCity}`);
      if (response.ok) {
        const data = await response.json();
        setRealTimeData(prev => ({ ...prev, [newCity]: data }));
      }
    } catch (error) {
      console.error('Failed to fetch real-time data:', error);
    }
    
    // Smooth transition
    setTimeout(() => {
      setCurrentCity(newCity);
      setCityTransition(false);
    }, 500);
  }, [currentCity, cityTransition]);
  // Initialize city data
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

  // Fetch real-time data for all cities on startup
  useEffect(() => {
    const fetchAllCitiesData = async () => {
      const cities = Object.keys(DYNAMIC_CITIES);
      for (const city of cities) {
        try {
          const response = await fetch(`/api/traffic/realtime/${city}`);
          if (response.ok) {
            const data = await response.json();
            setRealTimeData(prev => ({ ...prev, [city]: data }));
          }
        } catch (error) {
          console.error(`Failed to fetch data for ${city}:`, error);
        }
      }
    };
    
    fetchAllCitiesData();
    const interval = setInterval(fetchAllCitiesData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

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
      const action = actions[0];
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

  // 🌟 AWESOME DYNAMIC CITY SELECTOR
  const CitySelector: React.FC = () => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <GlobeAltIcon className="w-4 h-4 text-cyan-400" />
          Smart Cities Network
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-green-400 font-mono">LIVE</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
        {Object.entries(DYNAMIC_CITIES).map(([cityKey, city]) => {
          const Icon = city.icon;
          const isActive = currentCity === cityKey;
          const isTransitioning = cityTransition && currentCity === cityKey;
          const cityData = realTimeData[cityKey];
          
          return (
            <button
              key={cityKey}
              onClick={() => handleCityChange(cityKey)}
              disabled={cityTransition}
              className={`relative p-4 rounded-xl border transition-all duration-500 text-left group overflow-hidden ${
                isActive 
                  ? 'border-cyan-400/50 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 shadow-cyan-500/20' 
                  : 'border-white/10 hover:border-white/20 bg-surface/30 hover:bg-surface/50'
              } ${isTransitioning ? 'animate-pulse' : ''}`}
            >
              <div className="flex items-center gap-3 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? `bg-gradient-to-br ${city.theme.gradient} shadow-lg` 
                    : 'bg-gray-700 group-hover:bg-gray-600'
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-bold text-sm ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                      {city.displayName}
                    </span>
                    {isActive && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs text-green-400 font-mono">ACTIVE</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {city.state} • {city.population} • AI: {city.characteristics.aiOptimization}%
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                      city.characteristics.trafficDensity === 'Extreme' ? 'bg-red-500/20 text-red-400' :
                      city.characteristics.trafficDensity === 'Very High' ? 'bg-orange-500/20 text-orange-400' :
                      city.characteristics.trafficDensity === 'High' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {city.characteristics.trafficDensity}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">{city.characteristics.avgSpeed} km/h avg</span>
                  </div>
                </div>
                
                {cityData && (
                  <div className="text-right">
                    <div className={`text-sm font-bold mb-1 ${
                      cityData.congestionLevel > 70 ? 'text-red-400' :
                      cityData.congestionLevel > 40 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {cityData.congestionLevel}%
                    </div>
                    <div className="text-xs text-gray-400">
                      {cityData.currentSpeed} km/h
                    </div>
                    <div className="text-xs text-gray-500">
                      {cityData.incidents?.length || 0} incidents
                    </div>
                  </div>
                )}
              </div>
              
              <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                city.status === 'online' ? 'bg-green-400' : 'bg-red-400'
              } ${isActive ? 'animate-pulse' : ''}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
  // Loading component
  const LoadingScreen = () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-6"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-saffron rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Loading BharatFlow AI</h2>
        <p className="text-gray-400">Initializing traffic intelligence systems...</p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-saffron rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );

  const publicPageProps = { onNavigate: handleNavigate as (page: string) => void };
  switch (viewState) {
    case 'LANDING': return (
      <Suspense fallback={<LoadingScreen />}>
        <LandingPage {...publicPageProps} />
      </Suspense>
    );
    case 'FEATURES': return <Suspense fallback={<LoadingScreen />}><FeaturesPage {...publicPageProps} /></Suspense>;
    case 'PUBLIC_MAP': return <Suspense fallback={<LoadingScreen />}><LiveMapPage {...publicPageProps} /></Suspense>;
    case 'PUBLIC_DATA': return <Suspense fallback={<LoadingScreen />}><PublicDataPage {...publicPageProps} /></Suspense>;
    case 'API_DOCS': return <Suspense fallback={<LoadingScreen />}><ApiDocsPage {...publicPageProps} /></Suspense>;
    case 'AI_FEATURES': return <Suspense fallback={<LoadingScreen />}><AiFeaturesPage {...publicPageProps} /></Suspense>;
    case 'REALTIME_AI': return <Suspense fallback={<LoadingScreen />}><RealtimeAiPage {...publicPageProps} /></Suspense>;
    case 'JUNCTIONS_AI': return <Suspense fallback={<LoadingScreen />}><JunctionsAiPage {...publicPageProps} /></Suspense>;
    case 'ML_DESIGN': return <Suspense fallback={<LoadingScreen />}><MlDesignPage {...publicPageProps} /></Suspense>;
    case 'HLD': return <Suspense fallback={<LoadingScreen />}><HldPage {...publicPageProps} /></Suspense>;
    case 'REAL_TRAFFIC': return <Suspense fallback={<LoadingScreen />}><RealTimeTrafficPage {...publicPageProps} /></Suspense>;
    case 'TRAFFIC_DASHBOARD': return <Suspense fallback={<LoadingScreen />}><TrafficDashboard {...publicPageProps} /></Suspense>;
    case 'SIMULATION_DESIGNER': return <SimulationDesignerDemo />;
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
        {/* 🌟 LEFT PANEL - AWESOME REDESIGN */}
        <div className="w-[340px] flex flex-col gap-4 flex-shrink-0">
            {/* Dynamic Header with City Theme */}
            <header className={`h-28 flex-shrink-0 flex items-center justify-between p-6 rounded-3xl backdrop-blur-xl border shadow-2xl relative overflow-hidden transition-all duration-500 ${
              cityTransition ? 'animate-pulse' : ''
            }`} style={{
              background: `linear-gradient(135deg, ${currentCityConfig?.theme.primary}15, rgba(15, 23, 42, 0.95))`,
              borderColor: currentCityConfig?.theme.primary + '30',
              boxShadow: `0 0 30px ${currentCityConfig?.theme.primary}20`
            }}>
              <div className="absolute inset-0 bg-gradient-to-r from-saffron/5 via-transparent to-green-500/5 animate-pulse"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-saffron via-white to-green-500"></div>
              
              <div className="flex items-center gap-4 cursor-pointer relative z-10" onClick={() => handleNavigate('LANDING')}>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentCityConfig?.theme.gradient || 'from-saffron via-orange-500 to-red-600'} flex items-center justify-center shadow-2xl relative overflow-hidden group`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <GlobeAltIcon className="w-8 h-8 text-white relative z-10 drop-shadow-lg" />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-xl font-display font-black tracking-wider leading-none text-white drop-shadow-lg">
                        BHARAT<span className="text-saffron animate-pulse">FLOW</span>
                      </span>
                      <span className="text-xs font-mono text-cyan-300 tracking-[0.2em] uppercase opacity-90">
                        🇮🇳 {currentCityConfig?.displayName || currentCity} Command
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400 font-mono">AI ACTIVE</span>
                      </div>
                  </div>
              </div>
              <button onClick={() => handleNavigate('LANDING')} className="p-3 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-110 relative z-10">
                  <ArrowLeftOnRectangleIcon className="w-6 h-6 text-white/80 hover:text-white" />
              </button>
           </header>

           {/* Dynamic City Selector */}
           <div className="glass rounded-2xl p-4 border border-white/10">
             <CitySelector />
           </div>
           {/* Enhanced Stats Grid */}
           <div className="grid grid-cols-2 gap-4">
               <div className="bg-gradient-to-br from-blue-900/40 via-indigo-900/30 to-purple-900/40 backdrop-blur-xl rounded-2xl p-4 border border-blue-400/20 shadow-xl hover:shadow-blue-500/20 transition-all duration-300 group relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 <div className="flex items-center justify-between relative z-10">
                   <div>
                     <p className="text-blue-300 text-xs font-mono uppercase tracking-wider mb-1">Active Units</p>
                     <p className="text-2xl font-black text-white">{stats.totalCars}</p>
                     <p className="text-xs text-blue-400 mt-1">+{Math.floor(Math.random() * 5)} this hour</p>
                   </div>
                   <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                     <TruckIcon className="w-6 h-6 text-blue-400"/>
                   </div>
                 </div>
               </div>
               
               <div className="bg-gradient-to-br from-emerald-900/40 via-green-900/30 to-teal-900/40 backdrop-blur-xl rounded-2xl p-4 border border-emerald-400/20 shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 group relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 <div className="flex items-center justify-between relative z-10">
                   <div>
                     <p className="text-emerald-300 text-xs font-mono uppercase tracking-wider mb-1">Avg Speed</p>
                     <p className="text-2xl font-black text-white">{stats.avgSpeed.toFixed(1)}<span className="text-sm text-emerald-300 ml-1">km/h</span></p>
                     <p className="text-xs text-emerald-400 mt-1">Target: {currentCityConfig?.characteristics.avgSpeed || 35} km/h</p>
                   </div>
                   <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                     <BoltIcon className="w-6 h-6 text-emerald-400"/>
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
                     <p className={`text-xs mt-1 ${
                       stats.congestionLevel > 70 ? 'text-red-400' : stats.congestionLevel > 40 ? 'text-amber-400' : 'text-green-400'
                     }`}>
                       {stats.congestionLevel > 70 ? 'Critical' : stats.congestionLevel > 40 ? 'Moderate' : 'Optimal'}
                     </p>
                   </div>
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                     stats.congestionLevel > 70 ? 'bg-red-500/20' : stats.congestionLevel > 40 ? 'bg-amber-500/20' : 'bg-green-500/20'
                   }`}>
                     <SignalIcon className={`w-6 h-6 ${
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
                     <p className="text-xs text-orange-400 mt-1">
                       {stats.incidents === 0 ? 'All Clear' : `${Math.floor(stats.incidents / 2)} resolved`}
                     </p>
                   </div>
                   <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                     <ExclamationTriangleIcon className="w-6 h-6 text-orange-400"/>
                   </div>
                 </div>
               </div>
           </div>

           {/* Enhanced Tabbed Panel */}
           <div className="flex-1 flex flex-col glass rounded-2xl p-1.5 min-h-0 border border-white/10">
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
           <div className="flex-1 flex flex-col glass rounded-2xl p-1.5 min-h-0 border border-white/10">
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