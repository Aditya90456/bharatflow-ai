import React, { useState, useEffect } from 'react';
import { LiveTrafficMap } from './LiveTrafficMap';
import { RealTimeTraffic } from './RealTimeTraffic';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { StatusBadge } from './ui/StatusBadge';
import { AnimatedCounter } from './ui/AnimatedCounter';
import { 
  MapIcon, 
  ChartBarIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface TrafficDashboardProps {
  onNavigate: (page: string) => void;
}

interface PredictionData {
  timestamp: number;
  currentSpeed: number;
  congestionLevel: number;
  confidence: number;
  predictionMinutes: number;
  isPrediction: true;
}

interface HistoricalPattern {
  timestamp: number;
  hour: number;
  congestionLevel: number;
  avgSpeed: number;
  incidents: number;
  isRushHour: boolean;
  isWeekend: boolean;
}

export const TrafficDashboard: React.FC<TrafficDashboardProps> = ({ onNavigate }) => {
  const [selectedCity, setSelectedCity] = useState('Bangalore');
  const [currentTrafficData, setCurrentTrafficData] = useState<any>(null);
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalPattern[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'stats' | 'both'>('both');
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);

  const cities = [
    'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune'
  ];

  // Fetch traffic prediction
  const fetchPrediction = async (minutes = 30) => {
    setIsLoadingPrediction(true);
    try {
      const response = await fetch(`/api/traffic/predict/${selectedCity}?minutes=${minutes}`);
      if (response.ok) {
        const data = await response.json();
        setPredictionData(data);
      }
    } catch (error) {
      console.error('Failed to fetch prediction:', error);
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  // Fetch historical patterns
  const fetchHistoricalData = async (hours = 24) => {
    setIsLoadingHistorical(true);
    try {
      const response = await fetch(`/api/traffic/historical/${selectedCity}?hours=${hours}`);
      if (response.ok) {
        const data = await response.json();
        setHistoricalData(data.patterns || []);
      }
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
    } finally {
      setIsLoadingHistorical(false);
    }
  };

  // Handle traffic data updates
  const handleTrafficUpdate = (data: any) => {
    setCurrentTrafficData(data);
  };

  // Calculate trend
  const calculateTrend = () => {
    if (!currentTrafficData || !predictionData) return null;
    
    const currentCongestion = currentTrafficData.congestionLevel;
    const predictedCongestion = predictionData.congestionLevel;
    const change = predictedCongestion - currentCongestion;
    
    return {
      change,
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      percentage: Math.abs(change)
    };
  };

  // Get peak hours from historical data
  const getPeakHours = () => {
    if (historicalData.length === 0) return [];
    
    const hourlyAvg = historicalData.reduce((acc, pattern) => {
      if (!acc[pattern.hour]) {
        acc[pattern.hour] = { total: 0, count: 0 };
      }
      acc[pattern.hour].total += pattern.congestionLevel;
      acc[pattern.hour].count += 1;
      return acc;
    }, {} as Record<number, { total: number; count: number }>);
    
    return Object.entries(hourlyAvg)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        avgCongestion: data.total / data.count
      }))
      .filter(item => item.avgCongestion > 60)
      .sort((a, b) => b.avgCongestion - a.avgCongestion)
      .slice(0, 3);
  };

  useEffect(() => {
    fetchPrediction();
    fetchHistoricalData();
  }, [selectedCity]);

  const trend = calculateTrend();
  const peakHours = getPeakHours();

  return (
    <div className="min-h-screen bg-background text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-saffron via-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-saffron/30">
              <MapIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-tech text-white">
                Traffic Intelligence Dashboard
              </h1>
              <p className="text-gray-400">Real-time traffic monitoring with AI predictions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => onNavigate('REAL_TIME_TRAFFIC')}
              className="text-cyan-400 hover:text-cyan-300"
            >
              <ChartBarIcon className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button
              variant="ghost"
              onClick={() => onNavigate('LANDING')}
              className="text-gray-400 hover:text-white"
            >
              ← Back
            </Button>
          </div>
        </div>

        {/* City Selector & View Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-400">City:</span>
            <div className="flex flex-wrap gap-2">
              {cities.map((city) => (
                <Button
                  key={city}
                  variant={selectedCity === city ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCity(city)}
                  className={selectedCity === city ? '' : 'text-gray-400 hover:text-white'}
                >
                  {city}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">View:</span>
            <Button
              variant={viewMode === 'map' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('map')}
            >
              <MapIcon className="w-4 h-4 mr-1" />
              Map
            </Button>
            <Button
              variant={viewMode === 'stats' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('stats')}
            >
              <ChartBarIcon className="w-4 h-4 mr-1" />
              Stats
            </Button>
            <Button
              variant={viewMode === 'both' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('both')}
            >
              <EyeIcon className="w-4 h-4 mr-1" />
              Both
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current Status */}
          <Card variant="cyber" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <MapIcon className="w-5 h-5 text-cyan-400" />
              <StatusBadge 
                status={currentTrafficData?.congestionLevel > 70 ? 'offline' : 
                       currentTrafficData?.congestionLevel > 40 ? 'warning' : 'online'}
              />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {currentTrafficData ? (
                <AnimatedCounter value={currentTrafficData.congestionLevel} suffix="%" />
              ) : (
                '--'
              )}
            </div>
            <p className="text-xs text-gray-400">Current Congestion</p>
            {currentTrafficData?.source && (
              <p className="text-xs text-cyan-400 mt-1 font-mono">
                {currentTrafficData.source.toUpperCase()}
              </p>
            )}
          </Card>

          {/* Prediction */}
          <Card variant="cyber" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <ClockIcon className="w-5 h-5 text-purple-400" />
              {trend && (
                <div className="flex items-center gap-1">
                  {trend.direction === 'up' ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 text-red-400" />
                  ) : trend.direction === 'down' ? (
                    <ArrowTrendingDownIcon className="w-4 h-4 text-green-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-yellow-400" />
                  )}
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {predictionData ? (
                <AnimatedCounter value={predictionData.congestionLevel} suffix="%" />
              ) : isLoadingPrediction ? (
                <span className="animate-pulse">--</span>
              ) : (
                '--'
              )}
            </div>
            <p className="text-xs text-gray-400">30min Prediction</p>
            {trend && (
              <p className={`text-xs mt-1 ${
                trend.direction === 'up' ? 'text-red-400' : 
                trend.direction === 'down' ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {trend.direction === 'stable' ? 'Stable' : 
                 `${trend.direction === 'up' ? '+' : ''}${trend.change.toFixed(1)}%`}
              </p>
            )}
          </Card>

          {/* Speed */}
          <Card variant="cyber" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <ChartBarIcon className="w-5 h-5 text-green-400" />
              <StatusBadge 
                status={currentTrafficData?.currentSpeed > 30 ? 'online' : 
                       currentTrafficData?.currentSpeed > 15 ? 'warning' : 'offline'}
              />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {currentTrafficData ? (
                <AnimatedCounter value={currentTrafficData.currentSpeed} suffix=" km/h" />
              ) : (
                '--'
              )}
            </div>
            <p className="text-xs text-gray-400">Average Speed</p>
            {currentTrafficData?.freeFlowSpeed && (
              <p className="text-xs text-gray-500 mt-1">
                Free Flow: {currentTrafficData.freeFlowSpeed} km/h
              </p>
            )}
          </Card>

          {/* Incidents */}
          <Card variant="cyber" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
              <StatusBadge 
                status={currentTrafficData?.incidents?.length === 0 ? 'online' : 
                       currentTrafficData?.incidents?.length <= 2 ? 'warning' : 'offline'}
              />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {currentTrafficData ? (
                <AnimatedCounter value={currentTrafficData.incidents?.length || 0} />
              ) : (
                '--'
              )}
            </div>
            <p className="text-xs text-gray-400">Active Incidents</p>
            {currentTrafficData?.incidents && currentTrafficData.incidents.length > 0 && (
              <p className="text-xs text-red-300 mt-1">
                {currentTrafficData.incidents.filter((i: any) => i.severity === 'HIGH').length} High Priority
              </p>
            )}
          </Card>
        </div>

        {/* Main Content */}
        <div className={`grid gap-8 ${viewMode === 'both' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Live Map */}
          {(viewMode === 'map' || viewMode === 'both') && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-cyan-400" />
                Live Traffic Map
              </h2>
              <LiveTrafficMap
                city={selectedCity}
                onTrafficUpdate={handleTrafficUpdate}
                autoRefresh={true}
                refreshInterval={30000}
                showIncidents={true}
                showPredictions={false}
              />
            </div>
          )}

          {/* Traffic Stats */}
          {(viewMode === 'stats' || viewMode === 'both') && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-purple-400" />
                Traffic Analytics
              </h2>
              <RealTimeTraffic
                city={selectedCity}
                onTrafficUpdate={handleTrafficUpdate}
                autoRefresh={true}
                refreshInterval={30000}
              />
            </div>
          )}
        </div>

        {/* Historical Insights */}
        <Card variant="cyber" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-orange-400" />
              Traffic Insights
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchHistoricalData(24)}
                disabled={isLoadingHistorical}
                className="text-orange-400 hover:text-orange-300"
              >
                24h
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchHistoricalData(168)}
                disabled={isLoadingHistorical}
                className="text-orange-400 hover:text-orange-300"
              >
                7d
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Peak Hours */}
            <div>
              <h4 className="font-medium text-white mb-3">Peak Traffic Hours</h4>
              <div className="space-y-2">
                {peakHours.map((peak, index) => (
                  <div key={peak.hour} className="flex items-center justify-between p-2 rounded bg-surface/30">
                    <span className="text-sm text-gray-300">
                      {peak.hour.toString().padStart(2, '0')}:00 - {(peak.hour + 1).toString().padStart(2, '0')}:00
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-700 rounded-full h-1">
                        <div 
                          className="h-1 rounded-full bg-red-400"
                          style={{ width: `${(peak.avgCongestion / 100) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-red-400 w-8">
                        {Math.round(peak.avgCongestion)}%
                      </span>
                    </div>
                  </div>
                ))}
                {peakHours.length === 0 && (
                  <p className="text-sm text-gray-500">No peak hours data available</p>
                )}
              </div>
            </div>

            {/* Traffic Trends */}
            <div>
              <h4 className="font-medium text-white mb-3">Recent Trends</h4>
              <div className="space-y-3">
                {trend && (
                  <div className="p-3 rounded bg-surface/30">
                    <div className="flex items-center gap-2 mb-1">
                      {trend.direction === 'up' ? (
                        <ArrowTrendingUpIcon className="w-4 h-4 text-red-400" />
                      ) : trend.direction === 'down' ? (
                        <ArrowTrendingDownIcon className="w-4 h-4 text-green-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-yellow-400" />
                      )}
                      <span className="text-sm font-medium text-white">
                        {trend.direction === 'up' ? 'Increasing' : 
                         trend.direction === 'down' ? 'Decreasing' : 'Stable'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Congestion expected to {trend.direction === 'up' ? 'increase' : 
                      trend.direction === 'down' ? 'decrease' : 'remain stable'} by{' '}
                      {trend.percentage.toFixed(1)}% in next 30 minutes
                    </p>
                  </div>
                )}
                
                {currentTrafficData?.weather && (
                  <div className="p-3 rounded bg-surface/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Cog6ToothIcon className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">Weather Impact</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Current conditions: {currentTrafficData.weather.replace('_', ' ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="font-medium text-white mb-3">Recommendations</h4>
              <div className="space-y-2">
                {currentTrafficData?.congestionLevel > 70 && (
                  <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-300">
                      High congestion detected. Consider alternative routes.
                    </p>
                  </div>
                )}
                
                {trend?.direction === 'up' && trend.percentage > 10 && (
                  <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20">
                    <p className="text-xs text-orange-300">
                      Traffic expected to worsen. Plan accordingly.
                    </p>
                  </div>
                )}
                
                {currentTrafficData?.incidents?.length > 0 && (
                  <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs text-yellow-300">
                      {currentTrafficData.incidents.length} active incident(s) affecting traffic.
                    </p>
                  </div>
                )}
                
                {currentTrafficData?.congestionLevel < 30 && (
                  <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-green-300">
                      Good time to travel. Traffic is flowing smoothly.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};