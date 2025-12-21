import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPinIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  SignalIcon,
  TruckIcon,
  ArrowPathIcon,
  WifiIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { StatusBadge } from './ui/StatusBadge';
import { AnimatedCounter } from './ui/AnimatedCounter';

interface RealTimeTrafficProps {
  city: string;
  onTrafficUpdate?: (data: any) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface TrafficData {
  source: string;
  timestamp: number;
  currentSpeed: number;
  freeFlowSpeed: number;
  congestionLevel: number;
  confidence: number;
  coordinates: { lat: number; lng: number };
  incidents: Array<{
    id: string;
    type: string;
    description: string;
    severity: string;
    location: { lat: number; lng: number };
    timestamp: number;
  }>;
  isRushHour?: boolean;
  isWeekend?: boolean;
}

export const RealTimeTraffic: React.FC<RealTimeTrafficProps> = ({
  city,
  onTrafficUpdate,
  autoRefresh = true,
  refreshInterval = 30000
}) => {
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Fetch real-time traffic data
  const fetchTrafficData = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/traffic/realtime/${city}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTrafficData(data);
      setLastUpdate(Date.now());
      
      // Notify parent component
      if (onTrafficUpdate) {
        onTrafficUpdate(data);
      }
    } catch (err) {
      console.error('Failed to fetch traffic data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch traffic data');
    } finally {
      setIsLoading(false);
    }
  }, [city, onTrafficUpdate, isLoading]);

  // Start streaming real-time data
  const startStreaming = useCallback(() => {
    if (isStreaming) return;
    
    setIsStreaming(true);
    setError(null);
    
    const eventSource = new EventSource(`/api/traffic/stream/${city}?interval=${refreshInterval}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          setError(data.error);
        } else {
          setTrafficData(data);
          setLastUpdate(Date.now());
          if (onTrafficUpdate) {
            onTrafficUpdate(data);
          }
        }
      } catch (err) {
        console.error('Error parsing stream data:', err);
      }
    };
    
    eventSource.onerror = (event) => {
      console.error('Stream error:', event);
      setError('Connection lost. Retrying...');
      setIsStreaming(false);
      eventSource.close();
      
      // Retry after 5 seconds
      setTimeout(() => {
        if (autoRefresh) {
          startStreaming();
        }
      }, 5000);
    };
    
    // Cleanup function
    return () => {
      eventSource.close();
      setIsStreaming(false);
    };
  }, [city, refreshInterval, onTrafficUpdate, autoRefresh, isStreaming]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
  }, []);

  // Initial data fetch and auto-refresh setup
  useEffect(() => {
    fetchTrafficData();
    
    if (autoRefresh && !isStreaming) {
      const interval = setInterval(fetchTrafficData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchTrafficData, autoRefresh, refreshInterval, isStreaming]);

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Get congestion color
  const getCongestionColor = (level: number) => {
    if (level >= 80) return 'text-red-400';
    if (level >= 60) return 'text-orange-400';
    if (level >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  // Get congestion status
  const getCongestionStatus = (level: number) => {
    if (level >= 80) return 'Heavy';
    if (level >= 60) return 'Moderate';
    if (level >= 40) return 'Light';
    return 'Free Flow';
  };

  // Get source badge color
  const getSourceColor = (source: string) => {
    switch (source) {
      case 'tomtom': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'mapbox': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'here': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'simulated': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPinIcon className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">Real-Time Traffic - {city}</h2>
          {trafficData && (
            <div className={`px-2 py-1 rounded-full text-xs font-mono border ${getSourceColor(trafficData.source)}`}>
              {trafficData.source.toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={stopStreaming}
              className="text-red-400 hover:text-red-300"
            >
              <NoSymbolIcon className="w-4 h-4 mr-1" />
              Stop Stream
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={startStreaming}
              className="text-green-400 hover:text-green-300"
            >
              <WifiIcon className="w-4 h-4 mr-1" />
              Start Stream
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchTrafficData}
            disabled={isLoading}
            className="text-cyan-400 hover:text-cyan-300"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card variant="cyber" className="border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-3 p-4">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-red-400 font-medium">Connection Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !trafficData && (
        <Card variant="cyber" className="animate-pulse">
          <div className="p-6 text-center">
            <ArrowPathIcon className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-400">Fetching real-time traffic data...</p>
          </div>
        </Card>
      )}

      {/* Traffic Data */}
      {trafficData && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current Speed */}
          <Card variant="cyber" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TruckIcon className="w-5 h-5 text-cyan-400" />
              <StatusBadge 
                status={trafficData.currentSpeed > 30 ? 'online' : trafficData.currentSpeed > 15 ? 'warning' : 'offline'}
              />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              <AnimatedCounter value={trafficData.currentSpeed} suffix=" km/h" />
            </div>
            <p className="text-xs text-gray-400">Current Speed</p>
            <p className="text-xs text-gray-500">Free Flow: {trafficData.freeFlowSpeed} km/h</p>
          </Card>

          {/* Congestion Level */}
          <Card variant="cyber" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <SignalIcon className="w-5 h-5 text-orange-400" />
              <div className={`text-xs font-mono ${getCongestionColor(trafficData.congestionLevel)}`}>
                {getCongestionStatus(trafficData.congestionLevel)}
              </div>
            </div>
            <div className={`text-2xl font-bold mb-1 ${getCongestionColor(trafficData.congestionLevel)}`}>
              <AnimatedCounter value={trafficData.congestionLevel} suffix="%" />
            </div>
            <p className="text-xs text-gray-400">Congestion Level</p>
            <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
              <div 
                className={`h-1 rounded-full transition-all duration-500 ${
                  trafficData.congestionLevel >= 80 ? 'bg-red-400' :
                  trafficData.congestionLevel >= 60 ? 'bg-orange-400' :
                  trafficData.congestionLevel >= 40 ? 'bg-yellow-400' : 'bg-green-400'
                }`}
                style={{ width: `${trafficData.congestionLevel}%` }}
              />
            </div>
          </Card>

          {/* Incidents */}
          <Card variant="cyber" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
              <StatusBadge 
                status={trafficData.incidents.length === 0 ? 'online' : trafficData.incidents.length <= 2 ? 'warning' : 'offline'}
              />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              <AnimatedCounter value={trafficData.incidents.length} />
            </div>
            <p className="text-xs text-gray-400">Active Incidents</p>
            {trafficData.incidents.length > 0 && (
              <p className="text-xs text-red-300 mt-1">
                {trafficData.incidents.filter(i => i.severity === 'HIGH').length} High Priority
              </p>
            )}
          </Card>

          {/* Data Quality */}
          <Card variant="cyber" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <ClockIcon className="w-5 h-5 text-green-400" />
              <div className="flex items-center gap-1">
                {isStreaming && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
                <span className="text-xs text-gray-400">
                  {isStreaming ? 'LIVE' : 'CACHED'}
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              <AnimatedCounter value={Math.round((trafficData.confidence || 0.7) * 100)} suffix="%" />
            </div>
            <p className="text-xs text-gray-400">Data Confidence</p>
            {lastUpdate && (
              <p className="text-xs text-gray-500 mt-1">
                Updated: {formatTimestamp(lastUpdate)}
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Incidents List */}
      {trafficData && trafficData.incidents.length > 0 && (
        <Card variant="cyber" className="p-4">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
            Active Incidents
          </h3>
          <div className="space-y-3">
            {trafficData.incidents.slice(0, 5).map((incident) => (
              <div key={incident.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface/50 border border-white/10">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  incident.severity === 'HIGH' ? 'bg-red-400' :
                  incident.severity === 'MEDIUM' ? 'bg-orange-400' : 'bg-yellow-400'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{incident.type}</span>
                    <StatusBadge 
                      status={incident.severity === 'HIGH' ? 'offline' : incident.severity === 'MEDIUM' ? 'warning' : 'idle'}
                    >
                      {incident.severity}
                    </StatusBadge>
                  </div>
                  <p className="text-sm text-gray-300">{incident.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimestamp(incident.timestamp)} • 
                    {incident.location.lat.toFixed(4)}, {incident.location.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            ))}
            {trafficData.incidents.length > 5 && (
              <p className="text-sm text-gray-400 text-center">
                +{trafficData.incidents.length - 5} more incidents
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Traffic Context */}
      {trafficData && (trafficData.isRushHour !== undefined || trafficData.isWeekend !== undefined) && (
        <Card variant="cyber" className="p-4">
          <div className="flex items-center gap-4 text-sm">
            {trafficData.isRushHour !== undefined && (
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-orange-400" />
                <span className={trafficData.isRushHour ? 'text-orange-400' : 'text-gray-400'}>
                  {trafficData.isRushHour ? 'Rush Hour' : 'Off-Peak'}
                </span>
              </div>
            )}
            {trafficData.isWeekend !== undefined && (
              <div className="flex items-center gap-2">
                <span className={trafficData.isWeekend ? 'text-blue-400' : 'text-gray-400'}>
                  {trafficData.isWeekend ? 'Weekend' : 'Weekday'}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Source:</span>
              <span className="text-cyan-400 font-mono text-xs">
                {trafficData.source.toUpperCase()}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};